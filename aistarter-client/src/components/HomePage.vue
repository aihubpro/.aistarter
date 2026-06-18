<template>
  <div class="page_bady">
    <!-- 幻灯片 -->
    <div class="home_banner caroimg" v-if="!carouselHide">
      <el-carousel ref="carousel" height="auto" :interval="5000" :autoplay="carouselAutoplay">
        <el-carousel-item v-for="(item, index) in bannerCfg" :key="index">
          <a :href="item.urlHref" target="_blank" :style="item.urlHref ? '' : 'cursor: default;'">
            <el-icon class="absolute right-2 top-2 z-10 caroClose bg-000" style="color: rgba(255, 255, 255, .7);" @click.prevent="carouselCloseitem(index)"><CloseBold /></el-icon>
            <el-image :src="item.image" style="width: 100%;"/>
          </a>
        </el-carousel-item>
      </el-carousel>
    </div>
    <!-- 已安装软件 -->
    <div class="home_block">
      <h3 class="flex align-center justify-between">
        <!-- 筛选 -->
        <FilterComponent :items="projectTypeList" :itemsAppoin="projectType" @updateTab="updateTab"
          @clickSort="clickSort" @clickItem="clickItem" @clickClear="clickClear" @CloseTab="CloseTab"
          :sortItems="marketSortData.sortby" :ifCreate="false" :editableTabsValue="userStoreIns.homeFilterTab">
          <!-- <el-button plain @click="openCreateProject()" class="absolute right-360px top-2.5px z-10 mr-2"
            style="padding: 14px 11px;" size="small" :icon="Plus" /> -->
          <el-input v-model="searchKeyword" class="absolute right-170px top-2.5px z-10 w-180px mr-2"
            :placeholder="$t('app.search')" @change="onSearchInputChange" />
        </FilterComponent>
      </h3>
      <HomeSoftwareList :search="searchKeyword" :sort="sortValue" :filter="filter" :upTab="upTab" :update="updateHomeSoft"></HomeSoftwareList>
    </div>
    <!-- 引入 CreateProjectDialog.vue -->
    <CreateProjectDialog ref="createProjectDialog" @close-dialog="refreshPage" />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, inject, computed } from "vue";
import HomeSoftwareList from "./commons/HomeSoftwareList.vue";
// const { openCreateProject } = inject("main") as any;
import {appInfoStore} from '../stores/AppInfoStore'
import { userStore } from '../stores/UserStore'

import {
  Plus,
  CloseBold
} from '@element-plus/icons-vue'
//导入筛选
import marketFilterData from "../configs/market_filter_data.json"
//导入排序筛选
import marketSortData from "../configs/market_sort_data.json"
//导入轮播图图片数据
import getDefaultBannerData from "../configs/home_banner_data"

const appInfoStoreIns = appInfoStore()
const userStoreIns = userStore()
const updateHomeSoft = ref("")

const refreshPage = () => {
  // 在这里执行刷新操作，例如重新获取数据
  console.log("刷新页面");
  updateHomeSoft.value = new Date().toISOString(); // 使用当前时间戳更新值
}

//是否开启轮播图播放
const carouselAutoplay = ref(true)
//是否隐藏轮播图
const carouselHide = computed(() => {
  return bannerCfg.value.length == 0
})
//轮播图关闭某一张图片
const carouselCloseitem = (id: number) => {
  //删除某一张图片
  // bannerCfg.value.splice(id, 1)
  appInfoStoreIns.bannerInfo.forEach((item: any, index: number) => {
    if (item.id == bannerCfg.value[id].id) {
      appInfoStoreIns.bannerInfo.splice(index, 1)
    }
  })
}
/**
 * 深度克隆一个对象或数组
 * 
 * 该函数通过递归的方式创建一个新对象或数组，其内部元素与源对象或数组内部元素在值上完全相同，
 * 但彼此之间在内存中是独立的，即修改克隆后的对象或数组不会影响到原始对象或数组
 * 
 * @param source 要克隆的源对象或数组它可以是任何类型的值，但函数主要处理对象和数组类型
 * @returns 返回克隆后的对象或数组如果源不是对象或为null，则直接返回源值
 */
