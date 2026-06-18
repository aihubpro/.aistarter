<template>
  <el-menu class="el-menu-vertical-demo" mode="vertical" @select="handleMenuSelect" :id="pdAdmin" :default-active="store.homeActiveTab">
    <div class="menu-items-container">
      <el-menu-item v-for="tab in tabs" :key="tab.index" :index="tab.index">
        <div class="menu-item-container">
          <component :is="tab.icon" style="width: 24px; height: 24px"></component>
          <span class="menu-label">{{ $t(tab.label) }}</span>
        </div>
      </el-menu-item>

      <div class="menu-bottom-container">

        <!-- <div @click="onTerminalClicked()"
            class="menu-bottom-item-container"
            style="margin-bottom: 5px;"
          >
            <el-icon :size="24"><DataBoard /></el-icon>
            <span class="menu-label">终端</span>
          </div> -->

        <div @click="onDiscusClicked()" class="menu-bottom-item-container" style="margin-bottom: 5px;">
          <el-icon :size="24">
            <ChatDotRound />
          </el-icon>
          <span class="menu-label">{{ $t('app.menu_discus') }}</span>
        </div>

        <div @click="onLinkClicked()" class="menu-bottom-item-container" style="margin-bottom: 5px;">
          <el-icon :size="24">
            <Link />
          </el-icon>
          <span class="menu-label">{{ $t('app.menu_ai_navigation') }}</span>
        </div>

        <el-popover :width="240" placement="right-end" trigger="click"
          popper-style="box-shadow: rgb(14 18 22 / 35%) 0px 10px 38px -10px, rgb(14 18 22 / 20%) 0px 10px 20px -15px; padding: 20px;">
          <template #reference>
            <div class="menu-bottom-item-container">
              <el-icon :size="24">
                <Service />
              </el-icon>
              <span class="menu-label">{{ $t('app.customer_service') }}</span>
            </div>
          </template>
          <template #default>
            <div style="text-align: center;">
              <img :src="support_img" style="width: 100%; margin-bottom: 10px;" alt="微信扫一扫">
              <span style="line-height: 17px;font-size: 16px;">{{ $t('app.support_title') }}</span>
              <!-- <el-link style="font-size: 16px;" type="warning" href="tencent://message?uin=594691248&Site=&Menu=yes" target="_blank">{{
                $t('app.support_title') }}</el-link> -->
              <el-divider style="margin: 10px 0;" />
              <span style="line-height: 17px;font-size: 16px;">{{ $t('app.support_link_title') }}</span>
              <!-- <el-link style="font-size: 16px;" type="warning" href="mailto:a@chenzhixiong.cn" target="_blank">{{
                $t('app.support_link_title') }}</el-link> -->
            </div>

          </template>
        </el-popover>

        <div @click="toggleDark()" class="menu-bottom-item-container" style="margin-bottom: 5px;">
          <i inline-flex i="dark:ep-moon ep-sunny" style="width: 24px;height: 24px;" />
          <span class="menu-label">{{ $t('app.menu_light') }}</span>
        </div>

      </div>
    </div>
  </el-menu>

</template>

<style scoped>
.menu-items-container {
  display: flex;
  flex-direction: column;
  /*height:  calc(100% - var(--ep-menu-item-height)); /* 减去底部按钮的高度 */
  height: 100%;
}

.menu-bottom-container {
  margin-top: auto;
}

.menu-item-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 5px;
}

.menu-bottom-item-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 24px;
  font-size: 15px;
  height: 68px;
  width: 80px;
}

.menu-bottom-item-container:hover {
  background-color: var(--ep-menu-item-hover-fill);
  cursor: pointer;
}

.menu-icon {
  width: 24px;
  height: 24px;
}

.menu-label {
  text-align: center;
  line-height: 24px;
}

.ep-menu .is-active {
  background-color: var(--ep-menu-item-hover-fill);
  /* 选中时的背景颜色 */
  border-radius: 4px;
  border-left: 5px solid var(--ep-color-primary);
}

.ep-menu-item {
  height: 68px;
  width: 80px;
  justify-content: center;
}
</style>

<script lang="ts" setup>

import { ref, inject, onUpdated,computed } from 'vue';
import { useRouter } from 'vue-router';  // 引入 useRoute
import { toggleDark } from "~/composables";

import { userStore } from '../../stores/UserStore'

const store = userStore()
//注入 是否显示终端
const { isShowTerminal } = inject('main') as any;

// import {
//   House,
//   Files,
//   Setting,
//   Link,
// } from "@element-plus/icons-vue";

// const activeTab = ref('home');

let support_img = new URL("/service_dong.png", import.meta.url).href

const pdAdmin = computed(()=>{
  if(store.isAdmin()){
    tabs.value = [
      { index: 'home', label: "app.menu_home", icon: "House" },
      { index: 'market', label: "app.menu_market", icon: "Box" },
      { index: 'files', label: "app.menu_file", icon: "Files" },
      { index: 'settings', label: "app.menu_setting", icon: "Setting" },
      { index: 'terminal', label: "app.menu_terminal", icon: "DataBoard" },
      { index: 'review', label: "app.menu_review", icon: "View"},
      // { index: 'my', label: "app.menu_my", icon: "User" },
      // 其他选项卡
    ];
  }else{
    tabs.value = [
      { index: 'home', label: "app.menu_home", icon: "House" },
      { index: 'market', label: "app.menu_market", icon: "Box" },
      { index: 'files', label: "app.menu_file", icon: "Files" },
      { index: 'settings', label: "app.menu_setting", icon: "Setting" },
      { index: 'terminal', label: "app.menu_terminal", icon: "DataBoard" },
      // { index: 'my', label: "app.menu_my", icon: "User" },
      // 其他选项卡
    ];
  }
  
})

const tabs = ref([
  { index: 'home', label: "app.menu_home", icon: "House" },
  { index: 'market', label: "app.menu_market", icon: "Box" },
  { index: 'files', label: "app.menu_file", icon: "Files" },
  { index: 'settings', label: "app.menu_setting", icon: "Setting" },
  { index: 'terminal', label: "app.menu_terminal", icon: "DataBoard" },
  // { index: 'my', label: "app.menu_my", icon: "User" },
  // 其他选项卡
]);



const router = useRouter();  // 使用 useRouter 获取 useRouter 对象


const handleMenuSelect = (index: string) => {
  if (index == "terminal") {
    onTerminalClicked();
  } else {
    store.homeActiveTab = index;
    router.push({name:index}); // 如果需要路由切换，你可以在此处进行路由导航
    isShowTerminal.value = false;
  }
};

//显示终端
const onTerminalClicked = () => {
  isShowTerminal.value = true;
}

const onLinkClicked = () => {
  window.open("https://www.aihubpro.cn/links", "_blank");
}

const onDiscusClicked = () => {
  window.open("https://www.aihubpro.cn/collection/aistarter", "_blank");
}


</script>
