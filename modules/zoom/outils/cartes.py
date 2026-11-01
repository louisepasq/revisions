# /// script
# requires-python = ">=3.10"
# dependencies = ["shapely>=2.0"]
# ///
"""Fabrique les cartes du module « De l'univers à Éguilles » : modules/zoom/cartes.js.

Usage : uv run modules/zoom/outils/cartes.py

Télécharge une fois les sources libres dans modules/zoom/outils/cache/ (ignoré par git),
projette, simplifie et écrit des tracés légers en entiers (viewBox de 1000 de large).
- Natural Earth (domaine public) : pays, continents, fleuves, lacs ; version épinglée.
- france-geojson de Grégoire David : régions et départements d'ADMIN EXPRESS COG de l'IGN
  (édition 2018), sous Licence Ouverte Etalab.
- geo.api.gouv.fr (API Découpage administratif, Licence Ouverte) : position des mairies des
  villes et contour de la commune d'Éguilles. Aucune adresse de particulier.
- La Voie lactée, le système solaire, les massifs, le Var, le Verdon, la Camargue, la
  Sainte-Victoire et les découpages des océans sont dessinés ici, à la main.
Les noms, les niveaux par enfant et les repères vivent dans modules/zoom/contenu.js.
"""
import json
import math
import random
import urllib.parse
import urllib.request
from pathlib import Path

from shapely.geometry import LineString, MultiLineString, MultiPolygon, Point, Polygon, box, mapping, shape
import shapely
from shapely.ops import unary_union

ICI = Path(__file__).resolve().parent
CACHE = ICI / "cache"
SORTIE = ICI.parent / "cartes.js"
LARGEUR = 1000
# Autour de la vue, une marge de contexte dessinée : quand l'écran n'a pas la forme de la carte,
# les bandes de côté montrent la suite du pays ou de la mer au lieu d'un aplat.
MARGE = 0.35
MARGE_HAUTEUR = 0.8  # un écran de téléphone en portrait est bien plus haut que la carte

NE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/"
FG = "https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/"
SOURCES = {
    "pays": NE + "ne_50m_admin_0_countries.geojson",
    "fleuves": NE + "ne_10m_rivers_lake_centerlines.geojson",
    "lacs": NE + "ne_10m_lakes.geojson",
    "regions": FG + "regions-version-simplifiee.geojson",
    "departements": FG + "departements.geojson",
}


def telecharger(nom, url):
    CACHE.mkdir(exist_ok=True)
    f = CACHE / (nom + ".json")
    if not f.exists():
        print("téléchargement", url)
        req = urllib.request.Request(url, headers={"User-Agent": "nos-revisions-cartes"})
        f.write_bytes(urllib.request.urlopen(req, timeout=120).read())
    return json.loads(f.read_text())


def source(nom):
    return telecharger(nom, SOURCES[nom])


def commune(nom, dep):
    """Mairie d'une commune (point), par l'API Découpage administratif."""
    q = urllib.parse.urlencode({"nom": nom, "codeDepartement": dep, "fields": "nom,code,mairie,centre", "format": "json"})
    lu = telecharger(f"commune-{dep}-{nom}", "https://geo.api.gouv.fr/communes?" + q)
    exact = [c for c in lu if c["nom"] == nom] or lu
    c = exact[0]
    pt = (c.get("mairie") or c["centre"])["coordinates"]
    return pt[0], pt[1]


def contour_commune(code):
    lu = telecharger(f"contour-{code}", f"https://geo.api.gouv.fr/communes/{code}?fields=nom,contour&format=geojson&geometry=contour")
    return shape(lu["geometry"])


# ---------- Projections ----------
def natural_earth(lon, lat):
    """Projection Natural Earth (Šavrič et al.), comme d3.geoNaturalEarth1."""
    l, p = math.radians(lon), math.radians(lat)
    p2 = p * p
    p4 = p2 * p2
    x = l * (0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4)))
    y = p * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4)))
    return x, -y


def plate(lat0):
    k = math.cos(math.radians(lat0))
    return lambda lon, lat: (lon * k, -lat)


class Cadre:
    """Projection plus mise à l'échelle dans un viewBox de LARGEUR de large."""

    def __init__(self, proj, lon0, lon1, lat0, lat1, densifier=1.0):
        self.proj = proj
        self.dens = densifier
        coins = [proj(lo, la) for lo in (lon0, lon1) for la in (lat0, lat1)]
        if proj is natural_earth:
            coins = [proj(lo, la) for lo in (-180, 180, 0) for la in (-90, 90, 0)]
        xs = [c[0] for c in coins]
        ys = [c[1] for c in coins]
        self.x0, self.y0 = min(xs), min(ys)
        self.k = LARGEUR / (max(xs) - self.x0)
        self.h = round((max(ys) - self.y0) * self.k)
        self.bbox = box(lon0, lat0, lon1, lat1)
        ml, mh = (lon1 - lon0) * MARGE, (lat1 - lat0) * MARGE_HAUTEUR
        self.contexte = box(lon0 - ml, lat0 - mh, lon1 + ml, lat1 + mh)

    def pt(self, lon, lat):
        x, y = self.proj(lon, lat)
        return (x - self.x0) * self.k, (y - self.y0) * self.k

    def geo(self, g):
        if self.dens:
            g = g.segmentize(self.dens)
        return shapely.transform(g, lambda xy: [self.pt(a, b) for a, b in xy])


