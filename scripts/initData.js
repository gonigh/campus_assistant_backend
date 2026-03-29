/**
 * 数据初始化脚本
 * 运行: node scripts/initData.js
 */

const { sequelize, EventType, User } = require('../src/models');
const { generateId } = require('../src/utils/uuid');

const SYSTEM_EVENT_TYPES = [
  {
    type_id: 'type_course',
    type_name: '课程',
    type_code: 'course',
    description: '教务处导入的课程表',
    icon: 'book',
    color: '#1890ff',
    sort_order: 1,
    is_system: 1
  },
  {
    type_id: 'type_exam',
    type_name: '考试',
    type_code: 'exam',
    description: '教务处导入的考试安排',
    icon: 'edit',
    color: '#f5222d',
    sort_order: 2,
    is_system: 1
  },
  {
    type_id: 'type_club',
    type_name: '社团活动',
    type_code: 'club',
    description: '学生社团发布的活动',
    icon: 'team',
    color: '#52c41a',
    sort_order: 3,
    is_system: 1
  },
  {
    type_id: 'type_lecture',
    type_name: '讲座',
    type_code: 'lecture',
    description: '学术讲座信息',
    icon: 'video-camera',
    color: '#722ed1',
    sort_order: 4,
    is_system: 1
  },
  {
    type_id: 'type_exam4',
    type_name: '四级',
    type_code: 'exam4',
    description: '英语四级考试',
    icon: 'file-text',
    color: '#fa8c16',
    sort_order: 5,
    is_system: 1
  },
  {
    type_id: 'type_exam6',
    type_name: '六级',
    type_code: 'exam6',
    description: '英语六级考试',
    icon: 'file-text',
    color: '#faad14',
    sort_order: 6,
    is_system: 1
  },
  {
    type_id: 'type_research',
    type_name: '考研',
    type_code: 'research',
    description: '考研相关通知',
    icon: 'container',
    color: '#13c2c2',
    sort_order: 7,
    is_system: 1
  },
  {
    type_id: 'type_college',
    type_name: '学院通知',
    type_code: 'college',
    description: '学院发布的通知公告',
    icon: 'notification',
    color: '#eb2f96',
    sort_order: 8,
    is_system: 1
  },
  {
    type_id: 'type_custom',
    type_name: '自定义',
    type_code: 'custom',
    description: '用户个人创建的事件',
    icon: 'plus',
    color: '#8c8c8c',
    sort_order: 9,
    is_system: 0
  }
];

async function initEventTypes() {
  console.log('📦 开始初始化事件类型...');

  for (const type of SYSTEM_EVENT_TYPES) {
    const [eventType, created] = await EventType.findOrCreate({
      where: { type_code: type.type_code },
      defaults: type
    });

    if (created) {
      console.log(`  ✅ 创建事件类型: ${type.type_name} (${type.type_code})`);
    } else {
      console.log(`  ⏭️  已存在事件类型: ${type.type_name} (${type.type_code})`);
    }
  }

  console.log('✨ 事件类型初始化完成\n');
}

async function initTestUser() {
  console.log('👤 检查测试用户...');

  const testUser = await User.findOrCreate({
    where: { open_id: 'test_openid_for_development' },
    defaults: {
      user_id: generateId('user'),
      open_id: 'test_openid_for_development',
      nickname: '测试用户',
      default_reminder_minutes: 30
    }
  });

  if (testUser[1]) {
    console.log('  ✅ 创建测试用户');
  } else {
    console.log('  ⏭️  测试用户已存在');
  }

  console.log('✨ 测试用户初始化完成\n');
}

async function main() {
  try {
    console.log('========================================');
    console.log('    校园助手数据初始化脚本');
    console.log('========================================\n');

    // 连接数据库
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功\n');

    // 执行初始化
    await initEventTypes();
    await initTestUser();

    console.log('========================================');
    console.log('    初始化完成！');
    console.log('========================================');
    console.log('\n提示: 测试用户 open_id 为 test_openid_for_development');
    console.log('      可用于开发环境测试登录\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    process.exit(1);
  }
}

main();
