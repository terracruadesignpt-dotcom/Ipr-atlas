/* IPR Atlas · barra-esq.js (04/11/2026). Terracrua Design. Só acrescenta e reorganiza; não altera nenhum outro ficheiro.
   Decisão do Nuno (projecto, interno/decisao-nuno-2026-11-03-atlas-barra-esquerda.md): «Barra do topo (horizontal): os
   Produtos, cada um como botão: Planta de Localização; Ficha gratuita; Leitura do Terreno; Base Cartográfica. Cada botão
   abre o mesmo fluxo de hoje (assistente Comprar ou painel de encomenda), sem mudar preços nem passos. No telemóvel, os
   produtos ficam num menu «Produtos» na barra de cima. Barra da esquerda, de cima para baixo: 1. Filtrar camadas (caixa de
   procura). 2. Desligar camadas (botão). 3. Todas as camadas (a árvore completa). 4. Temas. 5. Locais. [...] Nada é
   retirado: tudo o que sai da barra da esquerda continua acessível no topo.»
   1. Topo: grupo «Produtos» com quatro botões, logo a seguir à marca. Planta, Leitura e Base abrem o assistente de compra
      no produto (window.iprAssistenteComprar, o mesmo caminho do ecrã de entrada e do cartão do comprar.js); a Ficha
      gratuita abre o separador de encomenda do painel da direita (o mesmo que /atlas/?modo=encomenda). Quando o topo não
      tem largura (telemóvel, iPad ao alto, modo «Ver tudo» em ecrãs médios) os quatro ficam num menu «Produtos».
   2. Saem da barra da esquerda e passam para o topo, movidos (os mesmos nós, com os mesmos ouvintes):
      a pesquisa de locais (secção data-sb="busca", com #ipe-busca), numa caixa no topo ou, sem largura, atrás de um botão
      de lupa; «Camadas ligadas» (#ipr-cq, com Vistas, Limpar mapa e Explique-me), atrás de um botão com o número de camadas.
      A secção «Produtos» do produtos.js (#ipr-pd) fica escondida à esquerda: as quatro entradas estão no topo.
   3. Barra da esquerda por ordem visual, dentro da árvore (.ipr-arv, que já é a coluna que rola), com CSS order e sem mover
      os nós que o ajustes.js §66 fixa: filtro e Desligar (com Cronologia, na mesma faixa), a árvore completa (os grupos de
      Espanha, ilhas e EDIA passam para dentro dela, logo antes dos outros), Temas (#ipr-t62, também no ecrã limpo, com a
      linha «Todas as camadas» que abre a árvore) e Os meus locais (#ipc-loc). «Mostrar todas as camadas» fica no fim, onde
      estava. A .ipr-arv mantém a caixa própria: o abrirCamadas do ajustes.js mede-a (offsetParent) para saber se a barra
      está aberta; com display:contents fechava a barra ao sair do «Por onde começar?» (visto no ensaio).
   4. (Nuno, 04/11, 09h11: «já te pedi não sei quantas vezes para meter as camadas em cima e os temas em baixo») a árvore
      de camadas fica sempre aberta, logo a seguir ao filtro e ao Desligar, e os Temas descem para baixo dela: marca-se a
      chave que o ajustes.js já lê (localStorage ipr_t62_todas = 1) e esconde-se o botão que a recolhia.
   5. (09h12: «o simplificar devia ser mais vista avançada e vista simples») o botão do limpo.js passa a dizer «Vista
      avançada» no modo simples e «Vista simples» no modo completo; o comportamento é o mesmo.
   Desligar: ?barra-esq=0 ou localStorage ipr_barra_esq_off = 1. Falha em silêncio. */
