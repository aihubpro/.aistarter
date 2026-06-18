<template>
    <div class="message-container">
        <!-- Header -->
        <div class="message-header">
            <div class="header-content">
                <div class="header-left">
                <el-icon class="header-icon"><ChatDotRound /></el-icon>
                <h2 class="header-title">{{ $t('mymessage.message_center') }}</h2>
                </div>
                <div class="header-actions">
                <div class="connection-status">
                    <div :class="['status-indicator', { connected: isConnected }]"></div>
                    <span class="status-text">{{ isConnected ? $t('mymessage.connected') : $t('mymessage.connecting') }}</span>
                    <el-button 
                        v-if="!isConnected" 
                        type="text" 
                        size="small" 
                        @click="connectWebSocket"
                        style="margin-left: 4px; padding: 0; font-size: 12px;"
                    >
                        {{ $t('mymessage.reconnect') }}
                    </el-button>
                </div>
                <el-button type="primary" size="small" @click="refreshMessages">
                    <el-icon><Refresh /></el-icon>
                    {{ $t('mymessage.refresh') }}
                </el-button>
                <el-button size="small" @click="showSettings = true">
                    <el-icon><Setting /></el-icon>
                    {{ $t('mymessage.settings') }}
                </el-button>
                <!--<el-button 
                    size="small" 
                    :type="debugMode ? 'warning' : 'info'"
                    @click="debugMode = !debugMode"
                    title="调试模式"
                >
                    <el-icon><Setting /></el-icon>
                    {{ debugMode ? '调试开' : '调试关' }}
                </el-button> -->
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="message-main">
            <!-- Left Sidebar - Contact List -->
            <div class="contact-sidebar">
                <div class="sidebar-header">
                <el-input
                    v-model="searchQuery"
                    :placeholder="$t('mymessage.search_contacts')"
                    :prefix-icon="Search"
                    clearable
                    size="small"
                    class="search-input"
                />
                </div>
                
                <div class="contact-list">
                    <el-scrollbar height="100%">
                        <div
                        v-for="contact in filteredContacts"
                        :key="contact.chatId"
                        :class="['contact-item', { active: selectedContact?.chatId === contact.chatId }]"
                        @click="selectContact(contact)"
                        >
                            <div class="contact-avatar">
                                <el-avatar :src="contact.avatar || defaultAvatar" :size="40">
                                    <el-icon><User /></el-icon>
                                </el-avatar>
                                <div v-if="contact.unreadCount > 0" class="unread-badge">
                                  {{ contact.unreadCount > 99 ? '99+' : contact.unreadCount }}
                                </div>
                                <div v-if="contact.isOnline" class="online-indicator"></div>
                            </div>
                            
                            <div class="contact-info">
                                <div class="contact-name"><div>{{ contact.username }}</div></div>
                                <div class="contact-last-message">{{ contact.lastMessage || $t('mymessage.no_messages') }}</div>
                            </div>
                            
                            <div class="contact-meta">
                                <div class="contact-time">{{ formatTime(contact.lastMessageTime) }}</div>
                                <div v-if="contact.unreadCount > 0" class="unread-dot"></div>
                            </div>
                            
                            <!-- 删除按钮 -->
                            <div class="contact-delete" v-if="contact?.chatId && !contact.chatId.includes('chat_0')">
                                <el-button 
                                    size="small" 
                                    :icon="Close" 
                                    circle 
                                    @click.stop="deleteContact(contact)"
                                    class="delete-btn"
                                    :title="$t('mymessage.delete_contact')"
                                />
                            </div>
                        </div>
                        
                        <!-- 加载更多联系人 -->
                        <div v-if="hasMoreContacts" class="load-more-contacts">
                            <el-button 
                                type="text" 
                                size="small" 
                                @click="loadMoreContacts"
                                :loading="loadingContacts"
                            >
                                {{ $t('mymessage.load_more_contacts') }}
                            </el-button>
                        </div>
                    </el-scrollbar>
                </div>
            </div>

            <!-- Right Side - Chat Area -->
            <div class="chat-area">
                <div v-if="selectedContact" class="chat-container">
                    <!-- Chat Header -->
                    <div class="chat-header">
                        <div class="chat-contact-info">
                            <el-avatar :src="selectedContact.avatar || defaultAvatar" :size="32" @click="goGuestPage(selectedContact.userId)">
                                <el-icon><User /></el-icon>
                            </el-avatar>
                            <div class="contact-details">
                                <div class="contact-name" @click="goGuestPage(selectedContact.userId)">{{ selectedContact.username }}</div>
                                <div class="contact-status">
                                    <span v-if="selectedContact.isOnline" class="status-online">{{ $t('mymessage.online') }}</span>
                                    <span v-else class="status-offline">{{ $t('mymessage.offline') }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="contact-list text-12px color-gray" @click="goGuestPage(selectedContact.userId)" v-if="selectedContact.userId"> 
                          {{ $t('mymessage.enter_personal_page') }}
                        </div>
                    </div>

                    <!-- Chat Messages -->
                    <div class="chat-messages" @click="handleChatAreaClick">
                         <u-chat 
                         :config="chatConfig" 
                         @load-more="loadMoreMessages" 
                         @submit="sendMessage"
                         @focus="handleChatFocus"
                         @keydown="handleChatKeydown"
                         class="chat-component"
                         ref="scrollbarRef"
                         >
                             <template #header>
                                 <div class="chat-header-placeholder">
                                    <!--<div class="input-hint">
                                        <span class="hint-text">{{ $t('mymessage.send_message_hint') }}</span>
                                    </div>-->
                                </div>
                             </template>
                         </u-chat>
                    </div>
                      <!-- 新的提示文本位置 - 在输入框下方 -->
                      <div class="input-hint-container">
                          <div class="input-hint">
                              <span class="hint-text">{{ $t('mymessage.send_message_hint') }}</span>
                          </div>
                      </div>
                </div>

                <!-- Empty State -->
                <div v-else class="empty-state">
                    <div class="empty-content">
                        <el-icon class="empty-icon"><ChatDotRound /></el-icon>
                        <h3 class="empty-title">{{ $t('mymessage.select_contact_to_chat') }}</h3>
                        <p class="empty-description">{{ $t('mymessage.select_contact_description') }}</p>
                        
                        <!-- Debug Information -->
                        <!-- <div v-if="debugMode" class="debug-info">
                            <h4>调试信息</h4>
                            <p>WebSocket 状态: {{ isConnected ? '已连接' : '未连接' }}</p>
                            <p>WebSocket URL: {{ WS_BASE }}</p>
                            <p>API URL: {{ API_BASE }}</p>
                            <p>用户ID: {{ userStoreIns.userInfo.id }}</p>
                            <p>联系人数量: {{ contacts.length }}</p>
                            <p>Token: {{ tokenStatus }}</p>
                        </div> -->
                    </div>
                </div>
            </div>
        </div>

        <!-- Settings Dialog -->
        <el-dialog
        v-model="showSettings"
        :title="$t('mymessage.message_settings')"
        width="500px"
        :close-on-click-modal="false"
        class="settings-dialog"
        >
        <div class="settings-content">
            <el-form :model="settings" label-width="100px">
                <el-form-item :label="$t('mymessage.clear_cache')">
                    <el-button type="warning" size="small" @click="clearCache">
                        {{ $t('mymessage.clear_all_cache') }}
                    </el-button>
                    <!--
                    <el-button type="info" size="small" @click="clearExpiredCache" style="margin-left: 8px;">
                        {{ $t('mymessage.clear_expired_cache') }}
                    </el-button>
                    -->
                </el-form-item>
                <!--<el-form-item :label="$t('mymessage.message_notifications')">
                    <el-switch v-model="settings.notifications" />
                </el-form-item>
                <el-form-item :label="$t('mymessage.sound_notifications')">
                    <el-switch v-model="settings.sound" />
                </el-form-item>
                <el-form-item :label="$t('mymessage.auto_reply')">
                    <el-input
                        v-model="settings.autoReply"
                        type="textarea"
                        :rows="3"
                        :placeholder="$t('mymessage.auto_reply_placeholder')"
                    />
                </el-form-item>-->
            </el-form>
        </div>
        
        <!--<template #footer>
            <el-button @click="showSettings = false">{{ $t('mymessage.cancel') }}</el-button>
            <el-button type="primary" @click="saveSettings">{{ $t('mymessage.save') }}</el-button>
        </template>-->
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, onUnmounted, nextTick,inject } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { 
  ChatDotRound, 
  Refresh, 
  Setting, 
  Search, 
  User, 
  Phone, 
  VideoCamera, 
  MoreFilled,
  Delete,
  Close
} from '@element-plus/icons-vue'
import { ChatConfigApi, ChatApi } from 'undraw-ui'
import { usePage } from 'undraw-ui'
import emoji from '../../emoji'
import { userStore } from '../../stores/UserStore'
import axios from 'axios'
import { useRouter } from 'vue-router';  // 引入 useRoute
const router = useRouter()
const { t } = useI18n()

