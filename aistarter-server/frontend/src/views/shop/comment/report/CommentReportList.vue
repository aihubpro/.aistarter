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
        <vxe-column field="user_id" title="举报ID" :min-width="80" />
        <vxe-column field="comment_id" title="评论ID" :min-width="80" />
        <vxe-column field="reporter_name" title="举报人" :min-width="120" />
        <vxe-column field="comment_content" title="评论内容" :min-width="200">
          <template #default="{ row }">
            <span v-if="row.comment_content && row.comment_content.trim()">
              {{ row.comment_content }}
            </span>
            <span v-else class="text-gray-400 italic">
              [评论已删除]
            </span>
          </template>
        </vxe-column>
        <vxe-column field="reason" title="举报原因" :min-width="120" />
        <vxe-column field="description" title="详细描述" :min-width="200" />
        <vxe-column field="status" title="状态" :min-width="100">
          <template #default="{ row }">
            <a-tag :color="getStatusColor(row.status)">
              {{ getStatusText(row.status) }}
            </a-tag>
          </template>
        </vxe-column>
        <vxe-column field="create_time" title="举报时间" sortable :min-width="160" />
        <vxe-column field="admin_name" title="处理人" :min-width="120" />
        <vxe-column field="handle_time" title="处理时间" sortable :min-width="160" />
        <vxe-column fixed="right" width="120" :showOverflow="false" title="操作">
          <template #default="{ row }">
            <a-link @click="viewDetail(row)">查看</a-link>
            <a-divider type="vertical" />
            <a-dropdown v-if="row.status === 0">
              <a>
                处理
                <icon icon="ant-design:down-outlined" :size="12" />
              </a>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="handleReport(row, 1)">
                    <a-link>删除评论</a-link>
                  </a-menu-item>
                  <a-menu-item @click="handleReport(row, 2)">
                    <a-link>驳回举报</a-link>
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
    <CommentReportViewModal @register="registerView" />
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
import ALink from '/@/components/Link/Link.vue'
import ATag from 'ant-design-vue/es/tag'
import { CommentReport, handle, page } from './CommentReport.api'
import { useModal } from '/@/components/Modal';
import CommentReportViewModal from './CommentReportViewModal.vue'

// 使用hooks
const { handleTableChange, pageQueryResHandel, sortChange, resetQueryParams, pagination, pages, sortParam, model, loading } =
  useTablePage(queryPage)
const { createMessage, createConfirm } = useMessage()

const [registerView, { openModal: openViewModal }] = useModal();

let stateDate = $ref([{key:"status", value:0, label:"待处理"}, {key:"status", value: 1, label:"已处理"}, {key:"status", value: 2, label:"已驳回"}])


// 查询条件
const fields = computed(() => {
  return [
    { field: 'reporter_id', type: STRING, name: '举报人ID', placeholder: '请输入举报人ID' },
    { field: 'reason', type: STRING, name: '举报原因', placeholder: '请输入举报原因' },
    { field: 'status', type: LIST, name: '状态', placeholder: '请选择状态', selectList: stateDate }
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
  // 查询列表
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
 * 获取状态颜色
 */
function getStatusColor(status: number) {
  switch (status) {
    case 0:
      return 'orange'
    case 1:
      return 'green'
    case 2:
      return 'red'
    default:
      return 'default'
  }
}

/**
 * 获取状态文本
 */
function getStatusText(status: number) {
  switch (status) {
    case 0:
      return '待处理'
    case 1:
      return '已处理'
    case 2:
      return '已驳回'
    default:
      return '未知'
  }
}

/**
 * 查看详情
 */
function viewDetail(row: CommentReport) {
  openViewModal(true, row)
}

/**
 * 处理举报
 */
function handleReport(row: CommentReport, status: number) {
  const actionText = status === 1 ? '删除评论' : '驳回举报'
  createConfirm({
    title: '确认操作',
    content: `确定要${actionText}吗？`,
    iconType: 'warning',
    onOk: async () => {
      try {
        await handle({ report_id: row.id!, action: status })
        createMessage.success(`${actionText}成功`)
        queryPage()
      } catch (error) {
        createMessage.error(`${actionText}失败`)
      }
    }
  })
}

/**
 * 显示样式优化
 */
function cellStyle({ row, column }) {
  if (column.field == 'status') {
    if (row.status == 0) {
      return { color: 'orange' }
    }
    if (row.status == 1) {
      return { color: 'green' }
    }
    if (row.status == 2) {
      return { color: 'red' }
    }
    return { color: 'gray' }
  }
}
</script>

<style lang="less" scoped></style>
