/* IPR Atlas · Camadas da DGT servidas do nosso depósito. Terracrua Design.
   Nuno, 11/11/2026 (15h26 «cópias permanentes, tudo o que é da DGT … a bombar do nosso servidor»; 15h47 «Avança»).
   As camadas vectoriais que o Atlas pedia à OGC API da DGT (mosaicos MVT de ogcapi.dgterritorio.gov.pt) passam a vir de ficheiros
   PMTiles nossos, feitos a partir da cópia integral da DGT (ipr-copia-dgt, 9-10/11) e guardados no R2 tcd-camadas, servidos em
   camadas.terracruadesign.pt (leitura directa do depósito, sem Worker nem alojamento). Mesmos dados e atributos; se a DGT cair,
   estas camadas continuam. Só troca a origem das colecções da lista PROPRIAS; as outras continuam como estavam.
   Como: envolve Map.addSource (troca os mosaicos da OGC API pelo PMTiles) e Map.addLayer (põe o source-layer certo).
   Desligar: localStorage «ipr-dgt-proprio» = «0», ou ?dgtproprio=0 no endereço.
   17/11/2026 (Nuno, 10h49: «os mosaicos do Atlas, avança com isso … tudo o que falta para o site inteiro correr é para avançar»):
   as outras colecções da OGC API da DGT (COS, faixas SGIFR, cadastro, CAOP, altimetria, redes, árvores, perigosidade...) passam
   pelo protocolo ipr-mvt://: cada mosaico pede-se primeiro ao depósito público camadas.terracruadesign.pt/mvt/... (R2), depois
   ao Worker ipr-mvt (que o pede uma vez à DGT e o guarda no R2) e só no fim à própria DGT. São os mesmos mosaicos da DGT,
   byte a byte, por isso a camada e o source-layer não mudam. Estado em window.__iprDgtProprioEstado().mvt. */
