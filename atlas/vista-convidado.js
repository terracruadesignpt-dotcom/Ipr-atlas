/* IPR Atlas · vista simplificada para quem recebe uma ficha de propriedade por ligação, convite ou partilha (Nuno, 2/11/2026,
   10h11: «quero uma vista simplificada para quem recebe um link convite partilha etc de uma ficha de propriedade»).
   Acrescento, sem mexer nos outros guiões. Liga-se quando a Base aberta no mapa não é da pessoa (cartão com dono = false,
   vindo de «Partilhados comigo») e a pessoa não é da equipa (a Base não vem marcada como «para rever» nem «equipa»).
   Nessa vista:
     - o mapa ocupa o lugar da barra da direita; ficam à vista o mapa, a legenda, os botões de zoom e a barra da esquerda;
     - a barra da esquerda mostra só um cartão da propriedade (nome, área, quem partilhou) com os documentos para
       descarregar (Leitura Territorial, relatório da Base, planta, QField, pacote completo) e, por baixo, as camadas da Base
       e do projecto (as do minhas-bases.js e do projecto-design.js);
     - escondem-se os produtos, a pesquisa, o catálogo de camadas, o painel «Camadas ligadas», a barra de ferramentas de
       desenho e medição, a barra da direita, o assistente, os convites de compra e o ecrã «Por onde começar?».
   Botão «Abrir o Atlas completo» (fica lembrado neste navegador) e «Voltar à vista simples».
   Desligar para todos: ?vsimples=0 ou localStorage ipr_cv_off = 1. Terracrua Design. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]vsimples=0\b/.test(W.location.search)) return; } catch (e) {}
  if (W.__iprCv) return; W.__iprCv = 1;

  function lerOff() { try { return W.localStorage.getItem("ipr_cv_off") === "1"; } catch (e) { return false; } }
  function gravarOff(v) { try { if (v) W.localStorage.setItem("ipr_cv_off", "1"); else W.localStorage.removeItem("ipr_cv_off"); } catch (e) {} }
  var EN = function () { return (W.IPR_LINGUA || "pt") === "en"; };
  var T = {
    partilhado: ["Propriedade partilhada consigo", "Property shared with you"],
    por: ["Partilhada por ", "Shared by "],
    docs: ["Documentos", "Documents"],
    completo: ["Abrir o Atlas completo", "Open the full Atlas"],
    simples: ["Voltar à vista simples", "Back to the simple view"],
    ajuda: ["Ligue e desligue as camadas por baixo. Use dois dedos ou a roda do rato para aproximar.", "Turn the layers below on and off. Use two fingers or the mouse wheel to zoom."],
    ha: ["ha", "ha"]
  };
  function t(k) { return T[k][EN() ? 1 : 0]; }
  function el(tag, cls, txt) { var e = D.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = String(txt); return e; }
  function I() { return W.__ipe || null; }
  function est() { var i = I(); return i && i.estado; }
  function num(n, d) { n = +n; return isFinite(n) ? n.toLocaleString(EN() ? "en-GB" : "pt-PT", { maximumFractionDigits: d, minimumFractionDigits: d }) : ""; }

  var css = D.createElement("style"); css.id = "ipr-cv-css";
  var H = "#ipe.ipr-cv ";
  css.textContent =
    H + "#ipe-dir," + H + "#ipr-pd," + H + "#ipe-esq>.ipe-sb[data-sb=busca]," + H + "#ipe-esq>.ipe-sb[data-sb=cam]," + H + "#ipr-cq," + H + "#ipr-cq-cont," +
    H + "#ipr-pb-barra," + H + ".ipe-tools>.ipe-tg," + H + "#ipr-msimples," + H + "#ipr-z67," + H + "#ipr-app-b," + H + "#ipr-painel," + H + "#ipe-mais," +
    H + "#ipr-cp-b," + H + "#ipr-tp-meio," + H + "#ipe-nivel," + H + ".ipe-beta," + H + ".ipe-vsep," + H + ".iprv-aviso," + H + "#ipr-mb>.ipr-mb-cab," +
    H + "#ipr-mb .ipr-mb-acc button[data-mb-acc=ficha]," +
    "body.ipr-cv-on #ipr-tri,body.ipr-cv-on #ipr-lb-act,body.ipr-cv-on #ipr-lb-seta,body.ipr-cv-on #tcdfmb,body.ipr-cv-on #tcd_fu-p,body.ipr-cv-on [id^=ipr-as-],body.ipr-cv-on .ipr-formiga,body.ipr-cv-on #ipr-fm-b{display:none!important}" +
    H + "#ipe-mapa{right:0!important;grid-column:2/-1!important}" +
    H + "#ipe-esq{overflow-y:auto!important}" +
    H + "#ipe-esq>.ipe-sb[data-sb=locais]{flex-shrink:0!important}" +
    ".ipr-cvk{margin:10px 10px 6px;padding:12px 12px 10px;border:1px solid var(--ac,#94BE39);border-radius:10px;background:var(--p2,rgba(148,190,57,.06));font:13px/1.4 Inter,system-ui,sans-serif;color:var(--tx,#e9eadf)}" +
    ".ipr-cvk .k{font:600 10.5px/1.2 var(--mono,'IBM Plex Mono',monospace);letter-spacing:.1em;text-transform:uppercase;color:var(--ac2,var(--ac,#94BE39));margin:0 0 6px}" +
    ".ipr-cvk h3{margin:0 0 2px;font:600 17px/1.25 Inter,system-ui,sans-serif;color:var(--tx,#e9eadf)}" +
    ".ipr-cvk .m{margin:0 0 8px;font:12px/1.35 var(--mono,monospace);color:var(--mu,#a5a893)}" +
    ".ipr-cvk h4{margin:10px 0 4px;font:600 12px Inter,system-ui,sans-serif;color:var(--mu,#a5a893)}" +
    ".ipr-cvk ul{list-style:none;margin:0;padding:0}.ipr-cvk li a{display:block;padding:6px 8px;margin:0 0 4px;border:1px solid var(--ln,#3a4030);border-radius:7px;color:var(--tx,#e9eadf);text-decoration:none;font-size:13px}" +
    ".ipr-cvk li a:hover{border-color:var(--ac,#94BE39)}.ipr-cvk .aj{margin:8px 0 0;font-size:12px;color:var(--mu,#a5a893)}" +
    ".ipr-cvk button.cv{margin-top:8px;font:600 12px Inter,system-ui,sans-serif;border:1px solid var(--ln,#3a4030);background:transparent;color:var(--tx,#e9eadf);border-radius:6px;padding:4px 10px;cursor:pointer}" +
    ".ipr-cvv{position:fixed;z-index:20;left:12px;bottom:calc(46px + env(safe-area-inset-bottom,0px));font:600 12px Inter,system-ui,sans-serif;border:1px solid var(--ac,#94BE39);background:var(--p1,#18200f);color:var(--tx,#e9eadf);border-radius:16px;padding:6px 12px;cursor:pointer}";
  (D.head || D.documentElement).appendChild(css);

  // 2/11, 15h11 (Miguel Clemente, Base 271 Quinta da Boavista: «Pacote completo ×2», «Relatório PDF ×2?»): o nome
  // vinha só do rótulo do servidor, igual para o PDF em português e em inglês e para o ZIP e o QField. Agora o nome sai
  // do ficheiro, e o mesmo ficheiro não aparece duas vezes.
  function ficheiro(d) { return String(d && d.nome || "").split("· ").pop().trim(); }
  function rotulo(d) {
    var f = ficheiro(d).toLowerCase(), en = (W.IPR_LINGUA || "pt") === "en";
    if (/_territorial_reading_en\.pdf$/.test(f)) return en ? "Territorial Reading (PDF, English)" : "Leitura Territorial em inglês (PDF)";
    if (/_cartographic_base_en\.pdf$/.test(f)) return en ? "Cartographic Base report (PDF, English)" : "Relatório da Base em inglês (PDF)";
    if (/_leitura_territorial\.pdf$/.test(f)) return en ? "Territorial Reading (PDF, Portuguese)" : "Leitura Territorial (PDF)";
    if (/_relatorio_base\.pdf$/.test(f)) return en ? "Cartographic Base report (PDF, Portuguese)" : "Relatório da Base (PDF)";
    if (/_qfield\.zip$/.test(f)) return en ? "QField package (phone, in the field)" : "Pacote QField (telemóvel, no campo)";
    if (/\.zip$/.test(f)) return en ? "Full package (QGIS project, PDF, Shapefile, KMZ)" : "Pacote completo (projecto QGIS, PDF, Shapefile, KMZ)";
    var n = String(d && d.nome || ""), i = n.lastIndexOf(" · ");
    var r = i > 0 ? n.slice(0, i) : n; return r.replace(/\s*\(abrir no telemóvel ou no computador\)/, "");
  }
  function docs(m) {
    var l = Array.isArray(m && m.downloads) ? m.downloads : [], vistos = {};
    return l.filter(function (d) {
      var f = ficheiro(d).toLowerCase();
      if (!/\.(pdf|zip|kmz|gpkg)$/.test(f) || vistos[f]) return false;
      vistos[f] = 1; return true;
    }).slice(0, 8);
  }
  function aberta() {
    var P = est(); if (!P || P.modo !== "cliente" || !P.actual) return null;
    var id = String(P.actual.id), m = (P.mapas || []).filter(function (x) { return x && String(x.id) === id; })[0] || P.actual;
    if (m.dono !== false || m.rever || m.equipa) return null;
    return m;
  }
  function cartao(m) {
    var k = el("div", "ipr-cvk"); k.id = "ipr-cvk";
    k.appendChild(el("p", "k", t("partilhado")));
    k.appendChild(el("h3", "", m.local || ("#" + m.id)));
    var meta = [m.area_ha ? num(m.area_ha, 2) + " " + t("ha") : ""];
    if (m.de) meta.push(t("por") + m.de);
    k.appendChild(el("p", "m", meta.filter(Boolean).join(" · ")));
    var ds = docs(m);
    if (ds.length) {
      k.appendChild(el("h4", "", t("docs")));
      var ul = el("ul");
      ds.forEach(function (d) { var li = el("li"), a = el("a", "", rotulo(d)); a.href = d.url; a.target = "_blank"; a.rel = "noopener"; li.appendChild(a); ul.appendChild(li); });
      k.appendChild(ul);
    }
    k.appendChild(el("p", "aj", t("ajuda")));
    var b = el("button", "cv", t("completo")); b.type = "button";
    b.addEventListener("click", function () { gravarOff(true); aplicar(); });
    k.appendChild(b);
    return k;
  }
  var ligado = false, sig = "";
  function redimensionar() { try { var M = I() && I().mapa; if (M) setTimeout(function () { M.resize(); }, 60); } catch (e) {} }
  function aplicar() {
    var R = D.getElementById("ipe"); if (!R) return;
    var m = aberta(), quer = !!m && !lerOff();
    var v = D.getElementById("ipr-cvv");
    if (!quer) {
      if (ligado) { R.classList.remove("ipr-cv"); D.body.classList.remove("ipr-cv-on"); var k0 = D.getElementById("ipr-cvk"); if (k0) k0.remove(); ligado = false; sig = ""; redimensionar(); }
      if (m && lerOff()) {
        if (!v) { v = el("button", "ipr-cvv", t("simples")); v.id = "ipr-cvv"; v.type = "button"; v.addEventListener("click", function () { gravarOff(false); v.remove(); aplicar(); }); D.body.appendChild(v); }
      } else if (v) v.remove();
      return;
    }
    if (v) v.remove();
    if (!ligado) { R.classList.add("ipr-cv"); D.body.classList.add("ipr-cv-on"); ligado = true; redimensionar(); }
    var esq = D.getElementById("ipe-esq"); if (!esq) return;
    var s = String(m.id) + "|" + (m.downloads ? m.downloads.length : 0) + "|" + (W.IPR_LINGUA || "pt");
    var k = D.getElementById("ipr-cvk");
    if (!k || sig !== s || k.parentNode !== esq || esq.firstChild !== k) { if (k) k.remove(); esq.insertBefore(cartao(m), esq.firstChild); sig = s; }
  }
  function ciclo() { try { aplicar(); } catch (e) {} setTimeout(ciclo, 1200); }
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", ciclo); else ciclo();
})();
