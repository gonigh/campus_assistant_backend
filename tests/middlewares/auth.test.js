const jwt = require('jsonwebtoken');

// Mock config before importing auth module
jest.mock('../../src/config', () => ({
  jwt: {
    secret: 'test_secret',
    expiresIn: '7d'
  }
}));

const { authMiddleware, generateToken } = require('../../src/middlewares/auth');

describe('Auth Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = { user_id: 'user123', open_id: 'open123' };
      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, 'test_secret');
      expect(decoded.user_id).toBe('user123');
      expect(decoded.open_id).toBe('open123');
    });
  });

  describe('authMiddleware', () => {
    it('should return 401 if no authorization header', () => {
      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 401,
          message: '未提供认证令牌'
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header does not start with Bearer', () => {
      mockReq.headers.authorization = 'Basic token123';

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token', () => {
      mockReq.headers.authorization = 'Bearer invalid_token';

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 401,
          message: '无效的令牌'
        })
      );
    });

    it('should return 401 for expired token', () => {
      const expiredToken = jwt.sign(
        { user_id: 'user123' },
        'test_secret',
        { expiresIn: '-1s' }
      );
      mockReq.headers.authorization = `Bearer ${expiredToken}`;

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 401,
          message: '令牌已过期'
        })
      );
    });

    it('should call next() for valid token', () => {
      const validToken = jwt.sign(
        { user_id: 'user123', open_id: 'open123' },
        'test_secret',
        { expiresIn: '7d' }
      );
      mockReq.headers.authorization = `Bearer ${validToken}`;

      authMiddleware(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.user_id).toBe('user123');
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
