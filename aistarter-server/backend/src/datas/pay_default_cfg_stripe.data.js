//Stripe支付默认配置
// Stripe 密钥: 请替换为你自己的 Stripe 密钥
// 获取方式: https://dashboard.stripe.com/apikeys
const stripeDefaultConfig = {
  "id": 4,
  "publishableKey": "__STRIPE_PUBLISHABLE_KEY_PLACEHOLDER__",
  "secretKey": "__STRIPE_SECRET_KEY_PLACEHOLDER__",
  "webhookSecret": "",
  "rate": 7.0, // 人民币对美元汇率
  "enable": false,
  "notifyUrl": "",
  "currency": "usd",
  "sandbox": true, // 是否为测试环境
  "remark": "Stripe信用卡支付",
};

module.exports = stripeDefaultConfig