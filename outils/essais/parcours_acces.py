# /// script
# dependencies = ["playwright"]
# ///
"""Essai de bout en bout contre le site local : lancer les configurations « faux-upstash » puis
« nos-revisions » de .claude/launch.json (code parent d'essai : parent-essai-local), puis
uv run outils/essais/parcours_acces.py. Mode d'emploi : docs/CONTRIBUER.md."""
import json, sys
from playwright.sync_api import sync_playwright
B = "http://localhost:3170"
ok = lambda c, m: print(("OK  " if c else "ÉCHEC ") + m)
with sync_playwright() as p:
    nav = p.chromium.launch(channel="chrome")
    # Parent
    par = nav.new_context(); pg = par.new_page()
    r = pg.goto(B + "/henri/"); ok(r.status == 401 and "Your secret code, Henri" in pg.content(), "sans code : page de code d'Henri (401)")
    pg.fill("input[name=code]", "mauvais"); pg.click("button[type=submit]"); ok("not the right code" in pg.content(), "mauvais code refusé")
    pg.fill("input[name=code]", "parent-essai-local"); pg.click("button[type=submit]"); pg.wait_for_load_state()
    ok(pg.url.endswith("/henri/") and "Henri" in pg.title(), "code parent : app d'Henri ouverte")
    r = pg.request.get(B + "/api/codes"); ok(r.status == 200, f"parent : GET /api/codes {r.status} {r.text()}")
    r = pg.request.post(B + "/api/codes", data=json.dumps({"enfant": "henri", "code": "moussi-essai"}), headers={"Content-Type": "application/json"})
    ok(r.status == 200, f"parent : code d'Henri choisi ({r.status})")
    r = pg.request.post(B + "/api/codes", data=json.dumps({"enfant": "clara", "code": "abc"}), headers={"Content-Type": "application/json"})
    ok(r.status == 400, "code trop court refusé")
    # Henri
    h = nav.new_context(); ph = h.new_page()
    ph.goto(B + "/henri/tables.html"); ph.fill("input[name=code]", "MOUSSI ESSAI"); ph.click("button[type=submit]"); ph.wait_for_load_state()
    ok(ph.url.endswith("/henri/tables.html"), "code d'Henri : retour sur la page demandée")
    etat = {"version": 1, "familles": 2, "faits": {"7x8": {"boite": 3, "vu": True, "prochain": "2026-11-05", "justesJours": ["2026-11-01"]}}, "jours": ["2026-11-01"]}
    r = ph.request.put(B + "/api/progression?enfant=henri&module=tables", data=json.dumps(etat), headers={"Content-Type": "application/json"})
    ok(r.status == 200 and r.json().get("familles") == 2, f"Henri : sauvegarde en ligne ({r.status})")
    r = ph.request.get(B + "/api/progression?enfant=henri&module=tables"); ok(r.json().get("faits", {}).get("7x8", {}).get("boite") == 3, "Henri : relecture de la sauvegarde")
    r = ph.request.get(B + "/api/progression?enfant=clara&module=tables"); ok(r.status == 403, f"Henri : progression de Clara refusée ({r.status})")
    r = ph.goto(B + "/clara/"); ok(r.status == 401, "Henri : app de Clara refusée")
    r = ph.request.get(B + "/api/codes"); ok(r.status == 403, f"Henri : page des codes refusée ({r.status})")
    r = ph.goto(B + "/commun/voix/index.json"); ok(r.status == 200, "Henri : voix accessibles")
    r = ph.goto(B + "/"); ok(r.status == 401, "Henri : page des parents refusée")
    # Nettoyage des données d'essai
    r = pg.request.delete(B + "/api/progression?enfant=henri&module=tables"); ok(r.status == 200, "nettoyage : progression d'essai effacée")
    nav.close()
