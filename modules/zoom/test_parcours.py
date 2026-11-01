# /// script
# requires-python = ">=3.10"
# dependencies = ["playwright"]
# ///
"""Parcours au rendu réel du module « De l'univers à Éguilles », avec Chrome installé.

Usage : uv run modules/zoom/test_parcours.py
Sert le dépôt en local, puis vérifie aux trois formats (iPad paysage 1080 x 810, iPad portrait
810 x 1080, iPhone 402 x 874) : la carte du portail, le premier lancement de Clara (choix de la langue,
anglais ; invitation, grand voyage, Skip, adresse dans l'univers), une séance complète en anglais avec
une erreur volontaire (le bon lieu surligné, l'épingle, le repère, la voix qui dit le nom, la retouche),
la fin, l'accueil et ses étapes, l'exploration (un lieu touché, le zoom vers l'étape suivante), le
passage au français depuis l'accueil (progression gardée), puis une séance avancée d'Henri en français
sur plusieurs étapes avec des questions « nommer » (D-21). Échoue sur toute erreur JavaScript,
tout débordement horizontal, toute cible de moins de 44 px. Captures dans modules/zoom/captures/.
La voix est espionnée (speechSynthesis.speak remplacé) : chaque question doit être lue.
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
  document.querySelectorAll('body *').forEach(el => {
    if (el.closest('#kr-sprite') || el.closest('#z-defs') || el.closest('svg.carte-svg')) return;
    const r = el.getBoundingClientRect();
    if (r.width && (r.right > w + 1 || r.left < -1)) hors.push((el.className && el.className.baseVal === undefined ? el.className : el.tagName) + ' ' + Math.round(r.left) + '..' + Math.round(r.right));
  });
  return hors.slice(0, 5);
}"""

# Cibles tactiles : tout bouton visible fait au moins 44 px dans sa plus petite dimension.
CIBLES_JS = """() => [...document.querySelectorAll('button, a.btn, a.rond, a.module')].filter(b => {
  const r = b.getBoundingClientRect();
  if (!r.width || !r.height || b.closest('.voile') && !document.querySelector('.voile')) return false;
  const s = getComputedStyle(b);
  if (s.visibility === 'hidden' || s.display === 'none') return false;
  return Math.min(r.width, r.height) < 44;
}).map(b => (b.className || b.tagName) + ' ' + Math.round(b.getBoundingClientRect().width) + 'x' + Math.round(b.getBoundingClientRect().height)).slice(0, 5)"""

ESPION_VOIX = """
window.__paroles = [];
if (window.speechSynthesis) {
  const ss = window.speechSynthesis;
  ss.speak = u => { window.__paroles.push({ texte: u.text, langue: u.lang }); setTimeout(() => { if (u.onend) u.onend(); }, 5); };
  ss.cancel = () => {};
  ss.getVoices = () => [{ lang: 'xx-XX' }];
}
"""

# Un point d'écran sur le lieu demandé (juste=True) ou franchement à côté (juste=False), calculé par
# la géométrie du module elle-même.
CIBLE_JS = """([juste]) => {
  const z = document.querySelector('.z-seance .zone');
  const svg = z.querySelector('svg.carte-svg');
  const et = window.ZoomCartes[z.dataset.etage];
  const ids = window.ZoomContenu.ETAGES.find(e => e.id === z.dataset.etage).lieux.map(l => l.id);
  const m = svg.getScreenCTM();
  const vers = (x, y) => { const p = svg.createSVGPoint(); p.x = x; p.y = y; const q = p.matrixTransform(m); return [q.x, q.y]; };
  const f = et.formes[z.dataset.lieu];
  const essais = [];
  if (f.f === 'p') essais.push(f.g);
  else if (f.f === 'l') { const t = f.g[0]; const i = 2 * Math.floor(t.length / 4); essais.push([t[i], t[i + 1]]); }
  else essais.push(f.e);
  if (!juste) {
    essais.length = 0;
    for (let k = 0; k < 400; k++) essais.push([et.l * ((k * 37) % 97) / 97, et.h * ((k * 53) % 89) / 89]);
  }
  for (const [x, y] of essais) {
    const ok = window.ZoomGeo.toucheJuste(et, z.dataset.lieu, ids, x, y, m.a);
    const [cx, cy] = vers(x, y);
    const r = svg.getBoundingClientRect();
    const dedans = cx > r.left + 4 && cx < r.right - 4 && cy > r.top + 4 && cy < r.bottom - 4;
    if (ok === juste && dedans) return [cx, cy];
  }
  return null;
}"""


