// Modules to control application life and create native browser window
const { app, shell, BrowserWindow, ipcMain, Menu, globalShortcut } = require('electron')
const path = require('node:path')

const { getConfig,setConfig } = require('./config.js');

const {initPlugin} = require('./plugin.js');
const {initUpdater} = require('./updater.js');
const {initTorrent} = require('./torrent.js');

require('./dir.js');
require('./zip.js');
require('./constants.js')
require('./project.js')
require('./resources.js')

// const path = require('node:path')

// 设置自定义协议为默认处理程序（例如 myapp）
app.setAsDefaultProtocolClient('aistarter');

// 隐藏头顶菜单
Menu.setApplicationMenu(null);

// 添加IPC处理函数
const { exec } = require('child_process');
const fs = require('fs');

// 启动安装程序
ipcMain.handle('launch-installer', async (event, installerPath) => {
  try {
    console.log('启动安装程序:', installerPath);
    
    // 检查文件是否存在
    if (!fs.existsSync(installerPath)) {
      throw new Error('安装文件不存在');
    }
    
    // 根据平台启动安装程序
    if (process.platform === 'win32') {
      // Windows: 直接执行exe文件
      exec(`"${installerPath}"`, (error) => {
        if (error) {
          console.error('启动Windows安装程序失败:', error);
        } else {
          console.log('Windows安装程序启动成功');
        }
      });
    } else if (process.platform === 'darwin') {
      // macOS: 打开dmg文件
      exec(`open "${installerPath}"`, (error) => {
        if (error) {
          console.error('启动macOS安装程序失败:', error);
        } else {
          console.log('macOS安装程序启动成功');
        }
      });
    } else {
      // Linux: 执行AppImage或其他安装包
      if (installerPath.endsWith('.AppImage')) {
        // 确保AppImage有执行权限
        exec(`chmod +x "${installerPath}" && "${installerPath}"`, (error) => {
          if (error) {
            console.error('启动Linux AppImage失败:', error);
          } else {
            console.log('Linux AppImage启动成功');
          }
        });
      } else if (installerPath.endsWith('.deb')) {
        // DEB包需要系统包管理器安装
        exec(`xdg-open "${installerPath}"`, (error) => {
          if (error) {
            console.error('打开DEB包失败:', error);
          } else {
            console.log('DEB包已打开');
          }
        });
      } else if (installerPath.endsWith('.rpm')) {
        // RPM包需要系统包管理器安装
        exec(`xdg-open "${installerPath}"`, (error) => {
          if (error) {
            console.error('打开RPM包失败:', error);
          } else {
            console.log('RPM包已打开');
          }
        });
      } else {
        // 其他文件类型，尝试用默认程序打开
        exec(`xdg-open "${installerPath}"`, (error) => {
          if (error) {
            console.error('启动Linux安装程序失败:', error);
          } else {
            console.log('Linux安装程序启动成功');
          }
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error('启动安装程序失败:', error);
    throw error;
  }
});

// 显示文件在文件夹中的位置
ipcMain.handle('show-item-in-folder', async (event, filePath) => {
  try {
    console.log('显示文件位置:', filePath);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error('文件不存在');
    }
    
    // 使用Electron的shell模块显示文件
    shell.showItemInFolder(filePath);
    
    return true;
  } catch (error) {
    console.error('显示文件位置失败:', error);
    throw error;
  }
});

// 退出应用
ipcMain.on('window-quit', () => {
  console.log('收到退出应用请求');
  app.quit();
});

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 750,
    minHeight:680,
    minWidth:1080,
    // titleBarStyle: 'hidden',
    // titleBarOverlay: {
    //   color: '#ffffff',
    //   symbolColor: '#74b1be'
    // },
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      webSecurity:false,//允许跨域
      contextIsolation: false
    },
    show: false, // newBrowserWindow创建后先隐藏
  })

  // 加载 index.html
  if(app.isPackaged){
    mainWindow.loadFile('app/index.html');
  }else{
    mainWindow.loadURL('http://localhost:5173/');
    // 打开开发工具
    mainWindow.webContents.openDevTools()
  }

  //test code
  // mainWindow.webContents.openDevTools()

  mainWindow.setMenu(null)

  //初始化插件
  initPlugin(mainWindow);

  //打开的时候传入参数
  const commandLine = process.argv;
  const aistarterUrl = commandLine.find(arg => arg.startsWith('aistarter://'));

  //优化速度重点在这里
  mainWindow.on('ready-to-show', () => {
    // 初始化更新插件
    initUpdater(mainWindow);
    //初始化torrent
    initTorrent(mainWindow);
    
    mainWindow.show() // 初始化后再显示

    //初始化托盘
    const tray = require('./tray.js')
    tray.init(mainWindow)

    mainWindow.on('blur', onWindowBlur)
    mainWindow.on('focus', onWindowFocus)
  
    mainWindow.on('hide', onWindowBlur)
    mainWindow.on('show', onWindowFocus)

    mainWindow.on('close', e => {
      const tray = require('./tray.js')
      if (!tray.hasTray()) {
        app.quit()
        return
      }

      if (!app.isQuitting) {
        
        mainWindow.hide()
        //苹果端隐藏dock
        if (process.platform == 'darwin') {
          app.dock.hide();
        }

        e.preventDefault()
        
      }
    })

    if (aistarterUrl) {
      protocolHandleUrl(mainWindow, aistarterUrl);
    }
    // initDefauleDirConfig();
  })

  function onWindowBlur () {
    const tray = require('./tray.js')
    tray.setWindowFocus(false)
    // mac下注销快捷键，避免影响系统快捷键
    if (process.platform === 'darwin') {
      globalShortcut.unregisterAll()
    }
  }
  
  function onWindowFocus () {
    const tray = require('./tray.js')
    tray.setWindowFocus(true)
    // mac下快捷键失效的问题
    if (process.platform === 'darwin') {
      let contents = mainWindow.webContents
      globalShortcut.register('CommandOrControl+C', () => {
        console.log('注册复制快捷键成功')
        contents.copy()
      })
      globalShortcut.register('CommandOrControl+V', () => {
        console.log('注册粘贴快捷键成功')
        contents.paste()
      })
      globalShortcut.register('CommandOrControl+X', () => {
        console.log('注册剪切快捷键成功')
        contents.cut()
      })
      globalShortcut.register('CommandOrControl+A', () => {
        console.log('注册全选快捷键成功')
        contents.selectAll()
      })
    }
  }
  // 重启应用（管理员权限）
  ipcMain.on('restart-app-admin', function () {
    const { execSync } = require('child_process');
    try {
      // 获取当前执行文件路径
      const exePath = process.execPath;
      if (process.platform === 'darwin') {
        // macOS 系统使用 osascript 弹出权限请求
        const command = `osascript -e 'do shell script "open -a \\"${exePath}\\" --args --as-admin" with administrator privileges'`;
        execSync(command);
      }else if (process.platform === 'linux') {
        // Linux 系统使用 pkexec 弹出权限请求
        // 注意：pkexec 需要安装 PolicyKit，并且需要配置相应的策略文件
        // 确保您的应用在打包后，exePath 指向的是可执行文件本身
        const command = `pkexec ${exePath} --as-admin`;
        execSync(command);
      } else {
        // Windows 系统使用 PowerShell
        const command = `powershell -WindowStyle Hidden -Command "Start-Process -FilePath '${exePath}' -ArgumentList '--as-admin' -Verb RunAs"`;
        execSync(command);
      }
      app.exit(0);
    } catch (error) {
      console.error('Failed to restart as admin:', error);
      mainWindow.webContents.send('restart-admin-failed');
    }
  });

  // 退出程序,这里接收
  ipcMain.on('window-close', function (e) {
    app.quit()
  })

  //完全退出程序
  ipcMain.on('window-quit', function (e) {
    app.isQuitting = true;
    app.quit();
  })

  // 最小化
  ipcMain.on('window-minimize', function () {
    if (process.platform === 'darwin' && mainWindow.isFullScreen()) {
      // macOS 全屏状态下先退出全屏再最小化
      // 使用一次性事件监听器确保退出全屏后再最小化
      mainWindow.once('leave-full-screen', () => {
        mainWindow.minimize();
      });
      mainWindow.setFullScreen(false);
    } else {
      mainWindow.minimize();
    }
  })

  // 最大化
  ipcMain.on('window-maximize', function () {
    if (process.platform === 'darwin') {
      // macOS 系统使用 setFullScreen 来处理
      if (mainWindow.isFullScreen()) {
        mainWindow.setFullScreen(false);
      } else {
        mainWindow.setFullScreen(true);
      }
    } else {
      // Windows 和其他系统保持原有逻辑
      if (mainWindow.isMaximized()) {
        mainWindow.restore();
      } else {
        mainWindow.maximize();
      }
    }
  })

  return mainWindow;
}

