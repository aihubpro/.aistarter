import { defHttp } from '/@/utils/http/axios'
import { Result } from '/#/axios'
import { Modal } from 'ant-design-vue'
import { useUserStore } from '/@/store/modules/user'
// 域名配置
export async function authorizedDomains() {
    return defHttp.get<Result>({
      url: '/users/getCollStatus'
    })
}
//相关提示词
export const relatedPrompt: Record<string,any> = {
    'Unauthorized':{
        title: '❌ 未授权域名',
        content: '当前域名未获得使用授权，请联系管理员处理。',
        closable: false,
        maskClosable: false,
        centered: true,
        class: 'custom-error-modal',
        width: 520,
        okText: '确认',
        keyboard: false
    },
    'TimeError':{
        title: '⚠️ 系统时间异常',
        content: '您的系统时间与服务器时间不一致，这可能会影响系统的正常使用。请校准您的系统时间。',
        closable: false,
        maskClosable: false,
        centered: true,
        class: 'custom-warning-modal',
        width: 520,
        okText: '我知道了',
        keyboard: false
    },
    'ExpiringSoon':(domainConfig,closeModal)=>{
        return {
            title: '授权即将过期',
            content: `您的共创者订阅将于${domainConfig.expiry_time}到期。请及时续费。`,
            closable: true,
            maskClosable: false,
            centered: true,
            class: 'custom-warning-modal',
            width: 520,
            okText: '立即续费',
            okButtonProps: {
                type: 'primary',
                danger: true
            },
            onOk:closeModal,
            keyboard: false
        }
    },
    'Expired':(domainConfig,openRenewalModal)=>{
        return {
            title: '系统授权已过期',
            content: `您的共创者订阅已于${domainConfig.expiry_time}到期。如需继续使用服务，请联系管理员完成续费或授权更新。`,
            closable: false,
            maskClosable: false,
            centered: true,
            class: 'custom-error-modal',
            width: 520,
            okText: '续费',
            onOk: openRenewalModal
        }
    },
    'Expired2':(domainConfig)=>{
      return {
          title: '系统授权已过期',
          content: `您的共创者订阅已于${domainConfig.expiry_time}到期。如需继续使用服务，请联系管理员完成续费或授权更新。`,
          closable: false,
          maskClosable: false,
          centered: true,
          class: 'custom-error-modal',
          width: 520,
          okText: '关闭'
      }
    },
    'Banned':(domainConfig)=>{
        return {
            title: '系统已被封禁',
            content: `您的共创者账号或系统已被封禁。封禁原因：${domainConfig.ban_reason}，封禁期限：${domainConfig.ban_end_time?domainConfig.ban_end_time:'永久'}，如有疑问或需要申诉，请及时联系系统管理员。`,
            closable: false,
            maskClosable: false,
            centered: true, 
            class: 'custom-error-modal',
            width: 520,
            okText: '确认',
            keyboard: false
        }
    },
    'Cracked':(domainConfig)=>{
        return {
            title: '系统文件异常',
            content: `系统检测到您的共创者管理后台关键文件存在非法篡改或破解痕迹 ，可能导致运行异常或安全风险。建议您立即进行安全审查，并恢复原始文件。如需技术支持，请联系管理员。`,
            closable: false,
            maskClosable: false,
            centered: true,
            class: 'custom-error-modal',
            width: 520,
            okText: '确认',
            keyboard: false
        }
    }
}
let initData = false
let initexpire = false
// 初次打开页面时检查域名授权
export const checkDomainAuthorization = async () => {
    let result=await authorizedDomains()
    const domainConfig = result.data

    // 检查域名是否被封禁
    if(domainConfig.state == 1){ //被封禁
        //判断是否有时间限制
        if(!domainConfig.ban_end_time){ //无时间限制
            console.log('永久封禁')
            Modal.error(relatedPrompt['Banned'](domainConfig))
            return false
        }
        // 如果被封禁，先判断到期时间是否已过
        if(new Date(domainConfig.ban_end_time).getTime() > new Date().getTime()){ //封禁未到期
            console.log('封禁未到期')
            Modal.error(relatedPrompt['Banned'](domainConfig))
            return false
        }
    }

    // 检查是否为永久授权
    if(domainConfig.coll_type == 2){ //永久授权
      if(domainConfig.server_status != 2){ //非异常状态正常操作
        return domainConfig
      }
      Modal.error(relatedPrompt['Cracked'](domainConfig))
      return false
    }

    const expiryDate = new Date(domainConfig.expiry_time)
    const now = new Date()

    // 检查系统时间是否正确（允许误差10分钟）
    const tenMinutes = 10 * 60 * 1000; // 10分钟的毫秒数
    const timeDiff = Math.abs(now.getTime() - domainConfig.server_time);
    if ((timeDiff > tenMinutes)) {
      Modal.error(relatedPrompt['TimeError'])
      return false
    }
    // 检查授权是否过期
    if (domainConfig.isexpiry && !initexpire) { //正常过期允许登录
      if(domainConfig.server_status == 2){ //过期后服务器异常（破解了文件，或者是修改了文件）不允许登录
        Modal.error(relatedPrompt['Cracked'](domainConfig))
        return false
      }
      if(useUserStore().getToken){
        return new Promise(resolve => {
          Modal.error(relatedPrompt['Expired'](domainConfig, () => {
            resolve({ pay: true });
          }));
        });
      }else{
        Modal.error(relatedPrompt['Expired2'](domainConfig))
      }
      initexpire = true
    }

    // 如果快要过期（比如还有7天），显示提醒
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000
    if (!domainConfig.isexpiry && (expiryDate.getTime() - now.getTime() < sevenDaysInMs) && !initData) {
      if(useUserStore().getToken){
        return new Promise(resolve => {
          Modal.warning(relatedPrompt['ExpiringSoon'](domainConfig, () => {
            resolve({ pay: true });
          }));
        });
      }else{
        Modal.warning(relatedPrompt['ExpiringSoon'](domainConfig))
      }
    }

    // 设置多个提醒时间点（天数）
    const reminderDays = {
    fifteen: 15 * 24 * 60 * 60 * 1000,
    seven: 7 * 24 * 60 * 60 * 1000,
    three: 3 * 24 * 60 * 60 * 1000
    }
    const tolerance = 1 * 60 * 1000; // 1分钟的毫秒数
    const timeLeft = expiryDate.getTime() - now.getTime()
    // 如果快要过期，根据不同时间点显示提醒
    if (Math.abs(timeLeft - reminderDays.fifteen) <= tolerance) { // 15天
        Modal.warning(relatedPrompt['ExpiringSoon'](domainConfig))
    } else if (Math.abs(timeLeft - reminderDays.seven) <= tolerance) { // 7天
        Modal.warning(relatedPrompt['ExpiringSoon'](domainConfig))
    } else if (Math.abs(timeLeft - reminderDays.three) <= tolerance) { // 3天
        Modal.warning(relatedPrompt['ExpiringSoon'](domainConfig))
    }
    initData = true
    return domainConfig
  }

  //登录中，检查域名授权
