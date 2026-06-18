const payPlatformConfig = {
    "hostUrl": "",          //系统地址
    "child":[
        {
            "title":"年度订阅",
            "price":199, //年会会员价格
            "discount":0, //年度订阅折扣
            "expire":365, //有效期天数
            "btnText": '购买会员',
            "btnType": 'warning',
            "benefits": [
                '一年内所有更新',
                '标准技术支持',
                '会员专属下载',
                '创作者项目优惠(20-30%)',
                '优先体验新功能',
                '社群特权'
            ],
        },
        {
            "title":"永久订阅",
            "price":599, //永久会员价格
            "discount":0, //永久订阅折扣
            "expire":0, //有效期天数
            "btnText": '购买会员',
            "btnType": 'warning',
            "benefits": [
                '永久更新',
                '标准技术支持',
                '会员专属下载',
                '创作者项目优惠(20-30%)',
                '优先体验新功能',
                '社群特权'
            ],
        },
        {
            "title": '共创模式',
            "price": '定制化价格',
            "discount": "0",
            "expire":0, //有效期天数
            "btnText": '联系我们',
            "btnType": 'danger',
            "benefits": [
                '专属技术支持',
                ' 1对1技术支持',
                '软件定制',
                '自主管理后台',
                '收入归共创者',
                '　'
            ],
        },
    ],
    "vipDiscount": 20,      //Vip会员折扣
    "platformFee": 10,     //平台费比例，10表示收取10%的平台费
    "machine_code_count": 3, //机器码数量（每个用户最多可以绑定多少个机器码）
    "machine_code_modify_count": 3, //机械码修改次数（每个用户最多可以修改多少次机械码）
    "rcs":true, //是否开启邀请码返现开关 true表示开启 false表示关闭 （默认开启）（开启后邀请人获得比邀请人的支付返现）
  };
  
  module.exports = payPlatformConfig