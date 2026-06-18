const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const pool = require('../database');
const config = require('../config');

class DbChatServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // 存储客户端连接信息: userId -> ws
    this.messageCache = new Map(); // 存储消息缓存: chatId -> messages[]
    this.userSessions = new Map(); // 存储用户会话: userId -> Set<chatId>
    
    this.init();
  }

  init() {
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    // 定期检查用户在线状态
    this.startOnlineStatusCheck();
  }

  // 定期检查用户在线状态
  startOnlineStatusCheck() {
    setInterval(async () => {
      try {
        const offlineUsers = [];

        // 检查所有已连接用户的在线状态
        for (const [userId, client] of this.clients) {
          // 这里可以添加心跳检测逻辑
          // 暂时使用简单的连接状态检查
          if (client.ws.readyState !== WebSocket.OPEN) {
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

      // 初始化用户会话
      this.userSessions.set(userId, new Set());

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
    
    if (!content || !chatId || !targetUserId) {
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Missing required parameters' }
      }));
      return;
    }

    try {
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

      // 生成消息ID
      const messageId = Date.now() + Math.random().toString(36).substr(2, 9);

      // 构建消息数据
      const messageData = {
        id: messageId,
        content: content,
        sender_id: userId,
        receiver_id: targetUserId,
        chat_id: chatId,
        user: {
          username: username,
          avatar: avatar
        },
        createTime: new Date().toISOString()
      };

      // 缓存消息到内存
      this.cacheMessage(chatId, messageData);

      // 添加到用户会话
      this.addToUserSession(userId, chatId);

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

  // 缓存消息到内存
  cacheMessage(chatId, messageData) {
    if (!this.messageCache.has(chatId)) {
      this.messageCache.set(chatId, []);
    }
    this.messageCache.get(chatId).push(messageData);
  }

  // 添加到用户会话
  addToUserSession(userId, chatId) {
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId).add(chatId);
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

  // 用户断开连接时保存消息到数据库
  async handleDisconnect(userId) {
    const client = this.clients.get(userId);
    if (client) {
      console.log(`User ${client.username} (${userId}) disconnected, saving messages to database...`);
      
      try {
        // 保存用户参与的所有聊天消息
        await this.saveUserMessagesToDatabase(userId);
        
        // 清理内存缓存
        this.cleanupUserData(userId);
        
        console.log(`Messages saved for user ${userId}`);
      } catch (error) {
        console.error(`Failed to save messages for user ${userId}:`, error);
      }
    }
  }

  // 保存用户消息到数据库
  async saveUserMessagesToDatabase(userId) {
    const userSessions = this.userSessions.get(userId);
    if (!userSessions) return;

    for (const chatId of userSessions) {
      const messages = this.messageCache.get(chatId);
      if (!messages || messages.length === 0) continue;

      try {
        // 批量插入消息
        const values = messages.map(msg => [
          msg.chat_id,
          msg.sender_id,
          msg.receiver_id,
          msg.content,
          'text', // message_type
          0 // is_read
        ]);

        if (values.length > 0) {
          await pool.query(
            'INSERT INTO chat_messages (chat_id, sender_id, receiver_id, content, message_type, is_read) VALUES ?',
            [values]
          );

          // 更新会话信息
          const lastMessage = messages[messages.length - 1];
          await pool.query(
            `UPDATE chat_sessions 
             SET last_message_time = ?, 
                 user1_unread_count = user1_unread_count + ?,
                 user2_unread_count = user2_unread_count + ?
             WHERE chat_id = ?`,
            [
              lastMessage.createTime,
              messages.filter(m => m.receiver_id === userId).length,
              messages.filter(m => m.sender_id === userId).length,
              chatId
            ]
          );
        }

        // 清空该聊天的缓存
        this.messageCache.delete(chatId);
      } catch (error) {
        console.error(`Failed to save messages for chat ${chatId}:`, error);
      }
    }
  }

  // 清理用户数据
  cleanupUserData(userId) {
    this.clients.delete(userId);
    this.userSessions.delete(userId);
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

module.exports = DbChatServer; 