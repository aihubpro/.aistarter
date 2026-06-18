const { app, ipcMain } = require('electron')
const { getConfig,setConfig } = require('./config');
const {getGupInfo,getNvidiaSmi} = require('./gpu');
// const { addDirToClass } = require('./dir');
const os = require('os');
const { execSync } = require('child_process');
const {download} = require('./download');
const {seed,downloadTorrent,downloadProjectTorrent,updateTorrentProgress,setTorrentState,checkIPv6Support} = require('./torrent');

const { spawn } = require('child_process');
const vm = require('vm');

const fs = require('fs');

const path = require('path');

const crypto = require('crypto');
const iconLite = require('iconv-lite');

let curMainWindow = null; //当前主窗口
let pluginInstance = {}; //保存所有插件的引用

let projectTorrentTask = []; //需要下载的项目种子任务
let isProjectTorrneted = false; //是否已经做过下载认为

//插件默认配置
let defauleSettingList = [
  {className:"Preferences", title:"首选项", title_lankey:"app.setting_preferences_title", configList:[
      // 语言设置
      {
        key: 'Languages',
        label_lankey:'app.setting_lang',
        type: 'select',
        options: [
          { label: '中文', value: 'zh-cn' },
          { label: 'English', value: 'en' },
          // ...其他 GPU 选项
        ],
        default: 'zh-cn'
      },
      // 项目根目录
      {
        key: 'RootDirPath',
        label: '项目根目录',
        label_lankey:'app.setting_dir',
        type: 'dir',
        default: ""
      },
      {
        key: 'OpenDev',
        label_lankey:'app.setting_dev',
        desc:"打开开发者选项，用于插件开发调试",
        desc_lankey: 'app.setting_dev_desc',
        type: 'switch',
        default: false
      },
      {
        key: 'OpenCdn',
        label_lankey:'app.setting_cdn',
        type: 'switch',
        default: false
      },
      {
        key: 'AutoShutdown',
        label_lankey:'app.setting_auto_shutdown',
        desc_lankey: 'app.setting_auto_shutdown_desc',
        type: 'switch',
        default: false
      },
      {
        key: 'TestIPv6',
        label_lankey:'app.setting_auto_test_ipv6',
        desc_lankey: 'app.setting_auto_test_ipv6_desc',
        type: 'switch',
        default: true
      }
  ]}
 ]; //保存所有目录数据

// let pluginInfoList = null; //所有插件信息
// 插件安装标记文件名
const installLockFileName = 'install.lock';
// 下载标记文件
const downloadLockFileName = 'download.lock';

//test code
// setConfig("RootDirPath", "F:\\Dong\\AIStarterWork\\");

// 标记插件安装完成
async function markPluginInstalled(pluginName) {
  // 插件目录路径
  const configDirPath = await getSettingValue("RootDirPath");
  const pluginRootPath = path.join(configDirPath, 'Products');
  const pluginPath = path.join(pluginRootPath, pluginName);
  const aistarterDir = path.join(pluginPath, '.aistarter');
  const installLockFilePath = path.join(aistarterDir, installLockFileName);

  // 在插件目录创建 install.lock 文件
  fs.writeFileSync(installLockFilePath, '');

  if(curMainWindow){
    curMainWindow.webContents.send('on-plugin-install', pluginName);
  }

  return true;
}

// 标记其他(模型，插件，工作流)项目下载完成
async function markResourcesDownloaded(resName,resType) {
  const configDirPath = await getSettingValue("RootDirPath");
  const pluginRootPath = path.join(configDirPath, resType);
  const pluginPath = path.join(pluginRootPath, resName);
  const aistarterDir = path.join(pluginPath, '.aistarter');
  const downloadLockFile = path.join(aistarterDir, downloadLockFileName);
  const installLockFilePath = path.join(aistarterDir, installLockFileName);

  // 在插件目录创建 download.lock 文件
  fs.writeFileSync(downloadLockFile, '');
  // 在插件目录创建 install.lock 文件
  fs.writeFileSync(installLockFilePath, '');

  if(curMainWindow){
    curMainWindow.webContents.send('on-resources-download', resName);
  }

  return true;
}

// 标记AI项目下载完成
async function markPluginDownloaded(pluginName) {
  // 插件目录路径
  const configDirPath = await getSettingValue("RootDirPath");
  const pluginRootPath = path.join(configDirPath, 'Products');
  const pluginPath = path.join(pluginRootPath, pluginName);
  const aistarterDir = path.join(pluginPath, '.aistarter');
  const downloadLockFile = path.join(aistarterDir, downloadLockFileName);

  // 在插件目录创建 download.lock 文件
  fs.writeFileSync(downloadLockFile, '');

  if(curMainWindow){
    curMainWindow.webContents.send('on-plugin-download', pluginName);
  }

  return true;
}


