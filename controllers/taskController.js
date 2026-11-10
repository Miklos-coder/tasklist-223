const prisma = require('../lib/prisma');
const tasks = [
  {
    id: 1,
    title: 'Einkaufen',
    description: 'Lebensmittel einkaufen',
    dueDate: '2026-09-05',
    done: false
  },
  {
    id: 2,
    title: 'Hausaufgaben',
    description: 'Aufgabe fertigstellen',
    dueDate: '2026-09-10',
    done: true
  }
];

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

function completeTask(req, res) {
  const task = tasks.find((task) => task.id === Number(req.params.id));

  if (task) {
    task.done = true;
  }

  res.redirect('/');
}

function deleteTask(req, res) {
  const index = tasks.findIndex((task) => task.id === Number(req.params.id));

  if (index !== -1) {
    tasks.splice(index, 1);
  }

  res.redirect('/');
}

module.exports = {
  showTasks,
  showNewTaskForm,
  createTask,
  completeTask,
  deleteTask
};
