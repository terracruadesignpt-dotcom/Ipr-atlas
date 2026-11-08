/* IPR Atlas · arranjos do funil de compra (8/11/2026, mega auditoria de conversão; Nuno: «Corre tudo e corrige tudo»).
   Terracrua Design. Só acrescenta.
   1. Visita técnica: as ligações /carrinho/?add-to-cart=14533 dentro do Atlas (Ficha da propriedade gratuita e outras)
      levam agora o ponto do terreno (?tcd_ll=lat,lon e ?tcd_local=), para a visita entrar no carrinho com a deslocação
      calculada (m90989). Sem terreno escolhido, usa o centro do mapa só se o mapa estiver aproximado (zoom 13 ou mais);
      senão, deixa a ligação como está e o site manda escolher o terreno.
   2. Camadas ligadas duas vezes seguidas deixam de mostrar o erro técnico «already exists».
   3. Visita técnica também sozinha: fora de uma Base, a ferramenta da visita oferece marcar a visita para o ponto.
   4. Preço da Leitura no pedido da Base vindo do servidor (a tabela do app.js estava desactualizada) e Pacote dos três.
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
  // 3. (8/11, Nuno: visita técnica «também sozinha») A ferramenta da visita, num ponto fora das Bases do cliente, mandava
  //    encomendar primeiro a Base. Agora oferece marcar a visita para esse ponto (Portugal continental), com a deslocação
  //    estimada como no carrinho (m14577: ida e volta desde Santa Clara-a-Nova × 1,3, mínimo 10 km, 0,50 €/km).
  (function visitaSozinha() {
    var M = W.__ipe && W.__ipe.mapa;
    if (!M || !D.body) return setTimeout(visitaSozinha, 800);
    var ult = null;
    M.on("click", function (e) { ult = e.lngLat; });
    function km(la, lo) {
      var R = 6371.0088, r = Math.PI / 180, p1 = 37.4886 * r, p2 = la * r, dp = p2 - p1, dl = (lo + 8.1445) * r;
      var a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
      return Math.max(10, Math.ceil(2 * 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.3));
    }
    function eur(v) { return v.toLocaleString(EN ? "en-GB" : "pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"; }
    function arranjar() {
      var b = D.querySelector("[data-vt-enc]"); if (!b || !ult) return;
      var c = b.parentElement; if (!c || c.querySelector("[data-ipr-vt]")) return;
      var la = ult.lat, lo = ult.lng;
      if (!(la > 36.8 && la < 42.3 && lo > -9.6 && lo < -6.1)) return;
      var k = km(la, lo), lug = D.querySelector("[data-lugar]") || D.getElementById("ipe-ctx-r");
      var href = "/?add-to-cart=14533&tcd_ll=" + la.toFixed(5) + "," + lo.toFixed(5) + (lug && lug.textContent.trim() ? "&tcd_local=" + encodeURIComponent(lug.textContent.trim().slice(0, 80)) : "");
      var p = c.querySelector("p");
      if (p) p.textContent = T("Vamos ao terreno, percorremo-lo consigo e fazemos o diagnóstico no local. Se tiver ou encomendar a Base Cartográfica, preparamos o percurso sobre ela.", "We visit the land, walk it with you and make the diagnosis on site. If you have or order the Base map, we prepare the route on it.");
      var v = D.createElement("div"); v.className = "v";
      v.innerHTML = "350 €<small></small>";
      v.querySelector("small").textContent = T(" + deslocação ≈ " + k + " km × 0,50 € = " + eur(0.5 * k) + ". Valores sem IVA, desde Santa Clara-a-Nova.", " + travel ≈ " + k + " km × €0.50 = " + eur(0.5 * k) + ". Prices before VAT, from Santa Clara-a-Nova.");
      var a = D.createElement("a"); a.className = "ipe-b ipe-b--ac"; a.setAttribute("data-ipr-vt", "1"); a.href = href;
      a.textContent = T("Marcar a visita para este ponto", "Book the visit for this spot");
      (p || b).parentNode.insertBefore(v, p || b);
      b.parentNode.insertBefore(a, b);
      b.classList.add("ipe-b--s"); b.textContent = T("Ou encomendar a Base deste terreno", "Or order the Base map for this land");
    }
    new MutationObserver(arranjar).observe(D.body, { childList: true, subtree: true });
  })();
  // 4. (8/11) Preço da Leitura no pedido da Base. O app.js ainda usa a tabela antiga da Leitura (250 € a 3900 €), mas o
  //    servidor cobra a tabela de 7/11 (79 € até 20 ha, nunca mais de 199 €; m14473). Ex.: 78,7 ha mostrava 530 € e cobrava
  //    136 €. Agora o preço mostrado vem do servidor (GET /tcd/v1/pedido-produto/preco, rota que já existe).
  //    E, com a Leitura marcada, aparece o Pacote dos três (m90990): Planta incluída e 20 % de desconto no conjunto.
  (function precoLeitura() {
    var form = D.getElementById("ipe-form"), pl = D.getElementById("ipe-preco-l"), ar = D.getElementById("ipe-area");
    if (!form || !pl || !ar) return setTimeout(precoLeitura, 1000);
    var cache = {}, pedido = 0, PLANTA = 19, ultimo = "";
    function num(t) { var m = String(t || "").replace(/\./g, "").replace(",", ".").match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : 0; }
    function eur(v) { return v.toLocaleString(EN ? "en-GB" : "pt-PT", { maximumFractionDigits: v % 1 ? 2 : 0, minimumFractionDigits: v % 1 ? 2 : 0 }) + " €"; }
    function preco(ha) {
      var k = ha > 0 ? ha.toFixed(2) : "1";
      if (cache[k]) return Promise.resolve(cache[k]);
      return fetch("/wp-json/tcd/v1/pedido-produto/preco?ha=" + k, { credentials: "same-origin" }).then(function (r) { return r.json(); }).then(function (j) { if (j && j.leitura) { cache[k] = j; if (j.planta) PLANTA = +j.planta; } return j; });
    }
    function nota() {
      var n = D.getElementById("ipr-pacote"), chk = form.querySelector('input[name="leitura"]');
      var b = num((D.getElementById("ipe-preco") || {}).textContent), l = num(pl.textContent), ha = num(ar.textContent);
      if (!chk || !chk.checked || !(ha > 0) || !(b > 0) || !(l > 0)) { if (n) n.remove(); return; }
      var d = Math.round((0.2 * (b + l) - 0.8 * PLANTA) * 100) / 100; if (d <= 0) { if (n) n.remove(); return; }
      if (!n) { n = D.createElement("p"); n.id = "ipr-pacote"; n.style.cssText = "margin:6px 0 10px;padding:8px 10px;border:1px solid #94BE39;border-radius:2px;font-size:13px;line-height:1.4"; var lab = chk.closest("label"); (lab || chk).parentNode.insertBefore(n, (lab || chk).nextSibling); }
      n.textContent = T("Pacote dos três: com a Leitura, a Planta de Localização vai incluída e o conjunto fica com 20 % de desconto (menos " + eur(d) + ", sem IVA). Total: " + eur(b + l - d) + " + IVA.", "Three-pack: with the Land report, the Location plan is included and the set is 20 % off (" + eur(d) + " less, before VAT). Total: " + eur(b + l - d) + " + VAT.");
    }
    function acertar() {
      var ha = num(ar.textContent), meu = ++pedido;
      preco(ha).then(function (j) {
        if (meu !== pedido || !j || !j.leitura) return;
        var t = (ha > 0 ? "" : T("desde ", "from ")) + eur(+j.leitura);
        ultimo = t; if (pl.textContent !== t) pl.textContent = t;
        nota();
      }).catch(function () {});
    }
    new MutationObserver(acertar).observe(ar, { childList: true, characterData: true, subtree: true });
    new MutationObserver(function () { if (pl.textContent !== ultimo) acertar(); }).observe(pl, { childList: true, characterData: true, subtree: true });
    form.addEventListener("change", function (e) { if (e.target && e.target.name === "leitura") nota(); });
    acertar();
  })();
  // (8/11) O aviso de ?visita=1 saiu: o app.js já abre a ferramenta da visita com a sua própria instrução e as duas
  // mensagens contradiziam-se.
})();
