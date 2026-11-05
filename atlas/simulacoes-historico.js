/* IPR Atlas · «As minhas simulações»: histórico de todas as simulações da pessoa, de todas as Bases, água e fogo.
   Pedido do Nuno, 04/11/2026, 11h55: «Para ver as simulações guardadas tem que se fingir que se vai iniciar uma simulação
   (Processos › Simular água › escolher Base). Quem já tem simulações e quer ver o histórico tem de o ter disponível logo.
   E ainda não vejo o botão de partilhar resultados em todas as simulações.»
   1. Acesso directo «As minhas simulações», sempre visível com sessão: no bloco «Simuladores» do painel Processos
      (#ipr-t62 > .ipr-sims, do fogo-simulador.js; sem esse bloco, numa caixa própria no topo do #ipr-t62) e no topo do
      Atlas, ao lado de «Oficina» (#ipr-painel-b), só quando esse botão existe e o ecrã é largo.
   2. Painel com as simulações de todas as Bases entregues da pessoa (no máximo 12 Bases), da mais recente para a mais
      antiga: tipo, Base, data, estado, «Ver» e «Partilhar» (ligação só de ver, com copiar e revogar: água no m90742,
      fogo no m90766 desde 05/11/2026, «Sim, é bem claro» do Nuno).
   3. «Ver» abre a Base no Atlas (cartão do próprio Atlas ou ?mapa=<id>), abre o painel do simulador certo (pelo
      simulador-base.js, se existir, ou por IPR_AGUA_SIM / IPR_FOGO_SIM) e carrega no «Ver» da lista «Simulações deste mapa».
   Carga (o site esteve a cair por carga): só pede quando se abre o painel; lista das Bases do próprio Atlas
   (__ipe.estado.mapas) ou um só GET meus-mapas; até 3 pedidos ao mesmo tempo; cache de 2 minutos em memória; estados
   consultados só para algumas simulações por abertura (os finais ficam guardados neste navegador e não se voltam a pedir).
   Só acrescenta: não mexe em nenhum ficheiro existente. Fala só com o site (tcd/v1: meus-mapas, agua/trabalhos,
   agua/detalhe, fogo/trabalhos, fogo/trabalho, agua-partilha, fogo-partilha). Desliga-se com ?sim-historico=0 ou localStorage
   ipr_sim_hist_off=1. Terracrua Design. */
