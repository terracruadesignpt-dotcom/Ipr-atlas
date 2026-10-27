#!/bin/bash
# Espanha · portão 1: diagnóstico dos serviços públicos espanhóis a partir do servidor.
# Só lê; não descarrega folhas nem toca no site. Corre como utilizador normal:
#   bash diagnostico_es.sh
# Resultado em ./diag_es_<data>/ e um resumo no ecrã para mandar ao Claude.
set -u
D="diag_es_$(date +%Y%m%d-%H%M)"; mkdir -p "$D"
UA="TerracruaDesign-IPR-worker/1.0 (+https://terracruadesign.pt; info@terracruadesign.pt)"
pede() { # nome url
  local f="$D/$1"
  local code
  code=$(curl -sS -A "$UA" --max-time 60 -o "$f" -w '%{http_code} %{content_type} %{size_download}' "$2" 2>"$f.err") || code="falhou $(head -c 200 "$f.err")"
  printf '%-28s %s\n' "$1" "$code" | tee -a "$D/resumo.txt"
}

echo "== Relevo" | tee -a "$D/resumo.txt"
pede wcs_mdt_caps.xml   "https://servicios.idee.es/wcs-inspire/mdt?SERVICE=WCS&VERSION=2.0.1&REQUEST=GetCapabilities"
pede api_coverages.json "https://api-coverages.idee.es/collections?f=json"
pede wms_mdt_caps.xml   "https://servicios.idee.es/wms-inspire/mdt?request=GetCapabilities&service=WMS"
pede cnig_lidar3.html   "https://centrodedescargas.cnig.es/CentroDescargas/lidar-tercera-cobertura"
pede cnig_lidar2.html   "https://centrodedescargas.cnig.es/CentroDescargas/lidar-segunda-cobertura"
pede cnig_nov_lida3.html "https://centrodedescargas.cnig.es/CentroDescargas/novedades?codSerie=LIDA3"
pede cnig_nov_mdt02.html "https://centrodedescargas.cnig.es/CentroDescargas/novedades?codSerie=MDT02"
pede cnig_manual.pdf    "https://www.cnig.es/RSSCDD/archivos/ManualDescargaAutomatica.pdf"
pede ign_licenca.pdf    "https://www.ign.es/resources/licencia/Condiciones_licenciaUso_IGN.pdf"

echo "== Ortofoto e base" | tee -a "$D/resumo.txt"
pede pnoa_wmts.xml      "https://www.ign.es/wmts/pnoa-ma?request=GetCapabilities&service=WMTS"
pede ignbase_wmts.xml   "https://www.ign.es/wmts/ign-base?SERVICE=WMTS&REQUEST=GetCapabilities"
pede pnoa_tile.jpg      "https://www.ign.es/wmts/pnoa-ma?layer=OI.OrthoimageCoverage&style=default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/jpeg&TileMatrix=12&TileCol=1968&TileRow=1568"

echo "== Catastro" | tee -a "$D/resumo.txt"
# Parcela de exemplo da documentação do Catastro; se não existir, o serviço responde com erro legível.
pede catastro_wfs_caps.xml "http://ovc.catastro.meh.es/INSPIRE/wfsCP.aspx?service=wfs&version=2.0.0&request=getcapabilities"
pede catastro_wfs_bbox.gml "http://ovc.catastro.meh.es/INSPIRE/wfsCP.aspx?service=wfs&version=2.0.0&request=getfeature&typenames=CP.CadastralParcel&bbox=676100,4294100,676600,4294600&srsname=EPSG::25829"
pede catastro_rccoor.xml "https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_RCCOOR?SRS=EPSG:4326&Coordenada_X=-6.97&Coordenada_Y=38.78"
pede catastro_licenca.pdf "https://www.catastro.hacienda.gob.es/pdf/ovc/licdescargaES.pdf"
pede navarra_cp_wms.xml "https://inspire.navarra.es/services/CP/wms?service=WMS&request=GetCapabilities"

echo "== SIGPAC" | tee -a "$D/resumo.txt"
pede sigpac_schema.json "https://sigpac-hubcloud.es/ogcapi/collections/recintos/schema?f=json"
pede sigpac_mvt.html    "https://sigpac-hubcloud.es/html/mvt/descServicio.html"
pede sigpac_wms.xml     "https://wms.mapa.gob.es/sigpac/wms?SERVICE=WMS&REQUEST=GetCapabilities"

echo "== Ambiente e água (MITECO, IGME)" | tee -a "$D/resumo.txt"
for t in Biodiversidad/RedNatura Biodiversidad/ENP Biodiversidad/MUP Agua/ZI_LaminasQ100 Agua/ZI_LaminasQ500 Agua/ZI_ZFP Agua/RiosCompletosv2 Agua/MasasAguaSub; do
  pede "miteco_$(echo "$t" | tr '/' '_').xml" "https://wms.mapama.gob.es/sig/$t/wms.aspx?request=GetCapabilities&service=WMS"
done
pede igme_pontos_agua.json "https://mapas.igme.es/gis/rest/services/BasesDatos/IGME_PuntosAgua/MapServer?f=json"
pede ocupacion_suelo.xml   "https://servicios.idee.es/wms-inspire/ocupacion-suelo?request=GetCapabilities&service=WMS"

echo "== Geocodificação e limites" | tee -a "$D/resumo.txt"
pede cartociudad.json  "https://www.cartociudad.es/geocoder/api/geocoder/candidates?q=Badajoz&limit=3"
pede api_features.json "https://api-features.idee.es/collections?f=json"

echo
echo "== Extractos"
grep -o '<wcs:CoverageId>[^<]*' "$D/wcs_mdt_caps.xml" 2>/dev/null | sed 's/<wcs:CoverageId>/coverage: /' | tee -a "$D/resumo.txt"
python3 -c 'import json,sys
try:
  d=json.load(open(sys.argv[1])); print("\n".join("api-coverages: "+c["id"] for c in d.get("collections",[])))
except Exception as e: print("api-coverages: sem JSON", e)' "$D/api_coverages.json" | tee -a "$D/resumo.txt"
grep -oE '(descargaDir|secuencial[A-Za-z]*|archivoDescarga|initDescargaDir)[^"<]{0,60}' "$D"/cnig_*.html 2>/dev/null | sort -u | head -20 | tee -a "$D/resumo.txt"
grep -c 'CadastralParcel' "$D/catastro_wfs_bbox.gml" 2>/dev/null | sed 's/^/catastro parcelas no bbox: /' | tee -a "$D/resumo.txt"
file "$D/pnoa_tile.jpg" | tee -a "$D/resumo.txt"
echo
echo "Pronto: $D/resumo.txt. Manda ao Claude o resumo e, se puderes, a pasta $D em zip."
