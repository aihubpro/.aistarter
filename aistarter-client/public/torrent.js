//BT下载相关
const { Console } = require('console');
const { app, ipcMain } = require('electron')
const fs = require('fs');

const path = require('path');

const Constants = require('./constants.js');
const axios = require('axios');
const OSS = require('ali-oss');
const progress = require('progress-stream');
const { DownloaderHelper } = require('node-downloader-helper');
const {cerateUnZipProgressInfo,ceratePrepareZipnfo,cerateDelProgressInfo,ceratePrepareProgressInfo,cerateDownloadProgressInfo} = require('./torrent_helper')

let isAppExited = false; //是否应用已经退出
let curMainWindow = null; //当前主窗口

//下载解压状态缓存
let progressListCache = {};

const WebTorrent = require('webtorrent');

if (WebTorrent.WEBRTC_SUPPORT) {
  // WebRTC is supported
  console.log("WebRTC is supported")
} else {
  // Use a fallback
  console.log("Use a fallback");
}

//客户端
let client = new WebTorrent({ maxConns:80, torrentPort:9964 })

client.on('error', function (err) {
  console.error('ERROR: ' + err.message)
})


// 初始化插件
async function initTorrent(mainWindow){
  curMainWindow = mainWindow;
  setInterval(updateTorrentProgress, 1000)
}


//创建种子文件同时做种
async function seed(pluginName) {

  stopTorrentByPluginName(pluginName,'Products');

  const { getSettingValue } = require('./plugin');
  const configDirPath = await getSettingValue("RootDirPath");
  const pluginRootPath = path.join(configDirPath, 'Products');
  const pluginPath = path.join(pluginRootPath, pluginName);
  const aistarterDir = path.join(pluginPath, '.aistarter');


  const sharePath = path.join(configDirPath, 'Share');
  // 检查目录是否存在
  if (!fs.existsSync(sharePath)) {
    // 目录不存在
    console.log("Error not share dir!!");
    return;
  }

  let filePath = process.platform === 'win32' 
  ? path.join(sharePath, pluginName + ".zip")
  : path.join(sharePath, pluginName + ".tar.gz");
  const {seedHelper} = require('./torrent_helper');
  return await seedHelper(client,pluginName,'Products',filePath,aistarterDir)


}

//创建种子文件同时做种,模型，插件，工作流
async function seedRes(resName,resType) {

  stopTorrentByPluginName(resName,resType);
  const { getSettingValue } = require('./plugin');
  const configDirPath = await getSettingValue("RootDirPath");
  const pluginRootPath = path.join(configDirPath, resType);
  const pluginPath = path.join(pluginRootPath, resName);
  const aistarterDir = path.join(pluginPath, '.aistarter');


  const sharePath = path.join(configDirPath, 'Share',resType);
  // 检查目录是否存在
  if (!fs.existsSync(sharePath)) {
    // 目录不存在
    console.log("Error not share dir!!");
    return;
  }

  let filePath = process.platform === 'win32' 
  ? path.join(sharePath, resName + ".zip")
  : path.join(sharePath, resName + ".tar.gz");

  const {seedHelper} = require('./torrent_helper');
  return await seedHelper(client,resName,resType,filePath,aistarterDir)

}


//暂停或继续下载
async function setTorrentState(pluginName,pluginType, isStop){

  if(isStop){
    stopTorrentByPluginName(pluginName,pluginType);
  }else{
    downloadProjectTorrent(pluginName);
  }
  
  let cacheProgressInfo = progressListCache[pluginName];
  if(cacheProgressInfo){
    updateProgressMessage(cerateDownloadProgressInfo(pluginName,pluginType, cacheProgressInfo.progress, 0, 0, isStop));
    updateTorrentProgress();
  }
}
//暂停或继续下载 (模型，插件，工作流)
async function setResTorrentState(pluginName,pluginType, isStop){

  if(isStop){
    stopTorrentByPluginName(pluginName,pluginType);
  }else{
    downloadResourcesTorrent(pluginName,pluginType);
  }

  let cacheProgressInfo = progressListCache[pluginName];
  if(cacheProgressInfo){
    updateProgressMessage(cerateDownloadProgressInfo(pluginName,pluginType, cacheProgressInfo.progress, 0, 0, isStop));
    updateTorrentProgress();
  }
}

//检测是否下载的, 返回true还有真正执行的任务
async function checkHasTorrentTask(){
  for(let key in progressListCache) {
    if(progressListCache[key]) {
        let progressInfo = progressListCache[key];
        if(progressInfo.progressType == 2 || progressInfo.progressType == 4 || progressInfo.progressType == 5){
          return true;
        }

        if(progressInfo.progressType == 1 && !progressInfo.downloadStop){
          return true;
        }
    }
  }

  return false;
}


