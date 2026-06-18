<template>
  <el-config-provider namespace="ep">
    <div>
      <BaseHeader />
    </div>
    <div id="app-body" class="flex main-container">
      <BaseSide />
      <div w="full">
        <RouterView v-if="!isShowTerminal"></RouterView>
        <div v-show="isShowTerminal" class="terminal_box" v-for="(item, i) in terminals" :key="i">
          <terminal style="user-select: text;" v-show="item.show" :name="item.name" :title="item.name" :context="item.context" context-suffix=" > "
            :warn-log-count-limit="200" :show-header="item.showHeader" @exec-cmd="onExecCmd" :log-size-limit="500"
            :auto-help=false :enable-default-command=false :init-log=[] :enable-copy=true>
            <template #header>
              <div class="custom-header">{{ item.name }}</div>
            </template>
          </terminal>
        </div>
      </div>
    </div>

    <!-- 项目目录设置弹窗 -->
    <el-dialog v-model="setRootDirDialogVisible" :title="$t('app.setting_project_dir')" width="40%" center align-center :show-close="false"
      :close-on-click-modal="false" :close-on-press-escape="false">
      <el-input :value="$t('app.setting_project_dir_tis')" type="textarea" placeholder="Please input" :rows="4.5"
                    :readonly="true" resize="none" />
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="onSetRootDirDialogBtnClicked">
            {{ $t('app.setting_project_dir_select') }}
          </el-button>
        </span>
      </template>
    </el-dialog>
    <!-- IPV6开启提示-->
    <el-dialog v-model="setIpv6DialogVisible" :title="$t('app.ipv6_dialog_title')" width="40%" center align-center
      :show-close="false" :close-on-click-modal="false" :close-on-press-escape="false">
      <span style="line-height: 28px;">{{ $t('app.ipv6_dialog_content_1') }}</span><br>
      <span style="line-height: 28px;">{{ $t('app.ipv6_dialog_content_2') }}</span>
      <a href="https://www.aihubpro.cn/31289.html" target="_blank">{{ $t('app.ipv6_dialog_content_3') }}</a>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="onIpv6DialogIgnoreBtnClicked">{{ $t('app.button_donot_remind_again') }}</el-button>
          <el-button type="primary" @click="onIpv6DialogOkBtnClicked">{{ $t('app.button_ok') }}</el-button>
        </span>
      </template>
    </el-dialog>

    <PaymentSelectionDialog ref="paymentSelectionDialog" />
    <PurchaseMembershipDialog ref="purchaseMembershipDialog" />
    <QRCodePaymentDialog ref="qrcodePaymentDialog" />
    <ShareAiProjectDialog ref="shareAiProjectDialog" />
    <PaymentExplainDialog ref="paymentExplainDialog" />
    <ProductDetailsDialog ref="productDetailsDialog" />
    <ProductDetailsReviewDialog ref="productDetailsReviewDialog"/>
    <UpdatePromptDialog ref="updatePromptDialog" />
    <CreateProjectDialog ref="createProjectDialog" />
    <ShareDialog ref="shareDialog" />
    <UserBanDialog ref="userBanDialog" />
    <LoginForgotPasswordDialog ref="loginForgotPasswordDialog" />
    <EditCodeDialog ref="editCodeDialog" />
    <DebugRunDialog ref="debugRunDialog"/>
    <ImportIntoPorjectDialog ref="importIntoPorjectDialog" />
    <WithdrawDialog  ref="withdrawDialog"/>
    <DeviceDialog ref="deviceDialog" />
    <CheckVersionUpdateDialog ref="checkVersionUpdateDialog" />
  </el-config-provider>
</template>

<script setup lang="ts">
import { provide, ref, Ref, onMounted,h,onUnmounted } from "vue";
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus';
import type { messageType } from 'element-plus'
import { useI18n } from "vue-i18n";
const { locale } = useI18n();
const { ipcRenderer } = require('electron');
import axios from 'axios'

