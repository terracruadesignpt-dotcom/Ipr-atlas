#!/bin/bash
# Publica uma câmara copiada do SNIT (chamado pelo snit_pdm.py depois de cada câmara): anexa à versão snit-<distrito>
# e pede ao Worker ipr-copia-ficheiro que copie para o R2: pmtiles/snit/<srv>__<camada>.pmtiles, que o worker do motor lê por
# partes (1.0.121); o .tar desfaz-se em snit/<dico>/servico.json, cap.xml e legendas.
P="$1"; shift
W=https://ipr-copia-ficheiro.terracrua-ipr.workers.dev/
T="${SNIT_TAG:-}"; for f in "$@"; do case "$f" in *.tar) T="snit-${f:0:2}";; esac; done   # 24/11: plantas soltas vêm com SNIT_TAG
[ -z "$T" ] && exit 0
gh release view "$T" >/dev/null 2>&1 || gh release create "$T" -t "Plantas do PDM (SNIT) · distrito ${T#snit-}" -n "Cópia IPR Atlas das plantas do PDM publicadas no SNIT (DGT). Um PMTiles por planta; o .tar de cada câmara leva serviço, capacidades e legendas." >/dev/null
cd "$P"
for f in "$@"; do [ "${f##*.}" = tar ] || gh release upload "$T" "$f" --clobber; done
for f in "$@"; do
  case "$f" in *.pmtiles)
    for k in 1 2 3 4 5; do curl -sf -m 600 "$W?snit=$T/$f&ir=1" && break; sleep 20; done; echo
    rm -f "$f";;
  esac
done
# o .tar por último: é ele que marca a câmara como feita
for f in "$@"; do case "$f" in *.tar)
  gh release upload "$T" "$f" --clobber
  for k in 1 2 3; do curl -sf -m 120 "$W?snit=$T/$f&ir=1" && break; sleep 10; done; echo;;
esac; done
