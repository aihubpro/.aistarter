import { defHttp } from '/@/utils/http/axios'
import { PageResult, Result } from '/#/axios'
import { BaseEntity } from '/#/web'

/**
 * 分页查询企业成员列表
 */
export function page(params) {
  return defHttp.get<Result<PageResult<EnterpriseMemberInfo>>>({
    url: '/users/getEnterpriseUserList',
    params,
  })
}

/**
 * 查询退出原因
 */
export function getQuitReason(params: { entity_id: number, auditor_id: number}) {
  return defHttp.post<Result<any>>({
    url: '/users/getQuitEnterpriseReason',
    data: params,
  })
}
/**
 * 删除企业成员
 */
export function deleteMember(id: number) {
  return defHttp.post<Result<any>>({
    url: '/users/deleteEnterpriseUser',
    data: { id },
  })
}
/**
 * 驳回成员退出申请
 */
export function rejectExitMember(id: number) {
  return defHttp.post<Result<any>>({
    url: '/users/rejectQuitEnterprise',
    data: { id },
  })
}

/**
 * 同意成员加入企业
 */
export function approveJoinMember(id: number) {
  return defHttp.post<Result<any>>({
    url: '/users/approveJoinEnterprise',
    data: { id },
  })
}

/**
 * 同意成员退出企业
 */
export function approveExitMember(id: number) {
  return defHttp.post<Result<any>>({
    url: '/users/deleteEnterpriseUser',
    data: { id },
  })
}
/**
 * 企业成员信息实体
 */
export interface EnterpriseMemberInfo extends BaseEntity {
  // ID
  id?: number
  // 企业ID
  entity_id?: number
  // 企业名称
  entity_name?: string
  // 用户ID
  user_id?: number
  // 用户名
  user_name?: string
  // 邮箱
  user_email?: string
  // 成员角色 0-创建者 1-普通成员
  role?: number
  // 成员状态 1-正常 2-申请退出
  join_status?: number
  // 退出原因
  quit_reason?: string
  // 加入时间
  join_date?: string
  // 创建时间
  created_at?: string
}