def plat(coords):
    out = []
    for x, y in coords:
        out += [round(x), round(y)]
    # retire les points consécutifs identiques après arrondi
    propre = out[:2]
    for i in range(2, len(out), 2):
        if out[i] != propre[-2] or out[i + 1] != propre[-1]:
            propre += out[i:i + 2]
    return propre


def anneaux(g, tol):
    g = g.simplify(tol, preserve_topology=True)
    polys = [g] if isinstance(g, Polygon) else list(getattr(g, "geoms", []))
    r = []
    for p in polys:
        if not isinstance(p, Polygon) or p.area < tol * tol * 2:
            continue
        for a in [p.exterior, *p.interiors]:
            f = plat(a.coords)
            if len(f) >= 6:
                r.append(f)
    return r


def traits(g, tol):
    g = g.simplify(tol)
    lignes = [g] if isinstance(g, LineString) else list(getattr(g, "geoms", []))
    return [plat(l.coords) for l in lignes if isinstance(l, LineString) and len(l.coords) > 1]


def etiquette(g):
    if isinstance(g, (Polygon, MultiPolygon)):
        plus_grand = max(g.geoms, key=lambda p: p.area) if isinstance(g, MultiPolygon) else g
        p = plus_grand.representative_point()
        c = plus_grand.centroid
        p = c if plus_grand.contains(c) else p
        return [round(p.x), round(p.y)]
    if isinstance(g, (LineString, MultiLineString)):
        l = max(g.geoms, key=lambda x: x.length) if isinstance(g, MultiLineString) else g
        p = l.interpolate(0.5, normalized=True)
        return [round(p.x), round(p.y)]
    return [round(g.x), round(g.y)]


class Etage:
    def __init__(self, cadre, tol=0.8):
        self.c = cadre
        self.tol = tol
        self.fond = []
        self.formes = {}
        self.reperes = []
        self.terre = []

    def clip(self, g):
        return g.intersection(self.c.contexte) if self.c.bbox is not None else g

    def vue(self, g):
        return g.intersection(self.c.bbox) if self.c.bbox is not None else g

    def fond_zone(self, classe, g_geo, terre=False, clip=True):
        g = self.clip(g_geo) if clip else g_geo
        if g.is_empty:
            return
        a = anneaux(self.c.geo(g), self.tol)
        if a:
            if terre:
                self.terre.append(len(self.fond))
            self.fond.append(["z", classe, a])

    def fond_ligne(self, classe, g_geo):
        g = self.clip(g_geo)
        if g.is_empty:
            return
        t = traits(self.c.geo(g), self.tol * 0.6)
        if t:
            self.fond.append(["l", classe, t])

    def zone(self, ident, g_geo, hors_terre=False, clip=True, tol=None, dessin=None):
        g = self.clip(g_geo) if clip else g_geo
        gp = self.c.geo(g)
        gv = self.c.geo(self.vue(g_geo)) if clip else gp  # l'étiquette reste dans la vue
        f = {"f": "z", "g": anneaux(gp, tol or self.tol), "e": etiquette(gv if not gv.is_empty else gp), "a": round(gv.area if not gv.is_empty else gp.area)}
        if hors_terre:
            f["ht"] = 1
        if dessin:
            f["d"] = dessin
        self.formes[ident] = f

    def ligne(self, ident, g_geo, dessin=None):
        gp = self.c.geo(self.clip(g_geo))
        gv = self.c.geo(self.vue(g_geo))
        f = {"f": "l", "g": traits(gp, self.tol * 0.6), "e": etiquette(gv if not gv.is_empty else gp)}
        if dessin:
            f["d"] = dessin
        self.formes[ident] = f

    def point(self, ident, lon, lat, r=None, dessin=None):
        x, y = self.c.pt(lon, lat)
        f = {"f": "p", "g": [round(x), round(y)], "e": [round(x), round(y)]}
        if r:
            f["r"] = r
        if dessin:
            f["d"] = dessin
        self.formes[ident] = f

    def repere(self, nom, lon, lat):
        x, y = self.c.pt(lon, lat)
        self.reperes.append([nom, round(x), round(y)])

    def foyer_geo(self, lon0, lat0, lon1, lat1):
        x0, y0 = self.c.pt(lon0, lat1)
        x1, y1 = self.c.pt(lon1, lat0)
        self.foyer = [round(x0), round(y0), round(x1 - x0), round(y1 - y0)]

    def sortie(self):
        return {"l": LARGEUR, "h": self.c.h, "fond": self.fond, "formes": self.formes,
                "reperes": self.reperes, "terre": self.terre, "foyer": getattr(self, "foyer", None)}


