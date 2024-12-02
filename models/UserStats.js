const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const UserStats = sequelize.define('UserStats', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  capturedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  exchangedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = UserStats;