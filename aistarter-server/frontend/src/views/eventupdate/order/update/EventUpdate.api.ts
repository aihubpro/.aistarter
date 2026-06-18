import { defHttp } from '/@/utils/http/axios'
import { PageResult, Result } from '/#/axios'
import { BaseEntity } from '/#/web'

/**
 * 获取更新信息
 */
export const getUpdateText = (params?: any) => {
    return defHttp.get<Result<any>>({
        url: '/users/getVersionInfo',
        params,
    })
}
/**
 * 修改更新信息
 */
export const updateUpdateText = (params?: any) => {
    return defHttp.post<Result<any>>({
        url: '/users/updateNewVersionInfo',
        data:params,
    })
}