<template>
    <el-card>
        <template #header>
            <div class="flex justify-start">
                <span class="flex align-center font-size-24px">
                    <el-icon><ticket /></el-icon>
                </span>
                <div class="flex justify-center ml-2" style="align-items: end;">
                    <span style="font-weight: bold;">{{ $t('myinvite.my_invite_code') }}</span>
                </div>
            </div>
        </template>
        <!-- 内容 -->
        <div class="p-4 rounded-lg shadow-lg">
            <!-- 我的邀请码 -->
            <div v-if="myInviteCode" class="invite-code-display">
                <h1 class="color-#409EFF font-size-60px p-0 m-0 invite-code-selectable" @click="copyInviteCode">{{myInviteCode}}</h1>
                <p class="text-sm text-gray-500">
                    {{ $t('myinvite.share_invite_description') }}<el-link @click="copyInviteCodeUrl" v-if="!globalHide">{{ $t('myinvite.copy_link') }}</el-link>
                </p>
            </div>
            <div v-else class="no-invite-code">
                <div class="flex flex-col items-center text-center">
                    <el-button class="font-size-20px" @click="showCustomInviteDialog" type="primary" size="large" text>{{ $t('myinvite.custom_invite_code') }}</el-button>

                    <div>
                        <el-button @click="generateInviteCode" type="default" size="small" text>{{ $t('myinvite.generate_invite_code') }}</el-button>
                    </div>
                </div>
            </div>
        </div>
    </el-card>
    <el-card class="mt-2">
        <!-- 内容 -->
        <div class="invite-content">
            <!-- 我的邀请码 -->
            <el-row :gutter="20">
                <el-col :span="12">
                    <el-card shadow="hover">
                        <div class="text-center h-50px">
                            <div v-if="parentInviteCode" class="parent-code-display">
                                <div class="color-#409EFF font-size-26px p-0 m-0" style="font-weight:900;">{{ parentInviteCode }}</div>
                                <p class="text-sm text-gray-500 mt-2">{{ $t('myinvite.parent_bound_cannot_unbind') }}</p>
                            </div>
                            <div v-else class="bind-parent-code">
                                <el-input v-model="inputParentCode" :placeholder="$t('myinvite.bind_inviter_placeholder')" maxlength="20" show-word-limit>
                                    <template #append>
                                        <el-button @click="bindParentCode" type="warning" size="large" :disabled="!inputParentCode.trim()">{{ $t('myinvite.bind_button') }}</el-button>
                                    </template>
                                </el-input>
                                <p class="text-sm text-gray-500 mt-2">{{ $t('myinvite.bind_warning') }}</p>
                            </div>
                        </div>
                    </el-card>
                </el-col>
                <el-col :span="12">
                    <el-card>
                        <!-- 邀请人数量统计 -->
                        <div class="invite-stats-row h-50px">
                            <div class="stat-item">
                                <div class="stat-number">{{ inviteData.totalInvites }}</div>
                                <div class="stat-label">{{ $t('myinvite.my_invited_count') }}</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">¥{{ inviteData.totalEarnings }}</div>
                                <div class="stat-label">{{ $t('myinvite.promotion_earnings') }}</div>
                            </div>
                        </div>
                    </el-card>
                </el-col>
            </el-row>
        </div>
    </el-card>
    <el-card class="mt-5">
        <template #header>
            <div class="flex justify-start">
                <span class="flex align-center font-size-24px">
                    <el-icon>
                        <Memo />
                    </el-icon>
                </span>
                <div class="flex justify-center ml-2" style="align-items: end;">
                    <span>{{ $t('myinvite.promotion_commission') }}</span>
                </div>
            </div>
        </template>
        <!-- 内容 -->
        <el-descriptions>
            <el-descriptions-item :label="$t('mydiscounts.time_label')">
                <el-date-picker v-model="starttime" type="date" :placeholder="$t('mydiscounts.date_placeholder')" size="default" @change="onDateChange" :disabled-date="disabledDate"/>
                <el-date-picker v-model="endtime" type="date" :placeholder="$t('mydiscounts.date_placeholder')" size="default" class="ml-4" @change="onDateChange" :disabled-date="disabledDate"/>
            </el-descriptions-item>
        </el-descriptions>
        <template #footer>
            <!-- 内容 -->
            <el-table :data="inviteData?.list" stripe max-height="400px">
                <el-table-column prop="time" :label="$t('myincome.table_date')" width="180" align="center"/>
                <el-table-column prop="total" :label="$t('myincome.table_total')" align="center"/>
                <el-table-column prop="usertotal" :label="$t('myinvite.order_count')" align="center"/>
            </el-table>
        </template>
    </el-card>
