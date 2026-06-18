<template>
  <div>
    <div class="m-3 p-3 pt-5 bg-white">
      <b-query :query-params="model.queryParam" :fields="fields" @query="queryPage" @reset="resetQueryParams" />
    </div>
    <div class="m-3 p-3 bg-white">
      <vxe-toolbar ref="xToolbar" custom :refresh="{ queryMethod: queryPage }">
      </vxe-toolbar>
      <vxe-table row-id="id" ref="xTable" :cell-style="cellStyle" :data="pagination.records" :loading="loading"
        :sort-config="{ remote: true, trigger: 'cell' }" :row-config="{height: 150}" @sort-change="sortChange">
        <vxe-column type="seq" title="序号" width="60" />
        <vxe-column field="id" title="企业ID" :min-width="120">
        </vxe-column>
        <vxe-column field="name" title="企业名称" :min-width="200" />
        <vxe-column field="code" title="企业代码" :min-width="180" />
        <vxe-column field="description" title="企业描述" :min-width="200" />
        <vxe-column field="legal_person_name" title="法人代表" :min-width="120" />
        <vxe-column field="credit_code" title="统一社会信用代码" :min-width="180" />
        <vxe-column field="creator_email" title="创建者邮箱" :min-width="200" />
        <vxe-column field="business_license_url" title="营业执照" sortable :min-width="250" show-overflow>
          <template #default="{ row }">
            <a-image :src="imageUrl(row.business_license_url+'?time='+new Date(row.updated_at).getTime())" alt="营业执照" width="240px" height="140px" v-if="row.business_license_url"/>
            <a-empty v-else/>
          </template>
        </vxe-column>
        <vxe-column field="id_card_front_url" title="法人身份证正面" sortable :min-width="250" show-overflow>
          <template #default="{ row }">
            <a-image :src="imageUrl(row.id_card_front_url+'?time='+new Date(row.updated_at).getTime())" alt="法人身份证正面" width="240px" height="140px" v-if="row.id_card_front_url"/>
            <a-empty v-else/>
          </template>
        </vxe-column>
        <vxe-column field="id_card_back_url" title="法人身份证反面" sortable :min-width="250" show-overflow>
          <template #default="{ row }">
            <a-image :src="imageUrl(row.id_card_back_url+'?time='+new Date(row.updated_at).getTime())" alt="法人身份证反面" width="240px" height="140px" v-if="row.id_card_back_url"/>
            <a-empty v-else/>
          </template>
        </vxe-column>
        <vxe-column field="submit_date" title="提交时间" sortable :min-width="180" />
        <vxe-column field="audit_date" title="审核时间" sortable :min-width="180" />
        <vxe-column field="status" title="企业状态" :min-width="120">
          <template #default="{ row }">
            <Tag v-if="row.status == 0" color="orange">待审核</Tag>
            <Tag v-else-if="row.status == 1" color="green">已审核</Tag>
            <Tag v-else-if="row.status == 2" color="red">未通过</Tag>
            <Tag v-else color="default">未知</Tag>
          </template>
        </vxe-column>
        <vxe-column field="created_at" title="创建时间" sortable :min-width="180" />
        <vxe-column field="updated_at" title="更新时间" sortable :min-width="180" />
        <vxe-column fixed="right" width="200" :showOverflow="false" title="操作">
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
                  <a-menu-item v-if="row.status == 0">
                    <a-link @click="approveAudit(row)" style="color: green;">审核通过</a-link>
                  </a-menu-item>
                  <a-menu-item v-if="row.status == 0">
                    <a-link @click="rejectAudit(row)" style="color: orange;">驳回审核</a-link>
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
    <EnterpriseDetailModal @register="registerEnterpriseDetail" />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, h } from 'vue'
import useTablePage from '/@/hooks/bootx/useTablePage'
import BQuery from '/@/components/Bootx/Query/BQuery.vue'
import { useMessage } from '/@/hooks/web/useMessage'
import { LIST, QueryField, STRING } from '/@/components/Bootx/Query/Query'
import { VxeTableInstance, VxeToolbarInstance, VxePager, VxeTable, VxeToolbar } from 'vxe-table'
import EnterpriseDetailModal from './EnterpriseDetailModal.vue'
import { useModal } from '/@/components/Modal'
import ALink from '/@/components/Link/Link.vue'
import { Tag } from 'ant-design-vue'
import { useGlobSetting } from '/@/hooks/setting'

const globSetting = useGlobSetting()

