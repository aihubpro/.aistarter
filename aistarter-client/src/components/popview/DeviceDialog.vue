<template>
    <el-dialog v-model="dialogVisible" width="80%" center :show-close="true" @close="closeDialog"
        :close-on-click-modal="false">
        <template #title>
            <div>
                <div class="font-size-20px">{{ t('devicedialog.dialog_title') }}</div>
                <div class="font-size-14px color-gray-400">{{ t('devicedialog.dialog_subtitle') }}</div>
            </div>
        </template>
        <el-card class="w-full">
            <template #header>
                <div class="flex justify-start">
                    <span class="flex align-center font-size-24px">
                        <el-icon>
                            <Files />
                        </el-icon>
                    </span>
                    <div class="flex justify-center ml-2" style="align-items: end;">
                        <span>{{ t('devicedialog.my_devices') }}</span>
                    </div>
                </div>
            </template>
            <el-scrollbar max-height="16vh">
                <div class="w-full flex flex-wrap gap-1">
                    <el-card class="w-[calc(50%-0.5rem)]" v-for="(item,index) in datas" :key="index">
                        <div class="flex justify-between">
                            <div class="flex items-center">
                                <el-icon>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 986 1000" v-if="item.machine_type == 'win'"><path fill="currentColor" d="m985.875 0l-548.75 80.031v397.688h548.75zM398.469 85.688L0 143.813v333.906h398.469zM0 516.376v338.156l398.469 58.813V516.376zm437.125 0v402.688l548.75 80.938V516.377z"/></svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" v-else-if="item.machine_type == 'mac'"><path fill="currentColor" d="M16.3 0c.214 1.46-.378 2.89-1.16 3.9c-.835 1.08-2.27 1.92-3.66 1.88c-.254-1.4.398-2.83 1.19-3.8C13.539.91 15.03.1 16.3.01zm.5 6c1.59 0 3.27.874 4.47 2.38c-3.93 2.17-3.29 7.84.68 9.36c-.413.996-.919 1.95-1.51 2.85c-.982 1.51-2.37 3.39-4.08 3.41c-.706.007-1.17-.207-1.67-.438c-.579-.267-1.21-.557-2.32-.551c-1.1.005-1.74.292-2.33.556c-.512.23-.984.443-1.69.436c-1.72-.015-3.03-1.71-4.01-3.22c-2.75-4.22-3.03-9.18-1.34-11.8c1.2-1.87 3.1-2.97 4.89-2.97c.952 0 1.72.276 2.45.539c.664.239 1.3.467 2.01.467c.662 0 1.21-.208 1.8-.435c.714-.273 1.5-.573 2.65-.573z"/></svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" v-else><path fill="currentColor" d="M19.7 17.6c-.1-.2-.2-.4-.2-.6c0-.4-.2-.7-.5-1c-.1-.1-.3-.2-.4-.2c.6-1.8-.3-3.6-1.3-4.9c-.8-1.2-2-2.1-1.9-3.7c0-1.9.2-5.4-3.3-5.1c-3.6.2-2.6 3.9-2.7 5.2c0 1.1-.5 2.2-1.3 3.1c-.2.2-.4.5-.5.7c-1 1.2-1.5 2.8-1.5 4.3c-.2.2-.4.4-.5.6c-.1.1-.2.2-.2.3c-.1.1-.3.2-.5.3c-.4.1-.7.3-.9.7c-.1.3-.2.7-.1 1.1c.1.2.1.4 0 .7c-.2.4-.2.9 0 1.4c.3.4.8.5 1.5.6c.5 0 1.1.2 1.6.4c.5.3 1.1.5 1.7.5c.3 0 .7-.1 1-.2c.3-.2.5-.4.6-.7c.4 0 1-.2 1.7-.2c.6 0 1.2.2 2 .1c0 .1 0 .2.1.3c.2.5.7.9 1.3 1h.2c.8-.1 1.6-.5 2.1-1.1c.4-.4.9-.7 1.4-.9c.6-.3 1-.5 1.1-1c.1-.7-.1-1.1-.5-1.7M12.8 4.8c.6.1 1.1.6 1 1.2q0 .45-.3.9h-.1c-.2-.1-.3-.1-.4-.2c.1-.1.1-.3.2-.5c0-.4-.2-.7-.4-.7c-.3 0-.5.3-.5.7v.1c-.1-.1-.3-.1-.4-.2V6c-.1-.5.3-1.1.9-1.2m-.3 2c.1.1.3.2.4.2s.3.1.4.2c.2.1.4.2.4.5s-.3.6-.9.8c-.2.1-.3.1-.4.2c-.3.2-.6.3-1 .3c-.3 0-.6-.2-.8-.4c-.1-.1-.2-.2-.4-.3c-.1-.1-.3-.3-.4-.6c0-.1.1-.2.2-.3c.3-.2.4-.3.5-.4l.1-.1c.2-.3.6-.5 1-.5c.3.1.6.2.9.4M10.4 5c.4 0 .7.4.8 1.1v.2c-.1 0-.3.1-.4.2v-.2c0-.3-.2-.6-.4-.5c-.2 0-.3.3-.3.6c0 .2.1.3.2.4c0 0-.1.1-.2.1c-.2-.2-.4-.5-.4-.8c0-.6.3-1.1.7-1.1m-1 16.1c-.7.3-1.6.2-2.2-.2c-.6-.3-1.1-.4-1.8-.4c-.5-.1-1-.1-1.1-.3s-.1-.5.1-1q.15-.45 0-.9c-.1-.3-.1-.5 0-.8s.3-.4.6-.5s.5-.2.7-.4c.1-.1.2-.2.3-.4c.3-.4.5-.6.8-.6c.6.1 1.1 1 1.5 1.9c.2.3.4.7.7 1c.4.5.9 1.2.9 1.6c0 .5-.2.8-.5 1m4.9-2.2c0 .1 0 .1-.1.2c-1.2.9-2.8 1-4.1.3l-.6-.9c.9-.1.7-1.3-1.2-2.5c-2-1.3-.6-3.7.1-4.8c.1-.1.1 0-.3.8c-.3.6-.9 2.1-.1 3.2c0-.8.2-1.6.5-2.4c.7-1.3 1.2-2.8 1.5-4.3c.1.1.1.1.2.1c.1.1.2.2.3.2c.2.3.6.4.9.4h.1c.4 0 .8-.1 1.1-.4c.1-.1.2-.2.4-.2q.45-.15.9-.6c.4 1.3.8 2.5 1.4 3.6c.4.8.7 1.6.9 2.5c.3 0 .7.1 1 .3c.8.4 1.1.7 1 1.2H18c0-.3-.2-.6-.9-.9s-1.3-.3-1.5.4c-.1 0-.2.1-.3.1c-.8.4-.8 1.5-.9 2.6c.1.4 0 .7-.1 1.1m4.6.6c-.6.2-1.1.6-1.5 1.1c-.4.6-1.1 1-1.9.9c-.4 0-.8-.3-.9-.7c-.1-.6-.1-1.2.2-1.8c.1-.4.2-.7.3-1.1c.1-1.2.1-1.9.6-2.2c0 .5.3.8.7 1c.5 0 1-.1 1.4-.5h.2c.3 0 .5 0 .7.2s.3.5.3.7c0 .3.2.6.3.9c.5.5.5.8.5.9c-.1.2-.5.4-.9.6m-9-12c-.1 0-.1 0-.1.1c0 0 0 .1.1.1s.1.1.1.1c.3.4.8.6 1.4.7c.5-.1 1-.2 1.5-.6l.6-.3c.1 0 .1-.1.1-.1c0-.1 0-.1-.1-.1c-.2.1-.5.2-.7.3c-.4.3-.9.5-1.4.5s-.9-.3-1.2-.6c-.1 0-.2-.1-.3-.1"/></svg>
                                </el-icon>
                                <span class="ml-2">{{ item.machine_name }}</span>
                                <el-tag class="ml-2" v-if="item.machine_code==userStoreIns.userInfo.machine_code">{{ t('devicedialog.current_device') }}</el-tag>
                            </div>
                            <div class="flex">
                                <el-button type="primary" round size="small" @click="deleteDevice(item.id,item.machine_code,item.machine_name)">{{ t('devicedialog.delete_button') }}</el-button>
                            </div>
                        </div>
                    </el-card>
                </div>
            </el-scrollbar>
        </el-card>
        <template #footer>
            <el-card class="w-full flex">
                <el-row :gutter="20">
                    <el-col :span="15">
                        <div class="flex flex-col text-left">
                            <div class="text-16px font-semibold mb-2">{{ t('devicedialog.device_management_title') }}</div>
                            <div class="text-14px text-gray-600 leading-relaxed">
                                <p class="mb-1 mt-1">{{ t('devicedialog.device_management_rules.rule1') }}</p>
                                <p class="mb-1">{{ t('devicedialog.device_management_rules.rule2') }}</p>
                                <p class="mb-1">{{ t('devicedialog.device_management_rules.rule3') }}</p>
                                <p class="text-red-500 mb-0">{{ t('devicedialog.device_management_rules.rule4') }}</p>
                            </div>
                        </div>
                    </el-col>
                    <el-col :span="9">
                        <div class="flex flex-col text-left">
                            <div class="text-16px font-semibold mb-2">{{ t('devicedialog.contact_service') }}</div>
                            <div class="flex items-center gap-2">
                                <div class="flex-shrink-0">
                                    <img :src="support_img" class="w-100px h-100px" :alt="t('devicedialog.wechat_scan_alt')">
                                </div>
                                <div class="flex flex-col justify-center text-left">
                                    <div class="text-14px text-gray-600 mb-1 whitespace-nowrap overflow-hidden text-ellipsis">{{ $t('app.support_title') }}</div>
                                    <div class="text-14px text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis">{{ $t('app.support_link_title') }}</div>
                                </div>
                            </div>
                        </div>
                    </el-col>
                </el-row>
            </el-card>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue'
