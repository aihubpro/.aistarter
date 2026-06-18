## h5支付

```js
const result = await wechatPay.h5Payment({
        description: `购买${product.name}`,
        out_trade_no: order.id,
        notify_url: `${WECHAT_NOTIFY_URL}/api/payment/callback`,
        amount: { total: product.price },
        scene_info: { payer_client_ip: req.ip },
});
```