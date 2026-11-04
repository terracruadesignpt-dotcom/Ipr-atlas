/* IPR Atlas · Convidados e a Base Cartográfica (pedido do Nuno, 04/11/2026, 17h40). Muitas encomendas de Base por pagar
   eram ensaios de profissionais convidados («fiz o pedido para testar»). O convite dá IPR Atlas Intelligence e/ou IPR
   Cloud, não a Base. Escolhas do Nuno: aviso antes de enviar o pedido e botão «Experimentar com a Base de exemplo».
   Como funciona:
   1. Com sessão (window.tcdNonce), pergunta ao site se a conta é de um convidado: GET /wp-json/tcd/v1/convidado-base
      (módulo m90873, só sobre a própria conta). Quem não é convidado não vê nada.
   2. No formulário da encomenda (#ipe-form), por cima de «Enviar pedido», um aviso com o que o convite inclui e o preço
      da Base para a área marcada (#ipe-area), com IVA e já com o desconto IPR Cloud, calculado pelo site. Não trava o
      envio. Com vale de Base por usar, o aviso diz isso em vez do preço.
   3. Nos primeiros passos do assistente da Base (guia.js, cartão #ipr-gu, ?servico=base: procurar e marcar o terreno), uma linha com o mesmo botão.
   4. O botão abre noutro separador /atlas/?exemplo=base (a encomenda em curso fica como está): o mapa de demonstração
      do Mira, o mesmo do agua-demo.js, com a Base de ensaio da Sub-bacia da Ribeira do Torgal. Só de ver: não abre
      nenhuma Base de cliente, não há descargas; uma faixa explica e dá «Simular água» (window.IPRAguaDemo) e «Voltar à
      encomenda». Este modo não precisa de conta.
   Só acrescenta: não mexe no app.js, guia.js, assistente.js nem agua-demo.js. Texto por textContent.
   Desligar: ?convidado-base=0 ou localStorage ipr_convidado_base_off = 1. Ensaio (administradores): ?convidado-base=ensaio.
   Terracrua Design. */
