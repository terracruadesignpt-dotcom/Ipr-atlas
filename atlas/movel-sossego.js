/* IPR Atlas · movel-sossego.js (04/11/2026). Terracrua Design. Só acrescenta; não altera nenhum outro ficheiro.
   Três queixas do Nuno no iPhone, 04/11/2026, entre as 01h12 e as 01h23.
   1. «Está-me sempre a aparecer o Ângelo [...] está sempre a aparecer uma base ali. A partir de agora não abre a base à
      esquerda.» Com sessão, o app.js abria sozinho P.mapas.filter(id == ?mapa)[0] || P.mapas[0] ao arrancar
      (a primeira das Bases próprias, partilhadas e para rever, por esta ordem).
      Agora, sem ?mapa= no endereço, nenhuma Base abre sozinha; com ?mapa=N abre essa, como antes.
      Como, sem mexer no app.js (impede-se antes, não se fecha depois, por isso não pisca):
      a) Este ficheiro carrega antes do app.js. Sem ?mapa= nem ?modo=, junta ao endereço modo=encomenda, que o
         app.js já respeita no arranque (j.get("modo")); sem sessão é o arranque de sempre. O app.js lê o
         endereço no iniciar (DOMContentLoaded, via arranque.js); logo a seguir o parâmetro sai do endereço, sem recarregar.
      b) Mudar de separador: o paineis-extra.js (§6, 30/10/2026) já impede que o separador Bases abra a primeira Base.
         Aqui faz-se o mesmo para o selo Explorer/Intelligence (#ipe-nivel), o outro caminho para lá.
   2. «Não consigo ver o símbolozinho da app na versão móvel, o botãozinho para descarregar a app.» O botão é do
      ajustes.js (§ instalarApp, #ipr-app-b); abaixo de 760 px o arrumar.js (§83) passa-o para dentro do menu «Mais» e o
      limpo.js esconde-o (html.ipr-limpo #ipr-app-b). No telemóvel ficava só «Instalar a app» dentro do «Mais».
      Volta um botão pequeno na barra de cima (ecrã até 900 px ou ecrã táctil), fora da app instalada. Abre o mesmo painel
      do ajustes.js: no iPhone a instrução «Partilhar › Adicionar ao ecrã principal»; no Android o pedido nativo de
      instalação quando o Chrome o oferece (beforeinstallprompt), e senão os passos do menu ⋮.
   3. «Não aparecem as bases para rever.» O separador «Rever (N)» do admin.js e o aviso «Bases para rever» do separador
      Bases vivem no #ipe-dir (no telemóvel é a gaveta de baixo com os separadores). Quando a Base aberta sozinha era uma
      Base partilhada (dono = false, como a do Ângelo), o vista-convidado.js ligava a vista simplificada e escondia o
      #ipe-dir inteiro: sem separadores, sem Rever. Essa vista é para quem não é da equipa; para a equipa (window.tcdEquipa
      ou window.tcdAdmin) deixa de se ligar. A 1. já evita o caso mais comum.
   Entra no atlas.json logo antes do app.js.
   Desligar: ?sossego=0 ou localStorage ipr_sossego_off = 1. Falha em silêncio. */
