/* IPR Atlas · Capítulos para o proprietário convidado (Nuno, 4/11/2026, 13h43: «Executa tudo já», a seguir às sugestões
   para quem recebe o seu projecto e se sente perdido: «It has so much information that I am slightly overwhelmed»).
   Acrescento à vista simplificada do convidado (vista-convidado.js), sem mexer nesse ficheiro nem nos outros guiões.
   Liga-se quando essa vista está activa (body.ipr-cv-on: a Base aberta foi partilhada com a pessoa e ela não é da equipa)
   ou com ?capitulos=1 (para a equipa ver como fica). Faz quatro coisas:
     1. Boas-vindas em três passos, na primeira vez que a pessoa abre aquele projecto neste navegador.
     2. Capítulos: uma sequência curta (o terreno, o relevo, a inclinação, a água, o solo, o que a lei permite, documentos
        e perguntas). Cada capítulo liga só as camadas certas, com o nome em linguagem simples, o nome técnico por baixo
        e uma frase «o que isto quer dizer para o seu terreno». «Voltar», «Seguinte» e «Passo X de Y».
     3. Documentos do projecto no último capítulo (os mesmos do cartão da propriedade).
     4. «Perguntar à equipa»: a pergunta fica nas notas do projecto (POST tcd/v1/social/notas, local cap-<capítulo>),
        o dono do projecto é avisado no site e a equipa recebe aviso no Telegram (módulo m90870).
   Português ou inglês conforme o Atlas (IPR_LINGUA). Os textos podem ser afinados por projecto em
   window.IPR_CAPITULOS[<encomenda>] = { <id do capítulo>: { txt: ["pt", "en"] } }.
   Desligar: ?capitulos=0 ou localStorage ipr_cap_off = 1. Terracrua Design. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]capitulos=0\b/.test(W.location.search)) return; } catch (e) {}
  if (W.__iprCap) return; W.__iprCap = 1;
  var FORCAR = /[?&]capitulos=1\b/.test(W.location.search || "");
  function off() { try { return W.localStorage.getItem("ipr_cap_off") === "1"; } catch (e) { return false; } }
  if (off() && !FORCAR) return;

  var EN = function () { return (W.IPR_LINGUA || "pt") === "en"; };
  function L(a) { return a ? a[EN() ? 1 : 0] : ""; }
  function el(tag, cls, txt) { var e = D.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = String(txt); return e; }
  function I() { return W.__ipe || null; }
  function viz() { var i = I(); return i && i.viz; }
  function actual() { var i = I(); return i && i.estado && i.estado.actual; }
  function enc() { var a = actual(); return a && a.id ? String(a.id) : ""; }
  function lsGet(k) { try { return W.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { W.localStorage.setItem(k, v); } catch (e) {} }

  var T = {
    k: ["Visita guiada", "Guided tour"],
    passo: ["Passo ", "Step "], de: [" de ", " of "],
    voltar: ["Voltar", "Back"], seguinte: ["Seguinte", "Next"], fim: ["Terminar", "Finish"],
    abrir: ["Visita guiada", "Guided tour"], fechar: ["Fechar", "Close"], min: ["Minimizar", "Minimise"],
    tecnico: ["Nome técnico: ", "Technical name: "],
    significa: ["O que quer dizer para o seu terreno", "What this means for your land"],
    semCamada: ["Esta informação não está disponível para este terreno.", "This information is not available for this land."],
    docs: ["Documentos", "Documents"], semDocs: ["Os documentos aparecem aqui quando estiverem prontos.", "Documents will appear here when they are ready."],
    perg: ["Perguntar à equipa", "Ask the team"],
    pergAj: ["Escreva a sua dúvida. A equipa da Terracrua Design recebe-a e responde-lhe.", "Write your question. The Terracrua Design team receives it and will reply."],
    enviar: ["Enviar pergunta", "Send question"], enviado: ["Pergunta enviada. Obrigado, respondemos em breve.", "Question sent. Thank you, we will reply soon."],
    erro: ["Não foi possível enviar. Tente de novo ou escreva para info@regenerativo.pt.", "Could not send. Please try again or write to info@regenerativo.pt."],
    sobre: ["Sobre: ", "About: "]
  };
  function t(k) { return L(T[k]); }

  // Capítulos. «c» = camadas por ordem de preferência: a primeira de cada grupo [..] que exista é ligada.
  var CAP = [
    { id: "terreno", t: ["O seu terreno", "Your land"], sub: ["Ortofotomapa, limite do estudo, cadastro", "Orthophoto, study boundary, land registry"],
      txt: ["A linha à volta é o limite que estudámos. As linhas finas são as parcelas do cadastro oficial. A imagem é uma fotografia aérea recente.",
            "The outline is the boundary we studied. The thin lines are the official land registry parcels. The image is a recent aerial photograph."],
      fundo: "f_ortosat", c: [["aoi"], ["cad", "bupi"], ["o_nomes"]] },
    { id: "relevo", t: ["A forma do terreno", "The shape of the land"], sub: ["Sombreamento e curvas de nível (LiDAR)", "Hillshade and contour lines (LiDAR)"],
      txt: ["O sombreamento mostra cerros e vales como se o sol viesse de noroeste. Cada curva de nível junta pontos à mesma altura: curvas muito juntas querem dizer terreno inclinado.",
            "The shading shows hills and valleys as if lit from the north-west. Each contour line joins points at the same height: lines close together mean steep ground."],
      c: [["aoi"], ["l_somb_bw", "r_somb"], ["l_curvas5", "l_curvas1", "r_curvas"]] },
    { id: "declive", t: ["Onde é mais inclinado", "Where it is steep"], sub: ["Declives", "Slope"],
      txt: ["Quanto mais escuro, mais inclinado. As zonas suaves servem para culturas, construção e caminhos; as muito inclinadas ficam melhor com vegetação, que segura o solo.",
            "The darker, the steeper. Gentle ground suits crops, buildings and tracks; very steep ground is best kept planted, so the soil stays in place."],
      c: [["aoi"], ["l_declives"], ["l_curvas5", "r_curvas"]] },
    { id: "agua", t: ["Por onde corre a água", "Where water flows"], sub: ["Linhas de água, acumulação de escoamento, bacias", "Stream lines, flow accumulation, catchments"],
      txt: ["As linhas azuis mostram por onde a chuva se junta e corre. Dizem onde abrandar, espalhar e guardar a água, e onde não convém construir.",
            "The blue lines show where rain gathers and runs. They tell where to slow, spread and store water, and where it is better not to build."],
      c: [["aoi"], ["l_streams", "hidro"], ["l_acumulacao"], ["l_bacias_l", "bacias"]] },
    { id: "solo", t: ["Solo e ocupação", "Soil and land cover"], sub: ["Carta de solos, capacidade de uso, COS 2023", "Soil map, land capability, land cover 2023"],
      txt: ["Mostra que tipo de solo há e como o terreno está ocupado hoje (mato, floresta, pomar, pastagem). É o ponto de partida para escolher o que plantar e onde.",
            "It shows the kind of soil and how the land is used today (scrub, woodland, orchard, pasture). It is the starting point for choosing what to plant and where."],
      c: [["aoi"], ["solos", "sroa"], ["cos23"]] },
    { id: "lei", t: ["O que a lei permite", "What the law allows"], sub: ["REN, RAN, Rede Natura 2000, PDM", "REN, RAN, Natura 2000, municipal plan (PDM)"],
      txt: ["REN e RAN são protecções nacionais, a Rede Natura é europeia e o PDM é o plano da câmara. Dentro destas manchas, construir ou mudar o uso do solo precisa de autorização. A Leitura Territorial explica o que se aplica a cada parte.",
            "REN and RAN are national protections, Natura 2000 is European and the PDM is the municipal plan. Inside these areas, building or changing land use needs permission. The written Territorial Reading explains what applies to each part."],
      c: [["aoi"], ["ren"], ["ran"], ["n2k", "rnap"], ["crus"]] },
    { id: "docs", t: ["Documentos e perguntas", "Documents and questions"], sub: ["Relatórios, plantas e ficheiros do projecto", "Reports, plans and project files"],
      txt: ["Aqui estão os documentos do seu projecto. Se alguma coisa não for clara, pergunte: a equipa responde-lhe.",
            "Here are your project documents. If anything is unclear, just ask: the team will reply."],
      c: [["aoi"]], docs: 1 }
  ];
  var BOAS = [
    { t: ["Este é o seu terreno", "This is your land"], x: ["O mapa abre já sobre a sua propriedade, só com o essencial. Pode aproximar com dois dedos ou com a roda do rato.", "The map opens on your property, showing only what matters. Zoom with two fingers or the mouse wheel."] },
    { t: ["Siga os capítulos", "Follow the chapters"], x: ["Em baixo, a visita guiada mostra o terreno por partes: relevo, água, solo e o que a lei permite. Avance com «Seguinte».", "Below, the guided tour shows your land step by step: relief, water, soil and what the law allows. Move on with «Next»."] },
    { t: ["Pergunte à vontade", "Ask us anything"], x: ["No último capítulo estão os documentos e um espaço para perguntar à equipa da Terracrua Design.", "The last chapter has your documents and a place to ask the Terracrua Design team."] }
  ];

  function textos(c) {
    var o = W.IPR_CAPITULOS && W.IPR_CAPITULOS[enc()] && W.IPR_CAPITULOS[enc()][c.id];
    return o && o.txt ? o.txt : c.txt;
  }

  // Camadas
  function catalogo() {
    var v = W.IPRViz && W.IPRViz.catalogo; if (!v) return [];
    return Array.isArray(v) ? v : Object.keys(v).map(function (k) { return v[k]; });
  }
  function existe(id) {
    if (id === "aoi") return !!(actual() && actual().geojson);
    // Camadas da Base (l_*): só quando há uma Base aberta com ficheiros entregues.
    if (/^l_/.test(id)) { var a = actual(); if (!a || !a.geojson || !(a.downloads || []).length) return false; }
    return catalogo().some(function (e) { return e && e.id === id; });
  }
  // Cada capítulo mostra só as suas camadas (mais fundo, nomes e limite); ao minimizar volta o que estava antes.
  var antes = null;
  function fixa(id) { return id === "aoi" || /^(f_|o_)/.test(id); }
  function activas() { var v = viz(); try { return (v && v.activas && v.activas()) || []; } catch (e) { return []; } }
  function repor() {
    alvo = null;
    var v = viz(); if (!v || !antes) return;
    activas().forEach(function (id) { if (!fixa(id) && antes.indexOf(id) < 0) { try { v.ligar(id, false); } catch (e) {} } });
    antes.forEach(function (id) { try { v.ligar(id, true); } catch (e) {} });
    antes = null;
  }
  // Outros guiões (por exemplo «Camadas base») podem voltar a ligar camadas: enquanto um capítulo está aberto, mantém-se.
  var alvo = null, vigia = 0;
  function manter() {
    if (!alvo || !aberto || !painel || Date.now() - vigia < 1500) return;
    var a = activas(), mal = Object.keys(alvo).some(function (id) { return id !== "aoi" && a.indexOf(id) < 0; }) ||
      a.some(function (id) { return !alvo[id] && !fixa(id); });
    if (mal) { vigia = Date.now(); aplicar(CAP[idx]); }
  }
  function aplicar(c) {
    var v = viz(); if (!v || typeof v.ligar !== "function") return 0;
    if (!antes) antes = activas().slice();
    // As camadas da Base (l_*) estão no catálogo mesmo sem dados: só contam se ficarem mesmo ligadas.
    var quero = {}, n = 0;
    c.c.forEach(function (g) {
      for (var i = 0; i < g.length; i++) {
        var id = g[i]; if (!existe(id)) continue;
        try { v.ligar(id, true); } catch (e) {}
        if (id === "aoi" || activas().indexOf(id) >= 0) { quero[id] = 1; if (id !== "aoi") n++; break; }
      }
    });
    activas().forEach(function (id) { if (!quero[id] && !fixa(id)) { try { v.ligar(id, false); } catch (e) {} } });
    alvo = quero;
    if (c.fundo && existe(c.fundo) && typeof v.fundo === "function") { try { v.fundo(c.fundo); } catch (e) {} }
    return n;
  }

  // Estilos
  var css = el("style"); css.id = "ipr-cap-css";
  css.textContent =
    ".ipr-cap{position:fixed;z-index:2147481000;left:50%;transform:translateX(-50%);bottom:calc(16px + env(safe-area-inset-bottom,0px));width:min(560px,calc(100vw - 32px));max-height:min(62vh,560px);overflow:auto;" +
    "background:var(--p1,#18200f);color:var(--tx,#e9eadf);border:1px solid var(--ac,#94BE39);border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.35);font:14px/1.45 Inter,system-ui,sans-serif;padding:14px 16px 12px}" +
    ".ipr-cap .k{display:flex;justify-content:space-between;align-items:center;gap:8px;font:600 10.5px/1.2 var(--mono,'IBM Plex Mono',monospace);letter-spacing:.1em;text-transform:uppercase;color:var(--ac,#94BE39);margin:0 0 6px}" +
    ".ipr-cap .k button{font:600 16px/1 Inter,system-ui,sans-serif;background:none;border:0;color:var(--mu,#a5a893);cursor:pointer;padding:2px 6px}" +
    ".ipr-cap h3{margin:0;font:600 18px/1.25 Inter,system-ui,sans-serif}.ipr-cap .s{margin:2px 0 8px;font:12px/1.35 var(--mono,monospace);color:var(--mu,#a5a893)}" +
    ".ipr-cap .q{margin:0 0 4px;font:600 12px Inter,system-ui,sans-serif;color:var(--mu,#a5a893)}.ipr-cap p{margin:0 0 8px}" +
    ".ipr-cap .bar{height:4px;border-radius:2px;background:var(--ln,#3a4030);margin:8px 0 10px;overflow:hidden}.ipr-cap .bar i{display:block;height:100%;background:var(--ac,#94BE39)}" +
    ".ipr-cap .nav{display:flex;justify-content:space-between;align-items:center;gap:8px}" +
    ".ipr-cap .nav button,.ipr-cap .env{font:600 13px Inter,system-ui,sans-serif;border-radius:7px;padding:8px 14px;cursor:pointer;border:1px solid var(--ln,#3a4030);background:transparent;color:var(--tx,#e9eadf)}" +
    ".ipr-cap .nav button.p,.ipr-cap .env{background:var(--ac,#94BE39);border-color:var(--ac,#94BE39);color:#11160a}" +
    ".ipr-cap .nav button[disabled]{opacity:.4;cursor:default}.ipr-cap .ps{font:12px var(--mono,monospace);color:var(--mu,#a5a893)}" +
    ".ipr-cap ul{list-style:none;margin:0 0 10px;padding:0}.ipr-cap li a{display:block;padding:7px 9px;margin:0 0 5px;border:1px solid var(--ln,#3a4030);border-radius:7px;color:var(--tx,#e9eadf);text-decoration:none;font-size:13px}" +
    ".ipr-cap li a:hover{border-color:var(--ac,#94BE39)}.ipr-cap textarea{width:100%;box-sizing:border-box;min-height:72px;margin:4px 0 8px;padding:8px;border-radius:7px;border:1px solid var(--ln,#3a4030);background:rgba(0,0,0,.2);color:inherit;font:13px/1.4 Inter,system-ui,sans-serif}" +
    ".ipr-cap .ok{color:var(--ac,#94BE39);font-weight:600}.ipr-cap .er{color:#e9a07a}.ipr-cap .av{font-size:12px;color:var(--mu,#a5a893);font-style:italic}" +
    ".ipr-cap-chip{position:fixed;z-index:2147481000;left:50%;transform:translateX(-50%);bottom:calc(16px + env(safe-area-inset-bottom,0px));font:600 13px Inter,system-ui,sans-serif;border:1px solid var(--ac,#94BE39);background:var(--p1,#18200f);color:var(--tx,#e9eadf);border-radius:20px;padding:8px 16px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.3)}" +
    ".ipr-cap-bv{position:fixed;inset:0;z-index:2147482100;background:rgba(10,14,6,.55);display:flex;align-items:center;justify-content:center;padding:16px}" +
    ".ipr-cap-bv .ipr-cap{position:static;transform:none;max-height:none;width:min(440px,100%)}" +
    "@media (max-width:700px){.ipr-cap,.ipr-cap-chip{bottom:calc(60px + env(safe-area-inset-bottom,0px))}.ipr-cap{max-height:55vh}}";
  (D.head || D.documentElement).appendChild(css);

  var painel = null, chip = null, idx = 0, aberto = true;
  function kp(k) { return "ipr_cap_" + k + "_" + enc(); }

  function nav(i, n, onV, onS, fimTxt) {
    var b = el("div", "bar"), f = el("i"); f.style.width = Math.round((i + 1) / n * 100) + "%"; b.appendChild(f);
    var nv = el("div", "nav");
    var v = el("button", "", t("voltar")); v.type = "button"; v.disabled = i === 0; v.addEventListener("click", onV);
    var ps = el("span", "ps", t("passo") + (i + 1) + t("de") + n);
    var s = el("button", "p", i === n - 1 ? (fimTxt || t("fim")) : t("seguinte")); s.type = "button"; s.addEventListener("click", onS);
    nv.appendChild(v); nv.appendChild(ps); nv.appendChild(s);
    return [b, nv];
  }

  function desenhar() {
    if (!painel) { painel = el("div", "ipr-cap"); painel.id = "ipr-cap"; painel.setAttribute("role", "dialog"); D.body.appendChild(painel); }
    if (chip) chip.style.display = aberto ? "none" : "";
    painel.style.display = aberto ? "" : "none";
    if (!aberto) return;
    var c = CAP[idx];
    painel.innerHTML = "";
    var k = el("div", "k"); k.appendChild(el("span", "", t("k")));
    var x = el("button", "", "×"); x.type = "button"; x.title = t("min"); x.setAttribute("aria-label", t("min"));
    x.addEventListener("click", function () { aberto = false; lsSet(kp("min"), "1"); repor(); mostrarChip(); desenhar(); });
    k.appendChild(x); painel.appendChild(k);
    painel.appendChild(el("h3", "", L(c.t)));
    painel.appendChild(el("div", "s", t("tecnico") + L(c.sub)));
    var n = aplicar(c);
    painel.appendChild(el("div", "q", t("significa")));
    painel.appendChild(el("p", "", L(textos(c))));
    if (!n && !c.docs && c.id !== "terreno") painel.appendChild(el("p", "av", t("semCamada")));
    if (c.docs) docs(painel);
    nav(idx, CAP.length, function () { if (idx > 0) { idx--; lsSet(kp("i"), idx); desenhar(); } },
      function () { if (idx < CAP.length - 1) { idx++; lsSet(kp("i"), idx); desenhar(); } else { aberto = false; repor(); mostrarChip(); desenhar(); } })
      .forEach(function (e) { painel.appendChild(e); });
  }

  function docs(p) {
    var a = actual() || {}, l = (a.downloads || []).filter(function (d) { return d && d.url; });
    p.appendChild(el("div", "q", t("docs")));
    if (l.length) {
      var ul = el("ul");
      l.forEach(function (d) { var li = el("li"), x = el("a", "", d.nome || d.url); x.href = d.url; x.target = "_blank"; x.rel = "noopener"; li.appendChild(x); ul.appendChild(li); });
      p.appendChild(ul);
    } else p.appendChild(el("p", "av", t("semDocs")));
    p.appendChild(el("div", "q", t("perg")));
    p.appendChild(el("p", "", t("pergAj")));
    var ta = el("textarea"); ta.setAttribute("aria-label", t("perg")); ta.maxLength = 2000; p.appendChild(ta);
    var b = el("button", "env", t("enviar")); b.type = "button"; p.appendChild(b);
    var msg = el("p", ""); p.appendChild(msg);
    b.addEventListener("click", function () {
      var tx = (ta.value || "").trim(); if (!tx) { ta.focus(); return; }
      b.disabled = true; msg.className = ""; msg.textContent = "…";
      var cab = { "Content-Type": "application/json" }; if (W.tcdNonce) cab["X-WP-Nonce"] = W.tcdNonce;
      fetch("/wp-json/tcd/v1/social/notas", { method: "POST", credentials: "same-origin", headers: cab,
        body: JSON.stringify({ enc: +enc(), texto: tx, local: "cap-" + (CAP[ultimoCap] ? CAP[ultimoCap].id : "docs") }) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function () { ta.value = ""; msg.className = "ok"; msg.textContent = t("enviado"); b.disabled = false; })
        .catch(function () { msg.className = "er"; msg.textContent = t("erro"); b.disabled = false; });
    });
  }
  var ultimoCap = 0;

  function mostrarChip() {
    if (!chip) {
      chip = el("button", "ipr-cap-chip", "▸ " + t("abrir")); chip.type = "button"; chip.id = "ipr-cap-chip";
      chip.addEventListener("click", function () { aberto = true; lsSet(kp("min"), ""); desenhar(); });
      D.body.appendChild(chip);
    }
    chip.textContent = "▸ " + t("abrir");
    chip.style.display = aberto ? "none" : "";
  }

  function boasVindas(feito) {
    var i = 0, fundo = el("div", "ipr-cap-bv"), cx = el("div", "ipr-cap"); fundo.appendChild(cx); D.body.appendChild(fundo);
    function d() {
      var b = BOAS[i]; cx.innerHTML = "";
      cx.appendChild(el("div", "k", t("k")));
      cx.appendChild(el("h3", "", L(b.t))); cx.appendChild(el("p", "", L(b.x)));
      nav(i, BOAS.length, function () { if (i > 0) { i--; d(); } }, function () { if (i < BOAS.length - 1) { i++; d(); } else { fecha(); } }, EN() ? "Start" : "Começar")
        .forEach(function (e) { cx.appendChild(e); });
    }
    function fecha() { fundo.remove(); lsSet(kp("bv"), "1"); feito(); }
    fundo.addEventListener("click", function (e) { if (e.target === fundo) fecha(); });
    d();
  }

  // Nomes simples nas camadas da Base do cartão do convidado (minhas-bases.js: li[data-mb-c]), com o nome técnico e uma
  // linha a explicar por baixo. Só na vista do convidado; o texto original fica no atributo title.
  var SIMPLES = {
    l_mdt: [["Altura do terreno", "Height of the land"], ["Mais claro é mais alto.", "Lighter is higher."]],
    l_somb_bw: [["Relevo em sombra", "Relief shading"], ["Mostra cerros e vales.", "Shows hills and valleys."]],
    l_curvas025: [["Curvas de nível (25 cm)", "Contour lines (25 cm)"], ["Linhas juntas: terreno inclinado.", "Lines close together: steep ground."]],
    l_curvas05: [["Curvas de nível (50 cm)", "Contour lines (50 cm)"], ["Linhas juntas: terreno inclinado.", "Lines close together: steep ground."]],
    l_curvas1: [["Curvas de nível (1 m)", "Contour lines (1 m)"], ["Linhas juntas: terreno inclinado.", "Lines close together: steep ground."]],
    l_curvas2: [["Curvas de nível (2 m)", "Contour lines (2 m)"], ["Linhas juntas: terreno inclinado.", "Lines close together: steep ground."]],
    l_curvas5: [["Curvas de nível (5 m)", "Contour lines (5 m)"], ["Linhas juntas: terreno inclinado.", "Lines close together: steep ground."]],
    l_declives: [["Onde é mais inclinado", "Where it is steep"], ["Mais escuro, mais inclinado.", "Darker is steeper."]],
    l_exposicao: [["Para onde vira o terreno", "Which way the land faces"], ["Sul e poente aquecem mais.", "South and west facing ground is warmer."]],
    l_geomorphons: [["Formas do relevo", "Landforms"], ["Cumes, encostas, vales e planos.", "Ridges, slopes, valleys and flats."]],
    l_vento: [["Exposição ao vento", "Wind exposure"], ["Onde o vento bate mais.", "Where the wind hits hardest."]],
    l_streams: [["Por onde corre a água", "Where water flows"], ["Linhas onde a chuva se junta.", "Lines where rain gathers."]],
    l_festos: [["Linhas de cumeada", "Ridge lines"], ["Onde a água se divide.", "Where water divides."]],
    l_acumulacao: [["Onde a água se acumula", "Where water collects"], ["Mais forte, mais água a passar.", "Stronger colour, more water passing."]],
    l_bacias_l: [["Bacias de drenagem", "Catchments"], ["Zonas que escoam para o mesmo ponto.", "Areas draining to the same point."]],
    l_twi: [["Zonas mais húmidas", "Wetter ground"], ["Onde o solo tende a ficar húmido.", "Where the soil tends to stay moist."]],
    l_erosao: [["Risco de erosão", "Erosion risk"], ["Onde o solo se perde mais.", "Where soil is most easily lost."]],
    aoi: [["Limite do seu terreno", "Your land boundary"], ["", ""]]
  };
  function nomesSimples() {
    if (!D.body || !D.body.classList.contains("ipr-cv-on")) return;
    var lg = EN() ? "en" : "pt";
    [].forEach.call(D.querySelectorAll("#ipr-mb li[data-mb-c]"), function (li) {
      var id = li.getAttribute("data-mb-c"), s = SIMPLES[id]; if (!s || li.getAttribute("data-cap-n") === lg) return;
      var nm = li.querySelector(".ipr-mb-n"); if (!nm) return;
      var tec = li.getAttribute("data-cap-t");
      if (tec == null) { tec = (nm.firstChild && nm.firstChild.nodeType === 3 ? nm.firstChild.nodeValue : nm.textContent) || ""; li.setAttribute("data-cap-t", tec); }
      [].forEach.call(nm.querySelectorAll("small.ipr-cap-n"), function (x) { x.remove(); });
      if (nm.firstChild && nm.firstChild.nodeType === 3) nm.firstChild.nodeValue = L(s[0]); else nm.insertBefore(D.createTextNode(L(s[0])), nm.firstChild);
      var sm = el("small", "ipr-cap-n", (L(s[1]) ? L(s[1]) + " · " : "") + tec.trim()); nm.appendChild(sm);
      nm.title = tec.trim();
      li.setAttribute("data-cap-n", lg);
    });
  }

  var ligado = "";
  function arrancar() {
    var e = enc(), activo = FORCAR || (D.body && D.body.classList.contains("ipr-cv-on"));
    if (!activo || !viz()) { if (!activo && painel) { painel.style.display = "none"; if (chip) chip.style.display = "none"; ligado = ""; } return; }
    var chave = e || "geral";
    if (ligado === chave) return;
    ligado = chave;
    idx = Math.min(+(lsGet(kp("i")) || 0) || 0, CAP.length - 1);
    aberto = lsGet(kp("min")) !== "1";
    var segue = function () { mostrarChip(); desenhar(); };
    if (lsGet(kp("bv")) !== "1") boasVindas(segue); else segue();
  }
  W.iprCapitulos = { abrir: function (i) { if (i != null) idx = Math.max(0, Math.min(CAP.length - 1, i)); aberto = true; desenhar(); }, CAP: CAP };
  D.addEventListener("ipr:lingua", function () { if (painel && aberto) desenhar(); if (chip) chip.textContent = "▸ " + t("abrir"); });
  // ultimoCap acompanha o capítulo em que a pessoa estava antes de abrir as perguntas
  setInterval(function () { try { arrancar(); manter(); nomesSimples(); if (idx !== CAP.length - 1) ultimoCap = idx; } catch (e) {} }, 700);
})();
