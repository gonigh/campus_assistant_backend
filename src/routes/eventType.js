const express = require('express');
const router = express.Router();
const eventTypeController = require('../controllers/eventTypeController');
const { authMiddleware } = require('../middlewares/auth');

// 所有事件类型路由都需要认证
router.use(authMiddleware);

// GET /api/event-types/tree - 获取类型树
router.get('/tree', eventTypeController.getTypeTree.bind(eventTypeController));

// GET /api/event-types - 获取所有类型（扁平列表）
router.get('/', eventTypeController.getTypes.bind(eventTypeController));

// GET /api/event-types/:id - 获取类型详情
router.get('/:id', eventTypeController.getTypeById.bind(eventTypeController));

// GET /api/event-types/:id/children - 获取子类型
router.get('/:id/children', eventTypeController.getChildren.bind(eventTypeController));

// POST /api/event-types - 创建类型
router.post('/', eventTypeController.createType.bind(eventTypeController));

// PUT /api/event-types/:id - 更新类型
router.put('/:id', eventTypeController.updateType.bind(eventTypeController));

// DELETE /api/event-types/:id - 删除类型
router.delete('/:id', eventTypeController.deleteType.bind(eventTypeController));

module.exports = router;
