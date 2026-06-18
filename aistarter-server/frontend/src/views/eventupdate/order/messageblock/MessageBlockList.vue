<template>
    <div>
        <div class="m-3 p-3 bg-white">
            <div class="clearfix">
                <a-form :model="form">
                    <a-form-item label="信息屏蔽池">
                        <div>
                            <a-tag 
                                v-for="(item, index) in form.list" 
                                :key="index" 
                                closable 
                                @close="removeTag(index)"
                                style="margin-bottom: 8px; margin-right: 8px;"
                            >
                                {{ item }}
                            </a-tag>
                            <a-input
                                v-if="inputVisible"
                                ref="inputRef"
                                v-model:value="inputValue"
                                type="text"
                                size="small"
                                style="width: 78px; margin-right: 8px;"
                                @blur="handleInputConfirm"
                                @keyup.enter="handleInputConfirm"
                            />
                            <a-tag
                                v-else
                                style="background: #fff; border-style: dashed;"
                                @click="showInput"
                            >
                                <plus-outlined /> 添加标签
                            </a-tag>
                        </div>
                        <div style="margin-top: 16px;">
                            <a-space>
                                <a-button 
                                    type="primary" 
                                    size="small" 
                                    @click="showBatchImport"
                                >
                                    批量导入
                                </a-button>
                                <a-button 
                                    size="small" 
                                    @click="exportTags"
                                    :disabled="form.list.length === 0"
                                >
                                    导出JSON
                                </a-button>
                                <a-button 
                                    danger 
                                    size="small" 
                                    @click="clearAllTags"
                                    :disabled="form.list.length === 0"
                                >
                                    清空所有
                                </a-button>
                            </a-space>
                            <div v-if="batchImportVisible">
                                <a-textarea
                                    v-model:value="batchImportValue"
                                    placeholder='请输入JSON格式的标签数组，例如：["标签1", "标签2", "标签3"]'
                                    :rows="4"
                                    style="margin-bottom: 8px;"
                                />
                                <div>
                                    <a-button type="primary" size="small" @click="handleBatchImport" style="margin-right: 8px;">
                                        确认导入
                                    </a-button>
                                    <a-button size="small" @click="cancelBatchImport">
                                        取消
                                    </a-button>
                                </div>
                            </div>
                        </div>
                    </a-form-item>
                    <a-form-item label="消息开启链接">
                        <a-switch checked-children="启用" un-checked-children="停用" v-model:checked="form.messagehttp" />
                    </a-form-item>
                    <a-form-item label="评论开启链接">
                        <a-switch checked-children="启用" un-checked-children="停用" v-model:checked="form.commenthttp" />
                    </a-form-item>
                    <a-form-item>
                        <a-button type="primary" @click="onSubmit">更新</a-button>
                        <a-button style="margin-left: 10px" @click="getInfodata()">取消</a-button>
                    </a-form-item>
                </a-form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { PlusOutlined, UploadOutlined } from '@ant-design/icons-vue';
import { ref, onMounted, reactive, toRaw, nextTick, onBeforeMount } from 'vue';
import { getInfo, updateInfo } from './MessageBlock.api';
import { message } from 'ant-design-vue';

interface FormState {
    list: string[];
    messagehttp: boolean;
    commenthttp: boolean;
}

const form = reactive<FormState>({
    list: [],
    messagehttp: false,
    commenthttp: false
})

//更新数据
const onSubmit = () => {
    updateInfo(form).then(res => {
        message.success('更新成功')
    })
};

// 添加标签相关的响应式变量
const inputVisible = ref(false);
const inputValue = ref('');
const inputRef = ref();

// 批量导入相关的响应式变量
const batchImportVisible = ref(false);
const batchImportValue = ref('');

// 删除标签
const removeTag = (index: number) => {
    form.list.splice(index, 1);
};

// 显示输入框
const showInput = () => {
    inputVisible.value = true;
    nextTick(() => {
        inputRef.value?.focus();
    });
};

// 确认添加标签
const handleInputConfirm = () => {
    if (inputValue.value && form.list.indexOf(inputValue.value) === -1) {
        form.list.push(inputValue.value);
    }
    inputVisible.value = false;
    inputValue.value = '';
};

// 显示批量导入
const showBatchImport = () => {
    batchImportVisible.value = true;
};

// 取消批量导入
const cancelBatchImport = () => {
    batchImportVisible.value = false;
    batchImportValue.value = '';
};

// 处理批量导入
const handleBatchImport = () => {
    try {
        const importData = JSON.parse(batchImportValue.value);
        if (Array.isArray(importData)) {
            importData.forEach(item => {
                if (typeof item === 'string' && item.trim() && form.list.indexOf(item.trim()) === -1) {
                    form.list.push(item.trim());
                }
            });
            message.success(`成功导入 ${importData.length} 个标签`);
            cancelBatchImport();
        } else {
            message.error('请输入有效的JSON数组格式');
        }
    } catch (error) {
        message.error('JSON格式错误，请检查输入格式');
    }
};

// 清空所有标签
const clearAllTags = () => {
    form.list = [];
    message.success('已清空所有标签');
};

// 导出当前标签为JSON
const exportTags = () => {
    const jsonStr = JSON.stringify(form.list, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
        message.success('标签JSON已复制到剪贴板');
    }).catch(() => {
        message.error('复制失败，请手动复制');
        console.log('导出的JSON:', jsonStr);
    });
};


const getInfodata = ()=>{
    getInfo().then(res => {
        console.log(res);
        // 假设 res.data 是从后端获取的 banner 信息数组
        if(res.data){
            form.list = res.data.list
            form.messagehttp = res.data.messagehttp
            form.commenthttp = res.data.commenthttp
        }
    });
}

onMounted(() => {
    getInfodata()
});
</script>

<style scoped>
/* you can make up upload button and sample style by using stylesheets */
.ant-upload-select-picture-card i {
    font-size: 32px;
    color: #999;
}

.ant-upload-select-picture-card .ant-upload-text {
    margin-top: 8px;
    color: #666;
}

.w-24 {
    width: 6rem;
}

.h-24 {
    height: 6rem;
}

.object-cover {
    object-fit: cover;
}

.mb-2 {
    margin-bottom: 0.5rem;
}

.mt-2 {
    margin-top: 0.5rem;
}
</style>