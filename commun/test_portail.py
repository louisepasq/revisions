# /// script
# requires-python = ">=3.10"
# dependencies = ["playwright"]
# ///
"""Parcours au rendu réel du portail en cahiers par matière (D-19), avec Chrome installé.

Usage : uv run commun/test_portail.py
Sert le dépôt en local, pré-remplit le localStorage avec des résumés réalistes (ceux que publient
les modules, contrat dans docs/ARCHITECTURE.md), puis, pour Henri et Clara, aux trois formats
(iPad paysage 1080 x 810, iPad portrait 810 x 1080, iPhone 402 x 874) et pour deux états
(« aujourd'hui » : peu de données, comme au premier jour ; « riche » : tous les modules en route) :
l'accueil, la page de la matière, la vue « My week », le retour, et le coin parent en paysage.
Contrôles : erreur JavaScript, débordement horizontal, texte d'une ligne coupé, cible tactile de
moins de 56 px, accueil d'iPad qui défile, rouge, Start qui mène à la bonne page, bulle lue.
Captures dans commun/captures/ (ignoré par git et par Vercel) : les regarder après chaque changement.
"""
import datetime
import functools
import http.server
import json
import sys
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

RACINE = Path(__file__).resolve().parents[1]
CAPTURES = Path(__file__).resolve().parent / "captures"
FORMATS = {"ipad-paysage": (1080, 810), "ipad-portrait": (810, 1080), "iphone": (402, 874)}
PROBLEMES: list[str] = []

DEBORDEMENTS_JS = """() => {
  const w = document.documentElement.clientWidth;
  const hors = [];
  if (document.documentElement.scrollWidth > w + 1) hors.push('page : scrollWidth ' + document.documentElement.scrollWidth);
  document.querySelectorAll('body *').forEach(el => {
    if (el.closest('#kr-sprite')) return;
    const r = el.getBoundingClientRect();
    if (r.width && (r.right > w + 1 || r.left < -1)) hors.push((typeof el.className === 'string' ? el.className : el.tagName) + ' ' + Math.round(r.left) + '..' + Math.round(r.right));
  });
  return hors.slice(0, 5);
}"""

# Cibles tactiles : tout lien ou bouton visible fait au moins 56 px dans sa plus petite dimension.
CIBLES_JS = """() => [...document.querySelectorAll('a[href], button, label.btn')].filter(b => {
  if (b.closest('#kr-sprite')) return false;
  const r = b.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  const s = getComputedStyle(b);
  if (s.visibility === 'hidden' || s.display === 'none') return false;
  return Math.min(r.width, r.height) < 56;
}).map(b => (typeof b.className === 'string' ? b.className : b.tagName) + ' ' + Math.round(b.getBoundingClientRect().width) + 'x' + Math.round(b.getBoundingClientRect().height)).slice(0, 5)"""

# Un texte qui doit tenir sur une ligne (.l1) ne doit pas être coupé par des points de suspension.
COUPES_JS = """() => [...document.querySelectorAll('.portail .l1, .portail .nom-court, .portail .nom-long')].filter(el => {
  const r = el.getBoundingClientRect();
  return r.width && el.scrollWidth > el.clientWidth + 1;
}).map(el => el.textContent.trim().slice(0, 30)).slice(0, 5)"""

# Jamais de rouge pour l'enfant : aucun texte, fond ou bord franchement rouge sur le portail.
ROUGE_JS = """() => {
  const rouge = c => { const m = /rgba?\\((\\d+), (\\d+), (\\d+)/.exec(c); if (!m) return false; const [r, g, b] = m.slice(1).map(Number); return r > 170 && g < 90 && b < 90; };
  return [...document.querySelectorAll('.portail *')].filter(el => {
    if (el.closest('svg.masc')) return false; // le t-shirt de Pooh Bear
    const s = getComputedStyle(el);
    return rouge(s.color) || rouge(s.backgroundColor) || rouge(s.borderTopColor);
  }).map(el => typeof el.className === 'string' ? el.className : el.tagName).slice(0, 5);
}"""

ESPION_VOIX = """
window.__paroles = [];
if (window.speechSynthesis) {
  const ss = window.speechSynthesis;
  ss.speak = u => { window.__paroles.push({ texte: u.text, langue: u.lang }); setTimeout(() => { if (u.onend) u.onend(); }, 5); };
  ss.cancel = () => {};
  ss.getVoices = () => [{ lang: 'xx-XX' }];
}
"""


def jour(decalage=0):
    return (datetime.date.today() + datetime.timedelta(days=decalage)).isoformat()


def deux(en, fr):
    return {"en": en, "fr": fr}