const {startMessageTimer,stopMessageTimer,hasMessage,checkHasMessage} = inject('main') as any;

const emojis = { ...emoji, activeIndex: 0 }

// Store
const userStoreIns = userStore()

const userUrl = (window as any).Constants.uploadUrl+'/assets/user-images/'
const defaultAvatar = new URL("~/assets/ai_noimg.png", import.meta.url).href

// API base URL
const API_BASE = (window as any).Constants.apiUrl || 'http://localhost:7000'
const WS_BASE = (window as any).Constants.wsUrl || 'ws://localhost:7000'

// WebSocket connection
let ws: WebSocket | null = null
const isConnected = ref(false)
const debugMode = ref(false) // Set to true to enable debug logging

// Reactive data
const searchQuery = ref('')
const selectedContact = ref<any>(null)
const showSettings = ref(false)
const settings = reactive({
  notifications: true,
  sound: true,
  autoReply: ''
})

// 联系人相关数据
const contacts = ref<any[]>([])
const contactsPage = ref(1)
const contactsSize = ref(20)
const hasMoreContacts = ref(true)
const loadingContacts = ref(false)

// Chat configuration
const chatConfig = reactive<ChatConfigApi>({
  user: {
    id: userStoreIns.userInfo.id || 1,
    username: userStoreIns.userInfo.username || userStoreIns.userInfo.email || '我',
    avatar: userUrl+userStoreIns.userInfo.avatar || defaultAvatar
  },
  data: [],
  emoji: emojis
})

// 聊天消息缓存
const chatMessages = ref<{ [key: string]: ChatApi[] }>({})

// 防止重复请求的标记
const loadingChatHistory = ref<{ [key: string]: boolean }>({})

// 本地缓存管理
interface CacheItem {
  data: any
  timestamp: number
  lastAccessed: number
}

interface CacheConfig {
  maxSize: number
  expireTime: number // 缓存过期时间（毫秒）
}

class LocalCache {
  private cache: Map<string, CacheItem> = new Map()
  private config: CacheConfig

  constructor(config: CacheConfig) {
    this.config = config
    this.loadFromStorage()
  }

