# /// script
# requires-python = ">=3.10"
# dependencies = ["playwright"]
# ///
"""Vérifie au rendu réel la page des parents et le planisphère d'Henri, avec Chrome installé.

Usage : uv run henri/outils/test_planisphere.py
Sert le dépôt en local, puis, aux trois formats (iPad paysage, iPad portrait, iPhone) :
- index.html et henri/planisphere.html se chargent sans erreur JS ni débordement horizontal ;
- le planisphère bascule ses noms et ses consignes entre français et anglais, et garde le choix ;
- le cadre suit le réglage henri.reglages.langue du kit (anglais par défaut) ;
- les anciennes clés de stockage sans préfixe migrent sous henri.planisphere.* ;
- les cibles tactiles font au moins 56 px (44 px pour le zoom sur iPhone).
Captures dans henri/outils/captures/ (ignorées par git).
"""
import functools
import http.server
import json
import sys
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

RACINE = Path(__file__).resolve().parents[2]
CAPTURES = Path(__file__).resolve().parent / "captures"
FORMATS = {"ipad-paysage": (1080, 810), "ipad-portrait": (810, 1080), "iphone": (402, 874)}
PROBLEMES: list[str] = []
VERIFS: list[str] = []

DEBORDEMENTS_JS = """() => {
  const w = document.documentElement.clientWidth;
  const hors = [];
  if (document.documentElement.scrollWidth > w + 1) hors.push('page : scrollWidth ' + document.documentElement.scrollWidth);
  document.querySelectorAll('body *').forEach(el => {
    if (getComputedStyle(el).visibility === 'hidden') return;
    const r = el.getBoundingClientRect();
    if (r.width && (r.right > w + 1 || r.left < -1)) hors.push((typeof el.className === 'string' ? el.className : el.tagName) + ' ' + Math.round(r.left) + '..' + Math.round(r.right));
  });
  return hors.slice(0, 5);
}"""


