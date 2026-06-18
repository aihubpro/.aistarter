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
                    <span>{{$t('myresources.myresources_title')}}</span>
                </div>
            </div>
        </template>

        <div class="w-full">
            <el-form :inline="true" :model="tableData" class="w-full flex flex-wrap">
                <el-form-item :label="$t('myresources.form_resource_query')">
                    <el-input v-model="projectData" :placeholder="$t('myproject.myproject_search')" clearable class="w-30"/>
                </el-form-item>
                <el-form-item :label="$t('myresources.form_platform_query')">
                    <el-select
                      v-model="platformsData"
                      :placeholder="$t('myresources.form_platform_query_placeholder')"
                      clearable
                      class="w-20"
                    >
                      <el-option label="win" value="win" />
                      <el-option label="mac" value="macos" />
                      <el-option label="linux" value="linux" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="$t('myresources.form_resource_type')">
                    <el-select
                      v-model="resourceTypeData"
                      :placeholder="$t('myresources.form_resource_type_placeholder')"
                      clearable
                      class="w-20"
                    >
                      <el-option :label="$t('myresources.resource_type_model')" value="1" />
                      <el-option :label="$t('myresources.resource_type_plugin')" value="2" />
                      <el-option :label="$t('myresources.resource_type_workflow')" value="3" />
                      <el-option :label="$t('myresources.resource_type_other')" value="4" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="$t('myresources.form_review_status')">
                    <el-select
                      v-model="stateData"
                      :placeholder="$t('myresources.form_review_status_placeholder')"
                      clearable
                      class="w-20"
                    >
                      <el-option :label="$t('myproject.table_review_ing')" value="0" />
                      <el-option :label="$t('myproject.table_review_success')" value="1" />
                      <el-option :label="$t('myproject.table_review_error')" value="2" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="onSubmit" size="small">{{$t('myresources.form_query_button')}}</el-button>
                    <el-button type="primary" @click="onReset" size="small" >{{$t('myresources.form_reset_button')}}</el-button>
                </el-form-item>
            </el-form>
        </div>

        <template #footer>
            <!-- 内容 -->
            <el-table ref="tableRef" v-loading="loading" :data="tableData" :header-row-style="{textAlign: 'center'}" stripe max-height="400px" :scrollbar-always-on="true" :flexible="true" :fit="true">
                <el-table-column type="index" :label="$t('myproject.table_id')" width="60" align="center"/>
                <el-table-column prop="user_name" :label="$t('myproject.table_username')" show-overflow-tooltip align="center"/>
                <el-table-column prop="res_name" :label="$t('myproject.table_name')" width="140" show-overflow-tooltip align="center"/>
                <el-table-column prop="version" :label="$t('myproject.table_version')" show-overflow-tooltip align="center"/>
                <el-table-column prop="platforms" :label="$t('myproject.table_platform')" :filters="[
                    { text: 'win', value: 'win' },
                    { text: 'mac', value: 'macos' },
                    { text: 'linux', value: 'linux' },
                ]" :filter-method="filterTagPlatForm" filter-placement="bottom-end" align="center">
                    <template #default="scope">
                        <el-tag v-if="scope.row.platforms == 'win'" type="info">{{ scope.row.platforms }}</el-tag>
                        <el-tag v-if="scope.row.platforms == 'macos'" type="primary">{{ scope.row.platforms }}</el-tag>
                        <el-tag v-if="scope.row.platforms == 'linux'" type="warning">{{ scope.row.platforms }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="like_count" :label="$t('myproject.table_like')" show-overflow-tooltip align="center"/>
                <el-table-column prop="favorite_count" :label="$t('myproject.table_favorite')" show-overflow-tooltip align="center"/>
                <el-table-column prop="download" width="110" :label="$t('myproject.table_download')" show-overflow-tooltip align="center"/>
                <el-table-column prop="state" :label="$t('myproject.table_review')" width="100" :filters="[
                    { text: $t('myproject.table_review_ing'), value: '0' },
                    { text: $t('myproject.table_review_success'), value: '1' },
                    { text: $t('myproject.table_review_error'), value: '2' },
                ]" :filter-method="filterTag" filter-placement="bottom-end" align="center">
                    <template #default="scope">
                        <el-tag v-if="scope.row.state=='0'" type="info">{{$t('myproject.table_review_ing')}}</el-tag>
                        <el-tag v-else-if="scope.row.state=='1'" type="success">{{$t('myproject.table_review_success')}}</el-tag>
                        <el-tag v-else type="danger">{{$t('myproject.table_review_error')}}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column fixed="right" :label="$t('myproject.table_operate')" width="110">
                    <template #default="scope">
                        <el-link type="primary" @click="checkDetails({'id':scope.row.id,'res_type':scope.row.res_type},null,null,scope.row.user_id,scope.row.istmp)">{{$t('myproject.table_operate_look')}}</el-link>
                        <el-link type="primary" class="ml-1" @click="projectDelete(scope.row.id,scope.row.istmp,scope.row.res_type)">{{$t('myproject.table_operate_del')}}</el-link>
                        <!--
                        <el-link type="primary" class="ml-1" @click="projectEdit(scope.row.id,scope.row)">{{$t('myproject.table_operate_edit')}}</el-link>
                        -->
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
const projectData = ref('') //项目名查询
const platformsData = ref('') //平台查询
const resourceTypeData = ref('') //资源类型查询
const stateData = ref('') //状态查询
const restaurants = ref<RestaurantItem[]>([])

const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const size = ref<ComponentSize>('default')
const background = ref(false)
const disabled = ref(false)

const onReset = async () => {
    projectData.value=''
    platformsData.value=''
    resourceTypeData.value=''
    stateData.value=''
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

const checkDetails = (row:any,flag:any,flag1:any,user_id:any,istmp:boolean) => {
    if(istmp){
        openProductDetailsReview(row)
    }else{
        openProductDetails(row)
    }
}
async function getList() {
    loading.value=true
    let url = (window as any).Constants.uploadUrl + "/users/get-user-resources-data";
    try{
        const response = await axios.get(url, {
            headers: {
                "access-token": localStorage.getItem('token')
            },
            params: {
              size: pageSize.value,
              current: currentPage.value,
              res_name: projectData.value,
              platforms: platformsData.value,
              res_type: resourceTypeData.value,
              state: stateData.value,
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
const projectDelete = (id:any,temp:boolean,res_type:number) =>{
    ElMessageBox.confirm(t('myproject.table_operate_del_tis'), t('myproject.table_operate_del_title'), {
      confirmButtonText: t('myproject.table_operate_del_ok'),
      cancelButtonText: t('myproject.table_operate_del_cancel'),
      type: 'warning',
    }).then( async () => {
        loading.value=true
        let url = (window as any).Constants.uploadUrl + "/users/delete-user-resources-data";
        try{
            const response = await axios.post(url, 
            { id:id,temp,res_type},
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
    },(id))
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

    // //一个月前的时间
    // starttime.value = new Date(new Date().getFullYear(), new Date().getMonth() - 1, new Date().getDate()).toISOString().slice(0, 10)
    // //当前时间
    // endtime.value = new Date().toISOString().slice(0, 10)
})

</script>

<style scoped></style>