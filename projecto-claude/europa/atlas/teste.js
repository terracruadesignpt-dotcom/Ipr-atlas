const { JSDOM } = require("jsdom"); const fs = require("fs");
const codigo = fs.readFileSync(__dirname + "/eu-camadas.js", "utf8");
let f = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? "ok    " : "FALHA ") + m); if (!c) f++; };
function mapa(c) { const m = { fontes: {}, cam: [], ev: {}, c };
  return Object.assign(m, { getStyle: () => ({ layers: m.cam.map(id => ({ id })) }), getSource: k => m.fontes[k], addSource: (k, s) => (m.fontes[k] = s),
    removeSource: k => delete m.fontes[k], getLayer: id => m.cam.includes(id), addLayer: l => m.cam.push(l.id), removeLayer: id => (m.cam = m.cam.filter(x => x !== id)),
    on: (e, fn) => (m.ev[e] = fn), getCenter: () => m.c }); }
async function cen(c, lang, ls) {
  const dom = new JSDOM('<body><div id="ipe-cam"><div class="ipr-g" data-g="fundo"></div></div></body>', { url: "https://terracruadesign.pt/atlas/", runScripts: "outside-only" });
  const w = dom.window; if (ls) w.localStorage.setItem("tcd_atlas_eu", ls); w.IPR_LANG = lang; const M = mapa(c); w.__ipe = { mapa: M };
  w.eval(codigo); await new Promise(r => setTimeout(r, 100)); return { w, d: w.document, M };
}
(async () => {
  let r = await cen({ lng: 15.44, lat: 47.07 });
  const P = r.w.__tcdEuCamadas.pais;
  const casos = { AT: [15.44, 47.07], CH: [7.44, 46.95], NL: [5.12, 52.09], BE: [4.87, 50.47], LU: [6.13, 49.61], DE: [11.57, 48.14], GB: [-1.26, 51.75],
    IE: [-8.47, 51.9], IT: [11.25, 43.77], PL: [21.01, 52.23], CZ: [14.42, 50.08], DK: [9.92, 57.05], SE: [18.06, 59.33], NO: [10.75, 59.91], FI: [24.94, 60.17], GR: [22.94, 40.64], HR: [15.98, 45.81] };
  let certos = Object.entries(casos).filter(([cc, p]) => P(p[0], p[1]) === cc).length;
  ok(certos === 17, "17 capitais/cidades no país certo (" + certos + ")");
  ok(P(-9.14, 38.72) === "" && P(-3.7, 40.42) === "" && P(2.35, 48.85) === "" && P(-7.93, 37.02) === "", "Lisboa, Madrid, Paris, Faro fora do catálogo (têm grupo próprio)");
  ok(P(9.52, 47.14) === "CH", "Liechtenstein no grupo da Suíça");
  const g = r.d.getElementById("teu");
  ok(g && !g.hidden && /Áustria/.test(g.textContent) && /Cadastro \(DKM, BEV\)/.test(g.textContent) && /Rede Natura 2000/.test(g.textContent), "Graz: grupo Áustria em português com Natura");
  const cb = g.querySelector('[data-teu="at-dkm"]'); cb.checked = true; cb.dispatchEvent(new r.w.Event("change", { bubbles: true }));
  ok(r.M.fontes["at-dkm"] && /DKM_GST/.test(r.M.fontes["at-dkm"].tiles[0]) && /bbox-epsg-3857/.test(r.M.fontes["at-dkm"].tiles[0]) && r.M.fontes["at-dkm"].attribution === "© BEV, CC BY 4.0", "ligar DKM cria WMS 3857 com atribuição");
  ok(JSON.parse(r.w.localStorage.getItem("tcd_atlas_eu"))["at-dkm"] === 1, "escolha guardada");
  r.M.c = { lng: 4.4, lat: 51.2 }; r.M.ev.moveend();
  ok(/Bélgica/.test(g.textContent) && g.querySelector('[data-teu="vl-orto"]') && !g.querySelector('[data-teu="at-dkm"]'), "ao passar para Antuérpia o grupo muda para a Bélgica");
  ok(r.M.cam.includes("at-dkm"), "camada ligada noutro país continua no mapa até a pessoa a desligar");
  r.M.c = { lng: -9.14, lat: 38.72 }; r.M.ev.moveend(); ok(g.hidden, "em Lisboa o grupo esconde-se");
  r.M.c = { lng: 24.94, lat: 60.17 }; r.M.ev.moveend(); ok(!g.hidden && /Finlândia/.test(g.textContent) && g.querySelectorAll("[data-teu]").length === 2, "Helsínquia: só as camadas europeias (as finlandesas precisam de chave)");
  const all = []; Object.keys(r.w.__tcdEuCamadas.CAT).forEach(cc => r.w.__tcdEuCamadas.itens(cc).forEach(i => all.push(i)));
  ok(all.every(i => /^https:\/\//.test(i.url) && i.attr && i.attr.length > 3), "todas as fontes em https e com atribuição");
  const ids = new Set(); let dup = false; Object.values(r.w.__tcdEuCamadas.CAT).forEach(gs => gs.forEach(gg => gg[1].forEach(i => { if (ids.has(i.id)) dup = true; ids.add(i.id); })));
  ok(!dup, "identificadores únicos");
  r = await cen({ lng: 7.44, lat: 46.95 }, "es", '{"ch-orto":1}');
  ok(/Suiza y Liechtenstein/.test(r.d.getElementById("teu").textContent) && r.M.cam.includes("ch-orto"), "castelhano em /es e repõe camadas guardadas");
  r.M.cam = []; r.M.fontes = {}; r.M.ev.styledata(); await new Promise(z => setTimeout(z, 20)); ok(r.M.cam.includes("ch-orto"), "volta a pôr as camadas depois de mudar o fundo");
  r = await cen({ lng: 21.01, lat: 52.23 }, "en"); ok(/Poland/.test(r.d.getElementById("teu").textContent) && /Cadastre \(parcels, KIEG\)/.test(r.d.getElementById("teu").textContent), "inglês nas outras línguas");
  console.log(`\n${n} testes, ${f} falhas`); process.exit(f ? 1 : 0);
})();
