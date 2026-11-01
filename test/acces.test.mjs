import test from 'node:test';
import assert from 'node:assert/strict';
import acces from '../lib/acces.js';
const { normaliser, jetonRole, roleDuCookie, empreinteCode, autorise, enfantDuChemin, COOKIE } = acces;

const PARENT = 'Code-Parent-Test';

test('les codes se comparent sans majuscules, espaces ni accents', () => {
  assert.equal(normaliser(' moussi-12 '), 'MOUSSI12');
  assert.equal(normaliser('Élan'), 'ELAN');
});

test('un cookie ne vaut que s il vient du code parent', async () => {
  const bon = `${COOKIE}=henri.${await jetonRole(PARENT, 'henri')}`;
  assert.equal(await roleDuCookie(PARENT, bon), 'henri');
  assert.equal(await roleDuCookie('autre', bon), null, 'changer le code parent révoque tous les cookies');
  assert.equal(await roleDuCookie(PARENT, `${COOKIE}=parent.${await jetonRole(PARENT, 'henri')}`), null, 'pas de promotion de rôle');
  assert.equal(await roleDuCookie(PARENT, `${COOKIE}=henri.faux`), null);
  assert.equal(await roleDuCookie(PARENT, ''), null);
});

test('l empreinte d un code dépend de l enfant et du code parent', async () => {
  const h = await empreinteCode(PARENT, 'henri', 'moussi');
  assert.equal(h, await empreinteCode(PARENT, 'henri', 'MOUSSI'));
  assert.notEqual(h, await empreinteCode(PARENT, 'clara', 'moussi'));
  assert.notEqual(h, await empreinteCode('autre', 'henri', 'moussi'));
});

test('chaque enfant n ouvre que son app et les ressources communes', () => {
  assert.ok(autorise('henri', '/henri/', ''));
  assert.ok(autorise('henri', '/henri/tables.html', ''));
  assert.ok(autorise('henri', '/commun/kit.js', ''));
  assert.ok(autorise('henri', '/commun/voix/fr/abc.mp3', ''));
  assert.ok(autorise('henri', '/modules/tables/tables.js', ''));
  assert.ok(autorise('henri', '/api/progression', '?enfant=henri&module=tables'));
  assert.ok(autorise('henri', '/henri/zoom.html', ''));
  assert.ok(autorise('clara', '/clara/zoom.html', ''));
  assert.ok(autorise('clara', '/modules/zoom/cartes.js', ''), 'le dossier du zoom est commun aux deux');
  assert.ok(autorise('clara', '/api/progression', '?enfant=clara&module=zoom'));
  assert.ok(!autorise('clara', '/henri/zoom.html', ''));
  assert.ok(!autorise('henri', '/api/progression', '?enfant=clara&module=zoom'));
  assert.ok(!autorise('henri', '/clara/', ''));
  assert.ok(!autorise('henri', '/api/progression', '?enfant=clara&module=tables'));
  assert.ok(!autorise('henri', '/api/progression', '?module=tables'));
  assert.ok(!autorise('henri', '/', ''));
  assert.ok(!autorise('henri', '/parents/', ''));
  assert.ok(!autorise('clara', '/api/codes', ''));
  assert.ok(autorise('parent', '/api/codes', ''));
  assert.ok(autorise('parent', '/clara/', ''));
  assert.ok(!autorise('inconnu', '/henri/', ''));
});

test('l enfant d un chemin', () => {
  assert.equal(enfantDuChemin('/clara/tables.html', ''), 'clara');
  assert.equal(enfantDuChemin('/henrietta/', ''), null);
  assert.equal(enfantDuChemin('/commun/kit.js', ''), null);
});
