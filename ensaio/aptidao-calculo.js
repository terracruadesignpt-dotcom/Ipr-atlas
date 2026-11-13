window.__APT = {estado: "a começar"};
(async () => {
  const T = turf, ST = window.__APT;
  const R = "https://sniambgeoogc.apambiente.pt/getogc/rest/services/", I = "https://sigservices.icnf.pt/server/rest/services/BDG/";
  const passo = (s) => { ST.estado = s; };
  async function q(url, fields, off) {
    let feats = [], o = 0;
    for (let k = 0; k < 40; k++) {
      const u = url + "/query?where=1%3D1&outFields=" + fields + "&returnGeometry=true&outSR=4326&f=geojson&maxAllowableOffset=" + off + "&resultOffset=" + o + "&resultRecordCount=1000";
      const j = await fetch(u).then(r => r.json());
      const fs = j.features || []; feats = feats.concat(fs);
      if (!fs.length || (fs.length < 1000 && !j.exceededTransferLimit && !(j.properties && j.properties.exceededTransferLimit))) break;
      o += fs.length;
    }
    return feats.filter(f => f.geometry);
  }
  function indice(fs) {
    const B = {}, it = fs.map(f => ({f, b: T.bbox(f)}));
    it.forEach(o => { for (let x = Math.floor(o.b[0] * 10); x <= Math.floor(o.b[2] * 10); x++) for (let y = Math.floor(o.b[1] * 10); y <= Math.floor(o.b[3] * 10); y++) (B[x + "_" + y] = B[x + "_" + y] || []).push(o); });
    return p => { const l = B[Math.floor(p[0] * 10) + "_" + Math.floor(p[1] * 10)] || []; for (const o of l) { if (p[0] < o.b[0] || p[0] > o.b[2] || p[1] < o.b[1] || p[1] > o.b[3]) continue; if (T.booleanPointInPolygon(p, o.f)) return o.f; } return null; };
  }
  const km = (a, b) => { const kx = 111.32 * Math.cos((a[1] + b[1]) / 2 * Math.PI / 180), dx = (a[0] - b[0]) * kx, dy = (a[1] - b[1]) * 110.574; return Math.sqrt(dx * dx + dy * dy); };
  function perto(pts) { // grelha de 0,5° para pontos
    const B = {}; pts.forEach(p => { const k = Math.floor(p[0] * 2) + "_" + Math.floor(p[1] * 2); (B[k] = B[k] || []).push(p); });
    return (p, r) => { const out = [], n = Math.ceil(r / 40) + 1, cx = Math.floor(p[0] * 2), cy = Math.floor(p[1] * 2); for (let x = cx - n; x <= cx + n; x++) for (let y = cy - n; y <= cy + n; y++) (B[x + "_" + y] || []).forEach(q => { const d = km(p, q); if (d <= r) out.push([q, d]); }); return out; };
  }
  try {
    passo("concelhos e população");
    const conc = await fetch("https://raw.githubusercontent.com/mopanc/gov-analytics/HEAD/apps/web/public/concelhos.geojson").then(r => r.json());
    const csv = await fetch("https://raw.githubusercontent.com/httpirsh/miacd-tad-data-warehouse/HEAD/data/populacao_municipios_2014_2024.csv").then(r => r.text());
    const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
    const POP = {}; let anoMax = 0;
    csv.replace(/^﻿/, "").split(/\r?\n/).slice(1).forEach(l => { const v = l.split(","); if (v.length < 6) return; const a = +v[0]; if (a > anoMax) anoMax = a; });
    csv.replace(/^﻿/, "").split(/\r?\n/).slice(1).forEach(l => { const v = l.split(","); if (+v[0] === anoMax) POP[norm(v[1])] = +v[v.length - 1]; });
    const CONC = conc.features.map((f, i) => { const nome = f.properties.municipality; const a = T.area(f) / 1e6; const c = T.centroid(f).geometry.coordinates; const p = POP[norm(nome)] || null; return {i, nome, dist: f.properties.district, area: a, c, pop: p, dens: p ? p / a : null, f}; });
    ST.semPop = CONC.filter(c => !c.pop).map(c => c.nome);
    const naConc = indice(conc.features.map((f, i) => (f.properties.__i = i, f)));
    passo("solos (SROA)");
    const sroa = indice(await q(R + "Atlas/Atlas_Ambiente/MapServer/31", "classe", 0.002));
    passo("carbono orgânico");
    const carb = indice(await q(I + "CO2_organico_solo/MapServer/0", "gridcode", 0.002));
    passo("nitratos");
    const zvn = indice(await q(R + "SNIAmb/Nitratos_ZnVulneraveis/MapServer/0", "objectid", 0.001));
    passo("precipitação");
    const prec = indice(await q(R + "Atlas/Atlas_Ambiente/MapServer/4", "codpret", 0.002));
    passo("hidrogeologia");
    const hid = indice(await q(R + "SNIAmb/Unid_Hidrogeologicas/MapServer/0", "nome", 0.003));
    passo("albufeiras de rega");
    const albRega = (await q(R + "Atlas/Atlas_Ambiente/MapServer/26", "situacao", 0.002)).map(f => T.centroid(f).geometry.coordinates);
    passo("passivos e locais contaminados");
    let cont = [];
    for (const id of [1, 2, 3, 4, 7, 8, 9, 10, 12, 13, 14, 15]) { try { const fs = await q(R + "Visualizador/AQS_VisualizacaoEstado_PUBLICO_FINAL/MapServer/" + id, "objectid", 0.005); cont = cont.concat(fs.map(f => f.geometry.type === "Point" ? f.geometry.coordinates : T.centroid(f).geometry.coordinates)); } catch (e) {} }
    ST.nCont = cont.length;
    passo("regadio público (DGADR)");
    const AH = window.__AHs || window.__AH; const ahIn = indice(AH.features);
    const ahPts = []; AH.features.forEach(f => T.coordEach(f, c => { ahPts.push(c); }));
    const ahPerto = perto(ahPts.filter((c, i) => i % 3 === 0));
    passo("pontos da organização");
    const d = window.__ORGD || await fetch("/wp-json/tcd/v1/org/camadas", {credentials: "same-origin", headers: {"X-WP-Nonce": tcdNonce}}).then(r => r.json());
    const d2 = await fetch("/wp-json/tcd/v1/org/camadas", {credentials: "same-origin", headers: {"X-WP-Nonce": tcdNonce}}).then(r => r.json());
    const prod = [], venda = [], apoio = [];
    for (const c of d2.camadas) {
      const g = await fetch(c.url, {credentials: "same-origin", headers: {"X-WP-Nonce": tcdNonce}}).then(r => r.json());
      g.features.forEach(f => { if (!f.geometry || f.geometry.type !== "Point") return; const t = f.properties.tipo || "", p = f.geometry.coordinates;
        if (t === "produtor") prod.push(p); else if (/mercado|feira|loja/.test(t)) venda.push(p); if (/cabaz/.test(t)) { venda.push(p); apoio.push(p); } if (/escola|cert|bioregiao|territorio|sede|demo|sementes/.test(t)) apoio.push(p); });
    }
    ST.nPts = {prod: prod.length, venda: venda.length, apoio: apoio.length};
    const pProd = perto(prod), pVenda = perto(venda), pApoio = perto(apoio), pAlb = perto(albRega), pCont = perto(cont);
    const popPts = CONC.filter(c => c.pop).map(c => Object.assign(c.c.slice(), {pop: c.pop})); const pPop = perto(popPts);
    passo("malha");
    const REG = [
      {id: "pt", bb: [-9.6, 36.9, -6.15, 42.2], s: 3},
      {id: "mad", bb: [-17.35, 32.55, -16.25, 33.15], s: 1.2},
      {id: "azw", bb: [-31.35, 39.35, -31.0, 39.75], s: 1.2},
      {id: "azc", bb: [-28.9, 38.35, -26.95, 39.15], s: 1.2},
      {id: "aze", bb: [-25.95, 36.9, -24.95, 37.95], s: 1.2}
    ];
    const HEX = [], meta = {};
    const ANG = [30, 90, 150, 210, 270, 330].map(a => a * Math.PI / 180);
    for (const r of REG) {
      const lat0 = (r.bb[1] + r.bb[3]) / 2, kx = 1 / (111.32 * Math.cos(lat0 * Math.PI / 180)), ky = 1 / 110.574;
      meta[r.id] = {s: r.s, kx: +kx.toFixed(7), ky: +ky.toFixed(7)};
      const dx = 1.5 * r.s * kx, dy = Math.sqrt(3) * r.s * ky;
      for (let i = 0, x = r.bb[0]; x <= r.bb[2]; i++, x += dx) for (let y = r.bb[1] + (i % 2 ? dy / 2 : 0); y <= r.bb[3]; y += dy) {
        const p = [x, y]; const cf = naConc(p); if (!cf) continue;
        HEX.push({p, r: r.id, ci: cf.properties.__i, smp: [p].concat(ANG.map(a => [x + 0.55 * r.s * Math.cos(a) * kx, y + 0.55 * r.s * Math.sin(a) * ky]))});
      }
    }
    ST.nHex = HEX.length;
    passo("critérios");
    const letra = {A: 1, B: 0.8, C: 0.55, D: 0.25, E: 0.05, F: 0.1};
    const sroaV = f => { const s = String(f.properties.classe || ""); const L = (s.match(/\b[A-F]\b/g) || []); if (!L.length) return null; return L.reduce((a, b) => a + letra[b], 0) / L.length; };
    const media = (arr) => { const v = arr.filter(x => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
    let k = 0;
    for (const h of HEX) {
      if (++k % 400 === 0) passo("critérios " + k + "/" + HEX.length);
      const ilha = h.r !== "pt", p = h.p, C = CONC[h.ci];
      const e1 = ilha ? null : media(h.smp.map(s => { const f = sroa(s); return f ? sroaV(f) : null; }));
      const e2 = ilha ? null : media(h.smp.map(s => { const f = carb(s); return f ? (Math.min(13, Math.max(1, +f.properties.gridcode || 1)) - 1) / 12 : null; }));
      let e3 = null;
      if (!ilha) { const z = h.smp.filter(s => zvn(s)).length / h.smp.length; const nc = pCont(p, 3).length; e3 = Math.max(0, 1 - 0.6 * z - Math.min(0.4, nc * 0.15)); }
      let a1 = null; if (!ilha) { const f = prec(p); const mm = f ? +f.properties.codpret : 0; a1 = mm ? (mm >= 1000 ? 1 : mm >= 800 ? 0.85 : mm >= 700 ? 0.7 : mm >= 600 ? 0.55 : mm >= 500 ? 0.4 : 0.25) : null; }
      let a2 = null; if (!ilha) { const f = hid(p); const n = f ? String(f.properties.nome || "") : ""; a2 = /^A/.test(n) ? 0.3 : /^(O|T|M)/.test(n) ? 0.9 : null; }
      let a3 = null; if (!ilha) { const dentro = h.smp.filter(s => ahIn(s)).length / h.smp.length; let v = dentro; if (v < 1) { const n = ahPerto(p, 5); if (n.length) v = Math.max(v, 0.55); const al = pAlb(p, 8); if (al.length) v = Math.max(v, 0.45); } a3 = v; }
      const popR = pPop(p, 60).reduce((s, o) => s + o[0].pop * Math.max(0, 1 - o[1] / 60), 0);
      const vd = pVenda(p, 60).reduce((m, o) => Math.min(m, o[1]), 999);
      const m1 = 0.6 * Math.min(1, Math.log10(1 + popR) / 6.2) + 0.4 * (vd <= 15 ? 1 : vd >= 60 ? 0 : 1 - (vd - 15) / 45);
      const ds = C.dens; const m2 = ds == null ? null : ds < 25 ? 1 : ds < 50 ? 0.8 : ds < 100 ? 0.55 : ds < 300 ? 0.3 : 0.1;
      const np = pProd(p, 25).length; const s1 = np === 0 ? 1 : np === 1 ? 0.75 : np === 2 ? 0.55 : np <= 4 ? 0.35 : 0.15;
      const da = pApoio(p, 80).reduce((m, o) => Math.min(m, o[1]), 999); const s2 = da <= 30 ? 1 : da >= 80 ? 0 : 1 - (da - 30) / 50;
      h.v = [e1, e2, e3, a1, a2, a3, m1, m2, s1, s2];
    }
    const W = [0.16, 0.08, 0.14, 0.08, 0.07, 0.10, 0.12, 0.08, 0.10, 0.07];
    HEX.forEach(h => { let s = 0, w = 0; h.v.forEach((v, i) => { if (v != null && !isNaN(v)) { s += v * W[i]; w += W[i]; } }); h.s = w ? s / w : null; h.cob = w; });
    const cont_ = HEX.filter(h => h.r === "pt" && h.s != null).map(h => h.s).sort((a, b) => a - b);
    const qq = [0.2, 0.4, 0.6, 0.8].map(f => cont_[Math.floor(f * (cont_.length - 1))]);
    HEX.forEach(h => { h.c = h.s == null ? 0 : 1 + qq.filter(t => h.s > t).length; });
    // resumo por concelho
    const porC = {}; HEX.forEach(h => { if (h.s == null) return; const o = porC[h.ci] = porC[h.ci] || {n: 0, s: 0, top: 0}; o.n++; o.s += h.s; if (h.c === 5) o.top++; });
    const concOut = CONC.map(c => { const o = porC[c.i]; return [c.nome, c.dist, o ? Math.round(100 * o.s / o.n) : null, o ? o.n : 0, o ? o.top : 0, c.pop || null, c.dens ? Math.round(c.dens) : null]; });
    const r2 = x => x == null || isNaN(x) ? -1 : Math.round(x * 100);
    const out = {
      v: 1, data: new Date().toISOString().slice(0, 10), regioes: meta, cortes: qq.map(r2),
      criterios: [["e1", "Solo com aptidão agrícola", "Capacidade de uso do solo (SROA, Atlas do Ambiente, APA)"], ["e2", "Matéria orgânica no solo", "Carbono orgânico no solo (ICNF)"], ["e3", "Longe de pressões", "Fora de zonas vulneráveis a nitratos (APA) e de passivos e locais contaminados (Atlas da Qualidade dos Solos, APA)"], ["a1", "Chuva", "Precipitação total anual (Atlas do Ambiente, APA)"], ["a2", "Água subterrânea", "Unidades hidrogeológicas (APA)"], ["a3", "Água de rega", "Aproveitamentos hidroagrícolas em exploração (DGADR, Set. 2024) e albufeiras com uso de rega (Atlas do Ambiente)"], ["m1", "Mercado ao alcance", "População num raio de 60 km (INE, estimativas anuais) e distância ao ponto de venda biológico mais próximo"], ["m2", "Terra mais acessível", "Densidade populacional do concelho (INE, CAOP)"], ["s1", "Pouco procurado", "Poucos produtores biológicos conhecidos num raio de 25 km (mapa da Agrobio)"], ["s2", "Rede de apoio perto", "Escola agrária, certificação, bio-região ou cabaz a menos de 30 km"]],
      pesos: W.map(r2),
      conc: concOut,
      h: HEX.map(h => [+h.p[0].toFixed(4), +h.p[1].toFixed(4), h.r, r2(h.s), h.c, h.ci].concat(h.v.map(r2)))
    };
    window.__APTOUT = out;
    ST.tam = JSON.stringify(out).length;
    ST.cls = [1, 2, 3, 4, 5].map(c => HEX.filter(h => h.c === c).length);
    ST.ilhas = HEX.filter(h => h.r !== "pt").length;
    ST.top = concOut.filter(c => c[2] != null && c[3] >= 3).sort((a, b) => b[2] - a[2]).slice(0, 15).map(c => c[0] + " " + c[2]);
    passo("feito");
  } catch (e) { ST.erro = String(e && e.stack || e); passo("erro"); }
})();
"a calcular";
