<!-- App.vue -->
<template>
  <el-header class="title-bar">
    <div class="title-container">
      <img src="/app_icon.png" width="22" height="22" />
      <div class="title-label">{{ $t('app.title') }} {{version}} LTS - {{ isAdmin?$t('app.title_admin'):$t('app.title_no_admin') }}</div>
    </div>

    <div class="window-controls">
      <!-- 查看更新 -->
      <el-tooltip class="box-item" effect="dark" :content="$t('versionupd.check_update')" placement="bottom">
        <el-button v-btn @click="checkForUpdates()" circle>
          <el-badge :is-dot="hasNewVersion" :offset="[2, 0]">
            <el-icon><download /></el-icon>
          </el-badge>
        </el-button>
      </el-tooltip>
      <!-- 我的信息 -->
      <el-button v-btn @click="goTo()" circle v-if="isUserLogined">
        <el-badge :is-dot="hasMessage>0" :offset="[2, 0]">
          <el-icon>
            <Message />
          </el-icon>
        </el-badge>
      </el-button>
      <!-- 发布项目 -->
      <el-tooltip class="box-item" effect="dark" :content="$t('header.create_project')" placement="bottom">
        <el-button v-btn @click="openCreateProject()" circle class="ml-[15px]">
          <el-icon>
            <Plus />
          </el-icon>
        </el-button>
      </el-tooltip>
      <!-- 用户信息 -->
      <el-dropdown class="user-menu ml-[15px]" :hide-on-click="false">
        <span class="el-dropdown-link">
          <el-button v-if="!isUserLogined" v-btn circle><el-icon :size="18">
              <User />
            </el-icon></el-button>
          <el-button v-if="isUserLogined" v-btn circle><el-icon :size="18" @click="onPersonalCenter('update', '1-5-1')">
              <Avatar />
            </el-icon></el-button>
        </span>
        <template #dropdown>
          <el-dropdown-menu style="width: auto;min-width: 100px;">
            <el-dropdown-item disabled v-if="store.userInfo.email != ''">{{ store.userInfo.email }}</el-dropdown-item>
            <el-dropdown-item @click="onBuyVip">
              <div class="w-full">
                <div v-if="store.userInfo.vip_type == 0 && !isUserLogined" class="text-center">{{ $t('header.subscribe') }}</div>
                <!-- <div v-if="store.userInfo.vip_type == 0 && isUserLogined">我要成为会员</div> -->
                <el-text type="danger" v-if="store.userInfo.vip_type == 0 && isUserLogined">
                  <el-icon><Goods /></el-icon>
                  <span>{{ $t('header.join_member') }}</span>
                </el-text>
                <el-text type="warning" v-if="store.userInfo.vip_type == 1">
                  <!-- <el-icon :size="16">
                  <Medal />
                </el-icon> -->
                  <el-image class="w-16px h-12px" :src="vipIconurl" fit="fill" />
                  {{ $t('header.vip_annual_member') }}</el-text>
                <el-text type="warning" v-if="store.userInfo.vip_type == 2">
                  <!-- <el-icon :size="16">
                  <GoldMedal />
                </el-icon> -->
                  <el-image class="w-16px h-12px" :src="vipIconurl" fit="fill" />
                  {{ $t('header.vip_lifetime_member') }}</el-text>
              </div>
            </el-dropdown-item>
            <el-dropdown-item v-if="!isUserLogined" @click="onLoginBtnClick">
              <div class="m-auto">{{ $t('header.login') }}</div>
            </el-dropdown-item>
            <el-dropdown-item v-if="isUserLogined && store.userInfo.InfoState != 3" @click="onPersonalCenter('updateInfo', '1-5-2')">
              <div>
                {{ $t('header.join_creator') }}
              </div>
            </el-dropdown-item>
            <!-- <el-dropdown-item v-if="isUserLogined">
              <el-icon>
                <Money />
              </el-icon>
              钱包
              <span class="absolute right-10px text-yellow">
                ￥0.00
              </span>
            </el-dropdown-item> -->
            <!-- <el-dropdown-item v-if="isUserLogined">
              <el-icon><Goods /></el-icon>
              购买记录
              <el-icon class="absolute right-0px">
                <ArrowRight />
              </el-icon>
            </el-dropdown-item> -->
            <el-dropdown-item v-if="isUserLogined" @click="onPersonalCenter('update', '1-5-1')">
              <el-icon>
                <User />
              </el-icon>
              {{ $t('header.my_account') }}
              <el-icon class="absolute right-0px">
                <ArrowRight />
              </el-icon>
            </el-dropdown-item>
            <el-dropdown-item v-if="isUserLogined" @click="goTo()">
              <el-icon><ChatDotRound /></el-icon>
              <el-badge v-if="hasMessage > 0" :value="hasMessage" :offset="hasMessage > 99 ? [26, 12] : hasMessage > 9? [36, 12]:[40, 12]">

                {{ $t('personalcenter.mymessage') }}
              </el-badge>
              <div v-else>
                {{ $t('personalcenter.mymessage') }}
              </div>
              <el-icon class="absolute right-0px">
                <ArrowRight />
              </el-icon>
            </el-dropdown-item>
            <el-dropdown-item v-if="isUserLogined" @click="onLoginOutBtnClick">
              <el-icon style="transform: rotate(90deg);">
                <SwitchButton />
              </el-icon>
              {{ $t('header.logout') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-button v-btn @click="minimizeWindow" circle><el-icon>
          <Minus />
        </el-icon></el-button>
      <el-button v-btn @click="maximizeWindow" circle><el-icon>
          <FullScreen />
        </el-icon></el-button>
      <el-button v-btn @click="closeWindow" circle><el-icon>
          <Close />
        </el-icon></el-button>

    </div>
  </el-header>

  <LoginLayout ref="loginDialg" />
</template>

<script lang="ts" setup>
import { ref, inject } from "vue";
import {
  FullScreen,
  Minus,
  Close,
  Medal,
  GoldMedal,
} from "@element-plus/icons-vue";

import { ElMessage } from "element-plus";
import { SwitchButton } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router';  // 引入 useRoute

import { userStore } from '../../stores/UserStore'

import { appInfoStore } from '../../stores/AppInfoStore'
const appInfoStoreIns = appInfoStore()

const store = userStore()

const router = useRouter()

const version = appInfoStoreIns.appVersion;

// 组件挂载时检查更新
// checkForUpdates();

const goTos = (val:number) => {
  switch(val){
    case 1:
      onPersonalCenter('message','7-1')
      hasMessage.value=hasMessage.value-checkHasMessage.value
      checkHasMessage.value=0
      break;
    case 2:
      onPersonalCenter('commentmessage','7-2')
      hasMessage.value=hasMessage.value-checkHasCommentMessage.value
      checkHasCommentMessage.value=0
      break;
    case 3:
      onPersonalCenter('likemessage','7-3')
      hasMessage.value=hasMessage.value-checkHasLikeMessage.value
      checkHasLikeMessage.value=0
      break;
  }
  return;
}

//判断去那个，是评论消息 还是 点赞消息 还是 聊天消息
const goTo = () => {
  //没有消息时跳到聊天页面
  if(!hasMessage.value){
    onPersonalCenter('message','7-1')
  }
  if(checkHasMessage.value){
    onPersonalCenter('message','7-1')
    hasMessage.value=hasMessage.value-checkHasMessage.value
    checkHasMessage.value=0
    return;
  }else if(checkHasCommentMessage.value){
    onPersonalCenter('commentmessage','7-2')
    hasMessage.value=hasMessage.value-checkHasCommentMessage.value
    checkHasCommentMessage.value=0
    return;
  }else if(checkHasLikeMessage.value){
    onPersonalCenter('likemessage','7-3')
    hasMessage.value=hasMessage.value-checkHasLikeMessage.value
    checkHasLikeMessage.value=0
    return;
  }
}


const onPersonalCenter = (val?: string, id?: string) => {
  // if(globalHide.value){
  //   return
  // }
  // if (!isUserLogined) {

  //   return
  // }else{
  //   (loginDialg.value as any).openDialog(true)
  //   return
  // }
  // console.log(router.currentRoute.value.query)
  if (router.currentRoute.value.path == "/my") {
    // if (val !== undefined && id !== undefined) {
    //   router.currentRoute.value.query.val = val
    //   router.currentRoute.value.query.id = id
    // }
    router.push({ path: "/my", query: { val: val, id: id } })
  } else {
    store.homeActiveTab = ""
    router.push({ path: "/my", query: { val: val, id: id } })
  }
}



const loginDialg = ref(null)

const { isShowTerminal, isUserLogined, loginOut, openPurchaseMembership, openUpdatePrompt, openCreateProject, globalHide,isAdmin,hasMessage,  checkHasMessage,checkHasCommentMessage,checkHasLikeMessage,openCheckVersionUpdateDialog,hasNewVersion } = inject('main') as any;

// 检查版本更新
const checkForUpdates = async () => {
  try {
    // ElMessage.success('检查版本更新')
    openCheckVersionUpdateDialog()
  } catch (error) {
    console.error('检查更新失败:', error);
  }
};

// const handleMenuSelect = (index: string) => {
//   console.log("asdfasdf")
//   activeTab.value = "";
// };

const { ipcRenderer } = require('electron');

//vip 图标
const vipIconurl = new URL("~/assets/vipIcon.png", import.meta.url).href;
const minimizeWindow = () => {
  ipcRenderer.send('window-minimize')
};

const maximizeWindow = () => {
  ipcRenderer.send('window-maximize')
};
const closeWindow = () => {
  ipcRenderer.send('window-close')
};

// const loginDialgVisable = ref(false);

const onLoginBtnClick = () => {
  (loginDialg.value as any).openDialog(true)
}

const onLoginOutBtnClick = () => {
  loginOut();
}

const formatIsoDate = (isoDateString: string) => {
  // 创建 Date 对象
  const date = new Date(isoDateString);

  // 获取年份、月份、日期、小时、分钟和秒
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 月份是从 0 开始的
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  // const seconds = date.getSeconds().toString().padStart(2, '0');

  // 返回格式化的字符串
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

//打开购买会员
const onBuyVip = () => {
  if (store.userInfo["vip_type"] == 1) {
    ElMessage.warning("您目前是年会员，截止至" + formatIsoDate(store.userInfo["vip_expire_time"]));
    return;
  }

  if (store.userInfo["vip_type"] == 2) {
    ElMessage.warning("感谢您，您是尊贵的永久会员！");
    return;
  }

  openPurchaseMembership();
}

</script>

<style scoped>
.el-dropdown-item {
  overflow: auto;
}

.title-bar {
  background-color: var(--ep-menu-bg-color);
  height: var(--ep-menu-item-height);
  display: flex;
  justify-content: space-between;
  -webkit-app-region: drag;
  border-bottom: solid 1px var(--ep-menu-border-color);
}

.title-container {
  display: flex;
  align-items: center;
  /* 垂直居中对齐 */
}

.title-label {
  color: var(--ep-menu-text-color);
  text-align: center;
  /* 居中对齐 */
  padding-left: 6px;
}

.window-controls {
  display: flex;
  -webkit-app-region: no-drag;
  align-items: center;
  /* 垂直居中对齐 */
}

.user-menu {
  cursor: pointer;
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
  margin-right: 15px;
  margin-top: 2px;
}

.version-item {
  padding: 8px 16px !important;
}

.version-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  min-width: 150px;
}

.version-text {
  font-size: 14px;
}

.update-text {
  color: var(--el-color-warning);
  font-size: 12px;
  font-weight: 500;
  background: var(--el-color-warning-light-9);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--el-color-warning-light-7);
  position:absolute;
  right: 5px;
}
</style>
