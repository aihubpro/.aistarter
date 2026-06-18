import { createApp } from "vue";
import App from "./App.vue";

// import "~/styles/element/index.scss";

// import ElementPlus from "element-plus";
// import all element css, uncommented next line
// import "element-plus/dist/index.css";

// or use cdn, uncomment cdn link in `index.html`

import "~/styles/index.scss";
import "uno.css";

// If you want to use ElMessage, import it.
import "element-plus/theme-chalk/src/message.scss";
import "element-plus/theme-chalk/src/loading.scss";
import "element-plus/theme-chalk/src/dialog.scss";
import "element-plus/theme-chalk/src/message-box.scss";

// 设置默认黑暗模式，检查 localStorage 中是否存在 vueuse-color-scheme 键
// console.log(localStorage.getItem('vueuse-color-scheme'));
if (!localStorage.getItem('vueuse-color-scheme')) {
    // 如果不存在，则设置其值为 'dark'
    localStorage.setItem('vueuse-color-scheme', 'dark');
}


import btn from './btn';

import router from './router'

const app = createApp(App).use(router).use(btn);
// app.use(ElementPlus);
//注册所有图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    // console.log(key);
    app.component(key, component)
}

// 导入多语言
import i18n from "./locals";
app.use(i18n)

// 统计
import VueMatomo from 'vue-matomo'
console.log(VueMatomo);
// 开源版本默认关闭统计，如需启用请将 __URL_PLACEHOLDER__ 替换为你的 Matomo 服务地址
app.use(VueMatomo, {
    host: '__URL_PLACEHOLDER__',
    siteId: 0, // 替换为你的 Matomo siteId
    router: router,
    enableLinkTracking: false
});
//开启file协议统计
(window as any)._paq.push(['enableFileTracking']);
(window as any)._paq.push(['disableCookies'])

//web 终端
import Terminal from 'vue-web-terminal'
//  3.2.0 及 2.1.13 以后版本需要引入此样式，之前版本无需引入主题样式
import 'vue-web-terminal/lib/theme/dark.css'
app.use(Terminal as any)

import VueQrcode from 'vue-qrcode'
app.component('vue-qrcode', VueQrcode)

import { createPinia } from "pinia"; //vue3 管理
const pinia = createPinia()

import UndrawUi from 'undraw-ui'
import "undraw-ui/dist/style.css";

app.use(UndrawUi)

app.use(pinia)

app.mount("#app");
