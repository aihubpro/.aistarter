//创建订单相关方法
const pool = require('../database')
const { readConfig, writeConfig } = require('../helpers/storage')
const { createWechatPay } = require('../helpers/wechat')
const { createAlipaySdk } = require('../helpers/alipay')
const { isNumber,generateOrderNo,paypalCalcualteAmount } = require('../utils/utils')
const { createPaypalPaymentAsync } = require('../helpers/paypal')

//req：请求的对象 params：数据库表字段内容
const createOrder = async (params, req) => {

    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    if(!params.method || !params.product_type || !params.product_id){
        return null;
    }

    //TODO 创建订单
    const order = {
        method:params.method,
        product_type:params.product_type,
        product_id:params.product_id,
        coupon_code:params.couponCode,
        order_no:"",
        title:"",
        description:"",
        amount: 0,
        status:0,
        refund_status:0,
        expired_time:null,
        notify_url:"",
        client_ip:clientIp,
        user_id:req.user_id,
        user_name:req.user_name,
        merchant_id:0,
        merchant_name:'admin',
        create_time:new Date().toISOString().slice(0, 19).replace('T', ' '),
    }

    order.product_type = Number(order.product_type);

    //生成订单编号
    order.order_no = generateOrderNo();

    try {
        // //获取平台配置
        // let payConfig = await readConfig("pay_platform_cfg");
        // if(!payConfig){
        //     payConfig = require("../datas/pay_platform_cfg.data")
        // }

        //获取平台配置V2
        let payConfig = await readConfig("pay_platform_cfg_v2");
        if(!payConfig){
            payConfig = require("../datas/pay_platform_cfg_v2.data")
        }
        //获取共创者配置
        let creatorConfig = await readConfig("pay_collab_cfg");
        if(!creatorConfig){
            creatorConfig = require("../datas/pay_collab_cfg.data")
        }

        //获取产品标题和描述
        if(order.product_type == 1){
            //购买VIP
            if(isNumber(payConfig.child[(order.product_id-1)].price)){
                order.title = payConfig.child[(order.product_id-1)].title; //产品标题
                let Discount = payConfig.child[(order.product_id-1)].discount //限时优惠
                let price = payConfig.child[(order.product_id-1)].price //原价
                if(Discount && Number(Discount) > 0){
                    //限时优惠
                    order.amount = Discount * 100;
                }else{
                    order.amount = price * 100;
                }
                //判断优惠卷
                if(order.coupon_code){
                    //查询优惠卷 coupon 表 code 类型
                    const coupon = await pool.query(`SELECT * FROM coupon WHERE code = ?`, [order.coupon_code]); 
                    if(coupon.length == 0){
                        //优惠卷不存在
                        return res.json({msg:"Coupon code does not exist", code:-404 })
                    }
                    if(coupon[0].used == 1){ //优惠卷已使用
                        return res.json({msg:"Coupon code has been used", code:-404 })
                    }
                    if(new Date(coupon[0].valid_from) > new Date()){ //优惠卷未开始
                        return res.json({msg:"Coupon code has not started", code:-404 })
                    }
                    if(new Date(coupon[0].valid_to) < new Date()){ //优惠卷已过期
                        return res.json({msg:"Coupon code has expired", code:-404 })
                    }
                    if(coupon[0].min_amount > order.amount){ //最小金额限制
                        return res.json({msg:"Coupon code amount is not enough", code:-404 })
                    }
                    if(coupon[0].applicant_id == order.user_id){//用户不能使用自己领取的优惠券
                        return res.json({msg:"You cannot use your own coupon code", code:-404 })
                    }
                    if(coupon[0].discount_type == 1){ //折扣卷
                        order.amount = order.amount * coupon[0].discount_value;
                    }else if(coupon[0].discount_type == 0){ //满减卷
                        order.amount = order.amount - (coupon[0].discount_value*100);
                    }
                }
            }else{
                console.error("order error!!");
                return res.json({msg:"order error!!", code:-404 })
            }
            
        }else if(order.product_type == 1000){
            //共创者续费
            if(isNumber(creatorConfig.child[(order.product_id-1)].price)){
                order.title = creatorConfig.child[(order.product_id-1)].title; //产品标题
                let price = creatorConfig.child[(order.product_id-1)].price //原价
                order.amount = price * 100;
            }else{
                console.error("order error!!");
                return res.json({msg:"order error!!", code:-404 })
            }
        }else if(order.product_type == 2|| order.product_type == 3 || order.product_type == 4 || order.product_type == 5){ //2、ai项目，3、模型，4、插件，5、工作流

            //判断是否VIP
            let isVip = false;
            const userData = await pool.query(
                'SELECT * FROM users WHERE id = ? AND (vip_type = 2 OR (vip_type = 1 AND NOW() < vip_expire_time))',
                [req.user_id]
            );

            if(userData.length > 0){
                isVip = true;
            }

            //查询项目标题
            let projectId = Number(order.product_id);
            let dataName = 'upload';
            if(order.product_type != 2){
                dataName = 'upload_resources'
            }
            const projectData = await pool.query(
                `SELECT * FROM ${dataName} WHERE id = ?`,
                [projectId]
            );

            if(projectData.length <= 0){
                return res.json({msg:"Cannot find project", code:-404 })
            }
            //购买AI项目
            order.title = "项目：" + projectData[0].plugin_name;
            if(projectData[0].res_type){
                switch(projectData[0].res_type){
                    case 1:
                        order.title = "模型：" + projectData[0].res_name;
                        break;
                    case 2:
                        order.title = "插件：" + projectData[0].res_name;
                        break;
                    case 3:
                        order.title = "工作流：" + projectData[0].res_name;
                        break;
                    case 4:
                        order.title = "其他：" + projectData[0].res_name;
                }
            }
            if(isVip){
                order.amount =  Math.floor((projectData[0].price_value * 100) * ((100 - payConfig.vipDiscount) / 100));
            }else{
                order.amount = projectData[0].price_value * 100;
            }
            //写入共创者信息
            order.merchant_id = projectData[0].user_id;
            order.merchant_name = projectData[0].user_name;

        }

        //***********  下面这段代码必须是通用的，不要复制重新实现 ******/
        //限制支付最小值
        if(order.amount < 1){
            order.amount = 1;
        }

        //不同的支付处理
        if(params.method == "wechat"){
            let wechatCfg = await readConfig("pay_cfg_wechat");
            order.notify_url = wechatCfg.notifyUrl;

            let wechatPay = await createWechatPay();
            if(!wechatPay){
            //微信支付未配置
            return res.json({msg:"Wechat pay is not configured", code:-2 })
            }
            
            //创建支付SDK订单
            const result = await wechatPay.nativePayment({
            description: order.title,
            out_trade_no: order.order_no,
            notify_url: order.notify_url,
            amount: { total: order.amount },
            // scene_info: { payer_client_ip: order.client_ip },
            });

            console.log(`wechatPay.transactions_native.result: ${JSON.stringify(result)}`);

            order.sdk_order_result = result.code_url;
        }else if(params.method == "alipay"){

            let tmpAmount = order.amount / 100;
            if(tmpAmount < 0.01){
                tmpAmount = 0.01
            }

            //阿里支付
            let alipayCfg = await readConfig("pay_cfg_alipay");
            
            let alipaySdk = await createAlipaySdk()
        
            const result = await alipaySdk.curl('POST', '/v3/alipay/trade/precreate', {
                body: {
                    notify_url: alipayCfg.notifyUrl, // 通知回调地址
                    out_trade_no: order.order_no,
                    total_amount: tmpAmount,
                    subject: order.title,
                    // 更多参数请查看文档 https://opendocs.alipay.com/open-v3/08c7f9f8_alipay.trade.pay?scene=32&pathHash=8bf49b74
                }
            });

            order.sdk_order_result = result.data.qr_code;
            order.biz_order_no = result.traceId

        }else if(params.method == "paypal"){
            let paypalCfg = await readConfig("pay_cfg_paypal");

            //TODO 这里读取汇率(人民币对美元汇率)，算出美元。
            let tmpAmount = paypalCalcualteAmount((order.amount/100),paypalCfg.rate);
            if(tmpAmount < 0.01){
                tmpAmount = 0.01
            }

            //获取平台路径
            let payConfig = await readConfig("pay_platform_cfg_v2");
            if(!payConfig){
                console.error("平台地址未配置")
                return null;
            }

            //paypal支付
            var newPayment = {
                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "redirect_urls": {
                    "return_url": payConfig.hostUrl + "/pay/paypalReturn",
                    "cancel_url": payConfig.hostUrl + "/pay/paypalCancel"
                },
                "transactions": [{
                    "amount": {
                        "currency": "USD",
                        "total": tmpAmount.toString()
                    },
                    "description": order.title
                }]
            };
          
            let approval_url = null;
            let rePayinfo = null;  // 将声明移到这里
            try{
                rePayinfo = await createPaypalPaymentAsync(newPayment)
            
                for (var index = 0; index < rePayinfo.links.length; index++) {
                    //Redirect user to this endpoint for redirect url
                    if (rePayinfo.links[index].rel === 'approval_url') {
                        approval_url = rePayinfo.links[index].href;
                        console.log("paypal url:" + approval_url);
                    }
                }
                console.log(rePayinfo);
            
            } catch(error){
                console.log(error);
                return null;
            }

            order.sdk_order_result = approval_url;
            order.biz_order_no = rePayinfo.id

        }else if(params.method == "stripe"){
            let stripeCfg = await readConfig("pay_cfg_stripe");
            if (!stripeCfg || !stripeCfg.enable) {
                console.error("Stripe支付未配置");
                return null;
            }

            //获取平台路径
            let payConfig = await readConfig("pay_platform_cfg_v2");
            if(!payConfig){
                console.error("平台地址未配置")
                return null;
            }

            // 计算美元金额（使用汇率转换）
            let tmpAmount = (order.amount / 100) / stripeCfg.rate;
            if(tmpAmount < 0.5){ // Stripe最小金额0.5美元
                tmpAmount = 0.5
            }

            try {
                const { createStripeSession } = require('./stripe');
                
                const sessionData = {
                    title: order.title,
                    amount: tmpAmount,
                    order_no: order.order_no,
                    success_url: payConfig.hostUrl + "/pay/stripeSuccess?session_id={CHECKOUT_SESSION_ID}",
                    cancel_url: payConfig.hostUrl + "/pay/stripeCancel?session_id={CHECKOUT_SESSION_ID}"
                };

                const session = await createStripeSession(sessionData);
                
                order.sdk_order_result = session.url;
                order.biz_order_no = session.id;
                
            } catch(error){
                console.error("Stripe支付创建失败:", error);
                return null;
            }
        }else if(params.method == "balance"){ //余额支付
            order.sdk_order_result = "余额支付";
            order.biz_order_no = "balance";
        }else{
            return null;
        }

        await pool.query('INSERT INTO pay_order set ?', [order])
        return order;
    } catch (error) {
        console.error(error)
        return null;
    }
}


