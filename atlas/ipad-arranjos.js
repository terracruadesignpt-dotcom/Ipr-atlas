/* IPR Atlas · arranjos para o iPad (Safari e Chrome) (Nuno, 7/11/2026, 23h10, fotografias do iPad: «Olha lá os bugs meu
   nem dá para sair deste»). Terracrua Design. Só acrescenta; não edita simulador-base.js, janelas.js nem minhas-bases.js.
   1. Escolha da Base dos simuladores (#ipr-sb, «Onde quer simular?»): no iPad a caixa ficava mais alta do que o ecrã e os
      botões «Cancelar» e «Simular» ficavam fora de vista; a barra de mover/transparência do janelas.js agarrava-se à
      camada de fundo (o ecrã todo) e aparecia no canto de cima, por cima da barra do Atlas.
      - um «×» no cabeçalho da própria caixa (data-sb="x", o mesmo botão de cancelar do simulador-base.js);
      - a altura da caixa é limitada à parte visível do ecrã (visualViewport), com a lista a deslizar e os botões sempre
        à vista;
      - a barra do janelas.js dessa camada de fundo fica escondida (a caixa já tem «×» e «Cancelar»).
   2. Bloco do projecto aberto (#ipr-mb) na barra da esquerda: tem altura máxima mas o conteúdo transbordava por cima
      do bloco seguinte («Fundo»), com textos sobrepostos. Passa a deslizar dentro do próprio bloco.
   3. Chrome e Safari no iPad: quando a barra do navegador recolhe ou o ecrã é arrastado, a página inteira subia e a barra
      de cima do Atlas desaparecia, ficando uma faixa preta em baixo. Com o Atlas aberto e sem campo de texto activo, a
      página volta sempre ao topo e o Atlas acompanha a parte visível do ecrã.
   Desligar: ?ipad=0 ou localStorage ipr_ipad_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]ipad=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_ipad_off") === "1") return; } catch (e) {}
  if (W.__iprIpad) return; W.__iprIpad = 1;
  var EN = (W.IPR_LINGUA || "pt") === "en";
  var toque = (navigator.maxTouchPoints || 0) > 0 || /iPad|iPhone|Macintosh/.test(navigator.userAgent) && "ontouchend" in D;

  function css() {
    if (D.getElementById("ipr-ipad-css")) return;
    var s = D.createElement("style"); s.id = "ipr-ipad-css";
    s.textContent =
      "#ipr-sb .sb-cab{position:relative;padding-right:44px}" +
      "#ipr-sb .sb-fx{position:absolute;top:8px;right:8px;width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;border-radius:2px;border:1px solid var(--ln2,#3C4B32);background:transparent;color:var(--tx,#E4E2D8);font:600 20px/1 system-ui,sans-serif;cursor:pointer}" +
      "#ipr-sb .sb-fx:focus-visible{outline:2px solid var(--ac2,#B3D466);outline-offset:2px}" +
      "#ipr-sb .sb-a{flex:0 0 auto}" +
      "#ipe #ipe-esq #ipr-mb{overflow-y:auto!important;overflow-x:hidden}";
    (D.head || D.documentElement).appendChild(s);
  }

  // ---------- 1. escolha da Base dos simuladores ----------
  function caixaSim() {
    var M = D.getElementById("ipr-sb"); if (!M || M.hidden) return;
    var cab = M.querySelector(".sb-cab");
    if (cab && !cab.querySelector(".sb-fx")) {
      var b = D.createElement("button"); b.type = "button"; b.className = "sb-fx"; b.setAttribute("data-sb", "x");
      b.setAttribute("aria-label", EN ? "Close" : "Fechar"); b.title = EN ? "Close" : "Fechar"; b.textContent = "×";
      cab.appendChild(b);
    }
    var c = M.querySelector(".sb-c"); if (!c) return;
    var vv = W.visualViewport, alt = vv ? vv.height + vv.offsetTop : W.innerHeight;
    var r = c.getBoundingClientRect(), esc = c.offsetHeight ? r.height / c.offsetHeight : 1;
    if (!esc || !isFinite(esc)) esc = 1;
    var livre = Math.max(220, alt - Math.max(0, r.top) - 12) / esc;
    var atual = parseFloat(c.style.maxHeight) || 0;
    if (Math.abs(atual - livre) > 4) c.style.setProperty("max-height", Math.round(livre) + "px", "important");
    // barra do janelas.js agarrada à camada de fundo: esconder
    [].forEach.call(D.querySelectorAll(".ipr-janb"), function (j) {
      var x = parseFloat(j.style.left) || 0, y = parseFloat(j.style.top) || 0;
      var mr = M.getBoundingClientRect();
      if (M.classList.contains("lado") && y < 60 && x > mr.right - 200) j.style.setProperty("display", "none", "important");
    });
  }

  // ---------- 3. página presa ao topo no iPad ----------
  function campo() { var a = D.activeElement; return a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable); }
  function topo() {
    if (!toque || !D.documentElement.classList.contains("ipe-on")) return;
    var vv = W.visualViewport;
    if (vv && vv.scale > 1.05) return;               // zoom de dois dedos: não mexe
    if (campo()) return;                             // teclado aberto: deixa o navegador tratar
    if (W.scrollY || W.pageYOffset) { try { W.scrollTo(0, 0); } catch (e) {} }
    var ipe = D.getElementById("ipe");
    if (ipe && vv) {
      var h = Math.round(vv.height), t = Math.round(vv.offsetTop);
      if (t > 0 || Math.abs(h - W.innerHeight) > 2) {
        ipe.style.setProperty("top", t + "px", "important");
        ipe.style.setProperty("height", h + "px", "important");
        ipe.style.setProperty("bottom", "auto", "important");
      } else if (ipe.style.top) {
        ipe.style.removeProperty("top"); ipe.style.removeProperty("height"); ipe.style.removeProperty("bottom");
      }
    }
  }

  var t1 = 0;
  function agenda() { if (!t1) t1 = setTimeout(function () { t1 = 0; try { caixaSim(); } catch (e) {} }, 60); }
  function ligar() {
    if (!D.body) return false;
    css();
    new MutationObserver(agenda).observe(D.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "class"] });
    W.addEventListener("resize", function () { agenda(); topo(); });
    W.addEventListener("scroll", topo, { passive: true });
    if (W.visualViewport) { W.visualViewport.addEventListener("resize", function () { agenda(); topo(); }); W.visualViewport.addEventListener("scroll", topo); }
    D.addEventListener("focusout", function () { setTimeout(topo, 300); });
    setInterval(function () { topo(); }, 1500);
    agenda(); topo();
    return true;
  }
  if (!ligar()) D.addEventListener("DOMContentLoaded", ligar);
})();
