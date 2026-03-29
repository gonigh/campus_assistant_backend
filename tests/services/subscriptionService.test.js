// Mock uuid module first
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-v4-12345678')
}));

// Mock dependencies
jest.mock('../../src/models', () => ({
  Subscription: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn()
  },
  TimeSlot: {
    findByPk: jest.fn(),
    findAll: jest.fn()
  },
  Event: {
    findByPk: jest.fn()
  },
  EventType: {}
}));

const { generateId } = require('../../src/utils/uuid');
jest.mock('../../src/utils/uuid', () => ({
  generateId: jest.fn((prefix) => `${prefix}_mock_uuid`)
}));

const { Subscription, TimeSlot, Event } = require('../../src/models');
const subscriptionService = require('../../src/services/subscriptionService');

describe('SubscriptionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore generateId mock implementation
    generateId.mockImplementation((prefix) => `${prefix}_mock_uuid`);
  });

  describe('getSubscriptions', () => {
    it('should return user subscriptions with time slots and events', async () => {
      const mockSubscriptions = [
        {
          subscription_id: 'sub1',
          created_at: new Date(),
          TimeSlot: {
            slot_id: 'slot1',
            slot_name: '笔试',
            start_time: new Date('2026-04-01T09:00:00'),
            end_time: new Date('2026-04-01T11:00:00'),
            is_all_day: 0,
            location: '教室101',
            Event: {
              event_id: 'event1',
              title: '期末考试',
              location: '主教学楼',
              EventType: {
                type_id: 'type1',
                type_name: '考试',
                type_code: 'exam',
                icon: 'exam',
                color: '#ff0000'
              }
            }
          }
        }
      ];

      Subscription.findAll.mockResolvedValue(mockSubscriptions);

      const result = await subscriptionService.getSubscriptions('user1');

      expect(result).toHaveLength(1);
      expect(result[0].subscription_id).toBe('sub1');
      expect(result[0].slot.slot_name).toBe('笔试');
      expect(result[0].slot.event.title).toBe('期末考试');
    });

    it('should return empty array when user has no subscriptions', async () => {
      Subscription.findAll.mockResolvedValue([]);

      const result = await subscriptionService.getSubscriptions('user1');

      expect(result).toEqual([]);
    });
  });

  describe('subscribe', () => {
    it('should subscribe to a time slot', async () => {
      const mockTimeSlot = {
        slot_id: 'slot1',
        Event: {
          event_id: 'event1',
          status: 1
        }
      };

      const mockCreatedSubscription = {
        subscription_id: 'sub_mock_uuid',
        user_id: 'user1',
        slot_id: 'slot1',
        created_at: new Date()
      };

      TimeSlot.findByPk.mockResolvedValue(mockTimeSlot);
      Subscription.findOne.mockResolvedValue(null);
      Subscription.create.mockResolvedValue(mockCreatedSubscription);

      const result = await subscriptionService.subscribe('user1', 'slot1');

      expect(generateId).toHaveBeenCalledWith('sub');
      expect(result.subscription_id).toBe('sub_mock_uuid');
      expect(result.slot_id).toBe('slot1');
    });

    it('should throw error when time slot not found', async () => {
      TimeSlot.findByPk.mockResolvedValue(null);

      await expect(subscriptionService.subscribe('user1', 'nonexistent'))
        .rejects.toThrow('时间点不存在');
    });

    it('should throw error when event is not published', async () => {
      const mockTimeSlot = {
        slot_id: 'slot1',
        Event: {
          event_id: 'event1',
          status: 0 // 草稿状态
        }
      };

      TimeSlot.findByPk.mockResolvedValue(mockTimeSlot);

      await expect(subscriptionService.subscribe('user1', 'slot1'))
        .rejects.toThrow('只能订阅已发布的事件');
    });

    it('should throw error when already subscribed', async () => {
      const mockTimeSlot = {
        slot_id: 'slot1',
        Event: {
          event_id: 'event1',
          status: 1
        }
      };

      TimeSlot.findByPk.mockResolvedValue(mockTimeSlot);
      Subscription.findOne.mockResolvedValue({ subscription_id: 'existing_sub' });

      await expect(subscriptionService.subscribe('user1', 'slot1'))
        .rejects.toThrow('已经订阅过该时间点');
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe successfully', async () => {
      const mockSubscription = {
        subscription_id: 'sub1',
        user_id: 'user1',
        destroy: jest.fn()
      };

      Subscription.findOne.mockResolvedValue(mockSubscription);

      await subscriptionService.unsubscribe('sub1', 'user1');

      expect(mockSubscription.destroy).toHaveBeenCalled();
    });

    it('should throw error when subscription not found', async () => {
      Subscription.findOne.mockResolvedValue(null);

      await expect(subscriptionService.unsubscribe('nonexistent', 'user1'))
        .rejects.toThrow('订阅不存在');
    });
  });

  describe('getCalendar', () => {
    it('should return calendar view with time slots', async () => {
      const mockSubscriptions = [
        { slot_id: 'slot1' },
        { slot_id: 'slot2' }
      ];

      const mockTimeSlots = [
        {
          slot_id: 'slot1',
          slot_name: '笔试',
          start_time: new Date('2026-04-01T09:00:00'),
          end_time: new Date('2026-04-01T11:00:00'),
          is_all_day: 0,
          location: '教室101',
          Event: {
            event_id: 'event1',
            title: '期末考试',
            content: '考试内容',
            EventType: {
              type_id: 'type1',
              type_name: '考试',
              type_code: 'exam',
              icon: 'exam',
              color: '#ff0000'
            }
          }
        }
      ];

      Subscription.findAll.mockResolvedValue(mockSubscriptions);
      TimeSlot.findAll.mockResolvedValue(mockTimeSlots);

      const result = await subscriptionService.getCalendar('user1', '2026-04-01', '2026-04-30');

      expect(result).toHaveLength(1);
      expect(result[0].slot_name).toBe('笔试');
      expect(result[0].event.title).toBe('期末考试');
      expect(result[0].event.type.type_name).toBe('考试');
    });

    it('should return empty array when no subscriptions', async () => {
      Subscription.findAll.mockResolvedValue([]);
      TimeSlot.findAll.mockResolvedValue([]);

      const result = await subscriptionService.getCalendar('user1');

      expect(result).toEqual([]);
    });
  });
});
