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
                    <span>{{$t('myfavorites.myfavorites_title')}}</span>
                </div>
            </div>
        </template>

        <div class="w-full">
            <el-form :inline="true" :model="tableData" class="w-full flex flex-wrap">
                <el-form-item :label="$t('myfavorites.form_project_query')">
                    <el-input v-model="projectData" :placeholder="$t('myproject.myproject_search')" clearable class="w-30"/>
                </el-form-item>
                <el-form-item :label="$t('myfavorites.form_project_type')">
                    <el-select
                      v-model="resourceTypeData"
                      :placeholder="$t('myfavorites.form_project_type_placeholder')"
                      clearable
                      class="w-20"
                    >
                      <el-option :label="$t('myfavorites.project_type_app')" value="0" />
                      <el-option :label="$t('myfavorites.project_type_model')" value="1" />
                      <el-option :label="$t('myfavorites.project_type_plugin')" value="2" />
                      <el-option :label="$t('myfavorites.project_type_workflow')" value="3" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="onSubmit" size="small">{{$t('myfavorites.form_query_button')}}</el-button>
                    <el-button type="primary" @click="onReset" size="small" >{{$t('myfavorites.form_reset_button')}}</el-button>
                </el-form-item>
            </el-form>
        </div>

        <template #footer>
            <!-- 内容 -->
            <el-table ref="tableRef" v-loading="loading" :data="tableData" :header-row-style="{textAlign: 'center'}" stripe max-height="400px" :scrollbar-always-on="true" :flexible="true" :fit="true">
                <el-table-column type="index" :label="$t('myproject.table_id')" width="60" align="center"/>
                <el-table-column prop="project_name" :label="$t('myproject.table_name')" show-overflow-tooltip align="center"/>
                <el-table-column prop="type" :label="$t('myfavorites.table_project_type')" width="100" show-overflow-tooltip align="center">
                    <template #default="scope">
                        <el-tag type="info">{{typeFormatter(scope.row.type)}}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column fixed="right" :label="$t('myproject.table_operate')" width="140">
                    <template #default="scope">
                        <el-link type="primary" @click="checkDetails({'id':scope.row.project_id,'res_type':Number(scope.row.type)},null,null,scope.row.user_id)">{{$t('myproject.table_operate_look')}}</el-link>
                        <el-link type="primary" class="ml-1" @click="projectDelete(scope.row.project_id,scope.row.project_name,scope.row.type)">{{$t('myfavorites.table_operate_unfavorite')}}</el-link>
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

const { openProductDetails } = inject('main') as any;

const loading = ref(false)
const tableDataSave = ref<any[]>([])
const tableData = ref<any[]>([])

interface RestaurantItem {
  value: string
  link: string
}

const typeFormatter = (type:number) => {
    const map = {
        0: t('myfavorites.project_type_app'),
        1: t('myfavorites.project_type_model'),
        2: t('myfavorites.project_type_plugin'),
        3: t('myfavorites.project_type_workflow')
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
async function getList() {
    loading.value=true
    let url = (window as any).Constants.uploadUrl + "/users/get-user-favorites-record";
    try{
        const response = await axios.get(url, {
            headers: {
                "access-token": localStorage.getItem('token')
            },
            params: {
              size: pageSize.value,
              current: currentPage.value,
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
const projectDelete = (project_id:any,project_name:any,type:number) =>{
    ElMessageBox.confirm(t('myfavorites.unfavorite_confirm'), t('myproject.table_operate_del_title'), {
      confirmButtonText: t('myproject.table_operate_del_ok'),
      cancelButtonText: t('myproject.table_operate_del_cancel'),
      type: 'warning',
    }).then( async () => {
        loading.value=true
        let url = (window as any).Constants.uploadUrl + "/users/collect-project";
        try{
            const response = await axios.post(url, 
            { project_id,project_name,type},
            { headers: { 
                "access-token": localStorage.getItem('token')
            } });
            if(response.data.code == 200){
                loading.value=false
                await resetDate()
                ElMessage.success(response.data.msg)
            }else if(response.data.code == 100){
                loading.value=false
                await resetDate()
                ElMessage.error(response.data.msg)
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
onMounted(async () => {
    resetDate()
})

</script>

<style scoped></style>