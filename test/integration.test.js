const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { scryptSync } = require('node:crypto');
require('dotenv').config({ quiet: true });

const mainUrl = new URL(process.env.DATABASE_URL);
const testUrl = new URL(process.env.TEST_DATABASE_URL || process.env.DATABASE_URL);
if (!testUrl.pathname.endsWith('_test') || testUrl.pathname === mainUrl.pathname) {
  throw new Error('TEST_DATABASE_URL muss auf eine separate Datenbank mit Endung _test zeigen.');
}
process.env.DATABASE_URL = testUrl.href;
const prisma = require('../lib/prisma');
const mysql = require('mysql2/promise');
let sql;
const { seedAdmin } = require('../services/userService');
const app = require('../app');
let server, base, admin;
const prefix = 'test-' + Date.now();
const emails = [prefix + '-a@example.test', prefix + '-b@example.test', prefix + '-rollback@example.test'];
const taskIds = [];
const userIds = [];

async function request(path, data) {
  return fetch(base + path, data ? {
    method: 'POST', body: new URLSearchParams(data), redirect: 'manual'
  } : {});
}

before(async () => {
  execFileSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'], {
    env: process.env, stdio: 'pipe'
  });
  sql = await mysql.createConnection(testUrl.href);
  admin = await seedAdmin();
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = 'http://127.0.0.1:' + server.address().port;
});

after(async () => {
  await sql.query('DROP TRIGGER IF EXISTS test_registration_failure');
  await prisma.task.deleteMany({ where: { OR: [
    { id: { in: taskIds } }, { assigneeId: { in: userIds } }, { creatorId: { in: userIds } }
  ] } });
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
  if (server) await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
  if (sql) await sql.end();
});

test('Seed ist wiederholbar und speichert nur ein gesalzenes Passwort-Hash', async () => {
  const again = await seedAdmin();
  assert.equal(again.id, admin.id);
  assert.equal(again.role, 'admin');
  const [algorithm, salt, key] = again.password.split('$');
  assert.equal(algorithm, 'scrypt');
  assert.equal(key, scryptSync(process.env.ADMIN_PASSWORD, salt, 64).toString('hex'));
  assert.notEqual(again.password, process.env.ADMIN_PASSWORD);
});

test('Aufgaben werden persistent gespeichert, sortiert, erledigt und gelöscht', async () => {
  for (const [title, date] of [[prefix + '-late', '2027-02-02'], [prefix + '-early', '2027-02-01']]) {
    const r = await request('/aufgaben', { title, description: 'Integrationstest', dueDate: date });
    assert.equal(r.status, 302);assert.equal(r.headers.get('location'), '/');
    const task = await prisma.task.findFirst({ where: { title } });
    taskIds.push(task.id);
    assert.equal(task.creatorId, admin.id);assert.equal(task.assigneeId, null);assert.equal(task.done, false);
  }
  let html = await (await request('/')).text();
  assert.ok(html.indexOf(prefix + '-early') < html.indexOf(prefix + '-late'));
  const { PrismaClient } = require('@prisma/client');
  const secondClient = new PrismaClient();
  try { assert.ok(await secondClient.task.findUnique({ where: { id: taskIds[0] } })); }
  finally { await secondClient.$disconnect(); }
  assert.equal((await request('/aufgaben/' + taskIds[1] + '/erledigen', {})).status, 302);
  assert.equal((await prisma.task.findUnique({ where: { id: taskIds[1] } })).done, true);
  html = await (await request('/')).text();
  assert.ok(html.indexOf(prefix + '-late') < html.indexOf(prefix + '-early'));
  assert.equal((await request('/aufgaben/' + taskIds[1] + '/l%C3%B6schen', {})).status, 302);
  assert.equal(await prisma.task.findUnique({ where: { id: taskIds[1] } }), null);
  const bad = await request('/aufgaben', { title: 'Ungültig', description: 'Test', dueDate: '2026-02-30' });
  assert.equal(bad.status, 400);
  assert.equal((await request('/aufgaben/xyz/erledigen', {})).status, 400);
  assert.equal((await request('/aufgaben/2147483646/loeschen', {})).status, 404);
});

