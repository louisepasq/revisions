# /// script
# requires-python = ">=3.10"
# dependencies = ["playwright"]
# ///
"""Parcours au rendu réel des apps « Nos révisions », avec Chrome installé.

Usage : uv run modules/tables/test_parcours.py
Sert le dépôt en local, puis vérifie aux trois formats (iPad paysage, iPad portrait, iPhone) :
portails d'Henri et de Clara, et module des tables de Clara de bout en bout
(diagnostic, séance avec une erreur retapée, fin, grille). Captures dans modules/tables/captures/.
"""
import functools
import http.server
import sys
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

RACINE = Path(__file__).resolve().parents[2]
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
    if (r.width && (r.right > w + 1 || r.left < -1)) hors.push((el.className && el.className.baseVal === undefined ? el.className : el.tagName) + ' ' + Math.round(r.left) + '..' + Math.round(r.right));
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
    page.on("console", lambda m: erreurs.append("console : " + m.text) if m.type == "error" else None)
    return ctx, page, erreurs


def capture(page, nom, erreurs):
    page.evaluate("document.fonts.ready")
    page.wait_for_timeout(350)
    page.screenshot(path=str(CAPTURES / f"{nom}.png"))
    hors = page.evaluate(DEBORDEMENTS_JS)
    if hors:
        PROBLEMES.append(f"{nom} : débordement horizontal {hors}")
    while erreurs:
        PROBLEMES.append(f"{nom} : {erreurs.pop(0)}")


def taper(page, nombre):
    for c in str(nombre):
        page.click(f".pave .touche[data-chiffre='{c}']")


def valider(page):
    page.click(".pave .touche.valider")


def portails(navigateur, base):
    for enfant in ("henri", "clara"):
        for fmt in FORMATS:
            ctx, page, err = contexte(navigateur, fmt)
            page.goto(f"{base}/{enfant}/index.html")
            capture(page, f"portail_{enfant}_{fmt}", err)
            if fmt == "ipad-paysage":
                bouton = page.locator(".coin-parent").bounding_box()
                page.mouse.move(bouton["x"] + 20, bouton["y"] + 20)
                page.mouse.down()
                page.wait_for_timeout(1100)
                page.mouse.up()
                page.wait_for_selector(".voile .feuille")
                capture(page, f"portail_{enfant}_{fmt}_coin-parent", err)
            ctx.close()
    ctx, page, err = contexte(navigateur, "ipad-paysage", "dark")
    page.goto(f"{base}/henri/index.html")
    capture(page, "portail_henri_ipad-paysage_soir", err)
    ctx.close()


def diagnostic(page, err, fmt):
    capture(page, f"clara_{fmt}_01-diagnostic-annonce", err)
    page.click("[data-a='go']")
    page.wait_for_selector(".diagnostic .carte-pleine")
    capture(page, f"clara_{fmt}_02-diagnostic-question", err)
    n = 0
    while not page.locator(".parole").count():
        carte = page.locator(".carte-pleine")
        a, b = int(carte.get_attribute("data-a-fait")), int(carte.get_attribute("data-b-fait"))
        if n == 3:
            page.click("[data-a='passer']")
        else:
            sait = min(a, b) in (1, 2, 5, 10) or (min(a, b) in (4, 8) and n % 4)
            taper(page, a * b if sait else a * b + 1)
            if n == 0:
                capture(page, f"clara_{fmt}_03-diagnostic-saisie", err)
            valider(page)
        n += 1
        page.wait_for_function("document.querySelector('.parole') || document.querySelector('.carte-pleine')")
        if n > 60:
            PROBLEMES.append(f"{fmt} : le diagnostic ne finit pas")
            return
    capture(page, f"clara_{fmt}_04-diagnostic-fin", err)
    page.click("[data-a='go']")


def repondre_juste(page, carte):
    t = carte.get_attribute("data-type")
    a, b = int(carte.get_attribute("data-a-fait")), int(carte.get_attribute("data-b-fait"))
    if t == "multiple":
        nombre = int(carte.get_attribute("data-nombre"))
        page.click("[data-a='choix'][data-valeur='%s']" % ("oui" if nombre % a == 0 else "non"))
    elif t == "decomposition":
        taper(page, a)
        valider(page)
        taper(page, b)
        valider(page)
    elif t == "manquant":
        taper(page, b)
        valider(page)
    else:
        taper(page, a * b)
        valider(page)


