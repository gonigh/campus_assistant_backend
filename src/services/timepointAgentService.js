const axios = require('axios');
const config = require('../config');
const { Event, TimeSlot, sequelize } = require('../models');
const { generateId } = require('../utils/uuid');
const fs = require('fs');
const path = require('path');

class TimepointAgentService {
  constructor() {
    this.systemPrompt = this.loadSystemPrompt();
  }

  /**
   * 加载系统提示词
   */
  loadSystemPrompt() {
    const promptPath = path.join(__dirname, '../../spec/crawler/eventTimepointAgent.md');
    try {
      return fs.readFileSync(promptPath, 'utf-8');
    } catch (error) {
      console.error('[TimepointAgent] 加载系统提示词失败:', error.message);
      return this.getDefaultPrompt();
    }
  }

  /**
   * 获取默认提示词
   */
  getDefaultPrompt() {
    return `你是一个专门从校园通知正文中提取事件时间点和地点的解析器。
输入一段校园通知正文，输出JSON格式的时间点列表。
字段：success, timepoints[{description, datetime, end_datetime, location}], raw_text
description必须包含完整的活动/赛事名称+具体事项。`;
  }

  /**
   * 调用AI服务解析时间点
   * @param {string} title - 事件标题
   * @param {string} content - 事件正文内容（HTML）
   */
  async parseTimepoints(title, content) {
    const userPrompt = this.buildUserPrompt(title, content);

    try {
      const response = await this.callAI(userPrompt);
      return this.parseAIResponse(response);
    } catch (error) {
      console.error('[TimepointAgent] AI调用失败:', error.message);
      return { success: false, timepoints: [], error: error.message };
    }
  }

  /**
   * 构建用户提示词
   */
  buildUserPrompt(title, content) {
    // 提取纯文本内容
    const plainText = this.htmlToPlainText(content);

    return `通知标题：${title}

正文内容：
${plainText.substring(0, 8000)}`;
  }

  /**
   * HTML转纯文本
   */
  htmlToPlainText(html) {
    if (!html) return '';
    return html
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 调用AI服务
   */
  async callAI(userPrompt) {
    const { deepseek } = config.agent;

    if (deepseek.apiKey) {
      return this.callDeepSeek(userPrompt, deepseek);
    } else {
      throw new Error('DeepSeek API Key 未配置');
    }
  }

  /**
   * 调用DeepSeek API
   */
  async callDeepSeek(userPrompt, config) {
    console.log('[TimepointAgent] 调用DeepSeek API...');

    try {
      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model: config.model,
          max_tokens: Math.min(config.maxTokens, 4096), // 限制最大token数
          messages: [
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
          },
          timeout: 60000
        }
      );

      console.log('[TimepointAgent] DeepSeek API调用成功');
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('[TimepointAgent] DeepSeek API错误:', error.response?.status, error.response?.data);
      throw error;
    }
  }

  /**
   * 解析AI响应
   */
  parseAIResponse(responseText) {
    try {
      // 提取JSON部分
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { success: false, timepoints: [], error: '无法解析AI响应' };
      }

      const result = JSON.parse(jsonMatch[0]);

      // 验证和清理时间点数据
      if (result.timepoints && Array.isArray(result.timepoints)) {
        result.timepoints = result.timepoints
          .filter(tp => tp.description && tp.datetime)
          .map(tp => ({
            description: tp.description,
            datetime: this.parseDatetime(tp.datetime),
            end_datetime: tp.end_datetime ? this.parseDatetime(tp.end_datetime) : null,
            location: tp.location || null
          }));
      }

      return result;
    } catch (error) {
      console.error('[TimepointAgent] 解析响应失败:', error.message);
      return { success: false, timepoints: [], error: error.message };
    }
  }

  /**
   * 解析日期时间字符串
   */
  parseDatetime(dateStr) {
    if (!dateStr) return null;

    // 格式：YYYY-MM-DD HH:mm 或 YYYY-MM-DD
    const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
    if (match) {
      const [, year, month, day, hour = '00', minute = '00'] = match;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
    }

    return null;
  }

  /**
   * 解析单个事件的时间点并存储
   * @param {object} event - Event实例
   * @returns {Promise<Array>} - 保存的TimeSlot列表
   */
  async processEvent(event) {
    console.log(`[TimepointAgent] 开始处理事件: ${event.title}`);

    // 调用AI解析时间点
    const result = await this.parseTimepoints(event.title, event.content);

    if (!result.success || !result.timepoints || result.timepoints.length === 0) {
      console.log(`[TimepointAgent] 未解析到时间点: ${event.title}`);
      return [];
    }

    console.log(`[TimepointAgent] 解析到 ${result.timepoints.length} 个时间点`);

    // 批量保存时间点
    const savedTimeSlots = [];
    for (const tp of result.timepoints) {
      try {
        const timeSlot = await TimeSlot.create({
          slot_id: generateId('slot'),
          event_id: event.event_id,
          slot_name: tp.description,
          start_time: tp.datetime,
          end_time: tp.end_datetime,
          is_all_day: tp.end_datetime ? 0 : 1,
          location: tp.location
        });
        savedTimeSlots.push(timeSlot);
      } catch (error) {
        console.error(`[TimepointAgent] 保存时间点失败: ${tp.description}`, error.message);
      }
    }

    console.log(`[TimepointAgent] 成功保存 ${savedTimeSlots.length} 个时间点`);
    return savedTimeSlots;
  }

  /**
   * 处理所有未解析时间点的事件
   * 用于定时任务或手动触发
   */
  async processAllPendingEvents() {
    console.log('[TimepointAgent] ========== 开始处理待解析事件 ==========');

    // 查找所有已发布事件
    const allEvents = await Event.findAll({
      where: { status: 1 },
      include: [{ model: TimeSlot, as: 'timeSlots' }]
    });

    // 过滤出没有时间点的事件
    const eventsWithoutSlots = allEvents.filter(e => !e.timeSlots || e.timeSlots.length === 0);

    console.log(`[TimepointAgent] 待处理事件数量: ${eventsWithoutSlots.length}`);

    let successCount = 0;
    for (const event of eventsWithoutSlots) {
      const slots = await this.processEvent(event);
      if (slots.length > 0) {
        successCount++;
      }
    }

    console.log('[TimepointAgent] ========== 处理完成 ==========');
    console.log(`[TimepointAgent] 成功处理: ${successCount} 个事件`);
  }
}

module.exports = new TimepointAgentService();