async function downloadTorrent(pluginName, callbacks = {}) {
  //下载前先停掉现有的torrent
  stopTorrentByPluginName(pluginName,'Products');

  const { getSettingValue } = require('./plugin');
  const configDirPath = await getSettingValue("RootDirPath");
  const pluginRootPath = path.join(configDirPath, 'Products');
  const pluginPath = path.join(pluginRootPath, pluginName);
  const aistarterDir = path.join(pluginPath, '.aistarter');


  const sharePath = path.join(configDirPath, 'Share');
  // 检查目录是否存在
  if (!fs.existsSync(sharePath)) {
    // 目录不存在，创建它
    fs.mkdirSync(sharePath, { recursive: true }); // recursive选项确保可以创建多级目录
  }

  let torrentFilePath = path.join(aistarterDir, pluginName + '.torrent');

  if (!fs.existsSync(torrentFilePath)) {
    if (callbacks.error) {
      callbacks.error('not torrent file!');
    }
    return;
  }

  console.log("downloadTorrent:" + pluginName);

  let options = {};
  options["path"] = sharePath;
  options["maxWebConns"] = 10;

  let productFilePath = process.platform === 'win32' 
  ? path.join(sharePath, pluginName + ".zip")
  : path.join(sharePath, pluginName + ".tar.gz");
  
  if (fs.existsSync(productFilePath)) {
    //已经有这个文件,且文件大小完整跳过验证
    if(await checkTorrentFileComplete(pluginName)){
      console.log("skipVerify:" + pluginName);
      options["skipVerify"] = true;
    }
  }

  const {downTorHelper} = require('./torrent_helper');
  return await downTorHelper(client,pluginName,'Products',torrentFilePath,options,callbacks, isAppExited);
}
async function downloadResTorrent(resName,resType, callbacks = {}) {
  //下载前先停掉现有的torrent
  stopTorrentByPluginName(resName, resType);

  const { getSettingValue } = require('./plugin');
  const configDirPath = await getSettingValue("RootDirPath");
  const pluginRootPath = path.join(configDirPath, resType);
  const pluginPath = path.join(pluginRootPath, resName);
  const aistarterDir = path.join(pluginPath, '.aistarter');


  const sharePath = path.join(configDirPath, 'Share',resType);
  // 检查目录是否存在
  if (!fs.existsSync(sharePath)) {
    // 目录不存在，创建它
    fs.mkdirSync(sharePath, { recursive: true }); // recursive选项确保可以创建多级目录
  }

  let torrentFilePath = path.join(aistarterDir, resName + '.torrent');

  if (!fs.existsSync(torrentFilePath)) {
    if (callbacks.error) {
      callbacks.error('not torrent file!');
    }
    return;
  }

  console.log("downloadResTorrent:" + resName);

  let options = {};
  options["path"] = sharePath;
  options["maxWebConns"] = 10;

  let productFilePath = process.platform === 'win32' 
  ? path.join(sharePath, resName + ".zip")
  : path.join(sharePath, resName + ".tar.gz");
  if (fs.existsSync(productFilePath)) {
    //已经有这个文件,且文件大小完整跳过验证
    if(await checkTorrentFileComplete(resName)){
      console.log("skipVerify:" + resName);
      options["skipVerify"] = true;
    }
  }

  const {downTorHelper} = require('./torrent_helper');
  return await downTorHelper(client,resName,resType,torrentFilePath,options,callbacks, isAppExited);

}

//检测文件是否已经下载完成
async function checkTorrentFileComplete(pluginName){
  const { getSettingValue } = require('./plugin');
  const configDirPath = await getSettingValue("RootDirPath");
  const pluginRootPath = path.join(configDirPath, 'Products');
  const pluginPath = path.join(pluginRootPath, pluginName);
  const pluginCodePath = path.join(pluginPath, ".aistarter");

  // 读取 main.json 文件
  const mainJsonPath = path.join(pluginCodePath, 'main.json');
  try {
    const mainJsonContent = await fs.promises.readFile(mainJsonPath, 'utf8');
    let mainJsonData = JSON.parse(mainJsonContent);

    const sharePath = path.join(configDirPath, 'Share');
    let zipFilePath = process.platform === 'win32' 
    ? path.join(sharePath, pluginName + ".zip")
    : path.join(sharePath, pluginName + ".tar.gz");
    const {checkTorrentFileCompletePublic} = require('./torrent_helper');
    return await checkTorrentFileCompletePublic(zipFilePath,mainJsonData);

  } catch (error) {
    console.error('Error Torrent File code:', pluginName);
    console.error(error);
    return false;
  }

  return false;
}

async function checkResTorrentFileComplete(resName,resType){
  const { getSettingValue } = require('./plugin');
  const configDirPath = await getSettingValue("RootDirPath");
  const pluginRootPath = path.join(configDirPath, resType);
  const pluginPath = path.join(pluginRootPath, resName);
  const aistarterDir = path.join(pluginPath, '.aistarter');
  // 读取 main.json 文件
  const mainJsonPath = path.join(aistarterDir, 'main.json');
  try {
    const mainJsonContent = await fs.promises.readFile(mainJsonPath, 'utf8');
    let mainJsonData = JSON.parse(mainJsonContent);

    const sharePath = path.join(configDirPath, 'Share', resType);
    let zipFilePath = process.platform === 'win32' 
    ? path.join(sharePath, resName + ".zip")
    : path.join(sharePath, resName + ".tar.gz");
    const {checkTorrentFileCompletePublic} = require('./torrent_helper');
    return await checkTorrentFileCompletePublic(zipFilePath,mainJsonData);
  } catch (error) {
    console.error('Error Torrent File code:', resName);
    console.error(error);
    return false;
  }
}

//更新下载进度
async function updateTorrentProgress(){
  if (!isAppExited && curMainWindow) {
    curMainWindow.webContents.send('on-plugin-torrent-progress-message', progressListCache);
  }
  
  return progressListCache;
  // console.log(progressList);
}

//限制更新频率
// let updateProgressTimeCache = {}
//通知渲染界面更新进度
function updateProgressMessage(progressInfo) {
  if (!progressInfo.pluginName) {
    return;
  }


  progressListCache[progressInfo.pluginName] = progressInfo;

  
  

  // const pluginName = progressInfo.pluginName;
  // const currentTime = Date.now();
  // const tmpCacheTime = updateProgressTimeCache[pluginName]
  // // 如果缓存中没有该插件的更新时间或者已经超过1秒
  // if (!tmpCacheTime || (currentTime - tmpCacheTime) >= 1000) {
  //   if (!isAppExited && curMainWindow) {
  //     curMainWindow.webContents.send('on-plugin-torrent-progress-message', progressInfo);
  //   }
  //   // 更新缓存中的时间
  //   updateProgressTimeCache[pluginName] = currentTime;
  // }
}

