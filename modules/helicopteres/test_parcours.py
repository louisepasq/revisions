# /// script
# requires-python = ">=3.10"
# dependencies = ["playwright"]
# ///
"""Parcours au rendu réel du module des hélicoptères, avec Chrome installé.

Usage : uv run modules/helicopteres/test_parcours.py
Sert le dépôt en local, puis vérifie aux trois formats (iPad paysage 1080 x 810, iPad portrait
810 x 1080, iPhone 402 x 874) : le choix de la langue au premier lancement (le français proposé en
premier), l'atelier verrouillé puis ouvert après les trois premières étapes, les sept étapes dans
l'ordre de D-24 (mission et couleur ; comment il vole ; le cockpit touché commande par commande,
compteur de tours immobile, Henri qui apprend à Moussi ; l'atelier, le gabarit A4 imprimé, la saisie des
trois mesures par modèle ; la scène radio ; les records ; la sortie), les cartes de Leitner avec une
erreur volontaire, le tampon du carnet de pilote sur les deux pages (D-25), le passage à l'anglais
(progression gardée), un état enregistré sans langue, et le mode soir sur iPad. Échoue sur toute
erreur JavaScript, tout débordement horizontal, toute cible de moins de 56 px, tout rouge ou toute
croix. Captures dans modules/helicopteres/captures/ (ignoré par git) : les regarder.
La voix est espionnée (speechSynthesis.speak remplacé) : chaque écran doit être lu, dans la bonne langue.
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

DEBORDEMENTS_JS = """() => {
  const w = document.documentElement.clientWidth;
  const hors = [];
  if (document.documentElement.scrollWidth > w + 1) hors.push('page : scrollWidth ' + document.documentElement.scrollWidth);
  document.querySelectorAll('#app *').forEach(el => {
    if (el.closest('svg')) return;
    const r = el.getBoundingClientRect();
    if (r.width && (r.right > w + 1 || r.left < -1)) hors.push((typeof el.className === 'string' ? el.className : el.tagName) + ' ' + Math.round(r.left) + '..' + Math.round(r.right));
  });
  return hors.slice(0, 5);
}"""

# Cibles tactiles : tout bouton visible fait au moins 56 px dans sa plus petite dimension.
CIBLES_JS = """() => [...document.querySelectorAll('#app button, #app a.btn, #app a.rond, .voile button')].filter(b => {
  const r = b.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  const s = getComputedStyle(b);
  if (s.visibility === 'hidden' || s.display === 'none') return false;
  return Math.min(r.width, r.height) < 56;
}).map(b => (b.className || b.tagName) + ' ' + Math.round(b.getBoundingClientRect().width) + 'x' + Math.round(b.getBoundingClientRect().height)).slice(0, 5)"""

# Ni rouge ni croix : aucune classe, aucune couleur de texte ou de fond franchement rouge.
ROUGE_JS = """() => {
  const rouge = c => { const m = c.match(/rgba?\\((\\d+), (\\d+), (\\d+)/); return m && +m[1] > 180 && +m[2] < 90 && +m[3] < 90; };
  const l = [];
  document.querySelectorAll('#app *, .voile *').forEach(el => {
    const cl = typeof el.className === 'string' ? el.className : (el.className && el.className.baseVal) || '';
    if (/rouge|croix|erreur/.test(cl)) l.push(cl);
    if (el.closest('svg')) return;
    const s = getComputedStyle(el);
    if (rouge(s.color) || rouge(s.backgroundColor) || rouge(s.borderTopColor)) l.push((cl || el.tagName) + ' ' + s.color + ' ' + s.backgroundColor);
  });
  return l.slice(0, 3);
}"""

ESPION = """
window.__paroles = [];
window.__imprime = 0;
window.print = () => { window.__imprime++; };
if (window.speechSynthesis) {
  const ss = window.speechSynthesis;
  ss.speak = u => { window.__paroles.push({ texte: u.text, langue: u.lang }); setTimeout(() => { if (u.onend) u.onend(); }, 5); };
  ss.cancel = () => {};
  ss.getVoices = () => [{ lang: 'xx-XX' }];
}
"""


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
    ctx.add_init_script(ESPION)
    ctx.route("**/voix/index.json", lambda r: r.fulfill(status=200, content_type="application/json", body="{}"))
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
    for libelle, js in (("débordement horizontal", DEBORDEMENTS_JS), ("cibles de moins de 56 px", CIBLES_JS), ("rouge ou croix", ROUGE_JS)):
        r = page.evaluate(js)
        if r:
            PROBLEMES.append(f"{nom} : {libelle} {r}")
    while erreurs:
        PROBLEMES.append(f"{nom} : {erreurs.pop(0)}")


def verifier(cond, message):
    if not cond:
        PROBLEMES.append(message)


def paroles(page, depuis=0):
    return page.evaluate("n => window.__paroles.slice(n)", depuis)


def suivant(page):
    page.wait_for_selector(".h-suivant:not(.inactif)")
    page.click(".h-suivant")
    page.wait_for_timeout(60)


def etat(page):
    return page.evaluate("JSON.parse(localStorage.getItem('henri.helicopteres') || '{}')")


def objet_puis_accueil(page, nom, err, objet):
    page.wait_for_selector(".h-objet-grand")
    verifier(objet in page.inner_html(".h-objet-grand") or page.locator(".h-objet-grand .h-objet").count() == 1, f"{nom} : pas d'objet du carnet")
    capture(page, nom, err)
    page.click(".h-objet-ecran [data-a='suite']")
    page.wait_for_selector(".h-accueil")


def tenir(page, selecteur, ms):
    """Garde le doigt sur une commande du cockpit pendant ms millisecondes."""
    b = page.locator(selecteur)
    b.scroll_into_view_if_needed()
    box = b.bounding_box()
    page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
    page.mouse.down()
    page.wait_for_timeout(ms)
    page.mouse.up()
    page.wait_for_timeout(120)


def scene(page):
    return page.evaluate("Object.assign({}, document.querySelector('.h-scene').dataset)")


def cockpit(page, fmt, err):
    nom = f"3-cockpit_{fmt}"
    page.wait_for_selector(".h-cockpit")
    verifier(page.locator(".h-cmd-collectif .h-nom-cmd b").inner_text() == "Le collectif"
             and page.locator(".h-cmd-collectif .h-nom-cmd span").inner_text() == "The collective lever",
             f"{nom} : le nom anglais n'est pas sous le nom français")
    capture(page, f"{nom}_a-intro", err)
    page.click(".h-cp-suite")
    page.click(".h-cp-suite")
    page.wait_for_selector("#app[data-phase='guide-collectif']")
    verifier(page.locator(".h-cmd-collectif.h-brille").count() == 1, f"{nom} : le collectif n'est pas montré")
    tours = page.locator(".h-tours").text_content()
    avant = scene(page)
    # Le collectif : l'hélicoptère monte, les pales s'inclinent, le compteur de tours ne bouge pas.
    b = page.locator("[data-cmd='collectif'][data-dir='haut']")
    box = b.bounding_box()
    page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
    page.mouse.down()
    page.wait_for_timeout(700)
    pendant = scene(page)
    fleche = page.evaluate("document.querySelector('.h-fleches path') && document.querySelector('.h-fleches path').getAttribute('style')")
    capture(page, f"{nom}_b-collectif-tenu", err)
    page.mouse.up()
    verifier(float(pendant["alt"]) > float(avant["alt"]), f"{nom} : le collectif ne fait pas monter ({avant['alt']} puis {pendant['alt']})")
    verifier(pendant["pas"] == "14", f"{nom} : les pales ne s'inclinent pas ({pendant['pas']})")
    verifier(fleche and "h-collectif" in fleche, f"{nom} : la flèche n'est pas de la couleur du collectif ({fleche})")
    verifier(page.locator(".h-tours").text_content() == tours, f"{nom} : le compteur de tours a bougé")
    page.wait_for_selector("#app[data-phase='guide-manche']", timeout=8000)
    # Le manche : l'hélicoptère avance.
    x0 = float(scene(page)["x"])
    tenir(page, "[data-cmd='manche'][data-dir='avant']", 900)
    verifier(float(scene(page)["x"]) > x0, f"{nom} : le manche ne fait pas avancer")
    page.wait_for_selector("#app[data-phase='guide-pedales']", timeout=8000)
    # Les pédales : le nez tourne, vu de dessus.
    page.locator("[data-cmd='pedales'][data-dir='gauche']").scroll_into_view_if_needed()
    box = page.locator("[data-cmd='pedales'][data-dir='gauche']").bounding_box()
    page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
    page.mouse.down()
    page.wait_for_timeout(800)
    verifier(page.locator(".h-encart-dessus.actif").count() == 1, f"{nom} : la vue de dessus ne s'allume pas avec les pédales")
    capture(page, f"{nom}_c-pedales-tenues", err)
    page.mouse.up()
    verifier(scene(page)["cap"] != "0", f"{nom} : les pédales ne font pas tourner le nez")
    # Henri apprend à Moussi : une mauvaise commande d'abord, la bonne brille, puis la bonne.
    page.wait_for_selector("#app[data-phase='enseigner-collectif']", timeout=8000)
    capture(page, f"{nom}_d-moussi-demande", err)
    tenir(page, "[data-cmd='pedales'][data-dir='droite']", 500)
    verifier(page.locator(".h-cmd-collectif.h-brille").count() == 1, f"{nom} : après une mauvaise commande, la bonne ne brille pas")
    tenir(page, "[data-cmd='collectif'][data-dir='haut']", 500)
    page.wait_for_selector("#app[data-phase='enseigner-manche']", timeout=8000)
    tenir(page, "[data-cmd='manche'][data-dir='arriere']", 500)
    page.wait_for_selector("#app[data-phase='enseigner-pedales']", timeout=8000)
    tenir(page, "[data-cmd='pedales'][data-dir='droite']", 500)
    page.wait_for_selector("#app[data-phase='libre']", timeout=8000)
    dits = [p["texte"] for p in paroles(page)]
    verifier(any("instructeur" in d for d in dits), f"{nom} : Moussi n'a pas remercié son instructeur")
    capture(page, f"{nom}_e-libre", err)
    page.click(".h-cp-suite")
    page.wait_for_selector(".h-diapo")
    suivant(page)
    objet_puis_accueil(page, f"3-cockpit_{fmt}_f-ailes", err, "ailes")


def atelier(page, fmt, err):
    nom = f"4-atelier_{fmt}"
    page.click(".h-etape[data-etape='atelier']")
    page.wait_for_selector(".h-diapo")
    capture(page, f"{nom}_a-ouvert", err)
    suivant(page)
    # Le manuel, première page : le gabarit A4 s'imprime.
    page.click("[data-a='imprimer']")
    verifier(page.evaluate("window.__imprime") == 1, f"{nom} : Imprimer n'appelle pas l'impression")
    verifier(page.locator("#h-impression svg[width='190mm'][height='270mm']").count() == 1, f"{nom} : pas de gabarit A4 à imprimer")
    if fmt == "ipad-portrait":
        page.emulate_media(media="print")
        page.screenshot(path=str(CAPTURES / "4-atelier_gabarit-impression.png"), full_page=True)
        page.emulate_media(media="screen")
    capture(page, f"{nom}_b-manuel-1", err)
    for i in range(6):
        suivant(page)
        if i == 2:
            capture(page, f"{nom}_c-manuel-4", err)
    suivant(page)
    # La question et l'hypothèse.
    page.click(".h-rep[data-rep='lent']")
    capture(page, f"{nom}_d-hypothese", err)
    suivant(page)
    # Une seule chose change : la liste à cocher.
    for v in page.locator(".h-verif").all():
        v.click()
    capture(page, f"{nom}_e-une-chose", err)
    suivant(page)
    suivant(page)
    # Les mesures : une au chronomètre, les huit autres tapées au pavé.
    page.wait_for_selector(".h-mesures")
    page.click(".h-chrono")
    page.wait_for_timeout(450)
    page.click(".h-chrono")
    page.click(".h-taper")
    valeurs = ["13", "15", "21", "20", "23", "26", "28", "25"]
    for v in valeurs:
        for c in v:
            page.click(f".pave .touche[data-chiffre='{c}']")
        if v == "13":
            capture(page, f"{nom}_f-mesures-saisie", err)
        page.click(".pave .valider")
    x = etat(page)["experience"]["mesures"]
    verifier(all(len([v for v in x.get(m, []) if isinstance(v, int)]) == 3 for m in ("court", "moyen", "long")), f"{nom} : trois mesures par modèle attendues ({x})")
    verifier(x["court"][1] == 13, f"{nom} : la mesure tapée n'est pas gardée ({x})")
    capture(page, f"{nom}_g-mesures", err)
    suivant(page)
    page.wait_for_selector(".h-res-ligne")
    verifier(page.locator(".h-res-ligne").count() == 3, f"{nom} : pas une barre par modèle")
    verifier("km/h" not in page.inner_text("#app"), f"{nom} : une vitesse est calculée")
    page.click(".h-rep[data-rep='surpris']")
    capture(page, f"{nom}_h-resultats", err)
    suivant(page)
    suivant(page)
    objet_puis_accueil(page, f"{nom}_i-trombone", err, "trombone")


def radio(page, fmt, err):
    nom = f"5-radio_{fmt}"
    page.click(".h-go")
    page.wait_for_selector(".h-diapo")
    suivant(page)
    page.click(".h-rep[data-rep='attends']")
    page.click(".h-rep[data-rep='oui']")
    page.wait_for_selector(".h-idee:not(.cache)")
    capture(page, f"{nom}_a-tour", err)
    suivant(page)
    page.click(".h-rep[data-rep='personne']")
    verifier(page.locator(".h-rep[data-rep='proprio'].h-a-toucher").count() == 1, f"{nom} : la bonne réponse n'est pas surlignée")
    capture(page, f"{nom}_b-champ-aide", err)
    page.click(".h-rep[data-rep='proprio']")
    suivant(page)
    page.click(".h-rep[data-rep='pas-encore']")
    suivant(page)
    objet_puis_accueil(page, f"{nom}_c-casque", err, "casque")


def records(page, fmt, err):
    nom = f"6-records_{fmt}"
    page.click(".h-go")
    for i in range(6):
        page.wait_for_selector(".h-diapo")
        if i in (0, 2, 5):
            capture(page, f"{nom}_{i}", err)
        suivant(page)
    objet_puis_accueil(page, f"{nom}_medaille", err, "medaille")


def sortie(page, fmt, err):
    nom = f"7-sortie_{fmt}"
    page.click(".h-etape[data-etape='sortie']")
    page.wait_for_selector(".h-diapo")
    capture(page, f"{nom}_a", err)
    texte = page.inner_text("#app")
    verifier("9 h" not in texte and "12 h" not in texte and "04 42" not in texte, f"{nom} : des horaires ou un téléphone dans l'app")
    suivant(page)
    for v in page.locator(".h-verif").all():
        v.click()
    capture(page, f"{nom}_b-mission", err)
    page.click(".h-alle")
    objet_puis_accueil(page, f"{nom}_c-billet", err, "billet")


def cartes(page, fmt, err, prefixe="8-cartes"):
    nom = f"{prefixe}_{fmt}"
    page.click(".h-cartes-btn")
    page.wait_for_selector(".h-seance .zone[data-carte]")
    faux = prefixe == "8-cartes"
    for _ in range(30):
        if page.locator(".h-fin").count():
            break
        page.wait_for_selector(".h-fin, .h-seance .h-choix-btn:not([disabled])", timeout=8000)
        if page.locator(".h-fin").count():
            break
        bon = page.locator(".h-seance .zone").get_attribute("data-bon")
        if faux:
            faux = False
            avant = len(paroles(page))
            capture(page, f"{nom}_a-question", err)
            page.click(f".h-choix-btn:not([data-rep='{bon}'])")
            page.wait_for_selector(".h-choix-btn.h-a-toucher")
            dits = paroles(page, avant)
            verifier(dits and all(p["langue"] == "fr-FR" for p in dits), f"{nom} : l'explication n'est pas dite en français ({dits})")
            capture(page, f"{nom}_b-erreur", err)
        page.click(f".h-choix-btn[data-rep='{bon}']")
        page.wait_for_selector(".h-suite-q:not([disabled])", timeout=8000)
        page.click(".h-suite-q")
        page.wait_for_timeout(80)
    page.wait_for_selector(".h-fin")
    capture(page, f"{nom}_c-fin", err)


def carnet_tampon(page, fmt, err):
    """Les deux cartes du collectif en boîte 3 : la séance finie pose le tampon sur les deux pages."""
    nom = f"9-carnet_{fmt}"
    page.evaluate("""() => {
      const e = JSON.parse(localStorage.getItem('henri.helicopteres'));
      const auj = window.Zoom.jour(new Date());
      for (const id of ['c-collectif', 'c-monter']) e.cartes[id + '|q'] = { boite: 3, vu: true, prochain: auj, justesJours: ['2026-11-01', '2026-11-03', '2026-11-05'], erreurs: 0, debut: '2026-11-01' };
      localStorage.setItem('henri.helicopteres', JSON.stringify(e));
    }""")
    page.goto(page.url)
    page.wait_for_selector(".h-accueil")
    cartes(page, fmt, err, "9-carnet")
    verifier(page.locator(".h-fin-tampon").count() == 1, f"{nom} : la fin ne dit pas le nouveau tampon")
    page.click(".h-fin [data-a='carnet']")
    page.wait_for_selector(".h-carnet")
    page.wait_for_timeout(2400)
    poses = page.locator(".h-tampon-case.pose[data-cmd='collectif']").count()
    verifier(poses == 2, f"{nom} : le tampon du collectif n'est pas sur les deux pages ({poses})")
    verifier(page.locator(".h-tampon-case.pose").count() == 2, f"{nom} : d'autres tampons que le collectif")
    verifier(page.locator(".h-objet-case.a").count() == 7, f"{nom} : les sept objets ne sont pas dans le carnet")
    verifier(page.locator(".h-nom-case b").first.inner_text() == "Henri", f"{nom} : le nom d'Henri n'est pas dans sa case")
    capture(page, nom, err)
    page.click(".h-carnet .rond")
    page.wait_for_selector(".h-accueil")


def premier_lancement(navigateur, base, fmt):
    ctx, page, err = contexte(navigateur, fmt)
    page.goto(f"{base}/henri/helicopteres.html")
    # La langue au premier lancement : le français proposé en premier (D-24, point 5).
    page.wait_for_selector(".h-langue-carte")
    verifier(page.locator(".h-langue-carte").first.get_attribute("data-langue") == "fr", f"langue {fmt} : le français n'est pas proposé en premier")
    verifier(page.locator(".titre-ecran").inner_text().startswith("Which language"), f"langue {fmt} : le cadre n'est pas en anglais")
    capture(page, f"0-langue_{fmt}", err)
    page.click(".h-langue-carte[data-langue='fr']")
    page.wait_for_selector(".h-accueil")
    verifier(page.locator(".h-etape[data-etape='atelier'][aria-disabled='true']").count() == 1, f"accueil {fmt} : l'atelier n'est pas verrouillé")
    page.click(".h-etape[data-etape='atelier']", force=True)
    verifier(page.locator(".h-accueil").count() == 1, f"accueil {fmt} : l'atelier verrouillé s'ouvre")
    verifier(page.locator(".nav .nom").first.inner_text() == "Back", f"accueil {fmt} : Back n'est pas en anglais")
    capture(page, f"1-accueil_{fmt}", err)

    # a) Mon hélicoptère : les parties, la mission, la couleur.
    page.click(".h-go")
    page.wait_for_selector(".h-diapo")
    dit = paroles(page)
    verifier(dit and dit[-1]["langue"] == "fr-FR" and "H125" in dit[-1]["texte"], f"a {fmt} : l'écran n'est pas lu en français ({dit[-1:]})")
    capture(page, f"2a-helico_{fmt}_a", err)
    suivant(page)
    for p in page.locator(".h-puce").all():
        p.click()
    verifier("queue" in page.inner_text(".h-bulle") or "boom" in page.inner_text(".h-bulle"), f"a {fmt} : toucher une partie ne l'explique pas")
    capture(page, f"2a-helico_{fmt}_b-parties", err)
    suivant(page)
    page.click(".h-mission[data-mission='feux']")
    capture(page, f"2a-helico_{fmt}_c-mission", err)
    suivant(page)
    page.click(".h-couleur[data-couleur='violet']")
    capture(page, f"2a-helico_{fmt}_d-couleur", err)
    suivant(page)
    objet_puis_accueil(page, f"2a-helico_{fmt}_e-ecusson", err, "ecusson")
    e = etat(page)
    verifier(e.get("mission") == "feux" and e.get("couleur") == "violet", f"a {fmt} : mission ou couleur non gardée ({e.get('mission')}, {e.get('couleur')})")

    # b) Comment il vole : la conception initiale, puis les écrans, puis le retour à la question.
    page.click(".h-go")
    page.wait_for_selector(".h-rep[data-rep='oui']")
    page.click(".h-rep[data-rep='oui']")
    page.wait_for_selector(".h-diapo .h-suivant")
    for i in range(8):
        if i in (1, 2, 5):
            capture(page, f"2b-vol_{fmt}_{i}", err)
        suivant(page)
    verifier("surpris" in page.inner_text(".h-bulle"), f"b {fmt} : le retour à la question ne reprend pas la réponse d'Henri")
    capture(page, f"2b-vol_{fmt}_retour", err)
    suivant(page)
    objet_puis_accueil(page, f"2b-vol_{fmt}_autocollant", err, "autocollant")

    # c) Le cockpit, puis l'atelier qui s'ouvre (jamais sur un score : aucune carte faite).
    verifier(not etat(page).get("cartes"), f"c {fmt} : des cartes faites avant le cockpit")
    page.click(".h-go")
    cockpit(page, fmt, err)
    verifier(page.locator(".h-etape[data-etape='atelier'][aria-disabled='true']").count() == 0, f"c {fmt} : l'atelier reste fermé après les trois étapes")
    capture(page, f"3-accueil-atelier-ouvert_{fmt}", err)
    atelier(page, fmt, err)
    radio(page, fmt, err)
    records(page, fmt, err)
    sortie(page, fmt, err)
    verifier(len(etat(page).get("etapes", {})) == 7, f"{fmt} : les sept étapes ne sont pas toutes faites")
    cartes(page, fmt, err)
    carnet_tampon(page, fmt, err)

    # La langue se change depuis l'accueil : le contenu passe en anglais, la progression reste.
    avant = json.dumps(etat(page).get("cartes"), sort_keys=True)
    page.click(".h-langue-btn")
    page.click(".h-langue-carte[data-langue='en']")
    page.wait_for_selector(".h-accueil")
    verifier(page.locator(".titre-ecran").inner_text() == "My helicopter", f"{fmt} : l'accueil n'est pas passé en anglais")
    verifier(json.dumps(etat(page).get("cartes"), sort_keys=True) == avant, f"{fmt} : changer de langue change la progression")
    capture(page, f"10-accueil-en_{fmt}", err)
    page.click(".h-etape[data-etape='cockpit']")
    page.wait_for_selector(".h-cockpit")
    verifier(page.locator(".h-cmd-manche .h-nom-cmd b").inner_text() == "The cyclic stick", f"{fmt} : le cockpit n'est pas passé en anglais")
    capture(page, f"10-cockpit-en_{fmt}", err)
    ctx.close()


def etat_sans_langue(navigateur, base, fmt, schema="light"):
    """Un état enregistré sans le champ de langue : le choix s'affiche, rien ne se perd."""
    ctx, page, err = contexte(navigateur, fmt, schema)
    page.goto(f"{base}/henri/helicopteres.html")
    page.evaluate("""() => localStorage.setItem('henri.helicopteres', JSON.stringify({
      version: 1, etapes: { helico: '2026-11-07', vol: '2026-11-07', cockpit: '2026-11-08' }, objets: { ecusson: '2026-11-07', autocollant: '2026-11-07', ailes: '2026-11-08' },
      cartes: { 'p-pales|q': { boite: 2, vu: true, prochain: '2026-11-08', justesJours: ['2026-11-07'], erreurs: 0, debut: '2026-11-07' } },
      jours: ['2026-11-07', '2026-11-08'], brevet: { collectif: '2026-11-08' }, tampons: ['collectif'], mission: 'secours', couleur: 'jaune' }))""")
    page.reload()
    page.wait_for_selector(".h-langue-carte")
    page.click(".h-langue-carte[data-langue='fr']")
    page.wait_for_selector(".h-accueil")
    e = etat(page)
    verifier(e.get("langue") == "fr" and e["cartes"]["p-pales|q"]["boite"] == 2 and len(e["etapes"]) == 3, f"sans langue {fmt} : la progression a changé ({e})")
    suffixe = fmt + ("_soir" if schema == "dark" else "")
    capture(page, f"11-sans-langue_{suffixe}", err)
    if schema == "dark":
        page.click(".h-carnet-btn")
        page.wait_for_selector(".h-carnet")
        capture(page, f"11-carnet_{suffixe}", err)
        page.click(".h-carnet .rond")
        page.click(".h-go")
        page.wait_for_selector(".h-diapo")
        capture(page, f"11-radio_{suffixe}", err)
        page.goto(f"{base}/henri/helicopteres.html")
        page.click(".h-etape[data-etape='cockpit']")
        page.wait_for_selector(".h-cockpit")
        page.click(".h-cp-suite")
        page.click(".h-cp-suite")
        page.wait_for_selector("#app[data-phase='libre']")
        tenir(page, "[data-cmd='collectif'][data-dir='haut']", 800)
        capture(page, f"11-cockpit_{suffixe}", err)
    ctx.close()


def main():
    CAPTURES.mkdir(exist_ok=True)
    for f in CAPTURES.glob("*.png"):
        f.unlink()
    serveur, base = servir()
    with sync_playwright() as p:
        navigateur = p.chromium.launch(channel="chrome")
        for fmt in FORMATS:
            premier_lancement(navigateur, base, fmt)
            etat_sans_langue(navigateur, base, fmt)
        etat_sans_langue(navigateur, base, "ipad-paysage", "dark")
        navigateur.close()
    serveur.shutdown()
    n = len(list(CAPTURES.glob("*.png")))
    if PROBLEMES:
        print(f"{len(PROBLEMES)} problème(s), {n} captures :")
        for p_ in PROBLEMES:
            print(" -", p_)
        sys.exit(1)
    print(f"parcours des hélicoptères : ok, {n} captures dans {CAPTURES.relative_to(RACINE)}")


if __name__ == "__main__":
    main()
