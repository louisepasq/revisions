/* Portail d'un enfant : mascotte, semaine, modules, coin parent (appui long).
   Les modules se déclarent sur <main id="portail" data-modules="planisphere,tables,dictee">. */
(function () {
  'use strict';
  const KR = window.KR;
  const T = window.Tables;
  const t = KR.t;
  const enfant = KR.enfant();
  const main = document.getElementById('portail');
  const modules = (main.dataset.modules || '').split(',').filter(Boolean);

  KR.demarrer();

  function carte(nom) {
    if (nom === 'planisphere') {
      return `<a class="module" href="planisphere.html">
        <div class="tuile">${KR.icone('globe')}</div>
        <div class="module-texte"><b>${t('module_planisphere')}</b><span class="sous">${t('module_planisphere_sous')}</span></div>
        <div class="bas"><span class="pastille theme">${t('planisphere_theme')}</span></div></a>`;
    }
    if (nom === 'tables') {
      const or = T.compteOr(T.charger(enfant));
      return `<a class="module" href="tables.html">
        <div class="tuile">${KR.icone('grille')}</div>
        <div class="module-texte"><b>${t('module_tables')}</b><span class="sous">${t('module_tables_sous')}</span></div>
        <div class="bas"><div class="mini-piste"><i style="width:${(or / 36 * 100).toFixed(1)}%"></i></div>
          <div class="progres">${KR.icone('etoile')}${t('tables_par_coeur', { n: or, total: 36 })}</div></div></a>`;
    }
    if (nom === 'dictee') {
      return `<div class="module bientot" aria-disabled="true">
        <div class="tuile bientot">${KR.icone('crayon')}</div>
        <div class="module-texte"><b>${t('module_dictee')}</b><span class="sous">${t('module_dictee_sous')}</span></div>
        <div class="bas"><span class="pastille bientot">${t('bientot')}</span></div></div>`;
    }
    return '';
  }

  function rendre() {
    const etat = T.charger(enfant);
    const jours = T.joursDeLaSemaine(etat, new Date());
    const fini = jours.some(j => j.aujourdhui && j.fait);
    document.title = KR.prenom();
    main.innerHTML = `
      <header class="heros">
        <button type="button" class="coin-parent" id="coin-parent" aria-label="${KR.echapper(tp('coin_parent') + ', ' + tp('parent_aide'))}">${KR.icone('cadenas')}<span>${tp('coin_parent')}</span></button>
        <div class="heros-masc">
          <div class="bulle parle bas">${KR.echapper(t(fini ? 'repos_bulle' : 'attente_bulle'))}</div>
          ${KR.mascotte(fini ? 'repos' : 'attend')}
        </div>
        <div class="heros-texte">
          <h1>${KR.echapper(t('portail_titre', { prenom: KR.prenom() }))}</h1>
          <div class="carte-semaine">
            <div class="t"><b>${t('ma_semaine')}</b><span>${KR.joursFaits(jours)}</span></div>
            ${KR.semaine(jours)}
          </div>
        </div>
      </header>
      <nav class="modules">${modules.map(carte).join('')}</nav>`;
    KR.appuiLong(document.getElementById('coin-parent'), ouvrirCoinParent);
  }

  /* ---------- Coin parent : toujours en français, quelle que soit la langue de l'enfant ---------- */
  const tp = (cle, valeurs) => t(cle, valeurs, 'fr');
  const liste8 = l => l.slice(0, 8).join(', ') + (l.length > 8 ? ` et ${l.length - 8} autre${l.length > 9 ? 's' : ''}` : '');
  function resume(etat) {
    const vus = Object.keys(etat.faits).filter(k => etat.faits[k].vu);
    if (!vus.length) return `<p>${tp('parent_pas_commence')}</p>`;
    // Paires de 2 à 9 seulement, ratées en séance ou au diagnostic, puis justes mais lentes.
    const { rates, lents } = T.fragiles(etat);
    const phrase = (l, un, plusieurs) => tp(l.length === 1 ? un : plusieurs, { n: l.length, liste: liste8(l) });
    return `<p>${tp('parent_auto', { n: T.compteOr(etat) })}</p>
      <p>${rates.length ? phrase(rates, 'parent_fragile_un', 'parent_fragiles') : tp('parent_aucun_fragile')}</p>
      ${lents.length ? `<p>${phrase(lents, 'parent_lent_un', 'parent_lents')}</p>` : ''}
      <p>${etat.jours.length === 1 ? tp('parent_jour_un') : tp('parent_jours', { n: etat.jours.length })}</p>`;
  }

  function segment(cle, options, valeur) {
    return '<div class="segment">' + options.map(([v, libelle]) =>
      `<button type="button" data-reglage="${cle}" data-valeur="${v}" aria-pressed="${String(v) === String(valeur)}">${libelle}</button>`).join('') + '</div>';
  }

  function etatSauvegarde() {
    if (!window.Sync) return 'Sauvegarde en ligne indisponible sur cette page.';
    const s = window.Sync.etat();
    if (s.derniereSauvegarde) {
      const h = new Date(s.derniereSauvegarde).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      return `Sauvegardé en ligne à ${h}. La progression suit l'enfant sur tous les appareils.`;
    }
    if (s.erreur) return `Pas encore sauvegardé en ligne (${KR.echapper(s.erreur)}). La progression reste sur cet appareil et repartira dès que possible.`;
    return 'Sauvegarde en ligne en cours…';
  }

  function ouvrirCoinParent() {
    fermerCoinParent();
    const r = KR.reglages();
    const voile = document.createElement('div');
    voile.className = 'voile';
    voile.lang = 'fr';
    voile.innerHTML = `<div class="feuille" role="dialog" aria-modal="true" aria-labelledby="cp-titre">
      <div class="feuille-tete"><h2 id="cp-titre">${tp('parent_titre')}</h2><button type="button" class="btn btn-calme" data-a="fermer">${tp('fermer')}</button></div>
      <section class="reglage"><h3>${tp('parent_tables')}</h3>${resume(T.charger(enfant))}</section>
      <section class="reglage"><h3>${tp('parent_langue')}</h3>${segment('langue', [['en', 'English'], ['fr', 'Français']], r.langue)}<p class="note">${tp('parent_langue_note')}</p></section>
      <section class="reglage">
        <div class="ligne-reglage"><span>${tp('parent_voix')}</span>${segment('voix', [[true, tp('active')], [false, tp('coupee')]], r.voix)}</div>
        <div class="ligne-reglage" style="margin-top:12px"><span>${tp('parent_sons')}</span>${segment('sons', [[true, tp('active')], [false, tp('coupee')]], r.sons)}</div>
      </section>
      <section class="reglage"><h3>${tp('parent_sauvegarde')}</h3>
        <p class="note">${etatSauvegarde()}</p>
        <div class="boutons">
          <button type="button" class="btn btn-secondaire" data-a="exporter">${KR.icone('sortir')}${tp('parent_export')}</button>
          <label class="btn btn-secondaire">${KR.icone('entrer')}${tp('parent_import')}<input type="file" class="lecteur" accept="application/json,.json" data-a="importer"></label>
        </div>
        <p class="note">${tp('parent_sauvegarde_note')}</p>
        <p class="message" aria-live="polite"></p>
      </section>
      <section class="reglage">
        <div class="boutons" data-zone="raz"><button type="button" class="btn btn-calme" data-a="raz">${tp('parent_raz')}</button></div>
        <div class="cache" data-zone="confirmer"><p>${KR.echapper(tp('parent_raz_question', { prenom: KR.prenom() }))}</p>
          <div class="boutons"><button type="button" class="btn btn-secondaire" data-a="annuler">${tp('annuler')}</button><button type="button" class="btn btn-primaire" data-a="raz-oui">${tp('parent_raz_oui')}</button></div></div>
      </section>
    </div>`;
    document.body.appendChild(voile);
    const message = voile.querySelector('.message');

    voile.addEventListener('click', e => {
      if (e.target === voile) return fermerCoinParent();
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.reglage) {
        let v = b.dataset.valeur;
        if (v === 'true' || v === 'false') v = v === 'true';
        KR.regler(b.dataset.reglage, v);
        if (b.dataset.reglage === 'langue') { rendre(); ouvrirCoinParent(); return; }
        b.parentNode.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        return;
      }
      const a = b.dataset.a;
      if (a === 'fermer') fermerCoinParent();
      else if (a === 'exporter') {
        const jour = window.Tables.jour(new Date());
        KR.telecharger(`${jour}_revisions-${enfant}.json`, KR.exporter());
      } else if (a === 'raz') {
        voile.querySelector('[data-zone="raz"]').classList.add('cache');
        voile.querySelector('[data-zone="confirmer"]').classList.remove('cache');
      } else if (a === 'annuler') {
        voile.querySelector('[data-zone="raz"]').classList.remove('cache');
        voile.querySelector('[data-zone="confirmer"]').classList.add('cache');
      } else if (a === 'raz-oui') {
        if (window.Sync) window.Sync.effacer(enfant, 'tables');
        KR.effacerTout();
        rendre();
        ouvrirCoinParent();
      }
    });
    voile.querySelector('input[type="file"]').addEventListener('change', e => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const lecteur = new FileReader();
      lecteur.onload = () => {
        const ok = KR.importer(String(lecteur.result));
        if (ok) { rendre(); ouvrirCoinParent(); document.querySelector('.voile .message').textContent = tp('parent_import_ok'); }
        else message.textContent = tp('parent_import_ko', { prenom: KR.prenom() });
      };
      lecteur.readAsText(f);
    });
    voile.querySelector('[data-a="fermer"]').focus();
  }

  function fermerCoinParent() {
    const v = document.querySelector('.voile');
    if (v) v.remove();
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fermerCoinParent(); });

  rendre();
})();