(function (W) {
  "use strict";
  var D = document;
  try {
    if (/[?&]sim-historico=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_sim_hist_off") === "1") return;
  } catch (e) {}
  if (W.__iprSimHist) return; W.__iprSimHist = 1;

  // ───────────── limites ─────────────
  var MAX_BASES = 12, PARALELO = 3, CACHE_MS = 120000, ACTUALIZAR_MS = 30000;
  var EST_MAX = { agua: 8, fogo: 4 };          // consultas de estado por abertura do painel (as mais recentes primeiro)
  var FINAIS = { successful: 1, failed: 1, dismissed: 1 };
  var K_EST = "ipr_sim_hist_est", K_VER = "ipr_sim_hist_ver";

  var TX = {
    pt: {
      botao: "As minhas simulações", botaoCurto: "Simulações", titulo: "As minhas simulações", fechar: "Fechar", actualizar: "Actualizar",
      semConta: "Entre na sua conta para ver as suas simulações.",
      aCarregar: "A carregar as suas simulações…", nenhuma: "Ainda não tem simulações. Para simular, abra uma Base entregue e use «Simular água» ou «Simular fogo».",
      semBases: "Ainda não tem nenhuma Base Cartográfica entregue.", bloqueado: "A sua área de cliente ainda não está activa.",
      todas: "Todas", agua: "Água", fogo: "Fogo",
      maisBases: "Mostram-se as simulações das {n} Bases mais recentes.", erroBases: "Não foi possível ler as simulações de {n} Base(s). Tente actualizar daqui a pouco.",
      erro: "Não foi possível carregar as simulações. Tente daqui a pouco.",
      ver: "Ver", partilhar: "Partilhar", fecharPart: "Fechar partilha", ligacao: "Ligação activa",
      e_accepted: "na fila", e_running: "a calcular", e_successful: "concluída", e_failed: "falhou", e_dismissed: "cancelada", e_: "estado por consultar",
      eDesc: "O estado consulta-se ao abrir a simulação com «Ver».",
      soConcluidas: "Só se partilham simulações concluídas.",
      aCriar: "A preparar a ligação…", criar: "Criar ligação só de ver", copiar: "Copiar", copiado: "Copiado", revogar: "Revogar", expira: "Expira a {d}.", revogada: "Ligação revogada.",
      notaPart: "Ligação só de ver: abre o mapa com este resultado, sem conta e sem descargas. Expira em 30 dias e pode revogá-la quando quiser. Quem tiver a ligação vê onde fica o terreno desta Base.",
      partIndisp: "A partilha de resultados ainda não está disponível no site.",
      aAbrir: "A abrir a simulação…", falhouVer: "Não foi possível abrir esta simulação. Abra a Base e use a lista «Simulações deste mapa».",
      semSim: "Este simulador não está disponível nesta conta.",
      num: "n.º", semNome: "Terreno sem nome",
      a_retencao: "Onde a água pára", a_2d: "Chuva no terreno", a_ad: "Antes e depois", a_mira: "Bacia do Mira",
      f_tempo: "Cenário no tempo", f_ad: "Antes e depois", f_muitas: "Muitas ignições", f_chuva: "Fogo e primeira chuva"
    },
    en: {
      botao: "My simulations", botaoCurto: "Simulations", titulo: "My simulations", fechar: "Close", actualizar: "Refresh",
      semConta: "Sign in to see your simulations.",
      aCarregar: "Loading your simulations…", nenhuma: "You have no simulations yet. To simulate, open a delivered Base and use «Simulate water» or «Simulate fire».",
      semBases: "You have no delivered Base Map yet.", bloqueado: "Your client area is not active yet.",
      todas: "All", agua: "Water", fogo: "Fire",
      maisBases: "Showing simulations from the {n} most recent Bases.", erroBases: "Could not read the simulations of {n} Base(s). Try refreshing shortly.",
      erro: "Could not load the simulations. Try again shortly.",
      ver: "View", partilhar: "Share", fecharPart: "Close sharing", ligacao: "Active link",
      e_accepted: "queued", e_running: "running", e_successful: "finished", e_failed: "failed", e_dismissed: "cancelled", e_: "status not checked",
      eDesc: "The status is checked when you open the simulation with «View».",
      soConcluidas: "Only finished simulations can be shared.",
      aCriar: "Preparing the link…", criar: "Create view-only link", copiar: "Copy", copiado: "Copied", revogar: "Revoke", expira: "Expires on {d}.", revogada: "Link revoked.",
      notaPart: "View-only link: opens the map with this result, no account and no downloads. It expires in 30 days and you can revoke it at any time. Anyone with the link sees where this Base's land is.",
      partIndisp: "Sharing results is not available on the site yet.",
      aAbrir: "Opening the simulation…", falhouVer: "Could not open this simulation. Open the Base and use the «Simulations for this map» list.",
      semSim: "This simulator is not available for this account.",
      num: "no.", semNome: "Unnamed land",
      a_retencao: "Where water stops", a_2d: "Rain on the land", a_ad: "Before and after", a_mira: "Mira basin",
      f_tempo: "Scenario over time", f_ad: "Before and after", f_muitas: "Many ignitions", f_chuva: "Fire and first rain"
    }
  };
  var PROC = {
    agua: { "retencao-rapida": "a_retencao", "simulacao-2d": "a_2d", "antes-depois": "a_ad", "bacia-mira": "a_mira" },
    fogo: { "cenario-tempo": "f_tempo", "antes-depois": "f_ad", "muitas-ignicoes": "f_muitas", "fogo-chuva": "f_chuva" }
  };
  function L() { return String(W.IPR_LINGUA || D.documentElement.lang || "pt").slice(0, 2) === "en" ? "en" : "pt"; }
  function t(k) { var d = TX[L()]; return k in d ? d[k] : (TX.pt[k] || k); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function quando(ms) { try { return new Date(ms).toLocaleString(L() === "en" ? "en-GB" : "pt-PT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } }
  function dia(iso) { try { return new Date(iso).toLocaleDateString(L() === "en" ? "en-GB" : "pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" }); } catch (e) { return ""; } }
  function lsLer(k) { try { return W.localStorage.getItem(k); } catch (e) { return null; } }
  function lsGravar(k, v) { try { W.localStorage.setItem(k, v); } catch (e) {} }
  function ssLer(k) { try { return W.sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssGravar(k, v) { try { if (v == null) W.sessionStorage.removeItem(k); else W.sessionStorage.setItem(k, v); } catch (e) {} }

  function ipe() { return W.__ipe || {}; }
  function est() { return ipe().estado || null; }
  function mapa() { return ipe().mapa; }
  function actualId() { var e = est(); return e && e.modo !== "encomenda" && e.actual && e.actual.id != null ? String(e.actual.id) : ""; }
  function sim(tipo) { return tipo === "fogo" ? W.IPR_FOGO_SIM : W.IPR_AGUA_SIM; }
  var PAINEL_SIM = { agua: "ipr-as", fogo: "ipr-fs" };
  function painelSim(tipo) { var p = D.getElementById(PAINEL_SIM[tipo]); return p && !p.hidden ? p : null; }
  function sessao() { return !!W.tcdNonce; }

  var REST = "/wp-json/tcd/v1/";
  function api(c, op) {
    op = op || {}; op.credentials = "same-origin"; op.headers = Object.assign({ "X-WP-Nonce": W.tcdNonce || "" }, op.headers || {});
    if (op.body && typeof op.body !== "string") { op.body = JSON.stringify(op.body); op.headers["Content-Type"] = "application/json"; }
    return W.fetch(REST + c, op).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (j) {
        if (!r.ok) { var er = new Error(j && j.message || ("HTTP " + r.status)); er.estado = r.status; er.codigo = j && j.code; throw er; }
        return j;
      });
    });
  }
  // Corre as tarefas (funções que devolvem promessas) com no máximo n ao mesmo tempo, pela ordem dada.
  function aos(tarefas, n) {
    var out = new Array(tarefas.length), i = 0;
    function prox() { if (i >= tarefas.length) return Promise.resolve(); var k = i++; return tarefas[k]().then(function (v) { out[k] = v; return prox(); }); }
    var corr = []; for (var j = 0; j < Math.min(n, tarefas.length); j++) corr.push(prox());
    return Promise.all(corr).then(function () { return out; });
  }
  function esperar(fn, ms, passo) {
    return new Promise(function (res) { var t0 = Date.now(); (function v() { var r = false; try { r = fn(); } catch (e) {} if (r) return res(r); if (Date.now() - t0 > ms) return res(false); setTimeout(v, passo || 150); })(); });
  }

  // ───────────── estilos ─────────────
  var IC = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v4h4"/><path d="M12 7v5l3 2"/></svg>';
  function css() {
    if (D.getElementById("ipr-sh-css")) return;
    var st = D.createElement("style"); st.id = "ipr-sh-css";
    st.textContent =
      // botão no bloco «Simuladores» (e na caixa própria, quando o bloco não existe)
      "#ipr-t62 [data-sim-hist].s{flex:1 1 100%;display:flex;align-items:center;justify-content:center;gap:8px;min-height:40px;padding:7px 12px;border-radius:10px;font:600 13.5px Inter,sans-serif;text-transform:none;letter-spacing:0;cursor:pointer;background:transparent;border:1px solid var(--ln2,#3b4232);color:var(--tx,#ebe7d8)}" +
      "#ipr-t62 [data-sim-hist].s:hover{border-color:var(--ac,#a8b878);background:var(--acs,rgba(168,184,120,.12))}" +
      "#ipr-t62>.ipr-simh-cx{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px;padding:10px;border:1px solid var(--ln2,#3b4232);border-radius:12px;background:var(--p2,#1d2118)}" +
      "#ipr-t62>.ipr-simh-cx .h{flex-basis:100%;font:600 11px Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--mu,#a3a690)}" +
      // item do topo, ao lado de «Oficina»
      "#ipr-simh-top{background:transparent;border:0;font:inherit;color:inherit;cursor:pointer;display:inline-flex;align-items:center;gap:5px;white-space:nowrap}#ipr-simh-top .c{display:none}" +
      "@media (max-width:1180px){#ipr-simh-top .l{display:none}#ipr-simh-top .c{display:inline}}@media (max-width:600px){#ipr-simh-top{display:none!important}}" +
      // painel
      "#ipr-sh{position:absolute;z-index:42;top:12px;right:12px;width:420px;max-width:calc(100% - 24px);max-height:calc(100% - 24px);display:flex;flex-direction:column;background:var(--p1,#171a13);color:var(--tx,#ebe7d8);border:1px solid var(--ln2,#3b4232);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.35);font:13.5px/1.45 Inter,system-ui,sans-serif;overflow:hidden}" +
      "#ipr-sh[hidden]{display:none}#ipr-sh *{box-sizing:border-box}" +
      "#ipr-sh .sh-cab{display:flex;align-items:center;gap:8px;padding:9px 10px 9px 12px;border-bottom:1px solid var(--ln,#2b3024);background:var(--p2,#1d2118)}#ipr-sh .sh-cab svg{color:var(--ac,#a8b878);flex:none}#ipr-sh .sh-cab h2{flex:1;margin:0;font:600 14px Raleway,Inter,sans-serif;outline:none}" +
      "#ipr-sh .sh-ib{border:0;background:transparent;color:var(--mu,#a3a690);cursor:pointer;min-width:32px;height:32px;border-radius:7px;font:600 15px Inter,sans-serif}#ipr-sh .sh-ib:hover{background:var(--acs,rgba(168,184,120,.16));color:var(--tx,#ebe7d8)}#ipr-sh .sh-ib:disabled{opacity:.4;cursor:default}" +
      "#ipr-sh .sh-fl{display:flex;gap:4px;padding:7px 10px;border-bottom:1px solid var(--ln,#2b3024)}#ipr-sh .sh-fl button{border:1px solid var(--ln,#2b3024);background:transparent;color:var(--mu,#a3a690);font:500 12px Inter,sans-serif;padding:4px 10px;border-radius:999px;cursor:pointer;min-height:30px}#ipr-sh .sh-fl button[aria-pressed=true]{background:var(--acs,rgba(168,184,120,.16));color:var(--tx,#ebe7d8);border-color:var(--ac,#a8b878)}" +
      "#ipr-sh .sh-corpo{overflow:auto;padding:10px 12px 12px;flex:1 1 auto;min-height:0;overscroll-behavior:contain}" +
      "#ipr-sh .nota{font-size:12px;color:var(--mu,#a3a690);margin:0 0 8px}#ipr-sh .err{margin:0 0 8px;padding:7px 9px;border-left:3px solid #d9534f;background:var(--p2,#1d2118);font-size:12.5px}" +
      "#ipr-sh .prog{height:4px;border-radius:2px;background:var(--ln,#2b3024);overflow:hidden;margin:8px 0}#ipr-sh .prog i{display:block;height:100%;width:30%;background:var(--ac,#a8b878);animation:iprsh 1.4s ease-in-out infinite}@keyframes iprsh{0%{margin-left:-30%}100%{margin-left:100%}}" +
      "#ipr-sh ul.sh-l{list-style:none;margin:0;padding:0}#ipr-sh li.sh-it{border:1px solid var(--ln,#2b3024);border-radius:9px;padding:8px 9px;margin:0 0 7px;background:var(--p2,#1d2118)}" +
      "#ipr-sh .sh-l1{display:flex;align-items:center;gap:6px;flex-wrap:wrap}#ipr-sh .sh-l1 b{font-weight:600;font-size:13px}" +
      "#ipr-sh .sh-tp{display:inline-block;padding:0 7px;border-radius:999px;font:600 10.5px Inter,sans-serif;letter-spacing:.04em;text-transform:uppercase;border:1px solid currentColor}#ipr-sh .sh-tp.agua{color:#5aa6dc}#ipr-sh .sh-tp.fogo{color:#e07a3f}" +
      "#ipr-sh .sh-l2{margin:3px 0 0;font-size:12.5px;overflow-wrap:anywhere}#ipr-sh .sh-l2 small{color:var(--mu,#a3a690)}" +
      "#ipr-sh .sh-l3{margin:2px 0 0;font-size:12px;color:var(--mu,#a3a690)}" +
      "#ipr-sh .sh-e{display:inline-block;margin-left:2px;padding:0 6px;border-radius:999px;font:500 10.5px Inter,sans-serif;border:1px solid var(--ln,#2b3024)}#ipr-sh .sh-e.running,#ipr-sh .sh-e.accepted{border-color:var(--ac,#a8b878);color:var(--ac,#a8b878)}#ipr-sh .sh-e.failed{border-color:#d9534f;color:#e6a19e}#ipr-sh .sh-e.successful{color:var(--tx,#ebe7d8)}" +
      "#ipr-sh .sh-ac{display:flex;flex-wrap:wrap;gap:6px;margin:7px 0 0}#ipr-sh .b{font:500 12.5px Inter,sans-serif;padding:6px 12px;border-radius:8px;border:1px solid var(--ln2,#3b4232);background:transparent;color:var(--tx,#ebe7d8);cursor:pointer;min-height:34px}#ipr-sh .b:hover{border-color:var(--ac,#a8b878)}#ipr-sh .b.pri{background:var(--ac,#a8b878);border-color:var(--ac,#a8b878);color:#141814;font-weight:600}#ipr-sh .b:disabled{opacity:.45;cursor:default}" +
      "#ipr-sh .sh-lig{font-size:11px;color:var(--ac,#a8b878);align-self:center}" +
      "#ipr-sh .sh-p{margin:8px 0 0;padding:8px 9px;border:1px dashed var(--ac,#a8b878);border-radius:9px;font-size:12px}#ipr-sh .sh-p .ln{display:flex;gap:6px;align-items:center;margin:0 0 6px;flex-wrap:wrap}" +
      "#ipr-sh .sh-p input{flex:1 1 180px;min-width:0;height:32px;padding:3px 7px;border-radius:7px;border:1px solid var(--ln2,#3b4232);background:var(--bg,#121410);color:var(--tx,#ebe7d8);font:12px 'IBM Plex Mono',monospace}" +
      "#ipr-sh .sh-p .n{color:var(--mu,#a3a690);font-size:11.5px;margin:4px 0 0}#ipr-sh .sh-p .e{color:#e6a19e;margin:4px 0 0}" +
      "@media (max-width:600px){#ipr-sh{position:fixed;z-index:100001;left:8px;right:8px;top:auto;bottom:8px;width:auto;max-width:none;max-height:min(80dvh,calc(100% - 16px));font-size:14px}#ipr-sh .b{min-height:40px;padding:8px 14px}#ipr-sh .sh-ac .b{flex:1 1 auto}}";
    (D.head || D.documentElement).appendChild(st);
  }

  // ───────────── dados ─────────────
  var CACHE = null, EM_CURSO = null, ULT_CARGA = 0;
  var EST = {};                                   // "tipo:id" -> estado (memória desta página)
  var PART = { ok: null, okF: null, por: {} };    // partilhas activas da pessoa, por id do trabalho (ok: água, okF: fogo)
  function rotaP(tipo) { return tipo === "fogo" ? "fogo-partilha" : "agua-partilha"; }
  function partOk(tipo) { return (tipo === "fogo" ? PART.okF : PART.ok) !== false; }
  var PE = {};                                    // estado da interface da partilha, por id: {aberto, aCriar, erro, copiado, revogada}
  function estFinais() { try { return JSON.parse(lsLer(K_EST) || "{}") || {}; } catch (e) { return {}; } }
  function guardarFinal(tipo, id, e) {
    if (!FINAIS[e]) return;
    var o = estFinais(), k = tipo + ":" + id; if (o[k] === e) return;
    o[k] = e;
    var ks = Object.keys(o); if (ks.length > 400) ks.slice(0, ks.length - 400).forEach(function (x) { delete o[x]; });
    lsGravar(K_EST, JSON.stringify(o));
  }
  function estadoDe(it) {
    var k = it.tipo + ":" + it.id;
    if (EST[k]) return EST[k];
    var f = estFinais()[k]; if (f) return (EST[k] = f);
    var s = sim(it.tipo), S = s && s._estado;
    if (S && S.estados && S.estados[it.id]) return S.estados[it.id];
    return "";
  }

  function entregue(b) { return !!b && !b.rever && b.id != null && (b.estado_k === "completed" || b.estado_k === "entregue" || b.estado === "Entregue"); }
  function nomeBase(b) { return (b && (b.local || b.nome)) || t("semNome"); }
  function numBase(b) { return b ? (b.pedido || ("#" + (b.encomenda || b.id))) : ""; }

  // Bases da pessoa: as que o Atlas já tem (sem pedido nenhum) ou um só GET meus-mapas.
  function obterBases() {
    var e = est();
    if (e && e.dados && !e.dados.bloqueado && Array.isArray(e.mapas)) return Promise.resolve({ bases: e.mapas });
    return api("meus-mapas").then(function (d) {
      if (!d || d.bloqueado) return { bases: [], bloqueado: true };
      return { bases: (d.mapas || []).concat(d.partilhados || []) };
    });
  }
  // Que simuladores se consultam: os que esta conta pode usar (simulador-base.js / m90504); sem essa informação, os dois.
  function usa(tipo) {
    var C = W.IPR_SIM_BASE;
    if (C && typeof C === "object" && C.pode && typeof C.pode === "object") return !!C.pode[tipo];
    return true;
  }

  function carregar(forca) {
    if (!forca && CACHE && Date.now() - CACHE.t < CACHE_MS) return Promise.resolve(CACHE);
    if (EM_CURSO) return EM_CURSO;
    ULT_CARGA = Date.now();
    EM_CURSO = obterBases().then(function (r) {
      var vistos = {}, todas = (r.bases || []).filter(function (b) { if (!entregue(b) || vistos[b.id]) return false; vistos[b.id] = 1; return true; });
      var bs = todas.slice(0, MAX_BASES), tarefas = [];
      bs.forEach(function (b) {
        ["agua", "fogo"].forEach(function (tipo) {
          if (!usa(tipo)) return;
          tarefas.push(function () {
            return api(tipo + "/trabalhos?enc=" + encodeURIComponent(b.id))
              .then(function (j) { return { b: b, tipo: tipo, l: (j && j.trabalhos) || [] }; })
              .catch(function (er) { return { b: b, tipo: tipo, l: [], erro: er }; });
          });
        });
      });
      return aos(tarefas, PARALELO).then(function (res) {
        var itens = [], errBases = {};
        res.forEach(function (x) {
          if (x.erro) { if (x.erro.estado !== 403 && x.erro.estado !== 404) errBases[x.b.id] = 1; return; }
          x.l.forEach(function (j) {
            if (!j || !j.id) return;
            var ms = Date.parse(j.criado); if (isNaN(ms)) ms = 0;
            itens.push({ tipo: x.tipo, id: String(j.id), processo: String(j.processo || ""), criado: ms, enc: String(x.b.id), base: nomeBase(x.b), num: numBase(x.b) });
          });
        });
        itens.sort(function (a, b) { return b.criado - a.criado; });
        CACHE = { t: Date.now(), itens: itens, nBases: todas.length, bloqueado: !!r.bloqueado, erros: Object.keys(errBases).length };
        return CACHE;
      });
    }).then(function (c) {
      EM_CURSO = null;
      return partilhas(c).then(function () { return c; });
    }, function (er) { EM_CURSO = null; throw er; });
    return EM_CURSO;
  }

  // Ligações já criadas (um pedido; sem a rota do m90742, a partilha fica escondida).
  function partilhas(c) {
    PART.por = {};
    return Promise.all(["agua", "fogo"].map(function (tipo) {
      if (!c.itens.some(function (x) { return x.tipo === tipo; })) return null;
      var k = tipo === "fogo" ? "okF" : "ok";
      return api(rotaP(tipo) + "/minhas").then(function (r) {
        PART[k] = true;
        ((r && r.partilhas) || []).forEach(function (p) { if (p && p.tipo === "base" && p.ref && !PART.por[p.ref]) { p._t = tipo; PART.por[p.ref] = p; } });
      }).catch(function (er) { PART[k] = er.estado === 404 ? false : PART[k]; });
    }));
  }

  // Estados: só alguns por abertura, um de cada vez; os finais ficam guardados e não se voltam a pedir.
  var A_VER_ESTADOS = false;
  function estados() {
    if (!CACHE || A_VER_ESTADOS || CACHE.estados) return;
    CACHE.estados = true;   // uma vez por carga (2 min): reabrir o painel não volta a perguntar
    var fila = [];
    ["agua", "fogo"].forEach(function (tipo) {
      CACHE.itens.filter(function (x) { return x.tipo === tipo && !FINAIS[estadoDe(x)]; }).slice(0, EST_MAX[tipo]).forEach(function (x) { fila.push(x); });
    });
    fila.sort(function (a, b) { return b.criado - a.criado; });
    if (!fila.length) return;
    A_VER_ESTADOS = true;
    aos(fila.map(function (x) {
      return function () {
        var u = x.tipo === "agua" ? "agua/detalhe?enc=" + encodeURIComponent(x.enc) + "&id=" + x.id : "fogo/trabalho/" + x.id + "?enc=" + encodeURIComponent(x.enc);
        return api(u).then(function (d) {
          var e = d && d.estado ? String(d.estado) : "";
          if (e) { EST[x.tipo + ":" + x.id] = e; guardarFinal(x.tipo, x.id, e); pintar(); }
        }).catch(function () {});
      };
    }), 1).then(function () { A_VER_ESTADOS = false; });
  }

  // ───────────── painel ─────────────
  var P = null, UI = { filtro: "todas", erro: "", aviso: "" };
  function painel() {
    if (P && D.contains(P)) return P;
    css();
    P = D.createElement("div"); P.id = "ipr-sh"; P.setAttribute("role", "dialog"); P.setAttribute("aria-labelledby", "ipr-sh-t"); P.hidden = true;
    var M = mapa(), host = (M && M.getContainer && M.getContainer().parentNode) || D.getElementById("ipe") || D.body;
    host.appendChild(P);
    P.addEventListener("click", clique);
    P.addEventListener("keydown", function (e) { if (e.key === "Escape" || e.key === "Esc") { e.preventDefault(); e.stopPropagation(); fechar(); } });
    return P;
  }
  var antes = null;
  function abrir() {
    var p = painel();
    if (p.hidden) antes = D.activeElement;
    p.hidden = false; UI.aviso = "";
    // um painel de cada vez no mesmo canto
    ["agua", "fogo"].forEach(function (tp) { var s = sim(tp); if (painelSim(tp) && s && typeof s.fechar === "function") { try { s.fechar(); } catch (e) {} } });
    pintar();
    var h = p.querySelector("h2"); if (h) { try { h.focus(); } catch (e) {} }
    if (!sessao()) return;
    UI.erro = "";
    carregar(false).then(function () { UI.erro = ""; pintar(); estados(); }).catch(function () { UI.erro = t("erro"); pintar(); });
  }
  function fechar() {
    if (!P) return;
    P.hidden = true;
    if (antes && antes.focus && D.contains(antes)) { try { antes.focus(); } catch (e) {} }
    antes = null;
  }
  function alternar() { if (P && !P.hidden) fechar(); else abrir(); }

  function rotProc(it) { var k = (PROC[it.tipo] || {})[it.processo]; return k ? t(k) : (it.processo || "–"); }
  function podePartilhar(it, e) { return partOk(it.tipo) && !(e && e !== "successful"); }

  function pintar() {
    if (!P || P.hidden) return;
    var h = '<div class="sh-cab">' + IC + '<h2 id="ipr-sh-t" tabindex="-1">' + esc(t("titulo")) + "</h2>";
    if (sessao()) h += '<button type="button" class="sh-ib" data-sh="act" title="' + esc(t("actualizar")) + '" aria-label="' + esc(t("actualizar")) + '"' + (EM_CURSO || Date.now() - ULT_CARGA < ACTUALIZAR_MS ? " disabled" : "") + ">↻</button>";
    h += '<button type="button" class="sh-ib" data-sh="x" title="' + esc(t("fechar")) + '" aria-label="' + esc(t("fechar")) + '">×</button></div>';
    var c = CACHE, temAmbos = c && c.itens.some(function (x) { return x.tipo === "agua"; }) && c.itens.some(function (x) { return x.tipo === "fogo"; });
    if (temAmbos) h += '<div class="sh-fl" role="group">' + ["todas", "agua", "fogo"].map(function (k) { return '<button type="button" data-shf="' + k + '" aria-pressed="' + (UI.filtro === k) + '">' + esc(t(k)) + "</button>"; }).join("") + "</div>";
    h += '<div class="sh-corpo">' + corpo(temAmbos) + "</div>";
    var c0 = P.querySelector(".sh-corpo"), sc = c0 ? c0.scrollTop : 0, foco = D.activeElement && P.contains(D.activeElement) ? chaveFoco(D.activeElement) : null;
    P.innerHTML = h;
    if (sc) { var c1 = P.querySelector(".sh-corpo"); if (c1) c1.scrollTop = sc; }
    if (foco) { var f = P.querySelector(foco); if (f) { try { f.focus(); } catch (e) {} } }
  }
  function chaveFoco(el) {
    var a = ["data-sh", "data-shf", "data-shv", "data-shp", "data-shc"];
    for (var i = 0; i < a.length; i++) { var v = el.getAttribute && el.getAttribute(a[i]); if (v != null) return "[" + a[i] + '="' + String(v).replace(/"/g, "") + '"]'; }
    return el.tagName === "H2" ? "h2" : null;
  }
  function corpo(temAmbos) {
    if (!sessao()) return '<p class="nota">' + esc(t("semConta")) + "</p>";
    var h = "";
    if (UI.aviso) h += '<p class="nota">' + esc(UI.aviso) + "</p>";
    if (UI.erro) h += '<div class="err">' + esc(UI.erro) + "</div>";
    var c = CACHE;
    if (!c) return h + (UI.erro ? "" : '<div class="prog"><i></i></div><p class="nota">' + esc(t("aCarregar")) + "</p>");
    if (c.bloqueado) return h + '<p class="nota">' + esc(t("bloqueado")) + "</p>";
    if (!c.nBases) return h + '<p class="nota">' + esc(t("semBases")) + "</p>";
    if (c.erros) h += '<div class="err">' + esc(t("erroBases").replace("{n}", c.erros)) + "</div>";
    var l = c.itens.filter(function (x) { return !temAmbos || UI.filtro === "todas" || x.tipo === UI.filtro; });
    if (!l.length) h += '<p class="nota">' + esc(t("nenhuma")) + "</p>";
    else {
      h += '<ul class="sh-l">' + l.map(linha).join("") + "</ul>";
      if (l.some(function (x) { return !estadoDe(x); })) h += '<p class="nota">' + esc(t("eDesc")) + "</p>";
    }
    if (c.nBases > MAX_BASES) h += '<p class="nota">' + esc(t("maisBases").replace("{n}", MAX_BASES)) + "</p>";
    if (PART.ok === false && c.itens.some(function (x) { return x.tipo === "agua"; })) h += '<p class="nota">' + esc(t("partIndisp")) + "</p>";
    return h;
  }
  function linha(it) {
    var e = estadoDe(it), k = it.tipo + ":" + it.id, lig = PART.por[it.id] || null, pe = PE[it.id] || {};
    var h = '<li class="sh-it" data-k="' + esc(k) + '"><div class="sh-l1"><span class="sh-tp ' + it.tipo + '">' + esc(t(it.tipo)) + "</span><b>" + esc(rotProc(it)) + "</b></div>";
    h += '<div class="sh-l2">' + esc(it.base) + (it.num ? " <small>· " + esc(t("num")) + " " + esc(it.num) + "</small>" : "") + "</div>";
    h += '<div class="sh-l3">' + esc(it.criado ? quando(it.criado) : "–") + ' · <span class="sh-e ' + esc(e || "x") + '">' + esc(t("e_" + e)) + "</span></div>";
    h += '<div class="sh-ac"><button type="button" class="b pri" data-shv="' + esc(k) + '">' + esc(t("ver")) + "</button>";
    if (partOk(it.tipo)) {
      var pode = podePartilhar(it, e);
      h += '<button type="button" class="b" data-shp="' + esc(it.id) + '" aria-expanded="' + (!!pe.aberto) + '"' + (pode || pe.aberto ? "" : ' disabled title="' + esc(t("soConcluidas")) + '"') + ">" + esc(pe.aberto ? t("fecharPart") : t("partilhar")) + "</button>";
      if (lig && !pe.aberto) h += '<span class="sh-lig">' + esc(t("ligacao")) + "</span>";
    }
    h += "</div>";
    if (pe.aberto) h += blocoPartilha(it, lig, pe);
    return h + "</li>";
  }
  function blocoPartilha(it, lig, pe) {
    var h = '<div class="sh-p" data-shid="' + esc(it.id) + '">';
    if (lig) {
      h += '<div class="ln"><input type="text" readonly value="' + esc(lig.url) + '" aria-label="' + esc(t("partilhar")) + '"><button type="button" class="b" data-shc="copiar:' + esc(it.id) + '">' + esc(pe.copiado ? t("copiado") : t("copiar")) + "</button></div>";
      h += '<div class="ln"><button type="button" class="b" data-shc="revogar:' + esc(it.id) + '">' + esc(t("revogar")) + '</button><span class="n">' + esc(t("expira").replace("{d}", dia(lig.expira))) + "</span></div>";
    } else {
      if (pe.revogada) h += '<p class="n">' + esc(t("revogada")) + "</p>";
      h += '<p class="n">' + esc(t("notaPart")) + "</p>";
      h += '<div class="ln"><button type="button" class="b pri" data-shc="criar:' + esc(it.id) + '"' + (pe.aCriar ? " disabled" : "") + ">" + esc(pe.aCriar ? t("aCriar") : t("criar")) + "</button></div>";
    }
    if (pe.erro) h += '<p class="e">' + esc(pe.erro) + "</p>";
    return h + "</div>";
  }
  function item(k) { if (!CACHE) return null; for (var i = 0; i < CACHE.itens.length; i++) { var x = CACHE.itens[i]; if (x.tipo + ":" + x.id === k) return x; } return null; }

  function clique(ev) {
    var el = ev.target && ev.target.closest ? ev.target.closest("button") : null; if (!el || !P.contains(el)) return;
    ev.preventDefault();
    var a = el.getAttribute("data-sh");
    if (a === "x") return fechar();
    if (a === "act") { UI.erro = ""; CACHE = null; pintar(); carregar(true).then(function () { pintar(); estados(); }).catch(function () { UI.erro = t("erro"); pintar(); }); return; }
    if (el.hasAttribute("data-shf")) { UI.filtro = el.getAttribute("data-shf"); pintar(); return; }
    if (el.hasAttribute("data-shv")) { var it = item(el.getAttribute("data-shv")); if (it) ver(it); return; }
    if (el.hasAttribute("data-shp")) {
      var id = el.getAttribute("data-shp"), pe = PE[id] || (PE[id] = {});
      pe.aberto = !pe.aberto; pe.erro = "";
      pintar();
      return;
    }
    var c = el.getAttribute("data-shc");
    if (c) {
      var p = c.split(":"), op = p[0], jid = p[1];
      if (op === "criar") criar(jid);
      else if (op === "copiar") copiar(jid, el);
      else if (op === "revogar") revogar(jid);
    }
  }

  // ───────────── partilhar (água: rotas do m90742; fogo: rotas do m90766) ─────────────
  function criar(id) {
    var it = item("agua:" + id) || item("fogo:" + id), pe = PE[id] || (PE[id] = {});
    if (!it || pe.aCriar) return;
    pe.aCriar = true; pe.erro = ""; pe.revogada = false; pintar();
    var corpo = it.tipo === "fogo" ? { id: it.id, enc: +it.enc } : { tipo: "base", id: it.id, enc: +it.enc };
    api(rotaP(it.tipo), { method: "POST", body: corpo }).then(function (r) {
      pe.aCriar = false; if (r && r.partilha) { r.partilha._t = it.tipo; PART.por[id] = r.partilha; } pintar();
    }).catch(function (er) {
      pe.aCriar = false; pe.erro = er.message;
      if (er.estado === 404 && er.codigo === "rest_no_route") { PART[it.tipo === "fogo" ? "okF" : "ok"] = false; pe.aberto = false; }
      pintar();
    });
  }
  function copiar(id, el) {
    var lig = PART.por[id], pe = PE[id] || (PE[id] = {}); if (!lig) return;
    var fim = function () { pe.copiado = true; pintar(); setTimeout(function () { pe.copiado = false; pintar(); }, 2000); };
    var sel = function () { var b = P.querySelector('[data-shid="' + id + '"] input'); if (b) { b.focus(); b.select(); } };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(lig.url).then(fim, sel); else sel();
  }
  function revogar(id) {
    var lig = PART.por[id], pe = PE[id] || (PE[id] = {}); if (!lig) return;
    api(rotaP(lig._t) + "/revogar", { method: "POST", body: { codigo: lig.codigo } }).then(function () {
      delete PART.por[id]; pe.revogada = true; pe.erro = ""; pintar();
    }).catch(function (er) { pe.erro = er.message; pintar(); });
  }

  // ───────────── «Ver»: abrir a Base, o simulador certo e o resultado ─────────────
  function mapaPronto() { var M = mapa(); return !!M && (!M.loaded || M.loaded()) && (!M.isStyleLoaded || M.isStyleLoaded()); }
  function cartao(id) {
    var e = est(); if (!e || !Array.isArray(e.mapas)) return null;
    var cs = D.querySelectorAll(".ipe-card[data-i]");
    for (var i = 0; i < cs.length; i++) { var m = e.mapas[+cs[i].getAttribute("data-i")]; if (m && String(m.id) === String(id)) return cs[i]; }
    return null;
  }
  function falhou(it) {
    ssGravar(K_VER, null);
    UI.aviso = ""; UI.erro = t("falhouVer");
    if (!P || P.hidden) abrir(); else pintar();
  }
  function ver(it) {
    var s = sim(it.tipo);
    if (!s) { UI.erro = t("semSim"); pintar(); return; }
    UI.erro = ""; UI.aviso = t("aAbrir"); pintar();
    ssGravar(K_VER, JSON.stringify({ tipo: it.tipo, enc: it.enc, id: it.id, t: Date.now() }));
    if (actualId() === it.enc) { fechar(); return depoisDaBase(it, false); }
    var c = cartao(it.enc);
    if (c) {
      fechar();
      c.click();
      esperar(function () { return actualId() === it.enc && mapaPronto(); }, 15000).then(function (ok) {
        if (ok) depoisDaBase(it, false); else irPeloEndereco(it);
      });
      return;
    }
    irPeloEndereco(it);
  }
  // A Base não está na lista aberta do Atlas: abre-se pelo endereço; o resto continua depois de carregar (retomar).
  function irPeloEndereco(it) {
    if (W.IPR_SIM_BASE_UI) ssGravar("ipr_sim_base", JSON.stringify({ tipo: it.tipo, id: it.enc, t: Date.now() }));   // simulador-base.js abre o painel
    var q = new URLSearchParams(location.search); q.set("mapa", it.enc); q.delete("modo");
    location.href = location.pathname + "?" + q.toString();
  }
  function depoisDaBase(it, retomado) {
    abrirSimulador(it, retomado).then(function (Ps) {
      if (!Ps) return falhou(it);
      return clicarVer(it, Ps).then(function (ok) { if (ok) ssGravar(K_VER, null); else falhou(it); });
    });
  }
  // Abre o painel do simulador sobre a Base aberta. Com o simulador-base.js (aviso e escolha da Base), passa pela caixa
  // dele com esta Base escolhida e carrega no botão que abre o painel; quem ainda não aceitou o aviso vê-o e aceita.
  function abrirSimulador(it, retomado) {
    var Pj = painelSim(it.tipo);
    if (Pj && actualId() === it.enc) return Promise.resolve(Pj);
    var espera = retomado && W.IPR_SIM_BASE_UI ? esperar(function () { return painelSim(it.tipo); }, 6000) : Promise.resolve(false);
    return espera.then(function (j) {
      if (j) return j;
      var s = sim(it.tipo); if (!s || typeof s.abrir !== "function") return null;
      var embrulhado = !!(s.abrir.__sb && W.IPR_SIM_BASE_UI);
      if (embrulhado) lsGravar("ipr_sim_base_ultima", it.enc);
      try { s.abrir(); } catch (e) { return null; }
      if (!embrulhado) return esperar(function () { return painelSim(it.tipo); }, 8000);
      var viuCaixa = false;
      return esperar(function () {
        var pj = painelSim(it.tipo); if (pj) return pj;
        var M = D.getElementById("ipr-sb");
        if (!M || M.hidden) return viuCaixa ? "cancelado" : false;
        viuCaixa = true;
        var r = M.querySelector('input[name="ipr-sb-base"][value="' + String(it.enc).replace(/"/g, "") + '"]');
        if (r && !r.checked) { r.click(); return false; }
        var b = M.querySelector('[data-sb="simular"]');
        if (r && r.checked && b && !b.disabled && !b.__shClic) { b.__shClic = true; b.click(); }
        return false;
      }, 90000, 200).then(function (x) { return x === "cancelado" ? null : x; });
    });
  }
  function clicarVer(it, Pj) {
    var sel = 'a[data-verjob="' + it.id + '"]';
    var t0 = Date.now();
    // Espera pela lista do painel; desiste mais cedo se a lista já chegou sem esta simulação ou se o painel mostra o aviso.
    return esperar(function () {
      var p = painelSim(it.tipo); if (!p) return false;
      var a = p.querySelector(sel); if (a) return a;
      if (Date.now() - t0 > 1500 && (p.querySelector("a[data-verjob]") || p.querySelector(".avbox"))) return "sem";
      return false;
    }, 8000).then(function (a) {
      var p = painelSim(it.tipo) || Pj; if (!p || !D.contains(p)) return false;
      if (a && a !== "sem") { a.click(); return true; }
      // A lista do painel ainda não tem esta simulação (ou o painel está no aviso): o mesmo atributo, num elemento
      // escondido dentro do painel, passa pelo mesmo tratamento do clique.
      var x = D.createElement("a"); x.href = "#"; x.hidden = true; x.setAttribute("data-verjob", it.id);
      var c = p.querySelector(".as-corpo,.fs-corpo") || p;
      c.appendChild(x); x.click(); if (x.parentNode) x.parentNode.removeChild(x);
      return true;
    });
  }
  // Depois de abrir a Base pelo endereço: retomar.
  function retomar() {
    var p = null; try { p = JSON.parse(ssLer(K_VER) || "null"); } catch (e) { p = null; }
    if (!p || !p.id || !p.enc || (p.tipo !== "agua" && p.tipo !== "fogo") || Date.now() - (+p.t || 0) > 150000) { if (p) ssGravar(K_VER, null); return; }
    var it = { tipo: p.tipo, enc: String(p.enc), id: String(p.id) };
    esperar(function () { return actualId() === it.enc && sim(it.tipo) && mapaPronto(); }, 30000).then(function (ok) {
      if (ok) depoisDaBase(it, true); else ssGravar(K_VER, null);
    });
  }

  // ───────────── botões: bloco «Simuladores» e topo ─────────────
  function botaoBloco() {
    var b = D.createElement("button"); b.type = "button"; b.className = "s ipr-simh-b"; b.setAttribute("data-sim-hist", "");
    rotBloco(b); return b;
  }
  function rotBloco(b) { if (b.getAttribute("data-l") === L()) return; b.innerHTML = IC + "<span>" + esc(t("botao")) + "</span>"; b.setAttribute("data-l", L()); }
  function garantir() {
    if (!sessao()) return;
    css();
    var w = D.getElementById("ipr-t62");
    if (w) {
      var d = w.querySelector(":scope > .ipr-sims"), cx = w.querySelector(":scope > .ipr-simh-cx"), b;
      if (d) {
        if (cx) cx.remove();
        b = d.querySelector(":scope > [data-sim-hist]");
        if (!b) d.appendChild(botaoBloco()); else { rotBloco(b); if (b !== d.lastElementChild) d.appendChild(b); }
      } else {
        if (!cx) { cx = D.createElement("div"); cx.className = "ipr-simh-cx"; cx.innerHTML = '<span class="h"></span>'; cx.appendChild(botaoBloco()); w.insertBefore(cx, w.firstChild); }
        var hh = cx.querySelector(".h"), txt = L() === "en" ? "Simulators" : "Simuladores"; if (hh.textContent !== txt) hh.textContent = txt;
        b = cx.querySelector("[data-sim-hist]"); if (b) rotBloco(b);
      }
    }
    var of = D.getElementById("ipr-painel-b"), top = D.getElementById("ipr-simh-top");
    if (of && of.parentNode) {
      if (!top) { top = D.createElement("button"); top.type = "button"; top.id = "ipr-simh-top"; top.className = "ipe-lk"; top.setAttribute("data-sim-hist", ""); }
      if (top.getAttribute("data-l") !== L()) { top.innerHTML = '<span class="l">' + esc(t("botao")) + '</span><span class="c">' + esc(t("botaoCurto")) + "</span>"; top.title = t("botao"); top.setAttribute("aria-label", t("botao")); top.setAttribute("data-l", L()); }
      if (top.previousSibling !== of || top.parentNode !== of.parentNode) of.parentNode.insertBefore(top, of.nextSibling);
    } else if (top) top.remove();
  }
  var obsEl = null, obs = null, pend = false;
  function agendar() { if (pend) return; pend = true; setTimeout(function () { pend = false; garantir(); }, 60); }
  function observar() {
    var w = D.getElementById("ipr-t62");
    if (w && w !== obsEl && W.MutationObserver) { if (obs) obs.disconnect(); obsEl = w; obs = new MutationObserver(agendar); obs.observe(w, { childList: true }); }
    garantir();
  }
  D.addEventListener("click", function (e) {
    var b = e.target && e.target.closest ? e.target.closest("[data-sim-hist]") : null; if (!b) return;
    e.preventDefault(); e.stopPropagation(); alternar();
  }, true);
  D.addEventListener("keydown", function (e) { if ((e.key === "Escape" || e.key === "Esc") && P && !P.hidden && !P.contains(e.target) && !D.querySelector("#ipr-sb:not([hidden])")) fechar(); });
  D.addEventListener("ipr:lingua", function () { garantir(); pintar(); });
  setInterval(function () { if (!D.hidden) observar(); }, 1500);
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", function () { observar(); retomar(); }); else { observar(); retomar(); }

  W.IPR_SIM_HIST = { abrir: abrir, fechar: fechar, _cache: function () { return CACHE; } };
})(window);
