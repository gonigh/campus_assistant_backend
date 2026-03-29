const express = require('express');
const router = express.Router();

const userRoutes = require('./user');
const eventRoutes = require('./event');
const eventTypeRoutes = require('./eventType');
const subscriptionRoutes = require('./subscription');

// 挂载路由
router.use('/user', userRoutes);
router.use('/event-types', eventTypeRoutes);
router.use('/events', eventRoutes);
router.use('/subscriptions', subscriptionRoutes);

// 健康检查
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
