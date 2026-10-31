/* IPR Atlas · mapa-simples.js (31/10/2026, 02h10). Terracrua Design. Só acrescenta.
   Nuno, 01h46: «quero aquele botão lá em cima de mapa simples e quero que cada vez que alguém vai fazer um pedido de uma base,
   de uma planta, de uma leitura, tem sempre a visualização simples do mapa: toponímia muito forte, ortofoto, algumas curvas de
   nível, um bocadinho de hipsometria, o cadastro; um Maps fácil de ler».
   - Botão «Mapa simples» no topo: põe o fundo OrtoSat 2023 e liga toponímia, estradas, cadastro, curvas de nível (LiDAR DGT)
     e a hipsometria da DGT muito leve (20 %); desliga as outras camadas temáticas. Carregar outra vez repõe o que estava.
   - Ao entrar em Processos (encomendar Base, Planta ou Leitura) o mapa simples entra sozinho, uma vez por entrada.
   As camadas do projecto aberto (Base Cartográfica) não se desligam. Desligar: ?msimples=0 ou localStorage ipr_msimples_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]msimples=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_msimples_off") === "1") return; } catch (e) {}
  var LIGAR = ["o_nomes", "o_estradas", "cad", "r_curvas", "r_hipso"];
  var antes = null, ultimoMapa = null;
  function viz() { return W.__ipe && W.__ipe.viz || null; }
  function mapa() { return W.__ipe && W.__ipe.mapa || null; }
  function pt() { return (W.IPR_LINGUA || "pt") !== "en"; }
  function aplicar() {
    var V = viz(), M = mapa(); if (!V || !V.ligar) return false;
    var act = []; try { act = V.activas(); } catch (e) {}
    antes = act.slice(); ultimoMapa = M;
    try { if (V.fundo) V.fundo("f_ortosat"); } catch (e) {}
    act.forEach(function (id) {
      if (LIGAR.indexOf(id) >= 0 || id === "aoi" || id.indexOf("f_") === 0 || id.indexOf("l_") === 0 || id.indexOf("ent") === 0) return;
      try { V.ligar(id, false); } catch (e) {}
    });
    LIGAR.forEach(function (id) { try { V.ligar(id, true); } catch (e) {} });
    var n = 0; (function leve() { // hipsometria quase transparente, quando a camada existir
      var MM = mapa(); if (!MM) return;
      var ids = (MM.getStyle().layers || []).filter(function (l) { return l.id.indexOf("iprv-r_hipso") === 0 && l.type === "raster"; });
      if (ids.length) { ids.forEach(function (l) { try { MM.setPaintProperty(l.id, "raster-opacity", 0.2); } catch (e) {} }); return; }
      if (n++ < 20) setTimeout(leve, 400);
    })();
    marcar(true);
    return true;
  }
  function repor() {
    var V = viz(); if (!V || !antes) { marcar(false); return; }
    var agora = []; try { agora = V.activas(); } catch (e) {}
    LIGAR.forEach(function (id) { if (antes.indexOf(id) < 0) { try { V.ligar(id, false); } catch (e) {} } });
    antes.forEach(function (id) { if (agora.indexOf(id) < 0 && id.indexOf("f_") !== 0) { try { V.ligar(id, true); } catch (e) {} } });
    var f = antes.filter(function (id) { return id.indexOf("f_") === 0 && id !== "f_sub"; })[0];
    if (f && V.fundo) try { V.fundo(f); } catch (e) {}
    antes = null; marcar(false);
  }
  function marcar(on) { var b = D.getElementById("ipr-msimples"); if (b) b.setAttribute("aria-pressed", on ? "true" : "false"); }
  function botao() {
    var top = D.querySelector("#ipe header.ipe-top"); if (!top) return;
    var b = D.getElementById("ipr-msimples");
    if (!b) {
      b = D.createElement("button"); b.type = "button"; b.id = "ipr-msimples"; b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function (e) { e.preventDefault(); if (antes) repor(); else aplicar(); });
      var st = D.createElement("style");
      st.textContent = "#ipr-msimples{font:600 12px/1 Inter,system-ui,sans-serif;padding:7px 11px;border-radius:999px;border:1px solid rgba(155,197,61,.6);background:transparent;color:inherit;cursor:pointer;white-space:nowrap;margin:0 6px}#ipr-msimples[aria-pressed=true]{background:#9BC53D;color:#14200F;border-color:#9BC53D}@media(max-width:700px){#ipr-msimples{padding:6px 8px;font-size:11px}}";
      D.head.appendChild(st);
    }
    var txt = pt() ? "Mapa simples" : "Simple map";
    if (b.textContent !== txt) { b.textContent = txt; b.title = pt() ? "Ortofoto, nomes, estradas, cadastro e curvas de nível. Carregue outra vez para voltar ao que estava." : "Orthophoto, names, roads, cadastre and contours. Click again to go back."; }
    var tr = top.querySelector(":scope > .ipe-tr");
    if (tr) { if (b.parentNode !== tr || tr.firstChild !== b) tr.insertBefore(b, tr.firstChild); }
    else if (b.parentNode !== top) top.appendChild(b);
  }
  // Ao entrar em Processos (encomendar): mapa simples, uma vez por entrada
  var encAntes = false;
  function vigiarEnc() {
    var t = D.querySelector('#ipe .ipe-tab[data-tab="enc"]'), sel = !!(t && t.getAttribute("aria-selected") === "true");
    var M = mapa();
    if (sel && (!encAntes || M !== ultimoMapa)) {
      ultimoMapa = M;
      if (M && (M.loaded() || (M.isStyleLoaded && M.isStyleLoaded()))) { antes = null; aplicar(); encAntes = true; }
      return;
    }
    if (!sel) encAntes = false;
  }
  setInterval(function () { if (!D.hidden) { try { botao(); } catch (e) {} try { vigiarEnc(); } catch (e) {} } }, 1000);
  // o mapa é refeito ao trocar de projecto: o botão volta a «desligado»
  setInterval(function () { var M = mapa(); if (M && M !== ultimoMapa && antes) { antes = null; marcar(false); } }, 1500);
})();
