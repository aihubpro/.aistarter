## 关闭合单

```js
const params = {
  combine_out_trade_no: "", // 合单商户订单号
  sub_orders: [
    {
      "mchid": "1900000109", // 子单商户号
      "out_trade_no": "20150806125346" // 子单商户订单号
    }
  ]
};

await wechatPay.closeCombinedOrder(params);
```
