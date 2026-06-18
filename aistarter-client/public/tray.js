const { app, nativeImage, Tray, Menu } = require('electron')
const path = require('path')

let tray

let mainWindow

function init (_mainWindow) {

  mainWindow = _mainWindow;
  if (process.platform === 'win32') {
    initWin32()
  }else if (process.platform === 'linux') {
    initLinux()
  }else if(process.platform === 'darwin'){
    initMacOs()
  }
  // Mac apps generally do not have menu bar icons
}

/**
 * Returns true if there a tray icon is active.
 */
function hasTray () {
  return !!tray
}

function setWindowFocus (flag) {
  if (!tray) return
  updateTrayMenu()
}

function initLinux () {
  // checkLinuxTraySupport(err => {
  //   if (!err) createTray()
  // })

  createTray()
}

function initWin32 () {
  createTray()
}

function initMacOs () {
  createTray()
}

/**
 * Check for libappindicator support before creating tray icon.
 */
function checkLinuxTraySupport (cb) {
  const cp = require('child_process')

  // Check that libappindicator libraries are installed in system.
  cp.exec('ldconfig -p | grep libappindicator', (err, stdout) => {
    if (err) return cb(err)
    cb(null)
  })
}

function createTray () {
  

  if(process.platform != 'darwin'){
    tray = new Tray(getIconPath())
  // On Windows, left click opens the app, right click opens the context menu.
  // On Linux, any click (left or right) opens the context menu.
    tray.on('click', () => mainWindow.show())
  }else{
    const trayIcon = nativeImage.createFromPath(getIconPath()).resize({width:20, height:20})
    tray = new Tray(trayIcon)
  }

  // Show the tray context menu, and keep the available commands up to date
  updateTrayMenu()
}

function updateTrayMenu () {
  const contextMenu = Menu.buildFromTemplate(getMenuTemplate())
  tray.setContextMenu(contextMenu)
}

function getMenuTemplate () {
  return [
    getToggleItem(),
    {
      type: 'separator'
    },
    {
      label: '退出',
      click: () => {app.isQuitting = true; app.quit()}
    }
  ]

  function getToggleItem () {
    if (mainWindow.isVisible()) {
      return {
        label: '隐藏',
        click: () => {
          mainWindow.hide()
          //苹果端隐藏dock
          if (process.platform == 'darwin') {
            app.dock.hide();
          }
        }
      }
    } else {
      return {
        label: '显示',
        click: () => {
          mainWindow.show()
          if (process.platform == 'darwin') {
            app.dock.show();
          }
        }
      }
    }
  }
}

function getIconPath () {
  return path.resolve(__dirname, 'app_icon.png')
}

module.exports = {
  hasTray,
  init,
  setWindowFocus
}