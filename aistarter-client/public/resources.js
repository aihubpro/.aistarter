//TODO 模型、工作流、插件相关的代码写在这里
const { ipcMain,dialog } = require('electron');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const FormData = require('form-data');
const url = require('url'); // 用于解析 URL
const axios = require('axios');
var DecompressZip = require('decompress-zip');
const StreamZip = require('node-stream-zip');
const Constants = require('./constants.js');
const { exec } = require('child_process');
const util = require('util');

const {getUserInfo} = require('./config');
const {countFilesInDirectory} = require('./zip')
const {updateTorrentProgress,setResTorrentState,stopTorrentByPluginName,downloadResTorrent,checkResTorrentFileComplete,seedRes} = require('./torrent');
const { getSettingValue,markResourcesDownloaded} = require('./plugin');
const {getAllDisAndFiles} = require('./project')
let projectTorrentTask = []; //项目下载任务 [{"type":"project", "name":"ComflyUI"}] 
let isProjectTorrneted = false; //是否正在下载项目
// 插件安装标记文件名
const installLockFileName = 'install.lock';
// 下载标记文件
const downloadLockFileName = 'download.lock';
//标记文件完整
const packageLockFileName = 'package.lock';
const {
  copyFileWithProgress,
  getDirFileCount,
  copyDir,
  getFileStatsAsync
} = require('./project')


//压缩插件
async function zipResourcesCode(resName,resType, publicOption) {
  const archiver = require('archiver');
  const {configDirPath,pluginPath} = await getResourceFilePath(resName, resType);
  try {
    const pluginCodePath = path.join(pluginPath, ".aistarter");

    // 读取 main.json 文件
    const mainJsonPath = path.join(pluginCodePath, 'main.json');
    const mainJsonContent = await fs.promises.readFile(mainJsonPath, 'utf8');
    const userInfo = await getUserInfo();

    let mainJsonData = JSON.parse(mainJsonContent);
    if(userInfo){
      mainJsonData.author = userInfo.email;
      mainJsonData.version = new Date().toISOString().slice(0, 10);
      if(publicOption){
        if(publicOption.projectVersion != ""){
          mainJsonData.version = publicOption.projectVersion;
        }

        if(publicOption.projectTitle != ""){
          mainJsonData.name = publicOption.projectTitle;
        }
        
        if(publicOption.projectDesc != ""){
          mainJsonData.description = publicOption.projectDesc;
        }
      }

      //重新上传去除高速下载标记
      if(mainJsonData.high_speed){
        delete mainJsonData.high_speed;
      }

      if(mainJsonData.pan_high_speed){
        delete mainJsonData.pan_high_speed;
      }

      if(!publicOption.noRepack){ // 不重新打包 则不更新压缩包大小
        //获取项目压缩包大小
        let projectZipSize = 0;
        const sharePath = path.join(configDirPath, 'Share',resType);
        let zipFilePath = path.join(sharePath, resName + '.zip');
        try {
          const stats = await fs.promises.stat(zipFilePath);

          projectZipSize = Math.floor(stats.size / 1024);

        } catch (error) {
          console.error('Error getting file stats:', error);
        }

        mainJsonData.project_zip_size = projectZipSize;
      }

      await fs.promises.writeFile(mainJsonPath, JSON.stringify(mainJsonData, null, 2));
    }


    let retMainJson = await new Promise( async (resolve, reject) => {
        //检测temp目录是否存在
        const tempDirPath = path.join(configDirPath, 'Temp', resType);
        if (!fs.existsSync(tempDirPath)){
          fs.mkdirSync(tempDirPath, { recursive: true });
        }
        // 创建压缩文件输出流
        const pluginTempPath = path.join(configDirPath, 'Temp', resType,`${resName}.zip`);

        const output = fs.createWriteStream(pluginTempPath);
        const archive = archiver('zip', {
          zlib: { level: 9 } // 设置压缩级别
        });

        // 监听事件
        output.on('close', function () {
          console.log(archive.pointer() + ' total bytes');
          console.log('archiver has been finalized and the output file descriptor has closed.');

          resolve({ filePath: pluginTempPath, mainJson: mainJsonData });
        });

        archive.on('warning', function (err) {
          if (err.code === 'ENOENT') {
            console.warn(err);
          } else {
            throw err;
          }
        });

        archive.on('error', function (err) {
          throw err;
        });

        archive.pipe(output);

        // 添加文件到压缩包中
        const filesToAdd = ['main.json', 'icon.png', resName + '.torrent', 'cover.png'];
        for (const file of filesToAdd) {
          const filePath = path.join(pluginCodePath, file);
          if (fs.existsSync(filePath)) {
            archive.file(filePath, { name: file });
          } else {
            console.warn(`File ${file} does not exist. Skipping...`);
          }
        }

        // 完成压缩
        await archive.finalize();
    });

    return retMainJson;

  } catch (error) {
    console.error('Error zipping plugin code:', error.message);
    return false;
  }
}

