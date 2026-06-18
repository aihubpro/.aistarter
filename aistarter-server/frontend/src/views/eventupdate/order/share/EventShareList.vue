<template>
    <div>
        <div class="m-3 p-3 bg-white">
            <a-form ref="formRef" :model="formState.shareInfo" :rules="rules">
                <a-form-item label="下载链接" prop="downloadUrl">
                    <a-input v-model:value="formState.shareInfo.downloadUrl" aria-placeholder="请输下载链接" />
                </a-form-item>
                <a-form-item>
                    <a-button type="primary" @click="onSubmit">更新</a-button>
                    <a-button style="margin-left: 10px" @click="getUpdate()">取消</a-button>
                </a-form-item>
            </a-form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, toRaw, onMounted } from 'vue';
import { useMessage } from '/@/hooks/web/useMessage'
import { getShareList,updateShareText } from './EventShare.api'
const { createConfirm, createMessage } = useMessage();
interface shareInfo {
    downloadUrl: string;
}
const formRef = ref();
const rules = {}
const formState = reactive({
    shareInfo: {} as shareInfo
})
const getUpdate = () => {
    getShareList().then(res => {
        console.log(res)
        if (res.data.shareInfo) {
            formState.shareInfo = res.data.shareInfo
        }
    })
}
onMounted(() => {
    getUpdate()
})
const onSubmit = async () => {
    try{
        await formRef.value.validate();
        console.log('submit!', toRaw(formState));
        createConfirm({
            iconType: 'warning',
            title: '警告',
            content: '是否更改分享界面相关配置',
            onOk: async () => {
                await updateShareText(toRaw(formState)).then(res => {
                    console.log(res);
                    createMessage.success('更新成功');
                })
            },
        })
    }catch(error:any){
        createMessage.success('更新失败:'+error.errorFields[0].errors[0]);
    }
};
</script>

<style scoped></style>