// BT下载项目
async function downloadProjectTorrent(pluginName){
  const {showLoading, getSettingValue} = require('./plugin');
  const { markPluginDownloaded,markResourcesDownloaded } = require('./plugin');
  const {unzipPluginProject} = require('./zip')
  const {unzipResourcesProject} = require('./resources')

  //开始下载
  updateProgressMessage(ceratePrepareProgressInfo(pluginName,'Products'));
  updateTorrentProgress();

  let callbacks = {}
  callbacks.progress = (precent, downloadSpeed, numPeers) =>{
    // showLoading(true, "正在下载项目 " + parent + "%" );
    updateProgressMessage(cerateDownloadProgressInfo(pluginName,'Products', precent, downloadSpeed, numPeers));
  }
  callbacks.done = () =>{
    //showLoading(false);
    console.log("torrent downloaded!!");
  }
  // showLoading(true, "正在下载项目");
  let torrent = await downloadTorrent(pluginName, callbacks);
  if(!torrent){
    updateProgressMessage(cerateDelProgressInfo(pluginName,'Products'));
    return;
  }
  // showLoading(true, "正在解压项目,请耐心等候！");
  updateProgressMessage(ceratePrepareZipnfo(pluginName,'Products'));
  let zipOk = await unzipPluginProject(pluginName,{progress:(precent) => {
    // showLoading(true, "正在解压项目 " + precent + "%");
    updateProgressMessage(cerateUnZipProgressInfo(pluginName,'Products', precent));
  }});
  if(!zipOk){
    updateProgressMessage(cerateDelProgressInfo(pluginName,'Products'));
    return
  }
  updateProgressMessage(cerateDelProgressInfo(pluginName,'Products'));
  
  markPluginDownloaded(pluginName);

  //检测是否要自动关机
  await checkAutoShutdown();
}

//BT下载模型，插件，工作流
async function downloadResourcesTorrent(resName,resType){
  const { markResourcesDownloaded } = require('./plugin');
  const {unzipResourcesProject} = require('./resources')

  //开始下载
  updateProgressMessage(ceratePrepareProgressInfo(resName,resType));
  updateTorrentProgress();

  let callbacks = {}
  callbacks.progress = (precent, downloadSpeed, numPeers) =>{
    // showLoading(true, "正在下载项目 " + parent + "%" );
    updateProgressMessage(cerateDownloadProgressInfo(resName,resType, precent, downloadSpeed, numPeers));
  }
  callbacks.done = () =>{
    //showLoading(false);
    console.log("torrent downloaded!!");
  }
  // showLoading(true, "正在下载项目");
  let torrent = await downloadResTorrent(resName,resType, callbacks);
  if(!torrent){
    updateProgressMessage(cerateDelProgressInfo(resName,resType));
    return;
  }
  
  // showLoading(true, "正在解压项目,请耐心等候！");
  updateProgressMessage(ceratePrepareZipnfo(resName,resType));
  let zipOk = await unzipResourcesProject(resName,resType,{progress:(precent) => {
    // showLoading(true, "正在解压项目 " + precent + "%");
    updateProgressMessage(cerateUnZipProgressInfo(resName,resType, precent));
  }});
  if(!zipOk){
    updateProgressMessage(cerateDelProgressInfo(resName,resType));
    return
  }
  updateProgressMessage(cerateDelProgressInfo(resName,resType));
  
  markResourcesDownloaded(resName,resType);

  //检测是否要自动关机
  await checkAutoShutdown();
}

/**
 * 异步下载OSS上的文件到本地。
 * @param {string} fileId 文件ID，用于获取OSS认证信息。
 * @param {string} pluginName 插件名，用于生成文件路径。
 * @returns {Promise<boolean>} 返回一个Promise，成功时返回true，失败时返回false。
 */
async function downloadFileFromOSS(fileId, pluginName, callbacks = {}) {

  const {showMessage} = require('./plugin');

  try {
    const ossAuthInfo = await requestOssAuth(fileId);

    if (!ossAuthInfo || ossAuthInfo < 0) {
      console.log("requestOssAuth fail!!");
      if(ossAuthInfo == -403){
        showMessage("高速下载仅限订阅会员和已购买的项目！");
      }

      if(ossAuthInfo == -429){
        showMessage("今日高速下载次数已经超过限制！");
      }

      return false;
    }

    console.log("requestOssAuth ok");
    // console.log(ossAuthInfo);

    let ossOption = {
      region: ossAuthInfo.Region,
      accessKeyId: ossAuthInfo.AccessKeyId,
      accessKeySecret: ossAuthInfo.AccessKeySecret,
      stsToken: ossAuthInfo.SecurityToken,
      bucket: ossAuthInfo.Bucket,
      refreshSTSToken: async () => {
        const refreshToken = await requestOssAuth(fileId);
        return {
          accessKeyId: refreshToken.AccessKeyId,
          accessKeySecret: refreshToken.AccessKeySecret,
          stsToken: refreshToken.SecurityToken,
        };
      },
    }

    if(ossAuthInfo.CustomeDomain || ossAuthInfo.CustomeDomain != ""){
      ossOption.cname = true;
      ossOption.endpoint = ossAuthInfo.CustomeDomain;
    }

    const client = new OSS(ossOption);

    const { getSettingValue } = require('./plugin');
    const configDirPath = await getSettingValue("RootDirPath");
    const sharePath = path.join(configDirPath, 'Share');
    const zipFilePath = process.platform === 'win32' 
    ? path.join(sharePath, pluginName + ".zip.temp")
    : path.join(sharePath, pluginName + ".tar.gz.temp");
    const finalZipFilePath = process.platform === 'win32' 
    ? path.join(sharePath, pluginName + ".zip")
    : path.join(sharePath, pluginName + ".tar.gz");
    

    // 检查目录是否存在
    if (!fs.existsSync(sharePath)) {
      // 目录不存在，创建它
      fs.mkdirSync(sharePath, { recursive: true }); // recursive选项确保可以创建多级目录
    }

    try {
      if (fs.existsSync(finalZipFilePath)) {
        fs.unlinkSync(finalZipFilePath);
        console.log(`${finalZipFilePath} 已被删除.`);
      }
    } catch (error) {
      console.error('删除文件时发生错误:', error);
    }

    console.log(zipFilePath);

    // 检查文件是否已经存在，并获取已下载字节数
    let startByte = 0;
    if (fs.existsSync(zipFilePath)) {
        startByte = fs.statSync(zipFilePath).size;
        console.log(`Resuming download from ${startByte} bytes`);
    }

    let str = progress({
      time: 1000,
      transferred:startByte
    });

    str.on('progress', function(progress) {
      if(callbacks && callbacks.progress){
        let percent = Math.round(progress.percentage);
        let downloadSpeed = Math.round(progress.speed);
        callbacks.progress(percent, downloadSpeed);
      }
    });

    let getStreamOption = {};
    let writeStreamOption = {};
    if(startByte > 0){
      getStreamOption = {
        headers: {
          Range: `bytes=${startByte}-`,
        },
      };

      //写文件改成追加模式
      writeStreamOption = { flags: 'a' };
    }

    let result = null;
    try {
      result = await client.getStream(ossAuthInfo.FilePath, getStreamOption);
    } catch(err){
      showMessage("高速下载异常，请尝试重新下载脚本~");
      console.log(err);
      return false;
    }

    const contentLength = result.res.headers['content-length'];
    const fileSize = contentLength ? parseInt(contentLength, 10) : null;
    if (fileSize !== null) {
      str.setLength(fileSize + startByte);
    }

    const writeStream = fs.createWriteStream(zipFilePath, writeStreamOption);
    result.stream.pipe(str).pipe(writeStream);

    // 等待写入流完成
    return new Promise((resolve, reject) => {
      writeStream.on('finish', async () => {
        try {
          // 重命名文件
          await fs.promises.rename(zipFilePath, finalZipFilePath);
          console.log('文件重命名成功');
          resolve(true);
        } catch (renameErr) {
          console.log(`重命名文件失败: ${renameErr}`);
          resolve(false);
        }
      });
      writeStream.on('error', async (streamErr) => {
        console.log(streamErr);
        resolve(false);
      });
    });
  } catch (error) {
    console.error(error);
    return false;
  }
}

