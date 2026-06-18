```js
/**
 * refunds
 * @param {Object} refundsParams
 * @param {string} refundsParams.out_refund_no - 商户退款单号
 * @param {AmountReq} refundsParams.amount - 金额信息
 * @param {string} [refundsParams.transaction_id] - 微信支付订单号，与out_trade_no二选一
 * @param {string} [refundsParams.out_trade_no] - 商户订单号，与transaction_id二选一
 * @param {string} [refundsParams.reason] - 退款原因
 * @param {string} [refundsParams.notify_url] - 退款结果回调url
 * @param {string} [refundsParams.funds_account] - 退款资金来源
 * @param {array[GoodsDetail]} [refundsParams.goods_detail] - 退款商品
 */
async requestRefund(refundsParams = {}){
    const url = `/v3/refund/domestic/refunds`;
    return await this.request('POST', url, { ...refundsParams });
}
```
