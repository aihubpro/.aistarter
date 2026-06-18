const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const pool = require('../database');
// const { redis, redisUtils } = require('../config/redis');
const config = require('../config');
const { readConfig, writeConfig } = require('../helpers/storage');
const { isContainsLink, containsBannedWords,formatDate } = require('../utils/utils');

class ChatServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // 存储客户端连接信息: userId -> ws
    
    this.init();
  }

  init() {
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    // 定期检查用户在线状态，处理连接超时
    this.startOnlineStatusCheck();
  }

  // 定期检查用户在线状态
  startOnlineStatusCheck() {
    setInterval(async () => {
      try {
        const currentTime = Date.now();
        const offlineUsers = [];

        // 检查所有已连接用户的在线状态
        for (const [userId, client] of this.clients) {
          const onlineKey = redisUtils.getOnlineKey(userId);
          const exists = await redis.exists(onlineKey);
          
          if (!exists) {
            // 用户在线状态已过期，标记为离线
            offlineUsers.push(userId);
          }
        }

        // 处理离线用户
        for (const userId of offlineUsers) {
          console.log(`User ${userId} connection timeout, marking as offline`);
          this.handleDisconnect(userId);
        }
      } catch (error) {
        console.error('Online status check error:', error);
      }
    }, 30000); // 每30秒检查一次
  }

  async handleConnection(ws, req) {
    try {
      // 从 URL 参数获取 token
      const url = new URL(req.url, 'http://localhost');
      const token = url.searchParams.get('token');
      
      if (!token) {
        ws.close(1008, 'Token required');
        return;
      }

      // 验证 JWT token
      const decoded = jwt.verify(token, config.JWT_SECTET_KEY);
      const userId = decoded.id;
      const username = decoded.username;

      // 存储客户端信息
      this.clients.set(userId, {
        userId,
        username,
        ws
      });

      // 设置用户在线状态
      await this.setUserOnline(userId);

      console.log(`User ${username} (${userId}) connected`);

      // 发送连接成功消息
      ws.send(JSON.stringify({
        type: 'connection',
        data: {
          userId,
          username,
          message: 'Connected to chat server'
        }
      }));

      // 处理消息
      ws.on('message', (message) => {
        this.handleMessage(ws, message, userId, username);
      });

      // 处理断开连接
      ws.on('close', () => {
        this.handleDisconnect(userId);
      });

      // 处理错误
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.handleDisconnect(userId);
      });

    } catch (error) {
      console.error('Connection error:', error);
      ws.close(1008, 'Authentication failed');
    }
  }

  async handleMessage(ws, message, userId, username) {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'send_message':
          await this.sendMessage(ws, data, userId, username);
          break;
        case 'typing':
          this.broadcastTyping(ws, data, userId, username);
          break;
        case 'read_messages':
          await this.markMessagesAsRead(data.chatId, userId);
          break;
        case 'heartbeat':
          await this.handleHeartbeat(ws, userId);
          break;
        default:
          ws.send(JSON.stringify({
            type: 'error',
            data: { message: 'Unknown message type' }
          }));
      }
    } catch (error) {
      console.error('Message handling error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Invalid message format' }
      }));
    }
  }

  async sendMessage(ws, data, userId, username) {
    const { content, chatId, targetUserId } = data;
    console.log(data);
    console.log(content,chatId,targetUserId);
    if (!content || !chatId || !targetUserId) {
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Missing required parameters' }
      }));
      return;
    }

    try {
        // 获取屏蔽词列表配置
        let messageBlockList = await readConfig("message_block_list");
        if (!messageBlockList) {
          messageBlockList = require("../datas/message_block_list.data");
        }
        
        // 检查是否可以发链接
        if (!messageBlockList.messagehttp) {
          if (isContainsLink(content)) {
            ws.send(JSON.stringify({
              type: 'error',
              data: { message: '消息内容不能包含链接' }
            }));
            return;
          }
        }
        
        // 检查消息内容是否包含屏蔽词
        const bannedResult = containsBannedWords(content, messageBlockList.list);
        if (bannedResult.hasBannedWords) {
          ws.send(JSON.stringify({
            type: 'error',
            data: { message: `消息内容包含敏感词: ${bannedResult.bannedWord}` }
          }));
          return;
        }
        
        // 验证用户是否有权限发送消息到此聊天
      const contact = await pool.query(
        'SELECT * FROM contacts WHERE chat_id = ? AND (user1_id = ? OR user2_id = ?)',
        [chatId, userId, userId]
      );

      if (contact.length === 0) {
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: 'No permission to send message to this chat' }
        }));
        return;
      }

      // 获取用户头像信息
      const userInfo = await pool.query(
        'SELECT ui.avatar_url FROM users_info ui WHERE ui.user_id = ?',
        [userId]
      );

      const avatar = userInfo.length > 0 ? userInfo[0].avatar_url : null;

      // 生成消息ID
      const messageId = Date.now() + Math.random().toString(36).substr(2, 9);

      // 构建消息数据
      const messageData = {
        id: messageId,
        content: content,
        uid: userId,
        chatid: targetUserId,
        user: {
          username: username,
          avatar: avatar
        },
        createTime: new Date().toISOString(),
        chatId: chatId,
        user1Id: contact[0].user1_id,
        user2Id: contact[0].user2_id
      };

      // 保存消息到Redis
      const saved = await this.saveMessageToRedis(messageData);
      
      if (!saved) {
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: 'Failed to save message' }
        }));
        return;
      }

      // 发送消息给发送者确认
      ws.send(JSON.stringify({
        type: 'message_sent',
        data: messageData
      }));

      // 发送消息给接收者
      const targetClient = this.clients.get(targetUserId);
      if (targetClient && targetClient.ws.readyState === WebSocket.OPEN) {
        targetClient.ws.send(JSON.stringify({
          type: 'new_message',
          data: messageData
        }));
      }

      console.log(`Message from ${username} to ${targetUserId}: ${content}`);
    } catch (error) {
      console.error('Send message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Failed to send message' }
      }));
    }
  }

  broadcastTyping(ws, data, userId, username) {
    const { chatId, targetUserId, isTyping } = data;
    
    if (!chatId || !targetUserId) return;

    const targetClient = this.clients.get(targetUserId);
    if (targetClient && targetClient.ws.readyState === WebSocket.OPEN) {
      targetClient.ws.send(JSON.stringify({
        type: 'typing',
        data: {
          userId: userId,
          username: username,
          chatId: chatId,
          isTyping: isTyping
        }
      }));
    }
  }

  async markMessagesAsRead(chatId, userId) {
    try {
      const unreadKey = redisUtils.getUnreadKey(userId, chatId);
      await redis.del(unreadKey);
    } catch (error) {
      console.error('Mark messages as read error:', error);
    }
  }

  async setUserOnline(userId) {
    try {
      const onlineKey = redisUtils.getOnlineKey(userId);
      await redis.set(onlineKey, '1', 'EX', redisUtils.ONLINE_EXPIRE);
      
      // 广播用户上线状态到相关聊天室
      await this.broadcastUserStatusToChats(userId, true);
    } catch (error) {
      console.error('Set user online error:', error);
    }
  }

  async setUserOffline(userId) {
    try {
      const onlineKey = redisUtils.getOnlineKey(userId);
      await redis.del(onlineKey);
      
      // 广播用户下线状态到相关聊天室
      await this.broadcastUserStatusToChats(userId, false);
    } catch (error) {
      console.error('Set user offline error:', error);
    }
  }

  // 处理心跳消息
  async handleHeartbeat(ws, userId) {
    try {
      // 更新用户在线状态
      const onlineKey = redisUtils.getOnlineKey(userId);
      await redis.set(onlineKey, '1', 'EX', redisUtils.ONLINE_EXPIRE);
      
      // 发送心跳响应
      ws.send(JSON.stringify({
        type: 'heartbeat_response',
        data: {
          timestamp: new Date().toISOString()
        }
      }));
    } catch (error) {
      console.error('Handle heartbeat error:', error);
    }
  }

  // 向用户所在的聊天室广播状态变化
  async broadcastUserStatusToChats(userId, isOnline) {
    try {
      // 获取用户参与的所有聊天室
      const contacts = await pool.query(
        'SELECT chat_id, user1_id, user2_id FROM contacts WHERE user1_id = ? OR user2_id = ?',
        [userId, userId]
      );

      if (contacts.length === 0) return;

      const statusMessage = {
        type: 'user_status_change',
        data: {
          userId: userId,
          isOnline: isOnline,
          timestamp: new Date().toISOString()
        }
      };

      // 向每个聊天室的另一个用户广播状态变化
      for (const contact of contacts) {
        const otherUserId = contact.user1_id === userId ? contact.user2_id : contact.user1_id;
        const otherClient = this.clients.get(otherUserId);
        
        if (otherClient && otherClient.ws.readyState === WebSocket.OPEN) {
          otherClient.ws.send(JSON.stringify({
            ...statusMessage,
            data: {
              ...statusMessage.data,
              chatId: contact.chat_id
            }
          }));
        }
      }

      console.log(`Broadcasted ${isOnline ? 'online' : 'offline'} status for user ${userId} to ${contacts.length} chat(s)`);
    } catch (error) {
      console.error('Broadcast user status to chats error:', error);
    }
  }

  handleDisconnect(userId) {
    const client = this.clients.get(userId);
    if (client) {
      this.setUserOffline(userId);
      this.clients.delete(userId);
      console.log(`User ${client.username} (${userId}) disconnected`);
    }
  }

  async saveMessageToRedis(messageData) {
    try {
      const messageKey = redisUtils.getMessageKey(messageData.chatId);
      const contactKey = redisUtils.getContactKey(messageData.chatId);
      
      // 保存消息到Redis List
      await redis.lpush(messageKey, JSON.stringify(messageData));
      await redis.expire(messageKey, redisUtils.MESSAGE_EXPIRE);
      
      // 更新联系人最后消息信息
      await redis.hmset(contactKey, {
        lastMessage: messageData.content,
        lastMessageTime: messageData.createTime,
        lastSenderId: messageData.uid
      });
      await redis.expire(contactKey, redisUtils.MESSAGE_EXPIRE);
      
      // 增加未读消息计数（除了发送者）
      const otherUserId = messageData.uid === messageData.user1Id ? messageData.user2Id : messageData.user1Id;
      const unreadKey = redisUtils.getUnreadKey(otherUserId, messageData.chatId);
      await redis.incr(unreadKey);
      await redis.expire(unreadKey, redisUtils.MESSAGE_EXPIRE);
      
      return true;
    } catch (error) {
      console.error('Save message to Redis error:', error);
      return false;
    }
  }

  // 获取在线用户数量
  getOnlineUserCount() {
    return this.clients.size;
  }

  // 获取所有在线用户
  getOnlineUsers() {
    const onlineUsers = [];
    this.clients.forEach((client, userId) => {
      onlineUsers.push({
        userId: userId,
        username: client.username
      });
    });
    return onlineUsers;
  }
}

class DbChatServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // 存储客户端连接信息: userId -> ws
    
    this.init();
  }

  init() {
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });
  }

  async handleConnection(ws, req) {
    try {
      // 从 URL 参数获取 token
      const url = new URL(req.url, 'http://localhost');
      const token = url.searchParams.get('token');
      const isAdmin = url.searchParams.get('admin');
      
      if (!token) {
        ws.close(1008, 'Token required');
        return;
      }

      // 验证 JWT token
      const decoded = jwt.verify(token, config.JWT_SECTET_KEY);
      const userId = decoded.id;
      const username = decoded.username;
      const userRole = decoded.id_role;

      // 如果是管理员连接，使用简化的处理逻辑
      if (isAdmin) {
        //管理员验证token中的user_role是否为1 （管理员）
        if (userRole != 1) {
          ws.close(1008, `Admin token required`);
          return;
        }
        await this.handleAdminConnection(ws, userId, username);
        return;
      }

      // 存储客户端信息
      this.clients.set(userId, {
        userId,
        username,
        ws
      });

      console.log(`User ${username} (${userId}) connected`);

      // 发送连接成功消息
      ws.send(JSON.stringify({
        type: 'connection',
        data: {
          userId,
          username,
          message: 'Connected to chat server'
        }
      }));

      // 发送当前在线用户状态给新连接的用户
      await this.sendOnlineUsersStatus(userId, username);

      // 广播用户上线状态
      await this.broadcastUserStatusChange(userId, username, true);

      // 处理消息
      ws.on('message', (message) => {
        this.handleMessage(ws, message, userId, username);
      });

      // 处理断开连接
      ws.on('close', () => {
        this.handleDisconnect(userId);
      });

      // 处理错误
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.handleDisconnect(userId);
      });

    } catch (error) {
      console.error('Connection error:', error);
      ws.close(1008, 'Authentication failed');
    }
  }

  // 管理员专用连接处理
  async handleAdminConnection(ws, userId, username) {
    console.log(`Admin ${username} (${userId}) connected`);

    // 发送连接成功消息
    ws.send(JSON.stringify({
      type: 'admin_connection',
      data: {
        userId,
        username,
        message: 'Admin connected to chat server'
      }
    }));

    // 处理管理员消息
    ws.on('message', (message) => {
      this.handleAdminMessage(ws, message, userId, username);
    });

    // 处理断开连接
    ws.on('close', () => {
      console.log(`Admin ${username} (${userId}) disconnected`);
    });

    // 处理错误
    ws.on('error', (error) => {
      console.error('Admin WebSocket error:', error);
    });
  }

  // 管理员消息处理
  async handleAdminMessage(ws, message, userId, username) {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'admin_broadcast':
          await this.handleAdminBroadcast(ws, data, userId, username);
          break;
        case 'admin_send_message':
          await this.handleAdminSendMessage(ws, data, userId, username);
          break;
        default:
          ws.send(JSON.stringify({
            type: 'admin_error',
            data: { message: 'Unknown admin message type' }
          }));
      }
    } catch (error) {
      console.error('Admin message handling error:', error);
      ws.send(JSON.stringify({
        type: 'admin_error',
        data: { message: 'Invalid message format' }
      }));
    }
  }

  // 管理员广播消息
  async handleAdminBroadcast(ws, data, userId, username) {
    const { content, messageIdDate } = data;
    
    if (!content || !messageIdDate) {
      ws.send(JSON.stringify({
        type: 'admin_error',
        data: { message: 'Missing required parameters' }
      }));
      return;
    }

    try {
      // 构建广播消息数据
      const messageData = {
        id: Date.now(), // 使用时间戳作为临时ID
        content: content,
        uid: 0, // 管理员ID为0
        chatid: 'broadcast',
        user: {
          username: 'AIstarter',
          avatar: 'AIstarter/AIstarter.png'
        },
        messageIdDate,
        chatId: 'chat_0_0',
        createTime: new Date().toISOString()
      };

      // 发送确认消息给管理员
      ws.send(JSON.stringify({
        type: 'admin_broadcast_sent',
        data: messageData
      }));

      // 广播给所有在线用户
      this.clients.forEach((client) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify({
            type: 'new_message',
            data: messageData
          }));
        }
      });

      console.log(`Admin broadcast from ${username}: ${content}`);
    } catch (error) {
      console.error('Admin broadcast error:', error);
      ws.send(JSON.stringify({
        type: 'admin_error',
        data: { message: 'Failed to send broadcast' }
      }));
    }
  }

  // 管理员发送私聊消息
  async handleAdminSendMessage(ws, data, userId, username) {
    const { content, targetUserId, messageIdDate,targetName } = data;
    
    if (!content || !messageIdDate) {
      ws.send(JSON.stringify({
        type: 'admin_error',
        data: { message: 'Missing required parameters' }
      }));
      return;
    }

    if(!targetUserId && !targetName){
      ws.send(JSON.stringify({
        type: 'admin_error',
        data: { message: 'Missing required parameters' }
      }));
      return;
    }

    let targerIddate = targetUserId

    if(targetName){
      //查询用户
      const user = await pool.query(`SELECT * FROM users WHERE username = ?`, [targetName]);
      if(user.length > 0){
        targerIddate = user[0].id
      }
    }

    try {
      // 构建私聊消息数据
      const messageData = {
        id: Date.now(), // 使用时间戳作为临时ID
        content: content,
        uid: 0, // 管理员ID为0
        chatid: targerIddate,
        user: {
          username: 'AIstarter',
          avatar: 'AIstarter/AIstarter.png'
        },
        messageIdDate,
        chatId: `chat_0_${targerIddate}`,
        createTime: new Date().toISOString()
      };
      console.log(messageData)

      // 发送确认消息给管理员
      ws.send(JSON.stringify({
        type: 'admin_message_sent',
        data: messageData
      }));

      // 发送消息给目标用户
      const targetClient = this.clients.get(parseInt(targerIddate));
      if (targetClient && targetClient.ws.readyState === WebSocket.OPEN) {
        targetClient.ws.send(JSON.stringify({
          type: 'new_message',
          data: messageData
        }));
      }

      console.log(`Admin message from ${username} to ${targerIddate}: ${content}`);
    } catch (error) {
      console.error('Admin send message error:', error);
      ws.send(JSON.stringify({
        type: 'admin_error',
        data: { message: 'Failed to send message' }
      }));
    }
  }

  async handleMessage(ws, message, userId, username) {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'send_message':
          await this.sendMessage(ws, data, userId, username);
          break;
        case 'typing':
          this.broadcastTyping(ws, data, userId, username);
          break;
        case 'read_messages':
          await this.markMessagesAsRead(data.chatId, userId);
          break;
        case 'heartbeat':
          await this.handleHeartbeat(ws, userId);
          break;
        default:
          ws.send(JSON.stringify({
            type: 'error',
            data: { message: 'Unknown message type' }
          }));
      }
    } catch (error) {
      console.error('Message handling error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Invalid message format' }
      }));
    }
  }

  async sendMessage(ws, data, userId, username) {
    const { content, chatId, targetUserId,messageIdDate } = data;
    console.log("send_message",content,chatId,targetUserId,messageIdDate)
    if (!content || !chatId || !targetUserId || !messageIdDate) {
      // 检查是否为官方会话，禁止普通用户发送消息
      if (chatId.startsWith('chat_0_')) {
        ws.send(JSON.stringify({
          type: 'message_send_failed',
          data: { message: '不允许向官方会话发送消息',messageIdDate }
        }));
        return;
      }
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Missing required parameters' }
      }));
      return;
    }

    try {
      //判断用户是否禁言
      const getbandate = await pool.query(
        'SELECT status,ban_expire_time FROM users WHERE id = ?',
        [userId]
      );
      if (getbandate[0].status == 1 && getbandate[0].ban_expire_time > Date.now()) { //用户被禁言
        const banExpireDate = formatDate(getbandate[0].ban_expire_time);
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: `您已被禁言，禁言到期时间：${banExpireDate}` }
        }));
        return;
      }else if (getbandate[0].status == 2 && getbandate[0].ban_expire_time > Date.now()) { //用户被封禁
        const banExpireDate = formatDate(getbandate[0].ban_expire_time);
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: `您已被封禁，封禁到期时间：${banExpireDate}` }
        }));
        return;
      }else if (getbandate[0].status == 3) { //用户被永久封禁
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: '您已被永久封禁' }
        }));
        return;
      }
      // 获取屏蔽词列表配置
      let messageBlockList = await readConfig("message_block_list");
      if (!messageBlockList) {
        messageBlockList = require("../datas/message_block_list.data");
      }
      
      // 检查是否可以发链接
      if (!messageBlockList.messagehttp) {
        if (isContainsLink(content)) {
          ws.send(JSON.stringify({
            type: 'message_send_failed',
            data: { message: '消息内容不能包含链接',messageIdDate }
          }));
          return;
        }
      }
      
      // 检查消息内容是否包含屏蔽词
      const bannedResult = containsBannedWords(content, messageBlockList.list);
      if (bannedResult.hasBannedWords) {
        ws.send(JSON.stringify({
          type: 'message_send_failed',
          data: { message: `消息内容包含敏感词: ${bannedResult.bannedWord}`,messageIdDate }
        }));
        return;
      }
        
        // 验证用户是否有权限发送消息到此聊天
      const session = await pool.query(
        'SELECT * FROM chat_sessions WHERE chat_id = ? AND (user1_id = ? OR user2_id = ?)',
        [chatId, userId, userId]
      );

      if (session.length === 0) {
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: 'No permission to send message to this chat' }
        }));
        return;
      }

      // 获取用户头像信息
      const userInfo = await pool.query(
        'SELECT ui.avatar_url FROM users_info ui WHERE ui.user_id = ?',
        [userId]
      );

      const avatar = userInfo.length > 0 ? userInfo[0].avatar_url : null;

      // 实时保存消息到数据库
      const insertResult = await pool.query(
        'INSERT INTO chat_messages (chat_id, sender_id, receiver_id, content, message_type, is_read) VALUES (?, ?, ?, ?, ?, ?)',
        [chatId, userId, targetUserId, content, 'text', 0]
      );

      const messageId = insertResult.insertId;

      // 更新会话信息
      await pool.query(
        `UPDATE chat_sessions 
         SET last_message_id = ?, 
             last_message_time = ?,
             user1_unread_count = CASE 
               WHEN user1_id = ? THEN user1_unread_count 
               ELSE user1_unread_count + 1
             END,
             user2_unread_count = CASE 
               WHEN user2_id = ? THEN user2_unread_count 
               ELSE user2_unread_count + 1
             END
         WHERE chat_id = ?`,
        [messageId, new Date(), userId, userId, chatId]
      );

      // 构建消息数据
      const messageData = {
        id: messageId,
        content: content,
        uid: userId,
        chatid: targetUserId,
        user: {
          username: username,
          avatar: avatar
        },
        messageIdDate,
        chatId: chatId,
        user1Id: session[0].user1_id,
        user2Id: session[0].user2_id,
        createTime: new Date().toISOString()
      };

      // 发送消息给发送者确认
      ws.send(JSON.stringify({
        type: 'message_sent',
        data: messageData
      }));

      // 发送消息给接收者
      const targetClient = this.clients.get(targetUserId);
      if (targetClient && targetClient.ws.readyState === WebSocket.OPEN) {
        targetClient.ws.send(JSON.stringify({
          type: 'new_message',
          data: messageData
        }));
      }

      console.log(`Message from ${username} to ${targetUserId}: ${content}`);
    } catch (error) {
      console.error('Send message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Failed to send message' }
      }));
    }
  }



  broadcastTyping(ws, data, userId, username) {
    const { chatId, targetUserId, isTyping } = data;
    
    if (!chatId || !targetUserId) return;

    const targetClient = this.clients.get(targetUserId);
    if (targetClient && targetClient.ws.readyState === WebSocket.OPEN) {
      targetClient.ws.send(JSON.stringify({
        type: 'typing',
        data: {
          userId: userId,
          username: username,
          chatId: chatId,
          isTyping: isTyping
        }
      }));
    }
  }

  async markMessagesAsRead(chatId, userId) {
    try {
      // 更新数据库中的消息状态
      await pool.query(
        'UPDATE chat_messages SET is_read = 1 WHERE chat_id = ? AND receiver_id = ? AND is_read = 0',
        [chatId, userId]
      );

      // 更新会话中的未读消息数
      await pool.query(
        `UPDATE chat_sessions 
         SET user1_unread_count = CASE WHEN user1_id = ? THEN 0 ELSE user1_unread_count END,
             user2_unread_count = CASE WHEN user2_id = ? THEN 0 ELSE user2_unread_count END
         WHERE chat_id = ?`,
        [userId, userId, chatId]
      );
    } catch (error) {
      console.error('Mark messages as read error:', error);
    }
  }

  // 处理心跳消息
  async handleHeartbeat(ws, userId) {
    try {
      // 发送心跳响应
      ws.send(JSON.stringify({
        type: 'heartbeat_response',
        data: {
          timestamp: new Date().toISOString()
        }
      }));
    } catch (error) {
      console.error('Handle heartbeat error:', error);
    }
  }

  // 用户断开连接处理
  async handleDisconnect(userId) {
    const client = this.clients.get(userId);
    if (client) {
      console.log(`User ${client.username} (${userId}) disconnected`);
      
      // 广播用户下线状态
      await this.broadcastUserStatusChange(userId, client.username, false);
      
      // 清理客户端信息
      this.clients.delete(userId);
    }
  }

  // 发送当前在线用户状态给新连接的用户
  async sendOnlineUsersStatus(userId, username) {
    try {
      // 获取用户参与的所有聊天会话
      const sessions = await pool.query(
        'SELECT chat_id, user1_id, user2_id FROM chat_sessions WHERE user1_id = ? OR user2_id = ?',
        [userId, userId]
      );

      const client = this.clients.get(userId);
      if (!client || client.ws.readyState !== WebSocket.OPEN) {
        return;
      }

      // 为每个聊天会话发送相关用户的在线状态
      for (const session of sessions) {
        const otherUserId = session.user1_id === userId ? session.user2_id : session.user1_id;
        const otherClient = this.clients.get(otherUserId);

        if (otherClient) {
          // 发送其他用户的在线状态
          client.ws.send(JSON.stringify({
            type: 'user_status_change',
            data: {
              userId: otherUserId,
              username: otherClient.username,
              chatId: session.chat_id,
              isOnline: true,
              timestamp: new Date().toISOString()
            }
          }));
        }
      }

      console.log(`Sent online users status to ${username} (${userId})`);
    } catch (error) {
      console.error('Send online users status error:', error);
    }
  }

  // 广播用户状态变更
  async broadcastUserStatusChange(userId, username, isOnline) {
    try {
      // 获取用户参与的所有聊天会话
      const sessions = await pool.query(
        'SELECT chat_id, user1_id, user2_id FROM chat_sessions WHERE user1_id = ? OR user2_id = ?',
        [userId, userId]
      );

      // 向每个相关聊天室广播状态变更
      for (const session of sessions) {
        const otherUserId = session.user1_id === userId ? session.user2_id : session.user1_id;
        const otherClient = this.clients.get(otherUserId);

        if (otherClient && otherClient.ws.readyState === WebSocket.OPEN) {
          otherClient.ws.send(JSON.stringify({
            type: 'user_status_change',
            data: {
              userId: userId,
              username: username,
              chatId: session.chat_id,
              isOnline: isOnline,
              timestamp: new Date().toISOString()
            }
          }));
        }
      }

      console.log(`Broadcasted ${isOnline ? 'online' : 'offline'} status for user ${username} (${userId})`);
    } catch (error) {
      console.error('Broadcast user status change error:', error);
    }
  }

  // 获取在线用户数量
  getOnlineUserCount() {
    return this.clients.size;
  }

  // 获取所有在线用户
  getOnlineUsers() {
    const onlineUsers = [];
    this.clients.forEach((client, userId) => {
      onlineUsers.push({
        userId: userId,
        username: client.username
      });
    });
    return onlineUsers;
  }
}

module.exports = {ChatServer,DbChatServer};