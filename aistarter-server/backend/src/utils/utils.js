const crypto = require('crypto');
//判断是否为数字
function isNumber(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
}
//生成订单号
const generateOrderNo = () => {
    const timestamp = new Date().getTime(); // 当前时间戳
    const randomPart = Math.floor(Math.random() * 10000); // 随机数部分
    return `ORDER${timestamp}${randomPart}`;
}
//生成退款单号
const generateRefundNo = () => {
    const timestamp = new Date().getTime(); // 当前时间戳
    const randomPart = Math.floor(Math.random() * 10000); // 随机数部分
    return `REFUND${timestamp}${randomPart}`;
}
//生成个人邀请码
const generateInviteCode = () => {
    const timestamp = new Date().getTime().toString().slice(-8); // 取时间戳后8位
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0'); // 4位随机数
    return `INV${timestamp}${randomPart}`; // INV + 8位时间戳 + 4位随机数 = 15位
}
//生成企业代码
const generateEnterpriseCode = () => {
    const timestamp = Date.now(); // 当前时间戳
    const randomPart = Math.floor(Math.random() * 1000); // 随机数部分
    return `ENT${timestamp}${randomPart}`;
}
//生成随机优惠码单号
const generateCouponNo = (prefix = 'COUPON', secretKey = 'aistarter20250630') => {
    const timestamp = new Date().getTime(); // 当前时间戳
    const randomPart = Math.floor(Math.random() * 10000); // 随机数部分
    const dataToSign = `${prefix}${timestamp}${randomPart}`;
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(dataToSign);
    const hash = hmac.digest('hex').substring(0, 16); // 取16位
    return `${prefix}${hash}`;
}
//传入人民币转换美元的汇率计算结果返回
function paypalCalcualteAmount(yuan,rate=0.14,round=2) { // yuan 是人民币金额，rate 是汇率 默认 0.14 ，Round 是保留的小数位数 默认保留两位小数
    return (yuan*rate).toFixed(round);  //人民币转换美元，保留两位小数
}
//时间格式化
function formatDate(date) {
    // 如果传入的是字符串，先转换为Date对象
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    // 检查是否为有效的Date对象
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return null;
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 月份从 0 开始，所以 +1
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
//数据库时间格式化
function formatToMySQLDateTime(dateStr, isEnd = false) {
  if (!dateStr) return null;
  // 如果是纯日期（不带T），补时间
  if (/^\\d{4}-\\d{2}-\\d{2}$/.test(dateStr)) {
    return isEnd
      ? dateStr + ' 23:59:59'
      : dateStr + ' 00:00:00';
  }
  // 其它情况，转为北京时间
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  // 转为北京时间
  const bjDate = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const pad = n => n < 10 ? '0' + n : n;
  return bjDate.getFullYear() + '-' +
    pad(bjDate.getMonth() + 1) + '-' +
    pad(bjDate.getDate()) + ' ' +
    (isEnd ? '23:59:59' : '00:00:00');
}
//判断内容是否包含链接
function isContainsLink(comment, enableWhitelist = false) {
  let textToProcess = comment;
  
  // 0. 白名单检查：u-img 格式的图片链接不被识别为包含链接（可开关）
  if (enableWhitelist) {
    const uImgRegex = /u-img\[http:\/\/[^\]]+\]/g;
    textToProcess = textToProcess.replace(uImgRegex, '');
  }

  // 1. 预处理：移除零宽字符、规范化Unicode、移除干扰字符
  let cleanText = textToProcess
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // 移除零宽字符
    .normalize('NFKC') // Unicode规范化
    .replace(/[\s*·•]/g, '') // 移除干扰字符
    .toLowerCase(); // 转为小写

  // 2. 检测标准URL
  const urlRegex = /(?:https?:\/\/|www\.)[^\s]+/i;
  if (urlRegex.test(cleanText)) return true;

  // 3. 检测域名后缀
  const domainRegex = /[a-z0-9][a-z0-9-]{1,61}[a-z0-9]\.[a-z]{2,}(?:\.[a-z]{2,})?/g;
  if (domainRegex.test(cleanText)) return true;

  // 4. 检测IP地址
  const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/;
  if (ipRegex.test(cleanText)) return true;

  // // 5. 检测替代词
  // const alternatives = ['dot', 'at', 'slash', 'colon', '点', '。', '．'];
  // if (alternatives.some(alt => cleanText.includes(alt))) return true;

  return false;
}

/**
 * 检测文本中是否包含违禁词
 * @param {string} text - 要检测的文本
 * @param {string[]} bannedWords - 违禁词数组
 * @returns {Object} 检测结果，包含是否有违禁词和找到的违禁词
 */
function containsBannedWords(text, bannedWords) {
  // 预处理文本：移除零宽字符、规范化Unicode、转为小写
  const cleanText = text
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // 移除零宽字符
    .normalize('NFKC') // Unicode规范化
    .toLowerCase(); // 转为小写
  
  // 检查每个违禁词
  for (const word of bannedWords) {
    // 创建正则表达式，匹配单词边界或整个字符串
    const pattern = new RegExp(`\\b${word.toLowerCase()}\\b`, 'i');
    
    // 检查是否包含违禁词
    if (pattern.test(cleanText)) {
      return {
        hasBannedWords: true,
        bannedWord: word
      };
    }
    
    // 检查绕过技巧：插入空格或特殊字符
    const spacedWord = word.split('').join('[\\s\\W]*');
    const spacedPattern = new RegExp(spacedWord, 'i');
    if (spacedPattern.test(cleanText)) {
      return {
        hasBannedWords: true,
        bannedWord: word,
        bypassDetected: true
      };
    }
  }
  
  return { hasBannedWords: false };
}

class KeyManager {
    constructor() {
      this.keys = null;
    }
  
    generate(algorithm = 'rsa') {
      this.keys = crypto.generateKeyPairSync(algorithm, {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });
      return this.keys;
    }
  
    getPrivateKey() {
      return this.keys?.privateKey;
    }
  
    getPublicKey() {
      return this.keys?.publicKey;
    }
  
    encrypt(data) {
      return crypto.publicEncrypt(this.keys.publicKey, Buffer.from(data));
    }
  
    decrypt(encrypted) {
      return crypto.privateDecrypt(this.keys.privateKey, encrypted).toString();
    }
  
    sign(data) {
      const signer = crypto.createSign('sha256');
      signer.update(data);
      return signer.sign(this.keys.privateKey, 'hex');
    }
  
    verify(data, signature) {
      const verifier = crypto.createVerify('sha256');
      verifier.update(data);
      return verifier.verify(this.keys.publicKey, signature, 'hex');
    }
  }

module.exports = {
    isNumber, //判断是否为数字
    generateOrderNo, //生成订单号
    generateRefundNo, //生成退款单号
    generateInviteCode, //生成个人邀请码
    generateEnterpriseCode, //生成企业代码
    generateCouponNo, //生成随机优惠码单号
    paypalCalcualteAmount, //保留两位小数
    formatDate, //时间格式化
    KeyManager, //加密解密
    formatToMySQLDateTime, //数据库时间格式化
    isContainsLink, //判断内容是否包含链接
    containsBannedWords, //判断内容是否包含敏感词
};