//更新订单(支付通知)
const notifyUpdateOrder = async (params) =>{
    const result = {
        order_no:params.order_no,
        biz_order_no:params.biz_order_no
    }
    //TODO 修改数据库订单数据
    const orderData = await pool.query('SELECT * FROM pay_order WHERE order_no = ? AND status = 0', [result.order_no]);
    if (orderData.length === 0) {
      console.error('wechatPayNotify canot find order_no:', result.order_no);
      return false;
    }

    const payTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const updateSql = `UPDATE pay_order SET status = 1, pay_time = ?, biz_order_no = ? WHERE order_no = ? AND status = 0`;
    const updateData = await pool.query(updateSql, [payTime, result.biz_order_no, result.order_no]);
    console.log(updateData)
    if(!updateData || updateData.changedRows == 0){
      console.error('wechatPayNotify update fail:', result.order_no);
      // res.status(200).send({ code: 'FAIL', message: 'Payment failed or incomplete' });
      return false;
    }

    //获取平台配置V2
    let payConfig = await readConfig("pay_platform_cfg_v2");
    if(!payConfig){
        payConfig = require("../datas/pay_platform_cfg_v2.data")
    }

    //获取共创者配置
    let creatorConfig = await readConfig("pay_collab_cfg");
    if(!creatorConfig){
        creatorConfig = require("../datas/pay_collab_cfg.data")
    }

    //处理业务逻辑
    const curOrderData = orderData[0];
    //创建订单
    let order = {
        method:'wechat',
        product_type:0,
        product_id:0,
        coupon_code:'',
        order_no:"",
        title:"",
        description:"",
        amount: 0, //金额
        status:4, //发放成功
        refund_status: 0, // 负数为退款状态(2)，正数为正常状态(0)
        expired_time:null,
        notify_url:"",
        user_id:curOrderData.user_id,
        user_name:curOrderData.user_name,
        merchant_id:0,
        merchant_name:'',
        create_time:new Date().toISOString().slice(0, 19).replace('T', ' '),
    }
    //判断用户是否绑定邀请码
    const userParentInviteCode =  await pool.query('SELECT parent_invite_code FROM users WHERE id = ?', [curOrderData.user_id]);
    if(userParentInviteCode.length>0){ 
        //获取是否开启邀请码返现
        if(payConfig.rcs){ //开启后 才会有返现
            //判断最低返现金额
            if(curOrderData.amount >= 100){ //1元起反现
                //获取邀请码返现比例，以及邀请人信息
                const ParentInviteRate = await pool.query('SELECT * FROM users WHERE invite_code = ?', [userParentInviteCode[0].parent_invite_code]);
                if(ParentInviteRate.length>0){
                    if(ParentInviteRate[0].invite_commission_rate>0&&ParentInviteRate[0].invite_commission_rate<=100){ //不能超出限制
                        order.title = `推广分成`;
                        order.description = `邀请人支付订单，获得推广分成`;
                        order.amount = curOrderData.amount * ParentInviteRate[0].invite_commission_rate / 100;
                        order.status = 7; //邀请奖励
                        order.merchant_id = ParentInviteRate[0].id;
                        order.merchant_name = ParentInviteRate[0].username;
                        //生成订单编号
                        order.order_no = generateOrderNo();
                        order.sdk_order_result = JSON.stringify(order.order_no);
                        //插入订单
                        await pool.query('INSERT INTO pay_order SET ?', order);
                        //更新用户余额
                        await pool.query('UPDATE users_info SET balance = balance + ? WHERE user_id = ?', [order.amount, ParentInviteRate[0].id]);
                    }
                }
            }
        }
    }
    if (curOrderData.product_type === 1) { //aistarter vip
      // 获取当前时间并加上一年
      const now = new Date();
      // const oneYearLater = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      const vipdate = payConfig.child[curOrderData.product_id-1].expire
      //根据product_id判断是多少天的会员
      const nowDate = new Date(now.getTime() + (vipdate * 24 * 60 * 60 * 1000));

      //会员区分 期限和永久 1:期限 2:永久
      let vipType = 1;
      if(vipdate == 0){ //永久
        vipType = 2;
      }

      // 构建 SQL 更新语句
      const updateUserSql = `
        UPDATE users 
        SET vip_type = ?,
            vip_expire_time = CASE
                                WHEN vip_expire_time IS NOT NULL AND vip_expire_time > NOW()
                                THEN DATE_ADD(vip_expire_time, INTERVAL ? DAY)
                                ELSE ?
                            END
        WHERE id = ?
      `;

        // 执行 SQL 更新操作
        const updateUserData = await pool.query(updateUserSql, [vipType,vipdate, nowDate.toISOString().slice(0, 19).replace('T', ' '), curOrderData.user_id]);
        console.log(updateUserData)
        if (!updateUserData || updateUserData.affectedRows === 0) {
          console.error('Update vip error:', result.order_no);
          // res.status(200).send({ code: 'FAIL', message: 'Payment failed or incomplete' });
          return false;
        }
        if(curOrderData.coupon_code){ //使用优惠码的订单
            // 获取优惠码信息
            const couponData = await pool.query(`SELECT * FROM coupon WHERE code =?`, [curOrderData.coupon_code]);
            if(couponData.length == 0){
                //优惠卷不存在
                return false
            }
            //查询申请者是否存在
            const couponUserData = await pool.query(`SELECT * FROM coupon_apply WHERE applicant_id =?`, [couponData[0].applicant_id]);
            if(couponUserData.length == 0){
                //申请者不存在
                return false
            }
            // 更新优惠表优惠码使用信息
            const updateCouponSql = `
                UPDATE coupon
                SET used = 1,user_id = ?,user_name = ?, usage_time = NOW()
                WHERE code =?
            `;
            // 执行 SQL 更新操作
            const updateCouponData = await pool.query(updateCouponSql, [curOrderData.user_id,curOrderData.user_name,curOrderData.coupon_code]);
            if (!updateCouponData||updateCouponData.affectedRows === 0) { 
                console.error('Update coupon error:', result.order_no);
                return false;
            }
            order.title = `奖励金额发放`;
            order.description = `推广奖励金额发放`;
            order.amount = couponData[0].cashback_amount;
            order.status = 4; //发放成功
            order.merchant_id = couponUserData[0].applicant_id;
            order.merchant_name = couponUserData[0].applicant_name;
            //生成订单编号
            order.order_no = generateOrderNo();
            order.sdk_order_result = JSON.stringify(order.order_no);
            //插入奖励订单
            await pool.query('INSERT INTO pay_order set ?', [order])
            // 返现金额到用户余额和记录优惠码使用记录
            const updateBalanceSql = `
                UPDATE users_info
                SET balance = balance + ?,coupon_used_count = coupon_used_count + 1
                WHERE user_id = ?
            `;
            const updateBalanceData = await pool.query(updateBalanceSql, [couponData[0].cashback_amount,couponData[0].applicant_id]);
            if(!updateBalanceData||updateBalanceData.affectedRows === 0){
                console.error('Update balance error:', result.order_no);
                return false;
            }
        }
    }else if (curOrderData.product_type === 1000) { // 共创者 续费
        // 获取当前时间并加上一年
      const now = new Date();
      // const oneYearLater = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      const vipdate = creatorConfig.child[curOrderData.product_id-1].expire
      //根据product_id判断是多少天的会员
      const nowDate = new Date(now.getTime() + (vipdate * 24 * 60 * 60 * 1000));

      //续费区分 期限和永久 1:期限 2:永久
      let vipType = 1;
      if(vipdate == 0){ //永久
        vipType = 2;
      }

      // 构建 SQL 更新语句
      const updateUserSql = `
        UPDATE collaborator 
        SET coll_type = ?,
            state = 2,
            expiry_time = CASE
                                WHEN expiry_time IS NOT NULL AND expiry_time > NOW()
                                THEN DATE_ADD(expiry_time, INTERVAL ? DAY)
                                ELSE ?
                            END
        WHERE id = ?
      `;

      // 执行 SQL 更新操作
      const updateUserData = await pool.query(updateUserSql, [vipType,vipdate, nowDate.toISOString().slice(0, 19).replace('T', ' '), curOrderData.user_id]);

      if (!updateUserData || updateUserData.affectedRows === 0) {
        console.error('Update vip error:', result.order_no);
        // res.status(200).send({ code: 'FAIL', message: 'Payment failed or incomplete' });
        return false;
      }
    }

    return true;
}


