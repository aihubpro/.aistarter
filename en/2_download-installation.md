[中文](../zh/2_download-installation.md) | [English](../en/2_download-installation.md)

# 📦 Download & Installation

## 🖥️ System Requirements

| Platform | Supported Versions |
|----------|--------------------|
| **Windows** | Windows 10 / 11 (64‑bit) |
| **MacOS**   | MacOS 14 (Sonoma) / 15 (Sequoia) |
| **Linux**   | Recommended Ubuntu 22.04 LTS or 24.04 LTS (others compatible but not fully tested) |

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **GPU** | NVIDIA CUDA‑capable GPU | 3090 (24GB), 4090 (24GB) |
| **CPU** | 12600KF or above | Multi‑core high‑performance CPU |
| **RAM** | 16GB | 32GB+ (enable swap when VRAM is low) |
| **SSD** | SATA SSD | NVMe with onboard cache (faster model loading) |

> Even without an NVIDIA GPU/driver you can switch to **CPU mode** in settings to use core features.

## 🖥️ Installation Guide

- [🪟 Windows Installation](/?docs=download-installation-windows&lang=en)
- [🍎 MacOS Installation](/?docs=download-installation-mac&lang=en)
- [🐧 Linux Installation](/?docs=download-installation-linux&lang=en)

## 🌐 Download Mirrors

- Mainland China:
  - https://www.qidong.ai
  - https://www.starter.top
  - https://www.aistarter.cc

- Global:
  - https://www.starter.one

## 🔄 Update & Uninstall

> Reminder: **Install directory ≠ Project root**. Keep program files separate from your AI project data to protect your assets.

### Update

Download and run the latest installer. It overwrites program files while preserving everything in your project root (models, projects, configs).

### Uninstall

- **Windows**: Control Panel → Programs and Features → AIStarter → Uninstall.
- **MacOS**: In Applications, move AIStarter to Trash. To fully clean configs, remove `~/Library/Application Support/AIStarter`.
- **Linux**:
  - DEB/RPM: Uninstall via Software Center or package manager.
  - AppImage: Delete the `.AppImage` file.

> Uninstall never touches your project root (e.g., `~/MyAIProjects`). Your data stays under your control.