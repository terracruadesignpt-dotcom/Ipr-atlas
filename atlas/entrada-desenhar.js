/* IPR Atlas · entrada-desenhar.js (04/11/2026). Terracrua Design. Só acrescenta; não altera nenhum outro ficheiro.
   Revisão da compra (Nuno, 04/11/2026, 15h24: «faz outra revisão total [...] a experiência do user a tentar comprar, temos
   de vender»). No ecrã de entrada (inicio.js), «Desenhar o limite» e «Carregar ficheiro» eram ligações para
   /atlas/?modo=encomenda: o Atlas recarregava todo outra vez (mais 5 a 15 s) e a pessoa caía no mapa de Portugal inteiro,
   sem a ferramenta de desenho ligada e sem dizer o que fazer. Quem tinha carregado em «Desenhar» ficava perdido.
   Aqui, os dois botões passam a fechar o ecrã de entrada e a ligar logo, no Atlas já carregado:
   - «Desenhar o limite»: a ferramenta «Desenhar o terreno» (#ipe-desenhar), com a dica «Clique em cada canto do terreno».
     Ao fechar o desenho, o comprar.js abre o cartão com a área e os preços (já era assim);
   - «Carregar ficheiro»: abre logo o seletor de ficheiros do Atlas (KML, KMZ, GeoJSON, GPX, SHP em .zip, GPKG, DXF, DWG),
     o mesmo da ferramenta «Importar limite do terreno».
   Se a ferramenta não aparecer em 20 s, segue a ligação de antes. Desligar: ?entrada-desenhar=0. Falha em silêncio. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]entrada-desenhar=0(&|$)/.test(location.search)) return; } catch (e) {}
  if (W.__iprEntradaDesenhar) return; W.__iprEntradaDesenhar = 1;

  function fecharEntrada() {
    var o = D.getElementById("ipr-ini"); if (o) o.remove();
    D.documentElement.classList.remove("ipr-ini-on");
  }
  function quando(sel, fn, href) {
    var t0 = Date.now();
    (function t() {
      var b = D.querySelector(sel), M = W.__ipe && W.__ipe.mapa;
      if (b && M && (!M.loaded || M.loaded() || Date.now() - t0 > 8000)) { try { fn(b); } catch (e) {} return; }
      if (Date.now() - t0 > 20000) { if (href) location.href = href; return; }
      setTimeout(t, 250);
    })();
  }
  D.addEventListener("click", function (e) {
    var a = e.target && e.target.closest && e.target.closest("#ipr-ini a.s");
    if (!a) return;
    var i = [].indexOf.call(a.parentNode.querySelectorAll("a.s"), a); // 0 = desenhar, 1 = carregar ficheiro
    if (i < 0 || i > 1) return;
    e.preventDefault(); e.stopPropagation();
    var href = a.getAttribute("href");
    fecharEntrada();
    try { sessionStorage.setItem("ipr_as_auto", "1"); } catch (x) {} // o assistente não abre por cima
    if (i === 0) quando("#ipe-desenhar", function (b) { if (!W.__ipe.estado || W.__ipe.estado.tool !== "desenhar") b.click(); }, href);
    else {
      // o seletor de ficheiros só abre dentro do próprio clique (o navegador exige o gesto): usa-se já o campo do Atlas
      var f = D.getElementById("ipe-file");
      if (f) { try { f.click(); } catch (x) {} return; }
      quando('#ipe [data-tool="importar"]', function (b) { b.click(); }, href);
    }
  }, true);
})();
