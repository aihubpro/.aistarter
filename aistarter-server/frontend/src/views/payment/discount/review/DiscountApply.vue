<template>
  <div>
    <div class="m-3 p-3 pt-5 bg-white">
      <b-query :query-params="model.queryParam" :fields="fields" @query="queryPage" @reset="resetQueryParams" />
    </div>
    <div class="m-3 p-3 bg-white">
      <vxe-toolbar ref="xToolbar" custom :refresh="{ queryMethod: queryPage }">
        <template #buttons>
          <span style="font-size: 18px">已发放优惠: {{ totalDiscount }}</span>
        </template>
      </vxe-toolbar>
      <vxe-table
        border
        show-overflow
        keep-source
        row-id="id"
        ref="tableRef"
        :cell-style="cellStyle"
        :data="pagination.records"
        :loading="loading"
        :sort-config="{ remote: true, trigger: 'cell' }"
        :edit-config="{trigger: 'dblclick', mode: 'cell', showStatus: true}"
        @sort-change="sortChange"
      >
        <vxe-column type="seq" title="序号" width="60" />
        <vxe-column field="applicant_id" title="申请人ID" :min-width="80" />
        <vxe-column field="applicant_name" title="申请人名称" :min-width="120" />
        <vxe-column field="apply_count" title="期望申请数量" :min-width="80" />
        <vxe-column field="issued_count" :edit-render="{name: 'input'}" title="实际发放数量" :min-width="80" />
        <vxe-column field="review_remark" :edit-render="{name: 'input'}" title="备注" :min-width="120" />
        <vxe-column field="reviewer_id" title="审核人ID" :min-width="80" />
        <vxe-column field="reviewer_name" title="审核人名称" :min-width="120" />
        <vxe-column field="reviewed_at" title="审核时间" :min-width="120" />
        <vxe-column field="created_at" title="创建时间" :min-width="120" />
        <vxe-column field="status" title="审核状态" :min-width="120">
          <template #default="{ row }">
            <Tag v-if="row.status == 0" color="default">未审核</Tag>
            <Tag v-if="row.status == 1" color="green">已通过</Tag>
            <Tag v-if="row.status == 2" color="red">已拒绝</Tag>
          </template>
        </vxe-column>
        <vxe-column fixed="right" width="120" :showOverflow="false" title="操作">
          <template #default="{ row }">
            <a-link v-if="hasUpdateStatus(row)" @click="saveUpdateEvent(row)">保存</a-link>
            <a-dropdown v-if="!hasUpdateStatus(row)">
              <a>
                更多
                <icon icon="ant-design:down-outlined" :size="12" />
              </a>
              <template #overlay>
                <a-menu>
                  <a-menu-item v-if="row.status == 0">
                    <a-link @click="setState(row,1)">审核通过</a-link>
                  </a-menu-item>
                  <a-menu-item v-if="row.status == 0">
                    <a-link @click="setState(row,2)">拒绝</a-link>
                  </a-menu-item>
                  <a-menu-item>
                    <a-link @click="delDate(row.id)">删除</a-link>
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
      <!-- <pay-order-info ref="payOrderInfo" /> -->
      <!-- <refund-model ref="refundModel" @ok="queryPage" /> -->
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted,ref } from 'vue'
  import { $ref } from 'vue/macros'
  import { page,updateStatus,remove,saveList } from './DiscountApply.api'
  import useTablePage from '/@/hooks/bootx/useTablePage'
  // import PayOrderInfo from './PayOrderInfo.vue'
  // import RefundModel from './RefundModel.vue'
  import BQuery from '/@/components/Bootx/Query/BQuery.vue'
  import { useMessage } from '/@/hooks/web/useMessage'
  import { LIST, QueryField, STRING, DATE, NUMBER } from '/@/components/Bootx/Query/Query'
  // import { useDict } from '/@/hooks/bootx/useDict'
  import { VxeTableInstance, VxeToolbarInstance, VxePager, VxeTable, VxeToolbar } from 'vxe-table'
  import type { VxeTablePropTypes } from 'vxe-table'
  import ALink from '/@/components/Link/Link.vue'
  import { payStatus } from '/@/enums/payment/PayStatus'
  import { Tag } from 'ant-design-vue'

  // 使用hooks
  const { handleTableChange, pageQueryResHandel, sortChange, resetQueryParams, pagination, pages, sortParam, model, loading } =
    useTablePage(queryPage)
  const { createMessage, createConfirm } = useMessage()

  const tableRef = ref<VxeTableInstance<any>>()

  const hasUpdateStatus = (row: any) => {
    const $table = tableRef.value
    if ($table) {
      return $table.isUpdateByRow(row)
    }
  }
  const saveUpdateEvent = (row: any) => {
    const $table = tableRef.value
    if ($table) {
      if ($table.isUpdateByRow(row)) {
        saveList(row).then(() => {
          $table.reloadRow(row, {})
          createMessage.success('保存成功！')
        })
      } else {
        createMessage.error('当前行没有修改数据！')
      }
    }
  }
  let statusData = $ref({
    type: 'success',
    title:'',
    content:''
  })
  function setState(record, status) {
    statusData.type = 'warning'
    statusData.title = '警告'
    switch (status) {
      case 1:
        statusData.content = `是否审核通过【${record.applicant_name}】的优惠券申请`
        break;
      case 2:
        // if(!record.review_remark){
        //   createMessage.error('拒绝必须填写备注，用于记录拒绝原因')
        //   return
        // }
        statusData.content = `是否拒绝【${record.applicant_name}】的优惠券申请`
        break;
    }
    createConfirm({
      iconType: statusData.type as 'success' | 'warning' | 'error' | 'info',
      title: statusData.title,
      content: statusData.content,
      onOk: () => {
        loading.value = true
        updateStatus(record, status).then(() => {
          createMessage.success('操作成功')
          queryPage()
        })
      },
    })
  }
  function delDate(id) {
    createConfirm({
      iconType: 'warning',
      title: '警告',
      content: '是否删除该记录',
      onOk: () => {
        loading.value = true
        remove(id).then(() => {
          createMessage.success('删除成功')
          queryPage()
        })
      },
    })
  }

  // 查询条件
  const fields = computed(() => {
    return [
      { field: 'applicant_id', type: NUMBER, name: '申请人ID', placeholder: '请输入申请人ID' },
      { field: 'applicant_name', type: STRING, name: '申请人名称', placeholder: '请输入申请人名称' },
      { field: 'reviewer_id', type: NUMBER, name: '审核人ID', placeholder: '请输入审核人ID' },
      { field: 'reviewer_name', type: STRING, name: '审核人名称', placeholder: '请输入审核人名称' },
      { field: 'reviewed_at', type: DATE, name: '审核时间', placeholder: '选择日期' },
      { field: 'created_at', type: DATE, name: '创建日期', placeholder: '选择日期' },
      { field: 'status', name: '审核状态', type: LIST, selectList: [
          { label: '未审核', value: 0 },
          { label: '已审核', value: 1 },
          { label: '已拒绝', value: 2 }
        ] },
    ] as QueryField[]
  })

  const xTable = $ref<VxeTableInstance>()
  const xToolbar = $ref<VxeToolbarInstance>()
  // const payOrderInfo = $ref<any>()
  // const refundModel = $ref<any>()
  let totalDiscount = $ref<number>(0)

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
    // channelList = await dictDropDown('PayChannel')
    // methodList = await dictDropDown('PayMethod')
    // payStatusList = await dictDropDown('PayStatus')
    // payRefundStatusList = await dictDropDown('PayOrderRefundStatus')
    // payAllocStatusList = await dictDropDown('PayOrderAllocStatus')
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

      totalDiscount = (data as any).totalDiscount
    })
    return Promise.resolve()
  }

  // /**
  //  * 查看
  //  */
  // function show(record) {
  //   payOrderInfo.init(record.orderNo)
  // }

  /**
   * 同步信息
   */
  function sync(record) {
    createConfirm({
      iconType: 'warning',
      title: '警告',
      content: '是否同步支付信息',
      onOk: () => {
        loading.value = true
        createMessage.success('同步成功')
        queryPage()
      },
    })
  }
  /**
   * 关闭支付
   */
  function closeOrder(record) {
    createConfirm({
      iconType: 'warning',
      title: '警告',
      content: '是否关闭支付订单',
      onOk: () => {
        createMessage.success('关闭成功')
        queryPage()
      },
    })
  }
  /**
   * 退款
   */
  // function refund(record) {
  //   refundModel.init(record.id)
  // }

  /**
   * 触发分账
   */
  // function allocation(record) {
  //   createConfirm({
  //     iconType: 'warning',
  //     title: '警告',
  //     content: '是否触发该订单的分账操作',
  //     onOk: () => {
  //       allocationByOrderNo(record.orderNo).then(() => {
  //         createMessage.success('分账请求已发送')
  //         queryPage()
  //       })
  //     },
  //   })
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
