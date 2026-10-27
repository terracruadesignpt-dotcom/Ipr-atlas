#!/usr/bin/env bash
# Correcção dos festos partidos (reporte #14892 da Ana) por cima do worker 1.0.18, no servidor do worker (94.46.172.243).
# Correr DEPOIS do instalar-backoff.sh (o worker tem de estar no 1.0.18).
# Uso:   sudo bash instalar-festos.sh            instala (só se o worker estiver parado entre encomendas)
#        sudo bash instalar-festos.sh --forcar   instala mesmo com uma encomenda a meio (ela volta à fila)
#        sudo bash instalar-festos.sh repor      volta à versão anterior
# Causa: no terreno.py o MDT invertido vai directo para o D8 sem preencher depressões. No MDT invertido os cumes
#        são fossas; o fluxo morre nelas e a rede de festos sai aos bocados.
# Faz:   cópia da versão actual -> versoes/1.0.18-festos; no terreno.py troca a linha
#            neg = W.negate(<mdt>)
#        por
#            neg = W.fill_depressions(W.negate(<mdt>), <os mesmos argumentos do fill_depressions já usado no ficheiro>)
#        Só altera se encontrar exactamente uma linha dessas e uma chamada W.fill_depressions(...) já existente para
#        copiar a forma. Verifica sintaxe e importação, troca a ligação «actual», reinicia e confirma; se algo falhar,
#        repõe sozinho. VERSION fica 1.0.18 (o pacote do site, 1.0.17, continua a ser ignorado). Nada é apagado.
set -euo pipefail
RAIZ=${TCD_RAIZ:-/opt/tcd-worker}
PY=${TCD_PY:-$RAIZ/venv/bin/python}
BASE=1.0.18
NOME=1.0.18-festos
DADOS=${TCD_DADOS:-/var/lib/tcd-worker}
REG=${TCD_REG:-/var/log/tcd-worker-instalar-festos.log}
SYSCTL=${TCD_SYSCTL:-systemctl}
JCTL=${TCD_JCTL:-journalctl}
COMO=${TCD_COMO-sudo -u tcdworker}
ESPERA=${TCD_ESPERA:-25}

msg() { echo "[$(date +%H:%M:%S)] $*" | tee -a "$REG"; }
[ "$(id -u)" = 0 ] || [ -n "${TCD_RAIZ:-}" ] || { echo "Correr com sudo."; exit 1; }
[ -d "$RAIZ/versoes" ] && [ -L "$RAIZ/actual" ] || { echo "PARAR: não encontro $RAIZ/actual (instalação gerida do worker)."; exit 1; }

if [ "${1:-}" = "repor" ]; then
  ANT=$(cat "$RAIZ/.antes-festos" 2>/dev/null || true)
  [ -n "$ANT" ] && [ -d "$ANT" ] || { echo "PARAR: não sei qual era a versão anterior ($RAIZ/.antes-festos)."; exit 1; }
  ln -sfn "$ANT" "$RAIZ/actual.novo" && mv -Tf "$RAIZ/actual.novo" "$RAIZ/actual"
  $SYSCTL restart tcd-worker
  msg "Reposta a versão anterior: $ANT"
  exit 0
fi

ACT=$(readlink -f "$RAIZ/actual")
VACT=$(cat "$ACT/VERSION" 2>/dev/null || echo '?')
msg "Versão instalada: $VACT ($ACT)"
if [ -f "$ACT/FESTOS" ]; then msg "A correcção dos festos já está instalada. Nada a fazer."; exit 0; fi
if [ "$VACT" != "$BASE" ]; then
  msg "PARAR: o worker não está no $BASE. Instalar primeiro o instalar-backoff.sh e depois correr este."
  exit 1
fi
[ -f "$ACT/terreno.py" ] || { msg "PARAR: não encontro $ACT/terreno.py. Nada foi mudado."; exit 1; }
if [ -f "$DADOS/em_curso.json" ] && [ "${1:-}" != "--forcar" ]; then
  msg "PARAR: o worker está a meio de uma encomenda ($(cat "$DADOS/em_curso.json")). Esperar que acabe e correr outra vez."
  exit 1
fi

DEST=$RAIZ/versoes/$NOME
TMP=$DEST.tmp
rm -rf "$TMP"; cp -a "$ACT" "$TMP"
rm -rf "$TMP/__pycache__"

