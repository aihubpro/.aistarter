const { readConfig, writeConfig } = require('../../helpers/storage')
const { notifyUpdateOrder } = require('../../helpers/order')
const { createWechatPay } = require('../../helpers/wechat')
const { createAlipaySdk } = require('../../helpers/alipay')
const { createPaypalSdk } = require('../../helpers/paypal')
const config = require('../../config')

//获取菜单
const getPayChannel = async (req, res) => {
  const data = require("../../datas/pay_channel.data")

  return res.json({msg:"success", data, code:0 })
}

//获取支付配置
const getPayChannelConfig = async (req, res) => {

  const { id } = req.query;
  let channelId = Number(id);

  let data = null;
  if(channelId == 1){ //支付宝
    let alipayCfg = await readConfig("pay_cfg_alipay");
    if(!alipayCfg){
      alipayCfg = require("../../datas/pay_default_cfg_alipay.data")
    }
    data = alipayCfg;
  }else if(channelId == 2){ //微信
    let wechatCfg = await readConfig("pay_cfg_wechat");
    if(!wechatCfg){
      wechatCfg = require("../../datas/pay_default_cfg_wechat.data")
    }
    data = wechatCfg;
  }else if(channelId == 3){ //paypal
    let paypalCfg = await readConfig("pay_cfg_paypal");
    if(!paypalCfg){
      paypalCfg = require("../../datas/pay_default_cfg_paypal.data")
    }
    data = paypalCfg;
  }else if(channelId == 4){ //stripe
    let stripeCfg = await readConfig("pay_cfg_stripe");
    if(!stripeCfg){
      stripeCfg = require("../../datas/pay_default_cfg_stripe.data")
    }
    data = stripeCfg;
  }else{
    return res.json({msg:"not pay channel", code:-404 })
  }

  return res.json({msg:"success", data, code:0 })
}

//更新支付配置
const updatePayChannelConfig = async (req, res) => {
  const data = req.body

  if(data.id == 1){
    //支付宝
    await writeConfig("pay_cfg_alipay", data);
  }else if(data.id == 2){
    //微信
    await writeConfig("pay_cfg_wechat", data);
  }else if(data.id == 3){
    //paypal
    await writeConfig("pay_cfg_paypal", data);
  }else if(data.id == 4){
    //stripe
    await writeConfig("pay_cfg_stripe", data);
  }else{
    return res.json({msg:"not pay channel", code:-404 })
  }

  return res.json({msg:"success", code:0 })
}

//支付宝通知
const alipayPayNotify = async (req, res) => {
  try {
    let alipaySdk = await createAlipaySdk()
    // 验签
    let returnData = req.body
    if (returnData) {
      const verify = alipaySdk.checkNotifySign(returnData);
      console.log(verify)
      if(verify){
        // 1、商户需要验证该通知数据中的out_trade_no是否为商户系统中创建的订单号，
        // 2、判断total_amount是否确实为该订单的实际金额（即商户订单创建时的金额），
        // 3、校验通知中的seller_id（或者seller_email) 是否为out_trade_no这笔单据的对应的操作方（有的时候，一个商户可能有多个seller_id/seller_email），4、验证app_id是否为该商户本身。上述1、2、3、4有任何一个验证不通过，则表明本次通知是异常通知，务必忽略。在上述验证通过后商户必须根据支付宝不同类型的业务通知，正确的进行不同的业务处理，并且过滤重复的通知结果数据。在支付宝的业务通知中，只有交易通知状态为TRADE_SUCCESS或TRADE_FINISHED时，支付宝才会认定为买家付款成功。
        if(returnData.trade_status == 'TRADE_SUCCESS'){ //交易状态:买家已付款

          const isUpdated = await notifyUpdateOrder({
              order_no:returnData.out_trade_no,
              biz_order_no:returnData.trade_no
          });

          if(!isUpdated){
            return res.status(500).send('error');
          }

          return res.send('success')
        }
      }
    }
    console.error('alipayPayNotify Verify Error:', returnData);
    return res.status(500).send("error");
  } catch (error) {
    console.error('alipayPayNotify Callback Error:', error);
    return res.status(500).send('Error processing callback: ' + error.message);
  }
}

//微信支付通知
const wechatPayNotify = async (req, res) => {
  try {
      let wechatPay = await createWechatPay();

      const { headers, body } = req;
      const isVerified = await wechatPay.verifySignature({
          body,
          signature: headers['wechatpay-signature'],
          serial: headers['wechatpay-serial'],
          nonce: headers['wechatpay-nonce'],
          timestamp: headers['wechatpay-timestamp'],
      });
      console.info('isVerified:', isVerified);
      if (isVerified && body?.event_type === 'TRANSACTION.SUCCESS') {
          const resultStr = wechatPay.decrypt(body.resource);
          const result = JSON.parse(resultStr);
          console.log(result);

          const isUpdated = await notifyUpdateOrder({
              order_no:result.out_trade_no,
              biz_order_no:result.transaction_id
          });

          if(!isUpdated){
            return res.status(500).send('error');
          }

          // await Order.findByIdAndUpdate(result.out_trade_no, { orderStatus: ORDER_STATUS.PAID });
          return res.status(200).send({ code: 'SUCCESS', message: 'Payment successful' });
      } else {
        return res.status(200).send({ code: 'FAIL', message: 'Payment failed or incomplete' });
      }
  } catch (error) {
      console.error('wechatPayNotify Callback Error:', error);
      return res.status(500).send('Error processing callback: ' + error.message);
  }

}


