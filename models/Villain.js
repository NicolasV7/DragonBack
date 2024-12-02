const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Villain = sequelize.define('Villain', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  characterId: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = Villain;