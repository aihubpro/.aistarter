import { defHttp } from '/@/utils/http/axios'
import { PageResult, Result } from '/#/axios'
import { BaseEntity } from '/#/web'

/**
 * 分页
 */
export function page(params) {
  return defHttp.get<Result<PageResult<CommentReport>>>({
    url: '/users/getCommentReports',
    params,
  })
}


/**
 * 处理举报
 */
export function handle(data: HandleCommentReport) {
  return defHttp.post<Result<boolean>>({
    url: `/users/handleCommentReport`,
    data,
  })
}
/**
 * 评论举报信息实体
 */
export interface CommentReport extends BaseEntity {
  // 举报记录ID
  id?: number
  // 被举报的评论ID
  comment_id?: number
  // 举报用户ID
  user_id?: number
  // 举报原因
  reason?: string
  // 举报详细描述（可选）
  description?: string
  // 处理状态：0-待处理，1-已处理（删除评论），2-已驳回
  status?: number
  // 处理管理员ID
  admin_id?: number
  // 处理管理员姓名
  admin_name?: string
  // 处理时间
  handle_time?: string
  // 举报时间
  create_time?: string
  // 评论内容
  comment_content?: string
  // 项目ID
  project_id?: number
  // 项目类型
  project_type?: string
  // 举报人姓名
  reporter_name?: string
}

/**
 * 处理举报请求参数
 */
export interface HandleCommentReport {
  // 举报记录ID
  report_id: number
  // 处理状态：1-已处理（删除评论），2-已驳回
  action: number
  // 处理备注
  remark?: string
}
