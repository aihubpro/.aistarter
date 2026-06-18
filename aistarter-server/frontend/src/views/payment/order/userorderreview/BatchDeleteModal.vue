<template>
  <BasicModal 
    v-bind="$attrs" 
    @register="register" 
    title="批量删除订单" 
    @cancel="handleCancel" 
    @ok="handleOk"
    width="900px" 
    okText="删除选中订单" 
    cancelText="取消"
    :okButtonProps="{ danger: true, disabled: selectedRowKeys.length === 0 }"
  >
    <div class="mb-4">
      <a-alert 
        :message="`共找到 ${orderList.length} 条订单记录，已选择 ${selectedRowKeys.length} 条`" 
        type="info" 
        show-icon 
      />
    </div>
    
    <vxe-table
      ref="xTable"
      :data="orderList"
      :loading="loading"
      :checkbox-config="{ checkField: 'checked', trigger: 'row' }"
      @checkbox-change="handleCheckboxChange"
      @checkbox-all="handleCheckboxAll"
      max-height="400"
    >
      <vxe-column type="checkbox" width="60" />
      <vxe-column field="user_id" title="用户ID" width="80" />
      <vxe-column field="username" title="用户名" width="120" />
      <vxe-column field="year" title="年" width="60" />
      <vxe-column field="month" title="月" width="60" />
      <vxe-column field="pay_order_count" title="支付单数" width="100" />
      <vxe-column field="refund_order_count" title="退款数" width="100" />
      <vxe-column field="income_amount" title="收益金额(元)" width="120">
        <template #default="{ row }">
          {{ row.income_amount ? (row.income_amount / 100).toFixed(2) : '0.00' }}
        </template>
      </vxe-column>
      <vxe-column field="platformfee_amount" title="平台费(元)" width="120">
        <template #default="{ row }">
          {{ row.platformfee_amount ? (row.platformfee_amount / 100).toFixed(2) : '0.00' }}
        </template>
      </vxe-column>
      <vxe-column field="refund_amount" title="退款金额(元)" width="120">
        <template #default="{ row }">
          {{ row.refund_amount ? (row.refund_amount / 100).toFixed(2) : '0.00' }}
        </template>
      </vxe-column>
      <vxe-column field="audit_status" title="审核状态" width="100">
        <template #default="{ row }">
          <a-tag :color="row.audit_status === 1 ? 'green' : 'red'">
            {{ row.audit_status === 1 ? '已审核' : '未审核' }}
          </a-tag>
        </template>
      </vxe-column>
      <vxe-column field="created_at" title="创建时间" width="160" />
    </vxe-table>
    
    <div class="mt-4" v-if="selectedRowKeys.length > 0">
      <a-alert 
        :message="`警告：您即将删除 ${selectedRowKeys.length} 条订单记录，此操作不可恢复！`" 
        type="warning" 
        show-icon 
      />
    </div>
  </BasicModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { BasicModal, useModalInner } from '/@/components/Modal';
import { message } from 'ant-design-vue';
import { VxeTableInstance } from 'vxe-table';
import { page, batchDeleteOrders } from './PayOrder.api';

const emit = defineEmits(['success']);

const loading = ref(false);
const orderList = ref<any[]>([]);
const selectedRowKeys = ref<string[]>([]);
const xTable = ref<VxeTableInstance>();
const currentYear = ref<number>();
const currentMonth = ref<number>();

// 处理单个复选框变化
const handleCheckboxChange = ({ checked, row }) => {
  if (checked) {
    if (!selectedRowKeys.value.includes(row.id)) {
      selectedRowKeys.value.push(row.id);
    }
  } else {
    const index = selectedRowKeys.value.indexOf(row.id);
    if (index > -1) {
      selectedRowKeys.value.splice(index, 1);
    }
  }
};

// 处理全选复选框变化
const handleCheckboxAll = ({ checked }) => {
  if (checked) {
    selectedRowKeys.value = orderList.value.map(item => item.id);
  } else {
    selectedRowKeys.value = [];
  }
};

// 加载指定年月的订单数据
const loadOrderData = async (year: number, month: number) => {
  loading.value = true;
  try {
    const { data } = await page({
      year,
      month,
      current: 1,
      size: 1000 // 获取足够多的数据
    });
    orderList.value = data.records || [];
    selectedRowKeys.value = [];
  } catch (error) {
    message.error('加载订单数据失败');
    orderList.value = [];
  } finally {
    loading.value = false;
  }
};

// 批量删除选中的订单
const handleOk = async () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要删除的订单');
    return;
  }

  loading.value = true;
  try {
    // 使用批量删除API
    await batchDeleteOrders(selectedRowKeys.value);
    
    message.success(`成功删除 ${selectedRowKeys.value.length} 条订单`);
    emit('success');
    closeModal();
  } catch (error) {
    message.error('删除订单失败');
  } finally {
    loading.value = false;
  }
};

const [register, { closeModal }] = useModalInner((data) => {
  if (data && data.year && data.month) {
    currentYear.value = data.year;
    currentMonth.value = data.month;
    loadOrderData(data.year, data.month);
  }
});

function handleCancel() {
  closeModal();
}
</script>

<style scoped>
.ant-alert {
  margin-bottom: 16px;
}
</style>