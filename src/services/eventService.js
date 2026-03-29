const { Event, EventType, TimeSlot, Subscription, User } = require('../models');
const { generateId } = require('../utils/uuid');
const { Op } = require('sequelize');

class EventService {
  /**
   * 获取事件列表
   * @param {object} params - 查询参数
   * @returns {Promise<object>}
   */
  async getEvents(params = {}) {
    const {
      type_id,
      status = 1,
      start_date,
      end_date,
      page = 1,
      pageSize = 10,
      keyword
    } = params;

    const where = {};

    if (type_id) where.type_id = type_id;
    if (status !== undefined) where.status = status;

    if (keyword) {
      where.title = { [Op.like]: `%${keyword}%` };
    }

    const { count, rows } = await Event.findAndCountAll({
      where,
      include: [
        { model: EventType, as: 'EventType', attributes: ['type_id', 'type_name', 'type_code', 'icon', 'color'] },
        { model: User, as: 'User', attributes: ['user_id', 'nickname', 'avatar'] }
      ],
      order: [['created_at', 'DESC']],
      limit: Number(pageSize),
      offset: (Number(page) - 1) * Number(pageSize)
    });

    // 获取每个事件的时间点
    const list = await Promise.all(rows.map(async (event) => {
      const timeSlots = await TimeSlot.findAll({
        where: { event_id: event.event_id },
        order: [['start_time', 'ASC']]
      });

      return {
        event_id: event.event_id,
        title: event.title,
        content: event.content,
        location: event.location,
        status: event.status,
        published_at: event.published_at,
        created_at: event.created_at,
        type: event.EventType ? {
          type_id: event.EventType.type_id,
          type_name: event.EventType.type_name,
          type_code: event.EventType.type_code,
          icon: event.EventType.icon,
          color: event.EventType.color
        } : null,
        creator: event.User ? {
          user_id: event.User.user_id,
          nickname: event.User.nickname,
          avatar: event.User.avatar
        } : null,
        time_slots: timeSlots.map(ts => this.formatTimeSlot(ts))
      };
    }));

    return { list, total: count, page: Number(page), pageSize: Number(pageSize) };
  }

  /**
   * 获取事件详情
   * @param {string} eventId - 事件ID
   * @returns {Promise<object>}
   */
  async getEventById(eventId) {
    const event = await Event.findByPk(eventId, {
      include: [
        { model: EventType, as: 'EventType', attributes: ['type_id', 'type_name', 'type_code', 'icon', 'color'] },
        { model: User, as: 'User', attributes: ['user_id', 'nickname', 'avatar'] }
      ]
    });

    if (!event) {
      const error = new Error('事件不存在');
      error.code = 2003;
      error.statusCode = 404;
      throw error;
    }

    // 获取时间点
    const timeSlots = await TimeSlot.findAll({
      where: { event_id: eventId },
      order: [['start_time', 'ASC']]
    });

    return {
      event_id: event.event_id,
      title: event.title,
      content: event.content,
      location: event.location,
      status: event.status,
      published_at: event.published_at,
      created_at: event.created_at,
      updated_at: event.updated_at,
      type: event.EventType ? {
        type_id: event.EventType.type_id,
        type_name: event.EventType.type_name,
        type_code: event.EventType.type_code,
        icon: event.EventType.icon,
        color: event.EventType.color
      } : null,
      creator: event.User ? {
        user_id: event.User.user_id,
        nickname: event.User.nickname,
        avatar: event.User.avatar
      } : null,
      time_slots: timeSlots.map(ts => this.formatTimeSlot(ts))
    };
  }

  /**
   * 创建事件
   * @param {object} data - 事件数据
   * @param {string} userId - 创建者ID
   * @returns {Promise<object>}
   */
  async createEvent(data, userId) {
    const { type_id, title, content, location, time_slots = [] } = data;

    // 验证事件类型
    const eventType = await EventType.findByPk(type_id);
    if (!eventType) {
      const error = new Error('事件类型不存在');
      error.code = 2005;
      error.statusCode = 400;
      throw error;
    }

    // 验证权限：普通用户只能创建 custom 类型
    if (eventType.type_code !== 'custom' && eventType.is_system === 1) {
      const error = new Error('无权创建该类型事件');
      error.code = 403;
      error.statusCode = 403;
      throw error;
    }

    // 创建事件
    const event = await Event.create({
      event_id: generateId('event'),
      type_id,
      user_id: userId,
      title,
      content,
      location,
      status: 0 // 草稿
    });

    // 创建时间点
    for (const slot of time_slots) {
      await TimeSlot.create({
        slot_id: generateId('slot'),
        event_id: event.event_id,
        slot_name: slot.slot_name,
        start_time: new Date(slot.start_time),
        end_time: slot.end_time ? new Date(slot.end_time) : null,
        is_all_day: slot.is_all_day || 0,
        location: slot.location || null
      });
    }

    return this.getEventById(event.event_id);
  }

