## 合单下单-APP

```js
const params = {
  combine_out_trade_no: "主订单号",
  sub_orders: [
    {
      mchid: "商户ID",
      amount: {
        total_amount: 1,
        currency: "CNY",
      },
      out_trade_no: "子订单号",
      description: "测试1",
      attach: "测试",
    },
  ],
  notify_url: "回调url",
};

await wechatPay.combineAppPayment(params);
```
