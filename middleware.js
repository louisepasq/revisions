import { next } from '@vercel/edge';
import { COOKIE, normaliser, roleDuCookie, enfantDuChemin, autorise } from './lib/acces.js';

// Rien n'est servi (pages, voix, API) sans un code. Le middleware ne fait que vérifier le cookie et montrer
// la page de code ; la saisie du code est vérifiée par api/entrer.js. Code parent : variable CODE_PARENT du
// projet Vercel ; codes des enfants : empreintes dans la base. Détail : docs/ARCHITECTURE.md, « Accès ».
// Les icônes et le manifeste de l'écran d'accueil passent sans code : l'iPad les demande au moment
// d'« Ajouter à l'écran d'accueil » sans envoyer le cookie (le manifeste se charge sans identifiants,
// c'est la norme), et sans eux il pose une lettre (02/11/2026 : Clara avait un « C » au lieu de Pooh Bear).
// Ils ne montrent que la mascotte, les couleurs et le prénom déjà présent dans l'adresse.
export const config = {
  matcher: '/((?!_vercel/|favicon.ico|henri/icone-|clara/icone-|henri/manifest.webmanifest|clara/manifest.webmanifest).*)',
};

export default async function middleware(request) {
  const codeParent = process.env.CODE_PARENT;
  if (!normaliser(codeParent)) return new Response('Site en cours de configuration.', { status: 503 });
  const url = new URL(request.url);
  if (url.pathname === '/api/entrer') return next();
  if (url.pathname === '/sortir') {
    return new Response(null, { status: 303, headers: { Location: '/', 'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax` } });
  }
  const role = await roleDuCookie(codeParent, request.headers.get('cookie'));
  if (role && autorise(role, url.pathname, url.search)) return next();
  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ erreur: role ? 'accès réservé' : 'code requis' }), { status: role ? 403 : 401, headers: { 'Content-Type': 'application/json' } });
  }
  const suite = url.searchParams.get('suite') || url.pathname + url.search;
  const enfant = enfantDuChemin(new URL(suite, url.origin).pathname, '');
  const erreur = url.searchParams.get('erreur') || (role ? 'ailleurs' : null);
  return page(suite, enfant, erreur);
}

const PRENOMS = { henri: 'Henri', clara: 'Clara' };
/* La page d'un enfant est en anglais britannique, comme tout le cadre de son app (D-21) ; celle du
   code parent reste en français, comme le coin parent. */
const MESSAGES = {
  fr: {
    faux: "Ce n'est pas le bon code. Réessaie, ou demande à un parent.",
    trop: "Trop d'essais. Attends un quart d'heure, ou demande à un parent.",
    ailleurs: 'Cette page demande un autre code.',
  },
  en: {
    faux: "That's not the right code. Try again, or ask a grown-up.",
    trop: 'Too many tries. Wait a quarter of an hour, or ask a grown-up.',
    ailleurs: 'This page needs another code.',
  },
};

function page(suite, enfant, erreur) {
  const prenom = PRENOMS[enfant];
  const langue = prenom ? 'en' : 'fr';
  const titre = prenom ? `${prenom}'s app` : 'Nos révisions';
  const consigne = prenom ? `Your secret code, ${prenom}. Only once on this device.` : 'Le code parent. Une seule fois sur cet appareil.';
  const message = MESSAGES[langue][erreur];
  const html = `<!doctype html>
<html lang="${langue}" data-enfant="${prenom ? enfant : ''}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>${titre}</title>${prenom ? `
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="${prenom}">
<link rel="apple-touch-icon" href="/${enfant}/icone-180.png?v=2">
<link rel="manifest" href="/${enfant}/manifest.webmanifest?v=2">` : ''}
<style>
  :root { --fond:#FFF8EF; --carte:#fff; --encre:#1E2147; --douce:#545878; --trait:#EADFCB; --acc:#1668D6; --relief:#0D4A9E; }
  :root[data-enfant="clara"] { --acc:#7B34D1; --relief:#5320A0; }
  @media (prefers-color-scheme: dark) { :root { --fond:#14172B; --carte:#1E2240; --encre:#F2F2F8; --douce:#B9BCD6; --trait:#33385E; } }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px;
    background:var(--fond); color:var(--encre); font:18px/1.45 system-ui, -apple-system, sans-serif; }
  form { width:100%; max-width:420px; background:var(--carte); border:2px solid var(--trait); border-radius:28px; padding:32px 28px;
    display:flex; flex-direction:column; gap:16px; }
  h1 { margin:0; font-size:30px; line-height:1.1; }
  p { margin:0; color:var(--douce); }
  input { font:inherit; font-size:24px; letter-spacing:.08em; text-align:center; padding:14px; min-height:60px;
    border-radius:16px; border:3px solid var(--trait); background:var(--fond); color:var(--encre); width:100%; }
  input:focus { outline:none; border-color:var(--acc); }
  button { font:inherit; font-weight:700; font-size:22px; min-height:64px; border:0; border-radius:18px; color:#fff;
    background:var(--acc); box-shadow:0 5px 0 var(--relief); }
  button:active { transform:translateY(4px); box-shadow:0 1px 0 var(--relief); }
  .erreur { color:#8A5A00; background:#FFF1C9; border-radius:12px; padding:10px 14px; }
</style>
</head>
<body>
  <form method="POST" action="/api/entrer?suite=${encodeURIComponent(suite)}">
    <h1>${titre}</h1>
    <p>${consigne}</p>
    <input name="code" type="password" autocomplete="current-password" autocapitalize="none" spellcheck="false" aria-label="${prenom ? 'Secret code' : 'Code parent'}" required autofocus>
    <button type="submit">${prenom ? 'Go' : 'Entrer'}</button>
    ${message ? `<p class="erreur">${message}</p>` : ''}
  </form>
</body>
</html>`;
  return new Response(html, { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}
