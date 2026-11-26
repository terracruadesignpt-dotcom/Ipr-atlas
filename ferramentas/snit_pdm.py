#!/usr/bin/env python3
# IPR Atlas · cópia nacional das plantas do PDM publicadas no SNIT da DGT (servicos.dgterritorio.pt).
# Nuno, 17/11/2026, 11h31: «As plantas do PDM é a coisa mais importante [...] Copia essa merda.»
#
# Por câmara (DICO): procura o serviço do PDM no catálogo do SNIG, lê o GetCapabilities, escolhe as plantas com o mesmo critério
# do worker (planta.py / ipr-copia-snit: nomes com «ordenamento» ou «condicionante», até 10), pede ao SNIT imagens grandes
# (2048 px = 8×8 mosaicos de 256 px, EPSG:3857, z16), corta-as em mosaicos, faz os zooms 15 a 12 a partir dos de z16 (sem pedir
# nada à DGT) e grava um PMTiles por planta: <srv>__<camada>.pmtiles. Os ficheiros pequenos (servico.json, cap.xml, legendas)
# vão num .tar com os caminhos de snit/ já certos. O worker do motor lê tudo em camadas.terracruadesign.pt/snit/ como antes.
#
# Uso: snit_pdm.py lista <saida.json>                       -> {dico: srv} de todas as câmaras com PDM no SNIT
#      snit_pdm.py copiar <lista.json> <prefixo> <pasta> <minutos> [feitos.txt]
#                                                           -> copia as câmaras cujo DICO começa por <prefixo>
# Terracrua Design.
import io, json, math, os, re, shutil, subprocess, sys, tarfile, time
import urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

from PIL import Image
from pmtiles.writer import Writer
from pmtiles.tile import zxy_to_tileid, TileType, Compression

UA = {'User-Agent': 'IPR-Atlas/1.0 (+https://terracruadesign.pt)'}
CSW = 'https://snig.dgterritorio.gov.pt/rndg/srv/por/csw'
SNIT = 'servicos.dgterritorio.pt/'
OO = 20037508.342789244
Z = 16          # zoom pedido ao SNIT; 15 a 12 fazem-se aqui
ZMIN = 12
META = 8        # 8×8 mosaicos por pedido (2048 px)
FIOS = int(os.environ.get('SNIT_FIOS', '3'))
esc = lambda s: re.sub(r'[^A-Za-z0-9_.\-]', '_', str(s))


def get(url, t=60, tent=3):
    ult = None
    for k in range(tent):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=t) as r:
                return r.status, r.headers.get('Content-Type', ''), r.read()
        except Exception as e:  # noqa: BLE001
            ult = e
            time.sleep(3 + 5 * k)
    raise ult


def lista(saida):
    """Todas as câmaras com serviço WMS do PDM no SNIT (o mais recente por DICO)."""
    melhor = {}
    pos, total = 1, None
    while total is None or pos <= total:
        q = urllib.parse.urlencode({'service': 'CSW', 'version': '2.0.2', 'request': 'GetRecords', 'typeNames': 'csw:Record',
                                    'resultType': 'results', 'elementSetName': 'full', 'constraintLanguage': 'CQL_TEXT',
                                    'constraint_language_version': '1.1.0', 'constraint': "AnyText like '%SDISNITWMSPDM1_%'",
                                    'maxRecords': '100', 'startPosition': str(pos)})
        _, _, b = get(CSW + '?' + q, 90, 5)
        t = b.decode('utf-8', 'replace')
        m = re.search(r'numberOfRecordsMatched="(\d+)"', t)
        total = int(m.group(1)) if m else 0
        recs = re.findall(r'<csw:Record\b[\s\S]*?</csw:Record>', t)
        for rec in recs:
            d = (re.search(r'<dc:date>([\s\S]*?)</dc:date>', rec) or [None, ''])[1].strip() if re.search(r'<dc:date>', rec) else ''
            for u in re.findall(r'<dc:URI[^>]*>[\s\S]*?</dc:URI>', rec):
                mm = re.search(r'servicos\.dgterritorio\.pt/((?:SDISNITWMSPDM1|sdisnitwmspdm1)_(\d{4})_\d+_\d+)/', u.replace('&amp;', '&'), re.I)
                if mm:
                    dico = mm.group(2)
                    melhor.setdefault(dico, {})
                    if d >= melhor[dico].get(mm.group(1), ''):
                        melhor[dico][mm.group(1)] = d
        print('CSW', pos, '/', total, 'câmaras:', len(melhor), flush=True)
        if not recs:
            break
        pos += 100
    # 26/11/2026: guardam-se todos os serviços de cada câmara, do mais recente para o mais antigo («srv1|srv2|...»). O SNIT
    # respondia sempre HTTP 500 ao serviço escolhido para o Porto (1312_3027_3), Gaia, Setúbal e Leiria; a câmara passa a
    # tentar os outros serviços publicados antes de desistir.
    out = {k: '|'.join(sorted(v, key=lambda s_: (v[s_], s_), reverse=True)) for k, v in sorted(melhor.items())}
    json.dump(out, open(saida, 'w'), indent=0)
    print('câmaras com PDM no SNIT:', len(out))


