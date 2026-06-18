<template>
  <div>
    <div class="m-3 p-3 pt-5 bg-white">
      <b-query :query-params="model.queryParam" :fields="fields" @query="queryPage" @reset="resetQueryParams" />
    </div>
    <div class="m-3 p-3 bg-white">
      <vxe-toolbar ref="xToolbar" custom :refresh="{ queryMethod: queryPage }">
        <template #buttons>
          <div class="flex justify-between w-full">
            <div style="font-size: 18px">收款金额: {{ totalAmount ? (totalAmount / 100).toFixed(2) : 0 }}元</div>
            <div class="flex items-center space-x-2 mr-3">
              <a-select v-model:value="selectedYear" placeholder="选择年份" style="width: 100px">
                <a-select-option v-for="year in yearOptions" :key="year" :value="year">
                  {{ year }}
                </a-select-option>
              </a-select>
              <a-select v-model:value="selectedMonth" placeholder="选择月份" style="width: 80px">
                <a-select-option v-for="month in monthOptions" :key="month" :value="month">
                  {{ month }}
                </a-select-option>
              </a-select>
              <a-button type="primary" @click="clickPayOrder" :disabled="!selectedYear || !selectedMonth">
                获取订单
              </a-button>
              <!--删除订单 -->
              <a-button type="danger" @click="deletePayOrder" :disabled="!selectedYear || !selectedMonth">
                批量删除
              </a-button>
              <!--批量审核订单 -->
              <a-button type="success" @click="batchAuditOrder" :disabled="!selectedYear || !selectedMonth">
                批量审核
              </a-button>
            </div>
          </div>
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
        <vxe-column field="user_id" title="用户ID" :min-width="80" />
        <vxe-column field="username" title="用户名" :min-width="120" />
        <vxe-column field="year" title="年" :min-width="80" />
        <vxe-column field="month" title="月" :min-width="80" />
        <vxe-column field="pay_order_count" title="支付单数量" :min-width="130" />
        <vxe-column field="refund_order_count" title="退款数量" :min-width="130" />
        <vxe-column field="income_amount" title="收益金额(元)" :min-width="220" sortable>
          <template #default="{ row }"> {{ row.income_amount ? (row.income_amount / 100).toFixed(2) : 0 }} </template>
        </vxe-column>
        <vxe-column field="platformfee_amount" title="平台费(元))" :min-width="220" sortable>
          <template #default="{ row }"> {{ row.platformfee_amount ? (row.platformfee_amount / 100).toFixed(2) : 0 }} </template>
        </vxe-column>
        <vxe-column field="refund_amount" title="退款金额(元)" :min-width="220" sortable>
          <template #default="{ row }"> {{ row.refund_amount ? (row.refund_amount / 100).toFixed(2) : 0 }} </template>
        </vxe-column>
        <vxe-column field="audit_status" title="审核状态" :min-width="120">
          <template #default="{ row }">
            <Tag v-if="row.audit_status == 0" color="red">未审核</Tag>
            <Tag v-if="row.audit_status == 1" color="green">已审核</Tag>
          </template>
        </vxe-column>
        <vxe-column field="created_at" title="创建时间" sortable :min-width="230" />
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
                  <a-menu-item v-if="row.audit_status == 0">
                    <a-link @click="setState(row,1)">审核通过</a-link>
                  </a-menu-item>
                  <a-menu-item>
                    <a-link @click="closeOrder(row)" danger>删除</a-link>
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
    <PayOrderDetails @register="register" @closeWindow="closeWindow"/>
    <BatchDeleteModal @register="registerBatchDelete" @success="handleBatchDeleteSuccess" />
    <BatchAuditModal @register="registerBatchAudit" @success="handleBatchAuditSuccess" />
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue'
  import { $ref } from 'vue/macros'
  import { page,getLastMonthOrder,getMonthOrder,deleteOrder,deleteMonthOrders,batchAuditUserOrder,updateOrderStatus } from './PayOrder.api'
  import useTablePage from '/@/hooks/bootx/useTablePage'
  import BQuery from '/@/components/Bootx/Query/BQuery.vue'
  import { useMessage } from '/@/hooks/web/useMessage'
  import { LIST, QueryField, STRING, DATE } from '/@/components/Bootx/Query/Query'
  // import { useDict } from '/@/hooks/bootx/useDict'
  import { VxeTableInstance, VxeToolbarInstance, VxePager, VxeTable, VxeToolbar } from 'vxe-table'
  import ALink from '/@/components/Link/Link.vue'
  import { Tag } from 'ant-design-vue'
  import PayOrderDetails from './PayOrderDetails.vue'
  import BatchDeleteModal from './BatchDeleteModal.vue'
  import BatchAuditModal from './BatchAuditModal.vue'
  import { useModal } from '/@/components/Modal';

  const [register, { openModal }] = useModal();
  const [registerBatchDelete, { openModal: openBatchDeleteModal }] = useModal();
  const [registerBatchAudit, { openModal: openBatchAuditModal }] = useModal();
  // 使用hooks
  const { handleTableChange, pageQueryResHandel, sortChange, resetQueryParams, pagination, pages, sortParam, model, loading } =
    useTablePage(queryPage)
  const { createMessage, createConfirm } = useMessage()
  // const { dictConvert, dictDropDown } = useDict()

  // let channelList = $ref<LabeledValue[]>([])
  // let methodList = $ref<LabeledValue[]>([])
  // let payStatusList = $ref<LabeledValue[]>([])
  // let payRefundStatusList = $ref<LabeledValue[]>([])
  // let payAllocStatusList = $ref<LabeledValue[]>([])

  // 查询条件
  const fields = computed(() => {
    return [
      { field: 'user_id', type: STRING, name: '用户ID', placeholder: '请输入用户ID' },
      { field: 'username', type: STRING, name: '用户名', placeholder: '请输入用户名' },
      { field: 'year', type: LIST, name: '年份', selectList: (() => {
        const currentYear = new Date().getFullYear()
        const years = []
        for (let i = currentYear; i >= currentYear - 9; i--) {
          years.push({ label: i.toString(), value: i })
        }
        return years
      })() },
      { field: 'month', type: LIST, name: '月份', selectList: [
        { label: '一月', value: 1 },
        { label: '二月', value: 2 },
        { label: '三月', value: 3 },
        { label: '四月', value: 4 },
        { label: '五月', value: 5 },
        { label: '六月', value: 6 },
        { label: '七月', value: 7 },
        { label: '八月', value: 8 },
        { label: '九月', value: 9 },
        { label: '十月', value: 10 },
        { label: '十一月', value: 11 },
        { label: '十二月', value: 12 },
      ] },
      { field: 'created_at', type: DATE, name: '创建日期', placeholder: '选择日期' },
      { field: 'audit_status', name: '审核状态', type: LIST, selectList: [
        { label: '未审核', value: 0 },
        { label: '已审核', value: 1 },
      ] },
    ] as QueryField[]
  })

  const xTable = $ref<VxeTableInstance>()
  const xToolbar = $ref<VxeToolbarInstance>()
  // const payOrderInfo = $ref<any>()
  // const refundModel = $ref<any>()
  let totalAmount = $ref<number>(0.0)
  
  // 年份和月份选择
  const selectedYear = ref<number>()
  const selectedMonth = ref<number>()
  
  // 年份选项（最近10年）
  const yearOptions = computed(() => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = currentYear; i >= currentYear - 10; i--) {
      years.push(i)
    }
    return years
  })
  
  // 月份选项
  const monthOptions = computed(() => {
    return Array.from({ length: 12 }, (_, i) => i + 1)
  })

  onMounted(() => {
    initData()
    vxeBind()
    queryPage()
    
    // 默认设置为上个月
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1)
    selectedYear.value = lastMonth.getFullYear()
    selectedMonth.value = lastMonth.getMonth() + 1
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
  function closeWindow() {
    queryPage()
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
    return Promise.resolve()
  }

  /**
   * 查看
   */
  function show(record) {
    openModal(true, record)
  }

  /**
   * 审核通过订单
   */
  function setState(record, status) {
    createConfirm({
      iconType: 'warning',
      title: '警告',
      content: `是否审核通过【${record.username}】用户${record.year}年${record.month}月账单`,
      onOk: () => {
        console.log(record)
        loading.value = true
        updateOrderStatus(record, status).then(() => {
          createMessage.success('操作成功')
          queryPage()
        })
      },
    })
  }
  /**
   * 删除订单
   */
  function closeOrder(record) {
    createConfirm({
      iconType: 'warning',
      title: '警告',
      content: '是否删除当前订单',
      onOk: () => {
        loading.value = true
        deleteOrder(record.id).then(() => {
          createMessage.success('删除成功')
          queryPage()
        })
      },
    })
  }
  /**
    * 获取指定年月订单
    */
  function clickPayOrder(){
    if (!selectedYear.value || !selectedMonth.value) {
      createMessage.warning('请选择年份和月份')
      return
    }
    
    createConfirm({
      iconType: 'warning',
      title: '警告',
      content: `手动获取${selectedYear.value}年${selectedMonth.value}月订单，可能会有数据重复，请确认是否继续？`,
      onOk: () => {
        loading.value = true
        getMonthOrder(selectedYear.value, selectedMonth.value).then(() => {
          createMessage.success('同步成功')
          queryPage()
        }).catch(() => {
          loading.value = false
        })
      },
    })
  }
  /**
   * 删除指定年月订单
   */
   function deletePayOrder(){
      if (!selectedYear.value || !selectedMonth.value) {
        createMessage.warning('请选择年份和月份')
        return
      }
      
      // 打开批量删除模态框
      openBatchDeleteModal(true, {
        year: selectedYear.value,
        month: selectedMonth.value
      })
   }
   
   /**
   * 批量删除成功回调
   */
   function handleBatchDeleteSuccess() {
     queryPage()
   }
   
   /**
   * 批量审核指定年月订单
   */
   function batchAuditOrder(){
      if (!selectedYear.value || !selectedMonth.value) {
        createMessage.warning('请选择年份和月份')
        return
      }
      
      // 打开批量审核模态框
      openBatchAuditModal(true, {
        year: selectedYear.value,
        month: selectedMonth.value
      })
   }
   
   /**
   * 批量审核成功回调
   */
   function handleBatchAuditSuccess() {
     queryPage()
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
