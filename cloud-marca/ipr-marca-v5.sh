#!/bin/bash
# IPR Cloud · marca IPR v5 (28/10/2026). Troca o logótipo da Terracrua Design pelo do IPR, corrige o botão «Conta IPR»
# (imagem partida) e põe em português as páginas de entrada, saída, recuperação e erro. Só mexe nos ficheiros servidos
# em /ipr-marca/ e no número de versão (?v=) da injecção; não toca no QFieldCloud nem nos contentores além de recarregar
# o nginx depois de o testar.
# Uso (no motor, utilizador nms):  sudo bash ipr-marca-v5.sh        |  desfazer:  sudo bash ipr-marca-v5.sh desfazer
set -euo pipefail
B=/opt/ipr-cloud/conf/ipr-marca
W=$B/www
C=$B/instance.d/ipr-marca.conf
U=https://cdn.jsdelivr.net/gh/terracruadesignpt-dotcom/Ipr-atlas@8db848ce7f340e4eccd55ca83fd29f612fc4f3e1/cloud-marca/v5
cd /opt/ipr-cloud

testar_recarregar() {
  docker compose run --rm --no-deps nginx nginx -t
  docker compose exec -T nginx nginx -s reload
}

if [ "${1:-}" = "desfazer" ]; then
  [ -f "$W/ipr.css.antes-v5" ] || { echo "Não há cópia antes-v5: nada a desfazer."; exit 1; }
  cp -p "$W/ipr.css.antes-v5" "$W/ipr.css"; cp -p "$W/ipr.js.antes-v5" "$W/ipr.js"; cp -p "$C.antes-v5" "$C"
  testar_recarregar && echo "Desfeito: a Cloud voltou à marca v4."
  exit 0
fi

T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
declare -A SHA=(
  [ipr-logo.png]=46a3265332909038205e8a58bd6b0dc5d5cd79394f13182c64a220beb4ce412a
  [ipr-sigla.png]=c984934affe6f885820b60da01a2ad7bfcab32e81bfb5a833c5dd3d78e94d2dc
  [ipr-v5.css]=725af68b1524a906316f32a4c08f4df9f481d157d41268f7a1f6b7a1b315df43
  [ipr.js]=f4838023af6c6f6f9ef9c08b58c7b9d5d082dab2d4cf4f5b9c145a877aa51a83
)
echo "== 1/4 Descarregar e conferir"
for f in "${!SHA[@]}"; do
  curl -fsSL "$U/$f" -o "$T/$f"
  echo "${SHA[$f]}  $T/$f" | sha256sum -c --quiet || { echo "sha256 errado em $f: parado, nada mudou."; exit 1; }
done
echo "== 2/4 Cópias"
[ -f "$W/ipr.css.antes-v5" ] || cp -p "$W/ipr.css" "$W/ipr.css.antes-v5"
[ -f "$W/ipr.js.antes-v5" ] || cp -p "$W/ipr.js" "$W/ipr.js.antes-v5"
[ -f "$C.antes-v5" ] || cp -p "$C" "$C.antes-v5"
echo "== 3/4 Ficheiros"
install -m 644 "$T/ipr-logo.png" "$W/ipr-logo.png"
install -m 644 "$T/ipr-sigla.png" "$W/ipr-sigla.png"
install -m 644 "$T/ipr.js" "$W/ipr.js"
cp -p "$W/ipr.css.antes-v5" "$W/ipr.css"; cat "$T/ipr-v5.css" >> "$W/ipr.css"
sed -i -E 's/ipr\.css\?v=[0-9]+/ipr.css?v=5/g; s/ipr\.js\?v=[0-9]+/ipr.js?v=5/g' "$C"
grep -q 'ipr.css?v=5' "$C" || echo "Aviso: não encontrei ipr.css?v= em $C; os browsers podem mostrar a versão antiga umas horas."
echo "== 4/4 Testar e recarregar o nginx"
if ! testar_recarregar; then
  echo "O nginx recusou a configuração: a repor a anterior."
  cp -p "$C.antes-v5" "$C"; testar_recarregar || true; exit 1
fi
echo "Feito. Abrir https://cloud.regenerativo.pt/accounts/login/ (Ctrl+Shift+R): logótipo IPR, «Entrar com a Conta IPR», textos em português."
