<template>
  <el-scrollbar class="comment-message-container" ref="containerRef" @scroll="handleScroll">
    <el-card class="header-card" shadow="never">
        <div class="flex justify-start">
            <span class="flex align-center font-size-24px">
                <el-icon><comment /></el-icon>
            </span>
            <div class="flex justify-center ml-2" style="align-items: end;">
                <span>{{$t('personalcenter.comment_message')}}</span>
            </div>
        </div>
    </el-card>
    
    <div class="message-list" v-if="messages.length > 0">
      <el-card 
        v-for="message in messages" 
        :key="message.id" 
        class="message-item"
        shadow="hover"
      >
    <div class="message-content">
        <div class="message-header" @click="goToDetail(message.project_id,message.project_type)">
            <div class="message-content-wrapper">
                <div class="message-avatar">
                    <el-avatar :size="60" :src="message.avatar_url || defaultAvatar" :alt="message.username" fit="cover">
                    </el-avatar>
                </div>
            </div>
            <div>
                <div class="flex">
                    <span class="username">{{ message.alias || message.username }}</span>
                    <span class="time">{{ formatTime(message.create_time) }}</span>
                </div>
                <div class="project-info mt-3 flex">
                  <div>
                    <span class="project-label">{{ $t('mycommentmessage.project') }}:</span>
                    <span class="project-name">{{ message.project_name }}</span>
                    <el-button :icon="Delete" circle size="small" class="ml-1" @click.stop="deleteComment(message.comment_id)"/>
                  </div>
                </div>
            </div>
        </div>
        
        <el-card class="message-body">
            <u-fold unfold line="1">
                <p class="comment-text">{{ stripHtmlTags(message.comment).text }}</p>
                <el-image v-show="stripHtmlTags(message.comment).images" v-for="(image, index) in stripHtmlTags(message.comment).images"  :src="image" fit="cover" :preview-src-list="stripHtmlTags(message.comment).images" class="comment-image"></el-image>
            </u-fold>
            <div class="original-content mt-2" v-if="message.original_content">
                <span class="label">{{ $t('mycommentmessage.original_content') }}:</span>
                <u-fold unfold line="1">
                    <p>{{ stripHtmlTags(message.original_content).text }}</p>
                    <el-image v-if="stripHtmlTags(message.original_content).images" v-for="(image, index) in stripHtmlTags(message.original_content).images"  :src="image" fit="cover" :preview-src-list="stripHtmlTags(message.original_content).images" class="comment-image"></el-image>
                </u-fold>
            </div>
        </el-card>
          <!--
          <div class="message-actions">
            <el-button 
              link 
              size="small" 
              @click="viewDetail(message)"
            >
              查看详情
            </el-button>
            <el-button 
              link 
              size="small" 
              @click="markAsRead(message.id)"
              v-if="message.is_read === 0"
            >
              标记已读
            </el-button>
          </div>
          -->
        </div>
      </el-card>
      
      <!-- 加载更多提示 -->
      <div class="load-more" v-if="hasMore">
        <el-loading v-if="loading" :text="$t('mycommentmessage.loading')" />
        <div v-else class="load-more-text">{{ $t('mycommentmessage.scroll_load_more') }}</div>
      </div>
      
      <!-- 没有更多数据提示 -->
      <div class="no-more" v-if="!hasMore && messages.length > 0">
        <div class="no-more-text">{{ $t('mycommentmessage.no_more_data') }}</div>
      </div>
    </div>
    
    <el-card class="empty-state" v-else-if="!loading" shadow="never">
      <el-empty :description="$t('mycommentmessage.no_comment_messages')" />
    </el-card>
    
    <!-- 初始加载 -->
    <div class="initial-loading" v-if="loading && messages.length === 0">
      <el-loading :text="$t('mycommentmessage.loading')" />
    </div>
  </el-scrollbar>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick , inject} from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Delete
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
const { openProductDetails,openProductDetailsReview,hasMessage,checkHasCommentMessage } = inject('main') as any;
const { t } = useI18n()

// 数据定义
interface CommentMessage {
  id: number
  user_id: number
  commenter_id: number
  project_id: number
  project_type: number
  comment_id: number
  message_type: number
  is_read: number
  create_time: string
  username: string
  avatar_url?: string
  alias?: string
  project_name: string
  comment: string
  original_content?: string
}

// API响应接口
interface ApiResponse {
  code: number
  msg: string
  data: {
    total: number
    size: string
    current: string
    records: CommentMessage[]
  }
}

