<template>
    <el-card>
        <!-- 内容 -->
        <div class="flex flex-wrap">
            <el-card class="flex-1 m-2">
                <div class="text-left">
                    {{ t('myincome.yesterday_income') }}
                </div>
                <div class="mt-3 text-2xl text-left text-blue">
                    {{ incomeData.yesterdayIncome }}
                </div>
            </el-card>
            <el-card class="flex-1 m-2">
                <div class="text-left">
                    {{ t('myincome.thirty_days_income') }}
                </div>
                <div class="mt-3 text-2xl text-left text-blue">
                    {{ incomeData.thirtyDaysIncome }}
                </div>
            </el-card>
            <el-card class="flex-1 m-2">
                <div class="text-left">
                    {{ t('myincome.three_months_income') }}
                </div>
                <div class="mt-3 text-2xl text-left text-blue">
                    {{ incomeData.threeMonthsIncome }}
                </div>
            </el-card>
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
                    <span>{{ t('myincome.income_details') }}</span>
                </div>
            </div>
        </template>

        <el-descriptions>
            <el-descriptions-item :label="t('myincome.time_label')">
                <el-date-picker v-model="starttime" type="date" :placeholder="t('myincome.date_placeholder')" size="default" @change="onDateChange" :disabled-date="disabledDate"/>
                <el-date-picker v-model="endtime" type="date" :placeholder="t('myincome.date_placeholder')" size="default" class="ml-4" @change="onDateChange" :disabled-date="disabledDate"/>
            </el-descriptions-item>
        </el-descriptions>
        <template #footer>
            <!-- 内容 -->
            <el-table :data="incomeData?.dailyIncome" stripe max-height="400px">
                <el-table-column prop="time" :label="t('myincome.table_date')" width="180" align="center"/>
                <el-table-column prop="total" :label="t('myincome.table_total')" align="center">
                    <template #default="scope">
                        <span v-if="scope.row.order_desc" class="text-red">{{ scope.row.total }}</span>
                        <span v-else class="text-green">{{ scope.row.total }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="reward_amount" :label="t('myincome.table_reward_amount')" align="center"/>
                <el-table-column prop="creation_income" :label="t('myincome.table_creation_income')" align="center"/>
                <el-table-column prop="refund" :label="t('myincome.table_refund')" align="center"/>
                <el-table-column prop="order_desc" :label="t('myincome.table_order_desc')" align="left" width="200">
                    <template #default="scope">
                        <el-tooltip
                            class="box-item"
                            effect="dark"
                            :content="scope.row.order_desc"
                            placement="top"
                        >
                            <div style="white-space: pre-wrap; line-height: 1.4; max-height: 4.2em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">
                                {{ scope.row.order_desc }}
                            </div>
                        </el-tooltip>
                    </template>
                </el-table-column>
            </el-table>
        </template>
    </el-card>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue'
import { ElMessage } from 'element-plus';
import axios from 'axios'
import toolutils from "../../toolutils"
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const starttime = ref('')
const endtime = ref('')
interface IncomeData {
    yesterdayIncome: string,
    thirtyDaysIncome: string,
    threeMonthsIncome: string,
    dailyIncome: any[]
}
const incomeData = ref<IncomeData>({} as IncomeData)
//自定义时间只能选择一年内的
const disabledDate = (date: Date) => {
    const now = new Date();
    const maxDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    return date < oneYearAgo || date > maxDate;
};
function onDateChange() {
    endtime.value = toolutils.formatDate(new Date(endtime.value))
    getData();
}
//获取数据
const getData = async function () { 
    let url = (window as any).Constants.uploadUrl + '/users/get-user-income'
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
        incomeData.value = result.data.data
        // return result.data.data
    }else{
        ElMessage.error(result.data.msg)
    }
}
onMounted(() => {
    //一个月前的时间
    starttime.value = new Date(new Date().getFullYear(), new Date().getMonth() - 1, new Date().getDate()).toISOString().slice(0, 10)
    //获取前一天的时间
    endtime.value = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()-1).toISOString().slice(0, 10)
    //当前时间
    // endtime.value = new Date().toISOString().slice(0, 10)
    getData()
})
</script>

<style scoped></style>