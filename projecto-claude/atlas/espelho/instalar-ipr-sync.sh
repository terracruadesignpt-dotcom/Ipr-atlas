#!/bin/bash
# IPR Cloud: instala o espelho do site no motor (20/10/2026). Corre-se uma vez, na pasta com os três ficheiros:
#   sudo bash instalar-ipr-sync.sh
# 1) instala o sincronizador; 2) emparelha o motor com o site (o Nuno aprova em Ferramentas › Worker);
# 3) corre um ENSAIO, que não muda nada na Cloud.
set -euo pipefail
AQUI=$(cd "$(dirname "$0")" && pwd)
D=/opt/ipr-cloud/conf/ipr-sync
SITE=https://terracruadesign.pt/wp-json/tcd/v1
[ "$(id -u)" = 0 ] || { echo "Corre com sudo."; exit 1; }
[ -d /opt/ipr-cloud ] || { echo "PARAR: não encontro /opt/ipr-cloud. Isto é o motor?"; exit 1; }
for f in ipr_sync.py ipr-sync.sh; do [ -s "$AQUI/$f" ] || { echo "PARAR: falta $f nesta pasta."; exit 1; }; done

install -d -m 700 "$D"
install -m 600 "$AQUI/ipr_sync.py" "$D/ipr_sync.py"
install -m 700 "$AQUI/ipr-sync.sh" "$D/ipr-sync.sh"
echo "== 1. Sincronizador instalado em $D"

ler() { python3 -c 'import json,sys
try: print(json.load(sys.stdin).get(sys.argv[1],""))
except Exception: print("")' "$1"; }

if [ ! -s "$D/token" ]; then
  echo "== 2. Emparelhar o motor com o site"
  umask 077
  [ -s "$D/.codigo" ] || openssl rand -hex 20 > "$D/.codigo"
  C=$(cat "$D/.codigo")
  for i in $(seq 1 120); do
    R=$(curl -sS --max-time 30 -X POST "$SITE/worker/emparelhar" -d "codigo=$C" -d "nome=motor-cloud" || echo '{}')
    E=$(printf '%s' "$R" | ler estado)
    if [ "$E" = "aprovado" ]; then
      printf '%s' "$R" | ler token | tr -d '\n' > "$D/token"
      rm -f "$D/.codigo"
      echo "   Aprovado. O token ficou só em $D/token (não é mostrado)."
      break
    fi
    if [ "$i" = 1 ]; then
      echo "   Pedido feito. Referência: $(printf '%s' "$R" | ler ref). IP do motor: 176.111.109.78."
      echo "   AGORA: no site, Ferramentas › Worker, aprova o pedido com esta referência e este IP."
      echo "   Fico à espera até 30 minutos..."
    fi
    [ "$E" = "recusado" ] && { echo "PARAR: o pedido foi recusado."; exit 1; }
    sleep 15
  done
  [ -s "$D/token" ] || { echo "PARAR: sem aprovação em 30 min. Corre outra vez o mesmo comando depois de aprovares."; exit 1; }
fi

echo "== 3. O site responde ao espelho?"
umask 077; printf 'X-TCD-Token: %s\n' "$(cat "$D/token")" > "$D/.cab"
code=$(curl -s -o /dev/null -w '%{http_code}' -H @"$D/.cab" "$SITE/cloud/espelho"); rm -f "$D/.cab"
case "$code" in
  200) echo "   Sim (200).";;
  404) echo "   PARAR: 404. O módulo do espelho não está publicado no site."; exit 1;;
  401|403) echo "   PARAR: $code. O site não aceita o token."; exit 1;;
  503) echo "   PARAR: 503. Falta no site uma peça de que o espelho depende."; exit 1;;
  *) echo "   PARAR: resposta $code."; exit 1;;
esac

echo "== 4. ENSAIO (não muda nada na Cloud)"
bash "$D/ipr-sync.sh"
echo
echo "== Pronto. Manda o ecrã ao Claude. Depois de aprovares a lista:"
echo "   sudo bash $D/ipr-sync.sh aplicar"
