<template>
  <div>
    <div class="m-3 p-3 pt-5 bg-white">
      <b-query :query-params="model.queryParam" :fields="fields" @query="queryPage" @reset="resetQueryParams" />
    </div>
    <div class="m-3 p-3 bg-white">
      <vxe-toolbar ref="xToolbar" custom :refresh="{ queryMethod: queryPage }">
      </vxe-toolbar>
      <vxe-table row-id="id" ref="xTable" :cell-style="cellStyle" :data="pagination.records" :loading="loading"
        :sort-config="{ remote: true, trigger: 'cell'}" :row-config="{height: 150}" @sort-change="sortChange">
        <vxe-column type="seq" title="序号" width="60" />
        <vxe-column field="id" title="用户ID" :min-width="120">
        </vxe-column>
        <vxe-column field="username" title="用户名" :min-width="230" />
        <vxe-column field="email" title="邮箱" :min-width="230" />
        <vxe-column field="phone" title="手机号" sortable :min-width="230" />
        <vxe-column field="id_role" title="角色" :min-width="120">
          <template #default="{ row }"> {{ roleNameCfg[row.id_role] }} </template>
        </vxe-column>
        <vxe-column field="name" title="身份证姓名" sortable :min-width="230" />
        <vxe-column field="id_card_number" title="身份证号码" sortable :min-width="230" />
        <vxe-column field="id_card_expiry_date" title="身份证有效期" sortable :min-width="230" />
        <vxe-column field="id_card_front_image_url" title="身份证正面" sortable :min-width="250" show-overflow>
          <template #default="{ row }">
            <a-image :src="imageUrl(row.id_card_front_image_url+'?time='+new Date(row.update_time).getTime())" alt="上传的图片" width="240px" height="140px" v-if="row.id_card_front_image_url"/>
            <a-empty v-else/>
          </template>
        </vxe-column>
        <vxe-column field="id_card_back_image_url" title="身份证反面" sortable :min-width="250" show-overflow>
          <template #default="{ row }">
            <a-image :src="imageUrl(row.id_card_back_image_url+'?time='+new Date(row.update_time).getTime())" alt="上传的图片" width="240px" height="140px" v-if="row.id_card_back_image_url"/>
            <a-empty v-else/>
          </template>
        </vxe-column>
        <vxe-column field="wechat_image_url" title="微信收款码" sortable :min-width="250" show-overflow>
          <template #default="{ row }">
            <a-image :src="imageUrl(row.wechat_image_url+'?time='+new Date(row.update_time).getTime())" alt="上传的图片" width="240px" height="140px" v-if="row.wechat_image_url"/>
            <a-empty v-else/>
          </template>
        </vxe-column>
        <vxe-column field="alipay_image_url" title="支付宝收款码" sortable :min-width="250" show-overflow>
          <template #default="{ row }">
            <a-image :src="imageUrl(row.alipay_image_url+'?time='+new Date(row.update_time).getTime())" alt="上传的图片" width="240px" height="140px" v-if="row.alipay_image_url"/>
            <a-empty v-else/>
          </template>
        </vxe-column>
        <vxe-column field="bank_account_number" title="银行卡号" sortable :min-width="230" />
        <vxe-column field="bank_name" title="开户行" sortable :min-width="230" />
        <vxe-column field="paypal_id" title="Paypal账号" sortable :min-width="230" />
        <vxe-column field="state" title="状态" sortable :min-width="230">
          <template #default="{ row }">
            <a-tag :color="statusList[row.state].color">{{ statusList[row.state].label }}</a-tag>
          </template>
        </vxe-column>
        <vxe-column fixed="right" width="120" :showOverflow="false" title="操作">
          <template #default="{ row }">
            <a-link @click="show(row)">查看</a-link>
            <a-divider type="vertical" />
            <a-dropdown>
              <a>
                更多
                <icon icon="ant-design:down-outlined" :size="12" />
              </a>
              <template #overlay>
                <a-menu>
                  <a-menu-item>
                    <a-link @click="setState(row.id,3)">审核通过</a-link>
                  </a-menu-item>
                  <a-menu-item>
                    <a-link @click="setState(row.id,2)">驳回申请</a-link>
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </template>
        </vxe-column>
      </vxe-table>
      <vxe-pager size="medium" :loading="loading" :current-page="pagination.current" :page-size="pagination.size"
        :total="pagination.total" @page-change="handleTableChange" />
    </div>
    <CreativeDetailModal @register="registerCreativeDetail" />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue'
