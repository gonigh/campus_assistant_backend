// Mock uuid module first
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-v4-12345678')
}));

// Mock dependencies
jest.mock('../../src/models', () => ({
  EventType: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn()
  },
  Event: {
    count: jest.fn()
  }
}));

jest.mock('../../src/utils/uuid', () => ({
  generateId: jest.fn((prefix) => `${prefix}_mock_uuid`)
}));

const { EventType, Event } = require('../../src/models');
const eventTypeService = require('../../src/services/eventTypeService');

describe('EventTypeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTypeTree', () => {
    it('should return hierarchical type tree', async () => {
      // 模拟一级类型：教务通知
      const mockJwcType = {
        type_id: 'type_jwc',
        parent_id: null,
        type_name: '教务通知',
        type_code: 'jwc',
        description: '教务处发布的通知公告',
        icon: 'building',
        color: '#3498db',
        sort_order: 1,
        is_system: 1,
        created_at: new Date()
      };

      // 模拟二级类型：学科竞赛
      const mockContestType = {
        type_id: 'type_contest',
        parent_id: 'type_jwc',
        type_name: '学科竞赛',
        type_code: 'contest',
        description: '学科竞赛相关通知',
        icon: 'trophy',
        color: '#e74c3c',
        sort_order: 1,
        is_system: 1,
        created_at: new Date()
      };

      // 模拟二级类型：考试管理
      const mockExamType = {
        type_id: 'type_exam_mgmt',
        parent_id: 'type_jwc',
        type_name: '考试管理',
        type_code: 'exam_mgmt',
        description: '考试安排与管理',
        icon: 'exam',
        color: '#f39c12',
        sort_order: 2,
        is_system: 1,
        created_at: new Date()
      };

      // 设置 mock 顺序：
      // 1. getTypeTree 首先调用 findAll 找顶级类型 (parent_id = null)
      // 2. 然后对每个顶级类型调用 buildTree，buildTree 内部调用 findAll 找子类型
      EventType.findAll
        .mockResolvedValueOnce([mockJwcType]) // 顶级类型查询
        .mockResolvedValueOnce([mockContestType, mockExamType]) // 教务通知的子类型查询
        .mockResolvedValueOnce([]) // 学科竞赛的子类型查询（递归）
        .mockResolvedValueOnce([]); // 考试管理的子类型查询（递归）

      const result = await eventTypeService.getTypeTree();

      expect(result).toHaveLength(1);
      expect(result[0].type_name).toBe('教务通知');
      expect(result[0].children).toHaveLength(2);
      expect(result[0].children[0].type_name).toBe('学科竞赛');
      expect(result[0].children[1].type_name).toBe('考试管理');
    });

    it('should return empty tree when no types exist', async () => {
      EventType.findAll.mockResolvedValue([]);

      const result = await eventTypeService.getTypeTree();

      expect(result).toEqual([]);
    });
  });

  describe('getTypes', () => {
    it('should return flat list of all types', async () => {
      const mockTypes = [
        {
          type_id: 'type_jwc',
          parent_id: null,
          type_name: '教务通知',
          type_code: 'jwc',
          description: '教务处发布的通知公告',
          icon: 'building',
          color: '#3498db',
          sort_order: 1,
          is_system: 1,
          created_at: new Date()
        },
        {
          type_id: 'type_contest',
          parent_id: 'type_jwc',
          type_name: '学科竞赛',
          type_code: 'contest',
          description: '学科竞赛相关通知',
          icon: 'trophy',
          color: '#e74c3c',
          sort_order: 1,
          is_system: 1,
          created_at: new Date()
        }
      ];

      EventType.findAll.mockResolvedValue(mockTypes);

      const result = await eventTypeService.getTypes();

      expect(result).toHaveLength(2);
      expect(result[0].type_name).toBe('教务通知');
      expect(result[1].type_name).toBe('学科竞赛');
    });
  });

  describe('getTypeById', () => {
    it('should return type details with parent and children', async () => {
      const mockParentType = {
        type_id: 'type_jwc',
        parent_id: null,
        type_name: '教务通知',
        type_code: 'jwc'
      };

      const mockChildren = [
        {
          type_id: 'type_contest',
          parent_id: 'type_jwc',
          type_name: '学科竞赛',
          type_code: 'contest'
        }
      ];

      const mockType = {
        type_id: 'type_contest',
        parent_id: 'type_jwc',
        type_name: '学科竞赛',
        type_code: 'contest',
        description: '学科竞赛相关通知',
        icon: 'trophy',
        color: '#e74c3c',
        sort_order: 1,
        is_system: 1,
        created_at: new Date(),
        parent: mockParentType,
        children: mockChildren
      };

      EventType.findByPk.mockResolvedValue(mockType);

      const result = await eventTypeService.getTypeById('type_contest');

      expect(result.type_id).toBe('type_contest');
      expect(result.type_name).toBe('学科竞赛');
      expect(result.parent.type_name).toBe('教务通知');
      expect(result.children).toHaveLength(1);
    });

    it('should throw error when type not found', async () => {
      EventType.findByPk.mockResolvedValue(null);

      await expect(eventTypeService.getTypeById('nonexistent'))
        .rejects.toThrow('事件类型不存在');
    });
  });

  describe('getChildren', () => {
    it('should return children of a type', async () => {
      const mockParent = {
        type_id: 'type_jwc',
        parent_id: null,
        type_name: '教务通知'
      };

      const mockChildren = [
        {
          type_id: 'type_contest',
          parent_id: 'type_jwc',
          type_name: '学科竞赛',
          type_code: 'contest',
          description: '学科竞赛相关通知',
          icon: 'trophy',
          color: '#e74c3c',
          sort_order: 1,
          is_system: 1,
          created_at: new Date()
        },
        {
          type_id: 'type_exam_mgmt',
          parent_id: 'type_jwc',
          type_name: '考试管理',
          type_code: 'exam_mgmt',
          description: '考试安排与管理',
          icon: 'exam',
          color: '#f39c12',
          sort_order: 2,
          is_system: 1,
          created_at: new Date()
        }
      ];

      EventType.findByPk.mockResolvedValue(mockParent);
      EventType.findAll.mockResolvedValue(mockChildren);

      const result = await eventTypeService.getChildren('type_jwc');

      expect(result).toHaveLength(2);
      expect(result[0].type_name).toBe('学科竞赛');
      expect(result[1].type_name).toBe('考试管理');
    });

    it('should throw error when parent type not found', async () => {
      EventType.findByPk.mockResolvedValue(null);

      await expect(eventTypeService.getChildren('nonexistent'))
        .rejects.toThrow('事件类型不存在');
    });
  });

  describe('createType', () => {
    it('should create a new type', async () => {
      const mockCreatedType = {
        type_id: 'type_mock_uuid',
        parent_id: null,
        type_name: '新课程',
        type_code: 'new_course',
        description: '新课程类型',
        icon: 'book',
        color: '#9b59b6',
        sort_order: 10,
        is_system: 0,
        created_at: new Date()
      };

      EventType.findByPk.mockResolvedValue(null); // 无父类型检查
      EventType.findOne.mockResolvedValue(null); // 编码不重复
      EventType.create.mockResolvedValue(mockCreatedType);

      const result = await eventTypeService.createType({
        type_name: '新课程',
        type_code: 'new_course',
        description: '新课程类型',
        icon: 'book',
        color: '#9b59b6',
        sort_order: 10
      });

      expect(EventType.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type_name: '新课程',
          type_code: 'new_course',
          is_system: 0
        })
      );
      expect(result.type_name).toBe('新课程');
    });

    it('should create a child type when parent_id is provided', async () => {
      const mockParent = {
        type_id: 'type_jwc',
        parent_id: null,
        type_name: '教务通知'
      };

      const mockCreatedType = {
        type_id: 'type_mock_uuid',
        parent_id: 'type_jwc',
        type_name: '新课程',
        type_code: 'new_course',
        description: '新课程类型',
        icon: 'book',
        color: '#9b59b6',
        sort_order: 10,
        is_system: 0,
        created_at: new Date()
      };

      EventType.findByPk.mockResolvedValue(mockParent);
      EventType.findOne.mockResolvedValue(null);
      EventType.create.mockResolvedValue(mockCreatedType);

      const result = await eventTypeService.createType({
        parent_id: 'type_jwc',
        type_name: '新课程',
        type_code: 'new_course'
      });

      expect(result.parent_id).toBe('type_jwc');
    });

    it('should throw error when parent does not exist', async () => {
      EventType.findByPk.mockResolvedValue(null);

      await expect(eventTypeService.createType({
        parent_id: 'nonexistent',
        type_name: '新课程',
        type_code: 'new_course'
      })).rejects.toThrow('父类型不存在');
    });

    it('should throw error when type_code already exists', async () => {
      EventType.findByPk.mockResolvedValue(null);
      EventType.findOne.mockResolvedValue({ type_code: 'existing_code' });

      await expect(eventTypeService.createType({
        type_name: '新课程',
        type_code: 'existing_code'
      })).rejects.toThrow('类型编码已存在');
    });
  });

  describe('updateType', () => {
    it('should update type fields', async () => {
      const mockType = {
        type_id: 'type_contest',
        parent_id: 'type_jwc',
        type_name: '学科竞赛',
        type_code: 'contest',
        description: '旧描述',
        icon: 'old_icon',
        color: '#000000',
        sort_order: 1,
        is_system: 1,
        created_at: new Date(),
        save: jest.fn()
      };

      EventType.findByPk.mockResolvedValue(mockType);

      const result = await eventTypeService.updateType('type_contest', {
        type_name: '竞赛',
        description: '新描述',
        icon: 'new_icon'
      });

      expect(mockType.type_name).toBe('竞赛');
      expect(mockType.description).toBe('新描述');
      expect(mockType.save).toHaveBeenCalled();
    });

    it('should throw error when type not found', async () => {
      EventType.findByPk.mockResolvedValue(null);

      await expect(eventTypeService.updateType('nonexistent', {
        type_name: '新名称'
      })).rejects.toThrow('事件类型不存在');
    });
  });

  describe('deleteType', () => {
    it('should delete type when no children and no events', async () => {
      const mockType = {
        type_id: 'type_custom',
        parent_id: null,
        type_name: '自定义',
        type_code: 'custom',
        is_system: 0,
        destroy: jest.fn()
      };

      EventType.findByPk.mockResolvedValue(mockType);
      EventType.count.mockResolvedValue(0); // 无子类型
      Event.count.mockResolvedValue(0); // 无关联事件

      await eventTypeService.deleteType('type_custom');

      expect(mockType.destroy).toHaveBeenCalled();
    });

    it('should throw error when type has children', async () => {
      const mockType = {
        type_id: 'type_jwc',
        parent_id: null,
        type_name: '教务通知',
        is_system: 1
      };

      EventType.findByPk.mockResolvedValue(mockType);
      EventType.count.mockResolvedValue(3); // 有子类型

      await expect(eventTypeService.deleteType('type_jwc'))
        .rejects.toThrow('该类型下存在子类型，无法删除');
    });

    it('should throw error when type has associated events', async () => {
      const mockType = {
        type_id: 'type_contest',
        parent_id: 'type_jwc',
        type_name: '学科竞赛',
        is_system: 1
      };

      EventType.findByPk.mockResolvedValue(mockType);
      EventType.count.mockResolvedValue(0); // 无子类型
      Event.count.mockResolvedValue(5); // 有关联事件

      await expect(eventTypeService.deleteType('type_contest'))
        .rejects.toThrow('该类型下存在关联事件，无法删除');
    });

    it('should throw error when type not found', async () => {
      EventType.findByPk.mockResolvedValue(null);

      await expect(eventTypeService.deleteType('nonexistent'))
        .rejects.toThrow('事件类型不存在');
    });
  });
});
