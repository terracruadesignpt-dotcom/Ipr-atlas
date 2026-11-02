// node render.js <lg> <v 0|1> <fps> [t0] [t1] [saida.mp4]
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const cp = require('child_process');
const W = path.join(__dirname, 'web');
const [lg = 'pt', v = '0', fpsS = '30', t0S, t1S, out] = process.argv.slice(2);
const fps = +fpsS, vert = v === '1';
const ct = f => f.endsWith('.css') ? 'text/css' : f.endsWith('.png') ? 'image/png' : f.endsWith('.woff2') ? 'font/woff2' : f.endsWith('.html') ? 'text/html' : 'application/javascript';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: vert ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await ctx.route('https://filme.local/**', r => { const f = path.join(W, new URL(r.request().url()).pathname.slice(1)); if (fs.existsSync(f)) return r.fulfill({ body: fs.readFileSync(f), contentType: ct(f) }); return r.fulfill({ status: 404, body: '' }); });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
  await p.goto(`https://filme.local/filme.html?lg=${lg}&v=${v}${process.env.LIMPO?"&limpo=1":""}`); await p.evaluate(() => window.inicio); await p.evaluate(() => document.fonts.ready);
  const DUR = await p.evaluate(() => window.DUR);
  const t0 = t0S ? +t0S : 0, t1 = t1S ? +t1S : DUR;
  const saida = out || `ipr-${lg}${vert ? '-vertical' : ''}.mp4`;
  const ff = cp.spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', saida], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n0 = Math.round(t0 * fps), n1 = Math.round(t1 * fps); let tempos = 0, ini = Date.now();
  for (let n = n0; n < n1; n++) {
    const t = n / fps;
    await p.evaluate(tt => window.estado(tt), t);
    const r = await p.evaluate(() => window.pronto()); if (r !== 'ok') tempos++;
    const jpg = await p.screenshot({ type: 'jpeg', quality: 92, timeout: 180000 });
    if (!ff.stdin.write(jpg)) await new Promise(res => ff.stdin.once('drain', res));
    if (n % (fps * 2) === 0) process.stderr.write(`t=${t.toFixed(1)}s ${((Date.now() - ini) / 1000 / (n - n0 + 1)).toFixed(2)}s/img\n`);
  }
  ff.stdin.end(); await new Promise(res => ff.on('close', res));
  console.log(JSON.stringify({ saida, DUR, imagens: n1 - n0, tempos, errs: errs.slice(0, 5), s: Math.round((Date.now() - ini) / 1000) }));
  await b.close();
})();
