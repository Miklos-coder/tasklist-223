const prisma = require('../lib/prisma');
const { registerUser } = require('../services/userService');
const { positiveId } = require('./taskController');
const { HttpError } = require('../lib/errors');

function showRegistration(req, res) {
  res.render('register', { error: null, email: '' });
}

async function register(req, res) {
  try {
    await registerUser({ email: req.body.email, password: req.body.password });
    res.redirect('/');
  } catch (error) {
    if (error.code === 'P2002' || error.status === 400) {
      return res.status(error.code === 'P2002' ? 409 : 400).render('register', {
        email: typeof req.body.email === 'string' ? req.body.email : '',
        error: error.code === 'P2002' ? 'Diese E-Mail-Adresse ist bereits registriert.' : error.message
      });
    }
    throw error;
  }
}

async function showUsers(req, res) {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, profileImage: true, role: true },
    orderBy: { email: 'asc' }
  });
  res.render('users', { users });
}

async function changeRole(req, res) {
  const id = positiveId(req.params.id, 'Benutzer-ID');
  const role = req.body.role;
  if (!['admin', 'user'].includes(role)) throw new HttpError(400, 'Die Rolle muss admin oder user sein.');
  await prisma.user.update({ where: { id }, data: { role } });
  res.redirect('/benutzer');
}

module.exports = { showRegistration, register, showUsers, changeRole };
