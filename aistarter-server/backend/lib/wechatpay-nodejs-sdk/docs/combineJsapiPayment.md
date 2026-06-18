```js
const wechatPay = new WechatPay({
  appid: WECHAT_APP_ID, //服务器ID
  mchid: WECHAT_MCH_ID, //商务ID
  secretKey: SECRET_KEY, //V3密钥
  publicKey: fs.readFileSync("./apiclient_cert.pem"), //商户的公钥
  privateKey: fs.readFileSync("./apiclient_key.pem"), //商户的私钥
});
```

合单JSAPI支付

```js
 const params = {
    combine_out_trade_no: '主订单号',
    sub_orders: [
      {
        mchid: '商户ID',
        amount: {
          total_amount: 1,
          currency: 'CNY',
        },
        out_trade_no: '子订单号',
        description: '测试1',
        attach: '测试',
      },
    ],
    notify_url: '回调url',
  };
```
```js
 await wechatPay.combineJsapiPayment(params)
```
