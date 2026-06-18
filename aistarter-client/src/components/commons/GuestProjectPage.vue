<template>
  <div class="shop-page">
    <!-- 筛选 -->
    <FilterComponent :items="projectTypeList" :itemsAppoin="projectType" @updateTab="updateTab" @clickSort="clickSort"
    @clickItem="clickItem" @clickClear="clickClear" @CloseTab="CloseTab" :sortItems="marketSortData.marketsort">
        <!-- 搜索 -->
        <el-input v-model="searchKeyword" class="search_input absolute right-170px top-2.5px z-10"
            :placeholder="$t('app.search')" :prefix-icon="Search" @change="onSearchInputChange"
            @keyup.enter="startSearch" />
    </FilterComponent>
    <!-- 核心内容 -->
    <el-scrollbar class="relative min-h-[200px]" max-height="calc(70vh - 200px)">
        <div class="box-wrapper" v-infinite-scroll="loadMore" infinite-scroll-distance="1" v-if="!hiddenNew">
            <el-result v-if="showNoneTip" class="result-center" icon="warning" :title="$t('app.not_project')"></el-result>
            <el-result v-if="shownonetwork" class="result-center" icon="warning" :title="$t('app.no_network')"></el-result>
            <div class="box-item" v-for="(item, index) in items" :key="index">

            <div class="relative" @click="openProductDetails(item)">
                <!-- 蒙版已安装 -->
                <div v-for="(item2, index2) in softwareList" :key="index2">
                <div
                    class="absolute top-0 left-0 bg-black/50 pt-2 pb-2 w-[100%] h-[100%] z-10 flex justify-center items-center"
                    v-if="item2.name == item.plugin_name" @click.stop="openProductDetails(item, item2)">
                    <div v-if="item2.InstallState == 3">{{$t('app.project_status_install')}}</div>
                    <div v-if="item2.InstallState == 1 || item2.InstallState == 2">{{$t('app.project_status_unzip')}}
                    </div>
                    <div v-if="item2.InstallState == 0">{{$t('app.project_status_add')}}</div>
                    <!-- <div v-if="item2.version != item.version">有更新</div> -->
                </div>
                </div>
                <!-- 项目图片 -->
                <el-image style="width: 100%; height: 100%" :src="item.image_path" :zoom-rate="1.2" :max-scale="7"
                :min-scale="0.2" :initial-index="4" fit="cover" />
                <!-- 付费 -->
                <div class="absolute top-0 left-0 bg-black/50 pt-2 pb-2 w-[20%] text-color-yellow font-bold"
                style="border-radius: 10px;"
                v-if="item.price_type == 2 || (item.price_value > 0 && item.price_type != 1)">
                ￥{{ item.price_value }}
                </div>
                <!-- 配置型号和VIP -->
                <div class="absolute top-0 right-0 bg-black/50 pt-2 pb-2" v-if="typeClass == 'class'" style="border-radius: 10px;">
                  <div class="flex justify-center items-center" v-if="!isMac()">
                    <div class="flex flex-1 justify-center w-[50px]"
                      :class='item2 == "1" ? "" : item2 == "2" ? "text-color-green" : item2 == "3" ? "text-color-red" : ""'
                      style="border-radius: 10px;" v-for="(item2, index2) in item.need_device" :key="index2">
                      {{ item2 == "1" ? 'C' : item2 == "2" ? 'N' : item2 == "3" ? 'A' : '' }}
                    </div>
                  </div>
                  <div class="flex justify-center items-center" v-else>
                    <div class="flex flex-1 justify-center w-[50px]"
                      :class='item2 == "1" ? "" : item2 == "2" ? "text-color-green" : item2 == "3" ? "text-color-red" : ""'
                      style="border-radius: 10px;" v-for="(item2, index2) in item.need_device" :key="index2">
                      {{ item2 == "1" ? 'x86' : item2 == "2" ? 'arm' : item2 == "3" ? 'A' : '' }}
                    </div>
                  </div>
                </div>
                <!-- 关联的项目 -->
                <div class="absolute top-0 right-0 bg-black/50 pt-2 pb-2" v-else-if="item.ext_option" style="border-radius: 10px;">
                <div class="flex justify-center items-center">
                    <div class="flex flex-1 justify-center mr-2 ml-2">
                    <div class="w-80px ellipsis">{{ Array.isArray(item.ext_option.tag) ? item.ext_option.tag[0] : item.ext_option.tag }}</div>
                    <div class="ml-1 mr-1" v-if="item.ext_option[`${item.ext_option.tag}`]">I</div>
                    <div class="w-80px ellipsis" v-if="item.ext_option[`${item.ext_option.tag}`]">{{ Array.isArray(item.ext_option[`${item.ext_option.tag}`])?item.ext_option[`${item.ext_option.tag}`][0]:item.ext_option[`${item.ext_option.tag}`] }}</div>
                    </div>
                </div>
                </div>
                <!-- <div class="absolute top-0 left-0 bg-#f00 w-100px h-20px line-height-30px text-center font-size-12px" v-if="item.price_type == 3" style="transform: translate(-42%,-20%) rotate(-45deg);">
                <div class="flex justify-center items-center">
                    <div class="flex flex-1 justify-center text-color-#fff font-bold w-[50px]">
                    VIP
                    </div>
                </div>
                </div> -->
                <!-- 项目底部个人信息 -->
                <div class="absolute bottom-0 right-0 w-full font-size-3 bg-black/50 pt-1 pb-1">
                <div class="title-name line-limit-length mb-1 ml-2 mr-2 font-size-3 text-left font-bold">
                    <div class="font-size-[14px] flex">
                    <!-- <el-tag type="info" size="small" class="mr-1">{{ typeClass }}</el-tag> -->
                    <el-tag size="small" v-if="item.price_type == 3" effect="plain" color="rgb(0 0 0 / 0)">
                        <el-image :src="vipIconurl" fit="fill" class="w20px h-16px" />
                    </el-tag>
                    <!-- <el-tag type="success" size="small" class="mr-1"
                        v-if="item.price_type == 2 || (item.price_value > 0 && item.price_type != 1)">收费</el-tag> -->

                    <div class="line-limit-length line-height-20px" style="line-clamp:1;">
                        {{ item.plugin_name }}
                    </div>
                    </div>
                </div>
                <div class="user-name ml-2 mr-2 flex">
                    <div class="left flex flex-1">
                      <div class="name line-limit-length text-left flex" style="line-clamp:1;">
                          <!-- <el-image style="width: 10px; height: 10px" :src="imgurl" :zoom-rate="1.2" :max-scale="7"
                          :min-scale="0.2" :initial-index="4" fit="cover" /> -->
                          <div>
                            <el-icon class="w-4 h-4">
                                <User />
                            </el-icon>
                            {{ item.user_name }}
                          </div>
                      </div>
                    </div>
                    <div class="flex flex-2 justify-end items-center">
                      <div class="like_count mr-1">
                          <el-icon>
                          <Pointer />
                          </el-icon>
                          {{ toolutils.Formatter(item.like_count||0) }}
                      </div>
                      <div class="Collection mr-1">
                          <el-icon>
                          <Star />
                          </el-icon>
                          {{ toolutils.Formatter(item.favorite_count||0) }}
                      </div>
                      <div class="download">
                          <Download style="width: 1em; height: 1em; margin-right: 1px" />
                          {{ toolutils.Formatter(item.download||0) }}
                      </div>
                    </div>
                </div>
                </div>
            </div>
            </div>
        </div>
        <el-result v-if="hiddenNew" class="result-center" icon="warning"
            :title="$t('app.under_development')"></el-result>
    </el-scrollbar>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted,onBeforeUnmount, inject, computed,nextTick} from "vue";
