<template>
    <div class="flex flex-wrap w-full h-full">
        <!-- 总筛选 -->
        <a-dropdown trigger="click" :hide-on-click="false" v-for="(item, index) in computedProjectTypeitemAppoint" :key="index">
            <a-button type="primary" class="w-50px h-[30px]" size="small" plain>
                筛选
            </a-button>
            <template #overlay>
                <a-menu class="w-[300px]">
                    <div class="overflow-y-auto max-h-[250px]">
                        <div class="ml-5 mr-5 mb-1 relative">
                            <div class="absolute right-0 top-0 flex cursor-pointer opacity-40 z-10"
                                @click="clearFilter">
                                <div class="mr-1 flex items-center"></div>
                                <div>清空筛选条件</div>
                            </div>
                            <a-form layout="vertical" :model="item">
                                <a-form-item v-if="computPojectModel(item,'radio')" :label="item.label" class="ml-2">
                                    <a-radio-group v-model:value="item.projectModel" size="small">
                                        <a-radio-button :value="item2.value" size="small" border
                                            v-for="(item2, index2) in item.options" :key="index2"
                                            @click.native.prevent="clickitem(item2.value, item)">
                                            {{ item2.label }}
                                        </a-radio-button>
                                    </a-radio-group>
                                </a-form-item>
                                <a-form-item v-else-if="computPojectModel(item,'checkbox')" :label="item.label">
                                    <a-checkbox-group v-model:value="item.projectModel" size="small"
                                        @change="handleSortChangeRadioCheckbox(item.id, item.projectModel)">
                                        <a-checkbox :value="item2.value" v-for="(item2, index2) in item.options"
                                            :key="index2">
                                            {{ item2.label }}
                                        </a-checkbox>
                                    </a-checkbox-group>
                                </a-form-item>
                                <a-form layout="vertical" v-for="(item2, index2) in item.options" :key="index2" v-show="item.projectModel.includes(item2.value) || item.projectModel === item2.value">
                                    <a-form-item v-if="computPojectModel(item2,'radio')" :label="item2.label" class="ml-2">
                                        <a-radio-group v-model:value="item2.projectModel" size="small">
                                            <a-radio-button :value="item3.value" size="small" border
                                                v-for="(item3, index3) in item2.options" :key="index3"
                                                @click.native.prevent="clickitem(item3.value, item2)">
                                                {{ item3.label }}
                                            </a-radio-button>
                                        </a-radio-group>
                                    </a-form-item>
                                    <a-form-item v-else-if="computPojectModel(item2,'checkbox')" :label="item2.label">
                                        <a-checkbox-group v-model:value="item2.projectModel" size="small"
                                            @change="handleSortChangeRadioCheckbox(item2.id, item2.projectModel)">
                                            <a-checkbox :value="item3.value" v-for="(item3, index3) in item2.options"
                                                :key="index3">
                                                {{ item3.label }}
                                            </a-checkbox>
                                        </a-checkbox-group>
                                    </a-form-item>
                                </a-form>
                            </a-form>
                        </div>
                    </div>
                </a-menu>
            </template>
        </a-dropdown>
        <div class="h-[40px] w-full">
            <div class="flex overflow-x-auto">
                <div v-for="(item, index) in computedProjectTypeitemAppoint" :key="index" class="flex">
                    <div v-for="(item2, index2) in item.options" :key="index2" class="flex">
                        <div v-if="computPojectModel(item,'checkbox')">
                            <a-tag closable class="m-2 ml-0" @close="handleClose(index, item2.value)"
                                v-if="item.projectModel.filter((i: any) => i == item2.value).length > 0" color="red">
                                {{ item2.label }}
                            </a-tag>
                        </div>
                        <div v-if="computPojectModel(item,'radio')">
                            <a-tag closable class="m-2 ml-0" @close="handleClose(index, item2.value)"
                                v-if="item2.value == item.projectModel" color="green">
                                {{ item2.label }}
                            </a-tag>
                        </div>
                    </div>
                    <!-- 递归渲染子菜单项的标签 -->
                    <div v-if="item.submenu && item.options.length > 0">
                        <div v-for="(subItem, subIndex) in item.options" :key="subIndex">
                            <div v-if="item.projectModel.includes(subItem.value) || item.projectModel === subItem.value">
                                <div v-for="(subItem2, subIndex2) in subItem.options" :key="subIndex2" class="flex">
                                    <div v-if="computPojectModel(subItem,'checkbox')">
                                        <a-tag closable class="m-2 ml-0" @close="handleCloseSubItem(index, subIndex,subItem2)"
                                            v-if="subItem.projectModel.filter((i: any) => i == subItem2.value).length > 0" color="red">
                                            {{ subItem2.label }}
                                        </a-tag>
                                    </div>
                                    <div v-if="computPojectModel(subItem,'radio')">
                                        <a-tag closable class="m-2 ml-0" @close="handleCloseSubItem(index, subIndex,subItem2)"
                                            v-if="subItem2.value == subItem.projectModel" color="green">
                                            {{ subItem2.label }}
                                        </a-tag>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import type { PropType } from "vue";

