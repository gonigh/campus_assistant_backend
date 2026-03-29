-- 校园助手基础数据初始化SQL
-- 适用于手动导入或数据库迁移

-- 创建数据库（如果不存在）
-- CREATE DATABASE IF NOT EXISTS campus_event DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE campus_event;

-- ============================================
-- 事件类型表初始化数据
-- ============================================
INSERT INTO event_type (type_id, type_name, type_code, description, icon, color, sort_order, is_system, created_at, updated_at)
VALUES
  ('type_course', '课程', 'course', '教务处导入的课程表', 'book', '#1890ff', 1, 1, NOW(), NOW()),
  ('type_exam', '考试', 'exam', '教务处导入的考试安排', 'edit', '#f5222d', 2, 1, NOW(), NOW()),
  ('type_club', '社团活动', 'club', '学生社团发布的活动', 'team', '#52c41a', 3, 1, NOW(), NOW()),
  ('type_lecture', '讲座', 'lecture', '学术讲座信息', 'video-camera', '#722ed1', 4, 1, NOW(), NOW()),
  ('type_exam4', '四级', 'exam4', '英语四级考试', 'file-text', '#fa8c16', 5, 1, NOW(), NOW()),
  ('type_exam6', '六级', 'exam6', '英语六级考试', 'file-text', '#faad14', 6, 1, NOW(), NOW()),
  ('type_research', '考研', 'research', '考研相关通知', 'container', '#13c2c2', 7, 1, NOW(), NOW()),
  ('type_college', '学院通知', 'college', '学院发布的通知公告', 'notification', '#eb2f96', 8, 1, NOW(), NOW()),
  ('type_custom', '自定义', 'custom', '用户个人创建的事件', 'plus', '#8c8c8c', 9, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  type_name = VALUES(type_name),
  description = VALUES(description),
  icon = VALUES(icon),
  color = VALUES(color),
  sort_order = VALUES(sort_order);

-- ============================================
-- 测试用户（可选，用于开发测试）
-- ============================================
-- INSERT INTO user (user_id, open_id, nickname, avatar, default_reminder_minutes, created_at, updated_at)
-- VALUES ('user_test001', 'test_openid_for_development', '测试用户', NULL, 30, NOW(), NOW())
-- ON DUPLICATE KEY UPDATE nickname = '测试用户';

-- ============================================
-- 示例事件数据（可选）
-- ============================================
-- INSERT INTO event (event_id, type_id, user_id, title, content, location, start_time, end_time, is_all_day, status, published_at, created_at, updated_at)
-- VALUES
--   ('event_001', 'type_course', 'user_test001', '高等数学', '第三章 积分', '教学楼A101', DATE_ADD(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 1 DAY HOUR), 0, 1, NOW(), NOW(), NOW()),
--   ('event_002', 'type_exam', 'user_test001', '英语四级考试', '请提前30分钟到达考场', '教学楼B201', DATE_ADD(NOW(), INTERVAL 7 DAY), DATE_ADD(NOW(), INTERVAL 7 DAY HOUR), 0, 1, NOW(), NOW(), NOW()),
--   ('event_003', 'type_club', 'user_test001', '吉他社招新', '欢迎加入吉他社', '大学生活动中心', DATE_ADD(NOW(), INTERVAL 3 DAY), DATE_ADD(NOW(), INTERVAL 3 DAY HOUR), 0, 1, NOW(), NOW(), NOW());

-- INSERT INTO reminder (reminder_id, event_id, minutes_before, is_enabled, last_notified_at)
-- VALUES
--   ('reminder_001', 'event_001', 30, 1, NULL),
--   ('reminder_002', 'event_002', 1440, 1, NULL),
--   ('reminder_003', 'event_003', 60, 1, NULL);
