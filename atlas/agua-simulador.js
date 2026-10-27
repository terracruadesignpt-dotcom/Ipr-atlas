/* IPR Atlas · Simulador de Água (painel «Simular água»). Terracrua Design.
   Decisões do Nuno, 27/10/2026: quatro funções (Onde a água pára, Chuva no terreno, Antes e depois, Bacia do Mira),
   só para clientes com Base entregue, painel dentro do Atlas. Carrega-se depois de agua.js e não mexe em nenhum
   ficheiro: liga-se pelo DOM (tema «Água no terreno», #ipr-t62) e pelo que está em window (__ipe.mapa, __ipe.estado,
   tcdNonce, IPR_LINGUA). Fala só com o site (tcd/v1/agua/*, módulo 90416); o site assina e fala com o motor.
   Regras: chuva livre não tem período de retorno; o mapa de máximos é uma envolvente, não um instante; o modo
   estático não dá tempos nem caudais; cada resultado mostra o balanço de volumes. */
(function (W) {
  "use strict";
  if (W.IPR_AGUA_SIM) return;
  var D = {
    pt: {
      botao: "Simular água", titulo: "Simular água", fechar: "Fechar", min: "Minimizar",
      semMapa: "Para simular, abra um dos seus mapas com a Base Cartográfica entregue.",
      semConta: "O simulador está disponível para clientes com Base Cartográfica. Entre na sua conta.",
      tab_ret: "Onde a água pára", tab_2d: "Chuva no terreno", tab_ad: "Antes e depois", tab_mira: "Bacia do Mira",
      d_ret: "Distribui a chuva pelas depressões reais do terreno: onde a água fica, quanto cabe em cada depressão e para onde transborda. É estático: não dá tempos, velocidades nem caudais.",
      d_2d: "Simulação dinâmica 2D (SFINCS) sobre o MDT LiDAR: altura e velocidade máximas, tempo até ao máximo e caudal à saída do terreno. Fica em fila e demora alguns minutos.",
      d_ad: "Desenhe charcas, valas em curva de nível, açudes ou mudanças de ocupação e compare a mesma chuva com e sem elas.",
      d_mira: "Cenários regionais da bacia do Mira, das nascentes à foz (10–25 m com subgrid LiDAR, maré em Vila Nova de Milfontes e Santa Clara).",
      cenarios: "Alturas de chuva (mm, separadas por vírgulas)", semRetorno: "Sem período de retorno: são alturas de chuva, não probabilidades.",
      chuva: "Chuva", m_livre: "Chuva livre", m_proj: "Chuva de projecto (IDF)", m_obs: "Evento observado",
      total: "Altura total", duracao: "Duração", forma: "Forma", f_uni: "Uniforme", f_tri: "Triangular (pico a 3/8)",
      T: "Período de retorno", anos: "anos", obsH: "Cole a série: uma linha por intervalo, «tempo,mm» (ex.: 2025-11-01T10:00,4.2). Intervalos iguais.", fonte: "Fonte (IPMA, SNIRH…)",
      horas: "Horas a simular depois da chuva", modo: "Comparar com", modo_ret: "Onde a água pára (rápido)", modo_2d: "Chuva no terreno (2D)",
      desenhar: "Desenhar", charca: "Charca", vala: "Vala em curva de nível", acude: "Açude", ocupacao: "Mudança de ocupação",
      desH: "Clique no mapa para marcar os pontos. Termine com duplo clique ou em «Terminar». Esc cancela.", terminar: "Terminar", cancelar: "Cancelar",
      prof: "Profundidade", largura: "Largura", berma: "Altura da berma", coroa: "Cota do coroamento", desc: "Cota do descarregador", cn: "CN (II)", manning: "Rugosidade de Manning",
      nenhuma: "Ainda não desenhou nenhuma intervenção.", apagar: "Apagar",
      simular: "Simular", aSimular: "A simular…", fila: "Na fila", corre: "A calcular", ok: "Concluído", falhou: "Não foi possível simular",
      anteriores: "Simulações deste mapa", nenhumaSim: "Ainda não há simulações neste mapa.", ver: "Ver",
      resultados: "Resultados", camadas: "No mapa", descargas: "Ficheiros (COG, GeoPackage, CSV)", balanco: "Balanço de volumes",
      envolvente: "Os mapas de máximos são a envolvente de toda a simulação, não um instante.",
      estatico: "Exploração estática: não dá tempos, velocidades nem caudais.",
      retido: "Retido", saido: "Saiu do terreno", chuvaUtil: "Chuva útil", depressoes: "Depressões listadas", capacidade: "Capacidade total",
      saida: "Saída medida", infiltracao: "Infiltração", armazenado: "Ficou no terreno", pico: "Caudal de pico à saída", tpico: "aos",
      ganho: "Ganho de retenção", reducao: "Redução do pico", atraso: "Atraso do pico", erro: "Erro do balanço", fechado: "fecha", naoFecha: "não fecha",
      miraPrep: "Os cenários da bacia do Mira estão em preparação.",
      avisoT: "Aviso importante", avisoTx: "O Simulador de Água do IPR Atlas está em testes e serve apenas para informação e aprendizagem. Os resultados são estimativas de um modelo, com as incertezas do terreno (LiDAR), da chuva, dos solos e do próprio modelo, e podem estar errados. Não servem para decisões sobre a segurança de pessoas e bens, protecção civil, evacuação, dimensionamento de obras ou licenciamento, e não substituem estudos de hidrologia e hidráulica assinados por técnico habilitado nem a informação oficial (APA, ANEPC, IPMA, câmara municipal). Em situação de cheia ou de perigo, siga as indicações da Protecção Civil e, em emergência, ligue 112. A Terracrua Design não se responsabiliza por decisões tomadas com base nestes resultados.",
      avisoChk: "Li e compreendo: os resultados são informativos, estão em testes e não servem para decisões de segurança.", aceitar: "Aceitar e continuar",
      faixa: "Em testes · só informativo e para aprendizagem · não usar para decisões de segurança. Emergência: 112.",
      talI: "Talude interior (1:x)", talE: "Talude exterior (1:x)", folga: "Folga até ao coroamento", coroaL: "Largura do coroamento", cotaAgua: "Cota da água (vazio = automática)",
      fundoQ: "Fundo", fundo_impermeavel: "Impermeabilizado (tela ou argila)", fundo_natural: "Terreno natural", fundo_infiltracao: "Charca de infiltração",
      montT: "Água de montante", montSem: "Esta Base ainda não tem os dados de montante: só entra a chuva que cai no terreno. Se chegar água de fora, os resultados ficam por baixo da realidade.", montTx: "{v} m³ de fora do terreno ({p} % da água), {n} troços de entrada, {a} km² a montante.",
      charcaR: "Charca", volUtil: "Volume útil", cotaA: "Cota da água", corte: "Corte", aterro: "Aterro", dique: "Altura máx. do dique", descR: "Descarregador", aviso: "Resultados de modelo para apoiar decisões de projecto; não substituem estudo hidráulico nem licenciamento."
    },
    en: {
      botao: "Water simulator", titulo: "Water simulator", fechar: "Close", min: "Minimise",
      semMapa: "To simulate, open one of your maps with a delivered Base Map.", semConta: "The simulator is available to Base Map clients. Please sign in.",
      tab_ret: "Where water stops", tab_2d: "Rain on the land", tab_ad: "Before and after", tab_mira: "Mira basin",
      d_ret: "Spreads rainfall over the real depressions of the terrain: where water stays, how much each depression holds and where it spills. Static: no timing, velocities or flows.",
      d_2d: "2D dynamic simulation (SFINCS) on the LiDAR DTM: maximum depth and velocity, time to peak and outflow. Queued; takes a few minutes.",
      d_ad: "Draw ponds, contour swales, small dams or land-cover changes and compare the same rainfall with and without them.",
      d_mira: "Regional scenarios for the Mira basin, source to mouth (10–25 m with LiDAR subgrid, tide at Vila Nova de Milfontes and Santa Clara).",
      cenarios: "Rainfall depths (mm, comma-separated)", semRetorno: "No return period: these are rainfall depths, not probabilities.",
      chuva: "Rainfall", m_livre: "Free rainfall", m_proj: "Design storm (IDF)", m_obs: "Observed event",
      total: "Total depth", duracao: "Duration", forma: "Shape", f_uni: "Uniform", f_tri: "Triangular (peak at 3/8)",
      T: "Return period", anos: "years", obsH: "Paste the series: one line per interval, «time,mm» (e.g. 2025-11-01T10:00,4.2). Equal intervals.", fonte: "Source (IPMA, SNIRH…)",
      horas: "Hours to simulate after the rain", modo: "Compare with", modo_ret: "Where water stops (fast)", modo_2d: "Rain on the land (2D)",
      desenhar: "Draw", charca: "Pond", vala: "Contour swale", acude: "Small dam", ocupacao: "Land-cover change",
      desH: "Click on the map to add points. Finish with a double click or «Finish». Esc cancels.", terminar: "Finish", cancelar: "Cancel",
      prof: "Depth", largura: "Width", berma: "Berm height", coroa: "Crest level", desc: "Spillway level", cn: "CN (II)", manning: "Manning roughness",
      nenhuma: "No interventions drawn yet.", apagar: "Delete",
      simular: "Simulate", aSimular: "Simulating…", fila: "Queued", corre: "Running", ok: "Done", falhou: "Could not simulate",
      anteriores: "Simulations for this map", nenhumaSim: "No simulations for this map yet.", ver: "View",
      resultados: "Results", camadas: "On the map", descargas: "Files (COG, GeoPackage, CSV)", balanco: "Volume balance",
      envolvente: "Maximum maps are the envelope of the whole run, not a single moment.", estatico: "Static exploration: no timing, velocities or flows.",
      retido: "Retained", saido: "Left the land", chuvaUtil: "Effective rain", depressoes: "Listed depressions", capacidade: "Total capacity",
      saida: "Measured outflow", infiltracao: "Infiltration", armazenado: "Left on the land", pico: "Peak outflow", tpico: "at",
      ganho: "Retention gain", reducao: "Peak reduction", atraso: "Peak delay", erro: "Balance error", fechado: "closes", naoFecha: "does not close",
      miraPrep: "The Mira basin scenarios are being prepared.",
      avisoT: "Important notice", avisoTx: "The IPR Atlas Water Simulator is in testing and is for information and learning only. Results are model estimates, subject to uncertainty in the terrain (LiDAR), rainfall, soils and the model itself, and may be wrong. They must not be used for decisions on the safety of people or property, civil protection, evacuation, structural design or permitting, and they do not replace hydrological and hydraulic studies signed by a qualified professional or official information (APA, ANEPC, IPMA, local council). In a flood or any danger, follow Civil Protection instructions and call 112 in an emergency. Terracrua Design accepts no liability for decisions made on the basis of these results.",
      avisoChk: "I have read and understand: results are for information only, in testing, and not for safety decisions.", aceitar: "Accept and continue",
      faixa: "In testing · information and learning only · not for safety decisions. Emergency: 112.",
      talI: "Inner slope (1:x)", talE: "Outer slope (1:x)", folga: "Freeboard to crest", coroaL: "Crest width", cotaAgua: "Water level (empty = automatic)",
      fundoQ: "Bottom", fundo_impermeavel: "Lined (membrane or clay)", fundo_natural: "Natural ground", fundo_infiltracao: "Infiltration pond",
      montT: "Upstream water", montSem: "This Base Map has no upstream data yet: only rain falling on the land is counted. If water arrives from outside, results are underestimated.", montTx: "{v} m³ from outside the land ({p} % of the water), {n} inflow sections, {a} km² upstream.",
      charcaR: "Pond", volUtil: "Useful volume", cotaA: "Water level", corte: "Cut", aterro: "Fill", dique: "Max. embankment height", descR: "Spillway", aviso: "Model results to support design decisions; they do not replace a hydraulic study or permitting."
    }
  };
  function L() { return (W.IPR_LINGUA || document.documentElement.lang || "pt").slice(0, 2) === "en" ? "en" : "pt"; }
  function t(k) { var d = D[L()]; return k in d ? d[k] : (D.pt[k] || k); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function n(x, d) { if (x == null || isNaN(x)) return "–"; return Number(x).toLocaleString(L() === "en" ? "en-GB" : "pt-PT", { maximumFractionDigits: d == null ? 1 : d }); }
  function ipe() { return W.__ipe || {}; }
  function mapa() { return ipe().mapa; }
  function actual() { var e = ipe().estado; return e && e.actual; }
  var REST = "/wp-json/tcd/v1/";
  function api(c, op) {
    op = op || {}; op.credentials = "same-origin"; op.headers = Object.assign({ "X-WP-Nonce": W.tcdNonce || "" }, op.headers || {});
    if (op.body && typeof op.body !== "string") { op.body = JSON.stringify(op.body); op.headers["Content-Type"] = "application/json"; }
    return fetch(REST + c, op).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j && j.message || ("HTTP " + r.status)); return j; }); });
  }
  function urlF(u) { return u + (u.indexOf("?") < 0 ? "?" : "&") + "_wpnonce=" + encodeURIComponent(W.tcdNonce || ""); }

  var AVISO_VERSAO = "2026-10-27";
  function lerAviso() { try { return localStorage.getItem("ipr_agua_aviso") === AVISO_VERSAO; } catch (e) { return false; } }
  var IC = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c3.5 4.2 6 7.6 6 10.5A6 6 0 0 1 6 13.5C6 10.6 8.5 7.2 12 3z"/><path d="M9 14.5a3 3 0 0 0 3 3"/></svg>';
  var S = { tab: "ret", chuva: { modo: "livre", total_mm: 50, duracao_h: 1, forma: "uniforme", T: 10, obs: "", fonte: "" },
    aviso: lerAviso(), avisoChk: false, cenarios: "20, 50, 100", horas: 3, modoAD: "retencao-rapida", feats: [], des: null, job: null, res: null, erro: "", lista: [], camadas: {} };

  // ───────────── estilos ─────────────
  function css() {
    if (document.getElementById("ipr-as-css")) return;
    var st = document.createElement("style"); st.id = "ipr-as-css";
    st.textContent =
      "#ipr-as{position:absolute;z-index:41;top:12px;right:12px;width:360px;max-width:calc(100% - 24px);max-height:calc(100% - 24px);display:flex;flex-direction:column;background:var(--p1,#171a13);color:var(--tx,#ebe7d8);border:1px solid var(--ln2,#3b4232);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.35);font:13px/1.45 Inter,system-ui,sans-serif;overflow:hidden}" +
      "#ipr-as[hidden]{display:none}#ipr-as *{box-sizing:border-box}#ipr-as.min .as-corpo,#ipr-as.min .as-tabs{display:none}" +
      "#ipr-as .as-cab{display:flex;align-items:center;gap:8px;padding:9px 10px 9px 12px;border-bottom:1px solid var(--ln,#2b3024);background:var(--p2,#1d2118)}#ipr-as .as-cab svg{color:var(--ac,#a8b878)}#ipr-as .as-cab b{flex:1;font:600 13.5px Raleway,Inter,sans-serif}" +
      "#ipr-as .as-ib{border:0;background:transparent;color:var(--mu,#a3a690);cursor:pointer;width:30px;height:30px;border-radius:7px;font:600 15px Inter,sans-serif}#ipr-as .as-ib:hover{background:var(--acs,rgba(168,184,120,.16));color:var(--tx,#ebe7d8)}" +
      "#ipr-as .as-tabs{display:flex;gap:2px;padding:6px 8px;border-bottom:1px solid var(--ln,#2b3024);overflow-x:auto;scrollbar-width:none}#ipr-as .as-tabs button{flex:1 0 auto;border:0;background:transparent;color:var(--mu,#a3a690);font:500 11.5px Inter,sans-serif;padding:5px 8px;border-radius:999px;cursor:pointer;white-space:nowrap}#ipr-as .as-tabs button[aria-selected=true]{background:var(--acs,rgba(168,184,120,.16));color:var(--tx,#ebe7d8)}" +
      "#ipr-as .as-corpo{overflow:auto;padding:10px 12px 12px;flex:1 1 auto;min-height:0;overscroll-behavior:contain}#ipr-as p.sub{margin:0 0 10px;color:var(--mu,#a3a690);font-size:12px}" +
      "#ipr-as .as-h{display:block;font:600 10.5px Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--mu,#a3a690);margin:12px 0 6px}" +
      "#ipr-as label.f{display:flex;flex-direction:column;gap:3px;margin:0 0 8px;font-size:12px}#ipr-as .ln{display:flex;gap:6px;align-items:center}" +
      "#ipr-as input[type=number],#ipr-as input[type=text],#ipr-as select,#ipr-as textarea{width:100%;min-width:0;height:32px;padding:4px 8px;border-radius:7px;border:1px solid var(--ln2,#3b4232);background:var(--bg,#121410);color:var(--tx,#ebe7d8);font:13px Inter,sans-serif}#ipr-as textarea{height:90px;font:12px 'IBM Plex Mono',monospace}" +
      "#ipr-as .un{font:500 11px 'IBM Plex Mono',monospace;color:var(--mu,#a3a690);min-width:24px}" +
      "#ipr-as .b{font:500 12.5px Inter,sans-serif;padding:7px 11px;border-radius:8px;border:1px solid var(--ln2,#3b4232);background:transparent;color:var(--tx,#ebe7d8);cursor:pointer;min-height:34px}#ipr-as .b:hover{border-color:var(--ac,#a8b878)}#ipr-as .b.pri{background:var(--ac,#a8b878);border-color:var(--ac,#a8b878);color:#141814;font-weight:600}#ipr-as .b:disabled{opacity:.45;cursor:default}" +
      "#ipr-as .acc{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}#ipr-as .nota{font-size:11.5px;color:var(--mu,#a3a690);margin:6px 0}" +
      "#ipr-as .av{margin:10px 0 0;padding:7px 9px;border-left:3px solid var(--ac2,#cdd6a8);background:var(--p2,#1d2118);font-size:11.5px}" +
      "#ipr-as .err{margin:8px 0;padding:7px 9px;border-left:3px solid #d9534f;background:var(--p2,#1d2118);font-size:12px}" +
      "#ipr-as .it{border:1px solid var(--ln,#2b3024);border-radius:9px;padding:8px;margin:0 0 6px;background:var(--p2,#1d2118)}#ipr-as .it b{font-size:12.5px}#ipr-as .it .ln input{height:28px}" +
      "#ipr-as .kv{display:grid;grid-template-columns:1fr auto;gap:2px 10px;font-size:12px;margin:0 0 6px}#ipr-as .kv span:nth-child(2n){font:500 12px 'IBM Plex Mono',monospace;text-align:right}" +
      "#ipr-as .cam label{display:flex;gap:6px;align-items:center;font-size:12px;margin:0 0 4px}#ipr-as .leg{display:flex;height:8px;border-radius:4px;overflow:hidden;margin:2px 0 1px}#ipr-as .leg i{flex:1}#ipr-as .legv{display:flex;justify-content:space-between;font:500 10px 'IBM Plex Mono',monospace;color:var(--mu,#a3a690)}" +
      "#ipr-as ul.fx{margin:0;padding-left:16px;font-size:12px}#ipr-as ul.fx a{color:var(--ac,#a8b878)}" +
      "#ipr-as .prog{height:4px;border-radius:2px;background:var(--ln,#2b3024);overflow:hidden;margin:8px 0}#ipr-as .prog i{display:block;height:100%;width:30%;background:var(--ac,#a8b878);animation:ipras 1.4s ease-in-out infinite}@keyframes ipras{0%{margin-left:-30%}100%{margin-left:100%}}" +
      "#ipr-as .des{padding:8px 10px;border:1px dashed var(--ac,#a8b878);border-radius:9px;margin:8px 0;font-size:12px}" +
      "#ipr-as .faixa{margin:0 0 10px;padding:6px 9px;border-radius:8px;background:rgba(217,164,65,.14);border:1px solid #d9a441;font-size:11.5px;line-height:1.4}" +
      "#ipr-as .avbox{border:1px solid #d9a441;border-radius:10px;padding:10px;background:var(--p2,#1d2118)}#ipr-as .avbox p{font-size:12px;margin:6px 0 10px}#ipr-as .chk{display:flex;gap:8px;align-items:flex-start;font-size:12px}" +
      ".ipr-ag-c [data-agua-sim]{border-color:var(--ac,#a8b878)!important;display:inline-flex;align-items:center;gap:5px}" +
      "@media (max-width:600px){#ipr-as{left:8px!important;right:8px;top:auto!important;bottom:60px;width:auto;max-width:none;max-height:min(62vh,calc(100% - 76px))}}";
    document.head.appendChild(st);
  }

  // ───────────── painel ─────────────
  var P = null;
  function painel() {
    if (P) return P; css();
    P = document.createElement("div"); P.id = "ipr-as"; P.setAttribute("role", "dialog"); P.hidden = true;
    var host = (mapa() && mapa().getContainer && mapa().getContainer().parentNode) || document.body;
    host.appendChild(P);
    P.addEventListener("click", clique);
    P.addEventListener("change", mudar);
    P.addEventListener("input", mudar);
    return P;
  }
  function abrir() { painel().hidden = false; pintar(); listar(); }
  function fechar() { if (P) P.hidden = true; pararDesenho(); }

  function pintar() {
    if (!P || P.hidden) return;
    var h = '<div class="as-cab">' + IC + "<b>" + esc(t("titulo")) + '</b><button class="as-ib" data-as="min" title="' + esc(t("min")) + '">–</button><button class="as-ib" data-as="x" title="' + esc(t("fechar")) + '">×</button></div>';
    h += '<div class="as-tabs" role="tablist">' + ["ret", "2d", "ad", "mira"].map(function (k) { return '<button role="tab" data-tab="' + k + '" aria-selected="' + (S.tab === k) + '">' + esc(t("tab_" + k)) + "</button>"; }).join("") + "</div>";
    h += '<div class="as-corpo">' + corpo() + "</div>";
    P.innerHTML = h;
  }

  function corpo() {
    if (!W.tcdNonce) return '<p class="sub">' + esc(t("semConta")) + "</p>";
    var a = actual();
    if (!a || !a.id || (a.estado_k && a.estado_k !== "entregue")) return '<p class="sub">' + esc(t("semMapa")) + "</p>";
    var h = '<p class="faixa">' + esc(t("faixa")) + "</p>";
    if (!S.aviso) {
      return h + '<div class="avbox"><b>' + esc(t("avisoT")) + "</b><p>" + esc(t("avisoTx")) + '</p><label class="chk"><input type="checkbox" data-k="avisoChk"' + (S.avisoChk ? " checked" : "") + "> " + esc(t("avisoChk")) + '</label><div class="acc"><button class="b pri" data-as="aceitar"' + (S.avisoChk ? "" : " disabled") + ">" + esc(t("aceitar")) + "</button></div></div>" + (S.erro ? '<div class="err">' + esc(S.erro) + "</div>" : "");
    }
    h += '<p class="sub">' + esc(t("d_" + S.tab)) + "</p>";
    if (S.tab === "mira") return h + mira();
    if (S.tab === "ret") h += formRet();
    if (S.tab === "2d") h += formChuva() + campo("horas", "horas", S.horas, "h", 0, 24, 1);
    if (S.tab === "ad") h += formAD();
    var corre = S.job && (S.job.estado === "accepted" || S.job.estado === "running" || S.job.enviar);
    h += '<div class="acc"><button class="b pri" data-as="simular"' + (corre ? " disabled" : "") + ">" + esc(corre ? t("aSimular") : t("simular")) + "</button></div>";
    if (S.erro) h += '<div class="err">' + esc(S.erro) + "</div>";
    if (corre) h += '<div class="prog"><i></i></div><p class="nota">' + esc(S.job.estado === "running" ? t("corre") : t("fila")) + "</p>";
    if (S.res) h += resultados();
    h += anteriores();
    h += '<p class="av">' + esc(t("aviso")) + "</p>";
    return h;
  }
  function campo(k, rot, v, un, mn, mx, st) {
    return '<label class="f">' + esc(t(rot)) + '<span class="ln"><input type="number" data-k="' + k + '" value="' + esc(v) + '" min="' + mn + '" max="' + mx + '" step="' + st + '"><span class="un">' + esc(un) + "</span></span></label>";
  }
  function formRet() {
    return '<label class="f">' + esc(t("cenarios")) + '<input type="text" data-k="cenarios" value="' + esc(S.cenarios) + '"></label><p class="nota">' + esc(t("semRetorno")) + "</p>";
  }
  function formChuva() {
    var c = S.chuva, h = '<span class="as-h">' + esc(t("chuva")) + "</span>";
    h += '<label class="f"><select data-k="cmodo">' + ["livre", "projecto", "observado"].map(function (m) { return '<option value="' + m + '"' + (c.modo === m ? " selected" : "") + ">" + esc(t({ livre: "m_livre", projecto: "m_proj", observado: "m_obs" }[m])) + "</option>"; }).join("") + "</select></label>";
    if (c.modo === "livre") {
      h += campo("total_mm", "total", c.total_mm, "mm", 1, 1000, 1) + campo("duracao_h", "duracao", c.duracao_h, "h", 0.25, 72, 0.25);
      h += '<label class="f">' + esc(t("forma")) + '<select data-k="forma"><option value="uniforme"' + (c.forma === "uniforme" ? " selected" : "") + ">" + esc(t("f_uni")) + '</option><option value="triangular"' + (c.forma === "triangular" ? " selected" : "") + ">" + esc(t("f_tri")) + "</option></select></label>";
      h += '<p class="nota">' + esc(t("semRetorno")) + "</p>";
    } else if (c.modo === "projecto") {
      h += '<label class="f">' + esc(t("T")) + '<select data-k="T">' + [2, 5, 10, 20, 50, 100].map(function (x) { return '<option value="' + x + '"' + (+c.T === x ? " selected" : "") + ">" + x + " " + esc(t("anos")) + "</option>"; }).join("") + "</select></label>";
      h += campo("duracao_h", "duracao", c.duracao_h, "h", 0.25, 24, 0.25);
    } else {
      h += '<label class="f">' + esc(t("obsH")) + '<textarea data-k="obs">' + esc(c.obs) + "</textarea></label>";
      h += '<label class="f">' + esc(t("fonte")) + '<input type="text" data-k="fonte" value="' + esc(c.fonte) + '"></label>';
    }
    return h;
  }
  function formAD() {
    var h = '<label class="f">' + esc(t("modo")) + '<select data-k="modoAD"><option value="retencao-rapida"' + (S.modoAD === "retencao-rapida" ? " selected" : "") + ">" + esc(t("modo_ret")) + '</option><option value="simulacao-2d"' + (S.modoAD === "simulacao-2d" ? " selected" : "") + ">" + esc(t("modo_2d")) + "</option></select></label>";
    h += S.modoAD === "simulacao-2d" ? formChuva() : formRet();
    h += '<span class="as-h">' + esc(t("desenhar")) + "</span>";
    if (S.des) {
      h += '<div class="des">' + esc(t("desH")) + '<div class="acc"><button class="b pri" data-as="terminar">' + esc(t("terminar")) + '</button><button class="b" data-as="cancelar">' + esc(t("cancelar")) + "</button></div></div>";
    } else {
      h += '<div class="acc">' + ["charca", "vala", "acude", "ocupacao"].map(function (k) { return '<button class="b" data-des="' + k + '">' + esc(t(k)) + "</button>"; }).join("") + "</div>";
    }
    if (!S.feats.length) h += '<p class="nota">' + esc(t("nenhuma")) + "</p>";
    S.feats.forEach(function (f, i) {
      var p = f.properties, k = p.tipo;
      h += '<div class="it"><div class="ln"><b style="flex:1">' + (i + 1) + ". " + esc(t(k)) + '</b><button class="b" data-apagar="' + i + '">' + esc(t("apagar")) + "</button></div>";
      if (k === "charca") {
        h += cp(i, "profundidade_m", "prof", "m") + cp(i, "talude_interior", "talI", "") + cp(i, "talude_exterior", "talE", "") + cp(i, "folga_m", "folga", "m") + cp(i, "coroamento_largura_m", "coroaL", "m") + cp(i, "cota_agua_m", "cotaAgua", "m");
        h += '<label class="f">' + esc(t("fundoQ")) + '<select data-fi="' + i + '" data-fc="fundo" data-txt="1">' + ["impermeavel", "natural", "infiltracao"].map(function (o) { return '<option value="' + o + '"' + (p.fundo === o ? " selected" : "") + ">" + esc(t("fundo_" + o)) + "</option>"; }).join("") + "</select></label>";
      }
      if (k === "vala") h += cp(i, "largura_m", "largura", "m") + cp(i, "profundidade_m", "prof", "m") + cp(i, "berma_altura_m", "berma", "m");
      if (k === "acude") h += cp(i, "cota_coroamento_m", "coroa", "m") + cp(i, "descarregador_cota_m", "desc", "m");
      if (k === "ocupacao") h += cp(i, "cn", "cn", "") + cp(i, "manning", "manning", "");
      h += "</div>";
    });
    return h;
  }
  function cp(i, campo_, rot, un) {
    var v = S.feats[i].properties[campo_];
    return '<label class="f">' + esc(t(rot)) + '<span class="ln"><input type="number" step="any" data-fi="' + i + '" data-fc="' + campo_ + '" value="' + esc(v == null ? "" : v) + '"><span class="un">' + esc(un) + "</span></span></label>";
  }
  function mira() {
    if (!S.mira) { S.mira = "a carregar"; api("agua/simular", { method: "POST", body: { enc: actual().id, processo: "bacia-mira", entradas: {} } })
      .then(function (r) { S.mira = r && r.ok ? r.resultado : "prep"; pintar(); }).catch(function () { S.mira = "prep"; pintar(); }); }
    if (S.mira === "a carregar") return '<div class="prog"><i></i></div>';
    if (S.mira === "prep" || !S.mira.cenarios) return '<p class="nota">' + esc(t("miraPrep")) + "</p>";
    return "<ul class=\"fx\">" + Object.keys(S.mira.cenarios).map(function (k) { return "<li>" + esc(S.mira.cenarios[k].titulo || k) + "</li>"; }).join("") + "</ul>";
  }

  // ───────────── resultados ─────────────
  function resultados() {
    var r = S.res, s = r.resumo || {}, h = '<span class="as-h">' + esc(t("resultados")) + "</span>";
    if (s.aviso_rio) h += '<p class="faixa">' + esc(s.aviso_rio) + "</p>";
    (s.rio || []).forEach(function (x) { h += '<p class="nota"><b>' + esc(L() === "en" ? "River" : "Rio") + "</b> · " + esc(x.cenario_titulo) + " · " + n(x.pico_m3s, 1) + " m³/s · " + esc(x.hipotese) + "</p>"; });
    if (s.aviso_montante) h += '<p class="faixa">' + esc(t("montSem")) + "</p>";
    else if (s.montante) {
      var vm = 0, tot = 0;
      if (s.cenarios && s.cenarios.length) { vm = s.cenarios[s.cenarios.length - 1].montante_m3; tot = s.cenarios[s.cenarios.length - 1].entrada_total_m3; }
      else if (s.balanco) { vm = s.balanco.montante_m3; tot = s.balanco.chuva_m3 + s.balanco.montante_m3; }
      else if (s.montante.volume_montante_m3) { vm = s.montante.volume_montante_m3; }
      h += '<p class="nota"><b>' + esc(t("montT")) + "</b> · " + esc(t("montTx").replace("{v}", n(vm, 0)).replace("{p}", tot ? n(100 * vm / tot, 0) : "–").replace("{n}", s.montante.trocos).replace("{a}", n(s.montante.area_montante_km2, 2))) + "</p>";
    }
    if (r.processo === "retencao-rapida") {
      h += '<p class="nota">' + esc(t("estatico")) + "</p>";
      (s.cenarios || []).forEach(function (c) {
        h += '<div class="kv"><span><b>' + n(c.chuva_mm, 0) + " mm</b></span><span></span><span>" + esc(t("chuvaUtil")) + "</span><span>" + n(c.chuva_util_m3, 0) + " m³</span><span>" + esc(t("retido")) + "</span><span>" + n(c.retido_m3, 0) + " m³ (" + n(c.retido_pct) + " %)</span><span>" + esc(t("saido")) + "</span><span>" + n(c.saido_m3, 0) + " m³</span></div>";
      });
      h += '<div class="kv"><span>' + esc(t("depressoes")) + "</span><span>" + n(s.depressoes, 0) + "</span><span>" + esc(t("capacidade")) + "</span><span>" + n(s.capacidade_total_m3, 0) + " m³</span></div>";
    } else if (r.processo === "simulacao-2d") {
      var b = s.balanco || {};
      h += '<p class="nota">' + esc(t("envolvente")) + "</p>";
      h += '<div class="kv"><span>' + esc(t("pico")) + "</span><span>" + n(s.caudal_pico_saida_m3s, 3) + " m³/s " + esc(t("tpico")) + " " + n(s.tempo_pico_saida_min, 0) + " min</span>";
      h += "<span>" + esc(t("saida")) + "</span><span>" + n(b.saida_medida_m3, 0) + " m³</span><span>" + esc(t("infiltracao")) + "</span><span>" + n(b.infiltracao_m3, 0) + " m³</span><span>" + esc(t("armazenado")) + "</span><span>" + n(b.armazenado_fim_m3, 0) + " m³</span>";
      h += "<span>" + esc(t("erro")) + "</span><span>" + n(100 * (b.erro_rel || 0), 2) + " % · " + esc(s.balanco_ok ? t("fechado") : t("naoFecha")) + "</span></div>";
    } else if (r.processo === "antes-depois") {
      (s.intervencoes || []).filter(function (x) { return x.tipo === "charca"; }).forEach(function (c) {
        h += '<div class="kv"><span><b>' + esc(t("charcaR")) + " " + (c.i + 1) + "</b></span><span></span><span>" + esc(t("volUtil")) + "</span><span>" + n(c.volume_util_m3, 0) + " m³</span><span>" + esc(t("cotaA")) + "</span><span>" + n(c.cota_agua_m, 2) + " m</span>";
        h += "<span>" + esc(t("corte")) + " / " + esc(t("aterro")) + "</span><span>" + n(c.corte_m3, 0) + " / " + n(c.aterro_m3, 0) + " m³</span><span>" + esc(t("dique")) + "</span><span>" + n(c.altura_max_dique_m, 2) + " m</span>";
        if (c.descarregador) h += "<span>" + esc(t("descR")) + "</span><span>" + n(c.descarregador.cota_m, 2) + " m</span>";
        h += "</div>";
        if (c.aviso_descarregador) h += '<p class="nota">' + esc(c.aviso_descarregador) + "</p>";
        if (c.aviso_fundo) h += '<p class="nota">' + esc(c.aviso_fundo) + "</p>";
      });
      (s.comparacao || []).forEach(function (c) {
        if (c.ganho_m3 != null) h += '<div class="kv"><span><b>' + n(c.chuva_mm, 0) + " mm</b></span><span></span><span>" + esc(t("ganho")) + "</span><span>" + n(c.ganho_m3, 0) + " m³</span><span>" + esc(t("retido")) + "</span><span>" + n(c.retido_antes_m3, 0) + " → " + n(c.retido_depois_m3, 0) + " m³</span></div>";
        else h += '<div class="kv"><span>' + esc(t("reducao")) + "</span><span>" + n(c.reducao_pico_pct) + " %</span><span>" + esc(t("atraso")) + "</span><span>" + n(c.atraso_pico_min, 0) + " min</span><span>" + esc(t("pico")) + "</span><span>" + n(c.pico_antes_m3s, 3) + " → " + n(c.pico_depois_m3s, 3) + " m³/s</span></div>";
      });
    }
    if (r.vista && r.vista.camadas) {
      h += '<span class="as-h">' + esc(t("camadas")) + '</span><div class="cam">';
      r.vista.camadas.forEach(function (c) {
        var on = !!S.camadas[c.id];
        h += '<label><input type="checkbox" data-cam="' + esc(c.id) + '"' + (on ? " checked" : "") + "> " + esc(c.legenda ? c.legenda.titulo + " · " + c.id.replace(/__/g, " / ") : c.id.replace(/__/g, " / ")) + "</label>";
        if (c.legenda && on) {
          var p = c.legenda.pontos;
          h += '<div class="leg">' + p.map(function (x) { return '<i style="background:' + x[1] + '"></i>'; }).join("") + '</div><div class="legv"><span>' + n(p[0][0], 2) + "</span><span>" + n(p[p.length - 1][0], 2) + "+</span></div>";
        }
      });
      h += "</div>";
    }
    var fx = (r.ficheiros || []).filter(function (f) { return !/^vista\//.test(f.nome); });
    if (fx.length) h += '<span class="as-h">' + esc(t("descargas")) + '</span><ul class="fx">' + fx.map(function (f) { return '<li><a href="' + esc(urlF(f.url)) + '" download>' + esc(f.nome) + "</a> <small>" + n(f.bytes / 1048576, 1) + " MB</small></li>"; }).join("") + "</ul>";
    return h;
  }
  function anteriores() {
    var h = '<span class="as-h">' + esc(t("anteriores")) + "</span>";
    if (!S.lista.length) return h + '<p class="nota">' + esc(t("nenhumaSim")) + "</p>";
    return h + '<ul class="fx">' + S.lista.map(function (j) { return "<li>" + esc(t("tab_" + ({ "retencao-rapida": "ret", "simulacao-2d": "2d", "antes-depois": "ad" }[j.processo] || "ret"))) + " · " + esc(new Date(j.criado).toLocaleString(L() === "en" ? "en-GB" : "pt-PT")) + ' <a href="#" data-verjob="' + esc(j.id) + '">' + esc(t("ver")) + "</a></li>"; }).join("") + "</ul>";
  }

  // ───────────── acções ─────────────
  function clique(e) {
    var el = e.target.closest("button,a,[data-cam]"); if (!el) return;
    if (el.hasAttribute("data-cam")) return;
    e.preventDefault();
    var a = el.getAttribute("data-as");
    if (a === "x") return fechar();
    if (a === "min") { P.classList.toggle("min"); return; }
    if (el.hasAttribute("data-tab")) { S.tab = el.getAttribute("data-tab"); pararDesenho(); pintar(); return; }
    if (a === "simular") return simular();
    if (a === "aceitar") {
      api("agua/aviso", { method: "POST", body: {} }).then(function () { S.aviso = true; S.erro = ""; try { localStorage.setItem("ipr_agua_aviso", AVISO_VERSAO); } catch (e2) {} pintar(); })
        .catch(function (err) { S.erro = err.message; pintar(); });
      return;
    }
    if (el.hasAttribute("data-des")) return comecarDesenho(el.getAttribute("data-des"));
    if (a === "terminar") return pararDesenho(true);
    if (a === "cancelar") return pararDesenho(false);
    if (el.hasAttribute("data-apagar")) { S.feats.splice(+el.getAttribute("data-apagar"), 1); desenharFeats(); pintar(); return; }
    if (el.hasAttribute("data-verjob")) { S.job = { id: el.getAttribute("data-verjob"), estado: "running" }; acompanhar(); }
  }
  function mudar(e) {
    var el = e.target;
    if (el.hasAttribute("data-cam")) { alternarCamada(el.getAttribute("data-cam"), el.checked); pintar(); return; }
    if (el.hasAttribute("data-fi")) { var v = el.hasAttribute("data-txt") ? el.value : (el.value === "" ? null : parseFloat(el.value)); S.feats[+el.getAttribute("data-fi")].properties[el.getAttribute("data-fc")] = v; return; }
    var k = el.getAttribute("data-k"); if (!k) return;
    if (k === "cmodo") { S.chuva.modo = el.value; pintar(); return; }
    if (k === "modoAD") { S.modoAD = el.value; pintar(); return; }
    if (k === "avisoChk") { S.avisoChk = el.checked; pintar(); return; }
    if (k === "cenarios") { S.cenarios = el.value; return; }
    if (k === "horas") { S.horas = +el.value; return; }
    if (k === "obs" || k === "fonte" || k === "forma") { S.chuva[k] = el.value; return; }
    S.chuva[k] = +el.value;
  }
  function pedidoChuva() {
    var c = S.chuva;
    if (c.modo === "livre") return { modo: "livre", total_mm: c.total_mm, duracao_h: c.duracao_h, forma: c.forma };
    if (c.modo === "projecto") return { modo: "projecto", T: c.T, duracao_h: c.duracao_h };
    var serie = c.obs.split(/\n+/).map(function (l) { var p = l.trim().split(/[,;\t]/); return p.length >= 2 ? { tempo: p[0].trim(), mm: parseFloat(p[1]) } : null; }).filter(function (x) { return x && x.tempo && !isNaN(x.mm); });
    return { modo: "observado", serie: serie, fonte: c.fonte };
  }
  function cenarios() { return S.cenarios.split(/[,;\s]+/).map(parseFloat).filter(function (x) { return x > 0; }).slice(0, 5); }
  function simular() {
    var a = actual(); if (!a) return;
    var proc = { ret: "retencao-rapida", "2d": "simulacao-2d", ad: "antes-depois" }[S.tab], ent = {};
    if (proc === "retencao-rapida") ent = { cenarios_mm: cenarios() };
    if (proc === "simulacao-2d") ent = { chuva: pedidoChuva(), horas_depois: S.horas };
    if (proc === "antes-depois") {
      ent = { modo: S.modoAD, intervencoes: { type: "FeatureCollection", epsg: 4326, features: S.feats } };
      if (S.modoAD === "simulacao-2d") ent.chuva = pedidoChuva(); else ent.cenarios_mm = cenarios();
    }
    S.erro = ""; S.res = null; S.job = { enviar: true }; limparCamadas(); pintar();
    api("agua/simular", { method: "POST", body: { enc: a.id, processo: proc, entradas: ent } })
      .then(function (r) { S.job = { id: r.trabalho.jobID, estado: r.trabalho.status }; pintar(); listar(); acompanhar(); })
      .catch(function (err) { S.job = null; S.erro = err.message; if (/aviso/i.test(err.message)) { S.aviso = false; try { localStorage.removeItem("ipr_agua_aviso"); } catch (e2) {} } pintar(); });
  }
  var timer = null;
  function acompanhar() {
    clearTimeout(timer);
    var a = actual(); if (!S.job || !S.job.id || !a) return;
    api("agua/trabalho/" + S.job.id + "?enc=" + encodeURIComponent(a.id)).then(function (r) {
      S.job.estado = r.estado;
      if (r.estado === "successful") {
        S.res = r;
        var v = (r.ficheiros || []).filter(function (f) { return f.nome === "vista/vista.json"; })[0];
        if (v) return fetch(urlF(v.url), { credentials: "same-origin" }).then(function (x) { return x.json(); }).then(function (vj) {
          S.res.vista = vj; S.res.fich = {}; (r.ficheiros || []).forEach(function (f) { S.res.fich[f.nome] = f.url; });
          var pri = vj.camadas.filter(function (c) { return /^(altura_max|retencao_|diferenca|depois__retencao_|depois__altura)/.test(c.id); })[0] || vj.camadas[0];
          if (pri) alternarCamada(pri.id, true);
          pintar();
        });
        pintar(); return;
      }
      if (r.estado === "failed" || r.estado === "dismissed") { S.erro = t("falhou") + (r.mensagem ? ": " + r.mensagem : "."); S.job = null; pintar(); return; }
      pintar(); timer = setTimeout(acompanhar, 4000);
    }).catch(function (err) { S.erro = err.message; S.job = null; pintar(); });
  }
  function listar() {
    var a = actual(); if (!a || !W.tcdNonce) return;
    api("agua/trabalhos?enc=" + encodeURIComponent(a.id)).then(function (r) { S.lista = r.trabalhos || []; pintar(); }).catch(function () {});
  }

  // ───────────── camadas no mapa ─────────────
  function alternarCamada(id, ligar) {
    var M = mapa(), r = S.res; if (!M || !r || !r.vista) return;
    var c = r.vista.camadas.filter(function (x) { return x.id === id; })[0]; if (!c) return;
    var sid = "ipr-as-" + id;
    if (!ligar) { [sid + "-l", sid + "-c"].forEach(function (l) { if (M.getLayer(l)) M.removeLayer(l); }); if (M.getSource(sid)) M.removeSource(sid); delete S.camadas[id]; return; }
    if (M.getSource(sid)) return;
    if (c.imagem) {
      var u = r.fich["vista/" + c.imagem]; if (!u) return;
      M.addSource(sid, { type: "image", url: urlF(u), coordinates: c.cantos });
      M.addLayer({ id: sid + "-l", type: "raster", source: sid, paint: { "raster-opacity": 0.85, "raster-resampling": "nearest" } });
    } else if (c.geojson) {
      var g = r.fich["vista/" + c.geojson]; if (!g) return;
      M.addSource(sid, { type: "geojson", data: urlF(g) });
      M.addLayer({ id: sid + "-l", type: "fill", source: sid, paint: { "fill-color": "#17a589", "fill-opacity": 0.15 } });
      M.addLayer({ id: sid + "-c", type: "line", source: sid, paint: { "line-color": "#0e6655", "line-width": 1.2 } });
    }
    S.camadas[id] = true;
  }
  function limparCamadas() { Object.keys(S.camadas).forEach(function (id) { alternarCamada(id, false); }); }

  // ───────────── desenho (pontos por clique; linhas para valas e açudes, polígonos para charcas e ocupação) ─────────────
  var SRC = "ipr-as-des";
  var DEF = { charca: { profundidade_m: 2.5, talude_interior: 3, talude_exterior: 3, folga_m: 0.5, coroamento_largura_m: 3, cota_agua_m: null, fundo: "impermeavel" }, vala: { largura_m: 1, profundidade_m: 0.5, berma_altura_m: 0.5 }, acude: { cota_coroamento_m: null, descarregador_cota_m: null }, ocupacao: { cn: 60, manning: 0.1 } };
  function linha(k) { return k === "vala" || k === "acude"; }
  function comecarDesenho(k) {
    var M = mapa(); if (!M) return;
    S.des = { tipo: k, pts: [] };
    var est = ipe().estado; if (est) { S.toolAntes = est.tool; est.tool = "agua"; }
    M.getCanvas().style.cursor = "crosshair";
    M.on("click", aoClicar); M.on("dblclick", aoDuplo);
    M.doubleClickZoom && M.doubleClickZoom.disable();
    pintar(); desenharFeats();
  }
  function aoClicar(e) { if (!S.des) return; S.des.pts.push([e.lngLat.lng, e.lngLat.lat]); desenharFeats(); }
  function aoDuplo(e) { if (!S.des) return; e.preventDefault(); pararDesenho(true); }
  function pararDesenho(guardar) {
    var M = mapa(); if (!S.des) return;
    var d = S.des; S.des = null;
    if (M) { M.off("click", aoClicar); M.off("dblclick", aoDuplo); M.getCanvas().style.cursor = ""; setTimeout(function () { M.doubleClickZoom && M.doubleClickZoom.enable(); }, 300); }
    var est = ipe().estado; if (est) est.tool = S.toolAntes || "nav";
    var pts = d.pts.filter(function (p, i, a) { return !i || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1]; });
    if (guardar && ((linha(d.tipo) && pts.length >= 2) || (!linha(d.tipo) && pts.length >= 3))) {
      var geom = linha(d.tipo) ? { type: "LineString", coordinates: pts } : { type: "Polygon", coordinates: [pts.concat([pts[0]])] };
      S.feats.push({ type: "Feature", properties: Object.assign({ tipo: d.tipo }, DEF[d.tipo]), geometry: geom });
    }
    desenharFeats(); pintar();
  }
  function desenharFeats() {
    var M = mapa(); if (!M) return;
    var fs = S.feats.map(function (f, i) { return { type: "Feature", properties: { i: i + 1 }, geometry: f.geometry }; });
    if (S.des && S.des.pts.length) {
      fs.push({ type: "Feature", properties: { d: 1 }, geometry: S.des.pts.length > 1 ? { type: "LineString", coordinates: S.des.pts } : { type: "Point", coordinates: S.des.pts[0] } });
      S.des.pts.forEach(function (p) { fs.push({ type: "Feature", properties: { d: 1 }, geometry: { type: "Point", coordinates: p } }); });
    }
    var dados = { type: "FeatureCollection", features: fs };
    if (M.getSource(SRC)) { M.getSource(SRC).setData(dados); return; }
    M.addSource(SRC, { type: "geojson", data: dados });
    M.addLayer({ id: SRC + "-f", type: "fill", source: SRC, filter: ["==", ["geometry-type"], "Polygon"], paint: { "fill-color": "#3498db", "fill-opacity": 0.25 } });
    M.addLayer({ id: SRC + "-l", type: "line", source: SRC, filter: ["!=", ["geometry-type"], "Point"], paint: { "line-color": "#1f618d", "line-width": 2.5 } });
    M.addLayer({ id: SRC + "-p", type: "circle", source: SRC, filter: ["==", ["geometry-type"], "Point"], paint: { "circle-radius": 4, "circle-color": "#e8c547", "circle-stroke-color": "#141814", "circle-stroke-width": 1.5 } });
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && S.des) pararDesenho(false); });

  // ───────────── botão no tema «Água no terreno» (agua.js) ─────────────
  function botao() {
    var sec = document.querySelector("#ipr-t62 .ipr-ag-c .ipr-t62-f"); if (!sec) return;
    var b = sec.querySelector("[data-agua-sim]");
    if (!b) { css(); b = document.createElement("button"); b.type = "button"; b.setAttribute("data-agua-sim", ""); sec.appendChild(b); }
    if (b.getAttribute("data-l") !== L()) { b.innerHTML = IC + "<span>" + esc(t("botao")) + "</span>"; b.setAttribute("data-l", L()); }
  }
  var obsEl = null, obsT = null;
  function observar() {
    var w = document.getElementById("ipr-t62");
    if (w && w !== obsEl) { if (obsT) obsT.disconnect(); obsEl = w; obsT = new MutationObserver(botao); obsT.observe(w, { childList: true, subtree: true }); botao(); }
  }
  setInterval(function () { if (!document.hidden) observar(); }, 1000);
  observar();
  document.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest("[data-agua-sim]"); if (b) { e.preventDefault(); e.stopPropagation(); abrir(); } }, true);
  document.addEventListener("ipr:lingua", function () { botao(); pintar(); });

  W.IPR_AGUA_SIM = { abrir: abrir, fechar: fechar, _estado: S };
})(window);
