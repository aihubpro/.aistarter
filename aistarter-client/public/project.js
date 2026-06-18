
const { app, ipcMain } = require('electron');
const fs = require('fs');
const fsPromises = require('fs').promises;
const crypto = require('crypto');
const path = require('path');
const os = require('os');
const sharp = require('sharp'); // 用于图片处理
const ProgressStream = require('progress-stream');
const axios = require('axios');
const Constants = require('./constants.js');


let pluginInstances = {}; //保存所有插件的实例

// 复制文件并显示进度条
async function copyFileWithProgress(source, target) {
  try {
    // 检查文件是否存在
    if (fs.existsSync(target)) {
      // 文件已存在，删除
      await fsPromises.unlink(target);
    }
    

    const { showLoading, showMessage } = require('./plugin');
    // 获取源文件大小
    const stats = await fsPromises.stat(source);
    const fileSize = stats.size;

    // 创建读取流和写入流
    const readStream = fs.createReadStream(source);
    const writeStream = fs.createWriteStream(target);

    // 创建进度条流
    const progress = ProgressStream({
      length: fileSize,
      time: 100, // 更新间隔（毫秒）
    });

    // 监听进度事件
    progress.on('progress', (progressData) => {
      showLoading(true, "正在导入项目 " + progressData.percentage.toFixed(2) + "%")
    });

    // 将读取流管道到进度条流，再管道到写入流
    readStream.pipe(progress).pipe(writeStream);

    // 等待写入流结束
    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => {
        // console.log('\n文件复制完成。');
        // showLoading(false)
        resolve();
      });
      writeStream.on('error', (err) => {
        showLoading(false)
        reject(err);
      });
    });
  } catch (err) {
    console.error(`复制文件时发生错误: ${err.message}`);
  }
}

/**
 * 导入项目
 * @param string pluginName 插件安装目录
 * @param string packagePath 离线包文件路径
 * @param object importOptions 
 * exportOptions.progress(precent) => {}  可选,导入进度回调
 * @returns bool ture表示导入成功
 */
