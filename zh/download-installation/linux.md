# 🐧 Linux 安装

为方便操作，这里提供按包类型的一条命令下载并安装示例（RPM、DEB、AppImage）。以下命令为占位示例，后续将替换为真实链接与版本号。

## 📦 RPM 包（RedHat/Fedora 等）

```bash
curl -L -o AIStarter-5.2.0.x86_64.rpm https://www.aistarter.cc/downloads/aistarter/AIStarter-5.2.0.x86_64.rpm && sudo rpm -i ./AIStarter-5.2.0.x86_64.rpm
```

## 📦 DEB 包（Debian/Ubuntu 等）

```bash
curl -L -o AIStarter_5.2.0_amd64.deb https://www.aistarter.cc/downloads/aistarter/AIStarter_5.2.0_amd64.deb && sudo dpkg -i ./AIStarter_5.2.0_amd64.deb && sudo apt -f install
```

## 📦 AppImage（通用免安装）

```bash
curl -L -o AIStarter-5.2.0.AppImage https://www.aistarter.cc/downloads/aistarter/AIStarter-5.2.0.AppImage && chmod +x ./AIStarter-5.2.0.AppImage && ./AIStarter-5.2.0.AppImage
```

> 您也可将域名替换为 `starter.top`（国内）或 `starter.one`（国际）使用其他镜像源。

---

## 📦 说明与推荐

AIStarter 支持主流 Linux 发行版，推荐使用 **Ubuntu 22.04 LTS 或 24.04 LTS**。

正式版本会分别提供：

- **RPM 包**：适用于 RedHat、Fedora 等系统；
- **DEB 包**：适用于 Debian、Ubuntu 等系统；
- **AppImage 包**：通用免安装包，适用于几乎所有 Linux 发行版。

> 后续会将上述命令替换为对应的 `rpm`/`deb`/`AppImage` 下载与安装示例。

---

## ⚠️ 注意事项

- 项目根目录命名规范：请使用纯英文路径，目录名仅允许大小写字母、数字和下划线，推荐驼峰命名（如 `/home/user/MyAIProjects`），禁止中文、空格及特殊字符。
- 重要提醒：请勿将软件安装目录与项目根目录设置为同一路径！若两者位于同一文件夹，更新或卸载程序时可能导致已下载的 AI 项目、模型、插件等数据被一并删除。