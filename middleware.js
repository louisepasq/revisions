import { next } from '@vercel/edge';
import { COOKIE, UN_AN, ENFANTS, normaliser, empreinteCode, jetonRole, roleDuCookie, enfantDuChemin, autorise } from './lib/acces.mjs';

// Rien n'est servi (pages, voix, API) sans un code. Le code parent vit dans la variable CODE_PARENT
// du projet Vercel ; le code de chaque enfant, choisi par lui sur la page parents, est rangé en empreinte
// dans la base (code:henri, code:clara). Détail : docs/ARCHITECTURE.md, section « Accès ».
export const config = {
  matcher: '/((?!_vercel/|favicon.ico).*)',
};

const ESSAIS_MAX = 20; // par adresse IP et par quart d'heure

function base() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const jeton = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !jeton) return null;
  return async (...commande) => {
    const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${jeton}` }, body: JSON.stringify(commande) });
    if (!r.ok) throw new Error('base ' + r.status);
    return (await r.json()).result;
  };
}

export default async function middleware(request) {
  const codeParent = process.env.CODE_PARENT;
  if (!normaliser(codeParent)) return new Response('Site en cours de configuration.', { status: 503 });
  const url = new URL(request.url);
  const role = await roleDuCookie(codeParent, request.headers.get('cookie'));

  if (url.pathname === '/sortir') {
    return new Response(null, { status: 303, headers: { Location: '/', 'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax` } });
  }
  if (role && autorise(role, url.pathname, url.search)) return next();
  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ erreur: role ? 'accès réservé' : 'code requis' }), { status: role ? 403 : 401, headers: { 'Content-Type': 'application/json' } });
  }

  const suite = url.searchParams.get('suite') || url.pathname + url.search;
  const cheminSuite = new URL(suite, url.origin).pathname;
  const enfant = enfantDuChemin(cheminSuite, '');
  if (request.method === 'POST') {
    const db = base();
    const ip = (request.headers.get('x-forwarded-for') || 'inconnue').split(',')[0].trim();
    if (db) {
      const cle = `essais:${ip}:${Math.floor(Date.now() / 900000)}`;
      const n = await db('INCR', cle).catch(() => 0);
      if (n === 1) db('EXPIRE', cle, 960).catch(() => {});
      if (n > ESSAIS_MAX) return page(suite, enfant, 'trop');
    }
    let saisi = '';
    try { saisi = (await request.formData()).get('code'); } catch (e) { saisi = ''; }
    let nouveau = null;
    if (normaliser(saisi) && normaliser(saisi) === normaliser(codeParent)) nouveau = 'parent';
    else if (enfant && ENFANTS.includes(enfant) && db && normaliser(saisi)) {
      const attendu = await db('GET', `code:${enfant}`).catch(() => null);
      if (attendu && attendu === await empreinteCode(codeParent, enfant, saisi)) nouveau = enfant;
    }
    if (nouveau && autorise(nouveau, cheminSuite, '')) {
      const cible = suite.startsWith('/') && !suite.startsWith('//') ? suite : '/';
      return new Response(null, {
        status: 303,
        headers: {
          Location: cible,
          'Set-Cookie': `${COOKIE}=${nouveau}.${await jetonRole(codeParent, nouveau)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${UN_AN}`,
        },
      });
    }
    return page(suite, enfant, 'faux');
  }
  return page(suite, enfant, role ? 'ailleurs' : null);
}

const PRENOMS = { henri: 'Henri', clara: 'Clara' };

function page(suite, enfant, probleme) {
  const titre = enfant && PRENOMS[enfant] ? `L'app de ${PRENOMS[enfant]}` : 'Nos révisions';
  const consigne = enfant && PRENOMS[enfant] ? `Ton code secret, ${PRENOMS[enfant]}.` : 'Le code parent.';
  const messages = {
    faux: "Ce n'est pas le bon code. Réessaie, ou demande à un parent.",
    trop: 'Trop d\'essais. Attends un quart d\'heure, ou demande à un parent.',
    ailleurs: 'Cette page demande un autre code.',
  };
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>${titre}</title>
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
  <script>document.documentElement.dataset.enfant = ${JSON.stringify(enfant || '')};</script>
  <form method="POST" action="?suite=${encodeURIComponent(suite)}">
    <h1>${titre}</h1>
    <p>${consigne} Une seule fois sur cet appareil.</p>
    <input name="code" type="password" autocomplete="current-password" autocapitalize="none" spellcheck="false" aria-label="Code secret" required autofocus>
    <button type="submit">Entrer</button>
    ${probleme ? `<p class="erreur">${messages[probleme]}</p>` : ''}
  </form>
</body>
</html>`;
  return new Response(html, { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}