// 输出插件安装中的日志
async function pluginLog(logStr){
  if(curMainWindow){
    curMainWindow.webContents.send('on-plugin-install-log', logStr);
  }
  return true;
}

// 改变按钮状态
async function changeBtnState(pluginName, state){
  if(curMainWindow){
    curMainWindow.webContents.send('on-plugin-change-btn-state', pluginName, state);
  }
  return true;
}
//更新按钮
async function updateSetting(pluginName,key,data){
  if(curMainWindow){
    curMainWindow.webContents.send('on-setting-change-btn-state',pluginName,key,data);
  }
  return true;
}

// 不用eval的更好的代码:
function _createSandboxObject(scriptStr){
    const { addDirToClass } = require('./dir');
    const {unzipPluginProject} = require('./zip')

    let tmpObject = null;

    let exceStr = '(' + scriptStr + ')';

    let zn = {};
    //执行命令特殊处理
    zn.execute = async (command, args, options = {}, callback = {}) => {
      let pluginName = null;
      if(tmpObject && tmpObject.isDebugLog){
        console.log('run dev mode:' + tmpObject.pluginName);
        //调试运行
        if(tmpObject.pluginName){
          pluginName = tmpObject.pluginName;
        }
      }
      return execute(command, args, options, callback, pluginName)
    };
    // zn.runCommand = runCommand;
    zn.markPluginInstalled = markPluginInstalled;
    zn.markPluginDownloaded = markPluginDownloaded;
    zn.pluginLog = pluginLog;
    zn.isPluginInstalled = isPluginInstalled;
    zn.isProjectDownloaded = isProjectDownloaded;
    zn.addDirToClass = addDirToClass;
    zn.killProcessTree = killProcessTree;
    zn.showLoading = showLoading;
    zn.getGupInfo = getGupInfo;
    zn.getNvidiaSmi = getNvidiaSmi;
    zn.getSettingValue = getSettingValue;
    zn.setSettingValue = setSettingValue;
    zn.showMessage = showMessage;
    zn.terminalMessage = terminalMessage;
    zn.download = download;
    zn.downloadTorrent = downloadTorrent;
    zn.downloadProjectTorrent = downloadProjectTorrent;
    zn.unzipPluginProject = unzipPluginProject;
    zn.changeBtnState = changeBtnState;
    zn.updateSetting = updateSetting;

    //沙箱暴露的方法
    const sandbox = { 
      app: app, 
      console:console, 
      process:process, 
      zn:zn
    };

    vm.createContext(sandbox);  // 创建一个上下文隔离对象
    tmpObject = vm.runInContext(exceStr, sandbox);

    return tmpObject;
}

//终端打印消息
async function terminalMessage(msg, windowName){
  
  if(!app.isQuitting && curMainWindow){
    if(!windowName || windowName == ""){
      curMainWindow.webContents.send('on-plugin-terminal-message', msg);
    }else{
      curMainWindow.webContents.send('on-plugin-terminal-message-' + windowName, msg);
    }
  }
}

async function execute(command, args, options = {}, callback = {}, pluginName = null) {
  let outputString = '';

  const { cwd, env } = options;

  const childProcess = spawn(command, args, {
      cwd,
      env,
      encoding: 'utf8'
  });

  // childProcess.stdout.setEncoding('utf8'); // 设置输出编码为 utf8

  childProcess.stdout.on('data', (stdout) => {
      let stdoutStr = iconLite.decode(stdout, 'utf-8'); //stdout.toString();
      outputString += stdoutStr;
      // console.log(`stdout: ${stdout}`);
      process.stdout.write(stdout);
      if(callback.stdout){
        callback.stdout(stdout);
      }
      terminalMessage(stdoutStr, pluginName);
  });

  childProcess.stderr.on('data', (error) => {
      let errorStr = iconLite.decode(error, 'utf-8'); //error.toString();
      console.log(`${errorStr}`);
      if(callback.stderr){
        callback.stderr(error);
      }

      terminalMessage(errorStr, pluginName);
  });

  if(callback.created){
    callback.created(childProcess);
  }

  return new Promise((resolve, reject) => {
      childProcess.on('close', (code) => {
          if(callback.close){
            callback.close(code);
          }

          if (code === 0) {
              resolve(outputString);
          } else {
              reject(new Error(`Command failed with code ${code}`));
          }
      });
  });
}