def repondre_faux(page, carte):
    t = carte.get_attribute("data-type")
    a, b = int(carte.get_attribute("data-a-fait")), int(carte.get_attribute("data-b-fait"))
    if t == "multiple":
        nombre = int(carte.get_attribute("data-nombre"))
        page.click("[data-a='choix'][data-valeur='%s']" % ("non" if nombre % a == 0 else "oui"))
    elif t == "decomposition":
        taper(page, 7)
        valider(page)
        taper(page, 7)
        valider(page)
    elif t == "manquant":
        taper(page, b + 1)
        valider(page)
    else:
        taper(page, a * b + 1)
        valider(page)


ATTENTE_QUESTION = "document.querySelector('.fin-seance') || (document.querySelector('.carte-pleine[data-type]') && !document.querySelector('.carte-juste'))"


def seance(page, err, fmt):
    page.wait_for_selector(".accueil-tables")
    capture(page, f"clara_{fmt}_05-accueil-module", err)
    page.click("[data-a='seance']")
    page.wait_for_selector(".carte-pleine[data-type]")
    capture(page, f"clara_{fmt}_06-question", err)
    vus, n, erreur_faite, juste_capture = set(), 0, False, False
    while not page.locator(".fin-seance").count():
        carte = page.locator(".carte-pleine[data-type]")
        t = carte.get_attribute("data-type")
        a, b = int(carte.get_attribute("data-a-fait")), int(carte.get_attribute("data-b-fait"))
        if t != "produit" and t not in vus:
            vus.add(t)
            capture(page, f"clara_{fmt}_07-type-{t}", err)
        if n == 1 and not erreur_faite:
            erreur_faite = True
            repondre_faux(page, carte)
            page.wait_for_selector(".carte-rev")
            capture(page, f"clara_{fmt}_08-a-revoir", err)
            taper(page, a * b + 10)
            valider(page)
            if page.locator(".carte-retape.carte-juste").count():
                PROBLEMES.append(f"{fmt} : un retapage faux est accepté")
            taper(page, a * b)
            capture(page, f"clara_{fmt}_09-retape-saisie", err)
            valider(page)
            page.wait_for_selector(".carte-retape.carte-juste")
            capture(page, f"clara_{fmt}_10-retape-juste", err)
        else:
            repondre_juste(page, carte)
            page.wait_for_selector(".carte-juste")
            if not juste_capture:
                juste_capture = True
                capture(page, f"clara_{fmt}_11-juste", err)
        page.evaluate("document.querySelector('.touche.suite') && document.querySelector('.touche.suite').click()")
        page.wait_for_function(ATTENTE_QUESTION)
        n += 1
        if n > 80:
            PROBLEMES.append(f"{fmt} : la séance ne finit pas")
            return
    if not erreur_faite:
        PROBLEMES.append(f"{fmt} : aucune erreur volontaire n'a pu être faite")
    page.wait_for_timeout(900)
    capture(page, f"clara_{fmt}_12-fin-seance", err)
    page.click("[data-a='grille']")
    page.wait_for_selector(".grille-ecran")
    capture(page, f"clara_{fmt}_13-grille", err)
    page.click(".cell[data-x='6'][data-y='7']")
    capture(page, f"clara_{fmt}_14-grille-case", err)
    produits = page.evaluate("[...document.querySelectorAll('.cell:not(.touchee) b')].length")
    if produits:
        PROBLEMES.append(f"{fmt} : la grille affiche {produits} produits hors de la case touchée")
    sauve = page.evaluate("JSON.parse(localStorage.getItem('clara.tables')).diagnostic")
    if not sauve:
        PROBLEMES.append(f"{fmt} : la progression n'est pas sauvée")
    if fmt == "ipad-paysage":
        coin_parent(page, err, fmt)