  /**
   * 更新事件
   * @param {string} eventId - 事件ID
   * @param {object} data - 更新数据
   * @param {string} userId - 操作者ID
   * @returns {Promise<object>}
   */
  async updateEvent(eventId, data, userId) {
    const event = await Event.findByPk(eventId);
    if (!event) {
      const error = new Error('事件不存在');
      error.code = 2003;
      error.statusCode = 404;
      throw error;
    }

    // 检查权限
    if (event.user_id !== userId) {
      const error = new Error('无权编辑该事件');
      error.code = 403;
      error.statusCode = 403;
      throw error;
    }

    const { title, content, location, status } = data;

    if (title !== undefined) event.title = title;
    if (content !== undefined) event.content = content;
    if (location !== undefined) event.location = location;
    if (status !== undefined) event.status = status;

    await event.save();
    return this.getEventById(event.event_id);
  }

  /**
   * 删除事件（会级联删除时间点）
   * @param {string} eventId - 事件ID
   * @param {string} userId - 操作者ID
   */
  async deleteEvent(eventId, userId) {
    const event = await Event.findByPk(eventId);
    if (!event) {
      const error = new Error('事件不存在');
      error.code = 2003;
      error.statusCode = 404;
      throw error;
    }

    if (event.user_id !== userId) {
      const error = new Error('无权删除该事件');
      error.code = 403;
      error.statusCode = 403;
      throw error;
    }

    await event.destroy(); // 级联删除时间点
  }

  /**
   * 发布事件
   * @param {string} eventId - 事件ID
   * @param {string} userId - 操作者ID
   * @returns {Promise<object>}
   */
  async publishEvent(eventId, userId) {
    const event = await Event.findByPk(eventId);
    if (!event) {
      const error = new Error('事件不存在');
      error.code = 2003;
      error.statusCode = 404;
      throw error;
    }

    if (event.user_id !== userId) {
      const error = new Error('无权发布该事件');
      error.code = 403;
      error.statusCode = 403;
      throw error;
    }

    event.status = 1;
    event.published_at = new Date();
    await event.save();

    return this.getEventById(event.event_id);
  }

  /**
   * 取消事件
   * @param {string} eventId - 事件ID
   * @param {string} userId - 操作者ID
   * @returns {Promise<object>}
   */
  async cancelEvent(eventId, userId) {
    const event = await Event.findByPk(eventId);
    if (!event) {
      const error = new Error('事件不存在');
      error.code = 2003;
      error.statusCode = 404;
      throw error;
    }

    if (event.user_id !== userId) {
      const error = new Error('无权取消该事件');
      error.code = 403;
      error.statusCode = 403;
      throw error;
    }

    event.status = 2;
    await event.save();

    return this.getEventById(event.event_id);
  }

  /**
   * 添加时间点
   * @param {string} eventId - 事件ID
   * @param {object} data - 时间点数据
   * @param {string} userId - 操作者ID
   * @returns {Promise<object>}
   */
  async addTimeSlot(eventId, data, userId) {
    const event = await Event.findByPk(eventId);
    if (!event) {
      const error = new Error('事件不存在');
      error.code = 2003;
      error.statusCode = 404;
      throw error;
    }

    if (event.user_id !== userId) {
      const error = new Error('无权管理该事件');
      error.code = 403;
      error.statusCode = 403;
      throw error;
    }

    const { slot_name, start_time, end_time, is_all_day = 0, location } = data;

    const slot = await TimeSlot.create({
      slot_id: generateId('slot'),
      event_id: eventId,
      slot_name,
      start_time: new Date(start_time),
      end_time: end_time ? new Date(end_time) : null,
      is_all_day,
      location: location || event.location // 继承事件地点
    });

    return this.formatTimeSlot(slot);
  }

