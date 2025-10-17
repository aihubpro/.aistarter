[中文](../zh/3_usage-guide.md) | [English](../en/3_usage-guide.md)

# 🚀 User Guide

## ⚙️ Settings: Enable Developer Options

Before adding or sharing projects, enable Developer Options:

1. Launch AIStarter
2. Click Settings (gear icon) at the bottom left
3. Toggle on “Developer Options”

> Tip: Click any top navigation item (e.g., Market → Home) to refresh and apply settings.

## 🔑 Sign Up & Sign In

- Click “Not logged in” → “Register”
- Enter email and password
- Sign in after registration
- Logged‑in users get more features: saved downloads, likes, favorites, chat, DM, and creator center

## 📥 Project Download Modes

Choose based on your network conditions:

### 1) Standard (BT torrent)
- Default; relies on IPv6
- Slower when seeders are few or network is poor

### 2) High‑speed (Recommended)
- Official CDN acceleration
- Prefer this mode

### 3) Offline
- Click “Offline Download” on the marketplace page to get third‑party cloud links
- Download as `.zip` or `.tar.gz`

> Unified recommendations:
> - If slow or stuck, exit via right‑click, reopen, then choose High‑speed or Offline
> - Operate inside the app; do not manually extract archives (except multi‑part)
> - For multi‑part archives, download all parts, merge to a single archive, then import via the app
> - Do not close AIStarter during import/extract; otherwise the project may break
> - You can minimize the app, but do not interrupt `unzip`
> - If it fails, delete the project and re‑import

## ➕ Add & Test Local Projects

### Preparation
- The integrated package must run independently
- Entry files are usually `.py`, `.bat`, or `.exe`
- Prefer translating and consolidating startup logic into `main.js`; keep original files as fallback, but avoid relying on them
- After integration, you can update scripts independently. When publishing, check “No repack” if package contents stay the same

### Steps
1. Ensure Developer Options is on
2. Click “+” on the top right of the Home page → “Add Project”
3. Fill in project info (directory, version, title, description)
4. Choose Simple or Professional mode
5. Configure the following:

#### a) Run command
- Examples:
  - `.\\run.bat`
  - `.\\venv\\python.exe -u main.py`
- Add `-u` for Python/BAT so logs flush in real time

#### b) Success keywords
- Examples:
  - `Starting`
  - `http://127.0.0.1:7860`
- If unavailable, use a countdown in milliseconds (default 3000)

#### c) Callable directories (recommended)
- Add common directories for quick open:
  - Root: project root
  - Models: `models/`
  - Input: `input/`
  - Output: `output/`

#### d) Startup modes (advanced)
- Configure via dropdown settings:
  - CPU/GPU switch: inject `--cpu` or `--gpu`
  - VRAM optimization: e.g., `--lowvram`
  - Custom args: allow extra CLI parameters
- Implement via `addSetting` and `onSettingChange` in `main.js`

#### e) Other advanced options (Professional)
- One‑click update: detect remote versions and auto‑download
- Launch modes: “backend only” or “open frontend only”
- Auto open browser when `http://127.0.0.1:xxxx` appears
- Custom loading hint while spinning (e.g., “Loading models…”) 

6. Click “Debug Run”.

### Debug & Validate
- Edit `main.js` using the built‑in editor
- Click “Debug Run”
- Observe terminal logs and ensure success keywords are detected
- If it keeps spinning, try switching from `stdout` to `stderr`
- After success, click “Start” on Home to run a final test
- If it starts successfully, configuration is correct

## 🎨 Creators: Publish & Share

### Process
1. After debugging passes, click “Publish Project”
2. The app compresses the project to the `Share` folder
3. When packaging finishes, a prompt opens the `Share` directory
4. Upload the archive to cloud storage with public access (e.g., Baidu Netdisk, Quark)
5. Copy the direct download link

> Packaging generates a `.lock` file as the packaged marker. Do not delete it.

### Submit
1. Click “Confirm” to go to the publish page
2. Upload a cover image
3. Fill in the description
4. Set “free or paid”
5. Paste the direct link (required)
6. Submit and wait for review
7. After approval, the project appears in the marketplace

### Update strategy
- Script‑only updates (no package changes): check “No repack” and submit
- Package changes: click “Repack” to generate a new archive and publish

### Tips
- Clear title, e.g., “ComfyUI Personal Integration”
- Detailed description: features, hardware requirements, scenarios
- Pricing: allow users to support creators
- Consolidate startup logic into `main.js` for future updates
- Flexible editing for quick iteration without re‑uploading large files

### Share
- After approval, open the project page and click “Share” to get a browser‑openable link