const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authMiddleware } = require('../middlewares/auth');

// 所有事件路由都需要认证
router.use(authMiddleware);

// ========== 事件路由 ==========

// GET /api/events - 获取事件列表
router.get('/', eventController.getEvents.bind(eventController));

// GET /api/events/today - 获取今日事件（按时间点）
router.get('/today', eventController.getTodayEvents.bind(eventController));

// GET /api/events/upcoming - 获取未来7天事件
router.get('/upcoming', eventController.getUpcomingEvents.bind(eventController));

// GET /api/events/:id - 获取事件详情
router.get('/:id', eventController.getEventById.bind(eventController));

// POST /api/events - 创建事件
router.post('/', eventController.createEvent.bind(eventController));

// PUT /api/events/:id - 更新事件
router.put('/:id', eventController.updateEvent.bind(eventController));

// DELETE /api/events/:id - 删除事件
router.delete('/:id', eventController.deleteEvent.bind(eventController));

// POST /api/events/:id/publish - 发布事件
router.post('/:id/publish', eventController.publishEvent.bind(eventController));

// POST /api/events/:id/cancel - 取消事件
router.post('/:id/cancel', eventController.cancelEvent.bind(eventController));

// ========== 时间点路由（嵌套在事件下）==========

// POST /api/events/:eventId/time-slots - 添加时间点
router.post('/:eventId/time-slots', eventController.addTimeSlot.bind(eventController));

// PUT /api/events/:eventId/time-slots/:slotId - 更新时间点
router.put('/:eventId/time-slots/:slotId', eventController.updateTimeSlot.bind(eventController));

// DELETE /api/events/:eventId/time-slots/:slotId - 删除时间点
router.delete('/:eventId/time-slots/:slotId', eventController.deleteTimeSlot.bind(eventController));

module.exports = router;
