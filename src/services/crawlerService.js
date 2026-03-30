const axios = require('axios');
const cheerio = require('cheerio');
const { Event, EventType } = require('../models');
const { generateId } = require('../utils/uuid');
const { Op } = require('sequelize');
const timepointAgentService = require('./timepointAgentService');

class CrawlerService {
  constructor() {
    this.BASE_URL = 'https://jwc.hdu.edu.cn';

    // 爬取来源配置
    this.SOURCES = [
      {
        listUrl: '/xkjs/list.htm',
        typeId: 'type_contest',
        typeName: '学科竞赛'
      },
      {
        listUrl: '/ksgl/list.htm',
        typeId: 'type_exam_mgmt',
        typeName: '考试管理'
      }
    ];

    // 列表页解析正则
    this.LIST_ITEM_REGEX = /<div class="jzlb clearfix">[\s\S]*?<div class="btt3"><a href="([^"]+)"[^>]*>([^<]+)<\/a><\/div>[\s\S]*?<div class="fbsj4">([^<]+)<\/div>[\s\S]*?<\/div>/g;

    // 请求配置
    this.requestConfig = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
      },
      timeout: 30000
    };
  }

  /**
   * 爬取单个列表页
   * @param {string} listUrl - 列表页路径
   * @param {string} typeId - 类型ID
   * @returns {Promise<Array>} - 事件列表 [{url, title, date}]
   */
  async crawlListPage(listUrl, typeId) {
    const fullUrl = this.BASE_URL + listUrl;
    console.log(`[Crawler] 开始爬取列表页: ${fullUrl}`);

    try {
      const response = await axios.get(fullUrl, this.requestConfig);
      const html = response.data;
      const $ = cheerio.load(html);

      const events = [];

      // 解析列表项
      $('.jzlb.clearfix').each((index, element) => {
        const $el = $(element);
        const $link = $el.find('.btt3 a');
        const $date = $el.find('.fbsj4');

        const url = $link.attr('href');
        const title = $link.text().trim();
        const dateStr = $date.text().trim();

        if (url && title && dateStr) {
          events.push({
            url: url.startsWith('/') ? url : '/' + url,
            title,
            dateStr
          });
        }
      });

      console.log(`[Crawler] 解析到 ${events.length} 条记录`);
      return events;
    } catch (error) {
      console.error(`[Crawler] 爬取列表页失败: ${fullUrl}`, error.message);
      return [];
    }
  }

  /**
   * 爬取详情页
   * @param {string} detailUrl - 详情页路径
   * @returns {Promise<object|null>} - 事件详情
   */
  async crawlDetailPage(detailUrl) {
    const fullUrl = this.BASE_URL + detailUrl;
    console.log(`[Crawler] 开始爬取详情页: ${fullUrl}`);

    try {
      const response = await axios.get(fullUrl, this.requestConfig);
      const html = response.data;
      const $ = cheerio.load(html);

      // 提取标题
      const title = $('.arti_title').first().text().trim();

      // 提取发布信息
      const publisherText = $('.arti_publisher').text().trim();
      const publisher = publisherText.replace('发布者：', '').trim();

      const updateText = $('.arti_update').text().trim();
      const publishedAtStr = updateText.replace('发布时间：', '').trim();

      // 提取浏览次数
      const viewsText = $('.arti_views').text().trim();
      const viewsMatch = viewsText.match(/浏览次数：(\d+)/);
      const views = viewsMatch ? parseInt(viewsMatch[1]) : 0;

      // 提取正文内容
      const content = $('.entry .wp_articlecontent').html() || '';

      // 提取附件信息
      const attachments = [];
      $('.entry a[href*="/_upload"]').each((i, el) => {
        const $el = $(el);
        const href = $el.attr('href');
        const title = $el.text().trim() || $el.attr('title');
        if (href) {
          attachments.push({ url: href, title });
        }
      });

      return {
        title,
        publisher,
        publishedAtStr,
        views,
        content,
        attachments
      };
    } catch (error) {
      console.error(`[Crawler] 爬取详情页失败: ${fullUrl}`, error.message);
      return null;
    }
  }

  /**
   * 检查事件是否已存在
   * @param {string} title - 标题
   * @param {string} dateStr - 发布日期字符串
   * @returns {Promise<boolean>}
   */
  async checkEventExists(title, dateStr) {
    const publishedAt = this.parseDate(dateStr);
    if (!publishedAt) return false;

    const event = await Event.findOne({
      where: {
        title,
        published_at: {
          [Op.gte]: new Date(publishedAt.getFullYear(), publishedAt.getMonth(), publishedAt.getDate()),
          [Op.lt]: new Date(publishedAt.getFullYear(), publishedAt.getMonth(), publishedAt.getDate() + 1)
        }
      }
    });

    return !!event;
  }

  /**
   * 保存事件到数据库
   * @param {object} eventData - 事件数据
   * @param {string} typeId - 类型ID
   * @returns {Promise<object>}
   */
  async saveEvent(eventData, typeId) {
    const { title, publisher, publishedAtStr, content } = eventData;
    const publishedAt = this.parseDate(publishedAtStr);

    const event = await Event.create({
      event_id: generateId('event'),
      type_id: typeId,
      user_id: null, // 系统事件
      title,
      content,
      location: null,
      status: 1, // 已发布
      published_at: publishedAt
    });

    console.log(`[Crawler] 保存事件成功: ${title}`);
    return event;
  }

  /**
   * 解析日期字符串
   * @param {string} dateStr - 日期字符串 (YYYY-MM-DD)
   * @returns {Date|null}
   */
  parseDate(dateStr) {
    if (!dateStr) return null;

    // 处理 "2026-03-13" 格式
    const match = dateStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (match) {
      return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
    }

    return null;
  }

  /**
   * 运行爬虫
   */
  async run() {
    console.log('[Crawler] ========== 开始爬虫任务 ==========');
    console.log(`[Crawler] 开始时间: ${new Date().toISOString()}`);

    let totalNew = 0;
    let totalSkipped = 0;

    for (const source of this.SOURCES) {
      console.log(`\n[Crawler] 处理来源: ${source.typeName} (${source.typeId})`);

      // 1. 爬取列表页
      const listItems = await this.crawlListPage(source.listUrl, source.typeId);

      // 2. 遍历列表，检查并爬取详情
      for (const item of listItems) {
        try {
          // 检查是否已存在
          const exists = await this.checkEventExists(item.title, item.dateStr);
          if (exists) {
            console.log(`[Crawler] 跳过已存在事件: ${item.title}`);
            totalSkipped++;
            continue;
          }

          // 爬取详情页
          const detail = await this.crawlDetailPage(item.url);
          if (detail && detail.content) {
            // 保存事件
            const event = await this.saveEvent(detail, source.typeId);
            totalNew++;

            // 调用Agent解析时间点
            try {
              await timepointAgentService.processEvent(event);
            } catch (error) {
              console.error(`[Crawler] 解析时间点失败: ${item.title}`, error.message);
            }
          } else {
            console.log(`[Crawler] 跳过空内容事件: ${item.title}`);
            totalSkipped++;
          }
        } catch (error) {
          console.error(`[Crawler] 处理事件失败: ${item.title}`, error.message);
        }
      }
    }

    console.log('\n[Crawler] ========== 爬虫任务完成 ==========');
    console.log(`[Crawler] 新增事件: ${totalNew}`);
    console.log(`[Crawler] 跳过事件: ${totalSkipped}`);
    console.log(`[Crawler] 结束时间: ${new Date().toISOString()}`);
  }
}

module.exports = new CrawlerService();