function deepClone(source: any) {
  // 检查源是否不是对象或为null，如果是，则直接返回源值
  if (typeof source !== 'object' || source == null) {
    return source;
  }

  // 初始化目标对象或数组，根据源是数组还是对象来决定目标的类型
  const target: any = Array.isArray(source) ? [] : {};

  // 遍历源对象或数组的所有属性
  for (const key in source) {
    // 确保属性是源对象的直接属性，而不是原型链上的属性
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      // 如果属性值是对象且不为null，则递归调用deepClone进行深度克隆
      if (typeof source[key] === 'object' && source[key] !== null) {
        target[key] = deepClone(source[key]);
      } else {
        // 如果属性值不是对象或为null，则直接复制属性值
        target[key] = source[key];
      }
    }
  }

  // 返回克隆后的对象或数组
  return target;
}
const projectTypeList = ref(deepClone(marketFilterData.tab_list))
const projectType = ref(deepClone(marketFilterData.app).filter((item: any) => { return !item.hidden }))
const upTab = ref(userStoreIns.homeFilterTab)
const updateTab = (val: any) => {
  // console.log(val)
  upTab.value = val
  if (val == "class") {
    projectType.value = marketFilterData.app.filter((item: any) => { return !item.hidden })
  } else if (val == "model") {
    projectType.value = marketFilterData.model.filter((item: any) => { return !item.hidden })
  } else if (val == "plugin") {
    projectType.value = marketFilterData.plugin.filter((item: any) => { return !item.hidden })
  } else if (val == "workflow") {
    projectType.value = marketFilterData.workflow.filter((item: any) => { return !item.hidden })
  } else if (val == "other") {
    projectType.value = marketFilterData.other.filter((item: any) => { return !item.hidden })
  }
}

const filter:any = ref("")
//排序筛选
const clickSort = (val: any) => {
  console.log(val)
  sortValue.value = val
}
//筛选数据点击
const clickItem = (val: any) => {
  console.log(JSON.stringify(val))
  filter.value = val || {}
}
//清除筛选
const clickClear = () => {
  console.log("清除")
  filter.value = {}
}
//tab删除
const CloseTab = (val: any) => {
  console.log(JSON.stringify(val))
  filter.value = val || {}
}


let carousel = ref(null);
const searchKeyword = ref(""); //搜索关键字

const onSearchInputChange = () => {
  return searchKeyword.value;
}

const sortValue = ref('1')

//banner图片url转换
let bannerCfg = computed(() => {
  return [
    ...appInfoStoreIns.bannerInfo
  ];
})

onMounted(() => {
  setTimeout(() => {
    //fix: 幻灯片高度显示bug
    if ((carousel.value as any) != null) {
      (carousel.value as any).setActiveItem(0)
    }
  }, 100)
  // setTimeout(() => {
  //   appInfoStoreIns.bannerInfo.reverse().forEach((image) =>{
  //     const img = new Image()
  //     img.src = image.image
  //     img.onload = () => {
  //       bannerCfg.value.unshift(image)
  //     }
  //   })
  // }, 1000)
})

const createProjectDialog = ref(null);

const openCreateProject = () => {
  (createProjectDialog.value as any).openCreateProject();
}
</script>

<style scoped>
.caroimg:hover .caroClose {
  opacity: 0.9;
}

.caroClose {
  opacity: 0;
}

:deep(.ep-tabs__content) {
  width: 90vw;
}

:deep(.ep-tabs__header) {
  margin-bottom: 10px;
}

:deep(.ep-tabs__item) {
  padding: 0 10px;
}

:deep(.ep-select__wrapper) {
  min-height: 31px;
}

/* 筛选样式重写 */
.ep-checkbox {
  margin: 4px;
}

.page_bady {
  padding: 0px 10px;
  display: flex;
  flex-flow: column;
  height: 100%;
  overflow: hidden;
}

.home_banner {
  padding: 10px 0px;
  border-radius: 10px;
}

.home_banner .ep-carousel__container {
  height: max-content;
}

.home_banner .ep-carousel__item {
  height: auto;
  border-radius: 10px;
}

.home_block {
  margin-bottom: 10px;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.home_block h3 {
  font-size: 16px;
  padding: 0px;
  margin: 0px;
  text-align: left;
}
</style>