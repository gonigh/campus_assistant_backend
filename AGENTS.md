# AGENTS.md

## 项目概述

校园事件通知与时间管理系统后端 API，采用 Express.js + Sequelize + MySQL + Redis 架构。

## 架构规范

### 分层结构
```
routes/    → 路由定义，调用 controller
controllers/ → 请求处理，调用 service
services/   → 业务逻辑，调用 model
models/    → 数据模型，数据库操作
```

### 路由挂载
- `/api/user` - 用户相关
- `/api/event-types` - 事件类型相关
- `/api/events` - 事件相关
- `/api/subscriptions` - 订阅相关

## 代码规范

### 1. API 响应格式
使用统一的 `ApiResponse` 工具类：
```javascript
const { ApiResponse } = require('../utils/response');

// 成功响应
res.json(ApiResponse.success(data));
res.json(ApiResponse.success(data, '操作成功'));

// 错误响应
res.json(ApiResponse.error(code, message));
```

### 2. 错误处理
- 在 controller 中捕获异常并传递给 `next(err)`
- 使用 `errorHandler` 中间件统一处理
- 服务层抛出错误时设置 `error.code` 和 `error.statusCode`

### 3. 认证中间件
除登录接口外，所有接口都需要 JWT 认证：
```javascript
router.use(authMiddleware);
```

### 4. 数据库模型关联
- 模型关联定义在 `src/models/index.js`
- **注意**: 关联定义不要重复（如 `EventType.hasMany` 已在其模型文件中定义，index.js 中不要再定义）

### 5. Swagger 文档
- 文档配置在 `src/config/swagger.js`
- **重要**: 添加新接口时必须同步更新 Swagger 文档
- 手动维护的文档，需要与实际代码保持一致

## 数据库

### MySQL
- 使用 Sequelize ORM
- 配置在 `src/config/index.js`
- 模型同步: 开发环境 `alter: false`，使用 `npm run init` 初始化数据

### Redis
- 用于缓存和会话管理
- 配置在 `src/config/index.js`

## 环境变量

必需的环境变量：
```env
MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB
REDIS_HOST, REDIS_PORT
WECHAT_APP_ID, WECHAT_APP_SECRET
SECRET_KEY
PORT, NODE_ENV
```

## 重要注意事项

### 1. 接口与文档一致性
添加或修改接口时，必须：
1. 在 `src/routes/*.js` 中定义路由
2. 在 `src/controllers/*Controller.js` 中实现控制器
3. 在 `src/services/*Service.js` 中实现业务逻辑
4. 在 `src/config/swagger.js` 中添加文档（手动维护）

### 2. 关联定义不要重复
Sequelize 关联（如 `hasMany`, `belongsTo`）在模型文件中定义一次即可，不要在 `models/index.js` 中重复定义，否则会报 `alias already used` 错误。

### 3. 开发模式
使用 `npm run dev` 启动，支持热重载。

## 常用命令

```bash
npm run dev    # 开发模式启动
npm start      # 生产模式启动
npm run init   # 初始化数据库和初始数据
npm test       # 运行测试
```
