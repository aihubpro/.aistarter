<template>
  <div>
    <div class="m-3 p-3 pt-5 bg-white">
      <b-query :query-params="model.queryParam" :fields="fields" @query="queryPage" @reset="resetQueryParams" />
    </div>
    <div class="m-3 p-3 bg-white">
      <div class="chat-header mb-4">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="text-lg font-semibold mb-2">聊天消息管理</h3>
            <div class="flex space-x-4 text-sm text-gray-600">
              <span>总消息数: <strong class="text-blue-600">{{ pagination.total }}</strong></span>
            </div>
          </div>
          <div class="space-x-2">
            <!-- WebSocket连接状态指示器 -->
            <a-tag v-if="wsConnected" color="green" size="small">
              <icon icon="ant-design:wifi-outlined" />
              已连接
            </a-tag>
            <a-tag v-else-if="wsConnecting" color="orange" size="small">
              <icon icon="ant-design:loading-outlined" />
              连接中……
            </a-tag>
            <a-tag v-else color="red" size="small">
              <icon icon="ant-design:disconnect-outlined" />
              未连接
            </a-tag>
            <a-button type="primary" @click="showSendModal('single')" :loading="wsConnecting">
              <icon icon="ant-design:send-outlined" />
              单发消息
            </a-button>
            <a-button type="primary" @click="showSendModal('group')" :loading="wsConnecting">
              <icon icon="ant-design:team-outlined" />
              群发消息
            </a-button>
            <a-button @click="queryPage">
              <icon icon="ant-design:reload-outlined" />
              刷新
            </a-button>
          </div>
        </div>
      </div>
      
      <vxe-table
        ref="xTable"
        :data="pagination.records"
        :loading="loading"
        stripe
        border
        show-overflow
        :cell-style="cellStyle"
      >
        <vxe-column type="seq" title="序号" width="80" />
        <vxe-column field="sender_name" title="发送者" width="120" align="center"></vxe-column>
        <vxe-column field="receiver_name" title="接收者" width="120" align="center">
          <template #default="{ row }">
            <span v-if="row.receiver_name === '全体用户'">
              {{ row.receiver_name }}
              <a-tag color="orange" size="small" style="margin-left: 4px;">群发</a-tag>
            </span>
            <span v-else>{{ row.receiver_name }}</span>
          </template>
        </vxe-column>
        <vxe-column field="message_type" title="消息类型" width="100" align="center">
          <template #default="{ row }">
            <a-tag v-if="row.message_type === 'text'" color="blue">文本</a-tag>
            <a-tag v-else-if="row.message_type === 'image'" color="green">图片</a-tag>
            <a-tag v-else-if="row.message_type === 'file'" color="purple">文件</a-tag>
          </template>
        </vxe-column>
        <vxe-column field="content" title="消息内容" min-width="300" show-overflow="tooltip"></vxe-column>
        <vxe-column field="is_read" title="读取状态" width="100" align="center">
          <template #default="{ row }">
            <a-tag v-if="row.is_read === 1" color="green">已读</a-tag>
            <a-tag v-else color="orange">未读</a-tag>
          </template>
        </vxe-column>
        <vxe-column field="create_time" title="发送时间" width="180" align="center"/>
        <vxe-column title="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <a-space>
              <a-link @click="recallMessage(row)" v-if="row.status !== 'recalled'">撤回</a-link>
              <a-link @click="deleteMessage(row)" style="color: #ff4d4f;">删除</a-link>
            </a-space>
          </template>
        </vxe-column>


      </vxe-table>
      
      <!-- 分页 -->
      <div class="mt-4 flex justify-center">
        <vxe-pager
          size="medium"
          :loading="loading"
          :current-page="pagination.current"
          :page-size="pagination.size"
          :total="pagination.total" 
          @page-change="handleTableChange"
        />
      </div>
    </div>

    <!-- 发送消息弹窗 -->
    <a-modal v-model:visible="sendModalVisible" :title="sendModalTitle" width="700px" @ok="handleSendSubmit" @cancel="handleSendCancel">
      <a-form :model="sendForm" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }">
        <!-- 单发模式 -->
        <a-form-item label="用户ID" v-if="sendMode === 'single'">
          <a-input 
            v-model:value="sendForm.receiver_id" 
            placeholder="请输入接收用户的ID" 
            type="number"
            :disabled="!!sendForm.receiver_name"
            @change="handleReceiverIdChange"
          />
        </a-form-item>
        
        <a-form-item label="用户名" v-if="sendMode === 'single'">
          <a-input 
            v-model:value="sendForm.receiver_name" 
            placeholder="请输入接收用户的用户名" 
            :disabled="!!sendForm.receiver_id"
            @change="handleReceiverNameChange"
          />
        </a-form-item>
        
        <!-- 群发模式 - 简化版本，只保留消息内容 -->
        <div v-if="sendMode === 'group'">
          <a-form-item>
            <a-alert message="群发消息将发送给所有用户" type="info" show-icon class="mb-4" />
          </a-form-item>
        </div>
        <!-- 单发模式只保留消息内容输入 -->
        <template v-if="sendMode === 'single'">
          <a-form-item label="消息内容" required>
            <a-textarea v-model:value="sendForm.content" :rows="4" placeholder="请输入消息内容" />
          </a-form-item>
        </template>
        
        <!-- 群发模式只保留消息内容输入 -->
        <template v-if="sendMode === 'group'">
          <a-form-item label="消息内容" required>
            <a-textarea v-model:value="sendForm.content" :rows="4" placeholder="请输入群发消息内容" />
          </a-form-item>
        </template>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import useTablePage from '/@/hooks/bootx/useTablePage'
