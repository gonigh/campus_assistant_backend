// Mock uuid module first
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-v4-12345678')
}));

// Mock dependencies
jest.mock('../../src/models', () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn()
  },
  Subscription: {
    create: jest.fn()
  },
  EventType: {
    findAll: jest.fn()
  }
}));

// Mock config with jwt
jest.mock('../../src/config', () => ({
  wechat: {
    appId: 'test_app_id',
    appSecret: 'test_app_secret'
  },
  jwt: {
    secret: 'test_secret',
    expiresIn: '7d'
  }
}));

// Mock auth middleware
jest.mock('../../src/middlewares/auth', () => ({
  generateToken: jest.fn(() => 'mock_token')
}));

// Mock axios
jest.mock('axios');

const { User, Subscription, EventType } = require('../../src/models');
const userService = require('../../src/services/userService');
const axios = require('axios');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset generateId mock
    const { v4 } = require('uuid');
    v4.mockReturnValue('mock-uuid-v4-12345678');
  });

  describe('login', () => {
    it('should create new user and auto-subscribe to system types on first login', async () => {
      const mockOpenId = 'test_openid_123';
      const mockCode = 'test_code';

      // Mock axios for getOpenIdByCode
      axios.get.mockResolvedValue({ data: { openid: mockOpenId } });

      // Mock User.findOne returns null (new user)
      User.findOne.mockResolvedValue(null);

      // Mock User.create
      User.create.mockResolvedValue({
        user_id: 'user_mock_uuid',
        open_id: mockOpenId,
        nickname: null,
        avatar: null,
        default_reminder_minutes: 30
      });

      // Mock EventType.findAll returns system types
      EventType.findAll.mockResolvedValue([
        { type_id: 'type1', type_name: '课程' },
        { type_id: 'type2', type_name: '考试' }
      ]);

      // Mock Subscription.create
      Subscription.create.mockResolvedValue({});

      const result = await userService.login(mockCode);

      expect(axios.get).toHaveBeenCalledWith(
        'https://api.weixin.qq.com/sns/jscode2session',
        expect.any(Object)
      );
      expect(User.findOne).toHaveBeenCalledWith({ where: { open_id: mockOpenId } });
      expect(User.create).toHaveBeenCalled();
      expect(EventType.findAll).toHaveBeenCalledWith({ where: { is_system: 1 } });
      expect(Subscription.create).toHaveBeenCalledTimes(2);
      expect(result.user.user_id).toBe('user_mock_uuid');
    });

    it('should return existing user without creating new subscriptions', async () => {
      const mockOpenId = 'existing_openid';
      const mockCode = 'test_code';

      axios.get.mockResolvedValue({ data: { openid: mockOpenId } });

      const existingUser = {
        user_id: 'existing_user_id',
        open_id: mockOpenId,
        nickname: 'TestUser',
        avatar: 'http://avatar.url',
        default_reminder_minutes: 30
      };
      User.findOne.mockResolvedValue(existingUser);

      const result = await userService.login(mockCode);

      expect(User.create).not.toHaveBeenCalled();
      expect(EventType.findAll).not.toHaveBeenCalled();
      expect(Subscription.create).not.toHaveBeenCalled();
      expect(result.user.user_id).toBe('existing_user_id');
    });

    it('should throw error when wechat API fails', async () => {
      axios.get.mockResolvedValue({ data: { errcode: 40001, errmsg: 'invalid code' } });

      await expect(userService.login('invalid_code')).rejects.toThrow('微信授权失败');
    });
  });

  describe('getUserInfo', () => {
    it('should return user info when user exists', async () => {
      const mockUser = {
        user_id: 'user123',
        nickname: 'TestUser',
        avatar: 'http://avatar.url',
        default_reminder_minutes: 30,
        created_at: new Date()
      };
      User.findByPk.mockResolvedValue(mockUser);

      const result = await userService.getUserInfo('user123');

      expect(result.user_id).toBe('user123');
      expect(result.nickname).toBe('TestUser');
      expect(result.avatar).toBe('http://avatar.url');
      expect(result.default_reminder_minutes).toBe(30);
    });

    it('should throw error when user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      await expect(userService.getUserInfo('nonexistent')).rejects.toThrow('用户不存在');
    });
  });

  describe('updateUserInfo', () => {
    it('should update user fields and return updated user', async () => {
      const mockUser = {
        user_id: 'user123',
        nickname: 'OldName',
        avatar: 'http://old.url',
        default_reminder_minutes: 30,
        save: jest.fn()
      };
      User.findByPk.mockResolvedValue(mockUser);

      const result = await userService.updateUserInfo('user123', {
        nickname: 'NewName',
        avatar: 'http://new.url',
        default_reminder_minutes: 60
      });

      expect(mockUser.nickname).toBe('NewName');
      expect(mockUser.avatar).toBe('http://new.url');
      expect(mockUser.default_reminder_minutes).toBe(60);
      expect(mockUser.save).toHaveBeenCalled();
      expect(result.nickname).toBe('NewName');
    });

    it('should only update provided fields', async () => {
      const mockUser = {
        user_id: 'user123',
        nickname: 'KeepName',
        avatar: 'http://keep.url',
        default_reminder_minutes: 30,
        save: jest.fn()
      };
      User.findByPk.mockResolvedValue(mockUser);

      await userService.updateUserInfo('user123', {
        nickname: 'NewName'
      });

      expect(mockUser.nickname).toBe('NewName');
      expect(mockUser.avatar).toBe('http://keep.url');
      expect(mockUser.default_reminder_minutes).toBe(30);
    });

    it('should throw error when user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      await expect(userService.updateUserInfo('nonexistent', { nickname: 'Test' }))
        .rejects.toThrow('用户不存在');
    });
  });
});
