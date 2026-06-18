## 支付方式
| API名称 | 函数名                                   | 贡献者名称 | 完成情况 |
|---------|---------------------------------------|------------|---------|
| [H5支付](https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_3_1.shtml) | [h5Payment](docs/h5Payment.md)        | [vitalboyzf](https://github.com/vitalboyzf) | [√] |
| [Native支付](https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_4_1.shtml) | [nativePayment](docs/nativePayment.md) | [zhangrenyang](https://github.com/zhangrenyang) | [√] |
| [App支付](https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_2_1.shtml) | [appPayment](docs/appPayment.md)      | [dpgirl](https://github.com/dpgirl) | [√] |
| [JSAPI支付 或 小程序支付](https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_1_1.shtml) | [jsapiPayment](docs/jsapiPayment.md)  | [MyNewGH](https://github.com/MyNewGH) | [√] |
| [合单H5支付](https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter5_1_2.shtml) | `combineH5Payment`                    | [zzs](https://github.com/zhangzs000) | [√ ] | 
| [合单Native支付](https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter5_1_5.shtml) | `combineNativePayment`                | [水镜](https://github.com/2119855865/) | [ ] |
| [合单App支付](https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter5_1_1.shtml) | `combineAppPayment`                   | [阿立](https://github.com/Michael-py001) | [√] |
| [合单JSAPI支付 或 小程序支付](https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter5_1_3.shtml) | `combineJsapiPayment`                 | [jaylan](https://github.com/han6054) | [ ] |

## 订单管理

| API名称                                                                    | 函数名                        | 贡献者名称                                   | 完成情况 |
| -------------------------------------------------------------------------- | ----------------------------- | -------------------------------------------- | -------- |
| [查询订单](https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_1_2.shtml)  | [queryOrder](docs/queryOrder.md) | [zhangrenyang](https://github.com/zhangrenyang) | [√]     |
| [关闭订单](https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_1_3.shtml)  | [closeOrder](docs/closeOrder.md) | [zhangrenyang](https://github.com/zhangrenyang) | [√]     |
| [查询合单](https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter5_1_11.shtml) | `queryCombinedOrder`        | [donglize](https://github.com/donglize521521)                                       | [ ]      |
| [关闭合单](https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter5_1_12.shtml) | `closeCombinedOrder`        | [fengchunsun](https://github.com/fengchunsun2016/wechatpay-nodejs-sdk)                                         | [ ]      |

## 账单和资金管理
| API名称 | 函数名 | 贡献者名称 | 完成情况 |
|---------|--------|------------|----------|
| [申请交易账单](https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_1_6.shtml) | `requestTradeBill` | [QbjGKNick](https://github.com/QbjGKNick) | [√] |
| [申请资金账单](https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_1_7.shtml) | `requestFundFlowBill` | [aique127](https://github.com/aique127) | [ ] |
| [下载账单](https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_1_8.shtml) | `downloadBillingStatement` | [Licodeao](https://github.com/Licodeao) | [√] |

## 退款和分账 
| API名称 | 函数名 | 贡献者名称 | 完成情况 |
|---------|--------|------------|----------|
| [申请退款](https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_2_9.shtml) | [`requestRefund`](docs/requestRefund.md) | [flyingmyangel](https://github.com/flyingmyangel) | [√] |
| [查询退款](https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_2_10.shtml) | `queryRefund` | [lemoye](https://github.com/lemoye622) | [ ] |
| [分账](https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter8_1_1.shtml) | `createProfitSharingOrder` | [yuyansun](https://github.com/Irenia111) | [ ] |

## 安全和验证

| API名称                                                                                                               | 函数名                                                  | 贡献者名称                                   | 完成情况 |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------- | -------- |
| [解密信息](https://pay.weixin.qq.com/docs/merchant/development/interface-rules/sensitive-data-encryption.html)           | [decrypt](docs/decrypt.md)                                 | [zhangrenyang](https://github.com/zhangrenyang) | [√]     |
| [签名验证](https://pay.weixin.qq.com/docs/merchant/development/interface-rules/signature-verification.html)              | [verifySignature](docs/verifySignature.md)                 | [zhangrenyang](https://github.com/zhangrenyang) | [√]     |
| [根据序列号获取公钥](https://pay.weixin.qq.com/docs/merchant/apis/platform-certificate/api-v3-get-certificates/get.html) | [fetchWechatPayPublicKey](docs/fetchWechatPayPublicKey.md) | [zhangrenyang](https://github.com/zhangrenyang)                                         | [√]      |

## 其他功能

| API名称                                                                                                                           | 函数名               | 贡献者名称 | 完成情况 |
| --------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ---------- | -------- |
| [微信提现到零钱](https://pay.weixin.qq.com/docs/merchant/apis/batch-transfer-to-balance/transfer-batch/initiate-batch-transfer.html) | `transferToWallet` | [zzs](https://github.com/zhangzs000)      | [] |
