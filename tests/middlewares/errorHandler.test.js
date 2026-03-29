// Mock config
jest.mock('../../src/config', () => ({}));

const { errorHandler, notFoundHandler } = require('../../src/middlewares/errorHandler');

describe('Error Handler Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    // Suppress console.error during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('errorHandler', () => {
    it('should handle SequelizeValidationError', () => {
      const err = new Error('Validation error');
      err.name = 'SequelizeValidationError';
      err.errors = [{ message: 'Field is required' }];

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 400,
          message: 'Field is required'
        })
      );
    });

    it('should handle SequelizeUniqueConstraintError', () => {
      const err = new Error('Duplicate entry');
      err.name = 'SequelizeUniqueConstraintError';

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 400,
          message: '数据已存在'
        })
      );
    });

    it('should handle custom business error with code and message', () => {
      const err = new Error('User not found');
      err.code = 2001;
      err.statusCode = 404;

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 2001,
          message: 'User not found'
        })
      );
    });

    it('should handle unknown errors with default values', () => {
      const err = new Error('Something went wrong');

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 500,
          message: '服务器内部错误'
        })
      );
    });

    it('should use default statusCode 500 for custom errors without statusCode', () => {
      const err = new Error('Custom error');
      err.code = 500;

      errorHandler(err, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 with not found message', () => {
      mockReq.originalUrl = '/unknown/path';

      notFoundHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 404,
          message: '接口不存在'
        })
      );
    });
  });
});
