/* IPR Atlas · bases-acordeao.js (04/11/2026). Terracrua Design. Só acrescenta; não mexe noutros ficheiros.
   Nuno, 04/11/2026, 22h09: «gostava mais de ter os separadores, tipo projetos entregues, pedidos, [...] parecido ao lado
   esquerdo, onde tu carregas e abres o que está para baixo. [...] O lado esquerdo está bom, com aquelas várias camadas, com
   a setinha, e depois carrega-se e tem-se as subcategorias, e eu quero igual desse lado.»
   22h15: «é para aplicar para todos, estamos a falar do layout geral»: vale no computador e no telemóvel (onde o
   bases-tipos.js põe uma lista de escolha, as linhas usam as opções dessa lista). Os tipos só existem para a equipa.
   O que faz, no separador «Bases» do bloco direito:
   1. Esconde a fila de botões do bases-tipos.js (#ipr-bt-f .abas) e põe no lugar uma lista de linhas, uma por tipo (Todas,
      Pedidos, Dias abertos, Reuniões, Projectos, Projectos entregues, Implementação, Sem tipo), com a seta à esquerda e o
      número à direita, como os grupos de camadas do lado esquerdo.
   2. Carregar numa linha abre-a: os filtros de estado, a pesquisa e os cartões dessa categoria aparecem logo por baixo
      dela, e as outras linhas seguem a seguir. Carregar outra vez fecha-a. Só uma aberta de cada vez.
   3. Por baixo, usa o próprio bases-tipos.js: carregar numa linha carrega no botão escondido correspondente; os números
      são os desse botão. Não muda o tipo de nenhuma Base, não grava nada no servidor.
   Lembra a última escolha neste navegador (localStorage ipr_ac_fechado). Desligar: ?bacord=0 ou localStorage
   ipr_bacord_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]bacord=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_bacord_off") === "1") return; } catch (e) {}
  if (W.__iprBAcord) return; W.__iprBAcord = 1;

  function ls(k, v) { try { if (v === undefined) return W.localStorage.getItem(k) || ""; W.localStorage.setItem(k, v); } catch (e) { return ""; } }
  function pt() { return (W.IPR_LINGUA || "pt") !== "en"; }
  function parar(n) { ["click", "mousedown", "pointerdown", "touchstart", "keydown", "keyup"].forEach(function (v) { n.addEventListener(v, function (e) { e.stopPropagation(); }); }); }

  var css = D.createElement("style"); css.id = "ipr-ac-css";
  css.textContent =
    ".ipe-pane.ipr-ac-on #ipr-bt-f .abas,.ipe-pane.ipr-ac-on #ipr-bt-f label{display:none!important}" +
    ".ipe-pane.ipr-ac-on #ipr-bt-f{margin:0!important}" +
    ".ipe-pane.ipr-ac-fechado #ipr-pg-f,.ipe-pane.ipr-ac-fechado #ipr-px-f,.ipe-pane.ipr-ac-fechado #ipe-proj{display:none!important}" +
    ".ipr-ac{margin:0;border-top:1px solid var(--ln,#3a3f30)}" +
    ".ipr-ac.b{border-top:0;margin-top:6px}" +
    ".ipr-ac button{all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;gap:10px;width:100%;min-height:46px;padding:8px 10px 8px 6px;border-bottom:1px solid var(--ln,#3a3f30);color:var(--tx,#e9eadf);font:600 15px/1.25 Inter,system-ui,sans-serif}" +
    ".ipr-ac button:hover{background:rgba(155,197,61,.08)}" +
    ".ipr-ac button:focus-visible{outline:2px solid var(--ac,#9BC53D);outline-offset:-2px}" +
    ".ipr-ac .seta{flex:0 0 auto;width:0;height:0;border-style:solid;border-width:5px 0 5px 7px;border-color:transparent transparent transparent currentColor;transition:transform .15s}" +
    ".ipr-ac button[aria-expanded=true] .seta{transform:rotate(90deg)}" +
    ".ipr-ac button[aria-expanded=true]{background:rgba(155,197,61,.12);border-bottom-color:transparent}" +
    ".ipr-ac .nome{flex:1 1 auto;min-width:0}" +
    ".ipr-ac .n{flex:0 0 auto;min-width:22px;padding:2px 6px;border-radius:5px;text-align:center;font:600 12px/1.2 var(--mono,monospace);color:var(--mu,#a7ab98);border:1px solid var(--ln,#3a3f30)}" +
    ".ipr-ac button[aria-expanded=true] .n{color:#0f1a08;background:var(--ac,#9BC53D);border-color:var(--ac,#9BC53D)}" +
    ".ipr-ac button.zero{opacity:.55}" +
    ".ipe-pane.ipr-ac-on:not(.ipr-ac-fechado) #ipe-proj{padding-left:6px;border-left:2px solid var(--ac,#9BC53D);margin-left:2px}" +
    "@media (prefers-reduced-motion:reduce){.ipr-ac .seta{transition:none}}";
  (D.head || D.documentElement).appendChild(css);

  var FECHADO = ls("ipr_ac_fechado") === "1";

  function partes() {
    var pane = D.querySelector('#ipe .ipe-pane[data-pane="proj"]');
    var bar = D.getElementById("ipr-bt-f"), box = D.getElementById("ipe-proj");
    var abas = bar && (bar.querySelector(".abas") || bar.querySelector("select[data-bt-s]"));
    return { pane: pane, bar: bar, box: box, abas: abas };
  }
  function opcoes(abas) {
    if (abas.tagName === "SELECT") {
      return [].map.call(abas.options, function (x) {
        var m = /^(.*?)\s*\((\d+)\)\s*$/.exec(x.textContent || "");
        return { k: x.value, nome: m ? m[1] : x.textContent, n: m ? m[2] : "", sel: x.selected, titulo: "", botao: null };
      });
    }
    return [].map.call(abas.querySelectorAll("button[data-bt]"), function (b) {
      var sm = b.querySelector("small"), n = sm ? sm.textContent.trim() : "", nome = (b.firstChild && b.firstChild.nodeType === 3 ? b.firstChild.nodeValue : b.textContent.replace(n, "")).trim();
      return { k: b.getAttribute("data-bt"), nome: nome, n: n, sel: b.getAttribute("aria-selected") === "true", titulo: b.title || "", botao: b };
    });
  }
  function linha(o, aberta) {
    var b = D.createElement("button"); b.type = "button"; b.setAttribute("data-ac", o.k);
    b.setAttribute("aria-expanded", aberta ? "true" : "false");
    if (o.k && o.n === "0") b.className = "zero";
    if (o.titulo) b.title = o.titulo;
    var s = D.createElement("span"); s.className = "seta"; s.setAttribute("aria-hidden", "true");
    var t = D.createElement("span"); t.className = "nome"; t.textContent = o.nome;
    var n = D.createElement("span"); n.className = "n"; n.textContent = o.n;
    b.appendChild(s); b.appendChild(t); b.appendChild(n);
    return b;
  }
  function clique(e) {
    var b = e.target.closest("button[data-ac]"); if (!b) return;
    e.preventDefault();
    var k = b.getAttribute("data-ac"), p = partes(); if (!p.abas) return;
    var jaAberta = b.getAttribute("aria-expanded") === "true";
    if (jaAberta) { FECHADO = true; ls("ipr_ac_fechado", "1"); }
    else {
      FECHADO = false; ls("ipr_ac_fechado", "");
      if (p.abas.tagName === "SELECT") {
        if (p.abas.value !== k) { p.abas.value = k; p.abas.dispatchEvent(new Event("change", { bubbles: true })); }
      } else {
        var alvo = p.abas.querySelector('button[data-bt="' + k + '"]');
        if (alvo && alvo.getAttribute("aria-selected") !== "true") alvo.click();
      }
    }
    CHAVE = ""; montar();
    var nova = D.querySelector('.ipr-ac button[data-ac="' + k + '"]'); if (nova) try { nova.focus({ preventScroll: true }); } catch (x) {}
  }

  var CHAVE = "";
  function limpar(p) {
    ["ipr-ac-a", "ipr-ac-b"].forEach(function (id) { var x = D.getElementById(id); if (x) x.remove(); });
    if (p && p.pane) p.pane.classList.remove("ipr-ac-on", "ipr-ac-fechado");
    CHAVE = "";
  }
  function montar() {
    var p = partes();
    if (!p.pane || !p.bar || !p.box || !p.abas || p.bar.parentNode !== p.pane || p.box.parentNode !== p.pane) { limpar(p); return; }
    var op = opcoes(p.abas); if (!op.length) { limpar(p); return; }
    var sel = -1; op.forEach(function (o, i) { if (o.sel) sel = i; }); if (sel < 0) sel = 0;
    var a = D.getElementById("ipr-ac-a"), b = D.getElementById("ipr-ac-b");
    if (!a) { a = D.createElement("div"); a.id = "ipr-ac-a"; a.className = "ipr-ac"; a.setAttribute("role", "list"); parar(a); a.addEventListener("click", clique); }
    if (!b) { b = D.createElement("div"); b.id = "ipr-ac-b"; b.className = "ipr-ac b"; b.setAttribute("role", "list"); parar(b); b.addEventListener("click", clique); }
    // A: as linhas até à aberta, logo antes da barra do bases-tipos.js (que fica por cima dos filtros e dos cartões).
    if (a.parentNode !== p.pane || a.nextElementSibling !== p.bar) p.pane.insertBefore(a, p.bar);
    // B: as linhas depois da aberta, logo a seguir aos cartões.
    if (b.parentNode !== p.pane || b.previousElementSibling !== p.box) p.pane.insertBefore(b, p.box.nextSibling);
    p.pane.classList.add("ipr-ac-on");
    p.pane.classList.toggle("ipr-ac-fechado", FECHADO);
    var chave = [pt() ? 1 : 0, FECHADO ? 1 : 0, sel, op.map(function (o) { return o.k + ":" + o.nome + ":" + o.n; }).join("|")].join("#");
    if (chave === CHAVE && a.childNodes.length) return;
    CHAVE = chave; a.textContent = ""; b.textContent = "";
    a.setAttribute("aria-label", pt() ? "Tipos de Base" : "Base types");
    op.forEach(function (o, i) {
      var aberta = !FECHADO && i === sel;
      (FECHADO || i <= sel ? a : b).appendChild(linha(o, aberta));
    });
    b.style.display = b.childNodes.length ? "" : "none";
  }

  var t = 0;
  function vigia() { clearTimeout(t); t = setTimeout(function () { try { montar(); } catch (e) {} }, 120); }
  new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) {
      var x = ms[i].target;
      if (x && x.closest && x.closest(".ipr-ac")) continue;
      vigia(); return;
    }
  }).observe(D.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-selected", "selected"] });
  W.addEventListener("resize", vigia);
  D.addEventListener("ipr:lingua", function () { CHAVE = ""; vigia(); });
  vigia();
})();
