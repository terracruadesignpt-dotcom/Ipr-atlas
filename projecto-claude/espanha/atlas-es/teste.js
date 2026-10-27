const { JSDOM } = require("jsdom"); const fs = require("fs");
const codigo = fs.readFileSync(__dirname + "/es-camadas.js", "utf8");
let f = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? "ok    " : "FALHA ") + m); if (!c) f++; };
function mapa(c) { const m = { fontes: {}, cam: [], ev: {}, c };
  return Object.assign(m, { getStyle: () => ({ layers: m.cam.map(id => ({ id })) }), getSource: k => m.fontes[k], addSource: (k, s) => (m.fontes[k] = s),
    removeSource: k => delete m.fontes[k], getLayer: id => m.cam.includes(id), addLayer: l => m.cam.push(l.id), removeLayer: id => (m.cam = m.cam.filter(x => x !== id)),
    on: (e, fn) => (m.ev[e] = fn), getCenter: () => m.c }); }
async function cen(c, lang, ls) {
  const dom = new JSDOM('<body><div id="ipe-cam"><div class="ipr-g" data-g="fundo"></div></div></body>', { url: "https://terracruadesign.pt/atlas/", runScripts: "outside-only" });
  const w = dom.window; if (ls) w.localStorage.setItem("tcd_atlas_es", ls); w.IPR_LANG = lang; const M = mapa(c); w.__ipe = { mapa: M };
  w.eval(codigo); await new Promise(r => setTimeout(r, 100)); return { w, d: w.document, M };
}
(async () => {
  let r = await cen({ lng: -6.97, lat: 38.88 });
  const D = r.w.__tcdEsCamadas.dentro;
  ok(D(-6.97, 38.88) && D(-3.70, 40.42) && D(-5.98, 37.39) && D(2.17, 41.39) && D(2.65, 39.57), "Badajoz, Madrid, Sevilha, Barcelona, Palma em Espanha");
  ok(!D(-9.14, 38.72) && !D(-7.93, 37.02) && !D(-8.61, 41.15) && !D(2.35, 48.85) && !D(1.52, 42.51), "Lisboa, Faro, Porto, Paris, Andorra fora");
  const g = r.d.getElementById("tes");
  ok(g && !g.hidden && r.d.getElementById("ipe-cam").firstElementChild === g, "grupo Espanha visível em Badajoz, no topo das camadas");
  ok(/Ortofoto PNOA/.test(g.textContent) && /Cadastro \(Catastro\)/.test(g.textContent) && /Rede Natura 2000/.test(g.textContent), "textos em português fora de /es");
  const cb = g.querySelector('[data-tes="es-catastro"]'); cb.checked = true; cb.dispatchEvent(new r.w.Event("change", { bubbles: true }));
  ok(r.M.fontes["es-catastro"] && r.M.cam.includes("es-catastro") && /CP\.CadastralParcel/.test(r.M.fontes["es-catastro"].tiles[0]) && /bbox-epsg-3857/.test(r.M.fontes["es-catastro"].tiles[0]), "ligar Catastro cria fonte WMS em 3857");
  ok(JSON.parse(r.w.localStorage.getItem("tcd_atlas_es"))["es-catastro"] === 1, "escolha guardada");
  const sg = g.querySelector('[data-tes="es-sigpac"]'); sg.checked = true; sg.dispatchEvent(new r.w.Event("change", { bubbles: true }));
  ok(r.M.cam.includes("es-sigpac-f") && r.M.cam.includes("es-sigpac-l") && r.M.fontes["es-sigpac"].type === "vector", "SIGPAC como vector com preenchimento e linha");
  cb.checked = false; cb.dispatchEvent(new r.w.Event("change", { bubbles: true }));
  ok(!r.M.cam.includes("es-catastro") && !r.M.fontes["es-catastro"], "desligar remove camada e fonte");
  r.M.c = { lng: -9.14, lat: 38.72 }; r.M.ev.moveend(); ok(g.hidden, "em Lisboa o grupo esconde-se");
  r = await cen({ lng: -3.7, lat: 40.4 }, "es", '{"es-pnoa":1}');
  ok(/España/.test(r.d.getElementById("tes").textContent) && /Catastro \(parcelas\)/.test(r.d.getElementById("tes").textContent), "textos em castelhano em /es");
  ok(r.M.cam.includes("es-pnoa") && r.d.querySelector('[data-tes="es-pnoa"]').checked, "repõe camadas guardadas ao abrir");
  r.M.cam = []; r.M.fontes = {}; r.M.ev.styledata(); await new Promise(z => setTimeout(z, 20)); ok(r.M.cam.includes("es-pnoa"), "volta a pôr as camadas depois de mudar o fundo");
  console.log(`\n${n} testes, ${f} falhas`); process.exit(f ? 1 : 0);
})();
