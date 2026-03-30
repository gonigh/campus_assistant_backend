const express = require('express');
const router = express.Router();
const eventTypeController = require('../controllers/eventTypeController');
const { authMiddleware } = require('../middlewares/auth');

// ========== 公开读取路由（无需鉴权）==========

// GET /api/event-types/tree - 获取类型树
router.get('/tree', eventTypeController.getTypeTree.bind(eventTypeController));

// GET /api/event-types - 获取所有类型（扁平列表）
router.get('/', eventTypeController.getTypes.bind(eventTypeController));

// GET /api/event-types/:id - 获取类型详情
router.get('/:id', eventTypeController.getTypeById.bind(eventTypeController));

// GET /api/event-types/:id/children - 获取子类型
router.get('/:id/children', eventTypeController.getChildren.bind(eventTypeController));

// ========== 需要鉴权的路由 ==========

// POST /api/event-types - 创建类型
router.post('/', authMiddleware, eventTypeController.createType.bind(eventTypeController));

// PUT /api/event-types/:id - 更新类型
router.put('/:id', authMiddleware, eventTypeController.updateType.bind(eventTypeController));

// DELETE /api/event-types/:id - 删除类型
router.delete('/:id', authMiddleware, eventTypeController.deleteType.bind(eventTypeController));

module.exports = router;
