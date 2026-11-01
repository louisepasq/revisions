# /// script
# requires-python = ">=3.10"
# dependencies = ["playwright"]
# ///
"""Parcours au rendu réel des apps « Nos révisions », avec Chrome installé.

Usage : uv run modules/tables/test_parcours.py
Sert le dépôt en local, puis vérifie aux trois formats (iPad paysage, iPad portrait, iPhone) :
portails d'Henri et de Clara, et module des tables de Clara de bout en bout
(diagnostic, séance avec une erreur retapée, fin, album à tampons, bascule vers la grille), puis
un album avancé (carte qui dore en fin de séance, carte dorée retombée qui « revient »).
Captures dans modules/tables/captures/.
La voix est espionnée (speechSynthesis.speak remplacé) : chaque question doit être lue en
toutes lettres, et chaque réponse juste doit faire dire le fait complet.
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


# Espion de la voix : enregistre chaque énoncé et le termine aussitôt (onend), sans son.
ESPION_VOIX = """
window.__paroles = [];
if (window.speechSynthesis) {
  const ss = window.speechSynthesis;
  ss.speak = u => { window.__paroles.push({ texte: u.text, langue: u.lang }); setTimeout(() => { if (u.onend) u.onend(); }, 5); };
  ss.cancel = () => {};
  ss.getVoices = () => [{ lang: 'xx-XX' }];
}
"""


def paroles(page):
    return page.evaluate("window.__paroles.map(p => p.texte)")


def derniere_parole(page):
    return page.evaluate("(window.__paroles[window.__paroles.length - 1] || {}).texte || ''")


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
    ctx.add_init_script(ESPION_VOIX)
    # Les fichiers de voix sont vérifiés à part (commun/outils/voix.py) ; ici on force la voix de
    # l'appareil pour que l'espion entende chaque phrase.
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
                if page.locator("#cp-titre").inner_text() != "Coin parent":
                    PROBLEMES.append(f"{enfant} : le coin parent n'est pas en français")
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
    carte = page.locator(".carte-pleine")
    attendu = page.evaluate("([a, b]) => Tables.questionDite({ type: 'produit', a, b })",
                            [int(carte.get_attribute("data-a-fait")), int(carte.get_attribute("data-b-fait"))])
    if derniere_parole(page) != attendu:
        PROBLEMES.append(f"{fmt} : le diagnostic ne lit pas la question ({derniere_parole(page)!r} au lieu de {attendu!r})")
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
        # Le premier nombre complet, le curseur passe seul à la seconde case.
        taper(page, a)
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
        taper(page, a + 1 if a < 9 else a - 1)
        taper(page, b)
        valider(page)
    elif t == "manquant":
        taper(page, b + 1)
        valider(page)
    else:
        taper(page, a * b + 1)
        valider(page)


ATTENTE_QUESTION = "document.querySelector('.fin-seance') || (document.querySelector('.carte-pleine[data-type]') && !document.querySelector('.carte-juste'))"


def seance(page, err, fmt):
    # Après le diagnostic, « Let's go » mène directement à la première séance.
    page.wait_for_selector(".carte-pleine[data-type]")
    capture(page, f"clara_{fmt}_06-question", err)
    carte = page.locator(".carte-pleine[data-type]")
    if carte.get_attribute("data-type") == "produit":
        a, b = int(carte.get_attribute("data-a-fait")), int(carte.get_attribute("data-b-fait"))
        attendu = page.evaluate("([a, b]) => Tables.questionDite({ type: 'produit', a, b })", [a, b])
        if derniere_parole(page) != attendu:
            PROBLEMES.append(f"{fmt} : la première question n'est pas lue ({derniere_parole(page)!r})")
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
            fait = page.evaluate("([a, b]) => Tables.faitDit(a, b)", [a, b])
            if fait not in paroles(page):
                PROBLEMES.append(f"{fmt} : après une erreur, la voix ne dit pas le fait juste ({fait!r})")
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
            # Décision du 01/11/2026 : rapide, le fait n'est pas redit ; hésitante (ici la troisième
            # question, après 3,5 s), il est dit en entier avant de pouvoir avancer.
            lente = n == 2
            if lente:
                page.wait_for_timeout(3500)
            repondre_juste(page, carte)
            page.wait_for_selector(".carte-juste")
            if t in ("produit", "manquant"):
                fait = page.evaluate("([a, b]) => Tables.faitDit(a, b)", [a, b])
                if lente:
                    page.wait_for_timeout(300)
                    if fait not in paroles(page):
                        PROBLEMES.append(f"{fmt} : réponse hésitante à {a} × {b} sans le fait dit ({derniere_parole(page)!r})")
                elif derniere_parole(page) == fait:
                    PROBLEMES.append(f"{fmt} : réponse rapide à {a} × {b}, le fait est redit alors qu'il est su")
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
    if not page.locator(".fin-seance .bloc").count():
        PROBLEMES.append(f"{fmt} : la fin de séance ne montre ni tampons ni réponses")
    # « See my cards » ouvre l'album ; la grille est à un geste, en bascule.
    page.click("[data-a='album']")
    page.wait_for_selector(".album-ecran")
    capture(page, f"clara_{fmt}_13-album", err)
    verifier_album(page, fmt)
    page.click("[data-a='grille']")
    page.wait_for_selector(".grille-ecran")
    capture(page, f"clara_{fmt}_13b-grille", err)
    page.click(".cell[data-x='6'][data-y='7']")
    capture(page, f"clara_{fmt}_14-grille-case", err)
    produits = page.evaluate("[...document.querySelectorAll('.cell:not(.touchee) b')].length")
    if produits:
        PROBLEMES.append(f"{fmt} : la grille affiche {produits} produits hors de la case touchée")
    legende = page.evaluate("[...document.querySelectorAll('.legende-m .n')].reduce((s, n) => s + Number(n.textContent), 0)")
    if legende != 36:
        PROBLEMES.append(f"{fmt} : la légende de la grille compte {legende} cases au lieu de 36")
    page.click("[data-a='retour']")
    page.wait_for_selector(".album-ecran")
    page.click("[data-a='retour']")
    page.wait_for_selector(".accueil-tables")
    capture(page, f"clara_{fmt}_05-accueil-module", err)
    if "×" in "".join(paroles(page)):
        PROBLEMES.append(f"{fmt} : une phrase lue contient le signe ×")
    sauve = page.evaluate("JSON.parse(localStorage.getItem('clara.tables')).diagnostic")
    if not sauve:
        PROBLEMES.append(f"{fmt} : la progression n'est pas sauvée")
    if fmt == "ipad-paysage":
        coin_parent(page, err, fmt)


def verifier_album(page, fmt):
    """Six onglets, les familles fermées en pointillé (jamais de cadenas), la page de la bonne taille."""
    onglets = page.locator(".onglet").count()
    if onglets != 6:
        PROBLEMES.append(f"{fmt} : l'album a {onglets} onglets au lieu de 6")
    familles = page.evaluate("JSON.parse(localStorage.getItem('clara.tables')).familles")
    fermes = page.locator(".onglet.ferme").count()
    if fermes != 6 - familles:
        PROBLEMES.append(f"{fmt} : {fermes} onglets en pointillé pour {familles} familles ouvertes")
    if "i-cadenas" in page.inner_html(".album-ecran"):
        PROBLEMES.append(f"{fmt} : un cadenas dans l'album")
    total = sum(page.evaluate("Album.pages(Tables.charger('clara'), Tables.jour(new Date())).map(p => p.cartes.length)"))
    if total != 36:
        PROBLEMES.append(f"{fmt} : l'album compte {total} cartes au lieu de 36")
    if "gold today" in page.inner_text("body").lower():
        PROBLEMES.append(f"{fmt} : l'album annonce une carte qui peut dorer aujourd'hui")


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
    // Les ×1 ne reviennent pas aujourd'hui : un facteur 1 ne se pose qu'en produit.
    const un = a === 1 || b === 1;
    e.faits[Tables.cle(a, b)] = {boite: 3, vu: true, prochain: un ? '2099-01-01' : j, justesJours: [], erreurs: 0, dernierTemps: 2000};
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
        if t == "decomposition" and "relance" not in vus:
            vus.add("relance")
            a, b = int(carte.get_attribute("data-a-fait")), int(carte.get_attribute("data-b-fait"))
            taper(page, 1)
            page.click(".case-rep[data-champ='1']")
            taper(page, a * b)
            valider(page)
            if not page.locator(".consigne.relance").count():
                PROBLEMES.append(f"{fmt} : « 1 × {a * b} » est accepté sans relance")
            capture(page, f"clara_{fmt}_types-decomposition-relance", err)
        if "arret" not in vus:
            vus.add("arret")
            page.click("[data-a='retour']")
            page.wait_for_selector(".feuille-arret")
            capture(page, f"clara_{fmt}_types-arret", err)
            page.click("[data-arret='non']")
            if not page.locator(".carte-pleine[data-type]").count():
                PROBLEMES.append(f"{fmt} : « Keep going » ne ramène pas à la question")
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


ETAT_DIX = """() => {
  const e = Object.assign(Tables.etatNeuf(), {diagnostic: true, familles: 1});
  const j = Tables.jour(new Date());
  const loin = '2099-01-01';
  Tables.faitsDeFamille(0).forEach(([a, b]) => {
    const du = a === 10 && b === 10;
    e.faits[Tables.cle(a, b)] = {boite: du ? 1 : 3, vu: true, prochain: du ? j : loin, justesJours: [], erreurs: 0, dernierTemps: 2000};
  });
  localStorage.setItem('clara.tables', JSON.stringify(e));
}"""


def dix_fois_dix(navigateur, base, fmt):
    """Preuve 4 bis de la synthèse : « 10 × 10 = 100 » sur l'écran juste, sans débordement."""
    ctx, page, err = contexte(navigateur, fmt)
    page.goto(f"{base}/clara/tables.html")
    page.evaluate(ETAT_DIX)
    page.reload()
    page.click("[data-a='seance']")
    for _ in range(25):
        page.wait_for_function(ATTENTE_QUESTION)
        if page.locator(".fin-seance").count():
            PROBLEMES.append(f"{fmt} : 10 × 10 n'est pas venu dans la séance")
            break
        carte = page.locator(".carte-pleine[data-type]")
        dix = carte.get_attribute("data-a-fait") == "10" and carte.get_attribute("data-b-fait") == "10"
        repondre_juste(page, carte)
        page.wait_for_selector(".carte-juste")
        if dix:
            capture(page, f"clara_{fmt}_17-juste-10x10", err)
            break
        page.evaluate("document.querySelector('.touche.suite') && document.querySelector('.touche.suite').click()")
    ctx.close()


