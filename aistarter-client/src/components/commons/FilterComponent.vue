<template>
    <!-- 筛选 -->
    <div class="relative w-full">
        <!-- 更多内容 -->
        <slot></slot>
        <!-- 时间筛选 -->
        <el-select v-model="sortValue" placeholder="Select" size="small" @change="handleSortChange"
            class="w-[100px] absolute right-70px top-2.5px z-10">
            <el-option v-for="item in sortItems" :key="item.id" :label="$t(item.lanKey) ? $t(item.lanKey) : item.label"
                :value="item.id" />
        </el-select>
        <!-- 总筛选 -->
        <el-dropdown trigger="click" class="absolute right-10px top-2.5px z-10" :hide-on-click="false">
            <el-button type="primary" class="w-50px h-[30px]" size="small" plain>
                {{ $t('app.market_filter') }}
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
                <el-dropdown-menu class="w-[400px]">
                    <el-scrollbar max-height="250px">
                        <div class="ml-5 mr-5 mb-1 relative">
                            <!-- 筛选中的筛选 -->
                            <!-- <el-select v-model="sortValues" size="small" class="w-[100px]">
                <el-option v-for="(item, index) in projectTypeitems2" :key="index" :label="item.value" :value="index" />
              </el-select> -->
                            <div class="absolute right-0 top-0 flex cursor-pointer opacity-40" @click="clearFilter">
                                <div class="mr-1 flex items-center">
                                    <el-icon class="font-size-14px">
                                        <RefreshLeft />
                                    </el-icon>
                                </div>
                                <div>{{ $t('app.market_filter_reset') }}</div>
                            </div>
                            <div class="mt-2" v-for="(item, index) in projectTypeitemAppoint" :key="index">
                                <div class="screen-name ml-2">
                                    {{ $t(item.lanKey) ? $t(item.lanKey) : item.label }}
                                </div>
                                <div>
                                    <el-radio-group v-model="item.projectModel" size="small"
                                        v-if="computPojectModel(item, 'radio')">
                                        <el-radio :value="item2.value" size="small" border
                                            v-for="(item2, index2) in item.options" :key="index2"
                                            @click.native.prevent="clickitem(item2.value, item)" v-show="isMac()?!item2.hidden:true">
                                            {{ isMac()?item2.label2?item2.label2:$t(item2.lanKey):$t(item2.lanKey) ? $t(item2.lanKey) : item2.label }}
                                        </el-radio>
                                    </el-radio-group>
                                    <el-checkbox-group v-model="item.projectModel" size="small"
                                        v-if="computPojectModel(item, 'checkbox')"
                                        @change="handleSortChangeRadioCheckbox(item.id, item.projectModel)">
                                        <el-checkbox :label="isMac()?item2.label2?item2.label2:$t(item2.lanKey):$t(item2.lanKey) ? $t(item2.lanKey) : item2.label"

                                            :value="item2.value" border size="small"
                                            v-for="(item2, index2) in item.options" :key="index2" v-show="isMac()?!item2.hidden:true"/>
                                    </el-checkbox-group>
                                    <div v-if="item.submenu && item.options.length > 0">
                                        <div v-for="(subItem, subIndex) in item.options" :key="subIndex">
                                            <div class="screen-name ml-2" v-if="item.projectModel.includes(subItem.value) || item.projectModel === subItem.value">
                                                {{ $t(subItem.lanKey) ? $t(subItem.lanKey) : subItem.label }}
                                            </div>
                                            <div v-if="item.projectModel.includes(subItem.value) || item.projectModel === subItem.value">
                                                <el-radio-group v-model="subItem.projectModel" size="small" v-if="computPojectModel(subItem, 'radio')">
                                                    <el-radio :value="subItem2.value" size="small" border
                                                        v-for="(subItem2, subIndex2) in subItem.options" :key="subIndex2"
                                                        @click.native.prevent="clickitem(subItem2.value, subItem)">
                                                        {{ $t(subItem2.lanKey) ? $t(subItem2.lanKey) : subItem2.label }}
                                                    </el-radio>
                                                </el-radio-group>
                                                <el-checkbox-group v-model="subItem.projectModel" size="small" v-if="computPojectModel(subItem, 'checkbox')"
                                                @change="handleSortChangeRadioCheckbox(subItem.id, subItem.projectModel)">
                                                <el-checkbox :label="$t(subItem2.lanKey) ? $t(subItem2.lanKey) : subItem2.label" :value="subItem2.value" border size="small"
                                                    v-for="(subItem2, subIndex2) in subItem.options" :key="subIndex2" />
                                                </el-checkbox-group>
                                                <div class="ml-2 text-#999" v-if="subItem.options.length == 0">
                                                    {{ $t(subItem.lanKey) ? $t(subItem.lanKey) : subItem.label }}暂时没有数据
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="ml-2 text-#999" v-if="item.options.length == 0">
                                        {{ $t(item.lanKey) ? $t(item.lanKey) : item.label }}暂时没有数据
                                    </div>
                                </div>
                            </div>
                        </div>
                    </el-scrollbar>
                </el-dropdown-menu>
            </template>
        </el-dropdown>
        <!-- 筛选项 -->
        <el-tabs v-model="editableTabsValue" @tab-change="handleTabClick">
            <el-tab-pane :label="$t(item.lanKey) ? $t(item.lanKey) : item.label" :name="item.id"
                v-for="(item, index) in projectTypeitem" :key="index" class="flex">
                <el-scrollbar>
                    <div class="flex">
                        <div v-for="(item, index) in projectTypeitemAppoint" :key="index" class="flex">
                            <div v-for="(item2, index2) in item.options" :key="index2" class="flex">
                                <div v-if="computPojectModel(item, 'checkbox')">
                                    <el-tag closable class="m-2 ml-0" @close="handleClose(index, item2.value)"
                                        v-if="item.projectModel.filter((i: any) => i == item2.value).length > 0"
                                        type="info">
                                        {{ isMac()?item2.label2?item2.label2:$t(item2.lanKey):$t(item2.lanKey) ? $t(item2.lanKey) : item2.label }}

                                    </el-tag>
                                </div>
                                <div v-if="computPojectModel(item, 'radio')">
                                    <el-tag closable class="m-2 ml-0" @close="handleClose(index, item2.value)"
                                        v-if="item2.value == item.projectModel" type="primary">
                                        {{ isMac()?item2.label2?item2.label2:$t(item2.lanKey):$t(item2.lanKey) ? $t(item2.lanKey) : item2.label }}
                                    </el-tag>
                                </div>
                            </div>
                            <!-- 递归渲染子菜单项的标签 -->
                            <div v-if="item.submenu && item.options.length > 0" class="flex flex-wrap">
                                <div v-for="(subItem, subIndex) in item.options" :key="subIndex" class="flex flex-wrap">
                                    <div v-if="item.projectModel.includes(subItem.value) || item.projectModel === subItem.value" class="flex">
                                        <div v-for="(subItem2, subIndex2) in subItem.options" :key="subIndex2" class="flex">
                                            <div v-if="computPojectModel(subItem, 'checkbox')">
                                                <el-tag closable class="m-2 ml-0" @close="handleCloseSubItem(index, subIndex, subItem2.value)"
                                                    v-if="Array.isArray(subItem.projectModel) && subItem.projectModel.filter((i: any) => i == subItem2.value).length > 0"
                                                    type="info">
                                                    {{ $t(subItem2.lanKey) ? $t(subItem2.lanKey) : subItem2.label }}
                                                </el-tag>
                                            </div>
                                            <div v-if="computPojectModel(subItem, 'radio')">
                                                <el-tag closable class="m-2 ml-0" @close="handleCloseSubItem(index, subIndex, subItem2.value)"
                                                    v-if="subItem2.value == subItem.projectModel" type="primary">
                                                    {{ $t(subItem2.lanKey) ? $t(subItem2.lanKey) : subItem2.label }}
                                                </el-tag>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </el-scrollbar>
            </el-tab-pane>
        </el-tabs>
    </div>
