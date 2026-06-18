const pool = require('../database')
const { readConfig, writeConfig } = require('../helpers/storage')
const config = require('../config')
const axios = require('axios');
const { verifyPassword } = require('../helpers/functions')
const { paypalCalcualteAmount } = require('../utils/utils')
const { createOrder,notifyUpdateOrder } = require('../helpers/order')
const { createPaypalSdk } = require('../helpers/paypal')

//AI Starter 接口
const vipPrice = async(req, res) => {
  try {
    let payConfig = await readConfig("pay_platform_cfg_v2");
    if(!payConfig){
      payConfig = require("../datas/pay_platform_cfg_v2.data")
    }
    const plans = payConfig.child.map((item, index) => {
      return {
        productType:1,
        productId:(index + 1),
        price: Number(item.price)?Number(item.price):item.price,
        discountPrice:Number(item.discount),
      }
    })

    return res.json({msg:"success", plans, code:0 })
  } catch (error) {
    return res.json({ msg: 'Pay config error!!', code:-1 });
  }
}

// 共创者 续费 接口
const coPayPrice = async(req, res) => {
  try {
    if(!config.IS_PARENT){ // 如果不是主服务器，则中转到主服务器
      try {
        const response = await axios.get(`${config.PARENT_DOMAIN}/pay/getCoRenewList`);
        return res.json(response.data);
      } catch (error) {
        console.error('Error forwarding to parent server:', error);
        return res.json({ msg: 'Parent server error', code: -500 });
      }
    }
    let payConfig = await readConfig("pay_collab_cfg");
    if(!payConfig){
      payConfig = require("../../datas/pay_collab_cfg.data")
    }
    const plans = payConfig.child.map((item, index) => {
      return {
        productType:1000,
        productId:(index + 1),
        price: Number(item.price)?Number(item.price):item.price,
        title:item.title,
        desc:item.desc,
      }
    })

    return res.json({msg:"success", plans, code:0 })
  } catch (error) {
    return res.json({ msg: 'Pay config error!!', code:-1 });
  }
}

const vipPriceV2 = async(req, res) => {
  try {
    let payConfig = await readConfig("pay_platform_cfg_v2");
    if(!payConfig){
      payConfig = require("../datas/pay_platform_cfg_v2.data")
    }
    const plans = payConfig.child.map((item, index) => {
      return {
        ...item,
        productType:1,
        productId:(index + 1),
        price: Number(item.price)?Number(item.price):item.price,
        discount:Number(item.discount),
      }
    })

    // const plans = [{
    //   productType:1,
    //   productId:1,
    //   price: Number(payConfig.yearVipPrice),
    //   discountPrice:Number(payConfig.yearVipDiscount),
    // },
    // {
    //   productType:1,
    //   productId:2,
    //   price: Number(payConfig.permanentVipPrice),
    //   discountPrice:Number(payConfig.permanentVipDiscount),
    // },
    // {
    //   productType:1,
    //   productId:3,
    //   price: -1,
    //   discountPrice:0,
    // }]

    return res.json({msg:"success", plans, code:0 })
  } catch (error) {
    return res.json({ msg: 'Pay config error!!', code:-1 });
  }
}

//获取支付订单
const getPayOrder = async (req, res) => {
  //判断是否有请求头是否有access-renew
  if(req.headers['access-renew']){
    if(!config.IS_PARENT){ //非主服务器，直接转发到主服务器
      //有的话，直接转发到主服务器
      try {
        const response = await axios.get(`${config.PARENT_DOMAIN}/pay/getPayOrder`, {
          params: req.query,
          headers: {
            ...req.headers,
            host: new URL(config.PARENT_DOMAIN).host // 修正 host 头
          }
        });
        return res.json(response.data);
      } catch (error) {
        console.error('Error forwarding to parent server:', error);
        return res.json({ msg: 'Parent server error', code: -500 });
      }
    }
  }
  //TODO 请求参数：支付方式、产品类型、产品id
  const { pay_type, product_type, product_id,couponCode } = req.query;

  //创建订单
  let payParams = {}
  payParams.method = pay_type;
  payParams.product_type = product_type;
  payParams.product_id = product_id;
  payParams.couponCode = couponCode; //优惠券码
  
  const orderInfo = await createOrder(payParams, req);
  if(orderInfo){
    return res.json({code_url:orderInfo.sdk_order_result, title:orderInfo.title, amount:orderInfo.amount, order_no:orderInfo.order_no, code:0 })
  }else{
    return res.json({msg:"Create order error", code:-1 })
  }
}

