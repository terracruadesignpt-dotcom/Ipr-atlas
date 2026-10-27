import json, sys
from shapely.geometry import shape, Polygon, MultiPolygon
d = json.load(open(sys.argv[1]))
fr = [f for f in d["features"] if f["properties"].get("ADM0_A3") == "FRA"][0]
g = shape(fr["geometry"])
polys = list(g.geoms) if isinstance(g, MultiPolygon) else [g]
out = {}
for p in polys:
    c = p.centroid
    if -6 < c.x < 10 and 41 < c.y < 52:
        nome = "corsega" if c.x > 8 else ("continente" if p.area > 1 else None)
        if not nome: continue
        q = p.buffer(0.02).simplify(0.01 if nome == "continente" else 0.01)
        q = max(q.geoms, key=lambda a: a.area) if q.geom_type == "MultiPolygon" else q
        out[nome] = [round(v, 3) for xy in q.exterior.coords for v in xy]
print(json.dumps({k: len(v)//2 for k, v in out.items()}), file=sys.stderr)
print(json.dumps(out))
