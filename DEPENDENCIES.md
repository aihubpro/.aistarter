# Dependencies（依赖清单）

本文件用于汇总各模块常见依赖（以各子目录 `package.json` 为准）。如需对外发布/商业使用，请自行核对第三方依赖许可证与合规要求。

## 桌面客户端（Desktop）

### dependencies

```json
{
  "node-downloader-helper": "^2.1.9",
  "undraw-ui": "^1.3.5",
  "@codemirror/lang-javascript": "^6.2.2",
  "@codemirror/theme-one-dark": "^6.1.2",
  "@element-plus/icons-vue": "^2.3.1",
  "@vueuse/core": "^10.11.0",
  "ali-oss": "^6.21.0",
  "archiver": "7.0.1",
  "axios": "^1.7.2",
  "bytenode": "1.5.6",
  "codemirror": "^6.0.1",
  "decompress-zip": "^0.3.3",
  "dom-to-image": "^2.6.0",
  "ejs": "^3.1.10",
  "electron-download-manager": "^2.1.2",
  "electron-updater": "^6.2.1",
  "element-plus": "^2.7.6",
  "form-data": "^4.0.0",
  "iconv-lite": "^0.6.3",
  "node-machine-id": "^1.1.12",
  "node-stream-zip": "^1.15.0",
  "pinia": "^2.2.2",
  "prettier-bytes": "1.0.4",
  "progress-stream": "^2.0.0",
  "readable-stream": "4.5.2",
  "sharp": "^0.34.2",
  "tar": "^7.4.3",
  "vue": "^3.4.30",
  "vue-codemirror": "^6.1.1",
  "vue-i18n": "^9.13.1",
  "vue-matomo": "^4.2.0",
  "vue-qrcode": "^2.2.2",
  "vue-router": "^4.4.0",
  "vue-web-terminal": "3.2.5",
  "webtorrent": "1.9.7",
  "xlsx": "^0.18.5"
}
```

### devDependencies

```json
{
  "@iconify-json/ep": "^1.1.15",
  "@types/codemirror": "^5.60.15",
  "@types/node": "^20.14.9",
  "@vitejs/plugin-vue": "^5.0.5",
  "electron": "29.0.0",
  "electron-builder": "^24.13.3",
  "sass": "^1.77.6",
  "typescript": "^5.5.2",
  "unocss": "^0.58.8",
  "unplugin-vue-components": "^0.27.2",
  "vite": "^5.3.2",
  "vite-ssg": "^0.23.7",
  "vue-tsc": "^2.0.22"
}
```

## 管理后台（Admin）

### dependencies

```json
{
  "@ant-design/colors": "^6.0.0",
  "@ant-design/icons-vue": "^6.1.0",
  "@iconify/iconify": "^2.2.1",
  "@vue/runtime-core": "^3.2.33",
  "@vue/shared": "^3.2.33",
  "@vueuse/core": "^8.3.0",
  "@vueuse/shared": "^8.3.0",
  "@wangeditor/editor": "^5.1.23",
  "@wangeditor/editor-for-vue": "^5.1.12",
  "@zxcvbn-ts/core": "^2.0.1",
  "ant-design-vue": "^3.2.15",
  "axios": "^0.26.1",
  "codemirror": "^5.65.3",
  "cron-parser": "^4.6.0",
  "cropperjs": "^1.5.12",
  "crypto-js": "^4.1.1",
  "dayjs": "^1.11.1",
  "echarts": "^5.3.2",
  "epic-designer": "0.8.3",
  "intro.js": "^5.1.0",
  "lodash-es": "^4.17.21",
  "mockjs": "^1.1.0",
  "nprogress": "^0.2.0",
  "path-to-regexp": "^6.2.0",
  "pinia": "2.0.12",
  "print-js": "^1.6.0",
  "qrcode": "^1.5.0",
  "qs": "^6.10.3",
  "resize-observer-polyfill": "^1.5.1",
  "showdown": "^2.1.0",
  "sortablejs": "^1.15.0",
  "tinymce": "^5.10.3",
  "vditor": "^3.8.13",
  "vue": "^3.3.4",
  "vue-i18n": "^9.1.9",
  "vue-json-pretty": "^2.0.6",
  "vue-router": "^4.0.16",
  "vue-types": "^4.1.1",
  "vxe-table": "^4.5.21",
  "xe-utils": "^3.5.23",
  "xlsx": "^0.18.5"
}
```

### devDependencies