def paroles(page):
    return page.evaluate("window.__paroles.map(p => p.texte)")


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
    ctx.route("**/voix/index.json", lambda r: r.fulfill(status=200, content_type="application/json", body="{}"))
    ctx.route("**/api/progression**", lambda r: r.fulfill(status=200, content_type="application/json",
                                                         body=r.request.post_data or "{}"))
    page = ctx.new_page()
    erreurs: list[str] = []
    page.on("pageerror", lambda e: erreurs.append("JS : " + str(e)))
    page.on("console", lambda m: erreurs.append("console : " + m.text) if m.type == "error" else None)
    return ctx, page, erreurs


def capture(page, nom, erreurs, cibles=True):
    page.evaluate("document.fonts.ready")
    page.wait_for_timeout(400)
    page.screenshot(path=str(CAPTURES / f"{nom}.png"))
    hors = page.evaluate(DEBORDEMENTS_JS)
    if hors:
        PROBLEMES.append(f"{nom} : débordement horizontal {hors}")
    if cibles:
        petites = page.evaluate(CIBLES_JS)
        if petites:
            PROBLEMES.append(f"{nom} : cibles de moins de 44 px {petites}")
    while erreurs:
        PROBLEMES.append(f"{nom} : {erreurs.pop(0)}")


def toucher(page, juste):
    pt = page.evaluate(CIBLE_JS, [juste])
    if not pt:
        raise AssertionError("pas de point " + ("juste" if juste else "faux") + " trouvé sur la carte")
    page.mouse.click(pt[0], pt[1])


def attendre_suite(page):
    page.wait_for_selector(".z-suite:not([disabled]), .z-fin, .z-seance .zone[data-type]:not([data-type=''])", timeout=10000)


