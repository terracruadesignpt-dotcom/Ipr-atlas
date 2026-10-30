/* IPR Atlas · Pesquisa à Google Earth, barra de ferramentas em baixo e dicas na barra da direita
   (pedidos do Nuno, 30/10/2026, 17h49; reportes 17047 e 17041 do Bernardo Sampaio).
   1. Pesquisa: a caixa que já existe (#ipe-q, barra da esquerda) passa a perceber também coordenadas em graus, minutos e
      segundos e em PT-TM06/ETRS89 (EPSG:3763), aceita o NIC com hífenes ou pontos, explica o artigo matricial e sugere os
      projectos da pessoa (as Bases de /wp-json/tcd/v1/meus-mapas que o Atlas já carregou e os terrenos guardados). Graus
      decimais, NIC e moradas continuam a ser tratados pelo app.js, como antes. Ao lado da caixa, um botão «3D» que carrega
      no botão 3D do Atlas ([data-tool="3d"]: inclina a vista e liga o relevo).
   2. Barra fixa em baixo, ao centro do mapa: Medir (distância e área), Desenhar, Perfil, 3D e Imprimir (Planta de
      localização em PDF ou prancha PNG). Cada botão carrega no botão que já existe; as ferramentas continuam onde estavam.
      A barra afasta-se da legenda, da Formiga, da caixa #ipe-hud, dos controlos do MapLibre e da barra de estado; se não
      couber em baixo, fica só com ícones e, em último caso, sobe. No telemóvel, só ícones e rolável.
   3. Reporte 17047: todos os botões da barra da direita (.ipe-tools e controlos do mapa) ficam com aria-label e dica. Com
      rato, a dica é a do ajustes.js (§ dicas); onde ele não actua (iPad, ecrãs tácteis híbridos) a dica aparece aqui, ao
      manter o dedo no botão ou ao passar o rato.
   4. Reporte 17041: a caixa #ipe-hud (medições e mensagens) deixava de se ver quando se mudava o zoom: o aviso do viz.js
      («Aproxime-se…», .iprv-aviso, z-index 7) abre ao centro em baixo e, com o mapa estreito, cai por cima dela. Agora, com a
      caixa aberta, o aviso sobe para cima dela; se a caixa ficar por baixo de outra coisa ou fora do mapa, ela sobe.
   Não edita nenhum ficheiro do Atlas; só acrescenta elementos e estilos próprios (prefixo ipr-pb). Nada se esconde.
   Desligar: ?pesquisa-barra=0 no endereço, ou localStorage ipr_pesquisa-barra_off = 1, ou window.IPR_PESQUISA_BARRA_OFF.
   Propriedade de IPR – Instituto de Planeamento Regenerativo, Lda. */
