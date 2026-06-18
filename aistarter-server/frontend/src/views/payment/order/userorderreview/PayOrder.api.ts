import { defHttp } from '/@/utils/http/axios'
import { PageResult, Result } from '/#/axios'
import { BaseEntity } from '/#/web'

/**
 * 分页
 */
export function page(params) {
  return defHttp.get<Result<PageResult<PayOrder>>>({
    url: '/order/getUserOrderList',
    params,
  })
}
/**
 * 获取上月订单
 */
export function getLastMonthOrder() {
  return defHttp.get<Result>({
    url: '/order/getLastMonthOrder',
  })
}

/**
 * 获取指定年月订单
 */
export function getMonthOrder(year: number, month: number) {
  return defHttp.get<Result>({
    url: '/order/getLastMonthOrder',
    params: { year, month },
  })
}

/**
 * 删除用户订单
 */
export function deleteOrder(id: number) {
  return defHttp.post<Result>({
    url: '/order/deleteUserOrder',
    data: { id },
  })
}

/**
 * 批量删除用户订单
 */
export function batchDeleteOrders(ids: string[]) {
  return defHttp.post<Result>({
    url: '/order/delUserOrderBatch',
    data: { ids },
  })
}

/**
 * 删除指定年月的所有订单
 */
export function deleteMonthOrders(year: number, month: number) {
  return defHttp.post<Result>({
    url: '/order/deleteLastMonthOrder',
    data: { year, month },
  })
}

/**
 * 批量审核指定年月的订单
 */
export function batchAuditUserOrder(year: number, month: number, status: number) {
  return defHttp.post<Result>({
    url: '/order/batchAuditUserOrder',
    data: { year, month, status },
  })
}

/**
 * 批量审核选中的订单
 */
export function batchAuditOrders(ids: string[]) {
  return defHttp.post<Result>({
    url: '/order/batchPassUserOrder',
    data: { ids, status: 1 },
  })
}
/**
 * 审核通过订单
 */
export function updateOrderStatus(data:any, status: number) {
  return defHttp.post<Result>({
    url: '/order/passUserOrder',
    data: { data, status },
  })
}
/**
 * 修改订单
 */
export function updateOrder(params) {
  return defHttp.post<Result>({
    url: '/order/editUserOrder',
    data: params,
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
