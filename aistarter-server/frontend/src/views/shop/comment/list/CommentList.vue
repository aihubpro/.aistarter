<template>
  <div>
    <div class="m-3 p-3 pt-5 bg-white">
      <b-query :query-params="model.queryParam" :fields="fields" @query="queryPage" @reset="resetQueryParams" />
    </div>
    <div class="m-3 p-3 bg-white">
      <vxe-toolbar ref="xToolbar" custom :refresh="{ queryMethod: queryPage }">
      </vxe-toolbar>
      <vxe-table row-id="id" ref="xTable" :cell-style="cellStyle" :data="pagination.records" :column-config="{ resizable: true }" :loading="loading"
        :sort-config="{ remote: true, trigger: 'cell' }" @sort-change="sortChange" :tree-config="{ transform: true,accordion: true }">
        <vxe-column type="seq" title="序号" width="60" tree-node/>
        <vxe-column field="project_id" title="项目ID" :min-width="120"/>
        <vxe-column field="project_name" title="项目名称" :min-width="120"/>
        <vxe-column field="project_type" title="项目类型" :min-width="230" >
          <template #default="{ row }">
            <a-tag :color="projectTypeList.find(item => item.value === row.project_type)?.color">{{ projectTypeList.find(item => item.value === row.project_type)?.label }}</a-tag>
          </template>
        </vxe-column>
        <vxe-column field="content" title="评论内容" :min-width="230" />
        <vxe-column field="user_id" title="发布人ID" :min-width="230" />
        <vxe-column field="publisher_name" title="发布人" :min-width="230" />
        <vxe-column field="likes" title="点赞数" :min-width="230" />
        <vxe-column field="report_count" title="举报数" :min-width="230" />
        <vxe-column field="create_time" title="创建时间" sortable :min-width="230" />
        <vxe-column fixed="right" width="120" :showOverflow="false" title="操作">
          <template #default="{ row }">
            <a-link @click="showCommentDetail(row)">查看</a-link>
            <a-divider type="vertical" />
            <a-dropdown>
              <a>
                更多
                <icon icon="ant-design:down-outlined" :size="12" />
              </a>
              <template #overlay>
                <a-menu>
                  <a-menu-item>
                    <a-link @click="handleBan(row, 7)">禁言7天</a-link>
                  </a-menu-item>
                  <a-menu-item>
                    <a-link @click="handleBan(row, 15)">禁言15天</a-link>
                  </a-menu-item>
                  <a-menu-item>
                    <a-link @click="handleBan(row, 30)">禁言30天</a-link>
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
    <CommentViewModal @register="registerView" />
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
import dayjs from 'dayjs';
 const { createMessage, createConfirm } = useMessage()

const [registerView, { openModal: openViewModal }] = useModal();


import { getUserAllInfo, page,updateStatus } from './Comment.api'
import { useModal } from '/@/components/Modal';
import CommentViewModal from './CommentViewModal.vue'

// 使用hooks
const { handleTableChange, pageQueryResHandel, sortChange, resetQueryParams, pagination, pages, sortParam, model, loading } =
  useTablePage(queryPage)

let projectTypeList = $ref([{key:"project_type", value:'0', label:"AI应用",color:'blue'}, {key:"project_type", value:'1', label:"模型",color:'green'}, {key:"project_type", value:'2', label:"插件",color:'purple'}, {key:"project_type", value:'3', label:"工作流",color:'red'}])

// 查询条件
const fields = computed(() => {
  return [
    { field: 'project_id', type: STRING, name: '项目ID', placeholder: '请输入项目ID' },
    { field: 'project_name', type: STRING, name: '项目名称', placeholder: '请输入项目名称' },
    { field: 'project_type', type: LIST, name: '项目类型', placeholder: '请输入项目类型', selectList: projectTypeList },
    { field: 'user_id', type: STRING, name: '发布人ID', placeholder: '请输入发布人ID' },
    { field: 'publisher_name', type: STRING, name: '发布人', placeholder: '请输入发布人' },
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
 * 查看评论详情
 */
function showCommentDetail(record) {
  openViewModal(true, record)
}

function handleBan(row:any,num:number) {
  //取num 计算天数后，赋值给ban_expire_time
  let ban_expire_time = dayjs().add(num, 'day').format('YYYY-MM-DD HH:mm:ss')
  let data = {
    id: row.user_id,
    status:1,
    ban_expire_time: ban_expire_time
  }
  updateStatus(data).then(res => {
    createMessage.success(`用户${row.publisher_name}禁言成功，禁言时间:${ban_expire_time}`);
  })
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
