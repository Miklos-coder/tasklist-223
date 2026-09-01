const express = require('express');
const path = require('path');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

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

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
