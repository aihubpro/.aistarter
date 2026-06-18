# Third-Party Notices（第三方组件声明）

本文件列出了 AIStarter（Legacy Edition）项目所引用的核心第三方开源组件及其对应的开源许可证。我们对这些优秀开源项目的作者与维护者表示感谢。

本清单用于开源合规披露与参考，具体依赖版本以各子目录下的 `package.json` 为准。不同版本的许可证可能存在变化；若本文件与第三方组件实际许可证不一致，以第三方组件仓库/发布版本中附带的许可证文件为准。

## 桌面客户端组件（Desktop Client）

- **Electron**
  - License: MIT
  - Source: https://github.com/electron/electron
- **Vue.js**
  - License: MIT
  - Source: https://github.com/vuejs/core
- **Element Plus**
  - License: MIT
  - Source: https://github.com/element-plus/element-plus
- **Vite**
  - License: MIT
  - Source: https://github.com/vitejs/vite
- **Pinia**
  - License: MIT
  - Source: https://github.com/vuejs/pinia

## 管理后台组件（Admin Frontend）

- **Ant Design Vue**
  - License: MIT
  - Source: https://github.com/vueComponent/ant-design-vue
- **ECharts**
  - License: Apache-2.0
  - Source: https://github.com/apache/echarts
- **WangEditor**
  - License: MIT
  - Source: https://github.com/wangeditor-team/wangEditor

## 服务端组件（Backend Server）

- **Express**
  - License: MIT
  - Source: https://github.com/expressjs/express
- **MySQL（Node Driver）**
  - License: MIT
  - Source: https://github.com/mysqljs/mysql
- **Ali-OSS**
  - License: MIT
  - Source: https://github.com/ali-sdk/ali-oss

---

## 合规与法律免责声明（Legal Disclaimer）

1. 非法律意见：本文件提供的第三方许可证信息与链接仅供参考，不构成任何形式的法律意见或授权保证。
2. 以上游为准：若本文件与第三方组件实际许可证存在不一致，以第三方组件仓库/发布版本中附带的许可证文件为准。
3. 完整依赖清单：第三方依赖的完整列表以各子目录 `package.json` 及 lock 文件（如 `package-lock.json` / `pnpm-lock.yaml` / `yarn.lock`）为准。第三方依赖的源码与许可证文件将在使用者执行包管理工具（如 `npm install`）时自动获取并存储于本地 `node_modules` 目录中。

如涉及商业分发、私有化部署或对外提供服务，请在发布前自行进行许可证合规核对与风险评估。
