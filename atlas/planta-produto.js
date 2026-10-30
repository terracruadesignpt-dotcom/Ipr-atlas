/* IPR Atlas · Planta de Localização como produto (decisão do Nuno, 29/10/2026, decisão 10: «o Atlas gera o PDF no navegador
   depois de pago e guarda na conta [...] 19 € + IVA = 23,37 €. Uma compra dá um PDF. À venda já, para todos. Incluída na
   Base e no Intelligence»; 30/10/2026, 16h22: a equipa da Terracrua Design, estagiários incluídos, tem plantas sem limite).
   Complemento do §55/§61 do ajustes.js e do planta-folhas.js; não mexe nesses ficheiros. Servidor: módulo m90543.
   1. Quando o diálogo da planta (#ipr-pl) abre, pergunta a GET /wp-json/tcd/v1/planta/estado?enc=<projecto> o que a pessoa
      pode fazer e mostra uma linha por cima dos botões: equipa, incluída na Base, incluída no Intelligence, plantas por usar,
      geração já paga por concluir, ou o preço com a ligação «Comprar».
   2. O clique em «Gerar PDF» é apanhado antes do ajustes.js e do planta-folhas.js (fase de captura no document). Primeiro
      POST /planta/autorizar (gasta 1 crédito a quem paga; a equipa, a Base e o Intelligence não gastam); com a senha, o
      clique segue para o ajustes.js como antes. Sem créditos: mostra o preço e «Comprar», e não gera.
   3. Enquanto essa geração dura, o PDF que o jsPDF entrega ao navegador (Blob application/pdf passado a
      URL.createObjectURL ou a FileReader.readAsDataURL) é copiado e enviado por partes de 8 MB, com SHA-256, para
      POST /planta/guardar, que o guarda nos ficheiros do projecto (pasta Entregáveis). A descarga normal não muda.
      Se a geração falhar, a senha fica aberta 24 h e a próxima tentativa não gasta outra compra.
   4. Se o m90543 estiver desligado (a rota não existe: 404 rest_no_route), o diálogo funciona como antes, sem portão.
   Texto escapado (textContent). Desligar: window.IPR_PLANTA_PRODUTO_OFF = true antes de carregar. */
