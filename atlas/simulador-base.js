/* IPR Atlas · Simuladores de água e de fogo: aviso, escolha da Base e acesso Intelligence (módulo m90504).
   Pedidos do Nuno a 29/10/2026 (15h11, 15h12 e 15h18): «eu carrego o simulador de fogo, abro o disclaimer, aprovo e depois
   tenho que me dar em que parcela é que quero simular. Tanto para a água como para o fogo. [...] Sem estragar nada.»
   Ordem, nos dois simuladores: botão, aviso, aceitar, escolher a Base. Ao escolher uma Base na lista, o mapa abre essa Base
   (se ainda não estiver aberta, pelo cartão do próprio Atlas) e enquadra o limite do terreno, antes de carregar em «Simular».
   «Simular» abre o painel do simulador sobre essa Base. Nada corre nem fica na fila antes disso: um POST a agua/simular ou
   fogo/simular sem Base escolhida é travado aqui, e o pedido leva sempre «base» (id da encomenda, o de ?mapa=), que o site
   verifica (m90504). Cancelar fecha tudo sem enviar nada.
   Quem não é Intelligence (nem administrador nem convidado) vê os botões pequenos marcados «Versão Intelligence» e, ao
   carregar, um aviso curto com a ligação para os planos; sem sessão, também a ligação para entrar ou registar-se.
   Os botões dos simuladores ficam com um só estilo (tamanho, forma, ícone, etiqueta de estado), só nesses botões.
   Não edita agua-simulador.js, fogo-simulador.js, simuladores-convite.js nem o Atlas: liga-se pelo DOM e por window
   (__ipe, IPR_AGUA_SIM, IPR_FOGO_SIM, tcdNonce, IPR_LINGUA). Sem window.IPR_SIM_BASE (m90504 desligado) não faz nada. */
