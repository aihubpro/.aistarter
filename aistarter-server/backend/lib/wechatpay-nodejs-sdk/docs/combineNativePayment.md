```js
const wechatPay = new WechatPay({
  appid: WECHAT_APP_ID, //服务商 appid
  mchid: WECHAT_MCH_ID, //服务商 商户号
  secretKey: SECRET_KEY, //V3密钥
  publicKey: fs.readFileSync("./apiclient_cert.pem"), //服务商的公钥
  privateKey: fs.readFileSync("./apiclient_key.pem"), //服务商的私钥
});
```

合单NATIVE支付

```js
 const params = {
    combine_out_trade_no: '主订单号',//string(32)【合单商户订单号】 合单支付总订单号，最短2个字符，最长32个字符，只能是数字、大小写字母，以及_-|* ，且在同一个商户号下唯一
    sub_orders: [
      {
        mchid: '商户ID',  //string(32) 【子单商户号】
        amount: {
          total_amount: 1, //init 【标价金额】
          currency: 'CNY', //string(8)【标价币种】 符合ISO 4217标准的三位字母代码，人民币：CNY
        },
        out_trade_no: '子订单号',//string(32)【子单商户订单号】需要自定义，规则:最短2个字符，最长32个字符，只能是数字、大小写字母_-|* ，且在同一个商户号下唯一                     
        description: '测试1', //string(128)【商品描述】 商品简单描述。需传入应用市场上的APP名字-实际商品名称，天天爱消除-游戏充值
        attach: '测试',  //string(128)【附加数据】 附加数据，在查询API和支付通知中原样返回，可作为自定义参数使用。
      },
    ],
    notify_url: '回调url',//string【通知地址】 接收微信支付异步通知回调地址，通知url必须为直接可访问的url，不能携带参数。必须使用https协议。
  };
```
```js
 await wechatPay.combineNativePayment(params)
```
