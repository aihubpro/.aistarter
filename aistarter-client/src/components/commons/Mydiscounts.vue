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
                    <span>{{ t('mydiscounts.my_coupons') }}</span>
                </div>
            </div>
        </template>
        <!-- 内容 -->
        <div class="flex justify-between">
            <div class="flex justify-start text-yellow" style="align-items: end;">
                <span class="font-size-40px font-weight-800">{{ tableData.coupon_count }}</span>
                <span class="ml-4">{{ t('mydiscounts.coupon_count_unit') }}</span>
            </div>
            <div class="flex justify-start" style="align-items: center;">
                <el-button type="primary" plain @click="requestMore">{{ t('mydiscounts.request_more') }}</el-button>
            </div>
        </div>
        <!-- 底部 -->
        <template #footer>
            <div class="flex justify-start">
                <span class="font-size-14px">{{ t('mydiscounts.used_coupons') }}
                    <span class="ml-4 mr-4 font-size-20px font-weight-800 text-blue">{{ tableData.coupon_used_count }}</span>
                    {{ t('mydiscounts.coupon_count_unit') }}
                </span>
                <span class="ml-4"></span>
                <span class="font-size-14px">{{ t('mydiscounts.applying_coupons') }}
                    <span class="ml-4 mr-4 font-size-20px font-weight-800 text-red">{{ applyDate.coupon_apply_count?applyDate.coupon_apply_count:0 }}</span>
                    {{ t('mydiscounts.coupon_count_unit') }}
                </span>
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
                    <span>{{ t('mydiscounts.application_list') }}</span>
                </div>
            </div>
        </template>
        <!-- 内容 -->
        <el-descriptions>
            <el-descriptions-item :label="t('mydiscounts.time_label')">
                <el-date-picker v-model="starttime" type="date" :placeholder="t('mydiscounts.date_placeholder')" size="default" @change="onDateChange" :disabled-date="disabledDate"/>
                <el-date-picker v-model="endtime" type="date" :placeholder="t('mydiscounts.date_placeholder')" size="default" class="ml-4" @change="onDateChange" :disabled-date="disabledDate"/>
            </el-descriptions-item>
        </el-descriptions>
        <template #footer>
            <el-table :data="applyDate.couponList" stripe style="user-select: text;" max-height="250">
                <el-table-column prop="created_at" :label="t('mydiscounts.table_apply_time')" width="120" show-overflow-tooltip/>
                <el-table-column prop="applicant_name" :label="t('mydiscounts.table_applicant')" />
                <el-table-column prop="apply_count" :label="t('mydiscounts.table_apply_count')" />
                <el-table-column prop="issued_count" :label="t('mydiscounts.table_issued_count')" />
                <el-table-column prop="status" :label="t('mydiscounts.table_review_status')" width="80">
                    <template #default="scope">
                        <div class="flex justify-center items-center">
                            <el-tag :type="getChannelInfo(scope.row.status).type">
                                {{ getChannelInfo(scope.row.status).text }}
                            </el-tag>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="review_remark" :label="t('mydiscounts.table_remark')" show-overflow-tooltip/>
                <el-table-column prop="reviewer_name" :label="t('mydiscounts.table_reviewer')" />
                <el-table-column prop="reviewed_at" :label="t('mydiscounts.table_review_time')" show-overflow-tooltip/>
            </el-table>
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
                    <span>{{ t('mydiscounts.my_discount_codes') }}</span>
                </div>
            </div>
        </template>
        <!-- 内容 -->
        <el-table :data="tableData.couponList" stripe style="user-select: text;" max-height="250">
            <el-table-column type="index" width="50"/>
            <el-table-column prop="code" :label="t('mydiscounts.table_discount_code')" show-overflow-tooltip/>
            <el-table-column prop="cashback_amount" :label="t('mydiscounts.table_cashback_amount')">
                <template #default="scope">
                    {{scope.row.cashback_amount?(scope.row.cashback_amount / 100).toFixed(2):'0'}}{{ t('mydiscounts.currency_unit') }}
                </template>
            </el-table-column>
            <el-table-column prop="valid_from" :label="t('mydiscounts.table_valid_from')" show-overflow-tooltip/>
            <el-table-column prop="valid_to" fixed="right" :label="t('mydiscounts.table_valid_to')" show-overflow-tooltip/>
            <el-table-column prop="used" fixed="right" :label="t('mydiscounts.table_status')" width="100" :filters="[
                 { text: t('mydiscounts.coupon_unused'), value: '0' },
                 { text: t('mydiscounts.coupon_used'), value: '1' },
                 { text: t('mydiscounts.coupon_expired'), value: '2' },
             ]" :filter-method="filterTag" filter-placement="bottom-end">
                <template #default="scope">
                    <el-tag :type="getCouponInfo(scope.row.used).type">
                        {{ getCouponInfo(scope.row.used).text }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="user_name" :label="t('mydiscounts.table_user')" show-overflow-tooltip/>
            <el-table-column fixed="right" :label="t('mydiscounts.table_actions')" width="165">
                <template #default="scope">
                    <el-button size="small" @click="copyCode(scope.$index, scope.row)">{{ t('mydiscounts.button_copy') }}</el-button>
                     <el-button size="small" @click="copyCodeLink(scope.$index, scope.row)">{{ t('mydiscounts.button_copy_link') }}</el-button>
                </template>
            </el-table-column>
        </el-table>
        <template #footer>
            <!-- 批量导出 -->
            <div class="flex justify-end">
                <el-button type="primary" plain class="ml-4" @click="exportData">{{ t('mydiscounts.button_batch_export') }}</el-button>
            </div>
        </template>
    </el-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import toolutils from "../../toolutils"
import axios from 'axios'
import * as XLSX from 'xlsx'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const applyDate = ref([] as any)
const tableData = ref([] as any)

//优惠码列表
const couponMap = {
    0: { text: () => t('mydiscounts.coupon_unused'), type: 'warning' },
    1: { text: () => t('mydiscounts.coupon_used'), type: 'success' },
    2: { text: () => t('mydiscounts.coupon_expired'), type: 'danger' },
  };
  
function getCouponInfo(coupon:number) {
    const info = couponMap[coupon as keyof typeof couponMap];
    return info ? { text: info.text(), type: info.type } : { text: coupon, type: '' };
}

//申请优惠码列表
const channelMap = {
    0: { text: () => t('mydiscounts.status_pending'), type: 'warning' },
    1: { text: () => t('mydiscounts.status_approved'), type: 'success' },
    2: { text: () => t('mydiscounts.status_rejected'), type: 'danger' },
  };
  
function getChannelInfo(channel:number) {
    const info = channelMap[channel as keyof typeof channelMap];
    return info ? { text: info.text(), type: info.type } : { text: channel, type: '' };
}

//获取申请订单
const getapplyOrder = async () => { 
    let url = (window as any).Constants.uploadUrl + '/users/get-discount-apply-list'
    let result = await axios.post(url,{
        startTime: starttime.value,
        endTime: endtime.value
    },{
        headers: {
            "access-token": localStorage.getItem('token')
        }
    })
    if(result.data.code == 200){
        console.log(result.data.data)
        applyDate.value = result.data.data
        // return result.data.data
    }else{
        ElMessage.error(result.data.msg)
    }
}

//获取优惠订单数据
const getData = async () => {
    let url = (window as any).Constants.uploadUrl + '/users/get-user-discount'
    let result = await axios.post(url,{
        startTime: starttime.value,
        endTime: endtime.value
    },{
        headers: {
            "access-token": localStorage.getItem('token')
        }
    })
    if(result.data.code == 200){
        console.log(result.data.data)
        tableData.value = result.data.data
        // return result.data.data
    }else{
        ElMessage.error(result.data.msg)
    }
}

//申请优惠码
const applyCoupon = async (num: number) => {
    let url = (window as any).Constants.uploadUrl + '/users/discount-apply'
    let result = await axios.post(url,{
        num : num
    },{
        headers: {
            "access-token": localStorage.getItem('token')
        }
    })
    if(result.data.code == 200){
        ElMessage.success(t('mydiscounts.apply_success'))
        getapplyOrder()
        // return result.data.data
    }else{
        ElMessage.error(result.data.msg)
    }
}
// 筛选
const filterTag = (value: string, row: any) => {
    return row.used == value
}

const copyCodeLink = (val: string, row: any) => {
    ElMessage(t('mydiscounts.copy_success'))
    navigator.clipboard.writeText((window as any).Constants.uploadUrl + '/users/share?discountCode=' + row.code)
}
// 复制
const copyCode = (val: string, row: any) => {
    ElMessage(t('mydiscounts.copy_success'))
    navigator.clipboard.writeText(row.code)
}

//自定义时间只能选择一年内的
const disabledDate = (date: Date) => {
    const now = new Date();
    const maxDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    return date < oneYearAgo || date > maxDate;
};
function onDateChange() {
    endtime.value = toolutils.formatDate(new Date(endtime.value))
    getapplyOrder();
}

const starttime = ref('')
const endtime = ref('')
onMounted(() => {
    //一个月前的时间
    starttime.value = new Date(new Date().getFullYear(), new Date().getMonth() - 1, new Date().getDate()).toISOString().slice(0, 10)
    //当前时间
    endtime.value = new Date().toISOString().slice(0, 10)

    getData();
    getapplyOrder();
})


// 批量导出
const exportData = () => {
    ElMessageBox.confirm(t('mydiscounts.export_confirm_message'), t('mydiscounts.export_confirm_title'), {
        confirmButtonText: t('mydiscounts.export_confirm_button'),
        cancelButtonText: t('mydiscounts.export_cancel_button'),
        type: 'warning',
    })
    .then(() => {
        // 1. 定义你想要的字段顺序和表头
        const exportFields = ["id", "code", "min_amount", "cashback_amount","valid_from","valid_to", "used","user_name","link"];
        const exportHeaders = [t('mydiscounts.export_headers.serial_number'), t('mydiscounts.export_headers.discount_code'), t('mydiscounts.export_headers.min_amount'), t('mydiscounts.export_headers.cashback_amount'), t('mydiscounts.export_headers.valid_from'), t('mydiscounts.export_headers.valid_to'), t('mydiscounts.export_headers.usage_status'), t('mydiscounts.export_headers.user'), t('mydiscounts.export_headers.share_link')];

        const data = tableData.value.couponList.map((item:any, idx:number) => ({
            ...item,
            id: idx + 1, // 按当前排列顺序重新编号
            min_amount:((item.min_amount/100).toFixed(2)),
            cashback_amount:((item.cashback_amount/100).toFixed(2)),
            used: getCouponInfo(item.used).text,
            link: (window as any).Constants.uploadUrl + '/users/share?discountCode=' + item.code
        }))
        // 3. 生成工作表并插入自定义表头
        const worksheet = XLSX.utils.json_to_sheet(data, {header: exportFields});
        XLSX.utils.sheet_add_aoa(worksheet, [exportHeaders], {origin: "A1"});
        worksheet['!cols'] = [
            { wch: 8 },
            { wch: 20 },
            { wch: 12 },
            { wch: 12 },
            { wch: 16 },
            { wch: 16 },
            { wch: 8 },
            { wch: 8 },
        ];

        // 4. 创建工作簿并导出
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, t('mydiscounts.export_sheet_name'))
        // 导出为Excel文件
        XLSX.writeFile(workbook, t('mydiscounts.export_filename'))
        ElMessage({
            type: 'success',
            message: t('mydiscounts.export_success'),
        })
    })
    .catch(() => {
        
    })
}
const requestMore = () => {
    ElMessageBox.prompt(t('mydiscounts.request_more_message'), t('mydiscounts.request_more_title'), {
         confirmButtonText: t('mydiscounts.request_more_button'),
         showCancelButton: false,
         inputValidator: (value) => {
             return /^\d+$/.test(value)
         },
         inputErrorMessage: t('mydiscounts.request_more_error'),
    })
    .then(({ value }) => {
        applyCoupon(Number(value));
        // console.log(value)
        // ElMessage({
        //     type: 'success',
        //     message: `已发送申请`,
        // })
    })
}
</script>

<style scoped></style>