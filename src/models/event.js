const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Event = sequelize.define('Event', {
    event_id: {
      type: DataTypes.STRING(64),
      primaryKey: true
    },
    type_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: '事件类型ID'
    },
    user_id: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: '创建者ID（系统事件为NULL）'
    },
    title: {
      type: DataTypes.STRING(128),
      allowNull: false,
      comment: '标题'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '正文内容'
    },
    location: {
      type: DataTypes.STRING(256),
      allowNull: true,
      comment: '地点'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '状态：0-草稿 1-已发布 2-已取消'
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '发布时间'
    }
  }, {
    tableName: 'event',
    timestamps: true
  });

  return Event;
};
