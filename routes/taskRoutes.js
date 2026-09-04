const express = require('express');
const taskController = require('../controllers/taskController');

const router = express.Router();

router.get('/', taskController.showTasks);
router.get('/aufgaben/neu', taskController.showNewTaskForm);
router.post('/aufgaben', taskController.createTask);
router.post('/aufgaben/:id/erledigen', taskController.completeTask);
router.post('/aufgaben/:id/löschen', taskController.deleteTask);

module.exports = router;
