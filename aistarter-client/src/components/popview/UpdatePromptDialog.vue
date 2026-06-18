<template>
    <el-dialog v-model="dialogVisible" :title="$t('versionupd.version_upd_title')" width="600px" center :align-center="true"
        :show-close="closeable" :close-on-click-modal="false">
        <el-scrollbar height="300px">
            <div class="">
                <div class="update-content text-#f00 line-height-1.5em mb-2">
                    {{$t('versionupd.version_upd_tis')}}
                </div>
                <el-input v-model="dialogContent" type="textarea" placeholder="Please input" :rows="11.9"
                    :readonly="true" resize="none" />
            </div>
        </el-scrollbar>
        <template #footer>
            <el-button type="danger" @click="confirmUpdate">{{$t('versionupd.version_upd_button')}}</el-button>
            <!-- <el-button @click="onClose" size="small" class="update-btn" text>下次更新</el-button> -->
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue'
import { ElMessage } from "element-plus";
import axios from 'axios'
import {appInfoStore} from '../../stores/AppInfoStore'
const appInfoStoreIns = appInfoStore()
const dialogVisible = ref(false)

let dialogContent = ref('')
const urllink = ref('')

//跳转立即更新
const confirmUpdate = () => {
    window.open(urllink.value, '_blank')
}

//判断是否显示关闭按钮
const closeable = ref(false)
//关闭对话框
const onClose = () => {
    dialogVisible.value = false
}

defineExpose({
    openUpdatePrompt() {
        dialogVisible.value = true
        closeable.value = appInfoStoreIns.updateInfo.version == 'update'
        dialogContent.value = appInfoStoreIns.updateInfo.content
        urllink.value = appInfoStoreIns.updateInfo.urllink
    }
})
</script>

<style scoped>
.update-btn {
    position: absolute;
    right: 10px;
    bottom: 20px;
    float: right;
    opacity: 0.3;
}
</style>