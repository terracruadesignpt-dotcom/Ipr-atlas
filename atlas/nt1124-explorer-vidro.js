/* IPR Atlas · Explorer com os acabamentos do Intelligence (24/11/2026, 18h50). Terracrua Design.
   Nuno (18h44): «O Explorer não acompanhou a evolução do Intelligence hoje [...] o grafismo está muito fraco. Não tem os
   flutuantes, tem duas bússolas [...] vai ver tudo o que foi feito ao Intelligence e aplica ao Explorer, considerando que o
   Explorer não tem acesso a tantas ferramentas, e dá-lhe os mesmos acabamentos para ficar alinhado.»
   Só com o Explorer montado (html.ipr-exd, explorer-pc.js). Não muda estrutura nem eventos:
   1. O mapa ocupa o ecrã todo; a barra de cima e os painéis da esquerda e da direita flutuam por cima, em vidro, com cantos
      redondos e margens de 12 px (como o nt1124-vidro.js no Intelligence). Respeita o tema: claro (creme do Bolito, m92494)
      ou escuro.
   2. Uma só bússola: sai o +/− antigo do Explorer (#ipr-exd-zoom); fica o controlo do nt1124-ferramentas.js (posição, 3D,
      bússola, + e −), encostado ao painel da esquerda.
   3. A mesma letra (Geist) e botões em cápsula.
   Só no computador (largura de 1024 px ou mais); no telemóvel não mexe em nada.
   Desligar: ?vidro=0 ou localStorage ipr_vidro=0 (o mesmo interruptor do Intelligence). */
(function () {
  "use strict";
  var W = window, D = document, H = D.documentElement;
  try { if (/[?&]vidro=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_vidro") === "0") return; } catch (e) {}
  if (W.__iprExdVidro) return; W.__iprExdVidro = 1;
  /* Só no computador (24/11, 20h49: no telemóvel o Explorer tem outro desenho e isto desarrumava-o). */
  function pc() { try { return W.matchMedia("(min-width: 1024px)").matches; } catch (e) { return W.innerWidth >= 1024; } }

  var F = "Geist,Inter,system-ui,-apple-system,'Segoe UI',sans-serif", BL = "blur(18px) saturate(140%)";
  var X = "html.ipr-exd";
  var CSS =
    /* vidro: escuro por omissão, creme no tema claro */
    X + "{--exg:rgba(13,17,11,.70);--exb:rgba(255,255,255,.09);--exs:inset 0 1px 0 rgba(255,255,255,.05),0 18px 40px -12px rgba(0,0,0,.55)}" +
    X + ".tcd-claro{--exg:rgba(248,246,239,.86);--exb:rgba(47,47,42,.10);--exs:inset 0 1px 0 rgba(255,255,255,.7),0 18px 40px -14px rgba(30,30,20,.35)}" +
    /* mapa por baixo de tudo */
    X + " .ipe-mapa{top:0!important;left:0!important;right:0!important;bottom:0!important}" +
    X + ".ipr-exd-d .ipe-mapa," + X + ".ipr-exd-form .ipe-mapa," + X + ".ipr-exd-as .ipe-mapa{right:0!important}" +
    /* barra de cima */
    X + " #ipr-exd-top{top:12px!important;left:12px!important;right:12px!important;height:56px!important;border-radius:16px!important;border:1px solid var(--exb)!important;background:var(--exg)!important;backdrop-filter:" + BL + ";-webkit-backdrop-filter:" + BL + ";box-shadow:var(--exs)!important}" +
    /* painéis */
    X + " #ipr-exd-esq{top:80px!important;left:12px!important;bottom:12px!important;border-radius:18px!important;border:1px solid var(--exb)!important;background:var(--exg)!important;backdrop-filter:" + BL + ";-webkit-backdrop-filter:" + BL + ";box-shadow:var(--exs)!important}" +
    X + " #ipr-exd-dir," + X + ".ipr-exd-form #ipe-dir{top:80px!important;right:12px!important;bottom:12px!important;border-radius:18px!important;border:1px solid var(--exb)!important;background:var(--exg)!important;backdrop-filter:" + BL + ";-webkit-backdrop-filter:" + BL + ";box-shadow:var(--exs)!important;overflow:auto}" +
    /* uma só bússola */
    X + " #ipr-exd-zoom{display:none!important}" +
    /* letra e cápsulas */
    X + " .ipr-exd-ui," + X + " .ipr-exd-ui :is(div,span,p,a,button,input,select,label,li,h1,h2,h3,h4,b,strong,small)," + X + " #ipr-exd-top *{font-family:" + F + "!important}" +
    X + " .ipr-exd-ui h2," + X + " .ipr-exd-sec h2{font-family:'Geist Mono',ui-monospace,monospace!important;letter-spacing:.12em!important}" +
    X + " .ipr-exd-pg button," + X + " .ipr-exd-cam button," + X + " .ipr-exd-doc button{border-radius:14px!important}" +
    X + " #ipr-exd-top input{border-radius:999px!important}";

  function fontes() {
    if (D.getElementById("ipr-vidro-f")) return;
    var l = D.createElement("link"); l.id = "ipr-vidro-f"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap";
    D.head.appendChild(l);
  }
  var redim = false;
  function correr() {
    var st = D.getElementById("ipr-exdv-css");
    if (!pc()) { if (st) st.parentNode.removeChild(st); return; }
    if (!H.classList.contains("ipr-exd") || !D.head) return;
    fontes();
    if (!D.getElementById("ipr-exdv-css")) { var s = D.createElement("style"); s.id = "ipr-exdv-css"; s.textContent = CSS; D.head.appendChild(s); }
    var M = W.__ipe && W.__ipe.mapa;
    if (M && !redim) { redim = true; setTimeout(function () { try { M.resize(); } catch (e) {} }, 80); }
  }
  (function vez(n) { correr(); if (n < 80) setTimeout(function () { vez(n + 1); }, 400); })(0);
  W.addEventListener("resize", function () { redim = false; correr(); });
  if (W.MutationObserver) new MutationObserver(function () { if (H.classList.contains("ipr-exd")) { correr(); } else redim = false; }).observe(H, { attributes: true, attributeFilter: ["class"] });
})();
