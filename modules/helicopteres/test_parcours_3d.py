# /// script
# requires-python = ">=3.10"
# dependencies = ["playwright"]
# ///
"""Parcours au rendu réel du prototype 3D des hélicoptères (D-26), avec Chrome installé et WebGL actif.

Usage : uv run modules/helicopteres/test_parcours_3d.py
Sert le dépôt en local, puis vérifie aux trois formats (iPad paysage 1080 x 810, iPad portrait 810 x 1080,
iPhone 402 x 874) :
- le chargement de la scène (WebGL) depuis un état du module 2D sans le champ nouveau ;
- le choix de la langue (français en premier) quand l'état n'en a pas, le choix de la mission quand il
  n'y en a pas, l'anglais quand il a été choisi ;
- les trois commandes tenues au doigt (le collectif glissé, le manche poussé, une pédale gardée) et leur
  effet (on monte, on avance, le nez tourne), le compteur de tours immobile quand on tire le collectif ;
- les cinq missions jouées jusqu'au bout (la radio touchée près de la tour), le tampon posé sur les deux
  pages du carnet, l'arrêt du rotor et la fiche de fin ;
- l'état relu sans perte (champs du module 2D et champ inconnu gardés, vol3d ajouté) ;
- aucune erreur JavaScript, aucune cible de moins de 56 px, ni rouge ni croix.
Mesure aussi la fréquence d'images en vol réel, à la résolution de l'iPad (x1,5).
Captures dans modules/helicopteres/captures-3d/ (ignoré par git et par Vercel) : les regarder.
"""
import functools
import http.server
import json
import sys
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

RACINE = Path(__file__).resolve().parents[2]
CAPTURES = Path(__file__).resolve().parent / "captures-3d"
FORMATS = {"ipad-paysage": (1080, 810), "ipad-portrait": (810, 1080), "iphone": (402, 874)}
PROBLEMES: list[str] = []

CIBLES_JS = """() => [...document.querySelectorAll('#app button, #app a.btn, #app a.rond')].filter(b => {
  const r = b.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  const s = getComputedStyle(b);
  if (s.visibility === 'hidden' || s.display === 'none' || b.closest('[hidden]')) return false;
  return Math.min(r.width, r.height) < 56;
}).map(b => (b.className || b.tagName) + ' ' + Math.round(b.getBoundingClientRect().width) + 'x' + Math.round(b.getBoundingClientRect().height)).slice(0, 5)"""

ROUGE_JS = """() => {
  const rouge = c => { const m = c.match(/rgba?\\((\\d+), (\\d+), (\\d+)/); return m && +m[1] > 180 && +m[2] < 90 && +m[3] < 90; };
  const l = [];
  document.querySelectorAll('#app *').forEach(el => {
    const cl = typeof el.className === 'string' ? el.className : (el.className && el.className.baseVal) || '';
    if (/rouge|croix|erreur/.test(cl)) l.push(cl);
    if (el.closest('svg')) return;
    const s = getComputedStyle(el);
    if (rouge(s.color) || rouge(s.backgroundColor) || rouge(s.borderTopColor)) l.push((cl || el.tagName) + ' ' + s.color + ' ' + s.backgroundColor);
  });
  return l.slice(0, 3);
}"""

DEBORDEMENTS_JS = """() => {
  const w = document.documentElement.clientWidth;
  const hors = [];
  if (document.documentElement.scrollWidth > w + 1) hors.push('page : scrollWidth ' + document.documentElement.scrollWidth);
  document.querySelectorAll('.v-hud *').forEach(el => {
    if (el.closest('svg') || el.classList.contains('v-doigt')) return;
    const r = el.getBoundingClientRect();
    if (r.width && (r.right > w + 1 || r.left < -1)) hors.push((typeof el.className === 'string' ? el.className : el.tagName) + ' ' + Math.round(r.left) + '..' + Math.round(r.right));
  });
  return hors.slice(0, 5);
}"""

ESPION = """
window.__paroles = [];
if (window.speechSynthesis) {
  const ss = window.speechSynthesis;
  ss.speak = u => { window.__paroles.push({ texte: u.text, langue: u.lang }); setTimeout(() => { if (u.onend) u.onend(); }, 5); };
  ss.cancel = () => {};
  ss.getVoices = () => [{ lang: 'xx-XX' }];
}
"""

