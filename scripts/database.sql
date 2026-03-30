-- =============================================
-- 校园助手后端系统 - 数据库初始化脚本
-- =============================================

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS campus_assistant
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE campus_assistant;

-- =============================================
-- 1. 用户表 (User)
-- =============================================
DROP TABLE IF EXISTS `user`;
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

-- =============================================
-- 2. 事件类型表 (EventType)
-- =============================================
DROP TABLE IF EXISTS `event_type`;
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

-- 插入内置事件类型
INSERT INTO `event_type` (`type_id`, `parent_id`, `type_name`, `type_code`, `description`, `icon`, `color`, `sort_order`, `is_system`) VALUES
    ('type_jwc',         NULL,         '教务通知', 'jwc',      '教务处发布的通知公告', 'building',        '#3498db', 1, 1),
    ('type_contest',     'type_jwc',   '学科竞赛', 'contest',   '学科竞赛相关通知',      'trophy',          '#e74c3c', 1, 1),
    ('type_exam_mgmt',   'type_jwc',   '考试管理', 'exam_mgmt', '考试安排与管理',        'exam',            '#f39c12', 2, 1);

-- =============================================
-- 3. 事件表 (Event)
-- =============================================
DROP TABLE IF EXISTS `event`;
CREATE TABLE `event` (
    `event_id`      VARCHAR(64) NOT NULL COMMENT '事件唯一标识',
    `type_id`       VARCHAR(64) NOT NULL COMMENT '事件类型ID',
    `user_id`       VARCHAR(64) DEFAULT NULL COMMENT '创建者ID',
    `title`         VARCHAR(256) NOT NULL COMMENT '标题',
    `content`       LONGTEXT DEFAULT NULL COMMENT '正文内容',
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

-- =============================================
-- 4. 时间点表 (TimeSlot)
-- =============================================
DROP TABLE IF EXISTS `time_slot`;
CREATE TABLE `time_slot` (
    `slot_id`       VARCHAR(64) NOT NULL COMMENT '时间点唯一标识',
    `event_id`      VARCHAR(64) NOT NULL COMMENT '事件ID',
    `slot_name`     VARCHAR(256) NOT NULL COMMENT '时间点名称',
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

-- =============================================
-- 5. 订阅表 (Subscription)
-- =============================================
DROP TABLE IF EXISTS `subscription`;
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

-- =============================================
-- 初始化完成
-- =============================================
