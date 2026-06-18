<template>
    <el-card>
        <template #header>
            <div class="flex justify-start">
                <span class="flex align-center font-size-24px">
                    <el-icon>
                        <Money />
                    </el-icon>
                </span>
                <div class="flex justify-center ml-2" style="align-items: end;">
                    <span>{{ $t('mywallet.wallet_title') }}</span>
                </div>
            </div>
        </template>
        <!-- 内容 -->
        <div class="flex justify-between">
            <div class="flex justify-start text-yellow" style="align-items: end;">
                <span class="font-size-40px font-weight-800">{{ walletData?.wallet }}</span>
                <span class="ml-4">{{ $t('mywallet.balance_label') }}</span>
            </div>
            <div class="flex justify-start" style="align-items: center;">
                <!-- <el-button type="primary" plain>充值</el-button> -->
                <el-button type="primary" plain @click="withdraw">{{ $t('mywallet.withdraw_button') }}</el-button>
            </div>
        </div>
        <!-- 底部 -->
        <template #footer>
            <div class="flex justify-between items-center">
                <div class="flex justify-start">
                    <span class="font-size-14px">{{ $t('mywallet.under_review_balance') }}
                        <span class="ml-4 mr-4 font-size-20px font-weight-800 text-red">{{ walletData?.under_review }}</span>
                    </span>
                    <span class="font-size-16px flex" style="align-items: end;">
                        <el-tooltip class="box-item" effect="dark" placement="right">
                            <template #content>
                                <div class="w-200px">
                                    <div class="font-size-14px" style="font-weight: 900;">{{ $t('mywallet.under_review_tooltip_title') }}</div>
                                    <div class="text-gray">{{ $t('mywallet.under_review_tooltip_content') }}</div>
                                </div>
                            </template>
                            <el-icon>
                                <Warning />
                            </el-icon>
                        </el-tooltip>
                    </span>
                </div>
                <div class="flex justify-start">
                    <span class="mr-2 font-size-14px">
{{ $t('mywallet.withdraw_date_reminder') }}
                    </span>
                    <span class="font-size-16px flex" style="align-items: end;">
                        <el-tooltip class="box-item" effect="dark" placement="right">
                            <template #content>
                                <div class="w-200px">
                                    <div class="font-size-14px" style="font-weight: 900;">{{ $t('mywallet.withdraw_rule_title') }}</div>
                                    <div class="text-gray">{{ $t('mywallet.withdraw_rule_content') }}</div>
                                </div>
                            </template>
                            <el-icon>
                                <Warning />
                            </el-icon>
                        </el-tooltip>
                    </span>
                </div>
            </div>
        </template>
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
                    <span>{{ $t('mywallet.withdraw_details_title') }}</span>
                </div>
            </div>
        </template>

        <el-descriptions>
            <el-descriptions-item :label="$t('mywallet.recent_date_label')">
                <el-date-picker v-model="starttime" type="date" :placeholder="$t('mywallet.date_placeholder')" size="default" @change="onDateChange" :disabled-date="disabledDate"/>
                <el-date-picker v-model="endtime" type="date" :placeholder="$t('mywallet.date_placeholder')" size="default" class="ml-4" @change="onDateChange" :disabled-date="disabledDate"/>
            </el-descriptions-item>
        </el-descriptions>
        <template #footer>
            <!-- 内容 -->
            <el-table :data="walletData?.withdrawList" stripe max-height="200px">
                <el-table-column prop="time" :label="$t('mywallet.table_transfer_time')" width="170" align="center"/>
                <el-table-column prop="transferid" :label="$t('mywallet.table_order_number')" width="100" align="center">
                    <template #default="scope">
                        <el-popover
                            class="box-item"
                            title=""
                            :content="scope.row.transferid?scope.row.transferid:''"
                            placement="top"
                        >
                            <template #reference>
                                <div class="ellipsis">
                                    {{scope.row.transferid}}
                                </div>
                            </template>
                        </el-popover>
                    </template>
                </el-table-column>
                <el-table-column prop="status" :label="$t('mywallet.table_status')" align="center">
                    <template #default="scope">
                        <div class="flex justify-center items-center">
                            <el-tag :type="getStatusInfo(scope.row.status).type">
                                {{ getStatusInfo(scope.row.status).text }}
                            </el-tag>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="transferbalance" :label="$t('mywallet.table_transfer_balance')" align="center"/>
                <el-table-column prop="tax_amount" :label="$t('mywallet.table_tax_amount')" align="center"/>
                <el-table-column
                    prop="channel"
                    :label="$t('mywallet.table_transfer_channel')"
                    align="center"
                >
                    <template #default="scope">
                        <div class="flex justify-center items-center">
                            <el-tag :type="getChannelInfo(scope.row.channel).type">
                                {{ getChannelInfo(scope.row.channel).text }}
                            </el-tag>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="remark" :label="$t('mywallet.table_remark')" align="center">
                    <template #default="scope">
                        <el-popover
                        class="box-item"
                        title=""
                        :content="scope.row.remark?scope.row.remark:$t('mywallet.remark_none')"
                        placement="top"
                        >
                        <template #reference>
                            {{ $t('mywallet.remark_view') }}
                        </template>
                        </el-popover>
                    </template>
                </el-table-column>
            </el-table>
        </template>
    </el-card>
