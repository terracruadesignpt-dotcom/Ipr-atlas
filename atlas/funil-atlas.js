/* IPR Atlas · arranjos do funil de compra (8/11/2026, mega auditoria de conversão; Nuno: «Corre tudo e corrige tudo»).
   Terracrua Design. Só acrescenta.
   1. Visita técnica: as ligações /carrinho/?add-to-cart=14533 dentro do Atlas (Ficha da propriedade gratuita e outras)
      levam agora o ponto do terreno (?tcd_ll=lat,lon e ?tcd_local=), para a visita entrar no carrinho com a deslocação
      calculada (m90989). Sem terreno escolhido, usa o centro do mapa só se o mapa estiver aproximado (zoom 13 ou mais);
      senão, deixa a ligação como está e o site manda escolher o terreno.
   2. Camadas ligadas duas vezes seguidas deixam de mostrar o erro técnico «already exists».
   Desligar: ?funil=0 ou localStorage ipr_funil_off = 1. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]funil=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_funil_off") === "1") return; } catch (e) {}
  if (W.__iprFunil) return; W.__iprFunil = 1;
  var EN = (W.IPR_LINGUA || "pt") === "en";
  function T(pt, en) { return EN ? en : pt; }
  function desenho() {
    var m = W.__ipe && W.__ipe.mapa; if (!m) return null;
    var cs = m._controls || [];
    for (var i = 0; i < cs.length; i++) if (cs[i] && typeof cs[i].getAll === "function") { try { var a = cs[i].getAll(); if (a && a.features && a.features.length) return a; } catch (e) {} }
    return null;
  }
  function centro() {
    var a = desenho(), b = [180, 90, -180, -90], n = 0;
    if (a) a.features.forEach(function (f) {
      var g = f.geometry; if (!g) return;
      var ps = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : g.type === "Point" ? [[[g.coordinates]]] : [];
      ps.forEach(function (p) { p.forEach(function (r) { r.forEach(function (c) { n++; if (c[0] < b[0]) b[0] = c[0]; if (c[1] < b[1]) b[1] = c[1]; if (c[0] > b[2]) b[2] = c[0]; if (c[1] > b[3]) b[3] = c[1]; }); }); });
    });
    if (n) return [(b[1] + b[3]) / 2, (b[0] + b[2]) / 2];
    var M = W.__ipe && W.__ipe.mapa;
    if (M && M.getZoom && M.getZoom() >= 13) { var c = M.getCenter(); return [c.lat, c.lng]; }
    return null;
  }
  D.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href*="add-to-cart=14533"]'); if (!a || /[?&]tcd_(ll|mapa)=/.test(a.href)) return;
    var c = centro(); if (!c) return;
    var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
    u.searchParams.set("tcd_ll", c[0].toFixed(5) + "," + c[1].toFixed(5));
    var lug = D.querySelector("[data-lugar]") || D.getElementById("ipe-ctx-r");
    if (lug && lug.textContent.trim()) u.searchParams.set("tcd_local", lug.textContent.trim().slice(0, 80));
    a.href = u.href;
  }, true);
  // 2. (8/11) Camadas ligadas duas vezes depressa (ex.: «Hipsometria (DGT)») davam ao cliente o erro técnico «Source
  //    "…" already exists». Se a fonte ou a camada já existe, o mapa usa a que lá está em vez de falhar.
  (function sossegoFontes() {
    var M = W.maplibregl && W.maplibregl.Map;
    if (!M) return setTimeout(sossegoFontes, 500);
    var P = M.prototype; if (P.__iprDup) return; P.__iprDup = 1;
    var aS = P.addSource, aL = P.addLayer;
    P.addSource = function (id, src) { try { if (this.getSource && this.getSource(id)) return this; } catch (e) {} return aS.apply(this, arguments); };
    P.addLayer = function (ly) { try { if (ly && ly.id && this.getLayer && this.getLayer(ly.id)) return this; } catch (e) {} return aL.apply(this, arguments); };
  })();
  // (8/11) O aviso de ?visita=1 saiu: o app.js já abre a ferramenta da visita com a sua própria instrução e as duas
  // mensagens contradiziam-se.
})();
