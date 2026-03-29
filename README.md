# 校园事件通知与时间管理系统 - 后端

为大学生提供统一的事件通知与时间管理服务的后端 API。

## 技术栈

- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: MySQL + Sequelize ORM
- **缓存**: Redis
- **认证**: JWT (微信授权登录)
- **文档**: Swagger UI
- **任务调度**: node-cron

## 项目结构

```
src/
├── app.js              # 应用入口
├── config/             # 配置文件
│   ├── index.js        # 主配置
│   └── swagger.js     # API 文档配置
├── controllers/         # 控制器
├── routes/             # 路由
├── services/           # 业务逻辑
├── models/             # 数据模型
├── middlewares/        # 中间件
├── utils/              # 工具函数
└── config/
scripts/
├── initData.js         # 数据初始化
└── database.sql        # 数据库脚本
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
# 数据库
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DB=campus_event

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# 微信登录
WECHAT_APP_ID=your_app_id
WECHAT_APP_SECRET=your_app_secret

# JWT
SECRET_KEY=your_secret_key

# 服务器
PORT=3000
NODE_ENV=development
```

### 3. 初始化数据库

```bash
npm run init
```

### 4. 启动服务

```bash
# 开发模式（热重载）
npm run dev

# 生产模式
npm start
```

## API 文档

启动服务后访问: http://localhost:3000/api-docs

## 主要功能

### 用户模块
- 微信授权登录
- 获取/更新用户信息

### 事件类型模块
- 获取事件类型树（层级结构）
- 事件类型 CRUD
- 父子类型关联

### 事件模块
- 事件 CRUD
- 获取今日事件
- 获取未来7天事件
- 发布/取消事件
- 时间点管理

### 订阅模块
- 订阅/取消订阅事件类型
- 获取日历视图

## 接口列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/health | 健康检查 |
| POST | /api/user/login | 微信授权登录 |
| GET | /api/user/info | 获取用户信息 |
| POST | /api/user/update | 更新用户信息 |
| GET | /api/event-types/tree | 获取事件类型树 |
| GET | /api/event-types | 获取所有事件类型 |
| POST | /api/event-types | 创建事件类型 |
| GET | /api/event-types/:id | 获取类型详情 |
| PUT | /api/event-types/:id | 更新事件类型 |
| DELETE | /api/event-types/:id | 删除事件类型 |
| GET | /api/event-types/:id/children | 获取子类型 |
| GET | /api/events | 获取事件列表 |
| POST | /api/events | 创建事件 |
| GET | /api/events/today | 获取今日事件 |
| GET | /api/events/upcoming | 获取未来7天事件 |
| GET | /api/events/:id | 获取事件详情 |
| PUT | /api/events/:id | 更新事件 |
| DELETE | /api/events/:id | 删除事件 |
| GET | /api/subscriptions | 获取订阅列表 |
| POST | /api/subscriptions | 更新订阅状态 |
| GET | /api/subscriptions/calendar | 获取日历视图 |

## 数据模型

### User
用户表，存储用户基本信息。

### EventType
事件类型表，支持层级结构（父子关联）。

### Event
事件表，关联类型和创建者。

### TimeSlot
时间点表，一个事件可有多个时间点。

### Subscription
订阅表，记录用户对各事件类型的订阅状态。

## 测试

```bash
npm test
```

## License

ISC
