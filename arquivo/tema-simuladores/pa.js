/* IPR Atlas · Pergunte ao Atlas (04/11/2026). Terracrua Design. Só acrescenta; não edita nenhum outro ficheiro.
   Pedido do Nuno, inspirado na Mari da UrbVerde (USP): um assistente por voz e por escrito que liga camadas, enquadra o
   terreno e explica com números e fonte. Nuno, 04/11/2026, 12h43: «avança sem mandar abaixo o site».
   Regra dura (alojamento frágil): ZERO carga nova no servidor WordPress. Este ficheiro:
   - não faz nenhum pedido a /wp-json nem a nenhum endereço deste site (cada pedido passa por obter(), que o recusa);
   - não chama modelos de linguagem: percebe os pedidos por regras e sinónimos, no navegador;
   - não repete consultas: cada endereço externo é pedido uma vez por sessão da página (cache em memória);
   - só pede às fontes públicas que o Atlas já consulta directamente (DGT OGC API, ICNF, APA, Mapterhorn), sem recurso ao
     proxy do site; se a fonte não responder, diz que não respondeu;
   - não liga camadas que passam pelo servidor do site (tipo «wmsp», «ent», ficheiros da Base servidos pelo site, fontes
     que o viz.js pode desviar para o proxy viz/px): explica e aponta para o catálogo.
   O que faz:
   1. Botão «Pergunte ao Atlas» no topo do mapa (#ipe-mapa) e uma caixa com microfone. Voz pela Web Speech API do navegador
      (pt-PT ou en-GB); sem suporte, só texto. Resposta falada opcional (speechSynthesis), desligada por omissão.
   2. Liga e desliga camadas do catálogo do Atlas (IPRViz.catalogo, __ipe.viz.ligar / fundo), por sinónimos e, se não
      houver sinónimo, pelo nome da camada.
   3. «Vai para…»: usa a caixa de pesquisa do Atlas (#ipe-busca / #ipe-q): o app.js e o pesquisa-barra.js tratam de locais
      (Nominatim), coordenadas e NIC (cadastro da DGT), como sempre.
   4. Terreno: usa o que já está carregado (__ipe.estado.actual, os desenhos do mapa, os terrenos guardados).
   5. «O que há aqui? / tem REN? / classe do PDM?»: lê as camadas ligadas no ponto (queryRenderedFeatures) ou um mosaico
      vectorial da DGT; para o terreno inteiro usa o IPRDiag.calcular do Atlas. PDM, REN e RAN são sempre informação, com a
      fonte oficial, e acabam com «Quem decide é a Câmara, pelo Pedido de Informação Prévia (PIP).» Nunca «pode construir».
   6. «Simula 100 mm de chuva»: abre a Simular água (agua-simulador.js, painel #ipr-as) com o valor preenchido, só depois de
      a pessoa confirmar, e não carrega em «Simular».
   7. Junta-se ao assistente de compra (assistente.js) em vez de o repetir: pedidos de compra abrem-no
      (window.iprAssistenteComprar); enquanto ele está aberto, este botão recolhe.
   Desligar: ?pergunte=0 no endereço, localStorage ipr_pergunte_off = 1, ou window.IPR_PERGUNTE_OFF = true. */