import { userStore } from './stores/UserStore'
import { termintextStore } from './stores/Termintext'
import { appInfoStore } from './stores/AppInfoStore'
import { paymentStore } from './stores/PaymentStore'
//导入轮播图图片数据
import banner_cfg from "./configs/home_banner_data"
const { t } = useI18n()
import matomo from "./matomo"
import { useRouter } from 'vue-router';
const router = useRouter();

//全局变量开关
/*
true 为隐藏，false为显示
*/
const globalHide = ref(true)

//获取软件是否是管理员
const isAdmin = ref(false)
// 检查管理员状态的函数
const checkAdminStatus = async () => {
  isAdmin.value = await ipcRenderer.invoke('check-admin')
}
// 初始检查
checkAdminStatus()
const userStoreIns = userStore()
const terminTextStoreIns = termintextStore()
const appInfoStoreIns = appInfoStore()
const paymentStoreIns = paymentStore()

const setRootDirDialogVisible = ref(false)

const setIpv6DialogVisible = ref(false)

//vip 图标
const vipIconurl = new URL("~/assets/vipIcon.png", import.meta.url).href;

const hasNewVersion = ref(false); // 是否有新版本

//软件初始化信息
const getAppInfos = async () => {
  //没网状态下先将图片放入
  appInfoStoreIns.bannerInfo = [
    ...banner_cfg.bannerData
  ]
  const params = {
    version: appInfoStoreIns.appVersion
  }
  let url = (window as any).Constants.uploadUrl + '/users/get-app-info'
  axios.get(url, { params }).then(res => {
    try{
      if(res.data.data.newupdate){
        hasNewVersion.value = true
        appInfoStoreIns.newupdateInfo = res.data.data.newupdate
      }
      if (res.data.data.updateInfo) {
        appInfoStoreIns.updateInfo = res.data.data.updateInfo
        openUpdatePrompt()
      } 
      if(Array.isArray(res.data.data.bannerInfo)){
        appInfoStoreIns.bannerInfo = res.data.data.bannerInfo.filter((item: any) => item.image = (window as any).Constants.uploadUrl + "/assets/market-images/" + item.image)
        appInfoStoreIns.bannerInfo = [
          ...appInfoStoreIns.bannerInfo,
          ...banner_cfg.bannerData
        ]
        // appInfoStoreIns.bannerInfo.forEach((item: any) => {
        //   banner_cfg.HomeBanner.unshift(item)
        // })
      }
    }catch(error){
      console.log(error)
    }
  })
}

//终端
const isShowTerminal = ref(false)
import { TerminalApi } from "vue-web-terminal"
import 'vue-web-terminal/lib/theme/dark.css'

const terminals = ref<any>([
  {
    show: true,
    name: 'terminal',
    context: '',
    dragConf: {
      width: "100%",
      height: "60%",
      zIndex: 100,
      init: {
        x: 0,
        y: 0
      },
      pinned: true
    },
    showHeader: false
  }
])

const onExecCmd = (key: string, command: string, success: Function, failed: Function) => {
  // if (key === 'fail') {
  //   failed('Something wrong!!!')
  // } else {
  //   let allClass = ['success', 'error', 'system', 'info', 'warning'];

  //   let clazz = allClass[Math.floor(Math.random() * allClass.length)];
  //   success({
  //     type: 'normal',
  //     class: clazz,
  //     tag: '成功',
  //     content: command
  //   })
  // }
  if (key == "cls" || key == "clear") {
    TerminalApi.clearLog('terminal');
    terminTextStoreIns.Info = ""
  }

  success();
}


// 检测目录是否设置
ipcRenderer.send('check-root-dir');
ipcRenderer.on('on-check-root-dir', (event: any, hasRootDir: boolean) => {
  console.log("hasRootDir", hasRootDir);
  //显示目录设置
  if (!hasRootDir) {
    setRootDirDialogVisible.value = true;
  } else {
    ipcRenderer.send('check-ipv6-open');
  }
});

// 选择目录按钮回调
const onSetRootDirDialogBtnClicked = () => {
  ipcRenderer.send('open-dialog', true);
  console.log("test");
}

