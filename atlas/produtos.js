/* IPR Atlas · Produtos no bloco da esquerda (pedido do Nuno, 29/10/2026, 19h01 e 19h06: «no Atlas tenha lá a facilidade em
   aceder àqueles produtos, planta de localização, leitura territorial, base cartográfica e encomendar bases cartográficas
   [...] mesmo quando uma pessoa é utilizador avançado»).
   Uma secção «Produtos» no bloco da esquerda, logo a seguir à pesquisa, sempre à vista (sem conta, Explorer, Intelligence e
   administração), recolhível (fica guardado neste navegador). Quatro entradas, todas pelos caminhos que o Atlas já tem:
   1. Planta de localização: o diálogo do ajustes.js (§55/§61, window.__iprPlanta) para um projecto da pessoa. Com um só
      projecto abre logo; com vários, escolhe-se aqui (o aberto no mapa primeiro). Sem conta: explica e leva a entrar.
   2. Leitura Territorial: para a Base aberta no mapa, a ficha do terreno do cartão do projecto (botão «Encomendar a Leitura
      Territorial deste terreno» do app.js, separador «No mapa» do ficha.js); para um terreno novo, o formulário de encomenda
      com «Juntar a Leitura Territorial» marcado (o mesmo que o §62 faz). A lista «Terrenos guardados» do app.js está
      desligada em produção, por isso não entra aqui.
   3. Base Cartográfica: com Bases, abre «Os meus projectos» (minhas-bases.js, #ipr-mb) na secção «Os meus locais»; sem
      Bases, diz o que é e leva à encomenda.
   4. Encomendar Base Cartográfica: o separador de encomenda do Atlas (o mesmo que /atlas/?modo=encomenda).
   Não mexe no app.js, no ajustes.js nem nos outros add-ons: só DOM e window.__ipe. Texto escapado (textContent).
   Desligar: window.IPR_PRODUTOS_OFF = true antes de carregar, ou ?produtos=0 no endereço. */
