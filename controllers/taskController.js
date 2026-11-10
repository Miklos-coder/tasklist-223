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

function createTask(req, res) {
  const id = tasks.length === 0 ? 1 : Math.max(...tasks.map((task) => task.id)) + 1;

  tasks.push({
    id,
    title: req.body.title,
    description: req.body.description,
    dueDate: req.body.dueDate,
    done: false
  });

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