const [registerEnterpriseDetail, { openModal: openEnterpriseDetailModal }] = useModal()

import { page, updateEnterpriseStatus, deleteEnterprise, auditEnterprise } from './RegEnterpriseList.api'

// 使用hooks
const { handleTableChange, pageQueryResHandel, sortChange, resetQueryParams, pagination, pages, sortParam, model, loading } =
  useTablePage(queryPage)
const { createMessage, createConfirm } = useMessage()

// 查询条件
const fields = computed(() => {
  return [
    { field: 'name', type: STRING, name: '企业名称', placeholder: '请输入企业名称' },
    { field: 'code', type: STRING, name: '企业代码', placeholder: '请输入企业代码' },
    { field: 'legal_person_name', type: STRING, name: '法人代表', placeholder: '请输入法人代表' },
    { field: 'credit_code', type: STRING, name: '统一社会信用代码', placeholder: '请输入统一社会信用代码' },
    { field: 'creator_name', type: STRING, name: '创建者', placeholder: '请输入创建者姓名' },
    { field: 'status', name: '企业状态', type: LIST, selectList: [
        { label: '待审核', value: "0" },
        { label: '已审核', value: "1" },
        { label: '未通过', value: "2" },
      ] },
  ] as QueryField[]
})

const xTable = $ref<VxeTableInstance>()
const xToolbar = $ref<VxeToolbarInstance>()

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
 * 查看企业详情（只读模式）
 */
function view(record) {
  openEnterpriseDetailModal(true, { ...record, readonly: true })
}

/**
 * 审核通过
 */
function approveAudit(record) {
  createConfirm({
    iconType: 'info',
    title: '审核确认',
    content: `确定要审核通过企业"${record.name}"吗？`,
    onOk: async () => {
      try {
        await auditEnterprise({
          id: record.id,
          status: 1,
          reject_reason: ''
        })
        createMessage.success('审核通过成功')
        queryPage()
      } catch (error) {
        createMessage.error('审核通过失败')
      }
    },
  })
}

/**
 * 驳回审核
 */
function rejectAudit(record) {
  let rejectReason = ''
  
  createConfirm({
    iconType: 'warning',
    title: '驳回审核',
    content: h('div', [
      h('p', `确定要驳回企业"${record.name}"的审核吗？`),
      h('p', { style: 'margin-top: 16px; margin-bottom: 8px;' }, '请输入驳回原因：'),
      h('textarea', {
        placeholder: '请输入驳回原因...',
        rows: 3,
        style: 'width: 100%; padding: 8px; border: 1px solid #d9d9d9; border-radius: 4px;',
        onInput: (e) => {
          rejectReason = e.target.value
        }
      })
    ]),
    onOk: async () => {
      if (!rejectReason.trim()) {
        createMessage.warning('请输入驳回原因')
        return Promise.reject()
      }
      try {
        await auditEnterprise({
          id: record.id,
          status: 2,
          reject_reason: rejectReason.trim()
        })
        createMessage.success('驳回审核成功')
        queryPage()
      } catch (error) {
        createMessage.error('驳回审核失败')
      }
    },
  })
}

/**
 * 更新企业状态
 */
function updateStatus(record, status) {
  const statusText = status == 0 ? '启用' : '禁用'
  createConfirm({
    iconType: 'warning',
    title: '操作确认',
    content: `确定要${statusText}企业"${record.name}"吗？`,
    onOk: async () => {
      try {
        await updateEnterpriseStatus({ id: record.id, status })
        createMessage.success(`${statusText}成功`)
        queryPage()
      } catch (error) {
        createMessage.error(`${statusText}失败`)
      }
    },
  })
}

/**
 * 删除企业
 */
function deleteRecord(record) {
  createConfirm({
    iconType: 'warning',
    title: '删除确认',
    content: `确定要删除企业"${record.name}"吗？此操作不可恢复！`,
    onOk: async () => {
      try {
        await deleteEnterprise(record.id)
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
  if (column.field == 'audit_status') {
    if (row.audit_status == 0) {
      return { color: 'orange' }
    }
    if (row.audit_status == 1) {
      return { color: 'green' }
    }
    if (row.audit_status == 2) {
      return { color: 'red' }
    }
  }
  if (column.field == 'status') {
    if (row.status == 0) {
      return { color: 'green' }
    }
    if (row.status == 1) {
      return { color: 'red' }
    }
  }
}
</script>

<style lang="less" scoped></style>