<template>
  <BasicModal v-bind="$attrs" @register="register" title="提现订单详细信息" @cancel="handleCancel" width="800px" :showOkBtn="false" cancelText="关闭">
    <a-descriptions :column="2" bordered>
      <a-descriptions-item label="订单号" :span="2">{{ orderInfo.withdraw_no }}</a-descriptions-item>
      <a-descriptions-item label="用户ID">{{ orderInfo.user_id }}</a-descriptions-item>
      <a-descriptions-item label="用户名">{{ orderInfo.user_name }}</a-descriptions-item>
      <a-descriptions-item label="身份证号">{{ orderInfo.id_card }}</a-descriptions-item>
      <a-descriptions-item label="手机号">{{ orderInfo.mobile }}</a-descriptions-item>
      <a-descriptions-item label="提现金额">{{ formatAmount(orderInfo.amount) }}元</a-descriptions-item>
      <a-descriptions-item label="税金">{{ formatAmount(orderInfo.incometax_amount) }}元</a-descriptions-item>
      <a-descriptions-item label="实际到账">{{ formatAmount(orderInfo.amount - orderInfo.incometax_amount) }}元</a-descriptions-item>
      <a-descriptions-item label="提现状态">
        <a-tag :color="getStatusColor(orderInfo.status)">{{ getStatusText(orderInfo.status) }}</a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="提现方式">{{ orderInfo.method }}</a-descriptions-item>
      <a-descriptions-item label="银行卡号/账户" :span="2">{{ orderInfo.bank_account || '未填写' }}</a-descriptions-item>
      <a-descriptions-item label="开户行" :span="2">{{ orderInfo.bank_name || '未填写' }}</a-descriptions-item>
      <a-descriptions-item label="申请时间">{{ formatDateTime(orderInfo.create_time) }}</a-descriptions-item>
      <a-descriptions-item label="更新时间">{{ formatDateTime(orderInfo.update_time) }}</a-descriptions-item>
      <a-descriptions-item label="审核时间">{{ formatDateTime(orderInfo.audit_time) || '未审核' }}</a-descriptions-item>
      <a-descriptions-item label="打款时间">{{ formatDateTime(orderInfo.pay_time) || '未打款' }}</a-descriptions-item>
      <!--<a-descriptions-item label="审核人">{{ orderInfo.audit_user || '未审核' }}</a-descriptions-item>
      <a-descriptions-item label="打款人">{{ orderInfo.pay_user || '未打款' }}</a-descriptions-item>-->
      <a-descriptions-item label="备注信息" :span="2" v-if="orderInfo.remark">
        <a-textarea 
          :value="orderInfo.remark" 
          :rows="3" 
          readonly 
          placeholder="暂无备注信息"
        />
      </a-descriptions-item>
      <a-descriptions-item label="拒绝原因" :span="2" v-if="orderInfo.status === 4 && orderInfo.reject_reason">
        <a-textarea 
          :value="orderInfo.reject_reason" 
          :rows="3" 
          readonly 
          placeholder="暂无拒绝原因"
        />
      </a-descriptions-item>
      <a-descriptions-item label="撤销原因" :span="2" v-if="orderInfo.status === 5 && orderInfo.cancel_reason">
        <a-textarea 
          :value="orderInfo.cancel_reason" 
          :rows="3" 
          readonly 
          placeholder="暂无撤销原因"
        />
      </a-descriptions-item>
      <a-descriptions-item label="银行信息" :span="2" v-if="orderInfo.bank_info">
        <div class="space-y-2">
          <div v-if="orderInfo.bank_code">
            <span class="font-medium">银行代码：</span>
            <span>{{ orderInfo.bank_code }}</span>
          </div>
          <div v-if="orderInfo.bank_branch">
            <span class="font-medium">开户支行：</span>
            <span>{{ orderInfo.bank_branch }}</span>
          </div>
          <div v-if="orderInfo.account_type">
            <span class="font-medium">账户类型：</span>
            <span>{{ getAccountTypeText(orderInfo.account_type) }}</span>
          </div>
        </div>
      </a-descriptions-item>
      <a-descriptions-item label="处理流程" :span="2">
        <a-timeline>
          <a-timeline-item color="blue">
            <span class="font-medium">申请提现</span>
            <div class="text-gray-500 text-sm">{{ formatDateTime(orderInfo.create_time) }}</div>
          </a-timeline-item>
          <a-timeline-item 
            v-if="orderInfo.audit_time" 
            :color="orderInfo.status >= 1 ? 'green' : 'gray'"
          >
            <span class="font-medium">审核{{ orderInfo.status >= 1 ? '通过' : '中' }}</span>
            <div class="text-gray-500 text-sm">{{ formatDateTime(orderInfo.audit_time) }}</div>
            <div v-if="orderInfo.audit_user" class="text-gray-500 text-sm">审核人：{{ orderInfo.audit_user }}</div>
          </a-timeline-item>
          <a-timeline-item 
            v-if="orderInfo.pay_time" 
            :color="orderInfo.status >= 3 ? 'green' : 'blue'"
          >
            <span class="font-medium">{{ orderInfo.status >= 3 ? '打款完成' : '打款中' }}</span>
            <div class="text-gray-500 text-sm">{{ formatDateTime(orderInfo.pay_time) }}</div>
            <div v-if="orderInfo.pay_user" class="text-gray-500 text-sm">打款人：{{ orderInfo.pay_user }}</div>
          </a-timeline-item>
          <a-timeline-item 
            v-if="orderInfo.status === 4" 
            color="red"
          >
            <span class="font-medium">已拒绝</span>
            <div class="text-gray-500 text-sm">{{ formatDateTime(orderInfo.update_time) }}</div>
            <div v-if="orderInfo.reject_reason" class="text-red-500 text-sm">拒绝原因：{{ orderInfo.reject_reason }}</div>
          </a-timeline-item>
          <a-timeline-item 
            v-if="orderInfo.status === 5" 
            color="orange"
          >
            <span class="font-medium">已撤销</span>
            <div class="text-gray-500 text-sm">{{ formatDateTime(orderInfo.update_time) }}</div>
            <div v-if="orderInfo.cancel_reason" class="text-orange-500 text-sm">撤销原因：{{ orderInfo.cancel_reason }}</div>
          </a-timeline-item>
        </a-timeline>
      </a-descriptions-item>
    </a-descriptions>
  </BasicModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { BasicModal, useModalInner } from '/@/components/Modal';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';

