const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('railway', 'postgres', 'JJqRYQFBeTkaVEpUzWNdsWamWFutJPJD', {
  host: 'junction.proxy.rlwy.net',
  port: 57274,
  dialect: 'postgres',
});

module.exports = sequelize;