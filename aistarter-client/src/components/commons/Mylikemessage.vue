<template>
  <el-scrollbar class="like-message-container" ref="containerRef" @scroll="handleScroll">
    <el-card class="header-card" shadow="never">
        <div class="flex justify-start">
            <span class="flex align-center font-size-24px">
                <el-icon><pointer /></el-icon>
            </span>
            <div class="flex justify-center ml-2" style="align-items: end;">
                <span>{{$t('personalcenter.like_message')}}</span>
            </div>
        </div>
    </el-card>
    
    <div class="message-list" v-if="messages.length > 0">
      <el-card 
        v-for="message in messages" 
        :key="message.id" 
        class="message-item"
        shadow="hover"
        @click="goToDetail(message.project_id, message.project_type,message.content_type)"
      >
        <div class="message-content">
            <div class="message-content-wrapper">
                <div class="message-avatar">
                    <el-avatar :size="60" :src="message.avatar_url || defaultAvatar" :alt="message.username" fit="cover"></el-avatar>
                </div>
            </div>
            <div>
                <div class="message-header">
                    <span class="username">{{ message.alias || message.username }}</span>
                    <span class="action-text">{{ $t('mylikemessage.liked_your') }}</span>
                    <span class="content-type">{{ getContentTypeText(message.content_type) }}</span>
                    <!--
                    <span class="time">{{ formatTime(message.created_at) }}</span>
                    -->
                </div>
            
                <div class="message-body">
                    <div class="project-info" v-if="message.project_name">
                        <span class="project-label">{{ $t('mylikemessage.project') }}:</span>
                        <span class="project-name">{{ message.project_name }}</span>
                    </div>
                    <div class="liked-content mt-3" v-if="message.comment_content">
                        <div class="content-preview">
                            <p class="content-text">{{ message.comment_content }}</p>
                        </div>
                    </div>
                </div>
            
                <div class="message-time text-left">
                    <span class="time-text">{{ formatTime(message.create_time) }}</span>
                </div>
            </div>
        </div>
      </el-card>
      
      <!-- 加载更多提示 -->
      <div class="load-more" v-if="hasMore">
        <el-loading v-if="loading" :text="$t('mylikemessage.loading')" />
        <div v-else class="load-more-text">{{ $t('mylikemessage.scroll_load_more') }}</div>
      </div>
      
      <!-- 没有更多数据提示 -->
      <div class="no-more" v-if="!hasMore && messages.length > 0">
        <div class="no-more-text">{{ $t('mylikemessage.no_more_data') }}</div>
      </div>
    </div>
    
    <el-card class="empty-state" v-else-if="!loading" shadow="never">
      <el-empty :description="$t('mylikemessage.no_like_messages')" />
    </el-card>
    
    <!-- 初始加载 -->
    <div class="initial-loading" v-if="loading && messages.length === 0">
      <el-loading :text="$t('mylikemessage.loading')" />
    </div>
  </el-scrollbar>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElIcon } from 'element-plus'
import axios from 'axios'

const { openProductDetails, openProductDetailsReview,hasMessage,checkHasLikeMessage } = inject('main') as any;
const { t } = useI18n()

// 数据定义
interface LikeMessage {
  id: number
  user_id: number
  liker_id: number
  like_id: number
  content_type: number
  project_id?: number
  project_type?: string
  is_read: number
  message_type: number
  create_time: string
  read_time?: string
  username: string
  avatar_url?: string
  alias?: string
  project_name?: string
  comment_content?: string
}

// API响应接口
interface ApiResponse {
  code: number
  msg: string
  data: {
    total: number
    size: string
    current: string
    records: LikeMessage[]
  }
}

