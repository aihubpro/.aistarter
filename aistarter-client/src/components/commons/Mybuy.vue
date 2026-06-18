<template>
    <el-card class="w-full">
        <template #header>
            <div class="flex justify-start">
                <span class="flex align-center font-size-24px">
                    <el-icon><ShoppingCart /></el-icon>
                </span>
                <div class="flex justify-center ml-2" style="align-items: end;">
                    <span>{{ $t('mybuy.mybuy_title') }}</span>
                </div>
            </div>
        </template>
        <!--中间内容-->
        <div class="m-5">
            <el-descriptions>
                <el-descriptions-item :label="$t('mybuy.form_date_label')">
                    <el-date-picker v-model="starttime" type="date" :placeholder="$t('mybuy.date_placeholder')" size="default" @change="onDateChange" :disabled-date="disabledDate"/>
                    <el-date-picker v-model="endtime" type="date" :placeholder="$t('mybuy.date_placeholder')" size="default" class="ml-4" @change="onDateChange" :disabled-date="disabledDate"/>
                </el-descriptions-item>
            </el-descriptions>
        </div>
        <!--底部内容-->
        <template #footer>
            <!-- 内容 -->
            <el-table :data="buyData" stripe max-height="200px">
                <el-table-column prop="create_time" :label="$t('mybuy.table_date')" align="center"/>
                <el-table-column prop="order_no" :label="$t('mybuy.table_order_no')" align="center">
                    <template #default="scope">
                        <el-popover
                            class="box-item"
                            title=""
                            :content="scope.row.order_no?scope.row.order_no:''"
                            placement="top"
                        >
                            <template #reference>
                                <div class="ellipsis">
                                    {{scope.row.order_no}}
                                </div>
                            </template>
                        </el-popover>
                    </template>
                </el-table-column>
                <el-table-column prop="merchant_name" :label="$t('mybuy.table_merchant')" align="center">
                    <template #default="scope">
                        <el-popover
                            class="box-item"
                            title=""
                            :content="scope.row.merchant_name == 'admin' ? $t('mybuy.merchant_platform') : scope.row.merchant_name"
                            placement="top"
                        >
                            <template #reference>
                                <div class="ellipsis">
                                    {{scope.row.merchant_name == 'admin' ? $t('mybuy.merchant_platform') : scope.row.merchant_name}}
                                </div>
                            </template>
                        </el-popover>
                    </template>
                </el-table-column>
                <el-table-column prop="title" :label="$t('mybuy.table_title')" align="center">
                    <template #default="scope">
                        <el-popover
                            class="box-item"
                            title=""
                            :content="scope.row.title?scope.row.title:''"
                            placement="top"
                        >
                            <template #reference>
                                <div class="ellipsis">
                                    {{scope.row.title}}
                                </div>
                            </template>
                        </el-popover>
                    </template>
                </el-table-column>
                <el-table-column prop="product_type" :label="$t('mybuy.table_type')" align="center" fixed="right" :filters="[
                    { text: $t('mybuy.filter_vip'), value: '1' },
                    { text: $t('mybuy.filter_ai_app'), value: '2' },
                    { text: $t('mybuy.filter_ai_model'), value: '3' },
                    { text: $t('mybuy.filter_ai_plugin'), value: '4' },
                    { text: $t('mybuy.filter_ai_workflow'), value: '5' },
                    { text: $t('mybuy.filter_creator_renewal'), value: '1000' },
                ]" :filter-method="filterTagType" filter-placement="bottom-end">
                    <template #default="scope">
                        <div class="flex justify-center items-center">
                            <el-tag :type="getChannelInfo(scope.row.product_type).type">
                                {{ getChannelInfo(scope.row.product_type).text }}
                            </el-tag>
                        </div>
                    </template>
                </el-table-column>
            </el-table>
        </template>
    </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus';
import toolutils from "../../toolutils"
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

//类型筛选
const filterTagType = (value: string, row: any) => {
    return row.product_type == value;
}

const channelMap = {
    1: { text: t('mybuy.channel_vip'), type: 'success' },
    2: { text: t('mybuy.channel_ai_project'), type: 'primary' },
    3: { text: t('mybuy.channel_ai_model'), type: 'info' },
    4: { text: t('mybuy.channel_ai_plugin'), type: 'warning' },
    5: { text: t('mybuy.channel_ai_workflow'), type: 'warning' },
    1000: { text: t('mybuy.channel_creator_renewal'), type: 'warning' },
  };
  
function getChannelInfo(channel:number) {
    return channelMap[channel as keyof typeof channelMap] || { text: channel, type: '' };
}

const starttime = ref('')
const endtime = ref('')

const buyData = ref([])

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
    getData();
}

//获取数据
async function getData() {
    let url = (window as any).Constants.uploadUrl + '/users/get-buy-record'
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
        buyData.value = result.data.data
        // return result.data.data
    }else{
        ElMessage.error(result.data.msg)
    }
}

onMounted(() => {
    //一个月前的时间
    starttime.value = new Date(new Date().getFullYear(), new Date().getMonth() - 1, new Date().getDate()).toISOString().slice(0, 10)
    //当前时间
    endtime.value = new Date().toISOString().slice(0, 10)

    getData()
})


</script>

<style scoped>
.el-card {
    margin-bottom: 10px;
}

.bottom {
    margin-top: 13px;
    line-height: 12px;
}

.message-content {
    text-align: left;
    line-height: 24px;
}
</style>