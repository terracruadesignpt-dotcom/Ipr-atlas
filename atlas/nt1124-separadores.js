/* IPR Atlas · Separadores do painel da direita (24/11/2026). Terracrua Design.
   Decisão do Nuno (15h40): «Começar · O meu Atlas · Organização», e para a equipa um separador «Gestão».
   - Começar (pane enc): Encomendar (Ficha gratuita, Planta, Leitura, Base) · Encontrar a minha terra · Simuladores · formulário da Base.
   - O meu Atlas (pane proj): as minhas coisas (simulações, locais, Oficina, as minhas encomendas) e os projectos.
   - Organização (pane org): como estava.
   - Gestão (pane rever, só equipa): Bases para rever, fila de produção com Repor/Reprocessar/Tirar, organizações (wp-admin).
   - Comunidade e Locais deixam de ter separador (nada é apagado; Locais abre-se a partir de O meu Atlas).
   - Encomendas «Paradas» (tiradas da fila) ficam escondidas, com «Mostrar as paradas (N)».
   Mexe só em rótulos, ordem e sítio de elementos que já existem. Desligar: ?separadores=0. */
(function () {
  "use strict";
  var W = window, D = document;
  if (/[?&]separadores=0(&|$)/.test(location.search) || W.__iprSep) return; W.__iprSep = 1;
  function en() { return /^en/i.test(D.documentElement.lang || "") || W.IPR_LINGUA === "en"; }
  function t(pt, e) { return en() ? e : pt; }
  function $(id) { return D.getElementById(id); }
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]; }); }
  function tab(k) { return D.querySelector('#ipe-tabs [data-tab="' + k + '"]'); }
  function pane(k) { return D.querySelector('#ipe-corpo>[data-pane="' + k + '"]'); }
  var mostrarParadas = false;

  var CSS =
    "#ipe-tabs [data-tab=com],#ipe-tabs [data-tab=loc]{display:none!important}" +
    "#ipe-tabs.ipr-sep-eq [data-tab=rever]{display:inline-flex!important}" +
    "#ipe-tabs [data-tab=enc]{order:1!important}#ipe-tabs [data-tab=proj]{order:2!important}#ipe-tabs [data-tab=org]{order:3!important}#ipe-tabs [data-tab=rever]{order:4!important}" +
    "#ipe-tabs .ipe-tab[data-tab=proj]{font-size:12px!important}#ipe-tabs .ipe-tab[data-tab=proj]::after{content:none!important}" +
    "#ipe-tabs .ipe-tab .ipr-sep-r{font-size:12px!important}" +
    ".ipr-sep-b{margin:0 0 12px;padding:10px 12px;border:1px solid rgba(148,190,57,.3);border-radius:10px;background:rgba(20,26,16,.5);font:13px/1.45 Inter,system-ui,sans-serif;color:#e9e6da}" +
    ".ipr-sep-b h5{margin:0 0 8px;font:600 11px 'IBM Plex Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:#cfe3a0}" +
    ".ipr-sep-b .g{display:grid;grid-template-columns:1fr 1fr;gap:6px}.ipr-sep-b .g1{grid-template-columns:1fr}" +
    ".ipr-sep-b button,.ipr-sep-b a.bt{display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);color:#e9e6da;font:600 13px Inter,system-ui,sans-serif;cursor:pointer;text-decoration:none}" +
    ".ipr-sep-b button:hover,.ipr-sep-b a.bt:hover{border-color:#94BE39;background:rgba(148,190,57,.12)}" +
    ".ipr-sep-b button small,.ipr-sep-b a.bt small{font-weight:400;font-size:11px;color:#9a9e8a}" +
    ".ipr-sep-ex-l{margin:0 0 6px;font:12px Inter,system-ui,sans-serif;color:#9a9e8a}.ipr-sep-ex-t{display:inline-block;margin-top:6px;font:600 12px Inter,system-ui,sans-serif;color:#94BE39;text-decoration:none}.ipr-sep-ex-t:hover{text-decoration:underline}" +
    ".ipr-sep-b .pri{border-color:#94BE39;background:rgba(148,190,57,.16)}" +
    "[data-pane=enc]:not(.ipr-sep-base)>.ipr-fd-leg,[data-pane=enc]:not(.ipr-sep-base)>#ipr-proc-sel,[data-pane=enc]:not(.ipr-sep-base)>#ipe-form,[data-pane=enc]:not(.ipr-sep-base)>#ipr-conv,[data-pane=enc]>.ipr-fd-leg{display:none!important}" +
    "#tb-bar .tb-m{display:none!important}#ipr-sep-vistas{margin-top:10px}#ipr-sep-vistas .vb{display:flex;flex-wrap:wrap;gap:6px}" +
    "#ipr-sep-vistas .vb button{display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:28px;padding:0 10px;border-radius:7px;font:600 12px Inter,system-ui,sans-serif}" +
    "#ipr-sep-vistas .vb button[aria-pressed=true]{border-color:#94BE39;background:rgba(148,190,57,.18)}" +
    /* O meu Atlas: lista das Bases compacta, uma linha baixa por Base */
    "[data-pane=proj] article.ipr-pc>.ipe-cc{min-height:0!important}" +
    "[data-pane=proj] article.ipr-pc .ipr-fn-h{padding:1px 30px 1px 4px!important;min-height:0!important;font-size:12px!important;line-height:1.3!important;gap:6px}" +
    "[data-pane=proj] article.ipr-pc .ipr-fn-h .t{font-weight:500!important;font-size:12px!important}" +
    "[data-pane=proj] article.ipr-pc .ipr-fn-h .a{font-size:10.5px!important;opacity:.75}" +
    "[data-pane=proj] article.ipr-pc .ipr-bt-b{height:20px!important;line-height:20px!important;top:1px!important}" +
    "[data-pane=proj] article.ipr-pc:not(.on){border-bottom:1px solid rgba(255,255,255,.05)!important;margin:0!important}" +
    "[data-pane=enc] .tcd-fila,[data-pane=enc]>.ipr-x-s,[data-pane=enc]>[data-k=ptsk]{display:none!important}" +
    ".tcd-fila .f-i.ipr-sep-par{display:none}.tcd-fila.ipr-sep-mp .f-i.ipr-sep-par{display:block}" +
    ".tcd-fila .ipr-sep-mpb{background:none;border:0;color:#94BE39;text-decoration:underline;cursor:pointer;font:12px Inter,system-ui,sans-serif;padding:4px 0}";

  function equipa() {
    // equipa = vê os botões de gestão da fila, ou o separador Rever já existe com conteúdo
    // sinal estável: o separador «Rever» existe para quem revê (m90346); ou botões de gestão na fila; ou o bloco de equipa
    if (W.__iprSepEq) return true;
    var e = !!D.querySelector('.tcd-fila button[data-f="reprocessar"]') || W.IPR_EQUIPA === 1 || W.IPR_EQUIPA === true;
    if (e) W.__iprSepEq = 1;
    return e;
  }
  function rotulo(k, txt) {
    var b = tab(k); if (!b) return;
    var s = b.querySelector(".ipr-sep-r");
    if (s && s.textContent === txt) return;
    // o separador pode ter contador (ex.: Locais 5); troca só o texto principal
    var cont = b.querySelector("span,b,small,i");
    if (!s) { b.textContent = ""; s = D.createElement("span"); s.className = "ipr-sep-r"; b.appendChild(s); if (cont) b.appendChild(cont); }
    s.textContent = txt;
  }
  function clicar(el) { if (el) { try { el.click(); } catch (e) {} } }

  function blocoComecar() {
    var p = pane("enc"); if (!p) return;
    var b = $("ipr-sep-enc");
    if (!b) {
      b = D.createElement("div"); b.id = "ipr-sep-enc";
      b.innerHTML =
        '<div class="ipr-sep-b"><h5>' + t("Encomendar", "Order") + '</h5><div class="g">' +
        '<button type="button" data-sep-p="ficha" class="pri">' + t("Ficha gratuita", "Free sheet") + "<small>" + t("O que há no seu terreno", "What is on your plot") + "</small></button>" +
        '<button type="button" data-sep-p="planta">' + t("Planta de Localização", "Location plan") + "<small>" + t("Para a Câmara ou escritura", "For the council or deed") + "</small></button>" +
        '<button type="button" data-sep-p="leitura">' + t("Leitura Territorial", "Land report") + "<small>" + t("O que permite e os riscos", "What it allows and the risks") + "</small></button>" +
        '<button type="button" data-sep-p="base">' + t("Base Cartográfica", "Base map") + "<small>" + t("Relevo e água do LiDAR", "LiDAR relief and water") + "</small></button>" +
        "</div></div>" +
        '<div class="ipr-sep-b"><h5>' + t("Simuladores", "Simulators") + '</h5><div class="g">' +
        '<button type="button" data-sep-s="0">' + t("Simular água", "Simulate water") + "<small>" + t("Escorrência e cheias", "Runoff and floods") + "</small></button>" +
        '<button type="button" data-sep-s="1">' + t("Simular fogo", "Simulate fire") + "<small>" + t("Propagação e risco", "Spread and risk") + "</small></button>" +
        "</div></div>" +
        '<div class="ipr-sep-b"><h5>' + t("O seu terreno", "Your land") + '</h5><div class="g g1">' +
        '<button type="button" data-sep-a="terra">' + t("Encontrar a minha terra", "Find my land") + "<small>" + t("Pela morada, pelo artigo ou desenhando no mapa", "By address, parcel or drawing on the map") + "</small></button>" +
        "</div></div>" +
        // exemplos reais (Nuno, 24/11): terreno à venda pela Azenhas e Castelos, documentos tal como se entregam (m91556, m93931)
        '<div class="ipr-sep-b" id="ipr-sep-ex"><h5>' + t("Ver exemplos", "See examples") + '</h5>' +
        '<p class="ipr-sep-ex-l">' + t("São Teotónio, Odemira · 56 ha · terreno real à venda pela Azenhas e Castelos", "São Teotónio, Odemira · 56 ha · real plot for sale through Azenhas e Castelos") + '</p><div class="g">' +
        '<a class="bt" href="/atlas/?ficha=LTguNjg4OTMsMzcuNDg0OTkgLTguNjg4ODYsMzcuNDgwNjggLTguNjg4MjMsMzcuNDc4MzMgLTguNjg4MjIsMzcuNDc2MjcgLTguNjg4NDEsMzcuNDczOTIgLTguNjg4NTEsMzcuNDcwOTYgLTguNjg4NjYsMzcuNDY4NDIgLTguNjg4NjQsMzcuNDY4MTkgLTguNjg2NzUsMzcuNDY2MTkgLTguNjg2NjQsMzcuNDY4MDIgLTguNjg1NzgsMzcuNDY5ODMgLTguNjg0ODEsMzcuNDcxMTkgLTguNjgzMTQsMzcuNDcyMTQgLTguNjg0MTUsMzcuNDcyODggLTguNjgzNzgsMzcuNDczMzQgLTguNjg1MTcsMzcuNDczNDAgLTguNjg1MzIsMzcuNDczNjYgLTguNjg1NDYsMzcuNDc0MTcgLTguNjg1NDksMzcuNDc0NjggLTguNjg1MzYsMzcuNDc1MzcgLTguNjg1MDAsMzcuNDc4MzkgLTguNjg0NDEsMzcuNDgyMjQgLTguNjg4OTMsMzcuNDg0OTk">' + t("Ficha gratuita", "Free sheet") + "<small>" + t("Abre no mapa", "Opens on the map") + "</small></a>" +
        '<a class="bt" href="/wp-content/uploads/tcd-demos/sao-teotonio/IPR-19221-YKUKAY_Planta_Localizacao.pdf" target="_blank" rel="noopener">' + t("Planta de Localização", "Location plan") + "<small>PDF</small></a>" +
        '<a class="bt" href="/wp-content/uploads/tcd-demos/sao-teotonio/IPR-19221-YKUKAY_Leitura_Territorial.pdf" target="_blank" rel="noopener">' + t("Leitura Territorial", "Land report") + "<small>PDF</small></a>" +
        '<a class="bt" href="/wp-content/uploads/tcd-demos/sao-teotonio/IPR-19221-YKUKAY_Relatorio_Base.pdf" target="_blank" rel="noopener">' + t("Base Cartográfica", "Base map") + "<small>" + t("Relatório PDF", "PDF report") + "</small></a>" +
        '</div><a class="ipr-sep-ex-t" href="/exemplos/">' + t("Os três terrenos de exemplo", "All three example plots") + " →</a></div>";
      b.addEventListener("click", function (e) {
        var x = e.target.closest("button"); if (!x) return;
        var pr = x.getAttribute("data-sep-p");
        if (pr === "base") { var pe = pane("enc"); if (pe) { pe.classList.add("ipr-sep-base"); var fm = pe.querySelector("#ipe-form, #ipr-proc-sel"); if (fm) fm.scrollIntoView({ behavior: "smooth", block: "start" }); } return; }
        if (pr) { var o = D.querySelector('#ipr-be-topo [data-be-prod="' + pr + '"]'); if (o) clicar(o); return; }
        if (x.getAttribute("data-sep-a") === "terra") clicar($("ipr-pz-top"));
        var si = x.getAttribute("data-sep-s");
        if (si !== null) { var sb = D.querySelectorAll('[data-pane="enc"] .ipr-x-s button, [data-pane="enc"] [data-k="ptsk"] button'); var alvo = [].filter.call(sb, function (y) { return /água|water/i.test(y.textContent) === (si === "0") && /fogo|fire|água|water/i.test(y.textContent); })[0]; if (alvo) clicar(alvo); }
      });
    }
    // não se reordena nada (outro módulo põe os simuladores no topo e a troca fazia piscar):
    // o bloco entra uma vez e os simuladores originais ficam escondidos; os botões acima carregam neles.
    if (b.parentNode !== p) p.insertBefore(b, p.firstChild);
  }

  function blocoMeu() {
    var p = pane("proj"); if (!p) return;
    var b = $("ipr-sep-meu");
    if (!b) {
      b = D.createElement("div"); b.id = "ipr-sep-meu"; b.className = "ipr-sep-b";
      b.innerHTML = "<h5>" + t("O meu Atlas", "My Atlas") + '</h5><div class="g">' +
        '<button type="button" data-sep-a="sim">' + t("As minhas simulações", "My simulations") + "<small>" + t("Água e fogo", "Water and fire") + "</small></button>" +
        '<button type="button" data-sep-a="loc">' + t("Os meus locais", "My places") + '<small data-sep-n="loc"></small></button>' +
        '<a class="bt" href="/oficina/">' + t("Oficina", "Workshop") + "<small>" + t("Ficheiros e entregas", "Files and deliveries") + "</small></a>" +
        '<button type="button" data-sep-a="enc">' + t("As minhas encomendas", "My orders") + "<small>" + t("Estado e descargas", "Status and downloads") + "</small></button>" +
        "</div>";
      b.addEventListener("click", function (e) {
        var x = e.target.closest("button"); if (!x) return;
        var a = x.getAttribute("data-sep-a");
        if (a === "sim") clicar($("ipr-simh-top"));
        else if (a === "loc") clicar(tab("loc"));
        else if (a === "enc") { var f = D.querySelector('[data-pane="proj"] .tcd-fila, [data-pane="rever"] .tcd-fila'); if (f) f.scrollIntoView({ behavior: "smooth", block: "start" }); else location.href = "/oficina/"; }
      });
    }
    if (p.firstElementChild !== b) p.insertBefore(b, p.firstChild);
    // vistas guardadas: os botões originais ficam na linha técnica (escondidos, os eventos podem estar no #tb-bar);
    // aqui há botões iguais que carregam neles, com o mesmo estado e o mesmo título
    var vm = D.querySelector("#tb-bar .tb-m");
    if (vm) {
      var vw = $("ipr-sep-vistas");
      if (!vw) {
        vw = D.createElement("div"); vw.id = "ipr-sep-vistas"; b.appendChild(vw);
        vw.addEventListener("click", function (e) {
          var x = e.target.closest("button[data-ref]"); if (!x) return;
          var o = D.querySelector("#tb-bar .tb-m " + x.getAttribute("data-ref")); if (o) clicar(o);
          setTimeout(blocoMeu, 300);
        });
      }
      var h = "<h5>" + t("Vistas guardadas", "Saved views") + '</h5><div class="vb">';
      [].forEach.call(vm.querySelectorAll("button"), function (o) {
        var ref = o.hasAttribute("data-px") ? '[data-px="' + o.getAttribute("data-px") + '"]' : "[data-pxg]";
        h += '<button type="button" data-ref=\'' + ref + '\' aria-pressed="' + (o.getAttribute("aria-pressed") || "false") + '" title="' + esc(o.title || "") + '"' + (o.disabled ? " disabled" : "") + ">" + esc(o.textContent) + "</button>";
      });
      h += "</div>";
      if (vw.getAttribute("data-h") !== h) { vw.setAttribute("data-h", h); vw.innerHTML = h; }
    }
    var nl = b.querySelector('[data-sep-n="loc"]'), lt = tab("loc");
    if (nl && lt) { var n = (lt.textContent.match(/\d+/) || [""])[0]; var tx = n ? n + " " + t("guardados", "saved") : t("Pontos e áreas guardados", "Saved points and areas"); if (nl.textContent !== tx) nl.textContent = tx; }
  }

  function blocoGestao(eq) {
    var p = pane("rever"); if (!p || !eq) return;
    var b = $("ipr-sep-ges");
    if (!b) {
      b = D.createElement("div"); b.id = "ipr-sep-ges"; b.className = "ipr-sep-b";
      b.innerHTML = "<h5>" + t("Gestão", "Management") + '</h5><div class="g">' +
        '<a class="bt" href="/wp-admin/tools.php?page=tcd-org" target="_blank" rel="noopener">' + t("Organizações", "Organisations") + "<small>" + t("Todas, códigos e prazos", "All, codes and terms") + "</small></a>" +
        '<a class="bt" href="/oficina/" target="_blank" rel="noopener">' + t("Oficina da equipa", "Team workshop") + "<small>" + t("Pedidos, leads, facturação", "Requests, leads, billing") + "</small></a>" +
        "</div>";
    }
    if (p.firstElementChild !== b) p.insertBefore(b, p.firstChild);
  }

  function paradas(f) {
    var par = 0;
    [].forEach.call(f.querySelectorAll(".f-i"), function (i) {
      var e = i.querySelector(".f-e"), p = !!(e && (e.classList.contains("parado") || /^\s*parad/i.test(e.textContent)));
      i.classList.toggle("ipr-sep-par", p); if (p) par++;
    });
    f.classList.toggle("ipr-sep-mp", mostrarParadas);
    var bt = f.querySelector(".ipr-sep-mpb");
    if (par) {
      if (!bt) { bt = D.createElement("button"); bt.type = "button"; bt.className = "ipr-sep-mpb"; bt.addEventListener("click", function () { mostrarParadas = !mostrarParadas; [].forEach.call(D.querySelectorAll(".tcd-fila"), paradas); }); f.appendChild(bt); }
      var tx = mostrarParadas ? t("Esconder as tiradas da fila", "Hide removed from queue") : t("Mostrar as tiradas da fila (", "Show removed from queue (") + par + ")";
      if (bt.textContent !== tx) bt.textContent = tx;
      if (bt !== f.lastElementChild) f.appendChild(bt);
    } else if (bt) bt.remove();
  }
  function fila(eq) {
    // a fila nasce no Começar (onde fica escondida); a que se vê vai para Gestão (equipa) ou O meu Atlas
    var destino = eq ? pane("rever") : pane("proj"); if (!destino) return;
    if (eq) { var pf = D.querySelector('[data-pane="proj"] .tcd-fila'), rf = destino.querySelector(".tcd-fila");
      if (pf && (!rf || !rf.querySelector(".f-i"))) { if (rf) rf.remove(); destino.insertBefore(pf, ($("ipr-sep-ges") || {}).nextSibling || destino.firstChild); } }
    var fora = destino.querySelector(".tcd-fila");
    if (!fora) {
      var f = D.querySelector('[data-pane="enc"] .tcd-fila') || W.__iprSepFila; if (!f) return;
      var ref = eq ? $("ipr-sep-ges") : $("ipr-sep-meu");
      destino.insertBefore(f, ref ? ref.nextSibling : destino.firstChild);
      W.__iprSepFila = f;
    }
    [].forEach.call(D.querySelectorAll(".tcd-fila"), paradas);
  }

  function correr() {
    var tabs = $("ipe-tabs"); if (!tabs) return;
    if (!$("ipr-sep-css")) { var s = D.createElement("style"); s.id = "ipr-sep-css"; s.textContent = CSS; D.head.appendChild(s); }
    if (getComputedStyle(tabs).display !== "flex" && getComputedStyle(tabs).display !== "inline-flex") tabs.style.display = "flex";
    var eq = equipa();
    tabs.classList.toggle("ipr-sep-eq", eq);
    rotulo("enc", t("Começar", "Start"));
    rotulo("proj", t("O meu Atlas", "My Atlas"));
    rotulo("org", t("Organização", "Organisation"));
    if (eq) rotulo("rever", t("Gestão", "Management"));
    try { blocoComecar(); } catch (e) {}
    try { blocoMeu(); } catch (e) {}
    try { blocoGestao(eq); } catch (e) {}
    try { fila(eq); } catch (e) {}
    // se o separador aberto ficou escondido (Comunidade, Locais), não forçar nada: o utilizador escolhe
  }
  (function vez(n) { correr(); if (n < 40) setTimeout(function () { vez(n + 1); }, 300); })(0);
  setInterval(correr, 2000);
  W.__iprSepApi = { correr: correr };
})();
