import { defineStore } from 'pinia'
import { store } from '/@/store'
import { defHttp } from '/@/utils/http/axios'

export interface NewMessageState {
  newMessageList: string[]
  loading: boolean
  lastFetchTime: number
}

export const useNewMessageStore = defineStore({
  id: 'app-new-message',
  state: (): NewMessageState => ({
    newMessageList: [],
    loading: false,
    lastFetchTime: 0,
  }),
  getters: {
    getNewMessageList(): string[] {
      return this.newMessageList
    },
    isNewMessage: (state) => {
      return (name2: string) => {
        return name2 && state.newMessageList.includes(name2)
      }
    },
  },
  actions: {
    /**
     * 获取新消息数据
     */
    async fetchNewMessages() {
      if (this.loading) return
      
      this.loading = true
      try {
        const response = await defHttp.get({ url: '/users/getNewMessage' })
        if (response.code === 0 && Array.isArray(response.data)) {
          this.newMessageList = response.data
          this.lastFetchTime = Date.now()
        }
      } catch (error) {
        console.error('获取新消息失败:', error)
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 清空新消息列表
     */
    clearNewMessages() {
      this.newMessageList = []
    },
    
    /**
     * 设置新消息列表
     */
    setNewMessageList(list: string[]) {
      this.newMessageList = list
    },
  },
})

// Need to be used outside the setup
export function useNewMessageStoreWithOut() {
  return useNewMessageStore(store)
}