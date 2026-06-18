## APP支付

```js
const result = await wechatPay.appPayment({
    description: '商品描述',
    out_trade_no: '订单号',
    notify_url: '微信支付结果通知的回调地址',
    amount: {
        total: '订单总金额',
        currency: 'CNY'
    },
    scene_info: {
        payer_client_ip: req.ip // 用户终端IP
    }
})
```