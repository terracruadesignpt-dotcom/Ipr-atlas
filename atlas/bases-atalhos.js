/* IPR Atlas · bases-atalhos.js (04/11/2026). Terracrua Design. Só acrescenta; não mexe noutros ficheiros.
   Nuno, 04/11/2026, 18h18: em cada cartão do separador «Bases», que tem muito espaço livre, uma linha de botões pequenos de
   atalho. Só a equipa, em tablet e computador (no telemóvel, menos de 600 px ou html.ipr-tl, a linha não aparece).
   1. «Processar Base» (terreno com limite e ainda sem Base) ou «Reprocessar» (já há Base: corre de novo com o padrão actual
      do worker). Pelo m90736, que usa os caminhos existentes: tcd_wk_por_na_fila (m14618) e tcd_m332_reprocessar (m90332).
      Sem factura, sem mudança de estado nem de preço. Confirmação dentro do cartão; depois o cartão mostra «Na fila» ou o
      passo em que está, lido de minuto a minuto enquanto houver Bases na fila. O servidor impede pedir duas vezes.
   2. «Fazer Leitura»: o botão «Encomendar a Leitura Territorial deste terreno» da ficha do próprio cartão (app.js), com o
      limite do cartão. Para a equipa a encomenda sai a 0 €, sem factura, directa para produção (m14587), na conta de quem
      pede. Confirmação dentro do cartão. Não aparece quando a Base já traz a Leitura.
      «Fazer Planta»: o diálogo da Planta de Localização do Atlas para este terreno (window.__iprPlanta, o mesmo que o
      assistente usa para os projectos da conta). O PDF faz-se no navegador; não cria encomenda.
   3. «Ficha do terreno»: abre a ficha do cartão (botão «Ver a ficha do terreno»).
   Os mesmos atalhos entram no menu «⋯» do bases-tipos.js (window.__iprBAtalhos.menu).
   Desligar: ?batalhos=0 ou localStorage ipr_batalhos_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]batalhos=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_batalhos_off") === "1") return; } catch (e) {}
  if (W.__iprBAtalhos) return; W.__iprBAtalhos = 1;

  function pt() { return (W.IPR_LINGUA || "pt") !== "en"; }
  function T(a, b) { return pt() ? a : b; }
  function est() { return W.__ipe && W.__ipe.estado || null; }
  function equipa() { var E = W.tcdEquipa; return !!(E && E.email && W.tcdNonce); }
  function movel() { return (W.innerWidth || 1000) < 600 || D.documentElement.classList.contains("ipr-tl"); }
  function el(t, c, x) { var e = D.createElement(t); if (c) e.className = c; if (x != null) e.textContent = String(x); return e; }
  function parar(n) { ["click", "mousedown", "pointerdown", "touchstart", "keydown", "keyup"].forEach(function (v) { n.addEventListener(v, function (e) { e.stopPropagation(); }); }); }
  function api(rota, corpo) {
    var h = { "X-WP-Nonce": W.tcdNonce || "" }; if (corpo) h["Content-Type"] = "application/json";
    return fetch("/wp-json/tcd/v1/" + rota, { method: corpo ? "POST" : "GET", credentials: "same-origin", headers: h, body: corpo ? JSON.stringify(corpo) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error((j && j.message) || r.status); e.status = r.status; throw e; } return j; }); });
  }

  var css = el("style");
  css.textContent =
    ".ipr-ba{display:flex;flex-wrap:wrap;gap:5px;align-items:center;margin:7px 0 2px}" +
    "html.ipr-tl .ipr-ba{display:none!important}@media (max-width:599px){.ipr-ba{display:none!important}}" +
    "#ipe-proj .ipr-ba button,.ipr-ba button{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;min-height:28px;padding:3px 10px;border:1px solid var(--ln,#3a3f30);border-radius:7px;font:600 11.5px/1.3 Inter,system-ui,sans-serif;color:var(--tx,#e9eadf);white-space:nowrap}" +
    ".ipr-ba button:hover,.ipr-ba button:focus-visible{border-color:var(--ac,#9BC53D)}.ipr-ba button:focus-visible{outline:2px solid var(--ac,#9BC53D);outline-offset:1px}" +
    ".ipr-ba button.ac{background:var(--ac,#9BC53D);border-color:var(--ac,#9BC53D);color:#0f1a08}" +
    ".ipr-ba button[disabled]{opacity:.45;cursor:default}" +
    ".ipr-ba .st{font:600 10.5px/1.4 Inter,system-ui,sans-serif;padding:2px 8px;border-radius:99px;border:1px solid rgba(217,164,65,.55);color:#d9a441}" +
    ".ipr-ba .cf{flex:1 1 100%;font:12px/1.4 Inter,system-ui,sans-serif;color:var(--tx,#e9eadf)}" +
    ".ipr-ba .msg{flex:1 1 100%;font:11.5px/1.4 Inter,system-ui,sans-serif;color:var(--mu,#a7ab98)}.ipr-ba .msg.mau{color:#e07a5f}";
  (D.head || D.documentElement).appendChild(css);

  // ---------- estado da fila (m90736) ----------
  var ES = null, ACT = "", PODE = false, OFF = false, PED = false, T_ES = 0, CONF = {}, MSG = {};
  function ids() { var P = est(); return ((P && P.mapas) || []).map(function (m) { return String(m.id || ""); }).filter(function (x) { return /^\d+$/.test(x); }).slice(0, 300); }
  function lerEstado(forca) {
    if (OFF || PED || !equipa()) return;
    var algumaFila = ES && Object.keys(ES).some(function (k) { return ES[k] && +ES[k].fila; });
    if (!forca && ES && Date.now() - T_ES < (algumaFila ? 60000 : 600000)) return;
    var l = ids(); if (!l.length) return;
    PED = true;
    api("m736/estado?ids=" + l.join(",")).then(function (j) {
      PED = false; T_ES = Date.now(); ES = (j && j.estado) || {}; ACT = (j && j.actual) || ""; PODE = !!(j && j.pode); tudo();
    }).catch(function (x) { PED = false; T_ES = Date.now(); if (x && (x.status === 401 || x.status === 403 || x.status === 404)) { OFF = true; limpar(); } });
  }
  var PASSO = { aguarda: ["Na fila", "Queued"], a_descarregar: ["A descarregar LiDAR", "Downloading LiDAR"], a_processar: ["A processar", "Processing"], condicionantes: ["Condicionantes", "Constraints"], relatorio: ["Relatório", "Report"], a_enviar: ["A enviar", "Uploading"] };

  // ---------- acções ----------
  function cartoes() { return [].slice.call(D.querySelectorAll("#ipe-proj .ipe-card[data-i]")); }
  function mapa(c) { var P = est(); return P && P.mapas ? P.mapas[+c.getAttribute("data-i")] || null : null; }
  function temLeitura(m) { return (m.downloads || []).some(function (d) { return /Leitura_Territorial/i.test(String(d && d.nome || "")); }); }
  function expandir(c) { var mais = c.querySelector('.ipr-pc-t[aria-expanded="false"]'); if (mais) mais.click(); }
  function esperar(fn, ms) { var t0 = Date.now(); return new Promise(function (ok, nao) { (function v() { var x = fn(); if (x) return ok(x); if (Date.now() - t0 > (ms || 6000)) return nao(new Error("tempo")); setTimeout(v, 250); })(); }); }
  function ficha(c) {
    expandir(c);
    var i = c.getAttribute("data-i"), out = c.querySelector('[data-res-out="' + i + '"]');
    if (out && out.children.length) { try { out.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) {} return Promise.resolve(out); }
    var b = c.querySelector('[data-res-proj="' + i + '"]'); if (!b) return Promise.reject(new Error(T("Este cartão não tem ficha do terreno.", "This card has no land sheet.")));
    b.click();
    return esperar(function () { var o = c.querySelector('[data-res-out="' + i + '"]'); return o && o.children.length ? o : null; }, 20000)
      .then(function (o) { try { o.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) {} return o; });
  }
  function fazerLeitura(c) {
    var i = c.getAttribute("data-i"), id = String((mapa(c) || {}).id);
    MSG[id] = [T("A abrir a ficha do terreno…", "Opening the land sheet…"), ""]; pintar(c, true);
    return ficha(c).then(function () { return esperar(function () { return c.querySelector('[data-res-lt="' + i + '"]'); }, 8000); })
      .then(function (b) { b.click(); MSG[id] = [T("Pedido enviado pelo botão da ficha: a resposta aparece por baixo dele.", "Sent through the sheet's button: the answer appears below it."), ""]; pintar(c, true); })
      .catch(function (x) { MSG[id] = [x && x.message !== "tempo" ? x.message : T("A ficha não trouxe o botão da Leitura (talvez já pedida).", "The sheet did not show the Reading button (maybe already ordered)."), "mau"]; pintar(c, true); });
  }
  function fazerPlanta(m) {
    if (typeof W.__iprPlanta === "function") { W.__iprPlanta(m.encomenda || m.id); return true; }
    location.href = "/atlas/?servico=planta"; return false;
  }
  function processar(c, m, ac) {
    var id = String(m.id);
    MSG[id] = [T("A pedir…", "Requesting…"), ""]; delete CONF[id]; pintar(c, true);
    api("m736/processar", { enc: +id, accao: ac }).then(function (j) {
      if (j && j.estado && ES) ES[id] = j.estado;
      MSG[id] = [(j && j.mensagem) || "", j && j.ok ? "" : "mau"]; T_ES = Date.now(); pintar(c, true);
    }).catch(function (x) { MSG[id] = [T("Não foi possível: ", "Could not: ") + (x && x.message || ""), "mau"]; pintar(c, true); });
  }
  // o que cada cartão oferece: [chave, texto, função, desligado (dica)]
  function opcoes(c, m) {
    var id = String(m.id), e = ES && ES[id], L = [];
    if (e && e.geo) {
      var ac = +e.base ? "reprocessar" : "processar";
      var dica = !PODE ? T("Só a equipa sem estagiários.", "Team only, not interns.") : !+e.ok ? T("Só com a encomenda em processamento ou concluída.", "Only for orders in progress or completed.") : +e.espera ? T("Pedido há pouco.", "Requested recently.") : "";
      if (!+e.fila) L.push([ac, ac === "reprocessar" ? T("Reprocessar", "Reprocess") : T("Processar Base", "Process base"), function () { CONF[id] = ac; delete MSG[id]; pintar(c, true); }, dica]);
    }
    if (m.geojson && !m.rever && !temLeitura(m)) L.push(["leitura", T("Fazer Leitura", "Order Reading"), function () { CONF[id] = "leitura"; delete MSG[id]; pintar(c, true); }, ""]);
    if (m.geojson && !m.rever) L.push(["planta", T("Fazer Planta", "Location plan"), function () { fazerPlanta(m); }, ""]);
    if (c.querySelector("[data-res-proj]")) L.push(["ficha", T("Ficha do terreno", "Land sheet"), function () { ficha(c).catch(function (x) { MSG[id] = [x.message, "mau"]; pintar(c, true); }); }, ""]);
    return L;
  }
  function textoConf(k, m) {
    var e = ES && ES[String(m.id)] || {};
    if (k === "reprocessar") return T("Reprocessar a Base #" + m.id + " com o padrão actual" + (ACT ? " (worker " + ACT + ")" : "") + "? A entrega actual" + (e.v ? " (" + e.v + ")" : "") + " fica arquivada e pode ser reposta. Sem factura nem mudança de estado.", "Reprocess base #" + m.id + " with the current standard? The current delivery is archived. No invoice, no status change.");
    if (k === "processar") return T("Pôr a Base #" + m.id + " na fila do worker? Sem factura nem mudança de estado.", "Queue base #" + m.id + " for the worker? No invoice, no status change.");
    return T("Pedir a Leitura Territorial deste terreno? Para a equipa sai a 0 €, sem factura, directa para produção, na tua conta.", "Order the Territorial Reading for this land? For the team it is free, no invoice, straight to production, in your account.");
  }

  // ---------- desenho ----------
  function pintar(c, forca) {
    var m = mapa(c); if (!m) return;
    var id = String(m.id), e = ES && ES[id], ct = c.querySelector(".ipe-ct") || c;
    var L = opcoes(c, m), cf = CONF[id], ms = MSG[id];
    var chave = [pt() ? 1 : 0, JSON.stringify(e || null), PODE ? 1 : 0, L.map(function (x) { return x[0] + (x[3] ? "x" : ""); }).join(","), cf || "", ms ? ms.join("|") : ""].join("#");
    var R = ct.querySelector(":scope > .ipr-ba");
    if (R && !forca && R.dataset.k === chave) return;
    if (R && R.contains(D.activeElement) && !forca && R.dataset.k === chave) return;
    if (!L.length && !(e && +e.fila)) { if (R) R.remove(); return; }
    if (!R) { R = el("div", "ipr-ba"); parar(R); var ec = ct.querySelector(":scope > .ipr-ec"); if (ec && ec.nextSibling) ct.insertBefore(R, ec.nextSibling); else ct.appendChild(R); }
    R.dataset.k = chave; R.textContent = "";
    if (e && +e.fila) { var s = el("span", "st", (PASSO[e.e] ? T(PASSO[e.e][0], PASSO[e.e][1]) : e.e) + (e.passo && e.e !== "aguarda" ? " · " + e.passo : "")); s.title = T("Estado no worker; actualiza de minuto a minuto.", "Worker status; refreshed every minute."); R.appendChild(s); }
    if (cf) {
      R.appendChild(el("span", "cf", textoConf(cf, m)));
      var ok = el("button", "ac", T("Confirmar", "Confirm")); ok.type = "button";
      ok.addEventListener("click", function (ev) { ev.preventDefault(); if (cf === "leitura") { delete CONF[id]; fazerLeitura(c); } else processar(c, m, cf); });
      var no = el("button", "", T("Cancelar", "Cancel")); no.type = "button";
      no.addEventListener("click", function (ev) { ev.preventDefault(); delete CONF[id]; pintar(c, true); });
      R.appendChild(ok); R.appendChild(no); try { ok.focus({ preventScroll: true }); } catch (x) {}
    } else {
      L.forEach(function (x) {
        var b = el("button", "", x[1]); b.type = "button"; b.setAttribute("data-ba", x[0]);
        if (x[3]) { b.disabled = true; b.title = x[3]; } else b.addEventListener("click", function (ev) { ev.preventDefault(); x[2](); });
        R.appendChild(b);
      });
    }
    if (ms && ms[0]) R.appendChild(el("span", "msg" + (ms[1] ? " " + ms[1] : ""), ms[0]));
  }
  function limpar() { [].forEach.call(D.querySelectorAll("#ipe-proj .ipr-ba"), function (x) { x.remove(); }); }
  function tudo() {
    if (!equipa() || OFF) return;
    var P = est(); if (!P || !P.mapas) return;
    lerEstado(false);
    if (!ES || movel()) return;
    cartoes().forEach(function (c) { try { pintar(c, false); } catch (e) {} });
  }
  setInterval(function () { if (!D.hidden) tudo(); }, 1500);
  D.addEventListener("ipr:lingua", function () { [].forEach.call(D.querySelectorAll(".ipr-ba"), function (x) { x.dataset.k = ""; }); tudo(); });

  // ---------- menu «⋯» do bases-tipos.js ----------
  W.__iprBAtalhos = {
    actualizar: function () { lerEstado(true); },
    menu: function (M, c, item, fechar) {
      var m = mapa(c); if (!m || !equipa() || !ES) return;
      var L = opcoes(c, m).filter(function (x) { return !movel() || x[0] === "planta" || x[0] === "ficha"; }); if (!L.length) return;
      M.appendChild(el("hr"));
      L.forEach(function (x) {
        item(M, x[1], x[3] ? null : function () {
          fechar();
          if (x[0] === "planta" || x[0] === "ficha") { x[2](); return; }
          x[2](); try { c.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) {}
        });
      });
    }
  };
})();