async function killProcessTree(pid){

  if (process.platform === 'win32') {
    // Windows 平台
    await execute('cmd.exe', ['/c', 'taskkill /pid ' + pid + ' /T /F'])
  } else if (process.platform === 'darwin') {
    //MacOS
    await execute('kill', ['-9', pid.toString()])
  } else if(process.platform === 'linux'){
    //Linux
    await execute('kill', ['-9', pid.toString()])
  }
  
}

// 初始化插件
async function initPlugin(mainWindow){
  curMainWindow = mainWindow;

  setSettingValue("AutoShutdown", false);
}

//加载插件信息
async function loadAllPluginsInfos(pluginPath){
  const allPluginInfo = [];
  try {
    // 获取 pluginPath 目录下的所有文件和子目录
    const files = await fs.promises.readdir(pluginPath, { withFileTypes: true });

    for (const file of files) {
      // 判断是否是目录
      if (file.isDirectory()) {
        const pluginDir = path.join(pluginPath, file.name);
        const aistarterDir = path.join(pluginDir, '.aistarter');
        const mainJsonFile = path.join(aistarterDir, 'main.json');

        // 判断是否存在 .aistarter 目录和 main.json 文件
        if (fs.existsSync(aistarterDir) && fs.existsSync(mainJsonFile)) {
          // 读取 main.json 文件内容
          const jsonContent = await fs.promises.readFile(mainJsonFile, 'utf8');
          const pluginInfo = JSON.parse(jsonContent);
          allPluginInfo.push(pluginInfo);
        }
      }
    }

    return allPluginInfo;
  } catch (error) {
    console.error('Error loading plugin infos:', error);
    return [];
  }
}

// 检查插件是否已经安装
async function isPluginInstalled(installDir){
    // 插件目录路径
    const configDirPath = await getSettingValue("RootDirPath");
    const pluginsPath = path.join(configDirPath, 'Products');

    const curPluginDir = path.join(pluginsPath, installDir);

    //插件目录已经存在，加载插件脚本
    const curScriptDir = path.join(curPluginDir, '.aistarter');

    const installLockFilePath = path.join(curScriptDir, installLockFileName);

    if (fs.existsSync(installLockFilePath)) {
      return true;
    }
    return false;
}

// 检查项目是否已经安装
async function isProjectDownloaded(installDir, isFristInit = false){
  // 插件目录路径
  const configDirPath = await getSettingValue("RootDirPath");
  const pluginsPath = path.join(configDirPath, 'Products');

  const curPluginDir = path.join(pluginsPath, installDir);

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
    await markPluginDownloaded(installDir);
    return true;
  }

  return false;
}

const algorithm = 'aes-256-cbc';
const keyJsFile = Buffer.from('02d3516e4731c961bacdc70bd12a525de5546cb8a1dd3d6ca8940af7e45a143b', 'hex');

// 加密
function encrypt(inputFilePath, outputFilePath) {
  const inputBuffer = fs.readFileSync(inputFilePath);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, keyJsFile, iv);
  const encryptedBuffer = Buffer.concat([iv, cipher.update(inputBuffer), cipher.final()]);
  fs.writeFileSync(outputFilePath, encryptedBuffer);
  console.log('File encrypted successfully.');
}

// 解密
function decrypt(inputFilePath) {
  const inputBuffer = fs.readFileSync(inputFilePath);
  const iv = inputBuffer.slice(0, 16);
  const encryptedData = inputBuffer.slice(16);
  const decipher = crypto.createDecipheriv(algorithm, keyJsFile, iv);
  const decryptedBuffer = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  return decryptedBuffer.toString('utf-8');
}

async function startProjectTorrentTask(){
  if(isProjectTorrneted){
    return;
  }

  isProjectTorrneted = true;

  addNextProjectTorrent();
}

async function addNextProjectTorrent(){
  if(projectTorrentTask.length <= 0){
    return;
  }

  const {downloadTorrent, checkTorrentFileComplete} = require('./torrent');

  const curPluginName = projectTorrentTask.shift();

  if(await checkTorrentFileComplete(curPluginName)){
    downloadTorrent(curPluginName, {done:() => {
      addNextProjectTorrent();
    }, error:() => {
      addNextProjectTorrent();
    }})
  }else{
    addNextProjectTorrent();
  }

}

