const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TimeSlot = sequelize.define('TimeSlot', {
    slot_id: {
      type: DataTypes.STRING(64),
      primaryKey: true
    },
    event_id: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    slot_name: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: '时间点名称（如"笔试"、"口试"）'
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '开始时间'
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '结束时间'
    },
    is_all_day: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 0,
      comment: '是否全天'
    },
    location: {
      type: DataTypes.STRING(256),
      allowNull: true,
      comment: '地点（可覆盖事件地点）'
    }
  }, {
    tableName: 'time_slot',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return TimeSlot;
};