def ll(points):
    """Polygone à partir de (lat, lon), dans l'ordre où on les lit sur une carte."""
    return Polygon([(lo, la) for la, lo in points]).buffer(0)


def lo_la(points):
    return Polygon(points).buffer(0)


def trace(points):
    return LineString([(lo, la) for la, lo in points])


# ---------- Données sources ----------
PAYS = source("pays")["features"]
FLEUVES = source("fleuves")["features"]
LACS = source("lacs")["features"]
REGIONS = source("regions")["features"]
DEPS = source("departements")["features"]


def pays(a3):
    return unary_union([shape(f["geometry"]) for f in PAYS if f["properties"]["ADM0_A3"] == a3]).buffer(0)


def fleuve(*noms):
    return unary_union([shape(f["geometry"]) for f in FLEUVES if f["properties"].get("name") in noms])


def lac(nom):
    return unary_union([shape(f["geometry"]) for f in LACS if f["properties"].get("name") == nom]).buffer(0)


def region(nom):
    return unary_union([shape(f["geometry"]) for f in REGIONS if f["properties"]["nom"] == nom]).buffer(0)


def dep(code):
    return unary_union([shape(f["geometry"]) for f in DEPS if f["properties"]["code"] == code]).buffer(0)


FRANCE_HEXAGONE_BOITE = box(-5.5, 41.2, 10, 51.5)


def continent_de(f, part):
    """Continent d'un morceau de pays : Russie coupée à l'Oural, outre-mer rendus à leur continent."""
    p = f["properties"]
    c = p["CONTINENT"]
    x, y = part.centroid.x, part.centroid.y
    if p["ADM0_A3"] == "RUS":
        return "Europe" if x < 60 and x > 0 else "Asia"
    if c == "Europe" and not (-25 < x < 60 and y > 34):
        if x < -30:
            return "South America" if y < 10 else "North America"
        if y < 0:
            return "Africa"
    if c == "Seven seas (open ocean)":
        return None
    return c


# =================== Étage 1 : la Voie lactée (dessin) ===================
def univers():
    W, H = LARGEUR, 640
    rnd = random.Random(7)
    fond = [["d", "espace", f"M0 0H{W}V{H}H0Z"]]
    etoiles = []
    for _ in range(150):
        x, y, r = rnd.uniform(0, W), rnd.uniform(0, H), rnd.choice([0.8, 1.1, 1.5, 2.2])
        etoiles.append(f"M{x:.0f} {y:.0f}h0.01")
        etoiles[-1] = (round(x), round(y), r)
    for x, y, r in etoiles:
        fond.append(["c", "etoile-fond", [x, y, r]])

    def spirale(cx, cy, echelle, bras, tour, inclinaison, aplati):
        chemins = []
        for b in range(bras):
            pts = []
            for i in range(60):
                t = i / 59 * tour
                rr = echelle * 0.12 * math.exp(0.32 * t)
                a = t + b * 2 * math.pi / bras
                x, y = rr * math.cos(a), rr * math.sin(a) * aplati
                xr = x * math.cos(inclinaison) - y * math.sin(inclinaison)
                yr = x * math.sin(inclinaison) + y * math.cos(inclinaison)
                pts.append((cx + xr, cy + yr))
            chemins.append("M" + " L".join(f"{x:.0f} {y:.0f}" for x, y in pts))
        return chemins

    cx, cy = 400, 330
    for d in spirale(cx, cy, 230, 4, 6.6, -0.35, 0.62):
        fond.append(["d", "bras-large", d])
    for d in spirale(cx, cy, 230, 4, 6.6, -0.35, 0.62):
        fond.append(["d", "bras", d])
    fond.append(["e", "bulbe", [cx, cy, 70, 44, -20]])
    fond.append(["e", "coeur", [cx, cy, 30, 19, -20]])
    ax, ay = 860, 120
    for d in spirale(ax, ay, 70, 2, 5.6, 0.5, 0.45):
        fond.append(["d", "bras-loin", d])
    fond.append(["e", "bulbe-loin", [ax, ay, 22, 11, 28]])

    def ellipse(cx, cy, rx, ry, rot):
        pts = []
        for i in range(48):
            a = i / 48 * 2 * math.pi
            x, y = rx * math.cos(a), ry * math.sin(a)
            r = math.radians(rot)
            pts += [round(cx + x * math.cos(r) - y * math.sin(r)), round(cy + x * math.sin(r) + y * math.cos(r))]
        return [pts]

    # le système solaire, à 26 000 années-lumière du centre, dans un bras
    sx, sy = cx + 150, cy + 64
    formes = {
        "voie-lactee": {"f": "z", "g": ellipse(cx, cy, 300, 205, -20), "e": [cx - 120, cy - 150], "a": 190000},
        "systeme-solaire": {"f": "p", "g": [sx, sy], "e": [sx, sy], "r": 6, "d": "soleil-ici"},
        "autre-galaxie": {"f": "z", "g": ellipse(ax, ay, 95, 52, 28), "e": [ax, ay + 70], "a": 15000},
    }
    return {"l": W, "h": H, "fond": fond, "formes": formes, "reperes": [], "terre": [],
            "foyer": [sx - 30, sy - 20, 60, 40]}


