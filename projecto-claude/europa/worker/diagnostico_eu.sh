#!/usr/bin/env bash
# Diagnóstico das fontes LiDAR europeias, a correr no servidor de processamento (não no alojamento do site).
# Uso: ./diagnostico_eu.sh [id_da_fonte]     (sem argumento: todas)
# 1. Sondas por fonte (GetCapabilities, colecção STAC, índice, HEAD da folha do ponto de teste).
# 2. Recorte real de 5 ha no ponto de teste de cada fonte, com o adaptador completo.
# Saída: relatorio_eu_AAAAMMDD-HHMM.json e um resumo no ecrã. Nada é enviado para fora do servidor.
set -u
AQUI="$(cd "$(dirname "$0")" && pwd)"
cd "$AQUI"
PY="${PYTHON:-python3}"
SO="${1:-}"
CARIMBO="$(date +%Y%m%d-%H%M)"
REL="relatorio_eu_${CARIMBO}.json"
export GDAL_HTTP_USERAGENT="TerracruaDesign-IPR-worker/1.0 (+https://terracruadesign.pt)"
export GDAL_DISABLE_READDIR_ON_OPEN=EMPTY_DIR
export CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".tif,.tiff,.asc,.laz,.zip"

echo "== Rasterizador de LAZ: $(command -v pdal || command -v whitebox_tools || echo 'nenhum (Chéquia fica desligada)')"
[ -z "${TCD_MML_API_KEY:-}" ] && echo "== Aviso: TCD_MML_API_KEY não definida (Finlândia fica desligada)"

echo "== Sondas"
$PY fontes_eu.py diagnostico $SO > "sondas_${CARIMBO}.json" || true
$PY - "sondas_${CARIMBO}.json" <<'PYEOF'
import json, sys
for l in json.load(open(sys.argv[1])):
    if l.get("ok") is None and "sondas" not in l:
        continue
    s = "; ".join(f"{x['desc']}: {x.get('http', x.get('resultado'))}" for x in l.get("sondas", []))
    print(f"  {l['fonte']:<18} {l.get('estado',''):<24} disponível={l.get('disponivel')} {l.get('nota','')} | {s}")
PYEOF

echo "== Recortes de 5 ha"
IDS="$($PY -c "import fontes_eu as e; print(' '.join(f.id for f in e.ler_config().fontes if f.tipo not in ('externo','alias')))")"
[ -n "$SO" ] && IDS="$SO"
echo "[" > "$REL"; PRIMEIRO=1
for ID in $IDS; do
  INICIO=$(date +%s)
  SAIDA="$(timeout 900 $PY fontes_eu.py recorte "$ID" 5 2>&1 | tail -40)"
  DUR=$(( $(date +%s) - INICIO ))
  if echo "$SAIDA" | grep -q '"tif"'; then EST="OK"; else EST="FALHOU"; fi
  printf "  %-18s %-7s %4ss\n" "$ID" "$EST" "$DUR"
  [ $PRIMEIRO -eq 0 ] && echo "," >> "$REL"; PRIMEIRO=0
  $PY -c "import json,sys; print(json.dumps({'fonte': sys.argv[1], 'estado': sys.argv[2], 'segundos': int(sys.argv[3]), 'saida': sys.argv[4][-3000:]}, ensure_ascii=False))" "$ID" "$EST" "$DUR" "$SAIDA" >> "$REL"
done
echo "]" >> "$REL"
echo "== Relatório: $AQUI/$REL"
echo "Uma fonte só passa a 'verificado' no fontes_eu.json depois de OK aqui e de a atribuição ser conferida com o produtor."
