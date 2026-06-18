import { defHttp } from '/@/utils/http/axios'
import { PageResult, Result } from '/#/axios'
import { BaseEntity } from '/#/web'

/**
 * 分页
 */
export function page(params) {
  return defHttp.get<Result<PageResult<Collab>>>({
    url: '/users/getCollList',
    params,
  })
}

/**
 * 添加新的共创者
 */
export function addCollab(params){
  return defHttp.post<Result<PageResult<Collab>>>({
    url: '/users/addCollab',
    data:params,
  })
}

/**
 * 编辑共创者
 */
export function editCollab(params){
  return defHttp.post<Result<PageResult<Collab>>>({
    url: '/users/editCollab',
    data:params,
  })
}

/**
 * 删除共创者
 */
export function delCollab(params){
  return defHttp.post<Result<void>>({
    url: '/users/delCollab',
    data:params,
  })
}
/**
 * 修改共创者状态信息
 */
export function updateCollabState(params){
  return defHttp.post<Result<any>>({
    url: '/users/updateCollabState',
    data:params, 
  })
}
/**
 * 生成加密数据
 */
export function getEncryptData(params,id){
  return defHttp.post<Result<any>>({
    url: '/users/generateLicenseData',
    data:{data:params,id:id},
  })
}

//=======================共创者=======================
/**
 * 获取共创者加密文件信息
 */
export function getCollabLicense(params){
  return defHttp.post<Result<any>>({
    url: '/users/getCollabLicense',
    data:params,
  })
}
/**
 * 更新共创者加密文件信息
 */
export function updateCollabLicense(params,license){
  return defHttp.post<Result<any>>({
    url: '/users/updateCollabLicense',
    data:{params,license}, 
  })
}
/**
 * 更新共创者服务器状态
 */
export function updateCollabSeverState(params,license){
  return defHttp.post<Result<any>>({
    url: '/users/updateCollabSeverState',
    data:{params,license},
  })
}

/**
 * 获取共创者机器码
 */
export function getCollabMachineCode(params){
  return defHttp.post<Result<any>>({
    url: '/users/getCollabMachineCode',
    data:params,
  })
}
/**
 * 用AI项目实体
 */
export interface Collab extends BaseEntity {
  // ID
  id?: number
  // 共创者（公司名）
  company_name?: string
  // 软件名称
  software_name?: string
  // 域名
  domain_name?: string
  // 联系人
  name?: string
  // 邮箱
  email?: string
  // 手机
  phone?: string
  // 共创者类型
  coll_type?: number
  // 创建时间
  create_time?:string
  // 到期时间
  expiry_time?:string
  // 状态
  state?:number
  // 共创者服务器状态
  server_status?:number
  // 封禁原因
  ban_reason?:string
  // 封禁结束时间
  ban_end_time?:string
}