//123网盘下载
async function downloadProjectPan(fileId, pluginName){
  const { markPluginDownloaded,showMessage } = require('./plugin');
  const {unzipPluginProject} = require('./zip')

  //开始下载
  updateProgressMessage(ceratePrepareProgressInfo(pluginName,'Products', true));
  updateTorrentProgress();
  
  //请求下载
  const isDownload = await downloadFileFrom123Pan(fileId, pluginName, {progress:(percent, downloadSpeed) =>{
    //更新下载进度
    updateProgressMessage(cerateDownloadProgressInfo(pluginName,'Products', percent, downloadSpeed, 1, null, true));
  }});
  if(!isDownload){
    console.log("DownloadProjectPan fail!!");
    updateProgressMessage(cerateDelProgressInfo(pluginName,'Products'));
    showMessage("高速下载异常，请尝试重新下载脚本~");
    return false
  }

  // showLoading(true, "正在解压项目,请耐心等候！");
  updateProgressMessage(ceratePrepareZipnfo(pluginName,'Products'));
  let zipOk = await unzipPluginProject(pluginName,{progress:(precent) => {
    // showLoading(true, "正在解压项目 " + precent + "%");
    updateProgressMessage(cerateUnZipProgressInfo(pluginName,'Products', precent));
  }});
  if(!zipOk){
    showMessage("解压项目zip包失败~");
    updateProgressMessage(cerateDelProgressInfo(pluginName,'Products'));
    return
  }
  updateProgressMessage(cerateDelProgressInfo(pluginName,'Products'));
  
  markPluginDownloaded(pluginName);

  //检测是否要自动关机
  await checkAutoShutdown();

  return true

}

