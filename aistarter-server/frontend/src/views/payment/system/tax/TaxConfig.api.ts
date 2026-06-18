import { defHttp } from '/@/utils/http/axios'
import { Result } from '/#/axios'
import { BaseEntity } from '/#/web'

/**
 * 获取税收配置
 */
export function getTaxConfig() {
  return defHttp.get<Result<TaxConfig>>({
    url: '/pay/getTaxConfig',
  })
}

/**
 * 更新税收配置
 */
export function updateTaxConfig(param: TaxConfig) {
  return defHttp.post<Result<TaxConfig>>({
    url: '/pay/updateTaxConfig',
    data: param,
  })
}

/**
 * 税收配置
 */
export interface TaxConfig extends BaseEntity {
  // 起征金额
  taxThreshold?: number
  // 国内个人所得税税率表
  domesticTaxTable?: TaxTableItem[]
  // 国外个人所得税税率表
  foreignTaxTable?: TaxTableItem[]
}

/**
 * 税率表项
 */
export interface TaxTableItem {
  // 级别
  level: number
  // 描述
  description: string
  // 税率（%）
  rate: number
  // 速算扣除数
  quickDeduction: number
  // 最小金额
  minAmount: number
  // 最大金额
  maxAmount: number | null
}