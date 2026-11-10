const prisma = require('../lib/prisma');
async function showTasks(req, res) {
  const storedTasks = await prisma.task.findMany({
    orderBy: [{ done: 'asc' }, { dueDate: 'asc' }, { id: 'asc' }]
  });
  res.render('index', { tasks: storedTasks.map((task) => ({
    ...task, dueDate: task.dueDate.toISOString().slice(0, 10)
  })) });
}

function showNewTaskForm(req, res) {
  res.render('new-task');
}

async function createTask(req, res) {
  const { title, description, dueDate } = req.body;
  const date = new Date(dueDate + 'T00:00:00.000Z');
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 191 ||
      typeof description !== 'string' || !description.trim() ||
      typeof dueDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
      Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dueDate) {
    const error = new Error('Bitte gib einen Titel, eine Beschreibung und ein g?ltiges F?lligkeitsdatum ein.');
    error.status = 400;
    throw error;
  }
  await prisma.task.create({ data: { title: title.trim(), description: description.trim(), dueDate: date } });
  res.redirect('/');
}

async function completeTask(req, res) {
  await prisma.task.update({ where: { id: taskId(req.params.id) }, data: { done: true } });
  res.redirect('/');
}

async function deleteTask(req, res) {
  await prisma.task.delete({ where: { id: taskId(req.params.id) } });
  res.redirect('/');
}

function taskId(value) {
  const id = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(id) || id < 1) {
    const error = new Error('Ung?ltige Aufgaben-ID.');
    error.status = 400;
    throw error;
  }
  return id;
}

module.exports = {
  showTasks,
  showNewTaskForm,
  createTask,
  completeTask,
  deleteTask
};