async function downloadRes(urlStr, options, callbacks) {
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
//获取市场(模型，插件，工作流)信息
async function getResInfo(fileId, isTemp = false){
  const {getToken} = require('./config');
  const tokenData = await getToken();

  try {
      let uploadUrl = Constants.uploadUrl + '/users/market-res-info';
      if(isTemp){
        uploadUrl = Constants.uploadUrl + '/users/market-resource-info-review';
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
      console.error('Res info error:', error);
      return null
  }
}
//下载脚本
async function downloadResScript(fileId, options){

  const { terminalMessage,showMessage} = require('./plugin');

  const {tmpRootPath} = await getResourceFilePath(options.resName,options.resType);
  //判断tmpRootPath是否存在
  if(!fs.existsSync(tmpRootPath)){
    fs.mkdirSync(tmpRootPath,{recursive:true}); // 递归创建目录
  }
  const {getToken} = require('./config');
  const tokenData = await getToken();
  // 示例用法
  let url = Constants.uploadUrl + '/users/download-res/' + fileId;
  if(options.isTemp){
    url = Constants.uploadUrl + '/users/download-res-temp/' + fileId;
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

  let filePath = await downloadRes(url, tmpOptions, callbacks);
  if(filePath){
    showMessage("下载脚本成功！");
  }

  return filePath;
}
//解压插件
async function unzipResourcesCode(zipPath, options) {
  const {pluginPath} = await getResourceFilePath(options.resName, options.resType);
  const aistarterDir = path.join(pluginPath, '.aistarter');

  const {unzipHelper} = require('./zip_helper');
  const result = await unzipHelper(zipPath, aistarterDir);
  
  return result ? aistarterDir : null;
}

//压缩项目软件
async function zipResourcesProject(resName,resType, callbacks) {
  const archiver = require('archiver');
  const {configDirPath,pluginPath} = await getResourceFilePath(resName,resType);
  try {
    const aistarterDir = path.join(pluginPath, '.aistarter');

    //分享的Bt目录
    const sharePath = path.join(configDirPath, 'Share',resType);
    // 检查目录是否存在
    if (!fs.existsSync(sharePath)) {
      // 目录不存在，创建它
      fs.mkdirSync(sharePath, { recursive: true }); // recursive选项确保可以创建多级目录
      console.log('Share directory created successfully.');
    }

    const outputZipPath = path.join(sharePath, `${resName}.zip`);
    if (fs.existsSync(outputZipPath)) {
      // 如果文件存在，先移除
      fs.unlinkSync(outputZipPath);
      console.log('Existing zip file removed successfully.');
    }

    const output = fs.createWriteStream(outputZipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // 设置压缩级别
    });

    // 监听事件
    output.on('close', function () {
      console.log(archive.pointer() + ' total bytes');
      console.log('archiver has been finalized and the output file descriptor has closed.');
      if(callbacks.close){
        callbacks.close(archive.pointer());
      }
    });

    let totalFiles = 0;
    let countFileFinished = false; //统计文件数量完成

    archive.on('warning', function (err) {
      if(callbacks.warning){
        callbacks.warning(err);
      }
      if (err.code === 'ENOENT') {
        console.warn(err);
      } else {
        throw err;
      }
    });

    archive.on('error', function (err) {
      throw err;
    });

    archive.on('progress', function (progress) {
      if(countFileFinished){
        // 计算百分比
        let percentComplete = totalFiles >  0 ? (progress.entries.processed / totalFiles) * 100 : 0;
        percentComplete = percentComplete.toFixed(2);
        
        // console.log(`Compression progress: ${percentComplete}%`);
        if(callbacks.progress){
          callbacks.progress(percentComplete);
        }
      }

    });
    
    archive.pipe(output);

    // 读取 main.json 文件
    const mainJsonContent = await fs.promises.readFile(path.join(aistarterDir, 'main.json'));
    const mainJsonData = JSON.parse(mainJsonContent);

    // 遍历压缩列表
    const compressList = mainJsonData.compress_list || [];

    for (const item of compressList) {
      const itemPath = path.join(pluginPath, item);

      // 使用 fs.promises.stat 异步获取文件状态
      try {
        const stat = await fs.promises.stat(itemPath);

        if (stat.isDirectory()) {
          // 添加目录下的所有文件
          archive.directory(itemPath, item);
          totalFiles += await countFilesInDirectory(itemPath);

          console.log(totalFiles);
        } else if (stat.isFile()) {
          // 添加文件
          archive.file(itemPath, { name: item });
          totalFiles++;
        }

      } catch (error) {
        console.error('Error getting file stats:', error);
      }
    }

    console.log("File total count:" + totalFiles);
    countFileFinished = true;

    // 完成压缩
    await archive.finalize();

    console.log(`Compression completed. Output path: ${outputZipPath}`);
    return outputZipPath;
  } catch (error) {
    console.error('Compression error:', error);
    return null;
  }
}


//解压项目
async function unzipResourcesProject(resName, resType, callbacks = {}) {
  const {configDirPath,pluginPath} = await getResourceFilePath(resName,resType);
  const sharePath = path.join(configDirPath, 'Share',resType);

  let zipFilePath = path.join(sharePath, resName + '.zip');;
  let extractionPath = pluginPath; //解压的目录

  // 检查目标目录是否存在，不存在则创建
  if (!fs.existsSync(extractionPath)) {
      await fs.promises.mkdir(extractionPath, { recursive: true });
  }
  const {unzipHelper} = require('./zip_helper')
  return await unzipHelper(zipFilePath, extractionPath, callbacks);


}

async function zipOtherCode(resName,resType,publicOption) {
  const {showLoading, showMessage, showMessageBox} = require('./plugin.js');

  stopTorrentByPluginName(resName,resType);
  if(!publicOption.noRepack){ // 不重新打包
    showLoading(true, "正在打包项目...");

    // 打包AI项目
    const callbacks = {
      progress: (progress) => {
        // console.log('Compression progress:', progress);
        showLoading(true, "正在打包项目 " + progress + "%");
      }
    };
    let filePath = await zipResourcesProject(resName,resType, callbacks);
    if(!filePath){
      showLoading(false);
      // showMessage("打包项目失败！");
      showMessageBox("提示", "打包项目失败！");
      return false;
    }

    showLoading(true, "正在生成种子文件...");
    let torrentPath = await seedRes(resName,resType);
    if(!torrentPath){
      showLoading(false);
      // showMessage("生成种子文件失败！");
      showMessageBox("提示", "生成种子文件失败！");
      return false;
    }
  }

  showLoading(true, "正在打包脚本...");
  let ret = await zipResourcesCode(resName,resType, publicOption);
  if(!ret){
    showLoading(false);
    // showMessage("打包脚本失败！");
    showMessageBox("提示", "打包脚本失败！");
    return false;
  }

  showLoading(false);

  return true;

  // uploadResourcesZip(ret.filePath, ret.mainJson, publicOption);
   
}
//获取资源文件路径
async function getResourceFilePath(resName,resType){
  const { getSettingValue} = require('./plugin');
  const configDirPath = await getSettingValue("RootDirPath");
  //项目根目录里的项目文件
  const pluginRootPath = path.join(configDirPath, resType);
  const pluginPath = path.join(pluginRootPath, resName);
  const tmpRootPath = path.join(configDirPath, 'Temp', resType);
  const shareRootPath = path.join(configDirPath, 'Share', resType);
  return {
    configDirPath,
    pluginRootPath,
    pluginPath,
    tmpRootPath,
    shareRootPath
  }
}
//写入install.lock文件
async function writeInstallLockFile(resName, resType,jsonObject) {
    const { pluginPath } = await getResourceFilePath(resName,resType);
    const aistarterPath = path.join(pluginPath, '.aistarter');
    const installLockFilePath = path.join(aistarterPath, installLockFileName);

    try{
        fs.writeFileSync(installLockFilePath, JSON.stringify(jsonObject, null, 2), 'utf-8');
        return true;
    }catch(err){
        console.log(err);
        return false;
    }

}
//读取install.lock文件
async function readInstallLockFile(resName, resType) {
    const {pluginPath} = await getResourceFilePath(resName,resType);
    const aistarterPath = path.join(pluginPath, '.aistarter');
    const installLockFilePath = path.join(aistarterPath, installLockFileName);

    try{
        //install.lock文件不存在，创建一个空的文件
        if (!fs.existsSync(installLockFilePath)) {
            fs.writeFileSync(installLockFilePath, JSON.stringify([]), 'utf-8');
        }
        const data = fs.readFileSync(installLockFilePath, 'utf-8');
        if(data){
            return JSON.parse(data);
        }else{
            return []
        }
    }catch(err){
        console.log(err);
        return false;
    }

}
//软连接 插件 到指定目录
async function createResourceLink(resName,resType,compressList,symlink) {
    const {configDirPath, pluginPath} = await getResourceFilePath(resName,resType)
    const aistarterPath = path.join(pluginPath, '.aistarter');
    const installLockFilePath = path.join(aistarterPath, installLockFileName);
    const { showLoading, showMessage,isAdminUser } = require('./plugin');
    let json = {code:1,msg:'配置成功'};
    let pluginDates = [];
    pluginDates = JSON.parse(compressList);
    showLoading(true, "正在配置...");
    //判断管理员权限
    const isAdmin = await isAdminUser();
    //判断是否是windows系统
    const isWindows = process.platform === 'win32';
    // 软链接模型到指定目录
    async function linkModel(sourcePath, targetPath) {
      try {
          const stats = await fsPromises.stat(sourcePath);

          if (stats.isFile()) {
              // 如果是文件，创建软链接
              const targetFilePath = path.basename(targetPath) === path.basename(sourcePath)
                  ? targetPath
                  : path.join(targetPath, path.basename(sourcePath));
              //判断链接的地方不是同盘 提示用户
              if (isWindows) {
                //Windows系统判断不同盘符
                if (path.parse(sourcePath).root !== path.parse(targetPath).root) {
                  // 如果目标文件已经存在，则跳过
                  if(!fs.existsSync(targetFilePath)) {
                    // 软链接
                    await fsPromises.symlink(sourcePath, targetFilePath);
                    return { code: 1, msg: '文件链接创建成功', data: { sourcePath: sourcePath, targetPath: targetFilePath } };
                  }
                }
              } else {
                // Mac/Linux系统直接创建软链接
                if(!fs.existsSync(targetFilePath)) {
                  await fsPromises.symlink(sourcePath, targetFilePath);
                  return { code: 1, msg: '文件链接创建成功', data: { sourcePath: sourcePath, targetPath: targetFilePath } };
                }
              }
              await fsPromises.link(sourcePath, targetFilePath);
              return { code: 1, msg: '文件链接创建成功', data: { sourcePath: sourcePath, targetPath: targetFilePath } };
          } else if (stats.isDirectory()) {
              // 如果是目录，递归处理子文件和子目录
              const entries = await fsPromises.readdir(sourcePath, { withFileTypes: true });
              const targetDirPath = path.join(targetPath, path.basename(sourcePath));
              //判断有目录就不创建
              if (!fs.existsSync(targetDirPath)) {
                  // 创建目标目录
                  await fsPromises.mkdir(targetDirPath, { recursive: true });
              }
              // 递归处理每个子文件或子目录
              for (const entry of entries) {
                  const childSourcePath = path.join(sourcePath, entry.name);
                  await linkModel(childSourcePath, targetDirPath); // 注意使用 await
              }

              return { code: 1, msg: '目录链接创建成功', data: { sourcePath, targetPath } };
          }
      } catch (err) {
          console.error(`Failed to create symlink: ${err.message}`);
          return { code: 2, msg: '链接创建失败', error: err.message };
      }
    }
    // 软链接插件到指定目录
    async function linkPlugin(sourcePath, targetPath) {
        try {
            const targetFilePath = path.basename(targetPath) === path.basename(sourcePath)
                    ? targetPath
                    : path.join(targetPath, path.basename(sourcePath));
            //如果是文件夹则创建文件夹，如果是文件则创建软链接
            if (fs.statSync(sourcePath).isDirectory()) {
              // 对于目录，使用 mklink /D 命令
              // const command = `mklink /D "${targetPath}" "${sourcePath}"`;
              // mklinkCommands.push(command);
              if (isWindows) {
                fs.symlinkSync(sourcePath, targetFilePath, 'junction');
              } else {
                // Mac/Linux 目录软链接
                await fsPromises.symlink(sourcePath, targetFilePath, 'dir');
              }
              return { code: 1, msg: '目录链接已加入队列', data: { sourcePath, targetPath } };
            }else if(fs.statSync(sourcePath).isFile()){
              //判断链接的地方不是同盘 提示用户
              if (isWindows) {
                //Windows系统判断不同盘符
                if (path.parse(sourcePath).root !== path.parse(targetPath).root) {
                  // 如果目标文件已经存在，则跳过
                  if(!fs.existsSync(targetFilePath)) {
                    // 软链接
                    await fsPromises.symlink(sourcePath, targetFilePath);
                    return { code: 1, msg: '文件链接创建成功', data: { sourcePath: sourcePath, targetPath: targetFilePath } };
                  }
                }
              } else {
                // Mac/Linux系统直接创建软链接
                if(!fs.existsSync(targetFilePath)) {
                  await fsPromises.symlink(sourcePath, targetFilePath);
                  return { code: 1, msg: '文件链接创建成功', data: { sourcePath: sourcePath, targetPath: targetFilePath } };
                }
              }
              await fsPromises.link(sourcePath, targetFilePath);
              return { code: 1, msg: '文件链接创建成功', data: { sourcePath: sourcePath, targetPath: targetFilePath } };
            }
        } catch (err) {
            console.error(`Failed to create symlink: ${err}`);
            return { code: 2, msg: '链接创建失败,权限不足' };
        }
    }
    //递归删除软链接
    async function removeSymlink(sourcePath, targetPath) {
      try {
        const stats = await fsPromises.stat(sourcePath);
        if(stats.isFile()){
          const targetFilePath = path.join(targetPath, path.basename(sourcePath));
          // 如果是文件，创建软链接
          if (fs.existsSync(targetFilePath)) {
            const stats = await fsPromises.lstat(targetFilePath);
            if(stats.isSymbolicLink()){
              await fsPromises.unlink(targetFilePath);
              return { code: 1, msg: '软链接已删除', data: { sourcePath: sourcePath, targetPath: targetPath } };
            }
            const targetStats = await fsPromises.stat(targetFilePath);
            const sourceStats = await fsPromises.stat(sourcePath);
            // 通过比较 dev(设备ID) 和 ino(索引节点号) 来判断是否是同一个文件的硬链接
            if(targetStats.dev === sourceStats.dev && targetStats.ino === sourceStats.ino){
                await fsPromises.unlink(targetFilePath);
                return { code: 1, msg: '硬链接已删除', data: { sourcePath: sourcePath, targetPath: targetPath } };
            }
          }
        }else if (stats.isDirectory()){
          // 如果是目录，递归处理子文件和子目录
          const entries = await fsPromises.readdir(sourcePath, { withFileTypes: true });
          const targetEntryPath = path.join(targetPath, path.basename(sourcePath));
          for (const entry of entries) {
            const entryPath = path.join(sourcePath, entry.name);
            console.log(`entryPath: ${entryPath}, targetEntryPath: ${targetEntryPath}`);
            await removeSymlink(entryPath, targetEntryPath);
          }
        }
      } catch (err) {
          console.error(`Failed to remove symlink: ${err}`);
          return { code: 2, msg: '删除失败,权限不足'};
      }
    }

    try {
        // 判断 install.lock 文件是否存在
        if (!fs.existsSync(installLockFilePath)) {
            await fsPromises.writeFile(installLockFilePath, JSON.stringify([]), 'utf-8');
        }
        // 读取 install.lock 文件
        const data = await fsPromises.readFile(installLockFilePath, 'utf-8');
        let installLockData = []
        if (data) {
            installLockData = JSON.parse(data)
        }
        // 对比 install.lock 文件里的数据与 linkDate 数据, 判断那些数据删除，那些数据添加

        // 将原本软链接的文件删除
        for (const item of installLockData) {
            for (const items of pluginDates) {
                const sourcePath = path.join(pluginPath, items);
                let targetPath = path.join(configDirPath, item.dir);
                //判断item.dir是否是绝对路径
                if (process.platform === 'win32') {
                  // Windows 系统判断绝对路径
                  if (item.dir.startsWith(':',1)) {
                      targetPath = path.join(item.dir);
                  }
                } else {
                  // Mac/Linux 系统判断绝对路径
                  if (item.dir.startsWith('/')) {
                      targetPath = item.dir;
                  }
                }
                // 删除软连接
                if (fs.existsSync(targetPath)) {
                    if(resType == 'Models'){
                      await removeSymlink(sourcePath,targetPath);
                      json = { code: 1, msg: '配置已取消', data: { sourcePath: sourcePath, targetPath: targetPath } };
                    }else{
                      try {
                        const targetStats = await fsPromises.stat(path.join(targetPath,items));
                        const sourceStats = await fsPromises.stat(sourcePath);
                        const targetFilePath = path.join(targetPath, items);
                        if(targetStats.dev === sourceStats.dev && targetStats.ino === sourceStats.ino){
                          await fsPromises.unlink(targetFilePath);
                          json = { code: 1, msg: '配置已取消', data: { sourcePath: sourcePath, targetPath: targetPath } };
                        }
                        if(targetStats.isSymbolicLink()){
                          await fsPromises.unlink(targetFilePath);
                          json = { code: 1, msg: '配置已取消', data: { sourcePath: sourcePath, targetPath: targetPath } };
                        }
                      }catch (err) {
                        console.error(`Failed to remove symlink: ${err}`);
                        json = { code: 2, msg: '删除失败,权限不足' }; 
                      }
                    }
                }
            }
        }

        // 软链接新的文件
        for (const item of JSON.parse(symlink)) {
            for (const items of pluginDates) {
                const sourcePath = path.join(pluginPath, items);
                let targetPath = path.join(configDirPath, item.dir);
                //判断item.dir是否是绝对路径
                if (process.platform === 'win32') {
                  // Windows 系统判断绝对路径
                  if (item.dir.startsWith(':',1)) {
                      targetPath = path.join(item.dir);
                  }
                } else {
                  // Mac/Linux 系统判断绝对路径
                  if (item.dir.startsWith('/')) {
                      targetPath = item.dir;
                  }
                }

                // 检查源路径是否存在
                if (!fs.existsSync(sourcePath)) {
                    console.error(`Source path does not exist: ${sourcePath}`);
                    continue;
                }
                if(resType == 'Models'){
                  //判断链接的地方不是同盘 提示用户
                  if (isWindows) {
                    // Windows 系统判断不同盘符
                    if (path.parse(sourcePath).root !== path.parse(targetPath).root) {
                      if (!isAdmin) {
                        json = { code: 4, msg: `请以管理员权限运行本程序，否则无法创建软链接。` };
                        showLoading(false);
                        return json;  
                      }
                    }
                  } else {
                    // Mac/Linux 系统尝试创建软链接，如果失败则提示权限问题
                    try {
                      await fsPromises.access(path.dirname(targetPath), fs.constants.W_OK);
                    } catch (err) {
                      json = { code: 4, msg: `没有足够的权限创建软链接，请检查目标目录的写入权限。` };
                      showLoading(false);
                      return json;
                    }
                  }
                  await linkModel(sourcePath, targetPath);
                  json = { code: 3, msg: `已成功配置到项目[${targetPath}]`, data: { sourcePath: sourcePath, targetPath: targetPath } };
                }else{
                  if(fs.statSync(sourcePath).isFile()){
                    //判断链接的地方不是同盘 提示用户
                    if (isWindows) {
                      // Windows 系统判断不同盘符
                      if (path.parse(sourcePath).root !== path.parse(targetPath).root) {
                        if (!isAdmin) {
                          json = { code: 4, msg: `请以管理员权限运行本程序，否则无法创建软链接。` };
                          showLoading(false);
                          return json;  
                        }
                      }
                    } else {
                      // Mac/Linux 系统尝试创建软链接，如果失败则提示权限问题
                      try {
                        await fsPromises.access(path.dirname(targetPath), fs.constants.W_OK);
                      } catch (err) {
                        json = { code: 4, msg: `没有足够的权限创建软链接，请检查目标目录的写入权限。` };
                        showLoading(false);
                        return json;
                      }
                    }
                  }
                  await linkPlugin(sourcePath, targetPath);
                  json = { code: 3, msg: `已成功配置到项目[${targetPath}]`, data: { sourcePath: sourcePath, targetPath: targetPath } };
                }
            }
        }
        showLoading(false);
        return json;
    } catch (err) {
        console.error(err);
        return {code:0, msg:err};
    }
}
//删除package.lock文件
async function deletePackageLockFile(resName,resType) {
  const {pluginPath} = await getResourceFilePath(resName,resType)
  const sharePath = path.join(pluginPath, '.aistarter');
  const packageLockPath = path.join(sharePath, packageLockFileName);
  try{
    await fsPromises.unlink(packageLockPath);
    return true;
  }catch (error) {
    console.log(error);
    return false;
  }
}



//加载插件信息
async function loadAllResourcesInfos(resPath){
  const allPluginInfo = [];
  try {
    // 获取 resPath 目录下的所有文件和子目录
    const files = await fs.promises.readdir(resPath, { withFileTypes: true });

    for (const file of files) {
      // 判断是否是目录
      if (file.isDirectory()) {
        const pluginDir = path.join(resPath, file.name);
        const aistarterDir = path.join(pluginDir, '.aistarter');
        const mainJsonFile = path.join(aistarterDir, 'main.json');

        // 检查文件是否存在且非空
        if (fs.existsSync(mainJsonFile) && fs.statSync(mainJsonFile).size > 0) {
          const jsonContent = await fs.promises.readFile(mainJsonFile, 'utf8');
          try {
            const pluginInfo = JSON.parse(jsonContent);
            allPluginInfo.push(pluginInfo);
          } catch (jsonErr) {
            console.error(`Error parsing JSON in ${mainJsonFile}:`, jsonErr);
          }
        }else{
          console.warn(`${mainJsonFile} is empty or does not exist.`);
        }
      }
    }

    return allPluginInfo;
  } catch (error) {
    console.error('Error loading plugin infos:', error);
    return [];
  }
}

// 检查其他插件是否已经安装
async function isResourcesInstalled(resName,resType){
    const {pluginPath} = await getResourceFilePath(resName,resType);

    const curPluginDir = pluginPath

    //插件目录已经存在，加载插件脚本
    const curScriptDir = path.join(curPluginDir, '.aistarter');

    const installLockFilePath = path.join(curScriptDir, installLockFileName);

    if (fs.existsSync(installLockFilePath)) {
      return true;
    }
    return false;
}

// 检查其他是否已经安装
async function isResourcesDownloaded(resName,resType,isFristInit = false){
  const {pluginPath} = await getResourceFilePath(resName,resType);

  const curPluginDir = pluginPath

  //插件目录已经存在，加载插件脚本
  const curScriptDir = path.join(curPluginDir, '.aistarter');

  const downloadLockFilePath = path.join(curScriptDir, downloadLockFileName);

  if (fs.existsSync(downloadLockFilePath)) {
    return true;
  }

  if(!isFristInit){
    return false;
  }

  //兼容已经下载AI项目但是没有生成download.lock文件的
  // 读取 main.json 文件
  const mainJsonContent = await fs.promises.readFile(path.join(curScriptDir, 'main.json'));
  const mainJsonData = JSON.parse(mainJsonContent);

  // 遍历压缩列表
  let allFileZiped = true;
  const compressList = mainJsonData.compress_list || [];
  for (const item of compressList) {
    if(!allFileZiped){
      break;
    }
    const itemPath = path.join(curPluginDir, item);
    try {
        // 获取文件或目录的状态
        const stats = fs.statSync(itemPath);

        if (stats.isFile()) {
            console.log(`${itemPath} 是一个文件`);
        } else if (stats.isDirectory()) {
            console.log(`${itemPath} 是一个目录`);
        } else {
            // console.log(`${itemPath} 不是文件也不是目录`);
            allFileZiped = false;
            break;
        }
    } catch (err) {
        console.error(`Error checking ${itemPath}: ${err}`);
        allFileZiped = false;
        break;
    }
  }

  if(allFileZiped){
    //第一次初始化的时候才兼容
    await markResourcesDownloaded(resName,resType);
    return true;
  }

  return false;
}






async function startResourcesTorrentTask(){
  if(isProjectTorrneted){
    return;
  }

  isProjectTorrneted = true;

  addNextResourcesTorrent();
}

async function addNextResourcesTorrent(){
  if(projectTorrentTask.length <= 0){
    return;
  }

  const curPluginName = projectTorrentTask.shift();
  let type = curPluginName.type
  let name = curPluginName.name

  if(await checkResTorrentFileComplete(name,type)){
    downloadResTorrent(name,type, {done:() => {
      addNextResourcesTorrent();
    }, error:() => {
      addNextResourcesTorrent();
    }})
  }else{
    addNextResourcesTorrent();
  }

}

// 加载所有插件
async function loadAllResources(resType) {
  let pluginInfoList = [];

  // 插件目录路径
  const configDirPath = await getSettingValue("RootDirPath");
  let resPath = null;
  if (configDirPath) {
    resPath = path.join(configDirPath, resType);
  }

  //获取插件信息 TODO或者请求网络
  const pluginAllCfg = await loadAllResourcesInfos(resPath);

  //获取下载或压缩进度
  const progressInfoDic = await updateTorrentProgress();

  // 是否打开开发者
  const isOpenDev = await getSettingValue("OpenDev");

  for (const pluginCfg of pluginAllCfg) {
    let newPluginCfg = Object.assign({}, pluginCfg);
    let installDir = newPluginCfg["install_dir"];

    let curPluginDir = null;
    let curScriptDir = null; //脚本目录
    if (resPath) {
      curPluginDir = path.join(resPath, installDir);
      curScriptDir = path.join(curPluginDir, '.aistarter');
    }

    let isFristInit = false; //是否是第一次初始化
    //检测插件是否已经安装
    if (curPluginDir && fs.existsSync(curPluginDir)) {

      let isDownloaded = await isResourcesDownloaded(installDir,resType,isFristInit);
      if(isDownloaded){
        //插件已下载且解压了
        if(isFristInit){
          //启动继续做种
          projectTorrentTask.push({'type':resType,'name':installDir});          
        }

        const isInstall = await isResourcesInstalled(installDir,resType);
        if (isInstall) {
          //有已安装的标记文件
          newPluginCfg["InstallState"] = 3; ////安装状态：0、未下载，1、已下载压缩包 2、已解压 3、已安装，显示安装
        } else {
          newPluginCfg["InstallState"] = 2;
        }
      }else{
        newPluginCfg["InstallState"] = 0;
        //赋值进度条状态
        let tmpProgressInfo = progressInfoDic[installDir];
        if(tmpProgressInfo){
          newPluginCfg["ProgressInfo"] = { ...tmpProgressInfo };
        }
      }

    } else {
      //未下载,正常不会走这里
      newPluginCfg["InstallState"] = 0;
    }

    // const asarPath = app.isPackaged ? path.join(__dirname, "../app") : '';

    // let iconPathStr = path.join(asarPath, "/icons/" + newPluginCfg["icon"]);
    // newPluginCfg["iconPath"] = iconPathStr;
    const pluginEntryIcon = path.join(curScriptDir, 'icon.png');
    if (fs.existsSync(pluginEntryIcon)) {
      newPluginCfg["iconPath"] = pluginEntryIcon;
    }
    newPluginCfg["install_type"] = resType; //安装类型
    newPluginCfg["openDev"] = isOpenDev;

    pluginInfoList.push(newPluginCfg);
  }

  //开始继续做种
  startResourcesTorrentTask();

  return pluginInfoList;
}



/**
 * 导入项目
 * @param string resName 插件安装目录
 * @param string packagePath 离线包文件路径
 * @param object importOptions 
 * exportOptions.progress(precent) => {}  可选,导入进度回调
 * @returns bool ture表示导入成功
 */
async function importResourcesPackage(resName,resType, packagePath, importOptions) {
  const { showLoading, showMessage } = require('./plugin');
  const path = require('path');

  try {

    const {configDirPath} = await getResourceFilePath(resName,resType);

    const sharePath = path.join(configDirPath, 'Share',resType);
    if (!fs.existsSync(sharePath)) {
      fs.mkdirSync(sharePath, { recursive: true });
    }
    let zipFilePath = path.join(sharePath, resName + '.zip');

    // 将packagePath移动到share目录下
    let copyfile = await copyFileWithProgress(packagePath, zipFilePath)
    if (copyfile) {
      showMessage('项目导入失败:移动目录失败')
      return false
    }

    // //重命名
    // let newName = await fs.rename(zipFilePath, zipFilePath);
    // if (!newName) {
    //     return false;
    // }
    // 解压项目
    let zipOk = await unzipResourcesProject(resName,resType, {
      progress: (percent) => {
        showLoading(true, "正在解压项目 " + percent + "%");
      }
    });

    if (!zipOk) {
      showLoading(false);
      showMessage("项目导入失败:解压项目失败");
      return false;
    } else {
      showLoading(false);
      await markResourcesDownloaded(resName,resType);
      showMessage("项目导入成功");
      // 做种
      if (checkResTorrentFileComplete(resName,resType)) {
        await downloadResTorrent(resName,resType, {
          done: () => {
            //TODO 做种成功
            console.log("做种成功");
          }, error: () => {
            //做种失败
            console.log("做种失败");
          }
        });
      }
    }

    return true


  } catch (error) {
    showMessage("项目导入失败:获取路径失败");
    return false;
  }
}



/**
 * 删除项目
 * 
 * @param string resName 插件安装目录
 * @returns bool true 表示删除成功
 */
async function deleteResources(resName,resType) {

  const { showLoading, showMessage } = require('./plugin');
  showLoading(true, "正在卸载项目...");

  const {configDirPath,pluginPath} = await getResourceFilePath(resName,resType)
  const aistarterPath = path.join(pluginPath, '.aistarter');
  const installLockFilePath = path.join(aistarterPath, installLockFileName);
  const mainJson = path.join(aistarterPath, 'main.json');
  //删除share目录里的相关文件
  const sharePath = path.join(configDirPath, 'Share',resType);
  if (!fs.existsSync(sharePath)) { //如果目录不存在，则创建
    fs.mkdirSync(sharePath, { recursive: true });
  }
  const zipFilePath = path.join(sharePath, resName + '.zip');
  //删除temp目录里的相关文件
  const tempPath = path.join(configDirPath, 'Temp',resType);
  if (!fs.existsSync(tempPath)) { //如果目录不存在，则创建
    fs.mkdirSync(tempPath, { recursive: true });
  }
  const tempPluginPath = path.join(tempPath, resName + '.zip');
  try{
    let pluginDates = [];
    //读取 main.json 文件
    const mainJsonData = await fsPromises.readFile(mainJson, 'utf-8');
    pluginDates = JSON.parse(mainJsonData);
    // 读取 install.lock 文件
    const data = await fsPromises.readFile(installLockFilePath, 'utf-8');
    let installLockData = []
    if (data) {
        installLockData = JSON.parse(data)
    }
    // 对比 install.lock 文件里的数据与 linkDate 数据, 判断那些数据删除，那些数据添加
  
    // 将原本软链接的文件删除
    for (const item of installLockData) {
        for (const items of pluginDates['compress_list']) {
            // 删除软连接
            const targetPath = path.join(configDirPath, item.dir, items);
            if (fs.existsSync(targetPath)) {
                console.log(`Deleting ${targetPath}`);
                await fsPromises.unlink(targetPath);
            }
        }
    }
  }catch (error) {
    console.error('Error:', error);
  }

  // 删除share
  try {
    // 删除文件
    await fsPromises.unlink(zipFilePath);
  } catch (err) {
    console.log(err)
  }
  // 删除temp
  try {
    // 删除文件
    await fsPromises.unlink(tempPluginPath);
  } catch (err) {
    console.log(err)
  }
  // 使用 fs.promises.rm 递归删除目录
  let delfolder = await fsPromises.rm(pluginPath, { recursive: true, force: true });
  if (!delfolder) {
    showLoading(false);
    showMessage('项目卸载成功');
  } else {
    showLoading(false);
    showMessage('项目卸载失败，请手动删除');
  }


  return true;
}

/**
 * 判断项目目录是否被使用
 * @param string resName 插件安装目录
 */
async function checkPluginDirExits(resName, resType) {
  //TODO 判断本地项目的目录是否存在
  const {pluginPath}= await getResourceFilePath(resName, resType);

  return fs.existsSync(pluginPath);
}



/**
 * 创建新的项目(TODO)
 * @param string resName 插件安装目录
 * @param object infoData 描述信息数据
 * @param object scriptData 脚本数据
 * @returns bool 是否创建成功
 */
async function createNewPlugin(resName,resType,infoData){
  const {pluginPath} = await getResourceFilePath(resName, resType);
  const aistarterPath = path.join(pluginPath, '.aistarter');
  const iconPath = path.join(aistarterPath, 'icon.png');
  const jsonPath = path.join(aistarterPath, 'main.json');
  const downLockPath = path.join(aistarterPath, downloadLockFileName);
  const installLockPath = path.join(aistarterPath, installLockFileName);

  //TODO 创建新的项目
  try{
    //判断pluginPath是否存在
    if (!fs.existsSync(pluginPath)) {
      //创建pluginPath
      await fsPromises.mkdir(pluginPath);
    }
    //判断.aistarter 文件是否存在
    if (!fs.existsSync(aistarterPath)) {
      //不存在则创建
      await fsPromises.mkdir(aistarterPath);
    }

    //main.json icon.png
    if(infoData){
      const {icon, ...info} = JSON.parse(infoData);

      //判断是否有icon
      if (icon) {
        //有icon则复制icon到.aistarter/icon.png
        await fsPromises.copyFile(icon, iconPath);
      }
      //判断是否存在download.lock
      if (!fs.existsSync(downLockPath)) {
        //写入download.lock
        await fsPromises.writeFile(downLockPath, '', 'utf8');
      }
      //判断是否存在install.lock
      if (!fs.existsSync(installLockPath)) {
        //写入install.lock
        await fsPromises.writeFile(installLockPath, '', 'utf8');
      }
      //将info写入jsonPath
      await fsPromises.writeFile(jsonPath, JSON.stringify(info, null, 2), 'utf8');
    }
    return true;
  }catch (error) {
    return false;
  }
}


/**
 * 编辑保存文件
 * @param string resName 插件安装目录
 * @param string scriptData 传入文件内容
 * @param string fileName 传入文件名
 */
async function saveScript(resName,resType,scriptData,fileName) {
  const {pluginPath} = await getResourceFilePath(resName,resType);
  const aistarterPath = path.join(pluginPath, '.aistarter');
  const filePath = path.join(aistarterPath,fileName)

  try{
    //将script写入filePath
    await fsPromises.writeFile(filePath, scriptData, 'utf8');
    return true;
  }catch (error) {
    return false;
  }

}

async function importIntegrationPackage(resName,resType, packagePath) {
  const { showLoading } = require('./plugin');
  const {pluginPath} = await getResourceFilePath(resName,resType);
  try {
    showLoading(true, `正在导入整合包 0.00 %`); // 显示进度
    //复制整合包到Products目录下
    const fileCount = await getDirFileCount(packagePath); // 获取源目录文件数量
    await copyDir(packagePath, pluginPath,fileCount);
    showLoading(false);
    return true;
  }catch (error) {
    console.log(error)
    return false;
  }
}

/**
 * 读取.aistarter目录下的文件信息
 * @param string resName 插件安装目录
 * @param string fileName 文件名
 * */
async function readMainJs(resName,resType,fileName) {
  const {pluginPath} = await getResourceFilePath(resName,resType);
  const aistarterPath = path.join(pluginPath, '.aistarter');
  const jsPath = path.join(aistarterPath, fileName);
  try {
    return await fs.readFileSync(jsPath, 'utf-8');
  }catch(e){
    return false;
  }
}

/**
 * 图片导入移动到.aistarter目录下
 */
async function importImageToPlugin(resName,resType, imageFile,imageName) {
  const {pluginPath} = await getResourceFilePath(resName,resType);
  const aistarterPath = path.join(pluginPath, '.aistarter');
  const imageDirPath = path.join(aistarterPath, imageName);

  try {
    await fsPromises.copyFile(imageFile, imageDirPath);
    return true;
  }catch (error) {
    return false;
  }
}
/**
 * 获取.aistarter目录下的指定图片信息
 */
async function getImageInfo(resName,resType, imageName) {
  const {pluginPath} = await getResourceFilePath(resName,resType);
  const aistarterPath = path.join(pluginPath, '.aistarter');
  const imagePath = path.join(aistarterPath, imageName);
  try {
    // 检测图片是否存在
    const stats = await fsPromises.stat(imagePath);
    if (stats.isFile()) {
      return imagePath;
    } else {
      return false;
    }
  }catch (error) {
    return false;
  }
}

/**
 * 删除share目录下的指定压缩包
 */
async function rebuildPluginPackage(resName,resType) {
  const {configDirPath,pluginPath} = await getResourceFilePath(resName,resType);
  const aistarterPath = path.join(pluginPath, '.aistarter');
  //share目录里的相关文件
  const sharePath = path.join(configDirPath, 'Share',resType);
  const zipFilePath = path.join(sharePath, resName + '.zip');
  const zipFilePackagePath = path.join(aistarterPath, packageLockFileName);
  //temp目录里的相关文件
  const tempPath = path.join(configDirPath, 'Temp',resType);
  const tempPluginPath = path.join(tempPath, resName + '.zip');
  try{
    await fsPromises.unlink(zipFilePackagePath);
  }catch (error) {
    console.log(error)
  }
  try {
    await fsPromises.unlink(zipFilePath);
  }catch (error) {
    console.log(error);
  }
  try{
    await fsPromises.unlink(tempPluginPath);
  }catch (error) {
    console.log(error);
  }
  return true;
}

/**
 * 判断share目录下是否存在指定压缩包
 */
async function checkSharePackage(resName,resType) {
  const {configDirPath} = await getResourceFilePath(resName,resType);
  //share目录里的相关文件
  const sharePath = path.join(configDirPath, 'Share',resType);
  const zipFilePath = path.join(sharePath, resName + '.zip');
  if(fs.existsSync(zipFilePath)){
    return 1;
  }else{
    return 0;
  }
}
/**
 * 打包时创建package.lock文件用于判断是否需要重新打包
 * @param string resName 插件安装目录
 */
async function createPluginPackageLock(resName,resType) {
  const { showLoading } = require('./plugin');
  const {shell} = require('electron');
  const {configDirPath,pluginPath} = await getResourceFilePath(resName,resType);
  const sharePath = path.join(configDirPath, 'Share',resType);
  //.aistarter目录里的打包检查文件
  const packagePath = path.join(pluginPath, '.aistarter');
  showLoading(true, `正在生成package.lock文件，请稍后... 0.00 %`); // 显示进度
  try{
    const fileCount = await getDirFileCount(pluginPath);
    let lastHash = await getFileStatsAsync(pluginPath,(dirCount)=>{
      showLoading(true, `正在生成package.lock文件，请稍后... ${((dirCount / fileCount) * 100).toFixed(2)} %`); // 显示进度
    });
    await fsPromises.writeFile(path.join(packagePath, packageLockFileName), lastHash, 'utf8');
    showLoading(false);
    shell.openPath(sharePath);
    return true
  }catch(e){
    console.log(e);
    showLoading(false);
    return false
  }

}
/**
 * 发布前获取package.lock文件内容判断文件是否修改过
 */
async function checkPluginPackageModify(resName,resType) {
  const { showLoading } = require('./plugin');
  const {pluginPath} = await getResourceFilePath(resName,resType);
  //.aistarter目录里的打包检查文件
  const sharePath = path.join(pluginPath, '.aistarter');

  showLoading(true,"正在验证文件... 0.00 %");
  try{
    let packageLockPath = path.join(sharePath, packageLockFileName);
    if(fs.existsSync(packageLockPath)){
      let packageLockContent = await fsPromises.readFile(packageLockPath, 'utf8');
      const fileCount = await getDirFileCount(pluginPath);
      let lastHash = await getFileStatsAsync(pluginPath,(dirCount)=>{
        showLoading(true, `正在验证文件... ${((dirCount / fileCount) * 100).toFixed(2)} %`); // 显示进度
      });
      showLoading(false);
      return packageLockContent == lastHash;
    }else{
      showLoading(false);
      return false;
    }
  }catch(e){
    console.log(e);
    showLoading(false);
    return false;
  }
}

async function uploadResourcesZip(filePath,mainJson,publicOption){
  const {getToken} = require('./config');
  const {showLoading, terminalMessage,showMessageBox } = require('./plugin');

  //文件名
  const fileStream = await fs.promises.readFile(filePath);
  const fileName = path.basename(filePath); // 获取文件名部分
  //图片
  const imageStream = await fs.promises.readFile(publicOption.imagePath);
  const imageFileName = path.basename(publicOption.imagePath);
  
  const formData = new FormData();
  formData.append('file', fileStream, { filename: fileName});
  formData.append('mainJson', JSON.stringify(mainJson)); // 将主要的 JSON 数据作为字符串附加到 FormData 对象中
  formData.append('image', imageStream, {filename:imageFileName});
  formData.append('publicOption', JSON.stringify(publicOption))

  const tokenData = await getToken();

  const uploadUrl = Constants.uploadUrl + '/users/upload-resources'; //上传的地址修改成对应模型，插件，工作流
  axios.post(uploadUrl, formData, {
    family: 4,
    headers: {
        "access-token":tokenData,
        ...formData.getHeaders() // sets the boundary and Content-Type header
    },
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      // event.reply('upload-progress', percentCompleted);
      // console.log(percentCompleted);
      terminalMessage(`upload plugin ${fileName} progress ${percentCompleted}%`);
    }
  }).then(response => {
    console.log(response.data);
    showLoading(false);
    showMessageBox("提示", "项目分享成功！感谢您的付出，助力AI技术普及。");
  }).catch(error => {
    if(error.response){
      console.error(error.response.data.error);
      showMessageBox("提示", "项目分享失败，请检查网络连接或联系技术支持! error:" + error.response.data.error);
    }else{
      console.error(error);
      showMessageBox("提示", "分享失败！服务器错误~");
    }
    
    showLoading(false);
    
  });
}



/*** 前端接口 ***/

//写入install.lock文件
ipcMain.handle('resources-write-install-lock-file', async (event, resName, resType ,jsonObject) => {
    return await writeInstallLockFile(resName, resType ,jsonObject);
})
//读取install.lock文件
ipcMain.handle('resources-read-install-lock-file', async (event, resName, resType) => {
    return await readInstallLockFile(resName, resType);
})

//软链接 插件 到指定目录
ipcMain.handle('resources-link-project', async (event, resName,resType,compressList,symlink) => {
    return await createResourceLink(resName,resType,compressList,symlink);
});
//获取模型插件信息
ipcMain.handle('resources-list-info-model', async (event) => {
    let pluginInfoList = await loadAllResources('Models');
    return pluginInfoList;
})
//获取工作流插件信息
ipcMain.handle('resources-list-info-workflow', async (event) => {
    let pluginInfoList = await loadAllResources('Workflows');
    return pluginInfoList;
})
//获取插件插件信息
ipcMain.handle('resources-list-info-plugin',async (event) => {
    let pluginInfoList = await loadAllResources('Plugins');
    return pluginInfoList;
});
//获取其他信息
ipcMain.handle('resources-list-info-other',async (event) => {
  return [];
});
// 在主进程中监听渲染进程的download事件
ipcMain.on('resources-project-download', (event, resName,resType) => {
  const {downloadResourcesTorrent} = require('./torrent');
  downloadResourcesTorrent(resName,resType);
});
// 暂停或者继续下载
ipcMain.on('resources-torrent-change-state', (event, resName,resType, isStop) => {
  setResTorrentState(resName,resType, isStop)
})
//导入模型
ipcMain.handle('resources-import-package-model', async (event, resName, packagePath) => {
  console.log(packagePath);
  let isImport = await importResourcesPackage(resName,'Models', packagePath, {
    progress: (precent) => {
      console.log("导入进度：" + precent)
    }
  });
  return isImport;
})
//导入插件
ipcMain.handle('resources-import-package-plugin', async (event, resName, packagePath) => {
    console.log(packagePath);
    let isImport = await importResourcesPackage(resName,'Plugins', packagePath, {
        progress: (precent) => {
        console.log("导入进度：" + precent)
        }
    });
    return isImport;
})
//导入工作流
ipcMain.handle('resources-import-package-workflow', async (event, resName, packagePath) => {
    console.log(packagePath);
    let isImport = await importResourcesPackage(resName,'Workflows', packagePath, {
        progress: (precent) => {
        console.log("导入进度：" + precent)
        }
    });
    return isImport;
})

//删除模型
ipcMain.handle('resources-delete-plugin-model', async (event, resName) => {
  return await deleteResources(resName, 'Models');
})
//删除插件
ipcMain.handle('resources-delete-plugin-plugin', async (event, resName) => {
  return await deleteResources(resName, 'Plugins');
})
//删除工作流
ipcMain.handle('resources-delete-plugin-workflow', async (event, resName) => {
  return await deleteResources(resName, 'Workflows');
})
//打开选取目录对话框，并且可以指定初始目录(也就是打开界面展示的目录)
ipcMain.handle('open-directory-dialog', async (event, defaultPath=null) => {
    const { getSettingValue } = require('./plugin');
    const configDirPath = await getSettingValue("RootDirPath");
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      defaultPath: defaultPath?path.join(configDirPath,defaultPath):''
    });
    return result.filePaths;
})
//判断模型目录是否存在
ipcMain.handle('resources-check-plugin-dir-exits-model', async (event, resName) => {
  return await checkPluginDirExits(resName, 'Models');
})
//判断模型目录是否存在
ipcMain.handle('resources-check-plugin-dir-exits-plugin', async (event, resName) => {
  return await checkPluginDirExits(resName, 'Plugins');
})
//判断工作流目录是否存在
ipcMain.handle('resources-check-plugin-dir-exits-workflow', async (event, resName) => {
  return await checkPluginDirExits(resName, 'Workflows');
})
//导入模型
ipcMain.handle('resources-import-integration-model', async (event, resName, packagePath) => {
  return await importIntegrationPackage(resName, 'Models', packagePath);
})
//导入插件
ipcMain.handle('resources-import-integration-plugin', async (event, resName, packagePath) => {
  return await importIntegrationPackage(resName, 'Plugins', packagePath);
})
//导入工作流
ipcMain.handle('resources-import-integration-workflow', async (event, resName, packagePath) => {
  return await importIntegrationPackage(resName, 'Workflows', packagePath);
})
//创建新的模型
ipcMain.handle('resources-create-new-plugin-model', async (event, resName, infoData) => {
  return await createNewPlugin(resName, 'Models', infoData);
})
//创建新的插件
ipcMain.handle('resources-create-new-plugin-plugin', async (event, resName, infoData) => {
  return await createNewPlugin(resName, 'Plugins', infoData);
})
//创建新的工作流
ipcMain.handle('resources-create-new-plugin-workflow', async (event, resName, infoData) => {
  return await createNewPlugin(resName, 'Workflows', infoData);
})

