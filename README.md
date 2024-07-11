#  脚本说明

##  脚本概述

| 方法 | 描述 | 必要性 |
|------|------|--------|
| `init: async function(){}` | 初始化方法，软件进入加载脚本时会调用一次 | 必要 |
| `install: async function(){}` | 安装程序方法，点击安装按钮会调用此方法 | 必要 |
| `download: async function(){}` | 下载实现，点击下载时调用，通常调用软件自带的 BT 下载方法 | 必要 |
| `run: async function(){}` | 运行软件方法，点击运行按钮调用 | 必要 |
| `exit: async function(){}` | 退出项目方法，点击项目退出时调用 | 必要 |
| `onAppExit: async function(){}` | 软件退出后会调用此方法 | 可选 |
| `isRunning: async function(){}` | 返回 AI 项目是否正在运行中，软件用此判断项目是否真正运行 | 必要 |
| `onSettingChange: async function(settingKey, settingValue, settingClass){}` | 当软件设置改变时回调，传入三个参数对应 `addSetting` 里配置的值 | 可选 |
| `addSetting: async function(){}` | 给项目添加设置选项，返回设置配置相关的结果 | 可选 |

### `onSettingChange` 参数说明
- `settingKey`: 设置选项的键值
- `settingValue`: 设置选项的值
- `settingClass`: 配置所属的类别

### `addSetting` 返回参数（JSON 对象）
- `className`: 设置选项所属的类名
- `title`: 设置的标题
- `configList`: 配置的列表（JSON 对象数组）
  - `key`: 设置选项的键值
  - `label`: 设置标题
  - `desc`: 设置的详细描述（可选）
  - `type`: 设置的类型，支持（switch: 开关、dir: 目录选择、select: 下拉菜单）
  - `default`: 默认值，未设置时的初始值

## 8.2.2 脚本 API

| API | 描述 |
|-----|------|
| `async zn.markPluginInstalled(pluginName)` | 标记项目已经安装成功 |
| `async zn.markPluginDownloaded(pluginName)` | 标记项目已经下载并解压成功 |
| `async zn.pluginLog(log)` | 安装时显示安装日志（全屏菊花带文本） |
| `async zn.isPluginInstalled(pluginName)` | 判断项目是否已经安装成功 |
| `async zn.isProjectDownloaded(pluginName)` | 判断项目是否已经下载解压完成 |
| `async zn.addDirToClass(className, dirInfo)` | 在软件的目录选项卡添加跳转目录 |
| `async zn.execute(command, args, options = {}, callbacks = {})` | 创建子进程执行命令 |
| `async zn.killProcessTree(pid)` | 杀掉进程 |
| `async zn.showLoading(isShow, text, autoHideTime)` | 在软件中显示全屏 Loading |
| `async zn.getGupInfo()` | 获取系统 GPU 信息 |
| `async zn.getNvidiaSmi()` | 获取系统 nvidia-smi 命令的信息 |
| `async zn.getSettingValue(keyName, keyClass)` | 获取软件设置值 |
| `async zn.setSettingValue(keyName, keyVal, keyClass)` | 设置软件配置的值 |
| `async zn.showMessage(text)` | 在软件中弹出消息提示 |
| `async zn.terminalMessage(text)` | 在软件中的终端打印文本 |
| `async zn.downloadProjectTorrent(pluginName)` | BT 下载 AI 项目 |
| `async zn.changeBtnState(pluginName, state)` | 改变项目按钮的状态 |

### API 参数说明

- `pluginName`: 脚本自身的名称，通常传 `this.pluginName`
- `dirInfo`: 目录信息（JSON 结构）
  - `icon`: 目录的图标
  - `viewName`: 目录显示的名称
  - `viewPath`: 显示的路径
  - `dirPath`: 目录实际跳转的路径
- `command`: 执行命令
- `args`: 命令参数数组
- `options`: 包含 `cwd`（执行目录）和 `env`（执行的环境变量）
- `callbacks`: 回调，包含 `stdout(std)`、`stderr(err)`、`created(childProcess)`、`close(code)`
- `pid`: 进程 ID
- `isShow`: 是否显示（true 为显示）
- `text`: 显示的文本
- `autoHideTime`: 自动隐藏的时间（毫秒，可选）
- `keyName`: 设置的键值
- `keyClass`: 设置的类别
- `keyVal`: 配置的值
- `state`: 按钮状态，包含 `run`（启动按钮状态）和 `exit`（结束按钮状态）