import BQuery from '/@/components/Bootx/Query/BQuery.vue'
import { useMessage } from '/@/hooks/web/useMessage'
import { LIST, QueryField, STRING, SELECT } from '/@/components/Bootx/Query/Query'
import { VxeTableInstance } from 'vxe-table'
import ALink from '/@/components/Link/Link.vue'
import dayjs from 'dayjs'
import { $ref } from 'vue/macros'
import { AdminChatApi, type ChatMessage, type ChatUser } from './Chat.api'
import { getToken } from '/@/utils/auth'
import { useGlobSetting } from '/@/hooks/setting'

// import { page, createMessage, updateMessage, deleteMessage, sendMessage } from './Message.api'

const { createMessage } = useMessage()

// 使用hooks
const { handleTableChange, pageQueryResHandel, sortChange, resetQueryParams, pagination, pages, sortParam, model, loading } =
  useTablePage(queryPage)

const readStatusList = $ref([{key:"is_read", value:'0', label:"未读"}, {key:"is_read", value:'1', label:"已读"}])

// 查询条件
const fields = computed(() => {
  return [
    { field: 'receiver_name', type: STRING, name: '用户名', placeholder: '请输入用户名' },
    { field:'is_read', type: LIST, name: '读取状态', placeholder: '请选择读取状态', selectList: readStatusList },
  ] as QueryField[]
})

const xTable = $ref<VxeTableInstance>()

// WebSocket 相关
let adminWebSocket: WebSocket | null = null
const wsConnecting = ref(false)
const wsConnected = ref(false)

// 弹窗控制
const sendModalVisible = ref(false)
const sendMode = ref('single') // 'single' | 'group'

// 计算属性：弹窗标题
const sendModalTitle = computed(() => {
  return sendMode.value === 'single' ? '发送消息' : '群发消息'
})



// 发送表单数据
const sendForm = ref({
  // 单发消息参数
  receiver_id: null,
  receiver_name: null,
  targetUserId: null,
  chatId: '',
  // 群发消息参数
  receiver_ids: [],
  receiverIds: [],
  // 消息内容
  content: '',
  contentType: 'text',
  content_type: 'text',
  message_type: 'text',
  // 发送模式
  mode: 'single',
  // 文件上传
  imageList: [],
  fileList: []
})

// 用户列表
const userList = ref<ChatUser[]>([])

// 全局消息数据存储
const messageStore = ref<ChatMessage[]>([])

