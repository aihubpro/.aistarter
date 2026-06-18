// configManager.js

const fs = require('fs').promises;
const path = require('path');
const { app, ipcMain } = require('electron');

const configPath = path.join(app.getPath('userData'), 'config.json');

let tokenData = null;

let userInfo = null; //记录玩家信息

let cacheConfig = null; //缓存的配置信息，不重复读取

console.log(configPath);

// 读取配置文件
async function loadConfig() {

    if(cacheConfig){
      return cacheConfig;
    }

    try {
      // 检查配置文件是否存在，如果不存在则创建一个空对象
      await fs.access(configPath);
    } catch (error) {
      console.error('Config file does not exist, creating a new one.');
      await saveConfig({});
    }
  
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      cacheConfig = JSON.parse(content);
      
      return cacheConfig;
    } catch (error) {
      console.error('Error reading config file:', error.message);
      return {};
    }
  }

// 保存配置文件
async function saveConfig(config) {
  try {
    const content = JSON.stringify(config, null, 2);
    await fs.writeFile(configPath, content, 'utf-8');

    return true;
  } catch (error) {
    console.error('Error saving config file:', error.message);
    return false;
  }
}

// 读取配置信息，如果路径为空则弹出设置窗口
async function getConfig(configKey) {
  const config = await loadConfig();
  return config[configKey];
}

// 设置配置信息
async function setConfig(configKey, configValue) {
    const config = await loadConfig();
    config[configKey] = configValue;
    
    return await saveConfig(config);
}

// 设置token
async function setToken(token){
  tokenData = token;
}

async function getToken(){
  return tokenData;
}

// 设置用户信息
async function setUserInfo(info){
  userInfo = info;
}

async function getUserInfo(){
  return userInfo;
}

// 在主进程中监听渲染进程的事件
ipcMain.on('get-config', async (event, configKey) => {
  const configValue = await getConfig(configKey);
  event.reply('on-get-config', configValue);
});

ipcMain.on('set-config', async (event, configKey, configValue) => {
  const ret =  await setConfig(configKey, configValue);
  event.reply('on-set-config', ret);
});

ipcMain.on('set-config-token', async (event, token) => {
  await setToken(token);
})

ipcMain.on('set-config-userinfo', async (event, info) => {
  console.log(info);
  await setUserInfo(info);
})

module.exports = {
  getConfig,
  setConfig,
  setToken,
  getToken,
  setUserInfo,
  getUserInfo
};
