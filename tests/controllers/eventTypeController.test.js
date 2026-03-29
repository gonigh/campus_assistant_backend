// Mock services first
jest.mock('../../src/services/eventTypeService', () => ({
  getTypeTree: jest.fn(),
  getTypes: jest.fn(),
  getTypeById: jest.fn(),
  getChildren: jest.fn(),
  createType: jest.fn(),
  updateType: jest.fn(),
  deleteType: jest.fn()
}));

// Mock config for response module
jest.mock('../../src/config', () => ({}));

const eventTypeController = require('../../src/controllers/eventTypeController');
const eventTypeService = require('../../src/services/eventTypeService');

describe('EventTypeController', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      body: {},
      query: {},
      params: {},
      user: { user_id: 'user1' }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('getTypeTree', () => {
    it('should return hierarchical type tree', async () => {
      const mockTree = [
        {
          type_id: 'type_jwc',
          type_name: '教务通知',
          type_code: 'jwc',
          children: [
            { type_id: 'type_contest', type_name: '学科竞赛', type_code: 'contest', children: [] },
            { type_id: 'type_exam_mgmt', type_name: '考试管理', type_code: 'exam_mgmt', children: [] }
          ]
        }
      ];
      eventTypeService.getTypeTree.mockResolvedValue(mockTree);

      await eventTypeController.getTypeTree(mockReq, mockRes, mockNext);

      expect(eventTypeService.getTypeTree).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 0,
        message: 'success',
        data: mockTree
      });
    });

    it('should return empty tree when no types exist', async () => {
      eventTypeService.getTypeTree.mockResolvedValue([]);

      await eventTypeController.getTypeTree(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        code: 0,
        message: 'success',
        data: []
      });
    });
  });

  describe('getTypes', () => {
    it('should return flat list of types', async () => {
      const mockTypes = [
        { type_id: 'type_jwc', type_name: '教务通知', type_code: 'jwc' },
        { type_id: 'type_contest', type_name: '学科竞赛', type_code: 'contest' }
      ];
      eventTypeService.getTypes.mockResolvedValue(mockTypes);

      await eventTypeController.getTypes(mockReq, mockRes, mockNext);

      expect(eventTypeService.getTypes).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 0,
        message: 'success',
        data: mockTypes
      });
    });
  });

  describe('getTypeById', () => {
    it('should return type details', async () => {
      mockReq.params = { id: 'type_contest' };
      const mockType = {
        type_id: 'type_contest',
        type_name: '学科竞赛',
        type_code: 'contest',
        parent: { type_id: 'type_jwc', type_name: '教务通知' },
        children: []
      };
      eventTypeService.getTypeById.mockResolvedValue(mockType);

      await eventTypeController.getTypeById(mockReq, mockRes, mockNext);

      expect(eventTypeService.getTypeById).toHaveBeenCalledWith('type_contest');
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 0,
        message: 'success',
        data: mockType
      });
    });

    it('should call next with error when type not found', async () => {
      mockReq.params = { id: 'nonexistent' };
      const error = new Error('事件类型不存在');
      error.code = 2005;
      error.statusCode = 404;
      eventTypeService.getTypeById.mockRejectedValue(error);

      await eventTypeController.getTypeById(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getChildren', () => {
    it('should return children of a type', async () => {
      mockReq.params = { id: 'type_jwc' };
      const mockChildren = [
        { type_id: 'type_contest', type_name: '学科竞赛', type_code: 'contest' },
        { type_id: 'type_exam_mgmt', type_name: '考试管理', type_code: 'exam_mgmt' }
      ];
      eventTypeService.getChildren.mockResolvedValue(mockChildren);

      await eventTypeController.getChildren(mockReq, mockRes, mockNext);

      expect(eventTypeService.getChildren).toHaveBeenCalledWith('type_jwc');
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 0,
        message: 'success',
        data: mockChildren
      });
    });
  });

  describe('createType', () => {
    it('should create a new type', async () => {
      mockReq.body = {
        type_name: '新课程',
        type_code: 'new_course',
        description: '新课程类型',
        icon: 'book',
        color: '#9b59b6'
      };
      const mockCreatedType = {
        type_id: 'type_new',
        type_name: '新课程',
        type_code: 'new_course'
      };
      eventTypeService.createType.mockResolvedValue(mockCreatedType);

      await eventTypeController.createType(mockReq, mockRes, mockNext);

      expect(eventTypeService.createType).toHaveBeenCalledWith(mockReq.body);
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 0,
        message: '类型创建成功',
        data: mockCreatedType
      });
    });

    it('should create a child type with parent_id', async () => {
      mockReq.body = {
        parent_id: 'type_jwc',
        type_name: '学科竞赛',
        type_code: 'contest'
      };
      const mockCreatedType = {
        type_id: 'type_contest',
        parent_id: 'type_jwc',
        type_name: '学科竞赛',
        type_code: 'contest'
      };
      eventTypeService.createType.mockResolvedValue(mockCreatedType);

      await eventTypeController.createType(mockReq, mockRes, mockNext);

      expect(eventTypeService.createType).toHaveBeenCalledWith(mockReq.body);
    });

    it('should call next with error when creation fails', async () => {
      mockReq.body = {
        type_name: '新课程',
        type_code: 'existing_code'
      };
      const error = new Error('类型编码已存在');
      error.code = 2005;
      error.statusCode = 400;
      eventTypeService.createType.mockRejectedValue(error);

      await eventTypeController.createType(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateType', () => {
    it('should update type successfully', async () => {
      mockReq.params = { id: 'type_contest' };
      mockReq.body = {
        type_name: '竞赛',
        description: '更新后的描述'
      };
      const mockUpdatedType = {
        type_id: 'type_contest',
        type_name: '竞赛',
        description: '更新后的描述'
      };
      eventTypeService.updateType.mockResolvedValue(mockUpdatedType);

      await eventTypeController.updateType(mockReq, mockRes, mockNext);

      expect(eventTypeService.updateType).toHaveBeenCalledWith('type_contest', mockReq.body);
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 0,
        message: '类型更新成功',
        data: mockUpdatedType
      });
    });

    it('should call next with error when update fails', async () => {
      mockReq.params = { id: 'nonexistent' };
      mockReq.body = { type_name: '新名称' };
      const error = new Error('事件类型不存在');
      error.code = 2005;
      error.statusCode = 404;
      eventTypeService.updateType.mockRejectedValue(error);

      await eventTypeController.updateType(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteType', () => {
    it('should delete type successfully', async () => {
      mockReq.params = { id: 'type_custom' };
      eventTypeService.deleteType.mockResolvedValue();

      await eventTypeController.deleteType(mockReq, mockRes, mockNext);

      expect(eventTypeService.deleteType).toHaveBeenCalledWith('type_custom');
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 0,
        message: '类型删除成功',
        data: null
      });
    });

    it('should call next with error when type has children', async () => {
      mockReq.params = { id: 'type_jwc' };
      const error = new Error('该类型下存在子类型，无法删除');
      error.code = 2005;
      error.statusCode = 400;
      eventTypeService.deleteType.mockRejectedValue(error);

      await eventTypeController.deleteType(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should call next with error when type has associated events', async () => {
      mockReq.params = { id: 'type_contest' };
      const error = new Error('该类型下存在关联事件，无法删除');
      error.code = 2005;
      error.statusCode = 400;
      eventTypeService.deleteType.mockRejectedValue(error);

      await eventTypeController.deleteType(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
