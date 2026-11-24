/* IPR Atlas · Atlas de uma organização (24/11/2026, 18h). Terracrua Design.
   Nuno (17h41 a 17h56): «quando eu estou com a organização Almeida Fernandes [...] devia aparecer as propriedades da Almeida
   Fernandes e mais nenhuma»; «gostava que ele abrisse [...] no último projecto [...] zoom in na propriedade»; «não quero esta cena
   de camadas de organização [...] Tira isto das camadas, sai fora. Aqui em cima, à esquerda, é para estar [...] o essencial,
   sempre»; «o filtrar bases e projectos não faz sentido para as outras organizações [...] nem aqueles separadores todos com
   pedidos, dias abertos [...] no meu Atlas é que vai ficar as propriedades [...] uma ficha de cada terreno, bem sintetizada, que
   aparece a imagem do terreno»; «isto aparece tudo ali dentro, não vai saltar um pop-up novo».
   Só corre com ?entidade= (window.IPR_ENTIDADE). Não edita outros ficheiros; tem de carregar antes do entidade.js:
   1. Esconde o bloco «Camadas da organização» (#ipr-ent-esq). As camadas de licenciamento (o roxo do PDM, centenas de
      polígonos que prendiam o navegador) não chegam a ser carregadas; os limites das propriedades ficam ligados no mapa.
   2. Em «O meu Atlas» saem os filtros, contadores e a lista de todos os projectos; entram cartões das propriedades da
      organização (imagem de satélite com o limite, área, «Ver no mapa», «Ficha do terreno»).
   3. Separadores Gestão, Projecto e Cloud escondidos em modo organização.
   4. Ao entrar: abre «O meu Atlas» e aproxima à propriedade mais recente.
   5. O painel «Organização» (entidade.js) deixa de tapar os separadores: só aparece no separador Organização, por baixo
      deles, sem o bloco «Ferramentas» (repetido nos menus Analisar, Desenhar e Recolher).
   Desligar: ?orgatlas=0 ou localStorage ipr_orgatlas=0. */