//获取模型信息接口，main.json、图片、图标、是否已经打包 
ipcMain.handle('resources-get-plugin-info-model', async (event, resName) => {
  let pluginInfo = {}
  pluginInfo['mainJson'] = await readMainJs(resName,'Models', 'main.json'); //获取main.json文件内容
  pluginInfo['cover'] = await getImageInfo(resName,'Models', 'cover.png'); //获取封面图
  pluginInfo['icon'] = await getImageInfo(resName,'Models', 'icon.png'); //获取图标
  pluginInfo['isPack'] = await checkSharePackage(resName,'Models'); //判断share目录下是否存在指定压缩包
  return pluginInfo;

})
//获取插件信息接口，main.json、图片、图标、是否已经打包 
ipcMain.handle('resources-get-plugin-info-plugin', async (event, resName) => {
  let pluginInfo = {}
  pluginInfo['mainJson'] = await readMainJs(resName,'Plugins', 'main.json'); //获取main.json文件内容
  pluginInfo['cover'] = await getImageInfo(resName,'Plugins', 'cover.png'); //获取封面图
  pluginInfo['icon'] = await getImageInfo(resName,'Plugins', 'icon.png'); //获取图标
  pluginInfo['isPack'] = await checkSharePackage(resName,'Plugins'); //判断share目录下是否存在指定压缩包
  return pluginInfo;

})
//获取工作流信息接口，main.json、图片、图标、是否已经打包 
ipcMain.handle('resources-get-plugin-info-workflow', async (event, resName) => {
  let pluginInfo = {}
  pluginInfo['mainJson'] = await readMainJs(resName,'Workflows', 'main.json'); //获取main.json文件内容
  pluginInfo['cover'] = await getImageInfo(resName,'Workflows', 'cover.png'); //获取封面图
  pluginInfo['icon'] = await getImageInfo(resName,'Workflows', 'icon.png'); //获取图标
  pluginInfo['isPack'] = await checkSharePackage(resName,'Workflows'); //判断share目录下是否存在指定压缩包
  return pluginInfo;

})
//将图片移动到模型目录
ipcMain.handle('resources-copy-image-to-plugin-model', async (event, resName,imageFile, imageName ) => {
  return await importImageToPlugin(resName,'Models', imageFile, imageName);
})
//将图片移动到插件目录
ipcMain.handle('resources-copy-image-to-plugin-plugin', async (event, resName,imageFile, imageName ) => {
  return await importImageToPlugin(resName,'Plugins', imageFile, imageName);
})
//将图片移动到工作流目录
ipcMain.handle('resources-copy-image-to-plugin-workflow', async (event, resName,imageFile, imageName ) => {
  return await importImageToPlugin(resName,'Workflows', imageFile, imageName);
})
//根据模型名获取该目录下所有文件
ipcMain.handle('resources-get-pluginall-dirs-and-files-model', async (event, resName,onlyDir) => {
  const { getSettingValue } = require('./plugin');
  const configDirPath = await getSettingValue("RootDirPath");
  const pluginRootPath = path.join(configDirPath, 'Models');
  const pluginPath = path.join(pluginRootPath, resName);
  return await getAllDisAndFiles(pluginPath,onlyDir);
})
//根据插件名获取该目录下所有文件
ipcMain.handle('resources-get-pluginall-dirs-and-files-plugin', async (event, resName,onlyDir) => {
  const { getSettingValue } = require('./plugin');
  const configDirPath = await getSettingValue("RootDirPath");
  const pluginRootPath = path.join(configDirPath, 'Plugins');
  const pluginPath = path.join(pluginRootPath, resName);
  return await getAllDisAndFiles(pluginPath,onlyDir);
})
//根据工作流名获取该目录下所有文件
ipcMain.handle('resources-get-pluginall-dirs-and-files-workflow', async (event, resName,onlyDir) => {
  const { getSettingValue } = require('./plugin');
  const configDirPath = await getSettingValue("RootDirPath");
  const pluginRootPath = path.join(configDirPath, 'Workflows');
  const pluginPath = path.join(pluginRootPath, resName);
  return await getAllDisAndFiles(pluginPath,onlyDir);
})
//保存以及编辑脚本信息 模型
ipcMain.handle('resources-save-script-model', async (event, resName, scriptData,fileName) => {
  return await saveScript(resName,'Models', scriptData,fileName)
})
//保存以及编辑脚本信息 插件
ipcMain.handle('resources-save-script-plugin', async (event, resName, scriptData,fileName) => {
  return await saveScript(resName,'Plugins', scriptData,fileName)
})
//保存以及编辑脚本信息 工作流
ipcMain.handle('resources-save-script-workflow', async (event, resName, scriptData,fileName) => {
  return await saveScript(resName, 'Workflows', scriptData,fileName)
})

