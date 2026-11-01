# /// script
# dependencies = ["playwright"]
# ///
"""Essai de bout en bout contre le site local : lancer les configurations « faux-upstash » puis
« nos-revisions » de .claude/launch.json (code parent d'essai : parent-essai-local), puis
uv run outils/essais/parcours_voix.py. Mode d'emploi : docs/CONTRIBUER.md."""
import json
from playwright.sync_api import sync_playwright
B = "http://localhost:3170"
with sync_playwright() as p:
    nav = p.chromium.launch(channel="chrome", args=["--autoplay-policy=no-user-gesture-required"])
    ctx = nav.new_context(viewport={"width": 1080, "height": 810})
    ctx.add_init_script("""window.__clips=0;const o=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...a){window.__clips++;return o.apply(this,a)};
    window.__synth=0; if(window.speechSynthesis){window.speechSynthesis.speak=()=>{window.__synth++}}""")
    pg = ctx.new_page()
    pg.goto(B + "/henri/tables.html"); pg.fill("input[name=code]", "parent-essai-local"); pg.click("button[type=submit]"); pg.wait_for_load_state("networkidle")
    pg.wait_for_timeout(1500)
    boutons = pg.locator("button").all_inner_texts()
    print("boutons :", [b.strip()[:30] for b in boutons][:8])
    for libelle in ["Let's go", "Today's practice", "C'est parti", "Entraînement du jour"]:
        b = pg.get_by_text(libelle, exact=False)
        if b.count():
            b.first.click(); pg.wait_for_timeout(2500)
            if pg.locator(".exo").count(): break
    pg.wait_for_timeout(3000)
    print("clips Sulafat joués :", pg.evaluate("window.__clips"), "| voix de l'appareil :", pg.evaluate("window.__synth"))
    nav.close()
