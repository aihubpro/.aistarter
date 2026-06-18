import { defHttp } from '/@/utils/http/axios'
import { PageResult, Result } from '/#/axios'
/**
 * 分页
 */
export function page(params: any) {
  return defHttp.get<Result<PageResult<any>>>({
    url: '/users/getCommentList',
    params,
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
