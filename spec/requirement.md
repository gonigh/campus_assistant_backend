# 校园助手后端系统需求文档

## 1. 项目概述

### 1.1 项目背景

基于微信小程序的大学生校园助手后端服务，为大学生提供统一的事件通知与时间管理服务。

### 1.2 核心概念

| 概念 | 说明 |
|------|------|
| 事件类型 (EventType) | 事件的分类，支持树形层级结构（如：课程 > 专业课、选修课） |
| 事件 (Event) | 校园内的具体事务，如"高等数学期中考试" |
| 时间点 (TimeSlot) | 一个事件可以有多个时间点，如"考试"可能有"笔试时间"和"口试时间" |
| 订阅 (Subscription) | 用户订阅某个时间点，将其加入日历待办 |

**核心逻辑：**
- 订阅 = 将时间点加入用户的日历待办
- 用户直接订阅感兴趣的时间点

---

## 2. 实体设计

### 2.1 用户 (User)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| user_id | VARCHAR(64) | PK | 唯一标识 |
| open_id | VARCHAR(128) | UNIQUE, NOT NULL | 微信 openId |
| nickname | VARCHAR(64) | | 昵称 |
| avatar | VARCHAR(256) | | 头像 URL |
| created_at | DATETIME | NOT NULL | 注册时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |

### 2.2 事件类型 (EventType)

支持树形层级结构，父类型可以包含子类型。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| type_id | VARCHAR(64) | PK | 唯一标识 |
| parent_id | VARCHAR(64) | FK(自身), NULL | 父类型ID，NULL表示顶级 |
| type_name | VARCHAR(32) | NOT NULL | 类型名称 |
| type_code | VARCHAR(32) | UNIQUE, NOT NULL | 类型编码 |
| description | VARCHAR(256) | | 类型描述 |
| icon | VARCHAR(64) | | 图标 |
| color | VARCHAR(8) | | 颜色（HEX） |
| sort_order | INT | NOT NULL, DEFAULT 0 | 排序 |
| is_system | TINYINT(1) | NOT NULL, DEFAULT 0 | 是否系统内置 |
| created_at | DATETIME | NOT NULL | 创建时间 |

**层级结构示例：**

```
事件类型树
├── 课程 (course)
│   ├── 专业课 (major_course)
│   ├── 选修课 (elective_course)
│   └── 公共课 (general_course)
├── 考试 (exam)
│   ├── 期中考试 (midterm)
│   └── 期末考试 (final)
├── 社团活动 (club)
│   ├── 文艺类 (art)
│   └── 体育类 (sports)
└── 讲座 (lecture)
```

### 2.3 事件 (Event)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| event_id | VARCHAR(64) | PK | 唯一标识 |
| type_id | VARCHAR(64) | FK | 事件类型ID |
| user_id | VARCHAR(64) | FK, NULL | 创建者ID（系统事件为NULL） |
| title | VARCHAR(128) | NOT NULL | 标题 |
| content | TEXT | | 正文内容 |
| location | VARCHAR(256) | | 地点 |
| status | TINYINT | NOT NULL, DEFAULT 0 | 状态：0-草稿 1-已发布 2-已取消 |
| published_at | DATETIME | | 发布时间 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |

### 2.4 时间点 (TimeSlot)

一个事件可以有多个时间点。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| slot_id | VARCHAR(64) | PK | 唯一标识 |
| event_id | VARCHAR(64) | FK | 事件ID |
| slot_name | VARCHAR(64) | NOT NULL | 时间点名称（如"笔试"、"口试"） |
| start_time | DATETIME | NOT NULL | 开始时间 |
| end_time | DATETIME | | 结束时间 |
| is_all_day | TINYINT(1) | NOT NULL, DEFAULT 0 | 是否全天 |
| location | VARCHAR(256) | | 地点（可覆盖事件地点） |
| created_at | DATETIME | NOT NULL | 创建时间 |

### 2.5 订阅 (Subscription)

用户订阅时间点，将时间点加入日历待办。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| subscription_id | VARCHAR(64) | PK | 唯一标识 |
| user_id | VARCHAR(64) | FK | 用户ID |
| slot_id | VARCHAR(64) | FK | 时间点ID |
| created_at | DATETIME | NOT NULL | 订阅时间 |

**约束：** (user_id, slot_id) 联合唯一

---

