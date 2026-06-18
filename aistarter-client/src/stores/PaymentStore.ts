// 支付相关
import { defineStore } from 'pinia'

export const paymentStore = defineStore('payment', {
  state: () => ({
    // isBuys: false as boolean, 废弃，不过这个类保留
    couponCode: '' as string, // 优惠券码
  }),
  getters: {
  },
  actions: {

  },
})