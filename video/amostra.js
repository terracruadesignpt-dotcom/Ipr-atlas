// imagens soltas para ver o aspecto: node amostra.js t1,t2,... [lg] [v]
const { chromium } = require('playwright'); const fs=require('fs'),path=require('path');const W=path.join(__dirname,'web');
const ct=f=>f.endsWith('.css')?'text/css':f.endsWith('.png')?'image/png':f.endsWith('.woff2')?'font/woff2':f.endsWith('.html')?'text/html':'application/javascript';
(async()=>{const [ts,lg='pt',v='0']=process.argv.slice(2);const vert=v==='1';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:vert?{width:1080,height:1920}:{width:1920,height:1080}});
await ctx.route('https://filme.local/**',r=>{const f=path.join(W,new URL(r.request().url()).pathname.slice(1));return fs.existsSync(f)?r.fulfill({body:fs.readFileSync(f),contentType:ct(f)}):r.fulfill({status:404,body:''})});
const p=await ctx.newPage();let e=0;p.on('console',m=>{if(/MAPERR|CORS/.test(m.text()))e++;});
await p.goto(`https://filme.local/filme.html?lg=${lg}&v=${v}`);await p.evaluate(()=>window.inicio);await p.evaluate(()=>document.fonts.ready);
for(const t of ts.split(',').map(Number)){const t0=Date.now();await p.evaluate(tt=>window.estado(tt),t);const r=await p.evaluate(()=>window.pronto());
await p.screenshot({path:`a-${lg}${vert?'v':''}-${t}.jpg`,type:'jpeg',quality:80});console.log(t,r,Date.now()-t0,'ms');}
console.log('erros mapa',e);await b.close();})();
