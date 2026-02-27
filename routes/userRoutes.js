const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

// Routes publiques
router.post('/register', userController.register);
router.post('/login', userController.login);

// Routes protegees
router.get('/profile', authMiddleware, userController.getProfile);

module.exports = router;
