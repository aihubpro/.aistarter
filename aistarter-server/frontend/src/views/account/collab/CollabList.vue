<template>
    <div>
      <div class="m-3 p-3 pt-5 bg-white">
        <b-query :query-params="model.queryParam" :fields="fields" @query="queryPage" @reset="resetQueryParams" />
      </div>
      <div class="m-3 p-3 bg-white">
        <vxe-toolbar ref="xToolbar" custom :refresh="{ queryMethod: queryPage }">
          <template #buttons>
            <a-button type="primary" @click="editMoreDesc({isadd:true})">
              <template #icon><plus-outlined /></template>
              新建共创者
            </a-button>
          </template>
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
          <vxe-column field="company_name" title="公司名" :min-width="80">
          </vxe-column>
          <vxe-column field="software_name" title="软件名" :min-width="150" />
          <vxe-column field="domain_name" title="域名" :min-width="230" />
          <vxe-column field="name" title="联系人" :min-width="220" />
          <vxe-column field="email" title="邮箱" :min-width="130" />
          <vxe-column field="phone" title="手机" :min-width="80" />
          <vxe-column field="coll_type" title="共创者类型" :min-width="80" >
            <template #default="{ row }">
              <Tag color="green">{{ collCfg[row.coll_type] }} </Tag>
            </template>
          </vxe-column>
          <vxe-column field="create_time" title="创建时间" :min-width="150" />
          <vxe-column field="expiry_time" title="到期时间" :min-width="150" />
          <vxe-column field="state" title="服务器状态" :min-width="150" >
            <template #default="{ row }">
              <Tag v-if="row.state == 0" color="green">{{ stateCfg[row.state] }} </Tag>
              <Tag v-if="row.state == 1" color="red">{{ stateCfg[row.state] }} </Tag>
              <Tag v-if="row.state == 2" color="blue">{{ stateCfg[row.state] }} </Tag>
            </template>
          </vxe-column>
          <vxe-column field="server_status" title="共创者状态" :min-width="150" >
            <template #default="{ row }">
              <Tag v-if="row.server_status == 0" color="green">正常 </Tag>
              <Tag v-if="row.server_status == 1" color="red">过期</Tag>
              <Tag v-if="row.server_status == 2" color="red">异常</Tag>
              <Tag v-if="row.server_status == 3" color="red">封禁</Tag>
              <Tag v-if="row.server_status == 4" color="red">替换</Tag>
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
                    <!--
                    <a-menu-item v-if="row.state == 0">
                      <a-link @click="setState(row, 1)">封禁</a-link>
                    </a-menu-item>
                    <a-menu-item v-if="row.state == 1">
                      <a-link @click="setState(row, 0)">解封</a-link>
                    </a-menu-item>
                    -->
                    <a-menu-item>
                      <a-link @click="updateServerFileInfo(row)">更新文件</a-link>
                    </a-menu-item>
                    <a-menu-item>
                      <a-link @click="getServerFileInfo(row)">验证文件</a-link>
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
      <CollabViewModal @register="registerView" />
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
    import { page,delCollab,updateCollabState,getCollabLicense,updateCollabLicense } from './Collab.api'
    import { useModal } from '/@/components/Modal';
    import EditMoreDesc from './EditMoreDesc.vue'
    import CollabViewModal from './CollabViewModal.vue'
    import { PlusOutlined } from '@ant-design/icons-vue'
    import axios from 'axios';
    const [register, { openModal }] = useModal();
    const [registerView, { openModal: openViewModal }] = useModal();
  
    // 使用hooks
    const { handleTableChange, pageQueryResHandel, sortChange, resetQueryParams, pagination, pages, sortParam, model, loading } =
      useTablePage(queryPage)
    const { createMessage, createConfirm } = useMessage()
   
    let projectStatusList = $ref<LabeledValue[]>([{key:"state", value:0, label:"正常"}, {key:"state", value:1, label:"永久封禁"},{key:"state", value:2, label:"待更新"}])
  
    // 查询条件
    const fields = computed(() => {
      return [
        { field: 'software_name', type: STRING, name: '软件名称', placeholder: '请输入软件名称' },
        { field: 'name', type: STRING, name: '联系人', placeholder: '请输入联系人' },
        { field: 'state', type: LIST, name: '状态', placeholder: '请选择共创者状态', selectList: projectStatusList }
      ] as QueryField[]
    })
  
    const xTable = $ref<VxeTableInstance>()
    const xToolbar = $ref<VxeToolbarInstance>()
    
    const collCfg = $ref<any>({1:"年度", 2:"永久"});
    const stateCfg = $ref<any>({0:"正常", 1:"永久封禁",2:"待更新"});
  
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
        content: `是否删除【${record.name}】该共创者，删除将不可恢复！`,
        onOk: () => {
          delCollab({id:record.id}).then(() => {
            createMessage.success('删除成功')
            queryPage()
          })
        },
      })
    }
    /**
     *  获取共创者服务器文件信息
     */
    async function getServerFileInfo(record){
        console.log(record)
        const result  = await getCollabLicense(record)
        console.log(result,'result')
        if(result.msg != 'success'){
          createMessage.error('文件异常')
          //修改状态
          if(record.server_status < 3){ //如果是封禁状态，或者是替换状态则不修改
            //修改状态为2 异常
            updateCollabState({id:record.id,server_status:2}).then(() => {
              queryPage()
            })
          }
          return;
        }
        createMessage.success('文件正常')
        console.log(result);
    }
  
    /**
     * 更新共创者服务器文件信息
     */
    async function updateServerFileInfo(record){
      console.log(record)
      const coconfig = {
        "domain_name": record.domain_name,
        "company_name": record.company_name,
        "software_name": record.software_name,
        "expiry_time": record.expiry_time,
        "state": record.state,
        "coll_type": record.coll_type,
        "machine_id": record.machine_id
      }
      const req = await updateCollabLicense(record,coconfig);
      if(req.code == 0){
        createMessage.success('更新成功')
        return;
      }
      createMessage.error('更新失败')
      //将加密后的数据发送到共创者服务器

    }
  
    /**
     * 显示样式优化
     */
    function cellStyle({ row, column }) {
      // 如果是封禁状态，整行背景标红
      if (row.server_status == 3) {
        return { backgroundColor: '#fff1f0' }
      }
      // 如果是异常状态，整行背景标黄
      if (row.server_status == 2) {
        return { backgroundColor: '#fffbe6' }
      }
      // 如果是更新状态，整行背景标绿
      if (row.state == 2) {
        return { backgroundColor: '#a1ddb9' }
      }
      // 如果是过期状态，整行背景标蓝
      if (row.server_status == 1) {
        return { backgroundColor: '#e6f7ff' }
      }
      // 如果是过期状态，整行背景标蓝
      if (row.is_expired == 1) {
        return { backgroundColor: '#e6f7ff' }
      }
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
  