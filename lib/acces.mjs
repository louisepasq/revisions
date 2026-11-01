// Règles d'accès du site, sans dépendance : utilisées par middleware.js et testées par test/acces.test.mjs.
// Trois rôles : « parent » (tout), « henri » et « clara » (leur app seulement).

export const ENFANTS = ['henri', 'clara'];
export const COOKIE = 'revisions_acces';
export const UN_AN = 60 * 60 * 24 * 365;

export async function sha256(texte) {
  const octets = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texte));
  return [...new Uint8Array(octets)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/* Les codes se comparent sans tenir compte des majuscules, des espaces ni de la ponctuation. */
export function normaliser(code) {
  return (code || '').toString().normalize('NFKD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/* Empreinte rangée dans la base pour le code d'un enfant (salée par le code parent). */
export function empreinteCode(codeParent, enfant, code) {
  return sha256(`code|${normaliser(codeParent)}|${enfant}|${normaliser(code)}`);
}

/* Jeton du cookie d'un rôle : impossible à fabriquer sans le code parent. */
export function jetonRole(codeParent, role) {
  return sha256(`acces|${normaliser(codeParent)}|${role}`);
}

export async function roleDuCookie(codeParent, cookies) {
  const valeur = (cookies || '').split(';').map(c => c.trim()).find(c => c.startsWith(COOKIE + '='));
  if (!valeur) return null;
  const [role, jeton] = valeur.slice(COOKIE.length + 1).split('.');
  if (!['parent', ...ENFANTS].includes(role) || !jeton) return null;
  return jeton === await jetonRole(codeParent, role) ? role : null;
}

/* L'enfant dont la page est demandée, ou null pour une page commune. */
export function enfantDuChemin(chemin, recherche) {
  const m = /^\/(henri|clara)(\/|$)/.exec(chemin);
  if (m) return m[1];
  if (chemin.startsWith('/api/progression')) {
    const e = new URLSearchParams(recherche || '').get('enfant');
    return ENFANTS.includes(e) ? e : 'inconnu';
  }
  return null;
}

/* Ce qu'un rôle a le droit d'ouvrir. Les ressources communes (kit, modules, voix) servent aux deux enfants. */
export function autorise(role, chemin, recherche) {
  if (role === 'parent') return true;
  if (!ENFANTS.includes(role)) return false;
  if (chemin === '/' || chemin.startsWith('/parents') || chemin.startsWith('/api/codes') || chemin.startsWith('/docs')) return false;
  const e = enfantDuChemin(chemin, recherche);
  return e === null || e === role;
}