# =================== Étage 2 : le système solaire (dessin) ===================
def solaire():
    W, H = LARGEUR, 640
    sx, sy = -40, 330
    rnd = random.Random(3)
    fond = [["d", "espace", f"M0 0H{W}V{H}H0Z"]]
    for _ in range(90):
        fond.append(["c", "etoile-fond", [round(rnd.uniform(0, W)), round(rnd.uniform(0, H)), rnd.choice([0.8, 1.1, 1.5])]])
    planetes = [  # identifiant, rayon d'orbite, angle, rayon dessiné
        ("mercure", 250, -0.30, 11), ("venus", 330, 0.22, 17), ("terre-planete", 410, -0.20, 18),
        ("mars", 490, 0.18, 13), ("jupiter", 610, -0.13, 50), ("saturne", 750, 0.12, 40),
        ("uranus", 860, -0.12, 27), ("neptune", 960, 0.10, 26), ("pluton", 1010, -0.27, 6),
    ]
    formes = {"soleil": {"f": "p", "g": [sx, sy], "e": [sx + 130, sy - 150], "r": 175, "d": "soleil"}}
    for ident, rho, ang, r in planetes:
        fond.append(["c", "orbite" + (" orbite-naine" if ident == "pluton" else ""), [sx, sy, rho]])
    for ident, rho, ang, r in planetes:
        x, y = round(sx + rho * math.cos(ang)), round(sy + rho * math.sin(ang))
        formes[ident] = {"f": "p", "g": [x, y], "e": [x, y + r + 26], "r": r, "d": "planete-" + ident}
        if ident == "saturne":
            fond.append(["e", "anneaux", [x, y, r * 1.9, r * 0.55, -18]])
        if ident == "terre-planete":
            lx, ly = x + 40, y - 34
            formes["lune"] = {"f": "p", "g": [lx, ly], "e": [lx + 26, ly - 14], "r": 6, "d": "lune"}
            tx, ty = x, y
    return {"l": W, "h": H, "fond": fond, "formes": formes, "reperes": [], "terre": [],
            "foyer": [tx - 30, ty - 22, 60, 44]}


