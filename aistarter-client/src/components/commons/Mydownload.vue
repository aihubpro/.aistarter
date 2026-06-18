<template>
    <el-card class="w-full">
        <template #header>
            <div class="flex justify-start">
                <span class="flex align-center font-size-24px">
                    <el-icon>
                        <Files />
                    </el-icon>
                </span>
                <div class="flex justify-center ml-2" style="align-items: end;">
                    <span>{{$t('mydownload.mydownload_title')}}</span>
                </div>
            </div>
        </template>

        <div class="w-full">
            <el-form :inline="true" :model="tableData" class="w-full flex flex-wrap">
                <el-form-item :label="$t('mydownload.form_project_query')">
                    <el-input v-model="projectData" :placeholder="$t('myproject.myproject_search')" clearable class="w-30"/>
                </el-form-item>
                <el-form-item :label="$t('mydownload.form_project_type')">
                    <el-select
                      v-model="resourceTypeData"
                      :placeholder="$t('mydownload.form_project_type_placeholder')"
                      clearable
                      class="w-20"
                    >
                      <el-option :label="$t('mydownload.project_type_app')" value="0" />
                      <el-option :label="$t('mydownload.project_type_model')" value="1" />
                      <el-option :label="$t('mydownload.project_type_plugin')" value="2" />
                      <el-option :label="$t('mydownload.project_type_workflow')" value="3" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="$t('mydownload.form_start_time')">
                    <el-date-picker v-model="starttime" type="date" placeholder="Pick a day" size="default" :disabled-date="disabledDate"/>
                </el-form-item>
                <el-form-item :label="$t('mydownload.form_end_time')">
                    <el-date-picker v-model="endtime" type="date" placeholder="Pick a day" size="default" :disabled-date="disabledDate"/>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="onSubmit" size="small">{{$t('mydownload.form_query_button')}}</el-button>
                    <el-button type="primary" @click="onReset" size="small" >{{$t('mydownload.form_reset_button')}}</el-button>
                </el-form-item>
            </el-form>
        </div>

        <template #footer>
            <!-- 内容 -->
            <el-table ref="tableRef" v-loading="loading" :data="tableData" :header-row-style="{textAlign: 'center'}" stripe max-height="400px" :scrollbar-always-on="true" :flexible="true" :fit="true">
                <el-table-column type="index" :label="$t('myproject.table_id')" width="60" align="center"/>
                <el-table-column prop="project_name" :label="$t('myproject.table_name')" show-overflow-tooltip align="center"/>
                <el-table-column prop="type" :label="$t('mydownload.table_project_type')" width="100" show-overflow-tooltip align="center">
                    <template #default="scope">
                        <el-tag type="info">{{typeFormatter(scope.row.type)}}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="download_count" :label="$t('mydownload.table_download_count')" width="100" show-overflow-tooltip align="center"/>
                <el-table-column prop="updated_at" :label="$t('mydownload.table_download_time')" width="100" show-overflow-tooltip align="center"/>
                <el-table-column fixed="right" :label="$t('myproject.table_operate')" width="100">
                    <template #default="scope">
                        <el-link type="primary" @click="checkDetails({'id':scope.row.project_id,'res_type':Number(scope.row.type)},null,null,scope.row.user_id)">{{$t('myproject.table_operate_look')}}</el-link>
                        <el-link type="primary" class="ml-1" @click="projectDelete(scope.row.project_id,scope.row.type)">{{$t('myproject.table_operate_del')}}</el-link>
                    </template>
                </el-table-column>
            </el-table>
            <!-- 分页 -->
            <div class="flex justify-center mt-2">
                <el-pagination
                    v-model:current-page="currentPage"
                    v-model:page-size="pageSize"
                    :page-sizes="[100, 50, 20, 15, 10]"
                    :size="size"
                    :disabled="disabled"
                    :background="background"
                    layout="total, sizes, prev, pager, next"
                    :total="total"
                    @size-change="handleSizeChange"
                    @current-change="handleCurrentChange"
                />
            </div>
        </template>
    </el-card>
</template>

<script setup lang="ts">
import { onMounted, ref,inject } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { TableColumnCtx, TableInstance } from 'element-plus'
import axios from 'axios'
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const { ipcRenderer } = require('electron');
import type { ComponentSize } from 'element-plus'
import { userStore } from '../../stores/UserStore'
const userStoreIns = userStore()

