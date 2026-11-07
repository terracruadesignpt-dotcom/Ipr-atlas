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
   2b. O mesmo para qualquer outro bloco das barras laterais com altura máxima cujo conteúdo a ultrapasse.
   3. Chrome e Safari no iPad: quando a barra do navegador recolhe ou o ecrã é arrastado, a página inteira subia e a barra
      de cima do Atlas desaparecia, ficando uma faixa preta em baixo. Com o Atlas aberto e sem campo de texto activo, a
      página volta sempre ao topo e o Atlas acompanha a parte visível do ecrã.
   3b. Causa do ponto 3: scrollIntoView e focus rolavam a página e o próprio #ipe; passam a rolar só a caixa certa.
   4. Barra de cima no iPad (600 a 1440 px, ao alto e ao baixo): a parte da direita encolhe e desliza na horizontal; «Comprar» sempre à vista.
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
      "#ipe #ipe-esq #ipr-mb{overflow-y:auto!important;overflow-x:hidden}" +
      // 4. barra de cima entre 600 e 1440 px (iPad ao alto e deitado): os botões da direita saíam do ecrã («As minhas simulações», «Vista
      //    simples», nome, «Comprar»). A parte da direita encolhe e desliza na horizontal; «Comprar» fica sempre à vista.
      "@media (min-width:600px) and (max-width:1440px){" +
      "#ipe .ipe-top>*{zoom:1!important}" +
      "#ipe .ipe-top .ipe-vsep{display:none!important}" +
      "#ipe .ipe-top #ipr-be-topo{max-width:170px!important;min-width:0!important;overflow:hidden!important}" +
      "#ipe .ipe-top .ipe-tr{flex:0 1 auto!important;min-width:0!important;overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:none;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain}" +
      "#ipe .ipe-top .ipe-tr::-webkit-scrollbar{display:none}" +
      "#ipe .ipe-top .ipe-tr>*{flex-shrink:0}" +
      "#ipe .ipe-top #ipr-cp-b{position:sticky!important;right:0;z-index:3;box-shadow:-10px 0 10px -4px var(--p0,#0E140B)}" +
      "}";
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

  // ---------- 3b. a causa: scrollIntoView e focus no iPad deslocam o ecrã inteiro ----------
  // (Nuno, 23h49: «não aparece logo; aparece assim que se carrega noutra função, por exemplo a ficha da propriedade»).
  // No Safari e no Chrome do iPad, scrollIntoView() e focus() rolam também a página e os contentores com overflow
  // hidden (o próprio #ipe), mesmo com a página presa: a barra de cima sai do ecrã e fica uma faixa preta em baixo.
  // Com o Atlas aberto, num aparelho de toque: scrollIntoView só rola a caixa com barra de rolar mais próxima;
  // focus() não rola; e qualquer contentor que não devia rolar (overflow hidden ou clip) volta logo à posição 0.
  function rolavel(e) { var s = getComputedStyle(e); return /(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 1; }
  function patchRolar() {
    if (!toque || Element.prototype.__iprSiv) return;
    var siv = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (op) {
      if (!D.documentElement.classList.contains("ipe-on") || !this.closest || !this.closest("#ipe")) return siv.apply(this, arguments);
      var p = this.parentElement; while (p && p !== D.body && !rolavel(p)) p = p.parentElement;
      if (!p || p === D.body) return;
      var r = this.getBoundingClientRect(), rp = p.getBoundingClientRect(), bloco = op && typeof op === "object" ? op.block : (op === false ? "end" : "start");
      var alvo = p.scrollTop + (r.top - rp.top);
      if (bloco === "center") alvo -= (p.clientHeight - r.height) / 2;
      else if (bloco === "end") alvo -= p.clientHeight - r.height;
      else if (bloco === "nearest") { if (r.top >= rp.top && r.bottom <= rp.bottom) return; if (r.bottom > rp.bottom) alvo -= p.clientHeight - r.height; }
      try { p.scrollTo({ top: Math.max(0, alvo), behavior: op && op.behavior === "smooth" ? "smooth" : "auto" }); } catch (e) { p.scrollTop = Math.max(0, alvo); }
      setTimeout(topo, 50);
    };
    Element.prototype.__iprSiv = 1;
    var fo = HTMLElement.prototype.focus;
    HTMLElement.prototype.focus = function (op) {
      if (D.documentElement.classList.contains("ipe-on") && this.closest && this.closest("#ipe") && !(this.tagName === "INPUT" || this.tagName === "TEXTAREA")) {
        var o = op && typeof op === "object" ? op : {}; o.preventScroll = true; return fo.call(this, o);
      }
      return fo.apply(this, arguments);
    };
  }
  function semRolar(e) {
    var t = e.target;
    if (t === D || t === D.documentElement || t === D.body) { topo(); return; }
    if (!t || t.nodeType !== 1 || !(t.scrollTop || t.scrollLeft)) return;
    var s = getComputedStyle(t);
    if (/(hidden|clip)/.test(s.overflowY) && /(hidden|clip)/.test(s.overflowX)) { t.scrollTop = 0; t.scrollLeft = 0; }
  }
  function vigiarFixos() {
    // o scroll de um contentor com overflow hidden nem sempre dispara evento: verificação periódica dos principais
    ["ipe", "ipe-mapa", "ipe-esq", "ipe-dir"].forEach(function (id) {
      var e = D.getElementById(id); if (!e || !(e.scrollTop || e.scrollLeft)) return;
      var s = getComputedStyle(e); if (/(hidden|clip)/.test(s.overflowY)) { e.scrollTop = 0; e.scrollLeft = 0; }
    });
    var q = D.querySelector("#ipe .ipe-top"); if (q && q.parentElement && (q.parentElement.scrollTop)) q.parentElement.scrollTop = 0;
    var se = D.scrollingElement; if (se && se.scrollTop && !campo()) se.scrollTop = 0;
  }

  // ---------- 2b. qualquer bloco das barras laterais com altura máxima que transborde passa a deslizar ----------
  function blocos() {
    [].forEach.call(D.querySelectorAll("#ipe-esq *, #ipe-dir *"), function (e) {
      if (e.__iprRol || !e.firstElementChild) return;
      var s = getComputedStyle(e);
      if (s.maxHeight === "none" || s.overflowY !== "visible" || s.position === "absolute" || s.position === "fixed") return;
      if (e.scrollHeight > e.clientHeight + 4) { e.__iprRol = 1; e.style.setProperty("overflow-y", "auto", "important"); e.style.setProperty("overflow-x", "hidden", "important"); }
    });
  }
  var t1 = 0, t2 = 0;
  function agenda() {
    if (!t1) t1 = setTimeout(function () { t1 = 0; try { caixaSim(); } catch (e) {} }, 60);
    if (!t2) t2 = setTimeout(function () { t2 = 0; try { blocos(); } catch (e) {} }, 400);
  }
  function ligar() {
    if (!D.body) return false;
    css();
    new MutationObserver(agenda).observe(D.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "class"] });
    W.addEventListener("resize", function () { agenda(); topo(); });
    W.addEventListener("scroll", topo, { passive: true });
    if (toque) { patchRolar(); D.addEventListener("scroll", semRolar, true); setInterval(vigiarFixos, 400); D.addEventListener("click", function () { setTimeout(vigiarFixos, 60); setTimeout(vigiarFixos, 700); setTimeout(topo, 700); }, true); }
    if (W.visualViewport) { W.visualViewport.addEventListener("resize", function () { agenda(); topo(); }); W.visualViewport.addEventListener("scroll", topo); }
    D.addEventListener("focusout", function () { setTimeout(topo, 300); });
    setInterval(function () { topo(); }, 1500);
    agenda(); topo();
    return true;
  }
  if (!ligar()) D.addEventListener("DOMContentLoaded", ligar);
})();
