const Redis = require('ioredis');

// Redis 配置
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || null,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  family: 4,
  keyPrefix: 'chat:'
};

// 创建 Redis 实例
const redis = new Redis(redisConfig);

// Redis 错误处理
redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('connect', () => {
  console.log('Redis connected successfully');
});

// Redis 键名常量
const REDIS_KEYS = {
  // 聊天消息: chat:messages:{chatId}
  MESSAGES: 'messages',
  
  // 联系人信息: chat:contact:{chatId}
  CONTACT: 'contact',
  
  // 用户在线状态: chat:online:{userId}
  ONLINE: 'online',
  
  // 用户未读消息: chat:unread:{userId}:{chatId}
  UNREAD: 'unread',
  
  // 用户联系人列表: chat:contacts:{userId}
  CONTACTS: 'contacts'
};

// Redis 工具函数
const redisUtils = {
  // 生成聊天室ID
  generateChatId: (user1Id, user2Id) => {
    const sortedIds = [user1Id, user2Id].sort((a, b) => a - b);
    return `chat_${sortedIds[0]}_${sortedIds[1]}`;
  },

  // 获取消息键名
  getMessageKey: (chatId) => `${REDIS_KEYS.MESSAGES}:${chatId}`,
  
  // 获取联系人键名
  getContactKey: (chatId) => `${REDIS_KEYS.CONTACT}:${chatId}`,
  
  // 获取在线状态键名
  getOnlineKey: (userId) => `${REDIS_KEYS.ONLINE}:${userId}`,
  
  // 获取未读消息键名
  getUnreadKey: (userId, chatId) => `${REDIS_KEYS.UNREAD}:${userId}:${chatId}`,
  
  // 获取联系人列表键名
  getContactsKey: (userId) => `${REDIS_KEYS.CONTACTS}:${userId}`,
  
  // 设置消息过期时间（90天）
  MESSAGE_EXPIRE: 90 * 24 * 60 * 60, // 90天，单位：秒
  
  // 设置在线状态过期时间（5分钟）
  ONLINE_EXPIRE: 5 * 60, // 5分钟，单位：秒
};

module.exports = {
  redis,
  REDIS_KEYS,
  redisUtils
}; 