(function (W, D) {
  "use strict";
  var Q;
  try { Q = new URLSearchParams(W.location.search); } catch (e) { return; }
  try { if (Q.get("convidado-base") === "0" || W.localStorage.getItem("ipr_convidado_base_off") === "1") return; } catch (e) {}
  if (W.__iprConvidadoBase) return; W.__iprConvidadoBase = 1;

  var ROTA = "/wp-json/tcd/v1/convidado-base", ENSAIO = Q.get("convidado-base") === "ensaio";
  var EX_URL = "/atlas/?exemplo=base", EX_NOME = "Sub-bacia da Ribeira do Torgal";
  var INFO = null, CACHE = {}, TEMPO = null;

  function $(id) { return D.getElementById(id); }
  function el(tag, cls, txt) { var e = D.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function euros(v) { return Number(v).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"; }
  function lista(a) { return a.length <= 1 ? (a[0] || "") : a.slice(0, -1).join(", ") + " e " + a[a.length - 1]; }

  function css() {
    if ($("ipr-cvb-css")) return;
    var s = el("style"); s.id = "ipr-cvb-css";
    s.textContent = "#ipr-cvb{margin:14px 0 0;padding:12px 14px;border:1px solid #c9d36a;border-radius:10px;background:rgba(201,211,106,.08);font-size:13.5px;line-height:1.5}" +
      "#ipr-cvb p{margin:0 0 8px}#ipr-cvb b{font-weight:600}" +
      ".ipr-cvb-b{display:inline-flex;align-items:center;min-height:40px;padding:6px 14px;line-height:1.25;box-sizing:border-box;border-radius:9px;border:1px solid #c9d36a;color:inherit;font:600 13px Inter,system-ui,sans-serif;text-decoration:none;cursor:pointer;background:transparent}" +
      ".ipr-cvb-b:hover,.ipr-cvb-b:focus-visible{background:#c9d36a;color:#141814}" +
      "#ipr-gu .ipr-cvb-g{margin:-2px 0 10px;padding:8px 10px;border-left:2px solid #c9d36a;color:#cfd2c4;font-size:13px}#ipr-gu .ipr-cvb-g .ipr-cvb-b{margin-top:6px;min-height:34px}" +
      "#ipr-cvb-ex{position:fixed;z-index:100003;left:50%;transform:translateX(-50%);top:calc(12px + env(safe-area-inset-top));width:min(620px,calc(100vw - 32px));box-sizing:border-box;" +
      "background:#141814;color:#e9eadf;border:1px solid #c9d36a;border-radius:12px;padding:12px 14px;box-shadow:0 10px 30px rgba(0,0,0,.4);font:13.5px/1.5 Inter,system-ui,sans-serif}" +
      "#ipr-cvb-ex p{margin:0 0 8px}#ipr-cvb-ex .k{font:600 10.5px 'IBM Plex Mono',monospace;letter-spacing:.05em;text-transform:uppercase;color:#9aa08f;margin:0 0 4px}" +
      "#ipr-cvb-ex .bb{display:flex;flex-wrap:wrap;gap:6px}#ipr-cvb-ex .ipr-cvb-b{color:#e9eadf}#ipr-cvb-ex .pri{background:#c9d36a;color:#141814}";
    (D.head || D.documentElement).appendChild(s);
  }

  function botao() {
    var a = el("a", "ipr-cvb-b", "Experimentar com a Base de exemplo");
    a.href = (INFO && INFO.exemplo && INFO.exemplo.url) || EX_URL;
    a.target = "_blank"; a.rel = "noopener";
    a.title = "Abre noutro separador o mapa de demonstração (" + EX_NOME + "). A sua encomenda fica como está.";
    a.addEventListener("click", function (e) { e.stopPropagation(); });
    return a;
  }

  // ---------- 2. aviso no formulário ----------
  function haDoForm() {
    var a = $("ipe-area"); if (!a) return 0;
    var t = String(a.textContent || "").replace(/[^\d,]/g, "").replace(",", ".");
    var v = parseFloat(t); return isFinite(v) && v > 0 ? v : 0;
  }
  function inclui() {
    var x = (INFO && INFO.inclui) || [];
    return x.length ? "O seu convite inclui " + lista(x) + "." : "O seu convite dá acesso ao IPR Atlas.";
  }
  function textoPreco(ha, r) {
    if (INFO.vale_ha && (!ha || ha <= INFO.vale_ha)) return "Tem um vale de oferta para uma Base Cartográfica até " + INFO.vale_ha + " ha, que se usa no pagamento.";
    var base = INFO.vale_ha ? "Tem um vale para uma Base até " + INFO.vale_ha + " ha; este terreno passa disso, por isso paga a diferença. " : "";
    if (!ha) return base + "A Base Cartográfica é paga; o preço aparece quando marcar o terreno.";
    if (!r || r.erro) return base + "A Base Cartográfica deste terreno é paga; o preço sem IVA está em «Estimativa», acima.";
    if (!r.preco) return base + "A Base Cartográfica deste terreno é paga (preço sob consulta para esta área).";
    var d = r.pct ? " (já com o seu desconto IPR Cloud de " + r.pct + " %)" : "";
    return base + "A Base Cartográfica deste terreno é paga: " + euros(r.preco.com_iva) + " com IVA" + d + ".";
  }
  function aviso() {
    var f = $("ipe-form"), env = $("ipe-enviar");
    if (!f || !env || !INFO) return null;
    var c = $("ipr-cvb");
    if (!c) {
      css();
      c = el("div"); c.id = "ipr-cvb"; c.setAttribute("role", "note");
      c.appendChild(el("p", "a")); c.appendChild(el("p", "b"));
      var p = el("p", "c", "Se quer só experimentar, veja a Base de exemplo: abre noutro separador e não cria encomenda.");
      c.appendChild(p); c.appendChild(botao());
      env.parentNode.insertBefore(c, env);
    }
    return c;
  }
  function por(n, t) { if (n.textContent !== t) n.textContent = t; }
  var PEND = "";
  function pintarAviso() {
    var c = aviso(); if (!c) return;
    var ha = haDoForm(), k = ha ? ha.toFixed(2) : "0", b = c.querySelector(".b");
    por(c.querySelector(".a"), inclui());
    if (!ha || CACHE[k]) { PEND = ""; por(b, textoPreco(ha, CACHE[k])); return; }
    if (PEND === k) return;
    PEND = k;
    por(b, "A calcular o preço da Base para " + ha.toLocaleString("pt-PT") + " ha…");
    clearTimeout(TEMPO);
    TEMPO = setTimeout(function () {
      pedir(k).then(function (r) { CACHE[k] = r || { erro: 1 }; })
        .catch(function () { CACHE[k] = { erro: 1 }; })
        .then(function () { if (PEND === k) PEND = ""; pintarAviso(); });
    }, 350);
  }

  // ---------- 3. primeiro passo do assistente da Base ----------
  function guiaPasso() { try { return JSON.parse(W.sessionStorage.getItem("ipr_guia_v1") || "null"); } catch (e) { return null; } }
  function pintarGuia() {
    var g = $("ipr-gu"); if (!g || !INFO) return;
    var e = guiaPasso(), h4 = g.querySelector("h4"), quer = !!(e && e.s === "base" && e.p <= 1 && !e.fim);
    var x = g.querySelector(".ipr-cvb-g");
    if (!quer) { if (x) x.remove(); return; }
    if (x || !h4) return;
    css();
    x = el("div", "ipr-cvb-g");
    x.appendChild(el("span", "", inclui() + " A Base Cartográfica é paga. Para ver como é antes de encomendar:"));
    x.appendChild(D.createElement("br")); x.appendChild(botao());
    var p = h4.nextElementSibling; (p && p.parentNode === g ? p : h4).insertAdjacentElement("afterend", x);
  }

  function pedir(ha) {
    var u = ROTA + "?ha=" + encodeURIComponent(ha || 0) + (ENSAIO ? "&ensaio=1" : "");
    return fetch(u, { credentials: "same-origin", headers: { "X-WP-Nonce": W.tcdNonce } }).then(function (r) { return r.ok ? r.json() : null; });
  }

  function vigiar() {
    var pend = false;
    function tudo() { pend = false; try { pintarAviso(); } catch (e) {} try { pintarGuia(); } catch (e) {} }
    new MutationObserver(function () { if (!pend) { pend = true; setTimeout(tudo, 120); } })
      .observe(D.body, { childList: true, subtree: true, characterData: true });
    tudo();
  }

  // ---------- 4. modo Base de exemplo ----------
  function exemplo() {
    // sem o guia da encomenda e sem o «Comprar passo a passo» a abrir sozinho (assistente.js, uma vez por sessão)
    try { W.sessionStorage.removeItem("ipr_guia_v1"); W.sessionStorage.setItem("ipr_as_auto", "1"); } catch (e) {}
    // O ecrã de entrada do inicio.js («O seu terreno, num mapa») e a triagem tapariam o mapa: fecham-se pelos próprios
    // meios nos primeiros 30 s, como no agua-entrada.js.
    W.IPR_INICIO_OFF = true;
    var t0 = Date.now();
    function limpar() {
      try {
        var ini = $("ipr-ini"); if (ini) ini.remove();
        var tri = D.querySelector('[data-a63="fechar"]'); if (tri && tri.offsetParent !== null) tri.click();
      } catch (e) {}
    }
    if (W.MutationObserver) {
      var ob = new MutationObserver(function () { if (Date.now() - t0 > 30000) { ob.disconnect(); return; } limpar(); });
      (function lig() { if (D.body) { ob.observe(D.body, { childList: true, subtree: true }); limpar(); } else setTimeout(lig, 50); })();
      setTimeout(function () { ob.disconnect(); }, 30000);
    }
    var f = el("div"); f.id = "ipr-cvb-ex"; f.setAttribute("role", "status");
    f.appendChild(el("p", "k", "Base de exemplo · só de ver"));
    f.appendChild(el("p", "", EX_NOME + ", na bacia do Mira: Base de ensaio da equipa que mostra o aspecto de uma Base Cartográfica. Não tem todas as camadas de uma Base entregue e nada se descarrega. Não cria nenhuma encomenda."));
    var bb = el("div", "bb"), sim = el("button", "ipr-cvb-b pri", "Simular água"), vol = el("a", "ipr-cvb-b", "Voltar à encomenda"), fe = el("button", "ipr-cvb-b", "Fechar");
    sim.type = "button"; fe.type = "button"; vol.href = "/atlas/?modo=encomenda&servico=base";
    sim.hidden = true;
    sim.addEventListener("click", function () { try { W.IPRAguaDemo.abrir(); } catch (e) {} });
    fe.addEventListener("click", function () { f.remove(); });
    bb.appendChild(sim); bb.appendChild(vol); bb.appendChild(fe); f.appendChild(bb);
    (function pronto(n) {
      if (!D.body) { D.addEventListener("DOMContentLoaded", function () { pronto(n); }, { once: true }); return; }
      if (!$("ipr-cvb-ex")) { css(); D.body.appendChild(f); }
      var M = W.__ipe && W.__ipe.mapa, demo = W.IPRAguaDemo && typeof W.IPRAguaDemo.abrir === "function";
      if ((!M || !demo) && n < 150) { setTimeout(function () { pronto(n + 1); }, 200); return; }
      if (demo) { sim.hidden = false; try { W.IPRAguaDemo.abrir(); } catch (e) {} }
      else f.querySelector("p:nth-of-type(2)").textContent += " O mapa de demonstração não está disponível de momento.";
      // Aproxima à sub-bacia do Torgal quando a área de teste está à vista (IPRAreaTeste, area-teste-ipr.js).
      setTimeout(function () {
        try {
          var A = W.IPRAreaTeste && W.IPRAreaTeste.areas ? W.IPRAreaTeste.areas() : [];
          var t = A.filter(function (a) { return /torgal/i.test((a.nome || "") + " " + (a.id || "")); })[0];
          if (t) W.IPRAreaTeste.enquadrar(t.id);
        } catch (e) {}
      }, 1200);
    })(0);
  }

  if (Q.get("exemplo") === "base") { exemplo(); return; }
  if (!W.tcdNonce) return;
  function arrancar() {
    pedir(0).then(function (r) {
      if (!r || !r.convidado) return;
      INFO = r; if (r.exemplo && r.exemplo.nome) EX_NOME = r.exemplo.nome;
      vigiar();
    }).catch(function () {});
  }
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", arrancar); else arrancar();
})(window, document);
