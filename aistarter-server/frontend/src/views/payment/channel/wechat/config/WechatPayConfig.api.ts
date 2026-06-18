import { defHttp } from '/@/utils/http/axios'
import { Result } from '/#/axios'
import { BaseEntity, KeyValue } from '/#/web'

/**
 * 获取单条
 */
export function getConfig() {
  return defHttp.get<Result<WechatPayConfig>>({
    url: '/pay/getPayChannelConfig',
    params:{id:2}
  })
}

/**
 * 更新
 */
export function update(obj: WechatPayConfig) {
  return defHttp.post({
    url: '/pay/updatePayChannelConfig',
    data: obj,
  })
}

/**
 * 生成异步通知地址
 */
export function generateNotifyUrl() {
  return defHttp.get<Result<string>>({
    url: '/pay/generateNotifyUrl',
    params:{id:2}
  })
}

/**
 * 微信支付配置
 */
export interface WechatPayConfig extends BaseEntity {
  // 微信应用AppId
  wxAppId?: string
  // 微信商户号
  wxMchId?: string
  // 是否启用
  enable: boolean
  // 支付限额
  limitAmount?: number
  // API 版本
  apiVersion: string
  // 商户平台「API安全」中的 APIv3 证书
  apiCertV3?: string
  // 商户平台「API安全」中的 APIv3 证书密钥
  apiKeyV3?: string
  // APPID对应的接口密码，用于获取接口调用凭证access_token时使用
  appSecret?: string
  // 服务器异步通知页面路径
  notifyUrl?: string
  // 是否沙箱环境
  sandbox?: boolean
  // 备注
  remark?: string
}