# Un pilote automatique (dans la page) : une vitesse voulue vers une cible, convertie en manche.
PILOTE_JS = """(cible, collectif, arret) => (v) => {
  const V = window.__vol3d.V;
  const dx = cible.x - v.pos.x, dz = cible.z - v.pos.z, d = Math.hypot(dx, dz);
  const voulue = d > arret ? Math.min(7, (d - arret) * 0.35) : 0;
  const ex = (d > 1e-6 ? dx / d : 0) * voulue - v.vit.x, ez = (d > 1e-6 ? dz / d : 0) * voulue - v.vit.z;
  const fa = V.avant(v.cap), fd = V.droite(v.cap), b = x => Math.max(-1, Math.min(1, x));
  const c = { collectif, mancheY: b((ex * fa.x + ez * fa.z) * 0.4), mancheX: b((ex * fd.x + ez * fd.z) * 0.4) };
  if (arret === 0 && d < 3 && V.vitesseH(v) < 1.5) c.collectif = 0;
  return c;
}"""

# Un état du module 2D, sans le champ nouveau (vol3d), avec un champ inconnu : il doit survivre tel quel.
ETAT_2D = {
    "version": 1, "etapes": {"helico": "2026-11-07", "vol": "2026-11-07"}, "cartes": {"p-pales|q": {"boite": 2, "vu": True, "prochain": "2026-11-09", "justesJours": ["2026-11-07"], "erreurs": 0, "debut": "2026-11-07"}},
    "jours": ["2026-11-07"], "brevet": {}, "objets": {"ecusson": "2026-11-07", "autocollant": "2026-11-07"}, "tampons": [],
    "mission": "feux", "couleur": "orange", "conception": "oui", "parties": ["pales"], "trouves": [],
    "experience": {"hypothese": None, "verifs": [], "mesures": {}, "conclusion": None}, "inconnu": 42,
}


