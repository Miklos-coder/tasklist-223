const express = require('express');
const controller = require('../controllers/taskController');
const router = express.Router();
router.get('/', controller.showTasks);
router.get('/aufgaben/neu', controller.showNewTaskForm);
router.post('/aufgaben', controller.createTask);
router.post('/aufgaben/:id/erledigen', controller.completeTask);
router.post('/aufgaben/:id/loeschen', controller.deleteTask);
// Bestehende v1-Formulare mit Umlaut bleiben nutzbar.
router.post('/aufgaben/:id/l%C3%B6schen', controller.deleteTask);
router.post('/aufgaben/:id/zuweisen', controller.assignTask);
module.exports = router;
