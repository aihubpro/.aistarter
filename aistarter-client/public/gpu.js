//获取gup信息
const { app, ipcMain } = require('electron')
const { spawn } = require('child_process');

let curGupInfo = null

function getGupInfo(){

  let tmpGupStr = "";

  const childProcess = spawn('wmic path win32_VideoController where "AdapterRAM > 0" get /format:list', {shell:true, encoding:'utf8'});

  childProcess.stdout.on('data', (stdout) => {
    tmpGupStr += stdout.toString();
  });

  // 返回 Promise，以便在命令执行完成后处理结果
  return new Promise((resolve, reject) => {
    childProcess.on('close', (code) => {
      if (code === 0) {

        // 将文本数据按行分割
        const lines = tmpGupStr.split('\n');

        // 创建一个对象来保存键值对
        const dataObject = {};

        // 遍历每一行并解析键值对
        lines.forEach(line => {
            const [key, value] = line.split('=');
            if(key && key.replace(/\r/g, '') != ""){
              dataObject[key] = value.replace(/\r/g, '');
            }
        });

        curGupInfo = dataObject;

        resolve(curGupInfo);
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

function getNvidiaSmi(){

  let tmpGupStr = "";

  const childProcess = spawn('nvidia-smi', {shell:true, encoding:'utf8'});

  childProcess.stdout.on('data', (stdout) => {
    tmpGupStr += stdout.toString();
  });

  // 返回 Promise，以便在命令执行完成后处理结果
  return new Promise((resolve, reject) => {
    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve(tmpGupStr);
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

 

module.exports = {
  getGupInfo,
  getNvidiaSmi,
};
