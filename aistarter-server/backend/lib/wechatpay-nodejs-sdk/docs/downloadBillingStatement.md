## 下载账单

前置条件：通过调用申请账单接口，并获取到 `download_url` 参数

```js
const { download_url } = await wechatPay.requestTradeBill({
  bill_date: bill_date,
  bill_type: 'ALL',
  tar_type: 'GZIP'
});

// 获取到账单文件的数据流
const result = await wechatPay.downloadBillingStatement(download_url);
```