ipcRenderer.on('on-open-dialog', (event: any, result: any) => {
  console.log(result);
  if (result.canceled == false && result.filePaths[0]) {
    if (setRootDirDialogVisible.value == true) {
      //关闭界面后再检查是否开启IPV6
      ipcRenderer.send('check-ipv6-open');
    }
    //用户选择了目录
    setRootDirDialogVisible.value = false; //关闭界面
  }
});

//恢复语言配置
let lang_value = localStorage.getItem('lang_value');
if (lang_value && lang_value != "") {
  locale.value = lang_value
}

//监听设置变化
ipcRenderer.on('on-plugin-setting-change', (event: any, settingKey: string, setingValue: any, settingClass: string) => {
  if (settingClass == "Preferences") {

    if (settingKey == "Languages") {
      //语言设置变化
      locale.value = setingValue

      localStorage.setItem('lang_value', locale.value);
    } else if (settingKey == "OpenCdn") {
      //开启网络加速
      (window as any).Constants.setOpenCdn(setingValue);
    }

  }
})
let loadtimer:any = null;
//显示执行loading
ipcRenderer.on('on-plugin-run-loading', (event: any, isOpen: boolean, text: string, autoCloseTime: number) => {

  if(loadtimer){
    // 清除之前的定时器句柄
    clearTimeout(loadtimer);
    loadtimer = null;
  }
  const loading = ElLoading.service({})

  if (isOpen) {
    loading.setText(text);
    
    if (autoCloseTime) {
      loadtimer = setTimeout(() => {
        loading.close();
        if(loadtimer){
          // 清除之前的定时器句柄
          clearTimeout(loadtimer);
          loadtimer = null; // 置空定时器句柄
        }
      }, autoCloseTime)
    }
  } else {
    loading.close();
  }


})

//显示message
ipcRenderer.on('on-plugin-show-message', (event: any, text: string) => {
  ElMessage(text)
})


//显示确认框
ipcRenderer.on('on-plugin-show-message-box', (event: any, title: string, content: string, params: any = {}) => {
  params.align = params.align || 'center'
  params.delayCloseTime = params.delayCloseTime || 0
  params.types = params.types || 'info'
  params.confirmButtonText = params.confirmButtonText || t('globaldialog.button_ok');
  let locations = ''
  switch (params.align) {
      case 'center':
          locations = '0,0'
          break;
      case 'left':
          locations = '-30vw,0'
          break;
      case 'right':
          locations = '30vw,0'
          break;
      case 'top':
          locations = '0,-35vh'
          break;
      case 'top-left':
          locations = '-30vw,-35vh'
          break;
      case 'top-right':
          locations = '30vw,-35vh'
          break;
      case 'bottom':
          locations = '0,35vh'
          break;
      case 'bottom-left':
          locations = '-30vw,35vh'
          break;
      case 'bottom-right':
          locations = '30vw,35vh'
          break;
  }
  let timerset: any = null
  ElMessageBox({
      title: title,
      message: h('p', {style: {
          textAlign: 'left',
          width: '396px',
          maxHeight: '200px',
          overflowY: 'auto',
        }
      }, content),
      type: params.types, // 可以是 'success', 'warning', 'info', 'error'
      customStyle: {
          transform: 'translate(' + locations + ')',
      },
      showCancelButton: params.showCancelButton,
      confirmButtonText: params.confirmButtonTextLanKey ? t(params.confirmButtonTextLanKey) : params.confirmButtonText,
      cancelButtonText: params.cancelButtonTextLanKey ? t(params.cancelButtonTextLanKey) : params.cancelButtonText,
      center: true,
      showClose: true,
      beforeClose: (action: string, instance: any, done: () => void) => {
          if (action === 'confirm') {
              done();
          } else if (action === 'cancel') {
              done();
          } else if (action === 'close') {
              done();
          }
      }
  }).then(() => {
      // 确认
      clearTimeout(timerset)
  }).catch(() => {
      // 取消
      clearTimeout(timerset)
  });

  // 设置延迟关闭
  if (params.delayCloseTime > 0) {
      timerset = setTimeout(() => {
          ElMessageBox.close();
      }, params.delayCloseTime);
  }
});

//终端显示消息
ipcRenderer.on('on-plugin-terminal-message', (event: any, text: string) => {
  terminTextStoreIns.Info += text
  TerminalApi.pushMessage('terminal', text)
})

