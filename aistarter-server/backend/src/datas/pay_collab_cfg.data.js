//支付平台配置

const payCoConfig = {
    "child":[
        {
            "title":"续费一年",
            "price":8888, //年会会员价格
            "expire":365, //有效期天数
            "desc":"基础套餐，满足个人使用需求"
        },
        {
            "title":"永久授权",
            "price":88888, //季度会员价格
            "expire":0, //有效期天数
            "desc":"一次付费，永久使用"
        }
    ]
  };
  
  module.exports = payCoConfig