import { useNewMessageStoreWithOut } from '/@/store/modules/newMessage'

class NewMessageService {
  private timer: NodeJS.Timeout | null = null
  private readonly FETCH_INTERVAL = 14400000 // 4小时
  private newMessageStore = useNewMessageStoreWithOut()
  
  /**
   * 启动定时器
   */
  start() {
    if (this.timer) {
      return // 已经启动，避免重复启动
    }
    
    // 立即执行一次
    this.newMessageStore.fetchNewMessages()
    
    // 启动定时器
    this.timer = setInterval(() => {
      this.newMessageStore.fetchNewMessages()
    }, this.FETCH_INTERVAL)
    
    console.log('新消息定时器已启动')
  }
  
  /**
   * 停止定时器
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
      console.log('新消息定时器已停止')
    }
  }
  
  /**
   * 重启定时器
   */
  restart() {
    this.stop()
    this.start()
  }
  
  /**
   * 手动获取新消息
   */
  async fetchNow() {
    await this.newMessageStore.fetchNewMessages()
  }
}

// 创建单例实例
export const newMessageService = new NewMessageService()

// 导出便捷方法
export const startNewMessageTimer = () => newMessageService.start()
export const stopNewMessageTimer = () => newMessageService.stop()
export const restartNewMessageTimer = () => newMessageService.restart()
export const fetchNewMessagesNow = () => newMessageService.fetchNow()
