import { defHttp } from '/@/utils/http/axios'
import { PageResult, Result } from '/#/axios'
import { BaseEntity } from '/#/web'

/**
 * 分页查询企业列表
 */
export function page(params) {
  return defHttp.get<Result<PageResult<EnterpriseInfo>>>({
    url: '/users/getEnterpriseList',
    params,
  })
}

/**
 * 审核企业
 */
export function auditEnterprise(params) {
  return defHttp.post<Result<any>>({
    url: '/users/enterpriseReview',
    data: params,
  })
}

/**
 * 修改企业状态
 */
export function updateEnterpriseStatus(params) {
  return defHttp.post<Result<any>>({
    url: '/enterprise/updateEnterpriseStatus',
    data: params,
  })
}

/**
 * 删除企业
 */
export function deleteEnterprise(id: number) {
  return defHttp.post<Result<any>>({
    url: '/users/deleteEnterprise',
    data: { id },
  })
}

/**
 * 企业信息实体
 */
export interface EnterpriseInfo {
  id?: number
  name?: string
  code?: string
  description?: string
  credit_code?: string
  legal_person_name?: string
  status?: number // 0: 正常, 1: 禁用
  reject_reason?: string
  submit_date?: string
  audit_date?: string
  creator_id?: number
  creator_name?: string
  creator_email?: string
  bank_card?: string
  bank_name?: string
  member_count?: number
  // 图片字段
  business_license_url?: string // 营业执照图片
  id_card_front_url?: string // 法人身份证正面
  id_card_back_url?: string // 法人身份证反面
  created_at?: string
  updated_at?: string
}