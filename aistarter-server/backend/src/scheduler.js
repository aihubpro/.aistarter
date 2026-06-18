const schedule = require('node-schedule');
const {verifyLicenseFile,isMachineIdEqual,isLicenseExpired,isParentOnline} = require('./helpers/license');
const config = require('./config');
const { readConfig, writeConfig } = require('./helpers/storage')
const getCoConfig = require("./datas/co_create_config_info.data")
const axios = require('axios');
const fs = require('fs');
const pool = require('./database')
// License 签名数据: 请替换为你自己的 License 签名
// 这些签名需要用你自己的 RSA 私钥生成
// 生成方式: 在管理后台 -> License管理 -> 通过私钥生成对应的签名

//封号
const accban = {
    "data": {
      "server_status": "3",
      "ban_end_time": null,
      "ban_reason": "机器码不同"
    },
    "signature": "__ACCBAN_SIGNATURE_PLACEHOLDER__"
  }
// 异常
const exception = {
    "data": {
      "server_status": "2",
      "ban_end_time": null,
      "ban_reason": ""
    },
    "signature": "__EXCEPTION_SIGNATURE_PLACEHOLDER__"
  }
// 过期
const expired = {
    "data": {
      "server_status": "1",
      "ban_end_time": null,
      "ban_reason": ""
    },
    "signature": "__EXPIRED_SIGNATURE_PLACEHOLDER__"
  }// 初始化定时任务
