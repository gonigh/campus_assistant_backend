const eventService = require('../services/eventService');
const { ApiResponse } = require('../utils/response');

class EventController {
  /**
   * 获取事件列表
   * GET /api/events
   */
  async getEvents(req, res, next) {
    try {
      const result = await eventService.getEvents(req.query);
      res.json(ApiResponse.success(result));
    } catch (err) {
      next(err);
    }
  }

  /**
   * 获取事件详情
   * GET /api/events/:id
   */
  async getEventById(req, res, next) {
    try {
      const event = await eventService.getEventById(req.params.id);
      res.json(ApiResponse.success(event));
    } catch (err) {
      next(err);
    }
  }

  /**
   * 创建事件
   * POST /api/events
   */
  async createEvent(req, res, next) {
    try {
      const event = await eventService.createEvent(req.body, req.user.user_id);
      res.json(ApiResponse.success(event, '事件创建成功'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * 更新事件
   * PUT /api/events/:id
   */
  async updateEvent(req, res, next) {
    try {
      const event = await eventService.updateEvent(req.params.id, req.body, req.user.user_id);
      res.json(ApiResponse.success(event, '事件更新成功'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * 删除事件
   * DELETE /api/events/:id
   */
  async deleteEvent(req, res, next) {
    try {
      await eventService.deleteEvent(req.params.id, req.user.user_id);
      res.json(ApiResponse.success(null, '事件删除成功'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * 发布事件
   * POST /api/events/:id/publish
   */
  async publishEvent(req, res, next) {
    try {
      const event = await eventService.publishEvent(req.params.id, req.user.user_id);
      res.json(ApiResponse.success(event, '事件发布成功'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * 取消事件
   * POST /api/events/:id/cancel
   */
  async cancelEvent(req, res, next) {
    try {
      const event = await eventService.cancelEvent(req.params.id, req.user.user_id);
      res.json(ApiResponse.success(event, '事件已取消'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * 添加时间点
   * POST /api/events/:eventId/time-slots
   */
  async addTimeSlot(req, res, next) {
    try {
      const slot = await eventService.addTimeSlot(req.params.eventId, req.body, req.user.user_id);
      res.json(ApiResponse.success(slot, '时间点添加成功'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * 更新时间点
   * PUT /api/events/:eventId/time-slots/:slotId
   */
  async updateTimeSlot(req, res, next) {
    try {
      const slot = await eventService.updateTimeSlot(
        req.params.eventId,
        req.params.slotId,
        req.body,
        req.user.user_id
      );
      res.json(ApiResponse.success(slot, '时间点更新成功'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * 删除时间点
   * DELETE /api/events/:eventId/time-slots/:slotId
   */
  async deleteTimeSlot(req, res, next) {
    try {
      await eventService.deleteTimeSlot(
        req.params.eventId,
        req.params.slotId,
        req.user.user_id
      );
      res.json(ApiResponse.success(null, '时间点删除成功'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * 获取今日事件
   * GET /api/events/today
   */
  async getTodayEvents(req, res, next) {
    try {
      const events = await eventService.getTodayEvents(req.user.user_id);
      res.json(ApiResponse.success(events));
    } catch (err) {
      next(err);
    }
  }

  /**
   * 获取未来7天事件
   * GET /api/events/upcoming
   */
  async getUpcomingEvents(req, res, next) {
    try {
      const events = await eventService.getUpcomingEvents(req.user.user_id);
      res.json(ApiResponse.success(events));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new EventController();