# =================== Étage 3 : la Terre ===================
def terre():
    c = Cadre(natural_earth, -180, 180, -90, 90, densifier=1.0)
    c.bbox = None
    e = Etage(c, tol=0.9)
    sphere = Polygon([(-180, -90), (180, -90), (180, 90), (-180, 90)])
    e.fond_zone("mer", sphere, clip=False)
    parts = {}
    for f in PAYS:
        g = shape(f["geometry"])
        for p in (g.geoms if isinstance(g, MultiPolygon) else [g]):
            cont = continent_de(f, p)
            if cont:
                parts.setdefault(cont, []).append(p)
    noms = {"Africa": "afrique", "North America": "amerique-nord", "South America": "amerique-sud", "Asia": "asie",
            "Europe": "europe", "Oceania": "oceanie", "Antarctica": "antarctique"}
    continents = {k: unary_union(v).buffer(0) for k, v in parts.items() if k in noms}
    for k, g in continents.items():
        e.fond_zone("terre c-" + noms[k], g, terre=True, clip=False)
    # Lignes de repère dessinées comme sur un planisphère d'école
    lignes = {"equateur": 0, "tropique-cancer": 23.44, "tropique-capricorne": -23.44, "cercle-arctique": 66.56, "cercle-antarctique": -66.56}
    for ident, lat in lignes.items():
        e.fond_ligne("parallele" + (" equateur-trait" if ident == "equateur" else ""), LineString([(-180, lat), (180, lat)]))
    e.fond_ligne("meridien", LineString([(0, -90), (0, 90)]))
    for k, g in continents.items():
        e.zone(noms[k], g, clip=False)
    for ident, lat in lignes.items():
        e.ligne(ident, LineString([(-180, lat), (180, lat)]))
    e.ligne("greenwich", LineString([(0, -90), (0, 90)]))
    e.ligne("pole-nord", LineString([(-180, 89.9), (180, 89.9)]))
    e.ligne("pole-sud", LineString([(-180, -89.9), (180, -89.9)]))
    e.zone("hemisphere-nord", box(-180, 0, 180, 90), clip=False)
    e.zone("hemisphere-sud", box(-180, -90, 180, 0), clip=False)

    def iso(*a3):
        return unary_union([shape(f["geometry"]) for f in PAYS if f["properties"]["ADM0_A3"] in a3]).buffer(0)

    maghreb = ("MAR", "SAH", "DZA", "TUN", "LBY", "MRT")
    afrique_nord = maghreb + ("EGY", "SDN")
    sub = [f["properties"]["ADM0_A3"] for f in PAYS if f["properties"]["CONTINENT"] == "Africa" and f["properties"]["ADM0_A3"] not in afrique_nord]
    e.zone("maghreb", iso(*maghreb), clip=False)
    e.zone("afrique-subsaharienne", iso(*sub), clip=False)
    e.zone("asie-est", iso(*[f["properties"]["ADM0_A3"] for f in PAYS if f["properties"]["SUBREGION"] == "Eastern Asia"]), clip=False)
    e.zone("asie-sud-est", iso(*[f["properties"]["ADM0_A3"] for f in PAYS if f["properties"]["SUBREGION"] == "South-Eastern Asia"]), clip=False)
    # Océans : découpages grossiers dessinés à la main, la terre est retirée au moment du toucher (ht).
    atlantique = lo_la([(-68, -60), (-68, -55), (-70, -50), (-72, -30), (-75, -10), (-77, 0), (-77, 7), (-80.5, 8.3), (-84, 10.5),
                        (-86, 13), (-89, 14.5), (-92, 16.5), (-97, 18.5), (-100, 22), (-104, 28), (-110, 40), (-115, 55),
                        (-120, 66.56), (30, 66.56), (30, 55), (15, 50), (2, 46), (-3, 40), (-5.6, 36.0), (-3, 33),
                        (10, 10), (20, -10), (20, -34.9), (20, -60)])
    indien = lo_la([(20, -60), (20, -34.9), (25, -10), (30, 10), (32, 30), (36, 32), (44, 35), (48, 36), (55, 36), (60, 38),
                    (100, 25), (99.5, 13), (98.8, 10), (100.5, 6.3), (101.5, 3.5), (103.5, 1.6), (103, -2), (106, -6.6),
                    (110, -7.5), (114, -8), (117, -8.7), (120, -9.7), (124, -9.5), (131, -13), (135, -25), (146.5, -37.5),
                    (146.5, -42), (146.5, -60)])
    bande = box(-180, -60, 180, 66.56)
    pacifique = bande.difference(atlantique).difference(indien)
    e.zone("atlantique", atlantique, hors_terre=True, clip=False, tol=2)
    e.zone("indien", indien, hors_terre=True, clip=False, tol=2)
    e.zone("pacifique", pacifique, hors_terre=True, clip=False, tol=2)
    e.zone("arctique", box(-180, 66.56, 180, 90), hors_terre=True, clip=False, tol=2)
    e.zone("austral", box(-180, -90, 180, -60), hors_terre=True, clip=False, tol=2)
    # Étiquettes des océans là où on les écrit sur une carte d'école
    for ident, (lon, lat) in {"atlantique": (-38, 25), "pacifique": (-140, 0), "indien": (78, -22), "arctique": (40, 80), "austral": (60, -64)}.items():
        e.formes[ident]["e"] = [round(v) for v in c.pt(lon, lat)]
    for ident, (lon, lat) in {"maghreb": (2, 30), "afrique-subsaharienne": (22, 2), "asie-est": (110, 38), "asie-sud-est": (112, 6),
                              "amerique-nord": (-100, 45), "asie": (92, 50), "europe": (25, 52), "oceanie": (134, -25),
                              "antarctique": (10, -80), "hemisphere-nord": (-150, 40), "hemisphere-sud": (-150, -40)}.items():
        e.formes[ident]["e"] = [round(v) for v in c.pt(lon, lat)]
    outremer = {"guadeloupe": (-61.55, 16.25), "martinique": (-61.02, 14.64), "guyane": (-53.1, 3.95),
                "la-reunion": (55.53, -21.12), "mayotte": (45.15, -12.82)}
    for ident, (lon, lat) in outremer.items():
        e.point(ident, lon, lat, dessin="outremer")
    e.ligne("nil", fleuve("Nile"))
    e.ligne("amazone", fleuve("Amazonas"))
    e.ligne("yangzi", fleuve("Chang Jiang", "Yangtze"))
    e.foyer_geo(-11, 35, 27, 58.5)
    return e.sortie()