</template>
<style scoped>
.title-name :deep(.ep-tag) {
    border-color: rgba(0, 0, 0, 0);
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
        grid-template-columns: 1fr 1fr 1fr;
        gap: 10px;
        /* margin-bottom: 20vh; */
    }
}

@media (min-width: 1200px) {
    .box-wrapper {
        /* column-count: 4; */
        /* column-gap: 0; */
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr;
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
<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { PropType } from "vue";
const props = defineProps({
    items: {
        type: Array as unknown as PropType<any[]>,
        required: true,
        default: [],
    },
    itemsAppoin: {
        type: Array as unknown as PropType<any[]>,
        required: true,
        default: [],
    },
    sortItems: {
        type: Array as unknown as PropType<any[]>,
        required: true,
        default: [],
    },
    editableTabsValue: {
        type: String as unknown as PropType<string>,
        required: true,
        default: "class",
    }
});

//判断系统
const isMac = () => {
  return process.platform == 'darwin';
};


const computPojectModel = (item: any, type: string) => {
    return item.shoptype?item.shoptype == type:item.type == type
}

const clickitem = (e: any, item: any) => {
    console.log(e)
    //单选可以取消设置
    if (e === item.projectModel) {
        item.projectModel = "";
    } else {
        item.projectModel = e;
    }
    let filter: Record<string, any> = buildFilter(projectTypeitemAppoint.value);
    emit("clickItem", filter)
}

const projectTypeitem = ref(props.items)
const projectTypeitemAppoint = ref(props.itemsAppoin)

watch(() => props.itemsAppoin, (newValue) => {
    projectTypeitemAppoint.value = newValue
}, { immediate: true, deep: true })


const emit = defineEmits(["update-active-path", "clickItem", "clickSort", "updateTab", "clickClear", "CloseTab"]);

//筛选类型
const editableTabsValue = computed(() => props.editableTabsValue)

//筛选未更新内容
const handleTabClick = (val: any) => {
    // console.log(val)
    emit("updateTab", val)
}
//清除筛选
const clearFilter = async () => {
    projectTypeitemAppoint.value.forEach(item => {
        if (item.shoptype?item.shoptype =="radio":item.type == "radio") {
            item.projectModel = ""
        } else {
            item.projectModel = []
        }
    })
    emit("clickClear")
}

const handleSortChangeRadioCheckbox = async (id: any, val: any) => {
    console.log(id, val)
    let filter: Record<string, any> = buildFilter(projectTypeitemAppoint.value)
    emit("clickItem", filter)
}

const handleSortChange = async () => {
    emit("clickSort", sortValue.value)
}
//排序顺序
const sortValue = ref('1')


//标签关闭
const handleClose = async (i: any, val: any) => {
    console.log(i, val)
    if (projectTypeitemAppoint.value[i].type == "radio") {
        projectTypeitemAppoint.value[i].projectModel = ""
    } else {
        projectTypeitemAppoint.value[i].projectModel.splice(projectTypeitemAppoint.value[i].projectModel.indexOf(val), 1);
    }
    //筛选更新的内容
    let filter: Record<string, any> = buildFilter(projectTypeitemAppoint.value)
    emit("CloseTab", filter)
}
//子菜单项标签关闭
const handleCloseSubItem = async (i: any, j: any, val: any) => {
    const subItem = projectTypeitemAppoint.value[i].options[j];
    if (subItem.shoptype?subItem.shoptype === "radio":subItem.type === "radio") {
        subItem.projectModel = "";
    } else {
        subItem.projectModel.splice(subItem.projectModel.indexOf(val), 1);
    }
    //筛选更新的内容
    let filter: Record<string, any> =buildFilter(projectTypeitemAppoint.value)
    emit("CloseTab", filter);
}
//递归构建筛选结果
const buildFilter = (items: any[]) => {
    let filter: Record<string, any> = {};
    items.forEach((item: any) => {
        if (item.projectModel !== "" && item.projectModel.length > 0) {
            filter[`${item.id}`] = item.projectModel;
        }
        if (item.submenu && item.options.length > 0) {
            item.options.forEach((subItem: any) => {
                if (subItem.projectModel !== "" && subItem.projectModel.length > 0 && item.projectModel == subItem.value) {
                    filter[`${subItem.value}`] = subItem.projectModel;
                }
            });
        }
    });
    return filter;
}
</script>