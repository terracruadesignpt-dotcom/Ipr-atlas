/* IPR Atlas · «Ficha gratuita da propriedade» no telemóvel abre mesmo a ficha (24/11/2026, 22h09). Terracrua Design.
   Nuno (22h09, iPhone): «Porque é que eu não consigo carregar na cena que diz ficha da propriedade?» O botão laranja calculava
   a ficha dentro do painel da direita (#ipe-res), que no telemóvel está fechado ou escondido: nada aparecia.
   Agora, abaixo de 1024 px, o toque no botão:
   - no modo simples (explorer-movel, painel #ipr-exm-sh): mostra e abre esse painel e pede a ficha lá dentro;
   - no Atlas completo: abre o painel de baixo (#ipe-dir.aberto) no separador da encomenda e desce até à ficha.
   Regra do Nuno (22h04): ver a ficha não pede conta; guardar, mandar por WhatsApp ou por e-mail pede conta grátis com
   e-mail verificado. Sem sessão, os botões de partilha da ficha (data-fg-partilhar) mostram esse aviso com «Criar conta grátis».
   Só acrescenta. Desligar: ?ftoque=0 ou localStorage ipr_ftoque=0. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]ftoque=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_ftoque") === "0") return; } catch (e) {}
  if (W.__iprFToque) return; W.__iprFToque = 1;
  function estreito() { try { return W.matchMedia("(max-width: 1023px)").matches; } catch (e) { return W.innerWidth < 1024; } }
  function en() { return /^en/i.test(D.documentElement.lang || "") || W.IPR_LINGUA === "en"; }
  function t(pt, e) { return en() ? e : pt; }
  function sessao() { return !!(D.body && D.body.classList.contains("logged-in")) || !!W.IPR_UTILIZADOR || (W.IPR_NIVEL && String(W.IPR_NIVEL).toLowerCase() === "intelligence"); }

  function mostrarSimples(sh) {
    sh.hidden = false; sh.style.removeProperty("display");
    sh.classList.remove("fechado");
    var p = sh.querySelector(".pega"); if (p) p.setAttribute("aria-expanded", "true");
    var bt = sh.querySelector('[data-x="ficha"]');
    if (bt) { bt.click(); }
    else if (typeof W.__iprFichaGratuita === "function") {
      try { W.__iprFichaGratuita(true); } catch (e) {}
      var alvo = D.getElementById("ipr-exm-ficha"), t0 = Date.now();
      (function mover() {
        var out = D.querySelector("#ipe-res .ipr-fg-out");
        if (alvo && out && out.parentNode !== alvo) { alvo.innerHTML = ""; alvo.appendChild(out); }
        if (Date.now() - t0 < 30000) setTimeout(mover, 400);
      })();
    }
    setTimeout(function () { var f = D.getElementById("ipr-exm-ficha"); if (f) try { f.scrollIntoView({ block: "start", behavior: "smooth" }); } catch (e) {} }, 400);
  }
  function mostrarCompleto() {
    var dir = D.getElementById("ipe-dir"); if (!dir) return;
    dir.classList.add("aberto");
    var tab = D.querySelector('#ipe-tabs .ipe-tab[data-tab="enc"]'); if (tab && !tab.classList.contains("on")) tab.click();
    setTimeout(function () { var r = D.querySelector("#ipe-res .ipr-fg-out") || D.getElementById("ipe-res"); if (r) try { r.scrollIntoView({ block: "start", behavior: "smooth" }); } catch (e) {} }, 500);
  }

  var CSSF = "#ipr-ft-sh{position:fixed;left:0;right:0;bottom:0;top:72px;z-index:2147480200;display:flex;flex-direction:column;background:#10170d;color:#e6e4d9;border-radius:18px 18px 0 0;border-top:1px solid #2e3a28;box-shadow:0 -18px 40px -12px rgba(0,0,0,.6);font:14px/1.45 Geist,Inter,system-ui,sans-serif}" +
    "#ipr-ft-sh[hidden]{display:none}" +
    "#ipr-ft-sh .cab{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 16px 10px;border-bottom:1px solid rgba(255,255,255,.07)}" +
    "#ipr-ft-sh .cab b{font:600 16px Geist,Inter,system-ui,sans-serif}" +
    "#ipr-ft-sh .x{width:44px;height:44px;border-radius:50%;border:0;background:rgba(255,255,255,.08);color:#e6e4d9;font-size:20px;cursor:pointer}" +
    "#ipr-ft-sh .corpo{flex:1 1 auto;overflow:auto;-webkit-overflow-scrolling:touch;padding:12px 16px calc(24px + env(safe-area-inset-bottom,0px))}" +
    "#ipr-ft-sh .nota{color:#a9ab98;margin:8px 0}";
  var aMover = 0;
  function folha() {
    if (!D.getElementById("ipr-ft-css2")) { var s2 = D.createElement("style"); s2.id = "ipr-ft-css2"; s2.textContent = CSSF; D.head.appendChild(s2); }
    var f = D.getElementById("ipr-ft-sh");
    if (!f) {
      f = D.createElement("div"); f.id = "ipr-ft-sh"; f.setAttribute("role", "dialog"); f.setAttribute("aria-label", t("Ficha da propriedade", "Property sheet"));
      f.innerHTML = '<div class="cab"><b>' + t("Ficha da propriedade", "Property sheet") + '</b><button type="button" class="x" aria-label="' + t("Fechar", "Close") + '">×</button></div><div class="corpo"></div>';
      D.body.appendChild(f);
      f.querySelector(".x").addEventListener("click", function () { fecharFolha(); });
    }
    var corpo = f.querySelector(".corpo");
    corpo.innerHTML = '<p class="nota">' + t("A cruzar o terreno com os dados públicos. Leva cerca de 10 segundos.", "Crossing the land with public data. Takes about 10 seconds.") + "</p>";
    f.hidden = false;
    try { if (typeof W.__iprFichaGratuita === "function") W.__iprFichaGratuita(true); else { var o = D.getElementById("ipr-fg-flut"); } } catch (x) {}
    var t0 = Date.now(); clearTimeout(aMover);
    (function mover() {
      var out = D.querySelector(".ipr-fg-out");
      if (out && out.parentNode !== corpo && out.children.length) { corpo.innerHTML = ""; corpo.appendChild(out); }
      if (out && !sessao()) [].forEach.call(out.querySelectorAll("[data-fg-partilhar]:not([data-ft])"), function (b) { var c = b.cloneNode(true); c.removeAttribute("data-fg-partilhar"); c.setAttribute("data-ft-partilhar", "1"); c.setAttribute("data-ft", "1"); b.parentNode.replaceChild(c, b); }); /* tira o handler de partilha: sem conta mostra o aviso */
      if (!f.hidden && Date.now() - t0 < 40000) aMover = setTimeout(mover, 400);
    })();
  }
  function fecharFolha() {
    var f = D.getElementById("ipr-ft-sh"); if (!f) return; f.hidden = true; clearTimeout(aMover);
    var out = f.querySelector(".ipr-fg-out"), res = D.getElementById("ipe-res");
    if (out && res) { var acc = res.querySelector(".ipe-acc"); res.insertBefore(out, acc || null); }
  }
  W.addEventListener("resize", function () { if (!estreito()) fecharFolha(); });

  W.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("#ipr-fg-flut");
    if (!b || !estreito()) return;
    // a ficha abre sempre num painel próprio, por cima do mapa, seja qual for o modo do telemóvel
    e.preventDefault(); e.stopImmediatePropagation(); folha();
  }, true);

  // partilhar, guardar, WhatsApp, e-mail: só com conta (ver continua livre)
  var CSS = "#ipr-ft-av{position:fixed;left:12px;right:12px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:2147480300;max-width:440px;margin:0 auto;padding:16px;border-radius:16px;background:#10170d;border:1px solid #2e3a28;color:#e6e4d9;font:14px/1.45 Geist,Inter,system-ui,sans-serif;box-shadow:0 18px 40px -12px rgba(0,0,0,.6)}" +
    "#ipr-ft-av b{display:block;font-size:15px;margin-bottom:4px}#ipr-ft-av .bt{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}" +
    "#ipr-ft-av a,#ipr-ft-av button{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 16px;border-radius:999px;font:600 14px Geist,Inter,system-ui,sans-serif;text-decoration:none;cursor:pointer}" +
    "#ipr-ft-av a{background:#94BE39;color:#11160d;border:0}#ipr-ft-av button{background:none;color:#e6e4d9;border:1px solid rgba(255,255,255,.18)}";
  function avisoConta() {
    if (!D.getElementById("ipr-ft-css")) { var s = D.createElement("style"); s.id = "ipr-ft-css"; s.textContent = CSS; D.head.appendChild(s); }
    var a = D.getElementById("ipr-ft-av"); if (!a) { a = D.createElement("div"); a.id = "ipr-ft-av"; a.setAttribute("role", "dialog"); D.body.appendChild(a); }
    var volta = encodeURIComponent(location.pathname + location.search);
    a.innerHTML = "<b>" + t("Guardar e partilhar pede conta grátis", "Saving and sharing needs a free account") + "</b>" +
      t("Ver a ficha é livre. Para a guardar, mandar por WhatsApp ou por e-mail, crie uma conta grátis e confirme o e-mail.", "Viewing the sheet is free. To save it or send it by WhatsApp or e-mail, create a free account and confirm your e-mail.") +
      '<div class="bt"><a href="/conta/?registar=1&amp;voltar=' + volta + '">' + t("Criar conta grátis", "Create a free account") + '</a><a href="/conta/?voltar=' + volta + '" style="background:none;color:#e6e4d9;border:1px solid rgba(255,255,255,.18)">' + t("Entrar", "Sign in") + '</a><button type="button" data-x="fechar">' + t("Agora não", "Not now") + "</button></div>";
    a.hidden = false;
    a.onclick = function (e) { if (e.target.closest('[data-x="fechar"]')) a.hidden = true; };
  }
  W.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".ipr-fg-out [data-fg-partilhar], .ipr-fg-out [data-ft-partilhar], .ipr-fg-out .ipr-fn2-sh, .ipr-fg-out [data-sd$='-ficha'], .ipr-fg-out a[href*='wa.me'], .ipr-fg-out a[href^='mailto:'], .ipr-fg-out [data-fg-guardar]");
    if (!b || sessao()) return;
    e.preventDefault(); e.stopImmediatePropagation(); avisoConta();
  }, true);
  // também no computador: sem sessão, a partilha da ficha passa pelo aviso da conta
  setInterval(function () {
    if (sessao()) return;
    [].forEach.call(D.querySelectorAll(".ipr-fg-out [data-fg-partilhar]"), function (b) { var c = b.cloneNode(true); c.removeAttribute("data-fg-partilhar"); c.setAttribute("data-ft-partilhar", "1"); b.parentNode.replaceChild(c, b); });
  }, 1000);
})();