# =================== Étage 4 : l'Europe ===================
def europe():
    c = Cadre(plate(47), -11, 27, 35, 58.5, densifier=0.5)
    e = Etage(c, tol=1.0)
    e.fond_zone("mer", c.contexte)
    pres = [f for f in PAYS if shape(f["geometry"]).intersects(c.contexte)]
    for f in pres:
        e.fond_zone("terre terre-autre", shape(f["geometry"]), terre=True)
    france = pays("FRA").intersection(FRANCE_HEXAGONE_BOITE)
    e.fond_zone("terre terre-france", france, terre=True)
    for ident, a3 in {"espagne": "ESP", "italie": "ITA", "suisse": "CHE", "allemagne": "DEU", "belgique": "BEL",
                      "royaume-uni": "GBR", "pays-bas": "NLD", "portugal": "PRT", "grece": "GRC", "pologne": "POL"}.items():
        e.zone(ident, pays(a3))
    e.zone("france", france)
    e.point("luxembourg", 6.13, 49.75, dessin="petit-pays")
    e.point("monaco", 7.42, 43.74, dessin="petit-pays")
    e.point("andorre", 1.55, 42.54, dessin="petit-pays")
    e.zone("manche", ll([(48.4, -5.7), (50.0, -5.7), (50.7, -3.0), (51.0, 0.0), (51.15, 1.4), (50.95, 1.9), (49.5, 1.0),
                         (48.6, -1.5), (48.3, -4.5)]), hors_terre=True, tol=2)
    e.zone("mer-du-nord", ll([(51.15, 1.4), (51.0, 3.5), (52.5, 5.0), (53.5, 8.5), (57.1, 8.6), (57.75, 10.6), (58.6, 9.0),
                              (58.1, 8.0), (62.0, 5.0), (61.0, -1.0), (58.5, -3.0), (56.0, -3.0), (54.0, -1.0), (52.5, 0.5),
                              (51.3, 1.2)]), hors_terre=True, tol=2)
    e.zone("atlantique-europe", ll([(27, -25), (66, -25), (66, -8), (58.5, -5), (55, -3.5), (52, -3.5), (50.0, -5.7), (48.4, -5.7),
                                    (48.3, -4.5), (46.5, -1.5), (43.5, -1.2), (43.0, -3.0), (36.0, -5.6), (30, -6), (27, -14)]), hors_terre=True, tol=2)
    e.zone("mediterranee-europe", ll([(36.0, -5.6), (37.5, -4.5), (40, -1), (43, 2.5), (44, 5), (44.6, 8), (44, 12), (45.8, 13.7),
                                      (42, 19), (40, 21), (41, 23), (41, 26), (40.5, 27), (37, 28), (36.5, 36), (30, 36), (30, -6)]), hors_terre=True, tol=2)
    e.zone("golfe-gascogne", ll([(43.4, -1.2), (46.5, -1.2), (47.8, -4.8), (43.6, -8.3)]), hors_terre=True, tol=2)
    for ident, (lon, lat) in {"atlantique-europe": (-8.5, 46), "mediterranee-europe": (5, 39.5), "mer-du-nord": (3.5, 55.5),
                              "manche": (-2.5, 49.9), "golfe-gascogne": (-4.5, 45.3)}.items():
        e.formes[ident]["e"] = [round(v) for v in c.pt(lon, lat)]
    e.foyer_geo(-5.4, 41.2, 10.0, 51.3)
    return e.sortie()


# =================== Étage 5 : la France ===================
VILLES = {  # identifiant : (nom de la commune, département)
    "paris": ("Paris", "75"), "lyon": ("Lyon", "69"), "marseille": ("Marseille", "13"), "toulouse": ("Toulouse", "31"),
    "lille": ("Lille", "59"), "ajaccio": ("Ajaccio", "2A"), "dijon": ("Dijon", "21"), "rennes": ("Rennes", "35"),
    "orleans": ("Orléans", "45"), "strasbourg": ("Strasbourg", "67"), "rouen": ("Rouen", "76"), "bordeaux": ("Bordeaux", "33"),
    "nantes": ("Nantes", "44"),
}
REGIONS_IDS = {
    "Provence-Alpes-Côte d'Azur": "paca", "Occitanie": "occitanie", "Auvergne-Rhône-Alpes": "auvergne-rhone-alpes",
    "Nouvelle-Aquitaine": "nouvelle-aquitaine", "Bretagne": "bretagne", "Normandie": "normandie", "Hauts-de-France": "hauts-de-france",
    "Grand Est": "grand-est", "Île-de-France": "ile-de-france", "Bourgogne-Franche-Comté": "bourgogne-franche-comte",
    "Centre-Val de Loire": "centre-val-de-loire", "Pays de la Loire": "pays-de-la-loire", "Corse": "corse",
}
ALPES = [(46.35, 6.45), (46.0, 6.95), (45.85, 7.05), (45.45, 7.15), (45.1, 6.9), (44.85, 7.0), (44.35, 7.0), (44.15, 7.65),
         (43.85, 7.5), (43.9, 6.6), (44.2, 6.0), (44.6, 5.7), (45.2, 5.7), (45.7, 5.95), (46.1, 6.2)]


