/* IPR Atlas · Base partilhada mais legível (2/11/2026, 15h28; vídeo do Bernardo, Base de Caldas da Rainha, Nadadouro:
   terreno quase plano, a hipsometria pinta tudo de uma cor e as curvas de 1 m e 5 m por cima tornam-no ilegível; o
   «Comprar passo a passo» a meio do mapa tapa o terreno a quem já tem a Base). Escolhas do Nuno: «Meia transparência»,
   «Esconde».
   Quando a Base aberta foi partilhada com a pessoa (dono = false), uma vez por abertura:
   - a hipsometria (MDT) fica a 50 % de opacidade;
   - das curvas de nível fica só a de 5 m; as de 0,25, 0,5, 1 e 2 m desligam-se (pela própria caixa da lista, por isso
     voltam a ligar-se com um clique);
   - o botão flutuante «Comprar passo a passo» (#ipr-as-b) não aparece enquanto essa Base estiver aberta.
   Não mexe no minhas-bases.js nem no assistente.js. Desligar: ?bpartilhada=0. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]bpartilhada=0\b/.test(W.location.search)) return; } catch (e) {}
  if (W.__iprBasePart) return; W.__iprBasePart = 1;
  try {
    var st = D.createElement("style"); st.id = "ipr-bpart-css";
    st.textContent = "html.ipr-bpart #ipr-as-b{display:none!important}";
    (D.head || D.documentElement).appendChild(st);
  } catch (e) {}
  var FEITO = {}, ESPERA = {};
  function aberta() {
    var I = W.__ipe, P = I && I.estado;
    if (!P || P.modo !== "cliente" || !P.actual) return null;
    return P.actual.dono === false ? P.actual : null;
  }
  function mdtMeio() {
    var M = W.__ipe && W.__ipe.mapa; if (!M || !M.getStyle) return false;
    var n = 0;
    (M.getStyle().layers || []).forEach(function (l) {
      if (!/l_mdt(\b|$)/.test(l.id)) return;
      var pr = l.type === "raster" ? "raster-opacity" : (l.type === "color-relief" ? "color-relief-opacity" : (l.type === "fill" ? "fill-opacity" : null));
      if (pr) { try { M.setPaintProperty(l.id, pr, 0.5); n++; } catch (e) {} }
    });
    return n > 0;
  }
  function curvas() {
    var n = 0;
    [].forEach.call(D.querySelectorAll("#ipr-mb li.ipr-mb-it"), function (li) {
      var nm = li.querySelector(".ipr-mb-n"), ck = li.querySelector('input[type="checkbox"]');
      if (!nm || !ck || !ck.checked || ck.disabled) return;
      var t = String(nm.firstChild && nm.firstChild.nodeType === 3 ? nm.firstChild.nodeValue : nm.textContent).trim();
      if (!n && /^(Curvas de n[ií]vel (0,25|0,5|1|2) m|curvas\s*0?25)$/i.test(t)) { ck.click(); n++; } // uma por volta: a lista refaz-se
    });
    return n;
  }
  setInterval(function () {
    try {
      var m = aberta();
      D.documentElement.classList.toggle("ipr-bpart", !!m);
      if (!m) return;
      var k = String(m.id); if (FEITO[k]) return;
      ESPERA[k] = (ESPERA[k] || 0) + 1;
      // espera que a abertura automática ligue as camadas iniciais (MDT no mapa), até ~20 s
      if (!mdtMeio() && ESPERA[k] < 25) return;
      if (curvas() && ESPERA[k] < 40) return;
      FEITO[k] = 1;
    } catch (e) {}
  }, 800);
})();
