// Mock dependencies
jest.mock('../../src/services/eventService', () => ({
  getEvents: jest.fn(),
  getEventById: jest.fn(),
  createEvent: jest.fn(),
  updateEvent: jest.fn(),
  deleteEvent: jest.fn(),
  publishEvent: jest.fn(),
  cancelEvent: jest.fn(),
  addTimeSlot: jest.fn(),
  updateTimeSlot: jest.fn(),
  deleteTimeSlot: jest.fn(),
  getTodayEvents: jest.fn(),
  getUpcomingEvents: jest.fn()
}));

// Mock config for response module
jest.mock('../../src/config', () => ({}));

const eventController = require('../../src/controllers/eventController');
const eventService = require('../../src/services/eventService');

describe('EventController', () => {
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

  describe('getEvents', () => {
    it('should return events list', async () => {
      mockReq.query = { page: 1, pageSize: 10 };
      eventService.getEvents.mockResolvedValue({
        list: [{ event_id: 'event1', title: 'Test' }],
        total: 1,
        page: 1,
        pageSize: 10
      });

      await eventController.getEvents(mockReq, mockRes, mockNext);

      expect(eventService.getEvents).toHaveBeenCalledWith(mockReq.query);
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 0,
        message: 'success',
        data: {
          list: [{ event_id: 'event1', title: 'Test' }],
          total: 1,
          page: 1,
          pageSize: 10
        }
      });
    });
  });

  describe('getEventById', () => {
    it('should return event details', async () => {
      mockReq.params = { id: 'event1' };
      eventService.getEventById.mockResolvedValue({
        event_id: 'event1',
        title: 'Test Event',
        time_slots: [
          { slot_id: 'slot1', slot_name: '笔试', start_time: new Date() }
        ]
      });

      await eventController.getEventById(mockReq, mockRes, mockNext);

      expect(eventService.getEventById).toHaveBeenCalledWith('event1');
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 0,
        message: 'success',
        data: expect.objectContaining({
          event_id: 'event1',
          title: 'Test Event'
        })
      });
    });

    it('should call next with error when event not found', async () => {
      mockReq.params = { id: 'nonexistent' };
      const error = new Error('事件不存在');
      error.code = 2003;
      error.statusCode = 404;
      eventService.getEventById.mockRejectedValue(error);

      await eventController.getEventById(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('createEvent', () => {
    it('should create event and return success', async () => {
      mockReq.body = {
        type_id: 'type1',
        title: 'New Event',
        content: 'Event content',
        time_slots: [
          { slot_name: '笔试', start_time: '2026-04-01T09:00:00' }
        ]
      };
      mockReq.user = { user_id: 'user1' };
      eventService.createEvent.mockResolvedValue({
        event_id: 'event_new',
        title: 'New Event'
      });

      await eventController.createEvent(mockReq, mockRes, mockNext);

      expect(eventService.createEvent).toHaveBeenCalledWith(mockReq.body, 'user1');
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 0,
        message: '事件创建成功',
        data: expect.objectContaining({
          event_id: 'event_new',
          title: 'New Event'
        })
      });
    });

    it('should call next with error when creation fails', async () => {
      mockReq.body = {
        type_id: 'nonexistent',
        title: 'New Event'
      };
      mockReq.user = { user_id: 'user1' };
      const error = new Error('事件类型不存在');
      error.code = 2005;
      error.statusCode = 400;
      eventService.createEvent.mockRejectedValue(error);

      await eventController.createEvent(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateEvent', () => {
    it('should update event and return success', async () => {
      mockReq.params = { id: 'event1' };
      mockReq.body = { title: 'Updated Title' };
      mockReq.user = { user_id: 'user1' };
      eventService.updateEvent.mockResolvedValue({
        event_id: 'event1',
        title: 'Updated Title'
      });

      await eventController.updateEvent(mockReq, mockRes, mockNext);

      expect(eventService.updateEvent).toHaveBeenCalledWith('event1', mockReq.body, 'user1');
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 0,
        message: '事件更新成功',
        data: expect.objectContaining({
          event_id: 'event1',
          title: 'Updated Title'
        })
      });
    });

    it('should call next with error when user is not owner', async () => {
      mockReq.params = { id: 'event1' };
      mockReq.body = { title: 'Updated Title' };
      mockReq.user = { user_id: 'user1' };
      const error = new Error('无权编辑该事件');
      error.code = 403;
      error.statusCode = 403;
      eventService.updateEvent.mockRejectedValue(error);

      await eventController.updateEvent(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteEvent', () => {
    it('should delete event and return success', async () => {
      mockReq.params = { id: 'event1' };
      mockReq.user = { user_id: 'user1' };
      eventService.deleteEvent.mockResolvedValue();

      await eventController.deleteEvent(mockReq, mockRes, mockNext);

      expect(eventService.deleteEvent).toHaveBeenCalledWith('event1', 'user1');
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 0,
        message: '事件删除成功',
        data: null
      });
    });
  });

  describe('publishEvent', () => {
    it('should publish event successfully', async () => {
      mockReq.params = { id: 'event1' };
      mockReq.user = { user_id: 'user1' };
      eventService.publishEvent.mockResolvedValue({
        event_id: 'event1',
        status: 1,
        published_at: new Date()
      });

      await eventController.publishEvent(mockReq, mockRes, mockNext);

      expect(eventService.publishEvent).toHaveBeenCalledWith('event1', 'user1');
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 0,
        message: '事件发布成功',
        data: expect.objectContaining({
          event_id: 'event1',
          status: 1
        })
      });
    });

    it('should call next with error when user is not owner', async () => {
      mockReq.params = { id: 'event1' };
      mockReq.user = { user_id: 'user1' };
      const error = new Error('无权发布该事件');
      error.code = 403;
      error.statusCode = 403;
      eventService.publishEvent.mockRejectedValue(error);

      await eventController.publishEvent(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('cancelEvent', () => {
    it('should cancel event successfully', async () => {
      mockReq.params = { id: 'event1' };
      mockReq.user = { user_id: 'user1' };
      eventService.cancelEvent.mockResolvedValue({
        event_id: 'event1',
        status: 2
      });

      await eventController.cancelEvent(mockReq, mockRes, mockNext);

      expect(eventService.cancelEvent).toHaveBeenCalledWith('event1', 'user1');
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 0,
        message: '事件已取消',
        data: expect.objectContaining({
          event_id: 'event1',
          status: 2
        })
      });
    });

    it('should call next with error when user is not owner', async () => {
      mockReq.params = { id: 'event1' };
      mockReq.user = { user_id: 'user1' };
      const error = new Error('无权取消该事件');
      error.code = 403;
      error.statusCode = 403;
      eventService.cancelEvent.mockRejectedValue(error);

      await eventController.cancelEvent(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('addTimeSlot', () => {
    it('should add time slot successfully', async () => {
      mockReq.params = { eventId: 'event1' };
      mockReq.body = {
        slot_name: '笔试',
        start_time: '2026-04-01T09:00:00',
        end_time: '2026-04-01T11:00:00',
        is_all_day: 0
      };
      mockReq.user = { user_id: 'user1' };
      eventService.addTimeSlot.mockResolvedValue({
        slot_id: 'slot_new',
        event_id: 'event1',
        slot_name: '笔试',
        start_time: new Date('2026-04-01T09:00:00'),
        end_time: new Date('2026-04-01T11:00:00'),
        is_all_day: 0
      });

      await eventController.addTimeSlot(mockReq, mockRes, mockNext);

      expect(eventService.addTimeSlot).toHaveBeenCalledWith('event1', mockReq.body, 'user1');
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 0,
        message: '时间点添加成功',
        data: expect.objectContaining({
          slot_id: 'slot_new',
          slot_name: '笔试'
        })
      });
    });

    it('should call next with error when event not found', async () => {
      mockReq.params = { eventId: 'nonexistent' };
      mockReq.body = {
        slot_name: '笔试',
        start_time: '2026-04-01T09:00:00'
      };
      mockReq.user = { user_id: 'user1' };
      const error = new Error('事件不存在');
      error.code = 2003;
      error.statusCode = 404;
      eventService.addTimeSlot.mockRejectedValue(error);

      await eventController.addTimeSlot(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateTimeSlot', () => {
    it('should update time slot successfully', async () => {
      mockReq.params = { eventId: 'event1', slotId: 'slot1' };
      mockReq.body = {
        slot_name: '口试',
        start_time: '2026-04-01T14:00:00'
      };
      mockReq.user = { user_id: 'user1' };
      eventService.updateTimeSlot.mockResolvedValue({
        slot_id: 'slot1',
        event_id: 'event1',
        slot_name: '口试',
        start_time: new Date('2026-04-01T14:00:00')
      });

      await eventController.updateTimeSlot(mockReq, mockRes, mockNext);

      expect(eventService.updateTimeSlot).toHaveBeenCalledWith('event1', 'slot1', mockReq.body, 'user1');
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 0,
        message: '时间点更新成功',
        data: expect.objectContaining({
          slot_id: 'slot1',
          slot_name: '口试'
        })
      });
    });

    it('should call next with error when time slot not found', async () => {
      mockReq.params = { eventId: 'event1', slotId: 'nonexistent' };
      mockReq.body = { slot_name: '新名称' };
      mockReq.user = { user_id: 'user1' };
      const error = new Error('时间点不存在');
      error.code = 2003;
      error.statusCode = 404;
      eventService.updateTimeSlot.mockRejectedValue(error);

      await eventController.updateTimeSlot(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteTimeSlot', () => {
    it('should delete time slot successfully', async () => {
      mockReq.params = { eventId: 'event1', slotId: 'slot1' };
      mockReq.user = { user_id: 'user1' };
      eventService.deleteTimeSlot.mockResolvedValue();

      await eventController.deleteTimeSlot(mockReq, mockRes, mockNext);

      expect(eventService.deleteTimeSlot).toHaveBeenCalledWith('event1', 'slot1', 'user1');
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 0,
        message: '时间点删除成功',
        data: null
      });
    });

    it('should call next with error when time slot not found', async () => {
      mockReq.params = { eventId: 'event1', slotId: 'nonexistent' };
      mockReq.user = { user_id: 'user1' };
      const error = new Error('时间点不存在');
      error.code = 2003;
      error.statusCode = 404;
      eventService.deleteTimeSlot.mockRejectedValue(error);

      await eventController.deleteTimeSlot(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getTodayEvents', () => {
    it('should return today events', async () => {
      mockReq.user = { user_id: 'user1' };
      eventService.getTodayEvents.mockResolvedValue([
        {
          slot_id: 'slot1',
          slot_name: '笔试',
          start_time: new Date(),
          event: { event_id: 'event1', title: '期末考试' }
        }
      ]);

      await eventController.getTodayEvents(mockReq, mockRes, mockNext);

      expect(eventService.getTodayEvents).toHaveBeenCalledWith('user1');
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 0,
        message: 'success',
        data: expect.arrayContaining([
          expect.objectContaining({
            slot_id: 'slot1',
            slot_name: '笔试'
          })
        ])
      });
    });
  });

  describe('getUpcomingEvents', () => {
    it('should return upcoming events grouped by date', async () => {
      mockReq.user = { user_id: 'user1' };
      eventService.getUpcomingEvents.mockResolvedValue([
        { date: '2026-03-30', count: 2, events: [] },
        { date: '2026-03-31', count: 1, events: [] }
      ]);

      await eventController.getUpcomingEvents(mockReq, mockRes, mockNext);

      expect(eventService.getUpcomingEvents).toHaveBeenCalledWith('user1');
      expect(mockRes.json).toHaveBeenCalledWith({
        code: 0,
        message: 'success',
        data: expect.arrayContaining([
          expect.objectContaining({ date: '2026-03-30', count: 2 }),
          expect.objectContaining({ date: '2026-03-31', count: 1 })
        ])
      });
    });
  });
});
