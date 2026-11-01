import { next } from '@vercel/edge';

// Rien n'est servi (pages, sons, données, API) sans le code familial. Le code vit dans la
// variable CODE_FAMILLE du projet Vercel, jamais dans le dépôt. Le cookie dérive du code :
// il reste valable d'un déploiement à l'autre, et il change si le code change.
export const config = {
  matcher: '/((?!_vercel/|favicon.ico).*)',
};

const COOKIE = 'revisions_acces';
const UN_AN = 60 * 60 * 24 * 365;

async function empreinte(texte) {
  const octets = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texte));
  return [...new Uint8Array(octets)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function normaliser(code) {
  return (code || '').toString().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export default async function middleware(request) {
  const code = normaliser(process.env.CODE_FAMILLE);
  if (!code) return new Response('Site en cours de configuration.', { status: 503 });
  const jeton = await empreinte('revisions-acces|' + code);
  const cookies = request.headers.get('cookie') || '';
  if (cookies.split(';').some(c => c.trim() === `${COOKIE}=${jeton}`)) return next();

  const url = new URL(request.url);
  const suite = url.searchParams.get('suite') || url.pathname + url.search;
  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ erreur: 'code familial requis' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  if (request.method === 'POST') {
    let saisi = '';
    try { saisi = (await request.formData()).get('code'); } catch (e) { saisi = ''; }
    if (normaliser(saisi) === code) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: suite.startsWith('/') && !suite.startsWith('//') ? suite : '/',
          'Set-Cookie': `${COOKIE}=${jeton}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${UN_AN}`,
        },
      });
    }
    return page(suite, true);
  }
  return page(suite, false);
}

function echapper(s) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function page(suite, erreur) {
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="apple-mobile-web-app-capable" content="yes">
<title>Nos révisions</title>
<style>
  :root { --fond:#FFF8EF; --carte:#fff; --encre:#1E2147; --douce:#545878; --trait:#EADFCB; --acc:#1668D6; --relief:#0D4A9E; }
  @media (prefers-color-scheme: dark) { :root { --fond:#14172B; --carte:#1E2240; --encre:#F2F2F8; --douce:#B9BCD6; --trait:#33385E; } }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px;
    background:var(--fond); color:var(--encre); font:18px/1.45 system-ui, -apple-system, sans-serif; }
  form { width:100%; max-width:420px; background:var(--carte); border:2px solid var(--trait); border-radius:28px; padding:32px 28px;
    display:flex; flex-direction:column; gap:16px; }
  h1 { margin:0; font-size:30px; line-height:1.1; }
  p { margin:0; color:var(--douce); }
  input { font:inherit; font-size:24px; letter-spacing:.12em; text-transform:uppercase; text-align:center; padding:14px; min-height:60px;
    border-radius:16px; border:3px solid var(--trait); background:var(--fond); color:var(--encre); width:100%; }
  input:focus { outline:none; border-color:var(--acc); }
  button { font:inherit; font-weight:700; font-size:22px; min-height:64px; border:0; border-radius:18px; color:#fff;
    background:var(--acc); box-shadow:0 5px 0 var(--relief); }
  button:active { transform:translateY(4px); box-shadow:0 1px 0 var(--relief); }
  .erreur { color:#8A5A00; background:#FFF1C9; border-radius:12px; padding:10px 14px; }
</style>
</head>
<body>
  <form method="POST" action="/?suite=${encodeURIComponent(suite)}">
    <h1>Nos révisions</h1>
    <p>Le code familial, une seule fois sur cet appareil.</p>
    <input name="code" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX" aria-label="Code familial" required autofocus>
    <button type="submit">Entrer</button>
    ${erreur ? '<p class="erreur">Ce n\'est pas le bon code. Demande à un parent.</p>' : ''}
  </form>
</body>
</html>`;
  return new Response(html, { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}