def coin_parent(page, err, fmt):
    """Après une séance : résumé en phrases, export, remise à zéro, import."""
    page.goto(page.url.replace("tables.html", "index.html"))
    bouton = page.locator(".coin-parent").bounding_box()
    page.mouse.move(bouton["x"] + 20, bouton["y"] + 20)
    page.mouse.down()
    page.wait_for_timeout(1100)
    page.mouse.up()
    page.wait_for_selector(".voile .feuille")
    capture(page, f"clara_{fmt}_15-coin-parent-apres-seance", err)
    avant = page.evaluate("localStorage.getItem('clara.tables')")
    with page.expect_download() as tele:
        page.click("[data-a='exporter']")
    fichier = CAPTURES / "export-test.json"
    tele.value.save_as(str(fichier))
    page.click("[data-a='raz']")
    page.click("[data-a='raz-oui']")
    if page.evaluate("localStorage.getItem('clara.tables')") is not None:
        PROBLEMES.append("remise à zéro : la progression reste")
    page.set_input_files(".voile input[type='file']", str(fichier))
    page.wait_for_function("localStorage.getItem('clara.tables') !== null")
    if page.evaluate("localStorage.getItem('clara.tables')") != avant:
        PROBLEMES.append("import : la progression restaurée diffère de l'export")
    capture(page, f"clara_{fmt}_16-coin-parent-import", err)
    fichier.unlink()


ETAT_AVANCE = """() => {
  const e = Object.assign(Tables.etatNeuf(), {diagnostic: true, familles: 3});
  const j = Tables.jour(new Date());
  for (let i = 0; i < 3; i++) Tables.faitsDeFamille(i).forEach(([a, b]) => {
    e.faits[Tables.cle(a, b)] = {boite: 3, vu: true, prochain: j, justesJours: [], erreurs: 0, dernierTemps: 2000};
  });
  localStorage.setItem('clara.tables', JSON.stringify(e));
}"""


def quatre_types(navigateur, base, fmt):
    """Une séance avancée, pour voir les quatre types de questions au rendu."""
    ctx, page, err = contexte(navigateur, fmt)
    page.goto(f"{base}/clara/tables.html")
    page.evaluate(ETAT_AVANCE)
    page.reload()
    page.click("[data-a='seance']")
    vus = set()
    for _ in range(25):
        page.wait_for_function(ATTENTE_QUESTION)
        if page.locator(".fin-seance").count():
            break
        carte = page.locator(".carte-pleine[data-type]")
        t = carte.get_attribute("data-type")
        if t not in vus:
            vus.add(t)
            capture(page, f"clara_{fmt}_types-{t}", err)
        repondre_juste(page, carte)
        page.wait_for_selector(".carte-juste")
        if t == "multiple" and "multiple-juste" not in vus:
            vus.add("multiple-juste")
            capture(page, f"clara_{fmt}_types-multiple-juste", err)
        page.evaluate("document.querySelector('.touche.suite') && document.querySelector('.touche.suite').click()")
    manque = {"produit", "manquant", "decomposition", "multiple"} - vus
    if manque:
        PROBLEMES.append(f"{fmt} : types de questions jamais vus {sorted(manque)}")
    ctx.close()


def tables_clara(navigateur, base):
    for fmt in FORMATS:
        ctx, page, err = contexte(navigateur, fmt)
        page.goto(f"{base}/clara/tables.html")
        diagnostic(page, err, fmt)
        seance(page, err, fmt)
        ctx.close()
        quatre_types(navigateur, base, fmt)
    ctx, page, err = contexte(navigateur, "ipad-paysage", "dark")
    page.goto(f"{base}/clara/tables.html")
    page.evaluate("localStorage.setItem('clara.tables', JSON.stringify(Object.assign(Tables.etatNeuf(), {diagnostic: true})))")
    page.reload()
    page.click("[data-a='seance']")
    page.wait_for_selector(".carte-pleine[data-type]")
    capture(page, "clara_ipad-paysage_soir-question", err)
    ctx.close()


def main():
    CAPTURES.mkdir(exist_ok=True)
    for f in CAPTURES.glob("*.png"):
        f.unlink()
    serveur, base = servir()
    with sync_playwright() as p:
        navigateur = p.chromium.launch(channel="chrome")
        portails(navigateur, base)
        tables_clara(navigateur, base)
        navigateur.close()
    serveur.shutdown()
    n = len(list(CAPTURES.glob("*.png")))
    if PROBLEMES:
        print(f"{len(PROBLEMES)} problème(s), {n} captures :")
        for p_ in PROBLEMES:
            print(" -", p_)
        sys.exit(1)
    print(f"Parcours complet sans erreur JS ni débordement : {n} captures dans {CAPTURES}")


if __name__ == "__main__":
    main()