function initScheduler() {
    // 每月执行一次（每月1号凌晨1点）
    schedule.scheduleJob('0 1 1 * *', async () => {
        try {
            console.log('开始执行月度收入统计任务...');
            // 每月任务逻辑
            // 每月任务逻辑
            // 计算上个月的起止时间
            const { formatDate } = require('./utils/utils');
            const { readConfig } = require('./helpers/storage')
            //获取平台配置V2
            let payConfig = await readConfig("pay_platform_cfg_v2");
            if(!payConfig){
                payConfig = require("./datas/pay_platform_cfg_v2.data")
            }
            let platformFeeRate = payConfig.platformFee / 100;
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth(); // 0-11
            const lastMonth = month === 0 ? 11 : month - 1;
            const lastMonthYear = month === 0 ? year - 1 : year;
            // 上个月第一天
            const startDate = new Date(lastMonthYear, lastMonth, 1, 0, 0, 0);
            const startOfLastMonth = formatDate(startDate);
            // 上个月最后一天
            const endDate = new Date(lastMonthYear, lastMonth + 1, 0, 23, 59, 59);
            const endOfLastMonth = formatDate(endDate);
            // 查询上个月每个商家的订单数据
            let rows = await pool.query(`
                SELECT merchant_id, merchant_name, 
                    COUNT(*) AS pay_count,
                    SUM(CASE WHEN refund_status=1 THEN 1 ELSE 0 END) AS refund_count,
                    SUM(CASE WHEN refund_status=0 THEN amount ELSE 0 END) AS income_amount,
                    SUM(CASE WHEN refund_status=1 THEN amount ELSE 0 END) AS refund_amount
                FROM pay_order
                WHERE status = 1 AND create_time BETWEEN ? AND ?
                GROUP BY merchant_id, merchant_name
            `, [startOfLastMonth, endOfLastMonth]);
            // 插入到 user_monthly_income_audit 表
            if (!Array.isArray(rows)) rows = [rows];
            for(const row of rows) {
                //查询用户是否有独立的平台费
                const platformfee = await pool.query(`SELECT platform_fee FROM users WHERE id = ?`, [row.merchant_id]);
                let platformFeeUser = platformFeeRate;
                if(platformfee.length > 0){
                    //判断platformfee[0].platform_fee是否为空 为空则使用默认平台费
                    if(platformfee[0].platform_fee){
                        platformFeeUser = platformfee[0].platform_fee / 100;
                    }
                }

                await pool.query(`
                    INSERT INTO user_monthly_income_audit
                    (user_id, username, year,month, pay_order_count, refund_order_count, income_amount,platformfee_amount, refund_amount, audit_status, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?,?, ?, 0, NOW())
                `, [row.merchant_id?row.merchant_id:0, row.merchant_name, lastMonthYear, (lastMonth+1), row.pay_count, row.refund_count, row.income_amount,(row.income_amount*platformFeeUser), row.refund_amount]);
            }
            
            console.log('月度收入统计任务执行完成');
        } catch (error) {
            console.error('月度收入统计任务执行失败:', error);
        }
    });
    //每年的1月1日0点执行
    schedule.scheduleJob('0 0 1 1 *', async () => {
        //清除所有人的修改机器码次数
        await pool.query('UPDATE users SET machine_code_change_count = 0');
    })
    // 分钟 小时 日 月 周几
    schedule.scheduleJob('0 1 * * *', async () => { // 每天凌晨1点执行
        // 定时清理过期的未使用优惠码
        // 删除条件：
        // 1. used = 0：优惠码未被使用
        // 2. valid_to < NOW()：优惠码失效时间已过期（当前时间大于失效时间）
        // 目的：清理数据库中无效的优惠码记录，释放存储空间
        await pool.query(
            `DELETE FROM coupon
            WHERE used = 0 AND valid_to < NOW()`
        );
        //定时刷新用户会员状态
        await pool.query( //如果是年度会员，且过期时间大于当前时间，则更新vip_type为0 设置为无会员
            `UPDATE users 
            SET vip_type = 0 
            WHERE vip_expire_time < NOW() AND vip_type = 1`
        );
        if(config.IS_PARENT){ //如果是主公司 则不执行定时任务
            //定时刷新共创者服务器状态
            await pool.query(
                `UPDATE collaborator 
                SET server_status = 1 
                WHERE expiry_time < NOW() AND server_status = 0`
            );
        }else{
            try {
                // console.log('定时任务开始执行:', new Date());
                // 在这里添加你的定时任务逻辑
                // 获取服务器配置
                let coconfig = await readConfig('co_create_config_info');
                if(!coconfig){
                    coconfig = getCoConfig
                }
                //验证 license 文件
                const isValid = await verifyLicenseFile();
                if (isValid) {
                    // 判断机器码是否一致
                    if(!isMachineIdEqual()){
                        console.log('机器码不同');
                        if (coconfig['server_status'] > 3){
                            return; //如果服务器状态大于3 则直接返回 不做任何操作
                        }
                        coconfig['server_status'] = 3; //修改服务器状态为3 封号 不允许使用
                        await writeConfig('co_create_config_info', coconfig);
                        //且发送信息给到主公司 提醒主公司 该服务器封号
                        await axios.post(config.PARENT_DOMAIN  + '/users/collaboratorsetting', {
                            data:accban.data,
                            signature:accban.signature,
                            server_domain:config.SERVER_DOMAIN
                        });
                        return;
                    }
                    // 判断是否过期
                    if(isLicenseExpired()){
                        console.log('license 文件已过期');
                        coconfig['server_status'] = 1; //修改服务器状态为1 过期
                        await writeConfig('co_create_config_info', coconfig);
                        //且发送信息给到主公司 提醒主公司 该服务器 license 文件已过期
                        await axios.post(config.PARENT_DOMAIN  + '/users/collaboratorsetting', {
                            data:expired.data,
                            signature:expired.signature,
                            server_domain:config.SERVER_DOMAIN
                        });
                        return;
                    }
                }else{
                    console.log('license 文件无效');
                    if(coconfig['server_status']==0){ //如果服务器状态为0 正常，就更新服务器状态为2 异常
                        //修改服务器状态为2 异常 代表文件修改过
                        if (coconfig['server_status'] > 2){
                            return; //如果服务器状态大于2，则不执行任何操作
                        }
                        coconfig['server_status'] = 2;
                        await writeConfig('co_create_config_info', coconfig);
                        //且发送信息给到主公司 提醒主公司 该服务器文件被修改
                        let res = await axios.post(config.PARENT_DOMAIN + '/users/collaboratorsetting', {
                            data:exception.data,
                            signature:exception.signature,
                            server_domain:config.SERVER_DOMAIN
                        });
                    }
                    return;
                }
                
            } catch (error) {
                console.error('定时任务执行错误:', error);
            }
        }
    });
}

module.exports = {
    initScheduler
};