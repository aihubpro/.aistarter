<template>
  <div>
    <div class="m-3 p-3 pt-5 bg-white">
      <b-query :query-params="model.queryParam" :fields="fields" @query="queryPage" @reset="resetQueryParams" />
    </div>
    <div class="m-3 p-3 bg-white">
      <vxe-toolbar ref="xToolbar" custom :refresh="{ queryMethod: queryPage }">
        <template #buttons>
          <span style="font-size: 18px">收款金额: {{ totalAmount ? (totalAmount / 100).toFixed(2) : 0 }}元</span>
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
        <vxe-column field="order_no" title="订单号" :min-width="230">
          <template #default="{ row }">
            <!-- <a @click="show(row)"> -->
              {{ row.order_no }}
            <!-- </a> -->
          </template>
        </vxe-column>
        <vxe-column field="user_id" title="用户ID" :min-width="80" />
        <vxe-column field="user_name" title="用户名" :min-width="120" />
        <vxe-column field="merchant_id" title="商家ID" :min-width="80" />
        <vxe-column field="merchant_name" title="商家名称" :min-width="120" />
        <vxe-column field="title" title="标题" :min-width="230" />
        <vxe-column field="description" :edit-render="{name: 'textarea', props: {resize: 'both'}}" title="备注" :min-width="230" />
        <vxe-column field="biz_order_no" title="商户订单号" :min-width="230" />
        <vxe-column field="amount" title="金额(元)" :min-width="120" sortable>
          <template #default="{ row }"> {{ row.amount ? (row.amount / 100).toFixed(2) : 0 }} </template>
        </vxe-column>
        <vxe-column field="status" title="支付状态" :min-width="120">
          <template #default="{ row }">
            <Tag v-if="row.status == 0" color="default">待支付</Tag>
            <Tag v-if="row.status == 1" color="green">已支付</Tag>
            <Tag v-if="row.status == 3" color="red">已退款</Tag>
            <Tag v-if="row.status == 4" color="green">已发放</Tag>
            <Tag v-if="row.status == 5" color="blue">已扣减</Tag>
            <Tag v-if="row.status == 6" color="red">已扣减</Tag>
            <Tag v-if="row.status == 7" color="green">邀请分成</Tag>
          </template>
        </vxe-column>
        <vxe-column field="refund_status" title="退款状态" :min-width="120">
          <template #default="{ row }">
            <Tag v-if="row.refund_status == 0" color="default">未退款</Tag>
            <Tag v-if="row.refund_status == 1" color="green">退款中</Tag>
            <Tag v-if="row.refund_status == 2" color="red">已退款</Tag>
          </template>
        </vxe-column>
        <vxe-column field="method" title="支付方式" :min-width="80" />
        <vxe-column field="create_time" title="创建时间" sortable :min-width="230" />
        <vxe-column fixed="right" width="150" :showOverflow="false" title="操作">
          <template #default="{ row }">
            <a-link v-if="hasUpdateStatus(row)" @click="saveUpdateEvent(row)">保存</a-link>
            <!-- <a-link @click="show(row)">查看</a-link> -->
            <a-divider type="vertical" />
            <a-dropdown>
              <a>
                更多
                <icon icon="ant-design:down-outlined" :size="12" />
              </a>
              <template #overlay>
                <a-menu>
                  <a-menu-item>
                    <a-link @click="sync(row)">同步</a-link>
                  </a-menu-item>
                  <a-menu-item v-if="[payStatus.PROGRESS].includes(row.status)">
                    <a-link @click="closeOrder(row)" danger>关闭</a-link>
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
  import { computed, onMounted, ref } from 'vue'
  import { $ref } from 'vue/macros'
  import { close, page, syncByOrderNo, saveDescription } from './PayOrder.api'
  import useTablePage from '/@/hooks/bootx/useTablePage'
  // import PayOrderInfo from './PayOrderInfo.vue'
  // import RefundModel from './RefundModel.vue'
  import BQuery from '/@/components/Bootx/Query/BQuery.vue'
  import { useMessage } from '/@/hooks/web/useMessage'
  import { LIST, QueryField, STRING, DATE } from '/@/components/Bootx/Query/Query'
  // import { useDict } from '/@/hooks/bootx/useDict'
  import { VxeTableInstance, VxeToolbarInstance, VxePager, VxeTable, VxeToolbar } from 'vxe-table'
  import ALink from '/@/components/Link/Link.vue'
  import { payStatus } from '/@/enums/payment/PayStatus'
  import { Tag } from 'ant-design-vue'

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
      { field: 'order_no', type: STRING, name: '订单号', placeholder: '请输入支付订单号' },
      { field: 'title', type: STRING, name: '标题', placeholder: '请输入标题' },
      { field: 'user_id', type: STRING, name: '用户ID', placeholder: '请输入用户ID' },
      { field: 'user_name', type: STRING, name: '用户名', placeholder: '请输入用户名' },
      { field: 'biz_order_no', type: STRING, name: '商户订单号', placeholder: '请输入商户订单号' },
      { field: 'merchant_id', type: STRING, name: '商家ID', placeholder: '请输入商家ID' },
      { field: 'merchant_name', type: STRING, name: '商家名称', placeholder: '请输入商家名称' },
      { field: 'status', name: '支付状态', type: LIST, selectList: [
          { label: '支付中', value: 0 },
          { label: '已支付', value: 1 },
          { label: '已发放', value: 4 },
          { label: '已退款', value: 5 },
          { label: '已退款(不展示)', value: 6 },
          { label: '邀请分成', value: 7 },
      ] },
      { field: 'create_time', type: DATE, name: '创建日期', placeholder: '选择日期' },
        { field: 'startdate', type: DATE, name: '开始时间', placeholder: '选择日期',colSpan:1 },
        { field: 'enddate', type: DATE, name: '结束时间', placeholder: '选择日期',colSpan:1  },
        { field:'timetype', name: '时间类型', type: LIST, selectList:[
          { label: '近一个月', value: 'oneMonth' },
          { label: '近三个月', value: 'threeMonth' },
          { label: '近半年', value: 'halfYear' },
          { label: '近一年', value: 'oneYear' },
        ]},
      { field: 'method', name: '支付方式', type: LIST, selectList: [
          { label: '微信', value: "wechat" },
          { label: '支付宝', value: "alipay" },
          { label: 'PayPal', value: "paypal" },
        ] },
      { field: 'refund_status', name: '退款状态', type: LIST, selectList: [
          { label: '未退款', value: 0 },
          { label: '退款中', value: 1 },
          { label: '已退款', value: 2 },
        ] },
    ] as QueryField[]
  })

  const tableRef = ref<VxeTableInstance<any>>()
  const xTable = $ref<VxeTableInstance>()
  const xToolbar = $ref<VxeToolbarInstance>()
  // const payOrderInfo = $ref<any>()
  // const refundModel = $ref<any>()
  let totalAmount = $ref<number>(0.0)

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
        // console.log({ id: row.id, description: row.description })
        saveDescription({ id: row.id, description: row.description }).then(() => {
          $table.reloadRow(row, {})
          createMessage.success('备注保存成功！')
        })
      } else {
        createMessage.error('当前行没有修改数据！')
      }
    }
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
    // 校验开始时间和结束时间必须同时选择
    const startdate = (model.queryParam as any).startdate as string;
    const enddate = (model.queryParam as any).enddate as string;
    if ((startdate && !enddate) || (!startdate && enddate)) {
      createMessage.warning('请同时选择开始时间和结束时间');
      return;
    }
    // 校验结束时间不能早于开始时间
    if (startdate && enddate && new Date(startdate) > new Date(enddate)) {
      createMessage.warning('开始时间不能早于结束时间');
      return;
    }
    // 校验时间区间不能超过一年
    if (startdate && enddate) {
      const start = new Date(startdate);
      const end = new Date(enddate);
      const oneYear = 365 * 24 * 60 * 60 * 1000;
      if (end.getTime()-start.getTime() > oneYear) {
        createMessage.warning('时间区间不能超过一年');
        return;
      }
    }
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
