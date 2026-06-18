<template>
  <div>
    <div class="m-3 p-3 pt-5 bg-white">
      <b-query :query-params="model.queryParam" :fields="fields" @query="queryPage" @reset="resetQueryParams" />
    </div>
    <div class="m-3 p-3 bg-white">
      <vxe-toolbar ref="xToolbar" custom :refresh="{ queryMethod: queryPage }">
        <template #buttons>
          <span style="font-size: 18px">提现金额: {{ totalAmount ? (totalAmount / 100).toFixed(2) : 0 }}元</span>
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
        <vxe-column field="withdraw_no" title="订单号" :min-width="230">
          <template #default="{ row }">
            <!-- <a @click="show(row)"> -->
              {{ row.withdraw_no }}
            <!-- </a> -->
          </template>
        </vxe-column>
        <vxe-column field="user_id" title="用户ID" :min-width="80" />
        <vxe-column field="user_name" title="用户名" :min-width="120" />
        <vxe-column field="id_card" title="身份证" :min-width="120" />
        <vxe-column field="mobile" title="手机号" :min-width="120" />
        <vxe-column field="amount" title="金额(元)" :min-width="120" sortable>
          <template #default="{ row }"> {{ row.amount ? (row.amount / 100).toFixed(2) : 0 }} </template>
        </vxe-column>
        <vxe-column field="incometax_amount" title="税金(元))" :min-width="220" sortable>
          <template #default="{ row }"> {{ row.incometax_amount ? (row.incometax_amount / 100).toFixed(2) : 0 }} </template>
        </vxe-column>
        <vxe-column field="status" title="提现状态" :min-width="120">
          <template #default="{ row }">
            <Tag v-if="row.status == 0" color="default">待审核</Tag>
            <Tag v-if="row.status == 1" color="green">审核通过</Tag>
            <Tag v-if="row.status == 2" color="blue">打款中</Tag>
            <Tag v-if="row.status == 3" color="green">已完成</Tag>
            <Tag v-if="row.status == 4" color="orange">已拒绝</Tag>
            <Tag v-if="row.status == 5" color="red">已撤销</Tag>
          </template>
        </vxe-column>
        <vxe-column field="method" title="提现方式" :min-width="100" >
          <template #default="{ row }">
            <Tag v-if="row.method == 'wechat'" color="green">微信</Tag>
            <Tag v-if="row.method == 'alipay'" color="blue">支付宝</Tag>
            <Tag v-if="row.method == 'bank'" color="red">银行卡</Tag>
            <Tag v-if="row.method == 'paypal'" color="orange">PayPal</Tag>
            <Tag v-if="row.method == 'enterprise'" color="purple">企业账户</Tag>
          </template>
        </vxe-column>
        <vxe-column field="bank_account" title="银行卡号/账户" sortable :min-width="230" />
        <vxe-column field="bank_name" title="开户行" sortable :min-width="230" />
        <vxe-column field="audit_time" title="审核时间" sortable :min-width="230" />
        <vxe-column field="pay_time" title="打款时间" sortable :min-width="230" />
        <vxe-column field="create_time" title="申请时间" sortable :min-width="230" />
        <vxe-column field="update_time" title="更新时间" sortable :min-width="230" />
        <vxe-column fixed="right" width="160" :showOverflow="false" title="操作">
          <template #default="{ row }">
            <a-link @click="show(row)">查看</a-link>
            <a-divider type="vertical" />
            <a-dropdown v-if="row.status <3">
              <a>
                更多
                <icon icon="ant-design:down-outlined" :size="12" />
              </a>
              <template #overlay>
                <a-menu>
                  <a-menu-item v-if="row.status == 0">
                    <a-link @click="setState(row,1)">审核通过</a-link>
                  </a-menu-item>
                  <a-menu-item v-if="row.status == 1">
                    <a-link @click="setState(row,2)">打款中</a-link>
                  </a-menu-item>
                  <a-menu-item v-if="row.status == 2">
                    <a-link @click="setState(row,3)">已完成</a-link>
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
            <a-divider type="vertical" />
            <a-link @click="setState(row,5)" v-if="row.status <2">撤销</a-link>
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
    <PayOrderViewModal @register="registerView" />
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted } from 'vue'
  import { $ref } from 'vue/macros'
  import { close, page, syncByOrderNo,updateRefundStatus } from './PayOrder.api'
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
  import { useModal } from '/@/components/Modal';
  import PayOrderViewModal from './PayOrderViewModal.vue'

  // 使用hooks
  const { handleTableChange, pageQueryResHandel, sortChange, resetQueryParams, pagination, pages, sortParam, model, loading } =
    useTablePage(queryPage)
  const { createMessage, createConfirm } = useMessage()

  const [registerView, { openModal: openViewModal }] = useModal();
  // const { dictConvert, dictDropDown } = useDict()

  // let channelList = $ref<LabeledValue[]>([])
  // let methodList = $ref<LabeledValue[]>([])
  // let payStatusList = $ref<LabeledValue[]>([])
  // let payRefundStatusList = $ref<LabeledValue[]>([])
  // let payAllocStatusList = $ref<LabeledValue[]>([])

  // 查询条件
  const fields = computed(() => {
    return [
      { field: 'withdraw_no', type: STRING, name: '提现单号', placeholder: '请输入支付提现单号' },
      { field: 'user_id', type: STRING, name: '用户ID', placeholder: '请输入用户ID' },
      { field: 'user_name', type: STRING, name: '用户名', placeholder: '请输入用户名' },
      { field: 'id_card', type: STRING, name: '身份证', placeholder: '请输入身份证' },
      { field: 'mobile', type: STRING, name: '手机号', placeholder: '请输入手机号' },
      { field: 'bank_account', type: STRING, name: '银行卡号/账户', placeholder: '请输入银行卡号/账户' },
      { field: 'bank_name', type: STRING, name: '开户行', placeholder: '请输入开户行' },
      { field: 'create_time', type: DATE, name: '创建日期', placeholder: '选择日期' },
      { field: 'method', name: '支付方式', type: LIST, selectList: [
          { label: '微信', value: "wechat" },
          { label: '支付宝', value: "alipay" },
          { label: 'PayPal', value: "paypal" },
          { label: '银行卡', value: "bank" },
          { label: '企业账户', value: "enterprise" },
        ] },
      { field: 'status', name: '提现状态', type: LIST, selectList: [
          { label: '待审核', value: 0 },
          { label: '审核通过', value: 1 },
          { label: '打款中', value: 2 },
          { label: '已完成', value: 3 },
          { label: '已拒绝', value: 4 },
          { label: '已撤销', value: 5 },
        ] },
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
  let statusData = $ref({
    type: 'success',
    title:'',
    content:''
  })
    /**
   * 审核通过订单
   */
   function setState(record, status) {
    statusData.type = 'warning'
    statusData.title = '警告'
    switch (status) {
      case 1:
        statusData.content = `是否审核通过【${record.withdraw_no}】【${record.user_name}】用户账单`
        break;
      case 2:
        statusData.content = `是否打款【${record.withdraw_no}】【${record.user_name}】用户账单`
        break;
      case 3:
        statusData.content = `是否完成【${record.withdraw_no}】【${record.user_name}】用户账单`
        break;
      case 4:
        statusData.content = `是否拒绝【${record.withdraw_no}】【${record.user_name}】用户账单`
        break;
      case 5:
        statusData.content = `是否撤销【${record.withdraw_no}】【${record.user_name}】用户账单`
        break;
    }
    createConfirm({
      iconType: statusData.type as 'success' | 'warning' | 'error' | 'info',
      title: statusData.title,
      content: status == 5?statusData.content + '<br/>撤销原因:<input type="text" id="revokeReasonInput" placeholder="请填写撤销原因" />':statusData.content,
      onOk: () => {
        if (status == 5) {
          let reason = (document.getElementById('revokeReasonInput') as HTMLInputElement)?.value || '';
          if (!reason) {
            createMessage.warning('请填写撤销原因');
            return Promise.reject();
          }
          record.remark = reason;
        }
        loading.value = true
        updateRefundStatus(record, status).then(() => {
          createMessage.success('操作成功')
          queryPage()
        })
      },
    })
  }

  /**
   * 查看
   */
  function show(record) {
    openViewModal(true, record)
  }

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