## 3. 实体关系图

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│   User   │────▶│Subscription│    │ EventType│
└──────────┘     └─────┬──────┘     └────┬─────┘
                        │                 │  (self-ref, parent_id)
                        │                 ▼
                        │           ┌──────────┐
                        │           │  Event   │
                        │           └────┬─────┘
                        │                │
                        ▼                ▼
                 ┌──────────┐     ┌──────────┐
                 │ TimeSlot │◀────│  Event   │
                 └──────────┘     └──────────┘
```

---

## 4. 功能需求

### 4.1 事件类型管理

| 功能 | 说明 |
|------|------|
| 获取类型树 | 获取完整的层级结构 |
| 获取子类型 | 获取某个类型的直接子类型 |
| 创建类型 | 创建新的事件类型 |
| 更新类型 | 修改类型信息 |
| 删除类型 | 删除类型（需确认无子类型和无关联事件） |

### 4.2 事件管理

| 功能 | 说明 |
|------|------|
| 创建事件 | 选择类型，填写信息，添加时间点 |
| 更新事件 | 修改事件信息 |
| 删除事件 | 删除事件及其时间点 |
| 发布事件 | 将事件状态改为已发布 |
| 取消事件 | 将事件状态改为已取消 |
| 获取事件列表 | 支持按类型、时间范围筛选 |
| 获取事件详情 | 包含所有时间点 |

### 4.3 时间点管理

| 功能 | 说明 |
|------|------|
| 添加时间点 | 为事件添加时间点 |
| 更新时间点 | 修改时间点信息 |
| 删除时间点 | 从事件中移除时间点 |

### 4.4 订阅管理

| 功能 | 说明 |
|------|------|
| 订阅时间点 | 将时间点加入日历待办 |
| 取消订阅 | 从日历待办移除 |
| 获取订阅列表 | 获取用户所有订阅的时间点 |
| 获取日历视图 | 按日期查看已订阅的时间点 |

---

## 5. 数据库表结构

### 5.1 user 表

```sql
CREATE TABLE `user` (
    `user_id`       VARCHAR(64)  NOT NULL COMMENT '用户唯一标识',
    `open_id`       VARCHAR(128) NOT NULL COMMENT '微信 openId',
    `nickname`      VARCHAR(64) DEFAULT NULL COMMENT '昵称',
    `avatar`        VARCHAR(256) DEFAULT NULL COMMENT '头像 URL',
    `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
    `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`user_id`),
    UNIQUE KEY `uk_open_id` (`open_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';
```

### 5.2 event_type 表

```sql
CREATE TABLE `event_type` (
    `type_id`       VARCHAR(64)  NOT NULL COMMENT '类型唯一标识',
    `parent_id`     VARCHAR(64) DEFAULT NULL COMMENT '父类型ID',
    `type_name`     VARCHAR(32) NOT NULL COMMENT '类型名称',
    `type_code`     VARCHAR(32) NOT NULL COMMENT '类型编码',
    `description`   VARCHAR(256) DEFAULT NULL COMMENT '类型描述',
    `icon`          VARCHAR(64) DEFAULT NULL COMMENT '图标',
    `color`         VARCHAR(8) DEFAULT NULL COMMENT '颜色（HEX）',
    `sort_order`    INT NOT NULL DEFAULT 0 COMMENT '排序',
    `is_system`     TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否系统内置',
    `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`type_id`),
    UNIQUE KEY `uk_type_code` (`type_code`),
    KEY `idx_parent_id` (`parent_id`),
    CONSTRAINT `fk_event_type_parent` FOREIGN KEY (`parent_id`) REFERENCES `event_type` (`type_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='事件类型表';
```

### 5.3 event 表

```sql
CREATE TABLE `event` (
    `event_id`      VARCHAR(64) NOT NULL COMMENT '事件唯一标识',
    `type_id`       VARCHAR(64) NOT NULL COMMENT '事件类型ID',
    `user_id`       VARCHAR(64) DEFAULT NULL COMMENT '创建者ID',
    `title`         VARCHAR(128) NOT NULL COMMENT '标题',
    `content`       TEXT DEFAULT NULL COMMENT '正文内容',
    `location`      VARCHAR(256) DEFAULT NULL COMMENT '地点',
    `status`        TINYINT NOT NULL DEFAULT 0 COMMENT '状态：0-草稿 1-已发布 2-已取消',
    `published_at`  DATETIME DEFAULT NULL COMMENT '发布时间',
    `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`event_id`),
    KEY `idx_type_id` (`type_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_status` (`status`),
    CONSTRAINT `fk_event_type` FOREIGN KEY (`type_id`) REFERENCES `event_type` (`type_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_event_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='事件表';
```

### 5.4 time_slot 表

```sql
CREATE TABLE `time_slot` (
    `slot_id`       VARCHAR(64) NOT NULL COMMENT '时间点唯一标识',
    `event_id`      VARCHAR(64) NOT NULL COMMENT '事件ID',
    `slot_name`     VARCHAR(64) NOT NULL COMMENT '时间点名称',
    `start_time`    DATETIME NOT NULL COMMENT '开始时间',
    `end_time`      DATETIME DEFAULT NULL COMMENT '结束时间',
    `is_all_day`    TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否全天',
    `location`      VARCHAR(256) DEFAULT NULL COMMENT '地点',
    `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`slot_id`),
    KEY `idx_event_id` (`event_id`),
    KEY `idx_start_time` (`start_time`),
    CONSTRAINT `fk_time_slot_event` FOREIGN KEY (`event_id`) REFERENCES `event` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='时间点表';
```

### 5.5 subscription 表

```sql
CREATE TABLE `subscription` (
    `subscription_id` VARCHAR(64) NOT NULL COMMENT '唯一标识',
    `user_id`         VARCHAR(64) NOT NULL COMMENT '用户ID',
    `slot_id`         VARCHAR(64) NOT NULL COMMENT '时间点ID',
    `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '订阅时间',
    PRIMARY KEY (`subscription_id`),
    UNIQUE KEY `uk_user_slot` (`user_id`, `slot_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_slot_id` (`slot_id`),
    CONSTRAINT `fk_subscription_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_subscription_slot` FOREIGN KEY (`slot_id`) REFERENCES `time_slot` (`slot_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订阅表';
```

---

## 6. API 接口设计

### 6.1 用户接口

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/user/login | POST | 微信授权登录 |
| /api/user/info | GET | 获取用户信息 |
| /api/user/update | POST | 更新用户信息 |

### 6.2 事件类型接口

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/event-types/tree | GET | 获取类型树 |
| /api/event-types/:id/children | GET | 获取子类型 |
| /api/event-types/:id | GET | 获取类型详情 |
| /api/event-types | POST | 创建类型 |
| /api/event-types/:id | PUT | 更新类型 |
| /api/event-types/:id | DELETE | 删除类型 |

### 6.3 事件接口

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/events | GET | 获取事件列表 |
| /api/events/:id | GET | 获取事件详情（含时间点） |
| /api/events | POST | 创建事件 |
| /api/events/:id | PUT | 更新事件 |
| /api/events/:id | DELETE | 删除事件 |
| /api/events/:id/publish | POST | 发布事件 |
| /api/events/:id/cancel | POST | 取消事件 |

### 6.4 时间点接口

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/events/:eventId/time-slots | POST | 添加时间点 |
| /api/events/:eventId/time-slots/:id | PUT | 更新时间点 |
| /api/events/:eventId/time-slots/:id | DELETE | 删除时间点 |

### 6.5 订阅接口

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/subscriptions | GET | 获取订阅列表 |
| /api/subscriptions | POST | 订阅时间点 |
| /api/subscriptions/:id | DELETE | 取消订阅 |
| /api/subscriptions/calendar | GET | 获取日历视图 |

---

## 7. 状态枚举

### 7.1 事件状态

| 值 | 名称 | 说明 |
|----|------|------|
| 0 | 草稿 | 不对外发布 |
| 1 | 已发布 | 对外可见 |
| 2 | 已取消 | 已取消 |

---

## 8. 初始数据

### 8.1 内置事件类型

```
事件类型
├── 课程 (course)
│   ├── 专业课 (major_course)
│   ├── 选修课 (elective_course)
│   └── 公共课 (general_course)
├── 考试 (exam)
│   ├── 期中考试 (midterm)
│   └── 期末考试 (final)
├── 社团活动 (club)
│   ├── 文艺类 (art)
│   └── 体育类 (sports)
├── 讲座 (lecture)
└── 学院通知 (college)
```

---

**文档版本：** v1.0
**创建日期：** 2026-03-30
