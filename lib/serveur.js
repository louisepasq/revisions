'use strict';
const crypto = require('node:crypto');
const { fusionner } = require('./fusion');

const EMPREINTE = ''; // dépôt public : aucune empreinte ici ; le site s'appuie sur le middleware (memeSite)
const ENFANTS = ['henri', 'clara'];
const MODULE = /^[a-z-]{1,40}$/;
const TAILLE_MAX = 200 * 1024;
const REQUETES_PAR_MINUTE = 240; // les deux enfants partagent souvent la même adresse IP (le wifi de la maison)
const ORIGINE_SITE = 'https://louisepasq.github.io';
const ORIGINE_LOCALE = /^http:\/\/localhost(:\d{1,5})?$/;

function origineAutorisee(origine) {
  return origine === ORIGINE_SITE || ORIGINE_LOCALE.test(origine);
}

function codeValide(code, empreinte = EMPREINTE) {
  if (typeof code !== 'string' || !code || !empreinte) return false;
  const recu = crypto.createHash('sha256').update('revisions|' + code).digest();
  return crypto.timingSafeEqual(recu, Buffer.from(empreinte, 'hex'));
}

function repondre(res, statut, corps) {
  res.statusCode = statut;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(corps));
}

const erreur = (res, statut, message) => repondre(res, statut, { erreur: message });

function lireRedis(env) {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const { Redis } = require('@upstash/redis');
  return new Redis({ url, token });
}

function ipDe(req) {
  const xff = String(req.headers['x-forwarded-for'] || '');
  return xff.split(',')[0].trim() || (req.socket && req.socket.remoteAddress) || 'inconnue';
}

async function tropDeRequetes(redis, ip) {
  const cle = 'limite:' + ip + ':' + Math.floor(Date.now() / 60000);
  const n = await redis.incr(cle);
  if (n === 1) await redis.expire(cle, 70);
  return n > REQUETES_PAR_MINUTE;
}

function versObjet(v) {
  if (typeof v === 'string') {
    try { v = JSON.parse(v); } catch (e) { return {}; }
  }
  return v !== null && typeof v === 'object' && !Array.isArray(v) ? v : {};
}

/* Vercel analyse le corps à la lecture de req.body et lève une erreur si le JSON est faux :
   on rend alors une chaîne illisible, que l'appelant refuse en 400. */
function lireCorps(req) {
  let corps;
  try { corps = req.body; } catch (e) { return 'corps illisible'; }
  if (corps !== undefined) {
    if (typeof corps === 'string') return corps;
    if (Buffer.isBuffer(corps)) return corps.toString('utf8');
    return JSON.stringify(corps);
  }
  return new Promise((ok, ko) => {
    let brut = '';
    req.on('data', c => { brut += c; if (brut.length > TAILLE_MAX * 2) req.destroy(); });
    req.on('end', () => ok(brut));
    req.on('error', ko);
  });
}

/* Les tests injectent une base en mémoire et l'empreinte d'un code de test ;
   en production, la base se lit dans l'environnement. */
/* memeSite : servi derrière le middleware du site, qui exige déjà un code (cookie d'accès, lib/acces.js) ;
   ni code en en-tête ni CORS à vérifier. */
function creerHandler({ fabriqueRedis = () => lireRedis(process.env), empreinte = EMPREINTE, memeSite = false } = {}) {
  return async function handler(req, res) {
    const origine = req.headers.origin;
    if (origine && !memeSite) {
      if (!origineAutorisee(origine)) return erreur(res, 403, 'origine non autorisée');
      res.setHeader('Access-Control-Allow-Origin', origine);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'X-Code-Famille, Content-Type');
      res.setHeader('Access-Control-Max-Age', '600');
    }
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      return res.end();
    }
    if (!['GET', 'PUT', 'DELETE'].includes(req.method)) return erreur(res, 405, 'méthode non autorisée (GET, PUT ou DELETE)');

    let redis;
    try {
      redis = fabriqueRedis();
      if (redis && await tropDeRequetes(redis, ipDe(req))) return erreur(res, 429, 'trop de requêtes, réessaie dans une minute');
    } catch (e) {
      return erreur(res, 503, 'base injoignable');
    }

    if (!memeSite && !codeValide(req.headers['x-code-famille'], empreinte)) return erreur(res, 401, 'code famille absent ou faux');

    const url = new URL(req.url, 'http://local');
    const enfant = url.searchParams.get('enfant');
    const module = url.searchParams.get('module');
    if (!ENFANTS.includes(enfant)) return erreur(res, 400, 'enfant inconnu (henri ou clara)');
    if (!module || !MODULE.test(module)) return erreur(res, 400, 'module invalide (lettres minuscules et tirets)');

    if (!redis) return erreur(res, 503, 'base non branchée');
    const cle = 'progression:' + enfant + ':' + module;

    try {
      if (req.method === 'GET') return repondre(res, 200, versObjet(await redis.get(cle)));
      if (req.method === 'DELETE') { await redis.del(cle); return repondre(res, 200, {}); } // remise à zéro voulue par un parent

      if (Number(req.headers['content-length'] || 0) > TAILLE_MAX) return erreur(res, 413, 'état trop lourd (200 Ko au plus)');
      const brut = await lireCorps(req);
      if (Buffer.byteLength(brut, 'utf8') > TAILLE_MAX) return erreur(res, 413, 'état trop lourd (200 Ko au plus)');
      let recu;
      try { recu = JSON.parse(brut); } catch (e) { return erreur(res, 400, 'corps JSON illisible'); }
      if (recu === null || typeof recu !== 'object' || Array.isArray(recu)) return erreur(res, 400, 'le corps doit être un objet JSON');

      const fusion = fusionner(module, versObjet(await redis.get(cle)), recu);
      const texte = JSON.stringify(fusion);
      if (Buffer.byteLength(texte, 'utf8') > TAILLE_MAX) return erreur(res, 413, 'état fusionné trop lourd (200 Ko au plus)');
      await redis.set(cle, texte);
      return repondre(res, 200, fusion);
    } catch (e) {
      return erreur(res, 503, 'base injoignable');
    }
  };
}

module.exports = { creerHandler, codeValide, origineAutorisee };