//显示ipv6未开启提示
ipcRenderer.on('on-plugin-show-ipv6-tip', (event: any) => {
  setIpv6DialogVisible.value = true;
})

// Ipv6提示框确认
const onIpv6DialogOkBtnClicked = () => {
  setIpv6DialogVisible.value = false;
}
// 不再提示IPv6
const onIpv6DialogIgnoreBtnClicked = () => {
  ipcRenderer.send('ignore-check-ipv6-open');
  setIpv6DialogVisible.value = false;
}

//是否有消息
const hasMessage = ref(0)
//判断是否聊天消息有新消息
const checkHasMessage = ref(0)
//判断是否评论消息有新消息
const checkHasCommentMessage = ref(0)
//判断是否点赞消息有新消息
const checkHasLikeMessage = ref(0)



//获取服务器判断是否有消息
const getHasMessage = async () => {
  //判断是否登录
  if (!userStoreIns.isLogin()) {
    return;
  }
  let url = (window as any).Constants.uploadUrl + '/chat/unread-count'
  axios.get(url, { 
    headers: {
      'access-token': localStorage.getItem('token')
    },
  }).then(res => {
    if(res.data.code == 200) {
      hasMessage.value = res.data.data.unread_count
      checkHasMessage.value = res.data.data.message_unread_count
      checkHasCommentMessage.value = res.data.data.comment_unread_count
      checkHasLikeMessage.value = res.data.data.like_unread_count
    }
  })
}

let messageTimer:any = null;

//开启定时获取消息
const startMessageTimer = () => {
  if(messageTimer) return;
  messageTimer = setInterval(() => {
    getHasMessage();
  }, 30000); //30秒执行一次
}

//关闭定时获取消息
const stopMessageTimer = () => {
  clearInterval(messageTimer);
}

//注入代码
let isUserLogined = ref(false)
// let userInfos = ref({email:"", vipType:0, vipExpTime:""}) //用户邮件
// 获取用户信息
const getUserInfo = async () => {
  let url = (window as any).Constants.uploadUrl + "/users/info";

  console.log(url);

  let token = localStorage.getItem('token');

  if (!token || token == "") {
    return;
  }
  
  let {macid,devicename,devicetype} = await ipcRenderer.invoke('get-user-device-code')

  ipcRenderer.send('set-config-token', token);
  
  axios.get(url,{
    headers: {
      "access-token": token
    },
    params:{
      machine_code: macid,
      machine_name: devicename,
      machine_type: devicetype
    }
  }).then(function (response) {
    console.log("获取用户信息", response.data);
    isUserLogined.value = true;
    userStoreIns.userInfo = response.data.user;
    userStoreIns.userInfo.machine_code = macid
    // userInfos.value["email"] = response.data.user.email;
    // userInfos.value["vipType"] = response.data.user.vip_type;
    // userInfos.value["vipExpTime"] = response.data.user.vip_expire_time;

    ipcRenderer.send('set-config-userinfo', response.data.user);

    TerminalApi.pushMessage('terminal', 'welcome ' + userStoreIns.userInfo["email"] + '!')

    matomo.setUserId(userStoreIns.userInfo["email"]);

    if(response.data.user.status == 2 && new Date(response.data.user.ban_expire_time) > new Date()){
      openUserBanDialog({status:response.data.user.status, ban_expire_time:response.data.user.ban_expire_time,ban_reason:response.data.user.reason});
    }else if(response.data.user.status == 3){
      openUserBanDialog({status:response.data.user.status,ban_reason:response.data.user.reason});
    }

    if(response.data.user.machine_code_count_over){
      openDeviceDialog();
    }else{
      getHasMessage();
      startMessageTimer();
    }

  }).catch(function (error) {
    console.error("获取用户信息失败", error);
    isUserLogined.value = false;
    localStorage.removeItem('token');
    ipcRenderer.send('set-config-token', null);
    ipcRenderer.send('set-config-userinfo', null);
    matomo.resetUserId();
  })
}