// 这段程序将会在 Electron 结束初始化
// 和创建浏览器窗口的时候调用
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(() => {
  const mainWindow = createWindow()
  //防止多开
  const additionalData = {myKey:'AIStarter'}
  const gotTheLock = app.requestSingleInstanceLock(additionalData)
  
  if(!gotTheLock){
      app.quit()
  }else{
    app.on('second-instance',(event,commandLine,workingDirectory,additionalData)=>{
        //输入从第二个实例中接收到的数据
        console.log(additionalData)
        //有人试图运行第二个实例，我们应该关注我们的窗口
        if(mainWindow){
            if(mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.show()
            mainWindow.focus()        
        }
        
        // 处理通过命令行传递的 URL
        const url = commandLine.find(arg => arg.startsWith('aistarter://'));
        if (url) {
          protocolHandleUrl(mainWindow, url);
        }
    })
  }
  app.on('activate', () => {
    // 在 macOS 系统内, 如果没有已开启的应用窗口
    // 点击托盘图标时通常会重新创建一个新窗口
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
  
})

// 除了 macOS 外，当所有窗口都被关闭的时候退出程序。 因此, 通常
// 对应用程序和它们的菜单栏来说应该时刻保持激活状态, 
// 直到用户使用 Cmd + Q 明确退出
app.on('window-all-closed', () => {
  console.log('window-all-closed');
  app.exit();
  if (process.platform !== 'darwin') app.quit()
})

// 链接外部浏览器打开
app.on('web-contents-created', (e, webContents) => {
  webContents.setWindowOpenHandler(({ url, frameName }) => {
      shell.openExternal(url);
      return { action: 'deny' };
  });
});


// 处理传入的 URL
function protocolHandleUrl(mainWindows, rawUrl) {
  try {

    console.log(rawUrl);

    const parsedUrl = new URL(rawUrl);

    // 在这里处理 URL 参数
    let urlParams = {};
    urlParams.href = parsedUrl.href
    urlParams.protocol = parsedUrl.protocol
    urlParams.host = parsedUrl.host;
    urlParams.hostname = parsedUrl.hostname;
    urlParams.pathname = parsedUrl.pathname;

    console.log('Received URL:', urlParams);

    if(mainWindows){
      mainWindows.webContents.send('on-windows-protocol-url-enter', urlParams);
    }

  } catch (err) {
    console.error('Failed to parse URL:', err);
  }
}