# Un album avancé : 5 × 2 a trois tampons et ses deux sens en boîte 4, et revient aujourd'hui à sa
# date (il dore en fin de séance) ; 2 × 2 est dorée mais ratée hier (« Comes back today ») ;
# quelques faits en boîte 1 ou 2 qui reviennent aujourd'hui (tampons du jour) ; trois familles ouvertes.
ETAT_ALBUM = """() => {
  const e = Object.assign(Tables.etatNeuf(), {diagnostic: true, familles: 3});
  const j = Tables.jour(new Date());
  const d = n => Tables.ajouterJours(j, n);
  const loin = '2099-01-01';
  for (let i = 0; i < 3; i++) Tables.faitsDeFamille(i).forEach(([a, b]) => {
    e.faits[Tables.cle(a, b)] = {boite: 3, vu: true, prochain: loin, justesJours: [d(-9)], erreurs: 0, dernierTemps: 2000, dernierJuste: true};
  });
  const f = (k, o) => Object.assign(e.faits[k], o);
  f('2x5', {boite: 4, prochain: j, tampons: [d(-12), d(-10), d(-6)]});
  f('5x2', {boite: 4, prochain: loin});
  f('2x2', {boite: 1, prochain: d(-1), dernierJuste: false, erreurs: 1, tampons: [d(-20), d(-18), d(-14), d(-7)]});
  f('4x4', {boite: 5, prochain: loin, tampons: [d(-20), d(-18), d(-14), d(-7)]});
  f('3x4', {tampons: [d(-6), d(-3)]});
  f('4x3', {boite: 2, prochain: j});
  f('2x7', {boite: 1, prochain: j, tampons: [d(-2)]});
  f('8x3', {boite: 2, prochain: j, tampons: [d(-5), d(-2)]});
  f('6x2', {boite: 1, prochain: j});
  f('5x7', {tampons: [d(-8), d(-4), d(-1)]});
  localStorage.setItem('clara.tables', JSON.stringify(e));
}"""