</template>

<script setup lang="ts">
import { onMounted, ref,inject } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import toolutils from "../../toolutils"
import axios from 'axios'
import { useI18n } from 'vue-i18n'
const {globalHide} = inject('main');

const { t } = useI18n()

// 邀请码相关数据
const myInviteCode = ref('')
const parentInviteCode = ref('')
const inputParentCode = ref('')
const customInviteCode = ref('')

interface InviteData {
    list: InviteDataItem[]
    totalInvites: number
    totalEarnings: string
}
interface InviteDataItem {
    time: string
    total: number
    usertotal: number
}
const inviteData = ref([] as InviteData)
const disabledDate = (date: Date) => {
    const now = new Date();
    const maxDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    return date < oneYearAgo || date > maxDate;
};
function onDateChange() {
    if (endtime.value) {
        endtime.value = toolutils.formatDate(new Date(endtime.value))
    }
    if (starttime.value) {
        starttime.value = toolutils.formatDate(new Date(starttime.value))
    }
    // 重新获取数据
    getInviteInfo()
}

const starttime = ref('')
const endtime = ref('')

// 生成邀请码
const generateInviteCode = async () => {
    try {  
        // 实际API调用
        const url = (window as any).Constants.uploadUrl + '/users/set-invite-code'
        const response = await axios.post(url, {}, {
            headers: {
                'access-token': localStorage.getItem('token')
            }
        })
        if (response.data.code === 200) {
            myInviteCode.value = response.data.data.inviteCode
            ElMessage.success(t('myinvite.invite_code_generated'))
        } else {
            ElMessage.error(response.data.msg || t('myinvite.generate_failed'))
        }
    } catch (error) {
        console.error('生成邀请码失败:', error)
        ElMessage.error(t('myinvite.generate_failed_retry'))
    }
}

// 显示自定义邀请码弹窗
const showCustomInviteDialog = async () => {
    try {
        const { value } = await ElMessageBox.prompt(
            t('myinvite.custom_invite_prompt'),
            t('myinvite.custom_invite_title'),
            {
                confirmButtonText: t('myinvite.confirm'),
                cancelButtonText: t('myinvite.cancel'),
                inputPattern: /^[a-zA-Z0-9]{6,20}$/,
                inputErrorMessage: t('myinvite.custom_invite_format_error'),
                inputPlaceholder: t('myinvite.custom_invite_placeholder')
            }
        )
        
        if (value && value.trim()) {
            await setCustomInviteCode(value.trim())
        }
    } catch (error) {
        // 用户取消操作，不显示错误信息
        if (error !== 'cancel') {
            console.error('自定义邀请码弹窗错误:', error)
        }
    }
}

// 设置自定义邀请码
const setCustomInviteCode = async (code: string) => {
    try {
        const url = (window as any).Constants.uploadUrl + '/users/set-invite-code-custom'
        const response = await axios.post(url, {
            inviteCode: code
        }, {
            headers: {
                'access-token': localStorage.getItem('token')
            }
        })
        
        if (response.data.code === 200) {
            myInviteCode.value = code
            ElMessage.success(t('myinvite.custom_invite_success'))
        } else {
            ElMessage.error(response.data.msg || t('myinvite.custom_invite_failed'))
        }
    } catch (error) {
        console.error('设置自定义邀请码失败:', error)
        ElMessage.error(t('myinvite.custom_invite_failed_retry'))
    }
}

// 复制邀请码url链接
const copyInviteCodeUrl = async () => {
    let url = (window as any).Constants.uploadUrl+"/users/share?inviteCode=" + myInviteCode.value

    try {
        await navigator.clipboard.writeText(url)
        ElMessage.success(t('myinvite.invite_code_copied'))
    } catch (error) {
        // 降级方案
        const textArea = document.createElement('textarea')
        textArea.value = url
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        ElMessage.success(t('myinvite.invite_code_copied'))
    }
}

