/* IPR Atlas · lista das camadas da Base sem saltos (Nuno, 2/11/2026, 09h12: «Quando carrego no check de uma camada o ecrã
   salta»). Acrescento, sem mexer no minhas-bases.js: a cada caixa ligada ou desligada, o minhas-bases.js refaz a lista toda
   (pintar: esvazia a caixa #ipr-mb e volta a enchê-la). A caixa tinha altura máxima de 52 % do ecrã e barra de rolar própria
   (invisível no Mac): ao esvaziar, essa barra voltava ao início, e era o salto. A mesma altura máxima escondia metade das
   camadas da Base (Hidrologia, Erosão, vento) dentro da caixa, sem se perceber que havia mais (Nuno, 09h15, Monte Branco
   da Serra: as 16 camadas estão na entrega, só não se viam).
   2/11, 09h38 (Nuno: continua sem todas as camadas e a saltar): a secção da lista encolhia para ~260 px dentro da barra
   da esquerda, que não rolava, e o painel «Camadas ligadas» tapava o resto; reproduzido com o Atlas real (camadas abaixo
   dos 900 px inalcançáveis) e corrigido: a secção não encolhe e a barra da esquerda rola inteira.
   Este guião: (1) tira a altura máxima, para a lista toda correr com a barra da esquerda; (2) guarda, antes do clique, onde
   estava a linha no ecrã e o deslocamento das caixas com barra de rolar; depois de cada refazer (o primeiro e os que vêm
   logo a seguir, quando a camada acaba de ligar) põe a mesma linha no mesmo sítio e devolve o foco à caixa, sem rolar.
   Desligar: ?mbsalto=0 ou localStorage ipr_mbsalto_off = 1. Terracrua Design. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]mbsalto=0\b/.test(W.location.search) || W.localStorage.getItem("ipr_mbsalto_off") === "1") return; } catch (e) {}
  if (W.__iprMbSalto) return; W.__iprMbSalto = 1;

  var ANC = null, OBS = null, OBSBOX = null;
  try {
    var st = D.createElement("style"); st.id = "ipr-mbsalto-css";
    st.textContent =
      // A secção da lista não encolhe (antes ficava com ~260 px e cortava as camadas por baixo do painel «Camadas
      // ligadas»); a barra da esquerda passa a rolar inteira, com a lista toda dentro.
      // 2/11, 10h39 (Nuno: «cada vez que se carrega em seja o que for, o site salta»): pôr a barra da esquerda inteira a
      // rolar fazia-a mexer a cada mudança de qualquer secção (produtos, painel «Camadas ligadas», foco do minhas-bases).
      // Agora só a secção das Bases rola, dentro do espaço que sobra; a barra fica parada e o painel «Camadas ligadas»
      // tem altura máxima com barra própria.
      // 2/11, 14h53 (Bernardo: «camadas da base ficaram numa janela à parte [...] difícil de visualizar, basta reverter a
      // como estava antes»): com Produtos aberto a secção das Bases ficava com ~140 px e barra própria. Volta a haver uma
      // só barra de rolar, a da esquerda inteira, com a lista toda à vista; os saltos continuam a ser corrigidos pelo
      // guião abaixo (repõe a mesma linha no mesmo sítio depois de cada refazer).
      "#ipr-mb{max-height:none!important;overflow-y:visible!important}" +
      "#ipe #ipe-esq{overflow-y:auto!important;overscroll-behavior:contain;overflow-anchor:none}" +
      "#ipe #ipe-esq>.ipe-sb[data-sb=\"locais\"],#ipe #ipe-esq>.ipe-sb.ipc-movido.ipc-movido[data-sb=\"locais\"]:has(#ipr-mb:not([hidden])){flex:0 0 auto!important;height:auto!important;max-height:none!important;min-height:0!important;overflow:visible!important}" +
      "#ipe #ipe-esq>.ipe-sb[data-sb=\"cam\"]{flex:0 0 auto!important}" +
      "#ipe #ipe-esq>#ipr-cq{flex:0 0 auto;max-height:28vh!important;overflow-y:auto!important;overscroll-behavior:contain}";
    (D.head || D.documentElement).appendChild(st);
  } catch (e) {}

  function rolaveis(el) {
    var r = [];
    for (var p = el; p && p !== D.documentElement; p = p.parentElement) {
      if (p.scrollHeight > p.clientHeight + 1) {
        var o = getComputedStyle(p).overflowY; if (o === "auto" || o === "scroll" || o === "overlay") r.push({ el: p, top: p.scrollTop });
      }
    }
    return r;
  }
  function chaveDe(el) {
    var c = el.closest("[data-mb-c]"); if (c) return { a: "data-mb-c", v: c.getAttribute("data-mb-c"), b: (el.closest("[data-mb]") || {}).getAttribute ? el.closest("[data-mb]").getAttribute("data-mb") : "" };
    var f = el.closest("[data-mb-foco]"); if (f) return { a: "data-mb-foco", v: f.getAttribute("data-mb-foco"), b: "" };
    return null;
  }
  function procura(box, k) {
    var q = "[" + k.a + '="' + String(k.v).replace(/["\\]/g, "\\$&") + '"]';
    if (k.b) { var li = box.querySelector('[data-mb="' + String(k.b).replace(/["\\]/g, "\\$&") + '"]'); var x = li && li.querySelector(q); if (x) return x; }
    return box.querySelector(q);
  }
  function guarda(alvo) {
    var box = D.getElementById("ipr-mb"); if (!box || !box.contains(alvo)) return;
    var k = chaveDe(alvo); if (!k) return;
    var linha = procura(box, k) || alvo;
    ANC = { k: k, y: linha.getBoundingClientRect().top, rol: rolaveis(box), wy: W.scrollY, ck: alvo.type === "checkbox", ate: Date.now() + 2500 };
    vigia(box);
  }
  function repoe() {
    if (!ANC) return;
    if (Date.now() > ANC.ate) { ANC = null; return; }
    var box = D.getElementById("ipr-mb"); if (!box) return;
    // 1) devolve o deslocamento que havia (o esvaziar cortou-o)
    ANC.rol.forEach(function (r) { if (D.contains(r.el) && Math.abs(r.el.scrollTop - r.top) > 1) r.el.scrollTop = r.top; });
    if (Math.abs(W.scrollY - ANC.wy) > 1) W.scrollTo(W.scrollX, ANC.wy);
    // 2) acerta para a linha ficar exactamente onde estava (a lista pode ter mudado de altura por cima dela)
    var linha = procura(box, ANC.k); if (!linha) return;
    var dy = linha.getBoundingClientRect().top - ANC.y;
    if (Math.abs(dy) > 1 && ANC.rol.length) { var c = ANC.rol[0].el; c.scrollTop += dy; ANC.rol[0].top = c.scrollTop; }
    // 3) foco de volta à caixa, sem rolar
    if (ANC.ck) {
      var ck = linha.matches && linha.matches('input[type="checkbox"]') ? linha : linha.querySelector('input[type="checkbox"]');
      if (ck && D.activeElement !== ck) try { ck.focus({ preventScroll: true }); } catch (e) {}
    }
  }
  // 2/11, 14h49 a 14h52 (Bernardo): «2 secções Hidrologia nas camadas da base cartográfica» e «camada das curvas de nível
  // 0,25 m está numa secção à parte, devia juntar-se com as restantes». Depois de cada refazer da lista: junta as
  // secções com o mesmo título (a segunda passa para o fim da primeira) e põe o curvas025 da entrega, com o nome
  // «Curvas de nível 0,25 m», junto das outras curvas. Só mexe na ordem das linhas; os cliques seguem por data-mb-c.
  function nomeDe(li) { var n = li.querySelector(".ipr-mb-n"); return n ? String(n.firstChild && n.firstChild.nodeType === 3 ? n.firstChild.nodeValue : n.textContent).trim() : ""; }
  function arrumar(box) {
    if (!box) return;
    [].forEach.call(box.querySelectorAll("ul.ipr-mb-cam"), function (ul) {
      var kids = [].slice.call(ul.children);
      // curvas025 junto das outras curvas
      kids.forEach(function (li) {
        if (!li.classList.contains("ipr-mb-it") || !/^ent/.test(li.getAttribute("data-mb-c") || "")) return;
        if (!/^curvas\s*0?25$/i.test(nomeDe(li))) return;
        var n = li.querySelector(".ipr-mb-n");
        if (n && n.firstChild && n.firstChild.nodeType === 3) n.firstChild.nodeValue = "Curvas de nível 0,25 m";
        var curvas = [].filter.call(ul.children, function (x) { return x !== li && x.classList.contains("ipr-mb-it") && /^Curvas de n[ií]vel/i.test(nomeDe(x)); });
        if (!curvas.length) return;
        var antes = li.previousElementSibling;
        ul.insertBefore(li, curvas[0]);
        if (antes && antes.classList.contains("ipr-mb-sub") && (!antes.nextElementSibling || antes.nextElementSibling.classList.contains("ipr-mb-sub"))) antes.remove();
      });
      // secções repetidas: a segunda vai para o fim da primeira
      var vistos = {};
      [].slice.call(ul.children).forEach(function (sub) {
        if (!sub.classList.contains("ipr-mb-sub") || !sub.parentNode) return;
        var k = String(sub.textContent || "").trim().toLowerCase();
        if (!vistos[k]) { vistos[k] = sub; return; }
        var itens = [], x = sub.nextElementSibling;
        while (x && !x.classList.contains("ipr-mb-sub")) { itens.push(x); x = x.nextElementSibling; }
        var fim = vistos[k].nextElementSibling;
        while (fim && !fim.classList.contains("ipr-mb-sub")) fim = fim.nextElementSibling;
        itens.forEach(function (it) { ul.insertBefore(it, fim); });
        sub.remove();
      });
    });
  }
  function vigia(box) {
    if (!box || OBSBOX === box) return;
    if (OBS) try { OBS.disconnect(); } catch (e) {}
    OBSBOX = box;
    OBS = new MutationObserver(function () { try { arrumar(box); } catch (e) {} if (ANC) { repoe(); W.requestAnimationFrame(repoe); } });
    // também as mudanças dentro das linhas (legendas que aparecem, «a carregar» que some), não só o refazer da lista
    OBS.observe(box, { childList: true, subtree: true });
    try { new ResizeObserver(function () { if (ANC) repoe(); }).observe(box); } catch (e) {}
    try { arrumar(box); } catch (e) {}
  }
  setInterval(function () { try { vigia(D.getElementById("ipr-mb")); } catch (e) {} }, 1000);

  // Corre antes do minhas-bases.js (que ouve na própria caixa): fase de captura no documento.
  D.addEventListener("pointerdown", function (e) { try { if (e.target.closest && e.target.closest("#ipr-mb")) guarda(e.target); } catch (x) {} }, true);
  D.addEventListener("keydown", function (e) { try { if ((e.key === " " || e.key === "Enter") && e.target.closest && e.target.closest("#ipr-mb")) guarda(e.target); } catch (x) {} }, true);
  D.addEventListener("change", function (e) {
    try {
      var t = e.target; if (!t || t.type !== "checkbox" || !t.closest || !t.closest("#ipr-mb")) return;
      if (!ANC) guarda(t); else ANC.ate = Date.now() + 2500;
      // o refazer acontece já a seguir (no mesmo evento) e outra vez quando a camada acaba de ligar
      W.requestAnimationFrame(repoe); [150, 600, 1200, 2000].forEach(function (t) { setTimeout(repoe, t); });
    } catch (x) {}
  }, true);
  D.addEventListener("click", function (e) {
    try {
      var b = e.target.closest && e.target.closest("#ipr-mb [data-mb-acc]"); if (!b) return;
      var a = b.getAttribute("data-mb-acc"); if (a === "ver" || a === "ficha") return; // estes mudam de vista de propósito
      if (!ANC) guarda(b);
      W.requestAnimationFrame(repoe); setTimeout(repoe, 150);
    } catch (x) {}
  }, true);
})();
