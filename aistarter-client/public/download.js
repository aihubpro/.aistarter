//下载相关
const { net,ipcMain,dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const Constants = require('./constants.js');

const url = require('url'); // 用于解析 URL

const axios = require('axios');

async function download(urlStr, options, callbacks) {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(urlStr);
    const protocol = parsedUrl.protocol === 'https:' ? require('https') : require('http');
    const { savePath, range, webToken } = options;
    const filePath = path.resolve(__dirname, savePath);

    // 尝试删除已存在的文件
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // 删除已存在的文件
      }
    } catch (unlinkError) {
      console.error(`Failed to delete existing file: ${unlinkError.message}`);
      if (callbacks && callbacks.onError) {
        callbacks.onError(unlinkError);
        resolve(null);
        return;
      }
    }

    const request = protocol.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.path,
      method: 'GET',
      headers: {
        'Range': range || 'bytes=0-',
        'access-token': webToken || ''
      }
    }, (response) => {
      const fileStream = fs.createWriteStream(filePath);

      response.pipe(fileStream)
        .on('finish', () => {
          fileStream.close(() => {
            if (callbacks && callbacks.onCompleted) {
              callbacks.onCompleted(filePath);
              resolve(filePath);
            }
          });
        })
        .on('error', (error) => {
          fs.unlink(filePath, () => {}); // 删除部分下载的文件
          if (callbacks && callbacks.onError) {
            callbacks.onError(error);
            console.log(error);
            resolve(null);
          }
        });
    });

    request.on('error', (error) => {
      fs.unlink(filePath, () => {}); // 删除部分下载的文件
      if (callbacks && callbacks.onError) {
        callbacks.onError(error);
        console.log(error);
        resolve(null);
      }
    });

    request.end(); // 发送请求
  });
}

//下载脚本
async function downloadScript(fileId, options){

    const { getSettingValue,terminalMessage,showMessage} = require('./plugin');

    const configDirPath = await getSettingValue("RootDirPath");
    const tmpRootPath = path.join(configDirPath, 'Temp'); //临时目录

    const {getToken} = require('./config');
    const tokenData = await getToken();
		// 示例用法
		let url = Constants.uploadUrl + '/users/download/' + fileId;
    if(options.isTemp){
      url = Constants.uploadUrl + '/users/download-temp/' + fileId;
    }
		const tmpOptions = {
			savePath: path.join(tmpRootPath, options.fileName),
      webToken:tokenData
		};

		const callbacks = {
			onProgress: (downloadedBytes, totalBytes) => {
				let progress = parseInt((downloadedBytes / totalBytes) * 100);
				terminalMessage(`download ${options.fileName} progress => ${progress}%`);
			},
			onCompleted: (savePath) => {
				terminalMessage(`download ${options.fileName} completed => ${savePath}`);
			},
			onError: (error) => {
				terminalMessage(`download ${options.fileName} error:`, error);
			}
		};

		let filePath = await download(url, tmpOptions, callbacks);
    if(filePath){
      showMessage("下载脚本成功！");
    }

		return filePath;
}

//获取市场应用信息
async function getAppInfo(fileId, isTemp = false){
  const {getToken} = require('./config');
  const tokenData = await getToken();

  try {
      let uploadUrl = Constants.uploadUrl + '/users/market-app-info';
      if(isTemp){
        uploadUrl = Constants.uploadUrl + '/users/market-app-info-review';
      }
      const response = await axios.get(uploadUrl, {
        family: 4,
        headers: {
            "access-token":tokenData
        },
        params: { fId: fileId },
      })
      console.log(response.data);
      return response.data;
  } catch (error) {
      // 处理可能出现的错误
      console.error('App info error:', error);
      return null
  }
}

// 下载脚本
ipcMain.handle('download-script', async (event, fileId, options) => {

  const { getSettingValue,terminalMessage,showLoading, showMessage} = require('./plugin');
  const {unzipPluginCode} = require('./zip')

  let pluginName = options.fileName;
  const configDirPath = await getSettingValue("RootDirPath");
  const pluginRootPath = path.join(configDirPath, 'Products');
  const pluginPath = path.join(pluginRootPath, pluginName);
  const aistarterDir = path.join(pluginPath, '.aistarter');

  options.fileName = options.fileName + ".zip";
  let doAction = async () => {
     showLoading(true, "正在下载插件...");
     let filePath = await downloadScript(fileId, options);
     if(!filePath){
       console.log("下载失败：" + fileId);
       showLoading(false);
       return;
     }
 
     terminalMessage(`unzip ${options.fileName} ...`);
     showLoading(true, "正在安装插件...");
     let unzipPath = await unzipPluginCode(filePath, pluginName);
     if(!unzipPath){
       showMessage("解压失败！");
     }

     //解压后更新main.json信息
     //获取应用信息
     let appInfo = await getAppInfo(fileId, options.isTemp);
     // console.log(appInfo)
     if(!appInfo){
       showMessage("应用更新信息失败！");
     }

     // 读取 main.json 文件
     const mainJsonPath = path.join(aistarterDir, 'main.json');
     const mainJsonContent = await fs.promises.readFile(mainJsonPath, 'utf8');
     let mainJsonData = JSON.parse(mainJsonContent);

     mainJsonData.file_id = fileId
     if(appInfo.oss_path && appInfo.oss_path != ""){
       mainJsonData.high_speed = true;
     }
     
     //123pan高速下载标记
     if(appInfo.pan_123_path && appInfo.pan_123_path != ""){
       mainJsonData.pan_high_speed = true;
     }

     await fs.promises.writeFile(mainJsonPath, JSON.stringify(mainJsonData, null, 2));

     showLoading(false);
  }

  //先判断目录是否存在

  if (fs.existsSync(aistarterDir)) {
     console.log(`${aistarterDir} 目录已存在`);
     
     // 创建弹出提示框
     const options = {
       type: 'question',
       buttons: ['取消', '确认'],
       defaultId: 1,
       title: '提示',
       message: '检测到插件已经安装，是否覆盖？'
     };

     // 显示弹出提示框
     dialog.showMessageBox(null, options).then( async (response) => {
       const buttonIndex = response.response;
       if (buttonIndex === 1) {
         fs.rmSync(aistarterDir, { recursive: true });
         await doAction();
       }
     }).catch((err) => {
       console.error('错误：', err);
     });
 } else {
   await doAction();
 }

})

module.exports = {
  download,
};
