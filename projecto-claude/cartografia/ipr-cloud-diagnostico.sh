#!/bin/bash
# IPR Cloud: diagnóstico SÓ DE LEITURA no motor (reescrito a 21/10/2026). Não muda nada.
# Uso: sudo bash ~/cloud-1-11/ipr-cloud-diagnostico.sh 2>&1 | tee ~/diagnostico-cloud.txt
# Não mostra segredos: das variáveis do .env só aparecem os nomes e os valores de uma lista segura.
cd /opt/ipr-cloud || { echo "PARAR: não encontro /opt/ipr-cloud"; exit 1; }
CLI=/home/nms/.local/bin/qfieldcloud-cli
sep() { echo; echo "== $*"; }

sep "1. Data, versão e máquina"
date -Is; hostname
git describe --tags 2>/dev/null || echo "(sem git describe)"
uptime; free -h | head -2

sep "2. COMPOSE_FILE e contentores"
grep -E '^COMPOSE_FILE=' .env
docker compose ps --format 'table {{.Service}}\t{{.State}}\t{{.Status}}'

sep "3. Variáveis do .env (só nomes)"
grep -vE '^\s*(#|$)' .env | cut -d= -f1 | sort | tr '\n' ' '; echo
sep "3b. Valores das variáveis inofensivas"
grep -E '^(DEBUG|ENVIRONMENT|QFIELDCLOUD_HOST|QFIELDCLOUD_DEFAULT_LANGUAGE|QFIELDCLOUD_PASSWORD_LOGIN_IS_ENABLED|NGINX_PROXY_[A-Z_]*TIMEOUT|GUNICORN_TIMEOUT_S|GUNICORN_WORKERS|QFIELDCLOUD_WORKER_TIMEOUT_S|EMAIL_HOST|EMAIL_PORT|EMAIL_USE_TLS|EMAIL_USE_SSL|EMAIL_HOST_USER|DEFAULT_FROM_EMAIL|STORAGE_[A-Z_]*|ACCOUNT_[A-Z_]*|SOCIALACCOUNT_PROVIDERS)=' .env \
  | sed -E 's/("(secret|client_secret|key)"[[:space:]]*:[[:space:]]*")[^"]*/\1***/Ig'

sep "4. Disco e volumes (medição para a R2)"
df -h / /var/lib/docker 2>/dev/null
du -sh /var/lib/docker/volumes/* 2>/dev/null | sort -h | tail -15
ls -la /var/backups/ipr-cloud 2>/dev/null | tail -5

sep "5. nginx (configuração efectiva, só linhas-chave)"
docker compose exec -T nginx nginx -T 2>/dev/null | grep -nE 'server_name|listen|location|include|proxy_(read|send|connect)_timeout|client_max_body_size|auth_basic|allow|deny' | head -80
ls -la conf/ipr-marca/instance.d 2>/dev/null

sep "6. Acesso de fora (visto do motor)"
for u in / /admin/ /accounts/login/ /api/v1/status/; do
  printf '%-20s %s\n' "$u" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "https://cloud.terracruadesign.pt$u")"
done

sep "7. Planos, organizações, projectos (Django, só leitura)"
docker compose exec -T app python manage.py shell -c '
try:
    from qfieldcloud.subscription.models import Plan
    for p in Plan.objects.all():
        d = {k: v for k, v in p.__dict__.items() if not k.startswith("_")}
        print("PLANO", d)
except Exception as e:
    print("Planos: erro", type(e).__name__, e)
try:
    from qfieldcloud.core.models import Organization, Project, Person
    print("Pessoas:", Person.objects.count(), "| Organizações:", Organization.objects.count(), "| Projectos:", Project.objects.count())
    for o in Organization.objects.all()[:20]:
        print("ORG", o.username)
except Exception as e:
    print("Contagens: erro", type(e).__name__, e)
try:
    from django.conf import settings
    print("LANGUAGE_CODE", settings.LANGUAGE_CODE, "| LANGUAGES", [l[0] for l in settings.LANGUAGES])
    print("DEBUG", settings.DEBUG)
    print("Adapters", getattr(settings, "ACCOUNT_ADAPTER", ""), getattr(settings, "SOCIALACCOUNT_ADAPTER", ""))
except Exception as e:
    print("Settings: erro", type(e).__name__, e)
' 2>&1 | tail -60

sep "8. qfieldcloud-cli job-trigger --help"
if [ -x "$CLI" ]; then sudo -u nms "$CLI" job-trigger --help 2>&1 | head -30; else echo "(não encontro $CLI)"; fi

sep "9. O site visto do motor"
for u in /wp-json/tcd/v1/saude /wp-json/tcd/v1/oidc/.well-known/openid-configuration; do
  printf '%-55s %s\n' "$u" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "https://terracruadesign.pt$u")"
done

sep "10. Segurança do servidor"
ufw status 2>/dev/null | head -12
systemctl is-active fail2ban docker
apt list --upgradable 2>/dev/null | grep -ci security | sed 's/^/Actualizações de segurança: /'

echo; echo "== Fim. Nada foi mudado. Manda ao Claude o ficheiro ~/diagnostico-cloud.txt."
