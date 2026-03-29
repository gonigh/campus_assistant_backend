const { ApiResponse, ErrorCode } = require('../utils/response');

/**
 * 全局错误处理中间件
 */
function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Sequelize验证错误
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json(
      ApiResponse.error(ErrorCode.BAD_REQUEST, err.errors[0]?.message || '数据验证失败')
    );
  }

  // Sequelize唯一约束错误
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json(
      ApiResponse.error(ErrorCode.BAD_REQUEST, '数据已存在')
    );
  }

  // 自定义业务错误
  if (err.code && err.message) {
    return res.status(err.statusCode || 500).json(
      ApiResponse.error(err.code, err.message)
    );
  }

  // 未知错误
  res.status(500).json(
    ApiResponse.error(ErrorCode.INTERNAL_ERROR, '服务器内部错误')
  );
}

/**
 * 404处理
 */
function notFoundHandler(req, res) {
  res.status(404).json(
    ApiResponse.error(ErrorCode.NOT_FOUND, '接口不存在')
  );
}

module.exports = {
  errorHandler,
  notFoundHandler
};
