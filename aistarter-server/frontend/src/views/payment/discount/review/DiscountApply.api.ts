import { defHttp } from '/@/utils/http/axios'
import { PageResult, Result } from '/#/axios'
import { BaseEntity } from '/#/web'

/**
 * 分页
 */
export function page(params) {
  return defHttp.get<Result<PageResult<PayOrder>>>({
    url: '/order/getDiscountApplyList',
    params,
  })
}
/**
 * 更新审核状态
 */
export function saveList(data:any) {
  return defHttp.post<Result>({
    url: '/order/saveDiscountApplyList',
    data: { data },
  })
}
/**
 * 更新审核状态
 */
export function updateStatus(data:any, status: number) {
  return defHttp.post<Result>({
    url: '/order/updateDiscountApplyStatus',
    data: { data, status },
  })
}
/**
 * 删除数据
 */
export function remove(id: string) {
  return defHttp.post<Result>({
    url: '/order/deleteDiscountApply',
    data: { id },
  })
}

/**
 * 支付记录
 */
export interface PayOrder extends BaseEntity {
  // 标题
  title?: string
  // 商户订单号
  bizOrderNo?: string
  // 支付订单号
  orderNo?: string
  // 三方系统交易号
  outOrderNo?: string
  // 描述
  description?: any
  // 是否支持分账
  allocation?: boolean
  // 自动分账
  autoAllocation?: boolean
  // 支付通道
  channel?: string
  // 支付方式
  method?: string
  // 金额
  amount?: number
  // 可退款余额
  refundableBalance?: number
  // 支付状态
  status?: string
  // 退款状态
  refundStatus?: string
  // 分账状态
  allocStatus?: string
  // 支付时间
  payTime?: string
  // 过期时间
  expiredTime?: string
  // 关闭时间
  closeTime?: string
  // 异步通知地址
  notifyUrl?: string
  // 商户扩展参数
  attach?: string
  // 附加参数
  extraParam?: string
  // 请求时间
  reqTime?: string
  // 支付终端ip
  clientIp?: string
  // 错误码
  errorCode?: string
  // 错误信息
  errorMsg?: string
}
