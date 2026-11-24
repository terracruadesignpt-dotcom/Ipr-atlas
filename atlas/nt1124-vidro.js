/* IPR Atlas · Ambiente flutuante (24/11/2026, 17h24). Terracrua Design.
   Nuno: «Implementa já os estilos, estou a gostar do flutuante» (maqueta «IPR Atlas · ambiente novo»).
   O mapa passa a ocupar o ecrã todo; a barra de cima, o painel das camadas (#ipe-esq), o painel da direita (#ipe-dir) e a
   faixa das ferramentas (#tb-bar) flutuam por cima, em vidro escuro com cantos redondos. Uma só letra (Geist), botões em
   cápsula. Só CSS e um map.resize(); não muda nenhum elemento de sítio nem tira eventos.
   Desligar: ?vidro=0 ou localStorage ipr_vidro=0. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]vidro=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_vidro") === "0") return; } catch (e) {}
  if (W.__iprVidro) return; W.__iprVidro = 1;

  var G = "rgba(13,17,11,.68)", B = "1px solid rgba(255,255,255,.08)", SH = "inset 0 1px 0 rgba(255,255,255,.05),0 18px 40px -12px rgba(0,0,0,.55)", BL = "blur(18px) saturate(140%)";
  var F = "Geist,Inter,system-ui,-apple-system,'Segoe UI',sans-serif";
  var CSS =
    "html.ipr-vidro #ipe{background:#0b100a!important;grid-template-rows:76px minmax(0,1fr) 30px!important}" +
    "html.ipr-vidro #ipe>.ipe-top{height:52px!important;box-sizing:border-box}" +
    /* mapa por baixo de tudo */
    "html.ipr-vidro #ipe-mapa{grid-row:1/-1!important;grid-column:1/-1!important;z-index:0}" +
    "html.ipr-vidro #ipe>.ipe-top,html.ipr-vidro #ipe-esq,html.ipr-vidro #ipe-dir{z-index:3;background:" + G + "!important;backdrop-filter:" + BL + ";-webkit-backdrop-filter:" + BL + ";border:" + B + "!important;box-shadow:" + SH + "!important}" +
    "html.ipr-vidro #ipe>.ipe-top{grid-row:1!important;grid-column:1/-1!important;margin:12px 12px 0!important;border-radius:16px!important;align-self:start}" +
    "html.ipr-vidro #ipe-esq{grid-row:2!important;grid-column:1!important;margin:12px 0 12px 12px!important;border-radius:18px!important;overflow:auto}" +
    "html.ipr-vidro #ipe-dir{grid-row:2!important;grid-column:3!important;margin:12px 12px 12px 0!important;border-radius:18px!important;overflow:hidden;display:flex;flex-direction:column}" +
    "html.ipr-vidro #ipe-dir>#ipe-corpo{overflow:auto;flex:1 1 auto}" +
    "html.ipr-vidro #ipe-tabs{background:transparent!important;border-bottom:1px solid rgba(255,255,255,.06)!important}" +
    "html.ipr-vidro #ipe-st{grid-row:3!important;grid-column:1/-1!important;z-index:3;background:transparent!important;border:0!important;pointer-events:none;opacity:.8}" +
    "html.ipr-vidro #ipe-st *{pointer-events:auto}" +
    "html.ipr-vidro .ipr-px{opacity:0}" +
    /* faixa das ferramentas: cápsula centrada por baixo da barra de cima */
    "html.ipr-vidro #tb-bar{top:78px!important;left:50%!important;right:auto!important;transform:translateX(-50%);width:auto!important;max-width:calc(100% - 1300px);min-width:420px;height:auto!important;min-height:40px;padding:4px 8px!important;border-radius:999px!important;background:" + G + "!important;backdrop-filter:" + BL + ";-webkit-backdrop-filter:" + BL + ";border:" + B + "!important;box-shadow:" + SH + "!important;flex-wrap:wrap;justify-content:center}" +
    "html.ipr-vidro #ipr-modos-acc{border-radius:999px!important;background:" + G + "!important;backdrop-filter:" + BL + ";-webkit-backdrop-filter:" + BL + ";border:" + B + "!important;box-shadow:" + SH + "!important}" +
    /* letra única */
    "html.ipr-vidro #ipe,html.ipr-vidro #ipe :is(div,span,p,a,button,input,select,textarea,label,summary,li,h1,h2,h3,h4,h5,h6,b,strong,small,td,th){font-family:" + F + "!important}" +
    "html.ipr-vidro #ipe :is(h1,h2,h3,h4,h5,h6){letter-spacing:-.01em}" +
    /* cápsulas */
    "html.ipr-vidro #ipe>.ipe-top button,html.ipr-vidro #ipe>.ipe-top a.pill,html.ipr-vidro #tb-bar button,html.ipr-vidro #ipr-modos-acc button{border-radius:999px!important}" +
    "html.ipr-vidro #ipe>.ipe-top #ipe-busca,html.ipr-vidro #ipe>.ipe-top #ipr-be-pq .ipe-sb{border-radius:999px!important;background:rgba(255,255,255,.045)!important;border:1px solid rgba(255,255,255,.07)!important}" +
    "html.ipr-vidro #ipe-tabs .ipe-tab{border-radius:0!important;background:transparent!important}" +
    "html.ipr-vidro .ipr-sep-b{border-radius:14px!important;border-color:rgba(255,255,255,.07)!important;background:rgba(255,255,255,.02)!important}" +
    "html.ipr-vidro .ipr-sep-b button,html.ipr-vidro .ipr-sep-b a.bt{border-radius:12px!important;border-color:rgba(255,255,255,.07)!important;background:rgba(255,255,255,.025)!important}" +
    "html.ipr-vidro .ipr-sep-b h5{font-family:'Geist Mono',ui-monospace,monospace!important;font-size:10px!important;letter-spacing:.12em!important;color:#8d907f!important}" +
    "html.ipr-vidro #ipr-sep-enc .ipr-sep-b:has([data-sep-a=terra]) button{background:#94BE39!important;color:#11160d!important;border:0!important}" +
    "html.ipr-vidro #ipr-sep-enc .ipr-sep-b:has([data-sep-a=terra]) button small{color:rgba(17,22,13,.72)!important}";

  function fontes() {
    if (D.getElementById("ipr-vidro-f")) return;
    var l = D.createElement("link"); l.id = "ipr-vidro-f"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap";
    D.head.appendChild(l);
  }
  var feito = false;
  function correr() {
    if (!D.getElementById("ipe") || !D.head) return;
    fontes();
    if (!D.getElementById("ipr-vidro-css")) { var s = D.createElement("style"); s.id = "ipr-vidro-css"; s.textContent = CSS; D.head.appendChild(s); }
    D.documentElement.classList.add("ipr-vidro");
    var M = W.__ipe && W.__ipe.mapa;
    if (M && !feito) { feito = true; setTimeout(function () { try { M.resize(); } catch (e) {} }, 60); }
  }
  (function vez(n) { correr(); if (n < 40 && !feito) setTimeout(function () { vez(n + 1); }, 250); })(0);
  W.addEventListener("resize", function () { var M = W.__ipe && W.__ipe.mapa; if (M) try { M.resize(); } catch (e) {} });
})();
