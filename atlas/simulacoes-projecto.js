/* IPR Atlas · grupo «Simulações» do projecto (3/11/2026). Terracrua Design. Só acrescenta; não mexe noutros ficheiros.
   Pedido do Nuno (3/11, 22h): os resultados das simulações de água e de fogo têm de se encontrar no projecto;
   escolha «Projecto e Painel»; «Avança com tudo».
   Com uma Base aberta, mostra na calha das camadas (#ipe-cam) o grupo «Simulações»: todas as simulações de água e de fogo
   dessa Base, de quem tem acesso a ela (dono, partilhas e equipa), com o processo, quem lançou, a data e o estado
   (rota tcd/v1/simulacoes, módulo m90801). Tocar numa abre o painel do simulador respectivo nessa simulação, pelo mesmo
   caminho do «Ver» da lista do painel. Ligação directa: /atlas/?mapa=ID&sim=agua:<id> ou &sim=fogo:<id> (usada pela
   lista «As minhas simulações» da Oficina).
   Desligar: ?simprojecto=0 ou localStorage ipr_simprojecto_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]simprojecto=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_simprojecto_off") === "1") return; } catch (e) {}
  var EN = (W.IPR_LINGUA === "en" || W.IPR_LANG === "en");
  function t(pt, en) { return EN ? en : pt; }
  var REST = (W.wpApiSettings && W.wpApiSettings.root ? W.wpApiSettings.root : "/wp-json/") + "tcd/v1/";
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function actual() { var e = W.__ipe && W.__ipe.estado; return e && e.actual; }
  function api(c) {
    return fetch(REST + c, { credentials: "same-origin", headers: { "X-WP-Nonce": W.tcdNonce || "" } })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j && j.message || ("HTTP " + r.status)); return j; }); });
  }
  var ESTADO = {
    successful: t("concluída", "finished"), failed: t("falhou", "failed"), dismissed: t("parada", "stopped"),
    running: t("a calcular", "running"), accepted: t("na fila", "queued"), expirado: t("já não está no simulador", "no longer on the simulator")
  };
  var CHAVE = "tcd_atlas_simprojecto_ab";
  var CSS = ".tsimp:not(.aberto)>*:not(h4){display:none}.tsimp h4{cursor:pointer;display:flex;align-items:center;gap:8px;margin:0!important;font:600 13px Inter,system-ui,sans-serif;color:var(--tx,#222)}" +
    ".tsimp h4::before{content:\"\";width:0;height:0;border-left:5px solid currentColor;border-top:4px solid transparent;border-bottom:4px solid transparent;transition:transform .15s}.tsimp.aberto h4::before{transform:rotate(90deg)}" +
    ".tsimp h4 em{font:500 10.5px Inter,system-ui,sans-serif;font-style:normal;color:var(--mu,#777);margin-left:auto}" +
    ".tsimp ul{list-style:none;margin:6px 0 0;padding:0}.tsimp li{margin:0}.tsimp button{all:unset;box-sizing:border-box;display:block;width:100%;cursor:pointer;padding:5px 4px;border-radius:6px;font:13px/1.35 Inter,system-ui,sans-serif;color:var(--tx,#222)}" +
    ".tsimp button:hover,.tsimp button:focus-visible{background:rgba(127,127,127,.12)}.tsimp button b{font-weight:600}.tsimp button small{display:block;font-size:11px;color:var(--mu,#777)}" +
    ".tsimp .e{font-size:11px;padding:0 5px;border-radius:8px;background:rgba(127,127,127,.15);margin-left:4px}.tsimp .e.successful{background:rgba(110,150,70,.2)}.tsimp .e.failed{background:rgba(190,70,50,.2)}" +
    ".tsimp .na{padding:5px 4px;font:13px/1.35 Inter,system-ui,sans-serif;color:var(--mu,#777)}.tsimp .na small{display:block;font-size:11px}.tsimp p{margin:6px 0 0;font:12px/1.4 Inter,system-ui,sans-serif;color:var(--mu,#777)}";
  var S = { enc: null, lista: null, erro: "", pedido: 0 };

  function montar() {
    var cam = D.getElementById("ipe-cam"); if (!cam) return false;
    if (D.getElementById("tsimp")) return true;
    var st = D.createElement("style"); st.textContent = CSS; D.head.appendChild(st);
    var d = D.createElement("div"); d.id = "tsimp"; d.className = "tsimp ipr-g"; d.setAttribute("data-g", "simulacoes"); d.hidden = true;
    cam.insertBefore(d, cam.firstChild);
    try { if (W.localStorage.getItem(CHAVE) === "1") d.classList.add("aberto"); } catch (e) {}
    d.addEventListener("click", function (e) {
      if (e.target.closest("h4")) { var a = d.classList.toggle("aberto"); try { W.localStorage.setItem(CHAVE, a ? "1" : "0"); } catch (x) {} if (a) carregar(); return; }
      var b = e.target.closest("[data-sim]"); if (!b) return;
      var p = b.getAttribute("data-sim").split(":"); abrirSimulacao(p[0], p[1]);
    });
    return true;
  }

  function pintar() {
    var d = D.getElementById("tsimp"); if (!d) return;
    var l = S.lista || [];
    var h = "<h4>" + t("Simulações", "Simulations") + "<em>" + (S.lista ? l.length : "") + "</em></h4>";
    if (S.erro) h += "<p>" + esc(S.erro) + "</p>";
    else if (!S.lista) h += "<p>" + t("A carregar…", "Loading…") + "</p>";
    else if (!l.length) h += "<p>" + t("Ainda não há simulações de água nem de fogo nesta Base.", "No water or fire simulations in this Base yet.") + "</p>";
    else {
      h += "<ul>" + l.map(function (s) {
        var tipo = s.tipo === "agua" ? t("Água", "Water") : t("Fogo", "Fire");
        var quando = new Date(s.criado).toLocaleString(EN ? "en-GB" : "pt-PT", { dateStyle: "short", timeStyle: "short" });
        var quem = s.quem === "Você" ? t("você", "you") : (s.quem === "outra pessoa" ? t("outra pessoa", "someone else") : s.quem);
        var dentro = "<b>" + esc(tipo + " · " + s.nome) + "</b>" +
          '<span class="e ' + esc(s.estado) + '">' + esc(ESTADO[s.estado] || t("por confirmar", "to be confirmed")) + "</span>" +
          "<small>" + esc(quando + (quem ? " · " + quem : "")) + "</small>";
        return "<li>" + (s.abre ? '<button type="button" data-sim="' + esc(s.tipo + ":" + s.id) + '">' + dentro + "</button>" : '<div class="na">' + dentro + "</div>") + "</li>";
      }).join("") + "</ul>";
      h += "<p>" + t("Os resultados abrem no painel do simulador, enquanto o simulador os guardar.", "Results open in the simulator panel while the simulator keeps them.") + "</p>";
    }
    d.innerHTML = h;
  }

  function carregar() {
    var a = actual(); if (!a || !a.id || !W.tcdNonce) return;
    var n = ++S.pedido, enc = a.id;
    api("simulacoes?enc=" + encodeURIComponent(enc)).then(function (r) {
      if (n !== S.pedido) return;
      S.lista = r.simulacoes || []; S.erro = ""; pintar();
    }).catch(function (e) {
      if (n !== S.pedido) return;
      S.lista = null; S.erro = (e && /403|acesso/i.test(e.message)) ? "" : t("Não foi possível ler as simulações.", "Could not read the simulations.");
      var d = D.getElementById("tsimp"); if (d && !S.erro) { d.hidden = true; return; }
      pintar();
    });
  }

  // Abre o painel do simulador e pede-lhe esta simulação, como o «Ver» da lista do próprio painel.
  function abrirSimulacao(tipo, id, tentativa) {
    if (!/^[0-9a-f]{32}$/.test(id) || (tipo !== "agua" && tipo !== "fogo")) return;
    // Só pela porta pública do painel, que existe apenas quando o simulador está disponível para esta pessoa.
    var pub = tipo === "agua" ? W.IPR_AGUA_SIM : W.IPR_FOGO_SIM;
    var painelId = tipo === "agua" ? "ipr-as" : "ipr-fs";
    if (!pub || typeof pub.abrir !== "function") { if ((tentativa || 0) < 20) setTimeout(function () { abrirSimulacao(tipo, id, (tentativa || 0) + 1); }, 500); return; }
    var P = D.getElementById(painelId);
    if (!P || P.hidden) { pub.abrir(); P = D.getElementById(painelId); }
    if (!P) return;
    var a = D.createElement("a"); a.href = "#"; a.setAttribute("data-verjob", id); a.hidden = true;
    P.appendChild(a); a.click(); if (a.parentNode) a.parentNode.removeChild(a);
  }

  function verificar() {
    var d = D.getElementById("tsimp"); if (!d) return;
    var a = actual(), id = a && a.id ? String(a.id) : null;
    var pronta = id && W.tcdNonce && (!a.estado_k || a.estado_k === "completed" || a.estado_k === "entregue");
    if (!pronta) { d.hidden = true; S.enc = null; return; }
    if (S.enc !== id) { S.enc = id; S.lista = null; S.erro = ""; d.hidden = false; pintar(); carregar(); }
  }

  var pedidoUrl = (function () {
    var m = /[?&]sim=(agua|fogo):([0-9a-f]{32})(&|$)/.exec(location.search), b = /[?&]mapa=(\d+)(&|$)/.exec(location.search);
    return m && b ? { tipo: m[1], id: m[2], mapa: b[1] } : null;
  })();
  function abrirDoUrl(n) {
    if (!pedidoUrl) return;
    var a = actual();
    // só quando o Atlas abriu mesmo a Base pedida (se não a encontrar, abre outra, e aí não se abre nada)
    if (!a || String(a.id) !== pedidoUrl.mapa || !W.__ipe || !W.__ipe.mapa) { if (n < 60) setTimeout(function () { abrirDoUrl(n + 1); }, 500); else pedidoUrl = null; return; }
    var p = pedidoUrl; pedidoUrl = null;
    setTimeout(function () { abrirSimulacao(p.tipo, p.id); }, 800);   // dar tempo aos simuladores de montarem o botão
  }

  function arrancar(n) {
    if (!montar()) { if (n < 60) setTimeout(function () { arrancar(n + 1); }, 500); return; }
    verificar(); setInterval(verificar, 1500);
    setInterval(function () { var d = D.getElementById("tsimp"); if (d && !d.hidden && d.classList.contains("aberto") && !D.hidden) carregar(); }, 60000);
    abrirDoUrl(0);
  }
  W.__tcdSimProjecto = { abrir: abrirSimulacao, recarregar: carregar };
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", function () { arrancar(0); }); else arrancar(0);
})();
