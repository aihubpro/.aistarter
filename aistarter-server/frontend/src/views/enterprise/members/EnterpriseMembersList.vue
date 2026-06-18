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
        <vxe-column field="id" title="成员ID" :min-width="120">
        </vxe-column>
        <vxe-column field="entity_name" title="企业名称" :min-width="200" />
        <vxe-column field="user_name" title="用户名" :min-width="150" />
        <vxe-column field="user_email" title="邮箱" :min-width="200" />
        <vxe-column field="role" title="成员角色" :min-width="120">
          <template #default="{ row }">
            <Tag v-if="row.role == 0" color="red">创建者</Tag>
            <Tag v-else-if="row.role == 1" color="green">普通成员</Tag>
            <Tag v-else color="default">未知</Tag>
          </template>
        </vxe-column>
        <vxe-column field="join_status" title="成员状态" :min-width="120">
          <template #default="{ row }">
            <Tag v-if="row.join_status == 0" color="blue">申请加入</Tag>
            <Tag v-else-if="row.join_status == 1" color="green">正常</Tag>
            <Tag v-else-if="row.join_status == 2" color="red">申请退出</Tag>
            <Tag v-else color="default">未知</Tag>
          </template>
        </vxe-column>
        <vxe-column field="join_date" title="加入时间" sortable :min-width="180" />
        <vxe-column field="created_at" title="创建时间" sortable :min-width="180" />
        <vxe-column fixed="right" width="220" :showOverflow="false" title="操作">
          <template #default="{ row }">
            <a-link @click="view(row)">查看</a-link>
            <a-divider type="vertical" />
            <a-dropdown>
              <a>
                更多
                <icon icon="ant-design:down-outlined" :size="12" />
              </a>
              <template #overlay>
                <a-menu>
                  <a-menu-item v-if="row.join_status == 0">
                    <a-link @click="applyExit(row)" style="color: #52c41a;">同意加入</a-link>
                  </a-menu-item>
                  <a-menu-item v-if="row.join_status == 0">
                    <a-link @click="rejectJoin(row)" style="color: #52c41a;">驳回申请</a-link>
                  </a-menu-item>
                  <a-menu-item v-if="row.join_status == 2">
                    <a-link @click="applyExit(row)" style="color: #fa8c16;">同意退出</a-link>
                  </a-menu-item>
                  <a-menu-item v-if="row.join_status == 2">
                    <a-link @click="rejectExit(row)" style="color: red;">驳回申请</a-link>
                  </a-menu-item>
                  <a-menu-item>
                    <a-link @click="deleteRecord(row)" style="color: red;">删除</a-link>
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
    <MemberDetailModal @register="registerMemberDetail" />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import useTablePage from '/@/hooks/bootx/useTablePage'
import BQuery from '/@/components/Bootx/Query/BQuery.vue'
import { useMessage } from '/@/hooks/web/useMessage'
import { LIST, QueryField, STRING } from '/@/components/Bootx/Query/Query'
import { VxeTableInstance, VxeToolbarInstance, VxePager, VxeTable, VxeToolbar } from 'vxe-table'
import MemberDetailModal from './MemberDetailModal.vue'
import { useModal } from '/@/components/Modal'
import ALink from '/@/components/Link/Link.vue'
import { Tag } from 'ant-design-vue'

const [registerMemberDetail, { openModal: openMemberDetailModal }] = useModal()

import { page, deleteMember, rejectExitMember, approveJoinMember, approveExitMember } from './EnterpriseMembersList.api'

// 使用hooks
const { handleTableChange, pageQueryResHandel, sortChange, resetQueryParams, pagination, pages, sortParam, model, loading } =
  useTablePage(queryPage)
const { createMessage, createConfirm } = useMessage()

// 查询条件
const fields = computed(() => {
  return [
    { field: 'entity_name', type: STRING, name: '企业名称', placeholder: '请输入企业名称' },
    { field: 'user_name', type: STRING, name: '用户名', placeholder: '请输入用户名' },
    { field: 'user_email', type: STRING, name: '邮箱', placeholder: '请输入邮箱' },
    { field: 'role', name: '成员角色', type: LIST, selectList: [
        { label: '创建者', value: "0" },
        { label: '普通成员', value: "1" },
      ] },
    { field: 'join_status', name: '成员状态', type: LIST, selectList: [
        { label: '申请加入', value: "0" },
        { label: '正常', value: "1" },
        { label: '申请退出', value: "2" },
      ] },
  ] as QueryField[]
})

