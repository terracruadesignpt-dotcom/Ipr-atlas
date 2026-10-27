// Testes do entrada.js num DOM simulado com a estrutura do Atlas (ipe-esq, ipe-cam, ipr-g, ipe-tabs) e um mapa falso.
const { JSDOM } = require("jsdom");
const fs = require("fs");
const codigo = fs.readFileSync(__dirname + "/entrada.js", "utf8");
let falhas = 0, n = 0;
function ok(c, nome) { n++; if (c) console.log("ok    " + nome); else { falhas++; console.log("FALHA " + nome); } }

const HTML = `<!doctype html><body><div id="ipe">
<aside class="ipe-esq" id="ipe-esq">
 <section class="ipe-sb" data-sb="busca"><button class="ipe-sbh">Pesquisar</button><div class="ipe-sbc"></div></section>
 <section class="ipe-sb" data-sb="locais"><button class="ipe-sbh">Locais<em id="ipe-loc-n"></em></button><div class="ipe-sbc" id="ipe-locais"><button data-am="ir">Exemplo</button></div></section>
 <section class="ipe-sb ipe-sb--cam" data-sb="cam"><button class="ipe-sbh">Camadas</button><div class="ipe-sbc" id="ipe-cam"><div class="ipr-arv">
  ${["fundo","base","meus","lidar","prop","cond","fogo","agua","solo","ref"].map(g => `<div class="ipr-g" data-g="${g}">${g}</div>`).join("")}
 </div></div></section>
</aside>
<aside class="ipe-dir" id="ipe-dir"><div id="ipe-tabs"><button data-tab="proj">Projectos</button><button data-tab="enc">Encomendar</button><button data-tab="cloud">Cloud</button></div></aside>
</div></body>`;

function mapaFalso() {
  const m = { fontes: {}, camadas: [], enq: null, ev: {} };
  return Object.assign(m, {
    getStyle: () => ({}), getSource: k => m.fontes[k] ? { setData: d => (m.fontes[k] = d) } : undefined,
    addSource: (k, s) => (m.fontes[k] = s.data), addLayer: l => m.camadas.push(l.id),
    fitBounds: (b, o) => (m.enq = b), on: (e, f) => (m.ev[e] = f),
  });
}

async function cenario(nome, { sessao, mapas, cloud, ls }) {
  const dom = new JSDOM(HTML, { url: "https://terracruadesign.pt/atlas/", runScripts: "outside-only", pretendToBeVisual: true });
  const w = dom.window;
  if (ls) Object.entries(ls).forEach(([k, v]) => w.localStorage.setItem(k, v));
  if (sessao) w.tcdNonce = "abc";
  const mapa = mapaFalso();
  w.__ipe = { mapa, estado: { mapas: [], actual: null } };
  let cliques = [];
  w.document.addEventListener("click", e => { const b = e.target.closest("[data-tab],[data-am]"); if (b) cliques.push(b.getAttribute("data-tab") || "am"); });
  w.fetch = async (u) => ({ ok: true, json: async () => ({ terrenos: new Array(cloud || 0).fill({}) }) });
  w.eval(codigo);
  await new Promise(r => setTimeout(r, 50));
  if (mapas) w.__ipe.estado.mapas = mapas;
  await new Promise(r => setTimeout(r, 1200));
  return { w, d: w.document, mapa, cliques };
}

const P = (x, y) => ({ type: "Polygon", coordinates: [[[x, y], [x + .01, y], [x + .01, y + .01], [x, y + .01], [x, y]]] });

