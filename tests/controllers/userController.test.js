// Mock services first
jest.mock('../../src/services/userService', () => ({
  login: jest.fn(),
  getUserInfo: jest.fn(),
  updateUserInfo: jest.fn()
}));

// Mock config for response module
jest.mock('../../src/config', () => ({}));

const userController = require('../../src/controllers/userController');
const userService = require('../../src/services/userService');

describe('UserController', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      body: {},
      query: {},
      user: { user_id: 'user1' }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('login', () => {
    it('should return token on successful login', async () => {
      mockReq.body = { code: 'test_code' };
      userService.login.mockResolvedValue({
        user: { user_id: 'user1', nickname: 'Test' },
        token: 'jwt_token'
      });

      await userController.login(mockReq, mockRes, mockNext);

      expect(userService.login).toHaveBeenCalledWith('test_code');
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 0,
        message: 'success',
        data: {
          user: { user_id: 'user1', nickname: 'Test' },
          token: 'jwt_token'
        }
      });
    });

    it('should return error if code is missing', async () => {
      mockReq.body = {};

      await userController.login(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 1,
        message: '缺少code参数',
        data: null
      });
      expect(userService.login).not.toHaveBeenCalled();
    });

    it('should call next on service error', async () => {
      mockReq.body = { code: 'test_code' };
      const error = new Error('Service error');
      userService.login.mockRejectedValue(error);

      await userController.login(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getUserInfo', () => {
    it('should return user info', async () => {
      mockReq.user = { user_id: 'user1' };
      userService.getUserInfo.mockResolvedValue({
        user_id: 'user1',
        nickname: 'Test',
        avatar: 'http://avatar.url'
      });

      await userController.getUserInfo(mockReq, mockRes, mockNext);

      expect(userService.getUserInfo).toHaveBeenCalledWith('user1');
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 0,
        message: 'success',
        data: {
          user_id: 'user1',
          nickname: 'Test',
          avatar: 'http://avatar.url'
        }
      });
    });
  });

  describe('updateUserInfo', () => {
    it('should update and return user info', async () => {
      mockReq.user = { user_id: 'user1' };
      mockReq.body = {
        nickname: 'NewName',
        avatar: 'http://new.url',
        default_reminder_minutes: 60
      };
      userService.updateUserInfo.mockResolvedValue({
        user_id: 'user1',
        nickname: 'NewName',
        avatar: 'http://new.url',
        default_reminder_minutes: 60
      });

      await userController.updateUserInfo(mockReq, mockRes, mockNext);

      expect(userService.updateUserInfo).toHaveBeenCalledWith('user1', {
        nickname: 'NewName',
        avatar: 'http://new.url',
        default_reminder_minutes: 60
      });
      expect(mockRes.json).toHaveBeenCalled();
    });
  });
});
