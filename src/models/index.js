const { Sequelize } = require('sequelize');
const config = require('../config');

// 创建Sequelize实例
const sequelize = new Sequelize(
  config.database.database,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    logging: config.database.logging,
    pool: config.database.pool,
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

// 模型
const User = require('./user')(sequelize);
const EventType = require('./eventType')(sequelize);
const Event = require('./event')(sequelize);
const TimeSlot = require('./timeSlot')(sequelize);
const Subscription = require('./subscription')(sequelize);

// 定义关联关系

// EventType 与 Event（一对多）
EventType.hasMany(Event, { foreignKey: 'type_id', sourceKey: 'type_id' });
Event.belongsTo(EventType, { foreignKey: 'type_id', targetKey: 'type_id' });

// User 与 Event（一对多）
User.hasMany(Event, { foreignKey: 'user_id', sourceKey: 'user_id' });
Event.belongsTo(User, { foreignKey: 'user_id', targetKey: 'user_id' });

// Event 与 TimeSlot（一对多）
Event.hasMany(TimeSlot, { foreignKey: 'event_id', sourceKey: 'event_id', as: 'timeSlots' });
TimeSlot.belongsTo(Event, { foreignKey: 'event_id', targetKey: 'event_id' });

// User 与 Subscription（一对多）
User.hasMany(Subscription, { foreignKey: 'user_id', sourceKey: 'user_id' });
Subscription.belongsTo(User, { foreignKey: 'user_id', targetKey: 'user_id' });

// TimeSlot 与 Subscription（一对多）
TimeSlot.hasMany(Subscription, { foreignKey: 'slot_id', sourceKey: 'slot_id', as: 'subscriptions' });
Subscription.belongsTo(TimeSlot, { foreignKey: 'slot_id', targetKey: 'slot_id' });

module.exports = {
  sequelize,
  User,
  EventType,
  Event,
  TimeSlot,
  Subscription
};
