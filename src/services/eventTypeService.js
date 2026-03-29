const { EventType, Event } = require('../models');
const { generateId } = require('../utils/uuid');
const { Op } = require('sequelize');

class EventTypeService {
  /**
   * 获取类型树（完整层级结构）
   * @returns {Promise<array>}
   */
  async getTypeTree() {
    // 获取所有顶级类型（parent_id 为 NULL）
    const rootTypes = await EventType.findAll({
      where: { parent_id: null },
      order: [['sort_order', 'ASC'], ['created_at', 'ASC']]
    });

    // 递归构建树形结构
    const buildTree = async (parent) => {
      const children = await EventType.findAll({
        where: { parent_id: parent.type_id },
        order: [['sort_order', 'ASC'], ['created_at', 'ASC']]
      });

      const tree = {
        type_id: parent.type_id,
        type_name: parent.type_name,
        type_code: parent.type_code,
        description: parent.description,
        icon: parent.icon,
        color: parent.color,
        sort_order: parent.sort_order,
        is_system: parent.is_system,
        children: []
      };

      for (const child of children) {
        tree.children.push(await buildTree(child));
      }

      return tree;
    };

    const tree = [];
    for (const root of rootTypes) {
      tree.push(await buildTree(root));
    }

    return tree;
  }

  /**
   * 获取所有类型（扁平列表）
   * @returns {Promise<array>}
   */
  async getTypes() {
    const types = await EventType.findAll({
      order: [['sort_order', 'ASC'], ['created_at', 'ASC']]
    });
    return types.map(t => this.formatType(t));
  }

  /**
   * 获取类型详情
   * @param {string} typeId - 类型ID
   * @returns {Promise<object>}
   */
  async getTypeById(typeId) {
    const type = await EventType.findByPk(typeId, {
      include: [
        { model: EventType, as: 'parent', attributes: ['type_id', 'type_name', 'type_code'] },
        { model: EventType, as: 'children', attributes: ['type_id', 'type_name', 'type_code'] }
      ]
    });

    if (!type) {
      const error = new Error('事件类型不存在');
      error.code = 2005;
      error.statusCode = 404;
      throw error;
    }

    return this.formatType(type, true);
  }

  /**
   * 获取子类型
   * @param {string} parentId - 父类型ID
   * @returns {Promise<array>}
   */
  async getChildren(parentId) {
    const parent = await EventType.findByPk(parentId);
    if (!parent) {
      const error = new Error('事件类型不存在');
      error.code = 2005;
      error.statusCode = 404;
      throw error;
    }

    const children = await EventType.findAll({
      where: { parent_id: parentId },
      order: [['sort_order', 'ASC'], ['created_at', 'ASC']]
    });

    return children.map(c => this.formatType(c));
  }

  /**
   * 创建类型
   * @param {object} data - 类型数据
   * @returns {Promise<object>}
   */
  async createType(data) {
    const { parent_id, type_name, type_code, description, icon, color, sort_order = 0 } = data;

    // 验证父类型（如果指定了父类型）
    if (parent_id) {
      const parent = await EventType.findByPk(parent_id);
      if (!parent) {
        const error = new Error('父类型不存在');
        error.code = 2005;
        error.statusCode = 400;
        throw error;
      }
    }

    // 检查类型编码是否已存在
    const existing = await EventType.findOne({ where: { type_code } });
    if (existing) {
      const error = new Error('类型编码已存在');
      error.code = 2005;
      error.statusCode = 400;
      throw error;
    }

    const type = await EventType.create({
      type_id: generateId('type'),
      parent_id: parent_id || null,
      type_name,
      type_code,
      description,
      icon,
      color,
      sort_order,
      is_system: 0
    });

    return this.formatType(type);
  }

  /**
   * 更新类型
   * @param {string} typeId - 类型ID
   * @param {object} data - 更新数据
   * @returns {Promise<object>}
   */
  async updateType(typeId, data) {
    const type = await EventType.findByPk(typeId);
    if (!type) {
      const error = new Error('事件类型不存在');
      error.code = 2005;
      error.statusCode = 404;
      throw error;
    }

    // 系统内置类型不允许修改编码
    if (type.is_system && data.type_code && data.type_code !== type.type_code) {
      const error = new Error('系统内置类型不允许修改编码');
      error.code = 403;
      error.statusCode = 403;
      throw error;
    }

    const { type_name, description, icon, color, sort_order } = data;

    if (type_name !== undefined) type.type_name = type_name;
    if (description !== undefined) type.description = description;
    if (icon !== undefined) type.icon = icon;
    if (color !== undefined) type.color = color;
    if (sort_order !== undefined) type.sort_order = sort_order;

    await type.save();
    return this.formatType(type);
  }

  /**
   * 删除类型
   * @param {string} typeId - 类型ID
   * @returns {Promise<void>}
   */
  async deleteType(typeId) {
    const type = await EventType.findByPk(typeId);
    if (!type) {
      const error = new Error('事件类型不存在');
      error.code = 2005;
      error.statusCode = 404;
      throw error;
    }

    // 检查是否有子类型
    const childCount = await EventType.count({ where: { parent_id: typeId } });
    if (childCount > 0) {
      const error = new Error('该类型下存在子类型，无法删除');
      error.code = 2005;
      error.statusCode = 400;
      throw error;
    }

    // 检查是否有关联事件
    const eventCount = await Event.count({ where: { type_id: typeId } });
    if (eventCount > 0) {
      const error = new Error('该类型下存在关联事件，无法删除');
      error.code = 2005;
      error.statusCode = 400;
      throw error;
    }

    await type.destroy();
  }

  /**
   * 格式化类型输出
   * @param {object} type - 类型实例
   * @param {boolean} includeRelations - 是否包含关联数据
   * @returns {object}
   */
  formatType(type, includeRelations = false) {
    const result = {
      type_id: type.type_id,
      parent_id: type.parent_id,
      type_name: type.type_name,
      type_code: type.type_code,
      description: type.description,
      icon: type.icon,
      color: type.color,
      sort_order: type.sort_order,
      is_system: type.is_system,
      created_at: type.created_at
    };

    if (includeRelations) {
      if (type.parent) {
        result.parent = {
          type_id: type.parent.type_id,
          type_name: type.parent.type_name,
          type_code: type.parent.type_code
        };
      }
      if (type.children) {
        result.children = type.children.map(c => ({
          type_id: c.type_id,
          type_name: c.type_name,
          type_code: c.type_code
        }));
      }
    }

    return result;
  }
}

module.exports = new EventTypeService();
