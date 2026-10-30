/* IPR Atlas · Perfil dentro dos Temas e Projectos com a Organização (Nuno, 30/10/2026, 17h06: «acho que há redundância.
   perfil vs temas e projectos vs organização não achas?»; 17h11: «executa já»). Terracrua Design.
   Carrega-se depois de todos os outros ficheiros do Atlas e só mexe no que já existe, em tempo de execução:
   1. Perfil: o selector «Perfil» (arrumar.js §80, #ipr-79) deixa de ser um bloco próprio por cima dos Temas. Passa a uma
      linha no cabeçalho dos Temas («Perfil: Autarquia ▾»), que abre a mesma lista e muda o mesmo <select id="ipr-perfis">
      (o arrumar.js continua a aplicar o perfil e a guardá-lo em ipr_perfil). Com perfil escolhido, o tema desse perfil
      passa para o primeiro lugar da grelha dos Temas; as ferramentas e as «mais camadas» do perfil ficam onde estavam,
      sem o selector e sem a descrição repetida. Sem perfil, o bloco antigo some.
   2. Projectos e Organização: um só separador «Projectos», com uma escolha no topo («Os meus» · «Organização»). O separador
      «Organização» fica escondido mas continua a existir (o §52, o §74 e o __iprOrgAbrir abrem-no por clique); quando está
      aberto, o separador «Projectos» aparece seleccionado. Quem não pertence a uma organização não vê diferença.
   Desligar: localStorage ipr_juntar_off = 1 (ou ?juntar=0). Cada parte falha em silêncio. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]juntar=0\b/.test(location.search) || localStorage.getItem("ipr_juntar_off") === "1") return; } catch (e) {}
  if (W.__iprJuntar) return; W.__iprJuntar = 1;

  function en() { return W.IPR_LINGUA ? W.IPR_LINGUA !== "pt" : !/^pt/.test(D.documentElement.lang || "pt"); }
  var TX = {
    pt: { perfil: "Perfil", semPerfil: "Escolher perfil", perfilT: "Perfil de trabalho: põe o tema da sua função em primeiro lugar, liga as camadas e as ferramentas. Pode mudar quando quiser.", meus: "Os meus", org: "Organização", orgT: "Projectos e pastas da organização", meusT: "Os seus projectos e Bases" },
    en: { perfil: "Profile", semPerfil: "Choose a profile", perfilT: "Working profile: puts your role's theme first and turns on its layers and tools. You can change it at any time.", meus: "Mine", org: "Organisation", orgT: "Organisation projects and folders", meusT: "Your projects and Base Maps" }
  };
  function tx(k) { return TX[en() ? "en" : "pt"][k]; }
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  var st = D.createElement("style"); st.id = "ipr-juntar-css";
  st.textContent =
    // 1. Perfil
    "#ipr-79 .ipr-79-s,#ipr-79 .ipr-79-d{display:none!important}" +
    "#ipr-79{padding-top:4px!important}" +
    ".ipr-jp{position:relative;margin-left:auto;display:inline-flex}" +
    ".ipr-jp>button{font:500 11.5px Inter,sans-serif;border:1px solid var(--ln,#2c312a);background:transparent;color:var(--tx2,#cfd2c4);border-radius:99px;padding:3px 10px;min-height:26px;cursor:pointer;max-width:16em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    ".ipr-jp>button b{font-weight:600;color:var(--ac,#b5c46a)}" +
    ".ipr-jp ul{position:absolute;right:0;top:calc(100% + 4px);z-index:30;list-style:none;margin:0;padding:4px;min-width:13em;max-height:60vh;overflow:auto;border:1px solid var(--ln,#2c312a);border-radius:10px;background:var(--p1,#171b16);box-shadow:0 8px 24px rgba(0,0,0,.28)}" +
    ".ipr-jp li button{display:block;width:100%;text-align:left;font:13px Inter,sans-serif;border:0;background:transparent;color:var(--tx,#e9eadf);padding:7px 10px;border-radius:7px;cursor:pointer}" +
    ".ipr-jp li button:hover,.ipr-jp li button:focus-visible{background:var(--p3,rgba(127,127,127,.12))}.ipr-jp li button[aria-checked=true]{color:var(--ac,#b5c46a);font-weight:600}" +
    "#ipr-t62 .ipr-t62-cab{display:flex;align-items:center;gap:8px;flex-wrap:wrap}" +
    "#ipr-t62 [data-t62].ipr-jp-1{box-shadow:inset 0 0 0 1px var(--ac,#b5c46a)}" +
    // 2. Projectos + Organização
    ".ipr-po{display:none;flex:none;gap:6px;padding:8px 12px;border-bottom:1px solid var(--ln,#2c312a);background:var(--p1,transparent)}" +
    ".ipr-po.on{display:flex}" +
    ".ipr-po button{flex:1 1 0;min-width:0;font:500 12px Inter,sans-serif;border:1px solid var(--ln,#2c312a);background:transparent;color:var(--mu,#9aa08f);border-radius:99px;padding:5px 10px;min-height:30px;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    ".ipr-po button[aria-pressed=true]{color:var(--tx,#e9eadf);border-color:var(--ac,#b5c46a);background:var(--p3,rgba(127,127,127,.1))}" +
    "#ipe-tabs.ipr-po-junto .ipe-tab[data-tab=org]{display:none!important}" +
    "#ipe-tabs.ipr-po-org .ipe-tab[data-tab=proj]{color:var(--tx);border-bottom-color:var(--ac)}";
  (D.head || D.documentElement).appendChild(st);

  // ───────── 1. Perfil no cabeçalho dos Temas ─────────
  function sel() { return D.getElementById("ipr-perfis"); }
  function fecharMenu() { var u = D.querySelector(".ipr-jp ul"); if (u) u.remove(); var b = D.querySelector(".ipr-jp>button"); if (b) b.setAttribute("aria-expanded", "false"); }
  function abrirMenu(caixa) {
    var s = sel(); if (!s) return;
    if (caixa.querySelector("ul")) { fecharMenu(); return; }
    var ul = D.createElement("ul"); ul.setAttribute("role", "menu");
    ul.innerHTML = [].map.call(s.options, function (o) {
      return '<li role="none"><button type="button" role="menuitemradio" aria-checked="' + (o.value === s.value) + '" data-jp="' + esc(o.value) + '">' + esc(o.value ? o.textContent : tx("semPerfil")) + "</button></li>";
    }).join("");
    caixa.appendChild(ul); caixa.firstChild.setAttribute("aria-expanded", "true");
    var b0 = ul.querySelector('[aria-checked="true"]') || ul.querySelector("button"); if (b0) try { b0.focus(); } catch (e) {}
  }
  function escolher(v) {
    var s = sel(); if (!s) return; fecharMenu();
    var tb = D.querySelector(".ipr-jp>button"); if (tb) try { tb.focus(); } catch (e) {}
    if (s.value === v) return;
    s.value = v;
    try { s.dispatchEvent(new Event("change", { bubbles: true })); } catch (e) { var ev = D.createEvent("HTMLEvents"); ev.initEvent("change", true, false); s.dispatchEvent(ev); }
    pintarPerfil(true);
  }
  function rotulo() {
    var s = sel(); if (!s) return "";
    var o = s.options[s.selectedIndex];
    var seta = ' <span aria-hidden="true">▾</span>';
    return o && s.value ? esc(tx("perfil")) + ": <b>" + esc(o.textContent) + "</b>" + seta : esc(tx("semPerfil")) + seta;
  }
  function pintarPerfil(forcar) {
    var t62 = D.getElementById("ipr-t62"), s = sel(); if (!t62 || !s) return;
    var cab = t62.querySelector(".ipr-t62-cab"); if (!cab) return;
    var cx = cab.querySelector(".ipr-jp");
    if (!cx) {
      cx = D.createElement("span"); cx.className = "ipr-jp";
      cx.innerHTML = '<button type="button" aria-haspopup="menu" aria-expanded="false"></button>';
      cab.appendChild(cx);
    }
    var b = cx.firstChild, h = rotulo();
    if (forcar || b.__h !== h) { b.innerHTML = h; b.__h = h; b.title = tx("perfilT"); }
    // o tema do perfil em primeiro lugar
    var P = W.IPR_PERFIS && W.IPR_PERFIS[s.value], tema = P && P.tema;
    [].forEach.call(t62.querySelectorAll("[data-t62]"), function (x) {
      var eu = !!tema && x.getAttribute("data-t62") === tema;
      if (eu !== x.classList.contains("ipr-jp-1")) { x.classList.toggle("ipr-jp-1", eu); x.style.order = eu ? "-1" : ""; }
    });
    // o bloco antigo só fica quando tem ferramentas ou camadas do perfil
    var w = D.getElementById("ipr-79");
    if (w) {
      var c = w.querySelector(".ipr-79-c"), vazio = !c || !c.querySelector("button, input, details");
      if (vazio && w.style.display !== "none") w.style.setProperty("display", "none", "important");
      else if (!vazio && w.style.display === "none") w.style.removeProperty("display");
    }
  }
  D.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target : null; if (!t) return;
    var o = t.closest("[data-jp]"); if (o) { e.preventDefault(); e.stopPropagation(); escolher(o.getAttribute("data-jp")); return; }
    var b = t.closest(".ipr-jp>button"); if (b) { e.preventDefault(); e.stopPropagation(); abrirMenu(b.parentNode); return; }
    if (!t.closest(".ipr-jp")) fecharMenu();
  }, true);
  D.addEventListener("keydown", function (e) {
    if (!D.querySelector(".ipr-jp ul")) return;
    if (e.key === "Escape") { e.stopPropagation(); fecharMenu(); var b = D.querySelector(".ipr-jp>button"); if (b) try { b.focus(); } catch (x) {} return; }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      var l = [].slice.call(D.querySelectorAll(".ipr-jp ul button")), i = l.indexOf(D.activeElement);
      i = e.key === "ArrowDown" ? (i + 1) % l.length : (i <= 0 ? l.length - 1 : i - 1); e.preventDefault(); try { l[i].focus(); } catch (x) {}
    }
  }, true);
  D.addEventListener("focusin", function (e) { if (D.querySelector(".ipr-jp ul") && !(e.target.closest && e.target.closest(".ipr-jp"))) fecharMenu(); });
  // O §62 redesenha o #ipr-t62 (innerHTML) a cada clique num tema: repõe-se logo, sem esperar pelo intervalo.
  var obs62 = null;
  function vigiar62() { var t = D.getElementById("ipr-t62"); if (!t || t.__jp) return; t.__jp = 1; if (obs62) obs62.disconnect(); obs62 = new MutationObserver(function () { try { pintarPerfil(true); } catch (e) {} }); obs62.observe(t, { childList: true }); }

  // ───────── 2. Projectos e Organização num só separador ─────────
  function tabs() { return D.getElementById("ipe-tabs") || D.querySelector("#ipe .ipe-tabs"); }
  function tab(k) { var t = tabs(); return t && t.querySelector('.ipe-tab[data-tab="' + k + '"]'); }
  function aberto(k) { var x = tab(k); return !!x && (x.getAttribute("aria-selected") === "true" || x.classList.contains("on")); }
  function pintarProj() {
    var T = tabs(), tp = tab("proj"), to = tab("org"); if (!T) return;
    var junto = !!(tp && to);
    T.classList.toggle("ipr-po-junto", junto);
    var bar = D.querySelector(".ipr-po");
    if (!junto) { T.classList.remove("ipr-po-org"); if (bar) bar.classList.remove("on"); return; }
    if (!bar) {
      bar = D.createElement("div"); bar.className = "ipr-po"; bar.setAttribute("role", "group"); bar.setAttribute("aria-label", en() ? "Projects" : "Projectos");
      bar.innerHTML = '<button type="button" data-po="proj"></button><button type="button" data-po="org"></button>';
      bar.addEventListener("click", function (e) {
        var b = e.target.closest && e.target.closest("[data-po]"); if (!b) return;
        var k = b.getAttribute("data-po"), x = tab(k); if (x && !aberto(k)) x.click(); setTimeout(pintarProj, 30);
      });
    }
    if (bar.previousElementSibling !== T) T.parentNode.insertBefore(bar, T.nextSibling);
    var bp = bar.querySelector('[data-po="proj"]'), bo = bar.querySelector('[data-po="org"]');
    if (bp.textContent !== tx("meus")) { bp.textContent = tx("meus"); bp.title = tx("meusT"); bo.textContent = tx("org"); bo.title = tx("orgT"); }
    var ap = aberto("proj"), ao = aberto("org");
    bar.classList.toggle("on", ap || ao);
    bp.setAttribute("aria-pressed", String(ap)); bo.setAttribute("aria-pressed", String(ao));
    T.classList.toggle("ipr-po-org", ao);
  }

  function correr() { try { vigiar62(); } catch (e) {} try { pintarPerfil(false); } catch (e) {} try { pintarProj(); } catch (e) {} }
  D.addEventListener("ipr:lingua", function () { try { pintarPerfil(true); } catch (e) {} var b = D.querySelector(".ipr-po [data-po=proj]"); if (b) b.textContent = ""; correr(); });
  D.addEventListener("click", function (e) { if (e.target && e.target.closest && e.target.closest(".ipe-tab")) setTimeout(correr, 40); });
  setInterval(function () { if (!D.hidden) correr(); }, 1000);
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", correr); else correr();
})();
