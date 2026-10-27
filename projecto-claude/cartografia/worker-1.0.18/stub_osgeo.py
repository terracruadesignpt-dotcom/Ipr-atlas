import sys, types
# stub mínimo do osgeo: uma folha é válida se começa por b'II*'
osgeo = types.ModuleType('osgeo')
class _DS:
    RasterCount = 1; RasterXSize = 10; RasterYSize = 10
    def GetRasterBand(self, i):
        return types.SimpleNamespace(Checksum=lambda *a: 0)
def _open(p):
    with open(p, 'rb') as f:
        return _DS() if f.read(3) == b'II*' else None
gdal = types.SimpleNamespace(UseExceptions=lambda: None, Open=_open)
class _SRS:
    def ImportFromEPSG(self, n): pass
    def SetAxisMappingStrategy(self, n): pass
osr = types.SimpleNamespace(SpatialReference=lambda *a, **k: _SRS(), OAMS_TRADITIONAL_GIS_ORDER=0)
ogr = types.SimpleNamespace(UseExceptions=lambda: None)
osgeo.gdal, osgeo.ogr, osgeo.osr = gdal, ogr, osr
sys.modules.update({'osgeo': osgeo, 'osgeo.gdal': gdal, 'osgeo.ogr': ogr, 'osgeo.osr': osr})