async function importProjectPackage(pluginName, packagePath, importOptions) {
  //TODO 实现项目导入，1、复制zip包到Share目录做种 2、解压项目到对应的pluginName目录
  // //做种代码参考，（将压缩包复制到Share才做种）
  // const {downloadTorrent, checkTorrentFileComplete} = require('./torrent');

  // if(await checkTorrentFileComplete(pluginName)){
  //   downloadTorrent(curPluginName, {done:() => {
  //     //TODO 做种成功
  //   }, error:() => {
  //     //做种失败
  //   }})
  // }
  // //获取目录路径参考代码
  // const { getSettingValue, markPluginDownloaded } = require('./plugin');
  // const configDirPath = await getSettingValue("RootDirPath");
  // const pluginRootPath = path.join(configDirPath, 'Products');
  // const pluginPath = path.join(pluginRootPath, pluginName);
  // const sharePath = path.join(configDirPath, 'Share');
  // let zipFilePath = path.join(sharePath, pluginName + '.zip');
  // //解压项目参考
  // const { unzipPluginProject } = require('./zip')
  // let zipOk = await unzipPluginProject(pluginName, {
  //   progress: (precent) => {
  //     showLoading(true, "正在解压项目 " + precent + "%");
  //   }
  // });
  // if (!zipOk) {
  //   showMessage("导入目录失败！");
  // }
  const { showLoading, showMessage } = require('./plugin');
  const { getSettingValue, markPluginDownloaded } = require('./plugin');
  const { downloadTorrent, checkTorrentFileComplete } = require('./torrent');
  const { unzipPluginProject } = require('./zip');
  const path = require('path');

  try {
    // showLoading(true, "正在导入项目...");
    // await delayTime(5000);

    const configDirPath = await getSettingValue("RootDirPath");

    const pluginRootPath = path.join(configDirPath, 'Products');
    const pluginPath = path.join(pluginRootPath, pluginName);

    const sharePath = path.join(configDirPath, 'Share');
    let zipFilePath = process.platform === 'win32' 
    ? path.join(sharePath, pluginName + ".zip")
    : path.join(sharePath, pluginName + ".tar.gz");

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
    let zipOk = await unzipPluginProject(pluginName, {
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
      await markPluginDownloaded(pluginName);
      showMessage("项目导入成功");
      // 做种
      if (checkTorrentFileComplete(pluginName)) {
        await downloadTorrent(pluginName, {
          done: () => {
            //TODO 做种成功
            console.log("做种成功");
          }, error: () => {
            //做种失败
            console.log("做种失败");
          }
        })
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
 * @param string pluginName 插件安装目录
 * @returns bool true 表示删除成功
 */
async function deleteProject(pluginName) {
  //TODO 1、删除Products目录下下对应的pluginName目录 2、移除插件 3、重新请求列表

  // 移除插件参考
  const { deletePlugin } = require('./plugin');
  await deletePlugin(pluginName);

  const { showLoading, showMessage } = require('./plugin');
  showLoading(true, "正在卸载项目...");
  // await delayTime(5000);

  const { getSettingValue } = require('./plugin');
  const configDirPath = await getSettingValue("RootDirPath");
  //删除项目根目录里的项目文件
  const pluginRootPath = path.join(configDirPath, 'Products');
  const pluginPath = path.join(pluginRootPath, pluginName);
  //删除share目录里的相关文件
  const sharePath = path.join(configDirPath, 'Share');
  const zipFilePath = process.platform === 'win32' 
  ? path.join(sharePath, pluginName + ".zip")
  : path.join(sharePath, pluginName + ".tar.gz");
  //删除temp目录里的相关文件
  const tempPath = path.join(configDirPath, 'Temp');
  const tempPluginPath = path.join(tempPath, pluginName + '.zip');

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
 * @param string pluginName 插件安装目录
 */
async function checkPluginDirExits(pluginName) {
  //TODO 判断本地项目的目录是否存在
  const { getSettingValue } = require('./plugin');
  const configDirPath = await getSettingValue("RootDirPath");
  const pluginRootPath = path.join(configDirPath, 'Products');
  const pluginPath = path.join(pluginRootPath, pluginName);

  return fs.existsSync(pluginPath);
}

/**
 * 获取目录下所以目录名和文件名
 * @param string sourceDir 源目录
 * @param bool onlyDir 是否只返回目录名
 * @returns array<string> 返回目录名和文件名数组字符串
 */
async function getAllDisAndFiles(sourceDir, onlyDir = false){
  //TODO 获取sourceDir目录下的所有文件名和目录名，onlyDir是true时只返回文件名
  try {
    //判断sourceDir是否是路径
    if (!fs.existsSync(sourceDir)) {
      console.error(`Error reading directory: ${err}`);
      return [];
    }
    const files = await fsPromises.readdir(sourceDir, { withFileTypes: true });

    if (onlyDir) {
      return files.filter(file => file.isDirectory()).map(file => file.name);
    } else {
      return files.map(file => file.name);
    }
  } catch (err) {
    console.error(`Error reading directory: ${err}`);
    return [];
  }
}

/**
 * 获取目录下所有目录名
 * @param string sourceDir 源目录
 * @param number level 深度
 * @param string matchdis 模糊匹配
 * @returns array<string> 返回目录名
 */
async function getAllDis(sourceDir, level = 2, matchdis = '') {
  try {
    if (!fs.existsSync(sourceDir)) {
      console.error(`Error reading directory: ${err}`);
      return [];
    }

    // 使用广度优先搜索(BFS)实现分层遍历
    let result = [];
    let queue = [{path: sourceDir, depth: 0}];
    
    while (queue.length > 0 && level >= 0) {
      let currentLevel = queue.length; // 当前层的节点数
      
      // 处理当前层的所有节点
      for (let i = 0; i < currentLevel; i++) {
        let {path: currentPath, depth} = queue.shift();
        
        const files = await fsPromises.readdir(currentPath, { withFileTypes: true });
        const dirs = files.filter(file => file.isDirectory()).map(file => ({
          name: file.name,
          path: path.join(currentPath, file.name)
        }));
        
        // 如果有匹配条件，进行过滤
        if (matchdis) {
          const matchedDirs = dirs.filter(dir => 
            dir.name.toLowerCase().includes(matchdis.toLowerCase())
          );
          if (matchedDirs.length > 0) {
            // 找到匹配项，返回完整路径
            result.push(...matchedDirs.map(dir => dir.path));
            return result;
          }
        } else {
          result.push(...dirs.map(dir => dir.path));
        }

        // 如果未达到最大深度，将子目录加入队列
        if (depth < level) {
          for (const dir of dirs) {
            queue.push({
              path: dir.path,
              depth: depth + 1
            });
          }
        }
      }
      
      level--;
    }
    
    return result;
    
  } catch (err) {
    console.error(`Error reading directory: ${err}`);
    return [];
  }
}

// 系统路径标准化
function normalizePathForPlatform(pathStr) {
  return process.platform === 'win32' ? path.win32.normalize(pathStr).replace(/\\/g, '\\\\') : path.normalize(pathStr);
}

/**
 * 创建新的项目(TODO)
 * @param string pluginName 插件安装目录
 * @param object infoData 描述信息数据
 * @param object scriptData 脚本数据
 * @returns bool 是否创建成功
 */
async function createNewPlugin(pluginName, infoData, scriptData){
  const { getSettingValue,createTemplateScriptFile } = require('./plugin');
  const configDirPath = await getSettingValue("RootDirPath");
  const pluginRootPath = path.join(configDirPath, 'Products');
  const pluginPath = path.join(pluginRootPath, pluginName);
  const aistarterPath = path.join(pluginPath, '.aistarter');
  const iconPath = path.join(aistarterPath, 'icon.png');
  const jsonPath = path.join(aistarterPath, 'main.json');
  const jsPath = path.join(aistarterPath, 'main.js');
  const downLockPath = path.join(aistarterPath, 'download.lock');
  const installLockPath = path.join(aistarterPath, 'install.lock');

  //获取main脚本初始信息
  const projectScrData = require('./config/project_script_list')
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

      //将info写入jsonPath
      await fsPromises.writeFile(jsonPath, JSON.stringify(info, null, 2), 'utf8');
    }

    //main.js
    if(scriptData){
      //将scriptData写入jsPath
      // await fsPromises.writeFile(jsPath, jsScript, 'utf8');
      // 示例调用
      try {
        scriptData = JSON.parse(scriptData);
        if(scriptData){
          let renderOption = {}
          if(scriptData.automation){
            //渲染选项
            scriptData.catalogMenu.map(item => {
              item.path = normalizePathForPlatform(item.path)
            })
            renderOption.startTime = scriptData.startTime==0?180000:scriptData.startTime;
            renderOption.cmdExecuteDirectory = normalizePathForPlatform(scriptData.cmdExecuteDirectory)
            renderOption.executeCmdFunction = normalizePathForPlatform(scriptData.executeCmdFunction)
            renderOption.endJudgment = scriptData.endJudgment
            renderOption.catalogMenu = scriptData.catalogMenu
            //判断系统类型
            if(process.platform == 'win32'){
              //简单模式下
              await createTemplateScriptFile(
                'templates/main_simple_js_win.tpl', // 模板文件路径
                jsPath, // 保存路径
                renderOption
              );
            }else{
              //简单模式下
              await createTemplateScriptFile(
                'templates/main_simple_js_linux.tpl', // 模板文件路径
                jsPath, // 保存路径
                renderOption
              );
            }
          }else{
            projectScrData.listData.forEach(item => {
              renderOption[item.key] = false;
            })
            scriptData.forEach(item => {
              renderOption[item] = true;
            })
            //判断系统类型
            if(process.platform == 'win32'){
              //专业模式下
              await createTemplateScriptFile(
                'templates/main_custom_js_win.tpl', // 模板文件路径
                jsPath, // 保存路径
                renderOption
              );
            }else{
              //专业模式下
              await createTemplateScriptFile(
                'templates/main_custom_js_linux.tpl', // 模板文件路径
                jsPath, // 保存路径
                renderOption
              );
            }
          }
        }
      } catch (error) {
          console.error('Failed to create the template script file:', error.message);
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
    }
    return true;
  }catch (error) {
    return false;
  }
}


/**
 * 编辑保存文件
 * @param string pluginName 插件安装目录
 * @param string scriptData 传入文件内容
 * @param string fileName 传入文件名
 */
async function saveScript(pluginName,scriptData,fileName) {
  const { getSettingValue } = require('./plugin');
  const configDirPath = await getSettingValue("RootDirPath");
  const pluginRootPath = path.join(configDirPath, 'Products');
  const pluginPath = path.join(pluginRootPath, pluginName);
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
/**
 * 导入整合包
 * 
 * @param string pluginName 插件安装目录
 * @param string packagePath 整合包路径
 * @returns bool true 表示导入成功
 */
//递归获取复制文件夹的文件数量
async function getDirFileCount(dirPath) {
  let count = 0;
  const files = await fsPromises.readdir(dirPath, { withFileTypes: true });
  for (const file of files) {
    const filePath = path.join(dirPath, file.name);
    if (file.isDirectory()) {
      // 如果是目录，则递归获取文件数量
      count += await getDirFileCount(filePath);
    } else {
      // 如果是文件，则计数加1
      count++;
    }
  }
  return count;
}
// 递归地复制文件夹及其内容
async function copyDir(src, dest,fileCount) {
  const { showLoading } = require('./plugin');
  let copyDirCount = 0
  async function recursiveCopy(src, dest) {
    try {
      // 确保目标目录存在
      await fsPromises.mkdir(dest, { recursive: true });
      // 获取源目录内容
      const entries = await fsPromises.readdir(src, { withFileTypes: true });

      for (const entry of entries) {
        const sourcePath = path.join(src, entry.name);
        const destinationPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
          // 如果是目录，则递归复制
          await recursiveCopy(sourcePath, destinationPath);
        } else {
          // 如果是文件，则复制文件
          await fsPromises.copyFile(sourcePath, destinationPath);
          copyDirCount++;
          showLoading(true, `正在导入整合包 ${(copyDirCount / fileCount * 100).toFixed(2)} %`); // 显示进度
        }
      }
    } catch (err) {
      console.error('Error copying directory:', err);
    }
  }

  await recursiveCopy(src, dest);
  return copyDirCount; // 返回最终的 copyDirCount
}
async function importIntegrationPackage(pluginName, packagePath) {
  const { getSettingValue,showLoading, showMessage } = require('./plugin');
  const configDirPath = await getSettingValue("RootDirPath");
  const pluginRootPath = path.join(configDirPath, 'Products');
  const pluginPath = path.join(pluginRootPath, pluginName);
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
 * @param string pluginName 插件安装目录
 * @param string fileName 文件名
 * */
async function readMainJs(pluginName,fileName) {
  const { getSettingValue } = require('./plugin');
  const configDirPath = await getSettingValue("RootDirPath");
  const pluginRootPath = path.join(configDirPath, 'Products');
  const pluginPath = path.join(pluginRootPath, pluginName);
  const aistarterPath = path.join(pluginPath, '.aistarter');
  const jsPath = path.join(aistarterPath, fileName);
  try {
    return await fs.readFileSync(jsPath, 'utf-8');
  }catch(e){
    return false;
  }
}



/**
 * 测试运行项目
 * @param string pluginName 插件安装目录
 */
async function debugRunPlugin(pluginName){

  //创建脚本实例，createPluginInstance
  const { createPluginInstance,deletePlugin,showLoading } = require('./plugin');

  //每次调试运行都调用deletePlugin删除实例，这里删除的是正式运行的实例，避免修改后运行不生效
  await deletePlugin(pluginName);

  //创建实例
  let pluginInstance = await createPluginInstance(pluginName);
  //设置调试模式输出在新窗口显示日志，渲染界面弹出窗口监听on-plugin-terminal-message-{pluginName}, 如：on-plugin-terminal-message-ChatglmCpp
  pluginInstance.isDebugLog = true;

  //将实例记录到pluginInstances用pluinName做键值，后面关闭需要终结进程
  pluginInstances[pluginName] = pluginInstance;
  //调用运行, 对应脚本的方法
  pluginInstance.run();
  showLoading(false)
}

/**
 * 结束测试运行实例（前端终端界面关闭调用）
 */
async function exitPluginInstance(pluginName){
  //获取pluginInstances对应pluginName的实例，调用实例的退出方法exit
  const pluginInstance = pluginInstances[pluginName];
  if (pluginInstance && typeof pluginInstance.exit === 'function') {
    await pluginInstance.exit();
  }
  //删除引用
  delete pluginInstances[pluginName]
}



/**
 * 图片导入移动到.aistarter目录下
 */
async function importImageToPlugin(pluginName, imageFile,imageName) {
  const { getSettingValue } = require('./plugin');
  const configDirPath = await getSettingValue("RootDirPath");
  const pluginRootPath = path.join(configDirPath, 'Products');
  const pluginPath = path.join(pluginRootPath, pluginName);
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
async function getImageInfo(pluginName, imageName) {
  const { getSettingValue } = require('./plugin');
  const configDirPath = await getSettingValue("RootDirPath");
  const pluginRootPath = path.join(configDirPath, 'Products');
  const pluginPath = path.join(pluginRootPath, pluginName);
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
async function rebuildPluginPackage(pluginName) {
  const { getSettingValue } = require('./plugin');
  const configDirPath = await getSettingValue("RootDirPath");
  //项目根目录里的项目文件
  const pluginRootPath = path.join(configDirPath, 'Products');
  const pluginPath = path.join(pluginRootPath, pluginName);
  const aistarterPath = path.join(pluginPath, '.aistarter');
  //share目录里的相关文件
  const sharePath = path.join(configDirPath, 'Share');
  const filePath = process.platform === 'win32' 
  ? path.join(sharePath, pluginName + '.zip')
  : path.join(sharePath, pluginName + '.tar.gz');
  const zipFilePackagePath = path.join(aistarterPath, 'package.lock');
  //temp目录里的相关文件
  const tempPath = path.join(configDirPath, 'Temp');
  const tempPluginPath = path.join(tempPath, pluginName + '.zip');
  try{
    await fsPromises.unlink(zipFilePackagePath);
  }catch (error) {
    console.log(error)
  }
  try {
    await fsPromises.unlink(filePath);
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
async function checkSharePackage(pluginName) {
  const { getSettingValue } = require('./plugin');
  const configDirPath = await getSettingValue("RootDirPath");
  //share目录里的相关文件
  const sharePath = path.join(configDirPath, 'Share');
  const filePath = process.platform === 'win32' 
  ? path.join(sharePath, pluginName + '.zip')
  : path.join(sharePath, pluginName + '.tar.gz');
  if(fs.existsSync(filePath)){
    return 1;
  }else{
    return 0;
  }
}

async function hashFile(filePath) {
  const hash = crypto.createHash('md5');
  const fileStream = fs.createReadStream(filePath);

  return new Promise((resolve, reject) => {
    fileStream.on('data', (chunk) => hash.update(chunk));
    fileStream.on('end', () => resolve(hash.digest('hex')));
    fileStream.on('error', reject);
  });
}

// 文件哈希值获取
async function getFileStatsAsync(dirPath,progressbar) {
  let stats = '';
  let dirCount=0;
  async function traverseDir(currentPath) {
    const files = await fsPromises.readdir(currentPath, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(currentPath, file.name);
      try{
        // 检查是否为软链接
        const fileStat = await fsPromises.lstat(fullPath);
        if(fileStat.isSymbolicLink()) {
          continue; // 跳过软链接
        }
        if (fileStat.isDirectory()) {
          await traverseDir(fullPath);
        } else {
          // 检查是否在 .aistarter 目录中
          const relativePath = path.relative(dirPath, currentPath);
          const isInAistarter = relativePath.startsWith('.aistarter');
  
          if (isInAistarter) {
            // 只处理 .aistarter 目录中的 main.json 和 main.js 文件
            if (file.name === 'main.json' || file.name === 'main.js') {
              const hash = await hashFile(fullPath);
              if (progressbar) {
                dirCount++;
                progressbar(dirCount);
              }
              stats += hash;
            }
          } else {
            // 在其他目录中正常处理所有文件
            const hash = await hashFile(fullPath);
            if (progressbar) {
              dirCount++;
              progressbar(dirCount);
            }
            stats += hash;
          }
        }
      } catch (error) {
        console.error(`Error processing file ${fullPath}:`, error);
        continue; // 出错时跳过该文件
      }
    }
  }

  await traverseDir(dirPath);
  return stats;
}
/**
 * 打包时创建package.lock文件用于判断是否需要重新打包
 * @param string pluginName 插件安装目录
 */
async function createPluginPackageLock(pluginName) {
  const { getSettingValue,showLoading } = require('./plugin');
  const {shell} = require('electron');
  const configDirPath = await getSettingValue("RootDirPath");
  //项目根目录里的项目文件
  const pluginRootPath = path.join(configDirPath, 'Products');
  const pluginPath = path.join(pluginRootPath, pluginName);
  const sharePath = path.join(configDirPath, 'Share');
  //.aistarter目录里的打包检查文件
  const packagePath = path.join(pluginPath, '.aistarter');
  showLoading(true, `正在生成package.lock文件，请稍后... 0.00 %`); // 显示进度
  try{
    const fileCount = await getDirFileCount(pluginPath);
    let lastHash = await getFileStatsAsync(pluginPath,(dirCount)=>{
      showLoading(true, `正在生成package.lock文件，请稍后... ${((dirCount / fileCount) * 100).toFixed(2)} %`); // 显示进度
    });
    await fsPromises.writeFile(path.join(packagePath, 'package.lock'), lastHash, 'utf8');
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
async function checkPluginPackageModify(pluginName) {
  const { getSettingValue,showLoading, showMessage } = require('./plugin');
  const configDirPath = await getSettingValue("RootDirPath");
  //项目根目录里的项目文件
  const pluginRootPath = path.join(configDirPath, 'Products');
  const pluginPath = path.join(pluginRootPath, pluginName);
  //.aistarter目录里的打包检查文件
  const sharePath = path.join(pluginPath, '.aistarter');

  showLoading(true,"正在验证文件... 0.00 %");
  try{
    let packageLockPath = path.join(sharePath, 'package.lock');
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
//压缩图片转临时文件
async function blobToTempFile(imagepath,height,width) {
  // 判断是否是 GIF 动图
  const buffer = fs.readFileSync(imagepath);
  const isGif = buffer.slice(0, 6).toString() === 'GIF89a' || buffer.slice(0, 6).toString() === 'GIF87a';
  if (isGif) {
    // 可根据需要 return null 或抛出异常
    // throw new Error('暂不支持 GIF 动图压缩');
    return imagepath;
  }
  // 判断是否是 APNG 动图
  const isApng = buffer.includes(Buffer.from('acTL'));
  if (isApng) {
    // throw new Error('暂不支持 PNG 动图压缩');
    return imagepath;
  }
  const tempPath = path.join(os.tmpdir(), 'aistarter_compressed_' + Date.now());
  
  // 如果高度和宽度都为0，则使用图片本身的宽高
  if (height === 0 && width === 0) {
    const metadata = await sharp(imagepath).metadata();
    width = metadata.width;
    height = metadata.height;
  }
  
  await sharp(imagepath)
    .resize({ width: width, height: height, fit: 'inside' }) // 如需固定尺寸可用 fit: 'cover'
    .png({ quality: 80 }) // 可根据需要调整质量
    .toFile(tempPath);
  return tempPath;
}
//上传评论图片
async function uploadCommentImage(filePath,width,height,token) {
  try {
    let temfile =  await blobToTempFile(filePath,width,height);
    const formData = new FormData();
    const imageBuffer = await fs.promises.readFile(temfile);
    const imageFileName = path.basename(temfile)+'.png';
    
    // // 在 Node.js 环境中，直接使用 Buffer 作为文件内容
    // formData.append('image', imageBuffer, {
    //   filename: imageFileName,
    //   contentType: 'image/png'
    // });
        // 将 Buffer 转换为 Blob 对象
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
    formData.append('image', imageBlob, imageFileName);
    
    const response = await axios.post(Constants.uploadUrl + '/users/upload-market-comment-image', 
    formData, {
      headers: {
        'access-token': token || '',
        'Content-Type': 'multipart/form-data'
      },
      withCredentials: true
    });
    
    if (response.data.code === 0) {
      return {
        success: true,
        url: response.data.data.url
      };
    } else {
      return {
        success: false,
        error: response.data.msg || '上传失败'
      };
    }
  } catch (error) {
    console.error('图片上传失败:', error);
    return {
      success: false,
      error: error.message || '图片处理失败'
    };
  }
}

/*** 前端接口 ***/

//导入项目
ipcMain.handle('project-import-package', async (event, pluginName, packagePath) => {

  console.log(packagePath);

  let isImport = await importProjectPackage(pluginName, packagePath, {
    progress: (precent) => {

      console.log("导入进度：" + precent)
    }
  });

  return isImport;
})

//删除项目
ipcMain.handle('project-delete-plugin', async (event, pluginName) => {
  return await deleteProject(pluginName);
})

//移除插件
ipcMain.handle('project-delete-plugin-instance', async (event, pluginName) => {
  const { deletePlugin } = require('./plugin');
  return await deletePlugin(pluginName);
})

//判断项目目录是否存在
ipcMain.handle('project-check-plugin-dir-exits', async (event, pluginName) => {
  return await checkPluginDirExits(pluginName);
})

//获取目录下所以目录名和文件名
ipcMain.handle('project-get-all-dirs-and-files', async (event, sourceDir,onlyDir) => {
  return await getAllDisAndFiles(sourceDir,onlyDir);
})

//根据项目名获取该目录下所有文件
ipcMain.handle('project-get-pluginall-dirs-and-files', async (event, pluginName,onlyDir) => {
  const { getSettingValue } = require('./plugin');
  const configDirPath = await getSettingValue("RootDirPath");
  const pluginRootPath = path.join(configDirPath, 'Products');
  const pluginPath = path.join(pluginRootPath, pluginName);
  return await getAllDisAndFiles(pluginPath,onlyDir);
})

//创建新的项目
ipcMain.handle('project-create-new-plugin', async (event, pluginName, infoData, scriptData) => {
  return await createNewPlugin(pluginName, infoData, scriptData);
})

//获取专业版获取列表信息
ipcMain.handle('project-get-pro-list', async (event) => {
  //获取main脚本初始信息
  const projectScrData = require('./config/project_script_list')
  return projectScrData.listData
})

//调试运行项目
ipcMain.handle('project-debug-run-plugin', async (event, pluginName) => {
  await debugRunPlugin(pluginName);
})

//结束调试运行项目的实例
ipcMain.handle('project-exit-plugin-instance', async (event, pluginName) => {
  await exitPluginInstance(pluginName);
})

//导入整合包
ipcMain.handle('project-import-integration', async (event, pluginName, packagePath) => {
  return await importIntegrationPackage(pluginName, packagePath);
})

//将图片移动到插件目录
ipcMain.handle('project-copy-image-to-plugin', async (event, pluginName,imageFile, imageName ) => {
  return await importImageToPlugin(pluginName, imageFile, imageName);
})

//删除share目录下的指定压缩包
ipcMain.handle('project-delete-plugin-package', async (event, pluginName) => {
  return await rebuildPluginPackage(pluginName);
})

//获取插件信息接口，main.json、图片、图标、是否已经打包 
ipcMain.handle('project-get-plugin-info', async (event, pluginName) => {
  let pluginInfo = {}
  pluginInfo['mainJson'] = await readMainJs(pluginName, 'main.json'); //获取main.json文件内容
  pluginInfo['mainJs'] = await readMainJs(pluginName, 'main.js'); //获取main.js文件内容
  pluginInfo['cover'] = await getImageInfo(pluginName, 'cover.png'); //获取封面图
  pluginInfo['icon'] = await getImageInfo(pluginName, 'icon.png'); //获取图标
  pluginInfo['isPack'] = await checkSharePackage(pluginName); //判断share目录下是否存在指定压缩包
  return pluginInfo;

})

//保存以及编辑脚本信息
ipcMain.handle('project-save-script', async (event, pluginName, scriptData,fileName) => {
  return await saveScript(pluginName, scriptData,fileName)
})

//创建package.lock文件用于判断文件修改
ipcMain.handle('create-plugin-package-lock', async (event, pluginName) => {
  return await createPluginPackageLock(pluginName);
})

//获取package.lock文件内容判断文件是否修改
ipcMain.handle('check-plugin-package-modify', async (event, pluginName) => {
  return await checkPluginPackageModify(pluginName);
})

//删除package.lock文件
ipcMain.handle('delete-plugin-package-lock', async (event, pluginName) => {
  const { getSettingValue } = require('./plugin');
  const configDirPath = await getSettingValue("RootDirPath");
  const pluginRootPath = path.join(configDirPath, 'Products');
  const pluginPath = path.join(pluginRootPath, pluginName);
  const sharePath = path.join(pluginPath, '.aistarter');
  const packageLockPath = path.join(sharePath, 'package.lock');
  try{
    await fsPromises.unlink(packageLockPath);
  }catch (error) {
    console.log(error);
  }
})

//突发情况关闭加载动画
ipcMain.handle('project-close-loading', async (event) => {
  const { showLoading } = require('./plugin');
  showLoading(false);
})

//获取项目下对应的文件夹信息
ipcMain.handle('get-project-files', async (event,pluginName, level=2,matchdis='model') => {
  const { getSettingValue } = require('./plugin');
  const configDirPath = await getSettingValue("RootDirPath");
  const pluginRootPath = path.join(configDirPath, 'Products');
  const pluginPath = path.join(pluginRootPath, pluginName);
  return await getAllDis(pluginPath,level,matchdis);
})
//临时blob文件转临时文件
ipcMain.handle('blob-to-temp-file', async (event,imagepath,height,width) => {
  return await blobToTempFile(imagepath,height,width);
})

//上传评论图片
ipcMain.handle('upload-comment-image', async (event,options) => {
  return await uploadCommentImage(options.filePath,options.width,options.height,options.token);
})

module.exports = {
  importProjectPackage,
  deleteProject,
  checkPluginDirExits,
  getAllDisAndFiles,
  debugRunPlugin,
  exitPluginInstance,
  copyFileWithProgress,
  getDirFileCount,
  copyDir,
  getFileStatsAsync
};
