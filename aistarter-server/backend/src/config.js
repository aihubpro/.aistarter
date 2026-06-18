const config = {}

// JWT 签名密钥: 请替换为你自己生成的 64 位随机字符串
// 生成方式: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
config.JWT_SECTET_KEY = "__JWT_SECRET_KEY_PLACEHOLDER__";

config.PROT = 7000;

// RSA 公钥: 请替换为你自己生成的 RSA 公钥
// 生成方式: 先用 openssl genrsa -out license/private_key.pem 2048 生成私钥
//          再用 openssl rsa -in license/private_key.pem -pubout 提取公钥
config.PUBLICKEY = "__PUBLIC_KEY_PLACEHOLDER__";

//主公司域名: 请替换为你的父级服务器域名, 如果不需要可留空
config.PARENT_DOMAIN = "__PARENT_DOMAIN_PLACEHOLDER__";
//服务器域名: 请替换为你的服务器域名 (格式: example.com:7000)
config.SERVER_DOMAIN = "__SERVER_DOMAIN_PLACEHOLDER__";
//判断是否为主公司 true为主公司 false为子公司
config.IS_PARENT = "__IS_PARENT_PLACEHOLDER__" === "true";

module.exports = config