const messages = ref<LikeMessage[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const hasMore = ref(true)
const containerRef = ref<HTMLElement>()
const defaultAvatar = '/src/assets/ai_noimg.png'
const userUrl = (window as any).Constants.uploadUrl+'/assets/user-images/'

// 跳到对应项目
const goToDetail = (id: number, type: number,projectType:number) => {
    console.log('跳转到项目详情', id, type)
    if(projectType == 1){
      openProductDetails({id:id,res_type:type},{},'four')
    }else if(projectType == 2){
      openProductDetails({id:id,res_type:type})
    }
    
}

// API调用函数
const fetchLikeMessages = async (page: number, size: number): Promise<ApiResponse> => {
  try {
    const response = await axios.get((window as any).Constants.uploadUrl+'/users/get-like-msg-list', {
      params: {
        current: page,
        size: size
      },
      headers: {
        "access-token": localStorage.getItem('token')
      }
    })
    
    return response.data
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

// 方法定义
const loadMessages = async (isLoadMore = false) => {
  if (loading.value) return
  
  loading.value = true
  try {
    const response = await fetchLikeMessages(currentPage.value, pageSize.value)
    
    if (response.code !== 0) {
      throw new Error(response.msg || '获取数据失败')
    }
    
    const { data } = response
    // 设置data.records 中 avatar_url为空时，默认为defaultAvatar
    data.records.forEach((item: any) => {
      if (!item.avatar_url) {
        item.avatar_url = defaultAvatar
      } else {
        item.avatar_url = userUrl + item.avatar_url
      }
    })
    const newMessages = data.records || []
    
    if (isLoadMore) {
      messages.value = [...messages.value, ...newMessages]
    } else {
      messages.value = newMessages
    }
    
    total.value = data.total
    const totalPages = Math.ceil(data.total / pageSize.value)
    hasMore.value = currentPage.value < totalPages
    
  } catch (error) {
    console.error('Failed to load like messages:', error)
    ElMessage.error(t('mylikemessage.load_failed'))
  } finally {
    loading.value = false
  }
}

// 滚动加载更多
const loadMore = async () => {
  if (!hasMore.value || loading.value) return
  
  currentPage.value++
  await loadMessages(true)
}

// 滚动事件处理
const handleScroll = async ({ scrollTop, scrollLeft }: { scrollTop: number, scrollLeft: number }) => {
  if (!containerRef.value || loading.value || !hasMore.value) return
  
  const wrapElement = containerRef.value.wrapRef
  if (!wrapElement) return
  
  const { scrollHeight, clientHeight } = wrapElement
  const threshold = 100 // 距离底部100px时开始加载
  
  if (scrollTop + clientHeight >= scrollHeight - threshold) {
    await loadMore()
  }
}

const getContentTypeText = (type: number) => {
  const typeMap: Record<number, string> = {
    1: t('mylikemessage.comment'),
    2: t('mylikemessage.project_content'),
    3: t('mylikemessage.image'),
    4: t('mylikemessage.post')
  }
  return typeMap[type] || t('mylikemessage.content')
}

const formatTime = (time: string) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) {
    return t('mylikemessage.just_now')
  } else if (minutes < 60) {
    return t('mylikemessage.minutes_ago', { minutes })
  } else if (hours < 24) {
    return t('mylikemessage.hours_ago', { hours })
  } else {
    return t('mylikemessage.days_ago', { days })
  }
}

const viewContent = (message: LikeMessage) => {
  // TODO: 跳转到被点赞的内容页面
  console.log('View content:', message)
}

const viewUserProfile = (userId: number) => {
  // TODO: 跳转到用户个人主页
  console.log('View user profile:', userId)
}

const markAsRead = async (messageId: number) => {
  try {
    // TODO: 调用API标记为已读
    // await api.markLikeMessageAsRead(messageId)
    
    const message = messages.value.find(m => m.id === messageId)
    if (message) {
      message.is_read = true
    }
    
    ElMessage.success(t('mylikemessage.marked_as_read'))
  } catch (error) {
    console.error('Failed to mark as read:', error)
    ElMessage.error(t('mylikemessage.mark_failed'))
  }
}

// 移除分页相关方法，改为滚动加载

// 生命周期
onMounted(() => {
  loadMessages()
  hasMessage.value = hasMessage.value-checkHasLikeMessage.value
  checkHasLikeMessage.value=0
})
</script>

<style scoped>
.like-message-container {
  height: 68vh;
}

.like-message-container :deep(.el-scrollbar__view) {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.header-card h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.message-list {
  margin-bottom: 20px;
}

.message-item {
  margin-bottom: 16px;
  position: relative;
}

.message-item:last-child {
  margin-bottom: 0;
}

.message-content-wrapper {
  display: flex;
}

.message-avatar {
  margin-right: 12px;
  flex-shrink: 0;
}

.message-avatar img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.message-content {
  flex: 1;
  min-width: 0;
  display: flex;
}

.message-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 4px;
}

.username {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.action-text {
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.content-type {
  color: var(--el-color-primary);
  font-weight: 500;
  font-size: 14px;
}

.time {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-left: auto;
}

.message-body {
  margin-bottom: 10px;
}

.liked-content {
  background: var(--el-fill-color-lighter);
  padding: 10px 12px;
  border-radius: 6px;
  border-left: 3px solid var(--u-color-primary);
  margin-bottom: 8px;
}

.content-preview {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.content-thumbnail {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
}

.content-text {
  margin: 0;
  color: var(--el-text-color-primary);
  line-height: 1.5;
  text-align: left;
  font-size: 14px;
  flex: 1;
  word-break: break-word;
}

.project-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.project-label {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.project-name {
  font-size: 12px;
  color: var(--el-color-primary);
  font-weight: 500;
}

.message-time {
  margin-top: 8px;
}

.time-text {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.like-icon {
  position: absolute;
  top: 15px;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.heart-icon {
  animation: heartbeat 1.5s ease-in-out infinite;
}

@keyframes heartbeat {
  0% {
    transform: scale(1);
  }
  14% {
    transform: scale(1.1);
  }
  28% {
    transform: scale(1);
  }
  42% {
    transform: scale(1.1);
  }
  70% {
    transform: scale(1);
  }
}

.empty-state {
  text-align: center;
  padding: 40px 0;
}

.load-more {
  text-align: center;
  padding: 20px;
}

.load-more-text {
  color: var(--el-text-color-placeholder);
  font-size: 14px;
}

.no-more {
  text-align: center;
  padding: 20px;
}

.no-more-text {
  color: var(--el-text-color-placeholder);
  font-size: 14px;
}

.initial-loading {
  text-align: center;
  padding: 40px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .like-message-container {
    padding: 15px;
  }
  
  .message-item {
    padding: 12px 0;
  }
  
  .message-avatar img {
    width: 36px;
    height: 36px;
  }
  
  .message-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .time {
    margin-left: 0;
    margin-top: 2px;
  }
  
  .content-preview {
    flex-direction: column;
  }
  
  .content-thumbnail {
    width: 100%;
    height: auto;
    max-height: 120px;
  }
}
</style>