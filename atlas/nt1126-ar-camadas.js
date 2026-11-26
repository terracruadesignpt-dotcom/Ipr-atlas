/* IPR Atlas · nt1126-ar-camadas.js (26/11/2026)
 * Pedido do Nuno: no painel «O essencial» as setas e o texto ficavam encostados à margem esquerda.
 * Dá margem interior ao painel das camadas (computador e telemóvel).
 * Desligar: ?arcam=0
 */
(function (W, D) {
  "use strict";
  if (W.__iprArCam) return;
  W.__iprArCam = 1;
  try { if (/[?&]arcam=0\b/.test(W.location.search)) return; } catch (e) {}
  var css =
    "#ipe-cam.ipr-eng-on{padding:8px 14px 12px 18px!important;box-sizing:border-box}" +
    "#ipr-eng summary{padding-left:2px}" +
    "@media (max-width:600px){#ipe-cam.ipr-eng-on{padding:6px 10px 10px 12px!important}}";
  var s = D.createElement("style");
  s.id = "ipr-ar-camadas";
  s.textContent = css;
  (D.head || D.documentElement).appendChild(s);
})(window, document);
