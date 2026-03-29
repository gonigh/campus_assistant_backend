const eventTypeService = require('../services/eventTypeService');
const { ApiResponse } = require('../utils/response');

class EventTypeController {
  /**
   * 获取类型树
   * GET /api/event-types/tree
   */
  async getTypeTree(req, res, next) {
    try {
      const tree = await eventTypeService.getTypeTree();
      res.json(ApiResponse.success(tree));
    } catch (err) {
      next(err);
    }
  }

  /**
   * 获取所有类型（扁平列表）
   * GET /api/event-types
   */
  async getTypes(req, res, next) {
    try {
      const types = await eventTypeService.getTypes();
      res.json(ApiResponse.success(types));
    } catch (err) {
      next(err);
    }
  }

  /**
   * 获取类型详情
   * GET /api/event-types/:id
   */
  async getTypeById(req, res, next) {
    try {
      const type = await eventTypeService.getTypeById(req.params.id);
      res.json(ApiResponse.success(type));
    } catch (err) {
      next(err);
    }
  }

  /**
   * 获取子类型
   * GET /api/event-types/:id/children
   */
  async getChildren(req, res, next) {
    try {
      const children = await eventTypeService.getChildren(req.params.id);
      res.json(ApiResponse.success(children));
    } catch (err) {
      next(err);
    }
  }

  /**
   * 创建类型
   * POST /api/event-types
   */
  async createType(req, res, next) {
    try {
      const type = await eventTypeService.createType(req.body);
      res.json(ApiResponse.success(type, '类型创建成功'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * 更新类型
   * PUT /api/event-types/:id
   */
  async updateType(req, res, next) {
    try {
      const type = await eventTypeService.updateType(req.params.id, req.body);
      res.json(ApiResponse.success(type, '类型更新成功'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * 删除类型
   * DELETE /api/event-types/:id
   */
  async deleteType(req, res, next) {
    try {
      await eventTypeService.deleteType(req.params.id);
      res.json(ApiResponse.success(null, '类型删除成功'));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new EventTypeController();
