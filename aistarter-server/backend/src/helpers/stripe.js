//Stripe支付包装
const { readConfig } = require('./storage')
const stripe = require('stripe');

let StripeInstance = null;

const createStripeSdk = async () => {
    if(StripeInstance){
        return StripeInstance;
    }
    
    let stripeCfg = await readConfig("pay_cfg_stripe");
    if (!stripeCfg || !stripeCfg.enable) {
        console.error('Stripe配置未启用或不存在');
        return null;
    }

    // 创建Stripe实例
    StripeInstance = stripe(stripeCfg.secretKey);

    return StripeInstance;
}

//创建Stripe支付会话
const createStripeSession = async (sessionData) => {
    try {
        const stripeInstance = await createStripeSdk();
        if (!stripeInstance) {
            throw new Error('Stripe SDK未配置');
        }
        
        // 创建Stripe Checkout会话
        const session = await stripeInstance.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: sessionData.title,
                    },
                    unit_amount: Math.round(sessionData.amount * 100), // Stripe使用分为单位
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: sessionData.success_url,
            cancel_url: sessionData.cancel_url,
            metadata: {
                order_no: sessionData.order_no
            }
        });
        
        return session;
    } catch (error) {
        console.error('创建Stripe会话失败:', error);
        throw error;
    }
}

//验证Stripe webhook
const verifyStripeWebhook = async (payload, signature) => {
    try {
        let stripeCfg = await readConfig("pay_cfg_stripe");
        if (!stripeCfg || !stripeCfg.webhookSecret) {
            throw new Error('Stripe webhook密钥未配置');
        }
        
        const stripeInstance = await createStripeSdk();
        if (!stripeInstance) {
            throw new Error('Stripe SDK未配置');
        }
        
        // 验证Stripe webhook签名
        const event = stripeInstance.webhooks.constructEvent(payload, signature, stripeCfg.webhookSecret);
        return event;
    } catch (error) {
        console.error('验证Stripe webhook失败:', error);
        throw error;
    }
}

module.exports = { createStripeSdk, createStripeSession, verifyStripeWebhook }