(async () => {
  // 1. Sem sessão
  let { d, cliques } = await cenario("sem sessão", {});
  const sec = d.getElementById("tme");
  ok(sec && d.getElementById("ipe-esq").firstElementChild === sec, "cartão no topo da barra da esquerda");
  ok(/Ver o projecto exemplo/.test(sec.textContent) && /Encomendar a Base/.test(sec.textContent) && /Entrar/.test(sec.textContent), "sem sessão: exemplo, encomendar, entrar");
  sec.querySelector('[data-tme="exemplo"]').click(); sec.querySelector('[data-tme="encomendar"]').click();
  ok(cliques.includes("am") && cliques.includes("enc"), "botões abrem o exemplo e o separador Encomendar");
  const cam = d.getElementById("ipe-cam");
  ok(cam.classList.contains("tme-simples"), "camadas em modo simples por omissão");
  const css = [...d.querySelectorAll("style")].map(s => s.textContent).join("");
  ok(/tme-simples \.ipr-g\[data-g="fogo"\]/.test(css) && /data-g="ref"/.test(css) && !/data-g="cond"\]\{display:none/.test(css), "esconde Fogo, Solo e Referência; mantém Condicionantes");
  const bt = d.querySelector(".tme-todas"); bt.click();
  ok(!cam.classList.contains("tme-simples") && /principais/.test(bt.textContent), "«Mostrar todas as camadas» abre o resto");

  // 2. Com sessão: uma Base entregue, uma encomendada, um partilhado; Cloud com 2
  const mapas = [
    { id: 101, encomenda: "1001", local: "Monte do Vale", area_ha: 12.5, estado_k: "completed", downloads: [{ nome: "x.zip" }], geojson: P(-8, 37.5), dono: true },
    { id: 102, encomenda: "1002", local: "Courela Nova", area_ha: 3, estado_k: "processing", estado: "A preparar a sua Base", downloads: [], geojson: P(-7.9, 37.6), dono: true },
    { id: 103, encomenda: "1003", local: "Horta da Ana", estado_k: "completed", downloads: [{ nome: "y.zip" }], geojson: P(-8.1, 38), dono: false },
  ];
  let r = await cenario("com sessão", { sessao: true, mapas, cloud: 2 });
  const s2 = r.d.getElementById("tme");
  const abrir = [...s2.querySelectorAll("a.tme-b")].filter(a => /Abrir o meu terreno/.test(a.textContent));
  ok(abrir.length === 2 && abrir[0].getAttribute("href") === "/atlas/?mapa=101", "Base entregue: ligação «Abrir o meu terreno» para /atlas/?mapa=101");
  ok(/Courela Nova/.test(s2.textContent) && /Base encomendada: A preparar a sua Base/.test(s2.textContent), "Base por entregar aparece como encomendada");
  ok(r.mapa.fontes["tme-pedidos"] && r.mapa.fontes["tme-pedidos"].features.length === 1 && r.mapa.camadas.includes("tme-pedidos-l"), "limite da Base encomendada desenhado no mapa (só esse)");
  s2.querySelector('[data-tme="ver"]').click();
  ok(r.mapa.enq && Math.abs(r.mapa.enq[0][0] - -7.9) < 1e-9, "«Ver no mapa» enquadra o limite");
  ok(/partilhado consigo/.test(s2.textContent), "partilhados aparecem a seguir");
  ok(/Na IPR Cloud \(2\)/.test(s2.textContent) && /\/atlas\/\?mapa=14629/.test(s2.innerHTML), "botões IPR Cloud (2) e Projecto exemplo");
  s2.querySelector('[data-tme="cloud"]').click(); ok(r.cliques.includes("cloud"), "IPR Cloud abre o separador Cloud");

  // 3. Com sessão e sem terrenos
  r = await cenario("sem terrenos", { sessao: true, mapas: [] });
  ok(/Ainda não tem terrenos/.test(r.d.getElementById("tme").textContent) && r.d.querySelector('#tme [data-tme="encomendar"]'), "sem terrenos: convite a encomendar e exemplo");

  // 4. Preferência guardada
  r = await cenario("todas guardado", { ls: { tcd_atlas_todas: "1" } });
  ok(!r.d.getElementById("ipe-cam").classList.contains("tme-simples"), "lembra «todas as camadas» neste navegador");

  // 5. Texto com caracteres perigosos
  r = await cenario("escape", { sessao: true, mapas: [{ id: 9, local: "<img src=x onerror=alert(1)>", estado_k: "completed", downloads: [{}], dono: true }] });
  ok(!r.d.querySelector("#tme img"), "nomes escapados (sem HTML injectado)");

  console.log(`\n${n} testes, ${falhas} falhas`); process.exit(falhas ? 1 : 0);
})();