class Silencieux(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def servir():
    gestion = functools.partial(Silencieux, directory=str(RACINE))
    serveur = http.server.ThreadingHTTPServer(("127.0.0.1", 0), gestion)
    threading.Thread(target=serveur.serve_forever, daemon=True).start()
    return serveur, f"http://127.0.0.1:{serveur.server_address[1]}"


def contexte(navigateur, fmt, schema="light"):
    l, h = FORMATS[fmt]
    ctx = navigateur.new_context(viewport={"width": l, "height": h}, device_scale_factor=1,
                                 color_scheme=schema, has_touch=(fmt == "iphone"))
    page = ctx.new_page()
    erreurs: list[str] = []
    page.on("pageerror", lambda e: erreurs.append("JS : " + str(e)))
    # L'icône d'onglet /favicon.ico, que Chrome demande d'office, n'existe pas à la racine : ignorée.
    page.on("console", lambda m: erreurs.append("console : " + m.text + " " + m.location.get("url", ""))
            if m.type == "error" and not m.location.get("url", "").endswith("/favicon.ico") else None)
    return ctx, page, erreurs


def verifier(condition, message):
    (VERIFS if condition else PROBLEMES).append(message)


def capture(page, nom, erreurs):
    page.evaluate("document.fonts.ready")
    page.wait_for_timeout(450)
    page.screenshot(path=str(CAPTURES / f"{nom}.png"), full_page=True)
    hors = page.evaluate(DEBORDEMENTS_JS)
    if hors:
        PROBLEMES.append(f"{nom} : débordement horizontal {hors}")
    while erreurs:
        PROBLEMES.append(f"{nom} : {erreurs.pop(0)}")


def hauteurs(page, selecteur):
    return page.eval_on_selector_all(selecteur, "els => els.map(e => Math.round(e.getBoundingClientRect().height))")


def cibles(page, fmt, nom):
    for sel in (".tab", "#filter .chip", "#langues .chip", ".rond", ".btn", ".word"):
        hs = hauteurs(page, sel)
        if hs:
            verifier(min(hs) >= 56, f"{nom} : {sel} hauteur min {min(hs)} px")
    zoom = min(hauteurs(page, ".zoom"))
    verifier(zoom >= (44 if fmt == "iphone" else 56), f"{nom} : .zoom hauteur {zoom} px")


def textes_cartes(page):
    return page.eval_on_selector_all("#tags .tag", "els => els.map(e => e.textContent)")


def parents(navigateur, base):
    for fmt in FORMATS:
        for schema in ("light", "dark"):
            ctx, page, err = contexte(navigateur, fmt, schema)
            page.goto(f"{base}/index.html")
            liens = page.eval_on_selector_all("a.app", "els => els.map(e => e.getAttribute('href'))")
            verifier(liens == ["henri/", "clara/"], f"parents {fmt} {schema} : liens des portails {liens}")
            verifier(page.evaluate("document.fonts.check('22px \"Baloo 2\"')"), f"parents {fmt} : police Baloo 2 hébergée chargée")
            capture(page, f"parents_{fmt}_{schema}", err)
            ctx.close()


def planisphere(navigateur, base):
    url = f"{base}/henri/planisphere.html"
    for fmt in FORMATS:
        ctx, page, err = contexte(navigateur, fmt)
        page.goto(url)
        verifier(page.inner_text("#t-learn") == "Learn", f"planisphère {fmt} : cadre en anglais par défaut")
        verifier("Afrique" in textes_cartes(page), f"planisphère {fmt} : noms en français par défaut")
        verifier(page.get_attribute("#l-fr", "aria-pressed") == "true", f"planisphère {fmt} : réglage Français actif par défaut")
        cibles(page, fmt, f"planisphère {fmt} apprendre")
        capture(page, f"planisphere_{fmt}_apprendre_fr", err)

        page.click("#l-en")
        tags = textes_cartes(page)
        verifier("Africa" in tags and "English Channel" in tags and "Afrique" not in tags, f"planisphère {fmt} : noms en anglais après bascule")
        verifier(page.inner_text("#game .msg").startswith("Look carefully"), f"planisphère {fmt} : consigne en anglais")
        verifier(page.get_attribute("#game", "lang") == "en-GB", f"planisphère {fmt} : contenu marqué en-GB")
        capture(page, f"planisphere_{fmt}_apprendre_en", err)

        page.click("#t-drag")
        mots = page.eval_on_selector_all(".word", "els => els.map(e => e.textContent)")
        verifier("Southern Ocean" in mots, f"planisphère {fmt} : étiquettes à glisser en anglais")
        cibles(page, fmt, f"planisphère {fmt} glisser")
        capture(page, f"planisphere_{fmt}_glisser_en", err)

        page.click("#t-click")
        verifier(page.inner_text("#msg").startswith("Where is"), f"planisphère {fmt} : question en anglais")
        capture(page, f"planisphere_{fmt}_cliquer_en", err)

        page.reload()
        verifier(page.get_attribute("#l-en", "aria-pressed") == "true", f"planisphère {fmt} : choix anglais gardé au rechargement")
        verifier(page.evaluate("localStorage.getItem('henri.planisphere.langue')") == "en", f"planisphère {fmt} : clé henri.planisphere.langue")
        page.click("#l-fr")
        verifier("Afrique" in textes_cartes(page), f"planisphère {fmt} : retour au français")

        verifier(page.inner_text(".nav .nom") == "Back", f"planisphère {fmt} : bouton Back étiqueté en anglais")
        hors_app = page.eval_on_selector_all("a[href]", f"""els => els.map(e => e.href).filter(h => !h.startsWith('{base}/henri/'))""")
        verifier(not hors_app, f"planisphère {fmt} : aucun lien hors de henri/ {hors_app}")
        boite = page.locator("#retour").bounding_box()
        verifier(boite["x"] < 120 and boite["y"] < 120, f"planisphère {fmt} : Back en haut à gauche ({round(boite['x'])}, {round(boite['y'])})")

        page.evaluate("localStorage.setItem('henri.reglages', JSON.stringify({langue: 'fr'}))")
        page.reload()
        verifier(page.inner_text("#t-learn") == "Apprendre" and page.evaluate("document.documentElement.lang") == "fr",
                 f"planisphère {fmt} : cadre en français quand henri.reglages.langue = fr")
        verifier(page.inner_text(".nav .nom") == "Retour", f"planisphère {fmt} : bouton Retour en français")
        capture(page, f"planisphere_{fmt}_cadre_fr", err)

        page.click("#retour")
        page.wait_for_load_state("load")
        verifier(page.url == f"{base}/henri/" and page.locator("#portail").count() == 1,
                 f"planisphère {fmt} : Back arrive sur le portail d'Henri ({page.url})")
        while err:
            PROBLEMES.append(f"portail après Back {fmt} : {err.pop(0)}")
        ctx.close()

    # Mode soir
    ctx, page, err = contexte(navigateur, "ipad-paysage", "dark")
    page.goto(url)
    page.click("#t-drag")
    capture(page, "planisphere_ipad-paysage_soir", err)
    ctx.close()


def migration(navigateur, base):
    url = f"{base}/henri/planisphere.html"
    for fmt in FORMATS:
        ctx, page, err = contexte(navigateur, fmt)
        page.goto(f"{base}/README.md")  # même origine, sans exécuter le planisphère
        page.evaluate("""() => { localStorage.clear();
          localStorage.setItem('mode', 'drag'); localStorage.setItem('filter', 'oce');
          localStorage.setItem('best-drag-all', '12'); localStorage.setItem('best-click-mer', '5');
          localStorage.setItem('henri.planisphere.best-click-mer', '7');
          localStorage.setItem('theme', 'dark'); }""")
        page.goto(url)
        etat = page.evaluate("() => Object.fromEntries(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)]))")
        attendu = {
            "henri.planisphere.filter": "oce", "henri.planisphere.best-drag-all": "12",
            "henri.planisphere.best-click-mer": "7", "theme": "dark",
        }
        ok = all(etat.get(k) == v for k, v in attendu.items()) and not any(k in etat for k in ("filter", "best-drag-all", "best-click-mer"))
        ok = ok and etat.get("henri.planisphere.mode") in ("learn", "drag") and "mode" not in etat
        verifier(ok, f"migration {fmt} : {json.dumps(etat, ensure_ascii=False)}")
        verifier(page.get_attribute("#f-oce", "aria-pressed") == "true", f"migration {fmt} : filtre repris (Oceans actif)")
        capture(page, f"migration_{fmt}", err)
        ctx.close()

    # Stockage indisponible : la page doit tourner quand même
    ctx, page, err = contexte(navigateur, "ipad-paysage")
    page.add_init_script("Object.defineProperty(window, 'localStorage', { get() { throw new Error('bloqué'); } });")
    page.goto(url)
    page.click("#l-en")
    verifier("Africa" in textes_cartes(page), "stockage bloqué : la page marche et bascule en anglais")
    capture(page, "stockage-bloque_ipad-paysage", err)
    ctx.close()


def main():
    CAPTURES.mkdir(exist_ok=True)
    serveur, base = servir()
    with sync_playwright() as p:
        navigateur = p.chromium.launch(channel="chrome")
        parents(navigateur, base)
        planisphere(navigateur, base)
        migration(navigateur, base)
        navigateur.close()
    serveur.shutdown()
    print(f"{len(VERIFS)} vérifications passées, {len(PROBLEMES)} problème(s)")
    for p in PROBLEMES:
        print("  - " + p)
    sys.exit(1 if PROBLEMES else 0)


if __name__ == "__main__":
    main()