export const checkDomainAuthorizationInLogin = async () => {
    let result;
    try{
      result = await authorizedDomains()
    }catch(e){
      console.log(e) 
      Modal.error(relatedPrompt['Unauthorized'])
      return false
    }
    const domainConfig = result.data

    // 检查域名是否被封禁
    if(domainConfig.state == 1){ //被封禁
        //判断是否有时间限制
        if(!domainConfig.ban_end_time){ //无时间限制
            console.log('永久封禁')
            Modal.error(relatedPrompt['Banned'](domainConfig))
            return false
        }
        // 如果被封禁，先判断到期时间是否已过
        if(new Date(domainConfig.ban_end_time).getTime() > new Date().getTime()){ //封禁未到期
            console.log('封禁未到期')
            Modal.error(relatedPrompt['Banned'](domainConfig))
            return false
        }
    }

    if(domainConfig.coll_type == 2){ //永久授权
      if(domainConfig.server_status != 2){ //非异常状态正常操作
        return true
      }
      Modal.error(relatedPrompt['Cracked'](domainConfig))
      return false
    }
    if (domainConfig.isexpiry) { //正常过期允许登录
      if(domainConfig.server_status == 2){ //过期后服务器异常（破解了文件，或者是修改了文件）不允许登录
        Modal.error(relatedPrompt['Cracked'](domainConfig))
        return false
      }
      Modal.error(relatedPrompt['Expired2'](domainConfig))
    }
    return true
}
//home首页中展示，过期时间
export const checkDomainAuthorizationInHome = async () => {
    let result;
    try{
      result = await authorizedDomains()
    }catch(e){
      console.log(e) 
      return
    }
    return result.data
}
  