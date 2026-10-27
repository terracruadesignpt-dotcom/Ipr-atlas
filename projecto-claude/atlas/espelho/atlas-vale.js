/* IPR Atlas · vale de oferta no pedido (20/10/2026).
   Junta ao formulário de encomenda um campo «Tem um vale?» e envia-o com o pedido, sem mexer no app.js:
   o app.js monta o FormData só com campos fixos, por isso intercepta-se o fetch de /tcd/v1/pedido-base
   e acrescenta-se `vale`. A resposta traz `vale.mensagem`, que se mostra por cima da confirmação. */
(function () {
  "use strict";
  var CAMPO = "ipe-vale";
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function montar() {
    var f = document.getElementById("ipe-form");
    if (!f) return false;
    if (document.getElementById(CAMPO)) return true;
    var notas = document.getElementById("ipe-notas");
    var ancora = notas ? notas : f.querySelector(".ipe-chk");
    if (!ancora) return false;
    var w = document.createElement("div");
    w.innerHTML =
      '<label class="ipe-lbl" for="' + CAMPO + '">Tem um vale da Terracrua Design?</label>' +
      '<input class="ipe-in" type="text" id="' + CAMPO + '" name="vale" maxlength="30" autocomplete="off" spellcheck="false" ' +
      'placeholder="OFERTA-……" style="text-transform:uppercase" aria-describedby="' + CAMPO + '-nota">' +
      '<p class="ipe-nota" id="' + CAMPO + '-nota" style="margin:4px 0 0">Escreva o código tal como o recebeu (OFERTA-…). Se cobrir o valor, a Base segue logo para produção, sem pagamento. Se não tiver o código à mão, peça na mesma: reconhecemos o vale pelo seu nome.</p>';
    var pre = new URLSearchParams(location.search).get("vale");
    if (pre) w.querySelector("input").value = pre.toUpperCase();
    ancora.parentNode.insertBefore(w, ancora.nextSibling);
    while (w.firstChild) ancora.parentNode.insertBefore(w.firstChild, w);
    w.remove();
    return true;
  }

  // Intercepta só o pedido da Base: junta o vale ao FormData e lê a resposta.
  var fetch0 = window.fetch;
  window.fetch = function (url, opt) {
    var u = String(url || "");
    if (/\/tcd\/v1\/pedido-base(\?|$)/.test(u) && opt && opt.body instanceof FormData) {
      var inp = document.getElementById(CAMPO);
      var cod = inp ? inp.value.trim().toLowerCase() : "";
      if (cod) opt.body.set("vale", cod);
      return fetch0.call(this, url, opt).then(function (r) {
        var c = r.clone();
        c.json().then(function (j) {
          if (!j || !j.ok || (!j.vale && !j.vale_url)) return;
          setTimeout(function () {
            var o = document.getElementById("ipe-estado");
            if (!o) return;
            if (!j.vale) {
              // Pedido sem vale: quem recebeu um código pode ainda aplicá-lo na página de pagamento (o campo existe lá).
              o.innerHTML += '<p style="margin:12px 0 0;padding-top:10px;border-top:1px solid var(--ln,#e3dfcc)">Recebeu um vale de oferta da Terracrua Design e não o escreveu? ' +
                '<a href="' + esc(j.vale_url) + '">Abra a página da encomenda</a> e introduza lá o código. Se o código não funcionar, não faz mal: reconhecemos o vale pelo seu nome.</p>';
              return;
            }
            var cls = j.vale.ok ? "ipe-estado ok" : "ipe-estado erro";
            var h = "<strong>" + (j.vale.ok ? "Vale aplicado." : "Vale não aplicado.") + "</strong> " + esc(j.vale.mensagem || "");
            if (j.vale.ok && j.pagar) h += '<br><a class="ipe-b ipe-b--ac" style="margin-top:10px" href="' + esc(j.pagar) + '">Pagar a diferença</a>';
            if (j.vale.ok && !j.pagar) h += '<br><a class="ipe-b ipe-b--s" style="margin-top:10px" href="/os-meus-mapas/">Ir para a minha área</a>';
            o.className = cls;
            o.innerHTML = h;
          }, 60);
        }).catch(function () {});
        return r;
      });
    }
    return fetch0.apply(this, arguments);
  };

  var n = 0;
  (function tentar() {
    if (montar()) {
      var ipe = document.getElementById("ipe");
      if (ipe) new MutationObserver(function () { montar(); }).observe(ipe, { childList: true, subtree: true });
    } else if (n++ < 120) setTimeout(tentar, 250);
  })();
})();