// WebSocket 连接函数 - 借鉴Mymessage.vue的实现
function connectAdminWebSocket(): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    try {
      // 如果已经有活跃连接，直接返回现有连接
      if (adminWebSocket && adminWebSocket.readyState === WebSocket.OPEN) {
        resolve(adminWebSocket)
        return
      }
      
      if (wsConnecting.value) {
        reject(new Error('WebSocket正在连接中'))
        return
      }
      
      const token = getToken()
      if (!token) {
        console.error('No token available for WebSocket connection')
        reject(new Error('缺少认证令牌'))
        return
      }
      
      // 关闭现有连接
      if (adminWebSocket) {
        adminWebSocket.close()
        adminWebSocket = null
      }
      
      wsConnecting.value = true
      
      // 根据当前环境确定WebSocket URL - 借鉴Mymessage.vue的URL构建方式
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      // 动态获取主机地址
      let host: string
      const { apiUrl } = useGlobSetting()

      if (apiUrl) {
        // 如果有配置的API URL，从中提取主机信息
        const url = new URL(apiUrl)
        host = url.host
      } else {
        // 如果没有配置，使用当前页面的主机，但可能需要不同的端口
        // 生产环境中，WebSocket服务通常与Web服务在同一域名下
        host = window.location.host
        
        // 如果WebSocket服务在不同端口，可以这样处理：
        // host = window.location.hostname + ':7000'
      }
      const wsUrl = `${protocol}//${host}?token=${token}&admin=true`
      console.log(useGlobSetting().apiUrl)
      console.log('连接管理员WebSocket:', wsUrl)
      
      adminWebSocket = new WebSocket(wsUrl)
      
      adminWebSocket.onopen = function() {
        console.log('管理员WebSocket连接成功')
        wsConnecting.value = false
        wsConnected.value = true
        // createMessage.success('管理员WebSocket连接已建立')
        resolve(adminWebSocket)
      }
      
      adminWebSocket.onmessage = function(event) {
        try {
          console.log('WebSocket message:', event.data)
          const response = JSON.parse(event.data)
          console.log('WebSocket响应:', response)
          
          switch(response.type) {
            case 'admin_connection':
            case 'connection':
              console.log('管理员连接确认:', response.data?.message || response.message)
              break
            case 'admin_broadcast_sent':
              createMessage.success('广播消息发送成功')
              // 添加到历史记录
              addToHistory({
                chat_id: 'chat_0_0',
                receiver_id: null,
                receiver_name: '全体用户',
                content_type: 'text',
                content: response.data?.content || response.content,
                message_type: 'text',
                is_group_message: true
              })
              break
            case 'admin_message_sent':
              createMessage.success(`私聊消息发送成功`)
              // 添加到历史记录
              addToHistory({
                chat_id: response.data?.chatId || response.chatId,
                receiver_id: response.data?.chatid || response.chatid,
                receiver_name: `用户ID: ${response.data?.chatid || response.chatid}`,
                content_type: 'text',
                content: response.data?.content || response.content,
                message_type: 'text'
              })
              break
            case 'admin_error':
            case 'error':
              createMessage.error(`发送失败: ${response.data?.message || response.message}`)
              break
          }
        } catch (error) {
          console.error('解析WebSocket消息失败:', error)
        }
      }
      
      adminWebSocket.onerror = function(error) {
        console.error('WebSocket错误:', error)
        wsConnecting.value = false
        wsConnected.value = false
        createMessage.error('管理员WebSocket连接失败，请检查网络连接')
        adminWebSocket = null
        reject(error)
      }
      
      adminWebSocket.onclose = function(event) {
        console.log('WebSocket连接已关闭:', event.code, event.reason)
        wsConnecting.value = false
        wsConnected.value = false
        adminWebSocket = null
        
        // 不要自动重连，避免无限循环
        if (event.code === 1000 || event.code === 1008) {
          console.log('WebSocket正常关闭或认证错误')
          return
        }
      }
    } catch (error) {
      console.error('建立WebSocket连接时发生错误:', error)
      wsConnecting.value = false
      wsConnected.value = false
      createMessage.error('建立管理员WebSocket连接时发生错误')
      reject(error)
    }
  })
}

// 发送WebSocket消息
function sendWebSocketMessage(message: any): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // 确保WebSocket连接可用
      if (!adminWebSocket || adminWebSocket.readyState !== WebSocket.OPEN) {
        await connectAdminWebSocket()
      }
      
      // 发送消息
      adminWebSocket.send(JSON.stringify(message))
      console.log('WebSocket消息已发送:', message)
      
      // 设置超时处理
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket消息发送超时'))
      }, 10000) // 10秒超时
      
      // 创建一次性消息监听器
       const messageHandler = function(event) {
         try {
           const response = JSON.parse(event.data)
           console.log('收到WebSocket响应:', response)
           
           // 如果是发送成功的响应，则resolve
           if (response.type === 'admin_broadcast_sent' || response.type === 'admin_message_sent') {
             clearTimeout(timeout)
             adminWebSocket.removeEventListener('message', messageHandler)
             resolve()
           } else if (response.type === 'admin_error') {
             clearTimeout(timeout)
             adminWebSocket.removeEventListener('message', messageHandler)
             reject(new Error(response.data.message))
           }
         } catch (error) {
           console.error('解析WebSocket响应失败:', error)
         }
       }
       
       // 添加消息监听器
       adminWebSocket.addEventListener('message', messageHandler)
      
    } catch (error) {
      reject(error)
    }
  })
}

