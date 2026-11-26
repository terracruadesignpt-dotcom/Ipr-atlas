#!/usr/bin/env python3
# IPR Atlas · pacote da lista «js» do atlas.json (Terracrua Design, 26/11/2026).
# Junta, pela mesma ordem, os ~150 scripts que o site carregava um a um num só ficheiro atlas/pacotes/pacote-<md5[:12]>.js.
# md5 = md5 das linhas da lista «js» unidas por "\n" (o m14626 do site faz a mesma conta e só usa o pacote se bater certo).
# Ficheiros do jsDelivr (gh/.../Ipr-atlas@<commit>/<caminho>): lidos deste repositório nesse commit; os .min.js que não
# existem no repositório são minificados com o terser, como o jsDelivr faz. Ficheiros do próprio site: descarregados.
# Antes de cada ficheiro fica window.__iprPac=<n>; no fim window.__iprPacOk=1 (o site carrega um a um o que faltar).
import json, subprocess, re, sys, hashlib, os, urllib.request
SITE = 'https://terracruadesign.pt/wp-content/plugins/terracrua-nucleo/assets/atlas/'
UA = {'User-Agent': 'Mozilla/5.0 (IPR Atlas pacote)'}
def get(u):
    return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60).read()
j = json.loads(get(SITE + 'atlas.json?p=' + str(os.getpid())))
lista = j['js']
md5 = hashlib.md5('\n'.join(lista).encode()).hexdigest()
dest = 'atlas/pacotes/pacote-%s.js' % md5[:12]
print('md5', md5, 'ficheiros', len(lista))
if os.path.exists(dest):
    print('já existe', dest); sys.exit(0)
partes = []
for f in lista:
    m = re.match(r'https://cdn\.jsdelivr\.net/gh/terracruadesignpt-dotcom/Ipr-atlas@([0-9a-f]{40})/(.+)$', f, re.I)
    if m:
        sha, p = m.groups()
        def show(path):
            r = subprocess.run(['git', 'show', sha + ':' + path], capture_output=True)
            return r.stdout if r.returncode == 0 else None
        c = show(p)
        if c is None and p.endswith('.min.js'):
            src = show(p[:-7] + '.js')
            if src is not None:
                open('/tmp/_src.js', 'wb').write(src)
                r = subprocess.run(['terser', '/tmp/_src.js', '-c', '-m', '--comments', '/^!/'], capture_output=True)
                if r.returncode != 0: sys.exit('terser falhou: ' + f)
                c = r.stdout
        if c is None: sys.exit('em falta: ' + f)
    else:
        c = get(SITE + f + '?p=' + md5[:8])
    partes.append((f, c))
out = [b'window.__iprPac=-1;\n']
for i, (f, c) in enumerate(partes):
    out.append(('\n;window.__iprPac=%d;/*! %s */\n' % (i, f.split('/')[-1])).encode() + c)
out.append(b'\n;window.__iprPac=%d;window.__iprPacOk=1;\n' % len(partes))
os.makedirs('atlas/pacotes', exist_ok=True)
tmpf = dest[:-3] + '.tmp.js'
open(tmpf, 'wb').write(b''.join(out))
if subprocess.run(['node', '--check', tmpf]).returncode != 0:
    os.remove(tmpf); sys.exit('o pacote não passa no node --check')
os.rename(tmpf, dest)
print('feito', dest, os.path.getsize(dest))
open(os.environ.get('GITHUB_OUTPUT', '/dev/null'), 'a').write('novo=%s\n' % dest)
