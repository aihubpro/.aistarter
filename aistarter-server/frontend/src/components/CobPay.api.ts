import { defHttp } from '/@/utils/http/axios'
import { Result } from '/#/axios'
import { BaseEntity } from '/#/web'

/**
 * 支付金额
 */
export function getDashBoardInfo() {
  return defHttp.get<Result<DashBoardInfo>>({
    url: '/users/getDashBoardInfo',
    method: 'get',
    params: {},
  })
}
/**
 * 共创者续费列表
 */
export function getCoRenewList() {
  return defHttp.get<Result>({
    url: '/pay/getCoRenewList',
    method: 'get',
    params: {},
  })
}
/**
 * 共创者创建订单
 */
export function createCoOrder(params?:any) {
  return defHttp.get<Result<CoOrderInfo>>({
    url: '/pay/getPayOrder',
    params: {
      timestamp: new Date().getTime(),
      ...params
    },
    headers: {
      'access-renew': 'true'
    }
  })
}
/**
 * 共创者订单轮询
 */
export function checkCoPayOrder(params?:any) {
  return defHttp.get<Result<CoOrderInfo>>({
    url: '/pay/checkPayOrder',
    params: {
      timestamp: new Date().getTime(),
      ...params
    },
    headers: {
      'access-renew': 'true'
    },
  })
}
/**
 * 共创者订单信息
 */
export interface CoOrderInfo extends BaseEntity {
  // 支付链接
  code_url:string;
  // 订单号
  order_no:number;
  // 状态码
  code:number;
  // 金额
  amount:number;
}

/**
 * 支付宝配置
 */
export interface DashBoardInfo extends BaseEntity {
  // 支付金额
  payAmount:number;
  // 订单数量
  orderCount:number;
  // 注册会员数量
  menberCount:number;
  // 共创者数量
  coMenberCount:number;
  // 共创者过期数量
  coMenberExpireCount:number;
}