def capacidades(srv):
    for base, f in (('https://' + SNIT, 'WMService.aspx'), ('http://' + SNIT, 'service.svc/get'), ('http://' + SNIT, 'wmservice.aspx')):
        try:
            st, _, b = get(base + srv + '/' + f + '?service=WMS&request=GetCapabilities&version=1.1.1', 90, 2)
            t = b.decode('utf-8', 'replace')
            if st == 200 and '<Name>' in t:
                return base + srv + '/' + f, t
        except Exception as e:  # noqa: BLE001
            print('  cap', srv, f, str(e)[:100], flush=True)
    return None, None


def camadas(cap):
    """O mesmo critério do ipr-copia-snit (e por isso do planta.py), com a caixa de cada camada."""
    cs = []
    for m in re.finditer(r'<Layer\b[^>]*>\s*<Name>([\s\S]*?)</Name>\s*<Title>([\s\S]*?)</Title>([\s\S]*?)(?=<Layer\b|</Layer>)', cap):
        nome, tit, resto = m.group(1).strip(), re.sub(r'\s+', ' ', m.group(2)).strip(), m.group(3)
        n = nome.lower()
        if ('ordenamento' in n or 'condicionante' in n) and not any(c[0] == nome for c in cs):
            bb = re.search(r'<LatLonBoundingBox[^>]*minx="([-\d.eE]+)"[^>]*miny="([-\d.eE]+)"[^>]*maxx="([-\d.eE]+)"[^>]*maxy="([-\d.eE]+)"', resto)
            cs.append([nome, tit or nome.replace('_', ' '), [float(v) for v in bb.groups()] if bb else None])
    cs.sort(key=lambda c: (0 if 'ordenamento' in c[0].lower() else 1, c[0].lower()))
    return cs   # copiam-se todas; o servico.json leva as 10 primeiras, como o worker sempre fez


