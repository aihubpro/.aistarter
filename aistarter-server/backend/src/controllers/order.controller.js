const pool = require('../database')
const fs = require('fs');

//AI Starter 接口

//判断AI项目是否已购
const checkIsBuy = async (req, res) => {
  const { type, id } = req.query;

  const productType = Number(type);
  const productId = Number(id);

  try {
    if(productType == 2){
      //购买AI项目

      //先判断收费类型
      const result = await pool.query('SELECT id,user_id,install_dir,download,price_type,price_value FROM upload WHERE id = ?', [productId]);
      if (result.length === 0) {
        // 如果数据库中没有匹配的文件记录，则返回错误响应
        return res.status(404).json({ error: 'File not found' });
      }
      
      //判断是否是自己上传的项目
      if(result[0].user_id == req.user_id){
        return res.status(200).json({
          state: 1
        });
      }

      if(result[0].price_type == 3){
        //vip会员专享项目判断会员
        let isVip = false;
        const userData = await pool.query(
            'SELECT * FROM users WHERE id = ? AND (vip_type = 2 OR (vip_type = 1 AND NOW() < vip_expire_time))',
            [req.user_id]
        );

        if(userData.length > 0){
            isVip = true;
        }

        if(!isVip){
          if(result[0].price_value == 0){
            //没有vip且只有会员专享
            return res.status(200).json({
              state: 0
            });
          }
        }else{
          return res.status(200).json({
            state: 1
          });
        }
      }

      //其它需要购买的查看订单
      const orderData = await pool.query('SELECT id,order_no FROM pay_order WHERE status = 1 AND user_id = ? AND product_type = ? AND product_id = ?', [req.user_id, productType, productId]);
      if (orderData.length === 0) {
        return res.status(200).json({
          state: 0
        });
      }
  
      return res.status(200).json({
        state: 1
      });
    }else{
      res.status(400).json({ error:"Check order error" })
    }

  } catch (error) {
    console.log("check order error:" + error);
    res.status(400).json({ error:"Check order error" })
  }
}
//判断资源是否已购
const checkResIsBuy = async (req, res) => {
  const { type, id } = req.query;

  const productType = Number(type);
  const productId = Number(id);

  try {
    if(productType == 3 || productType == 4 || productType == 5){ //模型，插件，工作流 3,模型 4,插件 5,工作流
      //购买(模型，插件，工作流)

      //先判断收费类型
      const result = await pool.query('SELECT id,user_id,install_dir,download,price_type,price_value FROM upload_resources WHERE id = ?', [productId]);
      if (result.length === 0) {
        // 如果数据库中没有匹配的文件记录，则返回错误响应
        return res.status(404).json({ error: 'File not found' });
      }
      
      //判断是否是自己上传的项目
      if(result[0].user_id == req.user_id){
        return res.status(200).json({
          state: 1
        });
      }

      if(result[0].price_type == 3){
        //vip会员专享项目判断会员
        let isVip = false;
        const userData = await pool.query(
            'SELECT * FROM users WHERE id = ? AND (vip_type = 2 OR (vip_type = 1 AND NOW() < vip_expire_time))',
            [req.user_id]
        );

        if(userData.length > 0){
            isVip = true;
        }

        if(!isVip){
          if(result[0].price_value == 0){
            //没有vip且只有会员专享
            return res.status(200).json({
              state: 0
            });
          }
        }else{
          return res.status(200).json({
            state: 1
          });
        }
      }

      //其它需要购买的查看订单
      const orderData = await pool.query('SELECT id,order_no FROM pay_order WHERE status = 1 AND user_id = ? AND product_type = ? AND product_id = ?', [req.user_id, productType, productId]);
      if (orderData.length === 0) {
        return res.status(200).json({
          state: 0
        });
      }
  
      return res.status(200).json({
        state: 1
      });
    }else{
      res.status(400).json({ error:"Check order error" })
    }

  } catch (error) {
    console.log("check order error:" + error);
    res.status(400).json({ error:"Check order error" })
  }
}

module.exports = {
  checkIsBuy,
  checkResIsBuy
}
