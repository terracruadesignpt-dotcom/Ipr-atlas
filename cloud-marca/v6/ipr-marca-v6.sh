#!/bin/bash
# IPR Cloud · marca IPR v6 (30/10/2026). Tudo o que a v5 fazia (logótipo IPR, botão «Entrar com a Conta IPR», páginas em
# português) e, por cima, o logótipo IPR Cloud do Pedro Bolito (com o pulso de 4 s) e o verde noite #14200F do Atlas.
# Substitui a v5: não é preciso correr a v5 antes. Só mexe nos ficheiros servidos em /ipr-marca/ e no número de versão
# (?v=) da injecção; não toca no QFieldCloud nem nos contentores além de recarregar o nginx depois de o testar.
# Uso (no motor, utilizador nms):  sudo bash ipr-marca-v6.sh        |  desfazer:  sudo bash ipr-marca-v6.sh desfazer
set -euo pipefail
B=/opt/ipr-cloud/conf/ipr-marca
W=$B/www
C=$B/instance.d/ipr-marca.conf
U=https://cdn.jsdelivr.net/gh/terracruadesignpt-dotcom/Ipr-atlas@f6d5082c4b1d47bfc7c053b5b64d957e8ae9c911/cloud-marca/v6
cd /opt/ipr-cloud

testar_recarregar() {
  docker compose run --rm --no-deps nginx nginx -t
  docker compose exec -T nginx nginx -s reload
}

if [ "${1:-}" = "desfazer" ]; then
  [ -f "$W/ipr.css.antes-v6" ] || { echo "Não há cópia antes-v6: nada a desfazer."; exit 1; }
  cp -p "$W/ipr.css.antes-v6" "$W/ipr.css"; cp -p "$W/ipr.js.antes-v6" "$W/ipr.js"; cp -p "$C.antes-v6" "$C"
  testar_recarregar && echo "Desfeito: a Cloud voltou ao que estava antes da v6."
  exit 0
fi

T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
declare -A SHA=(
  [ipr-logo.png]=46a3265332909038205e8a58bd6b0dc5d5cd79394f13182c64a220beb4ce412a
  [ipr-sigla.png]=c984934affe6f885820b60da01a2ad7bfcab32e81bfb5a833c5dd3d78e94d2dc
  [ipr-v5.css]=725af68b1524a906316f32a4c08f4df9f481d157d41268f7a1f6b7a1b315df43
  [ipr-v6.css]=a65cab44c7341027e485bc5a436a27c7ad9a1d5d26e96a89819b98c8ab8eade2
  [ipr-cloud.svg]=d27ba2345f49d729ad806a68df9c6981ce37348da97b98d077db4527de75dab8
  [ipr.js]=f4838023af6c6f6f9ef9c08b58c7b9d5d082dab2d4cf4f5b9c145a877aa51a83
)
echo "== 1/4 Descarregar e conferir"
for f in "${!SHA[@]}"; do
  curl -fsSL "$U/$f" -o "$T/$f"
  echo "${SHA[$f]}  $T/$f" | sha256sum -c --quiet || { echo "sha256 errado em $f: parado, nada mudou."; exit 1; }
done
echo "== 2/4 Cópias"
[ -f "$W/ipr.css.antes-v6" ] || cp -p "$W/ipr.css" "$W/ipr.css.antes-v6"
[ -f "$W/ipr.js.antes-v6" ] || cp -p "$W/ipr.js" "$W/ipr.js.antes-v6"
[ -f "$C.antes-v6" ] || cp -p "$C" "$C.antes-v6"
# Base limpa do CSS: a de antes da v5, se a v5 já correu; senão, a de antes da v6.
BASE="$W/ipr.css.antes-v6"; [ -f "$W/ipr.css.antes-v5" ] && BASE="$W/ipr.css.antes-v5"
echo "== 3/4 Ficheiros"
install -m 644 "$T/ipr-logo.png" "$W/ipr-logo.png"
install -m 644 "$T/ipr-sigla.png" "$W/ipr-sigla.png"
install -m 644 "$T/ipr-cloud.svg" "$W/ipr-cloud.svg"
install -m 644 "$T/ipr.js" "$W/ipr.js"
cp -p "$BASE" "$W/ipr.css"; cat "$T/ipr-v5.css" "$T/ipr-v6.css" >> "$W/ipr.css"
sed -i -E 's/ipr\.css\?v=[0-9]+/ipr.css?v=6/g; s/ipr\.js\?v=[0-9]+/ipr.js?v=6/g' "$C"
grep -q 'ipr.css?v=6' "$C" || echo "Aviso: não encontrei ipr.css?v= em $C; os browsers podem mostrar a versão antiga umas horas."
echo "== 4/4 Testar e recarregar o nginx"
if ! testar_recarregar; then
  echo "O nginx recusou a configuração: a repor a anterior."
  cp -p "$C.antes-v6" "$C"; cp -p "$W/ipr.css.antes-v6" "$W/ipr.css"; cp -p "$W/ipr.js.antes-v6" "$W/ipr.js"; testar_recarregar || true; exit 1
fi
echo "Feito. Abrir https://cloud.regenerativo.pt/accounts/login/ (Ctrl+Shift+R): logótipo IPR Cloud, «Entrar com a Conta IPR», textos em português."