onMounted(() => {
    initData()
    // 自动连接WebSocket
    connectAdminWebSocket().catch(error => {
      console.error('自动连接WebSocket失败:', error)
    })
  })

onUnmounted(() => {
  // 清理WebSocket连接
  if (adminWebSocket && adminWebSocket.readyState === WebSocket.OPEN) {
    adminWebSocket.close()
  }
  adminWebSocket = null
  wsConnected.value = false
  wsConnecting.value = false
})
/**
  * 初始化数据
  */
async function initData() {
  try {
    // 加载数据
    await queryPage()
  } catch (error) {
    console.error('初始化数据失败:', error)
  }
}



/**
 * 分页查询
 */
async function queryPage() {
  loading.value = true
  
  try {
    // 调用API获取消息历史
    const result = await AdminChatApi.getAdminMessageHistory({
      ...model.queryParam,
      ...pages,
      ...sortParam,
    })
    // 处理返回数据
    pageQueryResHandel(result.data)
  } catch (error) {
    console.error('查询消息失败:', error)
    createMessage.error('查询消息失败')
  } finally {
    loading.value = false
  }
}

// 显示发送消息弹窗
function showSendModal(mode: 'single' | 'group' = 'single') {
  sendMode.value = mode
  resetSendForm(mode)
  sendForm.value.mode = mode
  sendModalVisible.value = true
}

// 重置表单
function resetSendForm(mode: 'single' | 'group' = 'single') {
  sendForm.value = {
    // 单发消息参数
    receiver_id: null,
    receiver_name: null,
    targetUserId: null,
    chatId: '',
    // 消息内容
    content: '',
    contentType: 'text',
    content_type: 'text',
    message_type: 'text',
    // 发送模式
    mode: mode
  }
}

// 处理用户ID输入变化
function handleReceiverIdChange() {
  if (sendForm.value.receiver_id) {
    // 清空用户名
    sendForm.value.receiver_name = null
    // 设置相关字段
    sendForm.value.targetUserId = sendForm.value.receiver_id
    sendForm.value.chatId = `chat_0_${sendForm.value.receiver_id}`
  }
}

// 处理用户名输入变化
function handleReceiverNameChange() {
  if (sendForm.value.receiver_name) {
    // 清空用户ID
    sendForm.value.receiver_id = null
    sendForm.value.targetUserId = null
    sendForm.value.chatId = ''
  }
}

// 用户搜索过滤（单发模式使用）
function filterUserOption(input: string, option: any) {
  const user = userList.value.find(u => u.id === option.value)
  return user?.name.toLowerCase().includes(input.toLowerCase()) || false
}

// 撤回消息（使用删除消息API）
async function recallMessage(row: any) {
  try {
    await AdminChatApi.deleteMessage(row.id)
    createMessage.success('消息已撤回')
    queryPage()
  } catch (error) {
    console.error('撤回消息失败:', error)
    createMessage.error('撤回消息失败')
  }
}

// 删除消息
async function deleteMessage(row: any) {
  try {
    await AdminChatApi.deleteMessage(row.id)
    createMessage.success('消息已删除')
    queryPage()
  } catch (error) {
    console.error('删除消息失败:', error)
    createMessage.error('删除消息失败')
  }
}



