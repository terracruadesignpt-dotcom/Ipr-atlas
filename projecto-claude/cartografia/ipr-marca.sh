#!/bin/bash
# IPR Cloud com a imagem da Terracrua Design (20/10/2026).
# Nao toca no codigo da Cloud: o nginx junta a cada pagina uma folha de estilo nossa.
# Desfazer: sudo bash ipr-marca.sh desfazer
set -euo pipefail
cd /opt/ipr-cloud
M=/opt/ipr-cloud/conf/ipr-marca
OV=docker-compose.override.marca.yml

desfazer() {
  echo "== A desfazer"
  sed -i 's#:docker-compose.override.marca.yml##' .env
  docker compose up -d nginx
  echo "== Cloud de volta ao aspecto original."
}
[ "${1:-}" = "desfazer" ] && { desfazer; exit 0; }

echo "== 1. Verificar que a pasta instance.d do nginx esta livre"
if [ -n "$(docker compose exec -T nginx sh -c 'ls -A /etc/nginx/instance.d 2>/dev/null' || true)" ]; then
  echo "PARAR: /etc/nginx/instance.d ja tem ficheiros. Manda-me o ecra."; exit 1
fi

echo "== 2. Escrever os ficheiros em $M"
mkdir -p "$M/instance.d" "$M/www"

cat > "$M/instance.d/ipr-marca.conf" <<'EOF'
# IPR Cloud: imagem Terracrua Design. Desfazer: sudo bash ipr-marca.sh desfazer
proxy_set_header Accept-Encoding "";
sub_filter_once on;
sub_filter '</head>' '<link rel="stylesheet" href="/ipr-marca/ipr.css?v=4"><script defer src="/ipr-marca/ipr.js?v=4"></script></head>';
location ^~ /ipr-marca/ {
    alias /var/www/ipr-marca/;
    expires 1h;
}
EOF

cat > "$M/www/ipr.css" <<'EOF'
/* IPR Cloud com os estilos do IPR Atlas (v4, 20/10/2026) */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Raleway:wght@500;600&display=swap');
:root{
  --a-ol:#75834a; --a-ol-t:#5f6b3a; --a-ol-bg:rgba(117,131,74,.14);
  --a-li:#f4f2ea; --a-bd:#e3dfcc; --a-bd2:#cfc9b4; --a-tx:#2f2f2a; --a-mu:#6b6f5c;
  --bs-primary:#75834a; --bs-primary-rgb:117,131,74;
  --bs-link-color:#5f6b3a; --bs-link-hover-color:#75834a;
  --bs-body-font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;
}
html,body,.btn,input,select,textarea,.nav-link,.card-title,h1,h2,h3,h4,h5,h6,p,td,th,label{
  font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif!important}
body{color:var(--a-tx)!important}
body,.content-wrapper,.content-wrapper>.content{background-color:var(--a-li)!important}

