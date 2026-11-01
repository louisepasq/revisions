'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { creerHandler, codeValide, origineAutorisee } = require('../lib/serveur');

class RedisMemoire {
  constructor() { this.d = new Map(); }
  async get(k) { return this.d.has(k) ? this.d.get(k) : null; }
  async set(k, v) { this.d.set(k, v); return 'OK'; }
  async incr(k) { const n = (this.d.get(k) || 0) + 1; this.d.set(k, n); return n; }
  async expire() { return 1; }
  async del(k) { this.d.delete(k); return 1; }
}

function appel(handler, { method = 'GET', url = '/api/progression?enfant=henri&module=tables', headers = {}, body } = {}) {
  return new Promise(ok => {
    const res = {
      statusCode: 200, entetes: {},
      setHeader(k, v) { this.entetes[k.toLowerCase()] = v; },
      end(texte) { ok({ statut: this.statusCode, entetes: this.entetes, json: texte ? JSON.parse(texte) : null }); },
    };
    handler({ method, url, headers, body, socket: {} }, res);
  });
}

test('le code faux et le code absent sont refusés', () => {
  assert.equal(codeValide('faux'), false);
  assert.equal(codeValide(undefined), false);
  assert.equal(codeValide(''), false);
});

test('origines autorisées', () => {
  assert.ok(origineAutorisee('https://louisepasq.github.io'));
  assert.ok(origineAutorisee('http://localhost:8000'));
  assert.ok(origineAutorisee('http://localhost'));
  assert.ok(!origineAutorisee('https://louisepasq.github.io.evil.com'));
  assert.ok(!origineAutorisee('http://localhost.evil.com'));
  assert.ok(!origineAutorisee('https://example.com'));
});

test('origine interdite : 403 sans en-tête CORS', async () => {
  const r = await appel(creerHandler({ fabriqueRedis: () => null }), { headers: { origin: 'https://example.com' } });
  assert.equal(r.statut, 403);
  assert.equal(r.entetes['access-control-allow-origin'], undefined);
});

test('préflight autorisé : 204 avec les en-têtes CORS', async () => {
  const r = await appel(creerHandler({ fabriqueRedis: () => null }), { method: 'OPTIONS', headers: { origin: 'https://louisepasq.github.io' } });
  assert.equal(r.statut, 204);
  assert.equal(r.entetes['access-control-allow-origin'], 'https://louisepasq.github.io');
  assert.match(r.entetes['access-control-allow-headers'], /X-Code-Famille/);
});

test('code faux : 401, même sans base', async () => {
  const r = await appel(creerHandler({ fabriqueRedis: () => null }), { headers: { 'x-code-famille': 'faux' } });
  assert.equal(r.statut, 401);
  assert.ok(r.json.erreur);
});

test('méthode interdite : 405', async () => {
  const r = await appel(creerHandler({ fabriqueRedis: () => null }), { method: 'PATCH' });
  assert.equal(r.statut, 405);
});

// Le vrai code n'est pas connu des tests : ils utilisent l'empreinte d'un code de test.
const EMPREINTE_TEST = crypto.createHash('sha256').update('revisions|code-de-test').digest('hex');
const handlerAvecCodeDeTest = redis => creerHandler({ fabriqueRedis: () => redis, empreinte: EMPREINTE_TEST });
const BON = { 'x-code-famille': 'code-de-test' };

test('sans base : 503 « base non branchée »', async () => {
  const r = await appel(handlerAvecCodeDeTest(null), { headers: BON });
  assert.equal(r.statut, 503);
  assert.equal(r.json.erreur, 'base non branchée');
});

test('enfant ou module invalide : 400', async () => {
  const h = handlerAvecCodeDeTest(new RedisMemoire());
  assert.equal((await appel(h, { headers: BON, url: '/api/progression?enfant=paul&module=tables' })).statut, 400);
  assert.equal((await appel(h, { headers: BON, url: '/api/progression?enfant=henri&module=Tables1' })).statut, 400);
});

test('GET vide rend {}, PUT fusionne et rend l\'état fusionné', async () => {
  const h = handlerAvecCodeDeTest(new RedisMemoire());
  assert.deepEqual((await appel(h, { headers: BON })).json, {});
  const a = { faits: { '2x3': { boite: 3, vu: true, prochain: '2026-11-05', justesJours: ['2026-11-01'], erreurs: 0 } }, familles: 2, jours: ['2026-11-01'], records: [] };
  const b = { faits: { '4x5': { boite: 1, vu: true, prochain: '2026-11-02', justesJours: [], erreurs: 1 } }, familles: 1, jours: ['2026-11-02'], records: [] };
  await appel(h, { method: 'PUT', headers: BON, body: a });
  const r = await appel(h, { method: 'PUT', headers: BON, body: b });
  assert.equal(r.statut, 200);
  assert.deepEqual(Object.keys(r.json.faits).sort(), ['2x3', '4x5']);
  assert.equal(r.json.familles, 2);
  assert.deepEqual((await appel(h, { headers: BON })).json, r.json);
});

test('état trop lourd : 413 ; corps non objet : 400', async () => {
  const h = handlerAvecCodeDeTest(new RedisMemoire());
  const gros = { records: ['x'.repeat(210 * 1024)] };
  assert.equal((await appel(h, { method: 'PUT', headers: BON, body: gros })).statut, 413);
  assert.equal((await appel(h, { method: 'PUT', headers: BON, body: '[1,2]' })).statut, 400);
  assert.equal((await appel(h, { method: 'PUT', headers: BON, body: 'pas du json' })).statut, 400);
});

test('limite de requêtes : 429 au-delà de 240 par minute', async () => {
  const h = handlerAvecCodeDeTest(new RedisMemoire());
  let dernier;
  for (let i = 0; i < 241; i++) dernier = await appel(h, { headers: BON });
  assert.equal(dernier.statut, 429);
});

test('remise à zéro : DELETE efface l\'état en ligne (site derrière le code familial)', async () => {
  const redis = new RedisMemoire();
  const h = creerHandler({ fabriqueRedis: () => redis, memeSite: true });
  await appel(h, { method: 'PUT', body: JSON.stringify({ familles: 3, faits: { '7x8': { boite: 4, vu: true } }, jours: ['2026-11-01'] }) });
  assert.equal((await appel(h)).json.familles, 3);
  assert.equal((await appel(h, { method: 'DELETE' })).statut, 200);
  assert.deepEqual((await appel(h)).json, {});
});
