"""
IPR Cloud: espelho do site na Cloud (sincronizador). 20/10/2026.

O site (terracruadesign.pt) manda nas pessoas, organizacoes, equipas e
colaboradores. Este guiao le o estado desejado (JSON da rota
/tcd/v1/cloud/espelho) e aplica na Cloud so as diferencas.

Corre DENTRO do contentor `app` do QFieldCloud, com o ORM do Django:
    docker compose cp espelho.json app:/tmp/espelho.json
    docker compose cp ipr_sync.py app:/tmp/ipr_sync.py
    docker compose exec -T -e IPR_SYNC_CORRER=1 -e IPR_APLICAR=0 app python manage.py shell -c "exec(open('/tmp/ipr_sync.py').read())"

Regras (atlas/ipr-cloud-sincronizacao-site-2026-10-20.md):
- Por omissao e ENSAIO: so lista. Aplica apenas com IPR_APLICAR=1.
- So toca em contas geridas: pessoas `u<ID>`, organizacoes e equipas
  listadas no espelho, ou ja marcadas como geridas. Nunca no ipr-admin.
- Acesso a projectos so por colaboracao directa. As equipas so arrumam.
- `default_project_role_for_members` fica sempre vazio (sem acesso implicito).
- Nada se apaga: pessoas desactivam-se; colaboracoes e pertencas retiram-se.
- Projectos nao se criam aqui (isso e a entrega da Base). Em falta = aviso.
"""

import json
import os
import re
import sys
from datetime import datetime, timezone

GERIDA = re.compile(r"^u\d+$")
# Organizacoes geridas pelo espelho. Nas da Terracrua Design (ipr, tcd-*) o espelho manda em tudo;
# nas dos clientes Base (c*) e dos profissionais (p*) so manda no dono: o resto e deles (convites).
ORG_GERIDA = re.compile(r"^(ipr|tcd-[ct]\d+|[cp]\d+)$")
ORG_TOTAL = re.compile(r"^(ipr|tcd-[ct]\d+)$")
MAX_DESACTIVAR = 0.2   # travao: recusa desactivar mais de 20 % das pessoas geridas de uma vez
PAPEIS_PROJ = {"admin", "manager", "editor", "reporter", "reader"}
PAPEIS_ORG = {"admin", "creator", "member"}
PROTEGIDAS = {"ipr-admin"}


# ---------------------------------------------------------------- validar
def validar(esp):
    """Recusa espelhos estragados antes de tocar em seja o que for."""
    erros = []
    if esp.get("versao") != 1:
        erros.append("versao do espelho diferente de 1")
    pessoas = esp.get("pessoas", [])
    ids = set()
    for p in pessoas:
        u = p.get("utilizador", "")
        if not GERIDA.match(u) or len(u) < 3:
            erros.append(f"pessoa com nome invalido (u + pelo menos 2 algarismos): {u!r}")
        if u in ids:
            erros.append(f"pessoa repetida: {u}")
        ids.add(u)
        if not p.get("email"):
            erros.append(f"pessoa sem e-mail: {u}")
    activas = {p["utilizador"] for p in pessoas if p.get("activa", True)}
    for o in esp.get("organizacoes", []):
        n = o.get("nome", "")
        if not re.match(r"^[a-z][a-z0-9_-]{2,}$", n):
            erros.append(f"organizacao com nome invalido: {n!r}")
        if o.get("dono") not in ids and o.get("dono") != esp.get("conta_servico"):
            erros.append(f"{n}: dono desconhecido {o.get('dono')!r}")
        for m in o.get("membros", []):
            if m.get("papel") not in PAPEIS_ORG:
                erros.append(f"{n}: papel de membro invalido {m.get('papel')!r}")
            if m.get("utilizador") not in activas:
                erros.append(f"{n}: membro nao activo ou desconhecido {m.get('utilizador')}")
        for e in o.get("equipas", []):
            if not re.match(r"^[a-z][a-z0-9_-]{1,}$", e.get("nome", "")):
                erros.append(f"{n}: equipa com nome invalido {e.get('nome')!r}")
    for pr in esp.get("projectos", []):
        for c in pr.get("colaboradores", []):
            if c.get("papel") not in PAPEIS_PROJ:
                erros.append(f"{pr.get('org')}/{pr.get('nome')}: papel invalido {c.get('papel')!r}")
            if c.get("utilizador") not in activas:
                erros.append(f"{pr.get('org')}/{pr.get('nome')}: colaborador nao activo {c.get('utilizador')}")
    # travao: um espelho vazio ou muito menor que o habitual nao se aplica
    if len(pessoas) == 0:
        erros.append("espelho sem pessoas: recusado (protege contra desactivar toda a gente)")
    return erros