(function () {
  "use strict";
  var W = window, D = document;
  if (W.__iprPesquisaBarra || W.IPR_PESQUISA_BARRA_OFF) return;
  try { var QS = new URLSearchParams(location.search); if (QS.get("pesquisa-barra") === "0" || QS.get("pesquisa_barra") === "0") return; } catch (e) {}
  try { if (localStorage.getItem("ipr_pesquisa-barra_off") === "1") return; } catch (e) {}
  W.__iprPesquisaBarra = 1;

  // ---------- textos ----------
  var TX = {
    pt: {
      b3d: "Vista 3D: inclina o mapa e liga o relevo", b3dOff: "Sair da vista 3D",
      medir: "Medir", medirT: "Medir distâncias e áreas", dist: "Distância", distT: "Medir um caminho (distância)", area: "Área", areaT: "Medir um polígono (área)",
      desenhar: "Desenhar", desenharT: "Desenhar o terreno",
      perfil: "Perfil", perfilT: "Perfil de elevação ao longo de uma linha",
      d3: "3D", d3T: "Relevo em 3D (inclina a vista)",
      imprimir: "Imprimir", imprimirT: "Imprimir: Planta de localização (PDF) ou prancha (PNG)",
      planta: "Planta de localização (PDF)", prancha: "Prancha do ecrã (PNG)",
      plantaSem: "A Planta de localização faz-se a partir de um terreno guardado num projecto (separador Projectos).",
      indisp: "Esta ferramenta não está disponível neste modo do Atlas.",
      barra: "Ferramentas principais", ferr: "Ferramentas", ferrT: "Mostrar as ferramentas", fechar: "Fechar", fecharT: "Recolher as ferramentas",
      coordGd: "Coordenadas WGS84", coordGms: "Coordenadas em graus, minutos e segundos", coordTm: "Coordenadas PT-TM06 / ETRS89",
      oeste: "longitude a oeste (Portugal)", ir: "Ir para", nic: "Prédio pelo NIC (cadastro predial)",
      artigo: "Artigo matricial {a}", artigoS: "O artigo não tem localização pública. Use o NIC do prédio ou carregue a caderneta no pedido da Base.",
      proj: "Projecto", base: "Base Cartográfica", terreno: "Terreno guardado", local: "Procurar «{t}» como local",
      sugest: "Sugestões", foraPt: "fora de Portugal continental: confirme a ordem M, P"
    },
    en: {
      b3d: "3D view: tilts the map and turns on the relief", b3dOff: "Leave the 3D view",
      medir: "Measure", medirT: "Measure distances and areas", dist: "Distance", distT: "Measure a path (distance)", area: "Area", areaT: "Measure a polygon (area)",
      desenhar: "Draw", desenharT: "Draw the plot",
      perfil: "Profile", perfilT: "Elevation profile along a line",
      d3: "3D", d3T: "3D relief (tilts the view)",
      imprimir: "Print", imprimirT: "Print: Location plan (PDF) or sheet (PNG)",
      planta: "Location plan (PDF)", prancha: "Screen sheet (PNG)",
      plantaSem: "The Location plan is made from a plot saved in a project (Projects tab).",
      indisp: "This tool is not available in this mode of the Atlas.",
      barra: "Main tools", ferr: "Tools", ferrT: "Show the tools", fechar: "Close", fecharT: "Hide the tools",
      coordGd: "WGS84 coordinates", coordGms: "Degrees, minutes and seconds", coordTm: "PT-TM06 / ETRS89 coordinates",
      oeste: "longitude west (Portugal)", ir: "Go to", nic: "Property by NIC (land registry)",
      artigo: "Tax article {a}", artigoS: "The tax article has no public location. Use the property NIC or upload the tax record in the Base order.",
      proj: "Project", base: "Base Map", terreno: "Saved plot", local: "Search «{t}» as a place",
      sugest: "Suggestions", foraPt: "outside mainland Portugal: check the E, N order"
    }
  };
  function en() { return String(W.IPR_LINGUA || D.documentElement.lang || "pt").toLowerCase().indexOf("en") === 0; }
  function t(k, o) { var s = (en() ? TX.en : TX.pt)[k] || TX.pt[k] || k; if (o) Object.keys(o).forEach(function (x) { s = s.split("{" + x + "}").join(o[x]); }); return s; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  // ---------- acesso ao Atlas ----------
  function I() { return W.__ipe || null; }
  function mapa() { var i = I(); return i && i.mapa ? i.mapa : null; }
  function est() { var i = I(); return i && i.estado ? i.estado : null; }
  function $(s) { return D.querySelector(s); }
  function vis(el) {
    if (!el || !el.getBoundingClientRect) return false;
    var r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return false;
    var c = getComputedStyle(el); return c.display !== "none" && c.visibility !== "hidden" && +c.opacity > 0.05;
  }
  function movel() { return W.innerWidth <= 760; }
  function css(id, txt) { if (D.getElementById(id)) return; var s = D.createElement("style"); s.id = id; s.textContent = txt; (D.head || D.documentElement).appendChild(s); }
  function ferr(sel) { return $("#ipe " + sel); }
  function avisar(m) {
    try {
      var a = D.getElementById("ipr-av62");
      if (!a) { a = D.createElement("div"); a.id = "ipr-av62"; a.setAttribute("role", "status"); (D.getElementById("ipe") || D.body).appendChild(a); }
      a.textContent = m; a.classList.add("on"); clearTimeout(a.__tpb); a.__tpb = setTimeout(function () { a.classList.remove("on"); }, 6000);
    } catch (e) {}
  }
  function carregar(sel) {
    var b = ferr(sel); if (!b || b.disabled) { avisar(t("indisp")); return false; }
    try { b.click(); } catch (e) { return false; }
    return true;
  }

  css("ipr-pb-css",
    // 3D ao lado da pesquisa (alvo de toque de 40 px pelo ::after)
    "#ipe .ipe-busca .ipr-pb-3d{flex:none;position:relative;display:inline-flex;align-items:center;justify-content:center;min-width:30px;height:30px;padding:0 6px;border:1px solid var(--ln2,var(--ln,#2c312a));border-radius:2px;background:var(--p2,#1d221c);color:var(--tx,#e9eadf);font:600 11.5px/1 Inter,sans-serif;letter-spacing:.02em;cursor:pointer}" +
    "#ipe .ipe-busca .ipr-pb-3d::after{content:'';position:absolute;inset:-5px}#ipe .ipe-busca .ipr-pb-3d:hover{background:var(--p3,#262c24);color:var(--ac2,var(--ac,#b5c46a))}" +
    "#ipe .ipe-busca .ipr-pb-3d[aria-pressed=true]{border-color:var(--ac,#b5c46a);color:var(--ac,#b5c46a)}" +
    // sugestões da pesquisa
    "#ipr-pb-sug{list-style:none;margin:4px 0 2px;padding:0;max-height:46vh;overflow:auto}#ipr-pb-sug[hidden]{display:none}" +
    "#ipr-pb-sug li>button,#ipr-pb-sug li>div{display:flex;gap:8px;align-items:flex-start;width:100%;box-sizing:border-box;text-align:left;border:0;background:transparent;padding:7px 12px;min-height:40px;cursor:pointer;color:var(--tx,#e9eadf);font:13px/1.3 Inter,sans-serif}" +
    "#ipr-pb-sug li>div{cursor:default}#ipr-pb-sug li>button:hover,#ipr-pb-sug li>button.on{background:var(--p3,#262c24)}" +
    "#ipr-pb-sug i{flex:none;font:600 10px/1.6 var(--mono,'IBM Plex Mono',monospace);letter-spacing:.06em;text-transform:uppercase;color:var(--ac2,var(--ac,#b5c46a));min-width:52px;padding-top:1px;font-style:normal}" +
    "#ipr-pb-sug b{display:block;font-weight:500}#ipr-pb-sug small{display:block;color:var(--mu2,var(--mu,#a3a796));font-size:11.5px}" +
    // barra de baixo
    "#ipr-pb-barra{position:absolute;z-index:6;left:50%;bottom:12px;transform:translateX(-50%);display:flex;align-items:stretch;gap:2px;padding:3px;box-sizing:border-box;max-width:calc(100% - 16px);" +
    "background:var(--tbg,rgba(23,26,19,.92));-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border:1px solid var(--ln2,var(--ln,#2c312a));border-radius:2px;box-shadow:0 6px 24px rgba(0,0,0,.35);font:500 11.5px/1.1 Inter,sans-serif;color:var(--tx,#e9eadf)}" +
    "#ipr-pb-barra[hidden]{display:none}" +
    "#ipr-pb-barra>button{flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-width:60px;min-height:46px;padding:4px 8px;border:0;border-radius:2px;background:transparent;color:inherit;font:inherit;cursor:pointer}" +
    "#ipr-pb-barra>button:hover{background:var(--p3,rgba(255,255,255,.08))}#ipr-pb-barra>button[aria-pressed=true],#ipr-pb-barra>button[aria-expanded=true]{color:var(--ac,#b5c46a);background:var(--p3,rgba(255,255,255,.08))}" +
    "#ipr-pb-barra>button[aria-disabled=true]{opacity:.45}#ipr-pb-barra svg{width:19px;height:19px;flex:none}" +
    "#ipr-pb-barra.so-icones>button{min-width:44px;padding:4px 6px}#ipr-pb-barra.so-icones>button>span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
    "#ipr-pb-barra.rola{overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}#ipr-pb-barra.rola::-webkit-scrollbar{display:none}" +
    ".ipr-pb-menu{position:absolute;z-index:8;min-width:220px;padding:4px;background:var(--p1,#141814);color:var(--tx,#e9eadf);border:1px solid var(--ln2,var(--ln,#2c312a));border-radius:2px;box-shadow:0 8px 28px rgba(0,0,0,.4);font:13px/1.3 Inter,sans-serif}" +
    ".ipr-pb-menu[hidden]{display:none}.ipr-pb-menu button{display:flex;align-items:center;gap:10px;width:100%;min-height:42px;padding:6px 10px;border:0;border-radius:2px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}" +
    ".ipr-pb-menu button:hover,.ipr-pb-menu button:focus-visible{background:var(--p3,rgba(255,255,255,.08))}.ipr-pb-menu svg{width:18px;height:18px;flex:none}" +
    ".ipe.claro #ipr-pb-barra{background:rgba(255,255,255,.95)}" +
    "#ipe.ipr-78-mm #ipr-pb-barra{display:none}" +
    // telemóvel até 600 px: a barra começa recolhida num botão «Ferramentas», para não tapar o mapa
    "#ipr-pb-barra>[data-pbt]{display:none}" +
    "@media (max-width:600px){#ipr-pb-barra>[data-pbt]{display:flex;flex-direction:row;gap:6px;padding:4px 12px}#ipr-pb-barra.fechada>[data-pbb]{display:none}" +
    "#ipr-pb-barra.fechada.so-icones>[data-pbt]>span{position:static;width:auto;height:auto;clip:auto;overflow:visible}" +
    "#ipr-pb-barra:not(.fechada)>[data-pbt]>span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}}" +
    "#ipr-pb-tip{position:fixed;z-index:100004;pointer-events:none;opacity:0;transition:opacity .12s}#ipr-pb-tip.on{opacity:1}");

  // ---------- coordenadas ----------
  function num(s) { return parseFloat(String(s).replace(",", ".")); }
  // PT-TM06/ETRS89 (EPSG:3763) → WGS84 (diferença ETRS89/WGS84 desprezável aqui). Transversa de Mercator, elipsóide GRS80.
  var TM = { a: 6378137, f: 1 / 298.257222101, lat0: 39.66825833333333, lon0: -8.133108333333334, k0: 1 };
  function tmInv(x, y) {
    var a = TM.a, f = TM.f, e2 = f * (2 - f), e4 = e2 * e2, e6 = e4 * e2, r = Math.PI / 180, k0 = TM.k0;
    function arco(p) { return a * ((1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * p - (3 * e2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) * Math.sin(2 * p) + (15 * e4 / 256 + 45 * e6 / 1024) * Math.sin(4 * p) - (35 * e6 / 3072) * Math.sin(6 * p)); }
    var M = arco(TM.lat0 * r) + y / k0, mu = M / (a * (1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256));
    var s = Math.sqrt(1 - e2), e1 = (1 - s) / (1 + s);
    var p1 = mu + (3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32) * Math.sin(2 * mu) + (21 * e1 * e1 / 16 - 55 * Math.pow(e1, 4) / 32) * Math.sin(4 * mu) + (151 * Math.pow(e1, 3) / 96) * Math.sin(6 * mu) + (1097 * Math.pow(e1, 4) / 512) * Math.sin(8 * mu);
    var ep2 = e2 / (1 - e2), sn = Math.sin(p1), cs = Math.cos(p1), tn = Math.tan(p1);
    var C1 = ep2 * cs * cs, T1 = tn * tn, N1 = a / Math.sqrt(1 - e2 * sn * sn), R1 = a * (1 - e2) / Math.pow(1 - e2 * sn * sn, 1.5), Dd = x / (N1 * k0);
    var lat = p1 - (N1 * tn / R1) * (Dd * Dd / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * Math.pow(Dd, 4) / 24 + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * Math.pow(Dd, 6) / 720);
    var lon = TM.lon0 * r + (Dd - (1 + 2 * T1 + C1) * Math.pow(Dd, 3) / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * Math.pow(Dd, 5) / 120) / cs;
    return [lon / r, lat / r];
  }
  function dentroPt(lon, lat) { return lon > -9.7 && lon < -6.1 && lat > 36.8 && lat < 42.3; }
  // devolve {lon, lat, tipo: "gd"|"gms"|"tm", nota} ou null
  function lerCoord(txt) {
    var s = String(txt || "").trim().replace(/[−–]/g, "-").replace(/\s+/g, " ");
    if (!s) return null;
    // PT-TM06: dois números com módulo acima de 180 (metros), etiquetas opcionais
    var u = s.replace(/^(pt-?tm06|tm06|etrs89(\/pt-?tm06)?|epsg:?\s?3763)\s*[:,]?\s*/i, "");
    var mt = /^(?:([mxpy])\s*[:=]?\s*)?(-?\d{2,7}(?:[.,]\d+)?)\s*m?\s*[,; ]\s*(?:([mxpy])\s*[:=]?\s*)?(-?\d{2,7}(?:[.,]\d+)?)\s*m?$/i.exec(u);
    if (mt) {
      var v1 = num(mt[2]), v2 = num(mt[4]);
      // só com indicação explícita: PT-TM06/EPSG:3763 à frente, etiquetas M/P (X/Y), ou os dois valores com 5 ou mais
      // algarismos inteiros (metros, como «-50000 -100000»). Dois números pequenos seguem para o app.js como antes.
      var expl = u !== s || !!(mt[1] || mt[3]) || (Math.abs(v1) >= 10000 && Math.abs(v2) >= 10000);
      if (expl && (Math.abs(v1) > 180 || Math.abs(v2) > 180)) {
        var x = v1, y = v2, l1 = (mt[1] || "").toLowerCase();
        if (l1 === "p" || l1 === "y") { x = v2; y = v1; }
        var g = tmInv(x, y);
        if (isFinite(g[0]) && isFinite(g[1]) && Math.abs(g[1]) < 85) return { lon: g[0], lat: g[1], tipo: "tm", x: x, y: y, nota: dentroPt(g[0], g[1]) ? "" : t("foraPt") };
      }
    }
    // Graus, minutos e segundos (com ° ou com hemisfério)
    var S = s.toUpperCase().replace(/[’′`´]/g, "'").replace(/[″”“]/g, '"').replace(/''/g, '"').replace(/º|˚/g, "°");
    var re = /([NSEWOL])?\s*(-)?(\d{1,3}(?:[.,]\d+)?)\s*(?:°|:|\s)\s*(?:(\d{1,2}(?:[.,]\d+)?)\s*(?:'|:|\s)\s*)?(?:(\d{1,2}(?:[.,]\d+)?)\s*"?\s*)?([NSEWOL])?/g;
    if (/[°'"]|\d\s+\d{1,2}\s+\d{1,2}(?:[.,]\d+)?\s*[NSEWOL]\b/.test(S)) {
      var ps = [], m;
      while ((m = re.exec(S)) && ps.length < 3) {
        if (m[0].trim() === "") { re.lastIndex++; continue; }
        if (!m[4] && !m[5] && !/°/.test(m[0])) continue;
        if (m[1] && m[6]) { re.lastIndex = m.index + m[0].lastIndexOf(m[6]); m[6] = ""; } // «N37° … W8° …»: a letra do fim é da seguinte
        var dg = num(m[3]) + (m[4] ? num(m[4]) / 60 : 0) + (m[5] ? num(m[5]) / 3600 : 0);
        if ((m[4] && num(m[4]) >= 60) || (m[5] && num(m[5]) >= 60)) return null;
        ps.push({ v: dg, neg: !!m[2], h: m[1] || m[6] || "" });
      }
      if (ps.length === 2) {
        var la = ps[0], lo = ps[1];
        if (/[EWOL]/.test(la.h) || /[NS]/.test(lo.h)) { la = ps[1]; lo = ps[0]; }
        var lat = la.v * ((la.neg || la.h === "S") ? -1 : 1), lon = lo.v * ((lo.neg || /[WO]/.test(lo.h)) ? -1 : 1), nota = "";
        if (!lo.h && !lo.neg && lat > 29 && lat < 44 && lon > 6 && lon < 32) { lon = -lon; nota = t("oeste"); }
        if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) return { lon: lon, lat: lat, tipo: "gms", nota: nota };
      }
      return null;
    }
    // Graus decimais (o app.js já os trata ao carregar Enter; aqui só para a sugestão)
    var gd = /^\s*(-?\d{1,2}(?:[.,]\d+)?)\s*[,; ]\s*(-?\d{1,3}(?:[.,]\d+)?)\s*$/.exec(s);
    if (gd) { var a1 = num(gd[1]), a2 = num(gd[2]); if (Math.abs(a1) <= 90 && Math.abs(a2) <= 180) return { lon: a2, lat: a1, tipo: "gd", nota: "" }; }
    return null;
  }
  function fmtGd(c) { return c.lat.toFixed(6) + ", " + c.lon.toFixed(6); }

  var MARCA = null;
  function irPara(c) {
    var M = mapa(); if (!M) return;
    try { M.flyTo({ center: [c.lon, c.lat], zoom: Math.max(M.getZoom ? M.getZoom() : 0, 16) }); } catch (e) {}
    try {
      if (MARCA) { MARCA.remove(); MARCA = null; }
      if (W.maplibregl && W.maplibregl.Marker) {
        MARCA = new W.maplibregl.Marker({ color: "#d0482c" }).setLngLat([c.lon, c.lat]).addTo(M);
        var el = MARCA.getElement(); el.title = fmtGd(c) + " · " + (en() ? "click to remove" : "clique para tirar"); el.style.cursor = "pointer";
        el.addEventListener("click", function (e) { e.stopPropagation(); if (MARCA) { MARCA.remove(); MARCA = null; } });
      }
    } catch (e) {}
  }

  // ---------- projectos ----------
  var PJ = { cache: null, pedido: false };
  function nomeDe(m) { return String(m && (m.nome || m.titulo || m.title || m.local || (m.id != null ? "#" + m.id : "")) || "").trim(); }
  function sAcento(s) { return String(s || "").toLowerCase().normalize ? String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") : String(s || "").toLowerCase(); }
  function projectos() {
    var P = est(), out = [], vistos = {};
    function por(m, tipo) { if (!m) return; var n = nomeDe(m), k = tipo + ":" + (m.id != null ? m.id : n); if (!n || vistos[k]) return; vistos[k] = 1; out.push({ m: m, tipo: tipo, nome: n }); }
    if (P && P.dados && !P.dados.bloqueado) (P.mapas || []).forEach(function (m) { por(m, "base"); });
    else if (PJ.cache) PJ.cache.forEach(function (m) { por(m, "base"); });
    if (P && P.projs) P.projs.forEach(function (m) { por(m, "terreno"); });
    if (!out.length && !PJ.pedido && W.tcdNonce && W.fetch) {
      PJ.pedido = true;
      try {
        fetch("/wp-json/tcd/v1/meus-mapas", { credentials: "same-origin", headers: { "X-WP-Nonce": W.tcdNonce } })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (d) { if (d && !d.bloqueado) PJ.cache = (d.mapas || []).concat(d.partilhados || []); }).catch(function () {});
      } catch (e) {}
    }
    return out;
  }
  function caixa(g) {
    if (typeof g === "string") { try { g = JSON.parse(g); } catch (e) { return null; } }
    var b = [Infinity, Infinity, -Infinity, -Infinity];
    (function per(c) { if (!c || !c.length) return; if (typeof c[0] === "number") { b[0] = Math.min(b[0], c[0]); b[1] = Math.min(b[1], c[1]); b[2] = Math.max(b[2], c[0]); b[3] = Math.max(b[3], c[1]); } else c.forEach(per); })(
      (function col(o) { if (!o) return []; if (o.type === "FeatureCollection") return (o.features || []).map(col); if (o.type === "Feature") return col(o.geometry); if (o.type === "GeometryCollection") return (o.geometries || []).map(col); return o.coordinates || []; })(g));
    return isFinite(b[0]) && b[0] <= b[2] ? b : null;
  }
  function enquadrar(m) {
    var M = mapa(), b = m && caixa(m.geojson); if (!M || !b) return false;
    try { M.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: movel() ? 30 : 70, maxZoom: 17.5, duration: 800 }); } catch (e) { return false; }
    return true;
  }
  // Abrir uma Base pelo mesmo caminho do cartão do separador Projectos (como o minhas-bases.js); um terreno guardado é só enquadrado.
  function abrirProjecto(p) {
    var P = est(), m = p.m;
    if (p.tipo === "terreno") { enquadrar(m); return; }
    if (P && P.modo === "cliente" && P.actual && String(P.actual.id) === String(m.id)) { enquadrar(m); return; }
    var i = P && P.mapas ? P.mapas.indexOf(m) : -1, c = i >= 0 ? $('#ipe-proj .ipe-card[data-i="' + i + '"]') : null;
    if (c) { c.click(); setTimeout(function () { enquadrar(m); }, 900); return; }
    var enc = m.encomenda || m.id;
    if (enc != null && typeof W.__iprOrgBase === "function") { try { W.__iprOrgBase(enc); setTimeout(function () { enquadrar(m); }, 1200); return; } catch (e) {} } // abre o cartão sem recarregar (ajustes.js)
    if (m.id != null) location.href = location.pathname + "?mapa=" + encodeURIComponent(m.id);
  }

  // ---------- pesquisa ----------
  var NIC = /^\s*([A-Za-z]{3})[\s.\-]?(\d{3})[\s.\-]?(\d{3})[\s.\-]?(\d{3})\s*$/;
  var ART = /^\s*(?:artigo|art\.?)\s*(?:matricial)?\s*(?:n\.?\s*[ºo°]?\.?)?\s*([urUR]\s*-?\s*)?(\d{1,6})\b/i;
  var SUG = { lista: [], sel: -1, passar: false };
  function interpretar(txt) {
    var s = String(txt || "").trim(), out = []; if (s.length < 2) return out;
    var c = lerCoord(s);
    if (c) out.push({ tag: c.tipo === "tm" ? "TM06" : c.tipo === "gms" ? "GMS" : "WGS84", b: t("ir") + " " + fmtGd(c),
      s: (c.tipo === "tm" ? t("coordTm") + " · M " + Math.round(c.x) + " · P " + Math.round(c.y) : c.tipo === "gms" ? t("coordGms") : t("coordGd")) + (c.nota ? " · " + c.nota : ""),
      f: function () { irPara(c); } });
    var n = NIC.exec(s);
    if (n) { var nic = (n[1] + n[2] + n[3] + n[4]).toUpperCase(); out.push({ tag: "NIC", b: nic, s: t("nic"), v: nic }); }
    var a = ART.exec(s);
    if (a) { var ur = (a[1] || "").replace(/[\s-]/g, "").toUpperCase(); out.push({ tag: en() ? "Article" : "Artigo", b: t("artigo", { a: (ur ? ur + "-" : "") + a[2] }), s: t("artigoS"), info: true }); }
    if (!c && !n) {
      var q = sAcento(s), ps = projectos().filter(function (p) { return sAcento(p.nome).indexOf(q) >= 0 || (p.m && p.m.id != null && String(p.m.id) === s.replace(/^#/, "")); }).slice(0, 6);
      ps.forEach(function (p) {
        var sub = p.tipo === "base" ? t("base") + (p.m.id != null ? " #" + p.m.id : "") : t("terreno") + (p.m.area_ha ? " · " + (+p.m.area_ha).toLocaleString(en() ? "en-GB" : "pt-PT", { maximumFractionDigits: 2 }) + " ha" : "");
        out.push({ tag: t("proj"), b: p.nome, s: sub, f: function () { abrirProjecto(p); }, proj: p });
      });
    }
    if (!c && !n && s.length >= 3) out.push({ tag: en() ? "Place" : "Local", b: t("local", { t: s }), s: "OpenStreetMap", v: s, local: true });
    return out;
  }
  function submeterApp(v) {
    var q = D.getElementById("ipe-q"), f = D.getElementById("ipe-busca"); if (!q || !f) return;
    q.value = v; SUG.passar = true; fecharSug();
    try { if (f.requestSubmit) f.requestSubmit(); else f.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true })); } catch (e) {}
    SUG.passar = false;
  }
  function fecharSug() { var u = D.getElementById("ipr-pb-sug"); if (u) { u.hidden = true; u.innerHTML = ""; } SUG.lista = []; SUG.sel = -1; var q = D.getElementById("ipe-q"); if (q) q.setAttribute("aria-expanded", "false"); }
  function mostrarSug(l) {
    var u = D.getElementById("ipr-pb-sug"), q = D.getElementById("ipe-q"); if (!u) return;
    // só vale a pena mostrar quando há algo que o app.js não sugere (coordenadas, NIC, artigo, projectos)
    if (!l.some(function (x) { return !x.local; })) { fecharSug(); return; }
    SUG.lista = l; SUG.sel = -1; SUG.valor = q ? q.value : "";
    u.innerHTML = l.map(function (x, i) {
      var h = "<i>" + esc(x.tag) + "</i><span><b>" + esc(x.b) + "</b>" + (x.s ? "<small>" + esc(x.s) + "</small>" : "") + "</span>";
      return '<li role="presentation">' + (x.info ? '<div role="note">' + h + "</div>" : '<button type="button" role="option" id="ipr-pb-o' + i + '" data-pbs="' + i + '">' + h + "</button>") + "</li>";
    }).join("");
    u.hidden = false; if (q) q.setAttribute("aria-expanded", "true");
  }
  function marcarSel(k) {
    var bs = [].slice.call(D.querySelectorAll("#ipr-pb-sug [data-pbs]")); if (!bs.length) return;
    var i = bs.map(function (b) { return +b.getAttribute("data-pbs"); }).indexOf(SUG.sel); i = (i + k + bs.length + (i < 0 && k < 0 ? 1 : 0)) % bs.length;
    bs.forEach(function (b) { b.classList.remove("on"); }); bs[i].classList.add("on"); SUG.sel = +bs[i].getAttribute("data-pbs");
    var q = D.getElementById("ipe-q"); if (q) q.setAttribute("aria-activedescendant", bs[i].id);
    try { bs[i].scrollIntoView({ block: "nearest" }); } catch (e) {}
  }
  // Clique numa sugestão: as de «Local» e «NIC» vão para o app.js pelo submit normal do formulário; as outras correm aqui.
  function correr(i) { var x = SUG.lista[i]; if (!x) return; if (x.v != null) { submeterApp(x.v); return; } if (!x.f) return; fecharSug(); try { x.f(); } catch (e) {} }

  // Liga-se à caixa que existe; se o app.js redesenhar o formulário, volta a ligar-se ao novo. O texto de exemplo da caixa
  // (placeholder) não muda: o Nuno decide depois.
  function pesquisa() {
    var f = D.getElementById("ipe-busca"), q = D.getElementById("ipe-q"); if (!f || !q) return false;
    if (!f.getAttribute("data-ipr-pb")) {
      f.setAttribute("data-ipr-pb", "1");
      q.setAttribute("aria-autocomplete", "list"); q.setAttribute("aria-controls", "ipr-pb-sug"); q.setAttribute("aria-expanded", "false");
      // botão 3D ao lado da caixa
      try {
        var b = D.getElementById("ipr-pb-3d");
        if (!b) {
          b = D.createElement("button"); b.type = "button"; b.id = "ipr-pb-3d"; b.className = "ipr-pb-3d"; b.textContent = "3D";
          b.setAttribute("aria-pressed", "false"); b.title = t("b3d"); b.setAttribute("aria-label", t("b3d"));
          b.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); carregar('[data-tool="3d"]'); setTimeout(estado, 60); });
        }
        if (b.parentNode !== f) { var gps = D.getElementById("ipe-gpsq"); if (gps && gps.parentNode === f) f.insertBefore(b, gps.nextSibling); else f.appendChild(b); }
      } catch (e) {}
      var tm = 0;
      q.addEventListener("input", function () { SUG.sel = -1; clearTimeout(tm); tm = setTimeout(function () { try { mostrarSug(interpretar(q.value)); } catch (e) {} }, 120); });
      q.addEventListener("focus", function () { try { if (q.value.trim()) mostrarSug(interpretar(q.value)); } catch (e) {} });
      q.addEventListener("blur", function () { setTimeout(fecharSug, 180); });
      q.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Enter") SUG.sel = -1; // qualquer outra tecla desfaz a escolha por setas
        if (!SUG.lista.length) return;
        if (e.key === "ArrowDown") { e.preventDefault(); marcarSel(1); }
        else if (e.key === "ArrowUp") { e.preventDefault(); marcarSel(-1); }
        else if (e.key === "Escape") { fecharSug(); }
      });
    }
    var u = D.getElementById("ipr-pb-sug");
    if (!u) {
      u = D.createElement("ul"); u.id = "ipr-pb-sug"; u.setAttribute("role", "listbox"); u.setAttribute("aria-label", t("sugest")); u.hidden = true;
      u.addEventListener("mousedown", function (e) { e.preventDefault(); }); // não tira o foco da caixa
      u.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest("[data-pbs]"); if (b) correr(+b.getAttribute("data-pbs")); });
    }
    if (u.previousSibling !== f) f.parentNode.insertBefore(u, f.nextSibling);
    return true;
  }
  // Enter: só se trata aqui o que o app.js não sabe ler (coordenadas GMS e PT-TM06 escritas com indicação explícita) e uma
  // sugestão escolhida com as setas. Escrever o nome de um projecto e carregar em Enter faz o mesmo que antes (procura o
  // sítio); o projecto só abre ao escolher a sugestão. Submissões de outros módulos (ajustes.js, guia.js) não são tocadas.
  D.addEventListener("submit", function (e) {
    try {
      var f = D.getElementById("ipe-busca"), q = D.getElementById("ipe-q");
      if (!f || !q || e.target !== f || SUG.passar) return;
      var v = q.value.trim(); if (!v) return;
      var x = SUG.sel >= 0 && q.value === SUG.valor ? SUG.lista[SUG.sel] : null;
      if (x) {
        if (x.v != null) { q.value = x.v; fecharSug(); return; } // segue o submit original, já com o valor
        if (x.f) { e.preventDefault(); e.stopPropagation(); var i = SUG.sel; correr(i); return; }
      }
      SUG.sel = -1;
      var c = lerCoord(v);
      if (c && c.tipo !== "gd") { e.preventDefault(); e.stopPropagation(); fecharSug(); irPara(c); return; }
      var n = NIC.exec(v);
      if (n) { var nic = (n[1] + n[2] + n[3] + n[4]).toUpperCase(); if (nic !== v) q.value = nic; }
      fecharSug();
    } catch (x2) {}
  }, true);
  D.addEventListener("ipr:lingua", function () { try { var b = D.getElementById("ipr-pb-3d"); if (b) { b.title = t("b3d"); b.setAttribute("aria-label", t("b3d")); } var u = D.getElementById("ipr-pb-sug"); if (u) u.setAttribute("aria-label", t("sugest")); } catch (e) {} });

  // ---------- barra de baixo ----------
  var IC = {
    medir: '<path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>',
    dist: '<circle cx="5" cy="18" r="2"/><circle cx="19" cy="6" r="2"/><path d="M6.6 16.6L17.4 7.4" stroke-dasharray="2.5 2"/>',
    area: '<path d="M4 7l7-4 9 6-3 11H6z"/>',
    desenhar: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    perfil: '<path d="M2 19l5-8 4 5 3-6 8 9z"/><path d="M2 21h20"/>',
    d3: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
    ferr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    imprimir: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="1"/><path d="M7 14h10v7H7z"/>',
    planta: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 13h7M9 17h5"/>',
    prancha: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 15l5-5 4 4 3-3 6 6"/><circle cx="16" cy="9" r="1.5"/>'
  };
  function svg(k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + IC[k] + "</svg>"; }
  var BOT = [
    { k: "medir", l: "medir", d: "medirT", menu: [{ k: "dist", l: "dist", d: "distT", sel: '[data-tool="regua"]' }, { k: "area", l: "area", d: "areaT", sel: '[data-tool="area"]' }], sels: ['[data-tool="regua"]', '[data-tool="area"]'] },
    { k: "desenhar", l: "desenhar", d: "desenharT", sel: '[data-tool="desenhar"]' },
    { k: "perfil", l: "perfil", d: "perfilT", sel: "#ipr-perfil-b" },
    { k: "d3", l: "d3", d: "d3T", sel: '[data-tool="3d"]' },
    { k: "imprimir", l: "imprimir", d: "imprimirT", menu: [{ k: "planta", l: "planta", d: "planta", f: planta }, { k: "prancha", l: "prancha", d: "prancha", sel: '[data-tool="foto"]' }] }
  ];
  function planta() {
    var P = est(), act = P && P.modo === "cliente" ? P.actual : null, id = act ? (act.encomenda || act.id) : null;
    if (id != null) {
      var b = $('#ipe [data-ppl="' + String(id).replace(/"/g, "") + '"]'); if (b) { b.click(); return; }
      if (typeof W.__iprPlanta === "function") { try { W.__iprPlanta(id); return; } catch (e) {} }
    }
    // sem projecto aberto: o mesmo caminho do arrumar.js (separador Projectos e o botão da Planta, se só houver um)
    var tab = $('#ipe .ipe-tab[data-tab="proj"]'); if (tab) tab.click();
    var bs = D.querySelectorAll("#ipe [data-ppl]");
    if (bs.length === 1) { bs[0].click(); return; }
    if (bs.length) { try { bs[0].scrollIntoView({ block: "center" }); } catch (e) {} }
    avisar(t("plantaSem"));
  }
  var MENU = null;
  function fecharMenu() { if (MENU) { MENU.hidden = true; var o = $('#ipr-pb-barra [aria-expanded="true"]'); if (o) o.setAttribute("aria-expanded", "false"); } }
  function abrirMenu(btn, def) {
    var host = btn.closest("#ipe-mapa") || btn.parentNode.parentNode;
    if (!MENU) {
      MENU = D.createElement("div"); MENU.className = "ipr-pb-menu"; MENU.id = "ipr-pb-menu"; MENU.setAttribute("role", "menu"); MENU.hidden = true;
      host.appendChild(MENU);
      MENU.addEventListener("click", function (e) {
        var b = e.target.closest && e.target.closest("[data-pbm]"); if (!b || !MENU.__def) return;
        var it = MENU.__def.menu[+b.getAttribute("data-pbm")]; fecharMenu();
        if (it.f) it.f(); else carregar(it.sel);
        setTimeout(estado, 60);
      });
      ["mousedown", "touchstart", "wheel", "dblclick"].forEach(function (ev) { MENU.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
    }
    if (!MENU.hidden && MENU.__def === def) { fecharMenu(); return; }
    MENU.__def = def;
    MENU.innerHTML = def.menu.map(function (it, i) { return '<button type="button" role="menuitem" data-pbm="' + i + '" title="' + esc(t(it.d)) + '">' + svg(it.k) + "<span>" + esc(t(it.l)) + "</span></button>"; }).join("");
    MENU.hidden = false; btn.setAttribute("aria-expanded", "true");
    var hr = MENU.offsetParent ? MENU.offsetParent.getBoundingClientRect() : { left: 0, top: 0, width: W.innerWidth, height: W.innerHeight, bottom: W.innerHeight };
    var br = btn.getBoundingClientRect(), mw = MENU.offsetWidth, mh = MENU.offsetHeight;
    var x = Math.max(8, Math.min(hr.width - mw - 8, br.left - hr.left + br.width / 2 - mw / 2));
    MENU.style.left = Math.round(x) + "px"; MENU.style.top = Math.round(Math.max(8, br.top - hr.top - mh - 8)) + "px";
    try { MENU.querySelector("button").focus({ preventScroll: true }); } catch (e) {}
  }
  function barra() {
    var host = D.getElementById("ipe-mapa"); if (!host || !mapa()) return false;
    var B = D.getElementById("ipr-pb-barra");
    if (B && B.parentNode === host) return true;
    if (!B) {
      B = D.createElement("div"); B.id = "ipr-pb-barra"; B.setAttribute("role", "toolbar"); B.className = "fechada";
      B.innerHTML = '<button type="button" data-pbt aria-expanded="false">' + svg("ferr") + "<span></span></button>" + BOT.map(function (b, i) {
        return '<button type="button" data-pbb="' + i + '"' + (b.menu ? ' aria-haspopup="menu" aria-expanded="false"' : ' aria-pressed="false"') + ">" + svg(b.k) + "<span></span></button>";
      }).join("");
      B.addEventListener("click", function (e) {
        var tg = e.target.closest && e.target.closest("[data-pbt]");
        if (tg) { e.stopPropagation(); var ab = B.classList.toggle("fechada") === false; tg.setAttribute("aria-expanded", String(ab)); fecharMenu(); textos(); setTimeout(posicionar, 0); return; }
        var b = e.target.closest && e.target.closest("[data-pbb]"); if (!b) return;
        e.stopPropagation(); var def = BOT[+b.getAttribute("data-pbb")];
        if (b.getAttribute("aria-disabled") === "true") { avisar(t("indisp")); return; }
        if (def.menu) { abrirMenu(b, def); return; }
        fecharMenu(); carregar(def.sel); setTimeout(estado, 60);
      });
      ["mousedown", "touchstart", "wheel", "dblclick"].forEach(function (ev) { B.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
      D.addEventListener("click", function (e) { if (MENU && !MENU.hidden && !MENU.contains(e.target) && !(e.target.closest && e.target.closest("#ipr-pb-barra"))) fecharMenu(); });
      D.addEventListener("keydown", function (e) { if (e.key === "Escape") fecharMenu(); });
    }
    host.appendChild(B); textos(); estado(); posicionar();
    return true;
  }
  function textos() {
    var B = D.getElementById("ipr-pb-barra"); if (!B) return;
    B.setAttribute("aria-label", t("barra"));
    var tg = B.querySelector("[data-pbt]");
    if (tg) { var ab = !B.classList.contains("fechada"); tg.querySelector("span").textContent = ab ? t("fechar") : t("ferr"); tg.setAttribute("aria-label", ab ? t("fecharT") : t("ferrT")); }
    [].forEach.call(B.querySelectorAll("[data-pbb]"), function (b) {
      var def = BOT[+b.getAttribute("data-pbb")]; b.querySelector("span").textContent = t(def.l);
      b.setAttribute("aria-label", t(def.d)); b.setAttribute("data-ipr-tip", t(def.d));
    });
    if (MENU) fecharMenu();
  }
  function premido(el) { return !!el && (el.getAttribute("aria-pressed") === "true" || el.classList.contains("on") || el.classList.contains("activo") || el.classList.contains("ativo")); }
  function estado() {
    try {
      var B = D.getElementById("ipr-pb-barra"), P = est();
      if (B) [].forEach.call(B.querySelectorAll("[data-pbb]"), function (b) {
        var def = BOT[+b.getAttribute("data-pbb")];
        if (def.k === "imprimir") return;
        var els = (def.sels || [def.sel]).map(ferr), algum = els.some(function (x) { return x && !x.disabled; });
        b.setAttribute("aria-disabled", algum ? "false" : "true");
        var on = def.k === "d3" ? !!(P && P.em3d) : els.some(premido);
        if (def.menu) b.classList.toggle("on", on); else b.setAttribute("aria-pressed", String(on));
        if (def.menu) b.setAttribute("data-on", on ? "1" : "0");
      });
      var t3 = D.getElementById("ipr-pb-3d");
      if (t3) { var on3 = !!(P && P.em3d); t3.setAttribute("aria-pressed", String(on3)); var tt = on3 ? t("b3dOff") : t("b3d"); if (t3.getAttribute("aria-label") !== tt) { t3.title = tt; t3.setAttribute("aria-label", tt); } }
    } catch (e) {}
  }

  // Obstáculos que a barra não pode tapar. A barra procura espaço livre na faixa de baixo do mapa; se não houver, fica só com
  // ícones; se ainda não couber, sobe por cima do obstáculo mais alto que a cruza.
  var OBST = ["#ipe-hud", "#ipe .ipe-dir", "#ipe-esq", "#ipr-lgd", "#tcdfmb", "#ipr-pf", "#ipe .maplibregl-ctrl-bottom-left", "#ipe .maplibregl-ctrl-bottom-right", "#tcdck-l", "#ipe .ipe-tools", "#ipr-av62", "#ipe-st", "#tcdfm"];
  function rectsObst(B) {
    var out = [];
    OBST.forEach(function (s) {
      [].forEach.call(D.querySelectorAll(s), function (el) {
        if (el === B || B.contains(el) || el.contains(B) || !vis(el)) return;
        if (s.indexOf("maplibregl-ctrl-bottom") >= 0) { // contentor vazio ou só com a escala: conta cada controlo
          [].forEach.call(el.children, function (c) { if (vis(c)) out.push(c.getBoundingClientRect()); }); return;
        }
        out.push(el.getBoundingClientRect());
      });
    });
    return out;
  }
  function posicionar() {
    var B = D.getElementById("ipr-pb-barra"), M = mapa(); if (!B || !M || !B.offsetParent) return;
    try {
      var ipe = D.getElementById("ipe"), dir = ipe && ipe.querySelector(".ipe-dir");
      var tapado = movel() && ipe && (ipe.classList.contains("esq-aberto") || (dir && dir.classList.contains("aberto")));
      B.style.visibility = tapado ? "hidden" : "";
      if (tapado) return;
      var cv = M.getContainer().getBoundingClientRect(), pai = B.offsetParent.getBoundingClientRect();
      if (cv.width < 160 || cv.height < 160) return;
      var mob = movel(), base = 12;
      B.classList.toggle("rola", mob); B.style.maxWidth = Math.round(cv.width - 16) + "px";
      function testa(icones) {
        B.classList.toggle("so-icones", icones);
        var w = Math.min(B.scrollWidth + 2, cv.width - 16), h = B.offsetHeight;
        var fundoV = cv.bottom - base, topoV = fundoV - h, obs = rectsObst(B);
        // espaço livre horizontal na faixa [topoV - 6, fundoV + 6]
        var esq = cv.left + 8, dirx = cv.right - 8, meio = cv.left + cv.width / 2;
        var cruzam = obs.filter(function (r) { return r.bottom > topoV - 6 && r.top < fundoV + 6 && r.right > cv.left && r.left < cv.right; });
        cruzam.forEach(function (r) { var c = (r.left + r.right) / 2; if (c < meio) esq = Math.max(esq, r.right + 8); else dirx = Math.min(dirx, r.left - 8); });
        if (dirx - esq >= w) {
          var x = Math.max(esq, Math.min(dirx - w, meio - w / 2));
          return { x: x, bottom: base, w: w };
        }
        return null;
      }
      var p = testa(mob) || (!mob && testa(true));
      if (!p) { // sobe acima do que cruza o centro (no computador volta a ter os nomes: ao subir já não falta largura)
        B.classList.toggle("so-icones", mob || B.scrollWidth > cv.width - 16);
        var w = Math.min(B.scrollWidth + 2, cv.width - 16), x0 = cv.left + cv.width / 2 - w / 2, sobe = base;
        for (var k = 0; k < 4; k++) {
          var fundoV = cv.bottom - sobe, topoV = fundoV - B.offsetHeight, mx = 0;
          rectsObst(B).forEach(function (r) { if (r.right > x0 && r.left < x0 + w && r.bottom > topoV - 6 && r.top < fundoV + 6) mx = Math.max(mx, cv.bottom - r.top + 8); });
          if (!mx || mx <= sobe) break; sobe = mx;
        }
        p = { x: x0, bottom: Math.min(sobe, cv.height - B.offsetHeight - 60), w: w };
      }
      B.style.left = Math.round(p.x - pai.left) + "px";
      B.style.transform = "none";
      B.style.bottom = Math.round(pai.bottom - cv.bottom + p.bottom) + "px";
      if (MENU && !MENU.hidden) { var o = $('#ipr-pb-barra [aria-expanded="true"]'); if (o) { var br = o.getBoundingClientRect(), mr = MENU.offsetParent.getBoundingClientRect(); MENU.style.top = Math.round(Math.max(8, br.top - mr.top - MENU.offsetHeight - 8)) + "px"; } }
    } catch (e) {}
  }

  // ---------- reporte 17041: caixa #ipe-hud sempre à vista ----------
  var HUD_OCUPADO = false;
  function hudVisivel() {
    if (HUD_OCUPADO) return; HUD_OCUPADO = true;
    try {
      var h = D.getElementById("ipe-hud"), M = mapa(); if (!h || !M) return;
      if (!h.classList.contains("on") || getComputedStyle(h).display === "none") {
        if (h.__iprPb) { h.style.removeProperty("bottom"); h.style.removeProperty("z-index"); h.__iprPb = 0; }
        return;
      }
      var cv = M.getContainer().getBoundingClientRect();
      // 2) a caixa saiu do mapa (barra de estado ou mudança de zoom do ecrã) ou ficou por baixo de outra coisa: sobe
      if (h.__iprPb) { h.style.removeProperty("bottom"); h.style.removeProperty("z-index"); h.__iprPb = 0; }
      var rh2 = h.getBoundingClientRect(), sobe = 0;
      if (rh2.bottom > cv.bottom - 4) sobe = rh2.bottom - (cv.bottom - 10);
      var pts = [[rh2.left + 12, rh2.top + 8], [rh2.right - 12, rh2.top + 8], [rh2.left + rh2.width / 2, rh2.top + rh2.height / 2], [rh2.left + 12, rh2.bottom - 8], [rh2.right - 12, rh2.bottom - 8]];
      var subir = false;
      pts.forEach(function (p) {
        if (p[1] > cv.bottom || p[1] < cv.top) return;
        var el = D.elementFromPoint(p[0], p[1]); if (!el || h.contains(el)) return;
        if (el.closest && (el.closest(".maplibregl-canvas-container") || el.tagName === "CANVAS")) { subir = true; return; } // a caixa ficou por trás do mapa
        if (el.closest && (el.closest(".iprv-aviso") || el.closest("#ipr-pb-barra") || el.closest(".ipr-pb-menu") || el.closest("#ipr-pb-tip") || el.closest(".ipr-tip"))) return;
        var c = el.closest ? (el.closest("#ipr-lgd,#tcdfmb,#tcdfm,#ipr-pf,#ipe-st,.maplibregl-ctrl,#tcdck-l,#ipr-av62") || null) : null;
        if (c) { var rc = c.getBoundingClientRect(); sobe = Math.max(sobe, rh2.bottom - rc.top + 8); }
      });
      if (sobe > 0 || subir) {
        var cb = parseFloat(getComputedStyle(h).bottom) || 0;
        if (sobe > 0) h.style.setProperty("bottom", Math.round(Math.min(cb + sobe, cv.height - rh2.height - 8)) + "px", "important");
        if (subir) h.style.setProperty("z-index", "9", "important");
        h.__iprPb = 1;
      }
    } catch (e) {} finally { HUD_OCUPADO = false; }
  }

  // O aviso do viz.js (.iprv-aviso, z-index 7, ao centro em baixo) não fica por cima da caixa #ipe-hud nem da barra de baixo:
  // enquanto está aberto, sobe para cima delas; ao fechar, volta ao sítio dele.
  function avisoLivre() {
    try {
      [].forEach.call(D.querySelectorAll("#ipe .iprv-aviso"), function (a) {
        if (a.__iprPb) { a.style.removeProperty("bottom"); a.__iprPb = 0; }
        if (!a.classList.contains("on") || getComputedStyle(a).display === "none") return;
        var h = D.getElementById("ipe-hud"), B = D.getElementById("ipr-pb-barra"), obs = [];
        if (h && h.classList.contains("on") && vis(h)) obs.push(h); if (B && vis(B)) obs.push(B);
        var pai = (a.offsetParent || D.body).getBoundingClientRect();
        for (var k = 0; k < 3; k++) {
          var r = a.getBoundingClientRect(), mx = null;
          obs.forEach(function (o) { var q = o.getBoundingClientRect(); if (r.right > q.left && r.left < q.right && r.bottom > q.top && r.top < q.bottom) mx = mx == null ? q.top : Math.min(mx, q.top); });
          if (mx == null) break;
          a.style.setProperty("bottom", Math.round(pai.bottom - mx + 8) + "px", "important"); a.__iprPb = 1;
        }
      });
    } catch (e) {}
  }

  // ---------- reporte 17047: nomes e dicas na barra da direita ----------
  var NOMES = {
    pt: { nav: "Navegar e identificar", regua: "Medir: caminho e distância", area: "Medir: polígono e área", desenhar: "Desenhar o terreno", visita: "Pedir visita técnica", lado: "Barra lateral", marcador: "Adicionar marcador", parcelas: "Escolher parcelas do cadastro", importar: "Importar limite do terreno", historico: "Imagens históricas", sol: "Sol: luz e sombra", "3d": "Relevo 3D", foto: "Exportar prancha (PNG)", gps: "A minha localização" },
    en: { nav: "Navigate and identify", regua: "Measure: path and distance", area: "Measure: polygon and area", desenhar: "Draw the plot", visita: "Request a site visit", lado: "Side bar", marcador: "Add marker", parcelas: "Pick cadastre parcels", importar: "Import plot boundary", historico: "Historical imagery", sol: "Sun: light and shadow", "3d": "3D relief", foto: "Export sheet (PNG)", gps: "My location" }
  };
  var RAIL = "#ipe .ipe-tools button, #ipe .ipe-tools [role=button], #ipe .maplibregl-ctrl-top-right button, #ipe .maplibregl-ctrl-bottom-right button";
  function nomeBotao(b) {
    var n = b.getAttribute("aria-label") || b.getAttribute("data-ipr-tip") || b.getAttribute("title") || "";
    if (n) return n.trim();
    var sp = b.querySelector(".ipe-tip"); if (sp) { var c = sp.cloneNode(true); [].forEach.call(c.querySelectorAll("kbd"), function (k) { k.remove(); }); n = (c.textContent || "").trim(); }
    if (!n) { var tool = b.getAttribute("data-tool"); if (tool) n = (en() ? NOMES.en : NOMES.pt)[tool] || ""; }
    if (!n) n = (b.textContent || "").replace(/\s+/g, " ").trim();
    return n;
  }
  function rotular() {
    try {
      [].forEach.call(D.querySelectorAll(RAIL), function (b) {
        var n = nomeBotao(b); if (!n) return;
        if (!b.getAttribute("aria-label")) b.setAttribute("aria-label", n);
      });
    } catch (e) {}
  }
  // Dica visível onde a do ajustes.js não actua: toque longo (iPad, telemóvel), rato em ecrãs que se dizem tácteis, e a
  // barra de baixo quando está só com ícones.
  (function dicas() {
    var hoverAj = false; try { hoverAj = W.matchMedia && W.matchMedia("(hover:hover)").matches; } catch (e) {}
    var tip = null, tTip = 0, tLong = 0;
    function alvo(e, toque) {
      var b = e.target && e.target.closest && e.target.closest(RAIL + ", #ipr-pb-barra>button, #ipr-pb-3d"); if (!b) return null;
      var minha = !!b.closest("#ipr-pb-barra") || b.id === "ipr-pb-3d";
      if (minha) { if (!toque && b.closest("#ipr-pb-barra") && !b.closest("#ipr-pb-barra").classList.contains("so-icones") && b.id !== "ipr-pb-3d") return null; return b; }
      if (!toque && hoverAj) return null; // o ajustes.js já mostra a dica com rato
      return b;
    }
    function mostrar(b, ms) {
      var tx = b.getAttribute("data-ipr-tip") || b.getAttribute("title") || b.getAttribute("aria-label") || nomeBotao(b); if (!tx) return;
      if (!tip) { tip = D.createElement("div"); tip.id = "ipr-pb-tip"; tip.className = "ipr-tip"; tip.setAttribute("role", "tooltip"); D.body.appendChild(tip); }
      tip.textContent = tx.split(". ")[0]; tip.style.left = "0px"; tip.style.top = "0px"; tip.classList.add("on");
      var r = b.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight, x, y;
      if (b.closest("#ipr-pb-barra")) { x = r.left + r.width / 2 - w / 2; y = r.top - h - 8; }
      else { x = r.left - w - 8; y = r.top + r.height / 2 - h / 2; if (x < 4) { x = r.left + r.width / 2 - w / 2; y = r.bottom + 8; } }
      tip.style.left = Math.round(Math.max(4, Math.min(W.innerWidth - w - 4, x))) + "px"; tip.style.top = Math.round(Math.max(4, Math.min(W.innerHeight - h - 4, y))) + "px";
      clearTimeout(tTip); if (ms) tTip = setTimeout(esconder, ms);
    }
    function esconder() { if (tip) tip.classList.remove("on"); }
    D.addEventListener("pointerover", function (e) { try { if (e.pointerType !== "mouse") return; var b = alvo(e, false); if (b) mostrar(b, 0); } catch (x) {} });
    D.addEventListener("pointerout", function (e) { try { if (e.pointerType === "mouse" && e.target.closest && e.target.closest(RAIL + ", #ipr-pb-barra>button, #ipr-pb-3d")) esconder(); } catch (x) {} });
    D.addEventListener("pointerdown", function (e) {
      try { if (e.pointerType === "mouse") { esconder(); return; } var b = alvo(e, true); if (!b) return; clearTimeout(tLong); tLong = setTimeout(function () { mostrar(b, 2200); }, 450); } catch (x) {}
    }, true);
    ["pointerup", "pointercancel", "pointermove"].forEach(function (ev) { D.addEventListener(ev, function (e) { if (ev !== "pointermove" || Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0) > 6) clearTimeout(tLong); }, true); });
    D.addEventListener("scroll", esconder, true);
  })();

  // ---------- arranque ----------
  var feito = { p: false, b: false, ev: false };
  function ciclo() {
    try { feito.p = pesquisa(); } catch (e) {}
    try { feito.b = barra(); } catch (e) {}
    try { rotular(); } catch (e) {}
    try { estado(); } catch (e) {}
    try { posicionar(); } catch (e) {}
    try { hudVisivel(); } catch (e) {}
    try { avisoLivre(); } catch (e) {}
    try {
      var M = mapa();
      if (M && !feito.ev) {
        feito.ev = true;
        ["zoomend", "resize", "pitchend"].forEach(function (ev) { M.on(ev, function () { setTimeout(function () { estado(); posicionar(); hudVisivel(); avisoLivre(); }, 80); }); });
        var h = D.getElementById("ipe-hud");
        if (h) try { new MutationObserver(function () { clearTimeout(ciclo.t); ciclo.t = setTimeout(function () { posicionar(); hudVisivel(); avisoLivre(); }, 40); }).observe(h, { attributes: true, attributeFilter: ["class", "hidden"], childList: true, subtree: true }); } catch (e) {} // o style não se observa: é ele que se muda aqui
        [].forEach.call(D.querySelectorAll("#ipe .iprv-aviso"), function (a) {
          try { new MutationObserver(function () { clearTimeout(ciclo.a); ciclo.a = setTimeout(avisoLivre, 20); }).observe(a, { attributes: true, attributeFilter: ["class"] }); } catch (e) {}
        });
        var bar = $("#ipe .ipe-tools");
        if (bar) try { new MutationObserver(function () { clearTimeout(ciclo.e); ciclo.e = setTimeout(function () { estado(); rotular(); }, 40); }).observe(bar, { attributes: true, attributeFilter: ["aria-pressed", "class", "disabled"], childList: true, subtree: true }); } catch (e) {}
      }
    } catch (e) {}
  }
  W.addEventListener("resize", function () { clearTimeout(ciclo.r); ciclo.r = setTimeout(function () { posicionar(); hudVisivel(); avisoLivre(); }, 120); });
  D.addEventListener("ipr:lingua", function () { setTimeout(function () { try { textos(); rotular(); } catch (e) {} }, 0); });
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", ciclo); else ciclo();
  setInterval(function () { if (!D.hidden) ciclo(); }, 900);
  W.__iprPesquisaBarraAPI = { lerCoord: lerCoord, tmInv: tmInv, interpretar: interpretar }; // para ensaios
})();