def resume(avancement, phrase, du=None, jours=(), aujourdhui=None, parent=""):
    return {
        "version": 1,
        "ecritLe": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "progres": {"avancement": avancement, "phrase": phrase, "aujourdhui": aujourdhui, "jour": jour()},
        "du": du,
        "jours": sorted(jours),
        "parent": parent,
    }


def du(decalage, nature, phrase, minutes=5):
    return {"des": jour(decalage), "nature": nature, "phrase": phrase, "minutes": minutes}


SEANCE = deux("Today's practice", "Entraînement du jour")

# États pré-remplis : { clé localStorage : état du module (avec son résumé) }.
ETATS = {
    # Le premier jour du portail : Henri a fait le diagnostic des tables hier ; le zoom et le nombre
    # cible n'ont jamais été ouverts (aucun résumé), le planisphère de Louise n'en publie pas.
    ("henri", "aujourdhui"): {
        "henri.tables": {"version": 2, "jours": [jour(-1)], "resume": resume(
            0.15, deux("22 stamps", "22 tampons"), du(0, "seance", SEANCE), [jour(-1)],
            parent="Les tables : 4 multiplications sur 36 sont devenues automatiques. 1 jour de pratique en tout.")},
    },
    # Clara a déjà fait ses tables aujourd'hui ; le grand voyage du zoom l'attend.
    ("clara", "aujourdhui"): {
        "clara.tables": {"version": 2, "jours": [jour(-2), jour()], "resume": resume(
            0.12, deux("34 stamps · 1 gold", "34 tampons · 1 en or"), du(1, "revision", deux("4 cards come back", "4 cartes reviennent")),
            [jour(-2), jour()], aujourdhui=deux("+5 stamps", "+5 tampons"),
            parent="Les tables : 9 multiplications sur 36 sont devenues automatiques. 2 jours de pratique en tout.")},
        "clara.zoom": {"version": 1, "jours": [], "resume": resume(
            0, deux("New!", "Nouveau !"), du(0, "decouverte", deux("The big journey", "Le grand voyage")),
            parent="Le voyage n'a pas encore commencé.")},
    },
    # Des semaines plus tard : tout est en route.
    ("henri", "riche"): {
        "henri.tables": {"version": 2, "jours": [jour(-3), jour(-2), jour(-1)], "resume": resume(
            0.73, deux("105 stamps · 15 gold", "105 tampons · 15 en or"), du(-1, "revision", deux("12 cards come back", "12 cartes reviennent")),
            [jour(-9), jour(-3), jour(-2), jour(-1)],
            parent="Les tables : 15 multiplications sur 36 sont devenues automatiques. 2 restent fragiles : 7 × 8, 6 × 7. Album : 105 tampons, 15 cartes en or. 12 jours de pratique en tout.")},
        "henri.zoom": {"version": 1, "jours": [jour(-2)], "resume": resume(
            0.45, deux("14 of 31 places · 3 gold", "14 lieux sur 31 · 3 en or"), du(0, "revision", deux("5 places come back", "5 lieux reviennent")),
            [jour(-2)], parent="Le voyage : 14 lieux découverts sur 31, dont 3 sus par cœur. Étape en cours : L'Europe. À revoir : Mars, La Loire.")},
        "henri.cible": {"version": 1, "jours": [jour(-1)], "resume": resume(
            None, deux("8 targets hit", "8 cibles atteintes"), None, [jour(-1)],
            parent="Le nombre cible : 8 cibles atteintes en 3 jours, dont 1 coup parfait.")},
    },
    ("clara", "riche"): {
        "clara.tables": {"version": 2, "jours": [jour(-1), jour()], "resume": resume(
            1, deux("All 36 gold!", "Les 36 en or !"), du(-2, "revision", deux("6 cards come back", "6 cartes reviennent"), 3),
            [jour(-1)], parent="Les tables : 36 multiplications sur 36 sont devenues automatiques. Album : 144 tampons, 36 cartes en or. 40 jours de pratique en tout.")},
        "clara.zoom": {"version": 1, "jours": [jour()], "resume": resume(
            0.86, deux("26 of 30 places · 12 gold", "26 lieux sur 30 · 12 en or"), du(1, "revision", deux("3 places come back", "3 lieux reviennent")),
            [jour(-4), jour()], aujourdhui=deux("+2 places", "+2 lieux"),
            parent="Le voyage : 26 lieux découverts sur 30, dont 12 sus par cœur. Étape en cours : Les Bouches-du-Rhône.")},
        "clara.cible": {"version": 1, "jours": [jour(-3)], "resume": resume(
            None, deux("21 targets hit", "21 cibles atteintes"), du(0, "seance", deux("A new target", "Une nouvelle cible"), 4), [jour(-3)],
            parent="Le nombre cible : 21 cibles atteintes en 6 jours.")},
    },
    # Tout est fait aujourd'hui : la carte « Today » le dit, la mascotte se repose.
    ("henri", "fini"): {
        "henri.tables": {"version": 2, "jours": [jour()], "resume": resume(
            0.2, deux("30 stamps", "30 tampons"), du(1, "seance", SEANCE), [jour()], aujourdhui=deux("+8 stamps", "+8 tampons"))},
    },
    # Aucun résumé du tout (avant toute ouverture d'un module) : l'enfant choisit un cahier.
    ("clara", "vide"): {},
}