const messages = ref<CommentMessage[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const hasMore = ref(true)
const containerRef = ref<HTMLElement>()
const defaultAvatar = '/src/assets/ai_noimg.png'
const userUrl = (window as any).Constants.uploadUrl+'/assets/user-images/'

// 跳到对应项目
const goToDetail = (id: number, type: number) => {
    console.log('跳转到项目详情', id, type)
    openProductDetails({id:id,res_type:type},{},'four')
}

//删除对应评论
const deleteComment = async (comment_id: number) => {
  console.log('删除评论', comment_id)
  try {
    const res = await axios.post((window as any).Constants.uploadUrl+'/users/delete-comment-msg', {
      comment_id: comment_id
    }, {
      headers: {
        'access-token': localStorage.getItem('token') || ''
      }
    })
    if (res.data.code === 0) {
      ElMessage({ type: 'success', message: t('commentcomp.delete_success') })
      loadMessages()
    } else {
      ElMessage.error(res.data.msg || t('commentcomp.delete_failed'))
    }
  } catch (error) {
    ElMessage.error(t('commentcomp.network_error_delete'))
  }
}

// API调用函数
const fetchCommentMessages = async (page: number, size: number): Promise<ApiResponse> => {
  try {
    const response = await axios.get((window as any).Constants.uploadUrl+'/users/get-comment-msg-list', {
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
    const response = await fetchCommentMessages(currentPage.value, pageSize.value)
    
    if (response.code !== 0) {
      throw new Error(response.msg || '获取数据失败')
    }
    
    const { data } = response
    //设置data.records 中 avatar_url为空时，默认为defaultAvatar
    data.records.forEach((item: any) => {
      if (!item.avatar_url) {
        item.avatar_url = defaultAvatar
      }else{
        item.avatar_url = userUrl+item.avatar_url
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
    console.error('Failed to load comment messages:', error)
    ElMessage.error(t('mycommentmessage.load_failed'))
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

// 清理HTML标签的函数
const stripHtmlTags = (html: string) => {
  if (!html) return { text: '', images: [] }
  
  // 创建一个临时的div元素来解析HTML
  const tempDiv = document.createElement('div')
  console.log('原始内容:', html)
  
  // 匹配u-img[]获取里面的内容
  const images: string[] = []
  const uImgRegex = /u-img\[(.*?)\]/g
  let match
  
  while ((match = uImgRegex.exec(html)) !== null) {
    const imageUrl = match[1] // 获取括号内的URL
    if (imageUrl) {
      // 处理逗号分隔的多个URL
      const urls = imageUrl.split(',').map(url => url.trim()).filter(url => url)
      images.push(...urls)
    }
  }
  
  // 将u-img标记替换为img标签
  const processedHtml = html.replace(uImgRegex, (match, url) => {
    return `<img src="${url}" style="max-width: 100%; height: auto;" />`
  })
  
  tempDiv.innerHTML = processedHtml
  
  const result = {
    text: tempDiv.textContent || tempDiv.innerText || '',
    images: images,
    hasHtml: /<\/?[a-z][\s\S]*>/i.test(processedHtml),
    processedHtml: processedHtml
  }
  
  console.log('解析结果:', result)
  return result
}

const formatTime = (time: string) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) {
    return t('mycommentmessage.just_now')
  } else if (minutes < 60) {
    return t('mycommentmessage.minutes_ago', { minutes })
  } else if (hours < 24) {
    return t('mycommentmessage.hours_ago', { hours })
  } else {
    return t('mycommentmessage.days_ago', { days })
  }
}

const viewDetail = (message: CommentMessage) => {
  // TODO: 跳转到详情页面或打开详情弹窗
  console.log('View detail:', message)
}

const markAsRead = async (messageId: number) => {
  try {
    // TODO: 调用API标记为已读
    // await api.markMessageAsRead(messageId)
    
    const message = messages.value.find(m => m.id === messageId)
    if (message) {
      message.is_read = true
    }
    
    ElMessage.success(t('mycommentmessage.marked_as_read'))
  } catch (error) {
    console.error('Failed to mark as read:', error)
    ElMessage.error(t('mycommentmessage.mark_failed'))
  }
}

// 移除分页相关方法，改为滚动加载

// 生命周期
onMounted(() => {
  loadMessages()
  hasMessage.value = hasMessage.value-checkHasCommentMessage.value
  checkHasCommentMessage.value=0
})
</script>

<style scoped>
.comment-message-container {
  height: 68vh;
}

.comment-message-container :deep(.el-scrollbar__view) {
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
}

.message-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.username {
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-right: 12px;
}

.time {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.message-body {
  margin-bottom: 10px;
  text-align:left;
}
.comment-image{
  height: 100px;
}

.comment-text {
  margin: 0 0 8px 0;
  color: var(--el-text-color-primary);
  line-height: 1.5;
}

.original-content {
  background: var(--el-fill-color-lighter);
  padding: 8px 12px;
  border-radius: 4px;
  border-left: 3px solid var(--u-color-primary);
}

.original-content .label {
  font-size: 12px;
  color: var(--el-text-color-regular);
  font-weight: 500;
}

.original-content p {
  margin: 4px 0 0 0;
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.4;
}

.message-actions {
  display: flex;
  gap: 8px;
  color: var(--el-text-color-secondary);
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
  .comment-message-container {
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
    margin-top: 2px;
  }
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
</style>