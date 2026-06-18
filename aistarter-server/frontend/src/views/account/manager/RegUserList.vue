<template>
  <div>
    <div class="m-3 p-3 pt-5 bg-white">
      <b-query :query-params="model.queryParam" :fields="fields" @query="queryPage" @reset="resetQueryParams" />
    </div>
    <div class="m-3 p-3 bg-white">
      <vxe-toolbar ref="xToolbar" custom :refresh="{ queryMethod: queryPage }">
      </vxe-toolbar>
      <vxe-table row-id="id" ref="xTable" :cell-style="cellStyle" :data="pagination.records" :loading="loading"
        :sort-config="{ remote: true, trigger: 'cell' }" @sort-change="sortChange">
        <vxe-column type="seq" title="序号" width="60" />
        <vxe-column field="id" title="用户ID" :min-width="120">
        </vxe-column>
        <vxe-column field="username" title="用户名" :min-width="230" />
        <vxe-column field="vip_type" title="会员类型" :min-width="120">
          <template #default="{ row }">
            <Tag v-if="row.vip_type == 1?row.vip_exp:false" color="green">年度会员</Tag>
            <Tag v-else-if="row.vip_type == 2" color="orange">永久会员</Tag>
            <Tag v-else color="default">普通用户</Tag>
          </template>
        </vxe-column>
        <vxe-column field="email" title="邮箱" :min-width="230" />
        <vxe-column field="id_role" title="角色" :min-width="120">
          <template #default="{ row }"> {{ roleNameCfg[row.id_role] }} </template>
        </vxe-column>
        <vxe-column field="created_at" title="创建时间" sortable :min-width="230" />
        <vxe-column field="updated_at" title="最后登录时间" sortable :min-width="230" />
        <vxe-column field="balance" title="余额" sortable :min-width="230">
          <template #default="{ row }">
            {{ (row.balance / 100).toFixed(2) }} 元
          </template>
        </vxe-column>
        <vxe-column fixed="right" width="160" :showOverflow="false" title="操作">
          <template #default="{ row }">
            <a-link @click="view(row)">查看</a-link>
            <a-divider type="vertical" />
            <a-link @click="edit(row)">编辑</a-link>
            <a-divider type="vertical" />
            <a-dropdown>
              <a>
                更多
                <icon icon="ant-design:down-outlined" :size="12" />
              </a>
              <template #overlay>
                <a-menu>
                  <a-menu-item>
                    <a-link @click="changePassword(row)">重置密码</a-link>
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
    <UserDetailModal @register="registerUserDetail" />
    <ChangePassword @register="register" />
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
import ChangePassword from './ChangePassword.vue';
import UserDetailModal from './UserDetailModal.vue';
import { useModal } from '/@/components/Modal';
import ALink from '/@/components/Link/Link.vue'
import { Tag } from 'ant-design-vue'

const [register, { openModal }] = useModal();
const [registerUserDetail, { openModal: openUserDetailModal }] = useModal();


import { getUserAllInfo, page } from './RegUser.api'

// 使用hooks
const { handleTableChange, pageQueryResHandel, sortChange, resetQueryParams, pagination, pages, sortParam, model, loading } =
  useTablePage(queryPage)
const { createMessage, createConfirm } = useMessage()

// 查询条件
const fields = computed(() => {
  return [
    { field: 'username', type: STRING, name: '用户名', placeholder: '请输入用户名' },
    { field: 'email', type: STRING, name: '邮箱', placeholder: '请输入邮箱' },
    { field: 'vip_type',  name: '会员类型', type: LIST, selectList: [
          { label: '普通用户', value: "0" },
          { label: '年度会员', value: "1" },
          { label: '永久会员', value: "2" },
        ] },
  ] as QueryField[]
})

const xTable = $ref<VxeTableInstance>()
const xToolbar = $ref<VxeToolbarInstance>()

const roleNameCfg = $ref<any>({ 1: "管理员", 2: "用户" });

onMounted(() => {
  initData()
  vxeBind()
  queryPage()
})
function vxeBind() {
  xTable?.connect(xToolbar as VxeToolbarInstance)
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
 * 查看（只读模式）
 */
function view(record) {
  openUserDetailModal(true, { ...record, readonly: true });
}

/**
 * 编辑（可编辑模式）
 */
function edit(record) {
  openUserDetailModal(true, { ...record, readonly: false });
}

/**
 * 修改密码
 */
function changePassword(record) {
  // console.log(record.id)
  openModal(true, record)
  
  // createMessage.success('待开发功能')
}

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
