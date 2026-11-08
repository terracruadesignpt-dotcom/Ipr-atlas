/* IPR Atlas · arranjos do funil de compra (8/11/2026, mega auditoria de conversão; Nuno: «Corre tudo e corrige tudo»).
   Terracrua Design. Só acrescenta.
   1. Visita técnica: as ligações /carrinho/?add-to-cart=14533 dentro do Atlas (Ficha da propriedade gratuita e outras)
      levam agora o ponto do terreno (?tcd_ll=lat,lon e ?tcd_local=), para a visita entrar no carrinho com a deslocação
      calculada (m90989). Sem terreno escolhido, usa o centro do mapa só se o mapa estiver aproximado (zoom 13 ou mais);
      senão, deixa a ligação como está e o site manda escolher o terreno.
   2. Chegada com ?visita=1 (o site mandou escolher o terreno para a visita): aviso no mapa com o que fazer.
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
  if (/[?&]visita=1(&|$)/.test(location.search)) {
    var mostrar = function () {
      if (!D.body) return setTimeout(mostrar, 300);
      var d = D.createElement("div"); d.setAttribute("role", "status");
      d.style.cssText = "position:fixed;left:50%;top:calc(70px + env(safe-area-inset-top));transform:translateX(-50%);z-index:100045;max-width:min(92vw,520px);padding:10px 14px;background:rgba(18,22,15,.96);color:#E4E2D8;border:1px solid #94BE39;border-radius:2px;font:500 14px/1.4 Inter,system-ui,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.4)";
      d.innerHTML = T("<b>Visita técnica</b>: procure o seu terreno e escolha as parcelas (ou desenhe o limite). Na Ficha da propriedade, carregue em «Marcar» na visita técnica: a deslocação é calculada para esse sítio.", "<b>Site visit</b>: find your land and pick the parcels (or draw the boundary). In the Property sheet, tap «Book» on the site visit: travel is calculated for that place.") +
        ' <button type="button" style="margin-left:8px;background:transparent;border:1px solid #3C4B32;color:#E4E2D8;border-radius:2px;padding:2px 8px;cursor:pointer" aria-label="' + T("Fechar", "Close") + '">×</button>';
      d.querySelector("button").onclick = function () { d.remove(); };
      D.body.appendChild(d); setTimeout(function () { if (d.isConnected) d.remove(); }, 20000);
    };
    setTimeout(mostrar, 2500);
  }
})();