def france():
    c = Cadre(plate(46.3), -5.4, 10.0, 41.2, 51.3, densifier=0.25)
    e = Etage(c, tol=1.0)
    e.fond_zone("mer", c.contexte)
    for f in PAYS:
        if f["properties"]["ADM0_A3"] != "FRA" and shape(f["geometry"]).intersects(c.contexte):
            e.fond_zone("terre terre-autre", shape(f["geometry"]), terre=True)
    for f in REGIONS:
        e.fond_zone("terre terre-france", shape(f["geometry"]), terre=True)
    e.fond_zone("lac", lac("Lake Geneva"))
    e.fond_ligne("fleuve-fond", fleuve("Rhône", "Durance"))
    for f in REGIONS:
        e.zone(REGIONS_IDS[f["properties"]["nom"]], shape(f["geometry"]))
    for ident, nom in {"seine": ("Seine",), "loire": ("Loire",), "garonne": ("Garonne",), "rhin": ("Rhin", "Rhine")}.items():
        e.ligne(ident, fleuve(*nom))
    e.zone("alpes", ll(ALPES), dessin="massif")
    e.zone("pyrenees", ll([(43.35, -1.75), (43.05, -0.6), (42.85, 0.7), (42.6, 1.7), (42.45, 2.6), (42.45, 3.15), (42.3, 3.0),
                           (42.5, 1.45), (42.65, 0.0), (42.85, -1.0), (43.1, -1.75)]), dessin="massif")
    e.zone("massif-central", ll([(46.2, 3.0), (45.9, 4.3), (45.2, 4.4), (44.5, 4.2), (43.9, 3.6), (43.5, 2.6), (43.8, 1.8),
                                 (44.6, 1.6), (45.3, 1.6), (45.9, 2.2)]), dessin="massif")
    e.zone("jura", ll([(47.55, 7.0), (47.3, 7.0), (46.6, 6.4), (46.2, 5.95), (45.9, 5.75), (46.1, 5.45), (46.6, 5.7), (47.1, 6.2),
                       (47.45, 6.75)]), dessin="massif")
    e.zone("vosges", ll([(48.75, 7.15), (48.35, 7.2), (47.85, 7.05), (47.7, 6.85), (47.9, 6.6), (48.4, 6.85), (48.7, 6.95)]), dessin="massif")
    e.zone("leman", lac("Lake Geneva"), tol=0.5)
    for ident, (nom, d) in VILLES.items():
        lon, lat = commune(nom, d)
        e.point(ident, lon, lat, dessin="ville")
    e.foyer_geo(4.1, 42.95, 7.9, 45.2)
    return e.sortie()


# =================== Étage 6 : Provence-Alpes-Côte d'Azur ===================
PREFECTURES = {"digne": ("Digne-les-Bains", "04"), "gap": ("Gap", "05"), "nice": ("Nice", "06"), "marseille-prefecture": ("Marseille", "13"),
               "toulon": ("Toulon", "83"), "avignon": ("Avignon", "84"), "aix": ("Aix-en-Provence", "13"), "cannes": ("Cannes", "06"),
               "briancon": ("Briançon", "05"), "grasse": ("Grasse", "06")}