# alteração do terreno.py, com verificações estritas (sai com 2 se o código não for o esperado)
if ! "$PY" - "$TMP/terreno.py" >>"$REG" 2>&1 <<'PYEOF'
import re, sys
p = sys.argv[1]
src = open(p, encoding='utf-8').read()
alvo = re.compile(r'^(?P<ind>[ \t]*)neg[ \t]*=[ \t]*W\.negate\((?P<arg>[^()]+)\)[ \t]*$', re.M)
m = list(alvo.finditer(src))
if len(m) != 1:
    print('PARAR: esperava 1 linha "neg = W.negate(...)" e encontrei %d.' % len(m)); sys.exit(2)
# forma da chamada fill_depressions já usada no ficheiro (para copiar os argumentos depois do 1.º)
ex = re.compile(r'W\.fill_depressions\((?P<a1>[^(),]+)(?P<resto>(?:,[^()]*)?)\)')
f = [x for x in ex.finditer(src) if x.start() < m[0].start()] or list(ex.finditer(src))
if not f:
    print('PARAR: não encontrei nenhuma chamada W.fill_depressions(...) para copiar a forma.'); sys.exit(2)
resto = f[0].group('resto')
partes = [x.strip() for x in resto.split(',')[1:]]
if '"' in resto or "'" in resto or not all(re.fullmatch(r'\w+\s*=\s*[\w.]+', x) for x in partes):
    # só argumentos nomeados simples (ex.: fix_flats=True); um 2.º argumento posicional pode ser o caminho de saída
    print('PARAR: a chamada W.fill_depressions(...) existente tem argumentos que não sei copiar (%s); fazer à mão.' % resto); sys.exit(2)
g = m[0]
nova = '%sneg = W.fill_depressions(W.negate(%s)%s)  # 1.0.18-festos: cumes invertidos sem fossas (#14892)' % (
    g.group('ind'), g.group('arg').strip(), resto)
print('antes : ' + g.group(0).strip())
print('depois: ' + nova.strip())
src = src[:g.start()] + nova + src[g.end():]
open(p, 'w', encoding='utf-8').write(src)
PYEOF
then
  msg "PARAR: o terreno.py não tem a forma esperada (ver $REG). Nada foi trocado; $TMP fica para análise."
  exit 1
fi
echo "festos (#14892) $(date '+%Y-%m-%d %H:%M')" > "$TMP/FESTOS"
msg "terreno.py alterado: $(md5sum "$TMP/terreno.py" | cut -d' ' -f1)"

# verificação de sintaxe e de importação, com o Python e o utilizador do worker
[ -n "${TCD_RAIZ:-}" ] || chown -R tcdworker:tcdworker "$TMP"
if ! $COMO env QT_QPA_PLATFORM=offscreen "$PY" -c "
import py_compile, sys
py_compile.compile('$TMP/terreno.py', doraise=True)
sys.path.insert(0, '$TMP')
import terreno
print('verificação ok: terreno importado')
" >>"$REG" 2>&1; then
  msg "PARAR: a verificação falhou (ver $REG). Nada foi trocado; $TMP fica para análise."
  exit 1
fi
rm -rf "$DEST"; mv "$TMP" "$DEST"
echo "$ACT" > "$RAIZ/.antes-festos"

# troca e reinício
ln -sfn "$DEST" "$RAIZ/actual.novo" && mv -Tf "$RAIZ/actual.novo" "$RAIZ/actual"
INICIO=$(date '+%Y-%m-%d %H:%M:%S')
$SYSCTL restart tcd-worker
sleep "$ESPERA"
J=$($JCTL -u tcd-worker --since "$INICIO" --no-pager 2>&1 || true)
if $SYSCTL is-active --quiet tcd-worker && ! grep -q 'Traceback' <<<"$J"; then
  msg "Pronto: worker $NOME activo. Para voltar atrás: sudo bash $0 repor"
  msg "Falta: reprocessar a encomenda do mapa 14629 e ver os festos no Atlas."
  tail -5 <<<"$J" | tee -a "$REG"
  exit 0
fi
msg "O worker $NOME não arrancou bem. A repor $ACT."
tail -30 <<<"$J" >>"$REG"
ln -sfn "$ACT" "$RAIZ/actual.novo" && mv -Tf "$RAIZ/actual.novo" "$RAIZ/actual"
$SYSCTL restart tcd-worker
msg "Reposto. Manda ao Claude o ficheiro $REG."
exit 1