const orderInfo = ref<any>({});

// 提现状态映射
const getStatusText = (status: number) => {
  const statusMap = { 
    0: '待审核', 
    1: '审核通过', 
    2: '打款中', 
    3: '已完成', 
    4: '已拒绝', 
    5: '已撤销' 
  };
  return statusMap[status] || '未知';
};

const getStatusColor = (status: number) => {
  const colorMap = { 
    0: 'default', 
    1: 'green', 
    2: 'blue', 
    3: 'green', 
    4: 'orange', 
    5: 'red' 
  };
  return colorMap[status] || 'default';
};

// 账户类型映射
const getAccountTypeText = (type: string) => {
  const typeMap = {
    'personal': '个人账户',
    'company': '企业账户'
  };
  return typeMap[type] || type;
};

// 格式化金额
const formatAmount = (amount: number) => {
  if (!amount) return '0.00';
  return (amount / 100).toFixed(2);
};

// 格式化时间
const formatDateTime = (dateTime: string) => {
  if (!dateTime) return '';
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm:ss');
};

const [register, { closeModal }] = useModalInner((data) => {
  orderInfo.value = data;
});

function handleCancel() {
  closeModal();
}
</script>

<style scoped>
.ant-descriptions-item-content .ant-tag {
  margin: 2px;
}

.ant-textarea {
  font-family: inherit;
}

.space-y-2 > div:not(:first-child) {
  margin-top: 8px;
}

.font-medium {
  font-weight: 500;
}

.text-gray-500 {
  color: #6b7280;
}

.text-red-500 {
  color: #ef4444;
}

.text-orange-500 {
  color: #f97316;
}

.text-sm {
  font-size: 0.875rem;
}
</style>