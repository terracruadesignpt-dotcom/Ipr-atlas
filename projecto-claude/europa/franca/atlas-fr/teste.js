const { JSDOM } = require("jsdom"); const fs = require("fs");
const codigo = fs.readFileSync(__dirname + "/fr-camadas.js", "utf8");
let f = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? "ok    " : "FALHA ") + m); if (!c) f++; };
function mapa(c) { const m = { fontes: {}, cam: [], ev: {}, c };
  return Object.assign(m, { getStyle: () => ({ layers: m.cam.map(id => ({ id })) }), getSource: k => m.fontes[k], addSource: (k, s) => (m.fontes[k] = s),
    removeSource: k => delete m.fontes[k], getLayer: id => m.cam.includes(id), addLayer: l => m.cam.push(l.id), removeLayer: id => (m.cam = m.cam.filter(x => x !== id)),
    on: (e, fn) => (m.ev[e] = fn), getCenter: () => m.c }); }
async function cen(c, lang, ls) {
  const dom = new JSDOM('<body><div id="ipe-cam"><div class="ipr-g" data-g="fundo"></div></div></body>', { url: "https://terracruadesign.pt/atlas/", runScripts: "outside-only" });
  const w = dom.window; if (ls) w.localStorage.setItem("tcd_atlas_fr", ls); w.IPR_LANG = lang; const M = mapa(c); w.__ipe = { mapa: M };
  w.eval(codigo); await new Promise(r => setTimeout(r, 100)); return { w, d: w.document, M };
}
(async () => {
  let r = await cen({ lng: 0.95, lat: 45.05 });
  const D = r.w.__tcdFrCamadas.dentro;
  ok(D(2.35, 48.85) && D(0.95, 45.05) && D(5.37, 43.3) && D(7.75, 48.58) && D(-4.49, 48.39) && D(-1.55, 43.48), "Paris, Dordonha, Marselha, Estrasburgo, Brest, Biarritz em França");
  ok(D(9.15, 42.15) && D(8.74, 41.92), "Córsega (Corte, Ajaccio) em França");
  ok(!D(-3.7, 40.42) && !D(4.35, 50.85) && !D(8.55, 47.37) && !D(1.52, 42.51) && !D(7.42, 43.74) && !D(-9.14, 38.72), "Madrid, Bruxelas, Zurique, Andorra, Mónaco, Lisboa fora");
  const g = r.d.getElementById("tfr");
  ok(g && !g.hidden && r.d.getElementById("ipe-cam").firstElementChild === g, "grupo França visível na Dordonha, no topo das camadas");
  ok(/Ortofoto \(IGN\)/.test(g.textContent) && /Cadastro \(PCI\)/.test(g.textContent) && /Natura 2000, habitats/.test(g.textContent), "textos em português fora de /fr");
  const cb = g.querySelector('[data-tfr="fr-cadastro"]'); cb.checked = true; cb.dispatchEvent(new r.w.Event("change", { bubbles: true }));
  const u = r.M.fontes["fr-cadastro"] && r.M.fontes["fr-cadastro"].tiles[0];
  ok(u && /LAYER=CADASTRALPARCELS\.PARCELLAIRE_EXPRESS/.test(u) && /STYLE=PCI%20vecteur/.test(u) && /TILEMATRIXSET=PM/.test(u) && /\{z\}/.test(u), "cadastro em WMTS PM com o estilo PCI vecteur");
  ok(JSON.parse(r.w.localStorage.getItem("tcd_atlas_fr"))["fr-cadastro"] === 1, "escolha guardada");
  cb.checked = false; cb.dispatchEvent(new r.w.Event("change", { bubbles: true }));
  ok(!r.M.cam.includes("fr-cadastro") && !r.M.fontes["fr-cadastro"], "desligar remove camada e fonte");
  ok(r.w.__tcdFrCamadas.CAT.every(g2 => g2.itens.every(it => /^https:\/\/data\.geopf\.fr\/wmts\?/.test(it.url) && it.attr)), "todas as camadas são da Géoplateforme e têm atribuição");
  r.M.c = { lng: -3.7, lat: 40.4 }; r.M.ev.moveend(); ok(g.hidden, "em Madrid o grupo esconde-se");
  r = await cen({ lng: 2.35, lat: 48.85 }, "fr", '{"fr-ortho":1}');
  ok(/France/.test(r.d.getElementById("tfr").textContent) && /Cadastre \(parcelles\)/.test(r.d.getElementById("tfr").textContent) && /Contraintes/.test(r.d.getElementById("tfr").textContent), "textos em francês em /fr");
  ok(r.M.cam.includes("fr-ortho") && r.d.querySelector('[data-tfr="fr-ortho"]').checked, "repõe camadas guardadas ao abrir");
  r.M.cam = []; r.M.fontes = {}; r.M.ev.styledata(); await new Promise(z => setTimeout(z, 20)); ok(r.M.cam.includes("fr-ortho"), "volta a pôr as camadas depois de mudar o fundo");
  console.log(`\n${n} testes, ${f} falhas`); process.exit(f ? 1 : 0);
})();
