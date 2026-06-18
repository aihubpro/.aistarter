import { defHttp } from '/@/utils/http/axios'
import { PageResult, Result } from '/#/axios'
import { BaseEntity } from '/#/web'

/**
 * 获取轮播图列表
 */
export const getBannerList = (params?: any) => {
    return defHttp.get<Result<any>>({
        url: '/users/getBannerInfo',
        params,
    })
}
/**
 * 修改轮播图图片
 */
export const updateBanner = (params?: any) => {
    return defHttp.post<Result<any>>({
        url: '/users/updateBannerInfo',
        data: params,
    })
}