const subscriptionService = require('../services/subscriptionService');
const { ApiResponse } = require('../utils/response');

class SubscriptionController {
  /**
   * 获取订阅列表
   * GET /api/subscriptions
   */
  async getSubscriptions(req, res, next) {
    try {
      const subscriptions = await subscriptionService.getSubscriptions(req.user.user_id);
      res.json(ApiResponse.success(subscriptions));
    } catch (err) {
      next(err);
    }
  }

  /**
   * 订阅时间点
   * POST /api/subscriptions
   */
  async subscribe(req, res, next) {
    try {
      const { slot_id } = req.body;
      if (!slot_id) {
        return res.status(400).json(ApiResponse.error(1, '缺少必要参数'));
      }

      const result = await subscriptionService.subscribe(req.user.user_id, slot_id);
      res.json(ApiResponse.success(result, '订阅成功'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * 取消订阅
   * DELETE /api/subscriptions/:id
   */
  async unsubscribe(req, res, next) {
    try {
      await subscriptionService.unsubscribe(req.params.id, req.user.user_id);
      res.json(ApiResponse.success(null, '取消订阅成功'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * 获取日历视图
   * GET /api/subscriptions/calendar
   */
  async getCalendar(req, res, next) {
    try {
      const { start_date, end_date } = req.query;
      const calendar = await subscriptionService.getCalendar(
        req.user.user_id,
        start_date,
        end_date
      );
      res.json(ApiResponse.success(calendar));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SubscriptionController();