//创建package.lock文件用于判断文件修改 模型
ipcMain.handle('resources-create-plugin-package-lock-model', async (event, resName) => {
  return await createPluginPackageLock(resName, 'Models');
})
//创建package.lock文件用于判断文件修改 插件
ipcMain.handle('resources-create-plugin-package-lock-plugin', async (event, resName) => {
  return await createPluginPackageLock(resName, 'Plugins');
})
//创建package.lock文件用于判断文件修改 工作流
ipcMain.handle('resources-create-plugin-package-lock-workflow', async (event, resName) => {
  return await createPluginPackageLock(resName, 'Workflows');
})
//删除share目录下的指定压缩包 模型
ipcMain.handle('resources-delete-plugin-package-model', async (event, resName) => {
  return await rebuildPluginPackage(resName,'Models');
})
//删除share目录下的指定压缩包 插件
ipcMain.handle('resources-delete-plugin-package-plugin', async (event, resName) => {
  return await rebuildPluginPackage(resName,'Plugins');
})
//删除share目录下的指定压缩包 工作流
ipcMain.handle('resources-delete-plugin-package-workflow', async (event, resName) => {
  return await rebuildPluginPackage(resName,'Workflows');
})

// 在主进程中监听渲染进程的run事件 打包
ipcMain.handle('resources-zip-plugin-code-model', async (event, resName, publicOption) => {
  return await zipOtherCode(resName,'Models', publicOption)
});
ipcMain.handle('resources-zip-plugin-code-plugin', async (event, resName, publicOption) => {
  return await zipOtherCode(resName,'Plugins', publicOption)
});
ipcMain.handle('resources-zip-plugin-code-workflow', async (event, resName, publicOption) => {
  return await zipOtherCode(resName,'Workflows', publicOption)
});
// 上传插件
ipcMain.handle('resources-zip-plugin-code-upload', async (event, resName,resType, publicOption) => {
  console.log('发布中...')
  switch (resType) {
    case 'model':
      resType = 'Models'
      break;
    case 'plugin':
      resType = 'Plugins'
      break;
    case 'workflow':
      resType = 'Workflows'
  }
  const { showMessageBox } = require('./plugin');

  try {
    const {configDirPath,pluginPath} = await getResourceFilePath(resName,resType)
    const pluginCodePath = path.join(pluginPath, ".aistarter");

    // 读取 main.json 文件
    const mainJsonPath = path.join(pluginCodePath, 'main.json');
    const mainJsonContent = await fs.promises.readFile(mainJsonPath, 'utf8');
    const mainJsonData = JSON.parse(mainJsonContent);

    const pluginTempPath = path.join(configDirPath, 'Temp',resType, `${resName}.zip`);

    if (!fs.existsSync(pluginTempPath)) {
      showMessageBox("提示", "上传失败！找不到打包的脚步zip！");
      console.error('can not find zip:', pluginTempPath);
      return false;
    }

    uploadResourcesZip(pluginTempPath, mainJsonData, publicOption);

    return true;

  }catch(error){
    console.error('upload plugin error:', error);
    return false;
  }

})