/* barra de topo */
.main-header,.navbar,.navbar.bg-dark,.navbar-dark,.bg-dark,.navbar-white{
  background-color:#fff!important;border-bottom:1px solid var(--a-bd)!important;box-shadow:none!important}
.navbar .nav-link,.navbar .navbar-brand,.navbar-dark .navbar-nav .nav-link{color:var(--a-tx)!important}

/* barra lateral, clara como no Atlas */
.main-sidebar,.main-sidebar .sidebar,.brand-link{
  background-color:#fff!important;box-shadow:none!important}
.main-sidebar{border-right:1px solid var(--a-bd)!important}
.brand-link,.user-panel{border-bottom:1px solid var(--a-bd)!important}
.brand-link .brand-text{font-family:Raleway,sans-serif!important;color:var(--a-ol)!important;font-weight:600!important}
.main-sidebar a,.main-sidebar .nav-link,.user-panel a{color:var(--a-tx)!important}
.nav-sidebar .nav-link:hover{background-color:var(--a-li)!important}
.nav-sidebar .nav-link.active{background-color:var(--a-ol-bg)!important;color:var(--a-ol-t)!important;box-shadow:inset 2px 0 0 var(--a-ol)!important}
.nav-sidebar .nav-icon{color:var(--a-mu)!important}
.nav-header{color:var(--a-mu)!important;text-transform:uppercase;letter-spacing:.12em;font-size:11px!important}

/* cartões */
.card{background-color:#fff!important;border:1px solid var(--a-bd)!important;border-radius:4px!important;box-shadow:none!important}
.card-header{background-color:#fff!important;border-bottom:1px solid var(--a-bd)!important}
.card-title,.card-header h5,.card-header .card-title{font-size:12px!important;font-weight:600!important;
  text-transform:uppercase;letter-spacing:.12em;color:var(--a-tx)!important}
.content-header h1{font-family:Raleway,sans-serif!important;font-weight:600!important;color:var(--a-tx)!important}
.table td,.table th{border-color:var(--a-bd)!important}

/* ligações */
.content a:not(.btn),.breadcrumb a,.table a:not(.btn){color:var(--a-ol-t)!important}
.content a:not(.btn):hover{color:var(--a-ol)!important}

/* botões: primário oliva, secundário linho */
.btn{border-radius:4px!important;box-shadow:none!important}
.btn.btn-success,.btn.btn-primary{background-color:var(--a-ol)!important;border:1px solid var(--a-ol)!important;color:#fff!important}
.btn.btn-info,.btn.btn-secondary,.btn.btn-default,.btn.btn-outline-primary{
  background-color:var(--a-li)!important;border:1px solid var(--a-bd2)!important;color:var(--a-tx)!important}
.btn:hover{filter:brightness(.95)}
.form-control,.form-select{border:1px solid var(--a-bd2)!important;border-radius:4px!important}
.form-control:focus,.form-select:focus{border-color:var(--a-ol)!important;box-shadow:0 0 0 2px var(--a-ol-bg)!important}
.badge-primary,.bg-primary,.page-item.active .page-link{background-color:var(--a-ol)!important;border-color:var(--a-ol)!important;color:#fff!important}

/* logótipo */
.brand-link .brand-image{content:url(/ipr-marca/logo.png);max-height:26px!important;width:auto!important;
  float:none!important;opacity:1!important;box-shadow:none!important;filter:none!important}
img[src*="/staticfiles/logo_sidetext"]{content:url(/ipr-marca/logo.png);height:32px;width:auto;filter:none}
img[src*="/staticfiles/logo_undertext"]{content:url(/ipr-marca/logo.png);max-width:260px;height:auto}
EOF

echo 'document.title=document.title.replace(/QFieldCloud/g,"IPR Cloud");document.querySelectorAll(".brand-text").forEach(function(e){e.textContent="IPR Cloud"});' > "$M/www/ipr.js"

echo "== 3. Buscar o logotipo ao site"
curl -fsSL -o "$M/www/logo.png" https://terracruadesign.pt/wp-content/uploads/2023/05/TCD-Horizontal.png
head -c 8 "$M/www/logo.png" | grep -q PNG || { echo "PARAR: o logotipo nao veio como PNG."; exit 1; }
chmod -R a+rX "$M"

echo "== 4. Juntar a peca a Cloud"
cat > "$OV" <<EOF
services:
  nginx:
    volumes:
      - $M/instance.d:/etc/nginx/instance.d:ro
      - $M/www:/var/www/ipr-marca:ro
EOF
cp -n .env .env.antes-marca
grep -q 'override.marca' .env || sed -i '/^COMPOSE_FILE=/s/$/:docker-compose.override.marca.yml/' .env
grep ^COMPOSE_FILE .env

echo "== 5. Testar a configuracao antes de aplicar"
if ! docker compose run --rm --no-deps nginx nginx -t; then
  echo "PARAR: o teste falhou. Nada foi aplicado."; sed -i 's#:docker-compose.override.marca.yml##' .env; exit 1
fi

echo "== 6. Aplicar"
docker compose up -d nginx
sleep 4
P=$(curl -s https://cloud.terracruadesign.pt/accounts/login/)
C=$(curl -s -o /dev/null -w '%{http_code}' https://cloud.terracruadesign.pt/ipr-marca/ipr.css)
if echo "$P" | grep -q ipr-marca && [ "$C" = 200 ]; then
  echo "== Pronto. A Cloud ja tem a imagem da Terracrua Design (folha: $C)."
else
  echo "== A verificacao falhou (folha: $C). A desfazer."; desfazer; exit 1
fi
