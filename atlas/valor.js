/* IPR Atlas · Valor indicativo do terreno (pedido do Nuno, 28/10/2026; decisões em atlas/valor-indicativo-decisoes-2026-10-28.md).
   Discreto: uma linha fechada «Valor indicativo» no fim da Ficha do terreno (o terreno desenhado ou escolhido no cadastro, e
   os projectos), só com sessão iniciada (window.tcdValor, posto pelo servidor). Ao abrir mostra o intervalo do uso actual e a
   confiança; «ver mais» mostra o potencial construtivo, a referência oficial, os factores, o método e o aviso completo.
   Nunca «avaliação». Liga-se pelo DOM (#ipe-res, .ipe-res--proj) e por window.__ipe (mapa, estado); não mexe no app.js.
   Terracrua Design. */
(function () {
  "use strict";
  var V = window.tcdValor;
  if (!V || !V.on) { return; }
  var EN = (window.IPR_LINGUA || document.documentElement.lang || "pt").slice(0, 2) === "en";
  function t(p, e) { return EN ? e : p; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function eur(v) { return Math.round(v).toLocaleString(EN ? "en-GB" : "pt-PT").replace(/,/g, EN ? "," : " ") + " €"; }
  function num(v) { return Math.round(v).toLocaleString(EN ? "en-GB" : "pt-PT"); }

  var AVISO_CURTO = t("Valor indicativo, calculado automaticamente. Não é uma avaliação. Antes de decidir, consulte um avaliador, um solicitador, um advogado ou um agente imobiliário.",
    "Indicative value, calculated automatically. Not a valuation. Before deciding, consult a valuer, a solicitor, a lawyer or an estate agent.");
  function avisoLongo(d) {
    return t(
      "<b>Valor indicativo (estimativa automática).</b> Intervalo calculado automaticamente pelo IPR Atlas a partir de preços de terrenos comparáveis registados pelo IPR e pela Terracrua Design (vendas e preços pedidos, sem dados pessoais) e, como referência, das estatísticas do INE, com os dados de " + esc(d.data) + ". Não é uma avaliação imobiliária, não foi feito por perito avaliador registado na CMVM (Lei n.º 153/2015) e não segue normas de avaliação profissional. Não pode ser usado para crédito, seguros, fundos, partilhas, expropriações nem fins fiscais ou judiciais. Não considera o estado de conservação, a legalidade das construções, servidões, ónus, registos, água nem licenças. O potencial construtivo depende de licenciamento e não é uma expectativa garantida. Precisão ainda não medida contra transacções. O valor real de um prédio só se determina com avaliação presencial: consulte um avaliador, um solicitador, um advogado ou um agente imobiliário. O IPR não responde por decisões tomadas com base nesta estimativa. Não mostramos dados pessoais de titulares; se for titular e se opuser, escreva para info@regenerativo.pt (RGPD, art. 21.º).",
      "<b>Indicative value (automated estimate).</b> A range calculated automatically by IPR Atlas from prices of comparable land recorded by IPR and Terracrua Design (sales and asking prices, no personal data) and, for reference, INE statistics, using data as of " + esc(d.data) + ". It is not a property valuation, was not produced by a valuer registered with the CMVM (Portuguese Law 153/2015) and does not follow professional valuation standards. It must not be used for lending, insurance, funds, inheritance divisions, expropriation, tax or court purposes. It does not account for condition, legality of buildings, easements, encumbrances, registrations, water or licences. Development potential depends on planning approval and is not a guaranteed expectation. Accuracy not yet measured against transactions. The actual value of a property can only be established by an on-site valuation: consult a valuer, a solicitor, a lawyer or an estate agent. IPR accepts no liability for decisions based on this estimate. We do not display owners' personal data; if you are the owner and object, write to info@regenerativo.pt (GDPR, Art. 21).");
  }

  var CSS = ".ipv{margin:12px 0 0;border-top:1px solid rgba(127,127,127,.25);padding-top:8px;font-size:13px}" +
    ".ipv>summary{cursor:pointer;color:inherit;opacity:.75;list-style:none;display:flex;gap:6px;align-items:center;min-height:32px}.ipv>summary::-webkit-details-marker{display:none}" +
    ".ipv>summary:before{content:'›';display:inline-block;transition:transform .15s}.ipv[open]>summary:before{transform:rotate(90deg)}" +
    ".ipv .ipv-l{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:6px 0}.ipv select{font-size:14px;min-height:34px;max-width:100%}" +
    ".ipv .ipv-v{font-size:16px;font-weight:600;margin:8px 0 2px}.ipv .ipv-u{opacity:.75}.ipv .ipv-c{letter-spacing:2px}" +
    ".ipv .ipv-a{opacity:.7;font-size:12px;line-height:1.4;margin:8px 0 0}.ipv ul{margin:6px 0 0 18px;padding:0}.ipv li{margin:2px 0}" +
    ".ipv details{margin-top:8px}.ipv details>summary{cursor:pointer;opacity:.8}.ipv button{font:inherit;min-height:34px;padding:4px 12px;cursor:pointer}";
  var st = document.createElement("style"); st.id = "ipv-css"; st.textContent = CSS; document.head.appendChild(st);

  function terrenoActual() {
    var m = window.__ipe && window.__ipe.mapa, cs = (m && m._controls) || [];
    for (var i = 0; i < cs.length; i++) { if (cs[i] && typeof cs[i].getAll === "function") { try { var fc = cs[i].getAll(); if (fc && fc.features && fc.features.length) { return fc; } } catch (e) {} } }
    return null;
  }
  function terrenoProjecto(i) { var e = window.__ipe && window.__ipe.estado, p = e && e.mapas && e.mapas[i]; return p && p.geojson ? p.geojson : null; }
  function concelho() { var x = document.getElementById("ipe-ctx-r"); return x ? String(x.textContent || "").split(",")[0].trim() : ""; }
  function montar(alvo, obter) {
    if (!alvo || alvo.querySelector(":scope > .ipv")) { return; }
    var d = document.createElement("details"); d.className = "ipv";
    d.innerHTML = "<summary>" + t("Valor indicativo", "Indicative value") + "</summary><div class='ipv-in'></div>";
    alvo.appendChild(d);
    var corpo = d.querySelector(".ipv-in"), feito = false;
    d.addEventListener("toggle", function () { if (d.open && !feito) { feito = true; pedir(""); } });
    function pedir(classe) {
      var fc = obter();
      if (!fc) { corpo.innerHTML = "<p>" + t("Desenhe ou escolha o terreno primeiro.", "Draw or pick the land first.") + "</p>"; feito = false; return; }
      corpo.innerHTML = "<p>" + t("A calcular…", "Calculating…") + "</p>";
      fetch(V.rota, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-WP-Nonce": window.tcdNonce || "" }, body: JSON.stringify({ geojson: fc, classe: classe, concelho: concelho() }) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (x) { if (!x.ok) { corpo.innerHTML = "<p>" + esc((x.j && x.j.message) || t("Não foi possível calcular agora.", "Could not calculate now.")) + "</p>"; return; } desenhar(x.j); })
        .catch(function () { corpo.innerHTML = "<p>" + t("Sem ligação. Tente de novo.", "No connection. Try again.") + "</p>"; feito = false; });
    }
    function desenhar(j) {
      var opts = Object.keys(j.classes || {}).map(function (k) { return "<option value='" + esc(k) + "'" + (k === j.classe ? " selected" : "") + ">" + esc(j.classes[k]) + "</option>"; }).join("");
      var h = "<div class='ipv-l'><label>" + t("Tratar como", "Treat as") + " <select>" + opts + "</select></label></div>";
      var rus = j.uso === "rustico";
      h += "<div class='ipv-u'>" + (rus ? num(j.area_ha) + " ha" : num(j.area_m2) + " m²") + " · " + t("uso actual", "current use") + "</div>";
      if (j.actual) {
        var u = j.actual.unit.eur_ha || j.actual.unit.eur_m2;
        h += "<div class='ipv-v'>" + eur(j.actual.min) + " " + t("a", "to") + " " + eur(j.actual.max) + "</div>";
        h += "<div class='ipv-u'>" + num(u[0]) + " " + t("a", "to") + " " + num(u[2]) + (rus ? " €/ha" : " €/m²") + " · " + t("valor central", "central value") + " " + eur(j.actual.central) + "</div>";
      } else {
        h += "<p>" + t("Ainda não há comparáveis suficientes perto deste terreno para mostrar um intervalo com honestidade.", "There are not yet enough comparables near this land to show an honest range.") + "</p>";
      }
      var c = Math.max(1, Math.min(5, j.confianca | 0));
      h += "<div class='ipv-u'>" + t("Confiança", "Confidence") + " <span class='ipv-c' aria-label='" + c + " / 5'>" + "●●●●●".slice(0, c) + "○○○○○".slice(0, 5 - c) + "</span> " + c + "/5</div>";
      h += "<p class='ipv-a'>" + esc(AVISO_CURTO) + "</p>";
      h += "<details><summary>" + t("Ver mais", "See more") + "</summary>";
      h += "<p><b>" + t("Potencial construtivo", "Development potential") + ".</b> " + esc(j.potencial && j.potencial.texto) + "</p>";
      h += "<p><b>" + t("Referência oficial", "Official reference") + ".</b> " + esc(j.oficial ? j.oficial.texto : t("Sem referência do INE para este concelho nesta versão. O valor patrimonial tributário não é usado: não é público e, nos rústicos, não reflecte o mercado.", "No INE reference for this municipality in this version. The tax value (VPT) is not used: it is not public and, for rural land, does not reflect the market.")) + "</p>";
      h += "<p><b>" + t("Como foi calculado", "How it was calculated") + ".</b></p><ul>" + (j.factores || []).map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>";
      h += "<p class='ipv-a'>" + avisoLongo(j) + " " + t("Versão do método", "Method version") + ": " + esc(j.versao) + ".</p></details>";
      corpo.innerHTML = h;
      corpo.querySelector("select").addEventListener("change", function (e) { pedir(e.target.value); });
    }
  }

  function varrer() {
    var r = document.getElementById("ipe-res");
    if (r && !r.hidden) { montar(r, terrenoActual); }
    document.querySelectorAll(".ipe-res--proj").forEach(function (el) {
      var b = el.querySelector("[data-res-proj]"); if (!b) { return; }
      var i = +b.getAttribute("data-res-proj"); montar(el, function () { return terrenoProjecto(i); });
    });
  }
  var ag = null;
  new MutationObserver(function () { clearTimeout(ag); ag = setTimeout(varrer, 250); }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
  varrer();
})();
