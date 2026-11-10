const prisma = require('../lib/prisma');
const { getAdmin } = require('../services/userService');
const { HttpError } = require('../lib/errors');

function positiveId(value, label = 'Aufgaben-ID') {
  const id = Number(value);
  if (typeof value !== 'string' || !/^\d+$/.test(value) || !Number.isSafeInteger(id) || id < 1) {
    throw new HttpError(400, 'Ungültige ' + label + '.');
  }
  return id;
}

async function showTasks(req, res) {
  const [tasks, users] = await Promise.all([
    prisma.task.findMany({
      orderBy: [{ done: 'asc' }, { dueDate: 'asc' }, { id: 'asc' }],
      include: {
        creator: { select: { email: true } },
        assignee: { select: { email: true } }
      }
    }),
    prisma.user.findMany({ select: { id: true, email: true }, orderBy: { email: 'asc' } })
  ]);
  res.render('index', {
    tasks: tasks.map((task) => ({ ...task, dueDate: task.dueDate.toISOString().slice(0, 10) })),
    users
  });
}

function showNewTaskForm(req, res) {
  res.render('new-task');
}

async function createTask(req, res) {
  const { title, description, dueDate } = req.body;
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 191 ||
      typeof description !== 'string' || !description.trim() || description.length > 10000 ||
      typeof dueDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    throw new HttpError(400, 'Bitte gib einen Titel (max. 191 Zeichen), eine Beschreibung (max. 10000 Zeichen) und ein gültiges Datum ein.');
  }
  const date = new Date(dueDate + 'T00:00:00.000Z');
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dueDate ||
      date.getUTCFullYear() < 1000) {
    throw new HttpError(400, 'Bitte gib ein gültiges Fälligkeitsdatum ab dem Jahr 1000 ein.');
  }
  const admin = await getAdmin();
  await prisma.task.create({
    data: { title: title.trim(), description: description.trim(), dueDate: date, creatorId: admin.id }
  });
  res.redirect('/');
}

async function completeTask(req, res) {
  await prisma.task.update({ where: { id: positiveId(req.params.id) }, data: { done: true } });
  res.redirect('/');
}

async function deleteTask(req, res) {
  await prisma.task.delete({ where: { id: positiveId(req.params.id) } });
  res.redirect('/');
}

async function assignTask(req, res) {
  const id = positiveId(req.params.id);
  const assigneeId = req.body.assigneeId === '' ? null : positiveId(req.body.assigneeId, 'Benutzer-ID');
  if (assigneeId !== null && !await prisma.user.findUnique({ where: { id: assigneeId }, select: { id: true } })) {
    throw new HttpError(400, 'Der ausgewählte Benutzer existiert nicht.');
  }
  await prisma.task.update({ where: { id }, data: { assigneeId } });
  res.redirect('/');
}

module.exports = { showTasks, showNewTaskForm, createTask, completeTask, deleteTask, assignTask, positiveId };