  /**
   * 更新时间点
   * @param {string} eventId - 事件ID
   * @param {string} slotId - 时间点ID
   * @param {object} data - 更新数据
   * @param {string} userId - 操作者ID
   * @returns {Promise<object>}
   */
  async updateTimeSlot(eventId, slotId, data, userId) {
    const event = await Event.findByPk(eventId);
    if (!event) {
      const error = new Error('事件不存在');
      error.code = 2003;
      error.statusCode = 404;
      throw error;
    }

    if (event.user_id !== userId) {
      const error = new Error('无权管理该事件');
      error.code = 403;
      error.statusCode = 403;
      throw error;
    }

    const slot = await TimeSlot.findOne({ where: { slot_id: slotId, event_id: eventId } });
    if (!slot) {
      const error = new Error('时间点不存在');
      error.code = 2003;
      error.statusCode = 404;
      throw error;
    }

    const { slot_name, start_time, end_time, is_all_day, location } = data;

    if (slot_name !== undefined) slot.slot_name = slot_name;
    if (start_time !== undefined) slot.start_time = new Date(start_time);
    if (end_time !== undefined) slot.end_time = end_time ? new Date(end_time) : null;
    if (is_all_day !== undefined) slot.is_all_day = is_all_day;
    if (location !== undefined) slot.location = location;

    await slot.save();
    return this.formatTimeSlot(slot);
  }

  /**
   * 删除时间点
   * @param {string} eventId - 事件ID
   * @param {string} slotId - 时间点ID
   * @param {string} userId - 操作者ID
   */
  async deleteTimeSlot(eventId, slotId, userId) {
    const event = await Event.findByPk(eventId);
    if (!event) {
      const error = new Error('事件不存在');
      error.code = 2003;
      error.statusCode = 404;
      throw error;
    }

    if (event.user_id !== userId) {
      const error = new Error('无权管理该事件');
      error.code = 403;
      error.statusCode = 403;
      throw error;
    }

    const slot = await TimeSlot.findOne({ where: { slot_id: slotId, event_id: eventId } });
    if (!slot) {
      const error = new Error('时间点不存在');
      error.code = 2003;
      error.statusCode = 404;
      throw error;
    }

    await slot.destroy();
  }

  /**
   * 获取今日事件（按时间点筛选）
   * @param {string} userId - 用户ID
   * @returns {Promise<array>}
   */
  async getTodayEvents(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

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
          [Op.gte]: today,
          [Op.lt]: tomorrow
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
      location: ts.location,
      event: ts.Event ? {
        event_id: ts.Event.event_id,
        title: ts.Event.title,
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

  /**
   * 获取未来7天事件
   * @param {string} userId - 用户ID
   * @returns {Promise<object>}
   */
  async getUpcomingEvents(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const subscriptions = await Subscription.findAll({
      where: { user_id: userId },
      attributes: ['slot_id']
    });
    const subscribedSlotIds = subscriptions.map(s => s.slot_id);

    const timeSlots = await TimeSlot.findAll({
      where: {
        slot_id: subscribedSlotIds,
        start_time: {
          [Op.gte]: today,
          [Op.lt]: nextWeek
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

    // 按日期分组
    const grouped = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      grouped[dateStr] = [];
    }

    timeSlots.forEach(ts => {
      const dateStr = ts.start_time.toISOString().split('T')[0];
      if (grouped[dateStr]) {
        grouped[dateStr].push({
          slot_id: ts.slot_id,
          slot_name: ts.slot_name,
          start_time: ts.start_time,
          end_time: ts.end_time,
          is_all_day: ts.is_all_day,
          location: ts.location,
          event: ts.Event ? {
            event_id: ts.Event.event_id,
            title: ts.Event.title,
            type: ts.Event.EventType ? {
              type_id: ts.Event.EventType.type_id,
              type_name: ts.Event.EventType.type_name,
              type_code: ts.Event.EventType.type_code,
              icon: ts.Event.EventType.icon,
              color: ts.Event.EventType.color
            } : null
          } : null
        });
      }
    });

    return Object.entries(grouped).map(([date, list]) => ({
      date,
      count: list.length,
      events: list
    }));
  }

  /**
   * 格式化时间点输出
   * @param {object} slot - 时间点实例
   * @returns {object}
   */
  formatTimeSlot(slot) {
    return {
      slot_id: slot.slot_id,
      event_id: slot.event_id,
      slot_name: slot.slot_name,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_all_day: slot.is_all_day,
      location: slot.location,
      created_at: slot.created_at
    };
  }
}

module.exports = new EventService();
