<template>
  <div>
    <div class="m-3 p-3 pt-5 bg-white">
      <b-query :query-params="model.queryParam" :fields="fields" @query="queryPage" @reset="resetQueryParams" />
    </div>
    <div class="m-3 p-3 bg-white">
      <vxe-toolbar ref="xToolbar" custom :refresh="{ queryMethod: queryPage }">
      </vxe-toolbar>
      <vxe-table
        row-id="id"
        ref="xTable"
        :cell-style="cellStyle"
        :data="pagination.records"
        :loading="loading"
        :sort-config="{ remote: true, trigger: 'cell' }"
        @sort-change="sortChange"
      >
        <vxe-column type="seq" title="序号" width="60" />
        <vxe-column field="user_id" title="用户ID" :min-width="80">
        </vxe-column>
        <vxe-column field="user_name" title="用户名" :min-width="150" />
        <vxe-column field="plugin_name" title="项目名称" :min-width="230" />
        <vxe-column field="description" title="描述" :min-width="220">
          <template #default="{ row }"> {{ row.description }} </template>
        </vxe-column>
        <vxe-column field="version" title="版本" :min-width="130" />
        <vxe-column field="platforms" title="平台" :min-width="80" />
        <vxe-column field="install_dir" title="安装目录" :min-width="230" />
        <vxe-column field="like_count" title="点赞" :min-width="80" />
        <vxe-column field="download" title="下载次数" :min-width="80" />
        <vxe-column field="project_zip_size" title="文件大小" :min-width="150" >
          <template #default="{ row }"> {{ formatFileSize(row.project_zip_size) }} </template>
        </vxe-column>
        <vxe-column field="create_time" title="创建时间" :min-width="230" sortable />
        <vxe-column field="state" title="审核状态" :min-width="100" >
          <template #default="{ row }">
            <Tag v-if="row.state == 0" color="red">{{ stateCfg[row.state] }} </Tag>
            <Tag v-if="row.state == 1" color="green">{{ stateCfg[row.state] }} </Tag>
          </template>
        </vxe-column>
        
        <vxe-column fixed="right" width="160" :showOverflow="false" title="操作">
          <template #default="{ row }">
            <a-link @click="showMoreDesc(row)">查看</a-link>
            <a-divider type="vertical" />
            <a-link @click="editMoreDesc(row)">编辑</a-link>
            <a-divider type="vertical" />
            <a-dropdown>
              <a>
                更多
                <icon icon="ant-design:down-outlined" :size="12" />
              </a>
              <template #overlay>
                <a-menu>
                  <a-menu-item v-if="row.state == 0">
                    <a-link @click="setState(row, 1)">审核通过</a-link>
                  </a-menu-item>
                  <a-menu-item v-if="row.state == 1">
                    <a-link @click="setState(row, 0)">取消审核</a-link>
                  </a-menu-item>
                  <a-menu-item>
                    <a-link @click="delProject(row)">删除</a-link>
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </template>
        </vxe-column>
      </vxe-table>
      <vxe-pager
        size="medium"
        :loading="loading"
        :current-page="pagination.current"
        :page-size="pagination.size"
        :total="pagination.total"
        @page-change="handleTableChange"
      />
    </div>
    <EditMoreDesc @register="register" @closeWindow="closeWindow"/>
    <MultipleRevisionsViewModal @register="registerView" />
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted } from 'vue'
  import { $ref } from 'vue/macros'
  import useTablePage from '/@/hooks/bootx/useTablePage'
  import BQuery from '/@/components/Bootx/Query/BQuery.vue'
  import { useMessage } from '/@/hooks/web/useMessage'
  import { LIST, QueryField, STRING } from '/@/components/Bootx/Query/Query'
  import { VxeTableInstance, VxeToolbarInstance, VxePager, VxeTable, VxeToolbar } from 'vxe-table'
  import ALink from '/@/components/Link/Link.vue'
  import { LabeledValue } from 'ant-design-vue/lib/select'
  import { Tag } from 'ant-design-vue'
  import { page,delAiProject,setProjectState,updateAIProjectFilter } from './MultipleRevisionsList.api'
  import { useModal } from '/@/components/Modal';
  import EditMoreDesc from './EditMoreDesc.vue'
  import MultipleRevisionsViewModal from './MultipleRevisionsViewModal.vue'

  const [register, { openModal }] = useModal();
  const [registerView, { openModal: openViewModal }] = useModal();

  // 使用hooks
  const { handleTableChange, pageQueryResHandel, sortChange, resetQueryParams, pagination, pages, sortParam, model, loading } =
    useTablePage(queryPage)
  const { createMessage, createConfirm } = useMessage()
 
  let projectStatusList = $ref<LabeledValue[]>([{key:"state", value:0, label:"未审核"}, {key:"state", value:1, label:"审核通过"}])
  let platform = $ref([{key:"platforms", value:'win', label:"Win"}, {key:"platforms", value:'macos', label:"MacOS"}, {key:"platforms", value:'linux', label:"Linux"}])

  // 查询条件
  const fields = computed(() => {
    return [
      { field: 'plugin_name', type: STRING, name: '项目名称', placeholder: '请输入项目名称' },
      { field: 'user_name', type: STRING, name: '用户名', placeholder: '请输入用户名' },
      { field: 'state', type: LIST, name: '状态', placeholder: '请选择审核状态', selectList: projectStatusList },
      { field:'platforms', type: LIST, name: '平台', placeholder: '请选择平台', selectList: platform },
    ] as QueryField[]
  })

  const xTable = $ref<VxeTableInstance>()
  const xToolbar = $ref<VxeToolbarInstance>()
  
  const stateCfg = $ref<any>({0:"未审核", 1:"审核通过"});

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

  const formatFileSize = (sizeInKB:number) => {
  if (sizeInKB >= 1024 * 1024) {
        // Convert to GB and round to 2 decimal places
        const sizeInGB = (sizeInKB / (1024 * 1024)).toFixed(2);
        if (Number.isInteger(parseFloat(sizeInGB))) {
            return `${parseInt(sizeInGB)}G`;
        } else {
            return `${sizeInGB}G`;
        }
  } else if (sizeInKB >= 1024) {
        // Convert to MB and round to 2 decimal places
        const sizeInMB = (sizeInKB / 1024).toFixed(2);
        if (Number.isInteger(parseFloat(sizeInMB))) {
            return `${parseInt(sizeInMB)}M`;
        } else {
            return `${sizeInMB}M`;
        }
    } else {
        // Show size in KB
        return `${sizeInKB}KB`;
    }
}

  /**
   * 查看
   */
  function showMoreDesc(record) {
    openViewModal(true, record)
  }

  /**
   * 编辑
   */
  function editMoreDesc(record) {
    openModal(true, record)
    // createMessage.success('待开发功能')
  }
  function closeWindow() {
    queryPage()
  }

  /**
   * 删除项目
   */
  function delProject(record){

    createConfirm({
      iconType: 'warning',
      title: '警告',
      content: `是否删除【${record.plugin_name}】该项目，删除将不可恢复！`,
      onOk: () => {
          delAiProject({id:record.id}).then(() => {
          createMessage.success('删除成功')
          queryPage()
        })
      },
    })
  }

  /**
   * 设置审核状态
   */
  function setState(record, state){
    setProjectState({id:record.id, state}).then(async (res) => {
      createMessage.success('修改成功')
      queryPage()
    })
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
