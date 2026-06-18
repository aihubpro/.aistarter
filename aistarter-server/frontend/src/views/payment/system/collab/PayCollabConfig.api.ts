import { defHttp } from '/@/utils/http/axios'
import { Result } from '/#/axios'
import { BaseEntity } from '/#/web'

/**
 * 获取平台配置项
 */
export function getConfig() {
  return defHttp.get<Result<PayPlatformConfig>>({
    url: '/pay/getCoPayConfig',
  })
}

/**
 * 更新平台配置
 */
export function update(param: PayPlatformConfig) {
  return defHttp.post<Result<PayPlatformConfig>>({
    url: '/pay/updateCoPayConfig',
    data: param,
  })
}

/**
 * 支付平台配置
 */
export interface PayPlatformConfig extends BaseEntity {
  // 子页面
  child:[
    {
      // 子页面标题
      title?: string
      // 子页面价格
      price?: number|string
      // 子页面描述
      desc?: string
      // 子页面到期时间
      expire?: number
    }
  ]
}