import { ElMessage, ElMessageBox } from "element-plus";
import axios from 'axios'
import { userStore } from '../../stores/UserStore'
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
interface DeviceInfo {
    id: string;
    machine_type: string;
    machine_name: string;
    machine_code: string;
}
function copyText(text) {
  // 创建一个临时的 textarea 元素
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed'; // 防止滚动
  textarea.style.top = '-9999px';
  document.body.appendChild(textarea);

  // 选中并复制
  textarea.select();
  document.execCommand('copy');

  // 清理
  document.body.removeChild(textarea);
  console.log(t('devicedialog.copy_log'), text);
}
const copyEmail = (email: string) => {
    copyText(email)
    ElMessage.success(t('devicedialog.copy_success'))
}

let support_img = new URL("/service_dong.png", import.meta.url).href

const { loginOut } = inject('main') as any;
const { ipcRenderer } = require('electron');

const userStoreIns = userStore();
const datas = ref<DeviceInfo[]>([])
const macCount = ref(0)

async function getList() {
    let url = (window as any).Constants.uploadUrl + "/users/get-user-device-info";
    try{
        const response = await axios.post(url,{}, {
            headers: {
                "access-token": localStorage.getItem('token')
            }
        });
        return response;
    }catch(e){
        console.log(e)
    }
}