(function (W) {
  "use strict";
  if (W.__iprDgtProprio) return; W.__iprDgtProprio = true;
  try { if (/[?&]dgtproprio=0\b/.test(location.search) || (W.localStorage && W.localStorage.getItem("ipr-dgt-proprio") === "0")) return; } catch (e) {}
  var BASE = "https://camadas.terracruadesign.pt/pmtiles/dgt/";
  var PROPRIAS = { srup_ren_areal: 1, srup_ren_linear: 1, srup_ran: 1, srup_albufeiras: 1, srup_rede_eletrica: 1, srup_zec: 1, srup_zpe: 1,
    srup_areas_protegidas: 1, srup_aquiferos: 1, srup_defesa_militar_zonas: 1, srup_aeronautica: 1, linhas_agua: 1, crus: 1,
    // 14/11/2026 (Nuno: «a COS 2023 e a CRUS é para descarregar tudo e inserir no nosso site já»): COS2023v1 a partir do
    // GeoPackage oficial da DGT (Série 2), convertida em PMTiles por GitHub Actions e copiada para o R2.
    cos2023v1: 1 };
  var PMT = "https://cdn.jsdelivr.net/npm/pmtiles@3.2.1/dist/pmtiles.js", pronto = null, fontes = {}, LIG = 0;
  var DEP = "https://camadas.terracruadesign.pt/mvt/", WK = "https://ipr-mvt.terracrua-ipr.workers.dev/",
    OGC = "https://ogcapi.dgterritorio.gov.pt/collections/", MVT = { deposito: 0, copiador: 0, dgt: 0, falhas: 0 }, mvtPronto = false;
  W.__iprDgtProprioEstado = function () { return { fontes: fontes, protocolo: !!pronto, mvt: MVT, mvtProtocolo: mvtPronto }; };
  function buscar(u, sinal) {
    return fetch(u, { signal: sinal, credentials: "omit" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); });
  }
  // ipr-mvt://<col>/<z>/<x>/<y>: depósito R2, depois o Worker, depois a DGT.
  function mvtTile(params, ac) {
    var m = String(params.url).match(/^ipr-mvt:\/\/([a-z0-9_]+)\/(\d+)\/(\d+)\/(\d+)/), sinal = ac && ac.signal;
    if (!m) return Promise.reject(new Error("ipr-mvt"));
    var c = m[1], z = m[2], x = m[3], y = m[4];
    return buscar(DEP + c + "/" + z + "/" + x + "/" + y + ".pbf", sinal).then(function (d) { MVT.deposito++; return { data: d }; })
      .catch(function () { return buscar(WK + c + "/" + z + "/" + x + "/" + y, sinal).then(function (d) { MVT.copiador++; return { data: d }; }); })
      .catch(function () { return buscar(OGC + c + "/tiles/WebMercatorQuad/" + z + "/" + y + "/" + x + "?f=mvt", sinal).then(function (d) { MVT.dgt++; return { data: d }; }); })
      .catch(function (e) { MVT.falhas++; throw e; });
  }
  function registarMvt() { try { if (W.maplibregl && !mvtPronto) { W.maplibregl.addProtocol("ipr-mvt", mvtTile); mvtPronto = true; } } catch (e) {} }
  // A biblioteca PMTiles (a mesma versão que o viz.js usa) carrega logo ao arranque; enquanto não estiver pronta, as camadas
  // ficam na origem antiga (DGT), para não haver mapas vazios por corrida.
  function registar() { try { if (W.pmtiles && W.maplibregl && !pronto) { var p = new W.pmtiles.Protocol(); W.maplibregl.addProtocol("pmtiles", p.tile); pronto = true; } } catch (e) {} }
  function carregar() {
    if (W.pmtiles) return registar();
    var s = document.createElement("script"); s.src = PMT; s.crossOrigin = "anonymous"; s.onload = registar; (document.head || document.documentElement).appendChild(s);
  }
  function colecao(src) {
    if (!src || src.type !== "vector" || !src.tiles || !src.tiles[0]) return null;
    var u = String(src.tiles[0]); try { u = decodeURIComponent(u); } catch (e) {}
    var m = u.match(/ogcapi\.dgterritorio\.gov\.pt\/collections\/([a-z0-9_]+)\/tiles\//i);
    return m && PROPRIAS[m[1]] ? m[1] : null;
  }
  function outraColecao(src) {
    if (!src || src.type !== "vector" || !src.tiles || !src.tiles[0]) return null;
    var u = String(src.tiles[0]); try { u = decodeURIComponent(u); } catch (e) {}
    var m = u.match(/ogcapi\.dgterritorio\.gov\.pt\/collections\/([a-z0-9_]+)\/tiles\/WebMercatorQuad\//i);
    return m && !PROPRIAS[m[1]] ? m[1] : null;
  }
  function envolver(M) {
    var P = M && M.prototype; if (!P || P.__iprDgtProprio) return; P.__iprDgtProprio = true;
    var aS = P.addSource, aL = P.addLayer;
    P.addSource = function (id, src) {
      var c = colecao(src), o = c ? null : outraColecao(src);
      if (o) { registarMvt(); if (mvtPronto) src = Object.assign({}, src, { tiles: ["ipr-mvt://" + o + "/{z}/{x}/{y}"], attribution: (src.attribution || "DGT") + " · cópia IPR Atlas" }); }
      if (c && !pronto) registar();
      if (c && pronto) {
        fontes[id] = c;
        // 11/11/2026, 20h51 (Nuno: «se seleccionar e desseleccionar os layers deixam de aparecer»): cada vez que a camada volta
        // a ser ligada, endereço novo (?l=n). O Protocol do pmtiles guarda uma instância por endereço e, se a camada for
        // desligada a meio do carregamento, os pedidos cancelados ficavam na cache dessa instância e os mosaicos nunca mais vinham.
        src = { type: "vector", url: "pmtiles://" + BASE + c + ".pmtiles?l=" + (++LIG), attribution: (src.attribution || "DGT") + " · cópia IPR Atlas" };
      }
      return aS.call(this, id, src);
    };
    P.addLayer = function (l, antes) {
      if (l && typeof l === "object" && fontes[l.source] && l["source-layer"] !== fontes[l.source]) { l = Object.assign({}, l); l["source-layer"] = fontes[l.source]; }
      return aL.call(this, l, antes);
    };
  }
  function arrancar() { envolver(W.maplibregl.Map); registarMvt(); carregar(); }
  if (W.maplibregl && W.maplibregl.Map) arrancar();
  else { var n = 0, t = setInterval(function () { if (W.maplibregl && W.maplibregl.Map) { clearInterval(t); arrancar(); } else if (++n > 200) clearInterval(t); }, 50); }
})(window);