//删除package.lock文件 模型
ipcMain.handle('resources-delete-plugin-package-lock-model', async (event, resName) => {
  return await deletePackageLockFile(resName,'Models');
})
//删除package.lock文件 插件
ipcMain.handle('resources-delete-plugin-package-lock-plugin', async (event, resName) => {
  return await deletePackageLockFile(resName, 'Plugins');
})
//删除package.lock文件 工作流
ipcMain.handle('resources-delete-plugin-package-lock-workflow', async (event, resName) => {
  return await deletePackageLockFile(resName, 'Workflows');
})

//获取package.lock文件内容判断文件是否修改 模型
ipcMain.handle('resources-check-plugin-package-modify-model', async (event, resName) => {
  return await checkPluginPackageModify(resName, 'Models');
})
//获取package.lock文件内容判断文件是否修改 插件
ipcMain.handle('resources-check-plugin-package-modify-plugin', async (event, resName) => {
  return await checkPluginPackageModify(resName, 'Plugins');
})
//获取package.lock文件内容判断文件是否修改 插件
ipcMain.handle('resources-check-plugin-package-modify-workflow', async (event, resName) => {
  return await checkPluginPackageModify(resName,'Workflows');
})
// 下载脚本(模型，插件，工作流)
ipcMain.handle('download-script-res', async (event, fileId, options) => {

  const { terminalMessage,showLoading, showMessage} = require('./plugin');

  let pluginName = options.fileName;
  let resType = options.resType;
  const {pluginPath} = await getResourceFilePath(pluginName,resType)
  const aistarterDir = path.join(pluginPath, '.aistarter');

  options.resName = pluginName;
  options.fileName = options.fileName + ".zip";
  let doAction = async () => {
     showLoading(true, "正在下载插件...");
     let filePath = await downloadResScript(fileId, options);
     if(!filePath){
       console.log("下载失败：" + fileId);
       showLoading(false);
       return;
     }

     terminalMessage(`unzip ${options.fileName} ...`);
     showLoading(true, "正在安装插件...");
     let unzipPath = await unzipResourcesCode(filePath, options);
     if(!unzipPath){
       showMessage("解压失败！");
     }

     //解压后更新main.json信息
     //获取应用信息
     let appInfo = await getResInfo(fileId, options.isTemp);
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
  loadAllResources,
  importResourcesPackage,
  deleteResources,
  checkPluginDirExits,
  createNewPlugin,
  readMainJs,
  getImageInfo,
  checkSharePackage,
  importImageToPlugin,
  saveScript,
  createPluginPackageLock,
  rebuildPluginPackage,
  checkPluginPackageModify,
  importIntegrationPackage,
  unzipResourcesProject
};