//123网盘更新软件
async function updateFileFrom123Pan(callbacks = {}) { 
  const {showMessage} = require('./plugin');

  try {
    const panAuthInfo = await request123PanAuth2();

    if (!panAuthInfo || panAuthInfo < 0) {
      console.log("Request 123pan Auth fail!!");
      if(panAuthInfo == -404){
        showMessage("下载失败，请前往官网下载最新版本！");
      }

      if(panAuthInfo == -429){
        showMessage("今日高速下载次数已经超过限制！");
      }

      return {
        success: false,
        error: 'Request 123pan Auth failed'
      };
    }

    // 获取应用名称和下载路径
    const getAppDownloadPath = () => {
      const os = require('os');
      const path = require('path');
      
      // 尝试多种方式获取应用名称，确保兼容性
      let appName = 'AIStarter'; // 默认应用名称
      
      try {
        // 方法1: 尝试使用Electron的app模块
        const { app } = require('electron');
        if (app && app.getName) {
          appName = app.getName();
        }
      } catch (electronError) {
        // 如果Electron app不可用，尝试其他方法
        try {
          // 方法2: 从进程标题获取
          if (process.title && process.title !== 'node') {
            appName = process.title;
          }
        } catch (processError) {
          // 方法3: 从执行路径获取
          try {
            const execPath = process.execPath;
            if (execPath) {
              const basename = path.basename(execPath, path.extname(execPath));
              if (basename && basename !== 'electron' && basename !== 'node') {
                appName = basename;
              }
            }
          } catch (pathError) {
            // 使用默认名称
            console.log('使用默认应用名称:', appName);
          }
        }
      }
      
      // 构建下载路径
      let downloadPath;
      if (process.platform === 'win32') {
        // Windows: %LOCALAPPDATA%\AppName-updater\pending
        const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
        downloadPath = path.join(localAppData, `${appName}-updater`, 'updates');
      } else if (process.platform === 'darwin') {
        // macOS: ~/Library/Caches/AppName-updater/pending
        downloadPath = path.join(os.homedir(), 'Library', 'Caches', `${appName}-updater`, 'updates');
      } else {
        // Linux: ~/.cache/AppName-updater/pending
        downloadPath = path.join(os.homedir(), '.cache', `${appName}-updater`, 'updates');
      }
      
      return {
        appName,
        downloadPath
      };
    };
    
    const { appName, downloadPath } = getAppDownloadPath();
    console.log(`应用名称: ${appName}`);
    console.log(`下载路径: ${downloadPath}`);

    // 检查目录是否存在
    if (!fs.existsSync(downloadPath)) {
      // 目录不存在，创建它
      fs.mkdirSync(downloadPath, { recursive: true });
    }

    // console.log(`开始下载更新文件到: ${finalFilePath}`);

    const dl = new DownloaderHelper(panAuthInfo.url, downloadPath, {
      resumeIfFileExists:true,
      removeOnStop:false,
      removeOnFail:false,
      override:true,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });

    // 监听下载进度事件
    dl.on('progress', (stats) => {
      // console.log('Download progress:', stats.progress, 'Speed:', stats.speed);
      if(callbacks && callbacks.progress){
        let percent = Math.round(stats.progress);
        let downloadSpeed = stats.speed;
        callbacks.progress(percent, downloadSpeed);
      }
    });
    
    dl.on('progress.throttled', (stats) => {
      console.log('Download progress throttled:', stats.progress, 'Speed:', stats.speed);
      if(callbacks && callbacks.progress){
        let percent = Math.round(stats.progress);
        let downloadSpeed = stats.speed;
        callbacks.progress(percent, downloadSpeed);
      }
    });
    
    dl.on('start', () => {
      console.log('Download started');
      if(callbacks && callbacks.progress){
        callbacks.progress(0, 0);
      }
    });
    
    dl.on('download', (downloadInfo) => {
      console.log('Download info:', downloadInfo);
    });
    
    dl.on('stateChanged', (state) => {
      console.log('Download state changed:', state);
    });
    
    dl.on('error', (err) => {
      console.error('Download error:', err);
    });

    return new Promise((resolve, reject) => {

      dl.on('end', async (downloadInfo) => {
        try {
            console.log('最终文件名:', downloadInfo.fileName);
            console.log('文件路径:', downloadInfo.filePath);
            console.log('下载耗时:', downloadInfo.downloadTime);
          // 如果是Linux系统，给AppImage文件添加执行权限
          if (process.platform === 'linux' && downloadInfo.fileName.endsWith('.AppImage')) {
            try {
              await fs.promises.chmod(downloadInfo.filePath, 0o755);
              console.log('已为AppImage文件添加执行权限');
            } catch (chmodErr) {
              console.log(`添加执行权限失败: ${chmodErr}`);
            }
          }
          
          resolve({
            success: true,
            downloadPath: downloadInfo.filePath
          });
        } catch (renameErr) {
          console.log(`重命名文件失败: ${renameErr}`);
          resolve({
            success: false,
            error: renameErr.message
          });
        }
      });

      dl.on('error', async (err) => {
        console.error(`下载失败: ${err}`);
        resolve({
          success: false,
          error: err.message
        });
      });

      dl.start().catch(async (err) => {
        console.error(`下载失败: ${err}`);
        resolve({
          success: false,
          error: err.message
        });
      });

    });

    } catch (error) {
      // 处理可能出现的错误
      console.error('Download 123pan error:', error);
      return {
        success: false,
        error: error.message
      }
  }
}

