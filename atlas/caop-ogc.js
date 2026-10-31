/* IPR Atlas · caop-ogc.js (31/10/2026, 01h30). Terracrua Design.
   A DGT mudou o nome da colecção das freguesias na OGC API (CAOP 2025): «cont_freguesias» deixou de existir (404) e passou a
   «freguesias», com as mesmas propriedades (freguesia, municipio, distrito_ilha…). O ajustes.js (planta de localização:
   concelho, PDM de condicionantes), o valor.js, o assistente.js e o planta-folhas.js pedem a colecção antiga, e o concelho
   ficava «a procurar…» ou «por confirmar» (Santa Clara-a-Nova, Almodôvar, projecto #17082).
   Este ficheiro só reescreve esse endereço antes de o pedido sair: carrega antes dos outros, por isso os embrulhos de fetch
   deles continuam a ver o endereço antigo e tudo o resto fica igual. Não toca nas camadas WMS (geo2, cont_freguesias), que
   continuam a funcionar. Desligar: ?caop=0 ou localStorage ipr_caop_off = 1. */
(function () {
  "use strict";
  var W = window;
  try { if (/[?&]caop=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_caop_off") === "1") return; } catch (e) {}
  if (W.__iprCaopOgc || typeof W.fetch !== "function") return;
  W.__iprCaopOgc = 1;
  var RX = /^(https:\/\/ogcapi\.dgterritorio\.gov\.pt\/collections\/)cont_(freguesias|municipios|distritos)(\/items(?:\?|$))/;
  var NOVO = { freguesias: "freguesias", municipios: "municipios", distritos: "distritos" };
  var orig = W.fetch;
  W.fetch = function (input, init) {
    try {
      var u = typeof input === "string" ? input : (input && typeof input.url === "string" ? input.url : "");
      var m = u && RX.exec(u);
      if (m) {
        var nu = u.replace(RX, function (_, a, c, b) { return a + NOVO[c] + b; });
        if (typeof input === "string") input = nu;
        else if (typeof Request === "function" && input instanceof Request) input = new Request(nu, input);
        else input = nu;
      }
    } catch (e) {}
    return orig.call(this, input, init);
  };
})();
