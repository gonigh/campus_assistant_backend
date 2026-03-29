const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middlewares/auth');

// POST /api/user/login - 微信授权登录
router.post('/login', userController.login.bind(userController));

// GET /api/user/info - 获取用户信息
router.get('/info', authMiddleware, userController.getUserInfo.bind(userController));

// POST /api/user/update - 更新用户信息
router.post('/update', authMiddleware, userController.updateUserInfo.bind(userController));

module.exports = router;
