const { randomBytes, scrypt } = require('node:crypto');
const { promisify } = require('node:util');
const prisma = require('../lib/prisma');
const { HttpError } = require('../lib/errors');
const deriveKey = promisify(scrypt);

function normalizeEmail(value) {
  if (typeof value !== 'string' || value.trim().length > 191 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    throw new HttpError(400, 'Bitte gib eine gültige E-Mail-Adresse ein.');
  }
  return value.trim().toLowerCase();
}

async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 256) {
    throw new HttpError(400, 'Das Passwort muss zwischen 12 und 256 Zeichen lang sein.');
  }
  const salt = randomBytes(16).toString('hex');
  const key = await deriveKey(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return 'scrypt$' + salt + '$' + key.toString('hex');
}

// Registrierung und Seed nutzen denselben Service und dieselbe Passwortspeicherung.
async function createUser({ email, password, role = 'user' }, client = prisma) {
  email = normalizeEmail(email);
  if (!['admin', 'user'].includes(role)) throw new HttpError(400, 'Ungültige Rolle.');
  const hashedPassword = await hashPassword(password);
  return client.user.create({ data: { email, password: hashedPassword, role } });
}

async function registerUser({ email, password }) {
  const admin = await getAdmin();
  return prisma.$transaction(async (tx) => {
    const user = await createUser({ email, password }, tx);
    const dueDate = new Date();
    dueDate.setUTCDate(dueDate.getUTCDate() + 2);
    dueDate.setUTCHours(0, 0, 0, 0);
    await tx.task.create({
      data: {
        title: 'Profilbild hochladen',
        description: 'Lade ein Profilbild für deinen neuen Benutzer hoch.',
        dueDate,
        creatorId: admin.id,
        assigneeId: user.id
      }
    });
    return user;
  }, { timeout: 10000 });
}

async function seedAdmin() {
  const email = normalizeEmail(process.env.ADMIN_EMAIL || 'admin@tasklist.local');
  const password = process.env.ADMIN_PASSWORD;
  return prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { email } });
    if (existing) {
      return tx.user.update({
        where: { id: existing.id },
        data: { password: await hashPassword(password), role: 'admin' }
      });
    }
    return createUser({ email, password, role: 'admin' }, tx);
  }, { timeout: 10000 });
}

async function getAdmin() {
  const email = normalizeEmail(process.env.ADMIN_EMAIL || 'admin@tasklist.local');
  let admin = await prisma.user.findUnique({ where: { email } });
  if (!admin || admin.role !== 'admin') {
    admin = await prisma.user.findFirst({ where: { role: 'admin' }, orderBy: { id: 'asc' } });
  }
  if (!admin || admin.role !== 'admin') {
    throw new HttpError(503, 'Der Admin-Benutzer fehlt oder hat nicht die Rolle admin. Bitte führe den Data-Seed aus.');
  }
  return admin;
}

module.exports = { createUser, registerUser, seedAdmin, getAdmin, hashPassword, normalizeEmail };