  // 从localStorage加载缓存
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('chat_cache')
      if (stored) {
        const data = JSON.parse(stored)
        this.cache = new Map(Object.entries(data))
      }
    } catch (error) {
      console.error('Failed to load cache from storage:', error)
    }
  }

  // 保存缓存到localStorage
  private saveToStorage() {
    try {
      const data = Object.fromEntries(this.cache)
      localStorage.setItem('chat_cache', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save cache to storage:', error)
    }
  }

  // 检查缓存是否过期
  private isExpired(item: CacheItem): boolean {
    return Date.now() - item.timestamp > this.config.expireTime
  }

  // 清理过期缓存
  private cleanExpired() {
    for (const [key, item] of this.cache) {
      if (this.isExpired(item)) {
        this.cache.delete(key)
      }
    }
  }

  // 清理最久未使用的缓存（LRU策略）
  private evictLRU() {
    if (this.cache.size <= this.config.maxSize) return

    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, item] of this.cache) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      console.log('Evicted cache item:', oldestKey)
    }
  }

  // 获取缓存
  get(key: string): any | null {
    this.cleanExpired()
    const item = this.cache.get(key)
    
    if (item && !this.isExpired(item)) {
      item.lastAccessed = Date.now()
      this.saveToStorage()
      return item.data
    }
    
    if (item) {
      this.cache.delete(key)
    }
    
    return null
  }

  // 设置缓存
  set(key: string, data: any) {
    this.cleanExpired()
    
    // 如果缓存满了，删除最久未使用的
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU()
    }

    const now = Date.now()
    this.cache.set(key, {
      data,
      timestamp: now,
      lastAccessed: now
    })
    
    this.saveToStorage()
  }

  // 删除缓存
  delete(key: string) {
    this.cache.delete(key)
    this.saveToStorage()
  }

  // 清空所有缓存
  clear() {
    this.cache.clear()
    localStorage.removeItem('chat_cache')
  }

  // 获取缓存统计信息
  getStats() {
    this.cleanExpired()
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Computed
const filteredContacts = computed(() => {
  if (!searchQuery.value) return contacts.value
  return contacts.value.filter(contact => 
    contact.username.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const tokenStatus = computed(() => {
  return (window as any).localStorage.getItem('token') ? '已设置' : '未设置'
})

// API 请求函数
const apiRequest = async (url: string, options: any = {}) => {
  try {
    const token = localStorage.getItem('token') || ''
    const response = await axios({
      url: `${API_BASE}${url}`,
      method: options.method || 'GET',
      data: options.data,
      params: options.params,
      headers: {
        'access-token': token,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })
    return response.data
  } catch (error: any) {
    console.error('API request error:', error)
    ElMessage.error(error.response?.data?.msg || '请求失败')
    throw error
  }
}

//跳转到用户首页
const goGuestPage = (id) => {
  if(!id){
    return;
  }
  router.push({ path: "/guest", query: { id:id } })
}

// 获取联系人列表
const fetchContacts = async (page = 1, append = false, forceRefresh = false) => {
  try {
    loadingContacts.value = true
    
    // 生成缓存键，包含用户ID以区分不同用户的联系人
    const userId = userStoreIns.userInfo?.id || 'anonymous'
    const cacheKey = `contacts_${userId}_${page}_${contactsSize.value}`
    
    // 优先从缓存获取数据（除非强制刷新）
    if (!append && !forceRefresh) {
      const cachedData = cache.get(cacheKey)
      if (cachedData) {
        console.log('Using cached contacts data for page:', page)
        
        const newContacts = cachedData.records.map((contact: any) => ({
          ...contact,
          avatar: userUrl+contact.avatar || defaultAvatar
        }))
        
        // 保留现有的在线状态信息
        const existingContacts = contacts.value
        contacts.value = newContacts.map((newContact: any) => {
          const existingContact = existingContacts.find(ec => ec.chatId === newContact.chatId)
          return {
            ...newContact,
            isOnline: existingContact?.isOnline ?? newContact.isOnline ?? false
          }
        })
        
        contacts.value.sort((a, b) => {
          // 最优先：匹配 initiateChatUser 的 uid
          const targetUserId = userStoreIns.initiateChatUser
          if (targetUserId) {
            if (a.userId == targetUserId && b.userId != targetUserId) return -1
            if (a.userId != targetUserId && b.userId == targetUserId) return 1
          }
          
          // 优先显示有未读消息的联系人
          if (a.unreadCount > 0 && b.unreadCount === 0) return -1
          if (a.unreadCount === 0 && b.unreadCount > 0) return 1
          // 如果都有未读消息，按未读数量降序排列
          if (a.unreadCount > 0 && b.unreadCount > 0) {
            return b.unreadCount - a.unreadCount
          }
          // 其他情况按最后消息时间排序
          return new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime()
        })
        
        hasMoreContacts.value = newContacts.length === contactsSize.value
        contactsPage.value = page
        console.log('contacts from cache', contacts.value)
        return
      }
    }
    
    // 从API获取数据
    const response = await apiRequest('/chat/contacts', {
      params: { page, size: contactsSize.value }
    })
    
    if (response.code === 0) {
      // 缓存API响应数据
      cache.set(cacheKey, response.data)
      
      const newContacts = response.data.records.map((contact: any) => ({
        ...contact,
        avatar: userUrl+contact.avatar || defaultAvatar
      }))
      
      if (append) {
        contacts.value.push(...newContacts)
      } else {
        // 保留现有的在线状态信息
        const existingContacts = contacts.value
        contacts.value = newContacts.map((newContact: any) => {
          const existingContact = existingContacts.find(ec => ec.chatId === newContact.chatId)
          return {
            ...newContact,
            isOnline: existingContact?.isOnline ?? newContact.isOnline ?? false
          }
        })
        contacts.value.sort((a, b) => {
          // 最优先：匹配 initiateChatUser 的 uid
          const targetUserId = userStoreIns.initiateChatUser
          if (targetUserId) {
            if (a.userId == targetUserId && b.userId != targetUserId) return -1
            if (a.userId != targetUserId && b.userId == targetUserId) return 1
          }
          
          // 优先显示有未读消息的联系人
          if (a.unreadCount > 0 && b.unreadCount === 0) return -1
          if (a.unreadCount === 0 && b.unreadCount > 0) return 1
          // 如果都有未读消息，按未读数量降序排列
          if (a.unreadCount > 0 && b.unreadCount > 0) {
            return b.unreadCount - a.unreadCount
          }
          // 其他情况按最后消息时间排序
          return new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime()
        })
      }
      hasMoreContacts.value = newContacts.length === contactsSize.value
      contactsPage.value = page
      console.log('contacts from API', contacts.value)
    }
  } catch (error) {
    console.error('Fetch contacts error:', error)
  } finally {
    loadingContacts.value = false
  }
}

// 加载更多联系人
const loadMoreContacts = () => {
  if (!loadingContacts.value && hasMoreContacts.value) {
    fetchContacts(contactsPage.value + 1, true)
  }
}

// 获取聊天历史
const fetchChatHistory = async (chatId: string, page = 1, forceRefresh = false) => {
  try {
    // 防止重复请求
    const requestKey = `${chatId}_${page}`
    if (loadingChatHistory.value[requestKey]) {
      console.log('Chat history request already in progress for:', requestKey)
      return
    }
    
    loadingChatHistory.value[requestKey] = true
    
    // 生成缓存键，包含用户ID以区分不同用户的聊天记录
    const userId = userStoreIns.userInfo?.id || 'anonymous'
    const cacheKey = `chat_history_${userId}_${chatId}_${page}_10`
    
    // 优先从缓存获取数据（除非强制刷新）
    if (!forceRefresh) {
      const cachedData = cache.get(cacheKey)
      if (cachedData) {
        console.log('Using cached chat history for chatId:', chatId, 'page:', page)
        
        const messages = cachedData.records.map((msg: any) => {
          const item: any = {
            id: msg.id,
            content: msg.content,
            uid: msg.uid,
            chatid: msg.chatid,
            user: {
              username: msg.user.username,
              avatar: userUrl+msg.user.avatar || defaultAvatar
            },
            createTime: msg.createTime
          };

          // 只有自己发的消息才设置 float
          if (msg.uid === userStoreIns.userInfo.id) {
            item.float = 'right';
          }

          return item;
        });
        
        if (page === 1) {
          chatMessages.value[chatId] = messages
          chatConfig.data = messages
        } else {
          // 加载更多历史消息时，添加到现有消息的前面
          // 添加调试信息来了解消息的时间顺序
          console.log('Loading more messages - existing count:', chatMessages.value[chatId]?.length || 0)
          console.log('New messages count:', messages.length)
          if (messages.length > 0) {
            console.log('First new message time:', messages[0].createTime)
            console.log('Last new message time:', messages[messages.length - 1].createTime)
          }
          
          const existingMessages = chatMessages.value[chatId] || []
          // 过滤掉已存在的消息，使用createTime判断
          const existingTimes = new Set(existingMessages.map(msg => msg.createTime))
          const newMessages = messages.filter(msg => !existingTimes.has(msg.createTime))
          
          console.log('Filtered new messages count:', newMessages.length)
          
          if (newMessages.length > 0) {
            chatMessages.value[chatId] = [...newMessages, ...existingMessages]
            chatConfig.data = [...newMessages, ...chatConfig.data]
          }
        }
        hasMessage.value = hasMessage.value-checkHasMessage.value
        checkHasMessage.value=0
        console.log('chat history from cache', messages)
        return cachedData
      }
    }
    
    // 从API获取数据
    const response = await apiRequest('/chat/history', {
      params: { chatId, page, size: 10 }
    })
    
    if (response.code === 0) {
      // 检查是否有数据记录
      if (response.data.records && response.data.records.length > 0) {
        // 缓存API响应数据
        cache.set(cacheKey, response.data)
        
        const messages = response.data.records.map((msg: any) => {
          const item: any = {
            id: msg.id,
            content: msg.content,
            uid: msg.uid,
            chatid: msg.chatid,
            user: {
              username: msg.user.username,
              avatar: userUrl+msg.user.avatar || defaultAvatar
            },
            createTime: msg.createTime
          };

          // 只有自己发的消息才设置 float
          if (msg.uid === userStoreIns.userInfo.id) {
            item.float = 'right';
          }

          return item;
        });
        
        if (page === 1) {
          chatMessages.value[chatId] = messages
          chatConfig.data = messages
        } else {
          // 加载更多历史消息时，添加到现有消息的前面
          // 添加调试信息来了解消息的时间顺序
          console.log('API Loading more messages - existing count:', chatMessages.value[chatId]?.length || 0)
          console.log('API New messages count:', messages.length)
          if (messages.length > 0) {
            console.log('API First new message time:', messages[0].createTime)
            console.log('API Last new message time:', messages[messages.length - 1].createTime)
          }
          
          const existingMessages = chatMessages.value[chatId] || []
          // 过滤掉已存在的消息，使用createTime判断
          const existingTimes = new Set(existingMessages.map(msg => msg.createTime))
          const newMessages = messages.filter(msg => !existingTimes.has(msg.createTime))
          
          console.log('API Filtered new messages count:', newMessages.length)
          
          if (newMessages.length > 0) {
            chatMessages.value[chatId] = [...newMessages, ...existingMessages]
            chatConfig.data = [...newMessages, ...chatConfig.data]
          }
        }
        hasMessage.value = hasMessage.value-checkHasMessage.value
        checkHasMessage.value=0
        console.log('chat history from API', messages)
      } else {
        // API返回空数据时，尝试使用缓存数据
        console.log('API returned empty data, trying to use cached data for chatId:', chatId, 'page:', page)
        const cachedData = cache.get(cacheKey)
        
        if (cachedData && cachedData.records && cachedData.records.length > 0) {
          console.log('Using cached data instead of empty API response')
          
          const messages = cachedData.records.map((msg: any) => {
            const item: any = {
              id: msg.id,
              content: msg.content,
              uid: msg.uid,
              chatid: msg.chatid,
              user: {
                username: msg.user.username,
                avatar: userUrl+msg.user.avatar || defaultAvatar
              },
              createTime: msg.createTime
            };

            // 只有自己发的消息才设置 float
            if (msg.uid === userStoreIns.userInfo.id) {
              item.float = 'right';
            }

            return item;
          });
          
          if (page === 1) {
            chatMessages.value[chatId] = messages
            chatConfig.data = messages
          } else {
            const existingMessages = chatMessages.value[chatId] || []
            const existingTimes = new Set(existingMessages.map(msg => msg.createTime))
            const newMessages = messages.filter(msg => !existingTimes.has(msg.createTime))
            
            if (newMessages.length > 0) {
              chatMessages.value[chatId] = [...newMessages, ...existingMessages]
              chatConfig.data = [...newMessages, ...chatConfig.data]
            }
          }
          
          console.log('chat history from cache (fallback)', messages)
        } else {
          // 既没有API数据也没有缓存数据的情况
          console.log('No cached data available, setting empty array for chatId:', chatId, 'page:', page)
          if (page === 1) {
            chatMessages.value[chatId] = []
            chatConfig.data = []
          }
        }
        
        hasMessage.value = hasMessage.value-checkHasMessage.value
        checkHasMessage.value=0
      }
      return response.data
    }
  } catch (error) {
    console.error('Fetch chat history error:', error)
  } finally {
    // 清除加载标记
    const requestKey = `${chatId}_${page}`
    delete loadingChatHistory.value[requestKey]
  }
}

// 创建或获取聊天
const createOrGetChat = async (targetUserId: number) => {
  try {
    const response = await apiRequest('/chat/create-chat', {
      method: 'POST',
      data: { targetUserId }
    })
    
    if (response.code === 0) {
      return response.data.chatId
    }
  } catch (error) {
    console.error('Create or get chat error:', error)
  }
}


// WebSocket connection management
const connectWebSocket = () => {
  try {
    const token = localStorage.getItem('token') || ''
    if (!token) {
      console.error('No token available for WebSocket connection')
      // ElMessage.warning('请先登录后再使用聊天功能')
      return
    }

    // Close existing connection if any
    if (ws) {
      ws.close()
      ws = null
    }

    ws = new WebSocket(`${WS_BASE}?token=${token}`)

    ws.onopen = () => {
      console.log('WebSocket connected')
      if (debugMode.value && ws) {
        console.log('WebSocket URL:', `${WS_BASE}?token=${token.substring(0, 10)}...`)
        console.log('WebSocket readyState:', ws.readyState)
      }
      isConnected.value = true
      // ElMessage.success('聊天连接已建立')
      // stopMessageTimer() //停止定时获取未读消息
    }

    ws.onmessage = (event) => {
      try {
        console.log('WebSocket message:', event.data)
        const data = JSON.parse(event.data)
        handleWebSocketMessage(data)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason)
      isConnected.value = false
      
      // Don't auto-reconnect if it was a normal closure or authentication error
      if (event.code === 1000 || event.code === 1008) {
        console.log('WebSocket closed normally or due to authentication error')
        return
      }
      
      // Try to reconnect after 3 seconds for other errors
      // setTimeout(() => {
      //   if (!isConnected.value) {
      //     console.log('Attempting to reconnect WebSocket...')
      //     connectWebSocket()
      //   }
      // }, 3000)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      isConnected.value = false
      ElMessage.error(t('mymessage.chat_connection_failed'))
    }
  } catch (error) {
    console.error('Failed to connect WebSocket:', error)
    ElMessage.error(t('mymessage.chat_connection_error'))
  }
}

// 滚动到底部函数
const scrollToBottom = () => {

  const chatContent = document.querySelector('.chat-content');
  if (chatContent) {
    chatContent.scrollIntoView({ block: 'end' });
    // 方法1：直接滚动到底部
    // chatContent.scrollTop = chatContent.scrollHeight;

    // 方法2：平滑滚动（推荐）
    // chatContent.scrollTo({
    //   top: chatContent.scrollHeight,
    //   behavior: 'smooth'
    // });
    // 方法3：滚动到最后一个消息元素
    // const lastMessage = chatContent.querySelector('.message-item:last-child');
    // if (lastMessage) {
    //   lastMessage.scrollIntoView({ behavior: 'smooth', block: 'end' });
    // }
    const chatContent2 = document.querySelector('.u-editor');
    chatContent2.scrollIntoView({ block: 'end' });
  }
};

const handleWebSocketMessage = (data: any) => {
  switch (data.type) {
    case 'connection':
      console.log('WebSocket connection established:', data)
      scrollToBottom();
      break
      
    case 'new_message':
      console.log('new_message', data)
      hasMessage.value = hasMessage.value-checkHasMessage.value
      checkHasMessage.value=0
      
      // 如果是chat_0_的消息，分发到已存在的chat_0_开头的联系人中
      if (data.data.chatId.startsWith('chat_0_')) {
        const chat0Contacts = contacts.value.filter(contact => 
          contact.chatId.startsWith('chat_0_')
        )
        
        if (chat0Contacts.length > 0) {
          // 为每个chat_0开头的联系人添加这条消息
          chat0Contacts.forEach(contact => {
            handleNewMessage({
              ...data.data,
              chatId: contact.chatId
            })
          })
        } else {
          // 如果没有其他chat_0联系人，正常处理
          handleNewMessage(data.data)
        }
      } else {
        handleNewMessage(data.data)
      }
      scrollToBottom();
      break
        
    case 'message_sent':
      console.log('Message sent successfully:', data)
      // 处理消息发送成功的回调
      if (data.data.messageIdDate && pendingMessageCallbacks.has(data.data.messageIdDate)) {
        const callback = pendingMessageCallbacks.get(data.data.messageIdDate)
        if (callback) {
          callback(true) // 发送成功，传递服务器返回的消息数据
        }
      }
      scrollToBottom();
      break
      
    case 'message_send_failed':
      console.log('Message send failed:', data)
      ElMessage.error(data.data.message)
      // 处理消息发送失败的回调
      if (data.data.messageIdDate && pendingMessageCallbacks.has(data.data.messageIdDate)) {
        const callback = pendingMessageCallbacks.get(data.data.messageIdDate)
        if (callback) {
          callback(false) // 发送失败
        }
      }
      break
    case 'user_status_change':
      console.log('User status change:', data)
      const contact = contacts.value.find(c => c.userId === data.data.userId)
      if (contact) {
        contact.isOnline = data.data.isOnline
        // 只有当状态变化是针对当前选中的联系人时，才更新 selectedContact
        if (selectedContact.value && selectedContact.value.userId === data.data.userId) {
          selectedContact.value.isOnline = data.data.isOnline
        }
      }
      console.log('contacts', contacts.value)
      console.log('selectedContact', selectedContact.value)
      break
    case 'heartbeat_response':
      console.log('Heartbeat response:', data)
      break
    case 'typing':
      // Handle typing indicator
      console.log('User typing:', data)
      break
      
    case 'error':
      ElMessage.error(data.data.message || 'WebSocket错误')
      break
      
    default:
      console.log('Unknown WebSocket message type:', data)
  }
}

const handleNewMessage = (messageData: any) => {
  const { chatId } = messageData
  console.log(messageData)

  // 创建新消息对象
  const newMessage: ChatApi = {
    id: messageData.id,
    content: messageData.content,
    uid: messageData.uid,
    user: {
      username: messageData.user.username,
      avatar: userUrl+messageData.user.avatar || defaultAvatar
    },
    createTime: messageData.createTime,
  }
  if(messageData.uid == userStoreIns.userInfo.id){
    newMessage.float = 'right'
  }

  // 确保聊天消息数组存在
  if (!chatMessages.value[chatId]) {
    chatMessages.value[chatId] = []
  }
  
  // 添加新消息到聊天记录
  chatMessages.value[chatId].push(newMessage)
  
  // Update current chat if it's the active one
  if (selectedContact.value?.chatId === chatId) {
    chatConfig.data = [...chatMessages.value[chatId]]
  }
  
  // 查找或创建联系人
  let contact = contacts.value.find(c => c.chatId === chatId)
  if (!contact) {
    // 如果联系人不存在，创建一个新的联系人（主要用于管理员消息）
    const isAdminMessage = chatId === 'chat_0_0' || messageData.uid === 0
    contact = {
      chatId: chatId,
      userId: messageData.uid,
      username: isAdminMessage ? 'AIstarter官方' : messageData.user.username,
      avatar: isAdminMessage ? 'AIstarter/AIstarter.png' : messageData.user.avatar,
      lastMessage: messageData.content,
      lastMessageTime: messageData.createTime,
      unreadCount: messageData.uid !== userStoreIns.userInfo.id ? 1 : 0,
      isOnline: false
    }
    contacts.value.unshift(contact) // 添加到联系人列表顶部
    
    // 重新排序联系人列表
    contacts.value.sort((a, b) => {
      // 优先显示有未读消息的联系人
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1
      // 如果都有未读消息，按未读数量降序排列
      if (a.unreadCount > 0 && b.unreadCount > 0) {
        return b.unreadCount - a.unreadCount
      }
      // 其他情况按最后消息时间排序
      return new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime()
    })
  } else {
    // 更新现有联系人的最后消息
    contact.lastMessage = messageData.content
    contact.lastMessageTime = messageData.createTime
    if (messageData.uid !== userStoreIns.userInfo.id) {
      contact.unreadCount = (contact.unreadCount || 0) + 1
    }
  }
  
  // 更新缓存中的聊天历史数据
  const userId = userStoreIns.userInfo?.id || 'anonymous'
  const cacheKey = `chat_history_${userId}_${chatId}_1_10`
  const cachedData = cache.get(cacheKey)
  if (cachedData && cachedData.records) {
    // 将新消息添加到缓存的记录中
    cachedData.records.push({
      id: messageData.id,
      content: messageData.content,
      uid: messageData.uid,
      chatid: chatId,
      user: messageData.user,
      createTime: messageData.createTime
    })
    // 更新缓存
    cache.set(cacheKey, cachedData)
  }
  
  // 更新联系人缓存中的最后消息信息
  const contactsCacheKey = `contacts_${userId}_${contactsPage.value}_${contactsSize.value}`
  const contactsCachedData = cache.get(contactsCacheKey)
  if (contactsCachedData && contactsCachedData.records) {
    // 找到对应的联系人记录并更新最后消息信息和未读数量
    const contactRecord = contactsCachedData.records.find((contact: any) => contact.chatId === chatId)
    if (contactRecord) {
      contactRecord.lastMessage = messageData.content
      contactRecord.lastMessageTime = messageData.createTime
      if (messageData.uid !== userStoreIns.userInfo.id) {
        contactRecord.unreadCount = (contactRecord.unreadCount || 0) + 1
      }
      // 更新联系人缓存
      cache.set(contactsCacheKey, contactsCachedData)
    }
  }
}

// Methods
const selectContact = async (contact: any) => {
  // 如果选择的是同一个联系人，避免重复加载
  if (selectedContact.value && selectedContact.value.chatId === contact.chatId) {
    return
  }
  
  selectedContact.value = contact
  
  // Load message history for this contact
  if (chatMessages.value[contact.chatId]) {
    chatConfig.data = [...chatMessages.value[contact.chatId]]
    scrollToBottom();
  } else {
    await fetchChatHistory(contact.chatId, 1, true)
    scrollToBottom();
  }
  
  // Mark messages as read immediately when selecting contact
  if (contact.unreadCount > 0) {
    await markMessagesAsRead(contact.chatId)
    hasMessage.value = hasMessage.value-checkHasMessage.value
    checkHasMessage.value=0
    contact.unreadCount = 0
  }
}

const formatTime = (time: string | Date) => {
  if (!time) return ''
  
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return t('mymessage.just_now')
  if (minutes < 60) return `${minutes}${t('mymessage.minutes_ago')}`
  if (hours < 24) return `${hours}${t('mymessage.hours_ago')}`
  if (days < 7) return `${days}${t('mymessage.days_ago')}`
  return date.toLocaleDateString()
}

const loadMoreMessages = async (finish: Function) => {
  if (!selectedContact.value) {
    finish([])
    return
  }

  try {
    const currentMessages = chatMessages.value[selectedContact.value.chatId] || []
    const nextPage = Math.floor(currentMessages.length / 10) + 1
    const chatId = selectedContact.value.chatId
    
    console.log('Loading more messages for chatId:', chatId, 'page:', nextPage)
    
    // 直接调用 fetchChatHistory，它会处理缓存和数据合并
    const response = await fetchChatHistory(chatId, nextPage)
    
    if (response && response.records && response.records.length > 0) {
      // fetchChatHistory 已经处理了数据合并，这里只需要返回新加载的消息
      const messages = response.records.map((msg: any) => {
        const item: any = {
          id: msg.id,
          content: msg.content,
          uid: msg.uid,
          chatid: msg.chatid,
          user: {
            username: msg.user.username,
            avatar: userUrl+msg.user.avatar || defaultAvatar
          },
          createTime: msg.createTime
        };

        // 只有自己发的消息才设置 float
        if (msg.uid === userStoreIns.userInfo.id) {
          item.float = 'right';
        }

        return item;
      });
      
      console.log('loadMore messages loaded:', messages.length)
      finish([])
    } else {
      console.log('No more messages available for chatId:', chatId, 'page:', nextPage)
      finish([])
    }
  } catch (error) {
    console.error('Load more messages error:', error)
    finish([])
  }
}

// 存储待处理的消息回调
const pendingMessageCallbacks = new Map<string, Function>()

const sendMessage = async (content: string, finish: Function) => {
  if (!selectedContact.value) {
    ElMessage.warning(t('mymessage.select_contact_first'))
    finish()
    return
  }

  if (!isConnected.value || !ws) {
    ElMessage.error(t('mymessage.connection_not_established'))
    finish()
    return
  }

  if (!content || content.trim() === '') {
    ElMessage.warning(t('mymessage.message_content_empty'))
    finish()
    return
  }

  try {
    const messageId = Date.now().toString() // 生成唯一消息ID
    const newMessage: ChatApi = {
      id: messageId,
      content: content.trim(),
      uid: userStoreIns.userInfo.id || 1,
      user: {
        username: userStoreIns.userInfo.username || userStoreIns.userInfo.email || '我',
        avatar: userUrl+userStoreIns.userInfo.avatar || defaultAvatar
      },
      createTime: new Date().toISOString(), 
    }

    // 将回调函数存储到待处理映射中
    pendingMessageCallbacks.set(messageId, (success: boolean, serverMessage?: any) => {
      if (success) {
        // 发送成功，更新本地消息历史
        if (!chatMessages.value[selectedContact.value.chatId]) {
          chatMessages.value[selectedContact.value.chatId] = []
        }
        
        // 使用服务器返回的消息数据（如果有的话）
        const finalMessage = serverMessage || newMessage
        // chatMessages.value[selectedContact.value.chatId].push(finalMessage)
        
        // 更新缓存中的聊天历史数据
        const chatId = selectedContact.value.chatId
        const userId = userStoreIns.userInfo?.id || 'anonymous'
        const cacheKey = `chat_history_${userId}_${chatId}_1_10`
        const cachedData = cache.get(cacheKey)
        if (cachedData && cachedData.records) {
          // 将新消息添加到缓存的记录中
          cachedData.records.push({
            id: finalMessage.id,
            content: finalMessage.content,
            uid: finalMessage.uid,
            chatid: chatId,
            user: finalMessage.user,
            createTime: finalMessage.createTime
          })
          // 更新缓存
          cache.set(cacheKey, cachedData)
        }
        
        // 更新联系人缓存中的最后消息信息
        const contactsCacheKey = `contacts_${userId}_${contactsPage.value}_${contactsSize.value}`
        const contactsCachedData = cache.get(contactsCacheKey)
        if (contactsCachedData && contactsCachedData.records) {
          // 找到对应的联系人记录并更新最后消息信息
          const contactRecord = contactsCachedData.records.find((contact: any) => contact.chatId === chatId)
          if (contactRecord) {
            contactRecord.lastMessage = content.trim()
            contactRecord.lastMessageTime = new Date().toISOString()
            // 更新联系人缓存
            cache.set(contactsCacheKey, contactsCachedData)
          }
        }
        
        // 更新联系人的最后消息信息
        selectedContact.value.lastMessage = content.trim()
        selectedContact.value.lastMessageTime = new Date().toISOString()
        
        finish(finalMessage)
        scrollToBottom();
      } else {
        // 发送失败
        // ElMessage.error('消息发送失败，请重试')
        finish()
      }
      
      // 清理回调
      pendingMessageCallbacks.delete(messageId)
    })

    // Send message via WebSocket
    const wsMessage = {
      type: 'send_message',
      messageIdDate: messageId, // 添加消息ID用于回调匹配
      chatId: selectedContact.value.chatId,
      content: content.trim(),
      targetUserId: selectedContact.value.userId
    }
    
    // Check if WebSocket is in ready state
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(wsMessage))
      if (debugMode.value) {
        console.log('Message sent via WebSocket:', wsMessage)
        console.log('WebSocket readyState:', ws.readyState)
        console.log('Selected contact:', selectedContact.value)
      }
      
      // 设置超时处理，如果10秒内没有收到回弹信息则认为发送失败
      setTimeout(() => {
        if (pendingMessageCallbacks.has(messageId)) {
          const callback = pendingMessageCallbacks.get(messageId)
          if (callback) {
            callback(false) // 超时，认为发送失败
          }
        }
      }, 10000) // 10秒超时
      
    } else {
      if (debugMode.value) {
        console.log('WebSocket not ready. State:', ws.readyState)
        console.log('WebSocket states: CONNECTING=0, OPEN=1, CLOSING=2, CLOSED=3')
      }
      // WebSocket未连接，直接调用失败回调
      const callback = pendingMessageCallbacks.get(messageId)
      if (callback) {
        callback(false)
      }
      throw new Error('WebSocket connection is not ready')
    }
    
  } catch (error) {
    console.error('Send message error:', error)
    ElMessage.error(t('mymessage.send_message_failed') + ': ' + (error instanceof Error ? error.message : t('mymessage.unknown_error')))
    finish()
  }
}

// Mark messages as read
const markMessagesAsRead = async (chatId: string) => {
  if (!isConnected.value || !ws) return
  
  try {
    const wsMessage = {
      type: 'read_messages',
      chatId: chatId
    }
    
    ws.send(JSON.stringify(wsMessage))
    console.log('Marked messages as read for chat:', chatId)
  } catch (error) {
    console.error('Failed to mark messages as read:', error)
  }
}

const refreshMessages = async () => {
  try {
    // 使用forceRefresh参数强制从服务器获取最新数据
    await fetchContacts(1, false, true)
    if (selectedContact.value) {
      await fetchChatHistory(selectedContact.value.chatId, 1, true)
      scrollToBottom();
    }
    ElMessage.success(t('mymessage.messages_refreshed'))
  } catch (error) {
    console.error('Refresh messages error:', error)
    ElMessage.error(t('mymessage.refresh_failed'))
  }
}

// 清理缓存
const clearCache = () => {
  try {
    cache.clear()
    ElMessage.success(t('mymessage.cache_cleared'))
  } catch (error) {
    console.error('Clear cache error:', error)
    ElMessage.error(t('mymessage.clear_cache_failed'))
  }
}

// 清理过期缓存
const clearExpiredCache = () => {
  try {
    // 通过调用get方法触发过期缓存清理
    cache.get('dummy_key_to_trigger_cleanup')
    ElMessage.success(t('mymessage.expired_cache_cleared'))
  } catch (error) {
    console.error('Clear expired cache error:', error)
    ElMessage.error(t('mymessage.clear_expired_cache_failed'))
  }
}

const saveSettings = () => {
  ElMessage.success(t('mymessage.settings_saved'))
  showSettings.value = false
  // Here you would typically save settings to the server
}

// 删除联系人
const deleteContact = async (contact: any) => {
  try {
    // 显示确认对话框
    await ElMessageBox.confirm(
      t('mymessage.delete_contact_confirm', { name: contact.username }),
      t('mymessage.delete_contact_title'),
      {
        confirmButtonText: t('mymessage.confirm'),
        cancelButtonText: t('mymessage.cancel'),
        type: 'warning',
      }
    )
    
    // 从联系人列表中移除
    const index = contacts.value.findIndex(c => c.chatId === contact.chatId)
    if (index > -1) {
      contacts.value.splice(index, 1)
    }
    
    // 如果删除的是当前选中的联系人，选择列表中的第一个联系人
    if (selectedContact.value?.chatId === contact.chatId) {
      if (contacts.value.length > 0) {
        // 选择第一个联系人
        await selectContact(contacts.value[0])
      } else {
        // 如果没有其他联系人，清空选中状态
        selectedContact.value = null
        chatConfig.data = []
      }
    }
    
    // 清除相关缓存
    const userId = userStoreIns.userInfo?.id || 'anonymous'
    const chatHistoryCacheKey = `chat_history_${userId}_${contact.chatId}_1_10`
    cache.delete(chatHistoryCacheKey)
    
    // 清除聊天消息缓存
    if (chatMessages.value[contact.chatId]) {
      delete chatMessages.value[contact.chatId]
    }
    
    // 向服务器发送删除联系人请求
    try {
      await axios.post(`${API_BASE}/chat/delete-contact`, {
        contactId: contact.userId
      }, {
        headers: {
          'access-token': localStorage.getItem('token')
        }
      })
    } catch (apiError) {
      console.error('Failed to delete contact on server:', apiError)
      // 即使服务器删除失败，本地删除已经完成，只记录错误
    }
    
    ElMessage.success(t('mymessage.contact_deleted'))
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete contact error:', error)
      ElMessage.error(t('mymessage.delete_contact_failed'))
    }
  }
}

// 防抖标记，避免频繁调用已读状态清除
let markAsReadTimeout: NodeJS.Timeout | null = null

// 清除已读状态的通用函数
const clearUnreadStatus = async () => {
  if (selectedContact.value && selectedContact.value.unreadCount > 0) {
    // 清除之前的定时器
    if (markAsReadTimeout) {
      clearTimeout(markAsReadTimeout)
    }
    
    // 设置新的定时器，防抖处理
    markAsReadTimeout = setTimeout(async () => {
      await markMessagesAsRead(selectedContact.value.chatId)
      selectedContact.value.unreadCount = 0
      hasMessage.value = hasMessage.value-checkHasMessage.value
      checkHasMessage.value=0
      markAsReadTimeout = null
    }, 100) // 100ms 防抖延迟
  }
}

// 处理聊天区域点击事件，清除已读状态
const handleChatAreaClick = () => {
  clearUnreadStatus()
}

// 处理聊天输入框获得焦点事件，清除已读状态
const handleChatFocus = () => {
  clearUnreadStatus()
}

const scrollbarRef = ref()
// 处理键盘事件，Ctrl+Enter发送消息
const handleChatKeydown = (event: KeyboardEvent) => {
  // 检查是否按下Ctrl+Enter组合键
  if (event.key === 'Enter' && event.ctrlKey) {
    event.preventDefault() // 阻止默认行为
    
    // 尝试找到输入框并获取其值
    const chatElement = scrollbarRef.value?.$el
    const richInputElement = chatElement?.querySelector('.rich-input')
    const textarea = richInputElement?.innerHTML
    if (textarea && richInputElement) {
      // 手动触发 sendMessage
      sendMessage(textarea, async (val) => {
        if (selectedContact.value) {
          await fetchChatHistory(selectedContact.value.chatId, 1, true)
        }
      })
      // 清除输入框内容
      richInputElement.innerHTML = ''
      console.log('输入框已清除')
    }
  }
  // 现在单独按Enter键将允许换行
}
// 创建缓存实例
const cache = new LocalCache(100, 30 * 60 * 1000) // 最大100项，30分钟过期

// Lifecycle
onMounted(async () => {
  // Connect to WebSocket
  connectWebSocket()
  
  // Initialize contact list
  await fetchContacts(1, false,true)

  userStoreIns.initiateChatUser = ''
  // Select first contact if available
  if (contacts.value.length > 0) {
    await selectContact(contacts.value[0])
    // // 优先选择有未读消息的联系人
    // const unreadContact = contacts.value.find(contact => contact.unreadCount > 0)
    // const contactToSelect = unreadContact || contacts.value[0]
    // await selectContact(contactToSelect)
  }
})

// Cleanup WebSocket on component unmount
onUnmounted(() => {
  if (ws) {
    ws.close()
    ws = null
  }
  
  // 清理定时器
  if (markAsReadTimeout) {
    clearTimeout(markAsReadTimeout)
    markAsReadTimeout = null
  }
  
  // 清理待处理的消息回调
  pendingMessageCallbacks.clear()
  
  // 清理缓存（可选，如果需要在组件卸载时清理缓存）
  // cache.clear()
  
  //开启定时获取未读消息
  // startMessageTimer()
})

// Watch for user info changes
// watch(() => userStoreIns.userInfo, (newUserInfo, oldUserInfo) => {
//   chatConfig.user = {
//     id: newUserInfo.id || 1,
//     username: newUserInfo.username || newUserInfo.email || '我',
//     avatar: userUrl+newUserInfo.avatar || defaultAvatar
//   }
  
//   // 如果用户ID发生变化，清除相关缓存并重新获取数据
//   if (oldUserInfo && newUserInfo.id !== oldUserInfo.id) {
//     console.log('User changed, clearing cache and refreshing data')
    
//     // 清除联系人相关缓存
//     const cacheStats = cache.getStats()
//     cacheStats.keys.forEach(key => {
//       if (key.startsWith('contacts_') || key.startsWith('chat_history_')) {
//         cache.delete(key)
//       }
//     })
//   }
// }, { deep: true })
</script>
  
<style lang="scss" scoped>
.message-container {
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  box-shadow: 0 0px 4px rgba(0, 0, 0,0.5);
}

.message-header {
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  padding: 16px 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .header-icon {
      font-size: 24px;
    //   color: var(--el-color-primary);
    }

    .header-title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .header-actions {
    display: flex;
    gap: 8px;
    align-items: center;

    .connection-status {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      border-radius: 12px;
      background: var(--el-fill-color-light);
      font-size: 12px;

      .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #f56c6c;
        animation: pulse 2s infinite;

        &.connected {
          background: #67c23a;
          animation: none;
        }
      }

      .status-text {
        color: var(--el-text-color-regular);
        font-weight: 500;
      }
    }
  }
}

.message-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.contact-sidebar {
  width: 220px;
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;

  .sidebar-header {
    padding: 16px 6px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .search-input {
      :deep(.el-input__wrapper) {
        background: var(--el-fill-color-blank);
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
        transition: all 0.3s ease;

        &:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        &.is-focus {
          box-shadow: 0 0 0 1px var(--el-color-primary);
        }
      }
    }
  }

  .contact-list {
    flex: 1;
    overflow: hidden;
  }

  .contact-item {
    display: flex;
    align-items: center;
    padding: 16px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-bottom: 1px solid var(--el-border-color-lighter);
    position: relative;

    &:hover {
      background: var(--el-fill-color-light);
      
      .contact-delete {
        opacity: 1;
        visibility: visible;
      }
    }

    &.active {
      background: #18222c1a;
      border-left: 3px solid #409eff;
    }

    .contact-avatar {
      position: relative;
      margin-right: 12px;

      .unread-badge {
        position: absolute;
        top: -5px;
        right: -5px;
        background: #f56c6c;
        color: white;
        border-radius: 10px;
        padding: 1px 3px;
        font-size: 10px;
        min-width: 16px;
        text-align: center;
        font-weight: 600;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .online-indicator {
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 8px;
        height: 8px;
        background: #67c23a;
        border: 1px solid var(--el-bg-color);
        border-radius: 50%;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      }
    }

    .contact-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;

      .contact-name {
        text-align: left;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin-bottom: 4px;
        font-size: 14px;
      }

      .contact-last-message {
        color: var(--el-text-color-regular);
        font-size: 12px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-align: left;
      }
    }

    .contact-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;

      .contact-time {
        font-size: 11px;
        color: var(--el-text-color-placeholder);
      }

      .unread-dot {
        width: 8px;
        height: 8px;
        background: #409eff;
        border-radius: 50%;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      }
    }
    
    .contact-delete {
       position: absolute;
       top: 2px;
       right: 2px;
       opacity: 0;
       visibility: hidden;
       transition: all 0.3s ease;
       z-index: 10;
       
       .delete-btn {
         width: 20px;
         height: 20px;
         padding: 0;
         border: none;
         font-size: 12px;
         
         &:hover {
           transform: scale(1.1);
         }
         
         &:focus {
           outline-offset: 2px;
         }
       }
     }
  }
}

