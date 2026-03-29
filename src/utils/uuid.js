const { v4: uuidv4 } = require('uuid');

/**
 * 生成带前缀的UUID
 * @param {string} prefix - 前缀
 * @returns {string}
 */
function generateId(prefix = '') {
  const uuid = uuidv4().replace(/-/g, '');
  return prefix ? `${prefix}_${uuid}` : uuid;
}

module.exports = {
  generateId
};
