[中文](../../zh/download-installation/mac.md) | [English](../../en/download-installation/mac.md)

# 🍎 MacOS Installation

Due to Gatekeeper, browser‑downloaded `.dmg` files may be blocked. Use Terminal to download to avoid issues.

## 💻 Mac x86 (Intel)

```bash
curl -L -o AIStarter-5.2.0.dmg https://www.aistarter.cc/downloads/aistarter/AIStarter-5.2.0.dmg && open ./AIStarter-5.2.0.dmg
```

## 💻 Mac arm (Apple silicon)

```bash
curl -L -o AIStarter-5.2.0-arm64.dmg https://www.aistarter.cc/downloads/aistarter/AIStarter-5.2.0-arm64.dmg && open ./AIStarter-5.2.0-arm64.dmg
```

> You may replace the domain with `starter.top` (CN) or `starter.one` (Global).

## 🧩 If you already downloaded via browser

Remove quarantine attribute in Terminal:

```bash
xattr -dr com.apple.quarantine ~/Downloads/AIStarter-5.2.0.dmg
```

Then double‑click to install.

> After installation, move AIStarter into the Applications folder for long‑term use.
>
> Project root naming follows Windows rules: letters, digits, underscores only, preferably CamelCase (e.g., `MyAIProjects`).
>
> Important: Do not set the program install directory to the same path as the project root. Installing, updating, or uninstalling could otherwise delete your downloaded projects, models, and plugins.