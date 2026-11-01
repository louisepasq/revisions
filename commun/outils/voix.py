# /// script
# requires-python = ">=3.10"
# dependencies = ["requests"]
# ///
"""Voix des apps, fabriquées d'avance par Gemini TTS (même modèle que les films Avest), en MP3.

Usage :
  uv run commun/outils/voix.py echantillons     voix candidates, dans docs/voix/
  uv run commun/outils/voix.py tables           toutes les phrases des apps, dans commun/voix/ (un clip trop long est refait)
  uv run commun/outils/voix.py controler        retire les clips trop longs (consignes lues à voix haute), à refaire par « tables »

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


def dire(texte: str, voix: str, notes: str, dst: pathlib.Path, essais: int = 3, rythme: str = "", court: bool = False) -> None:
    # `court` : une consigne d'une ligne au lieu des notes, pour les textes où Gemini lit ses notes à voix haute.
    invite = f"Say warmly and clearly: {texte}" if court else f"### DIRECTOR'S NOTES\n{notes}\n#### TRANSCRIPT\n{texte}"
    corps = {"contents": [{"parts": [{"text": invite}]}],
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
                        "-af", f"{coupe},areverse,{coupe},areverse,{rythme + ',' if rythme else ''}loudnorm=I=-16:TP=-1.5",
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


# Le fait complet (« sept fois huit, cinquante-six ») sortait deux fois plus lent que la question
# (2,9 s contre 1,35 s en moyenne) ; Louis l'a trouvé « très ralenti » le 01/11/2026 : pause interne
# ramenée à 0,15 s et débit accéléré de 25 %, sans changer la hauteur de la voix.
RYTHME_FAIT = "silenceremove=stop_periods=-1:stop_duration=0.15:stop_threshold=-45dB,atempo=1.25"


def rythme_de(langue: str, texte: str) -> str:
    import re
    return RYTHME_FAIT if langue == "fr" and re.fullmatch(r"[a-zéè]+(?:[- ][a-zéè]+)* fois [a-zéè]+(?:[- ][a-zéè]+)*, [a-zéè -]+", texte) else ""


def reprises() -> dict:
    """Phrases refaites après un défaut ; leur numéro de prise entre dans le nom du fichier."""
    f = RACINE / "commun/voix/reprises.json"
    return json.loads(f.read_text()) if f.exists() else {}


def nom_fichier(langue: str, texte: str, prise: int | None = None) -> str:
    """Le nom dépend aussi de la voix, des consignes et du numéro de prise : un clip refait porte
    un autre nom, que le cache d'un an de l'appareil (vercel.json) ne peut pas confondre avec l'ancien."""
    import hashlib
    notes = NOTES_FR if langue == "fr" else NOTES_EN
    if prise is None:
        prise = reprises().get(f"{langue}|{texte}", 0)
    cle = f"{MODELE}|{VOIX[langue]}|{notes}|{langue}|{texte}" + (f"|{rythme_de(langue, texte)}" if rythme_de(langue, texte) else "")
    cle += f"|prise{prise}" if prise else ""
    return f"{langue}/{hashlib.sha1(cle.encode()).hexdigest()[:12]}.mp3"


# Gemini lit parfois ses consignes à voix haute (« A warm, patient primary school teacher… »),
# surtout sur un texte court : Henri l'a entendu le 01/11/2026. Un clip bien plus long que son
# texte ne le permet est donc refait (trois prises avec les notes, puis trois avec une consigne
# d'une ligne). Débits médians mesurés sur 1 700 clips : 0,076 s par
# caractère en français, 0,124 s en anglais ; les consignes lues ajoutent au moins 8 s.
DEBIT = {"fr": 0.076, "en": 0.124}


def duree(f: pathlib.Path) -> float:
    o = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)],
                       capture_output=True, text=True).stdout.strip()
    return float(o or 0)


def trop_long(langue: str, texte: str, secondes: float) -> bool:
    """Les chiffres se disent en mots (« 36 » fait « trente-six ») : chaque nombre compte pour 9 caractères."""
    import re
    longueur = len(re.sub(r"\d+", "x" * 9, texte)) + 6 * texte.count("=")
    return secondes > DEBIT[langue] * longueur * 1.4 + 4


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
        for n in range(6):
            dire(p["texte"], VOIX[p["langue"]], notes, dst, essais=5, rythme=rythme_de(p["langue"], p["texte"]), court=n >= 3)
            if not trop_long(p["langue"], p["texte"], duree(dst)):
                return
        dst.unlink()
        raise RuntimeError("six prises trop longues : consignes lues à voix haute ?")

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


def controler() -> None:
    """Repère les clips trop longs pour leur texte, les retire et note une nouvelle prise ;
    `voix.py tables` les refait ensuite sous un nouveau nom."""
    from concurrent.futures import ThreadPoolExecutor
    dossier = RACINE / "commun/voix"
    index = json.loads((dossier / "index.json").read_text())
    items = list(index.items())
    with ThreadPoolExecutor(max_workers=12) as pool:
        durees = list(pool.map(lambda kv: duree(dossier / kv[1]), items))
    rep = reprises()
    fautifs = []
    for (cle, f), d in zip(items, durees):
        langue, texte = cle.split("|", 1)
        if trop_long(langue, texte, d):
            fautifs.append((round(d, 1), cle))
            rep[cle] = rep.get(cle, 0) + 1
            (dossier / f).unlink(missing_ok=True)
    (dossier / "reprises.json").write_text(json.dumps(rep, ensure_ascii=False, indent=0, sort_keys=True))
    print(f"{len(fautifs)} clips trop longs retirés sur {len(items)} ; relancer `voix.py tables`")
    for d, cle in sorted(fautifs, reverse=True)[:15]:
        print(f" - {d} s  {cle}")


def rythmer() -> None:
    """Applique le rythme aux fichiers déjà fabriqués sous leur ancien nom, sans rappeler Gemini."""
    import hashlib
    dossier = RACINE / "commun/voix"
    index = json.loads((dossier / "index.json").read_text())
    n = 0
    for cle, ancien in list(index.items()):
        langue, texte = cle.split("|", 1)
        r = rythme_de(langue, texte)
        neuf = nom_fichier(langue, texte)
        if not r or neuf == ancien or not (dossier / ancien).exists():
            continue
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(dossier / ancien), "-ac", "1", "-af",
                        f"{r},loudnorm=I=-16:TP=-1.5", "-c:a", "libmp3lame", "-b:a", "48k", str(dossier / neuf)], check=True)
        (dossier / ancien).unlink()
        index[cle] = neuf
        n += 1
    (dossier / "index.json").write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")))
    print(f"{n} fichiers mis au rythme")


if __name__ == "__main__":
    {"echantillons": echantillons, "tables": tables, "controler": controler, "rythmer": rythmer}.get(sys.argv[1] if len(sys.argv) > 1 else "", lambda: print(__doc__))()
