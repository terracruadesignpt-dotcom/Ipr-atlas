/* IPR Atlas · Simular água no mapa de demonstração do Mira (04/11/2026). Pedido do Nuno, 10h44-10h50: a bacia do Mira
   (área de teste IPR) serve de mapa de demonstração para toda a gente, com aviso de que não tem todas as camadas e sem
   nada para descarregar; «Simular ao vivo, com limite»: só na área de demonstração, uma simulação por pessoa por dia,
   e com o motor ocupado com clientes vai para a fila nocturna. O site decide tudo (módulo m90741); este ficheiro só
   mostra o painel, pede ao site e desenha o resultado (pacote leve do m90740: imagem reduzida e pontos).
   Só acrescenta: não mexe no agua-simulador.js, no simuladores-convite.js nem no area-teste-ipr.js. Liga-se pelo DOM
   (grupo «Área de teste IPR» na calha, #ipe-cam; tema «Água no terreno», #ipr-t62) e lê window.IPR_AGUA_DEMO (escrito
   pelo site nas páginas do Atlas). Expõe window.IPRAguaDemo (abrir, fechar, estado) para o agua-partilha.js.
   Desliga-se com ?agua-demo=0 ou localStorage ipr_agua_demo_off=1. Terracrua Design. */
(function (W) {
  "use strict";
  var Doc = document;
  try {
    if (/[?&]agua-demo=0\b/.test(location.search) || W.localStorage.getItem("ipr_agua_demo_off") === "1") return;
  } catch (e) {}
  if (W.__iprAguaDemo) return; W.__iprAguaDemo = 1;
  var CFG = W.IPR_AGUA_DEMO;
  if (!CFG || !CFG.lim || !CFG.area) return;   // site sem demonstração: nada aparece

  var TX = {
    pt: {
      botao: "Simular água", botaoT: "Simular água no mapa de demonstração", titulo: "Simular água · demonstração",
      faixa: "Mapa de demonstração na bacia do Mira: mostra o aspecto de uma Base Cartográfica, mas não tem todas as camadas. Nada se descarrega.",
      regras: "Uma simulação por pessoa por dia, só nesta área. Os clientes com Base têm prioridade no motor: se estiver ocupado, a sua corre de noite ({n}) e o resultado fica aqui.",
      fechado: "A demonstração do simulador está fechada de momento.", aCarregar: "A carregar…",
      semConta: "Para simular no mapa de demonstração, entre ou crie uma conta gratuita (serve para contar uma simulação por pessoa por dia).", entrar: "Entrar ou criar conta",
      avisoT: "Aviso importante", avisoTx: "O Simulador de Água do IPR Atlas está em testes e serve apenas para informação e aprendizagem. Os resultados são estimativas de um modelo, com as incertezas do terreno (LiDAR), da chuva, dos solos e do próprio modelo, e podem estar errados. Não servem para decisões sobre a segurança de pessoas e bens, protecção civil, evacuação, dimensionamento de obras ou licenciamento, e não substituem estudos de hidrologia e hidráulica assinados por técnico habilitado nem a informação oficial (APA, ANEPC, IPMA, câmara municipal). Em situação de cheia ou de perigo, siga as indicações da Protecção Civil e, em emergência, ligue 112. A Terracrua Design não se responsabiliza por decisões tomadas com base nestes resultados.",
      avisoChk: "Li e compreendo: os resultados são informativos, estão em testes e não servem para decisões de segurança.", aceitar: "Aceitar e continuar",
      tab_ret: "Onde a água pára", tab_2d: "Chuva no terreno",
      d_ret: "Distribui a chuva pelas depressões reais do terreno de demonstração: onde a água fica e quanto cabe. É estático: não dá tempos nem caudais.",
      d_2d: "Simulação dinâmica 2D sobre o MDT LiDAR do terreno de demonstração: altura máxima da água e caudal à saída. Demora alguns minutos.",
      cenarios: "Alturas de chuva (mm, até {n}, separadas por vírgulas)", total: "Altura de chuva", duracao: "Duração", horas: "Horas a simular depois da chuva",
      m_livre: "Chuva livre", m_proj: "Chuva de projecto (IDF)", T: "Período de retorno", anos: "anos", f_uni: "Uniforme", f_tri: "Triangular (pico a 3/8)", forma: "Forma",
      semRetorno: "Sem período de retorno: são alturas de chuva, não probabilidades.",
      simular: "Simular", aEnviar: "A enviar…", jaHoje: "Já fez a simulação de hoje. Pode fazer outra amanhã.", pendente: "Tem uma simulação à espera.",
      e_fila: "Na fila: {p}.º lugar. Segue para o motor quando estiver livre.", e_noite: "Vai correr esta noite ({n}). Pode fechar a página: o resultado fica aqui.",
      e_motor: "A calcular no motor…", e_feito: "Concluída", e_falhou: "Não foi possível simular", e_cancelado: "Cancelada",
      cancelar: "Cancelar", minhas: "As minhas simulações de demonstração", nenhuma: "Ainda não fez nenhuma simulação de demonstração.", ver: "Ver",
      resultados: "Resultado", enquadrar: "Enquadrar", camadas: "No mapa", semMapa: "Este resultado não tem camada para o mapa.",
      chuvaUtil: "Chuva útil", retido: "Retido", saido: "Saiu do terreno", depressoes: "Depressões", capacidade: "Capacidade total",
      pico: "Caudal de pico à saída", aos: "aos", saida: "Saída medida", infiltracao: "Infiltração", armazenado: "Ficou no terreno", erro: "Erro do balanço",
      pontos: "Zonas com água acima de {l} m: {z}", limite: "Terreno de demonstração", aviso: "Estimativas de um modelo em testes. Não usar para decisões de segurança. Emergência: 112.",
      fechar: "Fechar", min: "Minimizar", notaGrupo: "Mapa de demonstração: mostra o aspecto de uma Base Cartográfica, mas não tem todas as camadas. Nada se descarrega."
    },
    en: {
      botao: "Simulate water", botaoT: "Simulate water on the demo map", titulo: "Simulate water · demo",
      faixa: "Demo map in the Mira basin: it shows what a Base Map looks like, but it does not have all the layers. Nothing can be downloaded.",
      regras: "One simulation per person per day, only in this area. Customers with a Base have priority on the engine: if it is busy, yours runs at night ({n}) and the result stays here.",
      fechado: "The simulator demo is closed at the moment.", aCarregar: "Loading…",
      semConta: "To simulate on the demo map, sign in or create a free account (it is used to count one simulation per person per day).", entrar: "Sign in or create an account",
      avisoT: "Important notice", avisoTx: "The IPR Atlas Water Simulator is in testing and is for information and learning only. Results are model estimates, with the uncertainties of the terrain (LiDAR), the rain, the soils and the model itself, and may be wrong. They are not for decisions about the safety of people and property, civil protection, evacuation, sizing of works or licensing, and do not replace hydrology and hydraulics studies signed by a qualified professional or official information. In a flood or danger, follow Civil Protection instructions and, in an emergency, call 112. Terracrua Design is not liable for decisions based on these results.",
      avisoChk: "I have read and understand: results are informative, in testing and not for safety decisions.", aceitar: "Accept and continue",
      tab_ret: "Where water stops", tab_2d: "Rain on the land",
      d_ret: "Spreads the rain over the real depressions of the demo terrain: where water stays and how much fits. Static: no times or flows.",
      d_2d: "Dynamic 2D simulation on the LiDAR DTM of the demo terrain: maximum water depth and outflow. Takes a few minutes.",
      cenarios: "Rainfall depths (mm, up to {n}, comma separated)", total: "Rainfall", duracao: "Duration", horas: "Hours to simulate after the rain",
      m_livre: "Free rain", m_proj: "Design rain (IDF)", T: "Return period", anos: "years", f_uni: "Uniform", f_tri: "Triangular (peak at 3/8)", forma: "Shape",
      semRetorno: "No return period: these are rainfall depths, not probabilities.",
      simular: "Simulate", aEnviar: "Sending…", jaHoje: "You have run today's simulation. You can run another tomorrow.", pendente: "You have a simulation waiting.",
      e_fila: "In the queue: position {p}. It goes to the engine when it is free.", e_noite: "It will run tonight ({n}). You can close the page: the result stays here.",
      e_motor: "Running on the engine…", e_feito: "Done", e_falhou: "Could not simulate", e_cancelado: "Cancelled",
      cancelar: "Cancel", minhas: "My demo simulations", nenhuma: "You have not run any demo simulation yet.", ver: "View",
      resultados: "Result", enquadrar: "Zoom to", camadas: "On the map", semMapa: "This result has no map layer.",
      chuvaUtil: "Effective rain", retido: "Retained", saido: "Left the terrain", depressoes: "Depressions", capacidade: "Total capacity",
      pico: "Peak outflow", aos: "at", saida: "Measured outflow", infiltracao: "Infiltration", armazenado: "Stayed on the land", erro: "Balance error",
      pontos: "Areas with water above {l} m: {z}", limite: "Demo terrain", aviso: "Estimates from a model in testing. Not for safety decisions. Emergency: 112.",
      fechar: "Close", min: "Minimise", notaGrupo: "Demo map: it shows what a Base Map looks like, but it does not have all the layers. Nothing can be downloaded."
    }
  };
  function L() { return (W.IPR_LINGUA || Doc.documentElement.lang || "pt").slice(0, 2) === "en" ? "en" : "pt"; }
  function t(k) { var d = TX[L()]; return k in d ? d[k] : (TX.pt[k] || k); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function n(x, d) { if (x == null || isNaN(x)) return "–"; return Number(x).toLocaleString(L() === "en" ? "en-GB" : "pt-PT", { maximumFractionDigits: d == null ? 1 : d }); }
  function noite() { var a = CFG.noite || [1, 6]; function h(x) { return (x < 10 ? "0" : "") + x + "h"; } return h(a[0]) + "-" + h(a[1]); }
  function mapa() { return W.__ipe && W.__ipe.mapa; }
  var REST = "/wp-json/tcd/v1/";
  function api(c, op) {
    op = op || {}; op.credentials = "same-origin"; op.headers = op.headers || {};
    if (W.tcdNonce) op.headers["X-WP-Nonce"] = W.tcdNonce;
    if (op.body && typeof op.body !== "string") { op.body = JSON.stringify(op.body); op.headers["Content-Type"] = "application/json"; }
    return fetch(REST + c, op).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var er = new Error(j && j.message || ("HTTP " + r.status)); er.estado = r.status; er.codigo = j && j.code; throw er; } return j; }); });
  }
  function comNonce(u) { return W.tcdNonce ? u + (u.indexOf("?") < 0 ? "?" : "&") + "_wpnonce=" + encodeURIComponent(W.tcdNonce) : u; }

  var S = { tab: (CFG.processos || [])[0] === "simulacao-2d" ? "2d" : "ret", est: null, erro: "", aEnviar: false, chk: false,
    cen: "20, 50, 100", chuva: { modo: "livre", total_mm: 40, duracao_h: 1, forma: "uniforme", T: 10 }, horas: 1, ver: null, cam: {} };
  var PROC = { ret: "retencao-rapida", "2d": "simulacao-2d" }, TAB = { "retencao-rapida": "ret", "simulacao-2d": "2d" };

  // ───────────── estilos ─────────────
  function css() {
    if (Doc.getElementById("ipr-ad-css")) return;
    var st = Doc.createElement("style"); st.id = "ipr-ad-css";
    st.textContent =
      "#ipr-ad{position:absolute;z-index:42;top:12px;right:12px;width:380px;max-width:calc(100% - 24px);max-height:calc(100% - 24px);display:flex;flex-direction:column;background:var(--p1,#171a13);color:var(--tx,#ebe7d8);border:1px solid var(--ln2,#3b4232);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.35);font:13px/1.45 Inter,system-ui,sans-serif;overflow:hidden}" +
      "#ipr-ad[hidden]{display:none}#ipr-ad *{box-sizing:border-box}#ipr-ad.min .ad-corpo,#ipr-ad.min .ad-tabs{display:none}" +
      "#ipr-ad .ad-cab{display:flex;align-items:center;gap:8px;padding:9px 10px 9px 12px;border-bottom:1px solid var(--ln,#2b3024);background:var(--p2,#1d2118)}#ipr-ad .ad-cab b{flex:1;font:600 13.5px Raleway,Inter,sans-serif}" +
      "#ipr-ad .ad-ib{border:0;background:transparent;color:var(--mu,#a3a690);cursor:pointer;width:30px;height:30px;border-radius:7px;font:600 15px Inter,sans-serif}#ipr-ad .ad-ib:hover{background:var(--acs,rgba(168,184,120,.16));color:var(--tx,#ebe7d8)}" +
      "#ipr-ad .ad-tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:8px;border-bottom:1px solid var(--ln,#2b3024)}#ipr-ad .ad-tabs button{border:1px solid var(--ln,#2b3024);background:transparent;color:var(--mu,#a3a690);font:500 11.5px Inter,sans-serif;padding:6px 8px;border-radius:999px;cursor:pointer}#ipr-ad .ad-tabs button[aria-selected=true]{background:var(--acs,rgba(168,184,120,.16));color:var(--tx,#ebe7d8)}" +
      "#ipr-ad .ad-corpo{overflow:auto;padding:10px 12px 12px;flex:1 1 auto;min-height:0;overscroll-behavior:contain}#ipr-ad p{margin:0 0 8px}#ipr-ad .sub{color:var(--mu,#a3a690);font-size:12px}" +
      "#ipr-ad .faixa{margin:0 0 10px;padding:6px 9px;border-radius:8px;background:rgba(217,164,65,.14);border:1px solid #d9a441;font-size:11.5px;line-height:1.4}" +
      "#ipr-ad .h{display:block;font:600 10.5px Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--mu,#a3a690);margin:12px 0 6px}" +
      "#ipr-ad label.f{display:flex;flex-direction:column;gap:3px;margin:0 0 8px;font-size:12px}#ipr-ad .ln{display:flex;gap:6px;align-items:center}#ipr-ad .un{font:500 11px 'IBM Plex Mono',monospace;color:var(--mu,#a3a690);min-width:24px}" +
      "#ipr-ad input[type=number],#ipr-ad input[type=text],#ipr-ad select{width:100%;min-width:0;height:32px;padding:4px 8px;border-radius:7px;border:1px solid var(--ln2,#3b4232);background:var(--bg,#121410);color:var(--tx,#ebe7d8);font:13px Inter,sans-serif}" +
      "#ipr-ad .b{font:500 12.5px Inter,sans-serif;padding:7px 11px;border-radius:8px;border:1px solid var(--ln2,#3b4232);background:transparent;color:var(--tx,#ebe7d8);cursor:pointer;min-height:34px;text-decoration:none;display:inline-flex;align-items:center}#ipr-ad .b:hover{border-color:var(--ac,#a8b878)}#ipr-ad .b.pri{background:var(--ac,#a8b878);border-color:var(--ac,#a8b878);color:#141814;font-weight:600}#ipr-ad .b:disabled{opacity:.45;cursor:default}" +
      "#ipr-ad .acc{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}#ipr-ad .nota{font-size:11.5px;color:var(--mu,#a3a690);margin:6px 0}#ipr-ad .err{margin:8px 0;padding:7px 9px;border-left:3px solid #d9534f;background:var(--p2,#1d2118);font-size:12px}" +
      "#ipr-ad .avbox{border:1px solid #d9a441;border-radius:10px;padding:10px;background:var(--p2,#1d2118)}#ipr-ad .avbox p{font-size:12px;margin:6px 0 10px}#ipr-ad .chk{display:flex;gap:8px;align-items:flex-start;font-size:12px}" +
      "#ipr-ad .kv{display:grid;grid-template-columns:1fr auto;gap:2px 10px;font-size:12px;margin:0 0 6px}#ipr-ad .kv span:nth-child(2n){font:500 12px 'IBM Plex Mono',monospace;text-align:right}" +
      "#ipr-ad .leg{display:flex;height:8px;border-radius:4px;overflow:hidden;margin:2px 0 1px}#ipr-ad .leg i{flex:1}#ipr-ad .legv{display:flex;justify-content:space-between;font:500 10px 'IBM Plex Mono',monospace;color:var(--mu,#a3a690)}" +
      "#ipr-ad .cam label{display:flex;gap:6px;align-items:center;font-size:12px;margin:0 0 4px}" +
      "#ipr-ad ul.ls{margin:0;padding:0;list-style:none;font-size:12px}#ipr-ad ul.ls li{display:flex;gap:6px;align-items:center;justify-content:space-between;padding:4px 0;border-top:1px solid var(--ln,#2b3024)}#ipr-ad ul.ls a{color:var(--ac,#a8b878)}" +
      "#ipr-ad .est{display:inline-block;padding:0 6px;border-radius:999px;font:500 10px Inter,sans-serif;border:1px solid var(--ln,#2b3024);color:var(--mu,#a3a690)}#ipr-ad .est.motor{border-color:var(--ac,#a8b878);color:var(--ac,#a8b878)}#ipr-ad .est.falhou{border-color:#d9534f;color:#d9534f}" +
      "#ipr-ad .prog{height:4px;border-radius:2px;background:var(--ln,#2b3024);overflow:hidden;margin:8px 0}#ipr-ad .prog i{display:block;height:100%;width:30%;background:var(--ac,#a8b878);animation:iprad 1.4s ease-in-out infinite}@keyframes iprad{0%{margin-left:-30%}100%{margin-left:100%}}" +
      "#ipr-ad .ad-res{border:1px solid var(--ln2,#3b4232);border-radius:9px;padding:8px 10px;margin:8px 0;background:var(--p2,#1d2118)}" +
      "[data-agua-demo]{display:inline-flex;align-items:center;gap:5px;cursor:pointer}.ipr-ad-nota{margin:4px 0 8px;padding:6px 9px;border-radius:8px;border:1px solid #d9a441;background:rgba(217,164,65,.12);font-size:11.5px;line-height:1.4}" +
      ".ipr-atipr-enq[data-agua-demo]{margin-left:6px}" +
      "@media (max-width:600px){#ipr-ad{left:8px!important;right:8px;top:auto!important;bottom:60px;width:auto;max-width:none;max-height:min(66vh,calc(100% - 76px))}}";
    Doc.head.appendChild(st);
  }

  // ───────────── estado no site ─────────────
  var timer = null, ultimoPedido = 0;
  function pendente(e) { return e && (e.pedidos || []).filter(function (p) { return p.estado === "fila" || p.estado === "noite" || p.estado === "motor"; })[0]; }
  function carregar() {
    clearTimeout(timer); ultimoPedido = Date.now();
    return api("agua-demo/estado").then(function (e) {
      S.est = e; S.erro = "";
      if (!S.ver && e.pedidos && e.pedidos.length && e.pedidos[0].estado === "feito") S.ver = e.pedidos[0].id;
      pintar(); desenhar(); agendar();
    }).catch(function (er) { S.erro = er.message; pintar(); agendar(); });
  }
  function agendar() {
    clearTimeout(timer);
    if (!P || P.hidden) return;
    var p = pendente(S.est); if (!p) return;
    var ms = Doc.hidden ? 60000 : p.estado === "motor" ? 15000 : p.estado === "fila" ? 20000 : 120000;
    timer = setTimeout(carregar, ms);
  }
  Doc.addEventListener("visibilitychange", function () { if (!Doc.hidden && P && !P.hidden && pendente(S.est) && Date.now() - ultimoPedido > 10000) carregar(); });

  // ───────────── painel ─────────────
  var P = null;
  function painel() {
    if (P) return P; css();
    P = Doc.createElement("div"); P.id = "ipr-ad"; P.setAttribute("role", "dialog"); P.setAttribute("aria-label", t("titulo")); P.hidden = true;
    var M = mapa(), host = (M && M.getContainer && M.getContainer().parentNode) || Doc.body;
    host.appendChild(P);
    P.addEventListener("click", clique); P.addEventListener("change", mudar); P.addEventListener("input", mudar);
    return P;
  }
  function abrir() {
    var as = Doc.getElementById("ipr-as"); if (as && !as.hidden && W.IPR_AGUA_SIM && W.IPR_AGUA_SIM.fechar) { try { W.IPR_AGUA_SIM.fechar(); } catch (e) {} }
    painel().hidden = false; pintar(); limite(true); enquadrarLimite(); carregar();
  }
  function fechar() { if (P) P.hidden = true; clearTimeout(timer); limite(false); limparCamadas(); }

  function pintar() {
    if (!P || P.hidden) return;
    var e = S.est, h = '<div class="ad-cab"><b>' + esc(t("titulo")) + '</b><button class="ad-ib" data-ad="min" title="' + esc(t("min")) + '" aria-label="' + esc(t("min")) + '">–</button><button class="ad-ib" data-ad="x" title="' + esc(t("fechar")) + '" aria-label="' + esc(t("fechar")) + '">×</button></div>';
    var pode = e && e.ligado && e.sessao && e.aviso_ok;
    if (pode) h += '<div class="ad-tabs" role="tablist">' + (CFG.processos || []).map(function (p) { var k = TAB[p]; return k ? '<button role="tab" data-tab="' + k + '" aria-selected="' + (S.tab === k) + '">' + esc(t("tab_" + k)) + "</button>" : ""; }).join("") + "</div>";
    h += '<div class="ad-corpo">' + corpo() + "</div>";
    var c0 = P.querySelector(".ad-corpo"), sc = c0 ? c0.scrollTop : 0;
    P.innerHTML = h;
    if (sc) { var c1 = P.querySelector(".ad-corpo"); if (c1) c1.scrollTop = sc; }
    try { Doc.dispatchEvent(new CustomEvent("ipr:agua-demo-pintado")); } catch (x) {}
  }
  function corpo() {
    var e = S.est, h = '<p class="faixa">' + esc(t("faixa")) + "</p>";
    if (!e) return h + '<p class="sub">' + esc(S.erro || t("aCarregar")) + "</p>";
    if (!e.ligado) return h + '<p class="sub">' + esc(t("fechado")) + "</p>";
    h += '<p class="sub">' + esc(t("regras").replace("{n}", noite())) + "</p>";
    if (!e.sessao) return h + '<p>' + esc(t("semConta")) + '</p><div class="acc"><a class="b pri" href="' + esc((CFG.entrar || "/conta/") + "?redirect_to=" + encodeURIComponent(location.pathname + location.search)) + '">' + esc(t("entrar")) + "</a></div>";
    if (!e.aviso_ok) {
      return h + '<div class="avbox"><b>' + esc(t("avisoT")) + "</b><p>" + esc(t("avisoTx")) + '</p><label class="chk"><input type="checkbox" data-k="chk"' + (S.chk ? " checked" : "") + "> " + esc(t("avisoChk")) + '</label><div class="acc"><button class="b pri" data-ad="aceitar"' + (S.chk ? "" : " disabled") + ">" + esc(t("aceitar")) + "</button></div></div>" + (S.erro ? '<div class="err">' + esc(S.erro) + "</div>" : "");
    }
    h += '<p class="sub">' + esc(t("d_" + S.tab)) + "</p>" + formulario();
    var pend = pendente(e), bloq = (e.hoje_usado && !e.isento) || (pend && !e.isento) || S.aEnviar;
    h += '<div class="acc"><button class="b pri" data-ad="simular"' + (bloq ? " disabled" : "") + ">" + esc(S.aEnviar ? t("aEnviar") : t("simular")) + "</button></div>";
    if (!S.aEnviar && !e.isento) { if (pend) h += '<p class="nota">' + esc(t("pendente")) + "</p>"; else if (e.hoje_usado) h += '<p class="nota">' + esc(t("jaHoje")) + "</p>"; }
    if (S.erro) h += '<div class="err">' + esc(S.erro) + "</div>";
    h += lista();
    h += '<p class="nota">' + esc(t("aviso")) + "</p>";
    return h;
  }
  function campo(k, rot, v, un, mn, mx, st) {
    return '<label class="f">' + esc(t(rot)) + '<span class="ln"><input type="number" data-k="' + k + '" value="' + esc(v) + '" min="' + mn + '" max="' + mx + '" step="' + st + '"><span class="un">' + esc(un) + "</span></span></label>";
  }
  function formulario() {
    var lim = CFG.lim, c = S.chuva, h = "";
    if (S.tab === "ret") return '<label class="f">' + esc(t("cenarios").replace("{n}", lim.n_cen)) + '<input type="text" data-k="cen" value="' + esc(S.cen) + '"></label><p class="nota">' + esc(t("semRetorno")) + "</p>";
    h += '<label class="f"><select data-k="cmodo"><option value="livre"' + (c.modo === "livre" ? " selected" : "") + ">" + esc(t("m_livre")) + '</option><option value="projecto"' + (c.modo === "projecto" ? " selected" : "") + ">" + esc(t("m_proj")) + "</option></select></label>";
    if (c.modo === "livre") {
      h += campo("total_mm", "total", c.total_mm, "mm", 1, lim.mm_2d, 1);
      h += '<label class="f">' + esc(t("forma")) + '<select data-k="forma"><option value="uniforme"' + (c.forma === "uniforme" ? " selected" : "") + ">" + esc(t("f_uni")) + '</option><option value="triangular"' + (c.forma === "triangular" ? " selected" : "") + ">" + esc(t("f_tri")) + "</option></select></label>";
    } else {
      h += '<label class="f">' + esc(t("T")) + '<select data-k="T">' + [2, 5, 10, 20, 50, 100].map(function (x) { return '<option value="' + x + '"' + (+c.T === x ? " selected" : "") + ">" + x + " " + esc(t("anos")) + "</option>"; }).join("") + "</select></label>";
    }
    h += campo("duracao_h", "duracao", c.duracao_h, "h", 0.25, lim.dur_h, 0.25) + campo("horas", "horas", S.horas, "h", 0, lim.horas, 0.5);
    return h;
  }
  function estadoTx(p) {
    if (p.estado === "fila") return t("e_fila").replace("{p}", p.posicao || 1);
    if (p.estado === "noite") return t("e_noite").replace("{n}", noite());
    return t("e_" + p.estado);
  }
  function lista() {
    var ps = (S.est && S.est.pedidos) || [], h = '<span class="h">' + esc(t("minhas")) + "</span>";
    if (!ps.length) return h + '<p class="nota">' + esc(t("nenhuma")) + "</p>";
    h += '<ul class="ls">' + ps.map(function (p) {
      var data = new Date(p.criado).toLocaleString(L() === "en" ? "en-GB" : "pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
      var acc = p.estado === "feito" ? '<a href="#" data-ver="' + p.id + '">' + esc(t("ver")) + "</a>" : (p.estado === "fila" || p.estado === "noite" || p.estado === "motor") ? '<a href="#" data-cancelar="' + p.id + '">' + esc(t("cancelar")) + "</a>" : "";
      return "<li><span>" + esc(t("tab_" + (TAB[p.processo] || "ret"))) + " · " + esc(data) + ' <span class="est ' + esc(p.estado) + '">' + esc(t("e_" + p.estado)) + "</span></span>" + acc + "</li>";
    }).join("") + "</ul>";
    var pend = pendente(S.est);
    if (pend) {
      h += '<div class="ad-res" data-demo-pend="' + pend.id + '">' + (pend.estado === "motor" ? '<div class="prog"><i></i></div>' : "") + "<p>" + esc(estadoTx(pend)) + "</p>" + (pend.msg ? '<p class="nota">' + esc(pend.msg) + "</p>" : "") + "</div>";
    }
    var v = ps.filter(function (p) { return p.id === S.ver; })[0];
    if (v && v.estado === "feito") h += resultado(v);
    var f = ps[0]; if (f && f.estado === "falhou" && f.msg) h += '<div class="err">' + esc(t("e_falhou")) + ": " + esc(f.msg) + "</div>";
    return h;
  }
  function resultado(p) {
    var s = p.resumo || {}, h = '<div class="ad-res" data-demo-id="' + p.id + '"><span class="h" style="margin-top:0">' + esc(t("resultados")) + " · " + esc(t("tab_" + (TAB[p.processo] || "ret"))) + "</span>";
    h += numeros(p.processo, s);
    var cs = p.camadas || [];
    if (!cs.length) h += '<p class="nota">' + esc(p.msg || t("semMapa")) + "</p>";
    else {
      h += '<span class="h">' + esc(t("camadas")) + '</span><div class="cam">';
      cs.forEach(function (c, i) {
        var on = !!S.cam[p.id + ":" + i];
        h += '<label><input type="checkbox" data-cam="' + i + '"' + (on ? " checked" : "") + "> " + esc(c.legenda && c.legenda.titulo ? c.legenda.titulo : c.id.replace(/__/g, " / ")) + "</label>";
        if (c.legenda && on) { var q = c.legenda.pontos; h += '<div class="leg">' + q.map(function (x) { return '<i style="background:' + esc(x[1]) + '"></i>'; }).join("") + '</div><div class="legv"><span>' + n(q[0][0], 2) + "</span><span>" + n(q[q.length - 1][0], 2) + "+</span></div>"; }
      });
      h += '</div><div class="acc"><button class="b" data-ad="enq">' + esc(t("enquadrar")) + "</button></div>";
    }
    return h + "</div>";
  }
  function numeros(proc, s) {
    var h = "";
    if (proc === "retencao-rapida") {
      (s.cenarios || []).forEach(function (c) {
        h += '<div class="kv"><span><b>' + n(c.chuva_mm, 0) + " mm</b></span><span></span><span>" + esc(t("chuvaUtil")) + "</span><span>" + n(c.chuva_util_m3, 0) + " m³</span><span>" + esc(t("retido")) + "</span><span>" + n(c.retido_m3, 0) + " m³ (" + n(c.retido_pct) + " %)</span><span>" + esc(t("saido")) + "</span><span>" + n(c.saido_m3, 0) + " m³</span></div>";
      });
      if (s.depressoes != null) h += '<div class="kv"><span>' + esc(t("depressoes")) + "</span><span>" + n(s.depressoes, 0) + "</span><span>" + esc(t("capacidade")) + "</span><span>" + n(s.capacidade_total_m3, 0) + " m³</span></div>";
    } else {
      var b = s.balanco || {};
      h += '<div class="kv"><span>' + esc(t("pico")) + "</span><span>" + n(s.caudal_pico_saida_m3s, 3) + " m³/s " + esc(t("aos")) + " " + n(s.tempo_pico_saida_min, 0) + " min</span>";
      h += "<span>" + esc(t("saida")) + "</span><span>" + n(b.saida_medida_m3, 0) + " m³</span><span>" + esc(t("infiltracao")) + "</span><span>" + n(b.infiltracao_m3, 0) + " m³</span><span>" + esc(t("armazenado")) + "</span><span>" + n(b.armazenado_fim_m3, 0) + " m³</span>";
      if (b.erro_rel != null) h += "<span>" + esc(t("erro")) + "</span><span>" + n(100 * b.erro_rel, 2) + " %</span>";
      h += "</div>";
    }
    var pi = s.pontos_inundacao;
    if (pi && pi.zonas != null) h += '<p class="nota">' + esc(t("pontos").replace("{l}", n(pi.limiar_m, 2)).replace("{z}", n(pi.zonas, 0))) + "</p>";
    return h;
  }

  // ───────────── acções ─────────────
  function clique(ev) {
    var el = ev.target.closest && ev.target.closest("button,a,input[data-cam]"); if (!el || el.hasAttribute("data-cam")) return;
    if (el.tagName === "A" && el.classList.contains("b")) return;   // «Entrar ou criar conta»: deixa seguir
    if (el.closest("[data-partilha]")) return;                     // bloco do agua-partilha.js
    ev.preventDefault();
    var a = el.getAttribute("data-ad");
    if (a === "x") return fechar();
    if (a === "min") { P.classList.toggle("min"); return; }
    if (el.hasAttribute("data-tab")) { S.tab = el.getAttribute("data-tab"); S.erro = ""; pintar(); return; }
    if (a === "aceitar") {
      api("agua-demo/aviso", { method: "POST", body: {} }).then(function () { if (S.est) S.est.aviso_ok = true; S.erro = ""; pintar(); }).catch(function (er) { S.erro = er.message; pintar(); });
      return;
    }
    if (a === "simular") return simular();
    if (a === "enq") return enquadrarVer();
    if (el.hasAttribute("data-ver")) { limparCamadas(); S.ver = +el.getAttribute("data-ver"); pintar(); desenhar(); enquadrarVer(); return; }
    if (el.hasAttribute("data-cancelar")) {
      api("agua-demo/cancelar", { method: "POST", body: { id: +el.getAttribute("data-cancelar") } }).then(carregar).catch(function (er) { S.erro = er.message; pintar(); });
    }
  }
  function mudar(ev) {
    var el = ev.target;
    if (el.hasAttribute("data-cam")) { var p = verAgora(); if (p) { S.cam[p.id + ":" + el.getAttribute("data-cam")] = el.checked; desenhar(); pintar(); } return; }
    var k = el.getAttribute("data-k"); if (!k) return;
    if (k === "chk") { S.chk = el.checked; pintar(); return; }
    if (k === "cen") { S.cen = el.value; return; }
    if (k === "cmodo") { S.chuva.modo = el.value; pintar(); return; }
    if (k === "forma") { S.chuva.forma = el.value; return; }
    if (k === "horas") { S.horas = +el.value; return; }
    S.chuva[k] = +el.value;
  }
  function limitar(v, a, b) { v = +v; return isFinite(v) ? Math.min(b, Math.max(a, v)) : a; }
  function simular() {
    var lim = CFG.lim, proc = PROC[S.tab], ent;
    if (proc === "retencao-rapida") {
      var c = S.cen.split(/[,;\s]+/).map(parseFloat).filter(function (x) { return x > 0; }).map(function (x) { return limitar(x, 1, lim.mm_ret); }).slice(0, lim.n_cen);
      ent = { cenarios_mm: c };
    } else {
      var ch = S.chuva, chuva = ch.modo === "livre" ? { modo: "livre", total_mm: limitar(ch.total_mm, 1, lim.mm_2d), duracao_h: limitar(ch.duracao_h, 0.25, lim.dur_h), forma: ch.forma } : { modo: "projecto", T: +ch.T, duracao_h: limitar(ch.duracao_h, 0.25, lim.dur_h) };
      ent = { chuva: chuva, horas_depois: limitar(S.horas, 0, lim.horas) };
    }
    S.aEnviar = true; S.erro = ""; pintar();
    api("agua-demo/simular", { method: "POST", body: { processo: proc, entradas: ent } }).then(function () { S.aEnviar = false; S.ver = null; limparCamadas(); return carregar(); })
      .catch(function (er) { S.aEnviar = false; S.erro = er.message; if (er.codigo === "tcd_m741_aviso" && S.est) S.est.aviso_ok = false; pintar(); });
  }

  // ───────────── mapa ─────────────
  var LIM = "ipr-ad-lim";
  function limite(ligar) {
    var M = mapa(); if (!M || !M.addSource) return;
    try {
      if (!ligar) { [LIM + "-l"].forEach(function (l) { if (M.getLayer(l)) M.removeLayer(l); }); if (M.getSource(LIM)) M.removeSource(LIM); return; }
      if (!CFG.limite || M.getSource(LIM)) return;
      M.addSource(LIM, { type: "geojson", data: CFG.limite });
      M.addLayer({ id: LIM + "-l", type: "line", source: LIM, paint: { "line-color": "#d9a441", "line-width": 2, "line-dasharray": [2, 1.5] } });
    } catch (e) {}
  }
  function caixa(g) {
    var b = [Infinity, Infinity, -Infinity, -Infinity];
    (function per(c) { if (!c || !c.length) return; if (typeof c[0] === "number") { b[0] = Math.min(b[0], c[0]); b[1] = Math.min(b[1], c[1]); b[2] = Math.max(b[2], c[0]); b[3] = Math.max(b[3], c[1]); } else c.forEach(per); })(
      ((g && g.features) || []).map(function (f) { return f.geometry && f.geometry.coordinates; }));
    return isFinite(b[0]) ? b : null;
  }
  function enquadrar(b) { var M = mapa(); if (!M || !b) return; try { M.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: W.innerWidth < 700 ? 24 : 60, maxZoom: 16, duration: 700 }); } catch (e) {} }
  function enquadrarLimite() { enquadrar(caixa(CFG.limite)); }
  function verAgora() { var ps = (S.est && S.est.pedidos) || []; return ps.filter(function (p) { return p.id === S.ver && p.estado === "feito"; })[0]; }
  function enquadrarVer() { var p = verAgora(); enquadrar(p && p.bbox ? p.bbox : caixa(CFG.limite)); }
  var DESENHADO = {};
  function limparCamadas() {
    var M = mapa(); if (!M) return;
    Object.keys(DESENHADO).forEach(function (sid) { [sid + "-l", sid + "-c"].forEach(function (l) { try { if (M.getLayer(l)) M.removeLayer(l); } catch (e) {} }); try { if (M.getSource(sid)) M.removeSource(sid); } catch (e) {} });
    DESENHADO = {};
  }
  function desenhar() {
    var M = mapa(), p = verAgora(); if (!M || !P || P.hidden) return;
    var quer = {};
    if (p) (p.camadas || []).forEach(function (c, i) {
      var k = p.id + ":" + i;
      if (S.cam[k] === undefined) S.cam[k] = i === 0 || c.tipo === "pontos";   // a principal e os pontos ligados à partida
      if (S.cam[k]) quer["ipr-ad-" + p.id + "-" + i] = c;
    });
    Object.keys(DESENHADO).forEach(function (sid) { if (!quer[sid]) { [sid + "-l", sid + "-c"].forEach(function (l) { try { if (M.getLayer(l)) M.removeLayer(l); } catch (e) {} }); try { if (M.getSource(sid)) M.removeSource(sid); } catch (e) {} delete DESENHADO[sid]; } });
    Object.keys(quer).forEach(function (sid) {
      if (M.getSource(sid)) return;
      var c = quer[sid], u = comNonce(c.url);
      try {
        if (c.tipo === "imagem" && c.cantos) {
          M.addSource(sid, { type: "image", url: u, coordinates: c.cantos });
          M.addLayer({ id: sid + "-l", type: "raster", source: sid, paint: { "raster-opacity": 0.85, "raster-resampling": "nearest" } });
        } else if (c.tipo === "pontos") {
          M.addSource(sid, { type: "geojson", data: u });
          M.addLayer({ id: sid + "-l", type: "circle", source: sid, paint: { "circle-color": ["match", ["get", "classe"], "grave", "#922b21", "perigo", "#e67e22", "#f4d03f"], "circle-radius": ["interpolate", ["linear"], ["coalesce", ["get", "altura_max_m"], 0], 0.2, 5, 1, 9, 3, 14], "circle-stroke-color": "#fff", "circle-stroke-width": 1.5 } });
        } else {
          M.addSource(sid, { type: "geojson", data: u });
          M.addLayer({ id: sid + "-l", type: "fill", source: sid, paint: { "fill-color": "#17a589", "fill-opacity": 0.2 } });
          M.addLayer({ id: sid + "-c", type: "line", source: sid, paint: { "line-color": "#0e6655", "line-width": 1.2 } });
        }
        DESENHADO[sid] = 1;
      } catch (e) {}
    });
  }
  // Mudar o mapa de fundo apaga as fontes: voltar a pôr o limite e as camadas.
  function vigiarEstilo() { var M = mapa(); if (!M || vigiarEstilo.f) return; vigiarEstilo.f = 1; M.on("styledata", function () { if (P && !P.hidden) { if (CFG.limite && !M.getSource(LIM)) limite(true); Object.keys(DESENHADO).forEach(function (sid) { if (!M.getSource(sid)) delete DESENHADO[sid]; }); desenhar(); } }); }

  // ───────────── botões e nota na calha ─────────────
  var IC = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c3.5 4.2 6 7.6 6 10.5A6 6 0 0 1 6 13.5C6 10.6 8.5 7.2 12 3z"/></svg>';
  function botoes() {
    css(); vigiarEstilo();
    // grupo «Área de teste IPR»: nota de demonstração e botão ao lado de «Enquadrar» da área do Mira
    var g = Doc.querySelector('#ipe-cam .ipr-g[data-g="ipr_teste"]');
    if (g && !g.querySelector(".ipr-ad-nota")) {
      var nt = Doc.createElement("p"); nt.className = "ipr-ad-nota"; nt.textContent = t("notaGrupo");
      var sub = g.querySelector(".ipr-sub"); if (sub && sub.parentNode) sub.parentNode.insertBefore(nt, sub); else g.appendChild(nt);
    }
    var enq = Doc.querySelector('#ipe-cam .ipr-atipr-enq[data-area="' + CFG.area + '"]');
    if (enq && !(enq.nextElementSibling && enq.nextElementSibling.hasAttribute("data-agua-demo"))) {
      var b = Doc.createElement("button"); b.type = "button"; b.className = "ipr-atipr-enq"; b.setAttribute("data-agua-demo", ""); b.title = t("botaoT");
      b.innerHTML = IC + "<span>" + esc(t("botao")) + "</span>"; enq.parentNode.insertBefore(b, enq.nextSibling);
    }
    // tema «Água no terreno»: botão próprio (data-agua-demo, não data-agua-sim: o simuladores-convite.js não o apanha).
    // Com a demonstração ainda fechada ao público, só aparece a quem vê a área de teste (a equipa).
    var sec = Doc.querySelector("#ipr-t62 .ipr-ag-c .ipr-t62-f");
    if (sec && !sec.querySelector("[data-agua-demo]") && (CFG.ligado || enq)) {
      var c = Doc.createElement("button"); c.type = "button"; c.setAttribute("data-agua-demo", ""); c.title = t("botaoT");
      c.innerHTML = IC + "<span>" + esc(t("botaoT")) + "</span>"; sec.appendChild(c);
    }
  }
  Doc.addEventListener("click", function (ev) { var b = ev.target.closest && ev.target.closest("[data-agua-demo]"); if (b) { ev.preventDefault(); ev.stopPropagation(); abrir(); } }, true);
  setInterval(function () { if (!Doc.hidden) try { botoes(); } catch (e) {} }, 1500);
  Doc.addEventListener("ipr:lingua", function () { Array.prototype.forEach.call(Doc.querySelectorAll("[data-agua-demo],.ipr-ad-nota"), function (x) { x.remove(); }); botoes(); pintar(); });

  W.IPRAguaDemo = { abrir: abrir, fechar: fechar, estado: function () { return S; }, recarregar: carregar };
})(window);
