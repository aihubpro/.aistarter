//验证码操作类
const recordMailCode = {}; // 存储发送邮件验证码的对象

// 发送验证码前检查发送频率
function checkSendingFrequency(email) {
  const currentTime = new Date().getTime();
  if (recordMailCode[email] && currentTime - recordMailCode[email].time < 60000) {
    return false;
  }
  return true;
}

// 清理过期的验证码记录
function cleanExpiredRecords() {
  const currentTime = new Date().getTime();
  for (const email in recordMailCode) {
    if (currentTime - recordMailCode[email].time > 360000) { // 超过6分钟
      console.log('deleting expired email code:', email);
      delete recordMailCode[email];
    }
  }
}

// 生成验证码
function generateEmailCode() {
  let emailCode = "";
  for (let i = 0; i < 6; i++) {
    emailCode += Math.floor(Math.random() * 10);
  }
  return emailCode;
}

// 记录验证码
function recordEmailCode(email, emailCode) {
  const currentTime = new Date().getTime();
  const codeData = {
    code: emailCode,
    time: currentTime
  };
  recordMailCode[email] = codeData;
}

// 验证验证码
function verifyEmailCode(email, code) {
  if (!recordMailCode[email]) {
    return { success: false, error: "Verification code does not exist" };
  }
  if (Number(recordMailCode[email].code) !== Number(code)) {
    return { success: false, error: "Verification code error" };
  }
  const currentTime = new Date().getTime();
  if (currentTime - recordMailCode[email].time > 300000) {
    return { success: false, error: "Verification code expired" };
  }
  delete recordMailCode[email]; // 验证成功后删除验证码记录
  return { success: true };
}

// 删除特定用户的验证码记录
function deleteEmailCodeRecord(email) {
    if(recordMailCode[email]){
        delete recordMailCode[email];
    }
}

module.exports = {
  checkSendingFrequency,
  cleanExpiredRecords,
  generateEmailCode,
  recordEmailCode,
  verifyEmailCode,
  deleteEmailCodeRecord
};