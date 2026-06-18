const { app, ipcMain, dialog, shell } = require('electron')
// const { getConfig,setConfig } = require('./config');
const { getSettingValue,setSettingValue } = require('./plugin');


const fs = require('fs');
const path = require('path');

//目录管理

let dirConfigList = [
  {className:"Project", title:"项目目录", dirList:[
    {icon:"Folder", viewName:"根目录", viewPath:"\\", dirPath:""},
    {icon:"Folder", viewName:"模型目录", viewPath:"\\Models", dirPath:"Models"},
    {icon:"Folder", viewName:"插件目录", viewPath:"\\Plugins", dirPath:"Plugins"},
    {icon:"Folder", viewName:"工作流目录", viewPath:"\\Workflows", dirPath:"Workflows"},
    {icon:"Folder", viewName:"软件目录", viewPath:"\\Products", dirPath:"Products"},
    {icon:"Folder", viewName:"临时目录", viewPath:"\\Temp", dirPath:"Temp"},
    {icon:"Folder", viewName:"第三方库目录", viewPath:"\\Third", dirPath:"Third"},
  ]}
 ]; //保存所有目录数据


//根据类别获取目录
function getDirListByClass(_className) {
  const result = dirConfigList.find(item => item.className === _className);
  return result || null;
}


//创建软件默认目录
async function createDefauleDir(rootPath, dirList) {

  const createDirFunc = (dirPath) =>{
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Directory created: ${dirPath}`);
    } else {
      console.log(`Directory already exists: ${dirPath}`);
    }
  }

  dirList.forEach((dir) => {
    const fullPath = path.join(rootPath, dir.dirPath);
    createDirFunc(fullPath);
  });

  //创建分享目录
  const sharDirPath = path.join(rootPath, "Share");
  createDirFunc(sharDirPath);
  
}

// 添加目录到类里面
function addDirToClass(_className, _dirInfo){
  let dirCfg = getDirListByClass(_className);
  if(dirCfg == null){
    //没有目录创建一个
    dirCfg = {className:_className, title: _className + "目录", dirList:[]};
    dirConfigList.push(dirCfg)
  }

  //没有定义显示路径，直接有打开目录的路径
  if(!_dirInfo.viewPath){
    _dirInfo.viewPath = _dirInfo.dirPath;
  }

  dirCfg.dirList.push(_dirInfo);
}

//检测玩家是否设置目录
async function checkSetRootDir(){
  const configDirPath = await getSettingValue("RootDirPath");

  if(!configDirPath || configDirPath == ""){
      //没有设置项目目录，弹出窗口提示玩家设置
      return false
  }

  return true
}

// 获取插件信息
ipcMain.handle('dir-list-info', (event) => {
  return dirConfigList;
});

//检测是否设置目录
ipcMain.on('check-root-dir', async (event) => {
    let result = await checkSetRootDir();
    console.log(result);
    event.reply('on-check-root-dir', result);
});

//判断是否是绝对路径
function isAbsolutePath(dirPath) {
  return dirPath.includes(':');
}

//打开到文件夹 dirPath相对于项目根目录
ipcMain.on('open-to-dir', async (event, dirPath) => {
    if(isAbsolutePath(dirPath)){
      shell.openPath(dirPath);
    }else{
      const configDirPath = await getSettingValue("RootDirPath");
      const fullPath = path.join(configDirPath, dirPath);
      shell.openPath(fullPath);
    }
});

//主线程调用打开目录
ipcMain.on('open-dialog', (event, isPorjectDir = false) => {
  dialog.showOpenDialog({
    properties: ['openDirectory']
  }).then(result => {
    if(result.canceled == false && result.filePaths[0]){
      if(isPorjectDir){
        setSettingValue("RootDirPath", result.filePaths[0]);
        let dirCfg = getDirListByClass("Project");
        console.log(dirCfg);
        createDefauleDir(result.filePaths[0], dirCfg.dirList);
      }
    }
    console.log(result);
    event.reply('on-open-dialog', result);
  });
});

module.exports = {
    addDirToClass,
};