```json
{
  "@commitlint/cli": "^16.2.3",
  "@commitlint/config-conventional": "^16.2.1",
  "@iconify/json": "^2.1.30",
  "@purge-icons/generated": "^0.8.1",
  "@rys-fe/vite-plugin-theme": "^0.8.6",
  "@types/codemirror": "^5.60.5",
  "@types/crypto-js": "^4.1.1",
  "@types/fs-extra": "^9.0.13",
  "@types/inquirer": "^8.2.1",
  "@types/intro.js": "^3.0.2",
  "@types/lodash-es": "^4.17.6",
  "@types/mockjs": "^1.0.6",
  "@types/node": "^17.0.25",
  "@types/nprogress": "^0.2.0",
  "@types/qrcode": "^1.4.2",
  "@types/qs": "^6.9.7",
  "@types/showdown": "^1.9.4",
  "@types/sortablejs": "^1.10.7",
  "@typescript-eslint/eslint-plugin": "^5.20.0",
  "@typescript-eslint/parser": "^5.20.0",
  "@vitejs/plugin-legacy": "^2.0.0",
  "@vitejs/plugin-vue": "^4.2.3",
  "@vitejs/plugin-vue-jsx": "^3.0.1",
  "@vue-macros/reactivity-transform": "0.3.6",
  "@vue/compiler-sfc": "^3.2.33",
  "@vue/test-utils": "^2.0.0-rc.21",
  "autoprefixer": "^10.4.4",
  "conventional-changelog-cli": "^2.2.2",
  "cross-env": "^7.0.3",
  "cz-git": "^1.3.9",
  "czg": "^1.3.9",
  "dotenv": "^16.0.0",
  "eslint": "^8.13.0",
  "eslint-config-prettier": "^8.5.0",
  "eslint-plugin-prettier": "^4.0.0",
  "eslint-plugin-vue": "^8.7.1",
  "esno": "^0.14.1",
  "fs-extra": "^10.1.0",
  "husky": "^7.0.4",
  "inquirer": "^8.2.2",
  "less": "^4.1.2",
  "lint-staged": "12.3.7",
  "npm-run-all": "^4.1.5",
  "picocolors": "^1.0.0",
  "postcss": "^8.4.12",
  "postcss-html": "^1.4.1",
  "postcss-less": "^6.0.0",
  "prettier": "^2.6.2",
  "rimraf": "^3.0.2",
  "rollup": "^2.70.2",
  "rollup-plugin-visualizer": "^5.6.0",
  "sass": "^1.56.1",
  "stylelint": "^14.7.1",
  "stylelint-config-prettier": "^9.0.3",
  "stylelint-config-recommended": "^7.0.0",
  "stylelint-config-recommended-vue": "^1.4.0",
  "stylelint-config-standard": "^25.0.0",
  "stylelint-order": "^5.0.0",
  "ts-node": "^10.7.0",
  "typescript": "^4.6.3",
  "vite": "4.3.3",
  "vite-plugin-compression": "^0.5.1",
  "vite-plugin-html": "^3.2.1",
  "vite-plugin-imagemin": "^0.6.1",
  "vite-plugin-mkcert": "^1.10.1",
  "vite-plugin-mock": "^2.9.6",
  "vite-plugin-purge-icons": "^0.8.2",
  "vite-plugin-pwa": "^0.12.3",
  "vite-plugin-style-import": "^2.0.0",
  "vite-plugin-svg-icons": "^2.0.1",
  "vite-plugin-vue-setup-extend": "^0.4.0",
  "vite-plugin-windicss": "^1.8.7",
  "vue-eslint-parser": "^8.3.0",
  "vue-tsc": "^0.33.9"
}
```

## 后端（Server）

### dependencies

```json
{
  "ali-oss": "^6.21.0",
  "alipay-sdk": "^4.13.0",
  "axios": "^1.9.0",
  "bcryptjs": "^2.4.3",
  "cors": "^2.8.5",
  "crypto-js": "^4.2.0",
  "express": "^4.17.1",
  "express-fileupload": "^1.4.3",
  "jsonwebtoken": "^8.5.1",
  "morgan": "^1.10.0",
  "mysql": "^2.18.1",
  "node-schedule": "^2.1.1",
  "nodemailer": "^6.9.13",
  "paypal-node-sdk": "^2.0.3",
  "stripe": "^18.5.0",
  "wechatpay-nodejs-sdk": "0.0.7",
  "ws": "^8.18.3"
}
```

### devDependencies

```json
{
  "dotenv": "8.2.0",
  "nodemon": "2.0.4"
}
```
