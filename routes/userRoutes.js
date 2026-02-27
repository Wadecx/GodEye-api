const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const { adminOnly } = require('../middlewares/quotaMiddleware');

// Routes publiques
router.post('/register', userController.register);
router.post('/login', userController.login);

// Routes protegees
router.get('/profile', authMiddleware, userController.getProfile);
router.get('/quota', authMiddleware, userController.getQuota);

// Routes admin
router.put('/admin/role/:userId', authMiddleware, adminOnly, userController.updateUserRole);
router.put('/admin/quota/:userId', authMiddleware, adminOnly, userController.updateUserQuota);

module.exports = router;
