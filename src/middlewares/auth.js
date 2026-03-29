const jwt = require('jsonwebtoken');
const config = require('../config');
const { ApiResponse, ErrorCode } = require('../utils/response');

/**
 * JWT认证中间件
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(ApiResponse.error(ErrorCode.UNAUTHORIZED, '未提供认证令牌'));
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json(ApiResponse.error(ErrorCode.UNAUTHORIZED, '令牌已过期'));
    }
    return res.status(401).json(ApiResponse.error(ErrorCode.UNAUTHORIZED, '无效的令牌'));
  }
}

/**
 * 生成JWT令牌
 * @param {object} payload - 用户信息
 * @returns {string}
 */
function generateToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
}

module.exports = {
  authMiddleware,
  generateToken
};
