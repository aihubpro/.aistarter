
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
var DecompressZip = require('decompress-zip');
const { countFilesInDirectory, unzipHelper,untarHelper,createZipArchive,createTarArchive } = require('./zip_helper');

const { app, ipcMain } = require('electron')

const {getToken, getUserInfo} = require('./config');
const Constants = require('./constants.js');
const {seed,downloadTorrent,stopTorrentByPluginName} = require('./torrent');

//压缩插件
async function zipPluginCode(pluginName, publicOption) {
  const { getSettingValue } = require('./plugin');

  try {
    const configDirPath = await getSettingValue("RootDirPath");
    const pluginRootPath = path.join(configDirPath, 'Products');
    const pluginPath = path.join(pluginRootPath, pluginName);
    const pluginCodePath = path.join(pluginPath, ".aistarter");

    // 读取 main.json 文件
    const mainJsonPath = path.join(pluginCodePath, 'main.json');
    const mainJsonContent = await fs.promises.readFile(mainJsonPath, 'utf8');
    const userInfo = await getUserInfo();

    let mainJsonData = JSON.parse(mainJsonContent);
    if (userInfo) {
      mainJsonData.author = userInfo.email;
      mainJsonData.version = new Date().toISOString().slice(0, 10);
      if (publicOption) {
        if (publicOption.projectVersion !== "") {
          mainJsonData.version = publicOption.projectVersion;
        }

        if (publicOption.projectTitle !== "") {
          mainJsonData.name = publicOption.projectTitle;
        }
        
        if (publicOption.projectDesc !== "") {
          mainJsonData.description = publicOption.projectDesc;
        }
      }

      // 重新上传去除高速下载标记
      if (mainJsonData.high_speed) {
        delete mainJsonData.high_speed;
      }

      if (mainJsonData.pan_high_speed) {
        delete mainJsonData.pan_high_speed;
      }

      if (!publicOption.noRepack) { // 不重新打包 不读取压缩包大小
        // 获取项目压缩包大小
        let projectZipSize = 0;
        const sharePath = path.join(configDirPath, 'Share');
        // 根据平台选择正确的文件扩展名
        const fileExt = process.platform === 'win32' ? '.zip' : '.tar.gz';
        let archiveFilePath = path.join(sharePath, pluginName + fileExt);
        try {
          const stats = await fs.promises.stat(archiveFilePath);

          projectZipSize = Math.floor(stats.size / 1024);

        } catch (error) {
          console.error(`Error getting file stats for ${archiveFilePath}:`, error);
        }

        mainJsonData.project_zip_size = projectZipSize;
      }

      await fs.promises.writeFile(mainJsonPath, JSON.stringify(mainJsonData, null, 2));
    }

    // 使用 createZipArchive 进行压缩
    const pluginTempPath = path.join(configDirPath, 'Temp', `${pluginName}.zip`);
    const filesToAdd = ['main.json', 'main.js', 'icon.png', pluginName + '.torrent', 'cover.png'];
    
    const sourcePaths = filesToAdd.map(file => ({
      path: path.join(pluginCodePath, file),
      name: file
    }));

    await createZipArchive({
      sourcePaths,
      outputPath: pluginTempPath,
      options: { zlib: { level: 9 } }
    });

    return { filePath: pluginTempPath, mainJson: mainJsonData };
  } catch (error) {
    console.error('Error zipping plugin code:', error.message);
    return false;
  }
}
// async function zipPluginCode(pluginName, publicOption) {
//   const archiver = require('archiver');
//   const { getSettingValue, showLoading } = require('./plugin');

//   try {
//     const configDirPath = await getSettingValue("RootDirPath");
//     const pluginRootPath = path.join(configDirPath, 'Products');
//     const pluginPath = path.join(pluginRootPath, pluginName);
//     const pluginCodePath = path.join(pluginPath, ".aistarter");

//     // 读取 main.json 文件
//     const mainJsonPath = path.join(pluginCodePath, 'main.json');
//     const mainJsonContent = await fs.promises.readFile(mainJsonPath, 'utf8');
//     const userInfo = await getUserInfo();

