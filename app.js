const express = require('express');
const path = require('path');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false }));

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

app.get('/', (req, res) => {
  res.render('index', { tasks });
});

app.get('/aufgaben/neu', (req, res) => {
  res.render('new-task');
});

app.post('/aufgaben', (req, res) => {
  const id = tasks.length === 0 ? 1 : Math.max(...tasks.map((task) => task.id)) + 1;

  tasks.push({
    id,
    title: req.body.title,
    description: req.body.description,
    dueDate: req.body.dueDate,
    done: false
  });

  res.redirect('/');
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
