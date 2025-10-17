[中文](../../zh/download-installation/mac.md) | [English](../../en/download-installation/mac.md)

# 🍎 MacOS 安装

由于 MacOS 的 Gatekeeper 安全机制，浏览器下载的 `.dmg` 文件可能被拦截。建议通过终端命令下载以避免问题。

## 💻 Mac x86 (Intel 芯片)

```bash
curl -L -o AIStarter-5.2.0.dmg https://www.aistarter.cc/downloads/aistarter/AIStarter-5.2.0.dmg && open ./AIStarter-5.2.0.dmg
```

## 💻 Mac arm (Apple 芯片 M 系)

```bash
curl -L -o AIStarter-5.2.0-arm64.dmg https://www.aistarter.cc/downloads/aistarter/AIStarter-5.2.0-arm64.dmg && open ./AIStarter-5.2.0-arm64.dmg
```

> 您也可将域名替换为 `starter.top`（国内）或 `starter.one`（国际）使用其他镜像源。

## 🧩 如果已通过浏览器下载 `.dmg`

在终端执行以下命令解除隔离属性：

```bash
xattr -dr com.apple.quarantine ~/Downloads/AIStarter-5.2.0.dmg
```

然后双击打开即可正常安装。

> 💡 安装后请将 AIStarter 拖入「应用程序」文件夹以便长期使用。
>
> ⚠️ 项目根目录命名要求同 Windows：仅限英文、数字、下划线，推荐驼峰命名（如 `MyAIProjects`）。
>
> ⚠️ 重要提醒：请勿将软件安装目录与项目根目录设置为同一路径！若两者位于同一文件夹，更新或卸载程序时可能导致已下载的 AI 项目、模型、插件等数据被一并删除。