const checkPayOrder = async (req, res) => {
  //判断是否有请求头是否有access-renew
  if(req.headers['access-renew']){
    if(!config.IS_PARENT){ //非主服务器，直接转发到主服务器
      //有的话，直接转发到主服务器
      try {
        const response = await axios.get(`${config.PARENT_DOMAIN}/pay/checkPayOrder`, {
          params: req.query,
          headers: {
            ...req.headers,
            host: new URL(config.PARENT_DOMAIN).host // 修正 host 头
          }
        });
        return res.json(response.data);
      } catch (error) {
        console.error('Error forwarding to parent server:', error);
        return res.json({ msg: 'Parent server error', code: -500 });
      }
    }
  }
  const { order_no } = req.query;
  try {
    const orderData = await pool.query('SELECT * FROM pay_order WHERE order_no = ?', [order_no]);
    if (orderData.length === 0) {
      return res.json({ msg: 'Order no error', code:-404 });
    }

    // 获取订单状态
    const orderState = orderData[0].status;
    return res.json({ code: 0, state:orderState});

  } catch (error) {
    return res.json({ msg: 'Order no error', code:-1 });
  }
}

//前端获取支付类型列表
const getPayTypeList = async (req, res) => {
  try{
    let data=[];
    //支付宝
    let alipayCfg = await readConfig("pay_cfg_alipay");
    if(alipayCfg){
      if(alipayCfg.enable){
        data.push({
          name:"支付宝支付",
          description:"使用支付宝扫码支付",
          payname:"alipay",
        })
      }
    }
    //微信
    let wechatCfg = await readConfig("pay_cfg_wechat");
    if(wechatCfg){
      if(wechatCfg.enable){
        data.push({
          name:"微信支付",
          description:"使用微信扫码支付",
          payname:"wechat",
        })
      }
    }
    //paypal
    let paypalCfg = await readConfig("pay_cfg_paypal");
    if(paypalCfg){
      if(paypalCfg.enable){
        data.push({
          name:"PayPal",
          description:"使用PayPal支付",
          payname:"paypal",
        })
      }
    }
    //stripe
    let stripeCfg = await readConfig("pay_cfg_stripe");
    if(stripeCfg){
      if(stripeCfg.enable){
        data.push({
          name:"Stripe",
          description:"使用信用卡支付",
          payname:"stripe",
        })
      }
    }
  
    return res.json({msg:"success", data, code:0 })
  }catch (error) {
    console.log(error)
    return res.json({ msg: 'Order no error', code:-1 });
  }
}


const paypalReturn = async (req, res) => {
  let paypalCfg = await readConfig("pay_cfg_paypal");
   //获取平台配置
  let payConfig = await readConfig("pay_platform_cfg_v2");
  if(!payConfig){
    payConfig = require("../datas/pay_platform_cfg_v2.data")
  }

   //TODO 重定向一个界面，支付成功的界面 （界面放到www静态界面）

   const { paymentId, token, PayerID } = req.query;

   const orderData = await pool.query('SELECT * FROM pay_order WHERE biz_order_no = ?', [paymentId]);
   if (orderData.length === 0) {
      //TODO 重定向到失败界面
      return res.redirect(`${payConfig.hostUrl}/fail.html`);
   }

   if(orderData[0].status != 0){
      //订单不是支付中
      //TODO 跳转到失败界面
      return res.redirect(`${payConfig.hostUrl}/fail.html`);
   }

   let paypalSdk = await createPaypalSdk();

   
    //TODO 这里读取汇率(人民币对美元汇率)，算出美元。
    let tmpAmount = paypalCalcualteAmount((orderData[0].amount/100),paypalCfg.rate);
    if(tmpAmount < 0.01){
        tmpAmount = 0.01
    }

   const execute_payment_json = {
    "payer_id": PayerID,
    "transactions": [{
        "amount": {
            "currency": "USD",
            "total": tmpAmount.toString()
        }
    }]
  };

  paypalSdk.payment.execute(paymentId, execute_payment_json, async (error, payment) => {
    if (error) {
        console.error(error.response);
        //TODO 跳转到失败界面
        return res.redirect(`${payConfig.hostUrl}/fail.html`);
    } else {
        console.log("payment execute:")
        console.log(payment)

        const isUpdated = await notifyUpdateOrder({
            order_no:orderData[0].order_no,
            biz_order_no:paymentId
        });
        
        if(!isUpdated){
          //更新数据库失败
          //TODO 跳转到失败界面
          return res.redirect(`${payConfig.hostUrl}/fail.html`);
        }else{
          //TODO 跳转到成功界面
          return res.redirect(`${payConfig.hostUrl}/success.html`);
        }
    }
  });
}

const paypalCancel = async (req, res) => {
  //TODO 重定向一个界面，支付失败界面
  const { token } = req.query;
  //获取平台配置
  let payConfig = await readConfig("pay_platform_cfg_v2");
  if(!payConfig){
    payConfig = require("../datas/pay_platform_cfg_v2.data")
  }
  //更新订单状态
  //更新订单状态为取消(3)
  const updateSql = `UPDATE pay_order SET status = 3 
    WHERE status = 0 
    AND sdk_order_result LIKE '%token=${token}%'`;
  await pool.query(updateSql, [token]);
  
  //重定向到支付失败页面
  return res.redirect(`${payConfig.hostUrl}/fail.html`);
}

