import { defHttp } from '/@/utils/http/axios'
import { BasicPageParams, BasicFetchResult } from '/@/api/model/baseModel'

enum Api {
  // 消息相关
  GetChatHistory = '/chat/getChatList',
  SendMessage = '/chat/broadcastMessage',
  DeleteMessage = '/chat/deleteChatMessage',
  
  // 联系人相关
  GetContacts = '/api/chat/contacts',
  CreateOrGetChat = '/api/chat/create',
  
  // 用户相关
  GetUserList = '/api/users',
  GetOnlineStatus = '/api/chat/online-status',
  GetUnreadCount = '/api/chat/unread-count',
  
  // 文件上传
  UploadFile = '/api/upload/file'
}

/**
 * 获取聊天消息历史
 */
export const getChatHistory = (params: any) =>
  defHttp.get<BasicFetchResult<any>>({ url: Api.GetChatHistory, params })

/**
 * 获取联系人列表
 */
export const getContacts = (params?: BasicPageParams) =>
  defHttp.get<BasicFetchResult<any>>({ url: Api.GetContacts, params })

/**
 * 创建或获取聊天
 */
export const createOrGetChat = (targetUserId: number) =>
  defHttp.post<{ chatId: string }>({ url: Api.CreateOrGetChat, data: { targetUserId } })

/**
 * 发送消息（单发）
 */
export const sendSingleMessage = (params: {
  target_type: string
  target_users: number
  message: string
}) =>
  defHttp.post({ url: Api.SendMessage, data: params })

/**
 * 发送群发消息
 */
export const sendGroupMessage = (params: {
  target_users?: number
  target_name?: string
  message: string
  target_type?: 'all' | 'user'
}) =>
  defHttp.post({ url: Api.SendMessage, data: params })

/**
 * 删除消息
 */
export const deleteMessage = (messageId: number) =>
  defHttp.post({ url: Api.DeleteMessage, data: { id:messageId } })

// 撤回消息功能暂未实现，可以使用删除消息代替

/**
 * 获取用户列表
 */
export const getUserList = (params?: { keyword?: string }) =>
  defHttp.get<any[]>({ url: Api.GetUserList, params })

/**
 * 获取用户在线状态
 */
export const getUserOnlineStatus = (userIds: number[]) =>
  defHttp.get<Record<number, boolean>>({ url: Api.GetOnlineStatus, params: { userIds } })

/**
 * 获取未读消息数
 */
export const getUnreadCount = () =>
  defHttp.get<{ unread_count: number }>({ url: Api.GetUnreadCount })

/**
 * 上传文件
 */
export const uploadFile = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return defHttp.post({ url: Api.UploadFile, data: formData })
}

/**
 * 管理员消息API（适配chat_0_0和chat_0_userId模式）
 */
export class AdminChatApi {
  /**
   * 发送管理员消息（支持单发和群发）
   */
  static async sendAdminMessage(params: {
    target_users?: number
    target_name?: string
    message: string
    target_type?: 'all' | 'user'
  }) {
    return sendGroupMessage({
      target_users: params.target_users,
      target_name: params.target_name,
      message: params.message,
      target_type: params.target_type
    })
  }
  
  /**
   * 获取管理员消息历史（包含群发和单发）
   */
  static async getAdminMessageHistory(params: any) {
    // 这里可以根据需要过滤管理员消息
    return getChatHistory({
      ...params,
      // 可以添加管理员消息的特定过滤条件
    })
  }
  
  /**
   * 获取可发送消息的用户列表
   */
  static async getAvailableUsers() {
    return getUserList()
  }
  
  /**
   * 批量获取用户在线状态
   */
  static async getBatchUserOnlineStatus(userIds: number[]) {
    return getUserOnlineStatus(userIds)
  }
  
  /**
   * 删除消息
   */
  static async deleteMessage(messageId: number) {
    return deleteMessage(messageId)
  }
  
  /**
   * 撤回消息（使用删除消息API）
   */
  static async recallMessage(messageId: number) {
    return deleteMessage(messageId)
  }
}
