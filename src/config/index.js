require('dotenv').config();

module.exports = {
  // 项目配置
  project: {
    name: process.env.PROJECT_NAME || '校园助手 API',
    version: process.env.VERSION || '1.0.0'
  },

  // 数据库配置
  database: {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DB || 'campus_event',
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },

  // Redis配置
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined
  },

  // 微信配置
  wechat: {
    appId: process.env.WECHAT_APP_ID || '',
    appSecret: process.env.WECHAT_APP_SECRET || ''
  },

  // JWT配置
  jwt: {
    secret: process.env.SECRET_KEY || 'campus_secret_key',
    expiresIn: '7d'
  },

  // AI Agent配置
  agent: {
    // AI服务提供商：deepseek
    provider: 'deepseek',
    // DeepSeek配置
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY || '',
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      maxTokens: 4096
    }
  },

  // 预设提醒时间点（分钟）
  reminderPresets: [15, 30, 60, 120, 1440, 2880, 4320],

  // 服务器配置
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  }
};