const props = defineProps({
    itemsAppoin: {
        type: Array as unknown as PropType<any[]>,
        required: true,
        default: [],
    },
    importData: {
        type: Object as PropType<any>,
        required: true,
        default: {}
    }
});

const computPojectModel = (item: any, type: string) => {
    return item.type == type
}

// const projectTypeitemAppoint = ref(props.itemsAppoin);

const computedProjectTypeitemAppoint = computed(() => {
    return props.itemsAppoin;
});

const emit = defineEmits(["update-active-path", "clickItem", "clickClear", "CloseTab"]);


const clearFilter = async () => {
    computedProjectTypeitemAppoint.value.forEach(item => {
        if (item.type == "radio") {
            item.projectModel = "";
        } else {
            item.projectModel = [];
        }
        if (item.submenu && item.options.length > 0) {
            item.options.forEach((subItem: any) => {
                if (subItem.type === "radio") {
                    subItem.projectModel = "";
                } else {
                    subItem.projectModel = [];
                }
            });
        }
    });
    emit("clickClear");
};

const clickitem = (e: any, item: any) => {
    console.log(e,item.projectModel)
    //单选可以取消设置
    if (e === item.projectModel) {
        item.projectModel = "";
    } else {
        item.projectModel = e;
    }
    let filter: Record<string, any> = buildFilter(computedProjectTypeitemAppoint.value);
    emit("clickItem", filter);
};

const handleSortChangeRadioCheckbox = async (id: any, val: any) => {
    console.log(id, val)
    let filter: Record<string, any> = buildFilter(computedProjectTypeitemAppoint.value)
    emit("clickItem", filter);
};

const handleClose = async (i: any, val: any) => {
    if (computedProjectTypeitemAppoint.value[i].type == "radio") {
        computedProjectTypeitemAppoint.value[i].projectModel = "";
    } else {
        computedProjectTypeitemAppoint.value[i].projectModel.splice(computedProjectTypeitemAppoint.value[i].projectModel.indexOf(val), 1);
    }
    //筛选更新的内容
    let filter: Record<string, any> = buildFilter(computedProjectTypeitemAppoint.value)
    emit("CloseTab", filter);
};

//子菜单项标签关闭
const handleCloseSubItem = async (i: any, j: any, val: any) => {
    const subItem = computedProjectTypeitemAppoint.value[i].options[j];
    if (subItem.type === "radio") {
        subItem.projectModel = "";
    } else {
        subItem.projectModel.splice(subItem.projectModel.indexOf(val), 1);
    }
    //筛选更新的内容
    let filter: Record<string, any> =buildFilter(computedProjectTypeitemAppoint.value)
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
                if (subItem.projectModel?.length > 0 && item.projectModel?.includes(subItem.value)) {
                    filter[`${subItem.value}`] = subItem.projectModel;
                }
            });
        }
    });
    return filter;
}
</script>

<style scoped>
.ant-checkbox-wrapper+.ant-checkbox-wrapper {
    margin-left: 0;
}

/* 超出省略号 */
.line-limit-length {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    line-clamp: 2;
    overflow: hidden;
    text-overflow: ellipsis;
}

/**滚动条的宽度*/
::-webkit-scrollbar {
    width: 6px;
}

::-webkit-scrollbar-thumb {
    background-color: rgba(234, 236, 241, 0.2);
    border-radius: 3px;
}
</style>