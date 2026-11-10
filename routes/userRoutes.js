const express = require('express');
const controller = require('../controllers/userController');
const router = express.Router();
router.get('/registrieren', controller.showRegistration);
router.post('/registrieren', controller.register);
router.get('/benutzer', controller.showUsers);
router.post('/benutzer/:id/rolle', controller.changeRole);
module.exports = router;