(function () {
  "use strict";
  var W = window, D = document;
  try { if (/[?&]orgatlas=0(&|$)/.test(location.search) || W.localStorage.getItem("ipr_orgatlas") === "0") return; } catch (e) {}
  if (W.__iprOrgAtlas) return; W.__iprOrgAtlas = 1;
  var ENT = W.IPR_ENTIDADE;
  if (!ENT || !ENT.id) return;
  D.documentElement.classList.add("ipr-org-modo");

  /* O entidade.js pede logo todas as camadas da organização. As de licenciamento (PDM inteiro de um concelho, centenas de
     polígonos) prendiam o navegador e pintavam o mapa de roxo. Em modo organização vêm vazias; o resto fica igual. */
  var LIC = {};
  function eLic(c, grupos) {
    var g = ((grupos || []).filter(function (x) { return x.id === c.grupo; })[0] || {});
    return c.grupo === "licenc" || /licenciamento|\bpdm\b|\bren\b|\bran\b|servid/i.test((g.nome || "") + " " + (c.nome || ""));
  }
  if (W.fetch && !W.__iprOrgFetch) {
    W.__iprOrgFetch = 1;
    var F0 = W.fetch;
    W.fetch = function (u, o) {
      var url = typeof u === "string" ? u : (u && u.url) || "";
      var m = /\/tcd\/v1\/org\/camada\/(\d+)(?:[?#]|$)/.exec(url);
      if (m && LIC[m[1]]) return Promise.resolve(new Response('{"type":"FeatureCollection","features":[]}', { status: 200, headers: { "Content-Type": "application/json" } }));
      var pr = F0.apply(this, arguments);
      if (/\/tcd\/v1\/org\/camadas(?:[?#]|$)/.test(url)) {
        pr.then(function (r) { return r.clone().json(); }).then(function (d) {
          (d && d.camadas || []).forEach(function (c) { if (eLic(c, d.grupos)) LIC[String(c.id)] = 1; });
        }).catch(function () {});
      }
      return pr;
    };
  }

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
    "html.ipr-org-modo #ipr-ent-dir.dentro{top:var(--ipr-tabs-h,48px)!important;border-left:0!important;background:transparent!important}" +
    "html.ipr-org-modo:not(.ipr-tab-org) #ipr-ent-dir{display:none!important}" +
    "html.ipr-org-modo #ipr-ent-dir.dentro>.h{display:none!important}" +
    "html.ipr-org-modo.ipr-tab-org #ipr-ent-dir.fechado{display:none!important}";

  function mapa() { return W.__ipe && W.__ipe.mapa; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* --- 1. camadas da organização (lidas do mesmo pedido que o entidade.js faz) --- */
  var ORGD = null, GJ = {}, pedido = false;
  function carregar() {
    if (pedido || !ENT.nonce) return; pedido = true;
    fetch("/wp-json/tcd/v1/org/camadas", { credentials: "same-origin", headers: { "X-WP-Nonce": ENT.nonce } })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var eo = W.IPR_ENT_ORG && +W.IPR_ENT_ORG.org;
        if (!d || !d.org || (eo && +d.org.id !== eo)) { setTimeout(function () { pedido = false; }, 8000); return; }
        ORGD = d;
        (d.camadas || []).forEach(function (c) { if (eLic(c, d.grupos)) LIC[String(c.id)] = 1; });
        props().forEach(function (c) {
          if (!c.url) return;
          fetch(c.url, { credentials: "same-origin" }).then(function (r) { return r.json(); }).then(function (gj) { GJ[c.id] = gj; desenhados = null; correr(); }).catch(function () {});
        });
        correr();
      }).catch(function () { setTimeout(function () { pedido = false; }, 8000); });
  }
  function eProp(c) {
    var g = ((ORGD.grupos || []).filter(function (x) { return x.id === c.grupo; })[0] || {}).nome || "";
    return /projecto|terreno|propriedade|quinta|herdade/i.test(g + " " + (c.nome || "")) && !/licenciamento|pdm|\bren\b|\bran\b|servid/i.test(g + " " + (c.nome || ""));
  }
  function props() {
    if (!ORGD) return [];
    return (ORGD.camadas || []).filter(eProp).map(function (c) {
      return { id: String(c.id), nome: String(c.nome || "").replace(/\s*·\s*limite do projecto\s*$/i, "").trim(), url: c.url, bbox: c.bbox, ha: c.ha };
    });
  }
  function semLicenciamento() {
    var M = mapa(); if (!M || !ORGD) return;
    (ORGD.camadas || []).forEach(function (c) {
      if (eProp(c)) return;
      ["-f", "-l", "-p", "-s"].forEach(function (k) { var id = "ent-org-" + c.id + k; try { if (M.getLayer(id) && M.getLayoutProperty(id, "visibility") !== "none") M.setLayoutProperty(id, "visibility", "none"); } catch (e) {} });
      var inp = D.querySelector('#ipr-ent-esq input[data-ent-org="' + c.id + '"]'); if (inp && inp.checked) inp.checked = false;
    });
  }

  /* --- geometria --- */
  function geo(id) {
    var d = GJ[id];
    if (!d) {
      var M = mapa(), so = M && M.getSource("ent-org-" + id);
      if (!so) {
        var c = props().filter(function (x) { return x.id === String(id); })[0];
        return c && c.bbox && c.bbox.length === 4 ? { aneis: [], b: c.bbox, ha: +c.ha || 0 } : null;
      }
      d = so._data || (so.serialize && so.serialize().data); if (!d) return null;
      if (d.geojson) d = d.geojson;
    }
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
  var desenhados = null;
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
    var chave = gs.map(function (x) { return x.p.id + (x.g ? "g" + x.g.aneis.length : ""); }).join("|");
    if (chave === desenhados) return gs;
    desenhados = chave;
    var h = "<h4>Propriedades · " + esc(ENT.nome || ENT.id) + "</h4>";
    if (!props.length) h += '<div class="vz">Ainda não há propriedades com limite nesta organização. Desenhe ou carregue o limite em «Os nossos locais e projectos», no separador Organização.</div>';
    gs.slice().sort(function (a, b) { return +b.p.id - +a.p.id; }).forEach(function (x) {
      var g = x.g;
      h += '<div class="ct" data-orgt="' + esc(x.p.id) + '"><div class="im" data-orgt-ir="' + esc(x.p.id) + '" title="Ver no mapa">' + (g ? imagem(g) : "") + "</div>" +
        '<div class="tx"><b>' + esc(x.p.nome) + "</b><small>" + (g ? (g.ha >= 10 ? Math.round(g.ha) : g.ha.toFixed(1)).toString().replace(".", ",") + " ha" : "a carregar o limite…") + "</small>" +
        '<div class="bt"><button type="button" class="p" data-orgt-ir="' + esc(x.p.id) + '">Ver no mapa</button>' +
        (g && g.aneis.length ? '<a href="' + fichaUrl(g) + '">Ficha do terreno</a>' : "") + "</div></div></div>";
    });
    box.innerHTML = h;
    return gs;
  }

  /* --- 5. o painel «Organização» (entidade.js, #ipr-ent-dir) fica dentro do separador Organização, por baixo dos separadores --- */
  function painelOrg() {
    var dir = D.getElementById("ipe-dir"), tabs = D.getElementById("ipe-tabs"), p = D.getElementById("ipr-ent-dir");
    if (dir && tabs) { var t = tabs.getBoundingClientRect().bottom - dir.getBoundingClientRect().top; if (t > 0) dir.style.setProperty("--ipr-tabs-h", Math.round(t) + "px"); }
    var sel = D.querySelector('#ipe-tabs .ipe-tab[aria-selected="true"]');
    D.documentElement.classList.toggle("ipr-tab-org", !!(sel && sel.getAttribute("data-tab") === "org"));
    if (!p) return;
    if (D.documentElement.classList.contains("ipr-tab-org") && p.classList.contains("fechado")) { var fx = p.querySelector('[data-ent="fechar"]'); if (fx) fx.click(); }
    [].forEach.call(p.querySelectorAll(".sec"), function (sc) {
      var tt = sc.querySelector(".t"); if (tt && /^(Ferramentas|Tools)$/i.test(tt.textContent.trim())) sc.classList.add("ipr-orgm-x");
    });
  }

  var abriu = false;
  function correr() {
    if (!D.getElementById("ipr-orgatlas-css") && D.head) { var s = D.createElement("style"); s.id = "ipr-orgatlas-css"; s.textContent = CSS; D.head.appendChild(s); }
    carregar(); semLicenciamento();
    var gs = meuAtlas(props()) || [];
    try { painelOrg(); } catch (e) {}
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
    if (e.target.closest && e.target.closest("#ipe-tabs")) setTimeout(function () { try { painelOrg(); } catch (x) {} }, 30);
    var b = e.target.closest && e.target.closest("[data-orgt-ir]"); if (!b) return;
    var id = b.getAttribute("data-orgt-ir"); voar(geo(id), id);
  });
  (function vez(n) { try { correr(); } catch (e) {} if (n < 80) setTimeout(function () { vez(n + 1); }, n < 20 ? 500 : 1500); })(0);
  setInterval(function () { try { correr(); } catch (e) {} }, 4000);
})();
