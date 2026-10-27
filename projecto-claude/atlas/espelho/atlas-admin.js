/* IPR Atlas · (1) Locais dentro de Camadas e (2) separador «Rever» para a equipa (20/10/2026).
   Decisões do Nuno, 20/10 às 12h50: Locais e Camadas num só painel; as Bases para rever num separador
   próprio que abre sozinho quando há alguma, e também em destaque no topo de Projectos; em cada Base uma
   lista de verificação (as caixas), e selecção múltipla para entregar em lote.
   Não altera o app.js: reorganiza o DOM que ele produz e reutiliza as rotas que ele já usa
   (GET /tcd/v1/meus-mapas devolve `rever`; POST /tcd/v1/revisao/entregar entrega uma Base). */
(function () {
  "use strict";
  var NONCE = window.tcdNonce || "";
  var REST = "/wp-json/tcd/v1/";
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function $(id) { return document.getElementById(id); }

  var CSS =
    /* Locais como grupo das Camadas */
    "#ipe-cam .ipc-loc{border-bottom:1px solid var(--ln)}" +
    "#ipe-cam .ipc-loc>.ipr-gc{padding-right:10px}" +
    "#ipe-cam .ipc-loc .ipe-sbc{display:block;padding:0 0 6px}" +
    "#ipe-cam .ipc-loc.fechado .ipe-sbc{display:none}" +
    ".ipe-sb[data-sb=locais].ipc-movido{display:none}" +
    /* Rever */
    ".ipc-rv-top{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:2px 0 10px}" +
    ".ipc-rv-n{font:600 12px var(--mono);letter-spacing:.06em;color:var(--ac2)}" +
    ".ipc-rv{border:1px solid var(--ln2);background:var(--p2);border-radius:6px;margin:0 0 8px;padding:10px 12px}" +
    ".ipc-rv.pronta{border-color:var(--ac)}" +
    ".ipc-rv-cab{display:flex;align-items:flex-start;gap:10px}" +
    ".ipc-rv-cab>label{display:flex;align-items:center;padding-top:2px}" +
    ".ipc-rv-cab>label input{width:18px;height:18px;accent-color:var(--ac)}" +
    ".ipc-rv-t{flex:1;min-width:0}" +
    ".ipc-rv-t b{display:block;font-size:14px;color:var(--tx)}" +
    ".ipc-rv-t span{display:block;font:11.5px var(--mono);color:var(--mu)}" +
    ".ipc-rv-chk{list-style:none;margin:8px 0 0;padding:0}" +
    ".ipc-rv-chk li{display:flex;align-items:center;gap:8px;padding:5px 0;border-top:1px solid var(--ln);font-size:13px;color:var(--tx)}" +
    ".ipc-rv-chk input{accent-color:var(--ac)}" +
    ".ipc-rv-chk li.ok{color:var(--mu);text-decoration:line-through}" +
    ".ipc-rv-acc{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;align-items:center}" +
    ".ipc-rv-acc .ipe-small{margin-left:auto}" +
    ".ipc-rv-lote{position:sticky;bottom:0;background:var(--p1);border-top:1px solid var(--ln);padding:10px 0 4px;margin-top:8px;display:flex;gap:8px;align-items:center}" +
    ".ipc-rv-aviso{border:1px solid var(--ac);background:var(--acs);border-radius:6px;padding:10px 12px;margin:0 0 12px;display:flex;justify-content:space-between;align-items:center;gap:8px}" +
    ".ipc-rv-aviso b{color:var(--ac2);font-size:13px}";

  function css() {
    if ($("ipc-admin-css")) return;
    var st = document.createElement("style"); st.id = "ipc-admin-css"; st.textContent = CSS; document.head.appendChild(st);
  }

  /* ---------- 1. Locais dentro de Camadas ---------- */
  function juntarLocais() {
    var loc = document.querySelector('.ipe-sb[data-sb="locais"]');
    var cam = $("ipe-cam");
    if (!loc || !cam || loc.classList.contains("ipc-movido")) return !!(loc && cam);
    var arv = cam.querySelector(".ipr-arv") || cam;
    if ($("ipc-loc")) return true;
    var g = document.createElement("div");
    g.className = "ipr-g ab ipc-loc"; g.id = "ipc-loc";
    g.innerHTML = '<div class="ipr-gc"><button type="button" class="ipr-gt" aria-expanded="true"><span class="ipr-car" aria-hidden="true"></span><span class="ipr-gn">Os meus locais e terrenos</span><span class="ipr-n on" id="ipc-loc-n"></span></button></div>';
    var corpo = loc.querySelector(".ipe-sbc");
    corpo.style.display = "block";
    g.appendChild(corpo);
    var cab = arv.querySelector(".ipr-arv-cab");
    if (cab && cab.nextSibling) arv.insertBefore(g, cab.nextSibling); else arv.insertBefore(g, arv.firstChild);
    loc.classList.add("ipc-movido");
    g.querySelector(".ipr-gt").addEventListener("click", function () {
      var f = g.classList.toggle("fechado");
      g.classList.toggle("ab", !f);
      this.setAttribute("aria-expanded", String(!f));
    });
    var n = $("ipe-loc-n");
    var sync = function () { var k = $("ipc-loc-n"); if (k && n) k.textContent = (n.textContent || "").trim(); };
    sync();
    if (n) new MutationObserver(sync).observe(n, { childList: true, characterData: true, subtree: true });
    // se o app.js redesenhar a árvore das camadas, volta a inserir
    new MutationObserver(function () { if (!$("ipc-loc") && !document.querySelector(".ipc-loc")) { loc.classList.remove("ipc-movido"); loc.querySelector(".ipe-sbc") || loc.appendChild(corpo); juntarLocais(); } })
      .observe(cam, { childList: true });
    return true;
  }

  /* ---------- 2. Rever ---------- */
  var ITENS = [
    ["limite", "Limite do terreno fecha e coincide com o cadastro"],
    ["relevo", "Relevo sombreado e curvas de nível sem buracos"],
    ["hidro", "Linhas de água e bacias fazem sentido no terreno"],
    ["camadas", "Todas as camadas da Base abrem no mapa"],
    ["ficheiros", "Ficheiros completos: QField, GeoPackage, GeoTIFF, PDF"],
    ["relatorio", "Relatório lido e sem erros de nome ou área"]
  ];
  var CHAVE = "ipc_rv_v1";
  var marcas = {};
  try { marcas = JSON.parse(localStorage.getItem(CHAVE) || "{}") || {}; } catch (e) { marcas = {}; }
  function guardar() { try { localStorage.setItem(CHAVE, JSON.stringify(marcas)); } catch (e) {} }

  function lista() {
    return fetch(REST + "meus-mapas", { credentials: "same-origin", headers: { "X-WP-Nonce": NONCE } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { return (d && d.rever) || []; });
  }

  function cartao(e) {
    var m = marcas[e.id] || {};
    var feitos = ITENS.filter(function (it) { return m[it[0]]; }).length;
    var pronta = feitos === ITENS.length;
    return '<div class="ipc-rv' + (pronta ? " pronta" : "") + '" data-rv="' + esc(e.id) + '">' +
      '<div class="ipc-rv-cab"><label title="Marcar para entregar em lote"><input type="checkbox" data-rv-sel' + (pronta ? "" : " disabled") + '></label>' +
      '<div class="ipc-rv-t"><b>' + esc(e.local || "Terreno sem nome") + "</b><span>#" + esc(e.encomenda || e.id) + (e.area_ha ? " · " + esc(String(e.area_ha).replace(".", ",")) + " ha" : "") + (e.data ? " · " + esc(e.data) : "") + "</span>" +
      '<span>' + feitos + " de " + ITENS.length + " verificados</span></div></div>" +
      '<ul class="ipc-rv-chk">' + ITENS.map(function (it) {
        return '<li class="' + (m[it[0]] ? "ok" : "") + '"><input type="checkbox" id="rv-' + esc(e.id) + "-" + it[0] + '" data-rv-it="' + it[0] + '"' + (m[it[0]] ? " checked" : "") + '><label for="rv-' + esc(e.id) + "-" + it[0] + '">' + esc(it[1]) + "</label></li>";
      }).join("") + "</ul>" +
      '<div class="ipc-rv-acc"><a class="ipe-b ipe-b--s" href="/atlas/?mapa=' + esc(e.id) + '">Abrir no mapa</a>' +
      '<button type="button" class="ipe-b ipe-b--s ipe-b--ac" data-rv-entregar' + (pronta ? "" : " disabled") + '>Entregar ao cliente</button>' +
      '<small class="ipe-small" data-rv-msg></small></div></div>';
  }

  function desenhar(p, itens) {
    if (!itens.length) {
      p.innerHTML = '<div class="ipc-rv-top"><span class="ipe-lbl" style="margin:0">Bases para rever</span></div><div class="ipe-vazio">Nenhuma Base à espera de revisão.</div>';
      return;
    }
    p.innerHTML = '<div class="ipc-rv-top"><span class="ipe-lbl" style="margin:0">Bases para rever</span><span class="ipc-rv-n">' + itens.length + "</span></div>" +
      itens.map(cartao).join("") +
      '<div class="ipc-rv-lote"><button type="button" class="ipe-b ipe-b--ac" data-rv-lote disabled>Entregar as marcadas</button><small class="ipe-small" data-rv-lote-msg>Só se pode entregar uma Base com os 6 pontos verificados.</small></div>';
  }

  function entregar(id) {
    return fetch(REST + "revisao/entregar", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-WP-Nonce": NONCE }, body: JSON.stringify({ enc: +id }) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j && j.message || "Não foi possível entregar."); return j; }); });
  }

  function ligar(p, tab) {
    p.addEventListener("change", function (ev) {
      var it = ev.target.closest("[data-rv-it]");
      if (it) {
        var box = it.closest(".ipc-rv"), id = box.dataset.rv;
        marcas[id] = marcas[id] || {};
        marcas[id][it.dataset.rvIt] = it.checked;
        guardar();
        it.closest("li").classList.toggle("ok", it.checked);
        var feitos = Object.keys(marcas[id]).filter(function (k) { return marcas[id][k]; }).length;
        var pronta = feitos === ITENS.length;
        box.classList.toggle("pronta", pronta);
        box.querySelector(".ipc-rv-t span:last-child").textContent = feitos + " de " + ITENS.length + " verificados";
        box.querySelector("[data-rv-entregar]").disabled = !pronta;
        var sel = box.querySelector("[data-rv-sel]"); sel.disabled = !pronta; if (!pronta) sel.checked = false;
      }
      if (ev.target.matches("[data-rv-sel]")) {
        var n = p.querySelectorAll("[data-rv-sel]:checked").length;
        var b = p.querySelector("[data-rv-lote]"); if (b) { b.disabled = !n; b.textContent = n ? "Entregar as " + n + " marcadas" : "Entregar as marcadas"; }
      }
    });
    p.addEventListener("click", function (ev) {
      var b1 = ev.target.closest("[data-rv-entregar]");
      if (b1) {
        var box = b1.closest(".ipc-rv"), msg = box.querySelector("[data-rv-msg]");
        if (!confirm("Entregar esta Base ao cliente? Os ficheiros ficam visíveis na área de cliente e a encomenda passa a Concluída.")) return;
        b1.disabled = true; msg.textContent = "A entregar…";
        entregar(box.dataset.rv).then(function () { msg.textContent = "Entregue."; delete marcas[box.dataset.rv]; guardar(); setTimeout(function () { carregar(p, tab); }, 800); })
          .catch(function (e) { b1.disabled = false; msg.className = "ipe-small mau"; msg.textContent = e.message; });
        return;
      }
      var b2 = ev.target.closest("[data-rv-lote]");
      if (b2) {
        var ids = Array.prototype.map.call(p.querySelectorAll("[data-rv-sel]:checked"), function (c) { return c.closest(".ipc-rv").dataset.rv; });
        if (!ids.length) return;
        if (!confirm("Entregar " + ids.length + " Base(s) ao cliente? Cada uma passa a Concluída e o cliente recebe e-mail.")) return;
        b2.disabled = true;
        var m = p.querySelector("[data-rv-lote-msg]"), ok = 0, falhas = [];
        (function passo(i) {
          if (i >= ids.length) { m.textContent = ok + " entregue(s)" + (falhas.length ? "; falhou: " + falhas.join(", ") : "."); setTimeout(function () { carregar(p, tab); }, 900); return; }
          m.textContent = "A entregar " + (i + 1) + " de " + ids.length + "…";
          entregar(ids[i]).then(function () { ok++; delete marcas[ids[i]]; guardar(); }).catch(function () { falhas.push("#" + ids[i]); }).then(function () { passo(i + 1); });
        })(0);
      }
    });
  }

  function aviso(n) {
    var proj = document.querySelector('.ipe-pane[data-pane="proj"]');
    if (!proj) return;
    var a = $("ipc-rv-aviso");
    if (!n) { if (a) a.remove(); return; }
    if (!a) {
      a = document.createElement("div"); a.id = "ipc-rv-aviso"; a.className = "ipc-rv-aviso";
      proj.insertBefore(a, proj.firstChild);
      new MutationObserver(function () { if (a.parentNode !== proj || proj.firstChild !== a) { try { proj.insertBefore(a, proj.firstChild); } catch (e) {} } }).observe(proj, { childList: true });
    }
    a.innerHTML = "<b>" + n + (n === 1 ? " Base Cartográfica para rever" : " Bases Cartográficas para rever") + '</b><button type="button" class="ipe-b ipe-b--s ipe-b--ac" data-ir-rever>Rever agora</button>';
    a.querySelector("[data-ir-rever]").addEventListener("click", function () { var t = document.querySelector('.ipe-tab[data-tab="rever"]'); if (t) t.click(); });
  }

  function carregar(p, tab) {
    lista().then(function (itens) {
      desenhar(p, itens);
      tab.textContent = itens.length ? "Rever (" + itens.length + ")" : "Rever";
      aviso(itens.length);
    }).catch(function () { p.innerHTML = '<div class="ipe-vazio">Não foi possível ler a lista de revisão.</div>'; });
  }

  function montarRever() {
    var tabs = $("ipe-tabs");
    var proj = document.querySelector('.ipe-pane[data-pane="proj"]');
    if (!tabs || !proj) return false;                 // sem o separador Projectos não é equipa com área
    if (tabs.querySelector('.ipe-tab[data-tab="rever"]')) return true;
    var b = document.createElement("button");
    b.type = "button"; b.className = "ipe-tab"; b.setAttribute("role", "tab"); b.dataset.tab = "rever"; b.setAttribute("aria-selected", "false"); b.textContent = "Rever";
    tabs.insertBefore(b, tabs.firstChild);
    var p = document.querySelector('.ipe-pane[data-pane="rever"]');
    if (!p) {
      p = document.createElement("div"); p.className = "ipe-pane"; p.dataset.pane = "rever"; p.hidden = true;
      proj.parentNode.insertBefore(p, proj);
      ligar(p, b);
    }
    // só mostra o separador a quem tem Bases para rever; abre-o sozinho na primeira vez
    b.hidden = true;
    lista().then(function (itens) {
      if (!itens.length) { aviso(0); return; }
      b.hidden = false;
      desenhar(p, itens);
      b.textContent = "Rever (" + itens.length + ")";
      aviso(itens.length);
      if (!sessionStorage.getItem("ipc_rv_aberto")) { sessionStorage.setItem("ipc_rv_aberto", "1"); setTimeout(function () { b.click(); }, 400); }
    }).catch(function () {});
    return true;
  }

  var n = 0;
  (function tentar() {
    css();
    var a = juntarLocais(), r = NONCE ? montarRever() : true;
    if (a && r) {
      var tabs = $("ipe-tabs");
      if (tabs) new MutationObserver(function () { montarRever(); }).observe(tabs, { childList: true });
    } else if (n++ < 120) setTimeout(tentar, 250);
  })();
})();