//Stripe支付成功回调
const stripeSuccess = async (req, res) => {
  //获取平台配置
  let payConfig = await readConfig("pay_platform_cfg_v2");
  if(!payConfig){
    payConfig = require("../datas/pay_platform_cfg_v2.data")
  }

  const { session_id } = req.query;

  try {
    // 根据session_id查找订单
    const orderData = await pool.query('SELECT * FROM pay_order WHERE biz_order_no = ?', [session_id]);
    if (orderData.length === 0) {
      return res.redirect(`${payConfig.hostUrl}/fail.html`);
    }

    if(orderData[0].status != 0){
      // 订单不是支付中状态
      return res.redirect(`${payConfig.hostUrl}/fail.html`);
    }

    // TODO: 验证Stripe支付状态
    // const { createStripeSdk } = require('../helpers/stripe');
    // const stripe = await createStripeSdk();
    // const session = await stripe.checkout.sessions.retrieve(session_id);
    // if (session.payment_status !== 'paid') {
    //   return res.redirect(`${payConfig.hostUrl}/fail.html`);
    // }

    // 更新订单状态
    const isUpdated = await notifyUpdateOrder({
      order_no: orderData[0].order_no,
      biz_order_no: session_id
    });
    
    if(!isUpdated){
      return res.redirect(`${payConfig.hostUrl}/fail.html`);
    } else {
      return res.redirect(`${payConfig.hostUrl}/success.html`);
    }
  } catch (error) {
    console.error('Stripe success callback error:', error);
    return res.redirect(`${payConfig.hostUrl}/fail.html`);
  }
}

//Stripe支付取消回调
const stripeCancel = async (req, res) => {
  //获取平台配置
  let payConfig = await readConfig("pay_platform_cfg_v2");
  if(!payConfig){
    payConfig = require("../datas/pay_platform_cfg_v2.data")
  }
  
  const { session_id } = req.query;
  
  // 更新订单状态为取消(3)
  if (session_id) {
    const updateSql = `UPDATE pay_order SET status = 3 WHERE status = 0 AND biz_order_no = ?`;
    await pool.query(updateSql, [session_id]);
  }
  
  // 重定向到支付失败页面
  return res.redirect(`${payConfig.hostUrl}/fail.html`);
}

//Stripe Webhook处理
const stripeWebhook = async (req, res) => {
  try {
    const { verifyStripeWebhook } = require('../helpers/stripe');
    const signature = req.headers['stripe-signature'];
    
    // 验证webhook签名
    const event = await verifyStripeWebhook(req.body, signature);
    
    // 处理不同的事件类型
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const orderNo = session.metadata.order_no;
        
        if (orderNo) {
          const isUpdated = await notifyUpdateOrder({
            order_no: orderNo,
            biz_order_no: session.id
          });
          
          if (!isUpdated) {
            console.error('Failed to update order:', orderNo);
            return res.status(400).send('Order update failed');
          }
        }
        break;
      
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }
    
    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).send('Webhook error');
  }
}

//余额支付
const balancePay = async (req, res) => {
  const { orderNo,password } = req.body;
  try{
    //判断密码是否正确
    const user = await pool.query("SELECT password FROM users WHERE id = ?", [req.user_id]);
    const isVerifyPassword = await verifyPassword(password, user[0].password);
    if(!isVerifyPassword){
      return res.json({ msg: 'Password error', code:-403 });
    }
    //TODO 获取用户余额
    const userBalance = await pool.query("SELECT balance FROM users_info WHERE user_id = ?", [req.user_id]);
    if(userBalance.length == 0){
      return res.json({ msg: 'User not found', code:-404 });
    }
    //TODO 获取订单信息
    const orderInfo = await pool.query("SELECT * FROM pay_order WHERE order_no = ?", [orderNo]);
    if(orderInfo.length == 0){
      return res.json({ msg: 'Order not found', code:-404 });
    }
    //TODO 判断用户余额是否足够
    if(userBalance[0].balance < orderInfo[0].amount){
      return res.json({ msg: '余额不足', code:-403 });
    }
    // TODO 修改状态
    const isUpdated = await notifyUpdateOrder({
        order_no:orderInfo[0].order_no,
        biz_order_no:orderInfo[0].biz_order_no,
    });
    if(!isUpdated){
      return res.json({ msg: 'Database Error', code:-500 });
    }else{
      // TODO 扣款
      const updateBalanceSql = `UPDATE users_info SET balance = balance - ? WHERE user_id = ?`;
      await pool.query(updateBalanceSql, [orderInfo[0].amount, req.user_id]);
    }
    //TODO 返回结果
    return res.json({ msg: 'Success', code:200 });
  }catch(err){
    console.log(err);
    return res.json({ msg: 'Database Error', code:500 });
  }
}

module.exports = {
  vipPrice, 
  vipPriceV2,
  coPayPrice,
  getPayOrder,
  checkPayOrder,
  getPayTypeList,
  paypalReturn,
  paypalCancel,
  stripeSuccess,
  stripeCancel,
  stripeWebhook,
  balancePay
}