const { openProductDetails,openProductDetailsReview } = inject('main') as any;

const loading = ref(false)
const tableDataSave = ref<any[]>([])
const tableData = ref<any[]>([])

interface RestaurantItem {
  value: string
  link: string
}

const typeFormatter = (type:number) => {
    const map = {
        0: t('mydownload.project_type_app'),
        1: t('mydownload.project_type_model'),
        2: t('mydownload.project_type_plugin'),
        3: t('mydownload.project_type_workflow')
    }
    return map[type as keyof typeof map] ?? type
}
const projectData = ref('') //项目名查询
const resourceTypeData = ref('') //资源类型查询
const restaurants = ref<RestaurantItem[]>([])

const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const size = ref<ComponentSize>('default')
const background = ref(false)
const disabled = ref(false)

const onReset = async () => {
    projectData.value=''
    resourceTypeData.value=''
}
const onSubmit = async () => {
    resetDate()
}

const handleSizeChange = (val: number) => {
    resetDate()
}
const handleCurrentChange = (val: number) => {
    resetDate()
}

const checkDetails = (row:any,flag:any,flag1:any,user_id:any) => {
    openProductDetails(row)
}
//自定义时间只能选择一年内的
const disabledDate = (date: Date) => {
    const now = new Date();
    const maxDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    return date < oneYearAgo || date > maxDate;
};
async function getList() {
    loading.value=true
    let url = (window as any).Constants.uploadUrl + "/users/get-user-download-record";
    try{
        const response = await axios.get(url, {
            headers: {
                "access-token": localStorage.getItem('token')
            },
            params: {
              size: pageSize.value,
              current: currentPage.value,
              starttime:starttime.value,
              endtime:endtime.value,
              project_name:projectData.value,
              type:resourceTypeData.value
            }
        });
        loading.value=false
        return response;
    }catch(e){
        loading.value=false
        console.log(e)
    }
}
//审核筛选
const filterTag = (value: string, row: any) => {
    return row.state == value;
}
//平台筛选
const filterTagPlatForm = (value: string, row: any) => {
    return row.platforms == value;
}
//项目删除
const projectDelete = (project_id:any,type:number) =>{
    ElMessageBox.confirm(t('mydownload.delete_confirm'), t('myproject.table_operate_del_title'), {
      confirmButtonText: t('myproject.table_operate_del_ok'),
      cancelButtonText: t('myproject.table_operate_del_cancel'),
      type: 'warning',
    }).then( async () => {
        loading.value=true
        let url = (window as any).Constants.uploadUrl + "/users/delete-download-record";
        try{
            const response = await axios.post(url, 
            { project_id:project_id,type},
            { headers: { 
                "access-token": localStorage.getItem('token')
            } });
            if(response.data.msg=="success"){
                loading.value=false
                await resetDate()
                ElMessage.success(t('myproject.table_operate_del_success'))
            }else{
                loading.value=false
                await resetDate()
                ElMessage.error(t('myproject.table_operate_del_error'))
            }
        }catch(e){
            loading.value=false
        }
    })
    .catch(() => {
        loading.value=false
        ElMessage({
            type: 'info',
            message: t('myproject.table_operate_del_cancel_tis'),
        })
        resetDate()
    })
}
const resetDate = async () =>{
    let projectDate = await getList()
    if(projectDate){
        if(projectDate?.data.msg=="success"){
            total.value=projectDate?.data.data.total
            pageSize.value=projectDate?.data.data.size
            tableData.value=[...projectDate?.data.data.records]
            tableDataSave.value=[...projectDate?.data.data.records]
            console.log(tableData.value)
            restaurants.value=tableData.value.map((item:any)=>{
                return {
                    value:item.plugin_name,
                    link:item.id
                }
            })
            console.log(restaurants.value)
        }else{
            ElMessage.error(t('myproject.table_operate_del_error'))
        }
    }
}
const starttime = ref('')
const endtime = ref('')
onMounted(async () => {

    //一个月前的时间
    starttime.value = new Date(new Date().getFullYear(), new Date().getMonth() - 1, new Date().getDate()).toISOString().slice(0, 10)
    //当前时间
    endtime.value = new Date().toISOString().slice(0, 10)

    resetDate()
})

</script>

<style scoped></style>