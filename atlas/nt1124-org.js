/* IPR Atlas · Atlas de uma organização (24/11/2026, 18h). Terracrua Design.
   Nuno (17h41 a 17h56): «quando eu estou com a organização Almeida Fernandes [...] devia aparecer as propriedades da Almeida
   Fernandes e mais nenhuma»; «gostava que ele abrisse [...] no último projecto [...] zoom in na propriedade»; «não quero esta cena
   de camadas de organização [...] Tira isto das camadas, sai fora. Aqui em cima, à esquerda, é para estar [...] o essencial,
   sempre»; «o filtrar bases e projectos não faz sentido para as outras organizações [...] nem aqueles separadores todos com
   pedidos, dias abertos [...] no meu Atlas é que vai ficar as propriedades [...] uma ficha de cada terreno, bem sintetizada, que
   aparece a imagem do terreno»; «isto aparece tudo ali dentro, não vai saltar um pop-up novo».
   Só corre com ?entidade= (window.IPR_ENTIDADE). Não edita outros ficheiros:
   1. Esconde o bloco «Camadas da organização» (#ipr-ent-esq) e desliga as camadas de licenciamento (o roxo do PDM); os limites
      das propriedades ficam ligados no mapa.
   2. Em «O meu Atlas» saem os filtros, contadores e a lista de todos os projectos; entram cartões das propriedades da
      organização (imagem de satélite com o limite, área, «Ver no mapa», «Ficha do terreno»).
   3. Separadores Gestão, Projecto e Cloud escondidos em modo organização.
   4. Ao entrar: abre «O meu Atlas» e aproxima à propriedade mais recente.
   5. A janela flutuante «Organização» passa para dentro do separador Organização do painel da direita.
   Desligar: ?orgatlas=0 ou localStorage ipr_orgatlas=0. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]orgatlas=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_orgatlas") === "0") return; } catch (e) {}
  if (W.__iprOrgAtlas) return; W.__iprOrgAtlas = 1;
  var ENT = W.IPR_ENTIDADE;
  if (!ENT || !ENT.id) return;
  D.documentElement.classList.add("ipr-org-modo");

  var CSS =
    "html.ipr-org-modo #ipr-ent-esq{display:none!important}" +
    "html.ipr-org-modo #ipe-tabs .ipe-tab[data-tab=rever],html.ipr-org-modo #ipe-tabs .ipe-tab[data-tab=iprproj],html.ipr-org-modo #ipe-tabs .ipe-tab[data-tab=cloud]{display:none!important}" +
    "html.ipr-org-modo .ipr-orgm-x{display:none!important}" +
    "#ipr-orgt{margin:14px 0 6px;display:flex;flex-direction:column;gap:10px}" +
    "#ipr-orgt h4{margin:0;font:500 10px 'Geist Mono',ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:#8d907f}" +
    "#ipr-orgt .vz{font-size:13px;color:#a9ab9c;line-height:1.5}" +
    "#ipr-orgt .ct{border:1px solid rgba(255,255,255,.08);border-radius:14px;overflow:hidden;background:rgba(255,255,255,.025)}" +
    "#ipr-orgt .im{position:relative;aspect-ratio:16/9;background:#1a2016;cursor:pointer}" +
    "#ipr-orgt .im img,#ipr-orgt .im svg{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:cover}" +
    "#ipr-orgt .tx{padding:10px 12px 12px;display:flex;flex-direction:column;gap:6px}" +
    "#ipr-orgt .tx b{font-weight:500;font-size:14px;color:#ecebe3;line-height:1.3}" +
    "#ipr-orgt .tx small{font-size:12px;color:#a9ab9c}" +
    "#ipr-orgt .bt{display:flex;flex-wrap:wrap;gap:6px;margin-top:2px}" +
    "#ipr-orgt .bt a,#ipr-orgt .bt button{font:500 12px Geist,Inter,system-ui,sans-serif;padding:6px 11px;border-radius:999px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#e6e4d9;cursor:pointer;text-decoration:none}" +
    "#ipr-orgt .bt .p{background:#94BE39;color:#11160d;border-color:#94BE39}" +
    "#ipr-orgdock{display:flex;flex-direction:column;gap:12px}";

  function mapa() { return W.__ipe && W.__ipe.mapa; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* --- 1. camadas da organização --- */
  var desligou = false;
  function camadas() {
    var og = D.querySelector("#ipr-ent-esq .ipr-ent-og"); if (!og) return [];
    var props = [], grupo = "", kids = og.children;
    for (var i = 0; i < kids.length; i++) {
      var k = kids[i];
      if (k.classList.contains("g")) { grupo = (k.textContent || "").toLowerCase(); continue; }
      var inp = k.querySelector && k.querySelector("input[data-ent-org]"); if (!inp) continue;
      var prop = /projecto|terreno|propriedade|limite/.test(grupo) && !/licenciamento|pdm|ren|ran|servid/.test(grupo);
      if (prop) {
        var nome = (k.querySelector("span") || k).textContent.replace(/\s*·\s*limite do projecto\s*$/i, "").trim();
        props.push({ id: inp.getAttribute("data-ent-org"), nome: nome, inp: inp });
        if (!inp.checked && !desligou) { inp.checked = true; inp.dispatchEvent(new Event("change", { bubbles: true })); }
      } else if (inp.checked && !desligou) {
        inp.checked = false; inp.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
    if (kids.length) desligou = true;
    return props;
  }

  /* --- geometria --- */
  function geo(id) {
    var M = mapa(); if (!M) return null;
    var s = M.getSource("ent-org-" + id); if (!s) return null;
    var d = s._data || (s.serialize && s.serialize().data); if (!d) return null;
    if (d.geojson) d = d.geojson;
    if (typeof d === "string") return null;
    var fs = d.type === "FeatureCollection" ? d.features : d.type === "Feature" ? [d] : [{ geometry: d }];
    var aneis = [];
    fs.forEach(function (f) {
      var g = f && f.geometry; if (!g) return;
      if (g.type === "Polygon") aneis.push(g.coordinates[0]);
      else if (g.type === "MultiPolygon") g.coordinates.forEach(function (p) { aneis.push(p[0]); });
    });
    if (!aneis.length) return null;
    var b = [180, 90, -180, -90], area = 0;
    aneis.forEach(function (r) {
      var lat0 = r[0][1] * Math.PI / 180, kx = 111320 * Math.cos(lat0), ky = 110540, a = 0;
      for (var i = 0; i < r.length; i++) {
        var p = r[i], q = r[(i + 1) % r.length];
        b[0] = Math.min(b[0], p[0]); b[1] = Math.min(b[1], p[1]); b[2] = Math.max(b[2], p[0]); b[3] = Math.max(b[3], p[1]);
        a += (p[0] * kx) * (q[1] * ky) - (q[0] * kx) * (p[1] * ky);
      }
      area += Math.abs(a) / 2;
    });
    return { aneis: aneis, b: b, ha: area / 10000 };
  }
  function merc(p) { var R = 6378137; return [R * p[0] * Math.PI / 180, R * Math.log(Math.tan(Math.PI / 4 + p[1] * Math.PI / 360))]; }
  function imagem(g) {
    var a = merc([g.b[0], g.b[1]]), c = merc([g.b[2], g.b[3]]);
    var w = c[0] - a[0], h = c[1] - a[1], cx = (a[0] + c[0]) / 2, cy = (a[1] + c[1]) / 2;
    w = Math.max(w * 1.35, 200); h = Math.max(h * 1.35, 120);
    if (w / h > 16 / 9) h = w * 9 / 16; else w = h * 16 / 9;
    var x0 = cx - w / 2, y0 = cy - h / 2, x1 = cx + w / 2, y1 = cy + h / 2;
    var url = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=" +
      [x0, y0, x1, y1].map(function (v) { return v.toFixed(1); }).join(",") + "&bboxSR=3857&imageSR=3857&size=640,360&format=jpg&f=image";
    var pts = g.aneis.map(function (r) {
      return r.map(function (p) { var m = merc(p); return (((m[0] - x0) / w) * 640).toFixed(1) + "," + (((y1 - m[1]) / h) * 360).toFixed(1); }).join(" ");
    });
    return '<img loading="lazy" alt="" src="' + url + '">' +
      '<svg viewBox="0 0 640 360" preserveAspectRatio="none" aria-hidden="true">' +
      pts.map(function (s) { return '<polygon points="' + s + '" fill="rgba(148,190,57,.14)" stroke="#c6e86f" stroke-width="2.5" stroke-linejoin="round"/>'; }).join("") + "</svg>";
  }
  function fichaUrl(g) {
    var r = g.aneis[0], passo = Math.max(1, Math.ceil(r.length / 400)), t = [];
    for (var i = 0; i < r.length; i += passo) t.push(r[i][0].toFixed(6) + "," + r[i][1].toFixed(6));
    try { return "/atlas/?ficha=" + encodeURIComponent(btoa(t.join(" "))); } catch (e) { return "/atlas/"; }
  }
  function voar(g, id) {
    var M = mapa(); if (!M || !g) return;
    var esq = D.getElementById("ipe-esq"), dir = D.getElementById("ipe-dir");
    var pl = esq ? Math.round(esq.getBoundingClientRect().right) + 40 : 60;
    var pr = dir ? Math.round(W.innerWidth - dir.getBoundingClientRect().left) + 40 : 60;
    try { M.fitBounds([[g.b[0], g.b[1]], [g.b[2], g.b[3]]], { padding: { top: 140, bottom: 80, left: pl, right: pr }, maxZoom: 17, duration: 900 }); } catch (e) {}
  }

  /* --- 2. O meu Atlas --- */
  var desenhados = "";
  function meuAtlas(props) {
    var sep = D.getElementById("ipr-sep-meu"); if (!sep) return;
    var pane = sep.parentElement;
    [].forEach.call(pane.children, function (e) {
      if (e === sep || e.id === "ipr-orgt") return;
      if (/^(ipr-rb|ipr-sint|ipr-demo|ipr-ac-|ipr-bt-f|ipr-pg-f|ipr-px-f|ipe-proj)/.test(e.id || "")) e.classList.add("ipr-orgm-x");
    });
    var box = D.getElementById("ipr-orgt");
    if (!box) { box = D.createElement("div"); box.id = "ipr-orgt"; sep.parentNode.insertBefore(box, sep.nextSibling); }
    var gs = props.map(function (p) { return { p: p, g: geo(p.id) }; });
    var chave = gs.map(function (x) { return x.p.id + (x.g ? "g" : ""); }).join("|");
    if (chave === desenhados) return gs;
    desenhados = chave;
    var h = "<h4>Propriedades · " + esc(ENT.nome || ENT.id) + "</h4>";
    if (!props.length) h += '<div class="vz">Ainda não há propriedades com limite nesta organização. Desenhe ou carregue o limite em «Os nossos locais e projectos», no separador Organização.</div>';
    gs.slice().sort(function (a, b) { return +b.p.id - +a.p.id; }).forEach(function (x) {
      var g = x.g;
      h += '<div class="ct" data-orgt="' + esc(x.p.id) + '"><div class="im" data-orgt-ir="' + esc(x.p.id) + '" title="Ver no mapa">' + (g ? imagem(g) : "") + "</div>" +
        '<div class="tx"><b>' + esc(x.p.nome) + "</b><small>" + (g ? (g.ha >= 10 ? Math.round(g.ha) : g.ha.toFixed(1)).toString().replace(".", ",") + " ha" : "a carregar o limite…") + "</small>" +
        '<div class="bt"><button type="button" class="p" data-orgt-ir="' + esc(x.p.id) + '">Ver no mapa</button>' +
        (g ? '<a href="' + fichaUrl(g) + '">Ficha do terreno</a>' : "") + "</div></div></div>";
    });
    box.innerHTML = h;
    return gs;
  }

  /* --- 5. janela «Organização» para dentro do separador --- */
  function janela() {
    var cands = D.querySelectorAll("body > div, #ipe > div, #ipe-mapa > div");
    for (var i = 0; i < cands.length; i++) {
      var e = cands[i];
      if (e.id === "ipr-orgdock" || !e.getClientRects().length) continue;
      var cab = e.firstElementChild; if (!cab) continue;
      var t = (cab.textContent || "").replace(/[×✕]/g, "").trim();
      if (t !== "Organização" && t !== "Organization") continue;
      var st = W.getComputedStyle(e).position; if (st !== "fixed" && st !== "absolute") continue;
      var tab = D.querySelector('#ipe-tabs .ipe-tab[data-tab="org"]'); if (!tab) return;
      tab.click();
      var pane = [].filter.call(D.querySelectorAll("#ipe-corpo > .ipe-pane"), function (p) { return p.getClientRects().length; })[0];
      if (!pane) return;
      var dock = D.getElementById("ipr-orgdock");
      if (!dock) { dock = D.createElement("div"); dock.id = "ipr-orgdock"; pane.insertBefore(dock, pane.firstChild); }
      dock.innerHTML = "";
      var corpo = [].slice.call(e.children, 1);
      corpo.forEach(function (c) { dock.appendChild(c); });
      [].forEach.call(dock.querySelectorAll("h1,h2,h3,h4,h5,h6,b,strong,div"), function (hh) {
        if (hh.children.length === 0 && /^(Ferramentas|Tools)$/i.test((hh.textContent || "").trim())) {
          var s = hh; while (s.parentElement && s.parentElement !== dock && s.parentElement.children.length === 1) s = s.parentElement;
          s.classList.add("ipr-orgm-x");
          var n = s.nextElementSibling; for (var j = 0; j < 3 && n; j++) { if (/Desenhar|Medir|Notas no mapa/.test(n.textContent || "")) n.classList.add("ipr-orgm-x"); n = n.nextElementSibling; }
        }
      });
      e.style.display = "none";
    }
  }

  var abriu = false;
  function correr() {
    if (!D.getElementById("ipr-orgatlas-css") && D.head) { var s = D.createElement("style"); s.id = "ipr-orgatlas-css"; s.textContent = CSS; D.head.appendChild(s); }
    var props = camadas();
    var gs = meuAtlas(props) || [];
    try { janela(); } catch (e) {}
    if (!abriu && gs.length) {
      var ult = gs.slice().sort(function (a, b) { return +b.p.id - +a.p.id; })[0];
      if (ult && ult.g) {
        abriu = true;
        var k = "ipr_orgatlas_ab_" + ENT.id, ja = false;
        try { ja = W.sessionStorage.getItem(k) === "1"; W.sessionStorage.setItem(k, "1"); } catch (e) {}
        if (!ja && !/[?&](ficha|q|ll|lote|trabalho_ir)=/.test(location.search)) {
          var tb = D.querySelector('#ipe-tabs .ipe-tab[data-tab="proj"]'); if (tb) tb.click();
          setTimeout(function () { voar(ult.g, ult.p.id); }, 400);
        }
      }
    }
  }
  D.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-orgt-ir]"); if (!b) return;
    var id = b.getAttribute("data-orgt-ir"); voar(geo(id), id);
  });
  (function vez(n) { try { correr(); } catch (e) {} if (n < 80) setTimeout(function () { vez(n + 1); }, n < 20 ? 500 : 1500); })(0);
  setInterval(function () { try { correr(); } catch (e) {} }, 4000);
})();
