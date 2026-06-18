import { defHttp } from '/@/utils/http/axios'
import { PageResult, Result } from '/#/axios'
import { BaseEntity } from '/#/web'

/**
 * 获取消息限制列表
 */
export const getInfo = () => {
    return defHttp.get<Result<any>>({
        url: '/pay/getMessageLimitConfig',
    })
}
/**
 * 更新数据
 */
export const updateInfo = (params?: any) => {
    return defHttp.post<Result<any>>({
        url: '/pay/updateMessageLimitConfig',
        data: params,
    })
}