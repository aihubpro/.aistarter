<template>
    <div class="flex flex-wrap w-full h-full">
        <!-- 总筛选 -->
        <a-dropdown trigger="click" :hide-on-click="false">
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
                            <a-form layout="vertical" :model="item"
                                v-for="(item, index) in computedProjectTypeitemAppoint" :key="index">
                                <a-form-item v-if="item.type == 'radio'" :label="item.label" class="ml-2">
                                    <a-radio-group v-model:value="item.projectModel" size="small">
                                        <a-radio-button :value="item2.value" size="small" border
                                            v-for="(item2, index2) in item.options" :key="index2"
                                            @click.native.prevent="clickitem(item2.value, item)">
                                            {{ item2.label }}
                                        </a-radio-button>
                                    </a-radio-group>
                                </a-form-item>
                                <a-form-item v-else-if="item.type == 'checkbox'" :label="item.label">
                                    <a-checkbox-group v-model:value="item.projectModel" size="small"
                                        @change="handleSortChangeRadioCheckbox(item.id, item.projectModel)">
                                        <a-checkbox :value="item2.value" v-for="(item2, index2) in item.options"
                                            :key="index2">
                                            {{ item2.label }}
                                        </a-checkbox>
                                    </a-checkbox-group>
                                </a-form-item>
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
                        <div v-if="item.type == 'checkbox'">
                            <a-tag closable class="m-2 ml-0" @close="handleClose(index, item2.value)"
                                v-if="item.projectModel.filter((i: any) => i == item2.value).length > 0" color="red">
                                {{ item2.label }}
                            </a-tag>
                        </div>
                        <div v-if="item.type == 'radio'">
                            <a-tag closable class="m-2 ml-0" @close="handleClose(index, item2.value)"
                                v-if="item2.value == item.projectModel" color="green">
                                {{ item2.label }}
                            </a-tag>
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

const projectTypeitemAppoint = ref(props.itemsAppoin);

const computedProjectTypeitemAppoint = computed(() => {
    const result = [...projectTypeitemAppoint.value];
    result.forEach(item => {
        if (props.importData[item.id]) {
            item.projectModel = props.importData[item.id];
        } else {
            if (item.type == "radio") {
                item.projectModel = "";
            } else {
                item.projectModel = [];
            }
        }
    });
    return result;
});

const emit = defineEmits(["update-active-path", "clickItem", "clickClear", "CloseTab"]);

const clearFilter = async () => {
    computedProjectTypeitemAppoint.value.forEach(item => {
        if (item.type == "radio") {
            item.projectModel = "";
        } else {
            item.projectModel = [];
        }
    });
    emit("clickClear");
};

const clickitem = (e: any, item: any) => {
    e === item.projectModel ? item.projectModel = "" : item.projectModel = e;
    let filter: Record<string, any> = {};
    computedProjectTypeitemAppoint.value.forEach(item => {
        if (item.projectModel != "" || item.projectModel.length > 0) {
            filter[`${item.id}`] = item.projectModel;
        }
    });
    emit("clickItem", filter);
};

const handleSortChangeRadioCheckbox = async (id: any, val: any) => {
    let filter: Record<string, any> = {};
    computedProjectTypeitemAppoint.value.forEach(item => {
        if (item.projectModel != "" || item.projectModel.length > 0) {
            filter[`${item.id}`] = item.projectModel;
        }
    });
    emit("clickItem", filter);
};

const handleClose = async (i: any, val: any) => {
    if (computedProjectTypeitemAppoint.value[i].type == "radio") {
        computedProjectTypeitemAppoint.value[i].projectModel = "";
    } else {
        computedProjectTypeitemAppoint.value[i].projectModel.splice(computedProjectTypeitemAppoint.value[i].projectModel.indexOf(val), 1);
    }
    let filter: Record<string, any> = {};
    computedProjectTypeitemAppoint.value.forEach(item => {
        if (item.projectModel != "" || item.projectModel.length > 0) {
            filter[`${item.id}`] = item.projectModel;
        }
    });
    emit("CloseTab", filter);
};
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