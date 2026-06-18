<template>
    <BasicModal v-bind="$attrs" @register="register" title="用户详情" @cancel="handleCancel" @ok="handleSuccess" okText="更新" cancelText="取消">
      <a-descriptions :column="1" bordered>
        <a-descriptions-item label="用户ID">{{ datas.user_id }}</a-descriptions-item>
        <a-descriptions-item label="用户名">{{ datas.username }}</a-descriptions-item>
        <a-descriptions-item label="订单时间">{{ datas.year }}/{{datas.month}}</a-descriptions-item>
        <a-descriptions-item label="支付单数量">
          <a-input v-model:value="datas.pay_order_count" />
        </a-descriptions-item>
        <a-descriptions-item label="退款单数量">
          <a-input v-model:value="datas.refund_order_count" />
        </a-descriptions-item>
        <a-descriptions-item label="收益金额(元)">
          <a-input prefix="￥" suffix="RMB" v-model:value="income" @blur="onIncomeBlur"/>
        </a-descriptions-item>
        <a-descriptions-item label="平台费(元)">
          <a-input prefix="￥" suffix="RMB" v-model:value="platformfee" @blur="onPlatformFeeBlur"/>
        </a-descriptions-item>
        <a-descriptions-item label="税金(元)">
          <a-input prefix="￥" suffix="RMB" v-model:value="incometax" @blur="onIncomeTaxBlur"/>
        </a-descriptions-item>
        <a-descriptions-item label="退款金额(元)">
          <a-input prefix="￥" suffix="RMB" v-model:value="refund" @blur="onRefundBlur"/>
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ datas.created_at }}</a-descriptions-item>
      </a-descriptions>
    </BasicModal>
  </template>
  
<script setup lang="ts">
  import { ref,computed } from 'vue';
  import { BasicModal, useModalInner } from '/@/components/Modal';
    import { useMessage } from '/@/hooks/web/useMessage'
  import { updateOrder } from './PayOrder.api'
  const { createMessage, createConfirm } = useMessage()
  const datas = ref<any>({});
  const income = ref('') //收入的金额
  const platformfee = ref('') //平台费的金额
  const incometax = ref('') //税金的金额
  const refund = ref('') //退款的金额
  const emit = defineEmits(["closeWindow"]);
  const [register, { closeModal, setModalProps }] = useModalInner((data) => {
    datas.value = data;
    income.value = (data.income_amount/100).toFixed(2)
    platformfee.value = (data.platformfee_amount/100).toFixed(2)
    incometax.value = (data.incometax_amount/100).toFixed(2)
    refund.value = (data.refund_amount/100).toFixed(2)
    console.log(datas.value);
    setModalProps({ title: `${data.year} 年 ${data.month} 月 用户 【${data.username}】 订单详情` });
  });
  function onIncomeBlur() {
    // 只保留两位小数并补零
    let val = parseFloat(income.value);
    if (isNaN(val)) {
      income.value = '0.00';
    } else {
      income.value = val.toFixed(2);
    }
  }
  function onPlatformFeeBlur(){
    // 只保留两位小数并补零
    let val = parseFloat(platformfee.value);
    if (isNaN(val)) {
      platformfee.value = '0.00';
    } else {
      platformfee.value = val.toFixed(2);
    }
  }
  function onIncomeTaxBlur(){
    // 只保留两位小数并补零
    let val = parseFloat(incometax.value);
    if (isNaN(val)) {
      incometax.value = '0.00';
    } else {
      incometax.value = val.toFixed(2);
    }
  }
  function onRefundBlur(){
    // 只保留两位小数并补零
    let val = parseFloat(refund.value);
    if (isNaN(val)) {
      refund.value = '0.00';
    } else {
      refund.value = val.toFixed(2);
    }
  }
  function handleCancel() {
    closeModal();
  }
  function handleSuccess(){
    datas.value.income_amount = Math.round(parseFloat(income.value) * 100);
    datas.value.refund_amount = Math.round(parseFloat(refund.value) * 100);
    datas.value.platformfee_amount = Math.round(parseFloat(platformfee.value) * 100);
    datas.value.incometax_amount = Math.round(parseFloat(incometax.value) * 100);
    console.log('handleSuccess', datas.value);
    createConfirm({
      iconType: 'warning',
      title: '警告',
      content: `确定更新订单【${datas.value.username}】的收益记录吗？`,
      onOk: () => {
        updateOrder(datas.value).then(()=>{
          createMessage.success('更新成功')
          closeModal()
          emit('closeWindow')
        })
      },
    })
  }
</script>