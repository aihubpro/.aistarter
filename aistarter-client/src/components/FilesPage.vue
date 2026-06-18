<template>
  <div class="page_bady">
    <el-scrollbar>
      <div class="file_block relative">
        <!-- 搜索框 -->
        <el-affix target=".file_block" :offset="40" v-if="fileDirCfg.length>7" class="absolute right-0">
          <div class="flex justify-end h-full">
            <div class="w-[300px] m-2" style="background-color: var(--ep-bg-color);">
              <el-autocomplete v-model="state1" :fetch-suggestions="querySearch" clearable :placeholder="$t('filelist.directory_search')"
                @select="handleSelect" >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-autocomplete>
            </div>
          </div>
        </el-affix>
        <!-- 遍历文件夹分类 -->
        <template v-for="folderCategory in fileDirCfg">
          <div :id="folderCategory.className" class="pb-2 pt-3 font-size-18px text-left">
            <div>{{ folderCategory.title }}</div>
            <div class="pt-1 font-size-12px text-left" v-if="fileDirCfg[0].className == folderCategory.className">
              Project Directory
            </div>
          </div>
          <el-row class="file_row" :gutter="10">
            <!-- 遍历文件夹信息 -->
            <template v-for="(folderInfo, index) in folderCategory.dirList">
              <el-col :span="6">
                <div class="grid-content" @click="onFolderClicked(folderInfo.dirPath)">
                  <!-- 使用动态组件来渲染不同的图标，这里假设图标名称与组件名一致 -->
                  <component :is="folderInfo.icon" style="width: 26px; height: 26px"></component>
                  <div class="folder_info ellipsis">
                    <div class="ellipsis">{{ folderInfo.viewName }}</div>
                    <span class="ellipsis">{{ getLastPath(folderInfo.viewPath)||'/' }}</span>
                  </div>
                </div>
              </el-col>
            </template>
          </el-row>
        </template>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
const { ipcRenderer } = require('electron');
const path = require('path');
//  import {
//     House,
//     Files,
//     Setting,
//     Link,
//   } from "@element-plus/icons-vue";

//  let isHovered = ref(false)
interface RestaurantItem {
  value: string
  link: string
}
const state1 = ref('')
const restaurants = ref<RestaurantItem[]>([])
const querySearch = (queryString: string, cb: any) => {
  const results = queryString
    ? restaurants.value.filter(createFilter(queryString))
    : restaurants.value
  // call callback function to return suggestions
  cb(results)
}
const createFilter = (queryString: string) => {
  return (restaurant: RestaurantItem) => {
    return (
      restaurant.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0
    )
  }
}
const handleSelect = (item: RestaurantItem) => {
  console.log(item)
  const section = document.getElementById(item.link);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
  }
}


//路径取末尾
const getLastPath = (pathStr: string) => {
  const pathArray = path.sep === '\\' ? pathStr.split('\\') : pathStr.split('/');
  return pathArray[pathArray.length - 1];
}

let fileDirCfg: any = ref([]);
console.log('fileDirCfg', fileDirCfg)

onMounted(async () => {
  let dirList = await ipcRenderer.invoke('dir-list-info')
  if(dirList){
    console.log(dirList)
    fileDirCfg.value = dirList;
    restaurants.value = dirList.map((item: any) => ({
      value: item.title,
      link: item.className
    }))
  }
})

//  const handleMouseOver = () => {
//   // 鼠标滑过时的处理逻辑，可以修改样式或执行其他操作
//   isHovered.value = true;
//   console.log('Mouse over');
// };

const onFolderClicked = (dirPath: string) => {
  // 鼠标移出时的处理逻辑，可以还原样式或执行其他操作
  console.log('onFolderClicked');
  console.log(dirPath);
  ipcRenderer.send('open-to-dir', dirPath);

};

</script>

<style scoped>
.line-limit-length {
  width: 100%;
  display: -webkit-box;
  /* 设置为WebKit内核的弹性盒子模型 */
  -webkit-box-orient: vertical;
  /* 垂直排列 */
  line-clamp: 1;
  /* 限制显示两行 */
  overflow: hidden;
  /* 隐藏超出范围的内容 */
  text-overflow: ellipsis;
  /* 使用省略号 */
}

.page_bady {
  padding: 0px 10px;
  display: flex;
  flex-flow: column;
  height: 100%;
  overflow: hidden;
}

.file_block {
  /* margin-bottom: 10px; */
  flex: 1;
  overflow: hidden;
  padding-right: 0;
  padding-bottom: 20px;
}

.file_block h4 {
  font-size: 18px;
  padding: 0px;
  margin: 10px 0px;
  text-align: left;
}

.file_row {
  margin: 0px;
}

.grid-content {
  border-radius: 4px;
  height: 68px;
  background-color: var(--ep-color-primary-light-9);

  display: flex;
  flex-flow: row;
  align-items: center;
  /* 垂直居中 */

  margin: 6px 0px 6px 6px;

  padding-left: 30px;
}

.grid-content:hover {
  background-color: var(--ep-color-primary-light-7);
  cursor: pointer;
}

/* .grid-content:hover {
  background-color: var(--ep-menu-item-hover-fill);
} */

.folder_info {
  text-align: left;
  padding-left: 16px;
}

.folder_info span {
  font-size: 11px;
  /* color: var(); */
}
</style>
