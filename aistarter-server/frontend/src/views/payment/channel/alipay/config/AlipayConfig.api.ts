import { defHttp } from '/@/utils/http/axios'
import { Result } from '/#/axios'
import { BaseEntity, KeyValue } from '/#/web'

/**
 * 获取单条
 */
export function getConfig() {
  return defHttp.get<Result<AlipayConfig>>({
    url: '/pay/getPayChannelConfig',
    params:{id:1}
  })
}

/**
 * 更新
 */
export function update(obj: AlipayConfig) {
  return defHttp.post({
    url: '/pay/updatePayChannelConfig',
    data: obj,
  })
}

// /**
//  * 获取支付宝支持支付方式
//  */
// export function findPayWays() {
//   return defHttp.get<Result<KeyValue[]>>({
//     url: '/alipay/config/findPayWays',
//   })
// }

/**
 * 生成异步通知地址
 */
export function generateNotifyUrl() {
  return defHttp.get<Result<string>>({
    url: '/pay/generateNotifyUrl',
    params:{id:1}
  })
}
/**
 * 生成同步通知地址
 */
export function generateReturnUrl() {
  return defHttp.get<Result<string>>({
    url: '/alipay/config/generateReturnUrl',
  })
}

/**
 * 支付宝配置
 */
export interface AlipayConfig extends BaseEntity {
  // 支付宝商户appId
  appId?: string
  // 是否启用
  enable: boolean
  // 支付限额
  limitAmount?: number
  // 服务器异步通知页面路径
  notifyUrl?: string
  // 签名类型
  signType?: string
  // 支付宝公钥
  alipayPublicKey?: string
  // 私钥
  privateKey?: string
  // 是否沙箱环境
  sandbox?: boolean
  // 备注
  remark?: string
}
