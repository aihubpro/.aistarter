import { defHttp } from '/@/utils/http/axios'
import { Result } from '/#/axios'
import { BaseEntity, KeyValue } from '/#/web'

/**
 * 获取单条
 */
export function getConfig() {
  return defHttp.get<Result<StripeConfig>>({
    url: '/pay/getPayChannelConfig',
    params:{id:4}
  })
}

/**
 * 更新
 */
export function update(obj: StripeConfig) {
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
    params:{id:4}
  })
}

/**
 * Stripe支付配置
 */
export interface StripeConfig extends BaseEntity {
  // 是否启用
  enable: boolean
  // 可发布密钥
  publishableKey?: string
  // 私密密钥
  secretKey?: string
  // Webhook密钥
  webhookSecret?: string
  // 汇率（人民币对美元）
  rate?: number
  // 货币类型
  currency?: string
  // 服务器异步通知页面路径
  notifyUrl?: string
  // 是否沙箱环境
  sandbox?: boolean
  // 备注
  remark?: string
}