//退出登录
const loginOut = () => {
  isUserLogined.value = false;
  localStorage.removeItem('token');
  userStoreIns.userInfo = {
    "email": "",
    "vip_type": 0,
    "id_role": 0
  }
  // userInfos.value["email"] = "";
  // userInfos.value["vipType"] = 0;
  // userInfos.value["vipExpTime"] = "";

  ipcRenderer.send('set-config-token', null);
  ipcRenderer.send('set-config-userinfo', null);
  ElMessage.info("退出成功！");

  matomo.resetUserId();
  router.push('/');
  stopMessageTimer();
}

//支付选择对话框
let paymentSelectionDialog = ref(null);
const openPaymentSelection = (productType: string, productId: string) => {
  (paymentSelectionDialog.value as any).openPaymentSelection(productType, productId);
}

//购买会员对话框
let purchaseMembershipDialog = ref(null);
const openPurchaseMembership = () => {
  (purchaseMembershipDialog.value as any).openPurchaseMembership();
}
// 二维码支付对话框
let qrcodePaymentDialog = ref(null);
const openQRCodePayment = (orderInfo: any, data: any) => {
  (qrcodePaymentDialog.value as any).openQRCodePayment(orderInfo, data);
}
// 分享AI项目对话框
let shareAiProjectDialog = ref(null);
const openShareAiProject = (projectInfo: any, data?: any) => {
  (shareAiProjectDialog.value as any).openShareAiProject(projectInfo, data ? data : null);
}
// 支付说明对话框
let paymentExplainDialog = ref(null);
const openPaymentExplain = (url?: any) => {
  (paymentExplainDialog.value as any).openPaymentExplain(url ? url : null);
}
// 产品详情对话框
let productDetailsDialog = ref(null);
const openProductDetails = (productInfo: any, localProductInfo?: any, tabclass?: string,userid?:string) => {
  (productDetailsDialog.value as any).openProductDetails(productInfo, localProductInfo ? localProductInfo : null, tabclass ? tabclass : null, userid ? userid : null);
}
//审核页面产品详情对话框
let productDetailsReviewDialog = ref(null);
const openProductDetailsReview = (productInfo: any, localProductInfo?: any, tabclass?: string,userid?:string) => {
  (productDetailsReviewDialog.value as any).openProductDetailsReview(productInfo, localProductInfo ? localProductInfo : null, tabclass ? tabclass : null, userid ? userid : null);
}
//产品详情对话框
//通过Url协议进入
ipcRenderer.on('on-windows-protocol-url-enter', (event: any, urlParams: any) => {
  console.log(urlParams);
  let hostname = urlParams.hostname;
  if(hostname == "project"){
    //打开项目
    // let fileId = Number(urlParams.pathname.slice(1));
    // openProductDetails({'id':fileId})
    let pathParts = urlParams.pathname.split('/').filter((part:any) => part !== '');
    if (pathParts.length >= 1) {
      let fileId = Number(pathParts[0]);
      let typeid = pathParts.length > 1 ? pathParts[1] : null;
      // 打开项目
      openProductDetails({ id: fileId,res_type:typeid});
    } else {
      let fileId = Number(pathParts[0]);
      // 打开项目
      openProductDetails({ id: fileId });
    }
  }else if(hostname == "pricing"){
    let pathParts = urlParams.pathname.split('/').filter((part:any) => part !== '');
    if (pathParts.length == 1) {
      paymentStoreIns.couponCode = pathParts[0];
    }
    openPurchaseMembership();
  }
  
})
//更新提示
let updatePromptDialog = ref(null);
const openUpdatePrompt = () => {
  (updatePromptDialog.value as any).openUpdatePrompt();
}
//创建项目
let createProjectDialog = ref(null);
const openCreateProject = () => {
  (createProjectDialog.value as any).openCreateProject();
}
//分享项目对话框
let shareDialog = ref(null);
const openShareDialog = (imgurl: any, name: any,projectid:string,restype?:string) => {
  (shareDialog.value as any).openShareDialog(imgurl, name,projectid,restype);
}
//用户封禁对话框
let userBanDialog = ref(null);
const openUserBanDialog = (banDatas: any) => {
  (userBanDialog.value as any).openUserBanDialog(banDatas);
}
//用户忘记密码
let loginForgotPasswordDialog = ref(null);
const openLoginForgotPasswordDialog = () => {
  (loginForgotPasswordDialog.value as any).openLoginForgotPasswordDialog();
}
//编辑代码
let editCodeDialog = ref(null);
const openEditCode = (pluginName: string) => {
  (editCodeDialog.value as any).openEditCode(pluginName);
}
//调试运行
let debugRunDialog = ref(null);
const openDebugRun = (pluginName: string) => {
  (debugRunDialog.value as any).openDebugRun(pluginName);
}
//导入模型、插件、工作流
let importIntoPorjectDialog = ref(null);
const openImportIntoPorject = (plugin: any,paths: string) => {
  (importIntoPorjectDialog.value as any).openImportIntoPorject(plugin,paths);
}
//提现
let withdrawDialog = ref(null);
const openWithdrawDialog = (min:number,max:number,callback:any) => {
  (withdrawDialog.value as any).openWithdrawDialog(min,max,callback);
}
//设备对话框
let deviceDialog = ref(null);
const openDeviceDialog = () => {
  (deviceDialog.value as any).openDeviceDialog();
}
//查看更新弹窗
let checkVersionUpdateDialog = ref(null);
const openCheckVersionUpdateDialog = (version:string,updateLog:string,callback:any) => {
  (checkVersionUpdateDialog.value as any).openCheckVersionUpdateDialog(version,updateLog,callback);
}