test('Registrierung erstellt genau eine Profilbild-Aufgabe und verhindert doppelte E-Mails', async () => {
  assert.equal((await request('/registrieren')).status, 200);
  for (const email of emails.slice(0, 2)) {
    const before = Date.now();
    const response = await request('/registrieren', { email, password: 'EinTestpasswort123!' });
    assert.equal(response.status, 302);assert.equal(response.headers.get('location'), '/');
    const user = await prisma.user.findUnique({ where: { email }, include: { assignedTasks: true } });
    userIds.push(user.id);
    assert.equal(user.role, 'user');assert.equal(user.profileImage, null);
    assert.match(user.password, /^scrypt\$/);
    assert.equal(user.assignedTasks.length, 1);
    const task = user.assignedTasks[0];
    assert.equal(task.title, 'Profilbild hochladen');assert.equal(task.creatorId, admin.id);
    assert.ok(task.dueDate.getTime() > before);assert.ok(task.dueDate.getTime() <= Date.now() + 2 * 86400000);
  }
  const count = await prisma.task.count();
  const duplicate = await request('/registrieren', { email: emails[0].toUpperCase(), password: 'EinTestpasswort123!' });
  assert.equal(duplicate.status, 409);assert.match(await duplicate.text(), /bereits registriert/);
  assert.equal(await prisma.task.count(), count);
  assert.equal((await request('/registrieren', { email: 'ungueltig', password: 'kurz' })).status, 400);
});

test('Registrierung rollt den Benutzer zurück, wenn die Aufgabe nicht gespeichert werden kann', async () => {
  const count = await prisma.task.count();
  await sql.query("CREATE TRIGGER test_registration_failure BEFORE INSERT ON Task FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'test rollback'");
  try {
    const response = await request('/registrieren', { email: emails[2], password: 'EinTestpasswort123!' });
    assert.equal(response.status, 503);
    assert.equal(await prisma.user.findUnique({ where: { email: emails[2] } }), null);
    assert.equal(await prisma.task.count(), count);
  } finally {
    await sql.query('DROP TRIGGER test_registration_failure');
  }
});

test('Benutzerübersicht, Rollenwechsel und unabhängige Zuweisung sind persistent', async () => {
  const overview = await request('/benutzer');
  assert.equal(overview.status, 200);
  const html = await overview.text();
  assert.ok(html.includes(emails[0]));assert.ok(!html.includes('scrypt$'));
  for (const role of ['admin', 'user']) {
    assert.equal((await request('/benutzer/' + userIds[0] + '/rolle', { role })).status, 302);
    assert.equal((await prisma.user.findUnique({ where: { id: userIds[0] } })).role, role);
  }
  assert.equal((await request('/benutzer/' + userIds[0] + '/rolle', { role: 'superadmin' })).status, 400);
  for (const assigneeId of [String(userIds[0]), String(userIds[1]), '']) {
    assert.equal((await request('/aufgaben/' + taskIds[0] + '/zuweisen', { assigneeId })).status, 302);
    const task = await prisma.task.findUnique({ where: { id: taskIds[0] } });
    assert.equal(task.assigneeId, assigneeId ? Number(assigneeId) : null);
    assert.equal(task.creatorId, admin.id);
  }
  assert.equal((await request('/aufgaben/' + taskIds[0] + '/zuweisen', { assigneeId: '2147483646' })).status, 400);
  assert.equal((await request('/aufgaben/' + taskIds[0] + '/loeschen', {})).status, 302);
});

test('Nicht erreichbare Datenbank liefert verständliche Fehler statt Absturz', () => {
  const unavailable = new URL(testUrl);
  unavailable.port = '1';unavailable.searchParams.set('connect_timeout', '1');
  const code = `
    const app = require('./app');
    const p = require('./lib/prisma');
    const server = app.listen(0, '127.0.0.1', async () => {
      try {
        const base = 'http://127.0.0.1:' + server.address().port;
        for (const [path, data] of [
          ['/', null], ['/benutzer', null],
          ['/aufgaben', { title: 'Test', description: 'Test', dueDate: '2027-01-01' }],
          ['/aufgaben/1/erledigen', {}], ['/aufgaben/1/loeschen', {}],
          ['/aufgaben/1/zuweisen', { assigneeId: '' }],
          ['/registrieren', { email: 'db@example.test', password: 'EinTestpasswort123!' }],
          ['/benutzer/1/rolle', { role: 'user' }]
        ]) {
          const r = await fetch(base + path, data ? { method: 'POST', body: new URLSearchParams(data), redirect: 'manual' } : {});
          if (r.status !== 503 || !(await r.text()).includes('Datenbank')) throw new Error('Fehlerbehandlung ' + path);
        }
        console.log('Datenbankfehler geprüft');
      } catch(e) { console.error(e);process.exitCode = 1; }
      finally { server.close();await p.$disconnect(); }
    });
  `;
  const result = execFileSync(process.execPath, ['-e', code], {
    cwd: require('node:path').join(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: unavailable.href },
    timeout: 45000, encoding: 'utf8'
  });
  assert.match(result, /Datenbankfehler geprüft/);
});
