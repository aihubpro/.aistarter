import { defHttp } from '/@/utils/http/axios'
import { PageResult, Result } from '/#/axios'
import { BaseEntity } from '/#/web'

/**
 * 分页
 */
export function page(params) {
  return defHttp.get<Result<PageResult<UserInfo>>>({
    url: '/users/getRegUserList',
    params,
  })
}

/**
 * 获取用户所以信息
 */
export function getUserAllInfo(id: number) {
  return defHttp.get<Result<UserInfo>>({
    url: '/users/getUserAllInfo',
    params: { id },
  })
}
/**
 * 给用户添加金额
 */
export function addMoney(data, balance) {
  return defHttp.post<Result<any>>({
    url: '/users/addBalance',
    data:{data, balance},
  })
}
/**
 * 重置密码
 */
export function resetPassword(params) {
  return defHttp.post<Result<any>>({
    url: '/users/resetPassword',
    data:params,
  })
}

/**
 * 修改用户状态
 */
export function updateStatus(params) {
  return defHttp.post<Result<any>>({
    url: '/users/updateUserState',
    data:params,
  })
}

/*
 * 解绑邀请码
 */
export function unbindParentInviteCode(params) {
  return defHttp.post<Result<any>>({
    url: '/users/unbindParentInviteCode',
    data:params,
  })
}

/*
 * 绑定邀请码
 */
export function bindParentInviteCode(params) {
  return defHttp.post<Result<any>>({
    url: '/users/bindParentInviteCode',
    data:params,
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