// 提供注入属性
provide('main', {
  vipIconurl,
  isUserLogined,
  getUserInfo,
  loginOut,
  isShowTerminal,
  openPaymentSelection,
  openPurchaseMembership,
  openQRCodePayment,
  openShareAiProject,
  openPaymentExplain,
  openProductDetails,
  openProductDetailsReview,
  openUpdatePrompt,
  openCreateProject,
  openShareDialog,
  openUserBanDialog,
  openLoginForgotPasswordDialog,
  openEditCode,
  openDebugRun,
  openImportIntoPorject,
  globalHide,
  isAdmin,
  openWithdrawDialog,
  openDeviceDialog,
  openCheckVersionUpdateDialog,
  hasMessage,
  checkHasMessage,
  checkHasCommentMessage,
  checkHasLikeMessage,
  startMessageTimer,
  stopMessageTimer,
  hasNewVersion
})

//当组件挂载
onMounted(async () => {

  // 发送获取插件信息的请求，并处理回复
  const isOpenCdn = await ipcRenderer.invoke('plugin-setting-update-url');

  (window as any).Constants.setOpenCdn(isOpenCdn);

  getUserInfo();
  getAppInfos();
})

</script>

<style>
#app {
  text-align: center;
  color: var(--ep-text-color-primary);
  user-select: none;
}

.ellipsis {
  white-space: nowrap;
  /*设置不换行*/
  overflow: hidden;
  /*设置隐藏*/
  text-overflow: ellipsis;
  /*设置隐藏部分为省略号*/
}

/* 超出省略号 */
.line-limit-length {
  display: -webkit-box;
  /* 设置为WebKit内核的弹性盒子模型 */
  -webkit-box-orient: vertical;
  /* 垂直排列 */
  line-clamp: 2;
  /* 限制显示两行 */
  overflow: hidden;
  /* 隐藏超出范围的内容 */
  text-overflow: ellipsis;
  /* 使用省略号 */
}

.main-container {
  height: calc(100vh - var(--ep-menu-item-height));
}

/* 终端样式 */
.terminal_box {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: Menlo, Consolas, monospace;
  overflow: auto;
  text-align: left;
}

.custom-header {
  background-color: var(--ep-color-primary-light-5);
  color: white;
  text-align: center;
  height: 24px;
  border-radius: 6px 6px 0px 0px;
}

.t-cmd-line-content,
.t-window p,
.t-window div {
  font-size: 16px !important;
  line-height: 18px;
}

.t-log-box {
  margin-block-start: 0.7em;
  margin-block-end: 0.7em;
}

.ep-loading-mask {
  top: 40px !important;
}
</style>
