#!/bin/bash
# IPR Cloud: /admin/ passa a pedir uma palavra-passe extra antes da do Django (achado T-011, 20/10/2026).
# Nao toca no codigo da Cloud: junta um ficheiro ao instance.d do nginx (o mesmo gancho da imagem da Terracrua Design).
# Desfazer: sudo bash ipr-admin-fecho.sh desfazer
set -euo pipefail
cd /opt/ipr-cloud
D=/opt/ipr-cloud/conf/ipr-marca/instance.d
F=$D/ipr-admin.conf
P=$D/ipr-admin.htpasswd

if [ "${1:-}" = "desfazer" ]; then
  rm -f "$F" "$P"
  docker compose exec -T nginx nginx -s reload
  echo "== /admin/ volta a estar como antes."; exit 0
fi

[ -d "$D" ] || { echo "PARAR: falta $D. Manda-me o ecra."; exit 1; }
[ -e "$F" ] && { echo "PARAR: $F ja existe. Para refazer: sudo bash ipr-admin-fecho.sh desfazer"; exit 1; }

echo "== 1. Ler o bloco 'location /' que encaminha para a Cloud"
docker compose exec -T nginx cat /etc/nginx/conf.d/default.conf > /tmp/ipr-default.conf
BLOCO=$(awk '
  !f && /^[[:space:]]*location[[:space:]]+\/[[:space:]]*\{/ { f=1; b=""; n=0 }
  f { b = b $0 "\n"; t=$0; o=gsub(/\{/,"{",t); c=gsub(/\}/,"}",t); n += o-c;
      if (n==0) { if (b ~ /proxy_pass/) { printf "%s", b; exit } f=0 } }
' /tmp/ipr-default.conf)
echo "$BLOCO" | grep -q proxy_pass || { echo "PARAR: nao encontrei o bloco com proxy_pass. Manda-me o ecra."; exit 1; }

echo "== 2. Palavra-passe extra para o /admin/ (utilizador: ipr)"
read -rsp "Nova palavra-passe: " S1; echo
read -rsp "Repetir: " S2; echo
[ -n "$S1" ] && [ "$S1" = "$S2" ] || { echo "PARAR: vazia ou diferente."; exit 1; }
printf 'ipr:%s\n' "$(openssl passwd -apr1 "$S1")" > "$P"
unset S1 S2
chmod 644 "$P"

echo "== 3. Escrever $F"
{
  echo "# IPR Cloud: /admin/ com palavra-passe extra (T-011). Desfazer: sudo bash ipr-admin-fecho.sh desfazer"
  printf '%s\n' "$BLOCO" | sed '1s#.*#location ^~ /admin/ {\n    auth_basic "IPR Cloud";\n    auth_basic_user_file /etc/nginx/instance.d/ipr-admin.htpasswd;\n    proxy_set_header Accept-Encoding "";#'
} > "$F"

echo "== 4. Testar e aplicar"
if ! docker compose exec -T nginx test -f /etc/nginx/instance.d/ipr-admin.conf; then
  rm -f "$F" "$P"; echo "PARAR: o nginx nao ve a pasta instance.d. Nada mudou. Manda-me o ecra."; exit 1
fi
if ! docker compose exec -T nginx nginx -t; then
  rm -f "$F" "$P"; echo "PARAR: o nginx recusou a configuracao. Nada mudou. Manda-me o ecra."; exit 1
fi
docker compose exec -T nginx nginx -s reload
sleep 2

echo "== 5. Provas"
A=$(curl -s -o /dev/null -w '%{http_code}' https://cloud.terracruadesign.pt/admin/)
R=$(curl -s -o /dev/null -w '%{http_code}' https://cloud.terracruadesign.pt/)
echo "/admin/ sem palavra-passe: $A (esperado 401)"
echo "/ (entrada normal):        $R (esperado 200 ou 302)"
[ "$A" = "401" ] && echo "== Feito." || echo "ATENCAO: o /admin/ nao deu 401. Manda-me o ecra."