const { ipcRenderer } = require('electron');
const { vipIconurl,openProductDetails } = inject("main") as any;
import { useI18n } from "vue-i18n";
const { t } = useI18n();
import axios from 'axios'
import {
  Search
} from "@element-plus/icons-vue";
//导入工具
import toolutils from "../../toolutils"

//导入筛选
import marketFilterData from "../../configs/market_filter_data.json"
//导入排序筛选
import marketSortData from "../../configs/market_sort_data.json"

//判断系统
const isMac = () => {
  return process.platform == 'darwin';
};

const projectTypeList = ref(toolutils.deepClone(marketFilterData.tab_list))
const projectType = ref(toolutils.deepClone(marketFilterData.app))

//排序顺序
const sortValue = ref('1')
//高度判断显示不全，留白
const heightxb = ref(true)
//筛选传的值
const filter = ref("")
//未更新内容隐藏
const hiddenNew = ref(false)
//类型标识
const typeClass = ref("class")
//后台数据标识
const resType = ref(0)
//筛选未更新内容
const updateTab = async (val: any) => {
  typeClass.value = val
  if (val == "class") {
    projectType.value = marketFilterData.app
    hiddenNew.value = false
    resType.value = 0
  } else if (val == "model") {
    projectType.value = marketFilterData.model
    hiddenNew.value = false
    resType.value = 1
  } else if (val == "plugin") {
    projectType.value = marketFilterData.plugin
    hiddenNew.value = false
    resType.value = 2
  } else if (val == "workflow") {
    projectType.value = marketFilterData.workflow
    hiddenNew.value = false
    resType.value = 3
  } else if (val == "other") {
    projectType.value = marketFilterData.other
    hiddenNew.value = true
  }
  loadedCount = 0;
  isLoadFinished = false;
  isLoading = false;
  items.value = [];
  await loadMore()
}
//排序筛选
const clickSort = async (val: any) => {
  sortValue.value = val
  loadedCount = 0;
  isLoadFinished = false;
  isLoading = false;
  items.value = [];
  await loadMore();
}
//筛选数据点击
const clickItem = async (val: any) => {
  if(JSON.stringify(val) == '{}'){
    heightxb.value = true
  }else{
    heightxb.value = false
  }
  loadedCount = 0;
  isLoadFinished = false;
  isLoading = false;
  items.value = [];
  filter.value = JSON.stringify(val)
  await loadMore();
}
//清除筛选
const clickClear = async () => {
  heightxb.value = true

  loadedCount = 0;
  isLoadFinished = false;
  isLoading = false;
  items.value = [];

  filter.value = ""
  await loadMore();
}
//tab删除
const CloseTab = async (val: any) => {
  if(JSON.stringify(val) == '{}'){
    heightxb.value = true
  }else{
    heightxb.value = false
  }
  loadedCount = 0;
  isLoadFinished = false;
  isLoading = false;
  items.value = [];
  filter.value = JSON.stringify(val)
  await loadMore();
}

