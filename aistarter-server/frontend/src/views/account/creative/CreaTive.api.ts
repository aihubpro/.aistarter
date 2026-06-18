import { defHttp } from '/@/utils/http/axios'
import { PageResult, Result } from '/#/axios'
import { BaseEntity } from '/#/web'

/**
 * 分页
 */
export function page(params) {
  return defHttp.get<Result<PageResult<UserInfo>>>({
    url: '/users/getCreativeUserList',
    params,
  })
}
/**
 * 审核
 */
export function updateStatus(id: number,state: number) {
  return defHttp.post<Result>({
    url: '/users/setCreativeUserState',
    data:{id, state},
  })
}

/**
 * 用户信息实体
 */
export interface UserInfo extends BaseEntity {
  // ID
  id?: number
  // 用户角色
  id_role?: number
  // 用户名
  username?: string
  // 邮箱
  email?: string
  // 国家
  country?: string
  // 手机
  phone?: string
  // 创建时间
  created_at?: string
  // 最后一次登录时间
  updated_at?: string
}