# Ce que la carte « Today » doit proposer en premier (page du bouton Start), None si rien.
START_ATTENDU = {
    ("henri", "aujourdhui"): "tables.html",
    ("clara", "aujourdhui"): "zoom.html",
    ("henri", "riche"): "tables.html",
    ("clara", "riche"): "tables.html",
    ("henri", "fini"): None,
    ("clara", "vide"): None,
}


class Silencieux(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def servir():
    gestion = functools.partial(Silencieux, directory=str(RACINE))
    serveur = http.server.ThreadingHTTPServer(("127.0.0.1", 0), gestion)
    threading.Thread(target=serveur.serve_forever, daemon=True).start()
    return serveur, f"http://127.0.0.1:{serveur.server_address[1]}"


def contexte(navigateur, fmt, etat, schema="light"):
    l, h = FORMATS[fmt]
    ctx = navigateur.new_context(viewport={"width": l, "height": h}, device_scale_factor=1,
                                 color_scheme=schema, has_touch=(fmt == "iphone"))
    ctx.add_init_script(ESPION_VOIX)
    # Le localStorage est posé avant tout script de la page, une seule fois par contexte.
    ctx.add_init_script("""(etat => {
      if (sessionStorage.getItem('essai.pose')) return;
      sessionStorage.setItem('essai.pose', '1');
      Object.entries(etat).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
    })(%s)""" % json.dumps(etat))
    ctx.route("**/voix/index.json", lambda r: r.fulfill(status=200, content_type="application/json", body="{}"))
    # La sauvegarde en ligne est testée à part (test/*.test.js) : ici un service qui rend l'état reçu.
    ctx.route("**/api/progression**", lambda r: r.fulfill(status=200, content_type="application/json",
                                                         body=r.request.post_data or "{}"))
    page = ctx.new_page()
    erreurs: list[str] = []
    page.on("pageerror", lambda e: erreurs.append("JS : " + str(e)))
    page.on("console", lambda m: erreurs.append("console : " + m.text) if m.type == "error" else None)
    return ctx, page, erreurs


def capture(page, nom, erreurs):
    page.evaluate("document.fonts.ready")
    page.wait_for_timeout(300)
    page.screenshot(path=str(CAPTURES / f"{nom}.png"), full_page=True)
    for libelle, js in (("débordement horizontal", DEBORDEMENTS_JS), ("cibles de moins de 56 px", CIBLES_JS),
                        ("texte d'une ligne coupé", COUPES_JS), ("rouge", ROUGE_JS)):
        trouve = page.evaluate(js)
        if trouve:
            PROBLEMES.append(f"{nom} : {libelle} {trouve}")
    while erreurs:
        PROBLEMES.append(f"{nom} : {erreurs.pop(0)}")


def appui_long(page, selecteur):
    b = page.locator(selecteur).first.bounding_box()
    page.mouse.move(b["x"] + b["width"] / 2, b["y"] + b["height"] / 2)
    page.mouse.down()
    page.wait_for_timeout(1100)
    page.mouse.up()


def parcours(navigateur, base, enfant, cas, fmt, schema="light"):
    nom = f"{enfant}_{cas}_{fmt}" + ("_soir" if schema == "dark" else "")
    ctx, page, err = contexte(navigateur, fmt, ETATS[(enfant, cas)], schema)
    page.goto(f"{base}/{enfant}/index.html")
    page.wait_for_selector(".cahiers")
    capture(page, f"{nom}_1-accueil", err)

    # L'accueil d'iPad tient sur un écran (D-19) ; sur iPhone il défile.
    if fmt != "iphone":
        haut = page.evaluate("document.documentElement.scrollHeight")
        if haut > FORMATS[fmt][1] + 1:
            PROBLEMES.append(f"{nom} : l'accueil défile sur iPad ({haut} px pour {FORMATS[fmt][1]})")
    if page.locator(".cahier").count() != 5:
        PROBLEMES.append(f"{nom} : {page.locator('.cahier').count()} cahiers au lieu de 5")
    if page.locator(".btn-primaire").count() > 1:
        PROBLEMES.append(f"{nom} : plus d'un bouton plein sur l'accueil")
    attendu = START_ATTENDU[(enfant, cas)]
    start = page.locator(".jour-1")
    if attendu is None:
        if start.count():
            PROBLEMES.append(f"{nom} : un Start alors que rien n'est dû")
    elif not start.count() or start.get_attribute("href") != attendu:
        PROBLEMES.append(f"{nom} : Start mène à {start.get_attribute('href') if start.count() else 'rien'} au lieu de {attendu}")
    texte = page.inner_text(".portail")
    for interdit in ("Henri" if enfant == "clara" else "Clara", "%"):
        if interdit in texte:
            PROBLEMES.append(f"{nom} : « {interdit} » sur l'accueil (comparaison ou pourcentage)")

    # La bulle se lit à voix haute quand on la touche.
    page.click(".d2-masc")
    page.wait_for_timeout(100)
    if not page.evaluate("window.__paroles.length"):
        PROBLEMES.append(f"{nom} : toucher la bulle ne lit rien")

    # Le cahier de maths ouvre sa page ; Back revient à l'accueil.
    page.click(".cahier[data-matiere='maths']")
    page.wait_for_selector(".page-matiere .mod")
    capture(page, f"{nom}_2-maths", err)
    if page.locator(".mod[data-module='tables']").get_attribute("href") != "tables.html":
        PROBLEMES.append(f"{nom} : la carte des tables ne mène pas à tables.html")
    page.click(".page-matiere .rond")
    page.wait_for_selector(".cahiers")

    # Le cahier d'histoire-géographie (le planisphère de Louise chez Henri, sans résumé).
    page.click(".cahier[data-matiere='hg']")
    page.wait_for_selector(".page-matiere .mod")
    capture(page, f"{nom}_3-hg", err)
    if enfant == "henri" and not page.locator(".mod[data-module='planisphere']").count():
        PROBLEMES.append(f"{nom} : le planisphère manque dans le cahier d'Henri")
    if enfant == "clara" and page.locator(".mod[data-module='planisphere']").count():
        PROBLEMES.append(f"{nom} : le planisphère apparaît chez Clara")
    page.go_back()
    page.wait_for_selector(".cahiers")

    # « My week », ouverte depuis la semaine du bandeau.
    page.click(".d2-sem")
    page.wait_for_selector(".page-semaine")
    capture(page, f"{nom}_4-semaine", err)
    page.click(".page-semaine .rond")
    page.wait_for_selector(".cahiers")

    # Un cahier « Coming soon » ne s'ouvre pas.
    page.click(".cahier[data-matiere='sciences']")
    page.wait_for_timeout(150)
    if not page.locator(".cahiers").count():
        PROBLEMES.append(f"{nom} : le cahier de sciences s'ouvre alors qu'il est à venir")

    if fmt == "ipad-paysage" and schema == "light":
        appui_long(page, ".coin-parent")
        page.wait_for_selector(".voile .feuille")
        if page.locator("#cp-titre").inner_text() != "Coin parent":
            PROBLEMES.append(f"{nom} : le coin parent n'est pas en français")
        for cle, etat in ETATS[(enfant, cas)].items():
            phrase = etat.get("resume", {}).get("parent")
            if phrase and phrase not in page.inner_text(".voile"):
                PROBLEMES.append(f"{nom} : le coin parent ne montre pas la phrase de {cle}")
        capture(page, f"{nom}_5-coin-parent", err)
        page.click("[data-a='fermer']")
    ctx.close()


def main():
    CAPTURES.mkdir(exist_ok=True)
    for f in CAPTURES.glob("*.png"):
        f.unlink()
    serveur, base = servir()
    with sync_playwright() as p:
        navigateur = p.chromium.launch(channel="chrome")
        for enfant, cas in ETATS:
            for fmt in FORMATS:
                if cas in ("fini", "vide") and fmt != "ipad-paysage":
                    continue
                parcours(navigateur, base, enfant, cas, fmt)
        parcours(navigateur, base, "henri", "riche", "ipad-paysage", "dark")
        parcours(navigateur, base, "clara", "riche", "iphone", "dark")
        navigateur.close()
    serveur.shutdown()
    n = len(list(CAPTURES.glob("*.png")))
    if PROBLEMES:
        print(f"{len(PROBLEMES)} problème(s), {n} captures :")
        for p_ in PROBLEMES:
            print(" -", p_)
        sys.exit(1)
    print(f"Portail sans erreur JS, débordement, texte coupé ni petite cible : {n} captures dans {CAPTURES}")


if __name__ == "__main__":
    main()
