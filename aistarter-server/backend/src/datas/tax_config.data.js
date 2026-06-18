// 税率配置文件

const taxConfig = {
    "taxThreshold": 800,   //起征金额，低于此金额不征税
    // 表二：个人所得税预扣率表二（居民个人劳务报酬所得预扣预缴适用）
    "domesticTaxTable": [
        {
            "level": 1,
            "description": "不超过20,000元的部分",
            "minAmount": 0,
            "maxAmount": 20000,
            "rate": 20,
            "quickDeduction": 0
        },
        {
            "level": 2,
            "description": "超过20,000元至50,000元的部分",
            "minAmount": 20000,
            "maxAmount": 50000,
            "rate": 30,
            "quickDeduction": 2000
        },
        {
            "level": 3,
            "description": "超过50,000元的部分",
            "minAmount": 50000,
            "maxAmount": null,
            "rate": 40,
            "quickDeduction": 7000
        }
    ],
    
    // 表三：个人所得税税率表三（非居民个人工资、薪金所得，劳务报酬所得，稿酬所得，特许权使用费所得适用）
    "foreignTaxTable": [
        {
            "level": 1,
            "description": "不超过3,000元的部分",
            "minAmount": 0,
            "maxAmount": 3000,
            "rate": 3,
            "quickDeduction": 0
        },
        {
            "level": 2,
            "description": "超过3,000元至12,000元的部分",
            "minAmount": 3000,
            "maxAmount": 12000,
            "rate": 10,
            "quickDeduction": 210
        },
        {
            "level": 3,
            "description": "超过12,000元至25,000元的部分",
            "minAmount": 12000,
            "maxAmount": 25000,
            "rate": 20,
            "quickDeduction": 1410
        },
        {
            "level": 4,
            "description": "超过25,000元至35,000元的部分",
            "minAmount": 25000,
            "maxAmount": 35000,
            "rate": 25,
            "quickDeduction": 2660
        },
        {
            "level": 5,
            "description": "超过35,000元至55,000元的部分",
            "minAmount": 35000,
            "maxAmount": 55000,
            "rate": 30,
            "quickDeduction": 4410
        },
        {
            "level": 6,
            "description": "超过55,000元至80,000元的部分",
            "minAmount": 55000,
            "maxAmount": 80000,
            "rate": 35,
            "quickDeduction": 7160
        },
        {
            "level": 7,
            "description": "超过80,000元的部分",
            "minAmount": 80000,
            "maxAmount": null,
            "rate": 45,
            "quickDeduction": 15160
        }
    ]
};

module.exports = taxConfig;