# ---------------------------------------------------------------- planear
def planear(esp, actual):
    """Compara desejado com actual. Funcao pura: devolve lista de accoes.

    actual = {
      "pessoas": {utilizador: {"email","nome","apelido","activa","sso"}},
      "organizacoes": {nome: {"dono","papel_omissao","membros":{u:papel},
                               "equipas":{equipa:set(u)}, "gerida":bool}},
      "projectos": {(org,nome): {"colaboradores":{u:(papel,invisivel)}}},
    }
    """
    acc = []
    desejadas = {p["utilizador"]: p for p in esp["pessoas"]}

    # pessoas
    for u, p in desejadas.items():
        a = actual["pessoas"].get(u)
        if a is None:
            if p.get("activa", True):
                acc.append(("criar_pessoa", u, p))
            continue
        mud = {k: p.get(k, "") for k in ("email", "nome", "apelido")
               if p.get(k, "") != a.get(k, "")}
        if bool(p.get("activa", True)) != bool(a.get("activa")):
            mud["activa"] = bool(p.get("activa", True))
        if mud:
            acc.append(("actualizar_pessoa", u, mud))
        if p.get("sso") and a.get("sso") != str(p["sso"]):
            acc.append(("ligar_sso", u, str(p["sso"])))
    for u, a in actual["pessoas"].items():
        if GERIDA.match(u) and u not in desejadas and a.get("activa"):
            acc.append(("actualizar_pessoa", u, {"activa": False}))

    # organizacoes do espelho
    vistas = set()
    for o in esp.get("organizacoes", []):
        n = o["nome"]
        vistas.add(n)
        total = bool(ORG_TOTAL.match(n))
        a = actual["organizacoes"].get(n)
        if a is None:
            # os convites dao-se so na criacao: repor a cada passagem dava convites ilimitados
            acc.append(("criar_organizacao", n, {"dono": o["dono"], "titulo": o.get("titulo", n),
                                                 "convites": int(o.get("convites", 0))}))
            a = {"dono": o["dono"], "papel_omissao": None, "membros": {}, "equipas": {}}
        else:
            if a["dono"] != o["dono"]:
                acc.append(("mudar_dono", n, o["dono"]))
            if a.get("papel_omissao"):
                acc.append(("limpar_papel_omissao", n, None))
        quer = {m["utilizador"]: m["papel"] for m in o.get("membros", []) if m["utilizador"] != o["dono"]}
        for u, papel in quer.items():
            if a["membros"].get(u) != papel:
                acc.append(("membro", n, (u, papel)))
        if total:  # nas organizacoes dos clientes Base e dos profissionais, os membros sao deles
            for u in a["membros"]:
                if u not in quer and (GERIDA.match(u) or u == esp.get("conta_servico")) and u != o["dono"]:
                    acc.append(("retirar_membro", n, u))
        for e in o.get("equipas", []):
            ja = a["equipas"].get(e["nome"])
            if ja is None:
                acc.append(("criar_equipa", n, e["nome"]))
                ja = set()
            quer_e = set(e.get("membros", []))
            for u in sorted(quer_e - ja):
                acc.append(("membro_equipa", n, (e["nome"], u)))
            for u in sorted(ja - quer_e):
                if GERIDA.match(u):
                    acc.append(("retirar_membro_equipa", n, (e["nome"], u)))

    # organizacoes da Terracrua Design que sairam do espelho: retirar as pessoas geridas (sem apagar nada)
    for n, a in actual["organizacoes"].items():
        if n in vistas or not ORG_TOTAL.match(n):
            continue
        for u in a["membros"]:
            if GERIDA.match(u) and u != a["dono"]:
                acc.append(("retirar_membro", n, u))

    # projectos (so colaboradores; projectos inexistentes = aviso)
    pvistos = set()
    for pr in esp.get("projectos", []):
        k = (pr["org"], pr["nome"])
        pvistos.add(k)
        a = actual["projectos"].get(k)
        if a is None:
            acc.append(("aviso_projecto_em_falta", k, None))
            continue
        quer = {c["utilizador"]: (c["papel"], bool(c.get("invisivel", False)))
                for c in pr.get("colaboradores", [])}
        for u, v in quer.items():
            if a["colaboradores"].get(u) != v:
                acc.append(("colaborador", k, (u, v[0], v[1])))
        if ORG_TOTAL.match(pr["org"]):
            for u in a["colaboradores"]:
                if u not in quer and GERIDA.match(u):
                    acc.append(("retirar_colaborador", k, u))
    for k, a in actual["projectos"].items():
        if k in pvistos or not ORG_TOTAL.match(k[0]):
            continue
        for u in a["colaboradores"]:
            if GERIDA.match(u):
                acc.append(("retirar_colaborador", k, u))
    return acc