//保存本地
const softwareList = ref<any>([]);
// 获取本地项目判断是否有更新或者有下载
ipcRenderer.invoke('plugin-list-info').then((pluginInfoList: any) => {
  console.log("市场pluginInfoList", pluginInfoList);
  // pluginInfoList.forEach((pluginCfg: any) => {
  //     console.log(pluginCfg["iconPath"]);
  //     pluginCfg.icon_path = new URL(pluginCfg["iconPath"], import.meta.url).href;
  // });
  // // 处理插件信息，例如更新界面
  // console.log('Received plugin information:', pluginInfoList);

  softwareList.value = pluginInfoList;

  // if (pluginInfoList.length <= 0) {
  //     showNoneTip.value = true;
  // } else {
  //     showNoneTip.value = false;
  // }

}).catch((error: Error) => {
  console.error('Error fetching plugin information:', error);
});
const onPluginInstall = function (event: any, pluginName: string) {
  softwareList.value.forEach((value: any) => {
    if (value.install_dir == pluginName) {
      value.InstallState = 3;
    }
  })
  console.log('on-plugin-install:', pluginName);

  const loading = ElLoading.service({
    lock: true,
    text: '安装成功',
    background: 'rgba(0, 0, 0, 0.7)',
  })

  nextTick(() => {
    // Loading should be closed asynchronously
    loading.close()
  })

  matomo.trackEvent("AI项目", "安装成功", pluginName);
}

