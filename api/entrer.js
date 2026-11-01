'use strict';
// Saisie d'un code (formulaire de la page de code servie par middleware.js). Seule route ouverte sans cookie.
// Le code parent ouvre tout ; le code d'un enfant n'ouvre que son app. 20 essais par quart d'heure et par adresse.

const ESSAIS_MAX = 20;

function lireRedis(env) {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const { Redis } = require('@upstash/redis');
  return new Redis({ url, token });
}

async function lireFormulaire(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  const brut = typeof req.body === 'string' ? req.body : Buffer.isBuffer(req.body) ? req.body.toString('utf8')
    : await new Promise((ok, ko) => { let s = ''; req.on('data', c => { s += c; if (s.length > 4096) req.destroy(); }); req.on('end', () => ok(s)); req.on('error', ko); });
  return Object.fromEntries(new URLSearchParams(brut));
}

function revenir(res, suite, erreur, cookie) {
  const cible = typeof suite === 'string' && suite.startsWith('/') && !suite.startsWith('//') ? suite : '/';
  res.statusCode = 303;
  if (cookie) res.setHeader('Set-Cookie', cookie);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Location', erreur ? `${cible.split('?')[0]}?erreur=${erreur}&suite=${encodeURIComponent(cible)}` : cible);
  res.end();
}

module.exports = async function handler(req, res) {
  const acces = await import('../lib/acces.mjs');
  const url = new URL(req.url, 'http://local');
  const suite = url.searchParams.get('suite') || '/';
  if (req.method !== 'POST') return revenir(res, suite);
  const codeParent = process.env.CODE_PARENT;
  if (!acces.normaliser(codeParent)) { res.statusCode = 503; return res.end('Site en cours de configuration.'); }
  const redis = lireRedis(process.env);
  if (redis) {
    const ip = String(req.headers['x-forwarded-for'] || 'inconnue').split(',')[0].trim();
    const cle = `essais:${ip}:${Math.floor(Date.now() / 900000)}`;
    try {
      const n = await redis.incr(cle);
      if (n === 1) await redis.expire(cle, 960);
      if (n > ESSAIS_MAX) return revenir(res, suite, 'trop');
    } catch (e) { /* base injoignable : on vérifie quand même le code parent */ }
  }
  let saisi = '';
  try { saisi = (await lireFormulaire(req)).code || ''; } catch (e) { saisi = ''; }
  const cheminSuite = new URL(suite, 'http://local').pathname;
  const enfant = acces.enfantDuChemin(cheminSuite, '');
  let role = null;
  if (acces.normaliser(saisi) && acces.normaliser(saisi) === acces.normaliser(codeParent)) role = 'parent';
  else if (redis && acces.ENFANTS.includes(enfant) && acces.normaliser(saisi)) {
    const attendu = await redis.get('code:' + enfant).catch(() => null);
    if (attendu && attendu === await acces.empreinteCode(codeParent, enfant, saisi)) role = enfant;
  }
  if (!role || !acces.autorise(role, cheminSuite, '')) return revenir(res, suite, 'faux');
  const jeton = await acces.jetonRole(codeParent, role);
  const securise = (req.headers['x-forwarded-proto'] || 'https') === 'https' ? ' Secure;' : '';
  revenir(res, suite, null, `${acces.COOKIE}=${role}.${jeton}; Path=/; HttpOnly;${securise} SameSite=Lax; Max-Age=${acces.UN_AN}`);
};