def travao(acc, actual):
    """Recusa planos que desactivam demasiada gente de uma vez (espelho estragado, dependencia em falta)."""
    geridas = [u for u, a in actual["pessoas"].items() if GERIDA.match(u) and a.get("activa")]
    desact = [a for a in acc if a[0] == "actualizar_pessoa" and a[2].get("activa") is False]
    if len(desact) > max(3, MAX_DESACTIVAR * len(geridas)):
        return f"recusado: desactivava {len(desact)} de {len(geridas)} pessoas (limite {int(MAX_DESACTIVAR*100)} %)"
    return None


# ---------------------------------------------------------------- ORM
def ler_actual(esp):  # pragma: no cover (corre so dentro da Cloud)
    from allauth.socialaccount.models import SocialAccount
    from qfieldcloud.core.models import (Organization, OrganizationMember, Person,
                                         ProjectCollaborator, Team, TeamMember)
    from qfieldcloud.project.models import Project

    prov = esp.get("sso_fornecedor", "terracrua")
    actual = {"pessoas": {}, "organizacoes": {}, "projectos": {}}
    sso = {s.user_id: s.uid for s in SocialAccount.objects.filter(provider=prov)}
    for p in Person.objects.filter(username__regex=r"^u\d+$"):
        actual["pessoas"][p.username] = {
            "email": p.email, "nome": p.first_name, "apelido": p.last_name,
            "activa": p.is_active, "sso": sso.get(p.pk)}
    # todas as organizacoes geridas, incluindo as que ja sairam do espelho (para as limpar)
    for org in Organization.objects.filter(username__regex=ORG_GERIDA.pattern):
        membros = {m.member.username: m.role
                   for m in OrganizationMember.objects.filter(organization=org).select_related("member")}
        equipas = {}
        for t in Team.objects.filter(team_organization=org):
            equipas[t.teamname] = {tm.member.username for tm in
                                   TeamMember.objects.filter(team=t).select_related("member")}
        actual["organizacoes"][org.username] = {
            "dono": org.organization_owner.username,
            "papel_omissao": org.default_project_role_for_members,
            "membros": membros, "equipas": equipas}
    for proj in Project.objects.filter(owner__username__in=list(actual["organizacoes"])).select_related("owner"):
        col = {c.collaborator.username: (c.role, c.is_incognito)
               for c in ProjectCollaborator.objects.filter(project=proj).select_related("collaborator")}
        actual["projectos"][(proj.owner.username, proj.name)] = {"colaboradores": col}
    return actual