const onProjectDownload = function (event: any, pluginName: string) {
  softwareList.value.forEach((value: any) => {
    if (value.install_dir == pluginName) {
      value.InstallState = 2;
    }
  })

  console.log('on-plugin-install:', pluginName);

  const loading = ElLoading.service({
    lock: true,
    text: '项目下载完成',
    background: 'rgba(0, 0, 0, 0.7)',
  })

  nextTick(() => {
    // Loading should be closed asynchronously
    loading.close()
  })

  matomo.trackEvent("AI项目", "下载解压成功", pluginName);
}

// 改变按钮状态
const onChangePluginBtnState = (event: any, pluginName: string, state: string) => {
  softwareList.value.forEach((value: any) => {
    if (value.install_dir == pluginName) {
      //标记启动
      if (state == "exit") {
        value.InstallState = 4;
      } else if (state == "run") {
        value.InstallState = 3;
      }
    }
  })
}
const onPluginInstallLog = function (event: any, logStr: string) {
  // console.log(logStr);
  const loading = ElLoading.service({})
  loading.setText(logStr);
}
//精度条更新
const onPluginTorrentProgress = function (event: any, progressInfoList: any) {
  if (softwareList.value.length <= 0) {
    return;
  }

  softwareList.value.forEach((value: any) => {
    let progressInfo = progressInfoList[value.install_dir];
    if (progressInfo) {
      if (progressInfo.progressType == 3) {
        value.ProgressInfo = null;
      } else {
        value.ProgressInfo = { ...progressInfo }
      }
    }

    //    console.log(progressInfo);
  })
}

onMounted(() => {
  // 监听插件安装成功
  ipcRenderer.on('on-plugin-install-log', onPluginInstallLog);

  // 监听按钮改变
  ipcRenderer.on('on-plugin-change-btn-state', onChangePluginBtnState);

  // 监听下载进度消息
  ipcRenderer.on('on-plugin-torrent-progress-message', onPluginTorrentProgress);

  // 监听ai项目下载完成
  ipcRenderer.on('on-plugin-download', onProjectDownload);

  // 监听插件安装成功
  ipcRenderer.on('on-plugin-install', onPluginInstall);

  loadMore()
});

// 在组件销毁前移除事件监听器
onBeforeUnmount(() => {
  ipcRenderer.removeListener('on-plugin-install-log', onPluginInstallLog);
  ipcRenderer.removeListener('on-plugin-install', onPluginInstall);
  ipcRenderer.removeListener('on-plugin-change-btn-state', onChangePluginBtnState);
  ipcRenderer.removeListener('on-plugin-torrent-progress-message', onPluginTorrentProgress);
  ipcRenderer.removeListener('on-plugin-download', onProjectDownload);
});

//默认图片
const imgurl = new URL("~/assets/ai_noimg.png", import.meta.url).href;

interface ExtOption {
  tag?: string | string[];
  [key: string]: any; // 允许动态键值对
}

interface SoftwareItem {
  id: number;
  plugin_name: string;
  install_dir: string;
  platforms: string;
  description: string;
  like_count: number;
  download: number;
  project_zip_size: number;
  author: string;
  user_name: string;
  price_type: number;
  price_value: number;
  version: string;
  create_time: string;
  res_type?: number;
  ext_option?:ExtOption;
  image_path: string;
  need_device?: string;
  favorite_count?: number;
}

const items = ref<SoftwareItem[]>([]); // 存放数据的数组

const showNoneTip = ref(false) //是否显示没有数据
const shownonetwork = ref(false) //是否显示没有网络

