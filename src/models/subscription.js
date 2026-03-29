const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Subscription = sequelize.define('Subscription', {
    subscription_id: {
      type: DataTypes.STRING(64),
      primaryKey: true
    },
    user_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: '用户ID'
    },
    slot_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: '时间点ID'
    }
  }, {
    tableName: 'subscription',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return Subscription;
};
