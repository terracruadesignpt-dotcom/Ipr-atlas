"""Teste do worker 1.0.18: novas tentativas contra um servidor falso (503, 429 com Retry-After, tempo esgotado, 404, 200).
Corre sem GDAL (stub) e sem dormir de verdade (as esperas são registadas, não cumpridas)."""
import http.server, json, os, sys, tempfile, threading, time, types

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, sys.argv[1] if len(sys.argv) > 1 else os.path.join(AQUI, '..', 'worker-1.0.18'))

# stub mínimo do osgeo: uma folha é válida se começa por b'II*'
osgeo = types.ModuleType('osgeo')
class _DS:
    RasterCount = 1; RasterXSize = 10; RasterYSize = 10
    def GetRasterBand(self, i):
        return types.SimpleNamespace(Checksum=lambda *a: 0)
def _open(p):
    with open(p, 'rb') as f:
        return _DS() if f.read(3) == b'II*' else None
gdal = types.SimpleNamespace(UseExceptions=lambda: None, Open=_open)
class _SRS:
    def ImportFromEPSG(self, n): pass
    def SetAxisMappingStrategy(self, n): pass
osr = types.SimpleNamespace(SpatialReference=lambda *a, **k: _SRS(), OAMS_TRADITIONAL_GIS_ORDER=0)
ogr = types.SimpleNamespace(UseExceptions=lambda: None)
osgeo.gdal, osgeo.ogr, osgeo.osr = gdal, ogr, osr
sys.modules.update({'osgeo': osgeo, 'osgeo.gdal': gdal, 'osgeo.ogr': ogr, 'osgeo.osr': osr})

import lidar, rede

PLANO = {}   # caminho -> lista de respostas por ordem
VISTOS = {}

class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_GET(self):
        n = VISTOS.get(self.path, 0); VISTOS[self.path] = n + 1
        seq = PLANO[self.path]; r = seq[min(n, len(seq) - 1)]
        if r == 'lento':
            time.sleep(3); r = 200
        if r == 'html':
            self.send_response(200); self.send_header('Content-Type', 'text/html'); self.end_headers(); self.wfile.write(b'<html>login</html>'); return
        if r == 200:
            corpo = b'II*' + b'\0' * 1000
            self.send_response(200); self.send_header('Content-Type', 'image/tiff'); self.send_header('Content-Length', str(len(corpo))); self.end_headers(); self.wfile.write(corpo); return
        self.send_response(r)
        if r == 429: self.send_header('Retry-After', '42')
        self.send_header('Content-Type', 'text/plain'); self.end_headers(); self.wfile.write(b'erro')

srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), H)
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = 'http://127.0.0.1:%d' % srv.server_address[1]

class Api:
    cfg = {'dgt': {'tentativas': 6, 'base': 15, 'tecto': 300}}
    renovacoes = 0
    def post(self, rota, dados, timeout=60):
        assert rota == 'cdd'
        if dados.get('renovar'): Api.renovacoes += 1
        return {'cookies': [{'name': 'sessao', 'value': 'x', 'domain': '127.0.0.1', 'path': '/'}]}

# os testes usam um tempo esgotado curto para a resposta «lenta»
_orig = lidar._directo
lidar._directo = lambda api, href, destino, renovar=False, timeout=(5, 1): _orig(api, href, destino, renovar, (5, 1))

def correr(nome, seq, esperado_ok, tentativas=6):
    PLANO['/' + nome] = seq; VISTOS.pop('/' + nome, None)
    esperas, linhas = [], []
    Api.cfg = {'dgt': {'tentativas': tentativas, 'base': 15, 'tecto': 300}}
    d = tempfile.mkdtemp()
    dst = os.path.join(d, nome + '.tif')
    try:
        lidar._descarregar_folha(Api(), BASE + '/' + nome, nome + '.tif', dst, linhas.append, Api.cfg, dormir=esperas.append)
        ok, erro = True, None
    except Exception as e:
        ok, erro = False, e
    pedidos = VISTOS.get('/' + nome, 0)
    estado = 'OK ' if ok == esperado_ok else 'FALHOU'
    print('%s %-22s pedidos=%d esperas=%s %s' % (estado, nome, pedidos, [round(x) for x in esperas],
          ('-> ficheiro ' + str(os.path.getsize(dst)) + ' B') if ok else ('-> ' + type(erro).__name__ + ': ' + str(erro)[:150])))
    for l in linhas: print('      ' + l)
    assert ok == esperado_ok, nome
    assert not os.path.exists(dst + '.parte'), 'ficou ficheiro .parte'
    return esperas, erro

falhas = 0
# 1. 503, 503, 200
e, _ = correr('t503', [503, 503, 200], True)
assert len(e) == 2 and 7.5 <= e[0] <= 15 and 15 <= e[1] <= 30
# 2. 429 com Retry-After 42, depois 200: a espera respeita os 42 s
e, _ = correr('t429', [429, 200], True)
assert len(e) == 1 and e[0] >= 42
# 3. tempo esgotado, depois 200
e, _ = correr('tlento', ['lento', 200], True)
assert len(e) == 1
# 4. 502/504/520 (Cloudflare) e depois 200
e, _ = correr('tcf', [502, 504, 520, 200], True)
assert len(e) == 3
# 5. 404: definitivo, sem novas tentativas
e, err = correr('t404', [404], False)
assert e == [] and isinstance(err, rede.ErroDefinitivo) and 'já não existe' in str(err)
# 6. sempre 503: esgota as tentativas e dá DGTIndisponivel, sem ciclo
e, err = correr('tsempre', [503], False)
assert len(e) == 5 and isinstance(err, rede.DGTIndisponivel) and VISTOS['/tsempre'] == 6
assert all(x <= 300 for x in e)
# 7. sessão recusada (página de entrada HTML) 2 vezes, depois 200: renova a sessão
Api.renovacoes = 0
e, _ = correr('tsessao', ['html', 'html', 200], True)
assert Api.renovacoes >= 1
# 8. sessão sempre recusada: erro definitivo ao fim de 3 recusas
e, err = correr('tsessao2', ['html'], False)
assert isinstance(err, rede.ErroDefinitivo) and 'recusou a sessão' in str(err)
# 9. ficheiro corrompido (não é TIFF), depois válido
PLANO['/tcorr'] = None
class H2(H): pass
e, _ = correr('t500', [500, 200], True)
# 10. máximo de tentativas configurável
e, err = correr('tmax2', [503], False, tentativas=2)
assert VISTOS['/tmax2'] == 2 and len(e) == 1

# 11. curva das esperas: crescente, com tecto, para 8 tentativas
import random
random.seed(1)
print('esperas típicas (base 15 s, tecto 300 s):', [round(rede.espera(k, 15, 300)) for k in range(8)])
# 12. classificação
assert rede.classificar_codigo(404) == 'definitivo' and rede.classificar_codigo(429) == 'passageiro' and rede.classificar_codigo(522) == 'passageiro'
assert rede.retry_after('120') == 120.0
print('TODOS OS TESTES PASSARAM')
srv.shutdown()