// import { $ref } from 'vue/macros'
import useTablePage from '/@/hooks/bootx/useTablePage'
import BQuery from '/@/components/Bootx/Query/BQuery.vue'
import { useMessage } from '/@/hooks/web/useMessage'
import { LIST, QueryField, STRING } from '/@/components/Bootx/Query/Query'
import { VxeTableInstance, VxeToolbarInstance, VxePager, VxeTable, VxeToolbar } from 'vxe-table'
import CreativeDetailModal from './CreativeDetailModal.vue';
import { useModal } from '/@/components/Modal';
import { LabeledValue } from 'ant-design-vue/lib/select'
import ALink from '/@/components/Link/Link.vue'
import { useGlobSetting } from '/@/hooks/setting'

const globSetting = useGlobSetting()

const [registerCreativeDetail, { openModal: openCreativeDetailModal }] = useModal();


import { page,updateStatus } from './CreaTive.api'

// 使用hooks
const { handleTableChange, pageQueryResHandel, sortChange, resetQueryParams, pagination, pages, sortParam, model, loading } =
  useTablePage(queryPage)
const { createMessage, createConfirm } = useMessage()

// 查询条件
const fields = computed(() => {
  return [
    { field: 'username', type: STRING, name: '用户名', placeholder: '请输入用户名' },
    { field: 'email', type: STRING, name: '邮箱', placeholder: '请输入邮箱' },
    { field: 'state', type: LIST, name: '状态', placeholder: '请选择审核状态', selectList: UserStatusList }
  ] as QueryField[]
})
//用户筛选状态
let UserStatusList = $ref<LabeledValue[]>([{key:"state", value:1, label:"未审核"}, {key:"state", value:2, label:"未通过"},{key:"state", value:3, label:"已通过"}])
//状态列表
const statusList = $ref([
  { label: '未上传', color:'red' },
  { label: '待审核', color:'red' },
  { label: '未通过', color:'red' },
  { label: '已审核', color:'green' },
])

const xTable = $ref<VxeTableInstance>()
const xToolbar = $ref<VxeToolbarInstance>()

const roleNameCfg = $ref<any>({ 1: "管理员", 2: "用户" });

//图片地址
const imageUrl = (param) => { 
  return globSetting.apiUrl+'/assets/user-images/'+param
}

onMounted(() => {
  initData()
  vxeBind()
  queryPage()
})
function vxeBind() {
  xTable?.connect(xToolbar as VxeToolbarInstance)
}

async function setState(id, state) {
  let req = await updateStatus(id,state)
  if (req.code == 0) {
    if(state == 3){
      createMessage.success('审核通过')
    }else{
      createMessage.success('驳回成功')
    }
    queryPage()
    return;
  }
  createMessage.error('操作失败')
}

/**
 * 初始化数据
 */
async function initData() {

}
/**
 * 分页查询
 */
function queryPage() {
  loading.value = true
  // 查询列表
  page({
    ...model.queryParam,
    ...pages,
    ...sortParam,
  }).then(({ data }) => {
    pageQueryResHandel(data)
  })
  // // 汇总数据
  // getTotalAmount({
  //   ...model.queryParam,
  // }).then(({ data }) => {
  //   totalAmount = data
  // })
  return Promise.resolve()
}

/**
 * 查看
 */
function show(record) {
  openCreativeDetailModal(true, record);
}

// /**
//  * 修改密码
//  */
// function changePassword(record) {
//   // console.log(record.id)
//   openModal(true, record)
  
//   // createMessage.success('待开发功能')
// }

/**
 * 显示样式优化
 */
function cellStyle({ row, column }) {
  if (column.field == 'status') {
    if (row.status == 'success') {
      return { color: 'green' }
    }
    if (row.status == 'fail') {
      return { color: 'red' }
    }
    if (row.status == 'progress') {
      return { color: 'orange' }
    }
    if (row.status == 'close') {
      return { color: 'gray' }
    }
    return { color: 'red' }
  }
}
</script>

<style lang="less" scoped></style>