def faire_seance(page, fmt, prefixe, erreurs, erreur_volontaire=True, langue="en"):
    """Répond à toute la séance ; la première question « toucher » reçoit une erreur volontaire."""
    voix = "en-GB" if langue == "en" else "fr-FR"
    page.wait_for_selector(".z-seance .zone[data-lieu]")
    deja_faux = not erreur_volontaire
    captures_faites = set()
    for _ in range(60):
        if page.locator(".z-fin").count():
            return
        page.wait_for_selector(".z-fin, .z-seance .zone[data-type]", timeout=10000)
        if page.locator(".z-fin").count():
            return
        page.wait_for_timeout(150)
        zone = page.locator(".z-seance .zone")
        typ = zone.get_attribute("data-type")
        lieu = zone.get_attribute("data-lieu")
        avant = len(paroles(page))
        etage = zone.get_attribute("data-etage")
        if typ != "decouverte" and etage not in captures_faites:
            capture(page, f"{prefixe}_etape-{etage}_{fmt}", erreurs)
            captures_faites.add(etage)
        if typ == "decouverte":
            if "decouverte" not in captures_faites:
                capture(page, f"{prefixe}_decouverte_{fmt}", erreurs)
                captures_faites.add("decouverte")
            toucher(page, True)
        elif typ == "toucher":
            if "toucher" not in captures_faites:
                capture(page, f"{prefixe}_toucher_{fmt}", erreurs)
                captures_faites.add("toucher")
            if not deja_faux:
                deja_faux = True
                toucher(page, False)
                page.wait_for_selector(".hl-aide")
                page.wait_for_timeout(200)
                dit = paroles(page)[avant:]
                nom_dit = page.evaluate("([l, lg]) => window.ZoomContenu.PHRASES.voici(window.ZoomContenu.lieu(l), lg)", [lieu, langue])
                if nom_dit not in dit:
                    PROBLEMES.append(f"{prefixe} {fmt} : après l'erreur, la voix n'a pas dit « {nom_dit} » ({dit})")
                langues = set(page.evaluate("n => window.__paroles.slice(n).map(p => p.langue)", avant))
                if langues != {voix}:
                    PROBLEMES.append(f"{prefixe} {fmt} : après l'erreur, la voix n'est pas en {voix} ({langues})")
                if page.locator(".epingle").count() == 0 or page.locator(".bulle.astuce").count() == 0:
                    PROBLEMES.append(f"{prefixe} {fmt} : pas d'épingle ni de repère après l'erreur")
                if page.locator(".z-seance [class*='rouge'], .z-seance [class*='croix']").count():
                    PROBLEMES.append(f"{prefixe} {fmt} : rouge ou croix sur une erreur")
                capture(page, f"{prefixe}_erreur_{fmt}", erreurs)
                toucher(page, True)
            else:
                toucher(page, True)
        elif typ == "nommer":
            if "nommer" not in captures_faites:
                capture(page, f"{prefixe}_nommer_{fmt}", erreurs)
                captures_faites.add("nommer")
            n = page.locator(".z-choix .btn").count()
            if n < 2:
                PROBLEMES.append(f"{prefixe} {fmt} : {n} nom proposé pour « nommer »")
            page.click(f".z-choix .btn[data-lieu='{lieu}']")
        else:
            raise AssertionError(f"question inconnue {typ}")
        page.wait_for_selector(".z-suite:not([disabled])", timeout=10000)
        if "juste" not in captures_faites:
            capture(page, f"{prefixe}_juste_{fmt}", erreurs)
            captures_faites.add("juste")
        page.click(".z-suite")
        page.wait_for_timeout(100)
    raise AssertionError("la séance ne finit pas")


def portails(navigateur, base):
    for enfant in ("henri", "clara"):
        for fmt in FORMATS:
            ctx, page, err = contexte(navigateur, fmt)
            page.goto(f"{base}/{enfant}/index.html")
            # Portail en cahiers (D-19) : le voyage est dans le cahier d'histoire-géographie.
            page.click(".cahier[data-matiere='hg']")
            page.wait_for_selector("a.mod[href='zoom.html']")
            capture(page, f"portail_{enfant}_{fmt}", err)
            ctx.close()


