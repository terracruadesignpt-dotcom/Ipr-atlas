/* IPR Atlas · ritmo.js (04/11/2026). Terracrua Design. Só acrescenta; não altera nenhum outro ficheiro.
   Nuno, 04/11/2026, 15h26: «tá tudo muito pesado a carregar o atlas»; 16h28: «avança para tornar o site mais leve e
   responsivo». Medição no Chrome do Nuno (Atlas aberto, sem ninguém mexer, 10 s): 7,2 s de tarefas longas no navegador,
   1 s só em recalcular a página. Vinha de cerca de 50 vigias que os ficheiros do Atlas correm de 60 ms em 60 ms a 2 s
   (procurar painéis, arrumar janelas, ver se o mapa mudou), mesmo quando ninguém toca em nada.
   Aqui, sem mexer em nenhum desses ficheiros, as vigias passam a um ritmo calmo quando o Atlas está parado:
   - parado = sem rato, toque, teclado ou roda há 5 s (ou separador escondido), e só depois dos primeiros 15 s
     (o arranque corre à velocidade de sempre);
   - setInterval de 100 ms a 2,5 s: parado, corre no máximo de 3 em 3 s; ao primeiro toque volta ao ritmo normal;
   - setTimeout que se volta a marcar a si próprio (a mesma função 4 ou mais vezes em 10 s, de 100 ms a 2 s): parado,
     a próxima volta é daqui a 3 s.
   Nada muda nos temporizadores curtos (menos de 100 ms: animações, esperas de um instante) nem nos longos, nem no
   desenho do mapa (requestAnimationFrame). Entra no atlas.json em primeiro lugar.
   Desligar: ?ritmo=0 no endereço ou localStorage ipr_ritmo_off = 1. Diagnóstico: window.__iprRitmoDiag(). */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]ritmo=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_ritmo_off") === "1") return; } catch (e) {}
  if (W.__iprRitmo) return; W.__iprRitmo = 1;

  var T0 = Date.now(), ULT = Date.now();
  var PAUSA = 5000, ARRANQUE = 15000, CALMO = 3000;
  var saltos = 0, esticados = 0;
  ["pointerdown", "pointermove", "keydown", "wheel", "touchstart", "input", "focusin"].forEach(function (ev) {
    try { W.addEventListener(ev, function () { ULT = Date.now(); }, { capture: true, passive: true }); } catch (e) {}
  });
  function parado() {
    var n = Date.now();
    if (D.hidden) return true;
    return n - T0 > ARRANQUE && n - ULT > PAUSA;
  }
  W.__iprParado = parado;

  var SI = W.setInterval, ST = W.setTimeout;
  W.setInterval = function (fn, ms) {
    var d = +ms || 0;
    if (typeof fn !== "function" || d < 100 || d > 2500) return SI.apply(W, arguments);
    var extra = Array.prototype.slice.call(arguments, 2), ultima = 0;
    return SI.call(W, function () {
      var n = Date.now();
      if (parado() && n - ultima < CALMO) { saltos++; return; }
      ultima = n;
      return fn.apply(this, extra);
    }, d);
  };
  var conta = typeof WeakMap === "function" ? new WeakMap() : null;
  W.setTimeout = function (fn, ms) {
    var d = +ms || 0;
    if (conta && typeof fn === "function" && d >= 100 && d <= 2000) {
      var n = Date.now(), c = conta.get(fn);
      if (!c || n - c.t > 10000) { c = { n: 0, t: n }; conta.set(fn, c); }
      c.n++;
      if (c.n >= 4 && parado()) {
        var a = Array.prototype.slice.call(arguments); a[1] = CALMO; esticados++;
        return ST.apply(W, a);
      }
    }
    return ST.apply(W, arguments);
  };
  W.__iprRitmoDiag = function () { return { parado: parado(), semMexer_s: Math.round((Date.now() - ULT) / 1000), intervalosSaltados: saltos, voltasEsticadas: esticados }; };
})();