(function () {
  "use strict";
  var W = window, D = document, H = D.documentElement;
  try { if (/[?&]barra-esq=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_barra_esq_off") === "1") return; } catch (e) {}
  if (W.__iprBarraEsq) return; W.__iprBarraEsq = 1;
  try { W.localStorage.setItem("ipr_t62_todas", "1"); } catch (e) {}


  function lingua() { var l = W.IPR_LINGUA || (/^(en|es)/i.exec(H.lang || "") || ["pt"])[0]; l = String(l).slice(0, 2).toLowerCase(); return l === "en" || l === "es" ? l : "pt"; }
  var TX = {
    pt: { produtos: "Produtos", planta: "Planta de Localização", ficha: "Ficha gratuita", leitura: "Leitura Territorial", base: "Base Cartográfica",
      plantaT: "Planta à escala para a Câmara, o banco ou uma escritura", fichaT: "Indicar o terreno no mapa e ver a ficha gratuita",
      leituraT: "Relatório do terreno: o que permite, os riscos e o potencial", baseT: "Relevo, água e limites do terreno a partir do LiDAR",
      pesquisar: "Pesquisar locais", activas: "Camadas ligadas", fechar: "Fechar" },
    en: { produtos: "Products", planta: "Location Plan", ficha: "Free summary", leitura: "Land Reading", base: "Base Map",
      plantaT: "A scaled plan for the council, the bank or a deed", fichaT: "Mark the plot on the map and see the free summary",
      leituraT: "A report on the plot: what it allows, its risks and its potential", baseT: "Relief, water and boundaries of the plot from LiDAR",
      pesquisar: "Search places", activas: "Active layers", fechar: "Close" },
    es: { produtos: "Productos", planta: "Plano de situación", ficha: "Ficha gratuita", leitura: "Lectura del terreno", base: "Base Cartográfica",
      plantaT: "Plano a escala para el ayuntamiento, el banco o una escritura", fichaT: "Indicar el terreno en el mapa y ver la ficha gratuita",
      leituraT: "Informe del terreno: lo que permite, sus riesgos y su potencial", baseT: "Relieve, agua y límites del terreno a partir del LiDAR",
      pesquisar: "Buscar lugares", activas: "Capas activas", fechar: "Cerrar" }
  };
  function t(k) { var o = TX[lingua()]; return o[k] || TX.pt[k]; }
  var PROD = ["planta", "ficha", "leitura", "base"];
  var IC = {
    planta: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><circle cx="12" cy="13" r="2.2"/>',
    ficha: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    leitura: '<path d="M4 5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4z"/><path d="M20 5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6z"/>',
    base: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    lupa: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    camadas: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    seta: '<path d="M7 10l5 5 5-5"/>'
  };
  function svg(k, n) { return '<svg viewBox="0 0 24 24" width="' + (n || 15) + '" height="' + (n || 15) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[k] + "</svg>"; }
  function $(id) { return D.getElementById(id); }
  function el(tag, id, cls) { var e = D.createElement(tag); if (id) e.id = id; if (cls) e.className = cls; return e; }
  function movel() { return W.innerWidth <= 900; }

  // ---------------------------------------------------------------- estilos
  var ARV = "#ipe-esq #ipe-cam .ipr-arv";
  var css = ""
    // esquerda: a árvore (.ipr-arv, do camadas.js) já é a coluna que rola; os filhos ordenam-se aqui, sem sair do sítio
    // (o ajustes.js §66 mantém #ipc-loc em primeiro no DOM e o abrirCamadas mede a .ipr-arv: ela fica com caixa própria)
    + "html.ipr-be " + ARV + ">*{order:35}"
    + "html.ipr-be " + ARV + ">.ipr-arv-cab{order:10}"
    + "html.ipr-be " + ARV + ">.ipr-testes,html.ipr-be " + ARV + ">#ipr-lig-r{order:20}"
    + "html.ipr-be " + ARV + ">#ipr-cq-cont{order:25}"
    + "html.ipr-be " + ARV + ">#tes,html.ipr-be " + ARV + ">#tilh,html.ipr-be " + ARV + ">#tedia{order:30}"
    + "html.ipr-be " + ARV + ">#tao{order:31}html.ipr-be " + ARV + ">.ipr-arv-l{order:32}html.ipr-be " + ARV + ">.ipr-rod{order:33}"
    // com a árvore recolhida (.ipr-t62-rec, ajustes.js) os grupos regionais continuam à vista, como antes, quando o mapa está na região
    + "html.ipr-be " + ARV + ".ipr-t62-rec>#tes:not([hidden]),html.ipr-be " + ARV + ".ipr-t62-rec>#tilh:not([hidden]),html.ipr-be " + ARV + ".ipr-t62-rec>#tedia:not([hidden]){display:block!important}"
    + "html.ipr-be " + ARV + ">#ipr-79{order:39}html.ipr-be " + ARV + ">#ipr-t62{order:40}"
    + "html.ipr-be " + ARV + ">#ipc-loc{order:50;margin-top:8px}"
    + "html.ipr-be #ipe-esq .ipr-t62-todas{display:none!important}"
    + "html.ipr-be #ipr-modo{font-size:0!important}html.ipr-be #ipr-modo::after{font-size:12px;content:'Vista simples'}html.ipr-be.ipr-limpo #ipr-modo::after{content:'Vista avançada'}"
    + "html.ipr-be #ipr-modo.ipr-modo-g::after{font-size:13px}"
    + "html.ipr-be[lang^=en] #ipr-modo::after{content:'Simple view'}html.ipr-be.ipr-limpo[lang^=en] #ipr-modo::after{content:'Advanced view'}"
    + "html.ipr-be[lang^=es] #ipr-modo::after{content:'Vista simple'}html.ipr-be.ipr-limpo[lang^=es] #ipr-modo::after{content:'Vista avanzada'}"
    // Temas também no ecrã limpo (o limpo.js esconde-os; a decisão põe-nos em 4.º lugar)
    + "html.ipr-be.ipr-limpo #ipe-esq #ipr-t62{display:block!important}"
    // Produtos do produtos.js: as entradas estão no topo
    + "html.ipr-be #ipe-esq #ipr-pd{display:none!important}"
    // no telemóvel o «Ver tudo / Simplificar» do limpo.js fica no fim da gaveta, depois dos Locais
    + "html.ipr-be #ipe-esq>#ipr-modo{order:90}"
    // topo
    + "#ipr-be-topo{display:flex;align-items:center;gap:6px;flex:1 1 auto;min-width:0;margin:0 10px;font:500 12.5px/1.2 Inter,system-ui,sans-serif}"
    + "#ipr-be-topo .ipr-be-g{display:flex;gap:6px;flex:0 0 auto}"
    + "#ipr-be-topo button.ipr-be-b{display:inline-flex;align-items:center;gap:6px;min-height:32px;padding:6px 10px;border:1px solid var(--ln,#2E3A26);border-radius:999px;background:var(--p2,#1B2816);color:var(--tx,#E4E2D8);font:inherit;white-space:nowrap;cursor:pointer}"
    + "#ipr-be-topo button.ipr-be-b svg{flex:none;color:var(--ac,#94BE39)}"
    + "#ipr-be-topo button.ipr-be-b:hover,#ipr-be-topo button.ipr-be-b[aria-expanded=true]{border-color:var(--ac,#94BE39)}"
    + "#ipr-be-topo button.ipr-be-b:focus-visible,.ipr-be-p button:focus-visible{outline:2px solid var(--ac,#94BE39);outline-offset:2px}"
    + "#ipr-be-topo .ipr-be-n{font:600 11px/1 Inter,system-ui,sans-serif;color:var(--ac,#94BE39)}"
    + "#ipr-be-topo .ipr-be-n:empty{display:none}"
    + "#ipr-be-topo #ipr-be-pq{flex:1 1 260px;min-width:200px;max-width:420px;position:relative}"
    + "#ipr-be-topo.c1 #ipr-be-cq-b .ipr-be-tx{display:none}#ipr-be-topo.c1 #ipr-be-pq{flex-basis:200px;min-width:180px}#ipr-be-topo.c1 .ipr-be-g button.ipr-be-b{padding:6px 8px}"
    + "#ipr-be-topo.compacto #ipr-be-pq,#ipr-be-topo:not(.compacto) #ipr-be-pq-b{display:none}"
    + "#ipr-be-topo.compacto .ipr-be-g{display:none}#ipr-be-topo:not(.compacto) #ipr-be-pm-b{display:none}"
    + "#ipr-be-topo.compacto{flex:0 0 auto}"
    // telemóvel: o grupo entra na faixa deslizante do topo (movel.js), logo depois de Comprar e Entrar, que ficam à frente
    // (Comprar −6, Entrar −5, Produtos −4, Camadas −3, lupa e Camadas ligadas −2, o resto depois)
    + "@media (max-width:640px){#ipe .ipe-tr>#ipr-be-topo{display:contents!important}#ipe #ipr-be-pm-b{order:-4}#ipe #ipr-be-pq-b,#ipe #ipr-be-cq-b{order:-2}#ipe .ipe-tr>#ipr-be-topo>*{flex:0 0 auto!important}}"
    + "#ipr-be-topo.estreito{margin:0 4px;gap:4px}#ipr-be-topo.estreito button.ipr-be-b{padding:5px 8px}#ipr-be-topo.estreito .ipr-be-tx{display:none}#ipr-be-topo.estreito #ipr-be-pm-b .ipr-be-tx{display:inline}#ipr-be-topo.estreito #ipr-be-pm-b svg{display:none}"
    // a secção da pesquisa fora da barra
    + "#ipr-be-pq .ipe-sb,.ipr-be-p .ipe-sb{display:block!important;height:auto!important;border:0!important;margin:0!important;padding:0!important;background:none!important}"
    + "#ipr-be-pq .ipe-sbh,.ipr-be-p .ipe-sbh{display:none!important}"
    + "#ipr-be-pq .ipe-sbc,.ipr-be-p .ipe-sb .ipe-sbc{display:block!important;height:auto!important;max-height:none!important;overflow:visible!important;padding:0!important}"
    + "#ipr-be-pq #ipe-busca{margin:0!important;min-height:32px;box-sizing:border-box}"
    + "#ipr-be-pq #ipe-busca kbd{display:none!important}"
    + "#ipr-be-pq #ipr-pb-3d,.ipr-be-p #ipr-pb-3d{background:transparent!important;color:var(--tx,#E4E2D8)!important;border:1px solid var(--ln,#2E3A26)!important;border-radius:6px!important;font:600 11px/1 Inter,system-ui,sans-serif!important;padding:5px 7px!important}"
    + "#ipr-be-pq #ipe-qres,#ipr-be-pq #ipr-pb-sug{position:absolute;left:0;right:0;top:100%;margin-top:4px;max-height:60vh;overflow:auto;background:var(--p1,#14200F);border:1px solid var(--ln,#2E3A26);border-radius:8px;z-index:60}"
    + "#ipr-be-pq #ipe-qres:empty{display:none}"
    // os resultados tinham as cores da barra da esquerda (#ipe-esq): repõem-se aqui, nos dois sítios novos
    + ".ipr-be-p #ipe-qres,#ipr-be-pq #ipe-qres,.ipr-be-p #ipr-pb-sug,#ipr-be-pq #ipr-pb-sug{list-style:none;padding:4px;margin:6px 0 0;background:var(--p1,#14200F)!important;color:var(--tx,#E4E2D8)!important}"
    + ".ipr-be-p #ipe-qres li,#ipr-be-pq #ipe-qres li,.ipr-be-p #ipr-pb-sug li,#ipr-be-pq #ipr-pb-sug li{list-style:none;margin:0 0 4px}"
    + ".ipr-be-p #ipe-qres li>*,#ipr-be-pq #ipe-qres li>*,.ipr-be-p #ipr-pb-sug li>*,#ipr-be-pq #ipr-pb-sug li>*{display:block;width:100%;box-sizing:border-box;text-align:left;padding:8px 10px;border:1px solid var(--ln,#2E3A26);border-radius:8px;background:var(--p2,#1B2816)!important;color:var(--tx,#E4E2D8)!important;font:500 13px/1.3 Inter,system-ui,sans-serif;cursor:pointer}"
    + ".ipr-be-p #ipe-qres small,#ipr-be-pq #ipe-qres small,.ipr-be-p #ipr-pb-sug small,#ipr-be-pq #ipr-pb-sug small{display:block;color:var(--mu,#9AA088)!important;font-size:11.5px;margin-top:2px}"
    // painéis do topo (menu Produtos, pesquisa sem largura, Camadas ligadas)
    + ".ipr-be-p{position:fixed;z-index:45;top:52px;left:16px;width:min(360px,calc(100vw - 32px));max-height:calc(100vh - 72px);max-height:calc(100dvh - 72px);overflow:auto;overscroll-behavior:contain;background:var(--p1,#14200F);color:var(--tx,#E4E2D8);border:1px solid var(--ln,#2E3A26);border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.45);padding:10px;box-sizing:border-box}"
    + ".ipr-be-p[hidden]{display:none!important}"
    + ".ipr-be-p .ipr-be-pl{display:flex;flex-direction:column;gap:6px}"
    + ".ipr-be-p .ipr-be-b{display:flex;align-items:center;gap:8px;min-height:44px;padding:8px 12px;border:1px solid var(--ln,#2E3A26);border-radius:9px;background:var(--p2,#1B2816);color:var(--tx,#E4E2D8);font:500 14px/1.25 Inter,system-ui,sans-serif;text-align:left;cursor:pointer}"
    + ".ipr-be-p .ipr-be-b svg{flex:none;color:var(--ac,#94BE39)}"
    + ".ipr-be-p .ipr-be-b small{display:block;color:var(--mu,#9AA088);font-size:12px;margin-top:2px}"
    + "#ipr-be-cqp{width:min(340px,calc(100vw - 32px));padding:0}"
    + "#ipr-be-cqp #ipr-cq{margin:0!important;border:0!important;max-height:none!important}"
    + "#ipr-be-cqp #ipr-cq.fech .ipr-cq-c{display:block!important}#ipr-be-cqp #ipr-cq .ipr-cq-car{display:none}"
    + "#ipr-be-cqp #ipr-cq .ipr-cq-c{max-height:none!important;overflow:visible!important}"
    + "@media (max-width:640px){#ipr-be-topo button.ipr-be-b{min-height:36px}}";
  function estilos() { if ($("ipr-be-css")) return; var s = el("style", "ipr-be-css"); s.textContent = css; (D.head || H).appendChild(s); }

  // ---------------------------------------------------------------- produtos: os fluxos de hoje
  function assistente(k) {
    try { if (typeof W.iprAssistenteComprar === "function" && W.iprAssistenteComprar(k) !== false) return; } catch (e) {}
    try { if (typeof W.__iprAssistenteAbrir === "function") { W.__iprAssistenteAbrir(k); return; } } catch (e) {}
    location.href = "/atlas/?assistente=" + k;
  }
  function fichaGratuita() {
    // o separador de encomenda do painel da direita, como o produtos.js (encomendar) e o /atlas/?modo=encomenda
    var R = $("ipe"), b = R && R.querySelector('.ipe-tab[data-tab="enc"]');
    if (!b) { location.href = "/atlas/?modo=encomenda"; return; }
    var dir = $("ipe-dir");
    if (!(movel() && b.getAttribute("aria-selected") === "true" && dir && dir.classList.contains("aberto"))) b.click();
    if (!movel() && R.classList.contains("sem-dir")) { var pn = $("ipe-pn"); if (pn) pn.click(); }
  }
  function produto(k) {
    fecharPaineis();
    if (k === "ficha") fichaGratuita(); else assistente(k);
  }

  // ---------------------------------------------------------------- topo
  var TOPO = null, PM = null, PQP = null, CQP = null, LG = "";
  function botao(cls, ic, txt, tit) {
    var b = el("button", null, "ipr-be-b" + (cls ? " " + cls : "")); b.type = "button";
    b.innerHTML = svg(ic); var s = el("span", null, "ipr-be-tx"); s.textContent = txt; b.appendChild(s);
    if (tit) b.title = tit; return b;
  }
  function painel(id, rotulo) {
    var p = el("div", id, "ipr-be-p"); p.hidden = true; p.setAttribute("role", "dialog"); p.setAttribute("aria-label", rotulo);
    return p;
  }
  function montarTopo() {
    var top = D.querySelector("#ipe header.ipe-top"), R = $("ipe"); if (!top || !R) return false;
    if (TOPO && TOPO.isConnected && LG === lingua()) { colocarTopo(top); return true; }
    LG = lingua();
    if (!TOPO) {
      TOPO = el("div", "ipr-be-topo");
      TOPO.addEventListener("click", aoClicarTopo);
    }
    var pqh = $("ipr-be-pq") || el("div", "ipr-be-pq"); // guarda a pesquisa movida antes de refazer os botões
    TOPO.textContent = "";
    var g = el("div", null, "ipr-be-g"); g.setAttribute("role", "group"); g.setAttribute("aria-label", t("produtos"));
    PROD.forEach(function (k) { var b = botao("", k, t(k), t(k + "T")); b.setAttribute("data-be-prod", k); g.appendChild(b); });
    TOPO.appendChild(g);
    var pm = botao("", "seta", t("produtos")); pm.id = "ipr-be-pm-b"; pm.setAttribute("aria-haspopup", "dialog"); pm.setAttribute("aria-expanded", "false"); pm.setAttribute("aria-controls", "ipr-be-pm");
    TOPO.appendChild(pm);
    TOPO.appendChild(pqh);
    var pqb = botao("", "lupa", t("pesquisar")); pqb.id = "ipr-be-pq-b"; pqb.setAttribute("aria-label", t("pesquisar")); pqb.setAttribute("aria-expanded", "false"); pqb.setAttribute("aria-controls", "ipr-be-pqp");
    pqb.querySelector(".ipr-be-tx").textContent = ""; TOPO.appendChild(pqb);
    var cqb = botao("", "camadas", t("activas"), t("activas")); cqb.id = "ipr-be-cq-b"; cqb.setAttribute("aria-expanded", "false"); cqb.setAttribute("aria-controls", "ipr-be-cqp");
    var n = el("em", null, "ipr-be-n"); cqb.appendChild(n); TOPO.appendChild(cqb);
    // painéis
    if (!PM) { PM = painel("ipr-be-pm", t("produtos")); PM.addEventListener("click", function (e) { var b = e.target.closest("[data-be-prod]"); if (b) produto(b.getAttribute("data-be-prod")); }); }
    PM.setAttribute("aria-label", t("produtos")); PM.textContent = "";
    var l = el("div", null, "ipr-be-pl");
    PROD.forEach(function (k) {
      var b = el("button", null, "ipr-be-b"); b.type = "button"; b.setAttribute("data-be-prod", k); b.innerHTML = svg(k, 18);
      var s = el("span"); s.textContent = t(k); var sm = el("small"); sm.textContent = t(k + "T"); s.appendChild(sm); b.appendChild(s); l.appendChild(b);
    });
    PM.appendChild(l);
    if (!PQP) PQP = painel("ipr-be-pqp", t("pesquisar")); PQP.setAttribute("aria-label", t("pesquisar"));
    if (!CQP) CQP = painel("ipr-be-cqp", t("activas")); CQP.setAttribute("aria-label", t("activas"));
    colocarTopo(top);
    return true;
  }
  function colocarTopo(top) {
    var R = $("ipe");
    // logo a seguir à marca e ao texto do topo: antes do centro (#ipr-tp-meio) ou do grupo da direita (.ipe-tr);
    // no telemóvel, dentro do .ipe-tr (a ordem vem do CSS), para Comprar e Entrar não perderem o lugar
    var tr = top.querySelector(":scope > .ipe-tr");
    if (W.innerWidth <= 640 && tr) { if (TOPO.parentNode !== tr) tr.insertBefore(TOPO, tr.firstChild); }
    else {
      var antes = top.querySelector(":scope > #ipr-tp-meio") || tr;
      if (TOPO.parentNode !== top || (antes && TOPO.nextSibling !== antes)) top.insertBefore(TOPO, antes || null);
    }
    [PM, PQP, CQP].forEach(function (p) { if (p && p.parentNode !== R) R.appendChild(p); });
  }

  // a pesquisa e as Camadas ligadas, movidas (os mesmos nós)
  var lutas = {}, sitio = {};
  function mover(chave, no, alvo) {
    if (!no || !alvo || no.parentNode === alvo) return;
    if (sitio[chave] && no.parentNode !== sitio[chave] && sitio[chave].isConnected) { lutas[chave] = (lutas[chave] || 0) + 1; if (lutas[chave] > 6) return; } // outro guião devolve-o: não se luta
    alvo.appendChild(no); sitio[chave] = alvo;
  }
  function moverNos() {
    var busca = D.querySelector('#ipe [data-sb="busca"]');
    if (busca) mover("pq", busca, compacto() ? PQP : $("ipr-be-pq"));
    var cq = $("ipr-cq"); if (cq) mover("cq", cq, CQP);
    // os grupos regionais (es-camadas, ilhas-camadas, edia-camadas) entram na árvore, logo antes dos outros grupos; os donos
    // só os criam uma vez (procuram-nos pelo id) e não os voltam a pôr. «Mostrar todas as camadas» (.tme-todas) fica onde está
    var arv = D.querySelector("#ipe-esq #ipe-cam .ipr-arv");
    if (arv) {
      ["tes", "tilh", "tedia"].forEach(function (id) { var g = $(id); if (g && g.parentNode === $("ipe-cam")) mover(id, g, arv); });
    }
    var cqb = $("ipr-be-cq-b");
    if (cqb) {
      var em = cq && cq.querySelector(".ipr-cq-h em"), v = em ? em.textContent.trim() : "", n = cqb.querySelector(".ipr-be-n");
      if (n.textContent !== v) n.textContent = v;
      cqb.hidden = !cq;
    }
  }

  // largura: botões soltos se couberem, menu se não (telemóvel e iPad ao alto, ou topo cheio)
  var COMP = null;
  function compacto() { return COMP === true; }
  function cabe() {
    var top = TOPO.parentNode, tr = top.querySelector(":scope > .ipe-tr"), g = TOPO.querySelector(".ipr-be-g");
    if (top.scrollWidth > top.clientWidth + 1) return false;
    if (tr && tr.scrollWidth > tr.clientWidth + 1) return false;
    if (g && g.offsetWidth && g.scrollWidth > g.clientWidth + 1) return false;
    if (TOPO.scrollWidth > TOPO.clientWidth + 1) return false;
    var r = TOPO.getBoundingClientRect(), nx = TOPO.nextElementSibling;
    while (nx && !nx.getClientRects().length) nx = nx.nextElementSibling;
    if (nx && nx.getBoundingClientRect().left < r.right - 1) return false;
    return true;
  }
  function ajustar() {
    if (!TOPO || !TOPO.isConnected) return;
    var nivel = 2;
    TOPO.classList.toggle("estreito", W.innerWidth <= 640);
    if (!movel()) {
      for (nivel = 0; nivel < 2; nivel++) {
        TOPO.classList.toggle("c1", nivel >= 1); TOPO.classList.remove("compacto");
        if (cabe()) break;
      }
    }
    TOPO.classList.toggle("c1", nivel >= 1);
    TOPO.classList.toggle("compacto", nivel >= 2);
    var quer = nivel >= 2;
    if (COMP !== quer) { COMP = quer; fecharPaineis(); moverNos(); }
  }

  // ---------------------------------------------------------------- abrir e fechar os painéis
  var ABERTO = null, QUEM = null;
  function fecharPaineis() {
    [PM, PQP, CQP].forEach(function (p) { if (p) p.hidden = true; });
    if (TOPO) [].forEach.call(TOPO.querySelectorAll("[aria-expanded]"), function (b) { b.setAttribute("aria-expanded", "false"); });
    ABERTO = null; QUEM = null;
  }
  function abrirPainel(p, b) {
    if (ABERTO === p) { fecharPaineis(); try { b.focus(); } catch (e) {} return; }
    fecharPaineis();
    var top = D.querySelector("#ipe header.ipe-top"), r = b.getBoundingClientRect(), tr = top ? top.getBoundingClientRect() : { bottom: 48 };
    p.hidden = false;
    var w = p.offsetWidth, L = Math.max(16, Math.min(r.left, W.innerWidth - w - 16));
    p.style.top = Math.round(tr.bottom + 6) + "px"; p.style.left = Math.round(L) + "px";
    b.setAttribute("aria-expanded", "true"); ABERTO = p; QUEM = b;
    var f = p === PQP ? p.querySelector("#ipe-q") : p.querySelector("button");
    if (f) setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (e) {} }, 30);
  }
  function aoClicarTopo(e) {
    var b = e.target.closest("button"); if (!b || !TOPO.contains(b)) return;
    var k = b.getAttribute("data-be-prod");
    if (k) { produto(k); return; }
    if (b.id === "ipr-be-pm-b") abrirPainel(PM, b);
    else if (b.id === "ipr-be-pq-b") abrirPainel(PQP, b);
    else if (b.id === "ipr-be-cq-b") abrirPainel(CQP, b);
  }
  D.addEventListener("pointerdown", function (e) {
    if (!ABERTO) return;
    var x = e.target;
    if (ABERTO.contains(x) || (QUEM && QUEM.contains(x))) return;
    if (x.closest && x.closest(".ipr-cq-menu,[role=menu],.ipr-cq-dlg,dialog")) return; // menus e diálogos abertos a partir das Camadas ligadas
    fecharPaineis();
  }, true);
  D.addEventListener("keydown", function (e) { if (e.key === "Escape" && ABERTO) { var b = QUEM; fecharPaineis(); if (b) try { b.focus(); } catch (x) {} } });
  // a pesquisa no painel: ao escolher um resultado, o painel fecha
  D.addEventListener("click", function (e) { if (ABERTO === PQP && e.target.closest && e.target.closest("#ipr-be-pqp #ipe-qres li, #ipr-be-pqp #ipr-pb-sug li")) setTimeout(fecharPaineis, 60); });

  // ---------------------------------------------------------------- arranque
  estilos();
  H.classList.add("ipr-be");
  var n = 0, pend = 0;
  function tudo() { try { if (montarTopo()) { ajustar(); moverNos(); } } catch (e) {} }
  (function ciclo() { tudo(); n++; setTimeout(ciclo, n < 40 ? 250 : 1500); })();
  W.addEventListener("resize", function () { if (pend) return; pend = 1; setTimeout(function () { pend = 0; COMP = null; tudo(); }, 120); });
  try { W.addEventListener("ipr:lingua", function () { LG = ""; tudo(); }); D.addEventListener("ipr:lingua", function () { LG = ""; tudo(); }); } catch (e) {}
})();
