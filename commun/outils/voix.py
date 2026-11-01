# /// script
# requires-python = ">=3.10"
# dependencies = ["requests"]
# ///
"""Voix des apps, fabriquées d'avance par Gemini TTS (même modèle que les films Avest), en MP3.

Usage :
  uv run commun/outils/voix.py echantillons     voix candidates, dans docs/voix/
  uv run commun/outils/voix.py tables           toutes les phrases du module des tables, dans commun/voix/

La clé GOOGLE_GEMINI_API_KEY vient de l'environnement, sinon de ~/.claude/shared/.env. Elle n'entre jamais dans le site.
"""
import base64
import json
import os
import pathlib
import subprocess
import sys
import tempfile
import time

import requests

RACINE = pathlib.Path(__file__).resolve().parents[2]
MODELE = "gemini-3.8-flash-tts"
SR = 24000

NOTES_FR = ("A warm, patient primary school teacher in France, speaking to a 9-year-old child. "
            "Clear articulation, unhurried, friendly and encouraging, never childish. Language: French from France.")
NOTES_EN = ("A small, friendly cartoon companion speaking to a 9-year-old child. Warm, gentle, cheerful, "
            "clear and slow enough for a young reader. Language: British English.")


def cle() -> str:
    if os.environ.get("GOOGLE_GEMINI_API_KEY"):
        return os.environ["GOOGLE_GEMINI_API_KEY"].strip()
    for ligne in (pathlib.Path.home() / ".claude/shared/.env").read_text().splitlines():
        if ligne.startswith("GOOGLE_GEMINI_API_KEY="):
            return ligne.split("=", 1)[1].strip().strip('"')
    raise SystemExit("GOOGLE_GEMINI_API_KEY absente")


def dire(texte: str, voix: str, notes: str, dst: pathlib.Path, essais: int = 3) -> None:
    corps = {"contents": [{"parts": [{"text": f"### DIRECTOR'S NOTES\n{notes}\n#### TRANSCRIPT\n{texte}"}]}],
             "generationConfig": {"responseModalities": ["AUDIO"],
                                  "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voix}}}}}
    for n in range(essais):
        try:
            rep = requests.post(f"https://generativelanguage.googleapis.com/v1beta/models/{MODELE}:generateContent",
                                params={"key": cle()}, json=corps, timeout=120)
            rep.raise_for_status()
            octets = base64.b64decode(rep.json()["candidates"][0]["content"]["parts"][0]["inlineData"]["data"])
            break
        except Exception:
            if n == essais - 1:
                raise
            time.sleep(4 * (n + 1))
    with tempfile.TemporaryDirectory() as tmp:
        src = pathlib.Path(tmp) / ("p.wav" if octets[:4] == b"RIFF" else "p.pcm")
        src.write_bytes(octets)
        entree = ["-i", str(src)] if src.suffix == ".wav" else ["-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", str(src)]
        coupe = "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.03"
        dst.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["ffmpeg", "-v", "error", "-y", *entree, "-ac", "1",
                        "-af", f"{coupe},areverse,{coupe},areverse,loudnorm=I=-16:TP=-1.5",
                        "-c:a", "libmp3lame", "-b:a", "48k", str(dst)], check=True)


NOMBRES = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix"]


def en_lettres(n: int) -> str:
    unites = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze",
              "treize", "quatorze", "quinze", "seize"]
    dizaines = {2: "vingt", 3: "trente", 4: "quarante", 5: "cinquante", 6: "soixante"}
    if n == 0:
        return "zéro"
    if n == 100:
        return "cent"
    if n <= 16:
        return unites[n]
    if n < 20:
        return "dix-" + unites[n - 10]
    d, u = divmod(n, 10)
    if d in (7, 9):
        base = "soixante" if d == 7 else "quatre-vingt"
        reste = 10 + u
        if d == 7 and u == 1:
            return "soixante et onze"
        return base + "-" + (unites[reste] if reste <= 16 else "dix-" + unites[reste - 10])
    if d == 8:
        return "quatre-vingts" if u == 0 else "quatre-vingt-" + unites[u]
    if u == 0:
        return dizaines[d]
    if u == 1:
        return dizaines[d] + " et un"
    return dizaines[d] + "-" + unites[u]


def echantillons() -> None:
    dossier = RACINE / "docs/voix"
    fr = "Neuf fois cinq ? ... Neuf fois cinq, quarante-cinq. Bravo !"
    en = "Nearly! Let's look again. ... Well done! Tomorrow, nine times seven comes back to see you."
    lignes = []
    for v in ["Aoede", "Leda", "Achird", "Algieba", "Sulafat"]:
        dire(fr, v, NOTES_FR, dossier / f"fr-{v}.mp3")
        lignes.append(("fr", v))
    for v in ["Puck", "Leda", "Sulafat", "Achird"]:
        dire(en, v, NOTES_EN, dossier / f"en-{v}.mp3")
        lignes.append(("en", v))
    (dossier / "echantillons.json").write_text(json.dumps(lignes, ensure_ascii=False))
    print("échantillons écrits dans", dossier)


VOIX = {"fr": "Sulafat", "en": "Sulafat"}  # choix de Louis du 01/11/2026, après écoute des échantillons


def nom_fichier(langue: str, texte: str) -> str:
    import hashlib
    return f"{langue}/{hashlib.sha1(f'{langue}|{texte}'.encode()).hexdigest()[:12]}.mp3"


def tables() -> None:
    from concurrent.futures import ThreadPoolExecutor, as_completed
    phrases = json.loads(subprocess.run(["node", str(RACINE / "commun/outils/phrases.js")],
                                        capture_output=True, text=True, check=True).stdout)
    dossier = RACINE / "commun/voix"
    index = {}
    a_faire = []
    for p in phrases:
        f = nom_fichier(p["langue"], p["texte"])
        index[f"{p['langue']}|{p['texte']}"] = f
        if not (dossier / f).exists():
            a_faire.append((p, dossier / f))
    print(f"{len(phrases)} phrases, {len(a_faire)} à fabriquer", flush=True)
    erreurs = []

    def une(p, dst):
        notes = NOTES_FR if p["langue"] == "fr" else NOTES_EN
        dire(p["texte"], VOIX[p["langue"]], notes, dst, essais=5)

    with ThreadPoolExecutor(max_workers=6) as pool:
        futurs = {pool.submit(une, p, dst): p for p, dst in a_faire}
        for i, fu in enumerate(as_completed(futurs), 1):
            try:
                fu.result()
            except Exception as e:
                erreurs.append((futurs[fu]["texte"], str(e)[:120]))
            if i % 50 == 0:
                print(f"{i}/{len(a_faire)}", flush=True)
    index = {k: v for k, v in index.items() if (dossier / v).exists()}
    (dossier / "index.json").write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")))
    print(f"index : {len(index)} phrases ; erreurs : {len(erreurs)}")
    for t, e in erreurs[:10]:
        print(" -", t, e)


if __name__ == "__main__":
    {"echantillons": echantillons, "tables": tables}.get(sys.argv[1] if len(sys.argv) > 1 else "", lambda: print(__doc__))()
