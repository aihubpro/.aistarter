<template>
  <div>
    <div class="m-3 p-3 pt-5 bg-white">
      <b-query :query-params="model.queryParam" :fields="fields" @query="queryPage" @reset="resetQueryParams" />
    </div>
    <div class="m-3 p-3 bg-white">
      <vxe-toolbar ref="xToolbar" custom :refresh="{ queryMethod: queryPage }">
        <template #buttons>
          <div class="flex items-center justify-between w-full">
            <span style="font-size: 18px">返现金额: {{ totalAmount ? (totalAmount / 100).toFixed(2) : 0 }}元</span>
            <vxe-button @click="openBatchEditModal(true)" class="mr-3" status="primary">批量修改</vxe-button>
          </div>
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
        :edit-config="{trigger: 'click', mode: 'row', autoClear: false, showStatus: true}"
        @sort-change="sortChange"
      >
        <vxe-column type="seq" title="序号" width="60" />
        <vxe-column field="code" title="优惠码" :min-width="80" />
        <vxe-column field="discount_type" title="优惠类型" :min-width="120" :edit-render="{}">
          <template v-slot="{ row }"><Tag color="green">{{ row.discount_type === 0 ? '金额' : '折扣' }}</Tag></template>
          <template #edit="scope">
            <vxe-select v-model="scope.row.discount_type">
              <vxe-option :value="0" label="金额" />
              <vxe-option :value="1" label="折扣" />
            </vxe-select>
          </template>
        </vxe-column>
        <vxe-column field="discount_value" :edit-render="{name: 'input'}" title="优惠数值" :min-width="80" />
        <vxe-column field="min_amount" :edit-render="{name: 'input'}" title="最低金额" :min-width="120" sortable>
          <template #default="{ row }"> {{ row.min_amount ? (row.min_amount / 100).toFixed(2) : 0 }} </template>
        </vxe-column>
        <vxe-column field="cashback_amount" :edit-render="{name: 'input'}" title="推广奖励" :min-width="120" sortable>
          <template #default="{ row }"> {{ row.cashback_amount ? (row.cashback_amount / 100).toFixed(2) : 0 }} </template>
        </vxe-column>
        <vxe-column field="valid_from" :edit-render="{}" title="生效时间" :min-width="230">
          <template #edit="scope">
            <vxe-input type="datetime" v-model="scope.row.valid_from"></vxe-input>
          </template>
        </vxe-column>
        <vxe-column field="valid_to" :edit-render="{}" title="失效时间" :min-width="230">
          <template #edit="scope">
            <vxe-input type="datetime" v-model="scope.row.valid_to"></vxe-input>
          </template>
        </vxe-column>
        <vxe-column field="used" title="使用状态" :min-width="120">
          <template #default="{ row }">
            <Tag v-if="row.used == 0" color="default">未使用</Tag>
            <Tag v-if="row.used == 1" color="green">已使用</Tag>
          </template>
        </vxe-column>
        <vxe-column field="usage_time" title="使用时间" :min-width="80" />
        <vxe-column field="applicant_id" title="申请者ID" :min-width="80" />
        <vxe-column field="user_id" title="使用者ID" :min-width="80" />
        <vxe-column field="user_name" title="使用者名称" :min-width="80" />
        <vxe-column field="remark" :edit-render="{name: 'input'}" title="备注" :min-width="80" />
        <vxe-column field="create_time" title="创建时间" sortable :min-width="230" />
        <vxe-column fixed="right" width="220" :showOverflow="false" title="操作">
          <template #default="{ row }">
            <template v-if="isActiveStatus(row)">
              <vxe-button @click="saveUpdateEvent(row)" status="success">保存</vxe-button>
              <vxe-button @click="cancelRowEvent(row)" status="warning">取消</vxe-button>
            </template>
            <template v-else>
              <vxe-button @click="editRowEvent(row)" status="primary">编辑</vxe-button>
              <vxe-button v-if="hasUpdateStatus(row)" @click="saveUpdateEvent(row)" status="success">保存</vxe-button>
              <vxe-button v-if="hasUpdateStatus(row)" @click="cancelRowEvent(row)" status="warning">取消</vxe-button>
            </template>
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
      <!-- <pay-order-info ref="payOrderInfo" />
      <refund-model ref="refundModel" @ok="queryPage" /> -->
    </div>
    <BatchEditModal @register="registerBatchEdit" @success="handleBatchEditSuccess" />
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted,ref } from 'vue'
  import { $ref } from 'vue/macros'
  import { close, page, syncByOrderNo,saveList } from './Discount.api'
  import { useModal } from '/@/components/Modal';
  import BatchEditModal from './BatchEditModal.vue'
  import useTablePage from '/@/hooks/bootx/useTablePage'
  // import PayOrderInfo from './PayOrderInfo.vue'
  // import RefundModel from './RefundModel.vue'
  import BQuery from '/@/components/Bootx/Query/BQuery.vue'
  import { useMessage } from '/@/hooks/web/useMessage'
  import { LIST, QueryField, STRING, DATE, NUMBER } from '/@/components/Bootx/Query/Query'
  // import { useDict } from '/@/hooks/bootx/useDict'
  import { VxeTableInstance, VxeToolbarInstance, VxePager, VxeTable, VxeToolbar } from 'vxe-table'
  import ALink from '/@/components/Link/Link.vue'
  import { payStatus } from '/@/enums/payment/PayStatus'
  import { Tag } from 'ant-design-vue'

  // 使用hooks
  const { handleTableChange, pageQueryResHandel, sortChange, resetQueryParams, pagination, pages, sortParam, model, loading } =
    useTablePage(queryPage)
  const { createMessage, createConfirm } = useMessage()

  const [registerBatchEdit, { openModal: openBatchEditModal }] = useModal();

  const tableRef = ref<VxeTableInstance<any>>()
  const hasUpdateStatus = (row: any) => {
    const $table = tableRef.value
    if ($table) {
      return $table.isUpdateByRow(row)
    }
  }
  const isActiveStatus = (row) => {
    const $table = tableRef.value
    if ($table) {
      return $table.isEditByRow(row)
    }
  }
  const editRowEvent = async (row) => {
    const $table = tableRef.value
    if ($table) {
      await $table.setEditRow(row)
    }
  }
  const cancelRowEvent = async (row) => {
    const $table = tableRef.value
    if ($table) {
      await $table.clearEdit()
      // 还原数据
      await $table.revertData(row)
    }
  }
  const saveUpdateEvent = async (row: any) => {
    const $table = tableRef.value
    if ($table) {
      await $table.clearEdit()
      saveList(row).then(() => {
        $table.reloadRow(row, {})
        createMessage.success('保存成功！')
      })
    }
  }


  /**
   * 批量修改成功回调
   */
  function handleBatchEditSuccess() {
    queryPage()
  }

  // 查询条件
  const fields = computed(() => {
    return [
      { field: 'code', type: STRING, name: '优惠码', placeholder: '请输入优惠码' },
      { field: 'discount_type', name: '优惠类型', type: LIST, selectList: [
        { label: '金额', value: "0" },
        { label: '折扣', value: "1" },
      ] },
      { field: 'used', name: '使用状态', type: LIST, selectList: [
        { label: '未使用', value: "0" },
        { label: '已使用', value: "1" },
        { label: '已过期', value: "2" },
      ] },
      { field: 'applicant_id', type: NUMBER, name: '申请者ID', placeholder: '请输入申请者ID' },
      { field: 'user_id', type: NUMBER, name: '使用者ID', placeholder: '请输入使用者ID' },
      { field: 'user_name', type: STRING, name: '使用者名称', placeholder: '请输入使用者名称' },
      { field: 'valid_from', type: DATE, name: '生效时间', placeholder: '选择日期' },
      { field: 'valid_to', type: DATE, name: '失效时间', placeholder: '选择日期' },
      { field: 'create_time', type: DATE, name: '创建日期', placeholder: '选择日期' },
    ] as QueryField[]
  })

  const xTable = $ref<VxeTableInstance>()
  const xToolbar = $ref<VxeToolbarInstance>()
  // const payOrderInfo = $ref<any>()
  // const refundModel = $ref<any>()
  let totalAmount = $ref<number>(0.0)

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

      totalAmount = (data as any).totalAmount
    })
    // // 汇总数据
    // getTotalAmount({
    //   ...model.queryParam,
    // }).then(({ data }) => {
    //   totalAmount = data
    // })
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
        syncByOrderNo(record.orderNo).then(({ data }) => {
          createMessage.success('同步成功')
          queryPage()
        })
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
        close(record.orderNo).then(() => {
          createMessage.success('关闭成功')
          queryPage()
        })
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
