// 用户数据
import { defineStore } from 'pinia'

export const userStore = defineStore('user', {
  state: () => ({
    userInfo: {
      "email": "",
      "vip_type": 0,
      "id_role":0,
    } as any,
    homeActiveTab:'home' as string,
    homeFilterTab:'class' as string,
    addProjectUpdate:'' as string,
    initiateChatUser:'' as string,
  }),
  getters: {

  },
  actions: {
    //判断是否已经登录获取授权
    isLogin():boolean{
      let token = localStorage.getItem('token');
      if (!token || token == "") {
        return false;
      }
      return true;
    },
    isAdmin():boolean{
      if(this.userInfo.id_role == 1){
        return true;
      }
      return false;
    }
  },
})