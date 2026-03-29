const { Subscription, TimeSlot, Event, EventType } = require('../models');
const { generateId } = require('../utils/uuid');
const { Op } = require('sequelize');

class SubscriptionService {
  /**
   * 获取用户订阅列表
   * @param {string} userId - 用户ID
   * @returns {Promise<array>}
   */
  async getSubscriptions(userId) {
    const subscriptions = await Subscription.findAll({
      where: { user_id: userId },
      include: [
        {
          model: TimeSlot,
          as: 'TimeSlot',
          include: [
            {
              model: Event,
              as: 'Event',
              include: [
                { model: EventType, as: 'EventType', attributes: ['type_id', 'type_name', 'type_code', 'icon', 'color'] }
              ]
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return subscriptions.map(sub => ({
      subscription_id: sub.subscription_id,
      created_at: sub.created_at,
      slot: sub.TimeSlot ? {
        slot_id: sub.TimeSlot.slot_id,
        slot_name: sub.TimeSlot.slot_name,
        start_time: sub.TimeSlot.start_time,
        end_time: sub.TimeSlot.end_time,
        is_all_day: sub.TimeSlot.is_all_day,
        location: sub.TimeSlot.location,
        event: sub.TimeSlot.Event ? {
          event_id: sub.TimeSlot.Event.event_id,
          title: sub.TimeSlot.Event.title,
          location: sub.TimeSlot.Event.location,
          type: sub.TimeSlot.Event.EventType ? {
            type_id: sub.TimeSlot.Event.EventType.type_id,
            type_name: sub.TimeSlot.Event.EventType.type_name,
            type_code: sub.TimeSlot.Event.EventType.type_code,
            icon: sub.TimeSlot.Event.EventType.icon,
            color: sub.TimeSlot.Event.EventType.color
          } : null
        } : null
      } : null
    }));
  }

  /**
   * 订阅时间点
   * @param {string} userId - 用户ID
   * @param {string} slotId - 时间点ID
   * @returns {Promise<object>}
   */
  async subscribe(userId, slotId) {
    // 验证时间点是否存在
    const timeSlot = await TimeSlot.findByPk(slotId, {
      include: [
        {
          model: Event,
          as: 'Event',
          where: { status: 1 }, // 只允许订阅已发布的事件
          required: false
        }
      ]
    });

    if (!timeSlot) {
      const error = new Error('时间点不存在');
      error.code = 2003;
      error.statusCode = 404;
      throw error;
    }

    if (!timeSlot.Event || timeSlot.Event.status !== 1) {
      const error = new Error('只能订阅已发布的事件');
      error.code = 2005;
      error.statusCode = 400;
      throw error;
    }

    // 检查是否已订阅
    const existing = await Subscription.findOne({
      where: { user_id: userId, slot_id: slotId }
    });

    if (existing) {
      const error = new Error('已经订阅过该时间点');
      error.code = 2007;
      error.statusCode = 400;
      throw error;
    }

    const subscription = await Subscription.create({
      subscription_id: generateId('sub'),
      user_id: userId,
      slot_id: slotId
    });

    return {
      subscription_id: subscription.subscription_id,
      slot_id: subscription.slot_id,
      created_at: subscription.created_at
    };
  }

  /**
   * 取消订阅
   * @param {string} subscriptionId - 订阅ID
   * @param {string} userId - 用户ID
   */
  async unsubscribe(subscriptionId, userId) {
    const subscription = await Subscription.findOne({
      where: { subscription_id: subscriptionId, user_id: userId }
    });

    if (!subscription) {
      const error = new Error('订阅不存在');
      error.code = 2004;
      error.statusCode = 404;
      throw error;
    }

    await subscription.destroy();
  }

  /**
   * 获取日历视图
   * @param {string} userId - 用户ID
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @returns {Promise<array>}
   */
  async getCalendar(userId, startDate, endDate) {
    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : new Date(start);
    end.setDate(end.getDate() + 30); // 默认显示30天

    // 获取用户订阅的时间点
    const subscriptions = await Subscription.findAll({
      where: { user_id: userId },
      attributes: ['slot_id']
    });
    const subscribedSlotIds = subscriptions.map(s => s.slot_id);

    const timeSlots = await TimeSlot.findAll({
      where: {
        slot_id: subscribedSlotIds,
        start_time: {
          [Op.gte]: start,
          [Op.lte]: end
        }
      },
      include: [
        {
          model: Event,
          as: 'Event',
          include: [
            { model: EventType, as: 'EventType', attributes: ['type_id', 'type_name', 'type_code', 'icon', 'color'] }
          ]
        }
      ],
      order: [['start_time', 'ASC']]
    });

    return timeSlots.map(ts => ({
      slot_id: ts.slot_id,
      slot_name: ts.slot_name,
      start_time: ts.start_time,
      end_time: ts.end_time,
      is_all_day: ts.is_all_day,
      location: ts.location || (ts.Event ? ts.Event.location : null),
      event: ts.Event ? {
        event_id: ts.Event.event_id,
        title: ts.Event.title,
        content: ts.Event.content,
        type: ts.Event.EventType ? {
          type_id: ts.Event.EventType.type_id,
          type_name: ts.Event.EventType.type_name,
          type_code: ts.Event.EventType.type_code,
          icon: ts.Event.EventType.icon,
          color: ts.Event.EventType.color
        } : null
      } : null
    }));
  }
}

module.exports = new SubscriptionService();