def premier_lancement(navigateur, base, fmt):
    ctx, page, err = contexte(navigateur, fmt)
    page.goto(f"{base}/clara/zoom.html")
    # D-21 : au premier lancement, l'enfant choisit la langue du voyage ; Clara choisit l'anglais.
    page.wait_for_selector(".z-langue .z-langue-carte[data-langue='fr']")
    if page.locator(".z-langue-carte").count() != 2:
        PROBLEMES.append(f"langue {fmt} : pas deux cartes de langue")
    capture(page, f"clara_langue_{fmt}", err)
    page.click(".z-langue-carte[data-langue='en']")
    page.wait_for_selector(".z-parole")
    if page.evaluate("JSON.parse(localStorage.getItem('clara.zoom')).langue") != "en":
        PROBLEMES.append(f"langue {fmt} : le choix n'est pas retenu dans l'état")
    capture(page, f"clara_intro_{fmt}", err)
    page.click("[data-a='go']")
    page.wait_for_selector(".z-voyage .carte-zoom")
    page.wait_for_timeout(300)
    capture(page, f"clara_voyage_univers_{fmt}", err)
    if fmt == "ipad-paysage":
        page.wait_for_function("document.querySelector('.z-voyage-titre').textContent === 'The Earth'", timeout=20000)
        page.wait_for_timeout(1300)
        capture(page, f"clara_voyage_terre_{fmt}", err)
    page.click("[data-a='passer']")
    page.wait_for_selector(".z-voyage-fin")
    page.wait_for_timeout(300)
    capture(page, f"clara_voyage_fin_{fmt}", err)
    adresse = page.evaluate("window.ZoomContenu.ADRESSES.en")
    if adresse not in paroles(page):
        PROBLEMES.append(f"voyage {fmt} : l'adresse dans l'univers n'est pas lue")
    page.click(".z-voyage-fin [data-a='suite']")
    page.wait_for_selector(".z-seance")
    premiere = paroles(page)[-1] if paroles(page) else ""
    if not premiere.startswith("This is") and not premiere.startswith("Touch"):
        PROBLEMES.append(f"séance {fmt} : la première question n'est pas lue ({premiere})")
    faire_seance(page, fmt, "clara", err)
    capture(page, f"clara_fin_{fmt}", err)
    etat = page.evaluate("JSON.parse(localStorage.getItem('clara.zoom'))")
    if not etat or not etat.get("intro") or not etat.get("cartes"):
        PROBLEMES.append(f"séance {fmt} : progression non sauvée sous clara.zoom")
    # Accueil du module, étapes, exploration
    page.click(".z-fin [data-a='voyage']")
    page.wait_for_selector(".z-accueil")
    capture(page, f"clara_accueil_{fmt}", err)
    page.click(".z-etape[data-etage='paca']")
    page.wait_for_selector(".z-explorer")
    avant = len(paroles(page))
    page.click(".z-puce[data-lieu='aix']")
    page.wait_for_timeout(200)
    if "It's Aix-en-Provence." not in paroles(page)[avant:]:
        PROBLEMES.append(f"exploration {fmt} : toucher Aix ne dit pas son nom")
    capture(page, f"clara_explorer_paca_{fmt}", err)
    page.click("[data-a='rapprocher']")
    page.wait_for_selector(".z-explorer h1:has-text('Bouches-du-Rhône')")
    page.click(".z-puce[data-lieu='eguilles']")
    capture(page, f"clara_explorer_bdr_{fmt}", err)
    # Passer au français depuis l'accueil du module : le contenu change, la progression reste.
    page.click("[data-a='retour']")
    page.wait_for_selector(".z-accueil")
    compte = page.inner_text(".z-accueil .indice")
    cartes = page.evaluate("JSON.stringify(JSON.parse(localStorage.getItem('clara.zoom')).cartes)")
    page.click("[data-a='langue']")
    page.wait_for_selector(".z-langue .z-langue-carte[data-langue='en'][aria-pressed='true']")
    capture(page, f"clara_langue_changer_{fmt}", err)
    page.click(".z-langue-carte[data-langue='fr']")
    page.wait_for_selector(".z-accueil .z-etape[data-etage='terre'] b:has-text('La Terre')")
    if page.inner_text(".z-accueil .indice") != compte or page.evaluate("JSON.stringify(JSON.parse(localStorage.getItem('clara.zoom')).cartes)") != cartes:
        PROBLEMES.append(f"langue {fmt} : changer de langue change la progression")
    if "Back" not in page.inner_text(".z-accueil .barre"):
        PROBLEMES.append(f"langue {fmt} : le cadre du module ne reste pas en anglais")
    capture(page, f"clara_accueil_fr_{fmt}", err)
    # Le résumé du portail (D-19) est publié ; « Done for today » ramène au portail, où il s'affiche.
    resume = page.evaluate("JSON.parse(localStorage.getItem('clara.zoom')).resume")
    if not resume or not resume.get("ecritLe") or not resume.get("progres") or not resume.get("parent"):
        PROBLEMES.append(f"résumé {fmt} : le zoom ne publie pas son résumé ({resume})")
    page.goto(page.url.replace("zoom.html", "index.html"))
    page.click(".cahier[data-matiere='hg']")
    page.wait_for_selector("a.mod[href='zoom.html'] .jauge-m")
    if "places" not in page.inner_text("a.mod[href='zoom.html']"):
        PROBLEMES.append(f"portail {fmt} : la carte du voyage ne montre pas sa phrase de progrès")
    capture(page, f"clara_portail_apres_{fmt}", err)
    page.click("a.mod[href='zoom.html']")
    page.wait_for_selector(".z-accueil")
    page.click(".z-accueil .barre a.rond[href='./']")
    page.wait_for_selector(".portail .cahiers")
    ctx.close()


