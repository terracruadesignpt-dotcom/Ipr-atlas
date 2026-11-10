/* IPR Atlas · bases-finas.js (05/11/2026). Terracrua Design. Só acrescenta; não mexe noutros ficheiros.
   Nuno, 05/11/2026, 09h44: «quero que as bases apareçam como as condicionantes, como as camadas do lado esquerdo, com um
   título fininho e depois uma setinha, e quando carregas a setinha então aparecem os projetos por baixo. E os projetos por
   baixo vão aparecer também fininhos, como as camadas estão do lado esquerdo.»
   09h46: «Falta a opção apagar [...] vê lá se não faltam opções nas bases, porque é neste painel aqui que eu quero ver todas
   as opções.» «E falta também fazer leitura [...] e se calhar falta aqui o botãozinho para ver o 3D».
   1. Cada cartão do separador de Bases fica numa linha fina, como uma camada: setinha, nome, área e um ponto com o estado
      (verde: entregue; âmbar: em curso). O «⋯» fica à direita. Carregar na linha abre o cartão completo por baixo (tudo o
      que lá estava); carregar outra vez fecha. Os títulos com setinha (Todas, Pedidos, Projectos entregues…) são os do
      bases-acordeao.js. As linhas abertas ficam lembradas neste navegador.
   2. O menu «⋯» (bases-tipos.js) passa a ter todas as opções do cartão, além das que já tinha: Ver em 3D, Leitura
      Territorial, Ficheiros, Ficheiros e AutoCAD, Linha do projecto, Ficha da propriedade, Planta de localização,
      Descarregar tudo, Levar para o campo (QField), Partilhar, Convidar, Juntar à organização, Pedir visita técnica,
      Arquivar e Apagar. Cada uma carrega no botão que a página já tem (no cartão ou na lista curta «Os meus projectos»),
      com as confirmações de sempre; nada se apaga sem a pergunta do próprio botão.
   10/11/2026 (Nuno, chamada com o Norbert: «a ficha quando se abre e se fecha já não se consegue abrir»):
   - o cartão da Base aberta no mapa (ipr-actual) abre e fecha pelo app.js/ajustes.js, que apanham o clique antes desta linha
     e mudam a classe «on»; a linha fina passa a seguir essa classe (aberto = ipr-fn-on ou on), em vez de ficar fechada com
     o conteúdo à vista;
   - o app.js volta a desenhar o cartão depois de o abrir; a linha aberta é lembrada pelo número da encomenda (antes pela
     marca data-ec-id, que o cartão novo ainda não tinha, e a linha voltava fechada);
   - ao fechar, sai o display:block que o fluxo-ficha.js põe no conteúdo para o mostrar.
   Desligar: ?bfinas=0 ou localStorage ipr_bfinas_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]bfinas=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_bfinas_off") === "1") return; } catch (e) {}
  if (W.__iprBFinas) return; W.__iprBFinas = 1;

  function pt() { return (W.IPR_LINGUA || "pt") !== "en"; }
  function T(a, b) { return pt() ? a : b; }
  function el(t, c, x) { var e = D.createElement(t); if (c) e.className = c; if (x != null) e.textContent = String(x); return e; }
  function ls(k, v) { try { if (v === undefined) return W.localStorage.getItem(k) || ""; W.localStorage.setItem(k, v); } catch (e) { return ""; } }
  function est() { return W.__ipe && W.__ipe.estado || null; }

  var ABERTAS = {}; ls("ipr_bfinas_abertas").split(",").forEach(function (k) { if (k) ABERTAS[k] = 1; });
  function guardar() { ls("ipr_bfinas_abertas", Object.keys(ABERTAS).slice(-30).join(",")); }

  var C = '#ipe-proj .ipe-card.ipr-fn';
  var F = C + ':not(.ipr-fn-on):not(.on)';
  var css = el("style"); css.id = "ipr-fn-css";
  css.textContent =
    C + " .ipe-ct{position:relative}" +
    C + " .ipe-ct > strong{display:none!important}" +
    C + " .ipe-ct > .ipr-bt-b{position:absolute!important;right:0;top:3px;float:none!important;margin:0!important;width:30px!important;height:28px!important;z-index:2}" +
    F + "{padding:0!important;margin:0!important;border:0!important;border-bottom:1px solid #383A33!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;min-height:0!important}" +
    F + " > :not(.ipe-cc){display:none!important}" +
    F + " .ipe-cc{display:block!important;padding:0!important;margin:0!important;min-height:0!important;gap:0!important}" +
    F + " .ipe-thumb{display:none!important}" +
    F + " .ipe-ct{padding:0!important;margin:0!important}" +
    F + " .ipe-ct > :not(.ipr-fn-h):not(.ipr-bt-b){display:none!important}" +
    ".ipr-fn-h{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:8px;width:100%;min-height:34px;padding:5px 36px 5px 4px;cursor:pointer;color:#F5F4EE;font:600 13px/1.25 Inter,system-ui,sans-serif}" +
    ".ipr-fn-h:hover{background:rgba(255,255,255,.04)}" +
    ".ipr-fn-h:focus-visible{outline:2px solid #94BE39;outline-offset:-2px}" +
    ".ipr-fn-h .s{flex:0 0 auto;width:0;height:0;border-style:solid;border-width:4px 0 4px 6px;border-color:transparent transparent transparent #C3C5BC;transition:transform .15s}" +
    ".ipr-fn-on .ipr-fn-h .s,#ipe-proj .ipe-card.ipr-fn.on .ipr-fn-h .s{transform:rotate(90deg)}" +
    ".ipr-fn-h .d{flex:0 0 auto;width:7px;height:7px;border-radius:50%;background:#D9A441}" +
    ".ipr-fn-h .d.ok{background:#94BE39}" +
    ".ipr-fn-h .t{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    ".ipr-fn-h .a{flex:0 0 auto;font:400 11px/1 'IBM Plex Mono',ui-monospace,monospace;color:#8E9186}" +
    "#ipe-proj .ipe-card.ipr-fn.ipr-fn-on,#ipe-proj .ipe-card.ipr-fn.on{margin:2px 0 8px!important}" +
    ".ipr-fn-on .ipr-fn-h,#ipe-proj .ipe-card.ipr-fn.on .ipr-fn-h{color:#94BE39;margin-bottom:4px;border-bottom:1px solid #383A33}" +
    "#ipr-bt-m button.ipr-fn-del{color:#E0705A}" +
    "@media (max-width:600px){.ipr-fn-h{min-height:44px;font-size:14px}}" +
    "@media (prefers-reduced-motion:reduce){.ipr-fn-h .s{transition:none}}";
  (D.head || D.documentElement).appendChild(css);

  function mapaDe(c) { var P = est(), i = +c.getAttribute("data-i"); return P && P.mapas && P.mapas[i] || null; }
  function idDe(c) { var m = mapaDe(c); return (m && m.id ? String(m.id) : "") || c.getAttribute("data-ec-id") || ("i" + c.getAttribute("data-i")); }
  function aberto(c) { return c.classList.contains("ipr-fn-on") || c.classList.contains("on"); }

  function cabeca(c) {
    var ct = c.querySelector(".ipe-ct"); if (!ct) return null;
    var h = ct.querySelector(":scope > .ipr-fn-h");
    var st = ct.querySelector(":scope > strong"), nome = st ? st.textContent.trim() : "";
    var area = ""; [].some.call(ct.querySelectorAll(":scope > span.mono"), function (s) { var m = /([\d\s.,]+\s*ha)\b/.exec(s.textContent); if (m) { area = m[1].trim(); return true; } return false; });
    var pill = ct.querySelector(".ipe-pill"), ok = !!(pill && /(^|\s)ok(\s|$)|entregue/i.test(pill.className + " " + pill.textContent));
    var chave = nome + "|" + area + "|" + (ok ? 1 : 0) + "|" + (pill ? pill.textContent.trim() : "");
    if (h && h.dataset.k === chave) return h;
    if (!h) {
      h = el("div", "ipr-fn-h"); h.setAttribute("role", "button"); h.tabIndex = 0;
      ["mousedown", "pointerdown", "touchstart"].forEach(function (v) { h.addEventListener(v, function (e) { e.stopPropagation(); }); });
      h.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); alternar(c); });
      h.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); alternar(c); } });
      var bt = ct.querySelector(":scope > .ipr-bt-b");
      ct.insertBefore(h, bt ? bt.nextSibling : ct.firstChild);
    }
    h.dataset.k = chave; h.textContent = "";
    h.appendChild(el("span", "s")); var d = el("span", "d" + (ok ? " ok" : "")); d.title = pill ? pill.textContent.trim().replace(/^[●\s]+/, "") : ""; h.appendChild(d);
    h.appendChild(el("span", "t", nome)); if (area) h.appendChild(el("span", "a", area));
    h.title = nome;
    return h;
  }
  function alternar(c, abrir) {
    var k = idDe(c), on = abrir === undefined ? !aberto(c) : !!abrir;
    c.classList.toggle("ipr-fn-on", on);
    if (on) ABERTAS[k] = 1; else delete ABERTAS[k];
    var h = c.querySelector(".ipr-fn-h"); if (h) h.setAttribute("aria-expanded", on ? "true" : "false");
    guardar();
  }
  function arrumar() {
    [].forEach.call(D.querySelectorAll("#ipe-proj .ipe-card[data-i]"), function (c) {
      if (!c.classList.contains("ipr-fn")) { c.classList.add("ipr-fn"); if (ABERTAS[idDe(c)]) c.classList.add("ipr-fn-on"); }
      var ab = aberto(c);
      if (c.classList.contains("on") && !c.classList.contains("ipr-fn-on")) c.classList.add("ipr-fn-on");
      // 10/11: fechado, o conteúdo volta a esconder-se (o fluxo-ficha.js deixava-o à vista com display:block)
      if (!ab) { var cx = c.querySelector(":scope > .ipe-cx"); if (cx && cx.style.display) cx.style.removeProperty("display"); }
      var h = cabeca(c), v = ab ? "true" : "false"; if (h && h.getAttribute("aria-expanded") !== v) h.setAttribute("aria-expanded", v); // 05/11: só quando muda (antes 53 escritas a cada mudança na página)
    });
  }

  // ---------- menu «⋯» com todas as opções ----------
  function botaoPorTexto(c, txt) {
    var r = null;
    [].some.call(c.querySelectorAll("button,summary,a"), function (b) { if (b.closest("#ipr-bt-m") || b.closest(".ipr-fn-h")) return false; if (b.textContent.replace(/\s+/g, " ").trim() === txt) { r = b; return true; } return false; });
    return r;
  }
  function temLeitura(m) { return !!(m && (m.downloads || []).some(function (d) { return /Leitura_Territorial|Leitura Territorial/i.test(String(d && d.nome || "")); })); }
  function completar(M) {
    if (M.dataset.fn) return; M.dataset.fn = "1";
    var b0 = D.querySelector('#ipe-proj .ipr-bt-b[aria-expanded="true"]'), c = b0 && b0.closest(".ipe-card[data-i]");
    if (!c) return;
    var id = c.getAttribute("data-ec-id") || "", m = mapaDe(c);
    var ja = {}; [].forEach.call(M.querySelectorAll("button"), function (b) { ja[b.textContent.replace(/[›✓]/g, "").replace(/\s+/g, " ").trim().toLowerCase()] = 1; });
    var tma = id ? D.querySelector('.ipr-tma[data-id="' + id + '"]') : null;
    var L = [];
    function por(rotulo, alvo, cls) { if (!alvo || ja[rotulo.toLowerCase()]) return; ja[rotulo.toLowerCase()] = 1; L.push([rotulo, alvo, cls || ""]); }
    function sep() { if (L.length && L[L.length - 1] !== "hr") L.push("hr"); }
    // ver
    por(T("Ver em 3D", "View in 3D"), tma && tma.querySelector('[data-a="v3d"]'));
    if (!ja[T("fazer leitura", "order reading")]) {
      if (temLeitura(m)) por(T("Leitura Territorial (em Ficheiros)", "Territorial Reading (in Files)"), c.querySelector('button[data-bp="f"]'));
      else por(T("Fazer Leitura", "Order Reading"), botaoPorTexto(c, T("Encomendar a Leitura Territorial deste terreno", "Order the Territorial Reading for this land")));
    }
    por(T("Ficheiros", "Files"), c.querySelector('button[data-bp="f"]'));
    por(T("Ficheiros e AutoCAD", "Files and AutoCAD"), c.querySelector(".ipr-pfb"));
    por(T("Linha do projecto", "Project timeline"), c.querySelector('button[data-bp="l"]'));
    por(T("Ficha da propriedade", "Property sheet"), botaoPorTexto(c, T("Ver a ficha da propriedade", "View the property sheet")) || botaoPorTexto(c, T("Ficha da propriedade", "Property sheet")));
    if (!ja[T("fazer planta", "make plan")]) por(T("Planta de localização", "Location plan"), botaoPorTexto(c, T("Planta de localização", "Location plan")) || (tma && tma.querySelector('[data-a="planta"]')));
    por(T("Descarregar tudo", "Download all"), botaoPorTexto(c, T("Descarregar tudo", "Download all")));
    por(T("Levar para o campo (QField)", "Take to the field (QField)"), c.querySelector(".ipr-qf-b"));
    sep();
    por(T("Partilhar", "Share"), botaoPorTexto(c, T("Partilhar", "Share")) || (tma && tma.querySelector('[data-a="partilhar"]')));
    por(T("Convidar", "Invite"), botaoPorTexto(c, T("Convidar", "Invite")));
    por(T("Juntar à organização", "Add to organisation"), botaoPorTexto(c, T("Juntar à organização", "Add to organisation")));
    por(T("Pedir visita técnica", "Request a site visit"), botaoPorTexto(c, T("Pedir visita técnica", "Request a site visit")));
    por(T("Arquivar", "Archive"), botaoPorTexto(c, T("Arquivar", "Archive")));
    por(T("Apagar", "Delete"), c.querySelector(".ipr-del") || (tma && tma.querySelector('[data-a="eliminar"]')), "ipr-fn-del");
    if (L[L.length - 1] === "hr") L.pop();
    if (!L.length) return;
    M.appendChild(el("hr"));
    L.forEach(function (x) {
      if (x === "hr") { M.appendChild(el("hr")); return; }
      var b = el("button", x[2], x[0]); b.type = "button"; b.setAttribute("role", "menuitem");
      b.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        var alvo = x[1];
        try { var f = D.getElementById("ipr-bt-m"); if (f) f.remove(); if (b0) b0.setAttribute("aria-expanded", "false"); } catch (z) {}
        if (!alvo.closest(".ipr-tma")) alternar(c, true);
        setTimeout(function () { try { alvo.click(); if (alvo.tagName === "SUMMARY") alvo.scrollIntoView({ block: "nearest" }); } catch (z) {} }, 30);
      });
      M.appendChild(b);
    });
    // não deixar o menu sair do ecrã depois de crescer
    setTimeout(function () { try { var r = M.getBoundingClientRect(), H = W.innerHeight || 800; if (r.bottom > H - 8) M.style.top = Math.max(8, H - r.height - 8) + "px"; } catch (z) {} }, 0);
  }

  // ---------- o separador chama-se «Bases» logo à primeira (Nuno, 09h59: «aparece-me sempre ali uma coisa a dizer projetos
  // e depois é que muda para bases»). O projectos-grupos.js só o renomeia depois de receber os grupos do servidor; aqui o
  // nome muda no mesmo instante em que o separador é desenhado (antes de o ecrã ser pintado). Só para a equipa, como lá.
  function equipa() { var E = W.tcdEquipa; return !!(E && E.email && W.tcdNonce); }
  function rotulo() {
    if (!equipa()) return;
    var b = D.querySelector('#ipe [data-tab="proj"]'); if (!b) return;
    var tn = [].filter.call(b.childNodes, function (n) { return n.nodeType === 3 && /\S/.test(n.nodeValue); })[0];
    if (tn) { if (/^\s*(Projectos|Projects)\s*$/.test(tn.nodeValue)) tn.nodeValue = "Bases"; }
    else if (b.children.length === 0 && /^\s*(Projectos|Projects)\s*$/.test(b.textContent)) b.textContent = "Bases";
  }
  try { new MutationObserver(function () { try { rotulo(); } catch (e) {} }).observe(D.documentElement, { childList: true, subtree: true, characterData: true }); } catch (e) {}
  rotulo();

  // ---------- arrastar uma Base para outra pasta (Nuno, 10h12/10h17: «quero poder facilmente, arrastando, movê-las para
  // outras pastas»). Só a equipa, com rato (no telemóvel fica «⋯ › Mudar de tipo»). Larga-se a linha da Base em cima do
  // título da pasta (Pedidos, Dias abertos, Reuniões, Projectos, Projectos entregues, Implementação). Grava pela rota de
  // sempre (m735/tipo, a mesma de «Mudar de tipo»), que vale para a equipa toda; o resto da casa reage a essa gravação.
  var ARR = null, PASTAS = { pedido: 1, dia_aberto: 1, reuniao: 1, projecto: 1, entregue: 1, impl: 1 };
  var cssArr = el("style"); cssArr.id = "ipr-fn-arr-css";
  cssArr.textContent =
    "html.ipr-fn-eq .ipr-fn-h{cursor:grab}html.ipr-fn-arr .ipr-fn-h{cursor:grabbing}" +
    ".ipe-card.ipr-fn-a{opacity:.45}" +
    "html.ipr-fn-arr .ipr-ac button[data-ac]:not([data-ac='']):not([data-ac='sem']){outline:1px dashed #5E6157;outline-offset:-3px}" +
    "html.ipr-fn-arr .ipr-ac button.ipr-fn-alvo{outline:2px solid #94BE39!important;background:rgba(148,190,57,.12)!important}" +
    "#ipr-fn-msg{position:fixed;z-index:100002;left:50%;bottom:24px;transform:translateX(-50%);padding:8px 14px;border-radius:2px;background:#232420;border:1px solid #383A33;border-left:3px solid #94BE39;color:#F5F4EE;font:500 13px/1.3 Inter,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.4)}";
  (D.head || D.documentElement).appendChild(cssArr);
  function msg(t, mau) {
    var m = D.getElementById("ipr-fn-msg"); if (!m) { m = el("div"); m.id = "ipr-fn-msg"; m.setAttribute("role", "status"); D.body.appendChild(m); }
    m.textContent = t; m.style.borderLeftColor = mau ? "#E0705A" : "#94BE39"; clearTimeout(msg.t); msg.t = setTimeout(function () { m.remove(); }, 3500);
  }
  function nomePasta(b) { var n = b.querySelector(".nome"); return n ? n.textContent.trim() : b.textContent.trim(); }
  D.addEventListener("dragstart", function (e) {
    var h = e.target && e.target.closest && e.target.closest(".ipr-fn-h"); if (!h || !equipa()) return;
    var c = h.closest(".ipe-card[data-i]"), id = c && c.getAttribute("data-ec-id"); if (!id) return;
    ARR = { id: id, c: c, nome: (h.querySelector(".t") || h).textContent.trim() };
    try { e.dataTransfer.setData("text/plain", "ipr-base:" + id); e.dataTransfer.effectAllowed = "move"; } catch (x) {}
    c.classList.add("ipr-fn-a"); D.documentElement.classList.add("ipr-fn-arr");
  }, true);
  D.addEventListener("dragend", function () {
    if (ARR && ARR.c) ARR.c.classList.remove("ipr-fn-a"); ARR = null; D.documentElement.classList.remove("ipr-fn-arr");
    [].forEach.call(D.querySelectorAll(".ipr-fn-alvo"), function (b) { b.classList.remove("ipr-fn-alvo"); });
  }, true);
  function alvo(e) { var b = e.target && e.target.closest && e.target.closest(".ipr-ac button[data-ac]"); return b && PASTAS[b.getAttribute("data-ac")] ? b : null; }
  D.addEventListener("dragover", function (e) {
    if (!ARR) return; var b = alvo(e);
    [].forEach.call(D.querySelectorAll(".ipr-fn-alvo"), function (x) { if (x !== b) x.classList.remove("ipr-fn-alvo"); });
    if (!b) return; e.preventDefault(); try { e.dataTransfer.dropEffect = "move"; } catch (x) {} b.classList.add("ipr-fn-alvo");
  }, true);
  D.addEventListener("drop", function (e) {
    if (!ARR) return; var b = alvo(e); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    var a = ARR, k = b.getAttribute("data-ac"), pasta = nomePasta(b);
    msg(T("A mover «" + a.nome + "» para " + pasta + "…", "Moving «" + a.nome + "» to " + pasta + "…"));
    fetch("/wp-json/tcd/v1/m735/tipo", { method: "POST", credentials: "same-origin", headers: { "X-WP-Nonce": W.tcdNonce || "", "Content-Type": "application/json" }, body: JSON.stringify({ enc: +a.id, tipo: k }) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.ok) throw new Error((j && j.message) || r.status); return j; }); })
      .then(function () {
        msg(T("«" + a.nome + "» passou para " + pasta + ".", "«" + a.nome + "» moved to " + pasta + "."));
        try { if (W.__iprBTipos && W.__iprBTipos.actualizar) W.__iprBTipos.actualizar(); } catch (x) {}
        try { D.dispatchEvent(new CustomEvent("ipr:base-pasta", { detail: { enc: +a.id, tipo: k } })); } catch (x) {}
      })
      .catch(function (x) { msg(T("Não foi possível mover: ", "Could not move: ") + (x && x.message || ""), true); });
  }, true);
  function arrastaveis() {
    var eq = equipa(); D.documentElement.classList.toggle("ipr-fn-eq", eq);
    if (!eq || (W.innerWidth || 1000) < 600) return;
    [].forEach.call(D.querySelectorAll(".ipr-fn-h:not([draggable])"), function (h) { h.setAttribute("draggable", "true"); h.title = (h.title ? h.title + " · " : "") + T("arraste para outra pasta", "drag to another folder"); });
  }

  var t = 0;
  function vigia() { if (t) return; t = setTimeout(function () { t = 0; try { arrumar(); } catch (e) {} try { arrastaveis(); } catch (e) {} }, 120); }
  new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) {
      var a = ms[i].addedNodes;
      for (var j = 0; j < a.length; j++) {
        var n = a[j];
        if (n.nodeType === 1 && n.id === "ipr-bt-m") { (function (M) { setTimeout(function () { try { completar(M); } catch (e) {} }, 60); })(n); }
      }
      var x = ms[i].target;
      if (x && x.closest && (x.closest(".ipr-fn-h") || x.closest("#ipr-bt-m"))) continue;
      vigia();
    }
  }).observe(D.body || D.documentElement, { childList: true, subtree: true });
  // 10/11: quem decide se o cartão está aberto é o ajustes.js (classe «on», um só cartão aberto de cada vez); na Base que já
  // está aberta no mapa ele apanhava o clique antes de chegar aqui e a linha ficava fora de passo (aberta com o conteúdo
  // escondido, ou fechada com tudo à vista). Depois de cada clique na linha, a linha segue o «on».
  function seguir(i) {
    var c = D.querySelector('#ipe-proj .ipe-card[data-i="' + i + '"]'); if (!c) return;
    var on = c.classList.contains("on"), k = idDe(c);
    if (c.classList.contains("ipr-fn-on") !== on) c.classList.toggle("ipr-fn-on", on);
    if (on) ABERTAS[k] = 1; else { delete ABERTAS[k]; c.classList.remove("ipr-ff-on"); var cx = c.querySelector(":scope > .ipe-cx"); if (cx && cx.style.display) cx.style.removeProperty("display"); }
    guardar();
    var h = c.querySelector(".ipr-fn-h"); if (h) h.setAttribute("aria-expanded", on ? "true" : "false");
  }
  W.addEventListener("click", function (e) {
    var h = e.target && e.target.closest && e.target.closest("#ipe-proj .ipe-card.ipr-fn .ipr-fn-h");
    if (!h || e.target.closest(".ipr-bt-b,[aria-haspopup],a[href]")) return;
    var i = h.closest(".ipe-card").getAttribute("data-i");
    setTimeout(function () { seguir(i); }, 220); setTimeout(function () { seguir(i); }, 700);
  }, true);
  // 10/11: os cliques que abrem ou fecham o cartão mudam só a classe (sem mudança de filhos): arrumar logo a seguir
  D.addEventListener("click", function (e) { if (e.target && e.target.closest && e.target.closest("#ipe-proj .ipe-card")) setTimeout(vigia, 60); }, true);
  D.addEventListener("ipr:lingua", function () { [].forEach.call(D.querySelectorAll(".ipr-fn-h"), function (h) { h.dataset.k = ""; }); vigia(); });
  vigia();
})();