//检测订单支付状态 (AI项目是否可以使用)
const checkPurchaseStatus = async (productType, productId, userId, userRole) => {

    try {
        // 检查产品是否存在
        const productResult = await pool.query('SELECT id, price_type, price_value FROM upload WHERE id = ?', [productId]);
        if (productResult.length === 0) {
            throw new Error('Product not found');
        }

        const { price_type, price_value } = productResult[0];

        
        //免费项目
        if (price_type === 1) {
            return true;
        }

        //除了免费，其他需要用户登录的，未登录返回false
        if(!userId){
            return false;
        }

        if(userRole === 1){
            //管理角色特殊处理
            return true;
        }

        // 判断VIP专享项目
        if (price_type === 3) {
            const userData = await pool.query(
            'SELECT * FROM users WHERE id = ? AND (vip_type = 2 OR (vip_type = 1 AND NOW() < vip_expire_time))',
            [userId]
            );
            if (userData.length === 0 && price_value === 0) {
                // 用户不是VIP且项目仅限VIP
                return false;
            }
            // 用户是VIP或项目不限制VIP
            return true;
        }

        // 非VIP专享项目的订单检查
        const orderData = await pool.query(
            'SELECT id, order_no FROM pay_order WHERE status = 1 AND user_id = ? AND product_type = ? AND product_id = ?',
            [userId, productType, productId]
        );
        return orderData.length > 0; // 用户已购买则返回true，否则返回false
    } catch (error) {
        console.error("Error checking purchase status:", error);
        throw error; // 抛出异常给调用者处理
    }
};

