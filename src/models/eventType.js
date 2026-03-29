const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EventType = sequelize.define('EventType', {
    type_id: {
      type: DataTypes.STRING(64),
      primaryKey: true
    },
    parent_id: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: '父类型ID，NULL表示顶级'
    },
    type_name: {
      type: DataTypes.STRING(32),
      allowNull: false,
      comment: '类型名称'
    },
    type_code: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
      comment: '类型编码'
    },
    description: {
      type: DataTypes.STRING(256),
      allowNull: true,
      comment: '类型描述'
    },
    icon: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: '图标'
    },
    color: {
      type: DataTypes.STRING(8),
      allowNull: true,
      comment: '颜色（HEX）'
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '排序'
    },
    is_system: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 0,
      comment: '是否系统内置'
    }
  }, {
    tableName: 'event_type',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  // 自引用关联（层级结构）
  EventType.hasMany(EventType, {
    foreignKey: 'parent_id',
    sourceKey: 'type_id',
    as: 'children',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  });

  EventType.belongsTo(EventType, {
    foreignKey: 'parent_id',
    targetKey: 'type_id',
    as: 'parent',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  });

  return EventType;
};
