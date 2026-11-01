# /// script
# requires-python = ">=3.10"
# dependencies = ["playwright"]
# ///
"""Parcours au rendu réel du jeu du nombre cible, avec Chrome installé.

Usage : uv run modules/cible/test_parcours.py
Sert le dépôt en local, puis, pour Henri et pour Clara, aux trois formats (iPad paysage 1080 x 810,
iPad portrait 810 x 1080, iPhone 402 x 874) : l'accueil du jeu et son résumé publié, une partie sans
chrono (cible lue à voix haute, coup refusé et expliqué en français, calcul juste, Annuler, indice
annoncé puis pris, cible atteinte, fin de partie avec le défi de la mascotte, « Montre-moi »), la
même cible rejouée au meilleur score, puis une partie avec le chrono de 3 minutes (temps fini sans
punition, on continue) et l'arrêt en cours de partie. Une partie d'Henri en mode soir.
Échoue sur toute erreur JavaScript, tout débordement horizontal, toute cible de moins de 56 px,
tout rouge ou toute croix. Captures dans modules/cible/captures/ (ignoré par git) : les regarder.
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
MASCOTTES = {"henri": "Moussi", "clara": "Pooh Bear"}
PROBLEMES: list[str] = []

DEBORDEMENTS_JS = """() => {
  const w = document.documentElement.clientWidth;
  const h = document.documentElement.clientHeight;
  const hors = [];
  if (document.documentElement.scrollWidth > w + 1) hors.push('page : scrollWidth ' + document.documentElement.scrollWidth);
  document.querySelectorAll('body *').forEach(el => {
    if (el.closest('#kr-sprite')) return;
    const r = el.getBoundingClientRect();
    if (r.width && (r.right > w + 1 || r.left < -1)) hors.push((el.className && el.className.baseVal === undefined ? el.className : el.tagName) + ' ' + Math.round(r.left) + '..' + Math.round(r.right));
  });
  // Un écran de jeu tient dans la fenêtre : rien sous le bas de l'écran.
  if (document.querySelector('.c-jeu')) {
    document.querySelectorAll('.c-jeu button').forEach(b => {
      const r = b.getBoundingClientRect();
      if (r.height && r.bottom > h + 1) hors.push('sous l\\'écran : ' + b.className + ' ' + Math.round(r.bottom));
    });
  }
  return hors.slice(0, 5);
}"""

# Cibles tactiles : tout bouton visible fait au moins 56 px dans sa plus petite dimension.
CIBLES_JS = """() => [...document.querySelectorAll('button, a.btn, a.rond')].filter(b => {
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
    if (el.closest('svg.masc') || el.closest('.medaillon')) return; // le t-shirt de Pooh Bear
    const cl = typeof el.className === 'string' ? el.className : '';
    if (/rouge|croix|erreur/.test(cl)) l.push(cl);
    const s = getComputedStyle(el);
    if (rouge(s.color) || rouge(s.backgroundColor)) l.push((cl || el.tagName) + ' ' + s.color + ' ' + s.backgroundColor);
  });
  return l.slice(0, 3);
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

PAIRE_REFUS_JS = """() => { const d = window.CibleJeu.partie().dispo.slice().sort((x, y) => x.v - y.v); return [d[0].id, d[d.length - 1].id]; }"""
PAIRE_VALIDE_JS = """() => {
  const p = window.CibleJeu.partie();
  for (const a of p.dispo) for (const b of p.dispo) if (a.id !== b.id && a.v + b.v !== p.cible) return [a.id, b.id];
  return null;
}"""
IDS_JS = """([a, b]) => { const d = window.CibleJeu.partie().dispo; const A = d.find(x => x.v === a); const B = d.find(x => x.v === b && x.id !== A.id); return [A.id, B.id]; }"""
CHEMIN_JS = """() => { const p = window.CibleJeu.partie(); return window.Cible.resoudre(p.cible, p.dispo.map(x => x.v)).solution; }"""


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


def capture(page, nom, erreurs):
    page.evaluate("document.fonts.ready")
    page.wait_for_timeout(450)
    page.screenshot(path=str(CAPTURES / f"{nom}.png"))
    hors = page.evaluate(DEBORDEMENTS_JS)
    if hors:
        PROBLEMES.append(f"{nom} : débordement {hors}")
    petites = page.evaluate(CIBLES_JS)
    if petites:
        PROBLEMES.append(f"{nom} : cibles de moins de 56 px {petites}")
    rouges = page.evaluate(ROUGE_JS)
    if rouges:
        PROBLEMES.append(f"{nom} : rouge ou croix {rouges}")
    while erreurs:
        PROBLEMES.append(f"{nom} : {erreurs.pop(0)}")


def tuile(page, ident):
    page.click(f".c-tuile[data-id='{ident}']")


def jouer_etape(page, a, op, b):
    ida, idb = page.evaluate(IDS_JS, [a, b])
    tuile(page, ida)
    page.click(f".c-op[data-op='{op}']")
    tuile(page, idb)


def jouer_chemin(page, etapes):
    for e in etapes:
        jouer_etape(page, e["a"], e["op"], e["b"])
        page.wait_for_timeout(80)


def verifier(cond, message):
    if not cond:
        PROBLEMES.append(message)


def partie_complete(navigateur, base, enfant, fmt, schema="light"):
    """Accueil, refus, calcul, Annuler, indice, victoire, défi, même cible au meilleur score."""
    ctx, page, err = contexte(navigateur, fmt, schema)
    suffixe = f"{enfant}_{fmt}" + ("_soir" if schema == "dark" else "")
    page.goto(f"{base}/{enfant}/cible.html")
    page.wait_for_selector(".c-accueil")
    capture(page, f"accueil_{suffixe}", err)
    resume = page.evaluate(f"(JSON.parse(localStorage.getItem('{enfant}.cible')) || {{}}).resume")
    verifier(resume and resume.get("progres", {}).get("phrase"), f"{suffixe} : pas de résumé publié à l'ouverture")

    # Une partie sans chrono : le défaut
    page.click("[data-a='go']")
    page.wait_for_selector(".c-jeu .c-tuile")
    verifier(page.locator(".c-chrono").count() == 0, f"{suffixe} : un chrono sans l'avoir choisi")
    cible = page.evaluate("window.CibleJeu.partie().cible")
    dit = f"La cible est {cible}. Atteins-la avec les cinq nombres."
    verifier(dit in paroles(page), f"{suffixe} : la cible n'est pas lue ({paroles(page)[-2:]})")
    verifier(page.locator(".c-tuile").count() == 5, f"{suffixe} : pas cinq nombres")
    capture(page, f"jeu_{suffixe}", err)

    # Coup refusé : le plus petit moins le plus grand
    a, b = page.evaluate(PAIRE_REFUS_JS)
    tuile(page, a)
    capture(page, f"jeu_choix_{suffixe}", err)
    page.click(".c-op[data-op='−']")
    avant = len(paroles(page))
    tuile(page, b)
    page.wait_for_selector(".c-retour .bulle.astuce")
    texte = page.inner_text(".c-retour .bulle.astuce")
    verifier("enlever" in texte or "zéro" in texte, f"{suffixe} : refus mal expliqué ({texte})")
    verifier(any("enlever" in p or "zéro" in p for p in paroles(page)[avant:]), f"{suffixe} : le refus n'est pas dit")
    verifier(page.locator(".c-tuile").count() == 5 and page.locator(".c-etapes li").count() == 0, f"{suffixe} : un refus a joué")
    capture(page, f"jeu_refus_{suffixe}", err)
    tuile(page, a)  # désélectionne

    # Un calcul juste, puis Annuler
    a, b = page.evaluate(PAIRE_VALIDE_JS)
    tuile(page, a)
    page.click(".c-op[data-op='+']")
    tuile(page, b)
    page.wait_for_selector(".c-etapes li")
    verifier(page.locator(".c-tuile").count() == 4, f"{suffixe} : le résultat n'est pas devenu une tuile")
    verifier(page.locator(".c-tuile.c-resultat").count() == 1, f"{suffixe} : la nouvelle tuile n'est pas marquée")
    capture(page, f"jeu_calcul_{suffixe}", err)
    page.click("[data-a='annuler']")
    verifier(page.locator(".c-tuile").count() == 5 and page.locator(".c-etapes li").count() == 0, f"{suffixe} : Annuler ne rend pas les deux nombres")

    # Indice : annoncé avec son coût, puis pris
    page.click("[data-a='indice']")
    page.wait_for_selector(".voile .c-feuille")
    question = page.inner_text(".voile .c-feuille")
    verifier(MASCOTTES[enfant] in question and "3" in question, f"{suffixe} : l'indice n'annonce pas son coût ({question})")
    capture(page, f"indice_question_{suffixe}", err)
    page.click("[data-f='oui']")
    page.wait_for_selector(".c-retour .etiq")
    verifier(page.evaluate("window.CibleJeu.partie().indices") == 1, f"{suffixe} : l'indice n'est pas compté")
    verifier(page.locator(".c-tuile.c-montree").count() == 2, f"{suffixe} : l'indice ne montre pas deux nombres")
    capture(page, f"indice_{suffixe}", err)

    # Atteindre la cible
    jouer_chemin(page, page.evaluate(CHEMIN_JS))
    page.wait_for_selector(".c-tuile.c-gagne")
    capture(page, f"jeu_gagne_{suffixe}", err)
    page.wait_for_selector(".c-fin", timeout=5000)
    page.wait_for_timeout(1000)
    etat = page.evaluate(f"JSON.parse(localStorage.getItem('{enfant}.cible'))")
    verifier(etat and etat.get("gagnees") == 1 and len(etat.get("jours", [])) == 1, f"{suffixe} : partie gagnée non sauvée ({etat})")
    verifier(etat and etat.get("resume", {}).get("progres", {}).get("phrase", {}).get("en") == "1 target hit", f"{suffixe} : résumé de fin non publié")
    bulle = page.inner_text(".c-defi .bulle.parle")
    tirage = page.evaluate("window.CibleJeu.tirage()")
    score = etat["dernieres"][-1]["score"] if etat else 0
    if score < tirage["meilleur"]:
        verifier(f"{MASCOTTES[enfant]} found a path worth {tirage['meilleur']} points" in bulle, f"{suffixe} : défi absent ({bulle})")
        verifier(bulle in paroles(page), f"{suffixe} : le défi n'est pas dit")
        capture(page, f"fin_defi_{suffixe}", err)
        page.click("[data-a='montre']")
        page.wait_for_selector(".c-solution:not(.cache)")
        capture(page, f"fin_montre_{suffixe}", err)
    else:
        capture(page, f"fin_{suffixe}", err)

    # La même cible, au meilleur score
    page.click("[data-a='meme']")
    page.wait_for_selector(".c-jeu .c-tuile")
    verifier(page.evaluate("window.CibleJeu.partie().cible") == cible, f"{suffixe} : « Same target again » change de cible")
    jouer_chemin(page, page.evaluate("window.CibleJeu.tirage().solution"))
    page.wait_for_selector(".c-fin", timeout=5000)
    page.wait_for_timeout(300)
    verifier("best score possible" in page.inner_text(".c-defi .bulle.parle"), f"{suffixe} : le meilleur score n'est pas reconnu")
    if tirage["meilleur"] == 13:
        verifier(page.locator(".c-badge-parfait").count() == 1, f"{suffixe} : coup parfait sans badge")
    capture(page, f"fin_meilleur_{suffixe}", err)
    page.click("[data-a='nouvelle']")
    page.wait_for_selector(".c-accueil")
    verifier("2 targets hit" in page.inner_text(".c-accueil .indice"), f"{suffixe} : l'accueil ne compte pas les cibles atteintes")
    ctx.close()


def partie_chrono(navigateur, base, enfant, fmt):
    """Le chrono choisi : visible, fini sans punition, on continue ; puis l'arrêt en cours de partie."""
    ctx, page, err = contexte(navigateur, fmt)
    page.clock.install()
    page.goto(f"{base}/{enfant}/cible.html")
    page.wait_for_selector(".c-accueil")
    page.click(".c-chrono-choix[data-min='3']")
    capture(page, f"accueil_chrono_{enfant}_{fmt}", err)
    page.click("[data-a='go']")
    page.wait_for_selector(".c-jeu .c-chrono")
    verifier(page.inner_text(".c-chrono").strip().endswith("3:00"), f"chrono {enfant} {fmt} : ne part pas de 3:00 ({page.inner_text('.c-chrono')})")
    a, b = page.evaluate(PAIRE_VALIDE_JS)
    tuile(page, a)
    page.click(".c-op[data-op='+']")
    tuile(page, b)
    page.clock.fast_forward("01:10")
    page.wait_for_timeout(300)
    capture(page, f"chrono_{enfant}_{fmt}", err)
    page.clock.fast_forward("02:00")
    page.wait_for_selector(".voile .c-feuille")
    verifier("Time's up" in page.inner_text(".voile"), f"chrono {enfant} {fmt} : pas de fin du temps")
    capture(page, f"chrono_fini_{enfant}_{fmt}", err)
    page.click("[data-f='continuer']")
    page.wait_for_timeout(200)
    verifier(page.locator(".c-chrono").count() == 0 and page.locator(".c-etapes li").count() == 1, f"chrono {enfant} {fmt} : la partie ne continue pas")
    page.click("[data-a='retour']")
    page.wait_for_selector(".voile .c-feuille")
    capture(page, f"arret_{enfant}_{fmt}", err)
    page.click("[data-f='oui']")
    page.wait_for_selector(".c-accueil")
    verifier(page.locator(".c-chrono-choix[aria-pressed='true'][data-min='0']").count() == 1, f"chrono {enfant} {fmt} : le chrono reste choisi par défaut")
    capture(page, f"accueil_retour_{enfant}_{fmt}", err)
    ctx.close()


def main():
    CAPTURES.mkdir(exist_ok=True)
    serveur, base = servir()
    with sync_playwright() as p:
        navigateur = p.chromium.launch(channel="chrome")
        for enfant in ("henri", "clara"):
            for fmt in FORMATS:
                partie_complete(navigateur, base, enfant, fmt)
                partie_chrono(navigateur, base, enfant, fmt)
        partie_complete(navigateur, base, "henri", "ipad-paysage", "dark")
        navigateur.close()
    serveur.shutdown()
    if PROBLEMES:
        print("\n".join(PROBLEMES))
        sys.exit(1)
    print(f"parcours du nombre cible : ok, captures dans {CAPTURES.relative_to(RACINE)}")


if __name__ == "__main__":
    main()
