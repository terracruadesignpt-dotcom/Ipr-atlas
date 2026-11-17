/* Motor keyline do IPR Atlas (corre num Web Worker). Entrada: MDT em grelha métrica, máscara do terreno e parâmetros.
   Sem dependências; métodos públicos: priority-flood (Barnes et al. 2014) com direcções D8, acumulação de escoamento,
   vales e cumeadas por limiar de área drenada, keypoints por quebra de declive no perfil dos vales, keyline-mestre de
   declive constante e paralelas por translação da mestre. Referência de método: TopoDrain (MIT); nada copiado de código GPL. */
function iprKeylineMotor(E) {
  "use strict";
  var W = E.W, H = E.H, N = W * H, cell = E.cell, P = E.params || {};
  var t0 = Date.now();
  var mask = E.mask, raw = E.dem;
  var DX = [1, 1, 0, -1, -1, -1, 0, 1], DY = [0, 1, 1, 1, 0, -1, -1, -1];
  var DL = [1, Math.SQRT2, 1, Math.SQRT2, 1, Math.SQRT2, 1, Math.SQRT2];

  // 1. suavização gaussiana separável (sigma em metros)
  function gauss(src, sigM) {
    var s = sigM / cell; if (!(s > 0.3)) return Float32Array.from(src);
    var r = Math.ceil(s * 3), k = new Float32Array(2 * r + 1), sum = 0, i, x, y;
    for (i = -r; i <= r; i++) { k[i + r] = Math.exp(-(i * i) / (2 * s * s)); sum += k[i + r]; }
    for (i = 0; i < k.length; i++) k[i] /= sum;
    var tmp = new Float32Array(N), out = new Float32Array(N);
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      var a = 0; for (i = -r; i <= r; i++) { var xx = x + i; xx = xx < 0 ? 0 : xx >= W ? W - 1 : xx; a += src[y * W + xx] * k[i + r]; }
      tmp[y * W + x] = a;
    }
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      var b = 0; for (i = -r; i <= r; i++) { var yy = y + i; yy = yy < 0 ? 0 : yy >= H ? H - 1 : yy; b += tmp[yy * W + x] * k[i + r]; }
      out[y * W + x] = b;
    }
    return out;
  }
  var dem = gauss(raw, P.suav == null ? 4 : P.suav);

  // 2. priority-flood: enche depressões, dá a direcção D8 e a ordem de cima para baixo (ordem inversa de saída)
  function inundar(z) {
    var heapI = new Int32Array(N), heapZ = new Float64Array(N), n = 0;
    var feito = new Uint8Array(N), dir = new Int32Array(N).fill(-1), ordem = new Int32Array(N), no = 0, zf = new Float32Array(N);
    function push(i, v) { var j = n++; while (j > 0) { var p = (j - 1) >> 1; if (heapZ[p] <= v) break; heapI[j] = heapI[p]; heapZ[j] = heapZ[p]; j = p; } heapI[j] = i; heapZ[j] = v; }
    function pop() {
      var top = heapI[0], last = --n, li = heapI[last], lz = heapZ[last], j = 0;
      while (true) { var c = 2 * j + 1; if (c >= n) break; if (c + 1 < n && heapZ[c + 1] < heapZ[c]) c++; if (heapZ[c] >= lz) break; heapI[j] = heapI[c]; heapZ[j] = heapZ[c]; j = c; }
      heapI[j] = li; heapZ[j] = lz; return top;
    }
    var x, y, i;
    for (x = 0; x < W; x++) { push(x, z[x]); feito[x] = 1; zf[x] = z[x]; i = (H - 1) * W + x; if (!feito[i]) { push(i, z[i]); feito[i] = 1; zf[i] = z[i]; } }
    for (y = 1; y < H - 1; y++) { i = y * W; push(i, z[i]); feito[i] = 1; zf[i] = z[i]; i = y * W + W - 1; push(i, z[i]); feito[i] = 1; zf[i] = z[i]; }
    var eps = 1e-4;
    while (n > 0) {
      var c = pop(); ordem[no++] = c;
      var cx = c % W, cy = (c - cx) / W, zc = zf[c];
      for (var d = 0; d < 8; d++) {
        var nx = cx + DX[d], ny = cy + DY[d]; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        var nb = ny * W + nx; if (feito[nb]) continue; feito[nb] = 1;
        var v = z[nb]; if (v <= zc) v = zc + eps; zf[nb] = v; dir[nb] = c; push(nb, v);
      }
    }
    var acc = new Float32Array(N).fill(1);
    for (i = no - 1; i >= 0; i--) { var k = ordem[i], dd = dir[k]; if (dd >= 0) acc[dd] += acc[k]; }
    return { dir: dir, acc: acc };
  }
  var hid = inundar(dem);
  var neg = new Float32Array(N); for (var q = 0; q < N; q++) neg[q] = -dem[q];
  var cum = inundar(neg);

  var cel2 = cell * cell;
  var thrV = Math.max(4, (P.areaVale || 5000) / cel2), thrC = Math.max(4, (P.areaCumeada || 5000) / cel2);

  // 3. redes (vales e cumeadas) como polilinhas
  function rede(h, thr) {
    var chan = new Uint8Array(N), up = new Uint16Array(N), i;
    for (i = 0; i < N; i++) if (h.acc[i] >= thr) chan[i] = 1;
    for (i = 0; i < N; i++) if (chan[i] && h.dir[i] >= 0 && chan[h.dir[i]]) up[h.dir[i]]++;
    var visto = new Uint8Array(N), linhas = [], caminhos = [];
    for (i = 0; i < N; i++) {
      if (!chan[i] || up[i]) continue;
      var c = i, seg = [], tudo = [];
      while (c >= 0 && chan[c]) {
        tudo.push(c);
        if (visto[c]) { seg.push(c); break; }
        visto[c] = 1; seg.push(c); c = h.dir[c];
      }
      if (c >= 0 && chan[c] && !visto[c]) seg.push(c);
      // caminho completo até à saída (para os perfis dos vales)
      var cc = c; while (cc >= 0 && chan[cc] && tudo.length < 200000) { tudo.push(cc); cc = h.dir[cc]; }
      if (seg.length > 1) linhas.push(seg);
      caminhos.push(tudo);
    }
    return { chan: chan, linhas: linhas, caminhos: caminhos };
  }
  var vales = rede(hid, thrV), cumeadas = rede(cum, thrC);

  function zAt(x, y) { // bilinear no MDT suavizado
    if (x < 0 || y < 0 || x > W - 1 || y > H - 1) return NaN;
    var x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(x0 + 1, W - 1), y1 = Math.min(y0 + 1, H - 1), fx = x - x0, fy = y - y0;
    return dem[y0 * W + x0] * (1 - fx) * (1 - fy) + dem[y0 * W + x1] * fx * (1 - fy) + dem[y1 * W + x0] * (1 - fx) * fy + dem[y1 * W + x1] * fx * fy;
  }
  function dentro(x, y) { var xi = Math.round(x), yi = Math.round(y); return xi >= 0 && yi >= 0 && xi < W && yi < H && mask[yi * W + xi] === 1; }

  // 4. keypoints: no perfil de cada vale, onde o declive passa de forte (a montante) a suave (a jusante)
  var w = Math.max(3, Math.round((P.janela || 20) / cell));
  var kps = [];
  vales.caminhos.forEach(function (cam) {
    // troço contínuo mais longo dentro do terreno
    var best = null, cur = null;
    for (var j = 0; j < cam.length; j++) {
      var c = cam[j], cx = c % W, cy = (c - cx) / W;
      if (mask[c] === 1) { if (!cur) cur = [j, j]; cur[1] = j; } else { if (cur && (!best || cur[1] - cur[0] > best[1] - best[0])) best = cur; cur = null; }
    }
    if (cur && (!best || cur[1] - cur[0] > best[1] - best[0])) best = cur;
    if (!best || best[1] - best[0] < 2 * w + 2) return;
    var sD = [0], zs = [], k;
    for (k = best[0]; k <= best[1]; k++) {
      var cc = cam[k], x = cc % W, y = (cc - x) / W; zs.push(dem[cc]);
      if (k > best[0]) { var p = cam[k - 1], px = p % W, py = (p - px) / W; sD.push(sD[sD.length - 1] + Math.hypot(x - px, y - py) * cell); }
    }
    var top = null;
    for (k = w; k < zs.length - w; k++) {
      var su = (zs[k - w] - zs[k]) / (sD[k] - sD[k - w]), sd = (zs[k] - zs[k + w]) / (sD[k + w] - sD[k]);
      var sc = su - sd;
      if (su >= (P.declMin || 0.03) && sd >= 0 && sc >= 0.01 && (!top || sc > top.sc)) top = { k: k, sc: sc, su: su, sd: sd };
    }
    if (!top) return;
    var ci = cam[best[0] + top.k], kx = ci % W, ky = (ci - kx) / W;
    kps.push({ x: kx, y: ky, z: dem[ci], acc_m2: hid.acc[ci] * cel2, sc: top.sc, decl_cima: top.su, decl_baixo: top.sd });
  });
  // um keypoint por vale: junta os que caem a menos de 30 m e fica o de maior bacia
  kps.sort(function (a, b) { return b.acc_m2 - a.acc_m2 || b.sc - a.sc; });
  var sel = [], minD = 30 / cell;
  kps.forEach(function (k) { if (sel.every(function (s) { return Math.hypot(s.x - k.x, s.y - k.y) > minD; })) sel.push(k); });
  sel = sel.slice(0, P.maxKp || 6);

  // 5. keyline-mestre: a partir do keypoint, linha com descida constante (grade) para os dois lados, do vale para as cumeadas
  var grade = P.grade == null ? 0.003 : P.grade;
  function tracar(kp) {
    var gx = (zAt(kp.x + 1, kp.y) - zAt(kp.x - 1, kp.y)) / 2, gy = (zAt(kp.x, kp.y + 1) - zAt(kp.x, kp.y - 1)) / 2;
    var g = Math.hypot(gx, gy) || 1, base = Math.atan2(gy / g, gx / g);
    var lados = [base + Math.PI / 2, base - Math.PI / 2], res = []; var motivo = kp.motivo = [];
    var ds = Math.max(0.5, 1.0 / cell * Math.max(cell, 1)), maxPassos = Math.round(3000 / (ds * cell));
    function grad(x, y) { var e = 1; return [(zAt(x + e, y) - zAt(x - e, y)) / (2 * e), (zAt(x, y + e) - zAt(x, y - e)) / (2 * e)]; }
    lados.forEach(function (h0) {
      var x = kp.x, y = kp.y, tx = Math.cos(h0), ty = Math.sin(h0), s = 0, pts = [];
      for (var p = 0; p < maxPassos; p++) {
        var g0 = grad(x, y); if (isNaN(g0[0]) || isNaN(g0[1])) { motivo.push("bordo"); break; }
        var gm = Math.hypot(g0[0], g0[1]);
        if (gm * 1 / cell < 0.004) { motivo.push("plano a " + Math.round(s) + " m"); break; }
        // tangente à curva de nível, no mesmo sentido do passo anterior
        var cx = -g0[1] / gm, cy = g0[0] / gm; if (cx * tx + cy * ty < 0) { cx = -cx; cy = -cy; }
        var nx = x + cx * ds, ny = y + cy * ds, zt = kp.z - grade * (s + ds * cell), ok = false;
        for (var it = 0; it < 6; it++) { // Newton ao longo do gradiente até à cota-alvo
          var zz = zAt(nx, ny); if (isNaN(zz)) break;
          var er = zt - zz; if (Math.abs(er) < 0.01) { ok = true; break; }
          var g1 = grad(nx, ny), g2 = g1[0] * g1[0] + g1[1] * g1[1]; if (!(g2 > 1e-9)) break;
          var kx = er * g1[0] / g2, ky = er * g1[1] / g2, km = Math.hypot(kx, ky); if (km > ds) { kx *= ds / km; ky *= ds / km; }
          nx += kx; ny += ky;
        }
        if (!ok) { var z2 = zAt(nx, ny); if (isNaN(z2)) { motivo.push("bordo"); break; } if (Math.abs(zt - z2) > 0.15) { motivo.push("sem continuidade a " + Math.round(s) + " m"); break; } }
        var stx = nx - x, sty = ny - y, sm = Math.hypot(stx, sty) || 1;
        if ((stx * tx + sty * ty) / sm < 0.2) { motivo.push("volta para trás a " + Math.round(s) + " m"); break; }
        tx = stx / sm; ty = sty / sm; x = nx; y = ny; s += sm * cell; pts.push([x, y]);
        var ci = Math.round(y) * W + Math.round(x);
        if (s > 25 && vales.chan[ci] && hid.acc[ci] * cel2 >= 0.5 * kp.acc_m2 && Math.hypot(x - kp.x, y - kp.y) * cell > 25) { motivo.push("vale a " + Math.round(s) + " m"); break; } // só pára num vale tão grande como o do keypoint; os pequenos atravessa-os
        if (p === maxPassos - 1) motivo.push("comprimento");
      }
      res.push(pts);
    });
    var linha = res[0].slice().reverse().concat([[kp.x, kp.y]], res[1]);
    return linha;
  }
  function chaikin(l, n) { for (var r = 0; r < n; r++) { if (l.length < 3) return l; var o = [l[0]]; for (var i = 0; i < l.length - 1; i++) { var a = l[i], b = l[i + 1]; o.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]], [0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]); } o.push(l[l.length - 1]); l = o; } return l; }
  function simpl(l, tol) { // Douglas-Peucker
    if (l.length < 3) return l; var keep = new Uint8Array(l.length); keep[0] = keep[l.length - 1] = 1; var st = [[0, l.length - 1]];
    while (st.length) { var s = st.pop(), a = l[s[0]], b = l[s[1]], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1e-9, md = 0, mi = -1;
      for (var i = s[0] + 1; i < s[1]; i++) { var d = Math.abs(dy * l[i][0] - dx * l[i][1] + b[0] * a[1] - b[1] * a[0]) / L; if (d > md) { md = d; mi = i; } }
      if (md > tol) { keep[mi] = 1; st.push([s[0], mi], [mi, s[1]]); } }
    return l.filter(function (_, i) { return keep[i]; });
  }
  function recortar(l) { // troços dentro do terreno, com pelo menos 10 m
    var out = [], cur = [];
    l.forEach(function (p) { if (dentro(p[0], p[1])) cur.push(p); else { if (cur.length > 1) out.push(cur); cur = []; } });
    if (cur.length > 1) out.push(cur);
    return out.filter(function (t) { return comp(t) >= 10; });
  }
  function comp(l) { var s = 0; for (var i = 1; i < l.length; i++) s += Math.hypot(l[i][0] - l[i - 1][0], l[i][1] - l[i - 1][1]); return s * cell; }
  function deslocar(l, d) { // d em células, + para um lado
    var o = [];
    for (var i = 0; i < l.length; i++) {
      var a = l[Math.max(0, i - 1)], b = l[Math.min(l.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
      o.push([l[i][0] - dy / L * d, l[i][1] + dx / L * d]);
    }
    return o;
  }
  function cruza(a, b, c, d) {
    var r1 = b[0] - a[0], r2 = b[1] - a[1], s1 = d[0] - c[0], s2 = d[1] - c[1], den = r1 * s2 - r2 * s1; if (Math.abs(den) < 1e-12) return null;
    var t = ((c[0] - a[0]) * s2 - (c[1] - a[1]) * s1) / den, u = ((c[0] - a[0]) * r2 - (c[1] - a[1]) * r1) / den;
    return t > 0 && t < 1 && u > 0 && u < 1 ? [a[0] + t * r1, a[1] + t * r2] : null;
  }
  function semLacos(l) { // corta os laços que o deslocamento cria no lado côncavo das curvas
    l = simpl(l, 0.15); var o = l.slice(), mudou = true, voltas = 0;
    while (mudou && voltas++ < 200) {
      mudou = false;
      for (var i = 0; i < o.length - 3 && !mudou; i++) for (var j = o.length - 2; j > i + 1; j--) {
        var p = cruza(o[i], o[i + 1], o[j], o[j + 1]); if (p) { o = o.slice(0, i + 1).concat([p], o.slice(j + 1)); mudou = true; break; }
      }
    }
    return o;
  }

  var mestres = sel.map(function (kp, i) { var l = chaikin(simpl(tracar(kp), 0.25), 2); return { kp: i, linha: l, troços: recortar(l) }; });
  var prim = Math.min(P.primario || 0, Math.max(0, mestres.length - 1));
  var paralelas = [];
  // Paralelas: curvas de igual distância à keyline-mestre (prolongada nas pontas pela tangente), tiradas de um campo de
  // distância com sinal. Ao contrário do deslocamento vértice a vértice, não cria laços nem linhas que se cruzam.
  function paralelasDe(m, espM, maxN) {
    if (m.length < 2) return [];
    var L = Math.max(W, H) * 1.5, a0 = m[0], a1 = m[Math.min(3, m.length - 1)], b0 = m[m.length - 1], b1 = m[Math.max(0, m.length - 4)];
    function ponta(p, q) { var dx = p[0] - q[0], dy = p[1] - q[1], d = Math.hypot(dx, dy) || 1; return [p[0] + dx / d * L, p[1] + dy / d * L]; }
    var ext = [ponta(a0, a1)].concat(m, [ponta(b0, b1)]);
    var lin = new Uint8Array(N), i, x, y;
    for (i = 1; i < ext.length; i++) { // rasterização (passos de meia célula), só dentro da grelha
      var p = ext[i - 1], q = ext[i], n = Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) * 2);
      for (var k = 0; k <= n; k++) { x = Math.round(p[0] + (q[0] - p[0]) * k / n); y = Math.round(p[1] + (q[1] - p[1]) * k / n); if (x >= 0 && y >= 0 && x < W && y < H) lin[y * W + x] = 1; }
    }
    // transformada de distância euclidiana exacta (Felzenszwalb e Huttenlocher)
    var INF = 1e20, f = new Float64Array(Math.max(W, H)), dd = new Float64Array(Math.max(W, H)), v = new Int32Array(Math.max(W, H)), zz = new Float64Array(Math.max(W, H) + 1);
    function dt1(n) { var k = 0; v[0] = 0; zz[0] = -INF; zz[1] = INF;
      for (var q = 1; q < n; q++) { var s; do { var r = v[k]; s = ((f[q] + q * q) - (f[r] + r * r)) / (2 * q - 2 * r); if (s <= zz[k]) k--; else break; } while (k >= 0); k++; v[k] = q; zz[k] = s; zz[k + 1] = INF; }
      k = 0; for (q = 0; q < n; q++) { while (zz[k + 1] < q) k++; dd[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; } }
    var D2 = new Float64Array(N);
    for (x = 0; x < W; x++) { for (y = 0; y < H; y++) f[y] = lin[y * W + x] ? 0 : INF; dt1(H); for (y = 0; y < H; y++) D2[y * W + x] = dd[y]; }
    for (y = 0; y < H; y++) { for (x = 0; x < W; x++) f[x] = D2[y * W + x]; dt1(W); for (x = 0; x < W; x++) D2[y * W + x] = dd[x]; }
    // lado: enchimento 4-conexo a partir de um ponto ao lado da mestre (a linha 8-conexa não deixa passar)
    var lado = new Int8Array(N).fill(-1), mid = m[Math.floor(m.length / 2)], mn = m[Math.min(m.length - 1, Math.floor(m.length / 2) + 1)];
    var tx = mn[0] - mid[0], ty = mn[1] - mid[1], tl = Math.hypot(tx, ty) || 1, sx = Math.round(mid[0] - ty / tl * 2), sy = Math.round(mid[1] + tx / tl * 2);
    if (sx >= 0 && sy >= 0 && sx < W && sy < H && !lin[sy * W + sx]) {
      var fila = new Int32Array(N), ini = 0, fim = 0; fila[fim++] = sy * W + sx; lado[sy * W + sx] = 1;
      while (ini < fim) { var c = fila[ini++], cx = c % W, cy = (c - cx) / W;
        if (cx > 0 && lado[c - 1] < 0 && !lin[c - 1]) { lado[c - 1] = 1; fila[fim++] = c - 1; }
        if (cx < W - 1 && lado[c + 1] < 0 && !lin[c + 1]) { lado[c + 1] = 1; fila[fim++] = c + 1; }
        if (cy > 0 && lado[c - W] < 0 && !lin[c - W]) { lado[c - W] = 1; fila[fim++] = c - W; }
        if (cy < H - 1 && lado[c + W] < 0 && !lin[c + W]) { lado[c + W] = 1; fila[fim++] = c + W; } }
    }
    var F = new Float32Array(N); for (i = 0; i < N; i++) F[i] = lin[i] ? 0 : Math.sqrt(D2[i]) * cell * lado[i];
    // curvas de nível do campo em k·espaçamento (marching squares), só onde há terreno perto
    var segs = {}, esp = espM;
    function addSeg(lv, p, q) { (segs[lv] = segs[lv] || []).push([p, q]); }
    function interp(x0, y0, v0, x1, y1, v1, lv) { var t = (lv - v0) / (v1 - v0); return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]; }
    for (y = 0; y < H - 1; y++) for (x = 0; x < W - 1; x++) {
      var i0 = y * W + x;
      if (!(mask[i0] || mask[i0 + 1] || mask[i0 + W] || mask[i0 + W + 1])) continue;
      var a = F[i0], b = F[i0 + 1], c2 = F[i0 + W + 1], d2 = F[i0 + W];
      var lo = Math.min(a, b, c2, d2), hi = Math.max(a, b, c2, d2);
      var k0 = Math.ceil(lo / esp), k1 = Math.floor(hi / esp);
      for (var kk = k0; kk <= k1; kk++) {
        if (kk === 0 || Math.abs(kk) > maxN) continue; var lv = kk * esp;
        var pts = [];
        if ((a < lv) !== (b < lv)) pts.push(interp(x, y, a, x + 1, y, b, lv));
        if ((b < lv) !== (c2 < lv)) pts.push(interp(x + 1, y, b, x + 1, y + 1, c2, lv));
        if ((c2 < lv) !== (d2 < lv)) pts.push(interp(x + 1, y + 1, c2, x, y + 1, d2, lv));
        if ((d2 < lv) !== (a < lv)) pts.push(interp(x, y + 1, d2, x, y, a, lv));
        if (pts.length === 2) addSeg(kk, pts[0], pts[1]); else if (pts.length === 4) { addSeg(kk, pts[0], pts[1]); addSeg(kk, pts[2], pts[3]); }
      }
    }
    var out = [];
    Object.keys(segs).forEach(function (kk) { juntar(segs[kk]).forEach(function (l) { recortar(chaikin(simpl(l, 0.3), 1)).forEach(function (t) { out.push({ ordem: +kk, linha: t }); }); }); });
    return out;
  }
  function juntar(ss) { // segmentos soltos → polilinhas
    function ch(p) { return Math.round(p[0] * 1000) + "," + Math.round(p[1] * 1000); }
    var por = {}, usado = new Uint8Array(ss.length), res = [];
    ss.forEach(function (s, i) { [0, 1].forEach(function (e) { var k = ch(s[e]); (por[k] = por[k] || []).push(i); }); });
    function seguinte(p, i) { var l = por[ch(p)] || []; for (var j = 0; j < l.length; j++) if (!usado[l[j]] && l[j] !== i) return l[j]; return -1; }
    for (var i = 0; i < ss.length; i++) {
      if (usado[i]) continue; usado[i] = 1; var linha = [ss[i][0], ss[i][1]];
      [1, 0].forEach(function (lado) {
        var cur = i, p = lado ? linha[linha.length - 1] : linha[0];
        while (true) { var j = seguinte(p, cur); if (j < 0) break; usado[j] = 1; var s = ss[j], q = ch(s[0]) === ch(p) ? s[1] : s[0]; if (lado) linha.push(q); else linha.unshift(q); p = q; cur = j; }
      });
      res.push(linha);
    }
    return res;
  }
  if (mestres.length) paralelas = paralelasDe(mestres[prim].linha, P.espac || 20, P.maxPar || 60);

  // 6. métricas dentro do terreno
  var nIn = 0, zmin = Infinity, zmax = -Infinity, decl = 0;
  for (var yy = 1; yy < H - 1; yy++) for (var xx = 1; xx < W - 1; xx++) {
    var ii = yy * W + xx; if (mask[ii] !== 1) continue; nIn++;
    var z0 = dem[ii]; if (z0 < zmin) zmin = z0; if (z0 > zmax) zmax = z0;
    var gx2 = (dem[ii + 1] - dem[ii - 1]) / (2 * cell), gy2 = (dem[ii + W] - dem[ii - W]) / (2 * cell); decl += Math.hypot(gx2, gy2);
  }
  function compDentro(linhas) { var s = 0; linhas.forEach(function (l) { var pts = l.map(function (c) { var x = c % W; return [x, (c - x) / W]; }); recortar(pts).forEach(function (t) { s += comp(t); }); }); return s; }
  var resumo = {
    area_ha: +(nIn * cel2 / 10000).toFixed(2), celula_m: +cell.toFixed(2), cotas: [+zmin.toFixed(1), +zmax.toFixed(1)],
    declive_medio_pct: nIn ? +(decl / nIn * 100).toFixed(1) : null,
    vales_m: Math.round(compDentro(vales.linhas)), cumeadas_m: Math.round(compDentro(cumeadas.linhas)),
    keypoints: sel.length, mestre_m: mestres.length ? Math.round(mestres[prim].troços.reduce(function (s, t) { return s + comp(t); }, 0)) : 0,
    paralelas: paralelas.length, paralelas_m: Math.round(paralelas.reduce(function (s, p) { return s + comp(p.linha); }, 0)),
    tempo_ms: Date.now() - t0
  };
  function linhasCel(ls) { var o = []; ls.forEach(function (l) { recortar(l.map(function (c) { var x = c % W; return [x, (c - x) / W]; })).forEach(function (t) { o.push(simpl(t, 0.5)); }); }); return o; }
  return {
    vales: linhasCel(vales.linhas), cumeadas: linhasCel(cumeadas.linhas),
    keypoints: sel.map(function (k) { return { x: k.x, y: k.y, z: +k.z.toFixed(1), bacia_ha: +(k.acc_m2 / 10000).toFixed(2), decl_cima_pct: +(k.decl_cima * 100).toFixed(1), decl_baixo_pct: +(k.decl_baixo * 100).toFixed(1), fim: k.motivo }; }),
    mestres: mestres.map(function (m, i) { return { kp: i, primaria: i === prim, troços: m.troços }; }),
    paralelas: paralelas, resumo: resumo
  };
}
if (typeof module !== "undefined") module.exports = iprKeylineMotor;
