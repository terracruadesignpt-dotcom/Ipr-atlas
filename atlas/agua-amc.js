/* IPR Atlas · Simulador de Água: humidade do solo antes da chuva (AMC I, II, III do método SCS-CN). Nuno, 7/11/2026,
   21h27: «o da água executa também». Acrescenta ao painel «Simular água» a escolha «Solo antes da chuva» (seco, normal,
   encharcado) e envia-a ao site em entradas.amc (1, 2 ou 3). O site (m90416) converte o mapa de CN da Base para essa
   condição (Chow et al. 1988) antes de o entregar ao motor; «normal» é o comportamento de sempre (AMC II).
   Critério de referência (SCS): chuva dos 5 dias anteriores abaixo de 12,7 mm (fora da estação de crescimento) ou de
   35,6 mm (na estação) = seco; acima de 27,9 mm ou de 53,3 mm = encharcado. Não mexe no agua-simulador.js. */
(function (W, D) {
  "use strict";
  if (W.__iprAguaAmc) return; W.__iprAguaAmc = true;
  var EN = W.IPR_LINGUA === "en" || W.IPR_LANG === "en";
  var amc = 2; try { amc = +(W.localStorage.getItem("ipr_agua_amc") || 2) || 2; } catch (e) {}
  var T = EN ? { h: "Soil before the rain", o: ["Dry (AMC I): little rain in the last 5 days", "Normal (AMC II)", "Wet (AMC III): soil already soaked"],
      n: "Changes how much of the rain soaks in (SCS curve number). Reference: rain in the previous 5 days below 13 to 36 mm = dry; above 28 to 53 mm = wet." }
    : { h: "Solo antes da chuva", o: ["Seco (AMC I): pouca chuva nos últimos 5 dias", "Normal (AMC II)", "Encharcado (AMC III): solo já ensopado"],
      n: "Muda quanto da chuva se infiltra (número de curva SCS). Referência: chuva dos 5 dias anteriores abaixo de 13 a 36 mm = seco; acima de 28 a 53 mm = encharcado." };
  function bloco() {
    var d = D.createElement("div"); d.className = "ipr-amc"; d.style.cssText = "margin:8px 0 10px";
    d.innerHTML = '<span class="as-h">' + T.h + '</span><label class="f" style="display:block"><select data-amc="1" style="width:100%">' +
      [1, 2, 3].map(function (v) { return '<option value="' + v + '"' + (v === amc ? " selected" : "") + ">" + T.o[v - 1] + "</option>"; }).join("") +
      '</select></label><small style="display:block;opacity:.75;font-size:12px;line-height:1.35;margin-top:3px">' + T.n + "</small>";
    d.querySelector("select").addEventListener("change", function (e) { amc = +e.target.value || 2; try { W.localStorage.setItem("ipr_agua_amc", String(amc)); } catch (x) {} });
    return d;
  }
  function pôr() {
    var P = D.getElementById("ipr-as"); if (!P || P.hidden || P.querySelector(".ipr-amc")) return;
    var hs = P.querySelectorAll(".as-h"), alvo = null;
    for (var i = 0; i < hs.length; i++) { if (/^(Chuva|Rain)$/i.test(hs[i].textContent.trim())) { alvo = hs[i]; break; } }
    if (!alvo) return;
    alvo.parentNode.insertBefore(bloco(), alvo);
  }
  var q = 0;
  new MutationObserver(function () { clearTimeout(q); q = setTimeout(pôr, 120); }).observe(D.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
  // O pedido ao site leva a escolha (só quando não é a normal).
  var f0 = W.fetch;
  W.fetch = function (u, op) {
    try {
      var url = typeof u === "string" ? u : (u && u.url) || "";
      if (amc !== 2 && /tcd\/v1\/agua\/simular/.test(url) && op && typeof op.body === "string") {
        var b = JSON.parse(op.body);
        if (b && typeof b === "object") { b.entradas = b.entradas || {}; b.entradas.amc = amc; op = Object.assign({}, op, { body: JSON.stringify(b) }); }
      }
    } catch (e) {}
    return f0.call(this, u, op);
  };
})(window, document);
