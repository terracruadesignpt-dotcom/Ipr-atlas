/* IPR Atlas · Simulador de Fogo (painel «Simular fogo»). IPR – Instituto de Planeamento Regenerativo. «Sim» do Nuno a 27/10/2026.
   O botão só aparece com sessão iniciada e quando tcd/v1/fogo/aviso responde (motor ligado e chave no site).
   Decisões do Nuno, 27/10/2026: quatro funções (Cenário no tempo, Antes e depois, Muitas ignições, Fogo e primeira chuva),
   clientes com Base entregue, painel no tema «Fogo» do T62 (ajustes.js). Não mexe em nenhum ficheiro: liga-se pelo DOM
   (#ipr-t62, tema data-t62="fogo") e pelo que está em window (__ipe.mapa, __ipe.estado, tcdNonce, IPR_LINGUA).
   Fala só com o site (tcd/v1/fogo/*, módulo m90422); o site assina e fala com o motor.
   Regras: aviso aceite por versão (texto vindo do motor, uma só fonte); faixa «em testes» sempre visível; o motor bloqueia
   em risco máximo ou com incêndio activo nos concelhos à volta (423); a frequência das muitas ignições não é probabilidade;
   uma faixa nunca é barreira garantida (o modelo não tem projecções). */
(function (W) {
  "use strict";
  if (W.IPR_FOGO_SIM) return;
  var D = {
    pt: {
      botao: "Simular fogo", botaoAgua: "Simular água", sims: "Simuladores", titulo: "Simular fogo", fechar: "Fechar", min: "Minimizar",
      semMapa: "Para simular, abra um dos seus mapas com a Base Cartográfica entregue.",
      semConta: "O simulador está disponível para clientes com Base Cartográfica. Entre na sua conta.",
      tab_tempo: "Cenário no tempo", tab_ad: "Antes e depois", tab_muitas: "Muitas ignições", tab_chuva: "Fogo e primeira chuva",
      d_tempo: "Uma ignição, um vento e uma humidade: a frente avança no tempo. Mostra o tempo de chegada e as isócronas.",
      d_ad: "O mesmo cenário com e sem as suas intervenções (faixas, fogo controlado, pastoreio, mosaico, caminhos, charcas).",
      d_muitas: "Muitas ignições ao acaso, com semente fixa. Mostra a fracção das corridas que queimam cada célula. Não é probabilidade real de arder.",
      d_chuva: "Um cenário no tempo cuja área ardida segue para o Simulador de Água, para estudar a primeira chuva depois do fogo.",
      ign: "Ignição", ponto: "Ponto", linhaI: "Linha", ignH: "Clique no mapa para marcar a ignição. Numa linha, termine com duplo clique ou «Terminar».",
      semIgn: "Ainda não marcou nenhuma ignição.", zona: "Zona das ignições (opcional)", zonaB: "Desenhar a zona", semZona: "Sem zona: as ignições caem em todo o domínio.",
      n: "Número de ignições", semente: "Semente",
      vento: "Vento a 10 m", vel: "Velocidade", dir: "Vem de", campo: "Campo de vento", c_uni: "Uniforme", c_rel: "Ajustado ao relevo (WindNinja)",
      pontos: { 0: "Norte", 45: "Nordeste", 90: "Leste", 135: "Sudeste", 180: "Sul", 225: "Sudoeste", 270: "Oeste", 315: "Noroeste" },
      hum: "Humidade dos combustíveis", h_cen: "Cenário (Scott e Burgan 2005)", h_livre: "Valores livres (%)",
      cen: { D1L1: "Muito seco, vivos muito secos (D1L1)", D1L2: "Muito seco, vivos secos (D1L2)", D2L2: "Seco (D2L2)", D2L3: "Seco, vivos médios (D2L3)",
        D3L3: "Médio (D3L3)", D3L4: "Médio, vivos húmidos (D3L4)", D4L4: "Húmido (D4L4)" },
      m1h: "Mortos 1 h", m10h: "Mortos 10 h", m100h: "Mortos 100 h", mherb: "Vivos herbáceos", mwoody: "Vivos lenhosos",
      meteoNota: "Os dias típicos regionais e o dia observado entram quando houver fonte de dados com licença; por agora, valores dados por si.",
      dur: "Duração", passo: "Intervalo das isócronas", limite: "Limite de vento de Rothermel (por omissão desligado, como o behave)",
      desenhar: "Intervenções", faixa: "Faixa de gestão", fogo_controlado: "Fogo controlado", pastoreio: "Pastoreio", mosaico: "Mosaico ou cultura", caminho: "Caminho ou aceiro", charca: "Charca",
      desH: "Clique no mapa para marcar os vértices do polígono. Termine com duplo clique ou «Terminar». Esc cancela.", terminar: "Terminar", cancelar: "Cancelar",
      combD: "Combustível depois da intervenção", nenhuma: "Ainda não desenhou nenhuma intervenção.", apagar: "Apagar",
      simular: "Simular", aSimular: "A simular…", fila: "Na fila", corre: "A calcular", falhou: "Não foi possível simular",
      bloqueado: "Simulador bloqueado neste local.", emerg: "Em caso de incêndio, siga as indicações da Protecção Civil e ligue 112.",
      anteriores: "Simulações deste mapa", nenhumaSim: "Ainda não há simulações neste mapa.", ver: "Ver",
      resultados: "Resultados", camadas: "No mapa", descargas: "Ficheiros (COG, GeoPackage, CSV)",
      area: "Área ardida", areaProp: "Ardida dentro do terreno", chegada: "Primeira chegada ao terreno", truncado: "A frente chegou ao limite do domínio: a área está subestimada.",
      antes: "Antes", depois: "Depois", difA: "Diferença de área", freqMax: "Fracção máxima", corridas: "Corridas", chuvaAg: "A área ardida está pronta para o Simulador de Água (intervenção «ocupação»). O CN depois do fogo dá-se lá, com fonte.",
      naoMod: "Não modelado", ventoR: "Vento", humR: "Humidade",
      avisoT: "Aviso importante", avisoErro: "Não foi possível ler o aviso do simulador. Tente mais tarde.",
      avisoChk: "Li e compreendo: nunca usarei estes resultados para decidir ficar ou sair, nem para agir num incêndio real.", aceitar: "Aceitar e continuar",
      faixaT: "Em testes · só informativo e para aprendizagem · nunca usar para decidir ficar ou sair num incêndio real. Emergência: 112.",
      inc: "Incerteza do vento e da humidade (conjunto de cenários)", incN: "Cenários", incSd: "Desvio da direcção",
      incNota: "Corre o mesmo cenário várias vezes com o vento e a humidade a variar à volta dos valores dados. Mostra a fracção dos cenários em que cada célula arde: não é a probabilidade real de arder. Demora mais.",
      conjN: "Cenários", conjArea: "Área (10 % a 90 % dos cenários)", conjP50: "Arde em pelo menos metade dos cenários",
      notaFim: "Cenário hipotético de modelo. Uma faixa, um caminho ou uma charca nunca são barreiras garantidas: o modelo não tem projecções nem fogo de copas."
    },
    en: {
      botao: "Fire simulator", botaoAgua: "Water simulator", sims: "Simulators", titulo: "Fire simulator", fechar: "Close", min: "Minimise",
      semMapa: "To simulate, open one of your maps with a delivered Base Map.", semConta: "The simulator is available to Base Map clients. Please sign in.",
      tab_tempo: "Scenario over time", tab_ad: "Before and after", tab_muitas: "Many ignitions", tab_chuva: "Fire and first rain",
      d_tempo: "One ignition, one wind and one fuel moisture: the front advances over time. Shows arrival time and isochrones.",
      d_ad: "The same scenario with and without your interventions (fuel breaks, prescribed burning, grazing, mosaic, tracks, ponds).",
      d_muitas: "Many random ignitions with a fixed seed. Shows the fraction of runs that burn each cell. It is not a real burn probability.",
      d_chuva: "A scenario over time whose burnt area goes to the Water Simulator, to study the first rain after the fire.",
      ign: "Ignition", ponto: "Point", linhaI: "Line", ignH: "Click on the map to place the ignition. For a line, finish with a double click or «Finish».",
      semIgn: "No ignition placed yet.", zona: "Ignition zone (optional)", zonaB: "Draw the zone", semZona: "No zone: ignitions fall anywhere in the domain.",
      n: "Number of ignitions", semente: "Seed",
      vento: "Wind at 10 m", vel: "Speed", dir: "From", campo: "Wind field", c_uni: "Uniform", c_rel: "Adjusted to terrain (WindNinja)",
      pontos: { 0: "North", 45: "Northeast", 90: "East", 135: "Southeast", 180: "South", 225: "Southwest", 270: "West", 315: "Northwest" },
      hum: "Fuel moisture", h_cen: "Scenario (Scott and Burgan 2005)", h_livre: "Free values (%)",
      cen: { D1L1: "Very dry, live very dry (D1L1)", D1L2: "Very dry, live dry (D1L2)", D2L2: "Dry (D2L2)", D2L3: "Dry, live moderate (D2L3)",
        D3L3: "Moderate (D3L3)", D3L4: "Moderate, live moist (D3L4)", D4L4: "Moist (D4L4)" },
      m1h: "Dead 1 h", m10h: "Dead 10 h", m100h: "Dead 100 h", mherb: "Live herbaceous", mwoody: "Live woody",
      meteoNota: "Regional typical days and the observed day will come with a licensed data source; for now, values set by you.",
      dur: "Duration", passo: "Isochrone interval", limite: "Rothermel wind limit (off by default, as in behave)",
      desenhar: "Interventions", faixa: "Fuel break", fogo_controlado: "Prescribed burning", pastoreio: "Grazing", mosaico: "Mosaic or crop", caminho: "Track or firebreak", charca: "Pond",
      desH: "Click on the map to add the polygon vertices. Finish with a double click or «Finish». Esc cancels.", terminar: "Finish", cancelar: "Cancel",
      combD: "Fuel after the intervention", nenhuma: "No interventions drawn yet.", apagar: "Delete",
      simular: "Simulate", aSimular: "Simulating…", fila: "Queued", corre: "Running", falhou: "Could not simulate",
      bloqueado: "The simulator is blocked here.", emerg: "In a fire, follow Civil Protection instructions and call 112.",
      anteriores: "Simulations for this map", nenhumaSim: "No simulations for this map yet.", ver: "View",
      resultados: "Results", camadas: "On the map", descargas: "Files (COG, GeoPackage, CSV)",
      area: "Burnt area", areaProp: "Burnt inside the property", chegada: "First arrival at the property", truncado: "The front reached the domain edge: the area is underestimated.",
      antes: "Before", depois: "After", difA: "Area difference", freqMax: "Maximum fraction", corridas: "Runs", chuvaAg: "The burnt area is ready for the Water Simulator (land-cover intervention). The post-fire CN is set there, with a source.",
      naoMod: "Not modelled", ventoR: "Wind", humR: "Moisture",
      avisoT: "Important notice", avisoErro: "Could not read the simulator notice. Please try later.",
      avisoChk: "I have read and understand: I will never use these results to decide whether to stay or leave, or to act in a real fire.", aceitar: "Accept and continue",
      faixaT: "In testing · information and learning only · never use to decide whether to stay or leave in a real fire. Emergency: 112.",
      inc: "Wind and moisture uncertainty (scenario ensemble)", incN: "Scenarios", incSd: "Direction spread",
      incNota: "Runs the same scenario several times with the wind and moisture varying around the given values. Shows the fraction of scenarios in which each cell burns: it is not the real probability of burning. Takes longer.",
      conjN: "Scenarios", conjArea: "Area (10 % to 90 % of scenarios)", conjP50: "Burns in at least half of the scenarios",
      notaFim: "Hypothetical model scenario. A fuel break, a track or a pond is never a guaranteed barrier: the model has no spotting or crown fire."
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
  var BETA = '<span class="ipr-beta" style="margin-left:7px;padding:1px 7px;border-radius:999px;border:1px solid currentColor;font:600 10px Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;opacity:.85;vertical-align:middle">Beta</span>';
  function api(c, op) {
    op = op || {}; op.credentials = "same-origin"; op.headers = Object.assign({ "X-WP-Nonce": W.tcdNonce || "" }, op.headers || {});
    if (op.body && typeof op.body !== "string") { op.body = JSON.stringify(op.body); op.headers["Content-Type"] = "application/json"; }
    return fetch(REST + c, op).then(function (r) { return r.json().then(function (j) { if (!r.ok) { var e = new Error(j && j.message || ("HTTP " + r.status)); e.estado = r.status; throw e; } return j; }); });
  }
  function urlF(u) { return u + (u.indexOf("?") < 0 ? "?" : "&") + "_wpnonce=" + encodeURIComponent(W.tcdNonce || ""); }

  // Modelos de combustível do catálogo do motor (dados/modelos_behave_si.csv): Scott e Burgan (2005) e Anderson (1982).
  var MODELOS = (function () {
    var l = [[91, "NB1 urbano"], [93, "NB3 agrícola"], [98, "NB8 água"], [99, "NB9 solo nu"]], i;
    for (i = 1; i <= 9; i++) l.push([100 + i, "GR" + i]);
    for (i = 1; i <= 4; i++) l.push([120 + i, "GS" + i]);
    for (i = 1; i <= 9; i++) l.push([140 + i, "SH" + i]);
    for (i = 1; i <= 5; i++) l.push([160 + i, "TU" + i]);
    for (i = 1; i <= 9; i++) l.push([180 + i, "TL" + i]);
    for (i = 1; i <= 4; i++) l.push([200 + i, "SB" + i]);
    for (i = 1; i <= 13; i++) l.push([i, "FM" + i]);
    return l;
  })();
  // Combustível por omissão depois de cada intervenção: só uma sugestão, o cliente escolhe (o resumo declara o código usado).
  var COMB0 = { faixa: 101, fogo_controlado: 181, pastoreio: 101, mosaico: 93, caminho: 99, charca: 98 };
  var TIPO_MOTOR = { faixa: "faixa", fogo_controlado: "fogo-controlado", pastoreio: "pastoreio", mosaico: "mosaico", caminho: "caminho", charca: "charca" };
  var PROC = { tempo: "cenario-tempo", ad: "antes-depois", muitas: "muitas-ignicoes", chuva: "fogo-chuva" };

  var IC = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c3 4 6 6 6 10a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 2 3 3 3 0-2-1-4 0-6z"/></svg>';
  var S = { inc: { on: false, n: 20, sd: 15 }, tab: "tempo", aviso: null, avisoTx: null, avisoChk: false, ign: [], zona: null, feats: [], des: null,
    vento: { kmh: 20, de: 315, campo: "uniforme" }, hum: { modo: "cenario", cenario: "D2L3", m1h: 6, m10h: 7, m100h: 8, mherb: 90, mwoody: 120 },
    dur: 2, passo: 30, limite: false, nIgn: 50, semente: 1, job: null, res: null, erro: "", bloq: false, lista: [], camadas: {} };

  // ───────────── estilos (os mesmos tokens do painel da água) ─────────────
  function css() {
    if (document.getElementById("ipr-fs-css")) return;
    var st = document.createElement("style"); st.id = "ipr-fs-css";
    st.textContent =
      "#ipr-fs{position:absolute;z-index:41;top:12px;right:12px;width:clamp(400px,32vw,520px);max-width:calc(100% - 24px);max-height:calc(100% - 24px);display:flex;flex-direction:column;background:var(--p1,#171a13);color:var(--tx,#ebe7d8);border:1px solid var(--ln2,#3b4232);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.35);font:14px/1.5 Inter,system-ui,sans-serif;overflow:hidden}" +
      "#ipr-fs[hidden]{display:none}#ipr-fs *{box-sizing:border-box}#ipr-fs.min .fs-corpo,#ipr-fs.min .fs-tabs{display:none}" +
      "#ipr-fs .fs-cab{display:flex;align-items:center;gap:8px;padding:9px 10px 9px 12px;border-bottom:1px solid var(--ln,#2b3024);background:var(--p2,#1d2118)}#ipr-fs .fs-cab svg{color:#e07a3f}#ipr-fs .fs-cab b{flex:1;font:600 15px Raleway,Inter,sans-serif}" +
      "#ipr-fs .fs-ib{border:0;background:transparent;color:var(--mu,#a3a690);cursor:pointer;width:30px;height:30px;border-radius:7px;font:600 15px Inter,sans-serif}#ipr-fs .fs-ib:hover{background:var(--acs,rgba(168,184,120,.16));color:var(--tx,#ebe7d8)}" +
      "#ipr-fs .fs-tabs{display:flex;gap:2px;padding:6px 8px;border-bottom:1px solid var(--ln,#2b3024);overflow-x:auto;scrollbar-width:none}#ipr-fs .fs-tabs button{flex:1 0 auto;border:0;background:transparent;color:var(--mu,#a3a690);font:500 13px Inter,sans-serif;padding:5px 8px;border-radius:999px;cursor:pointer;white-space:nowrap}#ipr-fs .fs-tabs button[aria-selected=true]{background:var(--acs,rgba(168,184,120,.16));color:var(--tx,#ebe7d8)}" +
      "#ipr-fs .fs-corpo{overflow:auto;padding:10px 12px 12px;flex:1 1 auto;min-height:0;overscroll-behavior:contain}#ipr-fs p.sub{margin:0 0 10px;color:var(--mu,#a3a690);font-size:13px}" +
      "#ipr-fs .fs-h{display:block;font:600 11.5px Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--mu,#a3a690);margin:12px 0 6px}" +
      "#ipr-fs label.f{display:flex;flex-direction:column;gap:3px;margin:0 0 8px;font-size:13px}#ipr-fs .ln{display:flex;gap:6px;align-items:center}#ipr-fs .g2{display:grid;grid-template-columns:1fr 1fr;gap:0 8px}" +
      "#ipr-fs input[type=number],#ipr-fs select{width:100%;min-width:0;height:36px;padding:4px 9px;border-radius:7px;border:1px solid var(--ln2,#3b4232);background:var(--bg,#121410);color:var(--tx,#ebe7d8);font:14px Inter,sans-serif}" +
      "#ipr-fs .un{font:500 11px 'IBM Plex Mono',monospace;color:var(--mu,#a3a690);min-width:28px}" +
      "#ipr-fs .b{font:500 14px Inter,sans-serif;padding:7px 11px;border-radius:8px;border:1px solid var(--ln2,#3b4232);background:transparent;color:var(--tx,#ebe7d8);cursor:pointer;min-height:38px}#ipr-fs .b:hover{border-color:#e07a3f}#ipr-fs .b.pri{background:#e07a3f;border-color:#e07a3f;color:#141814;font-weight:600}#ipr-fs .b:disabled{opacity:.45;cursor:default}" +
      "#ipr-fs .acc{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}#ipr-fs .nota{font-size:12.5px;color:var(--mu,#a3a690);margin:6px 0}" +
      "#ipr-fs .av{margin:10px 0 0;padding:7px 9px;border-left:3px solid #e07a3f;background:var(--p2,#1d2118);font-size:12.5px}" +
      "#ipr-fs .err{margin:8px 0;padding:7px 9px;border-left:3px solid #d9534f;background:var(--p2,#1d2118);font-size:13px}" +
      "#ipr-fs .it{border:1px solid var(--ln,#2b3024);border-radius:9px;padding:8px;margin:0 0 6px;background:var(--p2,#1d2118)}#ipr-fs .it b{font-size:12.5px}" +
      "#ipr-fs .kv{display:grid;grid-template-columns:1fr auto;gap:2px 10px;font-size:13px;margin:0 0 6px}#ipr-fs .kv span:nth-child(2n){font:500 12px 'IBM Plex Mono',monospace;text-align:right}" +
      "#ipr-fs .cam label{display:flex;gap:6px;align-items:center;font-size:13px;margin:0 0 4px}#ipr-fs .leg{display:flex;height:8px;border-radius:4px;overflow:hidden;margin:2px 0 1px}#ipr-fs .leg i{flex:1}#ipr-fs .legv{display:flex;justify-content:space-between;font:500 10px 'IBM Plex Mono',monospace;color:var(--mu,#a3a690)}" +
      "#ipr-fs ul.fx{margin:0;padding-left:16px;font-size:13px}#ipr-fs ul.fx a{color:#e07a3f}" +
      "#ipr-fs .prog{height:4px;border-radius:2px;background:var(--ln,#2b3024);overflow:hidden;margin:8px 0}#ipr-fs .prog i{display:block;height:100%;width:30%;background:#e07a3f;animation:iprfs 1.4s ease-in-out infinite}@keyframes iprfs{0%{margin-left:-30%}100%{margin-left:100%}}" +
      "#ipr-fs .des{padding:8px 10px;border:1px dashed #e07a3f;border-radius:9px;margin:8px 0;font-size:13px}" +
      "#ipr-fs .faixa{margin:0 0 10px;padding:6px 9px;border-radius:8px;background:rgba(217,83,79,.16);border:1px solid #d9534f;font-size:12.5px;line-height:1.4;font-weight:500}" +
      "#ipr-fs .avbox{border:1px solid #d9534f;border-radius:10px;padding:10px;background:var(--p2,#1d2118)}#ipr-fs .avbox p{font-size:13px;margin:6px 0 10px}#ipr-fs .chk{display:flex;gap:8px;align-items:flex-start;font-size:13px}" +
      "[data-fogo-sim]{border-color:#e07a3f!important;display:inline-flex;align-items:center;gap:5px}" +
      "#ipr-t62>.ipr-sims{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px;padding:10px;border:1px solid var(--ln2,#3b4232);border-radius:12px;background:var(--p2,#1d2118)}" +
      "#ipr-t62>.ipr-sims .h{flex-basis:100%;font:600 11px Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--mu,#a3a690)}" +
      "#ipr-t62>.ipr-sims .s{flex:1 1 140px;display:flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:8px 12px;border-radius:10px;font:600 14px Inter,sans-serif;cursor:pointer}" +
      "#ipr-t62>.ipr-sims .s.f{background:#e07a3f;border:1px solid #e07a3f!important;color:#141814}#ipr-t62>.ipr-sims .s.f:hover{filter:brightness(1.08)}" +
      "#ipr-t62>.ipr-sims .s.a{background:#3f8fc9;border:1px solid #3f8fc9;color:#0f1620}#ipr-t62>.ipr-sims .s.a:hover{filter:brightness(1.08)}" +
      "@media (max-width:1024px) and (min-width:601px){#ipr-fs{width:min(460px,calc(100% - 24px))}}" +
      "@media (max-width:600px){#ipr-fs{left:8px!important;right:8px;top:auto!important;bottom:60px;width:auto;max-width:none;max-height:min(72vh,calc(100% - 76px))}}";
    document.head.appendChild(st);
  }

  // ───────────── painel ─────────────
  var P = null;
  function painel() {
    if (P) return P; css();
    P = document.createElement("div"); P.id = "ipr-fs"; P.setAttribute("role", "dialog"); P.setAttribute("aria-label", t("titulo")); P.hidden = true;
    var host = (mapa() && mapa().getContainer && mapa().getContainer().parentNode) || document.body;
    host.appendChild(P);
    P.addEventListener("click", clique); P.addEventListener("change", mudar); P.addEventListener("input", mudar);
    return P;
  }
  function abrir() { painel().hidden = false; pintar(); lerAviso(); listar(); }
  function fechar() { if (P) P.hidden = true; pararDesenho(false); }
  function lerAviso() {
    if (!W.tcdNonce || S.avisoTx) return;
    api("fogo/aviso").then(function (a) { S.avisoTx = a; S.aviso = !!a.aceite; pintar(); })
      .catch(function (e) { S.avisoTx = { erro: e.message || t("avisoErro") }; pintar(); });
  }

  function pintar() {
    if (!P || P.hidden) return;
    var h = '<div class="fs-cab">' + IC + "<b>" + esc(t("titulo")) + BETA + '</b><button class="fs-ib" data-fs="min" title="' + esc(t("min")) + '">–</button><button class="fs-ib" data-fs="x" title="' + esc(t("fechar")) + '">×</button></div>';
    h += '<div class="fs-tabs" role="tablist">' + Object.keys(PROC).map(function (k) { return '<button role="tab" data-tab="' + k + '" aria-selected="' + (S.tab === k) + '">' + esc(t("tab_" + k)) + "</button>"; }).join("") + "</div>";
    h += '<div class="fs-corpo">' + corpo() + "</div>";
    P.innerHTML = h;
  }
  function corpo() {
    if (!W.tcdNonce) return '<p class="sub">' + esc(t("semConta")) + "</p>";
    var a = actual();
    if (!a || !a.id || (a.estado_k && a.estado_k !== "completed" && a.estado_k !== "entregue")) return '<p class="sub">' + esc(t("semMapa")) + "</p>";
    var h = '<p class="faixa">' + esc(t("faixaT")) + "</p>";
    if (!S.avisoTx) return h + '<div class="prog"><i></i></div>';
    if (S.avisoTx.erro) return h + '<div class="err">' + esc(S.avisoTx.erro) + "</div>";
    if (!S.aviso) {
      return h + '<div class="avbox"><b>' + esc(t("avisoT")) + "</b><p>" + esc(S.avisoTx[L()] || S.avisoTx.pt) + '</p><label class="chk"><input type="checkbox" data-k="avisoChk"' + (S.avisoChk ? " checked" : "") + "> " + esc(t("avisoChk")) +
        '</label><div class="acc"><button class="b pri" data-fs="aceitar"' + (S.avisoChk ? "" : " disabled") + ">" + esc(t("aceitar")) + "</button></div></div>" + (S.erro ? '<div class="err">' + esc(S.erro) + "</div>" : "");
    }
    h += '<p class="sub">' + esc(t("d_" + S.tab)) + "</p>";
    h += S.tab === "muitas" ? formMuitas() : formIgnicao();
    h += formVento() + formHum();
    h += '<div class="g2">' + campo("dur", "dur", S.dur, "h", 0.1, 12, 0.1) + (S.tab === "muitas" ? "" : campo("passo", "passo", S.passo, "min", 5, 120, 5)) + "</div>";
    h += '<label class="chk"><input type="checkbox" data-k="limite"' + (S.limite ? " checked" : "") + "> " + esc(t("limite")) + "</label>";
    if (S.tab === "tempo") {
      h += '<label class="chk"><input type="checkbox" data-k="incOn"' + (S.inc.on ? " checked" : "") + "> " + esc(t("inc")) + "</label>";
      if (S.inc.on) h += '<div class="g2">' + campo("incN", "incN", S.inc.n, "", 5, 40, 1) + campo("incSd", "incSd", S.inc.sd, "°", 0, 45, 5) + '</div><p class="nota">' + esc(t("incNota")) + "</p>";
    }
    if (S.tab === "ad") h += formAD();
    var corre = S.job && (S.job.estado === "accepted" || S.job.estado === "running" || S.job.enviar);
    h += '<div class="acc"><button class="b pri" data-fs="simular"' + (corre || S.des ? " disabled" : "") + ">" + esc(corre ? t("aSimular") : t("simular")) + "</button></div>";
    if (S.erro) h += '<div class="err">' + (S.bloq ? "<b>" + esc(t("bloqueado")) + "</b><br>" : "") + esc(S.erro) + (S.bloq ? "<br>" + esc(t("emerg")) : "") + "</div>";
    if (corre) h += '<div class="prog"><i></i></div><p class="nota">' + esc(S.job.estado === "running" ? t("corre") : t("fila")) + "</p>";
    if (S.res) h += resultados();
    h += anteriores();
    h += '<p class="av">' + esc(t("notaFim")) + " " + esc(t("emerg")) + "</p>";
    return h;
  }
  function campo(k, rot, v, un, mn, mx, st) {
    return '<label class="f">' + esc(t(rot)) + '<span class="ln"><input type="number" data-k="' + k + '" value="' + esc(v) + '" min="' + mn + '" max="' + mx + '" step="' + st + '"><span class="un">' + esc(un) + "</span></span></label>";
  }
  function bDesenho() {
    if (!S.des) return "";
    return '<div class="des">' + esc(S.des.tipo === "ign_ponto" ? t("ignH") : (S.des.tipo === "ign_linha" ? t("ignH") : t("desH"))) + '<div class="acc">' + (S.des.tipo === "ign_ponto" ? "" : '<button class="b pri" data-fs="terminar">' + esc(t("terminar")) + "</button>") + '<button class="b" data-fs="cancelar">' + esc(t("cancelar")) + "</button></div></div>";
  }
  function formIgnicao() {
    var h = '<span class="fs-h">' + esc(t("ign")) + "</span>";
    if (S.des && /^ign_/.test(S.des.tipo)) h += bDesenho();
    else h += '<div class="acc"><button class="b" data-des="ign_ponto">' + esc(t("ponto")) + '</button><button class="b" data-des="ign_linha">' + esc(t("linhaI")) + "</button></div>";
    if (!S.ign.length) h += '<p class="nota">' + esc(t("semIgn")) + "</p>";
    S.ign.forEach(function (g, i) { h += '<div class="it ln"><b style="flex:1">' + (i + 1) + ". " + esc(g.type === "Point" ? t("ponto") : t("linhaI")) + '</b><button class="b" data-apign="' + i + '">' + esc(t("apagar")) + "</button></div>"; });
    return h;
  }
  function formMuitas() {
    var h = '<div class="g2">' + campo("nIgn", "n", S.nIgn, "", 2, 200, 1) + campo("semente", "semente", S.semente, "", 0, 999999, 1) + "</div>";
    h += '<span class="fs-h">' + esc(t("zona")) + "</span>";
    if (S.des && S.des.tipo === "zona") h += bDesenho();
    else h += '<div class="acc"><button class="b" data-des="zona">' + esc(t("zonaB")) + "</button>" + (S.zona ? '<button class="b" data-fs="semzona">' + esc(t("apagar")) + "</button>" : "") + "</div>";
    if (!S.zona) h += '<p class="nota">' + esc(t("semZona")) + "</p>";
    return h;
  }
  function formVento() {
    var v = S.vento, P8 = t("pontos"), h = '<span class="fs-h">' + esc(t("vento")) + '</span><div class="g2">' + campo("kmh", "vel", v.kmh, "km/h", 0, 150, 1);
    h += '<label class="f">' + esc(t("dir")) + '<select data-k="de">' + Object.keys(P8).map(function (g) { return '<option value="' + g + '"' + (+g === +v.de ? " selected" : "") + ">" + esc(P8[g]) + " (" + g + "°)</option>"; }).join("") + "</select></label></div>";
    h += '<label class="f">' + esc(t("campo")) + '<select data-k="campoV"><option value="uniforme"' + (v.campo === "uniforme" ? " selected" : "") + ">" + esc(t("c_uni")) + '</option><option value="relevo"' + (v.campo === "relevo" ? " selected" : "") + ">" + esc(t("c_rel")) + "</option></select></label>";
    return h;
  }
  function formHum() {
    var m = S.hum, C = t("cen"), h = '<span class="fs-h">' + esc(t("hum")) + "</span>";
    h += '<label class="f"><select data-k="hmodo"><option value="cenario"' + (m.modo === "cenario" ? " selected" : "") + ">" + esc(t("h_cen")) + '</option><option value="livre"' + (m.modo === "livre" ? " selected" : "") + ">" + esc(t("h_livre")) + "</option></select></label>";
    if (m.modo === "cenario") h += '<label class="f"><select data-k="cenario">' + Object.keys(C).map(function (k) { return '<option value="' + k + '"' + (m.cenario === k ? " selected" : "") + ">" + esc(C[k]) + "</option>"; }).join("") + "</select></label>";
    else h += '<div class="g2">' + campo("m1h", "m1h", m.m1h, "%", 1, 40, 1) + campo("m10h", "m10h", m.m10h, "%", 1, 40, 1) + campo("m100h", "m100h", m.m100h, "%", 1, 40, 1) + campo("mherb", "mherb", m.mherb, "%", 30, 300, 5) + campo("mwoody", "mwoody", m.mwoody, "%", 30, 300, 5) + "</div>";
    return h + '<p class="nota">' + esc(t("meteoNota")) + "</p>";
  }
  function formAD() {
    var h = '<span class="fs-h">' + esc(t("desenhar")) + "</span>";
    if (S.des && !/^ign_|^zona$/.test(S.des.tipo)) h += bDesenho();
    else h += '<div class="acc">' + Object.keys(COMB0).map(function (k) { return '<button class="b" data-des="' + k + '">' + esc(t(k)) + "</button>"; }).join("") + "</div>";
    if (!S.feats.length) h += '<p class="nota">' + esc(t("nenhuma")) + "</p>";
    S.feats.forEach(function (f, i) {
      var p = f.properties;
      h += '<div class="it"><div class="ln"><b style="flex:1">' + (i + 1) + ". " + esc(t(p._k)) + '</b><button class="b" data-apagar="' + i + '">' + esc(t("apagar")) + "</button></div>";
      h += '<label class="f">' + esc(t("combD")) + '<select data-fi="' + i + '">' + MODELOS.map(function (m) { return '<option value="' + m[0] + '"' + (+p.combustivel === m[0] ? " selected" : "") + ">" + esc(m[1]) + " (" + m[0] + ")</option>"; }).join("") + "</select></label></div>";
    });
    return h;
  }

  // ───────────── resultados ─────────────
  function kvCenario(s) {
    var h = '<div class="kv"><span>' + esc(t("area")) + "</span><span>" + n(s.area_ardida_ha, 2) + " ha</span>";
    if (s.propriedade) h += "<span>" + esc(t("areaProp")) + "</span><span>" + n(s.propriedade.area_ardida_ha, 2) + " ha</span><span>" + esc(t("chegada")) + "</span><span>" + (s.propriedade.primeira_chegada_min == null ? "–" : n(s.propriedade.primeira_chegada_min, 0) + " min") + "</span>";
    return h + "</div>" + (s.truncado ? '<p class="nota">' + esc(t("truncado")) + "</p>" : "");
  }
  function resultados() {
    var r = S.res, s = r.resumo || {}, h = '<span class="fs-h">' + esc(t("resultados")) + "</span>";
    if (r.processo === "antes-depois") {
      h += "<b>" + esc(t("antes")) + "</b>" + kvCenario(s.antes || {}) + "<b>" + esc(t("depois")) + "</b>" + kvCenario(s.depois || {});
      h += '<div class="kv"><span>' + esc(t("difA")) + "</span><span>" + n(s.diferenca_area_ha, 2) + " ha</span></div>";
      if (s.nota) h += '<p class="nota">' + esc(s.nota) + "</p>";
    } else if (r.processo === "muitas-ignicoes") {
      h += '<div class="kv"><span>' + esc(t("corridas")) + "</span><span>" + n(s.n, 0) + "</span><span>" + esc(t("freqMax")) + "</span><span>" + n(s.frequencia_max, 3) + "</span></div>";
      if (s.nota) h += '<p class="nota">' + esc(s.nota) + "</p>";
    } else {
      h += kvCenario(s);
      if (s.conjunto) {
        var cj = s.conjunto;
        h += '<div class="kv"><span>' + esc(t("conjN")) + "</span><span>" + n(cj.n, 0) + "</span><span>" + esc(t("conjArea")) + "</span><span>" + n(cj.area_ha.p10, 0) + "–" + n(cj.area_ha.p90, 0) + " ha</span><span>" + esc(t("conjP50")) + "</span><span>" + n(cj.area_prob_50_ha, 0) + " ha</span></div>";
        if (cj.nota) h += '<p class="nota">' + esc(cj.nota) + "</p>";
      }
      if (r.processo === "fogo-chuva") h += '<p class="nota">' + esc(t("chuvaAg")) + "</p>";
    }
    var base = s.antes || s;
    if (base.vento) h += '<p class="nota">' + esc(t("ventoR")) + ": " + esc(base.vento.origem || "") + (base.vento.meia_chama ? " · " + esc(base.vento.meia_chama) : "") + "</p>";
    if (base.humidade) h += '<p class="nota">' + esc(t("humR")) + ": " + esc(base.humidade.origem || "") + "</p>";
    (s.avisos || base.avisos || []).forEach(function (a) { h += '<p class="nota">' + esc(a) + "</p>"; });
    if (base.nao_modelado && base.nao_modelado.length) h += '<p class="nota"><b>' + esc(t("naoMod")) + ":</b> " + esc(base.nao_modelado.join("; ")) + "</p>";
    if (r.vista && r.vista.camadas) {
      h += '<span class="fs-h">' + esc(t("camadas")) + '</span><div class="cam">';
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
    if (fx.length) h += '<span class="fs-h">' + esc(t("descargas")) + '</span><ul class="fx">' + fx.map(function (f) { return '<li><a href="' + esc(urlF(f.url)) + '" download>' + esc(f.nome) + "</a> <small>" + n(f.bytes / 1048576, 1) + " MB</small></li>"; }).join("") + "</ul>";
    return h;
  }
  function anteriores() {
    var h = '<span class="fs-h">' + esc(t("anteriores")) + "</span>", inv = {};
    if (!S.lista.length) return h + '<p class="nota">' + esc(t("nenhumaSim")) + "</p>";
    Object.keys(PROC).forEach(function (k) { inv[PROC[k]] = k; });
    return h + '<ul class="fx">' + S.lista.map(function (j) { return "<li>" + esc(t("tab_" + (inv[j.processo] || "tempo"))) + " · " + esc(new Date(j.criado).toLocaleString(L() === "en" ? "en-GB" : "pt-PT")) + ' <a href="#" data-verjob="' + esc(j.id) + '">' + esc(t("ver")) + "</a></li>"; }).join("") + "</ul>";
  }

  // ───────────── acções ─────────────
  function clique(e) {
    var el = e.target.closest("button,a"); if (!el) return;
    e.preventDefault();
    var a = el.getAttribute("data-fs");
    if (a === "x") return fechar();
    if (a === "min") { P.classList.toggle("min"); return; }
    if (el.hasAttribute("data-tab")) { S.tab = el.getAttribute("data-tab"); pararDesenho(false); pintar(); return; }
    if (a === "simular") return simular();
    if (a === "aceitar") {
      api("fogo/aviso", { method: "POST", body: { versao: S.avisoTx.versao } }).then(function () { S.aviso = true; S.erro = ""; pintar(); })
        .catch(function (err) { S.erro = err.message; S.avisoTx = null; lerAviso(); pintar(); });
      return;
    }
    if (el.hasAttribute("data-des")) return comecarDesenho(el.getAttribute("data-des"));
    if (a === "terminar") return pararDesenho(true);
    if (a === "cancelar") return pararDesenho(false);
    if (a === "semzona") { S.zona = null; desenharFeats(); pintar(); return; }
    if (el.hasAttribute("data-apagar")) { S.feats.splice(+el.getAttribute("data-apagar"), 1); desenharFeats(); pintar(); return; }
    if (el.hasAttribute("data-apign")) { S.ign.splice(+el.getAttribute("data-apign"), 1); desenharFeats(); pintar(); return; }
    if (el.hasAttribute("data-verjob")) { S.job = { id: el.getAttribute("data-verjob"), estado: "running" }; S.res = null; limparCamadas(); pintar(); acompanhar(); }
  }
  function mudar(e) {
    var el = e.target;
    if (el.hasAttribute("data-cam")) { alternarCamada(el.getAttribute("data-cam"), el.checked); pintar(); return; }
    if (el.hasAttribute("data-fi")) { S.feats[+el.getAttribute("data-fi")].properties.combustivel = +el.value; return; }
    var k = el.getAttribute("data-k"); if (!k) return;
    if (k === "avisoChk") { S.avisoChk = el.checked; pintar(); return; }
    if (k === "limite") { S.limite = el.checked; return; }
    if (k === "incOn") { S.inc.on = el.checked; pintar(); return; }
    if (k === "incN") { S.inc.n = Math.max(5, Math.min(40, Math.round(+el.value) || 20)); return; }
    if (k === "incSd") { S.inc.sd = Math.max(0, Math.min(45, +el.value || 0)); return; }
    if (k === "kmh" || k === "de") { S.vento[k] = +el.value; return; }
    if (k === "campoV") { S.vento.campo = el.value; return; }
    if (k === "hmodo") { S.hum.modo = el.value; pintar(); return; }
    if (k === "cenario") { S.hum.cenario = el.value; return; }
    if (/^m(1h|10h|100h|herb|woody)$/.test(k)) { S.hum[k] = +el.value; return; }
    if (k === "dur" || k === "passo" || k === "nIgn" || k === "semente") { S[k] = +el.value; }
  }
  function entradas() {
    var ent = { epsg: 4326, duracao_h: S.dur, limite_vento: S.limite,
      vento: { velocidade_10m_m_s: Math.round(S.vento.kmh / 3.6 * 100) / 100, direccao_de_graus: S.vento.de, campo: S.vento.campo },
      humidade: S.hum.modo === "cenario" ? { cenario: S.hum.cenario } : { m1h: S.hum.m1h, m10h: S.hum.m10h, m100h: S.hum.m100h, mherb: S.hum.mherb, mwoody: S.hum.mwoody, origem: "valores dados pelo utilizador no Atlas" } };
    if (S.tab === "muitas") { ent.n = S.nIgn; ent.semente = S.semente; if (S.zona) ent.zona_ignicao = S.zona; return ent; }
    ent.passo_isocronas_min = S.passo;
    ent.ignicoes = S.ign.map(function (g) { return g.type === "Point" ? { tipo: "ponto", x: g.coordinates[0], y: g.coordinates[1] } : { tipo: "linha", pontos: g.coordinates }; });
    // dentro do vento: o site (m90422) só passa ao motor os campos que conhece, e «vento» é um deles
    if (S.tab === "tempo" && S.inc.on) ent.vento.incerteza = { n: S.inc.n, sigma_direccao_graus: S.inc.sd };
    if (S.tab === "ad") ent.intervencoes = { type: "FeatureCollection", epsg: 4326, features: S.feats.map(function (f) { return { type: "Feature", geometry: f.geometry, properties: { tipo: TIPO_MOTOR[f.properties._k], combustivel: f.properties.combustivel } }; }) };
    return ent;
  }
  function simular() {
    var a = actual(); if (!a) return;
    if (S.tab !== "muitas" && !S.ign.length) { S.erro = t("semIgn"); S.bloq = false; pintar(); return; }
    if (S.tab === "ad" && !S.feats.length) { S.erro = t("nenhuma"); S.bloq = false; pintar(); return; }
    S.erro = ""; S.bloq = false; S.res = null; S.job = { enviar: true }; limparCamadas(); pintar();
    api("fogo/simular", { method: "POST", body: { enc: a.id, processo: PROC[S.tab], entradas: entradas() } })
      .then(function (r) { S.job = { id: r.trabalho.jobID, estado: r.trabalho.status }; pintar(); listar(); acompanhar(); })
      .catch(function (err) {
        S.job = null; S.erro = err.message; S.bloq = err.estado === 423;
        if (err.estado === 428) { S.aviso = false; S.avisoTx = null; lerAviso(); }
        pintar();
      });
  }
  var timer = null;
  function acompanhar() {
    clearTimeout(timer);
    var a = actual(), job = S.job; if (!job || !job.id || !a) return;
    api("fogo/trabalho/" + job.id + "?enc=" + encodeURIComponent(a.id)).then(function (r) {
      if (S.job !== job) return;                     // resposta de um acompanhamento antigo (outra simulação ou «Ver»)
      job.estado = r.estado;
      if (r.estado === "successful") {
        S.res = r; S.job = null;
        var v = (r.ficheiros || []).filter(function (f) { return f.nome === "vista/vista.json"; })[0];
        if (v) return fetch(urlF(v.url), { credentials: "same-origin" }).then(function (x) { return x.json(); }).then(function (vj) {
          S.res.vista = vj; S.res.fich = {}; (r.ficheiros || []).forEach(function (f) { S.res.fich[f.nome] = f.url; });
          var conj = vj.camadas.some(function (c) { return c.id === "probabilidade"; });
          vj.camadas.filter(function (c) { return conj ? /^(probabilidade|probabilidade_contornos)$/.test(c.id) : /^(chegada_h|depois__chegada_h|frequencia|isocronas|depois__isocronas)$/.test(c.id); }).forEach(function (c) { alternarCamada(c.id, true); });
          pintar();
        });
        pintar(); return;
      }
      if (r.estado === "failed" || r.estado === "dismissed") { S.erro = t("falhou") + (r.mensagem ? ": " + r.mensagem : "."); S.job = null; pintar(); return; }
      pintar(); timer = setTimeout(acompanhar, 4000);
    }).catch(function (err) { if (S.job !== job) return; S.erro = err.message; S.job = null; pintar(); });
  }
  function listar() {
    var a = actual(); if (!a || !W.tcdNonce) return;
    api("fogo/trabalhos?enc=" + encodeURIComponent(a.id)).then(function (r) { S.lista = r.trabalhos || []; pintar(); }).catch(function () {});
  }

  // ───────────── camadas no mapa ─────────────
  function alternarCamada(id, ligar) {
    var M = mapa(), r = S.res; if (!M || !r || !r.vista) return;
    var c = r.vista.camadas.filter(function (x) { return x.id === id; })[0]; if (!c) return;
    var sid = "ipr-fs-" + id;
    if (!ligar) { [sid + "-l", sid + "-t"].forEach(function (l) { if (M.getLayer(l)) M.removeLayer(l); }); if (M.getSource(sid)) M.removeSource(sid); delete S.camadas[id]; return; }
    if (M.getSource(sid)) return;
    if (c.imagem) {
      var u = r.fich["vista/" + c.imagem]; if (!u) return;
      M.addSource(sid, { type: "image", url: urlF(u), coordinates: c.cantos });
      M.addLayer({ id: sid + "-l", type: "raster", source: sid, paint: { "raster-opacity": 0.8, "raster-resampling": "nearest" } });
    } else if (c.geojson) {
      var g = r.fich["vista/" + c.geojson]; if (!g) return;
      M.addSource(sid, { type: "geojson", data: urlF(g) });
      if (id === "probabilidade_contornos") {
        M.addLayer({ id: sid + "-l", type: "line", source: sid, paint: { "line-color": ["interpolate", ["linear"], ["get", "probabilidade"], 0.1, "#f8c471", 0.5, "#e67e22", 0.9, "#922b21"], "line-width": 1.8, "line-dasharray": [3, 1.5] } });
        M.addLayer({ id: sid + "-t", type: "symbol", source: sid, layout: { "symbol-placement": "line", "text-field": ["get", "rotulo"], "text-size": 10 },
          paint: { "text-color": "#fff", "text-halo-color": "#141814", "text-halo-width": 1.2 } });
        S.camadas[id] = true; return;
      }
      M.addLayer({ id: sid + "-l", type: "line", source: sid, paint: { "line-color": ["interpolate", ["linear"], ["get", "t_min"], 0, "#fff3b0", 60, "#f4a259", 180, "#bc4b51", 720, "#5b2333"], "line-width": 1.6 } });
      M.addLayer({ id: sid + "-t", type: "symbol", source: sid, layout: { "symbol-placement": "line", "text-field": ["concat", ["to-string", ["get", "t_min"]], " min"], "text-size": 10 },
        paint: { "text-color": "#fff", "text-halo-color": "#141814", "text-halo-width": 1.2 } });
    }
    S.camadas[id] = true;
  }
  function limparCamadas() { Object.keys(S.camadas).forEach(function (id) { alternarCamada(id, false); }); }

  // ───────────── desenho: ignições (ponto ou linha), zona das ignições e intervenções (polígonos) ─────────────
  var SRC = "ipr-fs-des";
  function comecarDesenho(k) {
    var M = mapa(); if (!M) return;
    pararDesenho(false);
    S.des = { tipo: k, pts: [] };
    var est = ipe().estado; if (est) { S.toolAntes = est.tool; est.tool = "fogo"; }
    M.getCanvas().style.cursor = "crosshair";
    M.on("click", aoClicar); M.on("dblclick", aoDuplo);
    if (M.doubleClickZoom) M.doubleClickZoom.disable();
    pintar(); desenharFeats();
  }
  function aoClicar(e) {
    if (!S.des) return;
    S.des.pts.push([e.lngLat.lng, e.lngLat.lat]);
    if (S.des.tipo === "ign_ponto") return pararDesenho(true);
    desenharFeats();
  }
  function aoDuplo(e) { if (!S.des) return; e.preventDefault(); pararDesenho(true); }
  function pararDesenho(guardar) {
    var M = mapa(); if (!S.des) return;
    var d = S.des; S.des = null;
    if (M) { M.off("click", aoClicar); M.off("dblclick", aoDuplo); M.getCanvas().style.cursor = ""; setTimeout(function () { if (M.doubleClickZoom) M.doubleClickZoom.enable(); }, 300); }
    var est = ipe().estado; if (est) est.tool = S.toolAntes || "nav";
    var pts = d.pts.filter(function (p, i, a) { return !i || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1]; });
    if (guardar) {
      if (d.tipo === "ign_ponto" && pts.length) S.ign.push({ type: "Point", coordinates: pts[0] });
      else if (d.tipo === "ign_linha" && pts.length >= 2) S.ign.push({ type: "LineString", coordinates: pts.slice(0, 200) });
      else if (pts.length >= 3) {
        var pol = { type: "Polygon", coordinates: [pts.concat([pts[0]])] };
        if (d.tipo === "zona") S.zona = pol;
        else S.feats.push({ type: "Feature", properties: { _k: d.tipo, combustivel: COMB0[d.tipo] }, geometry: pol });
      }
    }
    desenharFeats(); pintar();
  }
  function desenharFeats() {
    var M = mapa(); if (!M) return;
    var fs = S.feats.map(function (f) { return { type: "Feature", properties: { k: "int" }, geometry: f.geometry }; });
    if (S.zona) fs.push({ type: "Feature", properties: { k: "zona" }, geometry: S.zona });
    S.ign.forEach(function (g) { fs.push({ type: "Feature", properties: { k: "ign" }, geometry: g }); });
    if (S.des && S.des.pts.length) {
      if (S.des.pts.length > 1) fs.push({ type: "Feature", properties: { k: "d" }, geometry: { type: "LineString", coordinates: S.des.pts } });
      S.des.pts.forEach(function (p) { fs.push({ type: "Feature", properties: { k: "d" }, geometry: { type: "Point", coordinates: p } }); });
    }
    var dados = { type: "FeatureCollection", features: fs };
    if (M.getSource(SRC)) { M.getSource(SRC).setData(dados); return; }
    M.addSource(SRC, { type: "geojson", data: dados });
    M.addLayer({ id: SRC + "-f", type: "fill", source: SRC, filter: ["==", ["geometry-type"], "Polygon"], paint: { "fill-color": ["match", ["get", "k"], "zona", "#e8c547", "#66bb6a"], "fill-opacity": 0.22 } });
    M.addLayer({ id: SRC + "-l", type: "line", source: SRC, filter: ["!=", ["geometry-type"], "Point"], paint: { "line-color": ["match", ["get", "k"], "ign", "#ff3d00", "zona", "#c9a227", "#2e7d32"], "line-width": ["match", ["get", "k"], "ign", 3.5, 2] } });
    M.addLayer({ id: SRC + "-p", type: "circle", source: SRC, filter: ["==", ["geometry-type"], "Point"], paint: { "circle-radius": ["match", ["get", "k"], "ign", 6, 4], "circle-color": ["match", ["get", "k"], "ign", "#ff3d00", "#e8c547"], "circle-stroke-color": "#141814", "circle-stroke-width": 1.5 } });
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && S.des) pararDesenho(false); });

  // ───────────── botão nas ferramentas do tema «Fogo» do T62 (ajustes.js) ─────────────
  // O botão só aparece a quem tem sessão e quando o site confirma que o simulador está ligado (motor e chave).
  var DISP = null;
  function disponivel() {
    if (DISP !== null || !W.tcdNonce) return;
    DISP = "a ver";
    api("fogo/aviso").then(function (a) { S.avisoTx = a; S.aviso = !!a.aceite; DISP = true; botao(); })
      .catch(function (e) { DISP = e.estado === 503 ? false : null; if (DISP === null) setTimeout(function () { DISP = null; }, 60000); });
  }
  function botao() {
    var w = document.getElementById("ipr-t62"); if (!w) return;
    disponivel();
    destaque();
    if (DISP !== true) return;
    var ligado = w.querySelector('[data-t62="fogo"][aria-pressed="true"]');
    var sec = ligado && w.querySelector(".ipr-t62-c:not(.ipr-ag-c) .ipr-t62-f");
    if (!sec) return;
    var b = sec.querySelector("[data-fogo-sim]");
    if (!b) { css(); b = document.createElement("button"); b.type = "button"; b.setAttribute("data-fogo-sim", ""); sec.appendChild(b); }
    if (b.getAttribute("data-l") !== L()) { b.innerHTML = IC + "<span>" + esc(t("botao")) + "</span>" + BETA; b.setAttribute("data-l", L()); }
  }
  // Destaque (Nuno, 28/10/2026: «os simuladores merecem mais destaque no Atlas»): faixa «Simuladores» no topo do painel
  // de temas, com o mapa entregue aberto. O botão da água usa o atributo do painel da água (agua-simulador.js), se existir.
  function destaque() {
    var w = document.getElementById("ipr-t62"); if (!w) return;
    var a = actual(), entregue = a && a.id && (!a.estado_k || a.estado_k === "completed" || a.estado_k === "entregue");
    var fogo = DISP === true && entregue, agua = !!W.IPR_AGUA_SIM && entregue;
    var d = w.querySelector(":scope > .ipr-sims");
    if (!fogo && !agua) { if (d) d.remove(); return; }
    var chave = L() + (fogo ? "f" : "") + (agua ? "a" : "");
    if (d && d.getAttribute("data-k") === chave && d === w.firstElementChild) return;
    css();
    if (!d) { d = document.createElement("div"); d.className = "ipr-sims"; }
    d.setAttribute("data-k", chave);
    var IA = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c3 5 6 8 6 11a6 6 0 0 1-12 0c0-3 3-6 6-11z"/></svg>';
    d.innerHTML = '<span class="h">' + esc(t("sims")) + "</span>" +
      (fogo ? '<button type="button" class="s f" data-fogo-sim>' + IC.replace(/16/g, "18") + "<span>" + esc(t("botao")) + "</span>" + BETA + "</button>" : "") +
      (agua ? '<button type="button" class="s a" data-agua-sim>' + IA + "<span>" + esc(t("botaoAgua")) + "</span>" + BETA + "</button>" : "");
    if (d !== w.firstElementChild) w.insertBefore(d, w.firstChild);
  }
  var obsEl = null, obsT = null;
  function observar() {
    var w = document.getElementById("ipr-t62");
    if (w && w !== obsEl) { if (obsT) obsT.disconnect(); obsEl = w; obsT = new MutationObserver(botao); obsT.observe(w, { childList: true, subtree: true }); botao(); }
  }
  setInterval(function () { if (!document.hidden) { observar(); destaque(); } }, 1000);
  observar();
  document.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest("[data-fogo-sim]"); if (b) { e.preventDefault(); e.stopPropagation(); abrir(); } }, true);
  document.addEventListener("ipr:lingua", function () { botao(); pintar(); });

  W.IPR_FOGO_SIM = { abrir: abrir, fechar: fechar, _estado: S };
})(window);
