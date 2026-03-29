// Mock config before importing response
jest.mock('../../src/config', () => ({}));

const { ApiResponse, ErrorCode } = require('../../src/utils/response');

describe('Response Utils', () => {
  describe('ApiResponse', () => {
    describe('success', () => {
      it('should return success response with default values', () => {
        const result = ApiResponse.success();
        expect(result.code).toBe(0);
        expect(result.message).toBe('success');
        expect(result.data).toBeNull();
      });

      it('should return success response with data', () => {
        const data = { id: 1, name: 'test' };
        const result = ApiResponse.success(data);
        expect(result.code).toBe(0);
        expect(result.message).toBe('success');
        expect(result.data).toEqual(data);
      });

      it('should return success response with custom message', () => {
        const result = ApiResponse.success(null, 'Operation completed');
        expect(result.code).toBe(0);
        expect(result.message).toBe('Operation completed');
      });
    });

    describe('error', () => {
      it('should return error response with default values', () => {
        const result = ApiResponse.error();
        expect(result.code).toBe(1);
        expect(result.message).toBe('error');
        expect(result.data).toBeNull();
      });

      it('should return error response with custom code and message', () => {
        const result = ApiResponse.error(404, 'Not found');
        expect(result.code).toBe(404);
        expect(result.message).toBe('Not found');
      });

      it('should return error response with data', () => {
        const result = ApiResponse.error(400, 'Bad request', { field: 'email' });
        expect(result.code).toBe(400);
        expect(result.message).toBe('Bad request');
        expect(result.data).toEqual({ field: 'email' });
      });
    });

    describe('page', () => {
      it('should return paginated response', () => {
        const list = [{ id: 1 }, { id: 2 }];
        const result = ApiResponse.page(list, 100, 1, 10);

        expect(result.code).toBe(0);
        expect(result.message).toBe('success');
        expect(result.data.list).toEqual(list);
        expect(result.data.total).toBe(100);
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(10);
        expect(result.data.totalPages).toBe(10);
      });

      it('should calculate totalPages correctly', () => {
        const result = ApiResponse.page([], 25, 1, 10);
        expect(result.data.totalPages).toBe(3);
      });

      it('should handle string page and pageSize', () => {
        const result = ApiResponse.page([], 50, '2', '20');
        expect(result.data.page).toBe(2);
        expect(result.data.pageSize).toBe(20);
        expect(result.data.totalPages).toBe(3);
      });
    });
  });

  describe('ErrorCode', () => {
    it('should have SUCCESS code of 0', () => {
      expect(ErrorCode.SUCCESS).toBe(0);
    });

    it('should have proper error codes', () => {
      expect(ErrorCode.BAD_REQUEST).toBe(400);
      expect(ErrorCode.UNAUTHORIZED).toBe(401);
      expect(ErrorCode.FORBIDDEN).toBe(403);
      expect(ErrorCode.NOT_FOUND).toBe(404);
      expect(ErrorCode.INTERNAL_ERROR).toBe(500);
    });

    it('should have business error codes starting from 2001', () => {
      expect(ErrorCode.USER_NOT_FOUND).toBe(2001);
      expect(ErrorCode.USER_ALREADY_EXISTS).toBe(2002);
      expect(ErrorCode.EVENT_NOT_FOUND).toBe(2003);
      expect(ErrorCode.SUBSCRIPTION_NOT_FOUND).toBe(2004);
      expect(ErrorCode.INVALID_PARAMETER).toBe(2005);
      expect(ErrorCode.WECHAT_API_ERROR).toBe(2006);
      expect(ErrorCode.DUPLICATE_SUBSCRIPTION).toBe(2007);
    });
  });
});