def album_avance(navigateur, base, fmt):
    """Accueil, album et fin de séance d'un album déjà rempli, et l'or qui tombe à sa date."""
    ctx, page, err = contexte(navigateur, fmt)
    page.goto(f"{base}/clara/tables.html")
    page.evaluate(ETAT_ALBUM)
    page.reload()
    page.wait_for_selector(".panneau-album")
    capture(page, f"clara_{fmt}_20-album-accueil", err)
    if "can turn gold" in page.inner_text("body"):
        PROBLEMES.append(f"{fmt} : l'accueil annonce une carte qui peut dorer aujourd'hui")
    if page.locator(".panneau-album .rang-cartes .cf").count() != 3:
        PROBLEMES.append(f"{fmt} : l'accueil ne montre pas les trois cartes les plus proches de l'or")
    page.click("[data-a='album']")
    page.wait_for_selector(".album-ecran")
    page.click(".onglet[data-page='1']")
    page.wait_for_selector(".onglet.actif[data-page='1']")
    capture(page, f"clara_{fmt}_21-album-doubles", err)
    if not page.locator(".cf.or.revoir .revient").count():
        PROBLEMES.append(f"{fmt} : la carte dorée retombée n'affiche pas qu'elle revient")
    page.click(".onglet[data-page='0']")
    page.wait_for_selector(".onglet.actif[data-page='0']")
    page.click(".onglet[data-page='4']")
    page.wait_for_selector(".page-fermee")
    capture(page, f"clara_{fmt}_22-album-ferme", err)
    page.click("[data-a='retour']")
    page.wait_for_selector(".accueil-tables")
    page.click("[data-a='seance']")
    for _ in range(40):
        page.wait_for_function(ATTENTE_QUESTION)
        if page.locator(".fin-seance").count():
            break
        repondre_juste(page, page.locator(".carte-pleine[data-type]"))
        page.wait_for_selector(".carte-juste")
        page.evaluate("document.querySelector('.touche.suite') && document.querySelector('.touche.suite').click()")
    page.wait_for_selector(".fin-seance")
    page.wait_for_timeout(900)
    capture(page, f"clara_{fmt}_23-fin-or", err)
    if not page.locator(".bloc-or .cf.or").count():
        PROBLEMES.append(f"{fmt} : 5 × 2, revu à sa date dans les deux sens, ne dore pas en fin de séance")
    if not page.locator(".rangee .cf .tp.du-jour").count():
        PROBLEMES.append(f"{fmt} : la fin de séance ne montre pas les tampons du jour")
    if not page.locator(".demain.retrouve").count():
        PROBLEMES.append(f"{fmt} : la carte dorée retrouvée n'est pas signalée")
    texte = page.inner_text(".fin-seance")
    if "comes back for a stamp" not in texte and "comes back to see you" not in texte and "See you tomorrow" not in texte:
        PROBLEMES.append(f"{fmt} : la fin de séance ne dit pas ce qui revient demain")
    page.click("[data-a='album']")
    page.wait_for_selector(".album-ecran")
    page.click(".onglet[data-page='0']")
    page.wait_for_selector(".onglet.actif[data-page='0']")
    capture(page, f"clara_{fmt}_24-album-apres", err)
    if not page.locator(".cf.or-auj").count():
        PROBLEMES.append(f"{fmt} : la carte dorée du jour n'est pas en or vif dans l'album")
    page.click("[data-a='grille']")
    page.wait_for_selector(".grille-ecran")
    capture(page, f"clara_{fmt}_25-grille-album", err)
    etats = page.evaluate("[document.querySelector('.cell[data-x=\"5\"][data-y=\"2\"]').dataset.etat, document.querySelector('.cell[data-x=\"2\"][data-y=\"5\"]').dataset.etat]")
    if etats != ["auj", "auj"]:
        PROBLEMES.append(f"{fmt} : la grille ne montre pas la carte dorée du jour dans ses deux cases ({etats})")
    ctx.close()


