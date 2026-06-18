## 签名验证
```js
const isVerified = await wechatPay.verifySign({
    body,
    signature: headers['wechatpay-signature'],
    serial: headers['wechatpay-serial'],
    nonce: headers['wechatpay-nonce'],
    timestamp: headers['wechatpay-timestamp'],
});
```