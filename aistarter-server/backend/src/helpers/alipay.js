//阿里支付包装
const { readConfig, writeConfig } = require('../helpers/storage')
const {AlipaySdk} = require('alipay-sdk');

let AlipaySdkIns = null;

const createAlipaySdk = async () => {
    if(AlipaySdkIns){
        return AlipaySdkIns;
    }

    let alipayCfg = await readConfig("pay_cfg_alipay");
    if(!alipayCfg){
        return null;
    }

    // 实例化客户端
    const alipaySdk = new AlipaySdk({
        // 设置应用 ID
        appId: alipayCfg.appId,
        // 设置应用私钥
        privateKey: alipayCfg.privateKey,
        // 设置支付宝公钥
        alipayPublicKey: alipayCfg.alipayPublicKey,
        // 密钥类型，请与生成的密钥格式保持一致，参考平台配置一节
        // keyType: 'PKCS1',
        // 设置网关地址，默认是 https://openapi.alipay.com
        // endpoint: 'https://openapi.alipay.com',
    });

    AlipaySdkIns = alipaySdk;

    return AlipaySdkIns;
}

module.exports = { createAlipaySdk }