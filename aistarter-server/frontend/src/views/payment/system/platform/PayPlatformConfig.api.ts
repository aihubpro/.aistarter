import { defHttp } from '/@/utils/http/axios'
import { Result } from '/#/axios'
import { BaseEntity } from '/#/web'

/**
 * 获取平台配置项
 */
export function getConfig() {
  return defHttp.get<Result<PayPlatformConfig>>({
    url: '/pay/getPayPlatformConfig',
  })
}

/**
 * 更新平台配置
 */
export function update(param: PayPlatformConfig) {
  return defHttp.post<Result<PayPlatformConfig>>({
    url: '/pay/updatePayPlatformConfig',
    data: param,
  })
}

/**
 * 支付平台配置
 */
export interface PayPlatformConfig extends BaseEntity {
  // 网站地址
  hostUrl?: string
  // 年会会员价格
  yearVipPrice?: number
  // 永久会员价格
  permanentVipPrice?: number
  // Vip会员购买项目折扣
  vipDiscount?: number
  // 购买年度订阅折扣
  yearVipDiscount?:number
  // 购买永久订阅折扣
  permanentVipDiscount?:number
}