</template>

<script setup lang="ts">
import {onMounted, ref , inject} from 'vue'
import { ElMessage,ElMessageBox } from 'element-plus';
import axios from 'axios'
import toolutils from "../../toolutils"
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface walletData {
    wallet:string,
    under_review:string,
    withdrawList:Array<any>,
}

const channelMap = {
    alipay: { text: t('mywallet.channel_alipay'), type: 'success' },
    wechat: { text: t('mywallet.channel_wechat'), type: 'primary' },
    paypal: { text: t('mywallet.channel_paypal'), type: 'info' },
    bank: { text: t('mywallet.channel_bank'), type: 'warning' },
    enterprise: { text: t('mywallet.channel_enterprise'), type: 'primary' },
  };
  
function getChannelInfo(channel:string) {
    return channelMap[channel as keyof typeof channelMap] || { text: channel, type: '' };
}

const statusMap = {
    0: { text: t('mywallet.status_pending'), type: 'info' },
    1: { text: t('mywallet.status_approved'), type: 'success' },
    2: { text: t('mywallet.status_transferring'), type: 'warning' },
    3: { text: t('mywallet.status_completed'), type: 'success' },
    4: { text: t('mywallet.status_rejected'), type: 'danger' },
    5: { text: t('mywallet.status_cancelled'), type: '' }
};

// 获取状态文字和类型
function getStatusInfo(status:number) {
    return statusMap[status as keyof typeof statusMap] || { text: t('mywallet.status_unknown'), type: '' };
}
const tableData = [
    {
        time: '2016-05-03',
        transferid: '40000000000000000000',
        status: '正常',
        transferbalance: '123.00',
        channel: '微信',
    },
    {
        time: '2016-05-02',
        transferid: '40000000000000000001',
        status: '正常',
        transferbalance: '123.00',
        channel: '微信',
    },
    {
        time: '2016-05-03',
        transferid: '40000000000000000000',
        status: '正常',
        transferbalance: '123.00',
        channel: '微信',
    }
]
const starttime = ref('')
const endtime = ref('')
const walletData = ref<walletData>({} as walletData)
function onDateChange() {
    endtime.value = toolutils.formatDate(new Date(endtime.value))
    getData();
}
//自定义时间只能选择一年内的
const disabledDate = (date: Date) => {
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    return date < oneYearAgo || date > now;
}
//提现
let isWithdrawing = false;
const withdrawType = ref('wechat') // 默认微信
const withdrawTypes = [
  { label: '微信', value: 'wechat' },
  { label: '支付宝', value: 'alipay' }
]
const { openWithdrawDialog } = inject('main') as any;
const withdraw = async () => {
    if (isWithdrawing) return;
    isWithdrawing = true;
    //判断金额是否大于100
    if(Number(walletData.value.wallet) < 100){
        ElMessage.error(t('mywallet.withdraw_min_amount_error'));
        isWithdrawing = false;
        return;
    }
    openWithdrawDialog(100,walletData.value.wallet,()=>{
        getData()
    });
    // ElMessageBox.prompt('请输入提现金额', '提现', {
    //     confirmButtonText: '确定',
    //     showCancelButton: false,
    //     inputValidator: (value) => {
    //         if (!/^\d+(\.\d{1,2})?$/.test(value)) return false;
    //         const num = Number(value);
    //         return num >= 100 && num <= Number(walletData.value.wallet);
    //     },
    //     inputErrorMessage: '请输入100~余额之间的数字，支持两位小数',
    // })
    // .then(async ({ value }) => {
    // })
    isWithdrawing = false;
}
const getData = async () => {
    let url = (window as any).Constants.uploadUrl + '/users/get-user-wallet'
    let result = await axios.post(url,{
        startTime: starttime.value,
        endTime: endtime.value
    },{
        headers: {
            "access-token": localStorage.getItem('token')
        }
    })
    if(result.data.code == 200){
        walletData.value = result.data.data
        // return result.data.data
    }else{
        ElMessage.error(result.data.msg)
    }
}
onMounted(() => {
    //一个月前的时间
    starttime.value = new Date(new Date().getFullYear(), new Date().getMonth() - 1, new Date().getDate()).toISOString().slice(0, 10)
    //获取前一天的时间
    // endtime.value = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()-1).toISOString().slice(0, 10)
    //当前时间
    endtime.value = new Date().toISOString().slice(0, 10)
    getData()
})
</script>

<style scoped></style>