//123网盘下载
async function downloadFileFrom123Pan(fileId, pluginName, callbacks = {}) {
  const {showMessage} = require('./plugin');

  try {
    const panAuthInfo = await request123PanAuth(fileId);

    if (!panAuthInfo || panAuthInfo < 0) {
      console.log("Request 123pan Auth fail!!");
      if(panAuthInfo == -403){
        showMessage("高速下载仅限订阅会员和已购买的项目！");
      }

      if(panAuthInfo == -429){
        showMessage("今日高速下载次数已经超过限制！");
      }

      return false;
    }

    const { getSettingValue } = require('./plugin');
    const configDirPath = await getSettingValue("RootDirPath");
    const sharePath = path.join(configDirPath, 'Share');
    const zipFilePath = process.platform === 'win32' 
    ? path.join(sharePath, pluginName + ".zip.temp")
    : path.join(sharePath, pluginName + ".tar.gz.temp");
    const finalZipFilePath = process.platform === 'win32' 
    ? path.join(sharePath, pluginName + ".zip")
    : path.join(sharePath, pluginName + ".tar.gz");

    // 检查目录是否存在
    if (!fs.existsSync(sharePath)) {
      // 目录不存在，创建它
      fs.mkdirSync(sharePath, { recursive: true }); // recursive选项确保可以创建多级目录
    }

    try {
      if (fs.existsSync(finalZipFilePath)) {
        fs.unlinkSync(finalZipFilePath);
        console.log(`${finalZipFilePath} 已被删除.`);
      }
    } catch (error) {
      console.error('删除文件时发生错误:', error);
    }

    // console.log(panAuthInfo);

    const dl = new DownloaderHelper(panAuthInfo.url, sharePath, {
      resumeIfFileExists:true,
      removeOnStop:false,
      removeOnFail:false,
      fileName:process.platform === 'win32'?`${pluginName}.zip.temp`:`${pluginName}.tar.gz.temp`,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });

    dl.on('progress.throttled', (stats) => {
      // console.log(stats);
      if(callbacks && callbacks.progress){
        let percent = Math.round(stats.progress);
        let downloadSpeed = stats.speed;
        callbacks.progress(percent, downloadSpeed);
      }
    });

    return new Promise((resolve, reject) => {

      dl.on('end', async () => {
        try {
          // 重命名文件
          await fs.promises.rename(zipFilePath, finalZipFilePath);
          console.log('文件重命名成功');
          resolve(true);
        } catch (renameErr) {
          console.log(`重命名文件失败: ${renameErr}`);
          resolve(false);
        }
  
      });

      dl.on('error', async (err) => {
        console.error(`下载失败: ${err}`);
        resolve(false);
      });

      dl.start().catch(async (err) => {
        console.error(`下载失败: ${err}`);
        resolve(false);
      });

      // dl.resumeFromFile(zipFilePath).catch(async (err) => {
      //   console.error(`下载失败: ${err}`);
      //   resolve(false);
      // });

    });

    } catch (error) {
      // 处理可能出现的错误
      console.error('Download 123pan error:', error);
      return false
  }
}
//请求123网盘授权 (软件版本更新)
async function request123PanAuth2(){
  const {getToken} = require('./config');

  const tokenData = await getToken();

  // 获取包类型信息
  const getPackageType = () => {
    const platform = process.platform;
    const arch = require('os').arch();
    
    if (platform === 'darwin') {
      // macOS: x86架构传dmg，arm64架构传arm
      return arch === 'arm64' ? 'arm' : 'dmg';
    } else if (platform === 'linux') {
      // Linux: 根据发行版检测支持的包类型
      return getLinuxPackageType();
    }
    // Windows不传参数
    return null;
  };
  
  // 检测Linux发行版并返回对应的包类型
  const getLinuxPackageType = () => {
    const fs = require('fs');
    
    try {
      // 方法1: 检测标准的/etc/os-release文件 (最可靠的方法)
      try {
        if (fs.existsSync('/etc/os-release')) {
          // 检查文件读取权限
          try {
            fs.accessSync('/etc/os-release', fs.constants.R_OK);
            const osRelease = fs.readFileSync('/etc/os-release', 'utf8');
            const idMatch = osRelease.match(/^ID=(.+)$/m);
            const idLikeMatch = osRelease.match(/^ID_LIKE=(.+)$/m);
            
            if (idMatch) {
              const id = idMatch[1].replace(/"/g, '').toLowerCase();
              
              // Debian/Ubuntu系列
              if (id.includes('ubuntu') || id.includes('debian') || id.includes('mint') || 
                  id.includes('elementary') || id.includes('pop') || id.includes('zorin') ||
                  id.includes('kali') || id.includes('raspbian')) {
                return 'deb';
              }
              
              // Red Hat系列
              if (id.includes('rhel') || id.includes('centos') || id.includes('fedora') ||
                  id.includes('rocky') || id.includes('almalinux') || id.includes('oracle')) {
                return 'rpm';
              }
              
              // SUSE系列
              if (id.includes('suse') || id.includes('opensuse') || id.includes('sles') || id.includes('sled')) {
                return 'rpm';
              }
              
              // Arch系列
              if (id.includes('arch') || id.includes('manjaro') || id.includes('endeavour') || id.includes('arco')) {
                return 'appimage';
              }
            }
            
            // 检查ID_LIKE字段作为备用
            if (idLikeMatch) {
              const idLike = idLikeMatch[1].replace(/"/g, '').toLowerCase();
              if (idLike.includes('debian') || idLike.includes('ubuntu')) {
                return 'deb';
              }
              if (idLike.includes('rhel') || idLike.includes('fedora') || idLike.includes('suse')) {
                return 'rpm';
              }
              if (idLike.includes('arch')) {
                return 'appimage';
              }
            }
          } catch (accessError) {
            console.log('/etc/os-release文件无读取权限，尝试其他方法:', accessError.message);
          }
        }
      } catch (osReleaseError) {
        console.log('检测/etc/os-release失败，尝试其他方法:', osReleaseError.message);
      }
      
      // 方法2: 检测传统的发行版标识文件 (带权限检查)
      const checkFileWithPermission = (filePath) => {
        try {
          if (fs.existsSync(filePath)) {
            fs.accessSync(filePath, fs.constants.R_OK);
            return true;
          }
        } catch (permError) {
          console.log(`文件 ${filePath} 无访问权限:`, permError.message);
        }
        return false;
      };
      
      // Debian/Ubuntu系列
      if (checkFileWithPermission('/etc/debian_version') || checkFileWithPermission('/etc/lsb-release')) {
        return 'deb';
      }
      
      // Red Hat系列
      if (checkFileWithPermission('/etc/redhat-release') || checkFileWithPermission('/etc/centos-release') || 
          checkFileWithPermission('/etc/fedora-release') || checkFileWithPermission('/etc/rocky-release') || 
          checkFileWithPermission('/etc/almalinux-release') || checkFileWithPermission('/etc/oracle-release')) {
        return 'rpm';
      }
      
      // SUSE系列
      if (checkFileWithPermission('/etc/SuSE-release') || checkFileWithPermission('/etc/SUSE-brand') ||
          checkFileWithPermission('/etc/suse-release')) {
        return 'rpm';
      }
      
      // Arch系列
      if (checkFileWithPermission('/etc/arch-release') || checkFileWithPermission('/etc/manjaro-release')) {
        return 'appimage';
      }
      
      // 方法3: 检测环境变量 (权限友好的方法)
      try {
        const env = process.env;
        
        // 检查常见的发行版相关环境变量
        if (env.DEBIAN_FRONTEND || env.APT_CONFIG) {
          return 'deb';
        }
        
        if (env.REDHAT_SUPPORT_PRODUCT || env.REDHAT_SUPPORT_PRODUCT_VERSION) {
          return 'rpm';
        }
        
        // 检查PATH中的包管理器 (更安全的方法)
        const pathDirs = (env.PATH || '').split(':');
        for (const dir of pathDirs) {
          try {
            if (fs.existsSync(path.join(dir, 'apt'))) {
              return 'deb';
            }
            if (fs.existsSync(path.join(dir, 'dnf')) || fs.existsSync(path.join(dir, 'yum'))) {
              return 'rpm';
            }
            if (fs.existsSync(path.join(dir, 'zypper'))) {
              return 'rpm';
            }
            if (fs.existsSync(path.join(dir, 'pacman'))) {
              return 'appimage';
            }
          } catch (pathError) {
            // 忽略PATH检查错误，继续下一个目录
          }
        }
      } catch (envError) {
        console.log('环境变量检测失败:', envError.message);
      }
      
      // 方法4: 检测包管理器命令 (需要执行权限)
      try {
        const { execSync } = require('child_process');
        
        // 设置较短的超时时间，避免在受限环境中长时间等待
        const execOptions = { 
          stdio: 'ignore', 
          timeout: 2000,  // 2秒超时
          windowsHide: true 
        };
        
        try {
          execSync('which apt 2>/dev/null', execOptions);
          return 'deb';
        } catch {}
        
        try {
          execSync('which dnf 2>/dev/null', execOptions);
          return 'rpm';
        } catch {}
        
        try {
          execSync('which yum 2>/dev/null', execOptions);
          return 'rpm';
        } catch {}
        
        try {
          execSync('which zypper 2>/dev/null', execOptions);
          return 'rpm';
        } catch {}
        
        try {
          execSync('which pacman 2>/dev/null', execOptions);
          return 'appimage';
        } catch {}
        
      } catch (execError) {
        console.log('命令执行权限受限，跳过包管理器检测:', execError.message);
      }
      
      // 方法5: 检测用户目录下的配置文件 (最后的尝试)
      try {
        const os = require('os');
        const homeDir = os.homedir();
        
        // 检查用户配置目录
        if (fs.existsSync(path.join(homeDir, '.config', 'apt')) || 
            fs.existsSync(path.join(homeDir, '.aptitude'))) {
          return 'deb';
        }
        
        if (fs.existsSync(path.join(homeDir, '.config', 'dnf')) ||
            fs.existsSync(path.join(homeDir, '.config', 'yum'))) {
          return 'rpm';
        }
        
        if (fs.existsSync(path.join(homeDir, '.config', 'pacman'))) {
          return 'appimage';
        }
        
      } catch (homeError) {
        console.log('用户目录检测失败:', homeError.message);
      }
      
      // 所有检测方法都失败，使用AppImage作为兜底
      console.log('所有Linux发行版检测方法都失败或权限不足，使用通用AppImage格式');
      return 'appimage';
      
    } catch (error) {
      // 如果检测失败，默认使用AppImage
      console.log('Linux发行版检测过程中发生异常，使用默认AppImage:', error.message);
      return 'appimage';
    }
  };

  const packageType = getPackageType();

  try {
      const uploadUrl = Constants.uploadUrl + '/users/auth-123pan-update';
      const params = { 
        timestamp: Date.now() 
      };
      
      // 只有非Windows系统才传递packageType参数
      if (packageType) {
        params.packageType = packageType;
      }
      
      const response = await axios.get(uploadUrl, {
        family: 4,
        headers: {
            "access-token":tokenData
        },
        params: params
      })
      // console.log(response.data);
      return response.data;
  } catch (error) {
      // 处理可能出现的错误
      // console.error('Request 123pan Auth error:', error);
      // console.log(error.response);
      if(error.response){
        if(error.response.status == 404){
          return -404;
        }else if(error.response.status == 429){
          return -429;
        }
      }
      return null
  }
}
//请求123网盘授权
async function request123PanAuth(fileId){
  const {getToken} = require('./config');

  const tokenData = await getToken();

  try {
      const uploadUrl = Constants.uploadUrl + '/users/auth-123pan';
      const response = await axios.get(uploadUrl, {
        family: 4,
        headers: {
            "access-token":tokenData
        },
        params: { fId: fileId, timestamp: Date.now() }
      })
      // console.log(response.data);
      return response.data;
  } catch (error) {
      // 处理可能出现的错误
      // console.error('Request 123pan Auth error:', error);
      // console.log(error.response);
      if(error.response){
        if(error.response.status == 403){
          return -403;
        }else if(error.response.status == 429){
          return -429;
        }
      }
      return null
  }

}

//OSS下载项目
async function downloadProjectOss(fileId, pluginName){
  const { markPluginDownloaded } = require('./plugin');
  const {unzipPluginProject} = require('./zip')

  //开始下载
  updateProgressMessage(ceratePrepareProgressInfo(pluginName,'Products', true));
  updateTorrentProgress();
 
  //请求下载
  const isDownload = await downloadFileFromOSS(fileId, pluginName, {progress:(percent, downloadSpeed) =>{
    //更新下载进度
    updateProgressMessage(cerateDownloadProgressInfo(pluginName,'Products', percent, downloadSpeed, 1, null, true));
  }});
  if(!isDownload){
    console.log("downloadProjectOss fail!!");
    updateProgressMessage(cerateDelProgressInfo(pluginName,'Products'));
    return false
  }

  // showLoading(true, "正在解压项目,请耐心等候！");
  updateProgressMessage(ceratePrepareZipnfo(pluginName,'Products'));
  let zipOk = await unzipPluginProject(pluginName,{progress:(precent) => {
    // showLoading(true, "正在解压项目 " + precent + "%");
    updateProgressMessage(cerateUnZipProgressInfo(pluginName,'Products', precent));
  }});
  if(!zipOk){
    updateProgressMessage(cerateDelProgressInfo(pluginName,'Products'));
    return
  }
  updateProgressMessage(cerateDelProgressInfo(pluginName,'Products'));
  
  markPluginDownloaded(pluginName);

  //检测是否要自动关机
  await checkAutoShutdown();

  return true
}

//请求oss授权
async function requestOssAuth(fileId){
  const {getToken} = require('./config');

  const tokenData = await getToken();

  try {
      const uploadUrl = Constants.uploadUrl + '/users/auth-alioss';
      const response = await axios.get(uploadUrl, {
        family: 4,
        headers: {
            "access-token":tokenData
        },
        params: { fId: fileId }
      })
      // console.log(response.data);
      return response.data;
  } catch (error) {
      // 处理可能出现的错误
      console.error('requestOssAuth error:', error);
      // console.log(error.response);

      if(error.response.status == 403){
        return -403;
      }else if(error.response.status == 429){
        return -429;
      }
      return null
  }

}

async function checkAutoShutdown(){
  const {getSettingValue} = require('./plugin');
  const autoShutdown = await getSettingValue("AutoShutdown");
  console.log("checkAutoShutdown")
  console.log(autoShutdown)
  if(autoShutdown){
    let hasTask = await checkHasTorrentTask();
    console.log(hasTask)
    if(!hasTask){
      //TODO 实现自动关机
      await autoShutdownSystem();
    }
  }
}

async function autoShutdownSystem() {
  const { exec } = require('child_process');
  
  // 定义关机命令
  // 根据操作系统选择关机命令
  let shutdownCommand;
  if (process.platform === 'win32') {
    // Windows
    shutdownCommand = 'shutdown /p /f';
  } else if (process.platform === 'darwin') {
    // macOS
    shutdownCommand = 'osascript -e \'tell app "System Events" to shut down\'';
  } else {
    // Linux 和其他类 Unix 系统
    shutdownCommand = 'shutdown -h now';
  }

  // 执行关机命令
  exec(shutdownCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing shutdown command: ${error}`);
      return;
    }
    console.log(`Auto shutdown command executed: ${stdout}`);
  });
}

// 停止项目的种子
async function stopTorrentByPluginName(pluginName,pluginType) {
  const retTorrent = client.torrents.find((x) => x.pluginName === pluginName && x.pluginType === pluginType)
  if(retTorrent){
    retTorrent.destroy();
  }
}

// 检测是否支持ipv6
async function checkIPv6Support() {

  const { getSettingValue } = require('./plugin');
  const testIpv6 = await getSettingValue("TestIPv6");
  if(!testIpv6){
    return true;
  }

  const { exec } = require('child_process');
  try {
      let command;
      // 根据操作系统选择正确的ping命令
      if (process.platform === 'win32') {
          // Windows平台使用-6参数指定使用IPv6
          command = `ping -n 1 ipv6.starter.top`;
      } else {
          // Unix-like系统默认使用IPv6，如果系统中ping支持
          command = `ping -c 1 ipv6.starter.top`;
      }

      return new Promise((resolve, reject) => {
          exec(command, (error, stdout, stderr) => {
              if (error) {
                  console.error(`Error executing ping: ${error}`);
                  return resolve(false); // 解析或连接失败
              }

              // console.log(stdout);

              return resolve(true);
          });
      });
  } catch (error) {
      console.error('Error during ping execution:', error);
      return false;
  }
}

app.on('before-quit', (event) => {
  if(!app.isQuitting){
    return;
  }

  console.log('before-quit-torrent');
  isAppExited = true;
  client.destroy();
})

// 下载项目 OSS
ipcMain.handle('download-project-oss', async (event, fileId, pluginName) => {
  let downloadInfo = await downloadProjectOss(fileId, pluginName);

  return downloadInfo;
})

// 全局进度状态
let updateProgress = { percent: 0, downloadSpeed: 0, isDownloading: false };

// 123网盘高速下载 更新软件
ipcMain.handle('update-project-pan', async (event) => {
  updateProgress.isDownloading = true;
  updateProgress.percent = 0;
  updateProgress.downloadSpeed = 0;
  
  // 广播下载开始状态
  broadcastProgressChange();
  
  let downloadInfo = await updateFileFrom123Pan({
    progress: (percent, downloadSpeed) => {
      updateProgress.percent = percent;
      updateProgress.downloadSpeed = downloadSpeed;
      
      // 发送进度更新到渲染进程
      event.sender.send('update-download-progress', {
        completed: false,
        percent: percent,
        downloadSpeed: downloadSpeed
      });
      
      // 广播进度变化到所有监听客户端
      broadcastProgressChange();
    }
  });
  
  // 更新完成状态
  updateProgress.isDownloading = false;
  if (downloadInfo.success) {
    updateProgress.percent = 100;
    updateProgress.downloadSpeed = 0;
  }
  
  // 广播最终状态变化
  broadcastProgressChange();
  
  // 返回最终结果
  return {
    completed: downloadInfo.success || false,
    percent: downloadInfo.success ? 100 : updateProgress.percent,
    downloadSpeed: downloadInfo.success ? 0 : updateProgress.downloadSpeed,
    downloadPath: downloadInfo.downloadPath || null,
    error: downloadInfo.error || null
  };
})

// 实时推送下载进度变化
let progressClients = new Set(); // 存储监听进度的客户端

// 注册进度监听客户端
ipcMain.handle('subscribe-update-progress', async (event) => {
  progressClients.add(event.sender);
  
  // 立即发送当前状态
  event.sender.send('update-progress-changed', {
    percent: updateProgress.percent,
    downloadSpeed: updateProgress.downloadSpeed,
    isDownloading: updateProgress.isDownloading
  });
  
  // 监听客户端断开连接
  event.sender.on('destroyed', () => {
    progressClients.delete(event.sender);
  });
  
  return true;
});

// 取消进度监听
ipcMain.handle('unsubscribe-update-progress', async (event) => {
  progressClients.delete(event.sender);
  return true;
});

// 广播进度变化到所有监听客户端
function broadcastProgressChange() {
  const progressData = {
    percent: updateProgress.percent,
    downloadSpeed: updateProgress.downloadSpeed,
    isDownloading: updateProgress.isDownloading
  };
  
  progressClients.forEach(client => {
    if (!client.isDestroyed()) {
      client.send('update-progress-changed', progressData);
    } else {
      progressClients.delete(client);
    }
  });
}

// 123网盘高速下载
ipcMain.handle('download-project-pan', async (event, fileId, pluginName) => {
  let downloadInfo = await downloadProjectPan(fileId, pluginName);

  return downloadInfo;
})

module.exports = {
  initTorrent,
  seed,
  downloadTorrent,
  downloadProjectTorrent,
  downloadResourcesTorrent,
  stopTorrentByPluginName,
  updateTorrentProgress,
  setTorrentState,
  setResTorrentState,
  checkTorrentFileComplete,
  checkIPv6Support,
  downloadResTorrent,
  checkResTorrentFileComplete,
  seedRes
};
