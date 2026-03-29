const userService = require('../services/userService');
const { ApiResponse } = require('../utils/response');

class UserController {
  /**
   * 微信登录
   * POST /api/user/login
   */
  async login(req, res, next) {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json(ApiResponse.error(1, '缺少code参数'));
      }

      const result = await userService.login(code);
      res.json(ApiResponse.success(result));
    } catch (err) {
      next(err);
    }
  }

  /**
   * 获取用户信息
   * GET /api/user/info
   */
  async getUserInfo(req, res, next) {
    try {
      const user = await userService.getUserInfo(req.user.user_id);
      res.json(ApiResponse.success(user));
    } catch (err) {
      next(err);
    }
  }

  /**
   * 更新用户信息
   * POST /api/user/update
   */
  async updateUserInfo(req, res, next) {
    try {
      const { nickname, avatar, default_reminder_minutes } = req.body;
      const user = await userService.updateUserInfo(req.user.user_id, {
        nickname,
        avatar,
        default_reminder_minutes
      });
      res.json(ApiResponse.success(user));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
