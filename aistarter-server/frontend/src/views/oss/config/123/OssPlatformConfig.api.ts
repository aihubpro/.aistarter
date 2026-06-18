import { defHttp } from '/@/utils/http/axios'
import { Result } from '/#/axios'
import { BaseEntity } from '/#/web'

/**
 * 获取平台配置项
 */
export function getConfig() {
  return defHttp.get<Result<Oss123PlatformConfig>>({
    url: '/users/getOss123Config',
  })
}

/**
 * 更新平台配置
 */
export function update(param: Oss123PlatformConfig) {
  return defHttp.post<Result<Oss123PlatformConfig>>({
    url: '/users/updateOss123Config',
    data: param,
  })
}

/**
 * 支付平台配置
 */
export interface Oss123PlatformConfig extends BaseEntity {
  // 密钥
  KeyId?: string
  // 链接过期时间
  LinkExp?: number
  // 云盘UID
  CloneUid?: string
  //每日下载限制
  dailyLimintDownload?:number
}