def paca():
    c = Cadre(plate(44), 4.1, 7.9, 42.95, 45.2, densifier=0.05)
    e = Etage(c, tol=0.9)
    e.fond_zone("mer", c.contexte)
    france_paca = unary_union([shape(f["geometry"]) for f in DEPS if shape(f["geometry"]).intersects(c.contexte)]).buffer(0)
    italie = pays("ITA").buffer(0.04).difference(france_paca.buffer(0.002))
    e.fond_zone("terre terre-autre", italie, terre=True)
    for f in DEPS:
        g = shape(f["geometry"])
        if g.intersects(c.contexte):
            e.fond_zone("terre terre-france" + (" terre-region" if f["properties"]["code"] in ("04", "05", "06", "13", "83", "84") else ""), g, terre=True)
    e.fond_ligne("frontiere-region", region("Provence-Alpes-Côte d'Azur").boundary)
    for ident, code in {"alpes-de-haute-provence": "04", "hautes-alpes": "05", "alpes-maritimes": "06",
                        "bouches-du-rhone": "13", "var": "83", "vaucluse": "84"}.items():
        e.zone(ident, dep(code))
    e.zone("occitanie-voisine", region("Occitanie"))
    e.zone("auvergne-rhone-alpes-voisine", region("Auvergne-Rhône-Alpes"))
    e.zone("italie-voisine", italie)
    e.zone("mediterranee-paca", ll([(43.6, 3.0), (42.0, 3.0), (42.0, 9.2), (44.2, 9.2), (43.95, 7.9), (43.75, 7.2), (43.55, 6.5), (43.35, 5.5), (43.45, 5.1),
                                    (43.5, 4.9), (43.6, 4.6), (43.6, 4.1)]), hors_terre=True, tol=2)
    e.formes["mediterranee-paca"]["e"] = [round(v) for v in c.pt(6.0, 43.15)]
    e.ligne("rhone", fleuve("Rhône"))
    e.ligne("durance", fleuve("Durance"))
    e.ligne("fleuve-var", trace([(44.26, 6.76), (44.13, 6.77), (44.09, 6.85), (44.02, 6.82), (43.95, 6.81), (43.955, 6.89),
                                 (43.95, 7.00), (43.93, 7.09), (43.86, 7.19), (43.75, 7.19), (43.66, 7.195)]))
    e.ligne("verdon", trace([(44.30, 6.62), (44.15, 6.60), (43.98, 6.55), (43.85, 6.51), (43.76, 6.36), (43.77, 6.20),
                             (43.79, 6.08), (43.76, 5.88), (43.72, 5.80)]))
    e.zone("camargue", dep("13").intersection(ll([(43.68, 4.63), (43.33, 4.85), (43.42, 4.55), (43.45, 4.40), (43.60, 4.45)])), dessin="camargue")
    e.point("ventoux", 5.279, 44.174, dessin="sommet")
    e.point("serre-poncon", 6.35, 44.52, dessin="lac-point")
    e.point("monaco-voisin", 7.42, 43.74, dessin="petit-pays")
    for ident, (nom, d) in PREFECTURES.items():
        lon, lat = commune(nom, d)
        e.point(ident, lon, lat, dessin="ville")
    e.foyer_geo(4.15, 43.12, 5.95, 43.98)
    return e.sortie()


# =================== Étage 7 : les Bouches-du-Rhône et Éguilles ===================
def bdr():
    c = Cadre(plate(43.5), 4.15, 5.95, 43.12, 43.98, densifier=0.02)
    e = Etage(c, tol=0.8)
    e.fond_zone("mer", c.contexte)
    for f in DEPS:
        g = shape(f["geometry"])
        if g.intersects(c.contexte):
            e.fond_zone("terre " + ("terre-france terre-region" if f["properties"]["code"] == "13" else "terre-france"), g, terre=True)
    e.fond_zone("commune-eguilles", contour_commune("13032"), clip=True)
    e.fond_ligne("fleuve-fond", fleuve("Rhône", "Durance"))
    for nom, d in (("Aix-en-Provence", "13"), ("Marseille", "13")):
        e.repere(nom, *commune(nom, d))
    lon, lat = commune("Éguilles", "13")
    e.point("eguilles", lon, lat, dessin="village")
    e.ligne("sainte-victoire", trace([(43.537, 5.535), (43.533, 5.59), (43.532, 5.62), (43.530, 5.67), (43.522, 5.72)]), dessin="crete")
    for ident, nom in (("arles", "Arles"), ("istres", "Istres")):
        e.point(ident, *commune(nom, "13"), dessin="ville")
    e.zone("etang-de-berre", ll([(43.56, 5.02), (43.53, 5.12), (43.48, 5.23), (43.41, 5.20), (43.39, 5.08), (43.43, 5.00), (43.49, 5.00)]),
           dessin="etang")
    x, y = c.pt(lon, lat)
    e.foyer = [round(x) - 20, round(y) - 14, 40, 28]
    return e.sortie()


def main():
    etages = {"univers": univers(), "solaire": solaire(), "terre": terre(), "europe": europe(),
              "france": france(), "paca": paca(), "bdr": bdr()}
    corps = json.dumps(etages, ensure_ascii=False, separators=(",", ":"))
    SORTIE.write_text(
        "/* Fichier fabriqué par modules/zoom/outils/cartes.py : ne pas le modifier à la main.\n"
        "   Sources et licences : docs/zoom/PLAN.md (Natural Earth, domaine public ; IGN ADMIN EXPRESS COG\n"
        "   par france-geojson, Licence Ouverte Etalab ; geo.api.gouv.fr ; dessins faits main). */\n"
        "(typeof window !== 'undefined' ? window : globalThis).ZoomCartes = " + corps + ";\n",
        encoding="utf-8",
    )
    print(f"{SORTIE.relative_to(ICI.parents[2])} : {SORTIE.stat().st_size / 1024:.0f} Ko")
    for k, v in etages.items():
        print(f"  {k} : {len(json.dumps(v)) / 1024:.0f} Ko, {len(v['formes'])} formes, viewBox {v['l']} x {v['h']}")


if __name__ == "__main__":
    main()
