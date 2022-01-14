var Config, User;

var Sequelize = require('sequelize');

Config = require('./config');

sequelize = new Sequelize(Config.DB_NAME, Config.DB_USER, Config.DB_PASSWORD, {
  host: Config.DB_HOST,
  port: Config.DB_PORT,
  dialect: 'mysql',
  charset: 'utf8',
  dialectOptions: {
    charset: 'utf8',
    //   collate: 'utf8_general_ci'
  },
  timezone: '+08:00',
  logging: null
});

// 测试连接
sequelize.authenticate().then(() => {
  console.log('Connection has been established successfully.');
}).catch(err => {
  console.error('Unable to connect to the database:', err);
});

User = sequelize.define('user', {
  id: {
    type: Sequelize.STRING(32), // ladp 账号
    primaryKey: true,
    allowNull: false,
  },
  nickName: {
    type: Sequelize.STRING(50),
    defaultValue: ''
  },
  name: {
    type: Sequelize.STRING(50),
    defaultValue: ''
  },
  avatarUrl: {
    type: Sequelize.STRING(1000),
    defaultValue: ''
  },
  status: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0 // 0 未签到、 1 已签到
  }
});

module.exports = {
  sequelize,
  User
};