//     let mainJsonData = JSON.parse(mainJsonContent);
//     if(userInfo){
//       mainJsonData.author = userInfo.email;
//       mainJsonData.version = new Date().toISOString().slice(0, 10);
//       if(publicOption){
//         if(publicOption.projectVersion != ""){
//           mainJsonData.version = publicOption.projectVersion;
//         }

//         if(publicOption.projectTitle != ""){
//           mainJsonData.name = publicOption.projectTitle;
//         }
        
//         if(publicOption.projectDesc != ""){
//           mainJsonData.description = publicOption.projectDesc;
//         }
//       }

//       //重新上传去除高速下载标记
//       if(mainJsonData.high_speed){
//         delete mainJsonData.high_speed;
//       }

//       if(mainJsonData.pan_high_speed){
//         delete mainJsonData.pan_high_speed;
//       }

//       if(!publicOption.noRepack){ // 不重新打包 不读取压缩包大小
//         //获取项目压缩包大小
//         let projectZipSize = 0;
//         const sharePath = path.join(configDirPath, 'Share');
//         let zipFilePath = path.join(sharePath, pluginName + '.zip');
//         try {
//           const stats = await fs.promises.stat(zipFilePath);

//           projectZipSize = Math.floor(stats.size / 1024);

//         } catch (error) {
//           console.error('Error getting file stats:', error);
//         }

//         mainJsonData.project_zip_size = projectZipSize;
//       }

//       await fs.promises.writeFile(mainJsonPath, JSON.stringify(mainJsonData, null, 2));
//     }


//     let retMainJson = await new Promise( async (resolve, reject) => {
//         // 创建压缩文件输出流
//         const pluginTempPath = path.join(configDirPath, 'Temp', `${pluginName}.zip`);
//         const output = fs.createWriteStream(pluginTempPath);
//         const archive = archiver('zip', {
//           zlib: { level: 9 } // 设置压缩级别
//         });

//         // 监听事件
//         output.on('close', function () {
//           console.log(archive.pointer() + ' total bytes');
//           console.log('archiver has been finalized and the output file descriptor has closed.');

//           resolve({ filePath: pluginTempPath, mainJson: mainJsonData });
//         });

//         archive.on('warning', function (err) {
//           if (err.code === 'ENOENT') {
//             console.warn(err);
//           } else {
//             throw err;
//           }
//         });

//         archive.on('error', function (err) {
//           throw err;
//         });

//         archive.pipe(output);

//         // 添加文件到压缩包中
//         const filesToAdd = ['main.json', 'main.js', 'icon.png', pluginName + '.torrent', 'cover.png'];
//         for (const file of filesToAdd) {
//           const filePath = path.join(pluginCodePath, file);
//           if (fs.existsSync(filePath)) {
//             archive.file(filePath, { name: file });
//           } else {
//             console.warn(`File ${file} does not exist. Skipping...`);
//           }
//         }

//         // 完成压缩
//         await archive.finalize();
//     });

//     return retMainJson;

//   } catch (error) {
//     console.error('Error zipping plugin code:', error.message);
//     return false;
//   }
// }

