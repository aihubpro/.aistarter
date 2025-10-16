# 🐧 Linux Installation

For convenience, here are one‑line commands by package type (RPM, DEB, AppImage). These commands are placeholder examples and will be replaced with real links and versions later.

## 📦 RPM (RedHat/Fedora)

```bash
curl -L -o AIStarter-5.2.0.x86_64.rpm https://www.aistarter.cc/downloads/aistarter/AIStarter-5.2.0.x86_64.rpm && sudo rpm -i ./AIStarter-5.2.0.x86_64.rpm
```

## 📦 DEB (Debian/Ubuntu)

```bash
curl -L -o AIStarter_5.2.0_amd64.deb https://www.aistarter.cc/downloads/aistarter/AIStarter_5.2.0_amd64.deb && sudo dpkg -i ./AIStarter_5.2.0_amd64.deb && sudo apt -f install
```

## 📦 AppImage (Universal portable)

```bash
curl -L -o AIStarter-5.2.0.AppImage https://www.aistarter.cc/downloads/aistarter/AIStarter-5.2.0.AppImage && chmod +x ./AIStarter-5.2.0.AppImage && ./AIStarter-5.2.0.AppImage
```

> You can also use `starter.top` (China) or `starter.one` (Global) as mirror domains.

---

## 📦 Notes & Recommendation

AIStarter supports mainstream Linux distributions. We recommend **Ubuntu 22.04 LTS or 24.04 LTS**.

We will ship **RPM**, **DEB**, and **AppImage** packages.

> We will update the commands above with final `rpm`/`deb`/`AppImage` URLs and versions.

---

## ⚠️ Important

- Project root naming: use pure English paths. Only letters, digits, and underscores are allowed. CamelCase recommended (e.g., `/home/user/MyAIProjects`). Avoid Chinese, spaces, and special characters.
- Do not set the program install directory to the same path as the project root. Installing, updating, or uninstalling could otherwise delete your downloaded projects, models, and plugins.