const xTable = $ref<VxeTableInstance>()
const xToolbar = $ref<VxeToolbarInstance>()

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
  page({
    ...model.queryParam,
    ...pages,
    ...sortParam,
  }).then(({ data }) => {
    pageQueryResHandel(data)
  })
  return Promise.resolve()
}

/**
 * 查看成员详情（只读模式）
 */
function view(record) {
  openMemberDetailModal(true, { ...record, readonly: true })
}

/**
 * 更新成员状态
 */
// function updateStatus(record, status) {
//   const statusText = status == 1 ? '启用' : '禁用'
//   createConfirm({
//     iconType: 'warning',
//     title: '操作确认',
//     content: `确定要${statusText}成员"${record.user_name}"吗？`,
//     onOk: async () => {
//       try {
//         await updateMemberStatus({ id: record.id, join_status: status })
//         createMessage.success(`${statusText}成功`)
//         queryPage()
//       } catch (error) {
//         createMessage.error(`${statusText}失败`)
//       }
//     },
//   })
// }

/**
 * 从企业中移除成员
 */
// function removeMemberFromEnterprise(record) {
//   createConfirm({
//     iconType: 'warning',
//     title: '移除确认',
//     content: `确定要从企业"${record.entity_name}"中移除成员"${record.user_name}"吗？`,
//     onOk: async () => {
//       try {
//         await removeMember({ id: record.id, entity_id: record.entity_id, user_id: record.user_id })
//         createMessage.success('移除成功')
//         queryPage()
//       } catch (error) {
//         createMessage.error('移除失败')
//       }
//     },
//   })
// }
/**
 * 成员申请退出企业驳回
 */
function rejectExit(record) {
  createConfirm({
    iconType: 'warning',
    title: '驳回确认',
    content: `确定要驳回成员"${record.user_name}"的退出申请吗？`,
    onOk: async () => {
      try {
        await rejectExitMember(record.id)
        createMessage.success('驳回成功')
        queryPage()
      } catch (error) {
        createMessage.error('驳回失败')
      }
    }
  })
}

/**
 * 处理成员申请（同意加入或同意退出）
 * join_status: 0-申请加入, 1-正常, 2-申请退出
 */
function applyExit(record) {
  if (record.join_status == 0) {
    // 同意加入
    createConfirm({
      iconType: 'info',
      title: '同意加入确认',
      content: `确定要同意成员"${record.user_name}"加入企业"${record.entity_name}"吗？`,
      onOk: async () => {
        try {
          await approveJoinMember(record.id)
          createMessage.success('同意加入成功')
          queryPage()
        } catch (error) {
          createMessage.error('同意加入失败')
        }
      }
    })
  } else if (record.join_status == 2) {
    // 同意退出
    createConfirm({
      iconType: 'warning',
      title: '同意退出确认',
      content: `确定要同意成员"${record.user_name}"退出企业"${record.entity_name}"吗？`,
      onOk: async () => {
        try {
          await approveExitMember(record.id)
          createMessage.success('同意退出成功')
          queryPage()
        } catch (error) {
          createMessage.error('同意退出失败')
        }
      }
    })
  }
}
/**
 * 驳回申请加入
 */
function rejectJoin(record) {
  createConfirm({
    iconType: 'warning',
    title: '驳回加入确认',
    content: `确定要驳回成员"${record.user_name}"加入企业"${record.entity_name}"吗？`,
    onOk: async () => {
      try {
        await deleteMember(record.id)
        createMessage.success('驳回成功')
        queryPage()
      } catch (error) {
        createMessage.error('驳回失败')
      }
    }
  })
}
/**
 * 删除成员记录
 */
function deleteRecord(record) {
  createConfirm({
    iconType: 'warning',
    title: '删除确认',
    content: `确定要删除成员"${record.user_name}"吗？此操作不可恢复！`,
    onOk: async () => {
      try {
        await deleteMember(record.id)
        createMessage.success('删除成功')
        queryPage()
      } catch (error) {
        createMessage.error('删除失败')
      }
    },
  })
}

/**
 * 显示样式优化
 */
function cellStyle({ row, column }) {
  if (column.field == 'join_status') {
    if (row.join_status == 1) {
      return { color: 'green' }
    }
    if (row.join_status == 0) {
      return { color: 'red' }
    }
  }
  if (column.field == 'role') {
    if (row.role == 0) {
      return { color: 'red' }
    }
    if (row.role == 1) {
      return { color: 'green' }
    }
  }
}
</script>

<style lang="less" scoped></style>