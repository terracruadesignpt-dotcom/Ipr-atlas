"""Prova numérica (sem WhiteboxTools): festos do MDT invertido com e sem preencher depressões.
D8 + acumulação em numpy; preenchimento por priority-flood com epsilon (equivalente a fix_flats=True)."""
import heapq, numpy as np
from scipy import ndimage
rng = np.random.default_rng(7)
n = 200; y, x = np.mgrid[0:n, 0:n] / n
# vale ao centro e cumeadas ramificadas, com rugosidade de LiDAR
z = 60*np.abs(x-0.5) + 12*np.sin(6*np.pi*y)*np.abs(x-0.5) + 8*np.cos(5*np.pi*x)*y
z += ndimage.gaussian_filter(rng.normal(0, 1, (n, n)), 1.5)*1.2
D = [(-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1)]
def preencher(d, eps=1e-4):
    f = d.copy(); vis = np.zeros_like(d, bool); h = []
    for i in range(n):
        for j in range(n):
            if i in (0, n-1) or j in (0, n-1): heapq.heappush(h, (f[i,j], i, j)); vis[i,j] = True
    while h:
        v, i, j = heapq.heappop(h)
        for di, dj in D:
            a, b = i+di, j+dj
            if 0 <= a < n and 0 <= b < n and not vis[a,b]:
                vis[a,b] = True; f[a,b] = max(f[a,b], v+eps); heapq.heappush(h, (f[a,b], a, b))
    return f
def acumulacao(d):
    rec = -np.ones((n, n, 2), int)
    for i in range(1, n-1):
        for j in range(1, n-1):
            best, bb = 0, None
            for di, dj in D:
                s = (d[i,j]-d[i+di,j+dj]) / (1.4142 if di and dj else 1)
                if s > best: best, bb = s, (i+di, j+dj)
            if bb: rec[i,j] = bb
    acc = np.ones((n, n)); ordem = np.argsort(-d, axis=None)
    for k in ordem:
        i, j = divmod(k, n); a, b = rec[i,j]
        if a >= 0: acc[a,b] += acc[i,j]
    return acc
neg = -z
for nome, d in (('1.0.17: negate -> d8 (sem preencher)', neg), ('1.0.18-festos: negate -> fill -> d8', preencher(neg))):
    acc = acumulacao(d); rede = acc > 150
    lab, k = ndimage.label(rede, structure=np.ones((3, 3)))
    tam = np.bincount(lab.ravel())[1:] if k else np.array([0])
    print('%-40s troços=%4d  células=%5d  maior troço=%5d  fossas internas=%d' % (
        nome, k, rede.sum(), tam.max(), int(((acc > 0) & (ndimage.minimum_filter(d, 3) == d))[1:-1,1:-1].sum())))
