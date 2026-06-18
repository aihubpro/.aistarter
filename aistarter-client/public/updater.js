//软件更新模块

const { ipcMain,dialog } = require('electron')
const { autoUpdater } = require('electron-updater');

// 用户反馈立即更新
ipcMain.on('updater-update-now', () => {
  console.log('updater-update-now:: 用户同意更新，开始更新') 

  autoUpdater.quitAndInstall()
})

// 用户也可以通过点击按钮去检测更新
ipcMain.on('updater-check-for-update', () => {
  console.log('ev-check-for-update:: 执行自动更新检查') 

  autoUpdater.checkForUpdates()
})

function initUpdater(mainWindow){

  console.log("initUpdater");

  // 根据条件动态设置更新服务器的 URL
  // 开源版本默认关闭自动更新，如需启用请将 __URL_PLACEHOLDER__ 替换为你的更新服务地址
  let updateUrl = "__URL_PLACEHOLDER__";
  // if (用户在中国) {
  //   updateUrl = "__URL_PLACEHOLDER__";
  // } else if (用户在欧洲) {
  //   updateUrl = "__URL_PLACEHOLDER__";
  // }

  // 也可以通过代码配置文件服务地址
  // autoUpdater.setFeedURL({
  //   provider: 'generic',
  //   url: '服文件地址'
  // })
  autoUpdater.setFeedURL(updateUrl);
  // 设置是否自动下载，默认是true,当点击检测到新版本时，会自动下载安装包，所以设置为false
  // autoUpdater.autoDownload = false

  if (process.platform === 'win32') {
    autoUpdater.checkForUpdates()
  }

  const message = {
      error: '检查更新出错！',
      checking: '正在检查更新……',
      updateAva: '检测到新版本，正在下载……',
      updateNotAva: '现在使用的就是最新版本，不用更新'
  }

  // 检查更新出错
  autoUpdater.on('error', () => {
      console.log('autoUpdater-error:::', arguments)

      sendUpdateMessage(message.error)
  })

  // 检查是否有版本更新
  autoUpdater.on('checking-for-update', () => {
      console.log('checking-for-update:::', arguments)

      sendUpdateMessage(message.checking)
  })

  // 检测到有版本更新
  autoUpdater.on('update-available', () => {
      console.log('update-available:::', arguments)

      sendUpdateMessage(message.updateAva)
  })

  // 未发现有新版本
  autoUpdater.on('update-not-available', () => {
      console.log('update-not-available:::', arguments)

      sendUpdateMessage(message.updateNotAva)
  })

  // 更新下载进度事件
  autoUpdater.on('download-progress', progressObj => {
      console.log('download-progress:::', progressObj)
      
      mainWindow.setProgressBar(progressObj.percent / 100)
  })

  // 下载完成，询问用户是否更新
  autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) => {
      console.log('update-downloaded::: 下载完成，询问用户是否更新') 
      
      mainWindow.webContents.send('updater-should-update', {
          event,
          releaseNotes,
          releaseName,
          releaseDate,
          updateUrl,
          quitAndUpdate
      })

		//新加内容
    const options = {
			type: 'info',
			buttons: ['确定', '取消'],
			title: '更新提示',
			message: '发现有新版本，是否立即重启更新？',
			cancelId: 1
		}
		dialog.showMessageBox(options).then(res => {
			if (res.response === 0) {
				autoUpdater.quitAndInstall()
			}
		})

  })

  function sendUpdateMessage(text) {
      mainWindow.webContents.send('updater-message', text)
  }
 
}


module.exports = {
  initUpdater,
};
