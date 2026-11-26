/* IPR Atlas · nt1126-orto-continente.js (26/11/2026)
 * A ortofoto da DGT (iprv-f_ortosat-r e iprv-f_ortosat-lzr) só cobre o continente:
 * fora dele devolve mosaicos brancos que tapam o mar e o satélite de fundo
 * (visto em Porto Santo, zoom 11 a 13). Fora do continente, esconde-a por opacidade
 * e repõe a opacidade anterior quando o mapa volta ao continente.
 * Desligar: ?ortocont=0
 */
(function (W) {
  "use strict";
  if (W.__iprOrtoCont) return;
  W.__iprOrtoCont = 1;
  try { if (/[?&]ortocont=0\b/.test(W.location.search)) return; } catch (e) {}

  var IDS = ["iprv-f_ortosat-r", "iprv-f_ortosat-lzr"];
  // Continente com margem; a vista conta como «continente» se o rectângulo visível o tocar.
  var CONT = [-9.95, 36.8, -6.0, 42.3];
  var guardado = {};
  var ultimo = 0, pend = 0;

  function tocaContinente(m) {
    var b = m.getBounds();
    return !(b.getEast() < CONT[0] || b.getWest() > CONT[2] || b.getNorth() < CONT[1] || b.getSouth() > CONT[3]);
  }

  function aplicar() {
    pend = 0; ultimo = Date.now();
    var m = W.IPR_MAPA;
    if (!m || !m.getLayer) return;
    var dentro;
    try { dentro = tocaContinente(m); } catch (e) { return; }
    IDS.forEach(function (id) {
      if (!m.getLayer(id)) return;
      var op = m.getPaintProperty(id, "raster-opacity");
      if (!dentro) {
        if (op !== 0) { guardado[id] = (op == null ? 1 : op); m.setPaintProperty(id, "raster-opacity", 0); }
      } else if (op === 0 && guardado.hasOwnProperty(id)) {
        m.setPaintProperty(id, "raster-opacity", guardado[id]);
        delete guardado[id];
      }
    });
  }

  function agendar() {
    if (pend) return;
    var espera = Math.max(0, 250 - (Date.now() - ultimo));
    pend = setTimeout(aplicar, espera);
  }

  function ligar() {
    var m = W.IPR_MAPA;
    if (!m || !m.on) { setTimeout(ligar, 500); return; }
    m.on("move", agendar);
    m.on("styledata", agendar);
    aplicar();
  }
  ligar();
})(window);
