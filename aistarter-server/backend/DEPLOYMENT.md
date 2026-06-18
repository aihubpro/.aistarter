# AIStarter Server 开源版启动配置指南

> 本文档供 **开源版使用者** 参考，说明从克隆代码到成功运行需要修改和配置的文件。请按顺序逐项完成。

---

## 前提条件

| 依赖 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | >= 14.x | 运行环境 |
| MySQL | >= 8.0 | 数据库 |
| npm / yarn / pnpm | 任一 | 包管理器 |

---

## 第一步：创建 `.env` 环境变量文件

项目根目录下 **没有** `.env` 文件（已被 `.gitignore` 排除），你需要手动创建。

在项目根目录创建 `.env` 文件，填入以下内容并替换为你自己的值：

```bash
# ============ 密钥（必须修改） ============
# JWT 签名密钥：随机 64 位字符串，可用 `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` 生成
JWT_SECRET_KEY=替换为你自己生成的随机字符串

# AES 加密密钥：32 位十六进制字符串，用于加密配置文件
AES_SECRET_KEY=替换为你自己生成的32位十六进制字符串

# ============ 数据库（根据实际情况修改） ============
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=你的数据库密码
DB_NAME=aistarter

# ============ 服务器配置（根据实际情况修改） ============
# 父级服务器域名（如果是主服务器则填自己的域名）
PARENT_DOMAIN=http://your-domain.com:2095
# 当前服务器域名
SERVER_DOMAIN=your-domain.com:7000
# 是否为父级服务器（true=主服务器 / false=子服务器）
IS_PARENT=true

# ============ 邮箱 SMTP（根据实际情况修改） ============
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=你的发件邮箱@qq.com
SMTP_PASS=你的邮箱SMTP授权码
```

---

## 第二步：生成 RSA 公私钥对（License 签名用）

项目使用 RSA 密钥对来签名和验证 License。需要你在项目根目录的 `license/` 目录下自行生成。

### 2.1 创建 `license/` 目录

```bash
mkdir license
```

### 2.2 生成 RSA 私钥

```bash
openssl genrsa -out license/private_key.pem 2048
```

### 2.3 提取公钥，写入 `.env`

```bash
openssl rsa -in license/private_key.pem -pubout
```

将输出的公钥内容（含 `-----BEGIN PUBLIC KEY-----` 和 `-----END PUBLIC KEY-----`）写入 `.env`：

```bash
PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
你的公钥内容...
-----END PUBLIC KEY-----"
```

> 注意：私钥文件 `license/private_key.pem` **不要提交到公开仓库**，已在 `.gitignore` 中排除。

### 2.4 首次启动后生成 License

项目首次启动后，通过管理后台的"系统设置"页面，使用上面生成的私钥来创建 License 文件。具体操作为：

1. 启动项目（见第七步）
2. 访问管理后台 `http://localhost:7000/admin`
3. 进入 系统管理 -> 系统设置 -> License 管理
4. 在页面上用私钥生成 License 文件

---

## 第三步：导入数据库

### 3.1 创建数据库

```sql
CREATE DATABASE IF NOT EXISTS aistarter DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

### 3.2 导入表结构

```bash
mysql -u root -p aistarter < database/aistarter.sql
```

> SQL 文件仅包含表结构和默认管理员账号，无用户数据。
> 初始账号: admin / admin123，详见 `database/初始账号信息.txt`

### 3.3 确认 `.env` 中的数据库配置与 MySQL 一致

确保 `.env` 中的 `DB_HOST`、`DB_USER`、`DB_PASSWORD`、`DB_NAME` 与你的 MySQL 配置匹配。

---

## 第四步：安装依赖

```bash
npm install
# 或
yarn
# 或
pnpm install
```

---

## 第五步：构建管理后台前端

管理后台前端（`admin/` 目录）需要单独构建。详见 `admin/__ADMIN_BUILD_INSTRUCTIONS__`。

1. 从管理后台前端源码仓库克隆代码
2. 安装依赖并构建
3. 将构建产物复制到 `admin/` 目录

> 构建产物包含: `index.html`, `_app.config.js`, `assets/`, `resource/`, `icons/`

---

## 第六步：启动项目

```bash
# 开发模式（带热重载）
npm run dev

# 生产模式
npm start
```

启动成功后终端会显示：
```
[database] successful connection
http://localhost:7000
```

---

## 第七步：访问各端

| 地址 | 说明 |
|------|------|
| `http://localhost:7000/admin` | 管理后台（管理用户、订单、支付配置等） |
| `http://localhost:7000/` | 前端静态页面 |

---

## 第八步：管理后台初始配置

启动后需要通过管理后台配置以下模块（均在管理后台的"系统设置"菜单下）：

### 7.1 License 配置
- 进入"系统设置 -> 共创者配置"
- 使用第二步生成的私钥创建 License

### 7.2 支付配置（按需配置）
- **微信支付**：需配置 appId、商户号(mchId)、APIv3 证书和密钥
- **支付宝**：需配置 appId、应用私钥、支付宝公钥
- **PayPal**：需配置 clientId 和 secret
- **Stripe**：需配置 publishableKey 和 secretKey

> 如果不使用支付功能，可以在后台关闭对应支付渠道。

### 7.3 OSS 存储配置（按需配置）
- **阿里云 OSS**：需配置 accessKeyId、accessKeySecret、region、bucket
- **123 云盘**：需配置 KeyId、LinkExp、CloneUid

> 如果不需要云存储下载，可以忽略此项。

### 7.4 平台价格配置
- "系统设置 -> V2平台配置"：设置会员价格、平台手续费比例等

---

## 需要修改的文件速查表

| # | 文件 | 操作 | 说明 |
|---|------|------|------|
| 1 | 项目根目录 `.env` | **新建** | 环境变量，参考第一步模板 |
| 2 | `license/private_key.pem` | **新建** | RSA 私钥，参考第二步 |
| 3 | `license/license.json` | **启动后后台生成** | License 文件 |
| 4 | `configs/*.json` | **启动后后台生成** | 各配置文件，无需手动创建 |

---

## 常见问题

### Q: 启动时报 `[database] connection refused`
A: MySQL 未启动或 `.env` 中数据库配置不正确。检查 MySQL 服务和连接参数。

### Q: 管理后台登录账号密码是什么？
A: 首次启动后，`users` 表为空。需要通过数据库手动插入一个管理员用户，或者使用项目提供的注册接口注册后，在数据库中手动将 `id_role` 改为 `1`（管理员）。

### Q: 支付功能无法使用？
A: 默认配置文件中支付渠道的密钥均为空。需要在管理后台配置对应支付渠道的真实密钥后才能使用。如果不需要支付功能，可以忽略。

### Q: 邮件发送失败？
A: 需要配置 `.env` 中的 SMTP 参数。如使用 QQ 邮箱，`SMTP_PASS` 不是 QQ 密码，而是 QQ 邮箱设置中生成的"授权码"。

### Q: 项目无法跨域访问？
A: 项目默认端口为 `7000`，CORS 已在代码中配置为允许所有来源。如需限制，可修改 `src/index.js` 中的 `corsOptions`。

### Q: WebSocket 连接失败？
A: 确保没有防火墙阻止 `7000` 端口。WebSocket 与 HTTP 共用同一端口，不需要额外配置。
