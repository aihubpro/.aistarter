## Native支付

```js
const result = await wechatPay.transactions_native({
        description: `购买${product.name}`,
        out_trade_no: order.id,
        notify_url: `${WECHAT_NOTIFY_URL}/api/payment/callback`,
        amount: { total: product.price },
        scene_info: { payer_client_ip: req.ip },
});
```