.chat-area {
  flex: 1;
  background: var(--el-bg-color);
  display: flex;
  flex-direction: column;
}

.chat-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chat-header {
  padding: 16px 24px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 1px rgba(0, 0, 0,0.5);

  .chat-contact-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .contact-details {
      .contact-name {
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin-bottom: 2px;
      }

      .contact-status {
        font-size: 12px;
        text-align: left;

        .status-online {
          color: #67c23a;
        }

        .status-offline {
          color: var(--el-text-color-placeholder);
        }
      }
    }
  }

  .chat-actions {
    display: flex;
    gap: 8px;
  }
}

.color-gray{
  color: var(--el-text-color-placeholder);
}

.chat-messages {
  flex: 1;
  overflow: hidden;
  box-shadow: 0 1px 1px rgba(0, 0, 0,0.5);
  cursor: text; // 添加文本光标，提示用户可以点击

  .chat-component {
    height: 100%;
    text-align: left;
  }

  .chat-header-placeholder {
    height: 0;
  }
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-extra-light);

  .empty-content {
    text-align: center;
    color: var(--el-text-color-regular);

    .empty-icon {
      font-size: 64px;
      margin-bottom: 16px;
      color: var(--el-text-color-placeholder);
    }

    .empty-title {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--el-text-color-primary);
    }

      .empty-description {
    font-size: 14px;
    color: var(--el-text-color-regular);
  }

  .debug-info {
    margin-top: 20px;
    padding: 16px;
    background: var(--el-fill-color-light);
    border-radius: 8px;
    border: 1px solid var(--el-border-color-light);
    text-align: left;

    h4 {
      margin: 0 0 12px 0;
      color: var(--el-text-color-primary);
      font-size: 16px;
    }

    p {
      margin: 4px 0;
      font-size: 12px;
      color: var(--el-text-color-regular);
      font-family: monospace;
    }
  }
  }
}

