# wechatpay-nodejs-sdk

wechatpay-nodejs-sdk 是一个用于 Node.js 的微信支付集成库。它提供了简单易用的方法来与微信支付 API 进行交互，包括签名验证、发送请求、处理微信支付回调等功能。

## 功能特性

- 发送支付请求（如 Native 支付请求）
- 验证微信支付回调的签名
- 解密微信支付加密数据
- 缓存和获取微信支付公钥

## 安装

您可以通过 npm 来安装这个库：

```bash
npm install wechatpay-nodejs-sdk
```

## 快速开始

以下是一个如何使用 wechatpay-nodejs-sdk 发送支付请求和处理微信支付回调的简单示例：

```javascript
const express = require('express');
const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');
const Order = require('../models/Order');
const logger = require('../logger');
const WechatPay = require('wechatpay-nodejs-sdk');
const router = express.Router();
const { ORDER_STATUS } = require('../constants');
const { WECHAT_NOTIFY_URL } = require('../config');
const { WECHAT_APP_ID, WECHAT_MCH_ID, SECRET_KEY } = require('../config');
const wechatPay = new WechatPay({
    appid: WECHAT_APP_ID,
    mchid: WECHAT_MCH_ID,
    publicKey: fs.readFileSync('./apiclient_cert.pem'),
    privateKey: fs.readFileSync('./apiclient_key.pem'),
    secretKey:SECRET_KEY
  });
async function createOrder(productId) {
    const product = await Product.findById(productId);
    if (!product) {
        throw new Error('Product not found');
    }
    const newOrder = new Order({
        product: productId,
        totalFee: product.price,
        orderStatus: ORDER_STATUS.UNPAID
    });
    await newOrder.save();
    return { newOrder, product };
}
async function initiateWechatPay(order, product, req) {
    const result = await wechatPay.transactions_native({
        description: `购买${product.name}`,
        out_trade_no: order.id,
        notify_url: `${WECHAT_NOTIFY_URL}/api/payment/callback`,
        amount: { total: product.price },
        scene_info: { payer_client_ip: req.ip },
    });
    logger.info(`wechatPay.transactions_native.result: ${JSON.stringify(result)}`);
    const { code_url } = result;
    await Order.findByIdAndUpdate(order.id, { code_url });
    return code_url;
}
/**
 * @swagger
 * /api/payment/native/{productId}:
 *   get:
 *     tags:
 *       - Payment
 *     summary: 发起微信支付原生交易
 *     description: 为指定产品创建新订单并发起微信支付原生交易。
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: 产品的唯一ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功发起支付交易
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code_url:
 *                   type: string
 *                   description: 微信支付二维码URL
 *                 orderNo:
 *                   type: string
 *                   description: 订单ID
 *       404:
 *         description: 产品未找到
 *       500:
 *         description: 服务器内部错误
 */
router.get('/native/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const { newOrder, product } = await createOrder(productId);
        const code_url = await initiateWechatPay(newOrder, product, req);
        res.send({ code_url, orderNo: newOrder.id });
    } catch (error) {
        logger.error('Native Pay Error:', error);
        res.status(error.message === 'Product not found' ? 404 : 500).send(error.message);
    }
});
/**
 * @swagger
 * /api/payment/callback:
 *   post:
 *     tags:
 *       - Payment
 *     summary: 微信支付回调端点
 *     description: 接收来自微信支付的支付通知。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event_type:
 *                 type: string
 *               resource:
 *                 type: object
 *     responses:
 *       200:
 *         description: 成功处理回调
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                 message:
 *                   type: string
 *       500:
 *         description: 处理回调时出错
 */
router.post('/callback', async (req, res) => {
    try {
        const { headers, body } = req;
        const isVerified = await wechatPay.verifySign({
            body,
            signature: headers['wechatpay-signature'],
            serial: headers['wechatpay-serial'],
            nonce: headers['wechatpay-nonce'],
            timestamp: headers['wechatpay-timestamp'],
        });
        logger.info('isVerified:', isVerified);
        if (isVerified && body?.event_type === 'TRANSACTION.SUCCESS') {
            const resultStr = wechatPay.decrypt(body.resource);
            const result = JSON.parse(resultStr);
            await Order.findByIdAndUpdate(result.out_trade_no, { orderStatus: ORDER_STATUS.PAID });
            res.status(200).send({ code: 'SUCCESS', message: 'Payment successful' });
        } else {
            res.status(200).send({ code: 'FAIL', message: 'Payment failed or incomplete' });
        }
    } catch (error) {
        logger.error('Callback Error:', error);
        res.status(500).send('Error processing callback: ' + error.message);
    }
});
/**
 * @swagger
 * /api/payment/order/{orderNo}:
 *   get:
 *     tags:
 *       - Payment
 *     summary: 查询微信支付交易状态
 *     description: 使用订单号检索特定微信支付交易的状态。
 *     parameters:
 *       - in: path
 *         name: orderNo
 *         required: true
 *         description: 唯一订单号
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功检索交易状态
 *       500:
 *         description: 查询交易时出错
 */
router.get('/order/:orderNo', async (req, res) => {
    try {
        const { orderNo } = req.params;
        const result = await wechatPay.query({ out_trade_no: orderNo });
        logger.info(`wechatPay.query.result: ${JSON.stringify(result)}`);
        res.status(200).send(result);
    } catch (error) {
        logger.error('Error fetching transaction:', error);
        res.status(500).send('Error querying transaction');
    }
});
/**
 * @swagger
 * /api/payment/order/{orderNo}/close:
 *   get:
 *     tags:
 *       - Payment
 *     summary: 关闭微信支付交易
 *     description: 使用订单号关闭正在进行的微信支付交易。
 *     parameters:
 *       - in: path
 *         name: orderNo
 *         required: true
 *         description: 唯一订单号
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 订单成功关闭
 *       500:
 *         description: 关闭订单时出错
 */
router.get('/order/:orderNo/close', async (req, res) => {
    try {
        const { orderNo } = req.params;
        await wechatPay.close({ out_trade_no: orderNo });
        await Order.findByIdAndUpdate(orderNo, { orderStatus: ORDER_STATUS.CLOSED });
        res.send({ message: 'Order successfully closed' });
    } catch (error) {
        logger.error('Error closing order:', error);
        res.status(500).send('Error closing order');
    }
});
module.exports = router;
```

## 文档

更多详细信息，请参阅[文档](https://github.com/zhangrenyang/wechatpay-nodejs-sdk/wiki)。

## 贡献

欢迎贡献！如果您有任何改进建议或功能请求，请在 [GitHub 仓库](https://github.com/zhangrenyang/wechatpay-nodejs-sdk)中创建一个 issue。

## 许可证

此项目采用 MIT 许可证。有关详细信息，请参阅 [LICENSE](LICENSE) 文件。