(function () {
  "use strict";
  if (window.__iprPlantaProduto || window.IPR_PLANTA_PRODUTO_OFF) return;
  window.__iprPlantaProduto = 1;

  var API = "/wp-json/tcd/v1/planta/", PARTE = 8 * 1024 * 1024;
  var TX = {
    pt: {
      aVer: "A verificar a sua conta…",
      equipa: "Equipa Terracrua Design: plantas sem limite. O PDF fica guardado nos ficheiros do projecto.",
      base: "Incluída na Base Cartográfica deste terreno. O PDF fica guardado nos ficheiros do projecto.",
      intelligence: "Incluída no IPR Atlas Intelligence. O PDF fica guardado nos ficheiros do projecto.",
      credito1: "Tem 1 planta por usar. Ao gerar, usa-a; o PDF fica guardado nos ficheiros do projecto.",
      creditoN: "Tem {n} plantas por usar. Ao gerar, usa 1; o PDF fica guardado nos ficheiros do projecto.",
      senha: "Planta já paga para este terreno e ainda por guardar: pode gerar de novo sem gastar outra (até 24 h).",
      comprar: "Planta de Localização: {p}. Uma compra dá um PDF, guardado na sua conta. Incluída com a Base Cartográfica do terreno ou com o IPR Atlas Intelligence.",
      comprarB: "Comprar",
      semCompra: "Para gerar esta planta precisa de a comprar: {p}.",
      semAcesso: "Este projecto não está ao alcance da sua conta.",
      semSessao: "Entre na sua conta para gerar a planta de localização.",
      autorizar: "A confirmar…",
      erro: "Não foi possível confirmar agora ({m}). Tente outra vez.",
      guardar: "A guardar o PDF na sua conta…",
      guardada: "PDF guardado na sua conta: ficheiros do projecto, pasta Entregáveis.",
      naoGuardada: "O PDF descarregou, mas não ficou guardado na conta ({m}). Gere de novo nas próximas 24 h sem gastar outra compra, ou escreva para info@regenerativo.pt.",
      semPdf: "O PDF não chegou a ser gerado. Pode tentar de novo sem gastar outra compra (até 24 h)."
    },
    en: {
      aVer: "Checking your account…",
      equipa: "Terracrua Design team: unlimited plans. The PDF is kept in the project files.",
      base: "Included with this land's Cartographic Base. The PDF is kept in the project files.",
      intelligence: "Included with IPR Atlas Intelligence. The PDF is kept in the project files.",
      credito1: "You have 1 plan to use. Generating uses it; the PDF is kept in the project files.",
      creditoN: "You have {n} plans to use. Generating uses 1; the PDF is kept in the project files.",
      senha: "A plan already paid for this land and not yet saved: you can generate again without using another (within 24 h).",
      comprar: "Location Plan: {p}. One purchase gives one PDF, kept in your account. Included with the land's Cartographic Base or with IPR Atlas Intelligence.",
      comprarB: "Buy",
      semCompra: "To generate this plan you need to buy it: {p}.",
      semAcesso: "This project is not available to your account.",
      semSessao: "Sign in to generate the location plan.",
      autorizar: "Confirming…",
      erro: "Could not confirm right now ({m}). Please try again.",
      guardar: "Saving the PDF to your account…",
      guardada: "PDF saved to your account: project files, Deliverables folder.",
      naoGuardada: "The PDF downloaded but was not saved to your account ({m}). Generate it again within 24 h without using another purchase, or write to info@regenerativo.pt.",
      semPdf: "The PDF was not generated. You can try again without using another purchase (within 24 h)."
    }
  };
  var PRECO = { pt: "19 € + IVA (23,37 €)", en: "€19 + VAT (€23.37)" };
  var DESLIGADO = false;

  function lg(o) { return o && o.lang === "en" ? "en" : "pt"; }
  function tx(o, k, v) {
    var s = TX[lg(o)][k] || TX.pt[k] || k;
    if (v) Object.keys(v).forEach(function (x) { s = s.split("{" + x + "}").join(String(v[x])); });
    return s;
  }
  function encDe(o) { var b = o.querySelector(".c > b"); var m = /#(\d+)/.exec(b ? b.textContent : ""); return m ? +m[1] : 0; }
  function pedir(metodo, rota, corpo, cab) {
    var op = { method: metodo, credentials: "same-origin", headers: Object.assign({ "X-WP-Nonce": window.tcdNonce || "" }, cab || {}) };
    if (corpo !== undefined) op.body = corpo;
    return fetch(API + rota, op).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { s: r.status, j: j || {} }; });
    });
  }
  function rotaDesligada(r) { return r.s === 404 && r.j && r.j.code === "rest_no_route"; }

  // ---------- caixa no diálogo ----------
  function caixa(o) {
    var x = o.querySelector(".ipr-pp");
    if (!x) {
      x = document.createElement("div"); x.className = "ipr-pp"; x.setAttribute("aria-live", "polite");
      x.innerHTML = '<p class="t"></p><a class="b" hidden></a>';
      var a = o.querySelector(".c .a"); if (a) a.parentNode.insertBefore(x, a); else (o.querySelector(".c") || o).appendChild(x);
    }
    return x;
  }
  function mostrar(o, texto, comprar, mau) {
    var x = caixa(o), t = x.querySelector(".t"), b = x.querySelector(".b");
    t.textContent = texto; x.classList.toggle("mau", !!mau);
    if (comprar && /^(https:\/\/|\/)/.test(comprar)) { b.hidden = false; b.textContent = tx(o, "comprarB"); b.href = comprar; } else { b.hidden = true; b.removeAttribute("href"); }
  }
  function textoEstado(o, e) {
    var p = PRECO[lg(o)];
    switch (e.modo) {
      case "equipa": case "base": case "intelligence": return [tx(o, e.modo)];
      case "credito": return [e.creditos === 1 ? tx(o, "credito1") : tx(o, "creditoN", { n: e.creditos })];
      case "senha": return [tx(o, "senha")];
      case "comprar": return [tx(o, "comprar", { p: p }), e.comprar];
      case "sem_acesso": return [tx(o, "semAcesso"), null, true];
    }
    return [""];
  }
  function verEstado(o) {
    var enc = encDe(o); if (!enc) return;
    mostrar(o, tx(o, "aVer"));
    pedir("GET", "estado?enc=" + enc).then(function (r) {
      if (!document.body.contains(o)) return;
      if (rotaDesligada(r)) { DESLIGADO = true; var x = o.querySelector(".ipr-pp"); if (x) x.remove(); return; }
      if (r.s === 401) { mostrar(o, tx(o, "semSessao"), null, true); return; }
      if (r.s !== 200) { mostrar(o, tx(o, "erro", { m: r.j.message || r.s }), null, true); return; }
      o.__ippEstado = r.j; var m = textoEstado(o, r.j); mostrar(o, m[0], m[1], m[2]);
    }).catch(function (x) { mostrar(o, tx(o, "erro", { m: x && x.message || "rede" }), null, true); });
  }

  // ---------- captura do PDF durante uma geração autorizada ----------
  var CAP = null; // { senha, enc, o, ate, blob }
  function apanhar(b) {
    try {
      if (!CAP || CAP.blob || Date.now() > CAP.ate || !(b instanceof Blob) || b.type !== "application/pdf") return;
      CAP.blob = b; var c = CAP; setTimeout(function () { enviar(c); }, 0);
    } catch (e) {}
  }
  (function () {
    var cou = URL.createObjectURL;
    if (cou) URL.createObjectURL = function (b) { apanhar(b); return cou.apply(URL, arguments); };
    var rd = window.FileReader && FileReader.prototype.readAsDataURL;
    if (rd) FileReader.prototype.readAsDataURL = function (b) { apanhar(b); return rd.apply(this, arguments); };
  })();
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (v) { return ("0" + v.toString(16)).slice(-2); }).join(""); }
  function enviar(c) {
    var o = c.o; CAP = null;
    mostrar(o, tx(o, "guardar"));
    c.blob.arrayBuffer().then(function (buf) {
      return crypto.subtle.digest("SHA-256", buf).then(function (h) {
        var sha = hex(h), tam = buf.byteLength, partes = Math.max(1, Math.ceil(tam / PARTE)), i = 0;
        function uma(tent) {
          var q = "guardar?senha=" + encodeURIComponent(c.senha) + "&parte=" + i + "&partes=" + partes + "&tamanho=" + tam + "&sha256=" + sha;
          return pedir("POST", q, buf.slice(i * PARTE, Math.min(tam, (i + 1) * PARTE)), { "Content-Type": "application/pdf" }).then(function (r) {
            if (r.s >= 500 && tent < 1) return new Promise(function (ok) { setTimeout(ok, 1500); }).then(function () { return uma(tent + 1); });
            if (r.s !== 200) throw new Error(r.j.message || ("Erro " + r.s));
            i++; return i < partes ? uma(0) : r.j;
          });
        }
        return uma(0);
      });
    }).then(function () {
      mostrar(o, tx(o, "guardada"));
      try { document.dispatchEvent(new CustomEvent("ipr:planta-guardada", { detail: { enc: c.enc } })); } catch (e) {}
    }).catch(function (x) { mostrar(o, tx(o, "naoGuardada", { m: x && x.message || "rede" }), null, true); });
  }
  // Fim da geração sem PDF (o botão volta a ficar activo e nada foi apanhado).
  function vigiarFim(o, b, c) {
    var mo = new MutationObserver(function () {
      if (b.disabled) return;
      mo.disconnect();
      setTimeout(function () {
        if (CAP === c && !c.blob) { CAP = null; if (c.modo === "credito") mostrar(o, tx(o, "semPdf")); else if (o.__ippEstado) { var m = textoEstado(o, o.__ippEstado); mostrar(o, m[0], m[1], m[2]); } }
      }, 2500);
    });
    mo.observe(b, { attributes: true, attributeFilter: ["disabled"] });
    setTimeout(function () { mo.disconnect(); }, 6e5 + 5000);
  }

  // ---------- portão do «Gerar PDF» ----------
  function seguir(b) { b.__ippPasse = true; try { b.click(); } finally { b.__ippPasse = false; } }
  document.addEventListener("click", function (ev) {
    var b = ev.target && ev.target.closest && ev.target.closest('#ipr-pl [data-a="ok"]');
    if (!b || b.__ippPasse || DESLIGADO) return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    var o = document.getElementById("ipr-pl"), enc = o ? encDe(o) : 0;
    if (!o || !enc || b.disabled || o.__ippOcupado) return;
    o.__ippOcupado = true; mostrar(o, tx(o, "autorizar"));
    pedir("POST", "autorizar", JSON.stringify({ enc: enc }), { "Content-Type": "application/json" }).then(function (r) {
      o.__ippOcupado = false;
      if (rotaDesligada(r)) { DESLIGADO = true; var x = o.querySelector(".ipr-pp"); if (x) x.remove(); seguir(b); return; }
      if (r.s === 402) { mostrar(o, tx(o, "semCompra", { p: PRECO[lg(o)] }), r.j.data && r.j.data.comprar || (o.__ippEstado || {}).comprar, true); return; }
      if (r.s === 401) { mostrar(o, tx(o, "semSessao"), null, true); return; }
      if (r.s === 403) { mostrar(o, r.j.code === "tcd_m543_acesso" ? tx(o, "semAcesso") : tx(o, "erro", { m: r.j.message || r.s }), null, true); return; }
      if (r.s !== 200 || !r.j.senha) { mostrar(o, tx(o, "erro", { m: r.j.message || r.s }), null, true); return; }
      var st = o.__ippEstado || {}; st.modo = r.j.modo === "credito" ? "senha" : r.j.modo; st.creditos = r.j.creditos; o.__ippEstado = st;
      var m = textoEstado(o, st); mostrar(o, m[0], m[1], m[2]);
      var c = { senha: r.j.senha, enc: enc, o: o, modo: r.j.modo, ate: Date.now() + 6e5, blob: null };
      CAP = c; vigiarFim(o, b, c);
      seguir(b);
    }).catch(function (x) { o.__ippOcupado = false; mostrar(o, tx(o, "erro", { m: x && x.message || "rede" }), null, true); });
  }, true);

  // ---------- diálogo ----------
  function preparar(o) { if (!o || o.__ipp) return; o.__ipp = 1; if (!DESLIGADO) verEstado(o); }
  function procurar() { preparar(document.getElementById("ipr-pl")); }
  new MutationObserver(procurar).observe(document.body || document.documentElement, { childList: true });
  procurar();
  (function () {
    if (document.getElementById("ipr-pp-css")) return;
    var st = document.createElement("style"); st.id = "ipr-pp-css";
    st.textContent = "#ipr-pl .ipr-pp{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;border:1px solid var(--ln,#333);border-radius:8px;padding:8px 10px;font:12.5px/1.45 Inter,sans-serif;color:var(--tx,#e9eadf)}" +
      "#ipr-pl .ipr-pp .t{margin:0;flex:1 1 14em}#ipr-pl .ipr-pp.mau{border-color:#d9725b}#ipr-pl .ipr-pp .b[hidden]{display:none}" +
      "#ipr-pl .ipr-pp .b{font:600 12.5px Inter,sans-serif;padding:6px 12px;border-radius:7px;background:var(--ac,#b5c46a);color:#141814;text-decoration:none;white-space:nowrap}";
    (document.head || document.documentElement).appendChild(st);
  })();
})();
