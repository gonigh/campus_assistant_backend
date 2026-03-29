/**
 * 统一响应格式
 */
class ApiResponse {
  /**
   * 成功响应
   * @param {any} data - 数据
   * @param {string} message - 消息
   */
  static success(data = null, message = 'success') {
    return {
      code: 0,
      message,
      data
    };
  }

  /**
   * 错误响应
   * @param {number} code - 错误码
   * @param {string} message - 错误消息
   * @param {any} data - 数据
   */
  static error(code = 1, message = 'error', data = null) {
    return {
      code,
      message,
      data
    };
  }

  /**
   * 分页响应
   * @param {any} list - 列表数据
   * @param {number} total - 总数
   * @param {number} page - 当前页
   * @param {number} pageSize - 每页数量
   */
  static page(list, total, page = 1, pageSize = 10) {
    return {
      code: 0,
      message: 'success',
      data: {
        list,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }
}

/**
 * 错误码定义
 */
const ErrorCode = {
  // 通用错误 1xxx
  SUCCESS: 0,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,

  // 业务错误 2xxx
  USER_NOT_FOUND: 2001,
  USER_ALREADY_EXISTS: 2002,
  EVENT_NOT_FOUND: 2003,
  SUBSCRIPTION_NOT_FOUND: 2004,
  INVALID_PARAMETER: 2005,
  WECHAT_API_ERROR: 2006,
  DUPLICATE_SUBSCRIPTION: 2007
};

module.exports = {
  ApiResponse,
  ErrorCode
};