class Silencieux(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def servir():
    gestion = functools.partial(Silencieux, directory=str(RACINE))
    serveur = http.server.ThreadingHTTPServer(("127.0.0.1", 0), gestion)
    threading.Thread(target=serveur.serve_forever, daemon=True).start()
    return serveur, f"http://127.0.0.1:{serveur.server_address[1]}"


def verifier(cond, message):
    if not cond:
        PROBLEMES.append(message)


def contexte(navigateur, fmt, etat, echelle=1):
    l, h = FORMATS[fmt]
    ctx = navigateur.new_context(viewport={"width": l, "height": h}, device_scale_factor=echelle, has_touch=(fmt == "iphone"))
    ctx.add_init_script(ESPION)
    if etat is not None:
        ctx.add_init_script(f"if (!sessionStorage.getItem('pose')) {{ sessionStorage.setItem('pose', '1'); localStorage.setItem('henri.helicopteres', {json.dumps(json.dumps(etat))}); }}")
    ctx.route("**/voix/index.json", lambda r: r.fulfill(status=200, content_type="application/json", body="{}"))
    ctx.route("**/api/**", lambda r: r.fulfill(status=200, content_type="application/json", body=r.request.post_data or "{}"))
    page = ctx.new_page()
    erreurs: list[str] = []
    page.on("pageerror", lambda e: erreurs.append("JS : " + str(e)))
    page.on("console", lambda m: erreurs.append("console : " + m.text) if m.type == "error" else None)
    return ctx, page, erreurs


def capture(page, nom, erreurs):
    page.evaluate("document.fonts.ready")
    page.wait_for_timeout(500)
    page.screenshot(path=str(CAPTURES / f"{nom}.png"))
    for libelle, js in (("débordement horizontal", DEBORDEMENTS_JS), ("cibles de moins de 56 px", CIBLES_JS), ("rouge ou croix", ROUGE_JS)):
        r = page.evaluate(js)
        if r:
            PROBLEMES.append(f"{nom} : {libelle} {r}")
    while erreurs:
        PROBLEMES.append(f"{nom} : {erreurs.pop(0)}")


def ev(page, js, *arg):
    return page.evaluate(js, *arg) if arg else page.evaluate(js)


def etat_vol(page):
    return ev(page, "__vol3d.etat()")


def avancer(page, secondes, pilote=None):
    if pilote:
        return ev(page, f"([s, c, k, a]) => __vol3d.avancer(s, ({PILOTE_JS})(c, k, a))", [secondes, *pilote])
    return ev(page, "s => __vol3d.avancer(s)", secondes)


def attendre(page, cle, valeur, maximum=30):
    """Avance le temps simulé par demi-secondes jusqu'à ce que etat[cle] vaille valeur."""
    e = etat_vol(page)
    t = 0
    while e[cle] != valeur and t < maximum:
        e = avancer(page, 0.5)
        t += 0.5
    return e


def centre(page, sel):
    b = page.locator(sel).bounding_box()
    return b["x"] + b["width"] / 2, b["y"] + b["height"] / 2, b


def jouer_les_missions(page, fmt, err, lg):
    """Les cinq missions : commandes tenues au doigt, puis pilote automatique pour finir chaque mission."""
    n = fmt
    e = avancer(page, 7)
    verifier(e["rotor"] == "marche", f"{n} : le rotor a pris sa vitesse ({e['rotor']})")
    verifier(abs(e["tours"] - 390) < 1e-6, f"{n} : 390 tours par minute")
    e = attendre(page, "mission", "decoller")
    verifier(e["phase"] == "vol" and e["mission"] == "decoller", f"{n} : première mission (décoller), {e['phase']} {e['mission']}")
    capture(page, f"{n}-2-mission-decoller", err)

    # Le collectif : on fait glisser le levier vers le haut avec le doigt (la souris), et on le tient.
    x, y, b = centre(page, ".v-poignee")
    rail = page.locator(".v-rail").bounding_box()
    page.mouse.move(x, y)
    page.mouse.down()
    page.mouse.move(x, rail["y"] + rail["height"] * 0.22, steps=8)
    e = etat_vol(page)
    verifier(e["levier"] > 0.6, f"{n} : le levier du collectif a monté ({e['levier']:.2f})")
    toursAvant = e["tours"]
    e = avancer(page, 0.5)
    verifier(page.locator(".v-collectif.actif").count() == 1, f"{n} : le collectif brille quand on le tient")
    capture(page, f"{n}-3-collectif-tenu", err)
    page.mouse.up()
    e = avancer(page, 3.5)
    verifier(e["tours"] == toursAvant, f"{n} : le compteur de tours n'a pas bougé ({toursAvant} puis {e['tours']})")
    verifier(not e["sol"] and e["hauteur"] > 2.5, f"{n} : décollé ({e['hauteur']:.1f} m)")
    verifier(bool(e["missions"].get("decoller")), f"{n} : tampon « décoller » noté")
    page.wait_for_timeout(1300)
    verifier(page.locator(".v-toast.voit .v-page-tampon.abat").count() == 2, f"{n} : le tampon s'abat sur la page d'Henri et sur celle de Moussi")
    capture(page, f"{n}-4-tampon-carnet", err)

    # Le levier au milieu : vol stationnaire au-dessus du H.
    page.mouse.move(*centre(page, ".v-poignee")[:2])
    page.mouse.down()
    page.mouse.move(x, rail["y"] + rail["height"] * 0.5, steps=6)
    page.mouse.up()
    e = attendre(page, "mission", "stationnaire")
    verifier(e["mission"] == "stationnaire", f"{n} : deuxième mission (stationnaire), {e['mission']}")
    e = avancer(page, 8)
    verifier(bool(e["missions"].get("stationnaire")), f"{n} : stationnaire réussi ({e['hauteur']:.1f} m, phase {e['phase']}, mission {e['mission']})")
    e = attendre(page, "mission", "tour")
    verifier(e["mission"] == "tour", f"{n} : troisième mission (la tour), {e['mission']}")

    # Le manche : on le pousse vers le haut et on le garde ; l'hélicoptère avance.
    mx, my, _ = centre(page, ".v-bouton")
    z0 = etat_vol(page)["pos"]["z"]
    page.mouse.move(mx, my)
    page.mouse.down()
    page.mouse.move(mx, my - 90, steps=6)
    e = avancer(page, 3)
    verifier(e["manche"][1] > 0.8, f"{n} : le manche est poussé vers l'avant ({e['manche'][1]:.2f})")
    verifier(e["pos"]["z"] < z0 - 6, f"{n} : on avance vers la tour ({z0:.1f} vers {e['pos']['z']:.1f})")
    capture(page, f"{n}-5-manche-tenu", err)
    page.mouse.up()
    e = avancer(page, 0.2)
    verifier(e["manche"] == [0, 0], f"{n} : le manche revient au milieu quand on le lâche")
    lieux = ev(page, "__vol3d.lieux")
    avancer(page, 14, (lieux["tour"], 0.5, 30))
    page.wait_for_selector(".v-radio:not([hidden])", timeout=3000)
    capture(page, f"{n}-6-radio", err)
    page.click(".v-radio", force=True)
    e = avancer(page, 12)
    verifier(bool(e["missions"].get("tour")), f"{n} : la tour a répondu à la radio")
    e = attendre(page, "mission", "tourner")
    verifier(e["mission"] == "tourner", f"{n} : quatrième mission (tourner), {e['mission']}")

    # Les pédales : on garde le doigt sur la pédale droite, le nez tourne à droite.
    cap0 = etat_vol(page)["cap"]
    px, py, _ = centre(page, ".v-pedale[data-pedale='1']")
    page.mouse.move(px, py)
    page.mouse.down()
    e = avancer(page, 1.5)
    verifier(e["cap"] < cap0 - 0.3, f"{n} : la pédale droite tourne le nez à droite ({cap0:.2f} vers {e['cap']:.2f})")
    capture(page, f"{n}-7-pedale-tenue", err)
    e = avancer(page, 5)
    page.mouse.up()
    e = avancer(page, 3)
    if not e["missions"].get("tourner"):
        ev(page, "() => __vol3d.avancer(10, () => ({ collectif: 0.5, pedales: 1 }))")
        e = avancer(page, 4)
    verifier(bool(e["missions"].get("tourner")), f"{n} : tourné sur place, face au H")
    e = attendre(page, "mission", "poser")
    verifier(e["mission"] == "poser", f"{n} : cinquième mission (se poser), {e['mission']}")
    e = avancer(page, 30, (lieux["H"], 0.5, 0))
    verifier(bool(e["missions"].get("poser")), f"{n} : posé sur le H ({e['pos']['x']:.1f}, {e['pos']['z']:.1f}, sol {e['sol']})")
    e = attendre(page, "phase", "coupure")
    verifier(e["phase"] == "coupure", f"{n} : le moteur se coupe ({e['phase']})")
    page.wait_for_timeout(300)
    capture(page, f"{n}-8-coupure", err)
    e = attendre(page, "phase", "fin")
    verifier(e["rotor"] == "arret" and e["phase"] == "fin", f"{n} : le rotor s'arrête, fiche de fin ({e['rotor']}, {e['phase']})")
    page.wait_for_timeout(600)
    verifier(page.locator(".v-voile:not([hidden]) .v-grand-tampons .pose").count() == 10, f"{n} : cinq tampons sur chacune des deux pages")
    capture(page, f"{n}-9-fin", err)
    dits = [p for p in ev(page, "window.__paroles") if p["texte"]]
    attendu = "fr-FR" if lg == "fr" else "en-GB"
    verifier(len(dits) > 10, f"{n} : Moussi parle ({len(dits)} phrases)")
    verifier(all(p["langue"] == attendu for p in dits[2:]), f"{n} : les phrases sont dites en {attendu}")
    return ev(page, "JSON.parse(localStorage.getItem('henri.helicopteres'))")


def main():
    CAPTURES.mkdir(exist_ok=True)
    serveur, base = servir()
    url = base + "/henri/helicopteres-3d.html"
    with sync_playwright() as p:
        navigateur = p.chromium.launch(channel="chrome", args=["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"])

        # iPad paysage : un état du module 2D sans langue ; le choix de langue, le français en premier.
        sans_langue = dict(ETAT_2D)
        ctx, page, err = contexte(navigateur, "ipad-paysage", sans_langue)
        page.goto(url)
        page.wait_for_selector(".v-langue")
        langues = page.locator(".v-langue").evaluate_all("l => l.map(b => b.dataset.langue)")
        verifier(langues[0] == "fr", f"le français est proposé en premier ({langues})")
        capture(page, "ipad-paysage-0-langue", err)
        page.click(".v-langue[data-langue='fr']")
        page.wait_for_selector("[data-a=demarrer]")
        page.wait_for_timeout(1500)
        verifier(ev(page, "!!document.querySelector('canvas.v-toile') && !!document.querySelector('canvas.v-toile').getContext('webgl2')"), "la scène WebGL est là")
        capture(page, "ipad-paysage-1-attente", err)
        page.click("[data-a=demarrer]", force=True)
        final = jouer_les_missions(page, "ipad-paysage", err, "fr")
        for k, val in ETAT_2D.items():
            verifier(final.get(k) == val, f"état relu sans perte : le champ {k} a changé ({final.get(k)!r})")
        verifier(final.get("langue") == "fr", "la langue choisie est gardée")
        verifier(sorted(final.get("vol3d", {}).get("missions", {})) == sorted(["decoller", "stationnaire", "tour", "tourner", "poser"]), f"cinq tampons de vol rangés ({final.get('vol3d')})")
        # Relu au rechargement : les cinq pastilles sont tamponnées, rien n'est perdu.
        page.reload()
        page.wait_for_selector("[data-a=demarrer]")
        verifier(page.locator(".v-pastille.faite").count() == 5, "au rechargement, les cinq missions sont tamponnées")
        relu = ev(page, "JSON.parse(localStorage.getItem('henri.helicopteres'))")
        verifier(relu == final, "au rechargement, l'état est identique")
        # Le carnet du module 2D montre les tampons de vol sur les deux pages.
        page.goto(base + "/henri/helicopteres.html")
        page.wait_for_selector("[data-a=carnet]")
        page.click("[data-a=carnet]")
        page.wait_for_selector(".h-livret")
        verifier(page.locator(".h-vols i").count() == 10, f"le carnet 2D montre les cinq tampons de vol sur les deux pages ({page.locator('.h-vols i').count()})")
        page.screenshot(path=str(CAPTURES / "ipad-paysage-10-carnet-2d.png"))
        ctx.close()

        # iPad portrait : un état sans mission : le choix de la mission, puis le vol.
        ctx, page, err = contexte(navigateur, "ipad-portrait", {"version": 1, "langue": "fr"})
        page.goto(url)
        page.wait_for_selector(".v-mission-carte")
        capture(page, "ipad-portrait-0-mission", err)
        page.click(".v-mission-carte[data-mission='police']")
        page.wait_for_selector("[data-a=demarrer]")
        page.wait_for_timeout(1200)
        capture(page, "ipad-portrait-1-attente", err)
        page.click("[data-a=demarrer]", force=True)
        final = jouer_les_missions(page, "ipad-portrait", err, "fr")
        verifier(final.get("mission") == "police" and final.get("couleur") == "bleu", "la mission choisie est rangée")
        ctx.close()

        # iPhone, en anglais.
        ctx, page, err = contexte(navigateur, "iphone", {"version": 1, "langue": "en", "mission": "secours"})
        page.goto(url)
        page.wait_for_selector("[data-a=demarrer]")
        page.wait_for_timeout(1200)
        capture(page, "iphone-1-attente", err)
        page.click("[data-a=demarrer]", force=True)
        jouer_les_missions(page, "iphone", err, "en")
        ctx.close()

        # La fréquence d'images en vol réel, à la résolution de l'iPad (deux pixels par point, plafond x1,5).
        ctx, page, err = contexte(navigateur, "ipad-paysage", {"version": 1, "langue": "fr", "mission": "tourisme"}, echelle=2)
        page.goto(url + "?fps&ratio=1.5")
        page.wait_for_selector("[data-a=demarrer]")
        page.click("[data-a=demarrer]", force=True)
        ev(page, "() => __vol3d.forcer({ collectif: 0.7, mancheY: 0.6, pedales: 0.3 })")
        page.wait_for_timeout(12500)
        e = etat_vol(page)
        journal = e["journalFps"][1:]
        moyenne = sum(journal) / max(1, len(journal))
        print(f"Fréquence d'images en vol (Chrome, x{e['ratio']}) : {journal} ; moyenne {moyenne:.1f} images par seconde")
        verifier(moyenne > 45, f"fréquence d'images trop basse ({moyenne:.1f})")
        page.screenshot(path=str(CAPTURES / "ipad-paysage-11-vol-reel.png"))
        while err:
            PROBLEMES.append("vol réel : " + err.pop(0))
        ctx.close()
        navigateur.close()
    serveur.shutdown()
    if PROBLEMES:
        print("PROBLÈMES :")
        for x in PROBLEMES:
            print(" -", x)
        sys.exit(1)
    print("Parcours 3D : tout est vert. Captures dans", CAPTURES)


if __name__ == "__main__":
    main()