def tables_clara(navigateur, base):
    for fmt in FORMATS:
        album_avance(navigateur, base, fmt)
        ctx, page, err = contexte(navigateur, fmt)
        page.goto(f"{base}/clara/tables.html")
        diagnostic(page, err, fmt)
        seance(page, err, fmt)
        ctx.close()
        quatre_types(navigateur, base, fmt)
        dix_fois_dix(navigateur, base, fmt)
    ctx, page, err = contexte(navigateur, "ipad-paysage", "dark")
    page.goto(f"{base}/clara/tables.html")
    page.evaluate("localStorage.setItem('clara.tables', JSON.stringify(Object.assign(Tables.etatNeuf(), {diagnostic: true})))")
    page.reload()
    page.click("[data-a='seance']")
    page.wait_for_selector(".carte-pleine[data-type]")
    capture(page, "clara_ipad-paysage_soir-question", err)
    ctx.close()
    ctx, page, err = contexte(navigateur, "ipad-paysage", "dark")
    page.goto(f"{base}/clara/tables.html")
    page.evaluate(ETAT_ALBUM)
    page.reload()
    page.click("[data-a='album']")
    page.wait_for_selector(".album-ecran")
    page.click(".onglet[data-page='1']")
    page.wait_for_selector(".onglet.actif[data-page='1']")
    capture(page, "clara_ipad-paysage_soir-album", err)
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
