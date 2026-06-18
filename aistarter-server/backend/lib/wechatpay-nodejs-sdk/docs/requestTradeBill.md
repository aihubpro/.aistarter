## 申请交易账单

```js
const result = await wechatPay.requestTradeBill({
  bill_date: bill_date,
  bill_type: 'ALL',
  tar_type: 'GZIP'
});
```