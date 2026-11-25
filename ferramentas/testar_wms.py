# Testa GetMap de camadas candidatas (imagem, tamanho, CORS) a partir de uma origem terracruadesign.pt. IPR Atlas, Terracrua Design.
import math, sys, urllib.request
def bb(lon, lat, z=14):
    n = 2 ** z; x = int((lon + 180) / 360 * n); y = int((1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n)
    R = 20037508.342789244; s = 2 * R / n
    return "%f,%f,%f,%f" % (-R + x * s, R - (y + 1) * s, -R + (x + 1) * s, R - y * s)
C = [
 ("vl-relevo", "https://geo.api.vlaanderen.be/DHMV/wms", "DHMV_II_HILL_25cm", 4.70, 50.88),
 ("vl-dtm", "https://geo.api.vlaanderen.be/DHMV/wms", "DHMVII_DTM_1m", 4.70, 50.88),
 ("wa-relevo21", "https://geoservices.wallonie.be/arcgis/services/RELIEF/WALLONIE_MNT_2021_2022_HILLSHADE/MapServer/WMSServer", "0", 5.57, 50.47),
 ("wa-relevo13", "https://geoservices.wallonie.be/arcgis/services/RELIEF/WALLONIE_MNT_2013_2014_HILLSHADE/MapServer/WMSServer", "0", 5.57, 50.47),
 ("lu-mnt", "https://wms.geoportail.lu/opendata/service", "lidar_2019_mnt_public", 6.13, 49.61),
 ("lu-relief", "https://wms.geoportail.lu/opendata/service", "relief", 6.13, 49.61),
 ("de-dgm200", "https://sgx.geodatenzentrum.de/wms_dgm200", "relief", 10.0, 50.0),
 ("de-basemap", "https://sgx.geodatenzentrum.de/wms_basemapde_schummerung", "de_basemapde_web_raster_hillshade", 10.0, 50.0),
 ("dk-skygge", "https://api.dataforsyningen.dk/dhm_DAF", "dhm_terraen_skyggekort", 10.2, 56.15),
 ("it-dtm", "https://wms.pcn.minambiente.it/ogc?map=/ms_ogc/WMS_v1.3/raster/DTM_20M.map", "EL.DTM.20M", 12.5, 42.0),
 ("fr-shadow", "https://data.geopf.fr/wms-r/wms", "ELEVATION.ELEVATIONGRIDCOVERAGE.SHADOW", 6.0, 45.0),
 ("fr-mns-shadow", "https://data.geopf.fr/wms-r/wms", "ELEVATION.ELEVATIONGRIDCOVERAGE.HIGHRES.MNS.SHADOW", 2.35, 48.85),
 ("fr-lidarhd-mnh", "https://data.geopf.fr/wms-r/wms", "IGNF_LIDAR-HD_MNH_ELEVATION.ELEVATIONGRIDCOVERAGE.SHADOW", 6.0, 45.0),
 ("es-mdt", "https://servicios.idee.es/wms-inspire/mdt", "EL.ElevationGridCoverage", -3.7, 40.4),
 ("cz-relevo", "https://ags.cuzk.gov.cz/arcgis2/services/dmr5g/ImageServer/WMSServer", "dmr5g:GrayscaleHillshade", 14.4, 50.08),
 ("nl-dsm", "https://service.pdok.nl/rws/ahn/wms/v1_0", "dsm_05m", 5.1, 52.09),
]
for nome, base, cam, lon, lat in C:
    u = base + ("&" if "?" in base else "?") + "SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=" + cam + "&STYLES=&CRS=EPSG:3857&BBOX=" + bb(lon, lat) + "&WIDTH=256&HEIGHT=256&FORMAT=image/png&TRANSPARENT=true"
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers={"Origin": "https://terracruadesign.pt", "User-Agent": "Mozilla/5.0"}), timeout=60) as r:
            b = r.read(); print("%-15s %s %-12s %7d CORS=%s" % (nome, r.status, r.headers.get("content-type", "")[:12], len(b), r.headers.get("access-control-allow-origin")), flush=True)
    except Exception as e: print("%-15s ERRO %s" % (nome, str(e)[:80]), flush=True)
