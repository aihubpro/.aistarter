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
