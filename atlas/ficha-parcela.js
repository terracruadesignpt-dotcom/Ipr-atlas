/* IPR Atlas · ficha ao tocar numa parcela do cadastro (Nuno, 5/11/2026: «todos», a partir das quatro melhorias da entrada).
   Em qualquer separador, com o mapa a navegar (sem ferramenta de desenho ou de parcelas activa) e de perto (zoom 15 ou
   mais), um toque no mapa procura a parcela do cadastro predial da DGT nesse ponto (WFS INSPIRE, o mesmo serviço do
   «Parcelas do cadastro») e mostra junto ao toque um cartão pequeno: NIC, área e «Ver a ficha da propriedade».
   O botão passa ao separador Encomendar, põe a parcela como terreno e abre a ficha gratuita (ficha-gratuita.js).
   O terreno que estava no mapa fica guardado em ipe_terreno_v1_antes. Só lê dados públicos; não envia nada.
   Desligar: ?parcela=0 ou localStorage ipr_parcela_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]parcela=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_parcela_off") === "1") return; } catch (e) {}
  var EN = (W.IPR_LINGUA === "en" || W.IPR_LANG === "en");
  function t(pt, en) { return EN ? en : pt; }
  var WFS = "https://snicws.dgterritorio.gov.pt/geoserver/inspire/ows?service=WFS&version=2.0.0&request=GetFeature&typeNames=inspire:cadastralparcel&outputFormat=application/json&srsName=EPSG:4326";
  var PT = [-9.6, 36.9, -6.1, 42.2]; // continente
  var CSS = ".ipr-fp{position:absolute;z-index:30;transform:translate(-50%,calc(-100% - 12px));background:var(--bg2,#1d2418);color:var(--tx,#eef0e8);" +
    "border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:10px 12px;box-shadow:0 8px 24px rgba(0,0,0,.35);font:13px/1.35 Inter,system-ui,sans-serif;min-width:210px;max-width:280px}" +
    ".ipr-fp::after{content:\"\";position:absolute;left:50%;bottom:-6px;width:10px;height:10px;background:inherit;border-right:inherit;border-bottom:inherit;transform:translateX(-50%) rotate(45deg)}" +
    ".ipr-fp b{display:block;font-weight:600;margin-bottom:2px}.ipr-fp small{display:block;color:var(--mu,#a9b0a0);font-size:11.5px;margin-bottom:8px}" +
    ".ipr-fp .ipr-fp-b{display:block;width:100%;border:0;border-radius:7px;padding:8px 10px;background:var(--ac,#8bc34a);color:#10160c;font:600 13px Inter,system-ui,sans-serif;cursor:pointer}" +
    ".ipr-fp .ipr-fp-x{position:absolute;top:4px;right:6px;border:0;background:none;color:inherit;opacity:.6;font-size:16px;cursor:pointer;padding:2px 4px}";
  var cartao = null, pedido = null, alvo = null;
  function mapa() { return W.__ipe && W.__ipe.mapa ? W.__ipe.mapa : null; }
  function draw(A) { return (A._controls || []).filter(function (x) { return x && typeof x.getAll === "function"; })[0]; }
  function livre(A) {
    var P = W.__ipe && W.__ipe.estado; if (P && P.tool && P.tool !== "nav") return false;
    var dr = draw(A); try { if (dr && dr.getMode && dr.getMode() !== "simple_select") return false; if (dr && dr.getSelectedIds && dr.getSelectedIds().length) return false; } catch (e) {}
    return true;
  }
  function dentro(p, anel) {
    var x = p[0], y = p[1], c = false;
    for (var i = 0, j = anel.length - 1; i < anel.length; j = i++) {
      var xi = anel[i][0], yi = anel[i][1], xj = anel[j][0], yj = anel[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c;
    }
    return c;
  }
  function contem(geo, p) {
    var polis = geo.type === "Polygon" ? [geo.coordinates] : geo.type === "MultiPolygon" ? geo.coordinates : [];
    return polis.some(function (pl) { return dentro(p, pl[0]) && !pl.slice(1).some(function (b) { return dentro(p, b); }); });
  }
  function fechar() { if (cartao) { cartao.remove(); cartao = null; } alvo = null; }
  function mostrar(A, ll, f) {
    fechar();
    var pr = f.properties || {}, nic = pr.nationalcadastralreference || pr.label || "";
    var ha = pr.areavalue ? (Number(pr.areavalue) / 1e4) : null;
    var el = D.createElement("div"); el.className = "ipr-fp"; el.setAttribute("role", "dialog");
    el.innerHTML = '<button type="button" class="ipr-fp-x" aria-label="' + t("Fechar", "Close") + '">×</button><b>' + t("Parcela do cadastro", "Cadastral parcel") + "</b><small>" +
      (nic ? "NIC " + String(nic).replace(/[<>&]/g, "") : "") + (ha ? " · " + ha.toLocaleString(EN ? "en" : "pt-PT", { maximumFractionDigits: ha < 10 ? 2 : 1 }) + " ha" : "") +
      '</small><button type="button" class="ipr-fp-b">' + t("Ver a ficha da propriedade", "See the property sheet") + "</button>";
    A.getContainer().appendChild(el); cartao = el; alvo = { ll: ll, f: f };
    posicao(A);
    el.querySelector(".ipr-fp-x").addEventListener("click", function (e) { e.stopPropagation(); fechar(); });
    el.querySelector(".ipr-fp-b").addEventListener("click", function (e) { e.stopPropagation(); usar(A, f); });
  }
  function posicao(A) { if (!cartao || !alvo) return; var p = A.project(alvo.ll); cartao.style.left = p.x + "px"; cartao.style.top = p.y + "px"; }
  function usar(A, f) {
    fechar();
    var dr = draw(A); if (!dr) return;
    var tab = D.querySelector('#ipe-tabs .ipe-tab[data-tab="enc"]'); if (tab) tab.click();
    try { var ant = W.localStorage.getItem("ipe_terreno_v1"); if (ant) W.localStorage.setItem("ipe_terreno_v1_antes", ant); } catch (e) {}
    try { dr.deleteAll(); A.fire("draw.delete", { features: [] }); } catch (e) {}
    var polis = f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [f.geometry.coordinates];
    var novos = [];
    polis.forEach(function (c) { dr.add({ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: c } }).forEach(function (k) { novos.push(dr.get(k)); }); });
    A.fire("draw.create", { features: novos });
    setTimeout(function () {
      var sec = D.getElementById("ipe-res"); if (sec && sec.hidden) sec.hidden = false;
      if (typeof W.__iprFichaGratuita === "function") W.__iprFichaGratuita();
    }, 1500);
  }
  function clique(e) {
    var A = mapa(); if (!A || !e || !e.lngLat) return;
    if (cartao && e.originalEvent && cartao.contains(e.originalEvent.target)) return;
    fechar();
    if (A.getZoom() < 15 || !livre(A)) return;
    var p = [e.lngLat.lng, e.lngLat.lat];
    if (p[0] < PT[0] || p[0] > PT[2] || p[1] < PT[1] || p[1] > PT[3]) return;
    if (pedido && pedido.abort) pedido.abort();
    pedido = W.AbortController ? new AbortController() : null;
    var d = 0.00004, bb = [p[1] - d, p[0] - d, p[1] + d, p[0] + d].join(",");
    fetch(WFS + "&count=12&bbox=" + bb + ",urn:ogc:def:crs:EPSG::4326", pedido ? { signal: pedido.signal } : {})
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || !j.features) return;
        var f = j.features.filter(function (x) { return x.geometry && contem(x.geometry, p); })[0];
        if (f) mostrar(A, e.lngLat, f);
      }).catch(function () {});
  }
  function arrancar(n) {
    var A = mapa();
    if (!A || !A.on) { if (n < 120) setTimeout(function () { arrancar(n + 1); }, 500); return; }
    if (A.__iprFp) return; A.__iprFp = 1;
    var st = D.createElement("style"); st.textContent = CSS; D.head.appendChild(st);
    A.on("click", clique);
    A.on("move", function () { posicao(A); });
    D.addEventListener("keydown", function (e) { if (e.key === "Escape") fechar(); });
    // Se o Atlas recriar o mapa (troca de modo), volta a ligar
    setInterval(function () { var B = mapa(); if (B && B !== A) { A = B; if (!B.__iprFp) { B.__iprFp = 1; B.on("click", clique); B.on("move", function () { posicao(B); }); } } }, 2000);
  }
  W.__iprFichaParcela = { fechar: fechar };
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", function () { arrancar(0); }); else arrancar(0);
})();
