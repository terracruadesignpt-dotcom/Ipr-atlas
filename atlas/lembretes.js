/* IPR Atlas · lembretes.js (31/10/2026, 02h15). Terracrua Design. Só acrescenta; não mexe noutros ficheiros.
   1. Transparência dos cartões de compra (Nuno, 01h50: «este botão devia fazer a caixa toda mais transparente»): o regulador
      do comprar.js põe a opacidade sem «!important» e o cartão do assistente em modo «lado» tem «opacity:1!important» na folha
      de estilos, por isso o regulador não fazia nada. Aqui a mesma opacidade é posta com «!important».
   2. Lembrete dos testes (Nuno, 01h50): ao entrar com conta, uma seta aponta para «Testar camadas» e «Testar internet», uma
      vez por sessão, para as pessoas se lembrarem de testar antes de usar o Atlas. Some ao tocar ou ao fim de 15 s.
   3. Estado das Bases desactualizado (Nuno, 01h46: «a base está revista e não aparece nada para rever, mas o lembrete na barra
      dos projectos está desactualizado»): a lista dos projectos só é lida ao abrir a página. De 5 em 5 minutos, com a página à
      vista, lê-se de novo e, se alguma Base mudou de estado (por exemplo entregue), aparece um aviso com «Actualizar», que
      recarrega no mesmo projecto.
   Desligar: ?lembretes=0 ou localStorage ipr_lembretes_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]lembretes=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_lembretes_off") === "1") return; } catch (e) {}
  function pt() { return (W.IPR_LINGUA || "pt") !== "en"; }
  var css = D.createElement("style");
  css.textContent =
    "#ipr-lb-seta{position:fixed;z-index:100001;display:flex;align-items:center;gap:8px;max-width:280px;padding:9px 12px;border-radius:8px;background:#9BC53D;color:#14200F;font:600 12.5px/1.35 Inter,system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.35);cursor:pointer;animation:iprLb 1.2s ease-in-out infinite}" +
    "#ipr-lb-seta:before{content:'';position:absolute;left:-9px;top:50%;margin-top:-9px;border:9px solid transparent;border-left:0;border-right-color:#9BC53D}" +
    "@keyframes iprLb{50%{transform:translateX(6px)}}" +
    ".ipr-testes.ipr-lb-luz{outline:2px solid #9BC53D;outline-offset:3px;border-radius:8px}" +
    "#ipr-lb-act{position:fixed;left:50%;transform:translateX(-50%);bottom:70px;z-index:100000;display:flex;gap:10px;align-items:center;max-width:min(92vw,520px);padding:10px 12px;border-radius:8px;background:#14200F;color:#F2EFE6;border:1px solid #9BC53D;font:13px/1.4 Inter,system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.35)}" +
    "#ipr-lb-act button{flex:none;padding:6px 10px;border-radius:6px;border:0;background:#9BC53D;color:#14200F;font:600 12.5px Inter,system-ui,sans-serif;cursor:pointer}#ipr-lb-act button.s{background:transparent;color:#F2EFE6;border:1px solid #3b4232}";
  (D.head || D.documentElement).appendChild(css);

  // 1. transparência com !important
  function opDe(op) { var p = op.parentNode; while (p && p !== D.body) { if (p.style && p.style.opacity) return p; p = p.parentNode; } return null; }
  function forcar(op) { var p = opDe(op); if (!p) return; var v = Math.max(35, Math.min(100, +op.value || 100)) / 100; if (p.style.getPropertyPriority("opacity") !== "important" || +p.style.opacity !== v) p.style.setProperty("opacity", String(v), "important"); }
  D.addEventListener("input", function (e) { var op = e.target; if (op && op.classList && op.classList.contains("ipr-jan-o")) setTimeout(function () { forcar(op); }, 0); }, true);
  setInterval(function () { if (D.hidden) return; [].forEach.call(D.querySelectorAll(".ipr-jan-o"), forcar); }, 1500);

  // 2. seta para os testes, uma vez por sessão, com conta
  function seta() {
    if (!W.tcdNonce) return nS > 20; // sem conta não há lembrete (espera a página definir a sessão)
    try { if (sessionStorage.getItem("ipr_lb_seta") === "1") return true; } catch (e) {}
    var alvo = D.querySelector(".ipr-testes") || D.getElementById("ipr-lig-b");
    var vis = alvo && alvo.offsetParent && alvo.getBoundingClientRect().width > 0;
    if (!vis && nS < 12) return false;
    if (!vis) { // os testes estão numa secção fechada: lembrete fixo, que abre a secção e mostra os botões
      try { sessionStorage.setItem("ipr_lb_seta", "1"); } catch (e) {}
      var c = D.createElement("div"); c.id = "ipr-lb-act"; c.setAttribute("role", "status");
      var tx = D.createElement("span"); tx.textContent = pt() ? "Antes de começar, teste as camadas e a sua internet." : "Before you start, test the layers and your connection.";
      var bv = D.createElement("button"); bv.type = "button"; bv.textContent = pt() ? "Mostrar os testes" : "Show the tests";
      bv.addEventListener("click", function () {
        c.remove();
        var sec = alvo && alvo.closest && alvo.closest("details,[data-sb]");
        if (sec && sec.tagName === "DETAILS") sec.open = true;
        else if (sec) { var h = sec.querySelector(".ipe-sbh"); if (h && sec.classList.contains("fechado")) h.click(); }
        setTimeout(function () { try { sessionStorage.removeItem("ipr_lb_seta"); } catch (e) {} nS = 99; seta(); if (alvo && alvo.scrollIntoView) alvo.scrollIntoView({ block: "center" }); }, 400);
      });
      var bx = D.createElement("button"); bx.type = "button"; bx.className = "s"; bx.textContent = pt() ? "Agora não" : "Not now";
      bx.addEventListener("click", function () { c.remove(); });
      c.appendChild(tx); c.appendChild(bv); c.appendChild(bx); D.body.appendChild(c); setTimeout(function () { try { c.remove(); } catch (e) {} }, 20000);
      return true;
    }
    var r = alvo.getBoundingClientRect();
    try { sessionStorage.setItem("ipr_lb_seta", "1"); } catch (e) {}
    var s = D.createElement("div"); s.id = "ipr-lb-seta"; s.setAttribute("role", "status");
    s.textContent = pt() ? "Antes de começar: teste as camadas e a sua internet, aqui." : "Before you start: test the layers and your connection, here.";
    s.style.left = Math.round(r.right + 14) + "px"; s.style.top = Math.round(r.top + r.height / 2 - 18) + "px";
    if (r.right + 300 > W.innerWidth) { s.style.left = Math.max(8, Math.round(r.left)) + "px"; s.style.top = Math.round(r.bottom + 12) + "px"; }
    alvo.classList.add("ipr-lb-luz");
    function fora() { try { s.remove(); } catch (e) {} alvo.classList.remove("ipr-lb-luz"); }
    s.addEventListener("click", fora); alvo.addEventListener("click", fora, { once: true });
    D.body.appendChild(s); setTimeout(fora, 15000);
    return true;
  }
  var nS = 0; (function tentar() { if (seta()) return; if (nS++ < 40) setTimeout(tentar, 750); })();

  // 3. estado das Bases desactualizado
  function est() { return W.__ipe && W.__ipe.estado || null; }
  var visto = false;
  function verEstado() {
    if (D.hidden || visto || !W.tcdNonce) return;
    var P = est(); if (!P || !P.mapas || !P.mapas.length) return;
    fetch("/wp-json/tcd/v1/meus-mapas", { credentials: "same-origin", headers: { "X-WP-Nonce": W.tcdNonce || "" } })
      .then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
        if (!d) return;
        var novo = {}; ["mapas", "partilhados", "rever"].forEach(function (k) { (d[k] || []).forEach(function (m) { novo[String(m.id)] = m.estado_k + "|" + (k === "rever" ? 1 : 0); }); });
        var mud = [];
        P.mapas.forEach(function (m) { var n = novo[String(m.id)]; if (n && n !== (m.estado_k + "|" + (m.rever ? 1 : 0))) mud.push(m.local || ("#" + m.id)); });
        if (!mud.length) return;
        visto = true;
        var a = D.createElement("div"); a.id = "ipr-lb-act"; a.setAttribute("role", "status");
        var t = D.createElement("span");
        t.textContent = (pt() ? "Há projectos com estado novo (" : "Some projects have a new status (") + mud.slice(0, 3).join(", ") + (mud.length > 3 ? "…" : "") + ").";
        var b = D.createElement("button"); b.type = "button"; b.textContent = pt() ? "Actualizar" : "Refresh";
        b.addEventListener("click", function () { var a2 = P.actual && P.actual.id; location.href = "/atlas/" + (a2 ? "?mapa=" + encodeURIComponent(a2) : ""); });
        var x = D.createElement("button"); x.type = "button"; x.className = "s"; x.textContent = pt() ? "Agora não" : "Not now";
        x.addEventListener("click", function () { a.remove(); });
        a.appendChild(t); a.appendChild(b); a.appendChild(x); D.body.appendChild(a);
      }).catch(function () {});
  }
  setInterval(verEstado, 300000);
  D.addEventListener("visibilitychange", function () { if (!D.hidden) setTimeout(verEstado, 1500); });
})();
