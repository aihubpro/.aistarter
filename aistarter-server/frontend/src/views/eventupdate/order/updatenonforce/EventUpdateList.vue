<template>
    <div>
        <div class="m-3 p-3 bg-white">
            <a-form ref="formRef" :model="formState.updateInfo" :rules="rules">
                <a-form-item label="系统版本" prop="version">
                    <a-input v-model:value="formState.updateInfo.version" aria-placeholder="例如:3.1.2" />
                </a-form-item>
                <a-form-item label="更新内容" prop="content">
                    <a-textarea v-model:value="formState.updateInfo.content" placeholder="更新内容" :rows="30" />
                </a-form-item>
                <a-form-item label="Windows下载链接" prop="urllinkwin">
                    <a-input v-model:value="formState.updateInfo.urllinkwin"
                        placeholder="例如:https://dl.starter.top/9929175" />
                </a-form-item>
                <a-form-item label="Mac x86下载链接" prop="urllinkmac">
                    <a-input v-model:value="formState.updateInfo.urllinkmac"
                        placeholder="例如:https://dl.starter.top/9929176" />
                </a-form-item>
                <a-form-item label="Mac ARM下载链接" prop="urllinkmacarm">
                    <a-input v-model:value="formState.updateInfo.urllinkmacarm"
                        placeholder="例如:https://dl.starter.top/9929177" />
                </a-form-item>
                <a-form-item label="Linux RPM下载链接" prop="urllinklinux">
                    <a-input v-model:value="formState.updateInfo.urllinklinux"
                        placeholder="例如:https://dl.starter.top/9929178" />
                </a-form-item>
                <a-form-item label="Linux DEB下载链接" prop="urllinklinuxdeb">
                    <a-input v-model:value="formState.updateInfo.urllinklinuxdeb"
                        placeholder="例如:https://dl.starter.top/9929179" />
                </a-form-item>
                <a-form-item label="Linux APPIMAGE下载链接" prop="urllinklinuxapp">
                    <a-input v-model:value="formState.updateInfo.urllinklinuxapp"
                        placeholder="例如:https://dl.starter.top/9929180" />
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
import { getUpdateText, updateUpdateText } from './EventUpdate.api'
const { createConfirm, createMessage } = useMessage();
interface updateInfo {
    version: string;
    content: string;
    urllinkwin: string;
    urllinkmac: string;
    urllinkmacarm: string;
    urllinklinux: string;
    urllinklinuxdeb: string;
    urllinklinuxapp: string;
}
const formRef = ref();
const rules = {
    version: [
        {
            required: true,
            message: '请输入版本号',
            trigger: 'blur'
        },
        {
            pattern: /^(\d+\.){2}\d+$/,
            message: '请输入正确的版本号 例如：3.1.2',
            trigger: 'blur'
        }
    ],
    content: [
        {
            required: true,
            message: '请输入更新内容',
            trigger: 'blur'
        }
    ],
    urllinkwin: [
        {
            type: 'url',
            message: '请输入正确的Windows下载链接',
        }
    ],
    urllinkmac: [
        {
            type: 'url',
            message: '请输入正确的Mac x86下载链接',
        }
    ],
    urllinkmacarm: [
        {
            type: 'url',
            message: '请输入正确的Mac ARM下载链接',
        }
    ],
    urllinklinux: [
        {
            type: 'url',
            message: '请输入正确的Linux RPM下载链接',
        }
    ],
    urllinklinuxdeb: [
        {
            type: 'url',
            message: '请输入正确的Linux DEB下载链接',
        }
    ],
    urllinklinuxapp: [
        {
            type: 'url',
            message: '请输入正确的Linux APPIMAGE下载链接',
        }
    ]
}
const formState = reactive({
    updateInfo: {} as updateInfo
})
const getUpdate = () => {
    getUpdateText().then(res => {
        console.log(res)
        if (res.data) {
            formState.updateInfo = res.data
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
            content: '是否配置版本信息相关配置',
            onOk: async () => {
                await updateUpdateText(toRaw(formState)).then(res => {
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