import { defHttp } from '/@/utils/http/axios'
import { PageResult, Result } from '/#/axios'
import { BaseEntity } from '/#/web'

/**
 * 分页
 */
export function page(params) {
  return defHttp.get<Result<PageResult<AIProjectInfo>>>({
    url: '/users/getResList',
    params,
  })
}

/**
 * 获取筛选数据
 */
export function getResFilter(params) {
  return defHttp.get<Result<any>>({
    url: '/users/getResFilter',
    params,
  })
}
/**
 * 更新项目数据
 */
export function updateRes(params) {
  return defHttp.post<Result<void>>({
    url:'/users/updateRes',
    data: params,
  })
}
/**
 * 更新筛选
 */
export function updateResFilter(params){
  return defHttp.get<Result<any>>({
    url: '/users/updateResFilter',
    params,
  })
}
/**
 * 删除筛选
 */
export function deleteResFilter(params){
  return defHttp.get<Result<void>>({
    url: '/users/deleteResFilter',
    params,
  })
}
/**
 * 上传图片
 */
export function uploadImageRes(params){
  return defHttp.post<Result<any>>({
    url:'/users/uploadImageRes',
    data:params,
    headers:{
      'Content-Type':'multipart/form-data'
    }
  })
}
/**
 * 删除项目
 */
export function delRes(params){
  return defHttp.get<Result<void>>({
    url: '/users/delRes',
    params,
  })
}

/**
 * 项目审核状态
 */
export function setResReviewStatus(params){
  return defHttp.get<Result<void>>({
    url:'/users/setResReviewStatus',
    params,
  })
}

/**
 * 用AI项目实体
 */
export interface AIProjectInfo extends BaseEntity {
  // ID
  id?: number
  // 用户ID
  user_id?: number
  // 用户名
  user_name?: string
  // 项目名称
  res_name?: string
  // 描述
  short_desc?: string
  // 版本
  version?: string
  // 作者
  author?: string
  // 平台
  platforms?: string
  // 类型
  res_type?: string
  // 安装目录
  install_dir?:string
  // 点赞
  like_count?:number
  // 下载次数
  download?:number
  // 项目文件大小
  res_zip_size?:number
  // 创建时间
  create_time?:string
  // 状态
  state?:number
}