## JSAPI支付 或 小程序支付

```js
const result = await wechatPay.jsapiPayment({
        description: `购买${product.name}`,
        out_trade_no: order.id,
        notify_url: `${WECHAT_NOTIFY_URL}/api/payment/callback`,
        amount: { total: product.price ,currency: "CNY"},
        payer: {
          openid: "用户的openid（可通过调用微信接口获取）"
        }
});
```