def lon2x(lon, z): return int(math.floor((lon + 180) / 360 * 2 ** z))
def lat2y(lat, z):
    r = math.radians(lat)
    return int(math.floor((1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * 2 ** z))


VAZIO = None
def vazio():
    global VAZIO
    if VAZIO is None:
        b = io.BytesIO(); Image.new('RGBA', (256, 256), (0, 0, 0, 0)).save(b, 'PNG', optimize=True); VAZIO = b.getvalue()
    return VAZIO


def png(im):
    """Mosaico em PNG; vazio canónico (o PMTiles guarda-o uma vez só) quando não há desenho."""
    if im.mode != 'RGBA':
        im = im.convert('RGBA')
    if im.getchannel('A').getextrema()[1] == 0:
        return vazio()
    b = io.BytesIO()
    try:
        im.quantize(256, method=Image.Quantize.FASTOCTREE).save(b, 'PNG', optimize=True)
    except Exception:  # noqa: BLE001
        b = io.BytesIO(); im.save(b, 'PNG', optimize=True)
    return b.getvalue()


def getmap(fim, cam, z, x0, y0, n):
    lado = 2 * OO / 2 ** z
    bb = (-OO + x0 * lado, OO - (y0 + n) * lado, -OO + (x0 + n) * lado, OO - y0 * lado)
    q = urllib.parse.urlencode({'SERVICE': 'WMS', 'VERSION': '1.3.0', 'REQUEST': 'GetMap', 'LAYERS': cam, 'STYLES': '',
                                'CRS': 'EPSG:3857', 'BBOX': ','.join('%.2f' % v for v in bb), 'WIDTH': str(256 * n),
                                'HEIGHT': str(256 * n), 'FORMAT': 'image/png', 'TRANSPARENT': 'TRUE'})
    for k in range(3):   # o SNIT responde por vezes com ServiceException (servidor ocupado): espera e repete
        st, ct, b = get(fim + '?' + q, 90, 2)
        if st == 200 and ct.startswith('image/'):
            return Image.open(io.BytesIO(b)).convert('RGBA')
        time.sleep(8 + 12 * k)
    m = re.search(rb'<ServiceException[^>]*>([\s\S]{0,200})', b)
    raise RuntimeError('SNIT %s %s %s' % (st, ct, (m.group(1) if m else b[:200]).decode('utf-8', 'replace').strip()))


def bloco(fim, cam, x0, y0, pasta):
    """Um bloco de 8×8 mosaicos z16; se o SNIT recusar 2048 px, pede 4 de 1024 px."""
    feitos = 0
    try:
        partes = [(x0, y0, META, getmap(fim, cam, Z, x0, y0, META))]
    except RuntimeError:   # 24/11: só se parte em 4 quando o SNIT recusa os 2048 px; se não responde, partir só multiplica a espera
        partes = []
        h = META // 2
        for dx in (0, h):
            for dy in (0, h):
                partes.append((x0 + dx, y0 + dy, h, getmap(fim, cam, Z, x0 + dx, y0 + dy, h)))
    for px, py, n, im in partes:
        for i in range(n):
            for j in range(n):
                t = im.crop((i * 256, j * 256, i * 256 + 256, j * 256 + 256))
                d = os.path.join(pasta, str(Z), str(px + i))
                os.makedirs(d, exist_ok=True)
                with open(os.path.join(d, '%d.png' % (py + j)), 'wb') as f:
                    f.write(png(t))
                feitos += 1
    return feitos


def sondar(fim, cam, bb, todos):
    """Vê a planta a z14 (um pedido cobre 4×4 blocos de z16) e devolve só os blocos de z16 onde há desenho, com uma margem.
    Se a sondagem não mostrar nada (planta que só desenha perto), copia todos os blocos."""
    z, n = 14, META
    sx0, sx1 = lon2x(bb[0], z) // n * n, lon2x(bb[2], z)
    sy0, sy1 = lat2y(bb[3], z) // n * n, lat2y(bb[1], z)
    cheios = set()
    try:
        for x in range(sx0, sx1 + 1, n):
            for y in range(sy0, sy1 + 1, n):
                im = getmap(fim, cam, z, x, y, n)
                a = im.getchannel('A')
                for i in range(n):
                    for j in range(n):
                        if a.crop((i * 256, j * 256, i * 256 + 256, j * 256 + 256)).getextrema()[1] > 0:
                            for di in (-1, 0, 1):
                                for dj in (-1, 0, 1):
                                    cheios.add((x + i + di, y + j + dj))
    except Exception as e:  # noqa: BLE001
        print('  sondagem falhou (%s); copia tudo' % str(e)[:100], flush=True)
        return todos
    if not cheios:
        return todos
    # bloco z16 (x, y) de 8 mosaicos = mosaicos z14 de x//4 a (x+7)//4
    return [(x, y) for x, y in todos if any((tx, ty) in cheios for tx in range(x // 4, (x + META - 1) // 4 + 1) for ty in range(y // 4, (y + META - 1) // 4 + 1))]


def baixar(pasta, z):
    """Zoom z a partir de z+1 (quatro mosaicos -> um)."""
    acima = os.path.join(pasta, str(z + 1))
    filhos = {}
    for xs in os.listdir(acima):
        for ys in os.listdir(os.path.join(acima, xs)):
            x, y = int(xs), int(ys[:-4])
            filhos.setdefault((x // 2, y // 2), []).append((x, y))
    for (x, y), fs in filhos.items():
        im = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
        tem = False
        for fx, fy in fs:
            b = open(os.path.join(acima, str(fx), '%d.png' % fy), 'rb').read()
            if b == vazio():
                continue
            im.paste(Image.open(io.BytesIO(b)).convert('RGBA'), ((fx - 2 * x) * 256, (fy - 2 * y) * 256))
            tem = True
        d = os.path.join(pasta, str(z), str(x))
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, '%d.png' % y), 'wb') as f:
            f.write(png(im.resize((256, 256), Image.LANCZOS)) if tem else vazio())


def pmtiles(pasta, saida, nome, bbox):
    ids = []
    for z in range(ZMIN, Z + 1):
        dz = os.path.join(pasta, str(z))
        if not os.path.isdir(dz):
            continue
        for xs in os.listdir(dz):
            for ys in os.listdir(os.path.join(dz, xs)):
                ids.append((zxy_to_tileid(z, int(xs), int(ys[:-4])), z, xs, ys))
    ids.sort()
    with open(saida, 'wb') as f:
        w = Writer(f)
        for tid, z, xs, ys in ids:
            w.write_tile(tid, open(os.path.join(pasta, str(z), xs, ys), 'rb').read())
        e7 = lambda v: int(round(v * 1e7))
        w.finalize({'tile_type': TileType.PNG, 'tile_compression': Compression.NONE, 'min_lon_e7': e7(bbox[0]), 'min_lat_e7': e7(bbox[1]),
                    'max_lon_e7': e7(bbox[2]), 'max_lat_e7': e7(bbox[3]), 'center_zoom': 14, 'center_lon_e7': e7((bbox[0] + bbox[2]) / 2),
                    'center_lat_e7': e7((bbox[1] + bbox[3]) / 2)},
                   {'name': nome, 'attribution': 'PDM publicado no SNIT (DGT) · cópia IPR Atlas', 'format': 'png'})
    return len(ids)


PLANTA_MIN = float(os.environ.get('SNIT_PLANTA_MIN', '40'))   # 24/11: uma planta que não acaba em 40 min fica para a volta seguinte


def publicar(pasta, ficheiros, dico):
    if os.environ.get('SNIT_DEPOIS'):
        subprocess.run([os.environ['SNIT_DEPOIS'], pasta] + ficheiros, check=False, env=dict(os.environ, SNIT_TAG='snit-' + dico[:2]))


def camara(dico, srv, pasta, fim_t, ja=frozenset()):
    """24/11/2026: cada planta é publicada logo que fica pronta e não se volta a copiar nas voltas seguintes (ja = PMTiles que
    já estão nas versões snit-*). Antes, uma planta com blocos falhados deitava fora todas as outras da câmara, que eram
    copiadas outra vez na volta seguinte: em 7 dias só 27 das 270 câmaras ficaram feitas."""
    print('== %s %s' % (dico, srv), flush=True)
    fim, cap = None, None
    for alt in srv.split('|'):
        fim, cap = capacidades(alt)
        if cap:
            if alt != srv.split('|')[0]:
                print('  serviço alternativo em uso:', alt, flush=True)
            srv = alt
            break
    if not cap:
        print('  sem GetCapabilities; fica para a próxima volta', flush=True)
        return None
    cs = camadas(cap)
    pc = os.path.join(pasta, dico)
    os.makedirs(pc, exist_ok=True)
    peq = {'snit/%s/cap.xml' % dico: cap.encode('utf-8'),
           'snit/%s/servico.json' % dico: json.dumps({'dico': dico, 'srv': srv, 'fim': fim, 't': int(time.time() * 1000),
                                                      'camadas': [[c[0], c[1]] for c in cs[:10]], 'copia': 'pmtiles',
                                                      'todas': [[c[0], c[1]] for c in cs]}, ensure_ascii=False).encode('utf-8')}
    ficheiros, incompleta = [], False
    for nome, tit, bb in cs:
        nf = '%s__%s.pmtiles' % (esc(srv), esc(nome))
        if nf in ja:
            print('  já copiada:', nf, flush=True)
            ficheiros.append(nf)
            continue
        if time.time() > fim_t - 10 * 60:
            incompleta = True
            break
        try:
            st, ct, b = get(fim + '?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&LAYER=' + urllib.parse.quote(nome) + '&FORMAT=image/png', 60, 2)
            if st == 200 and ct.startswith('image/'):
                peq['snit/%s/%s/leg.png' % (esc(srv), esc(nome))] = b
        except Exception as e:  # noqa: BLE001
            print('  legenda', nome, str(e)[:80], flush=True)
        boas = [c[2] for c in cs if c[2] and c[2][2] - c[2][0] < 1.5 and c[2][3] - c[2][1] < 1.5]
        if not boas:   # as plantas do SNIT costumam não ter caixa própria: vale a do PDM (camada de cima)
            g = re.search(r'<LatLonBoundingBox[^>]*minx="([-\d.eE]+)"[^>]*miny="([-\d.eE]+)"[^>]*maxx="([-\d.eE]+)"[^>]*maxy="([-\d.eE]+)"', cap)
            if g:
                g = [float(v) for v in g.groups()]
                if g[2] - g[0] < 1.5 and g[3] - g[1] < 1.5:
                    boas = [g]
        if not bb or bb[2] - bb[0] >= 1.5 or bb[3] - bb[1] >= 1.5:   # caixa em falta ou do país inteiro: usa a das outras plantas
            if not boas:
                print('  sem caixa utilizável:', nome, bb, flush=True)
                return None
            bb = [min(b[0] for b in boas), min(b[1] for b in boas), max(b[2] for b in boas), max(b[3] for b in boas)]
        bb = [max(bb[0], -31.6), max(bb[1], 29.9), min(bb[2], -6.1), min(bb[3], 42.2)]
        if bb[0] >= bb[2] or bb[1] >= bb[3]:
            continue
        x0, x1 = lon2x(bb[0], Z) // META * META, lon2x(bb[2], Z)
        y0, y1 = lat2y(bb[3], Z) // META * META, lat2y(bb[1], Z)
        t0 = time.time()
        fim_p = min(fim_t, t0 + PLANTA_MIN * 60)
        todos = [(x, y) for x in range(x0, x1 + 1, META) for y in range(y0, y1 + 1, META)]
        blocos = sondar(fim, nome, bb, todos)
        pt = os.path.join(pc, esc(nome))
        n, falhas, maus = 0, 0, []
        with ThreadPoolExecutor(FIOS) as ex:
            fs = {ex.submit(bloco, fim, nome, x, y, pt): (x, y) for x, y in blocos}
            for f in as_completed(fs):
                try:
                    n += f.result()
                except Exception as e:  # noqa: BLE001
                    maus.append(fs[f])
                    if len(maus) <= 3:
                        print('  bloco falhou:', str(e)[:200], flush=True)
                if time.time() > fim_p:
                    for g in fs:
                        g.cancel()
        if maus and time.time() < fim_p:   # segunda tentativa, devagar
            time.sleep(30)
            for x, y in maus:
                if time.time() > fim_p:
                    falhas += 1
                    continue
                try:
                    n += bloco(fim, nome, x, y, pt)
                except Exception as e:  # noqa: BLE001
                    falhas += 1
                    print('  bloco falhou outra vez:', str(e)[:200], flush=True)
        print('  %s: %d de %d blocos com desenho, %d mosaicos z16, %d falhas, %.0f s' % (nome, len(blocos), len(todos), n, falhas, time.time() - t0), flush=True)
        if not n and not falhas and not maus:   # planta sem desenho nenhum nesta câmara
            continue
        if falhas or not n or time.time() > fim_p:
            print('  planta incompleta; fica para a próxima volta (as outras seguem)', flush=True)
            shutil.rmtree(pt, ignore_errors=True)
            incompleta = True
            continue
        for z in range(Z - 1, ZMIN - 1, -1):
            baixar(pt, z)
        k = pmtiles(pt, os.path.join(pasta, nf), '%s · %s' % (tit, dico), bb)
        shutil.rmtree(pt, ignore_errors=True)
        print('  %s: %d mosaicos, %.1f MB' % (nf, k, os.path.getsize(os.path.join(pasta, nf)) / 1e6), flush=True)
        publicar(pasta, [nf], dico)   # publicada já: não se perde se a volta for cortada
        ficheiros.append(nf)
    if incompleta:
        print('  câmara %s incompleta: %d plantas guardadas; o resto na próxima volta' % (dico, len(ficheiros)), flush=True)
        return None
    tf = os.path.join(pasta, '%s.tar' % dico)
    with tarfile.open(tf, 'w') as t:
        for k, v in peq.items():
            ti = tarfile.TarInfo(k); ti.size = len(v); ti.mtime = int(time.time())
            t.addfile(ti, io.BytesIO(v))
    return ['%s.tar' % dico]   # as plantas já foram publicadas uma a uma


def copiar(fl, prefixo, pasta, minutos, feitos_f=None, plantas_f=None):
    fim_t = time.time() + float(minutos) * 60
    todos = json.load(open(fl))
    feitos = set(open(feitos_f).read().split()) if feitos_f and os.path.exists(feitos_f) else set()
    ja = frozenset(open(plantas_f).read().split()) if plantas_f and os.path.exists(plantas_f) else frozenset()
    for dico, srv in todos.items():
        if not any(dico.startswith(p) for p in prefixo.split(',') if p) or dico in feitos:
            continue
        if time.time() > fim_t - 20 * 60:
            print('sem tempo para mais câmaras nesta volta', flush=True)
            break
        r = camara(dico, srv, pasta, fim_t, ja)
        shutil.rmtree(os.path.join(pasta, dico), ignore_errors=True)
        if r:
            with open(os.path.join(pasta, 'prontos.txt'), 'a') as f:
                f.write(' '.join(r) + '\n')
            publicar(pasta, r, dico)   # o .tar marca a câmara como feita


if __name__ == '__main__':
    if sys.argv[1] == 'lista':
        lista(sys.argv[2])
    else:
        copiar(*sys.argv[2:])
