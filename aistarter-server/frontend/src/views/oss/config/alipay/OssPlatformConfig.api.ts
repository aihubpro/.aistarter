import { defHttp } from '/@/utils/http/axios'
import { Result } from '/#/axios'
import { BaseEntity } from '/#/web'

/**
 * 获取平台配置项
 */
export function getConfig() {
  return defHttp.get<Result<OssAliPlatformConfig>>({
    url: '/users/getOssAliConfig',
  })
}

/**
 * 更新平台配置
 */
export function update(param: OssAliPlatformConfig) {
  return defHttp.post<Result<OssAliPlatformConfig>>({
    url: '/users/updateOssAliConfig',
    data: param,
  })
}

/**
 * 支付平台配置
 */
export interface OssAliPlatformConfig extends BaseEntity {
  // accessKeyId
  accessKeyId?: string
  // AccessKey Secret
  accessKeySecret?: string
  // 区域
  region?: string
  // 桶名
  bucket?: string
  // 角色ARN，例如acs:ram::175708322470****:role/ramtest
  roleArn?:string
  //自定义域名
  customeDomain?:string
  //每日下载限制
  dailyLimintDownload?:number
}
