import { defHttp } from '/@/utils/http/axios'
import { Result } from '/#/axios'
import { BaseEntity } from '/#/web'

/**
 * 获取平台配置项
 */
export function getConfig() {
  return defHttp.get<Result<PayPlatformConfig>>({
    url: '/pay/getPayPlatformConfigV2',
  })
}

/**
 * 更新平台配置
 */
export function update(param: PayPlatformConfig) {
  return defHttp.post<Result<PayPlatformConfig>>({
    url: '/pay/updatePayPlatformConfigV2',
    data: param,
  })
}

/**
 * 支付平台配置
 */
export interface PayPlatformConfig extends BaseEntity {
  // 网站地址
  hostUrl?: string
  // 子页面
  child:[
    {
      // 子页面标题
      title?: string
      // 子页面价格
      price?: number|string
      // 子页面价格单位
      priceunit?: string
      // 子页面折扣
      discount?: number|string
      // 子页面到期时间
      expire?: number
      // 子页面按钮文字
      btnText?: string
      // 子页面按钮类型
      btnType?: string
      // 子页面介绍列表
      benefits:Array<string>
    }
  ]
  // vip会员折扣
  vipDiscount?: number
  // 平台费
  platformFee?: number
  // 机器码数量
  machine_code_count?: number
  // 机器码修改次数
  machine_code_modify_count?: number
}
