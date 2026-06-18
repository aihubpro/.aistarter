<template>
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" center align-center="true" :show-close="false"
        :close-on-click-modal="false">
        <div class="w-full flex justify-center items-center flex-col">
            <!-- <h1 class="title font-size-40px" style="font-weight: 400;" v-if="isBan">{{ dialogTitle }}</h1> -->
            <div class="text-center mb-4">{{ dialogtime }}</div>
            <el-scrollbar height="100px">
                <div class="text-center">
                    {{ dialogcenter }}
                </div>
            </el-scrollbar>
        </div>
        <template #footer>
            <el-button type="denger" @click="closeWindow" plain="true">{{ t('userbandialog.confirm_button') }}</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
import { ElMessage } from 'element-plus';
import { ref, inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { ipcRenderer } = require('electron');
const { loginOut } = inject('main');
const { t } = useI18n()


const dialogVisible = ref(false)

const dialogTitle = ref(t('userbandialog.dialog_title'))
const dialogtime = ref(t('userbandialog.ban_time_prefix') + '2025-10-08 10:00:00')
const dialogcenter = ref(t('userbandialog.ban_reason'))

//关闭程序
const closeWindow = () => {
    dialogVisible.value = false;
    loginOut()
    ipcRenderer.send('window-quit')
}

defineExpose({
    openUserBanDialog(banDatas) {
        console.log('banDatas',banDatas)
        if(banDatas.status == 2){
            dialogtime.value = t('userbandialog.ban_time_prefix') + banDatas.ban_expire_time
        }else if(banDatas.status == 3){
            dialogtime.value = t('userbandialog.ban_time_prefix') + t('userbandialog.ban_time_permanent')
        }
        dialogcenter.value = banDatas.ban_reason
        dialogVisible.value = true;
    }
})
</script>

<style scoped></style>