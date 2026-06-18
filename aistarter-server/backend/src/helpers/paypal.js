//阿里支付包装
const { readConfig, writeConfig } = require('./storage')

const PaypalSdk = require('paypal-node-sdk');

let PaypalSdkIns = null;

const createPaypalSdk = async () => {
    if(PaypalSdkIns){
        return PaypalSdkIns;
    }
    let paypalCfg = await readConfig("pay_cfg_paypal");

    //TODO 读取配置
    PaypalSdk.configure({
        'mode': paypalCfg.sandbox?'sandbox':'live', //sandbox or live
        'client_id': paypalCfg.clientID,
        'client_secret': paypalCfg.secret
      });

    PaypalSdkIns = PaypalSdk;

    return PaypalSdkIns;
}

//创建异步请求
const createPaypalPaymentAsync = async (newPayment) => {

    let paypalSdk = await createPaypalSdk();

    return new Promise((resolve, reject) => {
      paypalSdk.payment.create(newPayment, function (error, payment) {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          resolve(payment); // 成功时返回 payment 和 url
        }
      });
    });
  }

module.exports = { createPaypalSdk, createPaypalPaymentAsync }