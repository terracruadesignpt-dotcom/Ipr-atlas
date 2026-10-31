/* IPR Atlas · projectos-grupos.js (31/10/2026). Terracrua Design. Só acrescenta; não mexe noutros ficheiros.
   Nuno, 12h43: «organiza-me melhor o separador projectos, tem de estar em grupos, mas ainda não sei quais. Mas quero ver
   facilmente na lista quais já têm tudo carregado». 12h46: os projectos da direita não são os da IPR Cloud.
   1. Cada cartão do separador Projectos ganha, à cabeça, «Tudo carregado» (verde) ou «Falta: …» (âmbar), contando três
      coisas: a Base no Atlas com as camadas todas, o projecto na IPR Cloud com o desenho e a Base junta ao projecto na
      Cloud (a Cloud é o alojamento dos projectos). O desenho no Atlas vai só na dica. Ao lado das indicações do estado-cartoes.js entra uma de «IPR Cloud».
   2. 12h47–12h50 (caixas de escolha: «Estado e grupos»): o separador passa a chamar-se «Bases» e ganha, por cima da lista,
      separadores finos por estado (Todas, Prontas, A preparar, Para rever), com os grupos da equipa dentro de cada um, e
      «Só com tudo carregado» / «Só com falta». A escolha fica neste navegador. O separador «Cloud» vem noutro ficheiro.
   3. Grupos da equipa: em cada cartão, «Grupo» com os grupos já criados e «Novo grupo…». Gravados no servidor para a equipa
      toda (m90599). Ainda sem grupos definidos: os projectos ficam em «Sem grupo» até alguém os pôr num.
   Só a equipa vê isto (rota m599/estado). Um pedido por página, guardado 10 minutos neste separador.
   O agrupamento muda só a ordem à vista (CSS order); a lista do Atlas não é mexida.
   Desligar: ?pgrupos=0 ou localStorage ipr_pgrupos_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]pgrupos=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_pgrupos_off") === "1") return; } catch (e) {}
  if (W.__iprPGrupos) return; W.__iprPGrupos = 1;

  var CAMADAS = ["mdt", "somb_bw", "curvas025", "curvas05", "curvas1", "curvas2", "curvas5", "declives", "exposicao", "geomorphons", "vento", "streams", "festos", "acumulacao", "bacias_l", "twi", "erosao", "escorrencia"];
  function pt() { return (W.IPR_LINGUA || "pt") !== "en"; }
  function T(a, b) { return pt() ? a : b; }
  function est() { return W.__ipe && W.__ipe.estado || null; }
  function ls(k, v) { try { if (v === undefined) return W.localStorage.getItem(k) || ""; W.localStorage.setItem(k, v); } catch (e) { return ""; } }
  function el(t, c, x) { var e = D.createElement(t); if (c) e.className = c; if (x != null) e.textContent = String(x); return e; }
  function parar(n) { ["click", "mousedown", "pointerdown", "touchstart", "keydown", "keyup", "change", "input"].forEach(function (v) { n.addEventListener(v, function (e) { e.stopPropagation(); }); }); }
  function api(rota, corpo) {
    var h = { "X-WP-Nonce": W.tcdNonce || "" }; if (corpo) h["Content-Type"] = "application/json";
    return fetch("/wp-json/tcd/v1/" + rota, { method: corpo ? "POST" : "GET", credentials: "same-origin", headers: h, body: corpo ? JSON.stringify(corpo) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error((j && j.message) || r.status); e.status = r.status; throw e; } return j; }); });
  }

  var css = el("style");
  css.textContent =
    "#ipe-proj .ipe-cards.ipr-pg-on{display:flex!important;flex-direction:column}" +
    "#ipe-proj .ipr-pg-h{order:0;margin:10px 0 2px;padding:0 2px;font:600 11px/1.3 Inter,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--mu,#a7ab98);display:flex;gap:6px;align-items:baseline}" +
    "#ipe-proj .ipr-pg-h b{font-weight:600;color:var(--tx,#e9eadf);letter-spacing:.04em}" +
    "#ipe-proj .ipr-pg-esc{display:none!important}" +
    ".ipr-pg-t{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;gap:5px;margin:4px 0 0;padding:2px 9px;border-radius:99px;font:700 10.5px/1.5 Inter,system-ui,sans-serif;border:1px solid}" +
    ".ipr-pg-t.ok{color:#0f1a08;background:#9BC53D;border-color:#9BC53D}" +
    ".ipr-pg-t.av{color:#d9a441;border-color:rgba(217,164,65,.55)}" +
    ".ipr-pg-g{display:flex;align-items:center;gap:6px;margin:6px 0 0;font:12px Inter,system-ui,sans-serif;color:var(--mu,#a7ab98)}" +
    ".ipr-pg-g select,.ipr-pg-g input{min-height:32px;max-width:100%;box-sizing:border-box;border:1px solid var(--ln,#3a3f30);border-radius:7px;background:var(--p3,#1d2117);color:var(--tx,#e9eadf);font:12.5px Inter,system-ui,sans-serif;padding:3px 6px}" +
    ".ipr-pg-g button{min-height:32px;padding:0 10px;border:1px solid var(--ln,#3a3f30);border-radius:7px;background:transparent;color:var(--tx,#e9eadf);font:600 12px Inter,system-ui,sans-serif;cursor:pointer}" +
    "#ipr-pg-f{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0 0 10px;padding:8px;border:1px solid var(--ln,#3a3f30);border-radius:9px;background:var(--p2,#22261b)}" +
    "#ipr-pg-f .abas{display:flex;flex:1 1 100%;gap:2px;border-bottom:1px solid var(--ln,#3a3f30);overflow-x:auto;scrollbar-width:none}" +
    "#ipr-pg-f .abas button{all:unset;cursor:pointer;padding:6px 9px 7px;font:600 12px Inter,system-ui,sans-serif;color:var(--mu,#a7ab98);border-bottom:2px solid transparent;white-space:nowrap}" +
    "#ipr-pg-f .abas button small{font:500 11px var(--mono,monospace);opacity:.8}" +
    "#ipr-pg-f .abas button[aria-selected=true]{color:var(--tx,#e9eadf);border-bottom-color:var(--ac,#9BC53D)}" +
    "#ipr-pg-f .abas button:focus-visible{outline:2px solid var(--ac,#9BC53D);outline-offset:-2px}" +
    "#ipr-pg-f label{display:flex;flex:1 1 11em;align-items:center;gap:6px;font:600 10.5px Inter,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--mu,#a7ab98)}" +
    "#ipr-pg-f select{flex:1;min-height:36px;border:1px solid var(--ln,#3a3f30);border-radius:7px;background:var(--p3,#1d2117);color:var(--tx,#e9eadf);font:13px Inter,system-ui,sans-serif;padding:6px 8px;text-transform:none;letter-spacing:0}" +
    "#ipr-pg-f .n{flex:1 1 100%;font:12px/1.3 var(--mono,monospace);color:var(--mu,#a7ab98)}";
  (D.head || D.documentElement).appendChild(css);

  // ---------- dados ----------
  var ES = null, GRUPOS = [], ES_IDS = "", ES_PED = false, ES_OFF = false, ORG = null, ORG_PED = false;
  try { var c0 = JSON.parse(sessionStorage.getItem("ipr_pg_es") || "null"); if (c0 && Date.now() - c0.t < 600000) { ES = c0.e; GRUPOS = c0.g || []; ES_IDS = c0.k || ""; } } catch (e) {}
  function ids() { var P = est(); return ((P && P.mapas) || []).map(function (m) { return String(m.id || ""); }).filter(function (x) { return /^\d+$/.test(x); }).slice(0, 300); }
  function pedir(forca) {
    if (ES_OFF || ES_PED || !W.tcdNonce) return;
    var l = ids(); if (!l.length) return;
    var k = l.slice().sort().join(","); if (!forca && k === ES_IDS && ES) return;
    ES_PED = true;
    api("m599/estado?ids=" + l.join(",")).then(function (j) {
      ES_PED = false; ES = (j && j.estado) || {}; GRUPOS = (j && j.grupos) || []; ES_IDS = k;
      try { sessionStorage.setItem("ipr_pg_es", JSON.stringify({ t: Date.now(), e: ES, g: GRUPOS, k: k })); } catch (e) {}
      tudo(true);
    }).catch(function (x) { ES_PED = false; if (x && (x.status === 401 || x.status === 403 || x.status === 404)) { ES_OFF = true; limpar(); } else ES_IDS = k; });
    if (!ORG && !ORG_PED) {
      ORG_PED = true;
      api("org/grupos-meus").then(function (j) {
        ORG = {}; ((j && j.grupos) || []).forEach(function (g) { var x = /^\s*(\d{2,4}(?:\.\d{2})?)\s/.exec(String(g.nome || "")); if (x) ORG[x[1]] = 1; });
        tudo(true);
      }).catch(function () { ORG = {}; });
    }
  }
  function baseOk(m) {
    var tem = {};
    (m.downloads || []).forEach(function (d) { var n = String(d && d.nome || "").split("/").pop().toLowerCase(); var x = /^([a-z0-9_]+)\.(pmtiles|geojson)$/.exec(n); if (x) tem[x[1]] = 1; });
    return CAMADAS.every(function (c) { return tem[c]; });
  }
  // O que conta para «tudo carregado» (Nuno, 12h48: a IPR Cloud é o alojamento de todos os projectos): a Base pronta no
  // Atlas, o projecto na Cloud com o desenho da Terracrua Design e a Base junta a esse projecto. O desenho no Atlas aparece
  // só na dica (é uma cópia para ver no mapa).
  function quatro(m) {
    var e = (ES && ES[String(m.id)]) || null; if (!e) return null;
    var num = e.num || "";
    var atlas = !!((num && ORG && (ORG[num] || ORG[num.split(".")[0]])) || e.fich > 0);
    var q = [
      ["base", !!e.base && baseOk(m), T("Base", "Base")],
      ["cloud", !!(e.cloud && e.desenho), num ? T("desenho na Cloud", "design in the Cloud") : T("número do projecto", "project number")],
      ["bcloud", !!e.base_cloud, T("Base na Cloud", "Base in the Cloud")]
    ];
    q.atlas = atlas;
    return q;
  }
  function completo(q) { return q && q.every(function (x) { return x[1]; }); }

  // ---------- cartões ----------
  function cartoes() { return [].slice.call(D.querySelectorAll("#ipe-proj .ipe-card[data-i]")); }
  function mapa(c) { var P = est(); return P && P.mapas ? P.mapas[+c.getAttribute("data-i")] || null : null; }
  function linha(c, m) {
    var q = quatro(m), e = ES && ES[String(m.id)]; if (!q || !e) return;
    var ct = c.querySelector(".ipe-ct") || c;
    var falta = q.filter(function (x) { return !x[1]; }).map(function (x) { return x[2]; });
    var gr = e.grupo || "";
    var chave = [pt() ? 1 : 0, falta.join(","), gr, GRUPOS.join("|"), equipa() ? 1 : 0].join("#");
    var w = ct.querySelector(":scope > .ipr-pg-w");
    if (w && (w.dataset.k === chave || w.contains(D.activeElement))) return;
    if (!w) { w = el("div", "ipr-pg-w"); parar(w); var st = ct.querySelector(":scope > strong"); if (st && st.nextSibling) ct.insertBefore(w, st.nextSibling); else ct.appendChild(w); }
    w.dataset.k = chave; w.textContent = "";
    var tg = el("span", "ipr-pg-t " + (falta.length ? "av" : "ok"), falta.length ? T("Falta: ", "Missing: ") + falta.join(", ") : T("Tudo carregado", "All loaded"));
    tg.title = q.map(function (x) { return (x[1] ? "✓ " : "· ") + x[2]; }).join("\n") + "\n" + (q.atlas ? "✓ " : "· ") + T("desenho também no Atlas", "design also in the Atlas") + (e.num ? "\n" + T("Projecto ", "Project ") + e.num : "");
    w.appendChild(tg);
    if (equipa()) {
      var g = el("div", "ipr-pg-g"), lb = el("label", "", T("Grupo", "Group")), s = el("select");
      lb.htmlFor = s.id = "ipr-pg-s-" + m.id;
      [["", "—"]].concat(GRUPOS.map(function (x) { return [x, x]; })).concat([["__novo", T("Novo grupo…", "New group…")]]).forEach(function (o) { var op = el("option", "", o[1]); op.value = o[0]; if (o[0] === gr) op.selected = true; s.appendChild(op); });
      s.addEventListener("change", function () {
        if (s.value !== "__novo") { gravar(m.id, s.value, g); return; }
        var i = el("input"); i.type = "text"; i.maxLength = 40; i.placeholder = T("Nome do grupo", "Group name"); i.setAttribute("aria-label", T("Nome do grupo", "Group name"));
        var ok = el("button", "", "OK"); ok.type = "button";
        s.replaceWith(i); g.appendChild(ok); i.focus();
        function feito() { var v = i.value.trim(); if (v) gravar(m.id, v, g); else { w.dataset.k = ""; tudo(true); } }
        ok.addEventListener("click", feito);
        i.addEventListener("keydown", function (ev) { if (ev.key === "Enter") { ev.preventDefault(); feito(); } if (ev.key === "Escape") { w.dataset.k = ""; tudo(true); } });
      });
      g.appendChild(lb); g.appendChild(s); w.appendChild(g);
    }
  }
  function gravar(id, grupo, g) {
    g.style.opacity = ".6";
    api("m599/grupo", { enc: +id, grupo: grupo }).then(function (j) {
      if (ES && ES[String(id)]) ES[String(id)].grupo = (j && j.grupo) || "";
      if (grupo && GRUPOS.indexOf(grupo) < 0) { GRUPOS.push(grupo); GRUPOS.sort(function (a, b) { return a.localeCompare(b, "pt"); }); }
      try { sessionStorage.setItem("ipr_pg_es", JSON.stringify({ t: Date.now(), e: ES, g: GRUPOS, k: ES_IDS })); } catch (e) {}
      tudo(true);
    }).catch(function (x) { g.style.opacity = ""; g.title = T("Não foi possível guardar", "Could not save") + (x && x.message ? ": " + x.message : ""); tudo(true); });
  }
  function equipa() { var E = W.tcdEquipa; return !!(E && E.email) && !ES_OFF; }

  function estadoDe(m) {
    if (!m) return "";
    if (m.rever || /revis/i.test(String(m.estado || ""))) return "rev";
    if (m.estado_k === "completed") return "ent";
    if (m.estado_k === "processing" || m.estado_k === "on-hold" || m.estado_k === "pending" || /an[aá]lise/i.test(String(m.estado || ""))) return "prep";
    return "outro";
  }
  // ---------- barra, grupos e filtro ----------
  var MODO = "grupo", VER = ls("ipr_pg_ver") || "", ABA = ls("ipr_pg_aba") || "";
  function barra() {
    var pane = D.querySelector('#ipe .ipe-pane[data-pane="proj"]'), box = D.getElementById("ipe-proj");
    if (!pane || !box || !ES || !equipa()) { var b0 = D.getElementById("ipr-pg-f"); if (b0) b0.remove(); return; }
    var bar = D.getElementById("ipr-pg-f");
    var n = contar();
    var chave = [pt() ? 1 : 0, ABA, VER, n.join(",")].join("#");
    if (!bar) {
      bar = el("div"); bar.id = "ipr-pg-f"; parar(bar);
      bar.addEventListener("click", function (e) { var b = e.target.closest("[data-aba]"); if (!b) return; ABA = b.getAttribute("data-aba"); ls("ipr_pg_aba", ABA); bar.dataset.k = ""; tudo(); });
      bar.addEventListener("change", function (e) { if (e.target.getAttribute("data-pg") === "ver") { VER = e.target.value; ls("ipr_pg_ver", VER); bar.dataset.k = ""; tudo(); } });
    }
    var px = D.getElementById("ipr-px-f"), antes = px && px.parentNode === pane ? px : box;
    if (bar.nextElementSibling !== antes) pane.insertBefore(bar, antes);
    if (bar.dataset.k === chave) return;
    bar.dataset.k = chave; bar.textContent = "";
    var abas = el("div", "abas"); abas.setAttribute("role", "tablist");
    [["", T("Todas", "All"), n[2]], ["ent", T("Prontas", "Ready"), n[3].ent], ["prep", T("A preparar", "In progress"), n[3].prep], ["rev", T("Para rever", "To review"), n[3].rev]].forEach(function (a) {
      if (a[0] && !a[2]) return;
      var b = el("button", "", a[1]); b.type = "button"; b.setAttribute("data-aba", a[0]); b.setAttribute("role", "tab"); b.setAttribute("aria-selected", ABA === a[0] ? "true" : "false");
      b.appendChild(el("small", "", " " + a[2])); abas.appendChild(b);
    });
    bar.appendChild(abas);
    var l = el("label", "ver"), s2 = el("select"); s2.setAttribute("data-pg", "ver"); l.appendChild(D.createTextNode(T("Mostrar", "Show")));
    [["", T("Todas", "All")], ["ok", T("Só com tudo carregado", "Only fully loaded") + " (" + n[0] + ")"], ["falta", T("Só com falta", "Only with something missing") + " (" + n[1] + ")"]].forEach(function (o) { var op = el("option", "", o[1]); op.value = o[0]; if (o[0] === VER) op.selected = true; s2.appendChild(op); });
    l.appendChild(s2); bar.appendChild(l);
    bar.appendChild(el("span", "n", T(n[0] + " de " + (n[0] + n[1]) + " com tudo carregado", n[0] + " of " + (n[0] + n[1]) + " fully loaded")));
  }
  function contar() { var a = 0, b = 0, t = 0, e = { ent: 0, prep: 0, rev: 0, outro: 0 }; cartoes().forEach(function (c) { if (c.closest(".ipr-todas")) return; var m = mapa(c); if (!m) return; t++; e[estadoDe(m)] = (e[estadoDe(m)] || 0) + 1; if (ABA && estadoDe(m) !== ABA) return; var q = quatro(m); if (!q) return; if (completo(q)) a++; else b++; }); return [a, b, t, e]; }
  function chaveGrupo(m) {
    var q = quatro(m), e = ES && ES[String(m.id)] || {};
    if (MODO === "grupo") return e.grupo || "";
    if (!q) return "";
    var f = q.filter(function (x) { return !x[1]; });
    if (!f.length) return "0|" + T("Tudo carregado", "All loaded");
    return f.length + "|" + T("Falta: ", "Missing: ") + f.map(function (x) { return x[2]; }).join(", ");
  }
  function nomeGrupo(k) { if (MODO === "grupo") return k || T("Sem grupo", "No group"); return k.replace(/^\d+\|/, ""); }
  function agrupar() {
    [].forEach.call(D.querySelectorAll("#ipe-proj .ipe-cards"), function (box) {
      var cs = [].slice.call(box.querySelectorAll(":scope > .ipe-card[data-i]"));
      var velhos = [].slice.call(box.querySelectorAll(":scope > .ipr-pg-h"));
      cs.forEach(function (c) { var m = mapa(c), q = m && quatro(m); var esc = !!((ABA && m && estadoDe(m) !== ABA && !c.closest(".ipr-todas")) || (VER && q && (VER === "ok" ? !completo(q) : completo(q)))); if (c.classList.contains("ipr-pg-esc") !== esc) c.classList.toggle("ipr-pg-esc", esc); });
      if (!MODO || !ES || !cs.length) { velhos.forEach(function (h) { h.remove(); }); box.classList.remove("ipr-pg-on"); cs.forEach(function (c) { c.style.order = ""; }); return; }
      var gs = {};
      cs.forEach(function (c) { if (c.classList.contains("ipr-pg-esc")) return; var m = mapa(c); var k = m ? chaveGrupo(m) : ""; (gs[k] = gs[k] || []).push(c); });
      var ks = Object.keys(gs).sort(function (a, b) {
        if (MODO === "grupo") { if (!a) return 1; if (!b) return -1; return a.localeCompare(b, "pt"); }
        return (parseInt(a, 10) - parseInt(b, 10)) || a.localeCompare(b, "pt");
      });
      if (ks.length === 1 && ks[0] === "") { velhos.forEach(function (h) { h.remove(); }); box.classList.remove("ipr-pg-on"); cs.forEach(function (c) { c.style.order = ""; }); box.dataset.pg = ""; return; }
      var assin = MODO + "#" + ks.map(function (k) { return k + ":" + gs[k].length; }).join("|");
      box.classList.add("ipr-pg-on");
      var o = 1;
      if (box.dataset.pg !== assin) { velhos.forEach(function (h) { h.remove(); }); velhos = []; }
      ks.forEach(function (k, i) {
        var h = velhos[i];
        if (!h) { h = el("div", "ipr-pg-h"); box.appendChild(h); }
        h.textContent = ""; h.appendChild(el("b", "", nomeGrupo(k))); h.appendChild(D.createTextNode(String(gs[k].length)));
        h.style.order = String(o++);
        gs[k].forEach(function (c) { c.style.order = String(o++); });
      });
      box.dataset.pg = assin;
    });
  }
  function limpar() {
    [].forEach.call(D.querySelectorAll("#ipe-proj .ipr-pg-h, #ipe-proj .ipr-pg-w, #ipr-pg-f"), function (x) { x.remove(); });
    [].forEach.call(D.querySelectorAll("#ipe-proj .ipr-pg-on"), function (x) { x.classList.remove("ipr-pg-on"); });
    [].forEach.call(D.querySelectorAll("#ipe-proj .ipe-card"), function (x) { x.style.order = ""; x.classList.remove("ipr-pg-esc"); });
  }

  function rotulo() {
    var b = D.querySelector('#ipe [data-tab="proj"], #ipe [aria-controls*="proj"]'); if (!b) { [].some.call(D.querySelectorAll("#ipe button, #ipe [role=tab]"), function (x) { if (/^\s*(Projectos|Projects)\s*$/.test(x.textContent)) { b = x; return true; } return false; }); }
    if (!b) return; var alvo = T("Bases", "Bases");
    var tn = [].filter.call(b.childNodes, function (n) { return n.nodeType === 3 && /\S/.test(n.nodeValue); })[0];
    if (tn) { if (tn.nodeValue.trim() !== alvo) tn.nodeValue = alvo; } else if (b.children.length === 0 && b.textContent.trim() !== alvo) b.textContent = alvo;
  }
  function tudo() {
    if (!W.tcdNonce || ES_OFF) return;
    var P = est(); if (!P || !P.mapas) return;
    pedir(false);
    if (!ES) return;
    cartoes().forEach(function (c) { var m = mapa(c); if (m) try { linha(c, m); } catch (e) {} });
    try { barra(); } catch (e) {}
    try { rotulo(); } catch (e) {}
    try { agrupar(); } catch (e) {}
  }
  setInterval(function () { if (!D.hidden) tudo(); }, 1500);
  D.addEventListener("ipr:lingua", function () { var b = D.getElementById("ipr-pg-f"); if (b) b.dataset.k = ""; [].forEach.call(D.querySelectorAll(".ipr-pg-w"), function (w) { w.dataset.k = ""; }); tudo(); });
  W.__iprPGrupos = { actualizar: function () { pedir(true); } };
})();
