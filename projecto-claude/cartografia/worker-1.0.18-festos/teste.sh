#!/usr/bin/env bash
# Simulação do instalar-festos.sh numa árvore falsa de /opt/tcd-worker
set -u
D=$(cd "$(dirname "$0")" && pwd); S=$D/instalar-festos.sh
prep() { # $1 = conteúdo do terreno.py, $2 = VERSION
  R=$(mktemp -d); mkdir -p $R/versoes/1.0.18 $R/dados $R/bin
  printf '%s\n' "$1" > $R/versoes/1.0.18/terreno.py; echo "${2:-1.0.18}" > $R/versoes/1.0.18/VERSION
  cat > $R/versoes/1.0.18/W.py <<'P'
def negate(x): return ('neg', x)
def fill_depressions(x, fix_flats=False): return ('fill', x, fix_flats)
def d8_pointer(x): return ('d8', x)
P
  ln -s $R/versoes/1.0.18 $R/actual
  printf '#!/bin/sh\n[ "$1" = is-active ] && exit ${FALHA_ARRANQUE:-0}; exit 0\n' > $R/bin/sc; printf '#!/bin/sh\necho ${JOURNAL:-ok}\n' > $R/bin/jc; chmod +x $R/bin/*
  export TCD_RAIZ=$R TCD_PY=python3 TCD_DADOS=$R/dados TCD_REG=$R/log TCD_SYSCTL=$R/bin/sc TCD_JCTL=$R/bin/jc TCD_COMO= TCD_ESPERA=0
}
BOM='import W
def festos(mdt):
    fill = W.fill_depressions(mdt, fix_flats=True)
    registo = print
    registo("Festos (MDT invertido)")
    neg = W.negate(fill)
    pn = W.d8_pointer(neg)
    return pn'
ok=0; falha=0
t() { if [ "$1" = "$2" ]; then echo "  ok   $3"; ok=$((ok+1)); else echo "  FALHA $3 (esperado $2, deu $1)"; falha=$((falha+1)); fi; }

prep "$BOM"; bash $S >/dev/null 2>&1; r=$?; t $r 0 "instalação normal"
t "$(readlink $TCD_RAIZ/actual)" "$TCD_RAIZ/versoes/1.0.18-festos" "ligação actual troca"
grep -q 'neg = W.fill_depressions(W.negate(fill), fix_flats=True)' $TCD_RAIZ/actual/terreno.py; t $? 0 "linha nova correcta"
(cd $TCD_RAIZ/actual && python3 -c "import terreno; r=terreno.festos('m'); assert r==('d8',('fill',('neg',('fill','m',True)),True)),r"); t $? 0 "festos passa pelo fill_depressions"
diff <(grep -v 'neg = ' $TCD_RAIZ/versoes/1.0.18/terreno.py) <(grep -v 'neg = ' $TCD_RAIZ/actual/terreno.py) >/dev/null; t $? 0 "resto do ficheiro igual"
grep -q 'neg = W.negate(fill)$' $TCD_RAIZ/versoes/1.0.18/terreno.py; t $? 0 "original intacto"
bash $S >/dev/null 2>&1; t $? 0 "segunda execução: nada a fazer"
grep -q 'Nada a fazer' $TCD_RAIZ/log; t $? 0 "  ... e diz nada a fazer"
bash $S repor >/dev/null 2>&1; t "$(readlink $TCD_RAIZ/actual)" "$TCD_RAIZ/versoes/1.0.18" "repor volta ao 1.0.18"

prep "$BOM" 1.0.17; bash $S >/dev/null 2>&1; t $? 1 "worker no 1.0.17: pára"
prep "$BOM"; touch $TCD_DADOS/em_curso.json; bash $S >/dev/null 2>&1; t $? 1 "encomenda a meio: pára"
bash $S --forcar >/dev/null 2>&1; t $? 0 "--forcar instala"
prep "${BOM/neg = W.negate(fill)/neg = W.negate(fill) * 1}"; bash $S >/dev/null 2>&1; t $? 1 "linha diferente: pára"
t "$(readlink $TCD_RAIZ/actual)" "$TCD_RAIZ/versoes/1.0.18" "  ... sem trocar nada"
prep "$BOM
    neg = W.negate(fill)"; bash $S >/dev/null 2>&1; t $? 1 "duas linhas: pára"
prep "${BOM/fill = W.fill_depressions(mdt, fix_flats=True)/fill = W.breach(mdt)}"; bash $S >/dev/null 2>&1; t $? 1 "sem fill_depressions: pára"
Q="'saida.tif', fix_flats=True)"; prep "${BOM/fix_flats=True)/$Q}"; grep -q "'saida.tif'" $TCD_RAIZ/actual/terreno.py; t $? 0 "  (preparação com aspas)"; bash $S >/dev/null 2>&1; t $? 1 "fill_depressions com caminho entre aspas: pára"
prep "${BOM/fix_flats=True)/saida, fix_flats=True)}"; bash $S >/dev/null 2>&1; t $? 1 "fill_depressions com 2.º argumento posicional: pára"
prep "${BOM/fix_flats=True)/fix_flats=True, flat_increment=0.001)}"; bash $S >/dev/null 2>&1; t $? 0 "vários argumentos nomeados: instala"
grep -q 'W.fill_depressions(W.negate(fill), fix_flats=True, flat_increment=0.001)' $TCD_RAIZ/actual/terreno.py; t $? 0 "  ... e copia-os"
prep "${BOM/return pn/return pn +}"; bash $S >/dev/null 2>&1; t $? 1 "erro de sintaxe: pára"
t "$(readlink $TCD_RAIZ/actual)" "$TCD_RAIZ/versoes/1.0.18" "  ... sem trocar nada"
prep "$BOM"; JOURNAL=Traceback bash $S >/dev/null 2>&1; t $? 1 "Traceback no arranque: repõe"
t "$(readlink $TCD_RAIZ/actual)" "$TCD_RAIZ/versoes/1.0.18" "  ... e volta ao 1.0.18"
prep "$BOM"; FALHA_ARRANQUE=3 bash $S >/dev/null 2>&1; t $? 1 "serviço não arranca: repõe"
echo "$ok ok, $falha falhas"
