//微信支付包装
const { readConfig, writeConfig } = require('../helpers/storage')
const WechatPay = require('wechatpay-nodejs-sdk');

let WetchatPayIns = null;

const createWechatPay = async () => {
    if(WetchatPayIns){
        return WetchatPayIns;
    }

    let wechatCfg = await readConfig("pay_cfg_wechat");
    if(!wechatCfg){
        return null;
    }

    const wechatPay = new WechatPay({
      appid: wechatCfg.wxAppId,
      mchid: wechatCfg.wxMchId,
      publicKey: Buffer.from(wechatCfg.apiCertV3, 'utf8'),
      privateKey: Buffer.from(wechatCfg.apiKeyV3, 'utf8'),
      secretKey:wechatCfg.appSecret
    });

    WetchatPayIns = wechatPay;

    return WetchatPayIns;
}

module.exports = { createWechatPay }