const getPayPlatformConfig = async(req, res) => {
  try {
    let payConfig = await readConfig("pay_platform_cfg");
    if(!payConfig){
      payConfig = require("../../datas/pay_platform_cfg.data")
    }

    return res.json({msg:"success", data:payConfig, code:0 })
  } catch (error) {
    return res.json({ msg: 'Pay config error!!', code:-1 });
  }
}

//更新支付配置
const updatePayPlatformConfig = async (req, res) => {
  const data = req.body

  await writeConfig("pay_platform_cfg", data);

  return res.json({msg:"success", code:0 })
}

//获取支付平台设置V2（更详细信息）
const getPayPlatformConfigV2 = async(req, res) => {
  try {
    let payConfig = await readConfig("pay_platform_cfg_v2");
    if(!payConfig){
      payConfig = require("../../datas/pay_platform_cfg_v2.data")
    }

    return res.json({msg:"success", data:payConfig, code:0 })
  } catch (error) {
    return res.json({ msg: 'Pay config error!!', code:-1 });
  }
}
//更新支付平台配置V2
const updatePayPlatformConfigV2 = async (req, res) => {
  const data = req.body

  const result = await writeConfig("pay_platform_cfg_v2", data);
  if(result){
    return res.json({msg:"success", code:0 })
  }else{
    return res.json({msg:"fail", code:-1 })
  }
}
//获取税收配置
const getTaxConfig = async(req, res) => {
  try {
    let taxConfig = await readConfig("tax_config");
    if(!taxConfig){
        taxConfig = require("../../datas/tax_config.data")
    }
    return res.json({msg:"success", data:taxConfig, code:0 })
  } catch (error) {
    console.error('getTaxConfig Error:', error);
    return res.json({ msg: 'Tax config error!!', code:-1 });
  }
}
//更新税收配置
const updateTaxConfig = async (req, res) => {
  const data = req.body

  const result = await writeConfig("tax_config", data);
  if(result){
    return res.json({msg:"success", code:0 })
  }else{
    return res.json({msg:"fail", code:-1 })
  }
}

//获取共创者支付配置信息
const getCoPayConfig = async(req, res) => {
  try {
    let payConfig = await readConfig("pay_collab_cfg");
    if(!payConfig){
      payConfig = require("../../datas/pay_collab_cfg.data")
    }

    return res.json({msg:"success", data:payConfig, code:0 })
  } catch (error) {
    return res.json({ msg: 'Pay config error!!', code:-1 });
  }
}

//更新共创者支付配置信息
const updateCoPayConfig = async (req, res) => {
  const data = req.body

  const result = await writeConfig("pay_collab_cfg", data);
  if(result){
    return res.json({msg:"success", code:0 })
  }else{
    return res.json({msg:"fail", code:-1 })
  }
}

//生成异步通知地址
const generateNotifyUrl = async (req, res) => {
  try {
    const { id } = req.query;
    let payConfig = await readConfig("pay_platform_cfg_v2");
    if(!payConfig){
      payConfig.hostUrl = 'https://' + config.SERVER_DOMAIN
    }
    switch (id) {
      case "1":
        return res.json({msg:"success", data:payConfig.hostUrl+"/pay/alipayPayNotify", code:0 })
      case "2":
        return res.json({msg:"success", data:payConfig.hostUrl+"/pay/wechatPayNotify", code:0 })
      case "3":
        return res.json({msg:"success", data:payConfig.hostUrl+"/pay/paypalPayNotify", code:0 })
      case "4":
        return res.json({msg:"success", data:payConfig.hostUrl+"/pay/stripePayNotify", code:0 })
      default:
        return res.json({msg:"fail", code:-1 })
    }
  }catch (error) {
    return res.json({msg:"fail", code:-1 })
  }
}
// 获取消息限制配置
const getMessageLimitConfig = async (req, res) => {
  try{
    let data = await readConfig("message_block_list");
    if(!data){
      data = require("../../datas/message_block_list.data")
    }
    return res.json({msg:"success", data:data, code:0 })
  }catch (error) {
    
    return res.json({msg:"fail", code:-1 })
  }
}

// 更新消息限制配置
const updateMessageLimitConfig = async (req, res) => {
  const data = req.body
  console.log(data)

  const result = await writeConfig("message_block_list", data);
  if(result){
    return res.json({msg:"success", code:0 })
  }else{
    return res.json({msg:"fail", code:-1 })
  }
}


module.exports = {
  getPayChannel, //获取支付渠道
  getPayChannelConfig, //获取支付渠道配置
  updatePayChannelConfig, //更新支付渠道配置

  generateNotifyUrl, //生成异步通知地址
  wechatPayNotify, //微信支付通知
  alipayPayNotify, //支付宝支付通知

  getPayPlatformConfig,  //获取支付平台配置
  updatePayPlatformConfig, //更新支付平台配置

  getPayPlatformConfigV2, //获取支付平台设置V2（更详细信息）
  updatePayPlatformConfigV2, //更新支付平台配置V2

  getCoPayConfig, //获取共创者支付配置信息
  updateCoPayConfig, //更新共创者支付配置信息

  getMessageLimitConfig, //获取消息限制配置
  updateMessageLimitConfig, //更新消息限制配置
  
  getTaxConfig, //获取税收配置
  updateTaxConfig, //更新税收配置
}
