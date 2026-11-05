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
   Cores do tema grafite (Bolito, decisão do Nuno de 04/11, 22h2x): linha aberta a preto com letra Verde IPR e filete
   dourado; números em etiqueta escura com letra verde clara.
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
    ".ipr-ac{margin:0;border-top:1px solid var(--ln,#383A33)}" +
    ".ipr-ac.b{border-top:0;margin-top:6px}" +
    ".ipr-ac button{all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;gap:10px;width:100%;min-height:46px;padding:8px 10px 8px 6px;border-bottom:1px solid var(--ln,#383A33);color:var(--tx,#F5F4EE);font:600 14px/1.25 Inter,system-ui,sans-serif}" +
    ".ipr-ac button:hover{background:rgba(255,255,255,.04)}" +
    ".ipr-ac button:focus-visible{outline:2px solid var(--ac,#94BE39);outline-offset:-2px}" +
    ".ipr-ac .seta{flex:0 0 auto;width:0;height:0;border-style:solid;border-width:5px 0 5px 7px;border-color:transparent transparent transparent currentColor;transition:transform .15s}" +
    ".ipr-ac button[aria-expanded=true] .seta{transform:rotate(90deg)}" +
    ".ipr-ac button[aria-expanded=true]{background:#000;color:var(--ac,#94BE39);box-shadow:inset 3px 0 0 #B8A83A;border-bottom-color:transparent}" +
    ".ipr-ac .nome{flex:1 1 auto;min-width:0}" +
    ".ipr-ac .n{flex:0 0 auto;min-width:22px;padding:2px 6px;border-radius:5px;text-align:center;font:600 12px/1.2 var(--mono,monospace);color:#B5D86A;background:#0B0C0A;border:0}" +
    ".ipr-ac button[aria-expanded=true] .n{color:#0B0C0A;background:var(--ac,#94BE39)}" +
    ".ipr-ac button.zero{opacity:.55}" +
    ".ipe-pane.ipr-ac-on:not(.ipr-ac-fechado) #ipe-proj{padding-left:6px;border-left:2px solid var(--ac,#94BE39);margin-left:2px}" +
    "@media (prefers-reduced-motion:reduce){.ipr-ac .seta{transition:none}}";
  (D.head || D.documentElement).appendChild(css);

  /* 05/11/2026, 09h14 (Nuno, sobre o separador «Bases»): «o projeto de demonstração [...] não faz sentido estar aqui, porque
     já está a repetir a sub-bacia da Ribeira do Torgal. Depois tens esta cena de mostrar todas [...] não precisa disto para
     nada. E o procurar, estado, dono, implementação, podes ter, mas quer só uma barra, isto ocupa muito espaço.»
     1. Esconde a linha «Projecto de demonstração» (#ipr-demo783, m90783) só neste separador: o Torgal já está na barra de
        cima e na lista, em «Projectos entregues».
     2. Esconde a caixa «Todas / Prontas / Mostrar / … com tudo carregado» (#ipr-pg-f, projectos-grupos.js). Antes de a
        esconder, repõe «Todas» e «Mostrar: todas», para nenhuma Base ficar escondida por uma escolha antiga que já não se
        vê. O estado escolhe-se na barra de pesquisa. A etiqueta «Tudo carregado / Falta» de cada cartão fica.
     3. A pesquisa e os filtros (#ipr-px-f, projectos-extra.js) ficam numa só linha baixa: campo de procura a ocupar o resto,
        Estado, Dono e Implementação em listas curtas (a escolhida fica com contorno verde) e «×» para limpar.
     Desligar só isto: ?bcomp=0 ou localStorage ipr_bcomp_off = 1. */
  var COMP = true;
  try { if (/[?&]bcomp=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_bcomp_off") === "1") COMP = false; } catch (e) {}
  if (COMP) {
    var P = '#ipe .ipe-pane[data-pane="proj"] ';
    var c2 = D.createElement("style"); c2.id = "ipr-ac-comp-css";
    c2.textContent =
      P + "#ipr-demo783," + P + "#ipr-pg-f{display:none!important}" +
      P + "#ipr-px-f{display:flex!important;flex-wrap:nowrap!important;gap:4px!important;align-items:center;margin:6px 0 8px!important;padding:0!important;border:0!important;background:none!important}" +
      P + "#ipr-px-f[hidden]{display:none!important}" +
      P + "#ipr-px-f input,#ipe .ipe-pane[data-pane=\"proj\"] #ipr-px-f select{min-height:32px!important;height:32px;margin:0!important;border:1px solid #383A33!important;border-radius:2px!important;background-color:#232420!important;color:#F5F4EE!important;font:400 12px/1.2 Inter,system-ui,sans-serif!important;box-sizing:border-box}" +
      P + "#ipr-px-f input{flex:2 1 0!important;min-width:84px!important;width:auto!important;padding:0 8px!important}" +
      P + "#ipr-px-f input::placeholder{color:#8E9186}" +
      P + "#ipr-px-f select{flex:1 1 0!important;min-width:0!important;max-width:none!important;width:auto!important;padding:0 16px 0 6px!important;text-overflow:ellipsis;white-space:nowrap;overflow:hidden;cursor:pointer;-webkit-appearance:none;appearance:none;" +
        "background-image:linear-gradient(45deg,transparent 50%,#C3C5BC 50%),linear-gradient(135deg,#C3C5BC 50%,transparent 50%)!important;background-position:calc(100% - 9px) 14px,calc(100% - 5px) 14px!important;background-size:4px 4px,4px 4px!important;background-repeat:no-repeat!important}" +
      P + "#ipr-px-f select.ipr-ac-sel{border-color:#94BE39!important;color:#B5D86A!important}" +
      P + "#ipr-px-f input:focus-visible," + P + "#ipr-px-f select:focus-visible{outline:1px solid #94BE39!important;outline-offset:0!important;border-color:#94BE39!important}" +
      P + "#ipr-px-f .ipr-px-n{display:none!important}" +
      P + "#ipr-px-f .ipr-px-l{flex:0 0 auto;min-height:32px!important;height:32px;width:32px;padding:0!important;border:1px solid #383A33!important;border-radius:2px!important;font:600 0/1 Inter,system-ui,sans-serif!important;color:transparent!important;position:relative;background:transparent!important}" +
      P + "#ipr-px-f .ipr-px-l:after{content:'\\00d7';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:400 18px/1 Inter,system-ui,sans-serif;color:#F5F4EE}" +
      P + "#ipr-px-f .ipr-px-l[hidden]{display:none!important}" +
      "@media (max-width:600px){" + P + "#ipr-px-f input," + P + "#ipr-px-f select{font-size:16px!important;min-height:38px!important;height:38px}" + P + "#ipr-px-f select{background-position:calc(100% - 9px) 17px,calc(100% - 5px) 17px!important}" + P + "#ipr-px-f .ipr-px-l{height:38px;width:38px;min-height:38px!important}}";
    (D.head || D.documentElement).appendChild(c2);
  }
  var CURTO = { e: ["Estado", "Status"], d: ["Dono", "Owner"], i: ["Implem.", "Implem."] };
  function compactar() {
    if (!COMP) return;
    var pane = D.querySelector('#ipe .ipe-pane[data-pane="proj"]'); if (!pane) return;
    // 2. repor «Todas» e «Mostrar: todas» na caixa escondida
    var pg = D.getElementById("ipr-pg-f");
    if (pg && pg.parentNode === pane) {
      var aba = pg.querySelector('[data-aba][aria-selected="true"]');
      if (aba && aba.getAttribute("data-aba") !== "") { var t0 = pg.querySelector('[data-aba=""]'); if (t0) t0.click(); }
      var ver = pg.querySelector('select[data-pg="ver"]');
      if (ver && ver.value !== "") { ver.value = ""; ver.dispatchEvent(new Event("change", { bubbles: true })); }
    }
    // 3. nomes curtos na primeira opção de cada lista e contorno na escolhida
    var px = D.getElementById("ipr-px-f"); if (!px || px.parentNode !== pane) return;
    [].forEach.call(px.querySelectorAll("select[data-px-f]"), function (s) {
      var k = s.getAttribute("data-px-f"), c = CURTO[k], o = s.options[0];
      if (c && o && o.value === "") { var nt = pt() ? c[0] : c[1]; if (o.textContent !== nt) { if (!s.title) s.title = s.getAttribute("aria-label") || ""; o.textContent = nt; } }
      var on = s.value !== ""; if (s.classList.contains("ipr-ac-sel") !== on) s.classList.toggle("ipr-ac-sel", on);
    });
    var q = D.getElementById("ipr-px-q"), ph = pt() ? "Procurar" : "Search";
    if (q && q.placeholder !== ph) { if (!q.title) q.title = q.placeholder; q.placeholder = ph; }
  }
  D.addEventListener("change", function (e) { if (e.target && e.target.closest && e.target.closest("#ipr-px-f")) setTimeout(compactar, 0); }, true);

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
  function vigia() { clearTimeout(t); t = setTimeout(function () { try { montar(); } catch (e) {} try { compactar(); } catch (e) {} }, 120); }
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