(function (W) {
  "use strict";
  if (W.__iprSimBase) return;
  var C = W.IPR_SIM_BASE;
  if (!C || typeof C !== "object" || !C.pode) return;
  W.__iprSimBase = true;
  W.__iprSimConvite = true;   // o aviso «Versão experimental» (m90487) dá lugar ao aviso Intelligence deste ficheiro
  var PODE = { agua: !!C.pode.agua, fogo: !!C.pode.fogo };
  function url(u, def) { return typeof u === "string" && /^(https?:\/\/[^\s"<>]+|\/(?!\/)[^\s"<>]*)$/.test(u) ? u : def; }
  var U = { planos: url(C.planos, "/ipr-cloud/"), encomenda: url(C.encomenda, "/atlas/?modo=encomenda"), entrar: url(C.entrar, "/conta/") };
  var REST = "/wp-json/tcd/v1/";
  // ───────────── avisos legais: um só sítio ─────────────
  // Decisão do Nuno (29/10/2026, 16h25): o aviso dos dois simuladores termina com a frase de AVISO.fecho.
  // As versões têm de ser iguais às do site e dos motores (TCD_AGUA_AVISO_VERSAO no m90416 e AVISO_VERSAO de ipr_agua;
  // TCD_FOGO_AVISO_VERSAO no m90422 e AVISO_VERSAO de ipr_fogo): é o site que grava a aceitação e o motor que a confere.
  // Mudar o texto sem mudar essas versões não volta a pedir a aceitação a quem já aceitou.
  // Água: o texto é o deste ficheiro. Fogo: o texto vem do motor (fogo/aviso, uma só fonte para o que se aceita) e a última
  // frase, a da responsabilidade, passa a ser sempre a de AVISO.fecho.
  var AVISO = {
    versao: { agua: "2026-10-27", fogo: "2026-10-27" },
    fecho: {
      pt: "O IPR – Instituto de Planeamento Regenerativo, Lda. não se responsabiliza por decisões tomadas com base nestes resultados.",
      en: "IPR – Instituto de Planeamento Regenerativo, Lda. accepts no liability for decisions made on the basis of these results."
    },
    agua: {
      pt: "O Simulador de Água do IPR Atlas está em testes e serve apenas para informação e aprendizagem. Os resultados são estimativas de um modelo, com as incertezas do terreno (LiDAR), da chuva, dos solos e do próprio modelo, e podem estar errados. Não servem para decisões sobre a segurança de pessoas e bens, protecção civil, evacuação, dimensionamento de obras ou licenciamento, e não substituem estudos de hidrologia e hidráulica assinados por técnico habilitado nem a informação oficial (APA, ANEPC, IPMA, câmara municipal). Em situação de cheia ou de perigo, siga as indicações da Protecção Civil e, em emergência, ligue 112.",
      en: "The IPR Atlas Water Simulator is in testing and is for information and learning only. Results are model estimates, subject to uncertainty in the terrain (LiDAR), rainfall, soils and the model itself, and may be wrong. They must not be used for decisions on the safety of people or property, civil protection, evacuation, structural design or permitting, and they do not replace hydrological and hydraulic studies signed by a qualified professional or official information (APA, ANEPC, IPMA, local council). In a flood or any danger, follow Civil Protection instructions and call 112 in an emergency."
    }
  };
  function textoAviso(tipo, motor) {
    var l = L(), corpo = tipo === "agua" ? AVISO.agua[l] : String((motor && (motor[l] || motor.pt)) || "");
    if (!corpo) return "";
    // tira a frase final de responsabilidade que o texto já tenha (qualquer marca) e põe a do IPR, Lda.
    corpo = corpo.replace(/\s*((A |O )?(Terracrua Design|IPR)( – Instituto de Planeamento Regenerativo, Lda\.)?)\s+(não se responsabiliza|accepts no liability)[^.]*\.\s*$/i, "").replace(/\s+$/, "");
    return corpo + " " + AVISO.fecho[l];
  }
  var ULTIMA = "ipr_sim_base_ultima";

  var D = {
    pt: {
      n_agua: "água", n_fogo: "fogo", b_agua: "Simular água", b_fogo: "Simular fogo",
      t_beta: "Beta", t_intel: "Versão Intelligence", t_exp: "Experimental",
      cancelar: "Cancelar", fechar: "Fechar", simular: "Simular", aceitar: "Aceitar e continuar",
      avisoT: "Aviso importante", aCarregar: "A carregar…",
      avisoErro: "Não foi possível ler o aviso do simulador. Tente mais tarde.",
      chk_agua: "Li e compreendo: os resultados são informativos, estão em testes e não servem para decisões de segurança.",
      chk_fogo: "Li e compreendo: nunca usarei estes resultados para decidir ficar ou sair, nem para agir num incêndio real.",
      escT: "Onde quer simular?", escSub: "Escolha a Base Cartográfica (terreno e MDT) para o simulador de {n}. O mapa mostra o terreno escolhido.",
      partilhada: "Partilhada consigo", aberta: "Aberta no mapa", num: "N.º",
      semBaseT: "Ainda não tem uma Base Cartográfica", semBase: "O simulador de {n} corre sobre o MDT LiDAR de uma Base Cartográfica entregue. Quando a sua Base estiver entregue, aparece aqui.",
      encomendar: "Encomendar uma Base Cartográfica",
      erroBases: "Não foi possível ler as suas Bases. Recarregue a página.",
      indisp: "O simulador de {n} não está disponível neste momento. Tente mais tarde.",
      mudou: "O mapa aberto já não é a Base escolhida. Carregue outra vez no simulador e escolha a Base.",
      escolhaPrimeiro: "Escolha primeiro a Base Cartográfica onde quer simular.",
      intelT: "Incluído no IPR Atlas Intelligence",
      intelTx: "O simulador de {n} faz parte do IPR Atlas Intelligence. Com o Intelligence, simula sobre o terreno da sua Base Cartográfica.",
      intelAnon: "O simulador de {n} faz parte do IPR Atlas Intelligence. Entre na sua conta ou registe-se para continuar.",
      verIntel: "Ver o Intelligence", entrar: "Entrar ou registar", baseRot: "Base", trocar: "Trocar"
    },
    en: {
      n_agua: "water", n_fogo: "fire", b_agua: "Water simulator", b_fogo: "Fire simulator",
      t_beta: "Beta", t_intel: "Intelligence version", t_exp: "Experimental",
      cancelar: "Cancel", fechar: "Close", simular: "Simulate", aceitar: "Accept and continue",
      avisoT: "Important notice", aCarregar: "Loading…",
      avisoErro: "Could not read the simulator notice. Please try later.",
      chk_agua: "I have read and understand: results are for information only, in testing, and not for safety decisions.",
      chk_fogo: "I have read and understand: I will never use these results to decide whether to stay or leave, or to act in a real fire.",
      escT: "Where do you want to simulate?", escSub: "Choose the Base Map (land and DTM) for the {n} simulator. The map shows the chosen land.",
      partilhada: "Shared with you", aberta: "Open on the map", num: "No.",
      semBaseT: "You do not have a Base Map yet", semBase: "The {n} simulator runs on the LiDAR DTM of a delivered Base Map. Once your Base Map is delivered, it appears here.",
      encomendar: "Order a Base Map",
      erroBases: "Could not read your Base Maps. Please reload the page.",
      indisp: "The {n} simulator is not available right now. Please try later.",
      mudou: "The open map is no longer the chosen Base Map. Click the simulator again and choose the Base Map.",
      escolhaPrimeiro: "First choose the Base Map you want to simulate on.",
      intelT: "Included in IPR Atlas Intelligence",
      intelTx: "The {n} simulator is part of IPR Atlas Intelligence. With Intelligence, you simulate on the land of your Base Map.",
      intelAnon: "The {n} simulator is part of IPR Atlas Intelligence. Sign in or register to continue.",
      verIntel: "See Intelligence", entrar: "Sign in or register", baseRot: "Base Map", trocar: "Change"
    }
  };
  function L() { return String(W.IPR_LINGUA || document.documentElement.lang || "pt").slice(0, 2) === "en" ? "en" : "pt"; }
  function t(k) { var d = D[L()]; return k in d ? d[k] : D.pt[k]; }
  function tn(k, tipo) { return t(k).replace("{n}", t("n_" + tipo)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function nfmt(x) { var v = parseFloat(x); return isNaN(v) ? "" : v.toLocaleString(L() === "en" ? "en-GB" : "pt-PT", { maximumFractionDigits: 2 }); }
  function ipe() { return W.__ipe || {}; }
  function est() { return ipe().estado || null; }
  function actualId() { var e = est(); return e && e.modo !== "encomenda" && e.actual && e.actual.id != null ? String(e.actual.id) : ""; }
  function sim(tipo) { return tipo === "fogo" ? W.IPR_FOGO_SIM : W.IPR_AGUA_SIM; }

  // fetch original, para os pedidos deste ficheiro não passarem pela guarda abaixo
  var FETCH = W.fetch ? W.fetch.bind(W) : null;
  function api(c, op) {
    op = op || {}; op.credentials = "same-origin"; op.headers = Object.assign({ "X-WP-Nonce": W.tcdNonce || "" }, op.headers || {});
    if (op.body && typeof op.body !== "string") { op.body = JSON.stringify(op.body); op.headers["Content-Type"] = "application/json"; }
    return FETCH(REST + c, op).then(function (r) { return r.json().catch(function () { return null; }).then(function (j) { if (!r.ok) { var er = new Error(j && j.message || ("HTTP " + r.status)); er.estado = r.status; throw er; } return j; }); });
  }

  // ───────────── Base escolhida por simulador ─────────────
  var ESC = { agua: null, fogo: null };   // {id, aberto}

  // Resultado anterior que fica no mapa (agua-simulador.js 4039016 e fogo-simulador.js ce758a0): ao simular outra vez, ou
  // em «Ver», o painel faz S.res = null antes de limparCamadas(), e alternarCamada(id, false) sai logo sem S.res; as
  // camadas da primeira simulação ficam no mapa e S.camadas continua cheio, e o resultado novo não se desenha
  // (alternarCamada(id, true) vê a fonte antiga e não faz nada). Aqui tiram-se essas camadas órfãs antes do pedido novo.
  function limparOrfas(tipo) {
    var s = sim(tipo), S = s && s._estado, Mp = ipe().mapa;
    if (!S || S.res || !S.camadas || !Object.keys(S.camadas).length || !Mp) return;
    var pre = "ipr-" + (tipo === "agua" ? "as" : "fs") + "-";
    Object.keys(S.camadas).forEach(function (id) {
      var sid = pre + id;
      try {
        [sid + "-l", sid + "-c", sid + "-t"].forEach(function (l) { if (Mp.getLayer(l)) Mp.removeLayer(l); });
        if (Mp.getSource(sid)) Mp.removeSource(sid);
      } catch (x) {}
    });
    S.camadas = {};
  }

  // Guarda: nenhum POST a agua/simular ou fogo/simular sai sem Base escolhida; o pedido leva sempre «base».
  if (FETCH) {
    W.fetch = function (input, init) {
      try {
        var u = typeof input === "string" ? input : (input && input.url) || "";
        var mo = /\/wp-json\/tcd\/v1\/(agua|fogo)\/(simular|trabalho\/|detalhe)/.exec(u);
        if (mo) limparOrfas(mo[1]);
        var m = /\/wp-json\/tcd\/v1\/(agua|fogo)\/simular(?:[?#]|$)/.exec(u);
        var met = String((init && init.method) || (input && input.method) || "GET").toUpperCase();
        if (m && met === "POST" && PODE[m[1]]) {
          var tipo = m[1], e = ESC[tipo];
          if (!e) { setTimeout(function () { iniciar(tipo); }, 0); return Promise.resolve(resposta(409, t("escolhaPrimeiro"))); }
          var corpo = {};
          try { corpo = init && typeof init.body === "string" ? JSON.parse(init.body) : {}; } catch (x) { corpo = {}; }
          if (corpo.enc != null && String(corpo.enc) !== String(e.id)) { ESC[tipo] = null; return Promise.resolve(resposta(400, t("mudou"))); }
          corpo.base = Number(e.id); if (corpo.enc == null) corpo.enc = Number(e.id);
          init = Object.assign({}, init || {}, { body: JSON.stringify(corpo) });
          var hs = {}, h0 = init.headers;
          if (h0 && W.Headers && h0 instanceof W.Headers) h0.forEach(function (v, k) { hs[k] = v; });
          else if (h0 && typeof h0 === "object") hs = Object.assign({}, h0);
          hs["Content-Type"] = "application/json";
          init.headers = hs;
        }
      } catch (x2) {}
      return FETCH(input, init);
    };
  }
  function resposta(st, msg) {
    var b = JSON.stringify({ code: "ipr_sim_base", message: msg, data: { status: st } });
    try { return new Response(b, { status: st, headers: { "Content-Type": "application/json" } }); }
    catch (x) { return { ok: false, status: st, json: function () { return Promise.resolve(JSON.parse(b)); } }; }
  }

  // ───────────── estilos (só os botões dos simuladores e a caixa deste ficheiro) ─────────────
  var IC = {
    agua: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c3.5 4.2 6 7.6 6 10.5A6 6 0 0 1 6 13.5C6 10.6 8.5 7.2 12 3z"/><path d="M9 14.5a3 3 0 0 0 3 3"/></svg>',
    fogo: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c3 4 6 6 6 10a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 2 3 3 3 0-2-1-4 0-6z"/></svg>',
    cad: '<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
  };
  var SEL = "[data-agua-sim],[data-fogo-sim],[data-ipr-sim-lock]";
  function css() {
    if (document.getElementById("ipr-sb-css")) return;
    var st = document.createElement("style"); st.id = "ipr-sb-css";
    st.textContent =
      ".ipe{--sim-agua:#5BA3D6;--sim-fogo:#E07A3F}.ipe.claro{--sim-agua:#1F6A9E;--sim-fogo:#B4501A}" +
      "#ipr-t62 [data-sim-convite]{display:none!important}" +
      // botões nas ferramentas dos temas: um só estilo
      "#ipr-t62 .ipr-t62-f [data-ipr-sim]{display:inline-flex!important;align-items:center;gap:6px;min-height:32px;padding:5px 9px 5px 8px;border-radius:2px;" +
      "border:1px solid var(--ln2,#3C4B32)!important;background:transparent;color:var(--tx,#E4E2D8);font:500 12px/1.2 Inter,system-ui,sans-serif;letter-spacing:0;text-transform:none;cursor:pointer;flex-wrap:wrap;row-gap:3px;max-width:100%;text-align:left}" +
      "#ipr-t62 .ipr-t62-f [data-ipr-sim]>svg{flex:0 0 auto;width:14px;height:14px}" +
      "#ipr-t62 .ipr-t62-f [data-ipr-sim=agua]>svg{color:var(--sim-agua)}#ipr-t62 .ipr-t62-f [data-ipr-sim=fogo]>svg{color:var(--sim-fogo)}" +
      "#ipr-t62 .ipr-t62-f [data-ipr-sim=agua]:hover{border-color:var(--sim-agua)!important}#ipr-t62 .ipr-t62-f [data-ipr-sim=fogo]:hover{border-color:var(--sim-fogo)!important}" +
      // faixa «Simuladores» (fogo-simulador.js, com o estilo discreto do marca.js): os botões trancados usam as mesmas classes
      "#ipr-t62>.ipr-sims [data-ipr-sim]{display:inline-flex;flex-wrap:wrap;align-items:center;gap:2px 6px;text-transform:none;letter-spacing:0}" +
      "#ipr-t62 [data-ipr-sim]>span:not(.ipr-sim-tag){white-space:nowrap}" +
      // cores da faixa pelas variáveis do tema (o marca.js usa tons fixos, pouco legíveis no tema claro)
      ".ipe #ipr-t62>.ipr-sims [data-ipr-sim=fogo]{color:var(--sim-fogo)!important;border-color:var(--sim-fogo)!important}" +
      ".ipe #ipr-t62>.ipr-sims [data-ipr-sim=agua]{color:var(--sim-agua)!important;border-color:var(--sim-agua)!important}" +
      // etiqueta de estado
      ".ipr-sim-tag{display:inline-flex;align-items:center;gap:3px;margin-left:2px;padding:1px 5px;border-radius:2px;border:1px solid currentColor;font:500 9.5px/1.4 'IBM Plex Mono',ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase;opacity:.9;white-space:nowrap}" +
      "[data-ipr-estado=ok] .ipr-sim-tag{color:inherit;opacity:.7}" +
      "[data-ipr-estado=intel] .ipr-sim-tag{color:var(--ouro,#B8A83A);opacity:1}" +
      "[data-ipr-estado=exp] .ipr-sim-tag{color:var(--ko,#E0705A);opacity:1}" +
      "[data-ipr-estado=intel]>svg:first-child{opacity:.75}" +
      "#ipr-t62 [data-ipr-sim]:focus-visible{outline:2px solid var(--ac2,#B3D466);outline-offset:2px}" +
      // caixa: aviso, escolha da Base, aviso Intelligence
      "#ipr-sb{position:fixed;inset:0;z-index:100050;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.45);box-sizing:border-box}#ipr-sb[hidden]{display:none}" +
      "#ipr-sb.lado{background:transparent;pointer-events:none;align-items:flex-start;justify-content:flex-end;padding:72px 16px 16px}#ipr-sb.lado .sb-c{pointer-events:auto}" +
      "#ipr-sb *{box-sizing:border-box}" +
      "#ipr-sb .sb-c{width:100%;max-width:440px;max-height:calc(100vh - 32px);display:flex;flex-direction:column;border-radius:2px;background:var(--p1,#14200F);color:var(--tx,#E4E2D8);border:1px solid var(--ln2,#3C4B32);box-shadow:0 10px 30px rgba(0,0,0,.35);font:14px/1.5 Inter,system-ui,sans-serif}" +
      "#ipr-sb.lado .sb-c{max-width:380px;max-height:calc(100vh - 88px)}" +
      "#ipr-sb .sb-cab{display:flex;align-items:center;gap:8px;padding:14px 16px 0}#ipr-sb .sb-cab svg{width:18px;height:18px;flex:0 0 auto}#ipr-sb .sb-cab[data-t=agua] svg{color:var(--sim-agua)}#ipr-sb .sb-cab[data-t=fogo] svg{color:var(--sim-fogo)}" +
      "#ipr-sb h2{margin:0;font:600 16px/1.3 var(--titulo,'Outfit','Inter',system-ui,sans-serif);color:var(--tx,#E4E2D8)}" +
      "#ipr-sb .sb-corpo{padding:10px 16px 4px;overflow:auto;min-height:0;flex:1 1 auto;overscroll-behavior:contain}" +
      "#ipr-sb p{margin:0 0 12px}#ipr-sb p.sub{color:var(--mu,#9AA088);font-size:13px}" +
      "#ipr-sb .sb-av{max-height:40vh;overflow:auto;padding:10px 12px;border:1px solid var(--ouro,#B8A83A);border-radius:2px;background:var(--p2,#1B2816);font-size:12.5px;margin:0 0 12px}" +
      "#ipr-sb .sb-chk{display:flex;gap:8px;align-items:flex-start;font-size:12.5px;margin:0 0 6px;cursor:pointer}#ipr-sb .sb-chk input{margin-top:3px;accent-color:var(--ac,#94BE39)}" +
      "#ipr-sb ul.sb-l{list-style:none;margin:0 0 8px;padding:0;display:flex;flex-direction:column;gap:6px}" +
      "#ipr-sb ul.sb-l label{display:flex;gap:10px;align-items:flex-start;padding:9px 10px;border:1px solid var(--ln2,#3C4B32);border-radius:2px;background:var(--p2,#1B2816);cursor:pointer}" +
      "#ipr-sb ul.sb-l label:hover{border-color:var(--ac,#94BE39)}#ipr-sb ul.sb-l input{margin-top:3px;accent-color:var(--ac,#94BE39)}" +
      "#ipr-sb ul.sb-l label.on{border-color:var(--ac,#94BE39);box-shadow:inset 0 0 0 1px var(--ac,#94BE39)}" +
      "#ipr-sb .sb-n{display:block;font-weight:600;font-size:13.5px;color:var(--tx,#E4E2D8)}" +
      "#ipr-sb .sb-m{display:block;font:500 11.5px/1.4 'IBM Plex Mono',ui-monospace,monospace;color:var(--mu,#9AA088)}" +
      "#ipr-sb .sb-e{display:inline-block;margin-top:3px;font:500 9.5px/1.4 'IBM Plex Mono',ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase;color:var(--mu,#9AA088);border:1px solid var(--ln2,#3C4B32);padding:0 5px;border-radius:2px;margin-right:4px}" +
      "#ipr-sb .err{margin:0 0 10px;padding:7px 9px;border-left:3px solid var(--ko,#E0705A);background:var(--p2,#1B2816);font-size:12.5px}" +
      "#ipr-sb .sb-a{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;padding:10px 16px 14px;border-top:1px solid var(--ln,#2E3A26)}" +
      "#ipr-sb .sb-b{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:8px 14px;border-radius:2px;border:1px solid var(--ln2,#3C4B32);background:transparent;color:var(--tx,#E4E2D8);font:500 13px Inter,sans-serif;cursor:pointer;text-decoration:none}" +
      "#ipr-sb .sb-b.pri{background:var(--ac,#94BE39);border-color:var(--ac,#94BE39);color:#141814;font-weight:600}.ipe.claro #ipr-sb .sb-b.pri{color:#fff}" +
      "#ipr-sb .sb-b:disabled{opacity:.45;cursor:default}" +
      "#ipr-sb .sb-b:focus-visible,#ipr-sb a:focus-visible,#ipr-sb input:focus-visible{outline:2px solid var(--ac2,#B3D466);outline-offset:2px}" +
      "#ipr-sb .prog{height:4px;background:var(--ln,#2E3A26);overflow:hidden;margin:6px 0 12px}#ipr-sb .prog i{display:block;height:100%;width:30%;background:var(--ac,#94BE39);animation:iprsb 1.4s ease-in-out infinite}@keyframes iprsb{0%{margin-left:-30%}100%{margin-left:100%}}" +
      ".ipr-sb-base{display:flex;flex-wrap:nowrap;align-items:center;gap:8px;margin:0 0 10px;padding:5px 6px 5px 8px;border:1px solid var(--ln2,#3C4B32);border-radius:2px;background:var(--p2,#1B2816);font:12px/1.35 Inter,system-ui,sans-serif;color:var(--mu,#9AA088)}" +
      ".ipr-sb-base>span{flex:0 0 auto;font:500 9.5px/1.4 'IBM Plex Mono',ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase}" +
      ".ipr-sb-base b{color:var(--tx,#E4E2D8);font-weight:600;flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
      ".ipr-sb-base button{margin-left:auto;min-height:28px;padding:3px 9px;border-radius:2px;border:1px solid var(--ln2,#3C4B32);background:transparent;color:var(--tx,#E4E2D8);font:500 11.5px Inter,sans-serif;cursor:pointer}.ipr-sb-base button:hover{border-color:var(--ac,#94BE39)}" +
      "@media (max-width:600px){#ipr-sb,#ipr-sb.lado{align-items:flex-end;justify-content:center;padding:8px}#ipr-sb .sb-c,#ipr-sb.lado .sb-c{max-width:none;max-height:min(70vh,calc(100vh - 16px))}#ipr-sb.lado .sb-c{max-height:56vh}#ipr-sb .sb-b{flex:1 1 auto}}";
    document.head.appendChild(st);
  }

  // ───────────── caixa ─────────────
  var M = null, antes = null, F = null;   // F: estado do fluxo {tipo, passo, ...}
  function caixa() {
    if (M && document.contains(M)) return M;
    css();
    M = document.createElement("div"); M.id = "ipr-sb"; M.hidden = true;
    M.addEventListener("click", cliqueCaixa);
    M.addEventListener("change", mudarCaixa);
    M.addEventListener("keydown", function (e) {
      if (e.key === "Escape" || e.key === "Esc") { e.preventDefault(); e.stopPropagation(); cancelar(); return; }
      if (e.key !== "Tab") return;
      var f = [].slice.call(M.querySelectorAll("a[href],button:not(:disabled),input:not(:disabled)"));
      if (!f.length) return;
      var i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    });
    (document.getElementById("ipe") || document.body).appendChild(M);   // dentro de .ipe herda o tema claro ou escuro
    return M;
  }
  // Telemóvel e tablet: a gaveta da esquerda tapa o mapa. Fecha-se pelo próprio Atlas (o mesmo que tocar no mapa).
  function fecharGaveta() {
    var R = document.getElementById("ipe"), Hm = document.getElementById("ipe-mapa");
    if (W.innerWidth > 900 || !R || !Hm || !R.classList.contains("esq-aberto")) return;
    try { Hm.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })); } catch (x) {}
  }
  function mostrar() {
    caixa();
    if (F && F.passo === "base") fecharGaveta();
    if (M.hidden) antes = document.activeElement;
    M.hidden = false; pintar();
    var f = M.querySelector("[data-sb-foco]") || M.querySelector("h2"); if (f) { try { f.focus(); } catch (x) {} }
  }
  function esconder() {
    if (!M) return;
    M.hidden = true; M.innerHTML = ""; M.className = "";
    if (antes && antes.focus && document.contains(antes)) { try { antes.focus(); } catch (x) {} }
    antes = null;
  }
  function cancelar() { F = null; esconder(); }

  function pintar() {
    if (!M || M.hidden || !F) return;
    var tp = F.tipo, h = "", acc = "";
    M.className = F.passo === "base" ? "lado" : "";
    var tit = { aviso: t("avisoT"), base: t("escT"), intel: t("intelT") }[F.passo] || "";
    h += '<div class="sb-c" role="dialog" aria-modal="' + (F.passo === "base" ? "false" : "true") + '" aria-labelledby="ipr-sb-t" lang="' + L() + '">';
    h += '<div class="sb-cab" data-t="' + tp + '">' + IC[tp] + '<h2 id="ipr-sb-t" tabindex="-1">' + esc(tit) + "</h2></div><div class=\"sb-corpo\">";
    if (F.passo === "intel") {
      h += "<p>" + esc(tn(C.sessao && W.tcdNonce ? "intelTx" : "intelAnon", tp)) + "</p>";
      if (!(C.sessao && W.tcdNonce)) acc += '<a class="sb-b" href="' + esc(U.entrar + (U.entrar.indexOf("?") < 0 ? "?" : "&") + "redirect_to=" + encodeURIComponent(location.pathname + location.search)) + '">' + esc(t("entrar")) + "</a>";
      acc += '<a class="sb-b pri" href="' + esc(U.planos) + '">' + esc(t("verIntel")) + '</a><button type="button" class="sb-b" data-sb="x" data-sb-foco>' + esc(t("fechar")) + "</button>";
    } else if (F.passo === "aviso") {
      if (F.erro) h += '<div class="err">' + esc(F.erro) + "</div>";
      if (!F.texto && !F.erro) h += '<div class="prog"><i></i></div><p class="sub">' + esc(t("aCarregar")) + "</p>";
      if (F.texto) {
        h += '<div class="sb-av">' + esc(F.texto) + "</div>";
        h += '<label class="sb-chk"><input type="checkbox" data-sb-k="chk"' + (F.chk ? " checked" : "") + " data-sb-foco> " + esc(t("chk_" + tp)) + "</label>";
      }
      acc += '<button type="button" class="sb-b" data-sb="x"' + (F.texto ? "" : " data-sb-foco") + ">" + esc(t("cancelar")) + "</button>";
      if (F.texto) acc += '<button type="button" class="sb-b pri" data-sb="aceitar"' + (F.chk && !F.ocupado ? "" : " disabled") + ">" + esc(t("aceitar")) + "</button>";
    } else if (F.passo === "base") {
      if (F.erro) h += '<div class="err">' + esc(F.erro) + "</div>";
      if (!F.bases) h += '<div class="prog"><i></i></div><p class="sub">' + esc(t("aCarregar")) + "</p>";
      else if (!F.bases.length) {
        h += "<p><b>" + esc(t("semBaseT")) + "</b></p><p class=\"sub\">" + esc(tn("semBase", tp)) + "</p>";
        acc += '<button type="button" class="sb-b" data-sb="x">' + esc(t("fechar")) + '</button><a class="sb-b pri" href="' + esc(U.encomenda) + '" data-sb-foco>' + esc(t("encomendar")) + "</a>";
      } else {
        var aberta = actualId();
        h += '<p class="sub">' + esc(tn("escSub", tp)) + '</p><ul class="sb-l" role="radiogroup" aria-labelledby="ipr-sb-t">';
        F.bases.forEach(function (b, i) {
          var sel = F.sel != null && String(F.sel) === String(b.id);
          var meta = [t("num") + " " + (b.pedido || ("#" + (b.encomenda || b.id))), b.area_ha ? nfmt(b.area_ha) + " ha" : ""].filter(Boolean).join(" · ");
          h += '<li><label class="' + (sel ? "on" : "") + '"><input type="radio" name="ipr-sb-base" value="' + esc(b.id) + '"' + (sel ? " checked" : "") + (i === 0 ? " data-sb-foco" : "") + ">" +
            '<span><span class="sb-n">' + esc(nomeBase(b)) + '</span><span class="sb-m">' + esc(meta) + "</span>" +
            (String(b.id) === aberta ? '<span class="sb-e">' + esc(t("aberta")) + "</span>" : "") + (b.dono === false ? '<span class="sb-e">' + esc(t("partilhada")) + "</span>" : "") + "</span></label></li>";
        });
        h += "</ul>";
        acc += '<button type="button" class="sb-b" data-sb="x">' + esc(t("cancelar")) + '</button><button type="button" class="sb-b pri" data-sb="simular"' + (F.sel != null && !F.ocupado ? "" : " disabled") + ">" + esc(t("simular")) + "</button>";
      }
      if (F.bases === null && F.erro) acc += '<button type="button" class="sb-b" data-sb="x" data-sb-foco>' + esc(t("fechar")) + "</button>";
    }
    h += "</div>" + (acc ? '<div class="sb-a">' + acc + "</div>" : "") + "</div>";
    var tinha = M.contains(document.activeElement) || document.activeElement === document.body;
    M.innerHTML = h;
    if (tinha) { var fo = M.querySelector("[data-sb-foco]") || M.querySelector("h2"); if (fo) { try { fo.focus(); } catch (x) {} } }
  }
  function nomeBase(b) { return b.local || b.nome || ("Base #" + (b.encomenda || b.id)); }

  function cliqueCaixa(e) {
    if (e.target === M && F && F.passo !== "base") { e.preventDefault(); return cancelar(); }
    var el = e.target.closest && e.target.closest("[data-sb]"); if (!el) return;
    e.preventDefault();
    var a = el.getAttribute("data-sb");
    if (a === "x") return cancelar();
    if (a === "aceitar") return aceitar();
    if (a === "simular") return confirmar();
  }
  function mudarCaixa(e) {
    var el = e.target; if (!F) return;
    if (el.getAttribute("data-sb-k") === "chk") { F.chk = el.checked; pintar(); var c = M.querySelector("[data-sb-k=chk]"); if (c) c.focus(); return; }
    if (el.name === "ipr-sb-base") { escolher(el.value); }
  }

  // ───────────── fluxo ─────────────
  function iniciar(tipo) {
    tipo = tipo === "fogo" ? "fogo" : "agua";
    if (!PODE[tipo]) { F = { tipo: tipo, passo: "intel" }; mostrar(); return; }
    // Regra de aceitação de cada simulador: a água guarda a versão aceite no navegador (agua-simulador.js); o fogo pergunta
    // ao site (fogo/aviso, «aceite»). Já aceite: segue directamente para a escolha da Base.
    F = { tipo: tipo, passo: "aviso", texto: null, chk: false };
    var f = F;
    if (tipo === "agua") {
      var ok = false; try { ok = localStorage.getItem("ipr_agua_aviso") === AVISO.versao.agua; } catch (x) {}
      if (ok) return irEscolha(f);
      f.texto = textoAviso("agua"); mostrar(); return;
    }
    mostrar();
    api("fogo/aviso").then(function (a) {
      if (F !== f) return;
      if (!a || !(a[L()] || a.pt)) throw new Error(t("avisoErro"));
      f.av = a;
      if (a.aceite) { var S = sim("fogo") && sim("fogo")._estado; if (S) { S.avisoTx = a; S.aviso = true; } return irEscolha(f); }
      f.texto = textoAviso("fogo", a); pintar();
    }).catch(function (er) { if (F !== f) return; f.erro = er && er.message || t("avisoErro"); pintar(); });
  }
  function irEscolha(f) {
    f.ocupado = false; f.passo = "base"; f.bases = null; f.erro = ""; f.sel = null;
    mostrar(); carregarBases(f);
  }

  function aceitar() {
    var f = F; if (!f || !f.chk || f.ocupado) return;
    f.ocupado = true; pintar();
    var p = f.tipo === "agua" ? api("agua/aviso", { method: "POST", body: {} }) : api("fogo/aviso", { method: "POST", body: { versao: f.av && f.av.versao } });
    p.then(function () {
      if (F !== f) return;
      var s = sim(f.tipo), S = s && s._estado;
      if (f.tipo === "agua") { try { localStorage.setItem("ipr_agua_aviso", AVISO.versao.agua); } catch (x) {} if (S) S.aviso = true; }
      else if (S) { S.avisoTx = Object.assign({}, f.av, { aceite: true }); S.aviso = true; }
      irEscolha(f);
    }).catch(function (er) { if (F !== f) return; f.ocupado = false; f.erro = er && er.message || t("avisoErro"); pintar(); });
  }

  function entregue(b) {
    if (!b || b.rever || b.id == null) return false;
    return b.estado_k === "completed" || b.estado_k === "entregue" || b.estado === "Entregue";
  }
  function carregarBases(f) {
    var e = est();
    var pronto = e && e.dados && !e.dados.bloqueado && Array.isArray(e.mapas) ? Promise.resolve(e.mapas) :
      (W.tcdNonce ? api("meus-mapas").then(function (d) {
        if (!d || d.bloqueado) return [];
        return (d.mapas || []).map(function (m) { m.dono = m.dono !== false; return m; }).concat((d.partilhados || []).map(function (m) { m.dono = false; return m; }));
      }) : Promise.resolve([]));
    pronto.then(function (l) {
      if (F !== f) return;
      var vistos = {};
      f.bases = (l || []).filter(function (b) { if (!entregue(b) || vistos[b.id]) return false; vistos[b.id] = 1; return true; });
      var ab = actualId(), ul = ""; try { ul = localStorage.getItem(ULTIMA) || ""; } catch (x) {}
      var tem = function (id) { return id && f.bases.some(function (b) { return String(b.id) === String(id); }); };
      if (f.bases.length === 1) f.sel = String(f.bases[0].id);
      else if (tem(ul)) f.sel = ul;
      else if (tem(ab)) f.sel = ab;
      pintar();
      var c = M && M.querySelector("input[name=ipr-sb-base]:checked") || M && M.querySelector("[data-sb-foco]"); if (c) { try { c.focus(); } catch (x) {} }
      if (f.sel != null) mostrarBase(f.sel);
    }).catch(function () { if (F !== f) return; f.bases = null; f.erro = t("erroBases"); pintar(); });
  }
  function baseDe(id) { return F && F.bases ? F.bases.filter(function (b) { return String(b.id) === String(id); })[0] : null; }

  function escolher(id) {
    if (!F || F.passo !== "base") return;
    F.sel = String(id); F.erro = ""; pintar();
    var r = M.querySelector('input[name=ipr-sb-base][value="' + String(id).replace(/"/g, "") + '"]'); if (r) { try { r.focus(); } catch (x) {} }
    mostrarBase(F.sel);
  }

  // Abre a Base no Atlas (cartão do próprio Atlas, como um clique em «Os meus locais») e enquadra o terreno.
  function cartao(id) {
    var e = est(); if (!e || !Array.isArray(e.mapas)) return null;
    var cs = document.querySelectorAll(".ipe-card[data-i]");
    for (var i = 0; i < cs.length; i++) { var m = e.mapas[+cs[i].getAttribute("data-i")]; if (m && String(m.id) === String(id)) return cs[i]; }
    return null;
  }
  function esperar(fn, ms) {
    return new Promise(function (res) { var t0 = Date.now(); (function v() { if (fn()) return res(true); if (Date.now() - t0 > ms) return res(false); setTimeout(v, 80); })(); });
  }
  function caixaGeo(gj) {   // mesma conta do enquadrar.js
    var b = [Infinity, Infinity, -Infinity, -Infinity];
    function per(c) { if (!c || !c.length) return; if (typeof c[0] === "number") { if (c[0] < b[0]) b[0] = c[0]; if (c[1] < b[1]) b[1] = c[1]; if (c[0] > b[2]) b[2] = c[0]; if (c[1] > b[3]) b[3] = c[1]; } else c.forEach(per); }
    try {
      if (typeof gj === "string") gj = JSON.parse(gj);
      var fs = gj && gj.type === "FeatureCollection" ? gj.features : [gj];
      (fs || []).forEach(function (f) { per(f && (f.geometry ? f.geometry.coordinates : f.coordinates)); });
    } catch (x) { return null; }
    return b[0] <= b[2] && isFinite(b[0]) ? b : null;
  }
  function enquadrar(b) {   // os mesmos parâmetros do enquadrar.js (abrir uma Base enquadrada no terreno)
    var Mp = ipe().mapa, bb = b && caixaGeo(b.geojson);
    if (!Mp || !bb) return;
    try {
      Mp.stop();
      if (bb[2] - bb[0] < 1e-6 && bb[3] - bb[1] < 1e-6) Mp.jumpTo({ center: [bb[0], bb[1]], zoom: 16.5, pitch: 0, bearing: 0 });
      else Mp.fitBounds([[bb[0], bb[1]], [bb[2], bb[3]]], { padding: folga(), maxZoom: 17.5, pitch: 0, bearing: 0, duration: 700 });
    } catch (x) {}
  }
  // Mapa pronto depois de o Atlas refazer o mapa ao mudar de Base.
  function mapaPronto() { var Mp = ipe().mapa; try { return !!Mp && Mp.loaded() && (!Mp.isStyleLoaded || Mp.isStyleLoaded()); } catch (x) { return false; } }
  function botaoVer(id) { return document.querySelector('#ipr-mb [data-mb="' + String(id).replace(/"/g, "") + '"] [data-mb-acc=ver]'); }
  // No telemóvel a escolha da Base ocupa a parte de baixo do ecrã: o terreno enquadra-se na parte de cima, que fica à vista.
  function telemovel() { return W.innerWidth <= 600; }
  function folga() {
    var p = W.innerWidth < 700 ? 30 : 70;
    var c = telemovel() && M && !M.hidden && M.querySelector(".sb-c"), Mp = ipe().mapa;
    if (!c || !Mp) return p;
    var r = c.getBoundingClientRect(), m = Mp.getContainer().getBoundingClientRect();
    var baixo = Math.max(p, Math.round(m.bottom - r.top) + 16);
    return baixo + p + 40 < m.height ? { top: p, left: p, right: p, bottom: baixo } : p;
  }
  var pedidoMostrar = 0;
  // Ao escolher uma Base na lista: abre-a (se ainda não estiver aberta) e enquadra o terreno. Usa o «Ver» da lista
  // «Os meus projectos» da esquerda (minhas-bases.js: abre pelo cartão do Atlas e enquadra quando o mapa está pronto);
  // sem essa lista, o cartão do separador Projectos e o mesmo enquadramento do enquadrar.js.
  function mostrarBase(id) {
    var n = ++pedidoMostrar, b = baseDe(id) || { id: id }, ver = telemovel() ? null : botaoVer(id), c = cartao(id);
    var depois = function (ok) {
      if (n !== pedidoMostrar) return ok;
      if (F && F.passo === "base") { var foco = document.activeElement && document.activeElement.name === "ipr-sb-base"; pintar(); if (foco) { var r = M && M.querySelector("input[name=ipr-sb-base]:checked"); if (r) { try { r.focus(); } catch (x) {} } } }
      return ok;
    };
    if (actualId() === String(id)) {
      if (ver) ver.click(); else enquadrar(b);
      return Promise.resolve(depois(true));
    }
    if (!c) { enquadrar(b); return Promise.resolve(depois(false)); }   // fora da lista do Atlas: só se enquadra; abre-se ao simular
    if (ver) {
      var li = ver.closest("[data-mb]"), tg = li && li.querySelector("[data-mb-acc=ab]");
      if (li && tg && !li.classList.contains("ab")) tg.click();   // a linha desta Base fica aberta na lista da esquerda
      ver = botaoVer(id) || ver;
      ver.click();
    } else c.click();
    return esperar(function () { return actualId() === String(id) && mapaPronto(); }, 15000).then(function (ok) {
      if (n === pedidoMostrar && !ver) enquadrar(baseDe(id) || (est() && est().actual) || b);
      return depois(ok);
    });
  }

  function confirmar() {
    var f = F; if (!f || f.passo !== "base" || f.sel == null || f.ocupado) return;
    var id = String(f.sel), tipo = f.tipo, s = sim(tipo);
    if (!s || !(ORIG[tipo] || typeof s.abrir === "function")) { f.erro = tn("indisp", tipo); pintar(); return; }
    f.ocupado = true; pintar();
    try { localStorage.setItem(ULTIMA, id); } catch (x) {}
    var feito = function () { F = null; esconder(); abrirPainel(tipo, id); };
    if (actualId() === id) return feito();
    mostrarBase(id).then(function (ok) {
      if (F !== f) return;
      if (ok || actualId() === id) return feito();
      // A Base não está na lista do Atlas aberta: abre-se pelo endereço e o painel abre sozinho depois de carregar.
      try { sessionStorage.setItem("ipr_sim_base", JSON.stringify({ tipo: tipo, id: id, t: Date.now() })); } catch (x) {}
      var q = new URLSearchParams(location.search); q.set("mapa", id); q.delete("modo");
      location.href = location.pathname + "?" + q.toString();
    });
  }

  function abrirPainel(tipo, id) {
    var s = sim(tipo); if (!s) return;
    var outro = tipo === "agua" ? "fogo" : "agua", so = sim(outro);   // um painel de cada vez, no mesmo sítio
    if (so && typeof so.fechar === "function" && painelAberto(outro)) { try { so.fechar(); } catch (x) {} }
    ESC[outro] = null;
    var S = s._estado;
    if (ESC[tipo] && ESC[tipo].id !== String(id)) limparEstado(tipo);
    ESC[tipo] = { id: String(id), aberto: false };
    if (S) { S.erro = ""; if (S.job && !S.job.id) S.job = null; }
    var fn = ORIG[tipo] || s.abrir;
    fecharGaveta();
    try { fn.call(s); } catch (x) {}
    ESC[tipo].aberto = true;
    rotularPainel(tipo);
  }
  var PAINEL = { agua: "ipr-as", fogo: "ipr-fs" };
  function painelAberto(tipo) { var P = document.getElementById(PAINEL[tipo]); return !!P && !P.hidden; }
  // Resultados, desenhos e trabalho em curso do terreno anterior saem do painel e do mapa (o trabalho continua no motor e
  // fica na lista da Base onde foi lançado).
  function limparEstado(tipo) {
    var s = sim(tipo), S = s && s._estado, Mp = ipe().mapa; if (!S) return;
    var pre = "ipr-" + (tipo === "agua" ? "as" : "fs") + "-";
    try {
      if (Mp && Mp.getStyle && Mp.getStyle()) {
        (Mp.getStyle().layers || []).forEach(function (l) { if (l.id.indexOf(pre) === 0 && Mp.getLayer(l.id)) Mp.removeLayer(l.id); });
        Object.keys(Mp.getStyle().sources || {}).forEach(function (k) { if (k.indexOf(pre) === 0 && Mp.getSource(k)) Mp.removeSource(k); });
      }
    } catch (x) {}
    S.res = null; S.job = null; S.erro = ""; S.camadas = {}; S.lista = []; S.feats = [];
    if (S.estados) S.estados = {};
    if (S.ultimos) S.ultimos = {};
    if (tipo === "fogo") { S.ign = []; S.zona = null; S.bloq = false; }
    if (S.des) S.des = null;
  }
  // Etiqueta da Base no topo do painel do simulador (o painel não diz em que terreno está).
  function rotularPainel(tipo) {
    var P = document.getElementById(PAINEL[tipo]), e = ESC[tipo];
    if (P && !P.__sbObs && W.MutationObserver) {   // o painel reescreve-se a cada actualização: repor a etiqueta logo
      P.__sbObs = new MutationObserver(function () { rotularPainel(tipo); });
      P.__sbObs.observe(P, { childList: true });
    }
    if (!P || P.hidden || !e) return;
    var corpo = P.querySelector(tipo === "agua" ? ".as-corpo" : ".fs-corpo"); if (!corpo) return;
    var a = est() && est().actual, b = a && String(a.id) === e.id ? a : null;
    var txt = b ? nomeBase(b) + " · " + t("num") + " " + (b.pedido || ("#" + (b.encomenda || b.id))) + (b.area_ha ? " · " + nfmt(b.area_ha) + " ha" : "") : "#" + e.id;
    var el = corpo.querySelector(":scope > .ipr-sb-base");
    if (el && el.getAttribute("data-t") === txt) return;
    if (!el) { el = document.createElement("p"); el.className = "ipr-sb-base"; corpo.insertBefore(el, corpo.firstChild); }
    el.setAttribute("data-t", txt);
    el.title = txt;
    el.innerHTML = '<span>' + esc(t("baseRot")) + "</span> <b>" + esc(txt) + '</b> <button type="button" data-ipr-sb-trocar="' + tipo + '">' + esc(t("trocar")) + "</button>";
  }

  // Depois de abrir a Base pelo endereço: retomar.
  (function retomar() {
    var p = null;
    try { p = JSON.parse(sessionStorage.getItem("ipr_sim_base") || "null"); sessionStorage.removeItem("ipr_sim_base"); } catch (x) { p = null; }
    if (!p || !p.id || !PODE[p.tipo] || Date.now() - (+p.t || 0) > 120000) return;
    esperar(function () { return actualId() === String(p.id) && sim(p.tipo); }, 20000).then(function (ok) {
      if (!ok) return;
      enquadrar(est().actual);
      abrirPainel(p.tipo, p.id);
    });
  })();

  // ───────────── botões ─────────────
  W.addEventListener("click", function (e) {
    var b = e.target && e.target.closest ? e.target.closest(SEL) : null;
    if (!b || (M && M.contains(b))) return;
    var tp = b.hasAttribute("data-fogo-sim") || b.getAttribute("data-ipr-sim-lock") === "fogo" ? "fogo" : "agua";
    e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    iniciar(tp);
  }, true);

  // Chamadas de outro código a IPR_AGUA_SIM.abrir / IPR_FOGO_SIM.abrir também passam pelo aviso e pela escolha.
  var ORIG = { agua: null, fogo: null };
  function embrulhar() {
    ["agua", "fogo"].forEach(function (tp) {
      var o = sim(tp);
      if (!o || typeof o.abrir !== "function" || o.abrir.__sb) return;
      ORIG[tp] = o.abrir;
      var f = function () { iniciar(tp); }; f.__sb = true; o.abrir = f;
    });
  }

  function marcar(b, tipo) {
    var est0 = b.hasAttribute("data-ipr-sim-lock") || !PODE[tipo] ? "intel" : (b.hasAttribute("data-sim-convite") ? "exp" : "ok");
    if (b.getAttribute("data-ipr-sim") !== tipo) b.setAttribute("data-ipr-sim", tipo);
    if (b.getAttribute("data-ipr-estado") !== est0) b.setAttribute("data-ipr-estado", est0);
    var velho = b.querySelector(".ipr-beta");
    var tag = b.querySelector(".ipr-sim-tag");
    var txt = t({ ok: "t_beta", intel: "t_intel", exp: "t_exp" }[est0]);
    if (velho) velho.remove();
    if (!tag || tag.getAttribute("data-l") !== L() + est0) {
      if (tag) tag.remove();
      tag = document.createElement("span"); tag.className = "ipr-sim-tag"; tag.setAttribute("data-l", L() + est0);
      tag.innerHTML = (est0 === "intel" ? IC.cad : "") + esc(txt);
      b.appendChild(tag);
    }
    if (est0 === "intel") b.setAttribute("aria-label", t("b_" + tipo) + " (" + txt + ")"); else b.removeAttribute("aria-label");
  }
  function lock(tipo, grande) {
    var b = document.createElement("button"); b.type = "button";
    b.setAttribute("data-ipr-sim-lock", tipo);
    if (grande) b.className = tipo === "fogo" ? "s f" : "s a";   // mesmas classes dos botões verdadeiros da faixa
    b.innerHTML = IC[tipo] + "<span>" + esc(t("b_" + tipo)) + "</span>";
    b.setAttribute("data-l", L());
    return b;
  }
  function rotuloLock(b, tipo) {
    if (b.getAttribute("data-l") === L()) return;
    var s = b.querySelector("span:not(.ipr-sim-tag)"); if (s) s.textContent = t("b_" + tipo);
    b.setAttribute("data-l", L());
  }
  function real(s, tipo) { return s && s.querySelector((tipo === "fogo" ? "[data-fogo-sim]" : "[data-agua-sim]") + ":not([data-sim-convite])"); }
  function garantir() {
    embrulhar();
    var w = document.getElementById("ipr-t62"); if (!w) return;
    var s, x;
    // quem não pode: botões pequenos «Versão Intelligence», nos mesmos sítios onde aparecia o aviso «Versão experimental»
    if (!PODE.agua) {
      s = w.querySelector(".ipr-ag-c .ipr-t62-f");
      if (s && !real(s, "agua")) { x = s.querySelector("[data-ipr-sim-lock=agua]"); if (!x) s.appendChild(lock("agua")); else rotuloLock(x, "agua"); }
    }
    if (!PODE.fogo) {
      var lig = w.querySelector('[data-t62="fogo"][aria-pressed="true"]');
      s = lig && w.querySelector(".ipr-t62-c:not(.ipr-ag-c) .ipr-t62-f");
      if (s && !real(s, "fogo")) { x = s.querySelector("[data-ipr-sim-lock=fogo]"); if (!x) s.appendChild(lock("fogo")); else rotuloLock(x, "fogo"); }
    }
    var d = w.querySelector(":scope > .ipr-sims");
    if (d) {
      if (!PODE.agua && !real(d, "agua") && !d.querySelector("[data-ipr-sim-lock=agua]")) d.appendChild(lock("agua", true));
      if (!PODE.fogo && !real(d, "fogo") && !d.querySelector("[data-ipr-sim-lock=fogo]")) { var h = d.querySelector(".h"); d.insertBefore(lock("fogo", true), h ? h.nextSibling : d.firstChild); }
    }
    // um só estilo e uma só etiqueta de estado em todos os botões dos simuladores
    [].forEach.call(w.querySelectorAll(SEL), function (b) {
      if (b.hasAttribute("data-sim-convite")) return;
      var tp = b.hasAttribute("data-fogo-sim") || b.getAttribute("data-ipr-sim-lock") === "fogo" ? "fogo" : "agua";
      marcar(b, tp);
    });
  }

  // Painel fechado: a escolha deixa de valer (ao voltar a abrir, volta a escolha da Base).
  // Mudou de terreno com o painel aberto (lista da esquerda, «Os meus locais», ?mapa=): o painel segue a Base nova se ela
  // for uma Base entregue desta conta, sem os resultados nem os desenhos da anterior; senão fecha-se.
  function vigiarPaineis() {
    ["agua", "fogo"].forEach(function (tp) {
      var e = ESC[tp]; if (!e || !e.aberto) return;
      if (!painelAberto(tp)) { ESC[tp] = null; return; }
      var ab = actualId(), s = sim(tp);
      if (ab === e.id) { rotularPainel(tp); return; }
      limparEstado(tp);
      var a = est() && est().actual;
      if (ab && entregue(a)) {
        ESC[tp] = { id: ab, aberto: true };
        try { localStorage.setItem(ULTIMA, ab); } catch (x) {}
        try { (ORIG[tp] || s.abrir).call(s); } catch (x) {}
        rotularPainel(tp);
        var alvo = ab;   // enquadrar o terreno novo quando o mapa estiver pronto (o Atlas refaz o mapa ao mudar de Base)
        esperar(function () { return actualId() === alvo && mapaPronto(); }, 15000).then(function (ok) { if (ok && actualId() === alvo) setTimeout(function () { enquadrar(est().actual); }, 300); });
      } else {
        ESC[tp] = null;
        try { s.fechar(); } catch (x) {}
      }
    });
  }

  var obsEl = null, obs = null, pend = false;
  function agendar() { if (pend) return; pend = true; setTimeout(function () { pend = false; if (obs) obs.disconnect(); garantir(); if (obs && obsEl) obs.observe(obsEl, OPT); }, 0); }
  var OPT = { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-pressed"] };
  function observar() {
    var w = document.getElementById("ipr-t62");
    if (w && w !== obsEl && W.MutationObserver) {
      if (obs) obs.disconnect();
      obsEl = w; obs = new MutationObserver(agendar); obs.observe(w, OPT);
    }
    garantir();
  }
  css();
  // Esc fecha a caixa mesmo quando o foco não está nela (depois de carregar o aviso, ou de tocar no mapa ao escolher a Base).
  document.addEventListener("keydown", function (e) {
    if ((e.key === "Escape" || e.key === "Esc") && M && !M.hidden && !M.contains(e.target)) { e.preventDefault(); e.stopPropagation(); cancelar(); }
  }, true);
  setInterval(function () { if (!document.hidden) observar(); }, 1000);
  setInterval(function () { if (!document.hidden) { vigiarPaineis(); limparOrfas("agua"); limparOrfas("fogo"); } }, 300);
  // «Trocar» na etiqueta da Base do painel: volta à escolha (sem repetir o aviso já aceite).
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest ? e.target.closest("[data-ipr-sb-trocar]") : null; if (!b) return;
    e.preventDefault(); e.stopPropagation(); iniciar(b.getAttribute("data-ipr-sb-trocar"));
  }, true);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", observar); else observar();
  document.addEventListener("ipr:lingua", function () { garantir(); pintar(); });

  W.IPR_SIM_BASE_UI = { iniciar: iniciar, cancelar: cancelar, _esc: ESC };
})(window);
