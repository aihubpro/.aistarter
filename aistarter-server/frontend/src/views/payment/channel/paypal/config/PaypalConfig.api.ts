import { defHttp } from '/@/utils/http/axios'
import { Result } from '/#/axios'
import { BaseEntity, KeyValue } from '/#/web'

/**
 * 获取单条
 */
export function getConfig() {
  return defHttp.get<Result<PaypalConfig>>({
    url: '/pay/getPayChannelConfig',
    params:{id:3}
  })
}

/**
 * 更新
 */
export function update(obj: PaypalConfig) {
  return defHttp.post({
    url: '/pay/updatePayChannelConfig',
    data: obj,
  })
}

/**
 * 生成异步通知地址
 */
export function generateNotifyUrl() {
  return defHttp.get<Result<string>>({
    url: '/pay/generateNotifyUrl',
    params:{id:3}
  })
}

/**
 * 微信支付配置
 */
export interface PaypalConfig extends BaseEntity {
  // 是否启用
  enable: boolean
  // 支付限额
  limitAmount?: number
  //客户端ID
  clientID?: string
  // 密钥
  secret?: string
  // 汇率
  rate?: GLfloat
  // 服务器异步通知页面路径
  notifyUrl?: string
  // 是否沙箱环境
  sandbox?: boolean
  // 备注
  remark?: string
}
