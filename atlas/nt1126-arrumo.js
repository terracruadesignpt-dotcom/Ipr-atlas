/* IPR Atlas · nt1126-arrumo.js (26/11/2026)
 * Revisão do grafismo pedida pelo Nuno («coisas mal encostadas, janelas à frente»). Só posições, nada muda de função:
 *  1. Legenda (#ipr-lgd): ficava por cima do fundo do painel da esquerda e da barra das coordenadas. Passa a ficar
 *     à direita do painel da esquerda e da coluna dos botões do mapa, acima da barra de baixo.
 *  2. Botão «Ferramentas» (#tcd_dock): ficava por baixo da Formiga e por cima do painel da direita. Passa para a
 *     esquerda do painel da direita, acima da barra de baixo. A Formiga fica no canto.
 *  3. «Gerência» (#ipr-ger-b): tapava o topo dos separadores do painel da direita. Passa para a esquerda do painel.
 * Com os painéis fechados (ou no telemóvel, abaixo de 700 px) fica tudo como estava.
 * Desligar: ?arrumo=0
 */
(function (W, D) {
  "use strict";
  if (W.__iprArrumo) return;
  W.__iprArrumo = 1;
  try { if (/[?&]arrumo=0\b/.test(W.location.search)) return; } catch (e) {}

  var GAP = 12;
  function visivel(el) {
    if (!el || el.hidden) return false;
    var s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden") return false;
    var r = el.getBoundingClientRect();
    return r.width > 40 && r.height > 40;
  }
  function px(el, prop, v) {
    var cur = el.style.getPropertyValue(prop);
    if (v === null) { if (cur) el.style.removeProperty(prop); return; }
    if (cur !== v || el.style.getPropertyPriority(prop) !== "important") el.style.setProperty(prop, v, "important");
  }
  function limpa(el, props) { if (el) props.forEach(function (p) { px(el, p, null); }); }

  function correr() {
    var esq = D.getElementById("ipe-esq"), dir = D.getElementById("ipe-dir");
    var st = D.getElementById("ipe-st"), nav = D.getElementById("ipr-nav");
    var lgd = D.getElementById("ipr-lgd"), dock = D.getElementById("tcd_dock");
    var ger = D.getElementById("ipr-ger-b");
    var largo = W.innerWidth >= 700;
    var stOk = st && !st.hidden && getComputedStyle(st).display !== "none" && st.getBoundingClientRect().height > 8;
    var baixo = stOk ? Math.max(0, W.innerHeight - st.getBoundingClientRect().top) + GAP : GAP;

    /* 1. legenda */
    if (lgd) {
      if (largo && visivel(esq)) {
        var x = esq.getBoundingClientRect().right + GAP;
        if (nav && visivel(nav)) x = Math.max(x, nav.getBoundingClientRect().right + GAP);
        px(lgd, "left", Math.round(x) + "px");
        px(lgd, "bottom", Math.round(baixo) + "px");
      } else limpa(lgd, ["left", "bottom"]);
    }

    /* 2. Ferramentas e Formiga, em coluna à esquerda do painel da direita */
    var temDir = largo && visivel(dir);
    var dirW = temDir ? Math.round(W.innerWidth - dir.getBoundingClientRect().left) + GAP : 0;
    /* a Formiga é reposta no canto por outro módulo (inset !important); fica lá, por cima de tudo */
    if (dock) {
      if (temDir) { px(dock, "right", dirW + "px"); px(dock, "bottom", Math.round(baixo) + "px"); }
      else limpa(dock, ["right", "bottom"]);
    }

    /* 3. Gerência: ao lado do painel da direita, à altura do topo dele */
    if (ger) {
      if (temDir) {
        var dr = dir.getBoundingClientRect(), gr = ger.getBoundingClientRect();
        if (gr.bottom > dr.top && gr.left >= dr.left - 4) {
          px(ger, "right", dirW + "px");
          px(ger, "top", Math.round(dr.top) + "px");
        }
      } else limpa(ger, ["right", "top"]);
    }
  }

  /* 4. Ortofoto PNOA (Espanha, m91589): sobre Portugal só devolve mosaicos vazios e, enquanto a DGT demora,
   *    pintava o mapa de bege (visto na Maia a 26/11). Com o centro do mapa em Portugal continental fica escondida;
   *    em Espanha volta a aparecer. Contorno simplificado da fronteira (Natural Earth, o mesmo do m91589). */
  var PT = [[-7.41,37.19],[-7.53,37.57],[-7.24,37.99],[-6.95,38.2],[-7.36,38.45],[-7.05,38.87],[-6.98,39.03],[-7.32,39.46],
    [-7.56,39.68],[-7.02,39.69],[-6.88,40.01],[-7.04,40.18],[-6.79,40.36],[-6.84,40.85],[-6.93,41.03],[-6.65,41.26],[-6.2,41.57],
    [-6.55,41.67],[-6.59,41.95],[-6.98,41.96],[-7.2,41.88],[-7.6,41.83],[-8.05,41.82],[-8.18,41.81],[-8.21,42.15],[-8.75,41.97],
    [-9.7,42.0],[-9.7,36.8],[-7.41,36.8]];
  function emPT(x, y) {
    var o = false;
    for (var i = 0, j = PT.length - 1; i < PT.length; j = i++) {
      var a = PT[i], b = PT[j];
      if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) o = !o;
    }
    return o;
  }
  function pnoa() {
    var m = W.IPR_MAPA || (W.__ipe && W.__ipe.mapa);
    if (!m || !m.getLayer || !m.getLayer("ipr-c89-pnoa")) return;
    var c = m.getCenter(), v = emPT(c.lng, c.lat) ? "none" : "visible";
    if (m.getLayoutProperty("ipr-c89-pnoa", "visibility") !== v) m.setLayoutProperty("ipr-c89-pnoa", "visibility", v);
  }

  var ult = 0, pend = 0;
  function agenda() {
    if (pend) return;
    pend = setTimeout(function () { pend = 0; ult = Date.now(); try { correr(); } catch (e) {} try { pnoa(); } catch (e) {} }, Math.max(0, 250 - (Date.now() - ult)));
  }
  function arranca() {
    agenda();
    W.addEventListener("resize", agenda);
    setInterval(agenda, 800);
    (function liga() {
      var m = W.IPR_MAPA || (W.__ipe && W.__ipe.mapa);
      if (!m || !m.on) { setTimeout(liga, 500); return; }
      m.on("moveend", agenda); m.on("styledata", agenda);
    })();
  }
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", arranca); else arranca();
})(window, document);