(function () {
  "use strict";
  if (window.__iprProdutos || window.IPR_PRODUTOS_OFF) return;
  window.__iprProdutos = 1;
  try { if (new URLSearchParams(location.search).get("produtos") === "0") return; } catch (e) {}

  var CHAVE = "ipr_produtos_v1";
  var TX = {
    pt: {
      titulo: "Produtos",
      planta: "Planta de localização", plantaT: "PDF à escala, em A4 ou A3, sobre o ortofotomapa da DGT, a partir de um projecto seu.",
      leitura: "Leitura Territorial", leituraT: "Relatório PDF do terreno: condicionantes, água, fogo, ocupação do solo e mapas.",
      base: "Base Cartográfica", baseT: "Relevo do terreno a partir do LiDAR da DGT, no Atlas e em ficheiros para SIG.",
      enc: "Encomendar Base", encT: "Indicar o terreno e encomendar a Base Cartográfica.",
      fechar: "Fechar",
      entrar: "Entrar ou criar conta",
      plantaSemConta: "A planta de localização faz-se a partir de um terreno de um projecto seu. Entre na sua conta para a fazer.",
      plantaSem: "A planta de localização faz-se a partir de um terreno de um projecto seu. Ainda não tem projectos: comece por encomendar a Base Cartográfica.",
      plantaVarios: "Escolha o projecto para a planta de localização:",
      aCarregar: "A carregar os seus projectos…",
      aberto: "aberto no mapa", semNome: "Terreno sem nome",
      leituraQual: "Para que terreno quer a Leitura Territorial?",
      ltBase: "Para o terreno aberto no mapa", ltNovo: "Para um terreno novo",
      baseO: "Levantamento do relevo do seu terreno a partir do LiDAR da DGT: curvas de nível de 0,5 m, declives, linhas de água, acumulação de escoamento, bacias e erosão. Fica no IPR Atlas, em 3D, e em ficheiros para SIG e QField.",
      encBase: "Encomendar a Base Cartográfica", exemplo: "Ver o projecto exemplo"
    },
    en: {
      titulo: "Products",
      planta: "Location plan", plantaT: "A scaled PDF, A4 or A3, on the DGT orthophoto, made from one of your projects.",
      leitura: "Land Reading", leituraT: "PDF report on the plot: constraints, water, fire, land cover and maps.",
      base: "Base Map", baseT: "The terrain of your plot from DGT LiDAR, in the Atlas and as GIS files.",
      enc: "Order a Base Map", encT: "Mark your plot and order the Base Map.",
      fechar: "Close",
      entrar: "Sign in or create an account",
      plantaSemConta: "The location plan is made from a plot in one of your projects. Sign in to make it.",
      plantaSem: "The location plan is made from a plot in one of your projects. You have no projects yet: start by ordering the Base Map.",
      plantaVarios: "Choose the project for the location plan:",
      aCarregar: "Loading your projects…",
      aberto: "open on the map", semNome: "Unnamed site",
      leituraQual: "Which plot is the Land Reading for?",
      ltBase: "For the plot open on the map", ltNovo: "For a new plot",
      baseO: "A terrain survey of your plot from DGT LiDAR: 0.5 m contour lines, slopes, watercourses, flow accumulation, catchments and erosion. It stays in the IPR Atlas, in 3D, and comes as files for GIS and QField.",
      encBase: "Order the Base Map", exemplo: "See the example project"
    }
  };
  function lg() { return (window.IPR_LINGUA || "pt") === "en" ? "en" : "pt"; }
  function t(k) { return TX[lg()][k] || TX.pt[k]; }

  function ler() { try { return JSON.parse(localStorage.getItem(CHAVE) || "null") || {}; } catch (e) { return {}; } }
  function gravar(o) { try { localStorage.setItem(CHAVE, JSON.stringify(o)); } catch (e) {} }
  var MEM = ler();

  function sessao() { return !!window.tcdNonce; }
  function est() { return window.__ipe && window.__ipe.estado || null; }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = String(txt); return e; }
  function sel(v) { return window.CSS && CSS.escape ? CSS.escape(String(v)) : String(v).replace(/["\\]/g, ""); }
  function raiz() { return document.getElementById("ipe"); }
  function movel() { return window.innerWidth <= 900; }
  function entrarUrl() { return "/conta/?redirect_to=" + encodeURIComponent(location.pathname + location.search); }
  function visivel(e) { return !!(e && e.getClientRects().length && getComputedStyle(e).display !== "none"); }

  // ---------- caminhos do próprio Atlas ----------
  function fecharEsquerdaMovel() {
    var R = raiz(); if (!movel() || !R || !R.classList.contains("esq-aberto")) return;
    var b = R.querySelector('[data-tool="lado"]'); if (b) b.click();
  }
  // Abre um separador do painel da direita como a pessoa faria (no telemóvel, fecha antes a gaveta da esquerda).
  function abrirDireita(tab) {
    var R = raiz(), b = R && R.querySelector('.ipe-tab[data-tab="' + sel(tab) + '"]'); if (!b) return false;
    fecharEsquerdaMovel();
    var dir = document.getElementById("ipe-dir");
    // no telemóvel, carregar no separador já escolhido com o painel aberto fecha-o: aí não se carrega
    if (!(movel() && b.getAttribute("aria-selected") === "true" && dir && dir.classList.contains("aberto"))) b.click();
    if (!movel() && R.classList.contains("sem-dir")) { var pn = document.getElementById("ipe-pn"); if (pn) pn.click(); }
    return true;
  }
  function luz(e) {
    if (!e) return;
    var ver = function () { try { e.scrollIntoView({ block: "center" }); } catch (x) { try { e.scrollIntoView(); } catch (y) {} } };
    ver();
    // o painel ainda pode crescer por cima (ficha a terminar, imagens): volta a pôr à vista se saiu
    setTimeout(function () { var r = e.getBoundingClientRect(); if (r.bottom < 0 || r.top > window.innerHeight || r.top < 40) ver(); }, 900);
    e.classList.add("ipr-pd-luz"); clearTimeout(e.__iprPdT); e.__iprPdT = setTimeout(function () { e.classList.remove("ipr-pd-luz"); }, 2400);
  }
  function esperarPor(fn, limite, feito) {
    var t0 = Date.now();
    (function v() { var r = null; try { r = fn(); } catch (e) {} if (r) { feito(r); return; } if (Date.now() - t0 < (limite || 6000)) setTimeout(v, 200); })();
  }
  function encomendar() {
    if (!abrirDireita("enc")) { location.href = "/atlas/?modo=encomenda"; return; }
    // separador «Base Cartográfica» dentro de Processos/Encomendar (o mesmo que o §62 do ajustes.js)
    setTimeout(function () {
      var sb = [].filter.call(document.querySelectorAll('#ipe [data-pane="enc"] button, #ipe .ipe-tab2 button'), function (b) { return /^(Base Cartogr|Base Map$)/.test(b.textContent.trim()) && visivel(b); })[0];
      if (sb && sb.getAttribute("aria-pressed") !== "true" && sb.getAttribute("aria-selected") !== "true" && !sb.classList.contains("on")) sb.click();
      var f = document.getElementById("ipe-form"); if (f) try { f.scrollIntoView({ block: "start" }); } catch (e) {}
    }, 120);
  }
  function mapasDaPessoa() {
    var P = est(); if (!P || !P.dados) return null; // ainda a carregar
    if (P.dados.bloqueado) return [];
    var act = P.modo === "cliente" ? P.actual : null;
    var l = (P.mapas || []).filter(function (m) { return m && m.geojson && (!m.rever || m === act); });
    if (act) l.sort(function (a, b) { return (b === act) - (a === act); });
    return l;
  }
  function idPlanta(m) { return m.encomenda || m.id; }
  function fazerPlanta(m) {
    if (typeof window.__iprPlanta === "function") { fecharEsquerdaMovel(); window.__iprPlanta(idPlanta(m)); }
    else abrirDireita("proj");
  }
  function actualSemLeitura() {
    var P = est(); if (!P || P.modo !== "cliente" || !P.actual || !P.actual.geojson) return null;
    var temLt = (P.actual.downloads || []).some(function (d) { return /Leitura_Territorial/i.test(String(d && d.nome || "")); });
    return temLt ? null : P.actual;
  }
  // Leitura para a Base aberta: a ficha do terreno do cartão do projecto traz «Encomendar a Leitura Territorial deste terreno».
  function leituraBase(m) {
    var P = est(), i = P && P.mapas ? P.mapas.indexOf(m) : -1;
    abrirDireita("proj");
    if (i < 0) return;
    // O cartão do projecto aberto, como a pessoa: tocar na barra abre-a (barras recolhidas do §33; com ?mapa= no endereço o
    // primeiro toque às vezes não fica), e no cartão o separador «No mapa» do ficha.js, onde está a ficha do terreno.
    var n = 0;
    (function v() {
      var card = document.querySelector('#ipe-proj .ipe-card[data-i="' + i + '"]'), b = card && card.querySelector("[data-res-proj]");
      if (!card || !b || n++ > 8) return;
      if (!card.classList.contains("on")) { var cc = card.querySelector(":scope > .ipe-cc"); if (cc && n % 2 === 1) cc.click(); setTimeout(v, 500); return; }
      var sep = card.querySelector(':scope > .ipr-fk-t button[data-fk-b="mapa"]');
      if (sep && sep.getAttribute("aria-selected") !== "true") sep.click();
      if (visivel(b) || card.querySelector("[data-ipr-ficha]")) { ficha(i, b); return; } // equipa: a ficha passa para os ficheiros (§16)
      setTimeout(v, 300);
    })();
  }
  function ficha(i, b) {
    var out = document.querySelector('#ipe [data-res-out="' + i + '"]');
    var lt = function () { var x = document.querySelector('#ipe [data-res-lt="' + i + '"]'); return x && visivel(x) ? x : null; };
    if (lt()) { luz(lt()); return; }
    if (out && !out.children.length && !b.disabled) b.click(); // a ficha é gratuita; prepara-a como o botão faz
    luz(visivel(b) ? b : out);
    esperarPor(lt, 30000, luz);
  }
  function leituraNova() {
    encomendar();
    esperarPor(function () { var c = document.querySelector('#ipe-form input[name="leitura"]'); return c && visivel(c) ? c : null; }, 6000, function (c) {
      if (!c.checked) c.click();
      luz(c.closest("label") || c);
    });
  }
  function abrirMinhasBases() {
    var mb = document.getElementById("ipr-mb");
    if (!mb || mb.hidden) { abrirDireita("proj"); return; }
    var sec = mb.closest(".ipe-sb");
    if (sec && sec.classList.contains("fechado")) { var h = sec.querySelector(".ipe-sbh"); if (h) h.click(); } // como a pessoa: fica guardado pelo Atlas
    luz(mb);
  }

  // ---------- desenho ----------
  var IC = {
    planta: "M6 3h9l4 4v14H6zM15 3v4h4M12.5 17s-2.5-2.4-2.5-4.2a2.5 2.5 0 0 1 5 0c0 1.8-2.5 4.2-2.5 4.2z",
    leitura: "M5 3h11l3 3v15H5zM8 9h8M8 13h8M8 17h5",
    base: "M12 3l9 5-9 5-9-5zM3 12.5l9 5 9-5M3 16.5l9 5 9-5",
    enc: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8v8M8 12h8"
  };
  function icone(d) {
    var ns = "http://www.w3.org/2000/svg", s = document.createElementNS(ns, "svg"), p = document.createElementNS(ns, "path");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("width", "16"); s.setAttribute("height", "16"); s.setAttribute("aria-hidden", "true");
    s.setAttribute("fill", "none"); s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", "1.6"); s.setAttribute("stroke-linejoin", "round"); s.setAttribute("stroke-linecap", "round");
    p.setAttribute("d", d); s.appendChild(p); return s;
  }
  var ESTILO =
    "#ipr-pd{flex:none}" +
    "#ipr-pd>.ipe-sbh{text-transform:none;letter-spacing:0;font:600 13px/1 Inter,system-ui,sans-serif;padding:9px 12px}" +
    "#ipr-pd .ipr-pd-c{padding:2px 10px 10px}" +
    "#ipr-pd.fechado .ipr-pd-c{display:none}" +
    "#ipr-pd .ipr-pd-g{display:grid;grid-template-columns:1fr 1fr;gap:6px}" +
    "#ipr-pd .ipr-pd-b{display:flex;align-items:center;gap:7px;min-height:40px;padding:6px 8px;text-align:left;border:1px solid var(--ln);border-radius:9px;background:var(--p2);color:var(--tx);font:500 12.5px/1.25 Inter,system-ui,sans-serif;cursor:pointer;overflow-wrap:anywhere;hyphens:auto}" +
    "#ipr-pd .ipr-pd-b svg{flex:none;color:var(--ac)}" +
    "#ipr-pd .ipr-pd-b:hover{border-color:var(--ln2)}" +
    "#ipr-pd .ipr-pd-b:focus-visible,#ipr-pd .ipr-pd-a:focus-visible,#ipr-pd .ipr-pd-x:focus-visible{outline:2px solid var(--ac);outline-offset:1px}" +
    "#ipr-pd .ipr-pd-b[aria-expanded=true]{border-color:var(--ac);background:var(--acs)}" +
    "#ipr-pd .ipr-pd-d{position:relative;margin-top:6px;padding:8px 26px 8px 9px;border:1px solid var(--ln);border-radius:9px;background:var(--p2);font:12px/1.45 Inter,system-ui,sans-serif;color:var(--mu)}" +
    "#ipr-pd .ipr-pd-d[hidden]{display:none}" +
    "#ipr-pd .ipr-pd-d p{margin:0 0 6px}" +
    "#ipr-pd .ipr-pd-x{position:absolute;top:3px;right:3px;width:22px;height:22px;border:0;border-radius:6px;background:transparent;color:var(--mu);font:16px/1 Inter,system-ui,sans-serif;cursor:pointer}" +
    "#ipr-pd .ipr-pd-x:hover{color:var(--tx)}" +
    "#ipr-pd .ipr-pd-l{display:flex;flex-direction:column;gap:4px;max-height:180px;overflow-y:auto;overscroll-behavior:contain}" +
    "#ipr-pd .ipr-pd-a{display:block;width:100%;text-align:left;border:1px solid var(--ln);border-radius:7px;background:transparent;color:var(--tx);padding:6px 8px;font:600 12px/1.3 Inter,system-ui,sans-serif;cursor:pointer;text-decoration:none;box-sizing:border-box}" +
    "#ipr-pd .ipr-pd-a:hover{border-color:var(--ac);color:var(--ac2)}" +
    "#ipr-pd .ipr-pd-a.ac{background:var(--ac);border-color:var(--ac);color:var(--bg)}" +
    "#ipr-pd .ipr-pd-a.ac:hover{color:var(--bg);filter:brightness(1.06)}" +
    "#ipr-pd .ipr-pd-a small{display:block;font:400 11px/1.3 var(--mono,monospace);color:var(--mu);margin-top:1px}" +
    "#ipr-pd .ipr-pd-a small i{font-style:normal;color:var(--ac2)}" +
    ".ipr-pd-luz{outline:2px solid var(--ac,#94BE39)!important;outline-offset:2px;border-radius:6px;transition:outline-color .3s}" +
    "@media (max-width:600px){#ipr-pd .ipr-pd-b{min-height:44px;font-size:13px}#ipr-pd .ipr-pd-a{padding:9px 10px;font-size:13px}#ipr-pd .ipr-pd-x{width:32px;height:32px}}";

  var ENTRADAS = ["planta", "leitura", "base", "enc"];
  var ABERTA = null; // entrada com o pormenor aberto

  function montar() {
    var esq = document.getElementById("ipe-esq"); if (!esq) return null;
    var busca = esq.querySelector('.ipe-sb[data-sb="busca"]'), locais = esq.querySelector('.ipe-sb[data-sb="locais"]');
    if (!busca && !locais) return null;
    if (!document.getElementById("ipr-pd-css")) { var s = el("style"); s.id = "ipr-pd-css"; s.textContent = ESTILO; document.head.appendChild(s); }
    var sec = document.getElementById("ipr-pd");
    if (!sec) {
      sec = el("section", "ipe-sb ipr-pd"); sec.id = "ipr-pd"; sec.setAttribute("data-sb", "produtos");
      sec.addEventListener("click", aoClicar);
      sec.addEventListener("keydown", function (e) { if (e.key === "Escape" && ABERTA) { var b = sec.querySelector('[data-pd="' + ABERTA + '"]'); fecharDet(); if (b) try { b.focus(); } catch (x) {} } });
      desenhar(sec);
    }
    if (sec.parentNode !== esq) esq.insertBefore(sec, busca ? busca.nextElementSibling : locais);
    return sec;
  }
  var LG = "";
  function desenhar(sec) {
    LG = lg();
    var ab = MEM.f !== 1;
    sec.classList.toggle("fechado", !ab);
    sec.setAttribute("aria-label", t("titulo"));
    sec.textContent = "";
    var h = el("button", "ipe-sbh"); h.type = "button"; h.setAttribute("data-pd-h", "1"); h.setAttribute("aria-expanded", String(ab)); h.setAttribute("aria-controls", "ipr-pd-c");
    h.appendChild(el("span", "ipe-car")); h.appendChild(document.createTextNode(t("titulo")));
    sec.appendChild(h);
    var c = el("div", "ipr-pd-c"); c.id = "ipr-pd-c";
    var g = el("div", "ipr-pd-g"); g.setAttribute("role", "group"); g.setAttribute("aria-label", t("titulo"));
    ENTRADAS.forEach(function (k) {
      var b = el("button", "ipr-pd-b"); b.type = "button"; b.setAttribute("data-pd", k); b.title = t(k + "T");
      b.setAttribute("aria-expanded", "false"); b.setAttribute("aria-controls", "ipr-pd-d");
      b.appendChild(icone(IC[k])); b.appendChild(el("span", "", t(k)));
      g.appendChild(b);
    });
    c.appendChild(g);
    var d = el("div", "ipr-pd-d"); d.id = "ipr-pd-d"; d.hidden = true; d.setAttribute("aria-live", "polite");
    c.appendChild(d);
    sec.appendChild(c);
    ABERTA = null;
  }

  // ---------- pormenor (escolhas e notas) ----------
  function det() { return document.getElementById("ipr-pd-d"); }
  function marcarAberta(k) {
    ABERTA = k;
    [].forEach.call(document.querySelectorAll("#ipr-pd [data-pd]"), function (b) { b.setAttribute("aria-expanded", String(b.getAttribute("data-pd") === k)); });
  }
  function fecharDet() { var d = det(); if (d) { d.hidden = true; d.textContent = ""; } marcarAberta(null); }
  function abrirDet(k, partes) {
    var d = det(); if (!d) return;
    d.textContent = "";
    var x = el("button", "ipr-pd-x", "×"); x.type = "button"; x.setAttribute("data-pd-a", "fechar"); x.setAttribute("aria-label", t("fechar")); x.title = t("fechar");
    d.appendChild(x);
    partes.forEach(function (p) { d.appendChild(p); });
    d.hidden = false; marcarAberta(k);
  }
  function accao(txt, a, extra, cls) {
    var b = el("button", "ipr-pd-a" + (cls ? " " + cls : ""), txt); b.type = "button"; b.setAttribute("data-pd-a", a);
    if (extra != null) b.setAttribute("data-pd-v", String(extra));
    return b;
  }
  function ligacao(txt, href, cls) { var a = el("a", "ipr-pd-a" + (cls ? " " + cls : ""), txt); a.href = href; return a; }
  function lista(itens) { var l = el("div", "ipr-pd-l"); itens.forEach(function (i) { l.appendChild(i); }); return l; }

  function entradaPlanta() {
    if (!sessao()) { abrirDet("planta", [el("p", "", t("plantaSemConta")), lista([ligacao(t("entrar"), entrarUrl(), "ac")])]); return; }
    var ms = mapasDaPessoa();
    if (ms === null) { abrirDet("planta", [el("p", "", t("aCarregar"))]); return; }
    if (!ms.length) {
      var P = est();
      if (P && P.dados && P.dados.bloqueado) { fecharDet(); abrirDireita("proj"); return; }
      abrirDet("planta", [el("p", "", t("plantaSem")), lista([accao(t("encBase"), "enc", null, "ac")])]); return;
    }
    if (ms.length === 1) { fecharDet(); fazerPlanta(ms[0]); return; }
    var P2 = est(), act = P2 && P2.modo === "cliente" ? P2.actual : null;
    abrirDet("planta", [el("p", "", t("plantaVarios")), lista(ms.map(function (m) {
      var b = accao(m.local || t("semNome"), "planta", idPlanta(m));
      var sm = el("small", "", "#" + idPlanta(m) + (m.area_ha ? " · " + (+m.area_ha).toLocaleString(lg() === "en" ? "en-GB" : "pt-PT", { maximumFractionDigits: 2 }) + " ha" : ""));
      if (m === act) { sm.appendChild(document.createTextNode(" · ")); sm.appendChild(el("i", "", t("aberto"))); }
      b.appendChild(sm); return b;
    }))]);
  }
  function entradaLeitura() {
    var ops = [], m = sessao() ? actualSemLeitura() : null;
    if (m) { var b = accao(t("ltBase"), "lt-base"); b.appendChild(el("small", "", m.local || t("semNome"))); ops.push(b); }
    if (!ops.length) { fecharDet(); leituraNova(); return; }
    ops.push(accao(t("ltNovo"), "lt-novo"));
    abrirDet("leitura", [el("p", "", t("leituraQual")), lista(ops)]);
  }
  function entradaBase() {
    var P = est(), mb = document.getElementById("ipr-mb");
    var temBases = sessao() && P && P.dados && !P.dados.bloqueado && (P.mapas || []).length > 0;
    if (temBases) { fecharDet(); if (mb && !mb.hidden) abrirMinhasBases(); else abrirDireita("proj"); return; }
    var acc = [accao(t("encBase"), "enc", null, "ac")];
    if (document.querySelector('[data-tme="exemplo"]')) acc.push(accao(t("exemplo"), "exemplo"));
    if (!sessao()) acc.push(ligacao(t("entrar"), entrarUrl()));
    abrirDet("base", [el("p", "", t("baseO")), lista(acc)]);
  }

  function aoClicar(e) { try { aoClicar2(e); } catch (x) {} }
  function aoClicar2(e) {
    var tg = e.target;
    if (tg.closest("[data-pd-h]")) {
      var sec = document.getElementById("ipr-pd"), fechar = !sec.classList.contains("fechado");
      sec.classList.toggle("fechado", fechar);
      tg.closest("[data-pd-h]").setAttribute("aria-expanded", String(!fechar));
      MEM.f = fechar ? 1 : 0; gravar(MEM);
      return;
    }
    var b = tg.closest("[data-pd]");
    if (b) {
      var k = b.getAttribute("data-pd");
      if (ABERTA === k) { fecharDet(); return; }
      if (k === "planta") entradaPlanta();
      else if (k === "leitura") entradaLeitura();
      else if (k === "base") entradaBase();
      else if (k === "enc") { fecharDet(); encomendar(); }
      return;
    }
    var a = tg.closest("[data-pd-a]"); if (!a) return;
    var acao = a.getAttribute("data-pd-a");
    if (a.tagName === "BUTTON" && ABERTA) { var eb = document.querySelector('#ipr-pd [data-pd="' + ABERTA + '"]'); if (eb) try { eb.focus({ preventScroll: true }); } catch (x) {} }
    if (acao === "fechar") { var k0 = ABERTA; fecharDet(); var bb = k0 && document.querySelector('#ipr-pd [data-pd="' + k0 + '"]'); if (bb) try { bb.focus(); } catch (x) {} return; }
    if (acao === "enc") { fecharDet(); encomendar(); return; }
    if (acao === "exemplo") { fecharDet(); var ex = document.querySelector('[data-tme="exemplo"]'); if (ex) ex.click(); return; }
    if (acao === "planta") {
      var id = a.getAttribute("data-pd-v"), ms = mapasDaPessoa() || [];
      var m = ms.filter(function (x) { return String(idPlanta(x)) === id; })[0];
      fecharDet(); if (m) fazerPlanta(m); return;
    }
    if (acao === "lt-base") { var mm = actualSemLeitura(); fecharDet(); if (mm) leituraBase(mm); else leituraNova(); return; }
    if (acao === "lt-novo") { fecharDet(); leituraNova(); return; }
  }

  // ---------- ciclo: montar quando o bloco existir, voltar a pôr se sair, refazer ao mudar de língua ----------
  function ciclo() {
    try {
      var sec = montar();
      if (sec && LG !== lg()) desenhar(sec);
    } catch (e) {}
    setTimeout(ciclo, document.getElementById("ipr-pd") ? 2000 : 300);
  }
  ciclo();
  document.addEventListener("ipr:lingua", function () { try { var s = document.getElementById("ipr-pd"); if (s) desenhar(s); } catch (e) {} });
})();

/* IPR Atlas · Projectos compactos no painel da direita (pedido do Nuno, 29/10/2026, 20h35: «Minimiza os projectos na barra
   da direita»). Cada cartão do separador Projectos mostra só o nome, o número e a área, o estado e «Ver no mapa»; as acções
   secundárias (Planta de localização, Editar nome, Partilhar, Arquivar, Juntar à organização e «Ficheiros do projecto»)
   ficam atrás de «Mais» em cada cartão (aria-expanded). O estado de cada cartão fica lembrado neste navegador; sem escolha
   feita, o projecto aberto no mapa começa aberto. Só CSS e um botão por cartão, reposto quando o app.js redesenha a lista
   (MutationObserver). O clique em «Mais» é tratado antes dos outros guiões, para não abrir a ficha nem mudar de Base.
   Desligar: window.IPR_PROJ_COMPACTO_OFF = true, ou ?proj_compacto=0 no endereço. */
(function () {
  "use strict";
  if (window.__iprProjCompacto || window.IPR_PROJ_COMPACTO_OFF) return;
  window.__iprProjCompacto = 1;
  try { if (new URLSearchParams(location.search).get("proj_compacto") === "0") return; } catch (e) {}

  var CHAVE = "ipr_proj_compacto_v1";
  var TX = { pt: { mais: "Mais", menos: "Menos", t: "Mais acções deste projecto" }, en: { mais: "More", menos: "Less", t: "More actions for this project" } };
  function t(k) { var l = (window.IPR_LINGUA || "pt") === "en" ? "en" : "pt"; return TX[l][k]; }
  var MEM = {};
  try { MEM = JSON.parse(localStorage.getItem(CHAVE) || "null") || {}; } catch (e) { MEM = {}; }
  if (typeof MEM !== "object" || Array.isArray(MEM)) MEM = {};
  function gravar() { try { localStorage.setItem(CHAVE, JSON.stringify(MEM)); } catch (e) {} }

  // o que fica atrás de «Mais» (filhos directos do bloco do título do cartão)
  var SEC = ":scope > .ipr-ca, :scope > details.ipr-pf73";
  var ESTILO =
    "#ipe-proj .ipe-card.ipr-pc:not(.ipr-pc-ab) .ipe-ct>.ipr-ca,#ipe-proj .ipe-card.ipr-pc:not(.ipr-pc-ab) .ipe-ct>details.ipr-pf73{display:none!important}" +
    "#ipe-proj .ipr-pc-t{display:inline-flex;align-items:center;gap:5px;margin:4px 0 0 6px;padding:4px 8px;border:1px solid var(--ln);border-radius:7px;background:transparent;color:var(--mu);font:600 11.5px/1.2 Inter,system-ui,sans-serif;cursor:pointer;vertical-align:middle}" +
    "#ipe-proj .ipr-pc-t:hover{color:var(--tx);border-color:var(--ln2)}" +
    "#ipe-proj .ipr-pc-t:focus-visible{outline:2px solid var(--ac);outline-offset:1px}" +
    "#ipe-proj .ipr-pc-t i{width:0;height:0;border-top:5px solid currentColor;border-left:4px solid transparent;border-right:4px solid transparent;transition:transform .12s}" +
    "#ipe-proj .ipr-pc-t[aria-expanded=true] i{transform:rotate(180deg)}" +
    "#ipe-proj .ipe-card.ipr-pc .ipe-ct>.ipr-ver-mapa{vertical-align:middle}" +
    "@media (max-width:600px){#ipe-proj .ipr-pc-t{padding:8px 11px;font-size:12.5px}}";

  function idDe(c) { var m = /#\s*([0-9A-Za-z-]+)/.exec((c.querySelector(".ipe-ct .mono") || {}).textContent || ""); return m ? m[1] : ""; }
  function aberto(c, id) { return Object.prototype.hasOwnProperty.call(MEM, id) ? MEM[id] === 1 : c.classList.contains("ipr-actual"); }
  var n = 0;
  function aplicar() {
    var raiz = document.getElementById("ipe-proj"); if (!raiz) return;
    if (!document.getElementById("ipr-pc-css")) { var s = document.createElement("style"); s.id = "ipr-pc-css"; s.textContent = ESTILO; document.head.appendChild(s); }
    [].forEach.call(raiz.querySelectorAll(".ipe-card[data-i]"), function (c) {
      var ct = c.querySelector(":scope > .ipe-cc > .ipe-ct"), id = idDe(c);
      if (!ct || !id || !ct.querySelector(SEC)) { if (c.classList.contains("ipr-pc")) c.classList.remove("ipr-pc"); return; }
      if (!c.classList.contains("ipr-pc")) c.classList.add("ipr-pc");
      var ab = aberto(c, id);
      if (c.classList.contains("ipr-pc-ab") !== ab) c.classList.toggle("ipr-pc-ab", ab);
      var b = ct.querySelector(":scope > .ipr-pc-t");
      if (!b) {
        b = document.createElement("button"); b.type = "button"; b.className = "ipr-pc-t";
        b.appendChild(document.createElement("span")); b.appendChild(document.createElement("i"));
        var vm = ct.querySelector(":scope > .ipr-ver-mapa"), alvo = ct.querySelector(SEC);
        ct.insertBefore(b, vm ? vm.nextSibling : alvo);
      }
      var ids = [].map.call(ct.querySelectorAll(SEC), function (x) { if (!x.id) x.id = "ipr-pc-s" + (++n); return x.id; }).join(" ");
      var txt = ab ? t("menos") : t("mais");
      if (b.firstChild.textContent !== txt) b.firstChild.textContent = txt;
      if (b.getAttribute("aria-expanded") !== String(ab)) b.setAttribute("aria-expanded", String(ab));
      if (ids && b.getAttribute("aria-controls") !== ids) b.setAttribute("aria-controls", ids);
      if (b.title !== t("t")) b.title = t("t");
    });
  }
  // Antes de qualquer outro guião (captura no documento): «Mais» não abre a ficha (§33) nem muda a Base aberta (app.js).
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest("#ipe-proj .ipr-pc-t"); if (!b) return;
    e.stopPropagation(); e.preventDefault();
    try {
      var c = b.closest(".ipe-card"), id = idDe(c); if (!id) return;
      MEM[id] = c.classList.contains("ipr-pc-ab") ? 0 : 1; gravar(); aplicar();
    } catch (x) {}
  }, true);
  var obs = null;
  function ligar() {
    var raiz = document.getElementById("ipe-proj"); if (!raiz) { setTimeout(ligar, 400); return; }
    try { aplicar(); } catch (e) {}
    if (obs) return;
    obs = new MutationObserver(function () { clearTimeout(ligar.t); ligar.t = setTimeout(function () { try { aplicar(); } catch (e) {} }, 60); });
    obs.observe(raiz, { childList: true, subtree: true });
  }
  ligar();
  document.addEventListener("ipr:lingua", function () { try { aplicar(); } catch (e) {} });
})();
