/* IPR Atlas · bases-fichas.js (05/11/2026). Terracrua Design. Só acrescenta; não mexe noutros ficheiros. Sem dados: as fichas
   vêm do servidor (m90904), só para a equipa.
   Nuno, 05/11/2026, 10h09: «faz uma busca exaustiva ao Google Drive [...] quero uma ficha de propriedade para cada uma das
   entradas que temos do Google Drive, e todos aqui ordenados segundo a última coisa que foi feita»; caixas: ficha com local
   no mapa, data mais recente, arquivo no fim; 10h52: «quero poder arrastar as que vão para o arquivo, meter em outros sítios».
   1. Dentro da pasta aberta no separador Bases (Pedidos, Dias abertos, Reuniões, Projectos, Projectos entregues,
      Implementação; «Todas» mostra as activas), depois das Bases, uma lista «Do Drive» em linhas finas: ponto cinzento,
      nome e data da última actividade, da mais recente para a mais antiga. A pesquisa da barra também as filtra.
   2. Carregar numa linha abre a ficha: de onde veio, data, nota, «Abrir a pasta no Drive», «Ver no mapa» (se tiver local) e
      «Marcar no mapa» (o clique seguinte no mapa grava o local da ficha, para a equipa toda).
   3. No fim, uma pasta «Arquivo» (leads e visitas antigas), fechada; abre-se como as outras.
   4. Arrastar (rato): uma ficha larga-se no título de outra pasta ou no «Arquivo»; grava no servidor (m90904), que põe a
      pasta do Drive na fila do motor (m90903).
   Desligar: ?bfichas=0 ou localStorage ipr_bfichas_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]bfichas=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_bfichas_off") === "1") return; } catch (e) {}
  if (W.__iprBFichas) return; W.__iprBFichas = 1;

  function equipa() { var E = W.tcdEquipa; return !!(E && E.email && W.tcdNonce); }
  function el(t, c, x) { var e = D.createElement(t); if (c) e.className = c; if (x != null) e.textContent = String(x); return e; }
  function ls(k, v) { try { if (v === undefined) return W.localStorage.getItem(k) || ""; W.localStorage.setItem(k, v); } catch (e) { return ""; } }
  function api(rota, corpo) {
    var h = { "X-WP-Nonce": W.tcdNonce || "" }; if (corpo) h["Content-Type"] = "application/json";
    return fetch("/wp-json/tcd/v1/" + rota, { method: corpo ? "POST" : "GET", credentials: "same-origin", headers: h, body: corpo ? JSON.stringify(corpo) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.ok) throw new Error((j && j.message) || r.status); return j; }); });
  }
  function norm(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
  function dataCurta(d) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ""); return m ? m[3] + "/" + m[2] + "/" + m[1].slice(2) : ""; }

  var css = el("style"); css.id = "ipr-fx-css";
  css.textContent =
    "#ipr-fx,#ipr-fx-arq-l{margin:2px 0 6px 2px;padding-left:6px;border-left:2px solid #5E6157}" +
    "#ipr-fx .cab,#ipr-fx-arq-l .cab{font:600 10.5px/1 'IBM Plex Mono',ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase;color:#8E9186;padding:8px 4px 4px}" +
    ".ipr-fx-l{border-bottom:1px solid #2A2B27}" +
    ".ipr-fx-h{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:8px;width:100%;min-height:30px;padding:4px 4px;cursor:pointer;color:#C3C5BC;font:500 12.5px/1.25 Inter,system-ui,sans-serif}" +
    ".ipr-fx-h:hover{background:rgba(255,255,255,.04)}.ipr-fx-h:focus-visible{outline:2px solid #94BE39;outline-offset:-2px}" +
    ".ipr-fx-h .s{flex:0 0 auto;width:0;height:0;border-style:solid;border-width:4px 0 4px 6px;border-color:transparent transparent transparent #8E9186;transition:transform .15s}" +
    ".ipr-fx-l.on .ipr-fx-h .s{transform:rotate(90deg)}.ipr-fx-l.on .ipr-fx-h{color:#F5F4EE}" +
    ".ipr-fx-h .d{flex:0 0 auto;width:7px;height:7px;border-radius:50%;background:#6E7168}.ipr-fx-h .d.m{background:#B8A83A}" +
    ".ipr-fx-h .t{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    ".ipr-fx-h .a{flex:0 0 auto;font:400 11px/1 'IBM Plex Mono',ui-monospace,monospace;color:#8E9186}" +
    ".ipr-fx-c{padding:4px 6px 10px 18px;font:400 12px/1.45 Inter,system-ui,sans-serif;color:#C3C5BC}" +
    ".ipr-fx-c .b{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}" +
    ".ipr-fx-c .b a,.ipr-fx-c .b button{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;min-height:28px;padding:3px 10px;border:1px solid #383A33;border-radius:2px;font:600 11.5px/1.3 Inter,system-ui,sans-serif;color:#F5F4EE}" +
    ".ipr-fx-c .b a:hover,.ipr-fx-c .b button:hover{border-color:#94BE39}" +
    "html.ipr-fx-eq .ipr-fx-h{cursor:grab}.ipr-fx-l.arr{opacity:.45}" +
    "#ipr-fx-arq{all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;gap:10px;width:100%;min-height:46px;padding:8px 10px 8px 6px;border-bottom:1px solid #383A33;color:#C3C5BC;font:600 14px/1.25 Inter,system-ui,sans-serif}" +
    "#ipr-fx-arq .seta{flex:0 0 auto;width:0;height:0;border-style:solid;border-width:5px 0 5px 7px;border-color:transparent transparent transparent currentColor;transition:transform .15s}" +
    "#ipr-fx-arq[aria-expanded=true] .seta{transform:rotate(90deg)}#ipr-fx-arq[aria-expanded=true]{color:#94BE39;background:#000}" +
    "#ipr-fx-arq .nome{flex:1 1 auto}#ipr-fx-arq .n{flex:0 0 auto;min-width:22px;padding:2px 6px;border-radius:5px;text-align:center;font:600 12px/1.2 'IBM Plex Mono',monospace;color:#B5D86A;background:#0B0C0A}" +
    "html.ipr-fx-arr .ipr-ac button[data-ac]:not([data-ac='']):not([data-ac='sem']),html.ipr-fx-arr #ipr-fx-arq{outline:1px dashed #5E6157;outline-offset:-3px}" +
    "html.ipr-fx-arr .ipr-fx-alvo{outline:2px solid #94BE39!important;background:rgba(148,190,57,.12)!important}" +
    "html.ipr-fx-marcar .maplibregl-canvas{cursor:crosshair!important}" +
    "@media (max-width:600px){.ipr-fx-h{min-height:40px;font-size:13.5px}}";
  (D.head || D.documentElement).appendChild(css);

  var F = null, PEDIDO = false, TIPOS = {}, ABERTAS = {}, ARQ = ls("ipr_fx_arq") === "1", CHAVE = "";
  function carregar(forca) {
    if (!equipa() || (PEDIDO && !forca)) return;
    PEDIDO = true;
    api("m904/fichas").then(function (j) { F = j.fichas || []; TIPOS = j.tipos || {}; CHAVE = ""; montar(); }).catch(function () { F = F || []; });
  }
  function aberta() { var b = D.querySelector('.ipr-ac button[data-ac][aria-expanded="true"]'); return b ? b.getAttribute("data-ac") : null; }
  function filtro() { var q = D.getElementById("ipr-px-q"); return q ? norm(q.value).trim() : ""; }
  function ordenar(l) { return l.slice().sort(function (a, b) { return String(b.data || "").localeCompare(String(a.data || "")); }); }

  function linha(f) {
    var l = el("div", "ipr-fx-l"); l.setAttribute("data-fx", f.id); if (ABERTAS[f.id]) l.classList.add("on");
    var h = el("div", "ipr-fx-h"); h.setAttribute("role", "button"); h.tabIndex = 0; h.title = f.nome + " · " + (f.origem || "Drive");
    if (equipa() && (W.innerWidth || 1000) >= 600) h.setAttribute("draggable", "true");
    h.appendChild(el("span", "s")); h.appendChild(el("span", "d" + (f.lat ? " m" : ""))); h.appendChild(el("span", "t", f.nome)); h.appendChild(el("span", "a", dataCurta(f.data)));
    l.appendChild(h);
    if (ABERTAS[f.id]) l.appendChild(cartao(f));
    return l;
  }
  function cartao(f) {
    var c = el("div", "ipr-fx-c");
    c.appendChild(el("div", "", "Ficha de propriedade · " + (TIPOS[f.tipo] || f.tipo)));
    c.appendChild(el("div", "", "Origem: " + (f.origem || "Drive") + (f.data ? " · última actividade " + dataCurta(f.data) : "")));
    if (f.nota) c.appendChild(el("div", "", f.nota));
    if (f.por && f.em) c.appendChild(el("div", "", "Mudada por " + f.por));
    var b = el("div", "b");
    if (f.drive) { var a = el("a", "", "Abrir a pasta no Drive"); a.href = "https://drive.google.com/drive/folders/" + encodeURIComponent(f.drive); a.target = "_blank"; a.rel = "noopener"; b.appendChild(a); }
    if (f.lat && f.lng) { var v = el("button", "", "Ver no mapa"); v.type = "button"; v.setAttribute("data-fx-a", "ver"); b.appendChild(v); }
    var m = el("button", "", f.lat ? "Mudar o local" : "Marcar no mapa"); m.type = "button"; m.setAttribute("data-fx-a", "marcar"); b.appendChild(m);
    c.appendChild(b);
    return c;
  }
  function lista(cab, l) {
    var box = el("div"); box.appendChild(el("div", "cab", cab + " · " + l.length));
    l.forEach(function (f) { box.appendChild(linha(f)); });
    return box;
  }
  function montar() {
    var pane = D.querySelector('#ipe .ipe-pane[data-pane="proj"]'), box = D.getElementById("ipe-proj");
    if (!equipa() || !F || !pane || !box) return;
    D.documentElement.classList.toggle("ipr-fx-eq", true);
    var k = aberta(), q = filtro(), fechado = pane.classList.contains("ipr-ac-fechado");
    var chave = [k, q, fechado ? 1 : 0, ARQ ? 1 : 0, F.length, JSON.stringify(ABERTAS), F.map(function (f) { return f.id + f.tipo + (f.lat || ""); }).join("")].join("#");
    var c = D.getElementById("ipr-fx"), arqB = D.getElementById("ipr-fx-arq"), arqL = D.getElementById("ipr-fx-arq-l");
    var acb = D.getElementById("ipr-ac-b");
    // contentor da pasta aberta, no fim dos cartões
    if (!c) { c = el("div"); c.id = "ipr-fx"; c.addEventListener("click", clique); }
    if (c.parentNode !== box) box.appendChild(c); // dentro da lista de cartões, no fim (o bases-acordeao.js põe as pastas seguintes logo a seguir)
    // pasta «Arquivo», no fim de tudo
    if (!arqB) {
      arqB = el("button"); arqB.id = "ipr-fx-arq"; arqB.type = "button";
      arqB.appendChild(el("span", "seta")); arqB.appendChild(el("span", "nome", "Arquivo")); arqB.appendChild(el("span", "n", ""));
      arqB.addEventListener("click", function () { ARQ = !ARQ; ls("ipr_fx_arq", ARQ ? "1" : ""); CHAVE = ""; montar(); });
    }
    if (!arqL) { arqL = el("div"); arqL.id = "ipr-fx-arq-l"; arqL.addEventListener("click", clique); }
    var depois = acb && acb.parentNode === pane ? acb : box;
    if (arqB.parentNode !== pane || arqB.previousElementSibling !== depois) pane.insertBefore(arqB, depois.nextSibling);
    if (arqL.parentNode !== pane || arqL.previousElementSibling !== arqB) pane.insertBefore(arqL, arqB.nextSibling);
    if (chave === CHAVE) return; CHAVE = chave;
    var vis = F.filter(function (f) { return !q || norm(f.nome).indexOf(q) >= 0 || norm(f.nota).indexOf(q) >= 0; });
    var arq = vis.filter(function (f) { return f.tipo === "arquivo"; });
    arqB.querySelector(".n").textContent = arq.length; arqB.setAttribute("aria-expanded", ARQ ? "true" : "false");
    arqL.textContent = ""; arqL.style.display = ARQ ? "" : "none";
    if (ARQ) arqL.appendChild(lista("Do Drive, arquivo", ordenar(arq)));
    c.textContent = "";
    if (fechado || k === null) { c.style.display = "none"; return; }
    var act = vis.filter(function (f) { return f.tipo !== "arquivo" && (k === "" || f.tipo === k); });
    c.style.display = act.length ? "" : "none";
    if (act.length) c.appendChild(lista("Do Drive, sem Base", ordenar(act)));
  }

  // ---------- clique: abrir a ficha, ver e marcar no mapa ----------
  var MARCAR = null;
  function porId(id) { for (var i = 0; F && i < F.length; i++) if (F[i].id === id) return F[i]; return null; }
  function clique(e) {
    var l = e.target.closest(".ipr-fx-l"); if (!l) return;
    var f = porId(l.getAttribute("data-fx")); if (!f) return;
    var a = e.target.closest("[data-fx-a]");
    e.stopPropagation();
    if (a) {
      var mapa = W.__ipe && W.__ipe.mapa;
      if (a.getAttribute("data-fx-a") === "ver" && mapa && f.lng) { try { mapa.flyTo({ center: [f.lng, f.lat], zoom: Math.max(mapa.getZoom(), 13) }); } catch (x) {} return; }
      if (a.getAttribute("data-fx-a") === "marcar" && mapa) {
        MARCAR = f; D.documentElement.classList.add("ipr-fx-marcar"); a.textContent = "Clique no mapa no sítio do terreno…";
        mapa.once("click", function (ev) {
          D.documentElement.classList.remove("ipr-fx-marcar"); var g = MARCAR; MARCAR = null; if (!g) return;
          api("m904/ficha", { id: g.id, lat: ev.lngLat.lat, lng: ev.lngLat.lng }).then(function (j) { Object.assign(g, j.ficha); CHAVE = ""; montar(); }).catch(function (x) { a.textContent = "Não foi possível gravar: " + x.message; });
        });
      }
      return;
    }
    if (e.target.closest(".ipr-fx-h")) { if (ABERTAS[f.id]) delete ABERTAS[f.id]; else ABERTAS[f.id] = 1; CHAVE = ""; montar(); }
  }

  // ---------- arrastar fichas para outra pasta ----------
  var ARR = null, PASTAS = { pedido: 1, dia_aberto: 1, reuniao: 1, projecto: 1, entregue: 1, impl: 1 };
  D.addEventListener("dragstart", function (e) {
    var h = e.target && e.target.closest && e.target.closest(".ipr-fx-h"); if (!h || !equipa()) return;
    var l = h.closest(".ipr-fx-l"); ARR = { l: l, f: porId(l.getAttribute("data-fx")) }; if (!ARR.f) { ARR = null; return; }
    try { e.dataTransfer.setData("text/plain", "ipr-ficha:" + ARR.f.id); e.dataTransfer.effectAllowed = "move"; } catch (x) {}
    l.classList.add("arr"); D.documentElement.classList.add("ipr-fx-arr");
  }, true);
  D.addEventListener("dragend", function () {
    if (ARR && ARR.l) ARR.l.classList.remove("arr"); ARR = null; D.documentElement.classList.remove("ipr-fx-arr");
    [].forEach.call(D.querySelectorAll(".ipr-fx-alvo"), function (b) { b.classList.remove("ipr-fx-alvo"); });
  }, true);
  function alvo(e) {
    var b = e.target && e.target.closest && (e.target.closest("#ipr-fx-arq") || e.target.closest(".ipr-ac button[data-ac]"));
    if (!b) return null; if (b.id === "ipr-fx-arq") return [b, "arquivo", "Arquivo"];
    var k = b.getAttribute("data-ac"); if (!PASTAS[k]) return null;
    var n = b.querySelector(".nome"); return [b, k, n ? n.textContent.trim() : k];
  }
  D.addEventListener("dragover", function (e) {
    if (!ARR) return; var a = alvo(e);
    [].forEach.call(D.querySelectorAll(".ipr-fx-alvo"), function (x) { if (!a || x !== a[0]) x.classList.remove("ipr-fx-alvo"); });
    if (!a) return; e.preventDefault(); try { e.dataTransfer.dropEffect = "move"; } catch (x) {} a[0].classList.add("ipr-fx-alvo");
  }, true);
  D.addEventListener("drop", function (e) {
    if (!ARR) return; var a = alvo(e); if (!a) return;
    e.preventDefault(); e.stopPropagation();
    var f = ARR.f, ant = f.tipo; if (ant === a[1]) return;
    f.tipo = a[1]; CHAVE = ""; montar();
    api("m904/ficha", { id: f.id, tipo: a[1] }).then(function (j) { Object.assign(f, j.ficha); CHAVE = ""; montar(); aviso("«" + f.nome + "» passou para " + a[2] + "."); })
      .catch(function (x) { f.tipo = ant; CHAVE = ""; montar(); aviso("Não foi possível mover: " + x.message, true); });
  }, true);
  function aviso(t, mau) {
    var m = D.getElementById("ipr-fn-msg") || (function () { var x = el("div"); x.id = "ipr-fn-msg"; x.setAttribute("role", "status"); x.style.cssText = "position:fixed;z-index:100002;left:50%;bottom:24px;transform:translateX(-50%);padding:8px 14px;border-radius:2px;background:#232420;border:1px solid #383A33;color:#F5F4EE;font:500 13px/1.3 Inter,system-ui,sans-serif"; D.body.appendChild(x); return x; })();
    m.textContent = t; m.style.borderLeft = "3px solid " + (mau ? "#E0705A" : "#94BE39"); clearTimeout(aviso.t); aviso.t = setTimeout(function () { m.remove(); }, 3500);
  }

  var t = 0;
  function vigia() { if (t) return; t = setTimeout(function () { t = 0; try { if (!F) carregar(); else montar(); } catch (e) {} }, 150); }
  new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) { var x = ms[i].target; if (x && x.closest && (x.closest("#ipr-fx") || x.closest("#ipr-fx-arq-l"))) continue; vigia(); return; }
  }).observe(D.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-expanded", "class"] });
  D.addEventListener("input", function (e) { if (e.target && e.target.id === "ipr-px-q") { CHAVE = ""; vigia(); } }, true);
  vigia();
})();
