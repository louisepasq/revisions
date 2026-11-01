/* Déroulé d'une séance d'entraînement, indépendant de l'affichage.
   Dépend de moteur.js (window.Tables). */
(function (racine) {
  'use strict';
  const T = racine.Tables;
  const RANG_COULEUR = { gris: 0, bronze: 1, argent: 2, or: 3 };
  const RETOUR_APRES = 3;

  /* options.multiple : la formulation des questions « multiple », « un multiple de » (Eduscol,
     CM2) ou « dans la table de » (relecture du 01/11/2026, point 11). */
  function creer(etat, maintenant, taille, options) {
    const questions = T.seance(etat, maintenant, taille);
    const multiple = (options && options.multiple) || 'un multiple de';
    return { questions, index: 0, aRetaper: null, justes: 0, reponses: 0, montees: [], revues: new Set(), multiple };
  }

  function courante(s) {
    return s.questions[s.index] || null;
  }

  /* Une décomposition juste est créditée au résultat que l'enfant a donné (point 5) :
     « 4 × 6 » pour « ? × ? = 24 » fait monter 4 × 6, pas 3 × 8. */
  function faitCredite(q, saisie, juste) {
    if (q.type === 'decomposition' && juste) return { a: saisie[0], b: saisie[1] };
    return { a: q.a, b: q.b };
  }

  function repondre(s, etat, saisie, ms, maintenant) {
    const q = courante(s);
    const juste = T.verifier(q, saisie);
    const f = faitCredite(q, saisie, juste);
    const avant = T.couleur(etat, f.a, f.b);
    const premiereFois = !s.revues.has(T.cle(q.a, q.b) + q.type);
    s.revues.add(T.cle(q.a, q.b) + q.type);
    s.reponses++;
    if (premiereFois) T.enregistrer(etat, f.a, f.b, juste, ms, maintenant);
    if (juste) {
      s.justes++;
      const apres = T.couleur(etat, f.a, f.b);
      if (RANG_COULEUR[apres] > RANG_COULEUR[avant]) s.montees.push({ a: f.a, b: f.b, couleur: apres });
      return { juste: true, rapide: ms != null && ms <= T.RAPIDE_MS };
    }
    s.aRetaper = q;
    const retour = Object.assign({}, q, { retour: true });
    s.questions.splice(Math.min(s.index + 1 + RETOUR_APRES, s.questions.length), 0, retour);
    return { juste: false, bonne: q.a * q.b, operation: `${q.a} × ${q.b}`, astuce: T.astuce(q.a, q.b, etat), correction: correction(q, s.multiple) };
  }

  function correction(q, multiple) {
    const p = q.a * q.b;
    if (q.type === 'multiple') {
      return q.reponse
        ? { reponse: 'Oui', phrase: `Oui : ${q.a} × ${q.b} = ${p}.` }
        : { reponse: 'Non', phrase: `Non : ${q.nombre} n'est pas ${multiple || 'un multiple de'} ${q.a}. ${q.a} × ${q.b} = ${p}.` };
    }
    if (q.type === 'manquant') return { reponse: String(q.b), phrase: `${q.a} × ${q.b} = ${p} : le nombre caché, c'est ${q.b}.` };
    if (q.type === 'decomposition') return { reponse: `${q.a} × ${q.b}`, phrase: `Par exemple : ${q.a} × ${q.b} = ${p}.` };
    return { reponse: String(p), phrase: `${q.a} × ${q.b} = ${p}.` };
  }

  function avancement(s) {
    const total = s.questions.filter(x => !x.retour).length;
    const faites = s.questions.slice(0, s.index + 1).filter(x => !x.retour).length;
    return { n: Math.max(1, Math.min(faites, total)), total };
  }

  function retaper(s, saisie) {
    const q = s.aRetaper;
    if (!q) return true;
    const ok = Number(saisie) === q.a * q.b;
    if (ok) s.aRetaper = null;
    return ok;
  }

  function suivante(s) {
    if (s.aRetaper) return courante(s);
    s.index++;
    return courante(s);
  }

  function finie(s) {
    return s.index >= s.questions.length;
  }

  function bilan(s, etat, maintenant) {
    etat.familles = T.majFamilles(etat);
    const demainIso = T.jour(new Date(new Date(maintenant).getTime() + 86400000));
    const dusDemain = Object.keys(etat.faits)
      .filter(k => etat.faits[k].prochain === demainIso)
      .sort((x, y) => etat.faits[x].boite - etat.faits[y].boite);
    const demain = dusDemain.length ? dusDemain[0].replace('x', ' × ') : null;
    return {
      justes: s.justes,
      reponses: s.reponses,
      montees: s.montees,
      demain,
      semaine: T.joursDeLaSemaine(etat, maintenant),
      or: T.compteOr(etat),
    };
  }

  racine.Seance = { creer, courante, repondre, retaper, suivante, finie, bilan, avancement, correction };
})(typeof window !== 'undefined' ? window : globalThis);
