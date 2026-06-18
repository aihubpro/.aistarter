# Admin WebUI

基于 **Vue 3 + Vite + TypeScript + Ant Design Vue** 构建的后台管理前端。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3 + TypeScript |
| 构建 | Vite 4 |
| UI | Ant Design Vue 3 |
| 状态管理 | Pinia |
| 路由 | Vue Router 4 |
| HTTP | Axios |
| 图表 | ECharts 5 |
| 表格 | VXE Table |
| 国际化 | Vue I18n |

## 环境要求

- **Node.js** >= 20.x
- **pnpm** >= 9.8.0（推荐）

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器（默认端口 3100）
pnpm run dev
```

启动后访问 `http://localhost:3100`

## 环境变量

项目通过 `.env` 文件配置运行参数，主要变量说明：

| 变量 | 说明 | 示例 |
|------|------|------|
| `VITE_PORT` | 开发服务器端口 | `3100` |
| `VITE_GLOB_API_URL` | 后端接口地址 | `http://localhost:7000` |
| `VITE_GLOB_API_URL_PREFIX` | 接口前缀 | 空或 `/api` |
| `VITE_GLOB_API_TIMEOUT` | 接口超时时间(ms) | `30000` |
| `VITE_USE_MOCK` | 是否启用 Mock | `true` / `false` |
| `VITE_DROP_CONSOLE` | 构建是否移除 console | `true` / `false` |

开发环境配置文件：`.env.development`
生产环境配置文件：`.env.production`

## 命令说明

| 命令 | 说明 |
|------|------|
| `pnpm run dev` | 启动开发服务器 |
| `pnpm build` | 生产环境构建 |
| `pnpm build:test` | 测试环境构建 |
| `pnpm preview` | 预览生产构建产物 |
| `pnpm run lint:eslint` | ESLint 代码检查并修复 |
| `pnpm run type:check` | TypeScript 类型检查 |

## 项目结构

```
src/
├── api/              # 接口请求
│   ├── common/       # 公共接口（文件上传、验证码等）
│   ├── demo/         # 演示模块接口
│   ├── sys/          # 系统接口（登录、用户、菜单）
│   └── ...
├── assets/           # 静态资源（图片、SVG、图标）
├── components/       # 公共组件
│   ├── Form/         # 表单组件
│   ├── Table/        # 表格组件
│   ├── Modal/        # 弹窗组件
│   ├── Drawer/       # 抽屉组件
│   └── ...
├── design/           # 全局样式
├── enums/            # 枚举常量
├── hooks/            # 组合式函数
├── layouts/          # 布局组件
├── locales/          # 国际化语言包
├── logics/           # 业务逻辑
├── router/           # 路由配置
├── settings/         # 项目设置
├── store/            # Pinia 状态管理
├── utils/            # 工具函数
├── views/            # 页面视图
│   ├── demo/         # 演示页面
│   ├── dashboard/    # 仪表盘
│   ├── login/        # 登录页面
│   ├── modules/      # 系统管理模块
│   └── ...
├── App.vue           # 根组件
└── main.ts           # 入口文件
```

## Nginx 部署示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/dist;
    index index.html;

    # 前端路由 history 模式
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 代理后端接口
    location /api {
        proxy_pass http://localhost:7000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
