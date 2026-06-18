const fs = require('fs');
const path = require('path');

async function seedHelper(client,tagName,tagType,filePath,torrentPath){
  return new Promise((resolve, reject) => {
    // 创建种子 {announce: ['udp://aa.chenzhixiong.cn:3690','ws://aa.chenzhixiong.cn:3690']}
    // 开源版本使用公共 tracker，如需添加自有 tracker 请替换 __URL_PLACEHOLDER__ 为你的地址
    client.seed(filePath, {announce: ['__URL_PLACEHOLDER__']}, (torrent) => {
      console.log('Torrent info hash:', torrent.infoHash);
      console.log('Seeding:', torrent.name);

      //记录插件的名称
      torrent.pluginName = tagName;
      //记录插件的类型
      torrent.pluginType = tagType;

      // 保存种子文件
      const torrentFileName = `${tagName}.torrent`;
      const torrentFilePath = path.join(torrentPath, torrentFileName);
      fs.writeFileSync(torrentFilePath, torrent.torrentFile);

      console.log('Torrent file saved at:', torrentFilePath);

      // 成功生成种子，返回种子地址
      resolve(torrentFilePath);
      
    });

  })
}

async function downTorHelper(client,tagName, tagType,torrentFilePath, options,callbacks, isAppExited){
  return  new Promise((resolve, reject) => {
      client.add(torrentFilePath, options, (torrent) => {
  
          //记录插件的名称
          torrent.pluginName = tagName;
          //记录插件的类型
          torrent.pluginType = tagType
  
          // 监听下载进度
          torrent.on('download', (bytes) => {
              // console.log('just downloaded: ' + bytes)
              // console.log('total downloaded: ' + torrent.downloaded)
              // console.log('download speed: ' + torrent.downloadSpeed)
              // console.log('progress: ' + torrent.progress)
              if (!isAppExited && callbacks.progress && torrent.progress < 1) {
                const percent = (torrent.progress * 100).toFixed(0);
                callbacks.progress(percent, torrent.downloadSpeed, torrent.numPeers);
                // console.log(pluginName + "  numPeers:====>" + torrent.numPeers)
              }
          });
  
          torrent.on('error', function (err) {
              console.log("torrent error!!")
              console.log(err)
              if (callbacks.error) {
                callbacks.error(err);
              }
              reject(null);
          });
  
          // 监听下载完成事件
          torrent.on('done', () => {
              if (callbacks.done) {
                callbacks.done();
              }
              resolve(torrent);
          });
  
          // // 开始下载
          // torrent.resume();
      });
  
    });
  
}

async function checkTorrentFileCompletePublic(zipFilePath,mainJsonData){
    const stats = await fs.promises.stat(zipFilePath);

    let projectZipSize = Math.floor(stats.size / 1024);

    if(mainJsonData && mainJsonData.project_zip_size == projectZipSize){
      return true;
    }else{
      return false;
    }
}

// 创建进度条信息
function createProgressInfo(highSpeed = false){
  let progressInfo = {};
  progressInfo.progressType = 1; //进度条类型 1、下载进度 2、解压进度 3、清除进度条 4、下载准备 5、开始解压
  progressInfo.progress = 0;
  progressInfo.downloadSpeed = 0;
  progressInfo.downloadStop = false;
  progressInfo.numPeers = 0;
  progressInfo.isHighSpeed = highSpeed; //是否是高速下载
  return progressInfo;
}

// 创建下载进度信息
function cerateDownloadProgressInfo(pluginName,pluginType, parent, downloadSpeed,numPeers, isStop = false, highSpeed = false){
  let progressInfo = createProgressInfo(highSpeed);
  progressInfo.pluginName = pluginName;
  progressInfo.pluginType = pluginType; //插件类型用来区分项目，模型，插件，工作流
  progressInfo.progressType = 1; //进度条类型 1、下载进度 2、解压进度 3、清除进度条 4、下载准备 5、开始解压
  progressInfo.progress = Number(parent);
  progressInfo.downloadSpeed = downloadSpeed;
  progressInfo.numPeers = numPeers;
  progressInfo.downloadStop = isStop; //是否暂停下载
  return progressInfo;
}

// 创建下载准备（恢复下载）
function ceratePrepareProgressInfo(pluginName,pluginType, highSpeed = false){
  let progressInfo = createProgressInfo(highSpeed);
  progressInfo.pluginName = pluginName;
  progressInfo.pluginType = pluginType; //插件类型用来区分项目，模型，插件，工作流
  progressInfo.progressType = 4; //进度条类型 1、下载进度 2、解压进度 3、清除进度条 4、下载准备 5、开始解压
  return progressInfo;
}

// 创建清除进度条信息
function cerateDelProgressInfo(pluginName,pluginType){
  let progressInfo = createProgressInfo();
  progressInfo.pluginName = pluginName;
  progressInfo.pluginType = pluginType; //插件类型用来区分项目，模型，插件，工作流
  progressInfo.progressType = 3; //进度条类型 1、下载进度 2、解压进度 3、清除进度条 4、下载准备 5、开始解压
  return progressInfo;
}

// 创建解压准备
function ceratePrepareZipnfo(pluginName,pluginType){
  let progressInfo = createProgressInfo();
  progressInfo.pluginName = pluginName;
  progressInfo.pluginType = pluginType; //插件类型用来区分项目，模型，插件，工作流
  progressInfo.progressType = 5; //进度条类型 1、下载进度 2、解压进度 3、清除进度条 4、下载准备 5、开始解压
  return progressInfo;
}
// 创建解压进度
function cerateUnZipProgressInfo(pluginName, pluginType, parent){
  let progressInfo = createProgressInfo();
  progressInfo.pluginName = pluginName;
  progressInfo.pluginType = pluginType; //插件类型用来区分项目，模型，插件，工作流
  progressInfo.progressType = 2; //进度条类型 1、下载进度 2、解压进度 3、清除进度条 4、下载准备 5、开始解压
  progressInfo.progress = Number(parent);
  return progressInfo;
}

module.exports = {
  seedHelper, // 创建种子，公用代码
  downTorHelper, // 下载种子，公用代码
  checkTorrentFileCompletePublic, // 检测文件下载完成，公用代码
  cerateDownloadProgressInfo, // 创建下载进度信息
  ceratePrepareProgressInfo, // 创建下载准备（恢复下载）
  cerateDelProgressInfo, // 创建清除进度条信息
  ceratePrepareZipnfo, // 创建解压准备
  cerateUnZipProgressInfo, // 创建解压进度
}