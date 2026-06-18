import { createI18n } from 'vue-i18n'
import zhCn from './package/zh-cn';
import en from './package/en';

// 创建 i18n
const i18n = createI18n({
  legacy: false, // 解决Not available in legacy mode报错
  globalInjection: true, // 全局模式，可以直接使用 $t
  locale: 'zhCn',
  messages: {
    zhCn,
    en
  }
});

export default i18n;
