const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '校园事件通知与时间管理系统 API',
      version: '1.0.0',
      description: '为大学生提供统一的事件通知与时间管理服务 API 文档',
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: '开发环境服务器'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'apiKey',
          name: 'Authorization',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT 认证令牌，格式: Bearer <token>'
        }
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '状态码，0表示成功' },
            message: { type: 'string', description: '消息' },
            data: { type: 'object', description: '数据' }
          }
        },
        User: {
          type: 'object',
          properties: {
            user_id: { type: 'string', description: '用户ID' },
            nickname: { type: 'string', description: '昵称' },
            avatar: { type: 'string', description: '头像URL' },
            default_reminder_minutes: { type: 'integer', description: '默认提醒分钟数' },
            created_at: { type: 'string', format: 'date-time', description: '创建时间' }
          }
        },
        EventType: {
          type: 'object',
          properties: {
            type_id: { type: 'string', description: '类型ID' },
            parent_id: { type: 'string', description: '父类型ID', nullable: true },
            type_name: { type: 'string', description: '类型名称' },
            type_code: { type: 'string', description: '类型编码' },
            description: { type: 'string', description: '类型描述', nullable: true },
            icon: { type: 'string', description: '图标', nullable: true },
            color: { type: 'string', description: '颜色', nullable: true },
            sort_order: { type: 'integer', description: '排序' },
            is_system: { type: 'integer', description: '是否系统类型' },
            created_at: { type: 'string', format: 'date-time', description: '创建时间' }
          }
        },
        EventTypeTree: {
          type: 'object',
          properties: {
            type_id: { type: 'string', description: '类型ID' },
            type_name: { type: 'string', description: '类型名称' },
            type_code: { type: 'string', description: '类型编码' },
            description: { type: 'string', description: '类型描述', nullable: true },
            icon: { type: 'string', description: '图标', nullable: true },
            color: { type: 'string', description: '颜色', nullable: true },
            sort_order: { type: 'integer', description: '排序' },
            is_system: { type: 'integer', description: '是否系统类型' },
            children: {
              type: 'array',
              description: '子类型',
              items: { $ref: '#/components/schemas/EventTypeTree' }
            }
          }
        },
        Event: {
          type: 'object',
          properties: {
            event_id: { type: 'string', description: '事件ID' },
            title: { type: 'string', description: '标题' },
            content: { type: 'string', description: '正文内容' },
            location: { type: 'string', description: '地点' },
            start_time: { type: 'string', format: 'date-time', description: '开始时间' },
            end_time: { type: 'string', format: 'date-time', description: '结束时间' },
            is_all_day: { type: 'integer', description: '是否全天' },
            status: { type: 'integer', description: '状态：0-草稿 1-已发布 2-已取消' },
            published_at: { type: 'string', format: 'date-time', description: '发布时间' },
            type: { $ref: '#/components/schemas/EventType' },
            creator: { $ref: '#/components/schemas/User' }
          }
        },
        Subscription: {
          type: 'object',
          properties: {
            subscription_id: { type: 'string', description: '订阅ID' },
            type_id: { type: 'string', description: '类型ID' },
            is_enabled: { type: 'integer', description: '是否启用' },
            type: { $ref: '#/components/schemas/EventType' }
          }
        },
        Reminder: {
          type: 'object',
          properties: {
            reminder_id: { type: 'string', description: '提醒ID' },
            minutes_before: { type: 'integer', description: '提前分钟数' },
            is_enabled: { type: 'integer', description: '是否启用' },
            last_notified_at: { type: 'string', format: 'date-time', description: '最后通知时间' }
          }
        }
      }
    },
    tags: [
      { name: '用户', description: '用户相关接口' },
      { name: '事件类型', description: '事件类型相关接口' },
      { name: '事件', description: '事件相关接口' },
      { name: '订阅', description: '订阅相关接口' }
    ],
    paths: {
      '/api/health': {
        get: {
          summary: '健康检查',
          description: '检查服务器是否正常运行',
          tags: ['其他'],
          responses: {
            '200': {
              description: '服务器正常运行',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/user/login': {
        post: {
          summary: '微信授权登录',
          description: '通过微信授权码获取用户信息并登录',
          tags: ['用户'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['code'],
                  properties: {
                    code: { type: 'string', description: '微信授权码' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: '登录成功',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              user: { $ref: '#/components/schemas/User' },
                              token: { type: 'string', description: 'JWT令牌' }
                            }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },
      '/api/user/info': {
        get: {
          summary: '获取用户信息',
          description: '获取当前登录用户的详细信息',
          tags: ['用户'],
          security: [{ BearerAuth: [] }],
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/User' }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },
      '/api/user/update': {
        post: {
          summary: '更新用户信息',
          description: '更新当前登录用户的昵称、头像或默认提醒时间',
          tags: ['用户'],
          security: [{ BearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    nickname: { type: 'string', description: '昵称' },
                    avatar: { type: 'string', description: '头像URL' },
                    default_reminder_minutes: { type: 'integer', description: '默认提醒分钟数' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: '更新成功',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/User' }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },
      '/api/event-types/tree': {
        get: {
          summary: '获取事件类型树',
          description: '获取事件类型的层级树形结构',
          tags: ['事件类型'],
          security: [{ BearerAuth: [] }],
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/EventTypeTree' }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },
      '/api/event-types': {
        get: {
          summary: '获取所有事件类型',
          description: '获取所有事件类型（扁平列表）',
          tags: ['事件类型'],
          security: [{ BearerAuth: [] }],
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/EventType' }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        },
        post: {
          summary: '创建事件类型',
          description: '创建新的事件类型',
          tags: ['事件类型'],
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['type_name', 'type_code'],
                  properties: {
                    parent_id: { type: 'string', description: '父类型ID，NULL表示顶级' },
                    type_name: { type: 'string', description: '类型名称' },
                    type_code: { type: 'string', description: '类型编码' },
                    description: { type: 'string', description: '类型描述' },
                    icon: { type: 'string', description: '图标' },
                    color: { type: 'string', description: '颜色（HEX）' },
                    sort_order: { type: 'integer', description: '排序', default: 0 }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: '创建成功',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/event-types/{id}': {
        get: {
          summary: '获取事件类型详情',
          description: '根据ID获取事件类型详细信息，包含父类型和子类型关联',
          tags: ['事件类型'],
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, description: '类型ID', schema: { type: 'string' } }
          ],
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            allOf: [
                              { $ref: '#/components/schemas/EventType' },
                              {
                                type: 'object',
                                properties: {
                                  parent: {
                                    type: 'object',
                                    properties: {
                                      type_id: { type: 'string' },
                                      type_name: { type: 'string' },
                                      type_code: { type: 'string' }
                                    }
                                  },
                                  children: {
                                    type: 'array',
                                    items: {
                                      type: 'object',
                                      properties: {
                                        type_id: { type: 'string' },
                                        type_name: { type: 'string' },
                                        type_code: { type: 'string' }
                                      }
                                    }
                                  }
                                }
                              }
                            ]
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        },
        put: {
          summary: '更新事件类型',
          description: '更新事件类型信息',
          tags: ['事件类型'],
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, description: '类型ID', schema: { type: 'string' } }
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    type_name: { type: 'string', description: '类型名称' },
                    description: { type: 'string', description: '类型描述' },
                    icon: { type: 'string', description: '图标' },
                    color: { type: 'string', description: '颜色（HEX）' },
                    sort_order: { type: 'integer', description: '排序' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: '更新成功',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        },
        delete: {
          summary: '删除事件类型',
          description: '删除事件类型',
          tags: ['事件类型'],
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, description: '类型ID', schema: { type: 'string' } }
          ],
          responses: {
            '200': {
              description: '删除成功',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/event-types/{id}/children': {
        get: {
          summary: '获取子类型',
          description: '获取指定类型的子类型列表',
          tags: ['事件类型'],
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, description: '类型ID', schema: { type: 'string' } }
          ],
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: {
                              allOf: [
                                { $ref: '#/components/schemas/EventType' },
                                {
                                  type: 'object',
                                  properties: {
                                    parent_id: { type: 'string', description: '父类型ID', nullable: true },
                                    created_at: { type: 'string', format: 'date-time', description: '创建时间' }
                                  }
                                }
                              ]
                            }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },
      '/api/events': {
        get: {
          summary: '获取事件列表',
          description: '获取事件列表，支持分页和筛选',
          tags: ['事件'],
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'type_id', in: 'query', description: '事件类型ID', schema: { type: 'string' } },
            { name: 'status', in: 'query', description: '状态：0-草稿 1-已发布 2-已取消', schema: { type: 'integer' } },
            { name: 'start_date', in: 'query', description: '开始日期', schema: { type: 'string', format: 'date' } },
            { name: 'end_date', in: 'query', description: '结束日期', schema: { type: 'string', format: 'date' } },
            { name: 'keyword', in: 'query', description: '搜索关键词', schema: { type: 'string' } },
            { name: 'page', in: 'query', description: '页码', schema: { type: 'integer', default: 1 } },
            { name: 'pageSize', in: 'query', description: '每页数量', schema: { type: 'integer', default: 10 } }
          ],
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              list: {
                                type: 'array',
                                items: { $ref: '#/components/schemas/Event' }
                              },
                              total: { type: 'integer' },
                              page: { type: 'integer' },
                              pageSize: { type: 'integer' },
                              totalPages: { type: 'integer' }
                            }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        },
        post: {
          summary: '创建事件',
          description: '创建新事件，普通用户只能创建 custom 类型',
          tags: ['事件'],
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['type_id', 'title', 'start_time'],
                  properties: {
                    type_id: { type: 'string', description: '事件类型ID' },
                    title: { type: 'string', description: '标题' },
                    content: { type: 'string', description: '正文内容' },
                    location: { type: 'string', description: '地点' },
                    start_time: { type: 'string', format: 'date-time', description: '开始时间' },
                    end_time: { type: 'string', format: 'date-time', description: '结束时间' },
                    is_all_day: { type: 'integer', description: '是否全天', enum: [0, 1] },
                    reminder_minutes: { type: 'integer', description: '提醒提前分钟数' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: '创建成功',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/events/today': {
        get: {
          summary: '获取今日事件',
          description: '获取今天的事件列表（按用户订阅筛选）',
          tags: ['事件'],
          security: [{ BearerAuth: [] }],
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Event' }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },
      '/api/events/upcoming': {
        get: {
          summary: '获取未来7天事件',
          description: '获取未来7天的事件，按日期分组',
          tags: ['事件'],
          security: [{ BearerAuth: [] }],
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                date: { type: 'string', description: '日期' },
                                count: { type: 'integer', description: '事件数量' },
                                events: { type: 'array', items: { $ref: '#/components/schemas/Event' } }
                              }
                            }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },
      '/api/events/{id}': {
        get: {
          summary: '获取事件详情',
          description: '根据ID获取事件详细信息',
          tags: ['事件'],
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, description: '事件ID', schema: { type: 'string' } }
          ],
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/Event' }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        },
        put: {
          summary: '更新事件',
          description: '更新事件信息，只能编辑自己创建的事件',
          tags: ['事件'],
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, description: '事件ID', schema: { type: 'string' } }
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                    location: { type: 'string' },
                    start_time: { type: 'string', format: 'date-time' },
                    end_time: { type: 'string', format: 'date-time' },
                    is_all_day: { type: 'integer', enum: [0, 1] },
                    status: { type: 'integer', enum: [0, 1, 2] }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: '更新成功',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        },
        delete: {
          summary: '删除事件',
          description: '删除事件，只能删除自己创建的事件',
          tags: ['事件'],
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, description: '事件ID', schema: { type: 'string' } }
          ],
          responses: {
            '200': {
              description: '删除成功',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/subscriptions': {
        get: {
          summary: '获取订阅列表',
          description: '获取当前用户的订阅列表',
          tags: ['订阅'],
          security: [{ BearerAuth: [] }],
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Subscription' }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        },
        post: {
          summary: '更新订阅状态',
          description: '开启或关闭某个事件类型的订阅',
          tags: ['订阅'],
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['type_id', 'is_enabled'],
                  properties: {
                    type_id: { type: 'string', description: '事件类型ID' },
                    is_enabled: { type: 'integer', description: '是否启用', enum: [0, 1] }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: '更新成功',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiResponse' }
                }
              }
            }
          }
        }
      },
      '/api/subscriptions/calendar': {
        get: {
          summary: '获取日历视图',
          description: '获取订阅的日历视图数据',
          tags: ['订阅'],
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'start_date', in: 'query', description: '开始日期', schema: { type: 'string', format: 'date' } },
            { name: 'end_date', in: 'query', description: '结束日期', schema: { type: 'string', format: 'date' } }
          ],
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                date: { type: 'string', description: '日期' },
                                slots: { type: 'array', items: { type: 'object' } }
                              }
                            }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: []
};

module.exports = swaggerJsdoc(options);