async function uploadPluginZip(filePath,mainJson,publicOption){

  const {showLoading, terminalMessage, showMessage,showMessageBox } = require('./plugin');

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

  const uploadUrl = Constants.uploadUrl + '/users/upload-v2';
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

//解压插件
async function unzipPluginCode(zipPath, pluginName) {
  const { getSettingValue } = require('./plugin');

  const configDirPath = await getSettingValue("RootDirPath");
  const pluginRootPath = path.join(configDirPath, 'Products');
  const pluginPath = path.join(pluginRootPath, pluginName);
  const aistarterDir = path.join(pluginPath, '.aistarter');

  const result = await unzipHelper(zipPath, aistarterDir);
  return result ? aistarterDir : null;
}

//压缩项目软件
async function zipPluginProject(pluginName, callbacks) {
  const { getSettingValue } = require('./plugin');
  try {
    const configDirPath = await getSettingValue("RootDirPath");
    const pluginRootPath = path.join(configDirPath, 'Products');
    const pluginPath = path.join(pluginRootPath, pluginName);
    const aistarterDir = path.join(pluginPath, '.aistarter');
    const sharePath = path.join(configDirPath, 'Share');
    let outputFilePath;
    let compressFunction;

    if (process.platform === 'win32') {
      outputFilePath = path.join(sharePath, `${pluginName}.zip`);
      compressFunction = createZipArchive;
    } else {
      outputFilePath = path.join(sharePath, `${pluginName}.tar.gz`);
      compressFunction = createTarArchive;
    }

    // 读取 main.json 文件获取压缩列表
    const mainJsonContent = await fs.promises.readFile(path.join(aistarterDir, 'main.json'));
    const mainJsonData = JSON.parse(mainJsonContent);
    const compressList = mainJsonData.compress_list || [];

    // 准备源路径数组
    const sourcePaths = compressList.map(item => ({
      path: path.join(pluginPath, item),
      name: item
    }));

    // 使用通用压缩函数
    return await compressFunction({
      sourcePaths,
      outputPath: outputFilePath,
      callbacks
    });
  } catch (error) {
    console.error('Plugin compression error:', error);
    return null;
  }
}
// async function zipPluginProject(pluginName, callbacks) {
//   const archiver = require('archiver');
//   const { getSettingValue } = require('./plugin');
//   try {
//     const configDirPath = await getSettingValue("RootDirPath");
//     const pluginRootPath = path.join(configDirPath, 'Products');
//     const pluginPath = path.join(pluginRootPath, pluginName);
//     const aistarterDir = path.join(pluginPath, '.aistarter');

//     //分享的Bt目录
//     const sharePath = path.join(configDirPath, 'Share');
//     // 检查目录是否存在
//     if (!fs.existsSync(sharePath)) {
//       // 目录不存在，创建它
//       fs.mkdirSync(sharePath, { recursive: true }); // recursive选项确保可以创建多级目录
//       console.log('Share directory created successfully.');
//     }

//     const outputZipPath = path.join(sharePath, `${pluginName}.zip`);
//     if (fs.existsSync(outputZipPath)) {
//       // 如果文件存在，先移除
//       fs.unlinkSync(outputZipPath);
//       console.log('Existing zip file removed successfully.');
//     }

//     const output = fs.createWriteStream(outputZipPath);
//     const archive = archiver('zip', {
//       zlib: { level: 9 } // 设置压缩级别
//     });

//     // 监听事件
//     output.on('close', function () {
//       console.log(archive.pointer() + ' total bytes');
//       console.log('archiver has been finalized and the output file descriptor has closed.');
//       if(callbacks.close){
//         callbacks.close(archive.pointer());
//       }
//     });

//     let totalFiles = 0;
//     let countFileFinished = false; //统计文件数量完成

//     archive.on('warning', function (err) {
//       if(callbacks.warning){
//         callbacks.warning(err);
//       }
//       if (err.code === 'ENOENT') {
//         console.warn(err);
//       } else {
//         throw err;
//       }
//     });

//     archive.on('error', function (err) {
//       throw err;
//     });

//     archive.on('progress', function (progress) {
//       if(countFileFinished){
//         // 计算百分比
//         let percentComplete = totalFiles >  0 ? (progress.entries.processed / totalFiles) * 100 : 0;
//         percentComplete = percentComplete.toFixed(2);
        
//         // console.log(`Compression progress: ${percentComplete}%`);
//         if(callbacks.progress){
//           callbacks.progress(percentComplete);
//         }
//       }

//     });
    
//     archive.pipe(output);

//     // 读取 main.json 文件
//     const mainJsonContent = await fs.promises.readFile(path.join(aistarterDir, 'main.json'));
//     const mainJsonData = JSON.parse(mainJsonContent);

//     // 遍历压缩列表
//     const compressList = mainJsonData.compress_list || [];

//     for (const item of compressList) {
//       const itemPath = path.join(pluginPath, item);

//       // 使用 fs.promises.stat 异步获取文件状态
//       try {
//         const stat = await fs.promises.stat(itemPath);

//         if (stat.isDirectory()) {
//           // 添加目录下的所有文件，跳过软链接
//           archive.directory(itemPath, item, (entry) => {
//             try {
//               const fullPath = path.join(itemPath, entry.name);
//               const entryStat = fs.lstatSync(fullPath);
//               // 必须返回 entry 对象或 false
//               return entryStat.isSymbolicLink() ? false : entry;
//             } catch (error) {
//               console.error('Error checking symlink:', error);
//               return false;
//             }
//           });
//           totalFiles += await countFilesInDirectory(itemPath);

//           console.log(totalFiles);
//         } else if (stat.isFile()) {
//           // 添加文件
//           archive.file(itemPath, { name: item });
//           totalFiles++;
//         }

//       } catch (error) {
//         console.error('Error getting file stats:', error);
//       }
//     }

//     console.log("File total count:" + totalFiles);
//     countFileFinished = true;

//     // 完成压缩
//     await archive.finalize();

//     console.log(`Compression completed. Output path: ${outputZipPath}`);
//     return outputZipPath;
//   } catch (error) {
//     console.error('Compression error:', error);
//     return null;
//   }
// }

//解压项目
async function unzipPluginProject(pluginName, callbacks = {}) {
  const { getSettingValue } = require('./plugin');

  const configDirPath = await getSettingValue("RootDirPath");
  const pluginRootPath = path.join(configDirPath, 'Products');
  const pluginPath = path.join(pluginRootPath, pluginName);
  const sharePath = path.join(configDirPath, 'Share');
  let filePath;
  let unzipFunction;

  if (process.platform === 'win32') {
    filePath = path.join(sharePath, pluginName + '.zip');
    unzipFunction = unzipHelper;
  } else {
    filePath = path.join(sharePath, pluginName + '.tar.gz');
    unzipFunction = untarHelper;
  }

  return await unzipFunction(filePath, pluginPath, callbacks);
}

// 在主进程中监听渲染进程的run事件
ipcMain.handle('zip-plugin-code', async (event, pluginName, publicOption) => {
  const {showLoading, showMessage, showMessageBox} = require('./plugin');

  stopTorrentByPluginName(pluginName);
  if(!publicOption.noRepack){ // 不重新打包
    showLoading(true, "正在打包项目...");

    // 打包AI项目
    const callbacks = {
      progress: (progress) => {
        // console.log('Compression progress:', progress);
        showLoading(true, "正在打包项目 " + progress + "%");
      }
    };
    let filePath = await zipPluginProject(pluginName, callbacks);
    if(!filePath){
      showLoading(false);
      // showMessage("打包项目失败！");
      showMessageBox("提示", "打包项目失败！");
      return false;
    }

    showLoading(true, "正在生成种子文件...");
    let torrentPath = await seed(pluginName);
    if(!torrentPath){
      showLoading(false);
      // showMessage("生成种子文件失败！");
      showMessageBox("提示", "生成种子文件失败！");
      return false;
    }
  }

  showLoading(true, "正在打包脚本...");
  let ret = await zipPluginCode(pluginName, publicOption);
  if(!ret){
    showLoading(false);
    // showMessage("打包脚本失败！");
    showMessageBox("提示", "打包脚本失败！");
    return false;
  }

  showLoading(false);

  return true;

  // uploadPluginZip(ret.filePath, ret.mainJson, publicOption);
   
});

// 上传插件
ipcMain.handle('zip-plugin-code-upload', async (event, pluginName, publicOption) => {

  const { getSettingValue, showMessageBox } = require('./plugin');

  try {
    const configDirPath = await getSettingValue("RootDirPath");
    const pluginRootPath = path.join(configDirPath, 'Products');
    const pluginPath = path.join(pluginRootPath, pluginName);
    const pluginCodePath = path.join(pluginPath, ".aistarter");

    // 读取 main.json 文件
    const mainJsonPath = path.join(pluginCodePath, 'main.json');
    const mainJsonContent = await fs.promises.readFile(mainJsonPath, 'utf8');
    const mainJsonData = JSON.parse(mainJsonContent);

    const pluginTempPath = path.join(configDirPath, 'Temp', `${pluginName}.zip`);

    if (!fs.existsSync(pluginTempPath)) {
      showMessageBox("提示", "上传失败！找不到打包的脚步zip！");
      console.error('can not find zip:', pluginTempPath);
      return false;
    }

    uploadPluginZip(pluginTempPath, mainJsonData, publicOption);

    return true;

  }catch(error){
    console.error('upload plugin error:', error);
    return false;
  }

})

module.exports = {
  zipPluginCode,
  unzipPluginCode,
  zipPluginProject,
  unzipPluginProject,
  uploadPluginZip,
  countFilesInDirectory
};
