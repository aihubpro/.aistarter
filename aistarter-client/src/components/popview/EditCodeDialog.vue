<template>
    <el-dialog
      v-model="dialogVisible"
      width="80%"
      center
      class="edit-code-dialog"
      :fullscreen="fullscreens"
      :show-close="false"
    >
        <template #header>
            <div class="flex">
                <div class="flex-1 flex items-center justify-center" style="padding-left: calc(var(--ep-dialog-padding-primary) + var(--ep-message-close-size, 16px));">
                    <div>{{ $t('homeproject.project_share_editcode') }}</div>
                </div>
                <div>
                    <el-button type="text" @click="fullscreens = !fullscreens" :icon="FullScreen"></el-button>
                    <el-button type="text" @click="dialogVisible = false" :icon="Close"></el-button>
                </div>
            </div>
        </template>
        <el-scrollbar :height="fullscreens ? '80vh' : '58vh'">
            <codemirror v-model="code" :extensions="extensions" />
        </el-scrollbar>
        <template #footer>
            <el-button type="primary" @click="clickSave">{{ $t('homeproject.project_share_editcode_save') }}</el-button>
        </template>
    </el-dialog>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { Codemirror } from "vue-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap } from "@codemirror/view";
const { ipcRenderer } = require('electron');
import { ElMessage,ElLoading } from "element-plus";
import {
    Close,
    FullScreen
} from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

//开关全屏
const fullscreens = ref(false)

const dialogVisible = ref(false)
const projectName = ref('')

const saveKeymap = keymap.of([
    { key: "ctrl-s", run: () => handleSave(), preventDefault: true }
]);

const code = ref("");
const extensions = [javascript(),oneDark,saveKeymap];

async function handleSave() {
    // 在这里处理保存逻辑
    
    let reponse = await ipcRenderer.invoke('project-save-script', projectName.value, code.value,'main.js')
    if(reponse){
        ElMessage.success(t('homeproject.project_share_editcode_save_ok'));
        await ipcRenderer.invoke('project-delete-plugin-instance',projectName.value)
        await ipcRenderer.invoke('plugin-list-info')
        return true
    }else{
        ElMessage.error(t('homeproject.project_share_editcode_save_error'))
        return false
    }
}

function clickSave(){
    handleSave()
    dialogVisible.value = false
}

async function openEditCode(pluginName: string){
    dialogVisible.value = true;
    projectName.value = pluginName
    let mainJsData = await ipcRenderer.invoke('project-get-plugin-info', pluginName);
    if(mainJsData.mainJs){
        code.value = mainJsData.mainJs
    }
}

defineExpose({
    openEditCode
})
</script>
<style scoped>
</style>