.settings-content {
  padding: 20px 0;
}

// Responsive design
@media (max-width: 768px) {
  .contact-sidebar {
    width: 280px;
  }

  .message-header {
    padding: 12px 16px;

    .header-title {
      font-size: 18px;
    }
  }

  .chat-header {
    padding: 12px 16px;
  }
}

// Dark mode specific styles
:deep(.dark) {
  .message-container {
    background: var(--el-bg-color);
  }

  .message-header {
    background: var(--el-bg-color);
    border-bottom-color: var(--el-border-color-darker);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .contact-sidebar {
    background: var(--el-bg-color);
    border-right-color: var(--el-border-color-darker);

    .sidebar-header {
      border-bottom-color: var(--el-border-color-darker);
    }

    .contact-item {
      border-bottom-color: var(--el-border-color-darker);

      &:hover {
        background: var(--el-fill-color-darker);
      }

      &.active {
        background: var(--el-color-primary-dark-2);
        border-left-color: var(--el-color-primary);
      }
    }
  }

  .chat-area {
    background: var(--el-bg-color);
  }

  .chat-header {
    background: var(--el-bg-color);
    border-bottom-color: var(--el-border-color-darker);
  }

  .empty-state {
    background: var(--el-fill-color-darker);
  }
}

// Light mode specific styles
:deep(.light) {
  .message-container {
    background: var(--el-bg-color);
  }

  .contact-item {
    &:hover {
      background: var(--el-fill-color-light);
    }

    &.active {
      background: var(--el-color-primary-light-9);
    }
  }

  .empty-state {
    background: var(--el-fill-color-extra-light);
  }
}

// Smooth animations
.contact-item,
.chat-header,
.message-header {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

// Custom scrollbar styling
:deep(.el-scrollbar__bar) {
  background: var(--el-fill-color-light);
  
  .el-scrollbar__thumb {
    background: var(--el-fill-color-dark);
    border-radius: 4px;
    
    &:hover {
      background: var(--el-fill-color-darker);
    }
  }
}

// Element Plus component overrides for better theme integration
:deep(.el-button) {
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

:deep(.el-input) {
  .el-input__wrapper {
    transition: all 0.3s ease;
  }
}

:deep(.el-avatar) {
  border: 2px solid var(--el-border-color-lighter);
  transition: all 0.3s ease;
  
  &:hover {
    border-color: var(--el-color-primary);
    transform: scale(1.05);
  }
}

// Settings dialog styling
.settings-dialog {
  :deep(.el-dialog) {
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  :deep(.el-dialog__header) {
    border-bottom: 1px solid var(--el-border-color-light);
    background: var(--el-bg-color);
  }

  :deep(.el-dialog__body) {
    background: var(--el-bg-color);
  }

  :deep(.el-dialog__footer) {
    border-top: 1px solid var(--el-border-color-light);
    background: var(--el-bg-color);
  }
}

// Enhanced focus states for accessibility
.contact-item:focus-visible,
.el-button:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

// Loading states
.contact-item.loading {
  opacity: 0.6;
  pointer-events: none;
}

// Animation for new messages
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Pulse animation for connection status
@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.contact-item {
  animation: slideIn 0.3s ease-out;
}
:deep(.u-chat footer){
    height: auto;
}

.chat-header-placeholder {
  position: relative;
  height: 0;
  
  .input-hint {
    position: absolute;
    top: 10px;
    right: 20px;
    z-index: 10;
    
    .hint-text {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
      background: var(--el-bg-color);
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid var(--el-border-color-lighter);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      white-space: nowrap;
      
      // 添加淡入淡出动画
      opacity: 0.7;
      transition: opacity 0.3s ease;
      
      &:hover {
        opacity: 1;
      }
    }
  }
}

// 响应式设计 - 在小屏幕上隐藏提示
@media (max-width: 768px) {
  .input-hint {
    display: none;
  }
}
.input-hint-container {
  position: relative;
  height: 0;
  
  .input-hint {
    position: absolute;
    bottom: 10px; // 调整这个值来控制距离输入框的高度
    right: 40px;
    z-index: 10;
    
    .hint-text {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
      background: var(--el-bg-color);
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid var(--el-border-color-lighter);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      white-space: nowrap;
      opacity: 0.7;
      transition: opacity 0.3s ease;
      
      &:hover {
        opacity: 1;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .input-hint-container .input-hint {
    display: none;
  }
}
</style>
  