let loadedCount = 0; // 已加载的数据数量
let searchKeyword = ref(""); //搜索关键字
let isLoadFinished = false; //是否已经全部加载完成
let isLoading = false; //请求正在加载中，不重复请求
let searchInputChanged = false;

// 模拟加载更多数据的方法
const loadMore = async () => {

  if (isLoading) {
    return false;
  }

  if (isLoadFinished) {
    console.log("已经全部加载完成")
    return false;
  }
  console.log("loadMore");
  // 此处为示例，你需要根据实际情况加载更多数据
  try {
    isLoading = true;
    const newItems = await fetchMoreItems();
    if(!newItems){
      console.log('没网了')
      shownonetwork.value = true;
      isLoading = false;
      isLoadFinished = true;
      return;
    }
    console.log("newItems", newItems)
    //本地处理
    newItems.forEach((item: any) => {
      //项目名处理
      item.plugin_name = item.res_name?item.res_name:item.plugin_name;
      //描述处理
      item.description = item.short_desc ?item.short_desc:item.description;
      //文件大小处理
      item.project_zip_size = item.res_zip_size ?item.res_zip_size:item.project_zip_size;
      //图片处理
      item.image_path = item.image_path ? (window as any).Constants.uploadUrl + "/assets/market-images/" + item.image_path : imgurl;
      //配置处理
      item.need_device = item.need_device ? item.need_device.split(",") : [];
      item.favorite_count = item.favorite_count?item.favorite_count:0;
      item.like_count = item.like_count?item.like_count:0;
    });
    console.log("newItemsnew", newItems)
    isLoading = false;
    if (newItems.length === 0) {
      isLoadFinished = true;
      if (loadedCount == 0) {
        showNoneTip.value = true;
      }
      console.log("已加载完所有数据");
      return;
    }
    items.value = [...items.value, ...newItems];
    loadedCount += newItems.length;
  } catch (error) {
    isLoading = false;
    console.error('加载更多数据失败:', error);
  }
};

const props = defineProps({
    items: {
        type: Number,
        required: true,
        default: 0,
    }
});
// 模拟从服务器获取更多数据的方法
const fetchMoreItems = async () => {
  shownonetwork.value = false;
  showNoneTip.value = false;

  let url = (window as any).Constants.uploadUrl + "/users/market-list-user";
  if(resType.value != 0){ //模型，插件，工作流
    url = (window as any).Constants.uploadUrl + "/users/market-resources-list-user";
  }
  try {
    const response = await axios.get<any>(url, {
      params: { loadedCount, searchKeyword: searchKeyword.value, tk: localStorage.getItem('token'), orderType: sortValue.value, filters: filter.value,resType: resType.value,userId:props.items }
    });
    return response.data.marketData; // 返回从服务器获取的数据
  } catch (error) {
    console.error('获取更多数据失败:', error);
    return false; // 出错时返回空数组
  }
};

// 搜索
const startSearch = async () => {
  if (!searchInputChanged) {
    return;
  }
  searchInputChanged = false;

  console.log("bbbbbb")

  loadedCount = 0;
  isLoadFinished = false;
  isLoading = false;
  items.value = [];
  await loadMore();
}

// 搜索值改变
const onSearchInputChange = () => {
  searchInputChanged = true;
}
</script>
<style scoped>
.shop-page{
  width: 100%;
}
.title-name :deep(.ep-tag) {
  border-color: rgba(0, 0, 0, 0);
}

:deep(.ep-tabs__content) {
  width: 100%;
}

:deep(.ep-tabs__header) {
  margin-bottom: 10px;
}

:deep(.ep-tabs__item) {
  padding: 0 10px;
}

/* 筛选样式重写 */
.ep-checkbox {
  margin: 4px;
}

.ep-radio {
  margin: 4px;
  border-radius: 15px;
}

.ep-radio.is-bordered.ep-radio--small {
  border-radius: 15px;
}