def aplicar(esp, acc, registo):  # pragma: no cover
    from allauth.socialaccount.models import SocialAccount
    from django.db import transaction
    from qfieldcloud.core.models import (Organization, OrganizationMember, Person,
                                         ProjectCollaborator, Team, TeamMember, User)
    from qfieldcloud.project.models import Project

    prov = esp.get("sso_fornecedor", "terracrua")
    pessoas = {p["utilizador"]: p for p in esp["pessoas"]}

    def pessoa(u):
        return Person.objects.get(username=u)

    def org(n):
        return Organization.objects.get(username=n)

    def ligar(p, uid):
        # a ligacao ao site e pelo numero da conta; nunca se rouba uma ligacao que ja e de outra pessoa
        sa = SocialAccount.objects.filter(provider=prov, uid=uid).first()
        if sa and sa.user_id != p.pk:
            raise ValueError(f"o id {uid} do site ja esta ligado a outra conta da Cloud ({sa.user_id})")
        SocialAccount.objects.filter(provider=prov, user=p).exclude(uid=uid).delete()
        if not sa:
            SocialAccount.objects.create(provider=prov, uid=uid, user=p)

    for tipo, alvo, dados in acc:
        try:
            with transaction.atomic():
                if tipo == "criar_pessoa":
                    p = Person(username=alvo, email=dados["email"],
                               first_name=dados.get("nome", ""), last_name=dados.get("apelido", ""))
                    p.set_unusable_password()  # so entra pelo site (SSO)
                    p.full_clean()
                    p.save()
                    if dados.get("sso"):
                        ligar(p, str(dados["sso"]))
                elif tipo == "actualizar_pessoa":
                    p = pessoa(alvo)
                    if "email" in dados: p.email = dados["email"]
                    if "nome" in dados: p.first_name = dados["nome"]
                    if "apelido" in dados: p.last_name = dados["apelido"]
                    if "activa" in dados: p.is_active = dados["activa"]
                    p.full_clean()
                    p.save()
                elif tipo == "ligar_sso":
                    ligar(pessoa(alvo), dados)
                elif tipo == "criar_organizacao":
                    if dados["dono"] == esp.get("conta_servico") and not Person.objects.filter(
                            username=dados["dono"]).exists():
                        srv = Person(username=dados["dono"], email="cloud@terracruadesign.pt",
                                     first_name="Terracrua Design")
                        srv.set_unusable_password()
                        srv.save()
                    dono = Person.objects.get(username=dados["dono"])
                    o = Organization(username=alvo, organization_owner=dono, created_by=dono,
                                     first_name=dados.get("titulo", alvo),
                                     default_project_role_for_members=None)
                    o.save()
                    if dados.get("convites"):
                        dono.remaining_invitations = max(dono.remaining_invitations, dados["convites"])
                        dono.save(update_fields=["remaining_invitations"])
                elif tipo == "mudar_dono":
                    o = org(alvo)
                    o.organization_owner = Person.objects.get(username=dados)
                    o.save()
                elif tipo == "limpar_papel_omissao":
                    o = org(alvo)
                    o.default_project_role_for_members = None
                    o.save()
                elif tipo == "membro":
                    u, papel = dados
                    m, _ = OrganizationMember.objects.get_or_create(
                        organization=org(alvo), member=pessoa(u) if GERIDA.match(u) else User.objects.get(username=u),
                        defaults={"role": papel})
                    if m.role != papel:
                        m.role = papel
                        m.save()
                elif tipo == "retirar_membro":
                    OrganizationMember.objects.filter(organization=org(alvo), member__username=dados).delete()
                elif tipo == "criar_equipa":
                    o = org(alvo)
                    Team.objects.create(username=Team.format_team_name(alvo, dados), team_organization=o)
                elif tipo == "membro_equipa":
                    e, u = dados
                    t = Team.objects.get(username=Team.format_team_name(alvo, e))
                    TeamMember.objects.get_or_create(team=t, member=pessoa(u))
                elif tipo == "retirar_membro_equipa":
                    e, u = dados
                    TeamMember.objects.filter(team__username=Team.format_team_name(alvo, e),
                                              member__username=u).delete()
                elif tipo == "colaborador":
                    u, papel, inv = dados
                    proj = Project.objects.get(owner__username=alvo[0], name=alvo[1])
                    c = ProjectCollaborator.objects.filter(project=proj, collaborator__username=u).first()
                    if c is None:
                        c = ProjectCollaborator(project=proj, collaborator=pessoa(u))
                    c.role, c.is_incognito = papel, inv
                    c.full_clean()  # aplica os limites do plano (pessoas por projecto, premium)
                    c.save()
                elif tipo == "retirar_colaborador":
                    proj = Project.objects.get(owner__username=alvo[0], name=alvo[1])
                    ProjectCollaborator.objects.filter(project=proj, collaborator__username=dados).delete()
                registo(tipo, alvo, dados, "feito")
        except Exception as e:  # uma falha nao trava as restantes
            registo(tipo, alvo, dados, f"falhou: {type(e).__name__}: {e}")


# ---------------------------------------------------------------- correr
def main():  # pragma: no cover
    caminho = os.environ.get("IPR_ESPELHO", "/tmp/espelho.json")
    aplicar_ = os.environ.get("IPR_APLICAR") == "1"
    esp = json.load(open(caminho, encoding="utf-8"))
    erros = validar(esp)
    if erros:
        print("ESPELHO RECUSADO:")
        for e in erros:
            print("  -", e)
        sys.exit(2)
    actual = ler_actual(esp)
    acc = planear(esp, actual)
    hora = datetime.now(timezone.utc).isoformat(timespec="seconds")
    parar = travao(acc, actual)
    if parar and aplicar_:
        print("ESPELHO RECUSADO:", parar)
        sys.exit(3)
    linhas = []

    def registo(tipo, alvo, dados, estado):
        linhas.append({"hora": hora, "tipo": tipo, "alvo": str(alvo), "dados": str(dados), "estado": estado})
        print(f"{estado:>8}  {tipo:<24} {alvo}  {dados}")

    print(f"== {'APLICAR' if aplicar_ else 'ENSAIO'}: {len(acc)} alteracoes" + (f"  [AVISO: {parar}]" if parar else ""))
    if aplicar_:
        aplicar(esp, acc, registo)
    else:
        for a in acc:
            registo(*a, "ensaio")
    falhas = sum(1 for l in linhas if l["estado"].startswith("falhou"))
    resumo = {"hora": hora, "modo": "aplicar" if aplicar_ else "ensaio",
              "alteracoes": len(acc), "falhas": falhas, "linhas": linhas}
    with open("/tmp/ipr-sync-ultimo.json", "w", encoding="utf-8") as f:
        json.dump(resumo, f, ensure_ascii=False, indent=1)
    print(f"== fim: {len(acc)} alteracoes, {falhas} falhas")


# Corre so quando chamado de proposito (dentro do `manage.py shell`); importar para testes nao corre nada.
if os.environ.get("IPR_SYNC_CORRER") == "1":
    main()
