[中文](../zh/2_download-installation.md) | [English](../en/2_download-installation.md)

# 📦 下载与安装

## 🖥️ 系统要求

| 平台       | 支持版本 |
|------------|----------|
| **Windows** | Windows 10 / 11（64位） |
| **MacOS**   | MacOS 14 (Sonoma) / 15 (Sequoia) |
| **Linux**   | 推荐 Ubuntu 22.04 LTS 或 Ubuntu 24.04 LTS（其他主流发行版兼容，但暂未全面测试） |

| 组件 | 最低配置 | 推荐配置 |
|------|----------|----------|
| **显卡 (GPU)** | 英伟达显卡（NVIDIA CUDA） | 3090（24GB）、4090（24GB） |
| **CPU** | 12600KF 及以上 | 多核高性能处理器 |
| **内存 (RAM)** | 16GB | 32GB 及以上（显存不足时可启用虚拟内存） |
| **固态硬盘 (SSD)** | SATA SSD | NVMe 协议 + 自带内存的固态盘（提升模型加载速度） |

> 📌 提示：即使没有 NVIDIA 显卡或驱动，您也可以在设置中手动选择 **CPU 模式** 运行，确保基础功能正常可用。

## 🖥️ 安装指南 

- [🪟 Windows 安装](/?docs=download-installation-windows&lang=zh)
- [🍎 MacOS 安装](/?docs=download-installation-mac&lang=zh)
- [🐧 Linux 安装](/?docs=download-installation-linux&lang=zh)

## 🌐 下载地址汇总

- 国内官网：
  - [https://www.qidong.ai](https://www.qidong.ai)
  - [https://www.starter.top](https://www.starter.top)
  - [https://www.aistarter.cc](https://www.aistarter.cc)

- 国际站：
  - [https://www.starter.one](https://www.starter.one)

## 🔄 更新与卸载

> ⚠️ 再次强调：**安装目录 ≠ 项目根目录**！AIStarter 的程序文件与您的 AI 项目数据应物理分离存储，这是保障数据安全的关键。

### 🔁 更新

重新下载并运行最新安装包，AIStarter 会自动覆盖旧版本程序，同时完整保留项目根目录中的所有模型、项目与配置。

### 🗑️ 卸载

- **Windows**：打开「控制面板」→「程序和功能」→ 找到 AIStarter → 点击“卸载”。
- **MacOS**：打开「应用程序」文件夹，将 AIStarter 拖入废纸篓即可。（如需彻底清理配置，可手动删除 `~/Library/Application Support/AIStarter`）
- **Linux**：
  - DEB/RPM：通过系统软件中心或包管理器卸载；
  - AppImage：直接删除 `.AppImage` 文件即可。

> 📌 注意：卸载操作不会触碰您的项目根目录（如 `~/MyAIProjects`），数据始终由您掌控。