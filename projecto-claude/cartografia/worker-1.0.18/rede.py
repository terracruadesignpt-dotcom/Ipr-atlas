"""IPR Atlas · worker: novas tentativas quando a DGT (ou o site) falha.

Regras (1.0.18, 20/10/2026):
- erro passageiro: HTTP 429, 5xx (incluindo 520 a 524 da Cloudflare), tempo esgotado, ligação recusada ou cortada;
  volta a tentar, com esperas crescentes e variação aleatória («full jitter»), até ao máximo de tentativas;
- erro definitivo: HTTP 400, 404, 410, 422 e os outros 4xx; não volta a tentar;
- cabeçalho Retry-After: é respeitado, até ao tecto da espera;
- cada tentativa fica no registo (folha, número da tentativa, motivo, espera).
Configuração (variáveis de ambiente ou config.json do worker, chave «dgt»):
  TCD_DGT_TENTATIVAS  número máximo de tentativas (6)
  TCD_DGT_BASE        primeira espera em segundos (15)
  TCD_DGT_TECTO       espera máxima em segundos (300)
Sem segredos: este módulo não vê cookies nem chaves.
"""
import os
import random
import socket
import time

PASSAGEIROS = {408, 425, 429, 500, 502, 503, 504, 507, 520, 521, 522, 523, 524, 525, 526, 527, 530}


class ErroPassageiro(IOError):
    """Falha que pode passar sozinha (servidor ocupado, rede)."""

    def __init__(self, msg, codigo=None, retry_after=None):
        super().__init__(msg)
        self.codigo = codigo
        self.retry_after = retry_after


class ErroDefinitivo(IOError):
    """Falha que não se resolve a tentar outra vez (pedido inválido, ficheiro inexistente)."""

    def __init__(self, msg, codigo=None):
        super().__init__(msg)
        self.codigo = codigo


class DGTIndisponivel(IOError):
    """A DGT não respondeu depois de todas as tentativas. A encomenda passa a «erro»."""


def config(cfg=None):
    c = dict((cfg or {}).get('dgt') or {})
    def num(chave, amb, omissao, tipo):
        v = os.environ.get(amb, c.get(chave, omissao))
        try:
            return max(tipo(1) if tipo is int else 0.0, tipo(v))
        except (TypeError, ValueError):
            return omissao
    return {
        'tentativas': num('tentativas', 'TCD_DGT_TENTATIVAS', 6, int),
        'base': num('base', 'TCD_DGT_BASE', 15.0, float),
        'tecto': num('tecto', 'TCD_DGT_TECTO', 300.0, float),
    }


def classificar_codigo(codigo):
    """'ok', 'passageiro' ou 'definitivo' para um código HTTP."""
    if codigo is None:
        return 'passageiro'
    if codigo < 400:
        return 'ok'
    if codigo in PASSAGEIROS or codigo >= 500:
        return 'passageiro'
    return 'definitivo'


def classificar_excepcao(e):
    """Rede e tempo esgotado são passageiros; o resto é tratado como definitivo."""
    if isinstance(e, (ErroPassageiro, ErroDefinitivo)):
        return 'passageiro' if isinstance(e, ErroPassageiro) else 'definitivo'
    try:
        import requests
        if isinstance(e, (requests.Timeout, requests.ConnectionError)):
            return 'passageiro'
        if isinstance(e, requests.HTTPError) and e.response is not None:
            return classificar_codigo(e.response.status_code)
        if isinstance(e, requests.exceptions.ChunkedEncodingError):
            return 'passageiro'
    except ImportError:
        pass
    if isinstance(e, (socket.timeout, TimeoutError, ConnectionError)):
        return 'passageiro'
    return 'definitivo'


def retry_after(valor):
    """Segundos do cabeçalho Retry-After (número ou data HTTP); None se não houver."""
    if not valor:
        return None
    try:
        return max(0.0, float(valor))
    except ValueError:
        pass
    try:
        from email.utils import parsedate_to_datetime
        import datetime
        d = parsedate_to_datetime(valor)
        return max(0.0, (d - datetime.datetime.now(d.tzinfo)).total_seconds())
    except Exception:
        return None


def espera(k, base, tecto, ra=None, aleatorio=random.random):
    """Espera antes da tentativa k+1 (k a partir de 0): full jitter entre metade e o total de base*2^k, com tecto.
    Com Retry-After, espera pelo menos isso (sempre dentro do tecto)."""
    alvo = min(tecto, base * (2 ** k))
    s = alvo / 2.0 + aleatorio() * alvo / 2.0
    if ra is not None:
        s = max(s, min(tecto, ra))
    return s


def tentar(fazer, nome, cfg=None, registo=print, dormir=time.sleep, ao_falhar=None):
    """Corre fazer(k) até resultar. fazer recebe o número da tentativa (0, 1, ...) e deve lançar ErroPassageiro,
    ErroDefinitivo ou uma excepção de rede. ao_falhar(k, e) é chamado antes de cada nova tentativa (por exemplo,
    para renovar a sessão). No fim das tentativas lança DGTIndisponivel com uma mensagem clara."""
    c = config(cfg)
    ult = None
    for k in range(c['tentativas']):
        try:
            return fazer(k)
        except Exception as e:
            tipo = classificar_excepcao(e)
            if tipo == 'definitivo':
                registo('  %s: erro definitivo na tentativa %d (%s); não volto a tentar.' % (nome, k + 1, e))
                raise
            ult = e
            if k + 1 >= c['tentativas']:
                registo('  %s: tentativa %d de %d falhou (%s). Sem mais tentativas.' % (nome, k + 1, c['tentativas'], e))
                break
            s = espera(k, c['base'], c['tecto'], getattr(e, 'retry_after', None))
            registo('  %s: tentativa %d de %d falhou (%s); nova tentativa em %.0f s.' % (nome, k + 1, c['tentativas'], e, s))
            if ao_falhar:
                ao_falhar(k, e)
            dormir(s)
    raise DGTIndisponivel(
        'O Centro de Dados da DGT não respondeu a %s depois de %d tentativas (último erro: %s). '
        'A DGT costuma voltar ao fim de algumas horas: volte a pôr a encomenda na fila mais tarde.' % (nome, c['tentativas'], ult))


def verificar_resposta(r, nome=''):
    """Converte uma resposta requests em ErroPassageiro/ErroDefinitivo conforme o código."""
    tipo = classificar_codigo(r.status_code)
    if tipo == 'ok':
        return r
    msg = 'HTTP %d%s' % (r.status_code, (' em ' + nome) if nome else '')
    if tipo == 'passageiro':
        raise ErroPassageiro(msg, r.status_code, retry_after(r.headers.get('Retry-After')))
    raise ErroDefinitivo(msg, r.status_code)
