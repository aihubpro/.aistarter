import { defHttp } from '/@/utils/http/axios'
import { PageResult, Result } from '/#/axios'
import { BaseEntity } from '/#/web'

/**
 * 分页
 */
export function page(params) {
  return defHttp.get<Result<PageResult<AIProjectInfo>>>({
    url: '/users/getAIProjectList',
    params,
  })
}

/**
 * 获取筛选数据
 */
export function getAIProjectFilter(params) {
  return defHttp.get<Result<any>>({
    url: '/users/getAIProjectFilter',
    params,
  })
}
/**
 * 更新项目数据
 */
export function updateAIProject(params) {
  return defHttp.post<Result<void>>({
    url:'/users/updateAIProject',
    data: params,
  })
}
/**
 * 更新筛选
 */
export function updateAIProjectFilter(params){
  return defHttp.get<Result<any>>({
    url: '/users/updateAIProjectFilter',
    params,
  })
}
/**
 * 删除筛选
 */
export function deleteAIProjectFilter(params){
  return defHttp.get<Result<void>>({
    url: '/users/deleteAIProjectFilter',
    params,
  })
}
/**
 * 上传图片
 */
export function uploadImage(params){
  return defHttp.post<Result<any>>({
    url:'/users/uploadImage',
    data:params,
    headers:{
      'Content-Type':'multipart/form-data'
    }
  })
}
/**
 * 删除项目
 */
export function delAiProject(params){
  return defHttp.get<Result<void>>({
    url: '/users/delAIProject',
    params,
  })
}

/**
 * 项目审核状态
 */
export function setProjectState(params){
  return defHttp.get<Result<void>>({
    url:'/users/setProjectReviewStatus',
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
  plugin_name?: string
  // 描述
  description?: string
  // 版本
  version?: string
  // 作者
  author?: string
  // 平台
  platforms?: string
  // 安装目录
  install_dir?:string
  // 点赞
  like_count?:number
  // 下载次数
  download?:number
  // 项目文件大小
  project_zip_size?:number
  // 创建时间
  create_time?:string
  // 状态
  state?:number
}