// 加载所有插件
async function loadAllPlugins() {
  let pluginInfoList = [];

  // 插件目录路径
  const configDirPath = await getSettingValue("RootDirPath");
  let pluginsPath = null;
  if (configDirPath) {
    pluginsPath = path.join(configDirPath, 'Products');
  }

  //获取插件信息 TODO或者请求网络
  const pluginAllCfg = await loadAllPluginsInfos(pluginsPath);

  //获取下载或压缩进度
  const progressInfoDic = await updateTorrentProgress();

  // 是否打开开发者
  const isOpenDev = await getSettingValue("OpenDev");

  for (const pluginCfg of pluginAllCfg) {
    let newPluginCfg = Object.assign({}, pluginCfg);
    let installDir = newPluginCfg["install_dir"];

    let curPluginDir = null;
    let curScriptDir = null; //脚本目录
    if (pluginsPath) {
      curPluginDir = path.join(pluginsPath, installDir);
      curScriptDir = path.join(curPluginDir, '.aistarter');
    }

    let isFristInit = false; //是否是第一次初始化
    //检测插件是否已经安装
    if (curPluginDir && fs.existsSync(curPluginDir)) {
      //插件没有实例化则实例化插件
      let curPluginObj = pluginInstance[installDir]
      if (!curPluginObj) {
        //插件目录已经存在，加载插件脚本
        const pluginEntry = path.join(curScriptDir, 'main.js');
        const pluginEntryJsx = path.join(curScriptDir, 'main.jsx');

        if (fs.existsSync(pluginEntry)) {
          //有js文件，每次运行生成main.jsx加密文件
          encrypt(pluginEntry, pluginEntryJsx);
        }

        try {
          let mainStr = "";
          if (fs.existsSync(pluginEntryJsx)) {
            mainStr = decrypt(pluginEntryJsx);
          } else {
            mainStr = fs.readFileSync(pluginEntry, 'utf-8');
          }

          let pluginObject = _createSandboxObject(mainStr);
          pluginObject.pluginPath = curPluginDir; //记录插件目录
          pluginObject.pluginName = installDir; //记录插件目录名称
          pluginObject.pluginDir = pluginsPath; //记录插件目录(根目录) ‘Products’

          // 调用插件初始化
          if (pluginObject.init && typeof (pluginObject.init) == "function") {
            pluginObject.init();
          }

          pluginInstance[installDir] = pluginObject;
          curPluginObj = pluginObject;

          isFristInit = true;
          
        } catch (error) {
          console.error(`Failed to load plugin ${curPluginDir}:`, error);
        }
      }

      let isDownloaded = await isProjectDownloaded(installDir, isFristInit);
      if(isDownloaded){
        //插件已下载且解压了
        if(isFristInit){
          //启动继续做种
          projectTorrentTask.push(installDir);          
        }

        const isInstall = await isPluginInstalled(installDir);
        if (isInstall) {
          //有已安装的标记文件
          newPluginCfg["InstallState"] = 3; ////安装状态：0、未下载，1、已下载压缩包 2、已解压未安装 3、已安装，显示启动 4、运行中
        } else {
          newPluginCfg["InstallState"] = 2;
        }

        if (curPluginObj && curPluginObj.isRunning) {
          if (await curPluginObj.isRunning()) {
            newPluginCfg["InstallState"] = 4;
          }
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

    const asarPath = app.isPackaged ? path.join(__dirname, "../app") : '';

    // let iconPathStr = path.join(asarPath, "/icons/" + newPluginCfg["icon"]);
    // newPluginCfg["iconPath"] = iconPathStr;
    const pluginEntryIcon = path.join(curScriptDir, 'icon.png');
    if (fs.existsSync(pluginEntryIcon)) {
      newPluginCfg["iconPath"] = pluginEntryIcon;
    }
    newPluginCfg["install_type"] = 'Products'; //安装类型
    newPluginCfg["openDev"] = isOpenDev;

    pluginInfoList.push(newPluginCfg);
  }

  //开始继续做种
  startProjectTorrentTask();

  return pluginInfoList;
}

//创建插件实例
async function createPluginInstance(pluginName){

  // 插件目录路径
  const configDirPath = await getSettingValue("RootDirPath");
  const pluginsPath = path.join(configDirPath, 'Products');
  // 当前插件目录
  const curPluginDir = path.join(pluginsPath, pluginName);

  //插件目录已经存在，加载插件脚本
  const curScriptDir = path.join(curPluginDir, '.aistarter');

  const pluginEntry = path.join(curScriptDir, 'main.js');

  try {
    let mainStr = fs.readFileSync(pluginEntry, 'utf-8');

    let pluginObject = _createSandboxObject(mainStr);
    pluginObject.pluginPath = curPluginDir; //记录插件目录
    pluginObject.pluginName = pluginName; //记录插件目录名称

    // 调用插件初始化
    if (pluginObject.init && typeof (pluginObject.init) == "function") {
      pluginObject.init();
    }

    return pluginObject;
    
  } catch (error) {
    console.error(`Failed to load plugin ${curPluginDir}:`, error);

    return null;
  }
}

// 获取配置值
async function getSettingValue(keyName, keyClass){
  if(!keyClass){
    keyClass = "Preferences";
  }
  const allSettingCfgs = await getConfig("Settings");
  if(!allSettingCfgs){
    return null;
  }

  settingCfgs = allSettingCfgs[keyClass];
  if(!settingCfgs || !settingCfgs.hasOwnProperty(keyName)){
    return null;
  }

  return settingCfgs[keyName]
}

// 保存配置值
async function setSettingValue(keyName, keyVal, keyClass){
  if(!keyClass){
    keyClass = "Preferences";
  }

  let allSettingCfgs = await getConfig("Settings");
  if(!allSettingCfgs){
    allSettingCfgs = {};
  }

  if(!allSettingCfgs[keyClass]){
    allSettingCfgs[keyClass] = {};
  }

  allSettingCfgs[keyClass][keyName] = keyVal

  await setConfig("Settings", allSettingCfgs)

  return true
}

// 回复设置存储的值
async function restoreSettingValue(settingCfgs) {
  const keyClass = settingCfgs.className;
  const promises = settingCfgs.configList.map(async (setting) => {
    const keyName = setting.key;
    let settingValue = await getSettingValue(keyName, keyClass);
    if (settingValue != null) {
      setting.value = settingValue;
    } else {
      setting.value = setting.default;
    }
    // console.log("setSettingValue::" + keyName + "=" + settingValue);
  });

  await Promise.all(promises); // 等待所有异步操作完成

  return true;
}

// 删除插件
async function deletePlugin(pluginName){
  const pluginObj = pluginInstance[pluginName];
  if (pluginObj && pluginObj.onAppExit) {
    pluginObj.onAppExit();
  }

  delete pluginInstance[pluginName];
}

function showLoading(isOpen, text, autoCloseTime){
  if(curMainWindow){
    curMainWindow.webContents.send('on-plugin-run-loading', isOpen, text, autoCloseTime);
  }
}

function showMessage(text){
  if(curMainWindow){
    curMainWindow.webContents.send('on-plugin-show-message', text);
  }
}

//显示消息提示框
function showMessageBox(title, content, params){
  if(curMainWindow){
    curMainWindow.webContents.send('on-plugin-show-message-box', title, content, params);
  }
}


/**
 * 创建并写入渲染好的模板代码到指定文件路径
 * @param {string} tplFilePath - 模板文件的相对或绝对路径
 * @param {string} saveFilePath - 要保存渲染结果的文件路径
 * @param {object} renderOption - 传递给 EJS 的数据对象
 */
async function createTemplateScriptFile(tplFilePath, saveFilePath, renderOption) {
  const ejs = require('ejs'); // EJS 模板引擎

  try {
      // 构建模板文件的完整路径
      const templatePath = path.join(__dirname, tplFilePath);

      // 读取模板文件内容
      let tplStr = await fs.promises.readFile(templatePath, 'utf-8');

      // 使用 EJS 渲染模板，renderOption 包含所有需要传递给模板的数据
      let html = await ejs.render(tplStr, renderOption);

      // 获取目标目录路径
      const targetDir = path.dirname(saveFilePath);

      // 检查目标目录是否存在
      if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
          throw new Error(`The directory ${targetDir} does not exist or is not a directory.`);
      }

      // 将渲染后的 HTML 写入到目标文件
      await fs.promises.writeFile(saveFilePath, html);

      console.log(`Template has been successfully created and saved to ${saveFilePath}`);
  } catch (error) {
      console.error('Error creating template script file:', error.message);
      throw error; // 抛出错误以便调用者可以处理
  }
}

//判断是否是管理员
async function isAdminUser() {
  try {
    const { execSync } = require('child_process');
    const os = require('os');
    const platform = os.platform();

    if (platform === 'win32') {
      // Windows 系统：使用 PowerShell 检查当前用户是否在管理员组中
      const command = 'powershell -command "&{([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)}"';
      const output = execSync(command, { encoding: 'utf8' });
      return output.trim() === 'True';
    } else if (platform === 'linux' || platform === 'darwin') {
      // Linux 或 macOS 系统
      const output = execSync('whoami').toString().trim();
      return output === 'root';
    } else {
      console.warn('Unsupported operating system');
      return false;
    }
  } catch (error) {
    // 如果执行命令失败，通常意味着没有管理员权限
    console.error('Error checking admin privileges:', error);
    return false;
  }
}
//获取用户设备信息 - 三层备用策略
async function getUserDeviceCode() {
  let macid = '';
  let devicename = '';
  let devicetype = '';

  try {
    const platform = os.platform();
    devicename = os.hostname() || 'unknown';
    
    // 设置设备类型
    switch (platform) {
      case 'win32':
        devicetype = 'win';
        break;
      case 'darwin':
        devicetype = 'mac';
        break;
      case 'linux':
        devicetype = 'linux';
        break;
      default:
        devicetype = platform;
        break;
    }
    
    // 第一层：优先使用原始函数获取机器码
    try {
      macid = await getOriginalMachineId();
      console.log('使用原始函数获取机器码成功');
    } catch (originalError) {
      console.warn('原始函数获取失败:', originalError.message);
      
      // 第二层：使用 node-machine-id 库
      try {
        const { machineIdSync } = require('node-machine-id');
        macid = machineIdSync();
        console.log('使用node-machine-id库获取机器码成功');
      } catch (libraryError) {
        console.warn('node-machine-id库获取失败:', libraryError.message);
        
        // 第三层：使用备用生成方案
        try {
          macid = generateFallbackId();
          console.log('使用备用方案生成机器码成功');
        } catch (fallbackError) {
          console.error('备用方案也失败:', fallbackError.message);
          // 最后的紧急方案：使用时间戳+随机数
          macid = 'EMERGENCY_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
          console.log('使用紧急方案生成机器码');
        }
      }
    }
    
  } catch (error) {
    console.error('获取机器码过程中发生错误:', error.message);
    
    // 确保总是返回有效数据
    devicename = os.hostname() || 'unknown';
    devicetype = os.platform() || 'unknown';
    macid = macid || ('ERROR_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9));
  }

  return {
    macid,
    devicename,
    devicetype
  };
}

// 原始机器码获取函数 - 第一层备用方案
async function getOriginalMachineId() {
  const platform = os.platform();
  
  try {
    switch (platform) {
      case 'win32': // Windows
        return await getWindowsDeviceId();
      case 'darwin': // macOS
        return await getMacDeviceId();
      case 'linux': // Linux
        return await getLinuxDeviceId();
      default:
        throw new Error(`不支持的平台: ${platform}`);
    }
  } catch (error) {
    throw new Error(`原始方法获取失败: ${error.message}`);
  }
}

// Windows设备ID获取 - 多种方法兼容
async function getWindowsDeviceId() {
  const methods = [
    // 方法1: WMIC UUID (Windows 7+)
    () => execSync('wmic csproduct get uuid', { timeout: 5000 }).toString().split('\n')[1]?.trim(),
    
    // 方法2: PowerShell (Windows 7+)
    () => execSync('powershell "(Get-CimInstance -Class Win32_ComputerSystemProduct).UUID"', { timeout: 5000 }).toString().trim(),
    
    // 方法3: 注册表方式 (Windows XP+)
    () => execSync('reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid', { timeout: 5000 })
      .toString().match(/MachineGuid\s+REG_SZ\s+(.+)/)?.[1]?.trim(),
    
    // 方法4: WMIC BIOS (备用)
    () => execSync('wmic bios get serialnumber', { timeout: 5000 }).toString().split('\n')[1]?.trim()
  ];
  
  for (const method of methods) {
    try {
      const result = method();
      if (result && result !== 'N/A' && result.length > 5) {
        return result;
      }
    } catch (error) {
      console.warn('Windows设备ID获取方法失败:', error.message);
      continue;
    }
  }
  
  throw new Error('所有Windows方法都失败');
}

// macOS设备ID获取 - 多种方法兼容
async function getMacDeviceId() {
  const methods = [
    // 方法1: system_profiler (macOS 10.4+)
    () => execSync("system_profiler SPHardwareDataType | awk '/Hardware UUID/ { print $3 }'", { timeout: 5000 }).toString().trim(),
    
    // 方法2: ioreg (macOS 10.2+)
    () => execSync('ioreg -d2 -c IOPlatformExpertDevice | awk -F\\" "/IOPlatformUUID/{print $(NF-1)}"', { timeout: 5000 }).toString().trim(),
    
    // 方法3: sysctl (备用)
    () => execSync('sysctl kern.uuid', { timeout: 5000 }).toString().split(': ')[1]?.trim()
  ];
  
  for (const method of methods) {
    try {
      const result = method();
      if (result && result.length > 10) {
        return result;
      }
    } catch (error) {
      console.warn('macOS设备ID获取方法失败:', error.message);
      continue;
    }
  }
  
  throw new Error('所有macOS方法都失败');
}

// Linux设备ID获取 - 多种方法兼容
async function getLinuxDeviceId() {
  const methods = [
    // 方法1: D-Bus machine-id (systemd)
    () => execSync('cat /var/lib/dbus/machine-id', { timeout: 5000 }).toString().trim(),
    
    // 方法2: systemd machine-id
    () => execSync('cat /etc/machine-id', { timeout: 5000 }).toString().trim(),
    
    // 方法3: DMI UUID (需要root权限)
    () => execSync('cat /sys/class/dmi/id/product_uuid', { timeout: 5000 }).toString().trim(),
    
    // 方法4: hostid命令
    () => execSync('hostid', { timeout: 5000 }).toString().trim(),
    
    // 方法5: /proc/sys/kernel/random/boot_id
    () => execSync('cat /proc/sys/kernel/random/boot_id', { timeout: 5000 }).toString().trim()
  ];
  
  for (const method of methods) {
    try {
      const result = method();
      if (result && result.length > 5) {
        return result;
      }
    } catch (error) {
      console.warn('Linux设备ID获取方法失败:', error.message);
      continue;
    }
  }
  
  throw new Error('所有Linux方法都失败');
}

// 生成备用设备ID
function generateFallbackId() {
  const crypto = require('crypto');
  const os = require('os');
  const fs = require('fs');
  const path = require('path');
  
  try {
    // 尝试从缓存文件读取已生成的ID
    const cacheDir = os.tmpdir();
    const cacheFile = path.join(cacheDir, '.aistarter_device_id');
    
    if (fs.existsSync(cacheFile)) {
      const cachedId = fs.readFileSync(cacheFile, 'utf8').trim();
      if (cachedId && cachedId.length === 32) {
        return cachedId;
      }
    }
    
    // 使用稳定的系统信息生成唯一ID（排除可能变化的信息）
    const stableSystemInfo = [
      os.hostname(),
      os.platform(),
      os.arch(),
      os.type(),
      // 只使用CPU的型号信息，排除频率等可能变化的信息
      (os.cpus()[0] || {}).model || 'unknown',
      // 使用总内存，但四舍五入到GB避免小幅变化
      Math.round(os.totalmem() / (1024 * 1024 * 1024)).toString() + 'GB',
      process.env.USERNAME || process.env.USER || 'unknown',
      // 添加一个固定的盐值确保唯一性
      'aistarter-device-salt-2024'
    ].join('|');
    
    const deviceId = crypto.createHash('sha256').update(stableSystemInfo).digest('hex').substring(0, 32);
    
    // 将生成的ID缓存到文件
    try {
      fs.writeFileSync(cacheFile, deviceId, 'utf8');
    } catch (writeError) {
      console.warn('无法缓存设备ID:', writeError.message);
    }
    
    return deviceId;
    
  } catch (error) {
    console.warn('生成备用设备ID时出错:', error.message);
    // 如果所有方法都失败，生成一个基于时间戳的ID（不推荐，但作为最后手段）
    const timestamp = Math.floor(Date.now() / (1000 * 60 * 60 * 24)); // 按天计算，减少变化
    return crypto.createHash('sha256').update(`fallback-${timestamp}-${os.hostname()}`).digest('hex').substring(0, 32);
  }
}

/**
 * 获取用户设备机器码MAC地址
 */
ipcMain.handle('get-user-device-code', async (event) => {
  return await getUserDeviceCode();
})

/**
 * 额外设置启动
 * @param string pluginName 插件安装目录
 * @param string settingValue 参数
 */
ipcMain.handle('project-set-extra-setting', async (event, pluginName, settingValue) => {
  const pluginInstances = pluginInstance[pluginName];
  console.log(pluginInstances)
  if (pluginInstances && typeof pluginInstances.runScript === 'function') {
      pluginInstances.runScript(settingValue);
      return true;
  }
  return false;
})

/**
 * 额外设置启动2
 * @param string bind 插件方法名
 */
ipcMain.handle('project-set-extra-setting2', async (event,pluginName, bind) => {
  const pluginInstances = pluginInstance[pluginName];
  console.log(pluginInstances)
  if (pluginInstances && typeof pluginInstances[bind] === 'function') {
      pluginInstances[bind]();
      return true;
  }
  return false;
})

// 获取设置选项
ipcMain.handle('plugin-setting-list', async (event) => {
  const settingList = [];

  for (const settingCfgs of defauleSettingList) {
    await restoreSettingValue(settingCfgs);

    // console.log(settingCfgs);
    settingList.push(settingCfgs);
  }

  for (const key in pluginInstance) {
    const pluginObj = pluginInstance[key];
    if (pluginObj.addSetting) {
      const pluginSettingCfg = await pluginObj.addSetting();
      await restoreSettingValue(pluginSettingCfg);
      
      settingList.push(pluginSettingCfg);
    }
  }

  return settingList;
})

// 设置选项值改变
ipcMain.handle('plugin-change-settings', async (event, settingList, oldSettingList) => {
  for (const settingCfgs of settingList) {
    const keyClass = settingCfgs.className;
    for (const setting of settingCfgs.configList) {
      const keyName = setting.key;

      const oldValue = oldSettingList.find(cfg => cfg.className === keyClass)?.configList.find(s => s.key === keyName)?.value;

      if (oldValue !== setting.value) {
        // console.log(oldValue);
        // console.log(setting.value);
        await setSettingValue(keyName, setting.value, keyClass);

        if(curMainWindow){
          curMainWindow.webContents.send('on-plugin-setting-change', keyName, setting.value, keyClass);
        }

        //传递给插件
        for (const key in pluginInstance) {
          const pluginObj = pluginInstance[key];
          if (pluginObj.onSettingChange) {
            pluginObj.onSettingChange(keyName, setting.value, keyClass);
          }
        }

        //CDN设置同步
        if(keyClass == "Preferences"){
          if(keyName == "OpenCdn"){
            //开启网络加速
            const tmpConstant = require('./constants.js');
            tmpConstant.setOpenCdn(setting.value);
          }
        }
        
      }
    }
  }
  // console.log(settingList);
})

// 获取插件信息
ipcMain.handle('plugin-list-info',async (event) => {
  let pluginInfoList = await loadAllPlugins();
  // console.log("pluginInfoList")
  // console.log(pluginInfoList)
  return pluginInfoList;
});


// 在主进程中监听渲染进程的install事件
ipcMain.on('plugin-install', (event, pluginName) => {
    const pluginObj = pluginInstance[pluginName];
    if(pluginObj){
        pluginObj.install();
    }
    // event.reply('on-plugin-install', "runInstalled");
});

// 在主进程中监听渲染进程的download事件
ipcMain.on('plugin-project-download', (event, pluginName) => {
  const pluginObj = pluginInstance[pluginName];
  if(pluginObj){
      pluginObj.download();
  }
  // event.reply('on-plugin-install', "runInstalled");
});

// 暂停或者继续下载
ipcMain.on('plugin-torrent-change-state', (event, pluginName,pluginType, isStop) => {
  setTorrentState(pluginName,pluginType, isStop)
})


// 在主进程中监听渲染进程的run事件
ipcMain.on('plugin-run', (event, pluginName) => {
  const pluginObj = pluginInstance[pluginName];
  if(pluginObj){
      pluginObj.run();
  }
});

// 在主进程中监听渲染进程的run事件
ipcMain.on('plugin-exit', (event, pluginName) => {
  const pluginObj = pluginInstance[pluginName];
  if(pluginObj && pluginObj.exit){
      pluginObj.exit();
  }
});

// 更新API地址
ipcMain.handle('plugin-setting-update-url',async (event) => {
  //读取cdn配置值
  let cdnCfgVal = await getSettingValue("OpenCdn", "Preferences");
  const tmpConstant = require('./constants.js');
  tmpConstant.setOpenCdn(cdnCfgVal);

  if(cdnCfgVal == null){
    
    // 获取系统的默认语言设置
    const systemLanguage = app.getLocale();
    console.log(systemLanguage);
    // 判断系统语言是否为中文
    if (systemLanguage == 'zh-CN') {
        cdnCfgVal = false;
    } else {
        cdnCfgVal = true;
    }

    await setSettingValue("OpenCdn", cdnCfgVal, "Preferences");
  }

  return cdnCfgVal;
})

//检测是否开启ipv6
ipcMain.on('check-ipv6-open', async (event) => {
  let result = await checkIPv6Support();
  if(curMainWindow && !result){
    curMainWindow.webContents.send('on-plugin-show-ipv6-tip');
  }
});

//不再提示ipv6检测
ipcMain.on('ignore-check-ipv6-open', async (event) => {
  await setSettingValue("TestIPv6", false, "Preferences");
});

app.on('before-quit', (event) => {

  if(!app.isQuitting){
    return;
  }

  console.log('before-quit');

  for (const key in pluginInstance) {
    const pluginObj = pluginInstance[key];
    if (pluginObj.onAppExit) {
      pluginObj.onAppExit();
    }
  }
})
//判断是否是管理员
ipcMain.handle('check-admin', async (event) => {
  const status = await isAdminUser();
  return status;
});

module.exports = {
    initPlugin,
    isPluginInstalled,
    getSettingValue,
    setSettingValue,
    terminalMessage,
    showMessage,
    showMessageBox,
    showLoading,
    markPluginDownloaded,
    markResourcesDownloaded,
    deletePlugin,
    execute,
    killProcessTree,
    createPluginInstance,
    createTemplateScriptFile,
    isAdminUser
};