const resetDate = async () =>{
    let projectDate = await getList()
    if(projectDate){
        if(projectDate?.data.code==200){
            // 将数据数量乘以100来测试数据量
            // const originalData = projectDate?.data.data || []
            // const multipliedData = []
            // for(let i = 0; i < 100; i++) {
            //     multipliedData.push(...originalData)
            // }
            // datas.value = multipliedData
            datas.value = projectDate?.data.data
            macCount.value = projectDate?.data.macCount
        }else{
            ElMessage.error(t('myproject.table_operate_del_error'))
        }
    }
}

// 标记是否应该在关闭时退出登录
const shouldLogoutOnClose = ref(true)

//退出登录
const closeDialog = async () =>{
    if (shouldLogoutOnClose.value) {
        // 退出登录时顺便把数据库中当前设备信息清除
        let newDeviceid = datas.value.find(item=>item.machine_code==userStoreIns.userInfo.machine_code)
        let res = await deletegetDevice(newDeviceid.id,false)
        console.log(res)
        loginOut()
    }
}

//删除设备
const deletegetDevice = async (id:string,noCount:boolean=true) =>{
    let url = (window as any).Constants.uploadUrl + "/users/delete-user-device-info";
    try{
        const response = await axios.post(url, {
            id: id,
            noCount
        }, {
            headers: {
                "access-token": localStorage.getItem('token')
            }
        });
        return response?.data
    }catch(e){
        console.log(e)
        return false
    }
}

const deleteDevice = async (id:string,machine_code:string,machine_name:string) =>{
    ElMessageBox.confirm(t('devicedialog.delete_confirm_message', { deviceName: machine_name }), t('devicedialog.delete_confirm_title'), {
        confirmButtonText: t('devicedialog.delete_confirm_button'),
        cancelButtonText: t('devicedialog.delete_cancel_button'),
        type: 'warning',
    }).then(async () => {
        let res = await deletegetDevice(id)
        if(res.code==200){
            ElMessage.success(t('devicedialog.delete_success'))
            if(datas.value.length==(macCount.value+1)){
                if(userStoreIns.userInfo.machine_code == machine_code){
                    loginOut()
                    setTimeout(()=>{
                        ipcRenderer.send('window-quit')
                    },500)
                }else{
                    shouldLogoutOnClose.value = false
                    dialogVisible.value = false
                }
            }else{
                resetDate()
            }
        }else{
            ElMessage.error(res.msg)
        }
    })
}


const dialogVisible = ref(false)

defineExpose({
    openDeviceDialog() {
        shouldLogoutOnClose.value = true; // 重置标志
        dialogVisible.value = true;
        resetDate()
    }
})
</script>

<style scoped>
body {
    overflow-x:auto;
    overflow-y:hidden;
}

.payment-option {
    position: relative;
    overflow: visible;
    /* 确保发光效果不会被裁剪 */
    padding: 0px;
    margin: 20px;
}

.payment-option.selected {
    box-shadow: 0 0 10px 2px rgba(64, 158, 255, 0.7);
    /* 发光效果 */
}

.payment-option .icon {
    cursor: pointer;
    transition: all 0.3s ease;
}

.payment-option .icon:hover {
    transform: scale(1.05);
}
</style>