def seance_avancee(navigateur, base, fmt, schema="light"):
    """Henri a ouvert six étapes : la séance traverse plusieurs cartes et pose des « nommer »."""
    ctx, page, err = contexte(navigateur, fmt, schema)
    page.goto(f"{base}/henri/zoom.html")
    page.evaluate("""() => {
      const prog = window.ZoomContenu.programme('henri');
      // Un état enregistré avant D-21 : pas de champ langue, comme sur l'iPad d'Henri.
      const etat = { version: 1, cartes: {}, etages: 6, jours: ['2026-10-30'], intro: true };
      prog.etages.slice(0, 6).forEach((e, i) => e.lieux.forEach((l, k) => {
        etat.cartes[l + '|toucher'] = { boite: (k % 3) + 1, vu: true, prochain: (k % 2 ? '2026-10-31' : '2099-01-01'), justesJours: ['2026-10-30'], erreurs: k % 4 === 0 ? 1 : 0 };
        if ((k % 3) + 1 >= 2) etat.cartes[l + '|nommer'] = { boite: 1, vu: true, prochain: '2026-10-31', justesJours: [], erreurs: 0 };
      }));
      localStorage.setItem('henri.zoom', JSON.stringify(etat));
    }""")
    page.reload()
    # Le choix de la langue s'affiche au lancement suivant ; Henri choisit le français, rien ne se perd.
    avant = page.evaluate("JSON.stringify(JSON.parse(localStorage.getItem('henri.zoom')).cartes)")
    page.wait_for_selector(".z-langue .z-langue-carte[data-langue='fr']")
    page.click(".z-langue-carte[data-langue='fr']")
    page.wait_for_selector(".z-accueil")
    etat = page.evaluate("JSON.parse(localStorage.getItem('henri.zoom'))")
    if etat.get("langue") != "fr" or json.dumps(etat.get("cartes"), separators=(",", ":")) != avant or etat.get("etages") != 6:
        PROBLEMES.append(f"henri {fmt} : choisir la langue sur un état existant change la progression")
    suffixe = f"{fmt}" + ("_soir" if schema == "dark" else "")
    capture(page, f"henri_accueil_{suffixe}", err)
    page.click("[data-a='seance']")
    faire_seance(page, suffixe, "henri", err, erreur_volontaire=(schema == "light"), langue="fr")
    capture(page, f"henri_fin_{suffixe}", err)
    ctx.close()


def main():
    CAPTURES.mkdir(exist_ok=True)
    serveur, base = servir()
    with sync_playwright() as p:
        navigateur = p.chromium.launch(channel="chrome")
        portails(navigateur, base)
        for fmt in FORMATS:
            premier_lancement(navigateur, base, fmt)
            seance_avancee(navigateur, base, fmt)
        seance_avancee(navigateur, base, "ipad-paysage", "dark")
        navigateur.close()
    serveur.shutdown()
    if PROBLEMES:
        print("\n".join(PROBLEMES))
        sys.exit(1)
    print(f"parcours du zoom : ok, captures dans {CAPTURES.relative_to(RACINE)}")


if __name__ == "__main__":
    main()