// 提交发送消息
async function handleSendSubmit() {
  // 单发模式验证
  if (sendMode.value === 'single') {
    if (!sendForm.value.receiver_id && !sendForm.value.receiver_name) {
      createMessage.warning('请输入接收用户ID或用户名')
      return
    }
    
    // 验证消息内容
    if (!sendForm.value.content) {
      createMessage.warning('请输入消息内容')
      return
    }
  } else {
    // 群发模式只验证消息内容
    if (!sendForm.value.content) {
      createMessage.warning('请输入群发消息内容')
      return
    }
  }
  
  try {
    // 先通过API保存到数据库
    const apiResult = await AdminChatApi.sendAdminMessage({
      message: sendForm.value.content,
      target_users: sendForm.value.receiver_id,
      target_name: sendForm.value.receiver_name,
      target_type: sendForm.value.receiver_id ? `user` : sendForm.value.receiver_name ? 'user' : 'all'
    })
    
    console.log('消息已保存到数据库:', apiResult)
    
    // 然后通过WebSocket实时推送
    if (sendMode.value === 'single') {
      // 发送私聊消息
      const privateMessage = {
        type: 'admin_send_message',
        content: sendForm.value.content,
        targetUserId: sendForm.value.receiver_id,
        targetName: sendForm.value.receiver_name,
        messageIdDate: `private_${Date.now()}`
      }
      
      await sendWebSocketMessage(privateMessage)
      console.log('私聊消息WebSocket推送成功')
      
    } else {
      // 发送广播消息
      const broadcastMessage = {
        type: 'admin_broadcast',
        content: sendForm.value.content,
        messageIdDate: `broadcast_${Date.now()}`
      }
      
      await sendWebSocketMessage(broadcastMessage)
      console.log('广播消息WebSocket推送成功')
    }
    
    // 显示成功消息
    if (sendMode.value === 'single') {
      createMessage.success('单发消息发送成功')
    } else {
      createMessage.success('群发消息发送成功')
    }
    
  } catch (error) {
    console.error('发送消息失败:', error)
    // createMessage.error(`发送消息失败: ${error.message || error}`)
    createMessage.error(`发送消息失败:用户名或用户ID不存在`)
    return
  }
  
  sendModalVisible.value = false
  // 刷新消息列表
  queryPage()
}

// 添加到历史记录（模拟函数）
function addToHistory(messageData: any) {
  // 生成新的消息记录
  const maxId = messageStore.value.length > 0 ? Math.max(...messageStore.value.map(m => m.id)) : 0
  const newMessage = {
    id: maxId + 1, // 生成唯一ID
    chat_id: messageData.chat_id || `chat_0_${messageData.receiver_id || 0}`,
    sender_id: 0, // 管理员ID
    receiver_id: messageData.receiver_id,
    content: messageData.content,
    message_type: messageData.content_type || messageData.message_type || 'text',
    is_read: 0, // 未读
    created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    // 扩展字段
    sender_name: '管理员',
    receiver_name: messageData.receiver_name,
    // WebSocket兼容字段
    uid: 0,
    chatid: messageData.receiver_id,
    user: {
      username: '管理员',
      avatar: null
    },
    createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
  }
  
  // 将新消息添加到全局消息存储的开头
  messageStore.value.unshift(newMessage)
  
  // 跳转到第一页并刷新数据，确保能看到新添加的消息
  pagination.current = 1
  queryPage()
  
  console.log('添加消息记录:', messageData)
}

// 取消发送消息
function handleSendCancel() {
  sendModalVisible.value = false
}

/**
 * 显示样式优化
 */
function cellStyle({ row, column }) {
  if (column.field == 'status') {
    if (row.status == 'read') {
      return { color: 'purple' }
    }
    if (row.status == 'delivered') {
      return { color: 'blue' }
    }
    if (row.status == 'sent') {
      return { color: 'green' }
    }
  }
}
</script>

<style lang="less" scoped>
.chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  
  h3 {
    color: white;
    margin: 0;
  }
  
  .text-gray-600 {
    color: rgba(255, 255, 255, 0.8) !important;
  }
  
  .text-blue-600 {
    color: #93c5fd !important;
  }
  
  .text-green-600 {
    color: #86efac !important;
  }
  
  .text-gray-500 {
    color: rgba(255, 255, 255, 0.6) !important;
  }
}

.vxe-table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.ant-modal {
  .ant-modal-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-bottom: none;
    
    .ant-modal-title {
      color: white;
    }
  }
}

.ant-pagination {
  .ant-pagination-item-active {
    background: #667eea;
    border-color: #667eea;
  }
  
  .ant-pagination-item-active a {
    color: white;
  }
}

.message-stats {
  display: flex;
  gap: 16px;
  
  .stat-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    
    .stat-label {
      font-size: 12px;
      opacity: 0.9;
    }
    
    .stat-value {
      font-weight: 600;
      font-size: 14px;
    }
  }
}
</style>
