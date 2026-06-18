import { defHttp } from '/@/utils/http/axios'
import { PageResult, Result } from '/#/axios'
import { BaseEntity } from '/#/web'

/**
 * 分页
 */
export function page(params) {
  return defHttp.get<Result<PageResult<AIProjectInfo>>>({
    url: '/users/getResListtmp',
    params,
  })
}

/**
 * 更新项目数据
 */
export function updateRestmp(params) {
  return defHttp.post<Result<void>>({
    url:'/users/updateRestmp',
    data: params,
  })
}
/**
 * 上传图片
 */
export function uploadImageRestmp(params){
  return defHttp.post<Result<any>>({
    url:'/users/uploadImageRestmp',
    data:params,
    headers:{
      'Content-Type':'multipart/form-data'
    }
  })
}
/**
 * 删除项目
 */
export function delRestmp(params){
  return defHttp.get<Result<void>>({
    url: '/users/delRestmp',
    params,
  })
}

/**
 * 项目审核状态
 */
export function setResstate(params){
  return defHttp.get<Result<void>>({
    url:'/users/setResReviewStatustmp',
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