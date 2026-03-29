const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authMiddleware } = require('../middlewares/auth');

// 所有订阅路由都需要认证
router.use(authMiddleware);

// GET /api/subscriptions - 获取订阅列表
router.get('/', subscriptionController.getSubscriptions.bind(subscriptionController));

// GET /api/subscriptions/calendar - 获取日历视图
router.get('/calendar', subscriptionController.getCalendar.bind(subscriptionController));

// POST /api/subscriptions - 订阅时间点
router.post('/', subscriptionController.subscribe.bind(subscriptionController));

// DELETE /api/subscriptions/:id - 取消订阅
router.delete('/:id', subscriptionController.unsubscribe.bind(subscriptionController));

module.exports = router;
