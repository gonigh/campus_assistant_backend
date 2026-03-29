const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    user_id: {
      type: DataTypes.STRING(64),
      primaryKey: true
    },
    open_id: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
      comment: '微信 openId'
    },
    nickname: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: '昵称'
    },
    avatar: {
      type: DataTypes.STRING(256),
      allowNull: true,
      comment: '头像 URL'
    }
  }, {
    tableName: 'user',
    timestamps: true
  });

  return User;
};
