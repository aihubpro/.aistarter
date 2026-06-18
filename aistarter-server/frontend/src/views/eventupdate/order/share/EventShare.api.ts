import { defHttp } from '/@/utils/http/axios'
import { PageResult, Result } from '/#/axios'
import { BaseEntity } from '/#/web'

/**
 * 获取分享链接地址
 */
export const getShareList = (params?: any) => {
    return defHttp.get<Result<any>>({
        url: '/users/getShareCfg',
        params,
    })
}
/**
 * 更新分享链接
 */
export const updateShareText = (params?: any) => {
    return defHttp.post<Result<any>>({
        url: '/users/updateShareCfg',
        data:params,
    })
}
