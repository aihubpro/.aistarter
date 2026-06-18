# AIStarter Server

AIStarter 后台服务端，为 AIStarter 桌面端提供用户认证、项目管理、支付集成、市场评论等 API 接口，同时提供基于 Web 的管理后台。

## 技术栈

| 类别 | 技术 |
|------|------|
| 运行时 | Node.js (>= 14) |
| 框架 | Express.js |
| 数据库 | MySQL (>= 8.0) |
| 实时通信 | WebSocket (ws) |
| 支付集成 | 支付宝 / 微信支付 / PayPal / Stripe |
| 定时任务 | node-schedule |
| 认证 | JWT (JSON Web Token) |
| 加密 | bcryptjs / AES-256-CBC |

## 目录结构

```
├── src/                    # 后端源码
│   ├── admin/              # 管理后台 API (controllers + routes)
│   ├── controllers/        # 前端用户 API 控制器
│   ├── datas/              # 默认配置数据
│   ├── helpers/            # 工具类（支付/邮件/License/存储）
│   ├── middleware/          # 中间件（JWT认证/权限/服务器状态）
│   ├── routes/             # 前端用户路由
│   ├── utils/              # 通用工具函数
│   ├── websocket/          # WebSocket 聊天服务
│   ├── config.js           # 配置文件（需替换占位符）
│   ├── database.js         # 数据库连接配置（需替换占位符）
│   ├── index.js            # 入口文件
│   └── scheduler.js        # 定时任务（需替换占位符）
├── database/               # 数据库脚本
│   ├── aistarter.sql       # 完整表结构 + 种子数据
│   └── 初始账号信息.txt     # 默认管理员账号说明
├── license/                # License 相关（需用户自行生成）
├── admin/                # 管理后台前端（需用户自行构建）
├── www/                    # 静态前端页面
├── DEPLOYMENT.md           # 部署配置详细指南
├── OPENSOURCE_SETUP.md     # 开源前清理记录与占位符速查
└── README.md               # 本文件
```

## 快速开始

**详细步骤请阅读 [DEPLOYMENT.md](./DEPLOYMENT.md)**

### 1. 搜索并替换所有占位符

```bash
grep -r "_PLACEHOLDER_" src/ license/ database/
```

源码中所有密钥、域名、数据库连接等敏感信息已替换为 `__XXX_PLACEHOLDER__`，必须替换为你自己的值后才能运行。

### 2. 配置环境变量

在项目根目录创建 `.env` 文件（参考 `DEPLOYMENT.md` 中的模板）。

### 3. 生成 RSA 密钥对

```bash
mkdir -p license
openssl genrsa -out license/private_key.pem 2048
openssl rsa -in license/private_key.pem -pubout
```

### 4. 导入数据库

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS aistarter DEFAULT CHARACTER SET utf8mb4"
mysql -u root -p aistarter < database/aistarter.sql
```

### 5. 构建管理后台前端

管理后台前端需要单独构建，详见 `admin/__ADMIN_BUILD_INSTRUCTIONS__`。

### 6. 安装依赖并启动

```bash
npm install
npm start
```

### 7. 登录管理后台

| 项目 | 值 |
|------|----|
| 地址 | `http://localhost:7000/admin` |
| 用户名 | `admin` |
| 密码 | `admin123` |

> **登录后请立即修改密码！**

## 功能模块

| 模块 | 说明 |
|------|------|
| 用户管理 | 注册/登录/JWT认证/个人信息/角色权限 |
| 项目管理 | AI项目与资源的上传/审核/搜索/下载 |
| 市场系统 | 项目浏览/收藏/点赞/评论/举报 |
| 支付集成 | 支付宝/微信支付/PayPal/Stripe 四合一支付 |
| 会员订阅 | 年度/永久/共创模式，优惠券系统 |
| 企业认证 | 企业入驻/成员管理/审核流程 |
| 共创者系统 | 子公司 License 管理/服务器状态同步 |
| 聊天室 | WebSocket 实时消息 |
| 收入统计 | 月度收入审计/提现申请 |
| OSS 存储 | 阿里云 OSS / 123 云盘下载集成 |
| 定时任务 | 月度统计/会员过期清理/优惠券清理 |

## 占位符速查

部署前请用 `_PLACEHOLDER_` 搜索以下位置并替换：

| 文件 | 占位符数量 |
|------|:--:|
| `src/config.js` | 5 |
| `src/helpers/storage.js` | 1 |
| `src/helpers/functions.js` | 4 |
| `src/database.js` | 4 |
| `src/datas/pay_default_cfg_stripe.data.js` | 2 |
| `src/scheduler.js` | 3 |
| `database/aistarter.sql` | 1 |
| `license/` | 2 (文件替换) |
| `admin/` | 整个目录 (需构建) |

## 文档

| 文档 | 面向对象 | 内容 |
|------|---------|------|
| [DEPLOYMENT.md](./DEPLOYMENT.md) | 使用者 | 从零部署到运行的完整步骤 |
| [OPENSOURCE_SETUP.md](./OPENSOURCE_SETUP.md) | 维护者 | 已完成的清理清单与占位符说明 |
| [database/初始账号信息.txt](./database/初始账号信息.txt) | 使用者 | 默认管理员账号与密码 |

## License

MIT