//检测订单支付状态 (资源是否可以使用)
const checkResPurchaseStatus = async (productType, productId, userId, userRole) => {

    try {
        // 检查产品是否存在
        const productResult = await pool.query('SELECT id, price_type, price_value FROM upload_resources WHERE id = ?', [productId]);
        if (productResult.length === 0) {
            throw new Error('Product not found');
        }

        const { price_type, price_value } = productResult[0];

        
        //免费项目
        if (price_type === 1) {
            return true;
        }

        //除了免费，其他需要用户登录的，未登录返回false
        if(!userId){
            return false;
        }

        if(userRole === 1){
            //管理角色特殊处理
            return true;
        }

        // 判断VIP专享项目
        if (price_type === 3) {
            const userData = await pool.query(
            'SELECT * FROM users WHERE id = ? AND (vip_type = 2 OR (vip_type = 1 AND NOW() < vip_expire_time))',
            [userId]
            );
            if (userData.length === 0 && price_value === 0) {
                // 用户不是VIP且项目仅限VIP
                return false;
            }
            // 用户是VIP或项目不限制VIP
            return true;
        }

        // 非VIP专享项目的订单检查
        const orderData = await pool.query(
            'SELECT id, order_no FROM pay_order WHERE status = 1 AND user_id = ? AND product_type = ? AND product_id = ?',
            [userId, productType, productId]
        );
        return orderData.length > 0; // 用户已购买则返回true，否则返回false
    } catch (error) {
        console.error("Error checking purchase status:", error);
        throw error; // 抛出异常给调用者处理
    }
};

module.exports = { createOrder, notifyUpdateOrder, checkPurchaseStatus,checkResPurchaseStatus }