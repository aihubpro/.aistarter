// constants.js

// 开源版本使用占位符，请将 __URL_PLACEHOLDER__ 替换为你的实际接口地址
const CONFIG_URL_1 = '__URL_PLACEHOLDER__';
const CONFIG_URL_2 = '__URL_PLACEHOLDER__';


let Constants = {

  shareUrl:'',

  uploadUrl: CONFIG_URL_1,
  apiUrl: CONFIG_URL_1,
  wsUrl: CONFIG_URL_1.replace('http://', 'ws://').replace('https://', 'wss://'),

  _IsOpenCdn:false,

  setOpenCdn:function(isOpen){
    this._IsOpenCdn = isOpen;
    if(isOpen){
      this.uploadUrl = CONFIG_URL_2;
      this.apiUrl = CONFIG_URL_2;
      this.wsUrl = CONFIG_URL_2.replace('http://', 'ws://').replace('https://', 'wss://');
    }else{
      this.uploadUrl = CONFIG_URL_1;
      this.apiUrl = CONFIG_URL_1;
      this.wsUrl = CONFIG_URL_1.replace('http://', 'ws://').replace('https://', 'wss://');
    }
  }
};

module.exports = Constants;