# /// script
# requires-python = ">=3.10"
# dependencies = ["playwright"]
# ///
"""Rendu des trois directions de l'accueil, aux trois formats, pour Henri et Clara.

Usage : uv run docs/design-system/archive/2026-11-01_accueil/capturer.py
Sert le dépôt en local, capture chaque écran (vue écran puis page entière) dans captures/,
puis la planche de chaque direction, et contrôle au rendu :
- aucun débordement horizontal de la page ;
- aucun texte marqué `.l1` (une ligne) coupé ou passé sur deux lignes ;
- aucune cible tactile (lien, bouton) de moins de 56 px.
"""
import functools
import http.server
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

ICI = Path(__file__).resolve().parent
RACINE = ICI.parents[3]
CAPTURES = ICI / "captures"
FORMATS = {"ipad-paysage": (1080, 810), "ipad-portrait": (810, 1080), "iphone": (402, 874)}
DIRECTIONS = {
    "1-programme-du-jour": [{}],
    "2-cahiers": [{}, {"page": "matiere", "m": "maths"}],
    "3-onglets": [{}, {"page": "matiere", "m": "maths"}],
}

CONTROLES_JS = """() => {
  const w = document.documentElement.clientWidth, pb = [];
  if (document.documentElement.scrollWidth > w + 1) pb.push('page plus large que l écran : ' + document.documentElement.scrollWidth);
  const nom = el => (el.className && typeof el.className === 'string' ? el.className.split(' ')[0] : el.tagName) + ' « ' + (el.textContent || '').trim().slice(0, 30) + ' »';
  const visible = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden'; };
  const dansUnDefileur = el => { for (let p = el.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll') return true; } return false; };
  document.querySelectorAll('.l1').forEach(el => {
    if (!visible(el)) return;
    if (el.scrollWidth > el.clientWidth + 1) pb.push('texte coupé : ' + nom(el));
    const r = el.getBoundingClientRect();
    if (!dansUnDefileur(el) && (r.right > w + 1 || r.left < -1)) pb.push('texte hors écran : ' + nom(el));
  });
  document.querySelectorAll('.deux-lignes-max').forEach(el => {
    const lh = parseFloat(getComputedStyle(el).lineHeight) || 24;
    if (visible(el) && el.getBoundingClientRect().height > lh * 2.3) pb.push('plus de deux lignes : ' + nom(el));
  });
  document.querySelectorAll('a[href], button').forEach(el => {
    if (!visible(el) || el.closest('.non-tactile')) return;
    const r = el.getBoundingClientRect();
    if (Math.min(r.width, r.height) < 55.5) pb.push('cible de ' + Math.round(r.width) + ' × ' + Math.round(r.height) + ' : ' + nom(el));
  });
  return pb.slice(0, 8);
}"""


class Silencieux(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def servir():
    gestion = functools.partial(Silencieux, directory=str(RACINE))
    serveur = http.server.ThreadingHTTPServer(("127.0.0.1", 0), gestion)
    threading.Thread(target=serveur.serve_forever, daemon=True).start()
    return serveur, f"http://127.0.0.1:{serveur.server_address[1]}"


def main():
    CAPTURES.mkdir(exist_ok=True)
    serveur, base = servir()
    problemes = []
    chemin = "/docs/design-system/archive/2026-11-01_accueil/"
    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel="chrome")
        for direction, pages in DIRECTIONS.items():
            if not (ICI / f"{direction}.html").exists():
                continue
            for fmt, (l, h) in FORMATS.items():
                ctx = nav.new_context(viewport={"width": l, "height": h}, device_scale_factor=1, has_touch=(fmt == "iphone"))
                page = ctx.new_page()
                erreurs = []
                page.on("pageerror", lambda e: erreurs.append("JS : " + str(e)))
                for enfant in ("henri", "clara"):
                    for quand in ("maintenant", "six-mois"):
                        for extra in pages:
                            if extra and quand == "maintenant":
                                continue
                            q = "&".join(f"{k}={v}" for k, v in {"vue": "ecran", "enfant": enfant, "quand": quand, **extra}.items())
                            nom = f"{direction}_{enfant}_{quand}_{fmt}" + (f"_{extra['page']}" if extra else "")
                            page.goto(f"{base}{chemin}{direction}.html?{q}")
                            page.evaluate("document.fonts.ready")
                            page.wait_for_timeout(250)
                            page.screenshot(path=str(CAPTURES / f"{nom}.png"))
                            page.screenshot(path=str(CAPTURES / f"{nom}_entier.png"), full_page=True)
                            for pb in page.evaluate(CONTROLES_JS):
                                problemes.append(f"{nom} : {pb}")
                            while erreurs:
                                problemes.append(f"{nom} : {erreurs.pop(0)}")
                ctx.close()
            ctx = nav.new_context(viewport={"width": 1290, "height": 900}, device_scale_factor=1)
            page = ctx.new_page()
            page.goto(f"{base}{chemin}{direction}.html")
            page.wait_for_timeout(1500)
            for f in page.frames:
                f.evaluate("document.fonts.ready")
            page.wait_for_timeout(500)
            page.screenshot(path=str(ICI / f"{direction}.png"), full_page=True)
            ctx.close()
        nav.close()
    serveur.shutdown()
    print("\n".join(problemes) if problemes else "Aucun problème relevé.")


if __name__ == "__main__":
    main()
