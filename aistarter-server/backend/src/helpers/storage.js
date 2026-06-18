const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require("../config")

const configsDir = './configs';
// AES-256-CBC 加密密钥: 请替换为 32 位十六进制字符串
// 生成方式: node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
const secretKey = '__AES_SECRET_KEY_PLACEHOLDER__';

// 加密数据
function encryptData(data) {
  const iv = crypto.randomBytes(16); // 生成一个随机的初始化向量
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey), iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { iv: iv.toString('hex'), content: encrypted };
}

// 解密数据
function decryptData(encryptedData) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey), Buffer.from(encryptedData.iv, 'hex'));
  let decrypted = decipher.update(encryptedData.content, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// 添加内存缓存
const configCache = new Map();

// 写入配置文件
async function writeConfig(key, data) {
  // 创建目录如果不存在
  if (!fs.existsSync(configsDir)) {
    fs.mkdirSync(configsDir);
  }

  const encryptedData = encryptData(JSON.stringify(data));
  const filePath = path.join(configsDir, `${key}.json`);

  try {
    // 先更新内存缓存
    configCache.set(key, data);
    
    await fs.promises.writeFile(filePath, JSON.stringify(encryptedData), 'utf8');
    console.log(`Configuration ${key} saved successfully.`);
    return true;
  } catch (err) {
    // 写入失败时删除缓存
    configCache.delete(key);
    console.error(`Error saving configuration ${key}:`, err);
    return false;
  }
}

// 读取配置文件
function readConfig(key) {
  // 优先从内存缓存读取
  if (configCache.has(key)) {
    return configCache.get(key);
  }
  
  const filePath = path.join(configsDir, `${key}.json`);

  try {
    const encryptedDataStr = fs.readFileSync(filePath, 'utf8');
    const encryptedData = JSON.parse(encryptedDataStr);
    const decryptedData = decryptData(encryptedData);
    const parsedData = JSON.parse(decryptedData);
    // 将从文件读取的数据存入缓存
    configCache.set(key, parsedData);
    return parsedData;
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(`Configuration file ${key} not found.`);
      return null;
    }
    console.error(`Error reading configuration ${key}:`, err);
    return null;
  }
}

// 导出函数
module.exports = {
  writeConfig,
  readConfig
};