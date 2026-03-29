// Mock uuid module first
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-v4-12345678')
}));

// Mock dependencies
jest.mock('../../src/models', () => ({
  Event: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn()
  },
  EventType: {
    findAll: jest.fn(),
    findByPk: jest.fn()
  },
  TimeSlot: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn()
  },
  User: {
    findByPk: jest.fn()
  },
  Subscription: {
    findAll: jest.fn()
  }
}));

jest.mock('../../src/utils/uuid', () => ({
  generateId: jest.fn((prefix) => `${prefix}_mock_uuid`)
}));

const { Op } = require('sequelize');

const { Event, EventType, TimeSlot, Subscription, User } = require('../../src/models');
const { generateId } = require('../../src/utils/uuid');
const eventService = require('../../src/services/eventService');

describe('EventService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEvents', () => {
    it('should return paginated events list with time slots', async () => {
      const mockTimeSlots = [
        {
          slot_id: 'slot1',
          slot_name: '笔试',
          start_time: new Date('2026-04-01T09:00:00'),
          end_time: new Date('2026-04-01T11:00:00'),
          is_all_day: 0,
          location: '教室101',
          created_at: new Date()
        }
      ];

      const mockEvents = [
        {
          event_id: 'event1',
          title: 'Test Event',
          content: 'Content',
          location: 'Location',
          status: 1,
          published_at: new Date(),
          created_at: new Date(),
          EventType: {
            type_id: 'type1',
            type_name: '课程',
            type_code: 'course',
            icon: 'icon1',
            color: '#ff0000'
          },
          User: {
            user_id: 'user1',
            nickname: 'User',
            avatar: 'http://avatar.url'
          }
        }
      ];

      Event.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: mockEvents
      });
      TimeSlot.findAll.mockResolvedValue(mockTimeSlots);

      const result = await eventService.getEvents({ page: 1, pageSize: 10 });

      expect(result.list).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.list[0].title).toBe('Test Event');
      expect(result.list[0].type.type_name).toBe('课程');
      expect(result.list[0].time_slots).toHaveLength(1);
      expect(result.list[0].time_slots[0].slot_name).toBe('笔试');
    });

    it('should filter by type_id', async () => {
      Event.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      TimeSlot.findAll.mockResolvedValue([]);

      await eventService.getEvents({ type_id: 'type1' });

      expect(Event.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type_id: 'type1' })
        })
      );
    });

    it('should filter by status', async () => {
      Event.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      TimeSlot.findAll.mockResolvedValue([]);

      await eventService.getEvents({ status: 1 });

      expect(Event.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 1 })
        })
      );
    });

    it('should filter by keyword', async () => {
      Event.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      TimeSlot.findAll.mockResolvedValue([]);

      await eventService.getEvents({ keyword: '考试' });

      expect(Event.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            title: expect.objectContaining({ [Op.like]: '%考试%' })
          })
        })
      );
    });
  });

  describe('getEventById', () => {
    it('should return event details with time slots', async () => {
      const mockTimeSlots = [
        {
          slot_id: 'slot1',
          slot_name: '笔试',
          start_time: new Date('2026-04-01T09:00:00'),
          end_time: new Date('2026-04-01T11:00:00'),
          is_all_day: 0,
          location: '教室101',
          created_at: new Date()
        }
      ];

      const mockEvent = {
        event_id: 'event1',
        title: 'Test Event',
        content: 'Content',
        location: 'Location',
        status: 1,
        published_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        EventType: {
          type_id: 'type1',
          type_name: '课程',
          type_code: 'course',
          icon: 'icon1',
          color: '#ff0000'
        },
        User: {
          user_id: 'user1',
          nickname: 'User',
          avatar: 'http://avatar.url'
        }
      };

      Event.findByPk.mockResolvedValue(mockEvent);
      TimeSlot.findAll.mockResolvedValue(mockTimeSlots);

      const result = await eventService.getEventById('event1');

      expect(result.event_id).toBe('event1');
      expect(result.title).toBe('Test Event');
      expect(result.type.type_name).toBe('课程');
      expect(result.creator.nickname).toBe('User');
      expect(result.time_slots).toHaveLength(1);
      expect(result.time_slots[0].slot_name).toBe('笔试');
    });

    it('should throw error when event not found', async () => {
      Event.findByPk.mockResolvedValue(null);

      await expect(eventService.getEventById('nonexistent'))
        .rejects.toThrow('事件不存在');
    });
  });

  describe('createEvent', () => {
    it('should create event with time slots', async () => {
      const mockEventType = {
        type_id: 'type_custom',
        type_code: 'custom',
        is_system: 0
      };

      const mockCreatedEvent = {
        event_id: 'event_mock_uuid',
        type_id: 'type_custom',
        user_id: 'user1',
        title: 'My Event',
        content: 'Content',
        location: 'Location',
        status: 0,
        published_at: null,
        created_at: new Date(),
        updated_at: new Date()
      };

      const mockTimeSlots = [];

      EventType.findByPk.mockResolvedValue(mockEventType);
      Event.create.mockResolvedValue(mockCreatedEvent);
      TimeSlot.findAll.mockResolvedValue(mockTimeSlots);

      // Mock getEventById for return
      Event.findByPk.mockResolvedValue({
        ...mockCreatedEvent,
        EventType: mockEventType,
        User: { user_id: 'user1', nickname: null, avatar: null }
      });

      const result = await eventService.createEvent({
        type_id: 'type_custom',
        title: 'My Event',
        content: 'Content',
        location: 'Location',
        time_slots: [
          {
            slot_name: '笔试',
            start_time: '2026-04-01T09:00:00',
            end_time: '2026-04-01T11:00:00',
            is_all_day: 0
          }
        ]
      }, 'user1');

      expect(Event.create).toHaveBeenCalled();
      expect(TimeSlot.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slot_name: '笔试',
          event_id: 'event_mock_uuid'
        })
      );
    });

    it('should throw error for non-existent event type', async () => {
      EventType.findByPk.mockResolvedValue(null);

      await expect(eventService.createEvent({
        type_id: 'nonexistent',
        title: 'Test'
      }, 'user1')).rejects.toThrow('事件类型不存在');
    });

    it('should throw error when user tries to create system event type', async () => {
      const mockEventType = {
        type_id: 'type_course',
        type_code: 'course',
        is_system: 1
      };

      EventType.findByPk.mockResolvedValue(mockEventType);

      await expect(eventService.createEvent({
        type_id: 'type_course',
        title: 'Course Event'
      }, 'user1')).rejects.toThrow('无权创建该类型事件');
    });
  });

  describe('updateEvent', () => {
    it('should update event fields', async () => {
      const mockEvent = {
        event_id: 'event1',
        user_id: 'user1',
        title: 'Old Title',
        content: 'Old Content',
        status: 0,
        published_at: null,
        save: jest.fn()
      };

      Event.findByPk.mockResolvedValue(mockEvent);

      // Mock getEventById for return
      Event.findByPk
        .mockResolvedValueOnce(mockEvent) // First call in updateEvent
        .mockResolvedValueOnce({ // Second call for getEventById
          event_id: 'event1',
          title: 'New Title',
          content: 'New Content',
          status: 1,
          published_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
          EventType: { type_id: 'type1', type_name: 'Test', type_code: 'test', icon: null, color: null },
          User: null,
          time_slots: []
        });
      TimeSlot.findAll.mockResolvedValue([]);

      const result = await eventService.updateEvent('event1', {
        title: 'New Title',
        content: 'New Content',
        status: 1
      }, 'user1');

      expect(mockEvent.title).toBe('New Title');
      expect(mockEvent.content).toBe('New Content');
      expect(mockEvent.status).toBe(1);
      expect(mockEvent.save).toHaveBeenCalled();
    });

    it('should throw error when event not found', async () => {
      Event.findByPk.mockResolvedValue(null);

      await expect(eventService.updateEvent('nonexistent', { title: 'New' }, 'user1'))
        .rejects.toThrow('事件不存在');
    });

    it('should throw error when user is not the owner', async () => {
      const mockEvent = {
        event_id: 'event1',
        user_id: 'other_user',
        title: 'Title'
      };

      Event.findByPk.mockResolvedValue(mockEvent);

      await expect(eventService.updateEvent('event1', { title: 'New' }, 'user1'))
        .rejects.toThrow('无权编辑该事件');
    });
  });

  describe('deleteEvent', () => {
    it('should delete event when user is owner', async () => {
      const mockEvent = {
        event_id: 'event1',
        user_id: 'user1',
        destroy: jest.fn()
      };

      Event.findByPk.mockResolvedValue(mockEvent);

      await eventService.deleteEvent('event1', 'user1');

      expect(mockEvent.destroy).toHaveBeenCalled();
    });

    it('should throw error when event not found', async () => {
      Event.findByPk.mockResolvedValue(null);

      await expect(eventService.deleteEvent('nonexistent', 'user1'))
        .rejects.toThrow('事件不存在');
    });

    it('should throw error when user is not the owner', async () => {
      const mockEvent = {
        event_id: 'event1',
        user_id: 'other_user'
      };

      Event.findByPk.mockResolvedValue(mockEvent);

      await expect(eventService.deleteEvent('event1', 'user1'))
        .rejects.toThrow('无权删除该事件');
    });
  });

  describe('publishEvent', () => {
    it('should publish event and set published_at', async () => {
      const mockEvent = {
        event_id: 'event1',
        user_id: 'user1',
        title: 'Title',
        status: 0,
        published_at: null,
        save: jest.fn()
      };

      Event.findByPk.mockResolvedValue(mockEvent);

      Event.findByPk
        .mockResolvedValueOnce(mockEvent)
        .mockResolvedValueOnce({
          event_id: 'event1',
          title: 'Title',
          status: 1,
          published_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
          EventType: { type_id: 'type1', type_name: 'Test', type_code: 'test', icon: null, color: null },
          User: null,
          time_slots: []
        });
      TimeSlot.findAll.mockResolvedValue([]);

      const result = await eventService.publishEvent('event1', 'user1');

      expect(mockEvent.status).toBe(1);
      expect(mockEvent.published_at).toBeDefined();
      expect(mockEvent.save).toHaveBeenCalled();
    });
  });

  describe('cancelEvent', () => {
    it('should cancel event', async () => {
      const mockEvent = {
        event_id: 'event1',
        user_id: 'user1',
        title: 'Title',
        status: 1,
        save: jest.fn()
      };

      Event.findByPk.mockResolvedValue(mockEvent);

      Event.findByPk
        .mockResolvedValueOnce(mockEvent)
        .mockResolvedValueOnce({
          event_id: 'event1',
          title: 'Title',
          status: 2,
          created_at: new Date(),
          updated_at: new Date(),
          EventType: { type_id: 'type1', type_name: 'Test', type_code: 'test', icon: null, color: null },
          User: null,
          time_slots: []
        });
      TimeSlot.findAll.mockResolvedValue([]);

      await eventService.cancelEvent('event1', 'user1');

      expect(mockEvent.status).toBe(2);
      expect(mockEvent.save).toHaveBeenCalled();
    });
  });

  describe('addTimeSlot', () => {
    it('should add time slot to event', async () => {
      const mockEvent = {
        event_id: 'event1',
        user_id: 'user1',
        title: 'Title',
        location: 'Default Location'
      };

      const mockSlot = {
        slot_id: 'slot_mock_uuid',
        event_id: 'event1',
        slot_name: '笔试',
        start_time: new Date('2026-04-01T09:00:00'),
        end_time: new Date('2026-04-01T11:00:00'),
        is_all_day: 0,
        location: 'Default Location',
        created_at: new Date()
      };

      Event.findByPk.mockResolvedValue(mockEvent);
      TimeSlot.create.mockResolvedValue(mockSlot);

      const result = await eventService.addTimeSlot('event1', {
        slot_name: '笔试',
        start_time: '2026-04-01T09:00:00',
        end_time: '2026-04-01T11:00:00'
      }, 'user1');

      expect(TimeSlot.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slot_name: '笔试',
          event_id: 'event1'
        })
      );
      expect(result.slot_name).toBe('笔试');
    });

    it('should throw error when event not found', async () => {
      Event.findByPk.mockResolvedValue(null);

      await expect(eventService.addTimeSlot('nonexistent', {
        slot_name: '笔试',
        start_time: '2026-04-01T09:00:00'
      }, 'user1')).rejects.toThrow('事件不存在');
    });
  });

  describe('updateTimeSlot', () => {
    it('should update time slot', async () => {
      const mockEvent = {
        event_id: 'event1',
        user_id: 'user1'
      };

      const mockSlot = {
        slot_id: 'slot1',
        event_id: 'event1',
        slot_name: '笔试',
        start_time: new Date('2026-04-01T09:00:00'),
        end_time: new Date('2026-04-01T11:00:00'),
        is_all_day: 0,
        location: '教室101',
        save: jest.fn()
      };

      Event.findByPk.mockResolvedValue(mockEvent);
      TimeSlot.findOne.mockResolvedValue(mockSlot);

      const result = await eventService.updateTimeSlot('event1', 'slot1', {
        slot_name: '口试'
      }, 'user1');

      expect(mockSlot.slot_name).toBe('口试');
      expect(mockSlot.save).toHaveBeenCalled();
    });

    it('should throw error when time slot not found', async () => {
      const mockEvent = {
        event_id: 'event1',
        user_id: 'user1'
      };

      Event.findByPk.mockResolvedValue(mockEvent);
      TimeSlot.findOne.mockResolvedValue(null);

      await expect(eventService.updateTimeSlot('event1', 'nonexistent', {
        slot_name: '口试'
      }, 'user1')).rejects.toThrow('时间点不存在');
    });
  });

  describe('deleteTimeSlot', () => {
    it('should delete time slot', async () => {
      const mockEvent = {
        event_id: 'event1',
        user_id: 'user1'
      };

      const mockSlot = {
        slot_id: 'slot1',
        event_id: 'event1',
        destroy: jest.fn()
      };

      Event.findByPk.mockResolvedValue(mockEvent);
      TimeSlot.findOne.mockResolvedValue(mockSlot);

      await eventService.deleteTimeSlot('event1', 'slot1', 'user1');

      expect(mockSlot.destroy).toHaveBeenCalled();
    });
  });

  describe('getTodayEvents', () => {
    it('should return today events for subscribed time slots', async () => {
      const mockSubscriptions = [
        { slot_id: 'slot1' },
        { slot_id: 'slot2' }
      ];

      const mockTimeSlots = [
        {
          slot_id: 'slot1',
          slot_name: '笔试',
          start_time: new Date(),
          end_time: null,
          is_all_day: 0,
          location: 'Room 101',
          Event: {
            event_id: 'event1',
            title: 'Today Event',
            EventType: {
              type_id: 'type1',
              type_name: '课程',
              type_code: 'course',
              icon: 'icon1',
              color: '#ff0000'
            }
          }
        }
      ];

      Subscription.findAll.mockResolvedValue(mockSubscriptions);
      TimeSlot.findAll.mockResolvedValue(mockTimeSlots);

      const result = await eventService.getTodayEvents('user1');

      expect(result).toHaveLength(1);
      expect(result[0].slot_name).toBe('笔试');
      expect(result[0].event.title).toBe('Today Event');
    });
  });

  describe('getUpcomingEvents', () => {
    it('should return events grouped by date for next 7 days', async () => {
      const mockSubscriptions = [
        { slot_id: 'slot1' }
      ];

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const mockTimeSlots = [
        {
          slot_id: 'slot1',
          slot_name: '笔试',
          start_time: tomorrow,
          end_time: null,
          is_all_day: 0,
          location: 'Room 202',
          Event: {
            event_id: 'event1',
            title: 'Future Event',
            EventType: {
              type_id: 'type1',
              type_name: '考试',
              type_code: 'exam',
              icon: 'icon2',
              color: '#00ff00'
            }
          }
        }
      ];

      Subscription.findAll.mockResolvedValue(mockSubscriptions);
      TimeSlot.findAll.mockResolvedValue(mockTimeSlots);

      const result = await eventService.getUpcomingEvents('user1');

      expect(result).toHaveLength(7);
      expect(result[0].date).toBeDefined();
      expect(result[0].count).toBeDefined();
      expect(result[0].events).toBeDefined();
    });
  });
});