(function (W, D) {
  "use strict";
  if (W.__iprPergunte || W.IPR_PERGUNTE_OFF) return;
  try { if (/[?&]pergunte=0(&|#|$)/.test(W.location.search || "")) return; } catch (e) {}
  try { if (W.localStorage.getItem("ipr_pergunte_off") === "1") return; } catch (e) {}
  var API = W.__iprPergunte = { versao: "1.0.0", pedidos: [], recusados: [] };

  // ───────────────────────────── língua ─────────────────────────────
  function EN() {
    var l = String(D.documentElement.getAttribute("lang") || "").toLowerCase();
    if (l.indexOf("en") === 0) return true;
    if (l.indexOf("pt") === 0) return W.IPR_LINGUA === "en";
    return W.IPR_LINGUA === "en";
  }
  var TX = {
    pt: {
      botao: "Pergunte ao Atlas", titulo: "Pergunte ao Atlas", fechar: "Fechar", enviar: "Perguntar",
      caixa: "Escreva ou diga o que quer ver", caixaRot: "Pergunta ao Atlas",
      falar: "Falar", parar: "Parar de ouvir", ouvir: "A ouvir… fale agora.", semVoz: "Este navegador não tem reconhecimento de voz: escreva a pergunta.",
      vozErro: "O navegador não deu acesso ao microfone.", vozNada: "Não ouvi nada. Tente de novo ou escreva.", vozRede: "O reconhecimento de voz deste navegador precisa de internet.",
      lerVoz: "Ler as respostas em voz alta",
      nota: "Responde com as camadas e as fontes públicas que o Atlas já usa. Nada é enviado ao site.",
      eu: "Pergunta", atlas: "Atlas", fonte: "Fonte", aConsultar: "A consultar…", ocupado: "Ainda estou a responder à pergunta anterior.",
      semMapa: "O mapa ainda está a abrir. Tente daqui a pouco.",
      pip: "Quem decide é a Câmara, pelo Pedido de Informação Prévia (PIP).",
      info: "É informação, não é parecer: vale o que está publicado em Diário da República e no SNIT.",
      ajudaT: "Pode perguntar, por exemplo:",
      naoPercebi: "Não percebi o pedido.", percebi: "Percebi: {x}.", proximos: "Perguntas parecidas que sei responder:",
      ligada: "Liguei «{n}».", jaLigada: "«{n}» já está ligada.", desligada: "Desliguei «{n}».", jaDesligada: "«{n}» não estava ligada.",
      minz: "Só aparece a partir do nível de aproximação {z} (agora {a}).", aproximar: "Aproximar",
      servidor: "«{n}» passa pelo servidor do site, que hoje está sob carga. Não a ligo por aqui. Se precisar mesmo dela, ligue-a no catálogo de camadas, à esquerda.",
      incerto: "«{n}» pode passar pelo servidor do site quando a fonte não responde directamente. Hoje não a ligo por aqui. Pode ligá-la no catálogo de camadas, à esquerda.",
      semDados: "«{n}» vem da Base Cartográfica e esta Base não a tem, ou não há nenhuma Base aberta.",
      baseSo: "{x} vem da Base Cartográfica (LiDAR) e só existe com uma Base aberta.",
      declAqui: "Calcular o declive aqui",
      varias: "Encontrei várias camadas com esse nome. Qual?", nenhumaCam: "Não encontrei nenhuma camada com «{x}» no catálogo do Atlas.",
      activas: "Camadas ligadas ({n}): {x}.", nenhumaActiva: "Não há camadas temáticas ligadas.",
      limparQ: "Desligo {n} camadas temáticas (o fundo e o seu terreno ficam)?", limpar: "Desligar", cancelar: "Cancelar", limpo: "Desliguei {n} camadas.",
      ir: "A procurar «{x}» na pesquisa do Atlas…", fui: "Fui para «{x}» (OpenStreetMap, pela pesquisa do Atlas).", fuiCoord: "Fui para as coordenadas {x}.",
      naoFui: "A pesquisa do Atlas não encontrou «{x}». Tente outra forma de escrever, coordenadas ou o NIC.", semPesquisa: "Não encontrei a caixa de pesquisa do Atlas.",
      outros: "Há mais resultados na pesquisa, no bloco da esquerda.",
      semTerreno: "Não encontrei nenhum terreno aberto. Abra uma Base, desenhe a área ou escolha um terreno guardado.",
      enquadrei: "Enquadrei «{n}»{a}.", qualTerreno: "Qual terreno?", baseAberta: "A Base «{n}» já está aberta.",
      abrirBase: "Abrir «{n}»", qualBase: "Que Base quer abrir?", semBases: "Não encontrei Bases nesta sessão. Entre na sua conta e abra-a no separador «Projectos».",
      baseNaoAbre: "Não consigo abrir essa Base daqui. Abra-a no separador «Projectos».",
      ponto: { clique: "No ponto onde tocou ({c})", centro: "No centro do mapa ({c})" },
      escolherPonto: "Escolher outro ponto no mapa", toqueMapa: "Toque no mapa no ponto que quer consultar.",
      terrenoDe: "No terreno «{n}» ({a})",
      ren_s: "dentro de REN", ren_n: "fora da REN", ran_s: "dentro de RAN", ran_n: "fora da RAN",
      pdm_s: "o PDM (qualificação do solo) indica {x}", pdm_n: "não encontrei categoria do PDM neste ponto",
      tipologia: "tipologia: {x}", semFonte: "a fonte não respondeu ({f}). Tente mais tarde; não há recurso pelo servidor do site.",
      fonteRen: "DGT, SRUP, colecção srup_ren_areal (OGC API)", fonteRan: "DGT, SRUP, colecção srup_ran (OGC API)",
      fontePdm: "DGT, CRUS, colecção crus (OGC API). Vinculativo é o PDM publicado em Diário da República e no SNIT",
      pctArea: "{p} % da área em {x}",
      construir: "O Atlas não diz se se pode construir. O que as fontes públicas mostram:",
      aqui: "O que há aqui", coord: "Coordenadas (WGS84): {x}.", fregQ: "Freguesia de {f}, concelho de {m}.", fonteCaop: "DGT, CAOP 2025",
      cota: "Cota aproximada: {x} m", fonteCota: "Mapterhorn (modelo de terreno público); para projecto use a Base Cartográfica (LiDAR DGT)",
      declive: "Declive aproximado no ponto: {x} %", camadasAqui: "Nas camadas ligadas:", nadaAqui: "Nas camadas ligadas não há nada neste ponto.",
      semCamadas: "Não há camadas temáticas ligadas. Ligue, por exemplo, a REN ou o PDM e pergunte de novo.",
      resumoT: "Resumo do terreno «{n}»", area: "Área: {x} ha.",
      r_ren: "REN: {x} % da área (DGT, SRUP).", r_ran: "RAN: {x} % da área (DGT, SRUP).",
      r_nat: "Rede Natura 2000: {x} % da área{s} (ICNF).", r_agua: "Linhas de água: {n} troços, {c} m dentro do terreno, ordem máxima {o} (APA, rede geocodificada).",
      r_fogo: "Perigosidade estrutural de incêndio: predominante {p}, máxima {m} (ICNF, 2020–2030).",
      r_cos: "Ocupação do solo: {x} (DGT, COS 2023).", r_rel: "Relevo: cotas entre {a} e {b} m, declive médio {d} % (Mapterhorn).",
      semDiag: "O diagnóstico do Atlas (IPRDiag) não está disponível nesta página.",
      sim: "Simular água · Onde a água pára · {x} mm", simAbrir: "Abrir o simulador com {x} mm",
      simPronto: "Preenchi {x} mm em «Onde a água pára». Leia o aviso do painel e carregue em «Simular» quando quiser: não carrego por si.",
      simIndisp: "A Simular água só está disponível para clientes com a Base Cartográfica entregue e a sessão iniciada.",
      simMm: "Diga a altura de chuva em milímetros, por exemplo «simula 100 mm de chuva».", simLimite: "Use valores entre 1 e 500 mm.",
      simConf: "Abro a Simular água, que fala com o servidor do simulador como quando carrega no botão do tema «Água no terreno». Confirma?",
      simFogo: "O simulador de fogo abre-se no tema «Fogo» (Simular fogo). Por aqui só preparo a Simular água.",
      comprar: "Abri o assistente de compra.", semComprar: "O assistente de compra não está disponível nesta página.",
      zoomIn: "Aproximei.", zoomOut: "Afastei.", tresD: "Liguei a vista 3D.", gps: "Pedi a sua localização ao navegador.", norte: "Pus o norte para cima.",
      ex: ["Liga a REN", "Mostra as curvas de nível", "Desliga o cadastro", "Vai para Santa Clara-a-Nova", "Vai para 37.51, -8.47",
        "Enquadra o meu terreno", "O que há aqui?", "Este terreno tem REN?", "Qual a classe do PDM aqui?", "Qual a cota aqui?",
        "Resumo do meu terreno", "Simula 100 mm de chuva aqui", "Que camadas estão ligadas?", "Quero comprar uma Planta de Localização"]
    },
    en: {
      botao: "Ask the Atlas", titulo: "Ask the Atlas", fechar: "Close", enviar: "Ask",
      caixa: "Type or say what you want to see", caixaRot: "Question to the Atlas",
      falar: "Speak", parar: "Stop listening", ouvir: "Listening… speak now.", semVoz: "This browser has no speech recognition: please type.",
      vozErro: "The browser did not allow the microphone.", vozNada: "I heard nothing. Try again or type.", vozRede: "This browser's speech recognition needs an internet connection.",
      lerVoz: "Read answers aloud",
      nota: "Answers come from the layers and public sources the Atlas already uses. Nothing is sent to the site.",
      eu: "Question", atlas: "Atlas", fonte: "Source", aConsultar: "Checking…", ocupado: "I am still answering the previous question.",
      semMapa: "The map is still opening. Try again shortly.",
      pip: "The decision belongs to the Municipality, through a Prior Information Request (PIP).",
      info: "This is information, not an opinion: what counts is what is published in the Diário da República and SNIT.",
      ajudaT: "You can ask, for example:",
      naoPercebi: "I did not understand the request.", percebi: "I understood: {x}.", proximos: "Similar questions I can answer:",
      ligada: "Turned on «{n}».", jaLigada: "«{n}» is already on.", desligada: "Turned off «{n}».", jaDesligada: "«{n}» was not on.",
      minz: "It only shows from zoom level {z} (now {a}).", aproximar: "Zoom in",
      servidor: "«{n}» goes through the site's server, which is under load today. I will not turn it on from here. If you really need it, turn it on in the layer catalogue on the left.",
      incerto: "«{n}» may go through the site's server when its source does not answer directly. I will not turn it on from here today. You can turn it on in the layer catalogue on the left.",
      semDados: "«{n}» comes from the Base Map and this Base does not have it, or no Base is open.",
      baseSo: "{x} comes from the Base Map (LiDAR) and only exists with a Base open.",
      declAqui: "Estimate the slope here",
      varias: "I found several layers with that name. Which one?", nenhumaCam: "I found no layer matching «{x}» in the Atlas catalogue.",
      activas: "Layers on ({n}): {x}.", nenhumaActiva: "No thematic layers are on.",
      limparQ: "Turn off {n} thematic layers (the background and your land stay)?", limpar: "Turn off", cancelar: "Cancel", limpo: "Turned off {n} layers.",
      ir: "Searching for «{x}» with the Atlas search…", fui: "Went to «{x}» (OpenStreetMap, via the Atlas search).", fuiCoord: "Went to coordinates {x}.",
      naoFui: "The Atlas search found nothing for «{x}». Try another spelling, coordinates or the NIC.", semPesquisa: "I could not find the Atlas search box.",
      outros: "There are more results in the search, on the left panel.",
      semTerreno: "I found no land open. Open a Base, draw the area or pick a saved plot.",
      enquadrei: "Framed «{n}»{a}.", qualTerreno: "Which plot?", baseAberta: "The Base «{n}» is already open.",
      abrirBase: "Open «{n}»", qualBase: "Which Base do you want to open?", semBases: "I found no Bases in this session. Sign in and open it in the «Projects» tab.",
      baseNaoAbre: "I cannot open that Base from here. Open it in the «Projects» tab.",
      ponto: { clique: "At the point you tapped ({c})", centro: "At the centre of the map ({c})" },
      escolherPonto: "Pick another point on the map", toqueMapa: "Tap the map at the point you want to check.",
      terrenoDe: "On the plot «{n}» ({a})",
      ren_s: "inside REN", ren_n: "outside REN", ran_s: "inside RAN", ran_n: "outside RAN",
      pdm_s: "the PDM (land qualification) shows {x}", pdm_n: "I found no PDM category at this point",
      tipologia: "type: {x}", semFonte: "the source did not answer ({f}). Try later; there is no fallback through the site's server.",
      fonteRen: "DGT, SRUP, collection srup_ren_areal (OGC API)", fonteRan: "DGT, SRUP, collection srup_ran (OGC API)",
      fontePdm: "DGT, CRUS, collection crus (OGC API). The binding document is the PDM published in the Diário da República and SNIT",
      pctArea: "{p} % of the area in {x}",
      construir: "The Atlas does not say whether you can build. What the public sources show:",
      aqui: "What is here", coord: "Coordinates (WGS84): {x}.", fregQ: "Parish of {f}, municipality of {m}.", fonteCaop: "DGT, CAOP 2025",
      cota: "Approximate elevation: {x} m", fonteCota: "Mapterhorn (public terrain model); for design work use the Base Map (DGT LiDAR)",
      declive: "Approximate slope at the point: {x} %", camadasAqui: "In the layers that are on:", nadaAqui: "The layers that are on have nothing at this point.",
      semCamadas: "No thematic layers are on. Turn on, for example, REN or the PDM and ask again.",
      resumoT: "Summary of the plot «{n}»", area: "Area: {x} ha.",
      r_ren: "REN: {x} % of the area (DGT, SRUP).", r_ran: "RAN: {x} % of the area (DGT, SRUP).",
      r_nat: "Natura 2000: {x} % of the area{s} (ICNF).", r_agua: "Watercourses: {n} reaches, {c} m inside the plot, highest order {o} (APA).",
      r_fogo: "Structural wildfire hazard: mostly {p}, highest {m} (ICNF, 2020–2030).",
      r_cos: "Land cover: {x} (DGT, COS 2023).", r_rel: "Relief: elevation from {a} to {b} m, mean slope {d} % (Mapterhorn).",
      semDiag: "The Atlas diagnosis (IPRDiag) is not available on this page.",
      sim: "Water simulator · Where water stops · {x} mm", simAbrir: "Open the simulator with {x} mm",
      simPronto: "I filled in {x} mm in «Where water stops». Read the panel notice and press «Simulate» when you want: I will not press it for you.",
      simIndisp: "The water simulator is only available to clients with a delivered Base Map who are signed in.",
      simMm: "Say the rainfall depth in millimetres, for example «simulate 100 mm of rain».", simLimite: "Use values between 1 and 500 mm.",
      simConf: "I will open the water simulator, which talks to the simulation server just like the button in the «Water on the land» theme. Confirm?",
      simFogo: "The fire simulator opens from the «Fire» theme (Simulate fire). From here I only prepare the water simulator.",
      comprar: "Opened the purchase assistant.", semComprar: "The purchase assistant is not available on this page.",
      zoomIn: "Zoomed in.", zoomOut: "Zoomed out.", tresD: "Turned on the 3D view.", gps: "Asked the browser for your location.", norte: "North is up.",
      ex: ["Turn on REN", "Show contour lines", "Turn off the cadastre", "Go to Santa Clara-a-Nova", "Go to 37.51, -8.47",
        "Frame my land", "What is here?", "Is this plot in REN?", "What is the PDM class here?", "What is the elevation here?",
        "Summary of my land", "Simulate 100 mm of rain here", "Which layers are on?", "I want to buy a Location Plan"]
    }
  };
  function t(k, v) {
    var d = TX[EN() ? "en" : "pt"], s = d[k] != null ? d[k] : TX.pt[k];
    if (typeof s !== "string") return s;
    return s.replace(/\{(\w+)\}/g, function (_, n) { return v && v[n] != null ? String(v[n]) : ""; });
  }
  function nf(x, dec) {
    try { return Number(x).toLocaleString(EN() ? "en-GB" : "pt-PT", { maximumFractionDigits: dec == null ? 1 : dec, minimumFractionDigits: 0 }); } catch (e) { return String(x); }
  }
  function fmtLL(ll) { var s = EN() ? ", " : "; "; return nf(ll[1], 5) + s + nf(ll[0], 5); }

  // ───────────────────────────── acesso ao Atlas (só leitura do que já existe) ─────────────────────────────
  function ipe() { return W.__ipe || null; }
  function mapa() { var i = ipe(); return i && i.mapa && i.mapa.getCanvas ? i.mapa : null; }
  function viz() { var i = ipe(); return i && i.viz && typeof i.viz.ligar === "function" ? i.viz : null; }
  function est() { var i = ipe(); return i && i.estado || null; }
  function catalogo() { return W.IPRViz && Array.isArray(W.IPRViz.catalogo) ? W.IPRViz.catalogo : []; }
  function porId(id) { var c = catalogo(); for (var i = 0; i < c.length; i++) if (c[i] && c[i].id === id) return c[i]; return null; }
  function nomeCam(it) { return it ? (EN() && it.en ? it.en : it.n || it.id) : ""; }
  function activas() { var v = viz(); try { return v && v.activas ? v.activas() : []; } catch (e) { return []; } }
  function norm(s) {
    s = String(s || "").toLowerCase();
    try { s = s.normalize("NFD").replace(/[̀-ͯ]/g, ""); } catch (e) {}
    return s.replace(/[«»"“”'’`´]/g, " ").replace(/[^a-z0-9,.\-+ºª°\s]/g, " ").replace(/\s+/g, " ").trim();
  }

  // ───────────────────────────── pedidos externos (nunca ao site) ─────────────────────────────
  var FONTES_OK = { "ogcapi.dgterritorio.gov.pt": 1, "sigservices.icnf.pt": 1, "sniambgeoogc.apambiente.pt": 1, "inspire.apambiente.pt": 1, "tiles.mapterhorn.com": 1 };
  function hostDe(u) { try { return new URL(u, W.location.href).host; } catch (e) { return ""; } }
  function mesmaOrigem(u) {
    try { var x = new URL(u, W.location.href); return x.origin === W.location.origin || /\/wp-json\//.test(x.pathname); } catch (e) { return true; }
  }
  var CACHE = {};
  function obter(u, tipo, ms) {
    if (!/^https:\/\//i.test(u) || mesmaOrigem(u) || !FONTES_OK[hostDe(u)] || /\/wp-json\//i.test(u)) {
      API.recusados.push(u); return Promise.reject(new Error("pedido recusado"));
    }
    var k = tipo + " " + u;
    if (CACHE[k]) return CACHE[k];
    API.pedidos.push({ u: u, t: Date.now() });
    var p = new Promise(function (res, rej) {
      var fim = setTimeout(function () { rej(new Error("tempo")); }, ms || 15000);
      W.fetch(u, { credentials: "omit", mode: "cors" }).then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return tipo === "bin" ? r.arrayBuffer() : tipo === "blob" ? r.blob() : r.json();
      }).then(function (x) { clearTimeout(fim); res(x); }, function (e) { clearTimeout(fim); rej(e); });
    });
    CACHE[k] = p;
    p.catch(function () { setTimeout(function () { if (CACHE[k] === p) delete CACHE[k]; }, 120000); });
    return p;
  }
  function gunzip(buf) {
    var b = new Uint8Array(buf);
    if (b[0] === 31 && b[1] === 139 && W.DecompressionStream) return new Response(new Blob([buf]).stream().pipeThrough(new W.DecompressionStream("gzip"))).arrayBuffer();
    return Promise.resolve(buf);
  }

  // ───────────────────────────── geometria ─────────────────────────────
  function lx(x) { return (x + 180) / 360; }
  function ly(y) { var a = y * Math.PI / 180; return (1 - Math.log(Math.tan(a) + 1 / Math.cos(a)) / Math.PI) / 2; }
  function pipAnel(p, r) {
    var d = false;
    for (var i = 0, j = r.length - 1; i < r.length; j = i++) {
      var xi = r[i][0], yi = r[i][1], xj = r[j][0], yj = r[j][1];
      if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) d = !d;
    }
    return d;
  }
  function pipAneis(p, aneis) { var d = false; for (var i = 0; i < aneis.length; i++) if (pipAnel(p, aneis[i])) d = !d; return d; }
  function poligonos(gj) {
    var out = [];
    (function per(o) {
      if (!o) return;
      if (typeof o === "string") { try { o = JSON.parse(o); } catch (e) { return; } }
      if (o.type === "FeatureCollection") (o.features || []).forEach(per);
      else if (o.type === "Feature") per(o.geometry);
      else if (o.type === "GeometryCollection") (o.geometries || []).forEach(per);
      else if (o.type === "Polygon") out.push(o.coordinates);
      else if (o.type === "MultiPolygon") (o.coordinates || []).forEach(function (c) { out.push(c); });
    })(gj);
    return out;
  }
  function caixa(polys) {
    var b = [Infinity, Infinity, -Infinity, -Infinity];
    polys.forEach(function (pg) { (pg[0] || []).forEach(function (c) { if (c[0] < b[0]) b[0] = c[0]; if (c[1] < b[1]) b[1] = c[1]; if (c[0] > b[2]) b[2] = c[0]; if (c[1] > b[3]) b[3] = c[1]; }); });
    return isFinite(b[0]) ? b : null;
  }
  function areaAnel(r) {
    var R = 6378137, s = 0;
    for (var i = 0; i < r.length - 1; i++) {
      var a = r[i], b = r[i + 1];
      s += (b[0] - a[0]) * Math.PI / 180 * (2 + Math.sin(a[1] * Math.PI / 180) + Math.sin(b[1] * Math.PI / 180));
    }
    return Math.abs(s * R * R / 2);
  }
  function areaHa(polys) { var m2 = 0; polys.forEach(function (pg) { pg.forEach(function (r, i) { m2 += (i ? -1 : 1) * areaAnel(r); }); }); return m2 / 1e4; }
  function dentroDe(p, polys) { for (var i = 0; i < polys.length; i++) if (pipAneis(p, polys[i])) return true; return false; }
  function amostras(polys, n) {
    var b = caixa(polys), out = []; if (!b) return out; n = n || 12;
    for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
      var p = [b[0] + (i + .5) / n * (b[2] - b[0]), b[1] + (j + .5) / n * (b[3] - b[1])];
      if (dentroDe(p, polys)) out.push(p);
    }
    if (!out.length) out.push([(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]);
    return out;
  }

  // ───────────────────────────── terreno e ponto ─────────────────────────────
  var CLIQUE = null, MAPA_LIGADO = null, ESCOLHER = null;
  function ligarMapa() {
    var m = mapa(); if (!m || m === MAPA_LIGADO) return;
    MAPA_LIGADO = m;
    try {
      m.on("click", function (e) {
        if (!e || !e.lngLat) return;
        CLIQUE = { ll: [e.lngLat.lng, e.lngLat.lat], t: Date.now() };
        if (ESCOLHER) { var f = ESCOLHER; ESCOLHER = null; try { W.__iprSemIdentificar = f.antes; } catch (x) {} f.depois(); }
      });
    } catch (e) {}
  }
  function ponto() {
    var m = mapa();
    if (CLIQUE && Date.now() - CLIQUE.t < 180000) return { ll: CLIQUE.ll, origem: "clique" };
    if (!m) return null;
    var c = m.getCenter(); return { ll: [c.lng, c.lat], origem: "centro" };
  }
  function descPonto(p) { return t("ponto")[p.origem].replace("{c}", fmtLL(p.ll)); }
  var MARCA = null;
  function marcar(ll) {
    try { if (MARCA) MARCA.remove(); MARCA = null; } catch (e) {}
    var m = mapa(); if (!m || !W.maplibregl || !W.maplibregl.Marker) return;
    try {
      var el = D.createElement("div"); el.className = "ipr-pa-marca"; el.setAttribute("aria-hidden", "true");
      MARCA = new W.maplibregl.Marker({ element: el }).setLngLat(ll).addTo(m);
      var mm = MARCA; setTimeout(function () { try { if (MARCA === mm) { mm.remove(); MARCA = null; } } catch (e) {} }, 25000);
    } catch (e) {}
  }
  function nomeTerreno(m) { return String(m && (m.local || m.nome || m.titulo || (m.encomenda ? "#" + m.encomenda : m.id != null ? "#" + m.id : "")) || "").trim(); }
  function terrenos() {
    var P = est(), out = [];
    if (P && P.modo === "cliente" && P.actual && P.actual.geojson) out.push({ nome: nomeTerreno(P.actual) || "Base", gj: P.actual.geojson, tipo: "base", m: P.actual });
    var m = mapa();
    try {
      var ctl = ((m && m._controls) || []).filter(function (c) { return c && typeof c.getAll === "function"; })[0];
      if (ctl) {
        var fs = (ctl.getAll().features || []).filter(function (f) { return f.geometry && /Polygon$/.test(f.geometry.type); });
        if (fs.length) out.push({ nome: EN() ? "drawn area" : "área desenhada", gj: { type: "FeatureCollection", features: fs }, tipo: "desenho" });
      }
    } catch (e) {}
    if (!out.length && P && Array.isArray(P.projs)) P.projs.forEach(function (x) { if (x && x.geojson) out.push({ nome: nomeTerreno(x) || "terreno", gj: x.geojson, tipo: "guardado", m: x }); });
    out.forEach(function (x) { x.polys = poligonos(x.gj); x.ha = areaHa(x.polys); });
    return out.filter(function (x) { return x.polys.length; });
  }
  function enquadrar(tr) {
    var m = mapa(), b = caixa(tr.polys); if (!m || !b) return false;
    try { m.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: W.innerWidth <= 600 ? 30 : 70, maxZoom: 17.5, duration: 800 }); return true; } catch (e) { return false; }
  }
  function txtHa(ha) { return ha ? " · " + nf(ha, ha < 10 ? 2 : 1) + " ha" : ""; }

  // ───────────────────────────── camadas ─────────────────────────────
  var SIN = [
    { k: "incendio", re: /risco de incendio|perigosidade|incendio|fire (risk|hazard)|wildfire|fogo/, ids: ["perig_e", "perig"] },
    { k: "ardidas", re: /areas? ardidas?|ardid|burnt|burned/, ids: ["ard15", "ard75"] },
    { k: "ren", re: /\bren\b|reserva ecologica|ecological reserve/, ids: ["ren"] },
    { k: "ran", re: /\bran\b|reserva agricola|agricultural reserve/, ids: ["ran"] },
    { k: "pdm", re: /\bpdm\b|ordenamento|qualificacao do solo|\bcrus\b|plano director|plano diretor|zoning|land use plan/, ids: ["crus"] },
    { k: "pontos_agua", re: /pontos? de agua|charcas?|ponds?/, ids: ["icnfpa"] },
    { k: "dph", re: /dominio publico hidrico|\bdph\b/, ids: ["dph"] },
    { k: "cheias", re: /inundav|cheias?|floods?/, ids: ["inund", "arpsi"] },
    { k: "linhas", re: /linhas? de agua|ribeiras?|\brios?\b|cursos? de agua|rede hidrografica|streams?|rivers?|watercourses?/, ids: ["l_streams", "hidro", "la350"] },
    { k: "declives", re: /declives?|inclinac|slopes?/, ids: ["l_declives"], base: 1 },
    { k: "curvas", re: /curvas?( de nivel)?|contours?/, ids: ["l_curvas1", "r_curvas", "r_cdgt"] },
    { k: "cadastro", re: /cadastr|parcelas?|predios?|parcels?|cadastre/, ids: ["cad"] },
    { k: "bupi", re: /\bbupi\b/, ids: ["bupi"] },
    { k: "orto", re: /ortofoto|\borto\b|fotografia aerea|imagem aerea|aerial|orthophoto/, ids: ["f_ortosat", "f_o25"], fundo: 1 },
    { k: "satelite", re: /satelite|satellite/, ids: ["f_esri", "f_s2g"], fundo: 1 },
    { k: "mapa", re: /openstreetmap|\bosm\b|mapa de ruas|street map/, ids: ["f_mapa"], fundo: 1 },
    { k: "capacidade", re: /capacidade de uso|\bsroa\b/, ids: ["sroa"] },
    { k: "cos", re: /\bcos\b|ocupacao do solo|uso do solo|land (cover|use)/, ids: ["cos23", "cos25", "cos_s2"] },
    { k: "natura", re: /natura|\bzec\b|\bzpe\b/, ids: ["n2k"] },
    { k: "protegidas", re: /areas? protegidas?|protected areas?|parque natural/, ids: ["rnap"] },
    { k: "solos", re: /carta de solos|tipos? de solo|soil map|\bsolos\b|\bsoils?\b/, ids: ["solos"] },
    { k: "geologia", re: /geolog/, ids: ["geo"] },
    { k: "hipso", re: /hipsometr|altimetr|elevation map|\bmdt\b/, ids: ["l_mdt", "r_hipso"] },
    { k: "relevo", re: /relevo|sombreado|hillshade|relief/, ids: ["r_somb"] },
    { k: "concelhos", re: /concelhos?|municipios?|municipalit/, ids: ["concelhos"] },
    { k: "freguesias", re: /freguesias?|parish/, ids: ["caop"] },
    { k: "distritos", re: /distritos?|districts?/, ids: ["distritos"] },
    { k: "nomes", re: /toponim|\bnomes\b|place names|labels/, ids: ["o_nomes"] },
    { k: "estradas", re: /estradas?|caminhos|roads?/, ids: ["o_estradas"] },
    { k: "edificios", re: /edificios|casas|buildings?/, ids: ["o_edif"] },
    { k: "bacias", re: /bacias?|watersheds?|catchments?|basins?/, ids: ["l_bacias_l", "bacias"] },
    { k: "captacoes", re: /furos?|pocos?|captac|boreholes?|wells?/, ids: ["capt_p"] },
    { k: "aquiferos", re: /aquifer|aguas subterraneas|groundwater/, ids: ["aquif"] },
    { k: "precip", re: /precipitac|chuva media|rainfall/, ids: ["precip"] },
    { k: "habitats", re: /habitats?/, ids: ["habitats", "hab_grupos"] },
    { k: "electrica", re: /rede ele[c]?trica|linhas ele[c]?tricas|alta tensao|power lines?/, ids: ["eletr"] },
    { k: "exposicao", re: /exposicao solar|orientacao|\baspect\b/, ids: ["l_exposicao"], base: 1 },
    { k: "twi", re: /humidade topografica|\btwi\b/, ids: ["l_twi"], base: 1 }
  ];
  var DIRECTO = { "sniambgeoogc.apambiente.pt": 1, "ogcapi.dgterritorio.gov.pt": 1, "ortos.dgterritorio.gov.pt": 1, "sigservices.icnf.pt": 1, "inspire.apambiente.pt": 1, "geo2.dgterritorio.gov.pt": 1, "sig.lneg.pt": 1, "s3.amazonaws.com": 1, "tiles.openfreemap.org": 1 };
  function baseFicheiro(it) {
    var P = est(), lid = it && (it.lid || String(it.id || "").replace(/^l_/, ""));
    if (!P || P.modo !== "cliente" || !P.actual || !lid) return null;
    var fs = P.actual.downloads || P.actual.entregas || [], u = null;
    fs.forEach(function (f) { var n = String(f && f.nome || "").split("/").pop().toLowerCase(); if (!u && n.replace(/\.(geojson|json|pmtiles)$/, "") === String(lid).toLowerCase()) u = f.url || ""; });
    return u;
  }
  // «ok»: o viz.js vai directo à fonte; «servidor»: passa pelo site; «incerto»: o viz.js pode desviá-la para o proxy do site.
  function rota(it) {
    if (!it) return "incerto";
    var tp = it.t;
    if (tp === "wmsp" || tp === "ent" || it._via === "px") return "servidor";
    if (tp === "lidar") {
      var u0 = baseFicheiro(it); if (u0 === null) return "semdados";
      if (!u0 || mesmaOrigem(u0)) return W.IPR_PERGUNTE_FICHEIROS_SITE === true && u0 && !/\/wp-json\//.test(u0) ? "ok" : "servidor";
      return "ok";
    }
    if (tp === "ext" || typeof it.ligar === "function") return "incerto";
    if (/^(xyz|hill|curvas|omt|omtbase|ovp)$/.test(tp)) return it.url && mesmaOrigem(it.url) ? "servidor" : "ok";
    var u = tp === "mvt" ? "https://ogcapi.dgterritorio.gov.pt/" : tp === "apa" ? "https://sniambgeoogc.apambiente.pt/" : (it.url || "");
    if (!u || mesmaOrigem(u) || /^http:/i.test(u)) return u ? "servidor" : "incerto";
    return DIRECTO[hostDe(u)] || it._via === "direto" ? "ok" : "incerto";
  }
  function escolherDoSin(s) {
    var cand = s.ids.map(porId).filter(Boolean);
    for (var i = 0; i < cand.length; i++) { var r = rota(cand[i]); if (r === "ok") return cand[i]; }
    for (i = 0; i < cand.length; i++) if (activas().indexOf(cand[i].id) >= 0) return cand[i];
    var semL = cand.filter(function (c) { return c.t !== "lidar"; });
    return semL[0] || cand[0] || null;
  }
  function sinonimos(q) {
    var out = [], r = " " + q + " ";
    for (var i = 0; i < SIN.length; i++) { var m = r.match(SIN[i].re); if (m) { out.push(SIN[i]); r = r.replace(m[0], " "); } }
    return out;
  }
  function sinonimo(q) { return sinonimos(q)[0] || null; }
  var VAZIAS = /\b(a|o|as|os|de|da|do|das|dos|camada|camadas|layer|layers|the|of|me|mapa|map|no|na|em|on|off|por favor|please)\b/g;
  function procurarNome(frase) {
    var f = norm(frase).replace(VAZIAS, " ").replace(/\s+/g, " ").trim(); if (f.length < 3) return [];
    var tk = f.split(" ").filter(function (x) { return x.length > 2; });
    return catalogo().filter(function (it) {
      var n = norm((it.n || "") + " " + (it.en || "") + " " + (it.sub || "") + " " + it.id);
      return n.indexOf(f) >= 0 || (tk.length && tk.every(function (x) { return n.indexOf(x) >= 0; }));
    }).slice(0, 6);
  }
  function ligarCamada(it, on, R) {
    var v = viz(), m = mapa(); if (!v || !m) return R.txt(t("semMapa"));
    var n = nomeCam(it), ja = activas().indexOf(it.id) >= 0;
    if (!on) {
      if (!ja) return R.txt(t("jaDesligada", { n: n }));
      try { v.ligar(it.id, false); } catch (e) {}
      return R.txt(t("desligada", { n: n }));
    }
    if (ja) { R.txt(t("jaLigada", { n: n })); return dicaZoom(it, R); }
    var r = rota(it);
    if (r === "servidor") return R.txt(t("servidor", { n: n }));
    if (r === "incerto") return R.txt(t("incerto", { n: n }));
    if (r === "semdados") return R.txt(t("semDados", { n: n }));
    try { if ((it.fundo || it.g === "fundo") && typeof v.fundo === "function") v.fundo(it.id); else v.ligar(it.id, true); } catch (e) {}
    R.txt(t("ligada", { n: n }) + (it.sub ? " (" + it.sub + ")" : ""));
    if (it.fonte) R.fonte(it.fonte);
    dicaZoom(it, R);
  }
  function dicaZoom(it, R) {
    var m = mapa(); if (!m || !it.minz) return;
    var z = m.getZoom(); if (z >= it.minz) return;
    R.txt(t("minz", { z: it.minz, a: nf(z, 1) }));
    R.accao(t("aproximar"), function () { try { m.easeTo({ zoom: it.minz + 0.3, duration: 700 }); } catch (e) {} });
  }

  // ───────────────────────────── consultas no ponto e no terreno ─────────────────────────────
  var COL = { ren: { col: "srup_ren_areal", id: "ren", fonte: "fonteRen" }, ran: { col: "srup_ran", id: "ran", fonte: "fonteRan" }, pdm: { col: "crus", id: "crus", fonte: "fontePdm" } };
  function textos(props) {
    var out = [];
    Object.keys(props || {}).forEach(function (k) {
      if (!/categ|design|^classe|qualif|tipolog|subcat|^tipo|^nome|^name|descri|uso/i.test(k)) return;
      var v = props[k]; if (typeof v === "string" && v.trim() && v.length < 160 && out.indexOf(v.trim()) < 0) out.push(v.trim());
    });
    return out.slice(0, 3);
  }
  // 1) camada ligada e desenhada neste zoom: queryRenderedFeatures; 2) senão, um mosaico vectorial da DGT (z14), directo.
  function featsRender(id, ll) {
    var m = mapa(); if (!m) return null;
    var it = porId(id); if (activas().indexOf(id) < 0 || (it && it.minz && m.getZoom() < it.minz)) return null;
    var cv = m.getCanvas(), px = m.project(ll); if (px.x < 0 || px.y < 0 || px.x > cv.clientWidth || px.y > cv.clientHeight) return null;
    try { if (m.isSourceLoaded && !m.isSourceLoaded("iprv-" + id)) return null; } catch (e) { return null; }
    var ls = ((m.getStyle() || {}).layers || []).filter(function (l) { return l.id.indexOf("iprv-" + id + "-") === 0 && /fill|line|circle/.test(l.type); }).map(function (l) { return l.id; });
    if (!ls.length) return null;
    try { return m.queryRenderedFeatures(px, { layers: ls }).map(function (f) { return f.properties || {}; }); } catch (e) { return null; }
  }
  function mosaico(col, z, x, y) {
    var dec = W.IPRDiag && W.IPRDiag.mvtDecode; if (!dec) return Promise.reject(new Error("IPRDiag"));
    var u = "https://ogcapi.dgterritorio.gov.pt/collections/" + col + "/tiles/WebMercatorQuad/" + z + "/" + y + "/" + x + "?f=mvt";
    var k = "mvt " + u;
    if (!CACHE[k]) CACHE[k] = obter(u, "bin", 20000).then(gunzip).then(function (b) { return b && b.byteLength ? dec(b) : []; });
    return CACHE[k];
  }
  function noMosaico(col, pts) {
    var z = 14, n = Math.pow(2, z), grupos = {};
    pts.forEach(function (p, i) { var X = lx(p[0]) * n, Y = ly(p[1]) * n, k = Math.floor(X) + "/" + Math.floor(Y); (grupos[k] = grupos[k] || []).push({ i: i, fx: X - Math.floor(X), fy: Y - Math.floor(Y) }); });
    var ks = Object.keys(grupos);
    if (ks.length > 6) {
      z = 12; n = Math.pow(2, z); grupos = {};
      pts.forEach(function (p, i) { var X = lx(p[0]) * n, Y = ly(p[1]) * n, k = Math.floor(X) + "/" + Math.floor(Y); (grupos[k] = grupos[k] || []).push({ i: i, fx: X - Math.floor(X), fy: Y - Math.floor(Y) }); });
      ks = Object.keys(grupos); if (ks.length > 6) return Promise.reject(new Error("área grande"));
    }
    var res = pts.map(function () { return null; });
    return Promise.all(ks.map(function (k) {
      var xy = k.split("/");
      return mosaico(col, z, +xy[0], +xy[1]).then(function (fs) {
        grupos[k].forEach(function (g) {
          var hit = null;
          fs.forEach(function (f) { if (hit || f.tipo !== 3) return; var e = f.ext || 4096; if (pipAneis([g.fx * e, g.fy * e], f.aneis)) hit = f.props || {}; });
          res[g.i] = hit;
        });
      });
    })).then(function () { return res; });
  }
  function consultaPonto(k, p) {
    var c = COL[k], r = featsRender(c.id, p.ll);
    if (r) return Promise.resolve({ dentro: !!r.length, props: r[0] || {}, via: "mapa" });
    return noMosaico(c.col, [p.ll]).then(function (rs) { return { dentro: !!rs[0], props: rs[0] || {}, via: "dgt" }; });
  }
  function consultaTerreno(k, tr) {
    var pts = amostras(tr.polys, 12);
    return noMosaico(COL[k].col, pts).then(function (rs) {
      var n = 0, cats = {};
      rs.forEach(function (x) { if (!x) return; n++; var s = textos(x)[0] || "?"; cats[s] = (cats[s] || 0) + 1; });
      var ord = Object.keys(cats).sort(function (a, b) { return cats[b] - cats[a]; }).map(function (s) { return { s: s, p: 100 * cats[s] / pts.length }; });
      return { pct: 100 * n / pts.length, n: pts.length, cats: ord };
    });
  }
  function frasePonto(k, r) {
    if (k === "pdm") {
      var tx = textos(r.props);
      return r.dentro && tx.length ? t("pdm_s", { x: "«" + tx.join(" · ") + "»" }) : t("pdm_n");
    }
    var s = t(k + (r.dentro ? "_s" : "_n")), tp = r.dentro ? textos(r.props) : [];
    return s + (tp.length ? " (" + t("tipologia", { x: "«" + tp[0] + "»" }) + ")" : "");
  }
  function fraseTerreno(k, r) {
    if (k === "pdm") {
      if (!r.cats.length) return t("pdm_n");
      return r.cats.slice(0, 3).map(function (c) { return t("pctArea", { p: nf(c.p, 0), x: "«" + c.s + "»" }); }).join("; ");
    }
    return t("pctArea", { p: nf(r.pct, 0), x: k.toUpperCase() }) + " (" + (EN() ? "sample of " : "amostra de ") + r.n + (EN() ? " points)" : " pontos)");
  }
  function condicionantes(ks, R, alvo, construir) {
    var tr = alvo === "terreno" ? terrenos()[0] : null;
    if (alvo === "terreno" && !tr) { R.txt(t("semTerreno")); return Promise.resolve(); }
    var p = tr ? null : ponto(); if (!tr && !p) { R.txt(t("semMapa")); return Promise.resolve(); }
    if (p) marcar(p.ll);
    if (construir) R.txt(t("construir"));
    var cab = tr ? t("terrenoDe", { n: tr.nome, a: nf(tr.ha, tr.ha < 10 ? 2 : 1) + " ha" }) : descPonto(p);
    R.espera();
    return Promise.all(ks.map(function (k) {
      return (tr ? consultaTerreno(k, tr) : consultaPonto(k, p)).then(function (r) { return { k: k, r: r }; }, function (e) { return { k: k, erro: e }; });
    })).then(function (rs) {
      R.fimEspera();
      var partes = rs.map(function (x) {
        if (x.erro) return (x.k === "pdm" ? "PDM" : x.k.toUpperCase()) + ": " + t("semFonte", { f: "DGT" });
        return tr ? fraseTerreno(x.k, x.r) : frasePonto(x.k, x.r);
      });
      R.txt(cab + ": " + partes.join("; ") + ".");
      R.fonte(rs.map(function (x) { return t(COL[x.k].fonte); }).join(". "));
      R.txt(t("info"));
      R.txt(t("pip"), "pip");
      if (!tr) R.accao(t("escolherPonto"), function () { escolherPonto(function () { condicionantes(ks, novaResposta(), "ponto", construir); }); });
    });
  }
  function escolherPonto(depois) {
    var a = W.__iprSemIdentificar;
    ESCOLHER = { antes: a, depois: depois }; W.__iprSemIdentificar = true;
    var R = novaResposta(); R.txt(t("toqueMapa"));
    setTimeout(function () { if (ESCOLHER && ESCOLHER.depois === depois) { ESCOLHER = null; W.__iprSemIdentificar = a; } }, 60000);
  }
  // Cota e declive (Mapterhorn, terrarium 512 px, como o IPRDiag e o intervencao.js)
  function cotaPonto(ll) {
    var z = 14, n = Math.pow(2, z), X = lx(ll[0]) * n, Y = ly(ll[1]) * n, tx = Math.floor(X), ty = Math.floor(Y);
    return obter("https://tiles.mapterhorn.com/" + z + "/" + tx + "/" + ty + ".webp", "blob", 15000).then(function (bl) { return W.createImageBitmap(bl); }).then(function (img) {
      var cv = D.createElement("canvas"); cv.width = img.width; cv.height = img.height;
      var c = cv.getContext("2d", { willReadFrequently: true }); c.drawImage(img, 0, 0);
      var s = img.width, px = Math.min(s - 3, Math.max(2, Math.floor((X - tx) * s))), py = Math.min(s - 3, Math.max(2, Math.floor((Y - ty) * s)));
      function el(x, y) { var d = c.getImageData(x, y, 1, 1).data; return d[0] * 256 + d[1] + d[2] / 256 - 32768; }
      var e0 = el(px, py), m = 40075016.686 * Math.cos(ll[1] * Math.PI / 180) / (n * s);
      var gx = (el(px + 2, py) - el(px - 2, py)) / (4 * m), gy = (el(px, py + 2) - el(px, py - 2)) / (4 * m);
      return { cota: e0, declive: 100 * Math.sqrt(gx * gx + gy * gy), res: m };
    });
  }
  function freguesia(ll) {
    var d = 0.00005, bb = [ll[0] - d, ll[1] - d, ll[0] + d, ll[1] + d].map(function (v) { return v.toFixed(6); }).join(",");
    // colecção nova «freguesias» (CAOP 2025): não passa pelos embrulhos de fetch que desviam «cont_freguesias» para o site.
    return obter("https://ogcapi.dgterritorio.gov.pt/collections/freguesias/items?f=json&limit=1&bbox=" + bb, "json", 15000).then(function (j) {
      var f = j && j.features && j.features[0], p = f && f.properties || {};
      return f ? { f: p.freguesia || p.nome || "", m: p.municipio || p.concelho || "" } : null;
    });
  }
  function identifyAgs(it, ll) {
    var m = mapa(); if (!m || !it.url || !FONTES_OK[hostDe(it.url)] || rota(it) !== "ok") return Promise.resolve(null);
    var b = m.getBounds(), cv = m.getCanvas(), ext = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].join(",");
    var u = it.url + "/identify?geometry=" + ll[0].toFixed(6) + "," + ll[1].toFixed(6) + "&geometryType=esriGeometryPoint&sr=4326&layers=" +
      encodeURIComponent(it.layers ? String(it.layers).replace(/^show:/, "visible:") : "visible") + "&tolerance=3&mapExtent=" + ext +
      "&imageDisplay=" + cv.clientWidth + "," + cv.clientHeight + ",96&returnGeometry=false&f=json";
    return obter(u, "json", 15000).then(function (j) {
      var r = (j && j.results || [])[0]; if (!r) return { it: it, vazio: true };
      var a = r.attributes || {}, tx = [];
      Object.keys(a).forEach(function (k) { var v = a[k]; if (tx.length < 2 && typeof v === "string" && v.trim() && !/^(null|shape|objectid|fid)$/i.test(k) && !/^(Polygon|Null)$/i.test(v) && v.length < 120) tx.push(v.trim()); });
      return { it: it, tx: tx.length ? tx : [r.value != null ? String(r.value) : r.layerName || ""] };
    }, function () { return { it: it, erro: true }; });
  }
  function oQueHaAqui(R) {
    var p = ponto(), m = mapa(); if (!p || !m) return Promise.resolve(R.txt(t("semMapa")));
    marcar(p.ll);
    R.txt(descPonto(p) + ".");
    R.espera();
    var act = activas().map(porId).filter(function (it) { return it && !it.fundo && it.g !== "fundo"; });
    var linhas = [], fontes = [];
    act.forEach(function (it) {
      if (!/^(mvt|omt|ovp|lidar|apa|ent|curvas)$/.test(it.t)) return;
      var r = featsRender(it.id, p.ll); if (!r || !r.length) return;
      var tx = textos(r[0]); linhas.push("«" + nomeCam(it) + "»" + (tx.length ? ": " + tx.join(" · ") : ""));
      if (it.fonte && fontes.indexOf(it.fonte) < 0) fontes.push(it.fonte);
    });
    var ags = act.filter(function (it) { return it.t === "ags" && (!it.minz || m.getZoom() >= it.minz); }).slice(0, 3);
    return Promise.all([
      freguesia(p.ll).catch(function () { return null; }),
      cotaPonto(p.ll).catch(function () { return null; }),
      Promise.all(ags.map(function (it) { return identifyAgs(it, p.ll); }))
    ]).then(function (rs) {
      R.fimEspera();
      var fr = rs[0], co = rs[1];
      if (fr && (fr.f || fr.m)) { R.txt(t("fregQ", { f: fr.f, m: fr.m })); fontes.push(t("fonteCaop")); }
      if (co && isFinite(co.cota) && co.cota > -100) { R.txt(t("cota", { x: nf(co.cota, 0) }) + " · " + t("declive", { x: nf(co.declive, 0) }) + "."); fontes.push(t("fonteCota")); }
      (rs[2] || []).forEach(function (x) {
        if (!x || x.vazio || x.erro || !x.tx || !x.tx[0]) return;
        linhas.push("«" + nomeCam(x.it) + "»: " + x.tx.join(" · ")); if (x.it.fonte && fontes.indexOf(x.it.fonte) < 0) fontes.push(x.it.fonte);
      });
      if (!act.length) R.txt(t("semCamadas"));
      else if (!linhas.length) R.txt(t("nadaAqui"));
      else R.lista(t("camadasAqui"), linhas);
      if (fontes.length) R.fonte(fontes.join(". "));
      if (act.some(function (it) { return /^(ren|ran|crus)$/.test(it.id); })) { R.txt(t("info")); R.txt(t("pip"), "pip"); }
      R.accao(t("escolherPonto"), function () { escolherPonto(function () { oQueHaAqui(novaResposta()); }); });
    });
  }
  function cotaAqui(R, so) {
    var p = ponto(); if (!p) return Promise.resolve(R.txt(t("semMapa")));
    marcar(p.ll); R.espera();
    return cotaPonto(p.ll).then(function (c) {
      R.fimEspera();
      var s = so === "declive" ? t("declive", { x: nf(c.declive, 0) }) : t("cota", { x: nf(c.cota, 0) }) + " · " + t("declive", { x: nf(c.declive, 0) });
      R.txt(descPonto(p) + ": " + s + " (" + (EN() ? "pixel of about " : "píxel de cerca de ") + nf(c.res, 0) + " m).");
      R.fonte(t("fonteCota"));
    }, function () { R.fimEspera(); R.txt(t("semFonte", { f: "Mapterhorn" })); });
  }
  var DIAG = {};
  function resumoTerreno(R) {
    var tr = terrenos()[0]; if (!tr) return Promise.resolve(R.txt(t("semTerreno")));
    if (!W.IPRDiag || typeof W.IPRDiag.calcular !== "function") return Promise.resolve(R.txt(t("semDiag")));
    enquadrar(tr);
    var k = JSON.stringify(caixa(tr.polys)) + tr.polys.length;
    var fc = { type: "FeatureCollection", features: tr.polys.map(function (pg) { return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: pg } }; }) };
    R.txt(t("resumoT", { n: tr.nome }) + ". " + t("area", { x: nf(tr.ha, tr.ha < 10 ? 2 : 1) }));
    R.espera();
    if (!DIAG[k]) DIAG[k] = W.IPRDiag.calcular(fc);
    return DIAG[k].then(function (d) {
      R.fimEspera();
      var c = d && d.condicionantes || {}, L = [];
      if (c.ren != null) L.push(t("r_ren", { x: nf(c.ren, 1) }));
      if (c.ran != null) L.push(t("r_ran", { x: nf(c.ran, 1) }));
      if (c.natura) L.push(t("r_nat", { x: nf(c.natura.pct, 1), s: c.natura.sitios && c.natura.sitios.length ? " (" + c.natura.sitios.slice(0, 2).join("; ") + ")" : "" }));
      if (d.agua) L.push(t("r_agua", { n: d.agua.linhas, c: nf(d.agua.comprimento, 0), o: d.agua.ordem || "–" }));
      if (d.fogo && d.fogo.predominante) L.push(t("r_fogo", { p: d.fogo.predominante.toLowerCase(), m: String(d.fogo.maxima || "").toLowerCase() }));
      if (d.solo && d.solo.grupos && d.solo.grupos.length) L.push(t("r_cos", { x: d.solo.grupos.slice(0, 3).map(function (g) { return g.l + " " + nf(g.p, 0) + " %"; }).join(", ") }));
      if (d.relevo && d.relevo.min != null) L.push(t("r_rel", { a: nf(d.relevo.min, 0), b: nf(d.relevo.max, 0), d: d.relevo.declive != null ? nf(d.relevo.declive, 1) : "–" }));
      if (L.length) R.lista("", L); else R.txt(t("semFonte", { f: "DGT, ICNF, APA" }));
      R.fonte(EN() ? "IPR Atlas IPRDiag: DGT (SRUP, COS 2023), ICNF (Natura 2000, hazard), APA (river network), Mapterhorn (relief)" : "IPRDiag do IPR Atlas: DGT (SRUP, COS 2023), ICNF (Rede Natura 2000, perigosidade), APA (rede hidrográfica), Mapterhorn (relevo)");
      R.txt(t("info")); R.txt(t("pip"), "pip");
    }, function () { R.fimEspera(); delete DIAG[k]; R.txt(t("semFonte", { f: "DGT, ICNF, APA" })); });
  }

  // ───────────────────────────── navegação, terreno, simulador, compra ─────────────────────────────
  function irPara(alvo, R) {
    var f = D.getElementById("ipe-busca"), q = D.getElementById("ipe-q"), m = mapa();
    if (!f || !q) return R.txt(t("semPesquisa"));
    var c0 = m ? m.getCenter() : null, coord = /^-?\d{1,2}([.,]\d+)?\s*[,; ]\s*-?\d{1,3}([.,]\d+)?$/.test(alvo.trim());
    var res = D.getElementById("ipe-qres"); if (res && !coord) res.innerHTML = "";
    q.value = alvo;
    try { if (f.requestSubmit) f.requestSubmit(); else f.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true })); } catch (e) {}
    R.txt(t("ir", { x: alvo }));
    R.espera();
    var t0 = Date.now();
    (function ver() {
      var r = coord ? null : D.getElementById("ipe-qres"), lis = r ? r.querySelectorAll("li") : [], b = lis[0] && lis[0].querySelector("b");
      var mexeu = m && c0 && (Math.abs(m.getCenter().lng - c0.lng) > 1e-6 || Math.abs(m.getCenter().lat - c0.lat) > 1e-6);
      if (b) { R.fimEspera(); R.txt(t("fui", { x: b.textContent })); if (lis.length > 1) R.txt(t("outros")); return; }
      if (lis[0] && /ipe-qres-v/.test(lis[0].className)) { R.fimEspera(); return R.txt(t("naoFui", { x: alvo })); }
      if (mexeu && Date.now() - t0 > 1200) { R.fimEspera(); return R.txt(coord ? t("fuiCoord", { x: alvo }) : t("fui", { x: alvo })); }
      if (Date.now() - t0 > 9000) { R.fimEspera(); return R.txt(mexeu ? t("fui", { x: alvo }) : t("naoFui", { x: alvo })); }
      setTimeout(ver, 300);
    })();
  }
  function enquadrarTerreno(R) {
    var ts = terrenos();
    if (!ts.length) return R.txt(t("semTerreno"));
    if (ts.length > 1 && ts[0].tipo === "guardado") {
      R.txt(t("qualTerreno"));
      ts.slice(0, 6).forEach(function (tr) { R.accao(tr.nome + txtHa(tr.ha), function () { enquadrar(tr); novaResposta().txt(t("enquadrei", { n: tr.nome, a: txtHa(tr.ha) })); }); });
      return;
    }
    enquadrar(ts[0]); R.txt(t("enquadrei", { n: ts[0].nome, a: txtHa(ts[0].ha) }));
  }
  function abrirBase(R) {
    var P = est();
    if (P && P.modo === "cliente" && P.actual) { var tr = terrenos()[0]; if (tr) enquadrar(tr); return R.txt(t("baseAberta", { n: nomeTerreno(P.actual) })); }
    var ms = P && Array.isArray(P.mapas) ? P.mapas : [];
    if (!ms.length) return R.txt(t("semBases"));
    // Abre pelo mesmo caminho do toque no cartão (como o projectos-abrir.js), só depois de a pessoa escolher. Nunca recarrega a página.
    R.txt(t("qualBase"));
    ms.slice(0, 6).forEach(function (m, i) {
      R.accao(t("abrirBase", { n: nomeTerreno(m) }), function () {
        var c = D.querySelector('#ipe-proj .ipe-card[data-i="' + i + '"]'), alvo = c && (c.querySelector(".ipe-thumb") || c.querySelector(".ipe-ct strong"));
        if (alvo) alvo.click(); else novaResposta().txt(t("baseNaoAbre"));
      });
    });
  }
  function mmDe(q) {
    var m = q.match(/(\d+(?:[.,]\d+)?(?:\s*(?:,|e|and|\/)\s*\d+(?:[.,]\d+)?)*)\s*(mm|milimetros?|millimet(er|re)s?)\b/);
    if (!m) { var m2 = q.match(/\b(\d{1,3})\b/); return m2 ? [+m2[1]] : []; }
    return m[1].split(/\s*(?:,(?!\d)|\be\b|\band\b|\/)\s*|\s+/).map(function (x) { return parseFloat(x.replace(",", ".")); }).filter(function (x) { return x > 0; });
  }
  function simularAgua(q, R) {
    var vs = mmDe(q).slice(0, 5);
    if (!vs.length) return R.txt(t("simMm"));
    if (vs.some(function (v) { return v < 1 || v > 500; })) return R.txt(t("simLimite"));
    var x = vs.map(function (v) { return nf(v, 1); }).join(", ");
    var S = W.IPR_AGUA_SIM;
    if (!S || typeof S.abrir !== "function") return R.txt(t("simIndisp"));
    R.txt(t("sim", { x: x }));
    R.txt(t("simConf"));
    R.accao(t("simAbrir", { x: x }), function () {
      var st = S._estado || null, txt = vs.join(", ");
      try { if (st) { st.tab = "ret"; st.cenarios = txt; } } catch (e) {}
      try { S.abrir(); } catch (e) {}
      try { if (W.IPR_SIM_ASSISTENTE && typeof W.IPR_SIM_ASSISTENTE.painel === "function") W.IPR_SIM_ASSISTENTE.painel("agua"); } catch (e) {}
      setTimeout(function () {
        try { if (W.IPR_SIM_ASSISTENTE && typeof W.IPR_SIM_ASSISTENTE.painel === "function") W.IPR_SIM_ASSISTENTE.painel("agua"); } catch (e) {}
        var P = D.getElementById("ipr-as"); if (!P) return;
        var tab = P.querySelector('[data-tab="ret"]'); if (tab && tab.getAttribute("aria-selected") !== "true") tab.click();
        setTimeout(function () {
          var inp = P.querySelector('input[data-k="cenarios"]');
          if (inp && inp.value !== txt) { inp.value = txt; try { inp.dispatchEvent(new Event("input", { bubbles: true })); inp.dispatchEvent(new Event("change", { bubbles: true })); } catch (e) {} }
          var b = P.querySelector('[data-as="simular"]');
          if (b) { b.classList.add("ipr-pa-realce"); setTimeout(function () { b.classList.remove("ipr-pa-realce"); }, 6000); try { b.scrollIntoView({ block: "nearest" }); } catch (e) {} }
          novaResposta().txt(t("simPronto", { x: x }));
        }, 120);
      }, 250);
    }, true);
    R.accao(t("cancelar"), function () {});
  }
  function comprar(q, R) {
    var k = /planta|location plan/.test(q) ? "planta" : /leitura|reading|report/.test(q) ? "leitura" : /\bbase\b|base map|cartograf/.test(q) ? "base" : "";
    try {
      if (k && typeof W.iprAssistenteComprar === "function") { W.iprAssistenteComprar(k); return R.txt(t("comprar")); }
      if (typeof W.__iprAssistenteAbrir === "function") { W.__iprAssistenteAbrir(k || undefined); return R.txt(t("comprar")); }
    } catch (e) {}
    R.txt(t("semComprar"));
  }
  function carregarFerr(sel) { var b = D.querySelector(sel); if (b && !b.disabled) { b.click(); return true; } return false; }

  // ───────────────────────────── perceber o pedido ─────────────────────────────
  var V_LIGAR = /\b(liga|ligar|ligue|mostra|mostrar|mostre|ver|veja|activa|ativa|activar|ativar|acende|poe|por|ponha|adiciona|show|display|turn on|switch on|enable|add|open)\b/;
  var V_DESL = /\b(desliga|desligar|desligue|esconde|esconder|tira|tirar|retira|oculta|ocultar|remove|remover|apaga|hide|turn off|switch off|disable)\b/;
  var V_IR = /^(vai|va|ir|leva-me|leva me|levar|mostra-me onde fica|onde fica|procura|procurar|encontra|centra|centrar|go|take me|fly|find|zoom to|navigate|where is)\b\s*(para|ate|a|ao|aos|as|em|to|at)?\s*/;
  var PERG = /\b(tem|ha|existe|existem|esta|estao|fica|qual|quais|que|quanto|is|are|does|what|which|how|any)\b/;
  function intencao(txt) {
    var q = norm(txt);
    if (!q) return null;
    if (/^(ajuda|help|socorro|\?|exemplos?|examples?)$|o que (posso|consigo|sabes|sabe) (perguntar|fazer|dizer)|what can (i|you) (ask|do|say)|^como funciona|^how does (this|it) work/.test(q)) return { tipo: "ajuda" };
    if (/\b(comprar|compra|encomendar|encomenda|quero (uma|a|o) (planta|base|leitura)|buy|order|purchase)\b/.test(q)) return { tipo: "comprar", q: q };
    if (/\b(simula|simular|simule|simulacao|simulate|simulation)\b/.test(q)) return /\b(fogo|incendio|fire)\b/.test(q) ? { tipo: "simfogo" } : { tipo: "simagua", q: q };
    if (/\b\d+([.,]\d+)?\s*(mm|milimetros?)\b.*\b(chuva|chover|rain)\b|\b(chuva|chover|rain)\b.*\b\d+([.,]\d+)?\s*(mm|milimetros?)\b/.test(q)) return { tipo: "simagua", q: q };
    if (/(que|quais|what|which) (camadas|layers).*(ligad|activ|ativ|on\b)|camadas (ligadas|activas|ativas)|layers (on|active)/.test(q)) return { tipo: "activas" };
    if (/\b(desliga|apaga|limpa|tira|clear|turn off|remove)\b.*\b(tudo|todas|todos|o mapa|everything|all|the map)\b|^limpar( o)? mapa$/.test(q)) return { tipo: "limpar" };
    if (/posso construir|pode(-se)? construir|se pode construir|da para construir|can (i|we|you) build|is (it )?buildable|construcao|licenca de construcao/.test(q)) return { tipo: "condic", construir: true, ks: ["pdm", "ren", "ran"], alvo: /terreno|propriedade|parcela|land|plot|property/.test(q) ? "terreno" : "ponto" };
    var terr = /\b(meu|minha|este|esta|nesse|neste|desta|deste|o|my|this|the) (terreno|propriedade|parcela|herdade|monte|quinta|land|plot|property)\b|\bmy land\b/.test(q);
    if (/\b(resumo|diagnostico|ficha|resume|summary|summarise|summarize|overview)\b/.test(q) && (terr || /terreno|land|plot/.test(q))) return { tipo: "resumo" };
    if (/(abre|abrir|abra|open|carrega|load)\b.*\b(minha|meu|my)?\s*(base|mapa|projecto|projeto|base map|project)\b/.test(q) && !V_DESL.test(q)) return { tipo: "abrirbase" };
    if (/(enquadra|enquadrar|enquadre|zoom|centra|centrar|mostra|mostrar|vai|ir|frame|fit|show|go)\b.*\b(terreno|propriedade|parcela|land|plot|property|base)\b/.test(q) && !PERG.test(q.replace(/^(mostra|show)\b/, ""))) return { tipo: "enquadrar" };
    var ss = sinonimos(q), s = ss[0] || null;
    var pergunta = PERG.test(q) && !V_LIGAR.test(q.split(" ")[0]) && !V_DESL.test(q.split(" ")[0]);
    var kc = ss.filter(function (x) { return /^(ren|ran|pdm)$/.test(x.k); }).map(function (x) { return x.k; });
    if (pergunta && kc.length) return { tipo: "condic", ks: kc, alvo: terr ? "terreno" : "ponto" };
    if (pergunta && /\b(cota|altitude|altura|elevac|elevation|height)\b/.test(q)) return { tipo: "cota" };
    if (pergunta && /\b(declive|inclinac|slope)\b/.test(q)) return terr ? { tipo: "resumo" } : { tipo: "declive" };
    if (/(o que|que coisa|what)( e que)? (ha|existe|is|esta|e isto|is this)( aqui| here| neste ponto| at this point| ai)?|^aqui$|^o que e isto|what('s| is) here|^(e )?isto e o que/.test(q)) return { tipo: "aqui" };
    if (/\b(onde estou|a minha localizacao|minha posicao|my location|where am i|gps)\b/.test(q)) return { tipo: "gps" };
    if (/\b(aproxima|aproximar|mais perto|zoom in|closer)\b/.test(q)) return { tipo: "zoom", d: 1 };
    if (/\b(afasta|afastar|mais longe|zoom out|further)\b/.test(q)) return { tipo: "zoom", d: -1 };
    if (/\b3d\b|tres dimensoes|three d/.test(q)) return { tipo: "3d" };
    if (/\b(norte para cima|orienta a norte|north up|reset north)\b/.test(q)) return { tipo: "norte" };
    var nic = txt.match(/\b[A-Za-z]{3}[\s.\-]?\d{3}[\s.\-]?\d{3}[\s.\-]?\d{3}\b/);
    var crd = txt.match(/-?\d{1,2}[.,]\d+\s*[,; ]\s*-?\d{1,3}[.,]\d+/) || txt.match(/\d{1,2}\s*[°º]\s*\d{1,2}\s*['′]?[^a-z]{0,30}[NS][^a-z]{0,10}\d{1,3}\s*[°º][^a-z]{0,20}[EWO]/i);
    if (crd) return { tipo: "ir", alvo: crd[0].replace(/\s*;\s*/, ", ") };
    if (nic) return { tipo: "ir", alvo: nic[0] };
    var desl = V_DESL.test(q), lig = V_LIGAR.test(q), mi = q.match(V_IR);
    if (mi && !lig && !desl) { var resto = txt.trim().replace(/^\S+(\s+(-me|me))?\s+/i, "").replace(/^(para|até|ate|a|ao|à|aos|às|em|to|at)\s+/i, "").replace(/[?!.]+$/, "").trim(); if (resto.length >= 2) return { tipo: "ir", alvo: resto }; }
    if (s && (desl || lig || q.split(" ").length <= 4)) return { tipo: "camada", ss: ss, on: !desl };
    if (desl || lig) {
      var frase = txt.replace(/^\s*\S+\s*/, "").replace(/^(onde fica|onde é|onde e|where is)\s+/i, "").replace(/[?!.]+$/, "");
      var cs = procurarNome(frase);
      if (cs.length) return { tipo: "camadaNome", cs: cs, on: !desl, frase: frase };
      if (lig && /^(mostra|mostrar|show)\b/.test(q) && frase.trim().length >= 3) return { tipo: "ir", alvo: frase.trim() };
      return { tipo: "naoPercebi", visto: (desl ? (EN() ? "turn off" : "desligar") : (EN() ? "turn on" : "ligar")) + " «" + frase.trim() + "»", semCam: frase.trim() };
    }
    if (s) return { tipo: "camada", ss: ss, on: true };
    var cs2 = procurarNome(txt);
    if (cs2.length === 1) return { tipo: "camadaNome", cs: cs2, on: true, frase: txt };
    return { tipo: "naoPercebi", visto: "" };
  }
  function parecidos(txt) {
    var a = norm(txt).split(" ").filter(function (x) { return x.length > 2; });
    var ex = t("ex").map(function (e) { var b = norm(e).split(" "), n = 0; a.forEach(function (x) { if (b.some(function (y) { return y.indexOf(x) === 0 || x.indexOf(y) === 0 && y.length > 2; })) n++; }); return { e: e, n: n }; });
    ex.sort(function (x, y) { return y.n - x.n; });
    var out = ex.filter(function (x) { return x.n > 0; }).slice(0, 3).map(function (x) { return x.e; });
    t("ex").forEach(function (e) { if (out.length < 3 && out.indexOf(e) < 0) out.push(e); });
    return out.slice(0, 3);
  }
  var OCUPADO = false;
  function responder(txt) {
    txt = String(txt || "").trim().slice(0, 300); if (!txt) return;
    abrirPainel(true);
    var R = novaResposta(txt);
    if (OCUPADO) return R.txt(t("ocupado"));
    ligarMapa();
    var it = intencao(txt), pr = null;
    try {
      switch (it && it.tipo) {
        case "ajuda": R.lista(t("ajudaT"), t("ex"), true); break;
        case "comprar": comprar(it.q, R); break;
        case "simagua": simularAgua(it.q, R); break;
        case "simfogo": R.txt(t("simFogo")); break;
        case "activas": {
          var a = activas().map(porId).filter(function (x) { return x && !x.fundo; });
          R.txt(a.length ? t("activas", { n: a.length, x: a.map(function (x) { return "«" + nomeCam(x) + "»"; }).join(", ") }) : t("nenhumaActiva"));
          break;
        }
        case "limpar": {
          var P = est(), lista = activas().map(porId).filter(function (x) { return x && !x.fundo && x.g !== "fundo" && !(x.t === "lidar" && P && P.modo === "cliente") && x.t !== "aoi"; });
          if (!lista.length) { R.txt(t("nenhumaActiva")); break; }
          R.txt(t("limparQ", { n: lista.length }));
          R.accao(t("limpar"), function () { var v = viz(); lista.forEach(function (x) { try { v.ligar(x.id, false); } catch (e) {} }); novaResposta().txt(t("limpo", { n: lista.length })); }, true);
          R.accao(t("cancelar"), function () {});
          break;
        }
        case "condic": pr = condicionantes(it.ks, R, it.alvo, it.construir); break;
        case "resumo": pr = resumoTerreno(R); break;
        case "cota": pr = cotaAqui(R); break;
        case "declive": pr = cotaAqui(R, "declive"); break;
        case "aqui": pr = oQueHaAqui(R); break;
        case "enquadrar": enquadrarTerreno(R); break;
        case "abrirbase": abrirBase(R); break;
        case "ir": irPara(it.alvo, R); break;
        case "gps": R.txt(carregarFerr('[data-tool="gps"]') || carregarFerr("#ipe-gpsq") ? t("gps") : t("semMapa")); break;
        case "zoom": { var m = mapa(); if (!m) { R.txt(t("semMapa")); break; } m.easeTo({ zoom: m.getZoom() + it.d * 1.5, duration: 500 }); R.txt(t(it.d > 0 ? "zoomIn" : "zoomOut")); break; }
        case "3d": R.txt(carregarFerr('[data-tool="3d"]') ? t("tresD") : t("semMapa")); break;
        case "norte": { var m2 = mapa(); if (m2) { m2.easeTo({ bearing: 0, pitch: 0, duration: 500 }); R.txt(t("norte")); } else R.txt(t("semMapa")); break; }
        case "camada":
          it.ss.slice(0, 4).forEach(function (s1) {
            var c = escolherDoSin(s1);
            if (!c) { R.txt(t("nenhumaCam", { x: txt })); return; }
            if (it.on && s1.base && c.t === "lidar" && rota(c) === "semdados") {
              R.txt(t("baseSo", { x: "«" + nomeCam(c) + "»" }));
              R.accao(t("declAqui"), function () { cotaAqui(novaResposta(), "declive"); });
              return;
            }
            ligarCamada(c, it.on, R);
          });
          break;
        case "camadaNome":
          if (it.cs.length === 1) { ligarCamada(it.cs[0], it.on, R); break; }
          R.txt(t("varias"));
          it.cs.forEach(function (c2) { R.accao(nomeCam(c2) + (c2.sub ? " · " + c2.sub : ""), function () { ligarCamada(c2, it.on, novaResposta()); }); });
          break;
        default: {
          R.txt(t("naoPercebi") + (it && it.visto ? " " + t("percebi", { x: it.visto }) : ""));
          if (it && it.semCam) R.txt(t("nenhumaCam", { x: it.semCam }));
          R.lista(t("proximos"), parecidos(txt), true);
        }
      }
    } catch (e) { R.txt(t("naoPercebi")); }
    if (pr && pr.then) { OCUPADO = true; var fim = function () { OCUPADO = false; }; pr.then(fim, fim); }
  }
  API.intencao = intencao; API.responder = function (s) { responder(s); };

  // ───────────────────────────── voz ─────────────────────────────
  // 04/11/2026 (Nuno): sem leitura em voz alta e sem microfone, que não activava; só texto.
  var SR = null, REC = null, A_OUVIR = false;
  function lerVoz() { try { return W.localStorage.getItem("ipr_pergunte_voz") === "1"; } catch (e) { return false; } }
  function falar(s) {
    return;
    if (!lerVoz() || !W.speechSynthesis || !W.SpeechSynthesisUtterance || !s) return;
    try {
      W.speechSynthesis.cancel();
      var u = new W.SpeechSynthesisUtterance(s), lg = EN() ? "en-GB" : "pt-PT";
      u.lang = lg;
      var vs = W.speechSynthesis.getVoices() || [], v = vs.filter(function (x) { return x.lang === lg; })[0] || vs.filter(function (x) { return x.lang && x.lang.indexOf(lg.slice(0, 2)) === 0; })[0];
      if (v) u.voice = v;
      W.speechSynthesis.speak(u);
    } catch (e) {}
  }
  function ouvir() {
    if (!SR) return;
    if (A_OUVIR && REC) { try { REC.stop(); } catch (e) {} return; }
    try {
      REC = new SR(); REC.lang = EN() ? "en-GB" : "pt-PT"; REC.interimResults = true; REC.maxAlternatives = 1; REC.continuous = false;
      var q = D.getElementById("ipr-pa-q"), fin = "";
      REC.onstart = function () { A_OUVIR = true; estadoMic(); estado(t("ouvir")); };
      REC.onresult = function (e) {
        var tx = ""; fin = "";
        for (var i = 0; i < e.results.length; i++) { tx += e.results[i][0].transcript; if (e.results[i].isFinal) fin += e.results[i][0].transcript; }
        if (q) q.value = tx;
      };
      REC.onerror = function (e) {
        var er = e && e.error;
        estado(er === "not-allowed" || er === "service-not-allowed" ? t("vozErro") : er === "no-speech" ? t("vozNada") : er === "network" ? t("vozRede") : "");
      };
      REC.onend = function () { A_OUVIR = false; estadoMic(); if (fin.trim()) { estado(""); responder(fin.trim()); if (q) q.value = ""; } };
      REC.start();
    } catch (e) { A_OUVIR = false; estadoMic(); estado(t("vozErro")); }
  }

  // ───────────────────────────── interface ─────────────────────────────
  var F1 = "Inter,system-ui,sans-serif", F2 = "Outfit,Inter,sans-serif", F3 = "'IBM Plex Mono',ui-monospace,monospace";
  function css() {
    if (D.getElementById("ipr-pa-css")) return;
    var s = D.createElement("style"); s.id = "ipr-pa-css";
    s.textContent =
      "#ipr-pa-raiz{position:absolute;z-index:42;top:12px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none;max-width:calc(100% - 24px);letter-spacing:normal;text-transform:none;word-spacing:normal}" +
      "#ipr-pa-raiz>*{pointer-events:auto}" +
      "#ipe.ipr-as-on #ipr-pa-raiz,body:has(#ipr-as-pn) #ipr-pa-raiz{display:none!important}" +
      "#ipr-pa-raiz *{letter-spacing:inherit}" +
      "@media (max-width:900px){#ipe.esq-aberto #ipr-pa-raiz:not(.aberto){display:none}}" +
      "#ipr-pa-b{all:unset;pointer-events:auto;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;gap:8px;min-height:36px;padding:6px 14px 6px 8px;border:1px solid #2E3A26;border-radius:2px;background:rgba(15,23,11,.94);color:#E4E2D8;font:600 13px/1.2 " + F2 + ";box-shadow:0 6px 20px rgba(0,0,0,.35);white-space:nowrap}" +
      "#ipr-pa-b .ic{display:grid;place-items:center;width:24px;height:24px;border-radius:2px;background:#94BE39;color:#0F170B;flex:none}" +
      "#ipr-pa-b:hover,#ipr-pa-b[aria-expanded=true]{border-color:#94BE39;background:#1B2816}" +
      "#ipr-pa-b:focus-visible,#ipr-pa button:focus-visible,#ipr-pa input:focus-visible{outline:2px solid #94BE39;outline-offset:2px}" +
      "#ipr-pa{box-sizing:border-box;width:400px;max-width:100%;max-height:min(70vh,560px);display:flex;flex-direction:column;background:rgba(15,23,11,.97);color:#E4E2D8;border:1px solid #2E3A26;border-radius:2px;box-shadow:0 18px 50px rgba(0,0,0,.5);font:13px/1.45 " + F1 + ";overflow:hidden}" +
      "#ipr-pa[hidden]{display:none}#ipr-pa *{box-sizing:border-box}" +
      "#ipr-pa .cab{display:flex;align-items:center;gap:8px;padding:9px 8px 9px 12px;border-bottom:1px solid #2E3A26;background:#14200F}" +
      "#ipr-pa .cab h2{flex:1;margin:0;font:600 12px/1.3 " + F3 + ";text-transform:uppercase;letter-spacing:.08em;color:#9AA088}" +
      "#ipr-pa .x{all:unset;cursor:pointer;display:grid;place-items:center;width:32px;height:32px;border-radius:2px;color:#9AA088;font:500 18px/1 " + F1 + "}#ipr-pa .x:hover{color:#E4E2D8;background:#1B2816}" +
      "#ipr-pa form{display:flex;gap:6px;padding:10px 10px 6px}" +
      "#ipr-pa input[type=text]{flex:1;min-width:0;font:15px/1.3 " + F1 + ";color:#E4E2D8;background:#0F170B;border:1px solid #2E3A26;border-radius:2px;padding:9px 10px}#ipr-pa input[type=text]:focus{outline:none;border-color:#94BE39}" +
      "#ipr-pa .mic,#ipr-pa .env{all:unset;box-sizing:border-box;cursor:pointer;display:grid;place-items:center;min-width:40px;height:40px;border-radius:2px;border:1px solid #2E3A26;background:#14200F;color:#E4E2D8}" +
      "#ipr-pa .env{background:#94BE39;color:#0F170B;border-color:#94BE39;padding:0 12px;font:600 13px/1 " + F1 + "}#ipr-pa .env:hover{background:#A6CC4E}" +
      "#ipr-pa .mic[aria-pressed=true]{background:#94BE39;color:#0F170B;border-color:#94BE39;animation:iprPaM 1.2s ease-in-out infinite}@keyframes iprPaM{50%{box-shadow:0 0 0 6px rgba(148,190,57,.25)}}" +
      "#ipr-pa .est{min-height:0;padding:0 12px;color:#B8A83A;font:500 12px/1.4 " + F3 + "}#ipr-pa .est:empty{display:none}" +
      "#ipr-pa .log{flex:1;overflow:auto;padding:4px 12px 8px;display:flex;flex-direction:column;gap:10px}" +
      "#ipr-pa .q{align-self:flex-end;max-width:90%;padding:6px 10px;border-radius:2px;background:#1B2816;border:1px solid #2E3A26;color:#E4E2D8}" +
      "#ipr-pa .r{border-left:3px solid #94BE39;padding:2px 0 2px 10px}#ipr-pa .r p{margin:0 0 6px}#ipr-pa .r p.pip{color:#E4E2D8;font-weight:600}" +
      "#ipr-pa .r .fonte{margin:0 0 6px;color:#9AA088;font-size:12px}#ipr-pa .r .fonte b{font:500 11px " + F3 + ";text-transform:uppercase;letter-spacing:.05em;color:#64703F;margin-right:4px}" +
      "#ipr-pa .r ul{margin:0 0 6px;padding-left:18px}#ipr-pa .r li{margin:0 0 3px}" +
      "#ipr-pa .acc{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 2px}" +
      "#ipr-pa .acc button,#ipr-pa .ex button{all:unset;box-sizing:border-box;cursor:pointer;padding:6px 10px;min-height:32px;border:1px solid #2E3A26;border-radius:2px;background:#14200F;color:#E4E2D8;font:500 12.5px/1.3 " + F1 + "}" +
      "#ipr-pa .acc button.pri{background:#94BE39;color:#0F170B;border-color:#94BE39}#ipr-pa .acc button:hover,#ipr-pa .ex button:hover{border-color:#94BE39}" +
      "#ipr-pa .ex{display:flex;flex-wrap:wrap;gap:6px;margin:2px 0 6px;padding:0;list-style:none}" +
      "#ipr-pa .esp{display:inline-flex;align-items:center;gap:8px;color:#9AA088;font-size:12.5px}#ipr-pa .esp i{width:9px;height:9px;border-radius:50%;background:#94BE39;animation:iprPaR 1.2s ease-in-out infinite}@keyframes iprPaR{0%,100%{opacity:.25}50%{opacity:1}}" +
      "#ipr-pa .pe{display:flex;flex-direction:column;gap:4px;padding:8px 12px 10px;border-top:1px solid #2E3A26;color:#9AA088;font-size:11.5px}" +
      "#ipr-pa .pe label{display:flex;align-items:center;gap:8px;color:#E4E2D8;font-size:12.5px;cursor:pointer}#ipr-pa .pe input{accent-color:#94BE39;margin:0}" +
      ".ipr-pa-sr{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
      ".ipr-pa-marca{width:18px;height:18px;border-radius:50%;border:3px solid #94BE39;background:rgba(15,23,11,.55);box-shadow:0 0 0 2px rgba(15,23,11,.8)}" +
      ".ipr-pa-realce{outline:3px solid #94BE39!important;outline-offset:2px;animation:iprPaM 1.2s ease-in-out 4}" +
      "@media (max-width:600px){#ipr-pa-raiz{top:8px;left:12px;right:12px;transform:none;max-width:none}#ipr-pa{width:100%;max-height:calc(100vh - 220px)}#ipr-pa-b{padding:5px 10px 5px 6px;font-size:12.5px}}" +
      "@media (prefers-reduced-motion:reduce){#ipr-pa *,#ipr-pa-b{animation:none!important}}";
    D.head.appendChild(s);
  }
  var IC_MIC = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
  var IC_Q = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>';
  var RAIZ = null, PN = null, BT = null, LOG = null;
  function el(tag, cls, txt) { var e = D.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function construir() {
    var host = D.getElementById("ipe-mapa"); if (!host) return false;
    css();
    if (RAIZ && RAIZ.parentNode === host) return true;
    if (!RAIZ) {
      RAIZ = el("div"); RAIZ.id = "ipr-pa-raiz";
      BT = el("button"); BT.type = "button"; BT.id = "ipr-pa-b"; BT.setAttribute("aria-expanded", "false"); BT.setAttribute("aria-controls", "ipr-pa");
      BT.innerHTML = '<span class="ic">' + (SR ? IC_MIC : IC_Q) + "</span><span></span>";
      BT.addEventListener("click", function () { abrirPainel(PN.hidden); });
      PN = el("div"); PN.id = "ipr-pa"; PN.hidden = true; PN.setAttribute("role", "dialog"); PN.setAttribute("aria-modal", "false"); PN.setAttribute("aria-labelledby", "ipr-pa-t");
      var cab = el("div", "cab"), h = el("h2"); h.id = "ipr-pa-t"; cab.appendChild(h);
      var x = el("button", "x", "×"); x.type = "button"; x.setAttribute("data-pa", "fechar"); x.addEventListener("click", function () { abrirPainel(false); }); cab.appendChild(x);
      var f = el("form"); f.setAttribute("role", "search");
      var lb = el("label", "ipr-pa-sr"); lb.setAttribute("for", "ipr-pa-q");
      var q = el("input"); q.type = "text"; q.id = "ipr-pa-q"; q.autocomplete = "off"; q.setAttribute("enterkeyhint", "send"); q.setAttribute("autocapitalize", "sentences"); q.maxLength = 300;
      f.appendChild(lb); f.appendChild(q);
      if (SR) { var mic = el("button", "mic"); mic.type = "button"; mic.id = "ipr-pa-mic"; mic.innerHTML = IC_MIC; mic.setAttribute("aria-pressed", "false"); mic.addEventListener("click", ouvir); f.appendChild(mic); }
      var env = el("button", "env"); env.type = "submit"; f.appendChild(env);
      f.addEventListener("submit", function (e) { e.preventDefault(); e.stopPropagation(); var v = q.value; q.value = ""; responder(v); });
      var es = el("div", "est"); es.id = "ipr-pa-est"; es.setAttribute("role", "status"); es.setAttribute("aria-live", "polite");
      LOG = el("div", "log"); LOG.setAttribute("role", "log"); LOG.setAttribute("aria-live", "polite"); LOG.setAttribute("aria-relevant", "additions");
      var pe = el("div", "pe"), lv = el("label"), ck = el("input"); ck.type = "checkbox"; ck.id = "ipr-pa-voz"; ck.checked = lerVoz();
      ck.addEventListener("change", function () { try { W.localStorage.setItem("ipr_pergunte_voz", ck.checked ? "1" : "0"); } catch (e) {} if (!ck.checked && W.speechSynthesis) try { W.speechSynthesis.cancel(); } catch (e) {} });
      lv.appendChild(ck); lv.appendChild(el("span")); /* leitura em voz alta retirada (04/11/2026) */
      pe.appendChild(el("span", "nota"));
      PN.appendChild(cab); PN.appendChild(f); PN.appendChild(es); PN.appendChild(LOG); PN.appendChild(pe);
      RAIZ.addEventListener("keydown", function (e) { if (e.key === "Escape" && !PN.hidden) { e.preventDefault(); e.stopPropagation(); abrirPainel(false); } });
      RAIZ.appendChild(BT); RAIZ.appendChild(PN);
      // Os toques dentro do painel não chegam ao mapa
      ["pointerdown", "mousedown", "touchstart", "wheel", "dblclick"].forEach(function (ev) { RAIZ.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
    }
    host.appendChild(RAIZ);
    textosUI();
    return true;
  }
  function textosUI() {
    if (!RAIZ) return;
    BT.lastChild.textContent = t("botao"); BT.setAttribute("aria-label", t("botao"));
    D.getElementById("ipr-pa-t").textContent = t("titulo");
    var x = PN.querySelector(".x"); x.setAttribute("aria-label", t("fechar")); x.title = t("fechar");
    PN.querySelector("label.ipr-pa-sr").textContent = t("caixaRot");
    var q = D.getElementById("ipr-pa-q"); q.placeholder = t("caixa"); q.setAttribute("lang", EN() ? "en-GB" : "pt-PT");
    PN.querySelector(".env").textContent = t("enviar");
    var mic = D.getElementById("ipr-pa-mic"); if (mic) { mic.setAttribute("aria-label", A_OUVIR ? t("parar") : t("falar")); mic.title = mic.getAttribute("aria-label"); }
    var lv = PN.querySelector(".pe label span"); if (lv) lv.textContent = t("lerVoz");
    PN.querySelector(".pe .nota").textContent = t("nota");
    PN.setAttribute("lang", EN() ? "en-GB" : "pt-PT");
  }
  function estadoMic() { var mic = D.getElementById("ipr-pa-mic"); if (!mic) return; mic.setAttribute("aria-pressed", A_OUVIR ? "true" : "false"); mic.setAttribute("aria-label", A_OUVIR ? t("parar") : t("falar")); mic.title = mic.getAttribute("aria-label"); if (!A_OUVIR) estado(""); }
  function estado(s) { var e = D.getElementById("ipr-pa-est"); if (e) e.textContent = s || ""; }
  var PRIMEIRA = true;
  function abrirPainel(on) {
    if (!construir()) return;
    PN.hidden = !on; BT.setAttribute("aria-expanded", on ? "true" : "false"); RAIZ.classList.toggle("aberto", !!on);
    if (on) {
      if (PRIMEIRA) { PRIMEIRA = false; if (!LOG.childNodes.length) { var r = novaResposta(); r.lista(t("ajudaT"), t("ex").slice(0, 6), true); } }
      setTimeout(function () { var q = D.getElementById("ipr-pa-q"); if (q && W.innerWidth > 600) try { q.focus({ preventScroll: true }); } catch (e) {} }, 30);
    } else {
      if (A_OUVIR && REC) try { REC.stop(); } catch (e) {}
      if (ESCOLHER) { W.__iprSemIdentificar = ESCOLHER.antes; ESCOLHER = null; }
      try { BT.focus({ preventScroll: true }); } catch (e) {}
    }
  }
  API.abrir = function () { abrirPainel(true); }; API.fechar = function () { abrirPainel(false); };
  // Cada resposta: um bloco no registo. Texto sempre por textContent.
  function novaResposta(pergunta) {
    construir();
    if (pergunta) LOG.appendChild(el("div", "q", pergunta));
    var b = el("div", "r"), fala = [], esp = null, ac = null;
    LOG.appendChild(b);
    while (LOG.children.length > 16) LOG.removeChild(LOG.firstChild);
    function rolar() { try { LOG.scrollTop = LOG.scrollHeight; } catch (e) {} }
    function dizer(s) { fala.push(s); clearTimeout(b.__f); b.__f = setTimeout(function () { falar(fala.join(" ")); fala = []; }, 250); }
    var R = {
      txt: function (s, cls) { var p = el("p", cls || null, s); b.appendChild(p); dizer(s); rolar(); return R; },
      fonte: function (s) { var p = el("p", "fonte"); p.appendChild(el("b", null, t("fonte"))); p.appendChild(D.createTextNode(" " + s)); b.appendChild(p); rolar(); return R; },
      lista: function (titulo, itens, clicaveis) {
        if (titulo) { b.appendChild(el("p", null, titulo)); dizer(titulo); }
        var ul = el("ul", clicaveis ? "ex" : null);
        itens.forEach(function (s) {
          var li = el("li");
          if (clicaveis) { var bt = el("button", null, s); bt.type = "button"; bt.addEventListener("click", function () { responder(s); }); li.appendChild(bt); }
          else { li.textContent = s; dizer(s); }
          ul.appendChild(li);
        });
        b.appendChild(ul); rolar(); return R;
      },
      accao: function (rot, fn, pri) {
        if (!ac) { ac = el("div", "acc"); b.appendChild(ac); }
        var bt = el("button", pri ? "pri" : null, rot); bt.type = "button";
        bt.addEventListener("click", function () { [].forEach.call(ac.querySelectorAll("button"), function (x) { x.disabled = true; x.style.opacity = ".5"; }); try { fn(); } catch (e) {} });
        ac.appendChild(bt); rolar(); return R;
      },
      espera: function () { if (esp) return R; esp = el("p", "esp"); esp.appendChild(el("i")); esp.appendChild(D.createTextNode(t("aConsultar"))); b.appendChild(esp); rolar(); return R; },
      fimEspera: function () { if (esp) { esp.remove(); esp = null; } return R; }
    };
    return R;
  }

  // ───────────────────────────── arranque (sem pedidos: só espera pelo DOM do Atlas) ─────────────────────────────
  var tentativas = 0;
  function arrancar() {
    if (construir()) { ligarMapa(); return; }
    if (++tentativas < 240) setTimeout(arrancar, 500);
  }
  // O app.js redesenha o #ipe ao mudar de modo: volta a pôr o botão e a ouvir o mapa novo. Só lê o DOM.
  setInterval(function () { if (D.hidden) return; if (RAIZ && !D.body.contains(RAIZ)) construir(); ligarMapa(); }, 2000);
  D.addEventListener("ipr:lingua", function () { try { textosUI(); } catch (e) {} });
  try { new MutationObserver(function () { try { textosUI(); } catch (e) {} }).observe(D.documentElement, { attributes: true, attributeFilter: ["lang"] }); } catch (e) {}
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", arrancar); else arrancar();
})(window, document);
