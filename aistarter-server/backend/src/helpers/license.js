const crypto = require('crypto');
const fs = require('fs');
const { readConfig } = require('./storage')
const os = require('os');
const { execSync } = require('child_process');
const getCoConfig = require("../datas/co_create_config_info.data")
const config = require('../config');
const axios = require('axios');
// 在文件顶部添加缓存
const licenseCache = new Map();
const CACHE_KEY = 'license';
// 公钥
const publicKey = config.PUBLICKEY;
// 创建license文件
function createLicenseFile(data,privateKey) {
  try{
    // 读取私钥
    // const privateKey = fs.readFileSync('./license/private_key.pem', 'utf8');
    // 定义 License 数据
    const licenseData = {...data};
    // 将 License 数据序列化为 JSON 字符串
    const licenseString = JSON.stringify(licenseData);
    // 使用私钥对 License 数据签名
    function signLicense(data, privateKey) {
        const sign = crypto.createSign('SHA256'); // 使用 SHA-256 哈希算法
        sign.update(data);
        sign.end();
        return sign.sign(privateKey, 'base64'); // 返回 Base64 编码的签名
    }

    const signature = signLicense(licenseString, privateKey);
    // 生成 License 文件
    const licenseFile = {
        data: licenseData,
        signature: signature,
    };

    // 将 License 文件保存到文件
    if(!updateLicenseFileInfo(licenseFile)){
      return false
    }

    console.log('License 文件已生成并保存到 license.json');
    return true
  }catch(e){
    console.log(e)
    return false
  }
}
// 创建license数据
function createLicenseData(data,privateKey) {
  try{
    // 读取私钥
    // const privateKey = fs.readFileSync('./license/private_key.pem', 'utf8');
    // 定义 License 数据
    const licenseData = data;
    // 将 License 数据序列化为 JSON 字符串
    const licenseString = JSON.stringify(licenseData)
    // 使用私钥对 License 数据签名
    function signLicense(data, privateKey) {
        const sign = crypto.createSign('SHA256'); // 使用 SHA-256 哈希算法
        sign.update(data);
        sign.end();
        return sign.sign(privateKey, 'base64'); // 返回 Base64 编码的签名
    }

    const signature = signLicense(licenseString, privateKey);
    // 生成 License 文件
    const licenseFile = {
        data: licenseData,
        signature: signature,
    };
    return licenseFile
  }catch(e){
    console.log(e)
    return false
  }
}

// 验证 License 文件
function verifyLicenseFile() {
  try{
    // 读取 License 文件
    const licenseFile = getLicenseFileInfo();

    // 提取 License 数据和签名
    const { data, signature } = licenseFile;
    const licenseString = JSON.stringify(data);

    // 使用公钥验证签名
    function verifyLicense(data, signature, publicKey) {
    const verify = crypto.createVerify('SHA256'); // 使用 SHA-256 哈希算法
    verify.update(data);
    verify.end();
    return verify.verify(publicKey, signature, 'base64'); // 验证 Base64 编码的签名
    }

    const isValid = verifyLicense(licenseString, signature, publicKey);

    if (isValid) {
      return true
    } else {
      return false
    } 
  }catch(e){
    return false
  }
}
// 验证 License 数据
function verifyLicenseData(licensedata,customPublicKey = publicKey) {

    // 读取 License 数据
    const licenseData = licensedata;

    // 提取 License 数据和签名
    const { data, signature } = licenseData;
    const licenseString = JSON.stringify(data);

    // 使用公钥验证签名
    function verifyLicense(data, signature, customPublicKey) {
    const verify = crypto.createVerify('SHA256'); // 使用 SHA-256 哈希算法
    verify.update(data);
    verify.end();
    return verify.verify(customPublicKey, signature, 'base64'); // 验证 Base64 编码的签名
    }

    const isValid = verifyLicense(licenseString, signature, customPublicKey);

    if (isValid) {
      return true
    } else {
      return false
    } 
}
// 获取 license 文件信息
function getLicenseFileInfo() {
  // 检查缓存
  if (licenseCache.has(CACHE_KEY)) {
    return licenseCache.get(CACHE_KEY);
  }
  try {
    // 读取文件并设置缓存
    const data = JSON.parse(fs.readFileSync('./license/license.json', 'utf8'));
    licenseCache.set(CACHE_KEY, data);
    return data;
  } catch (error) {
    console.error('读取 license 文件失败:', error);
    return null;
  }
}
// 更新 license 文件信息
function updateLicenseFileInfo(data) {
  try{
    if (!fs.existsSync('./license')) { // 如果目录不存在，则创建目录
      fs.mkdirSync('./license');
    }
    // 将 License 文件保存到文件
    fs.writeFileSync('./license/license.json', JSON.stringify(data, null, 2));
    // 更新缓存
    licenseCache.set(CACHE_KEY, data);
    return true
  }catch(e){
    console.error('更新 license 文件失败:', e);
    return false 
  }
}
//获取服务器状态
async function getserverStatus(val=0) {
  let CoConfig = await readConfig("co_create_config_info");
  if(!CoConfig){
    CoConfig = getCoConfig
  }
  if(config.IS_PARENT){
    return false;
  }
  if(CoConfig.server_status == val){
    return false;
  }
  return true;
}
//返回服务器状态信息
async function getserverStatusText() {
  let CoConfig = await readConfig("co_create_config_info");
  if(!CoConfig){
    CoConfig = getCoConfig
  }
  return CoConfig.server_status;
}
// 获取本机机械码
function getMachineId() {
  let id = '';

  try {
    switch (os.platform()) {
      case 'win32': // Windows
        id = execSync('wmic csproduct get uuid').toString().split('\n')[1].trim();
        break;
      case 'darwin': // macOS
        id = execSync("system_profiler SPHardwareDataType | awk '/Hardware UUID/ { print $3 }'").toString().trim();
        break;
      case 'linux': // Linux
        id = execSync('cat /var/lib/dbus/machine-id || cat /etc/machine-id').toString().trim();
        break;
      default:
        throw new Error('Unsupported platform');
    }
  } catch (error) {
    console.error('获取机器码失败:', error.message);
    return null;
  }

  return id;
}
//判断机器码是否一致
function isMachineIdEqual() {
  try{
    const currentMachineId = getMachineId();
    // 读取 License 文件
    const licenseFile = getLicenseFileInfo();
    return currentMachineId === licenseFile.data.machine_id;
  }catch(e){
    return false;
  }
}
// 判断是否过期
function isLicenseExpired() {
  try{
    const currentTime = new Date();
    // 读取 License 文件
    const licenseFile = getLicenseFileInfo();
    return currentTime > new Date(licenseFile.data.expire_time);
  }catch(e){
    return false;
  }
}


module.exports = { 
    createLicenseFile, // 创建License文件
    verifyLicenseFile, // 验证License文件
    createLicenseData, // 创建License数据
    verifyLicenseData, // 验证License数据
    getLicenseFileInfo, // 获取License文件信息
    updateLicenseFileInfo, // 更新License文件信息
    getserverStatus, // 获取服务器状态
    getserverStatusText, // 返回服务器状态信息
    getMachineId, // 获取本机机械码
    isMachineIdEqual, // 判断机器码是否一致
    isLicenseExpired, // 判断是否过期
};