.ep-radio.is-bordered {
  border-radius: 15px;
}

/* 单选 */
:deep(.ep-radio__input) {
  position: absolute;
  visibility: hidden;
}

:deep(.ep-radio__label) {
  padding-left: 4px;
}

/* 多选 */
:deep(.ep-checkbox__input) {
  position: absolute;
  visibility: hidden;
}

:deep(.ep-checkbox__label) {
  padding-left: 4px;
}

/* 搜索框分类搜索 */
:deep(.ep-select__wrapper) {
  min-height: 31px;
}

/* 设置筛选样式 */
.ep-form-item {
  margin-bottom: 0;
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

/* 瀑布流 */
@media (min-width: 800px) {
  .box-wrapper {
    /* column-count: 4; */
    /* column-gap: 0; */
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 10px;
    /* margin-bottom: 20vh; */
  }
}

@media (min-width: 1200px) {
  .box-wrapper {
    /* column-count: 4; */
    /* column-gap: 0; */
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
    gap: 10px;
    /* margin-bottom: 10vh; */
  }
}

@media (min-width: 1600px) {
  .box-wrapper {
    /* column-count: 4; */
    /* column-gap: 0; */
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
    gap: 10px;
    /* margin-bottom: 10vh; */
  }
}



.box-item {
  box-sizing: border-box;
  break-inside: avoid;
  /* padding: 5px; */
  position: relative;
  height: 200px;
  color: white;
}

.box-item>div {
  height: 100%;
  /* background: #4286F5; */
  background-color: var(--ep-color-primary-light-9);
  box-sizing: border-box;
  border-radius: .75rem;
  overflow: hidden;
}

.page_bady {
  padding: 0px 10px;
  height: 100%;
  overflow: hidden;
}

.mk_container {
  overflow: auto;
  height: calc(100% - 60px);
  /* 高度填满父容器，减去搜索条的高度 */
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 10px;
  /* 间距 */
  align-content: flex-start;
  /* 从顶部往下对齐 */
}

.mk_container .item {
  border-radius: 4px;
  height: 68px;
  background-color: var(--ep-color-primary-light-9);
  padding: 10px;
  align-items: start;
}

.search_bar {
  height: 50px;
  display: flex;
  align-items: center;
  /* 垂直居中 */
  justify-content: space-between;
}

.title {
  margin-right: 20px;
  /* 与搜索条之间的间距 */
}

.search_input_wrapper {
  align-items: center;
  /* 垂直居中 */
}

.search_input {
  width: 300px;
  margin-right: 10px;
}

.result-center {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, 0);
}

/* 列表 */
.software_list_item {
  width: 100%;
  /* height: 100px; */
  border-radius: 10px;
  background-color: var(--ep-color-primary-light-9);
  margin: 6px 0px;
  display: flex;
  flex-flow: row;
  align-items: center;
  /* 垂直居中 */
}

.list_icon {
  width: 75px;
  height: 75px;
  background-color: rgb(254, 197, 46);
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 50px;
  color: white;
  user-select: none;
  margin-left: 20px;
}

.software_list_item img {
  margin-left: 20px;
}

.item_desc_head {
  display: flex;
  flex-flow: row;
  align-items: center;
  /* 垂直居中 */
}

.item_desc_head h4 {
  margin: 0px;
  padding: 0px 5px 5px 0px;
}

.software_list_item .item_desc_sub {
  color: var(--ep-text-color-secondar);
  font-size: 14px;

  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-clamp: 2;
  /* 控制最多显示的行数 */
}

.software_list_item .list_item_desc {
  text-align: left;
  flex: 1;
  margin: 0px 30px 0px 10px;
  max-height: 100px;
  overflow: hidden;
}

.software_list_item .list_item_btns {
  margin-right: 20px;
}


/**滚动条的宽度*/
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-thumb {
  background-color: rgba(234, 236, 241, 0.2);
  /* 设置半透明的背景颜色 */
  border-radius: 3px;
}
</style>