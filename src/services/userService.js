const { User, Subscription, EventType } = require('../models');
const { generateId } = require('../utils/uuid');
const { generateToken } = require('../middlewares/auth');

class UserService {
  /**
   * 微信登录
   * @param {string} code - 微信授权码
   * @returns {Promise<object>}
   */
  async login(code) {
    // 通过code获取openId
    const openId = await this.getOpenIdByCode(code);

    // 查找或创建用户
    let user = await User.findOne({ where: { open_id: openId } });

    if (!user) {
      // 创建新用户
      user = await User.create({
        user_id: generateId('user'),
        open_id: openId,
        default_reminder_minutes: 30
      });

      // 自动订阅全部8个系统频道
      const systemTypes = await EventType.findAll({
        where: { is_system: 1 }
      });

      for (const type of systemTypes) {
        await Subscription.create({
          subscription_id: generateId('sub'),
          user_id: user.user_id,
          type_id: type.type_id,
          is_enabled: 1
        });
      }
    }

    // 生成token
    const token = generateToken({
      user_id: user.user_id,
      open_id: user.open_id
    });

    return {
      user: {
        user_id: user.user_id,
        nickname: user.nickname,
        avatar: user.avatar,
        default_reminder_minutes: user.default_reminder_minutes
      },
      token
    };
  }

  /**
   * 通过code获取openId
   * @param {string} code - 微信授权码
   * @returns {Promise<string>}
   */
  async getOpenIdByCode(code) {
    const axios = require('axios');
    const config = require('../config');

    try {
      const response = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
        params: {
          appid: config.wechat.appId,
          secret: config.wechat.appSecret,
          js_code: code,
          grant_type: 'authorization_code'
        }
      });

      if (response.data.errcode) {
        throw new Error(response.data.errmsg || '微信API调用失败');
      }

      return response.data.openid;
    } catch (err) {
      console.error('获取openId失败:', err);
      throw new Error('微信授权失败');
    }
  }

  /**
   * 获取用户信息
   * @param {string} userId - 用户ID
   * @returns {Promise<object>}
   */
  async getUserInfo(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error('用户不存在');
      error.code = 2001;
      error.statusCode = 404;
      throw error;
    }

    return {
      user_id: user.user_id,
      nickname: user.nickname,
      avatar: user.avatar,
      default_reminder_minutes: user.default_reminder_minutes,
      created_at: user.created_at
    };
  }

  /**
   * 更新用户信息
   * @param {string} userId - 用户ID
   * @param {object} data - 更新数据
   * @returns {Promise<object>}
   */
  async updateUserInfo(userId, data) {
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error('用户不存在');
      error.code = 2001;
      error.statusCode = 404;
      throw error;
    }

    const { nickname, avatar, default_reminder_minutes } = data;

    if (nickname !== undefined) user.nickname = nickname;
    if (avatar !== undefined) user.avatar = avatar;
    if (default_reminder_minutes !== undefined) {
      user.default_reminder_minutes = default_reminder_minutes;
    }

    await user.save();

    return {
      user_id: user.user_id,
      nickname: user.nickname,
      avatar: user.avatar,
      default_reminder_minutes: user.default_reminder_minutes
    };
  }
}

module.exports = new UserService();
