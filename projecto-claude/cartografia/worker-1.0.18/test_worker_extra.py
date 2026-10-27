"""Teste do worker 1.0.18: tradução de erros da pesquisa, auto-reparação com limite, versões e esperas do site."""
import json, os, sys, tempfile, types
W = sys.argv[1]
sys.path.insert(0, W)
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'stub_osgeo.py')).read())
os.environ['TCD_WORKER_DADOS'] = tempfile.mkdtemp()
import tcd_worker as tw, lidar, rede

# versões
assert tw._versao_tuplo('1.0.18') > tw._versao_tuplo('1.0.17')
assert tw._versao_tuplo('1.0.9') < tw._versao_tuplo('1.0.17')
tw.VERSAO = '1.0.18'
assert tw.actualizar(None, '1.0.17') is False   # nunca desce
print('OK versões: não desce de 1.0.18 para 1.0.17')

# pesquisa: tradução dos erros do site
class Api:
    def __init__(self, cod): self.cod = cod
    def post(self, rota, dados, timeout=60):
        raise tw.ErroSite(self.cod, 'HTTP %d em /worker/lidar: Pesquisa STAC: HTTP 503' % self.cod)
for cod, tipo in ((502, rede.DGTIndisponivel), (400, lidar.SemCobertura), (401, rede.ErroDefinitivo), (403, tw.ErroSite)):
    try:
        lidar._pesquisar(Api(cod), [0, 0, 1, 1], 'MDT-50cm'); raise SystemExit('devia falhar')
    except Exception as e:
        assert isinstance(e, tipo), (cod, type(e))
        print('OK pesquisa HTTP %d -> %s: %s' % (cod, type(e).__name__, str(e)[:90]))

# auto-reparação com limite
enviados = []
class Site:
    def __init__(self, cfg): pass
    def post(self, rota, d, timeout=60): enviados.append(d); return {}
tw.Site = Site
for i in range(1, 5):
    tw._marcador_gravar(14622, 'a_processar')
    tw.recuperar_interrompido({})
print('estados enviados:', [d['estado'] for d in enviados])
assert [d['estado'] for d in enviados] == ['aguarda', 'aguarda', 'aguarda', 'erro']
assert '4 vezes seguidas' in enviados[-1]['nota']
assert '14622' not in tw._falhas_ler()
print('OK auto-reparação: 3 voltas à fila, à 4.ª passa a erro')

# nota de erro
print('OK nota:', tw._nota_erro(rede.DGTIndisponivel('O Centro de Dados da DGT não respondeu...')))

# esperas do site: variação e Retry-After
import time as _t
dormidas = []
tw.time.sleep = dormidas.append
class R:
    def __init__(self, c, ra=None): self.status_code = c; self.url = 'x'; self.headers = {'Retry-After': ra} if ra else {}
    def json(self): return {'message': 'ocupado'}
s = tw.Site.__mro__[0]
real = __import__('importlib').reload(tw)  # repõe a classe Site original
real.time.sleep = dormidas.append
site = real.Site({'site': 'https://exemplo.invalid'})
seq = iter([R(503), R(429, '200'), R(502), types.SimpleNamespace(status_code=200, url='x', headers={}, json=lambda: {'ok': 1})])
assert site._tentar(lambda: next(seq)) == {'ok': 1}
print('OK site: esperas', [round(x) for x in dormidas])
assert 3.75 <= dormidas[0] <= 6.25 and dormidas[1] >= 200 and len(dormidas) == 3
print('TODOS OS TESTES EXTRA PASSARAM')
