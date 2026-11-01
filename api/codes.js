'use strict';
// Codes secrets des enfants, choisis sur la page parents. Réservé au rôle parent par middleware.js.
// GET : quels enfants ont déjà un code. POST { enfant, code } : range l'empreinte du code dans la base.

function lireRedis(env) {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const { Redis } = require('@upstash/redis');
  return new Redis({ url, token });
}

function repondre(res, statut, corps) {
  res.statusCode = statut;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(corps));
}

async function lireJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);
  const brut = await new Promise((ok, ko) => { let s = ''; req.on('data', c => { s += c; }); req.on('end', () => ok(s)); req.on('error', ko); });
  return JSON.parse(brut || '{}');
}

module.exports = async function handler(req, res) {
  const acces = await import('../lib/acces.mjs');
  const redis = lireRedis(process.env);
  if (!redis) return repondre(res, 503, { erreur: 'base non branchée' });
  try {
    if (req.method === 'GET') {
      const etat = {};
      for (const e of acces.ENFANTS) etat[e] = !!(await redis.get('code:' + e));
      return repondre(res, 200, etat);
    }
    if (req.method !== 'POST') return repondre(res, 405, { erreur: 'GET ou POST' });
    let corps;
    try { corps = await lireJson(req); } catch (e) { return repondre(res, 400, { erreur: 'JSON illisible' }); }
    const { enfant, code } = corps || {};
    if (!acces.ENFANTS.includes(enfant)) return repondre(res, 400, { erreur: 'enfant inconnu' });
    const propre = acces.normaliser(code);
    if (propre.length < 4) return repondre(res, 400, { erreur: 'au moins 4 lettres ou chiffres' });
    if (propre === acces.normaliser(process.env.CODE_PARENT)) return repondre(res, 400, { erreur: 'ce code est déjà celui des parents' });
    await redis.set('code:' + enfant, await acces.empreinteCode(process.env.CODE_PARENT, enfant, code));
    return repondre(res, 200, { ok: true });
  } catch (e) {
    return repondre(res, 503, { erreur: 'base injoignable' });
  }
};