(function () {
  "use strict";
  var W = window, D = document, H = D.documentElement;
  try { if (/[?&]sossego=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_sossego_off") === "1") return; } catch (e) {}
  if (W.__iprSossego) return; W.__iprSossego = 1;

  function est() { return W.__ipe && W.__ipe.estado; }
  function mapaUrl() { var m = /[?&]mapa=([^&#]*)/.exec(location.search); return m ? decodeURIComponent(m[1]) : ""; }
  function equipa() { return !!(W.tcdEquipa || W.tcdAdmin); }

  // ------------------------------------------------------------ 1a. arranque sem Base aberta sozinha
  var pusModo = false;
  try {
    // 04/11/2026, 12h45 (Nuno, «implementa»): só com sessão. Sem sessão não há Base que abra sozinha, e o «modo»
    // no endereço fazia o inicio.js esconder o ecrã de entrada a todos os visitantes desde as 07h55.
    var b0 = D.body, comSessao = (b0 && /(^|\s)logged-in(\s|$)/.test(b0.className)) || !!W.tcdNonce || equipa();
    if (comSessao && !mapaUrl() && !/[?&]modo=/.test(location.search)) {
      var q = location.search ? location.search + "&modo=encomenda" : "?modo=encomenda";
      history.replaceState(history.state, "", location.pathname + q + location.hash);
      pusModo = true;
    }
  } catch (e) {}
  function tirarModo() {
    if (!pusModo) return; pusModo = false;
    try {
      var s = location.search.replace(/([?&])modo=encomenda(&|$)/, function (x, a, b) { return b ? a : ""; }).replace(/^&/, "?");
      if (s === "?") s = "";
      history.replaceState(history.state, "", location.pathname + s + location.hash);
    } catch (e) {}
  }
  // O arranque.js chama iniciar() num ouvinte de DOMContentLoaded registado depois deste; por isso espera-se uma volta.
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", function () { setTimeout(tirarModo, 0); });
  else setTimeout(tirarModo, 0);

  // ------------------------------------------------------------ 1b. selo Explorer/Intelligence sem abrir a primeira Base
  // O separador Bases já está guardado pelo paineis-extra.js (§6, mesma técnica). Falta o selo #ipe-nivel, que com sessão
  // faz _("proj") e, no modo de encomenda, abriria P.mapas[0]. A lista fica vazia só durante o tratamento do clique.
  D.addEventListener("click", function (ev) {
    var t = ev.target && ev.target.closest && ev.target.closest("#ipe #ipe-nivel"); if (!t) return;
    var P = est(); if (!P || P.modo !== "encomenda" || !P.mapas || !P.mapas.length) return;
    var guarda = P.mapas; P.mapas = [];
    setTimeout(function () { if (P.mapas && !P.mapas.length) P.mapas = guarda; }, 0);
  }, true);

  // ------------------------------------------------------------ estilos (2 e 3)
  var css = D.createElement("style"); css.id = "ipr-sossego-css";
  css.textContent =
    "#ipr-ms-app{display:none}" +
    "@media (max-width:900px),(pointer:coarse){" +
      "#ipe .ipe-tr>#ipr-ms-app{display:inline-flex!important;align-items:center;justify-content:center;flex:0 0 auto!important;order:-4;" +
      "width:34px;min-width:34px;height:32px;padding:0!important;border-radius:999px;border:1px solid rgba(228,226,216,.35);background:transparent;color:inherit;cursor:pointer}" +
      "#ipe .ipe-tr>#ipr-ms-app:focus-visible{outline:2px solid #9BC53D;outline-offset:2px}" +
    "}" +
    "html.ipr-na-app #ipr-ms-app,#ipe.ipr-cv #ipr-ms-app{display:none!important}" +
    "html.ipr-ms-eq #ipr-cvk,html.ipr-ms-eq #ipr-cvv{display:none!important}";
  (D.head || H).appendChild(css);

  // ------------------------------------------------------------ 2. botão da app no telemóvel
  var pedido = null;
  W.addEventListener("beforeinstallprompt", function (e) { pedido = e; });
  W.addEventListener("appinstalled", function () { var b = D.getElementById("ipr-ms-app"); if (b) b.remove(); });
  function naApp() { return (W.matchMedia && W.matchMedia("(display-mode: standalone)").matches) || W.navigator.standalone === true; }
  function en() { return /^en/i.test(String(W.IPR_LINGUA || H.lang || "pt")); }
  function ios() { var ua = navigator.userAgent || ""; return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1); }
  function painelProprio() {
    // Só se o ajustes.js não tiver montado o seu painel (W.__iprAppAbrir).
    var p = D.getElementById("ipr-ms-app-p"); if (p) { p.remove(); return; }
    if (pedido) { var q = pedido; pedido = null; try { q.prompt(); } catch (e) {} return; }
    p = D.createElement("div"); p.id = "ipr-ms-app-p"; p.setAttribute("role", "dialog");
    p.style.cssText = "position:fixed;z-index:2147483000;top:calc(54px + env(safe-area-inset-top,0px));right:12px;width:min(320px,calc(100vw - 24px));background:#1d1d1b;color:#eee;border:1px solid #444;border-radius:12px;padding:14px 16px;font:14px/1.45 Inter,system-ui,sans-serif";
    p.innerHTML = '<b style="display:block;font-size:15px;margin-bottom:6px">IPR Atlas como app</b>' + (ios()
      ? "<ol style=\"margin:6px 0 4px;padding-left:20px\"><li>No Safari, toque em Partilhar (o quadrado com a seta para cima).</li><li>Escolha «Adicionar ao ecrã principal».</li><li>Confirme com «Adicionar».</li></ol>"
      : "<ol style=\"margin:6px 0 4px;padding-left:20px\"><li>Toque no menu ⋮ do navegador.</li><li>Escolha «Instalar aplicação» ou «Adicionar ao ecrã principal».</li></ol>");
    D.body.appendChild(p);
    setTimeout(function () { D.addEventListener("click", function fora(ev) { if (!p.contains(ev.target)) { p.remove(); D.removeEventListener("click", fora); } }); }, 0);
  }
  function botaoApp() {
    if (naApp()) { H.classList.add("ipr-na-app"); return true; }
    var tr = D.querySelector("#ipe .ipe-tr"); if (!tr) return false;
    var b = D.getElementById("ipr-ms-app");
    if (b && b.parentNode === tr) return true;
    if (!b) {
      b = D.createElement("button"); b.type = "button"; b.id = "ipr-ms-app";
      b.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M12 7v7M9 11.5l3 3 3-3M10.5 18.5h3"/></svg>';
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        if (typeof W.__iprAppAbrir === "function" && D.getElementById("ipr-app-b")) { try { W.__iprAppAbrir(); return; } catch (x) {} }
        painelProprio();
      });
    }
    var t = en() ? "Install the IPR Atlas app" : "Instalar a app IPR Atlas";
    b.title = t; b.setAttribute("aria-label", t);
    tr.appendChild(b);
    return true;
  }

  // ------------------------------------------------------------ 3. equipa: sem a vista de convidado
  function semConvidado() {
    if (!equipa()) return;
    H.classList.add("ipr-ms-eq");
    var R = D.getElementById("ipe");
    if (R && R.classList.contains("ipr-cv")) {
      R.classList.remove("ipr-cv"); D.body.classList.remove("ipr-cv-on");
      try { var M = W.__ipe && W.__ipe.mapa; if (M) setTimeout(function () { M.resize(); }, 60); } catch (e) {}
    }
  }

  function arrancar() {
    var R = D.getElementById("ipe");
    semConvidado();
    if (R) try { new MutationObserver(semConvidado).observe(R, { attributes: true, attributeFilter: ["class"] }); } catch (e) {}
    var n = 0;
    (function tentar() { try { botaoApp(); } catch (e) {} if (n++ < 40) setTimeout(tentar, 1500); })();
    W.addEventListener("resize", function () { try { botaoApp(); } catch (e) {} });
  }
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", arrancar); else arrancar();
})();
