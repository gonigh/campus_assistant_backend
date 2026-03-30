const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const { sequelize } = require('./models');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const cron = require('node-cron');
const crawlerService = require('./services/crawlerService');
const path = require('path');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));

// API 文档
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: '校园助手 API 文档'
}));

// 路由
app.use('/api', routes);

// 404处理
app.use(notFoundHandler);

// 错误处理
app.use(errorHandler);

// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 同步模型（开发环境）
    if (config.server.env === 'development') {
      await sequelize.sync({ alter: false });
      console.log('数据库模型同步完成');
    }

    // 启动服务器
    app.listen(config.server.port, async () => {
      console.log(`服务器启动成功: http://localhost:${config.server.port}`);

      // 启动时立即执行一次爬虫
      console.log('[Crawler] ========== 启动时执行爬虫 ==========');
      try {
        await crawlerService.run();
      } catch (error) {
        console.error('[Crawler] 启动时爬虫执行失败:', error);
      }

      // 启动爬虫定时任务
      // 每小时执行一次爬虫任务
      cron.schedule('0 * * * *', async () => {
        console.log('================= 定时爬虫任务触发 =================');
        try {
          await crawlerService.run();
        } catch (error) {
          console.error('[Crawler] 定时任务执行失败:', error);
        }
      });
      console.log('[Crawler] 爬虫定时任务已启动 (每小时的第0分钟执行)');
    });
  } catch (err) {
    console.error('服务器启动失败:', err);
    process.exit(1);
  }
}

startServer();

module.exports = app;