// 复制邀请码
const copyInviteCode = async () => {
    try {
        await navigator.clipboard.writeText(myInviteCode.value)
        ElMessage.success(t('myinvite.invite_code_copied'))
    } catch (error) {
        // 降级方案
        const textArea = document.createElement('textarea')
        textArea.value = myInviteCode.value
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        ElMessage.success(t('myinvite.invite_code_copied'))
    }
}

// 绑定上级邀请码
const bindParentCode = async () => {
    if (!inputParentCode.value.trim()) {
        ElMessage.warning(t('myinvite.please_enter_invite_code'))
        return
    }
    
    try {
        await ElMessageBox.confirm(
            t('myinvite.bind_confirm_message'),
            t('myinvite.bind_confirm_title'),
            {
                confirmButtonText: t('myinvite.confirm_bind'),
                cancelButtonText: t('myinvite.cancel'),
                type: 'warning',
            }
        )
        
        // 实际API调用
        const url = (window as any).Constants.uploadUrl + '/users/bind-invite-code'
        const response = await axios.post(url, {
            parent_invite_code: inputParentCode.value.trim()
        }, {
            headers: {
                'access-token': localStorage.getItem('token')
            }
        })
        
        if (response.data.code === 200) {
            parentInviteCode.value = inputParentCode.value.trim()
            inputParentCode.value = ''
            ElMessage.success(t('myinvite.bind_success'))
        } else {
            ElMessage.error(response.data.msg || t('myinvite.bind_failed'))
        }
    } catch (error: any) {
        if (error !== 'cancel') {
            console.error('绑定邀请人失败:', error)
            ElMessage.error(t('myinvite.bind_failed_retry'))
        }
    }
}

// 获取邀请码信息
const getInviteInfo = async () => {
    try {
        const url = (window as any).Constants.uploadUrl + '/users/get-invite-info'
        const response = await axios.post(url,{
                starttime: starttime.value,
                endtime: endtime.value
            }, {
            headers: {
                'access-token': localStorage.getItem('token')
            }
        })
        
        if (response.data.code === 200) {
            const data = response.data.data
            myInviteCode.value = data.my_invite_code || ''
            parentInviteCode.value = data.parent_invite_code || ''
            inviteData.value.list = data.list || []
            inviteData.value.totalInvites = data.invite_count || 0
            inviteData.value.totalEarnings = data.invite_income || 0
        }
    } catch (error) {
        console.error(t('myinvite.get_invite_info_failed'), error)
    }
}

onMounted(() => {
    //一个月前的时间
    starttime.value = new Date(new Date().getFullYear(), new Date().getMonth() - 1, new Date().getDate()).toISOString().slice(0, 10)
    //当前时间
    endtime.value = new Date().toISOString().slice(0, 10)
    
    // 获取邀请码信息
    getInviteInfo()
})
</script>

<style scoped>

.invite-code-selectable {
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
  cursor: text;
  transition: all 0.3s ease;
  border-radius: 8px;
  padding: 8px 12px;
  margin: 8px 0;
}

.invite-code-selectable:hover {
  transform: scale(1.02);
}

.invite-code-selectable::selection {
  background-color: rgba(64, 158, 255, 0.3);
  color: #409EFF;
}

.invite-code-selectable::-moz-selection {
  color: #409EFF;
}

.mb-3 {
  margin-bottom: 12px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-2 {
  margin-top: 8px;
}

.text-center {
  text-align: center;
}

.text-sm {
  font-size: 14px;
}

.text-gray-500 {
  color: #6b7280;
}

.invite-code-display .el-input {
  font-size: 16px;
  font-weight: 500;
}

.stat-card {
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: var(--el-color-primary);
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.parent-code-display .el-tag {
  padding: 8px 16px;
}

.bind-parent-code .el-input {
  max-width: 300px;
  margin: 0 auto;
}

.no-invite-code {
  text-align: center;
  padding: 20px 0;
}

.no-invite-code .flex {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.no-invite-code .el-button {
  min-width: 120px;
}


h3 {
  color: var(--el-text-color-primary);
  font-weight: 600;
  margin: 0 0 16px 0;
}

/* 邀请人数量统计样式 */
.invite-count-section {
  margin-top: 16px;
}

.invite-stats-row {
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 20px;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-item .stat-number {
  font-size: 24px;
  font-weight: bold;
  color: var(--el-color-primary);
  margin-bottom: 4px;
}

.stat-item .stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .invite-stats-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .stat-item .stat-number {
    font-size: 20px;
  }
}
</style>