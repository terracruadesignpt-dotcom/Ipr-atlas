#!/bin/bash
# IPR Cloud: corre o espelho do site na Cloud. No motor, como root (sudo).
#   sudo bash ipr-sync.sh            -> ENSAIO (só lista, não muda nada)
#   sudo bash ipr-sync.sh aplicar    -> aplica as diferenças
# O segredo de leitura do espelho fica em /opt/ipr-cloud/conf/ipr-sync/token (só root)
# e vai para o curl por ficheiro, para não aparecer no `ps`.
set -euo pipefail
D=/opt/ipr-cloud/conf/ipr-sync
SITE=https://terracruadesign.pt/wp-json/tcd/v1/cloud/espelho
cd /opt/ipr-cloud
[ -s "$D/token" ] || { echo "PARAR: falta $D/token"; exit 1; }
exec 9>"$D/.trinco"; flock -n 9 || { echo "Já há uma passagem a correr."; exit 0; }
umask 077
printf 'X-TCD-Token: %s\n' "$(cat "$D/token")" > "$D/.cab"
trap 'rm -f "$D/.cab"' EXIT

curl -fsS --max-time 120 -H @"$D/.cab" -o "$D/espelho.json" "$SITE"
python3 -c 'import json,sys; json.load(open(sys.argv[1]))' "$D/espelho.json"

APL=0; [ "${1:-}" = "aplicar" ] && APL=1
docker compose exec -T app rm -f /tmp/ipr-sync-ultimo.json
docker compose cp "$D/espelho.json" app:/tmp/espelho.json >/dev/null
docker compose cp "$D/ipr_sync.py" app:/tmp/ipr_sync.py >/dev/null
# `shell -c` corre o ficheiro inteiro de uma vez (ler do stdin pode cair na consola interactiva)
docker compose exec -T -e IPR_SYNC_CORRER=1 -e IPR_APLICAR=$APL app \
  python manage.py shell -c "exec(open('/tmp/ipr_sync.py').read())" | tee "$D/ultimo.txt"
rm -f "$D/ultimo.json"
docker compose cp app:/tmp/ipr-sync-ultimo.json "$D/ultimo.json" >/dev/null 2>&1 || true
[ -s "$D/ultimo.json" ] || { echo "PARAR: o sincronizador não deixou resultado."; exit 1; }
{ date -Is; tail -1 "$D/ultimo.txt"; } >> "$D/historico.txt"

# diz ao site quando sincronizou (o Atlas mostra «sincronizado há X min»), só se aplicou agora
if [ "$APL" = 1 ]; then
  python3 - "$D/ultimo.json" > "$D/estado.json" <<'PY'
import json,sys
r=json.load(open(sys.argv[1]))
assert r["modo"]=="aplicar"
print(json.dumps({"alteracoes":r["alteracoes"],"falhas":r["falhas"]}))
PY
  curl -fsS --max-time 30 -X POST -H @"$D/.cab" -H 'Content-Type: application/json' \
    --data @"$D/estado.json" "$SITE/estado" >/dev/null || true
fi
