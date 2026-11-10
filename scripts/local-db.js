// Lokale, projektbezogene Entwicklungsdatenbank mit vorhandenen XAMPP-Binaries.
const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const mysql = require('mysql2/promise');
require('dotenv').config({ quiet: true });
const root = path.resolve(__dirname, '..');
const data = path.join(root, '.local', 'mysql');
const mysqlHome = process.env.MYSQL_HOME || 'C:/xampp/mysql';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function connect() {
  return mysql.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', connectTimeout: 1000 });
}
async function checkOwnership(connection) {
  const [[row]] = await connection.query('SELECT @@datadir AS dir');
  if (path.resolve(row.dir).toLowerCase() !== path.resolve(data).toLowerCase()) {
    throw new Error('Port 3307 gehört zu einer anderen Datenbank. Es wurde nichts geändert.');
  }
}

async function main() {
  fs.mkdirSync(path.join(root, '.local'), { recursive: true });
  let connection;
  try { connection = await connect(); } catch {}
  if (process.argv[2] === 'stop') {
    if (!connection) return console.log('Die Projektdatenbank läuft bereits nicht.');
    await checkOwnership(connection);
    try { await connection.query('SHUTDOWN'); }
    catch (error) { if (!['PROTOCOL_CONNECTION_LOST', 'ECONNRESET'].includes(error.code)) throw error; }
    await connection.end();
    return console.log('Projektdatenbank beendet.');
  }
  if (!fs.existsSync(path.join(root, '.env'))) {
    const dbPassword = randomBytes(24).toString('hex');
    fs.writeFileSync(path.join(root, '.env'), [
      'DATABASE_URL="mysql://tasklist:' + dbPassword + '@127.0.0.1:3307/tasklist"',
      'TEST_DATABASE_URL="mysql://tasklist:' + dbPassword + '@127.0.0.1:3307/tasklist_test"',
      'ADMIN_EMAIL=admin@tasklist.local',
      'ADMIN_PASSWORD=' + randomBytes(24).toString('base64url'), ''
    ].join('\n'));
    require('dotenv').config({ path: path.join(root, '.env'), quiet: true });
  }
  if (!connection) {
    if (!fs.existsSync(path.join(data, 'mysql'))) {
      const result = spawnSync(path.join(mysqlHome, 'bin', 'mysql_install_db.exe'),
        ['--datadir=' + data, '--port=3307'], { windowsHide: true, encoding: 'utf8' });
      if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr || result.stdout);
    }
    const log = fs.openSync(path.join(root, '.local', 'mysql-server.log'), 'a');
    const child = spawn(path.join(mysqlHome, 'bin', 'mysqld.exe'), [
      '--no-defaults', '--basedir=' + mysqlHome, '--datadir=' + data,
      '--innodb-log-group-home-dir=' + data, '--aria-log-dir-path=' + data,
      '--port=3307', '--bind-address=127.0.0.1', '--max-allowed-packet=16M'
    ], { detached: true, windowsHide: true, stdio: ['ignore', log, log] });
    const started = new Promise((resolve, reject) => { child.once('spawn', resolve);child.once('error', reject); });
    await started;
    child.unref();fs.closeSync(log);
    for (let attempt = 0; attempt < 60; attempt++) {
      await sleep(250);
      try { connection = await connect();break; } catch {}
    }
    if (!connection) throw new Error('Datenbankstart fehlgeschlagen. Siehe .local/mysql-server.log.');
  }
  try {
    await checkOwnership(connection);
    const url = new URL(process.env.DATABASE_URL);
    if (url.hostname !== '127.0.0.1' || url.port !== '3307' || url.pathname !== '/tasklist') {
      throw new Error('Das lokale Setup erwartet DATABASE_URL für 127.0.0.1:3307/tasklist.');
    }
    const user = decodeURIComponent(url.username), password = decodeURIComponent(url.password);
    if (!/^[a-zA-Z0-9_]+$/.test(user)) throw new Error('Ungültiger lokaler DB-Benutzername.');
    await connection.query('CREATE DATABASE IF NOT EXISTS tasklist CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await connection.query('CREATE DATABASE IF NOT EXISTS tasklist_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await connection.query('CREATE USER IF NOT EXISTS ?@? IDENTIFIED BY ?', [user, '127.0.0.1', password]);
    // Vorhandene Zugangsdaten werden nicht überschrieben.
    const account = connection.escape(user) + "@'127.0.0.1'";
    await connection.query('GRANT ALL PRIVILEGES ON tasklist.* TO ' + account);
    await connection.query('GRANT ALL PRIVILEGES ON tasklist_test.* TO ' + account);
    console.log('Projektdatenbank bereit: 127.0.0.1:3307. Bestehende XAMPP-Daten bleiben unverändert.');
  } finally { await connection.end(); }
}
main().catch((error) => { console.error(error.message);process.exitCode = 1; });
