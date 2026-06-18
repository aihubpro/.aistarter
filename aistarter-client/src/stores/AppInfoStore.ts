//软件初始化数据
import { defineStore } from 'pinia'

export const appInfoStore = defineStore('info', {
    state: () => ({
        appVersion:'5.2.0',
        updateInfo: {} as any,
        bannerInfo: [] as any,
        newupdateInfo: {} as any,
    }),
    getters: {

    },
    actions: {

    },
})