// Mock services first
jest.mock('../../src/services/subscriptionService', () => ({
  getSubscriptions: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  getCalendar: jest.fn()
}));

// Mock config for response module
jest.mock('../../src/config', () => ({}));

const subscriptionController = require('../../src/controllers/subscriptionController');
const subscriptionService = require('../../src/services/subscriptionService');

describe('SubscriptionController', () => {
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

  describe('getSubscriptions', () => {
    it('should return user subscriptions', async () => {
      mockReq.user = { user_id: 'user1' };
      const mockSubscriptions = [
        { subscription_id: 'sub1', slot: { slot_id: 'slot1' } },
        { subscription_id: 'sub2', slot: { slot_id: 'slot2' } }
      ];
      subscriptionService.getSubscriptions.mockResolvedValue(mockSubscriptions);

      await subscriptionController.getSubscriptions(mockReq, mockRes, mockNext);

      expect(subscriptionService.getSubscriptions).toHaveBeenCalledWith('user1');
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 0,
        message: 'success',
        data: mockSubscriptions
      });
    });
  });

  describe('subscribe', () => {
    it('should subscribe to a time slot successfully', async () => {
      mockReq.user = { user_id: 'user1' };
      mockReq.body = { slot_id: 'slot1' };
      subscriptionService.subscribe.mockResolvedValue({
        subscription_id: 'sub1',
        slot_id: 'slot1',
        created_at: new Date()
      });

      await subscriptionController.subscribe(mockReq, mockRes, mockNext);

      expect(subscriptionService.subscribe).toHaveBeenCalledWith('user1', 'slot1');
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 0,
        message: '订阅成功',
        data: expect.objectContaining({
          subscription_id: 'sub1',
          slot_id: 'slot1'
        })
      });
    });

    it('should return error if slot_id is missing', async () => {
      mockReq.body = {};

      await subscriptionController.subscribe(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 1,
        message: '缺少必要参数',
        data: null
      });
      expect(subscriptionService.subscribe).not.toHaveBeenCalled();
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe successfully', async () => {
      mockReq.user = { user_id: 'user1' };
      mockReq.params = { id: 'sub1' };
      subscriptionService.unsubscribe.mockResolvedValue();

      await subscriptionController.unsubscribe(mockReq, mockRes, mockNext);

      expect(subscriptionService.unsubscribe).toHaveBeenCalledWith('sub1', 'user1');
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 0,
        message: '取消订阅成功',
        data: null
      });
    });
  });

  describe('getCalendar', () => {
    it('should return calendar view', async () => {
      mockReq.user = { user_id: 'user1' };
      mockReq.query = { start_date: '2026-04-01', end_date: '2026-04-30' };
      const mockCalendar = [
        { slot_id: 'slot1', slot_name: '笔试', start_time: new Date() }
      ];
      subscriptionService.getCalendar.mockResolvedValue(mockCalendar);

      await subscriptionController.getCalendar(mockReq, mockRes, mockNext);

      expect(subscriptionService.getCalendar).toHaveBeenCalledWith('user1', '2026-04-01', '2026-04-30');
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 0,
        message: 'success',
        data: mockCalendar
      });
    });
  });
});
