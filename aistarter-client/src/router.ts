import { createRouter, createWebHashHistory } from 'vue-router'

import HomePage from './components/HomePage.vue'
import FilesPage from './components/FilesPage.vue'
import MarketPage from './components/MarketPage.vue'
import SettingPage from './components/SettingPage.vue'
import MyPage from './components/MyPage.vue'
import GuestPage from './components/GuestPage.vue'
import ReviewPage from './components/ReviewPage.vue'

const routes = [
    {
        path: '/',
        name: 'home',
        component: HomePage
    },
    {
        path: '/files',
        name: 'files',
        component: FilesPage
    },
    {
        path: '/market',
        name: 'market',
        component: MarketPage
    },
    {
        path: '/settings',
        name: 'settings',
        component: SettingPage
    },
    {
        path: '/my',
        name: 'my',
        component: MyPage
    },
    {
        path: '/guest',
        name: 'guest',
        component: GuestPage
    },
    {
        path:'/review',
        name: 'review',
        component: ReviewPage
    }
]
const router = createRouter({
    /**
     * createWebHashHistory
     *      home: http://localhost:5176/#/
     *      about: http://localhost:5176/#/about
     * 原理: a标签锚点链接
     * 
     * createWebHistory, 此种方式需要后台配合做重定向，否则会出现404问题
     *      home: http://localhost:5176/
     *      about: http://localhost:5176/about
     * 原理: HTML5的pushState()
     */
    history: createWebHashHistory(),
    routes
})

export default router