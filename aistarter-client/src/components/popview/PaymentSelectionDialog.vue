<template>
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      center
    >
      <div class="payment-methods">
        <el-card
          v-for="(method, index) in paymentMethods"
          :key="index"
          class="payment-option"
          :class="{ 'selected': method === selectedMethod }"
        >
          <img
            :src="method.icon"
            :alt="method.description"
            class="icon"
            @click="selectMethod(method)"
          />
        </el-card>
      </div>
      <template #footer>
        <el-button type="primary" @click="confirmPayment">确认</el-button>
      </template>
    </el-dialog>
  </template>
  
  <script setup>
  import { ref,inject } from 'vue'
  import { ElMessage } from "element-plus";
  import axios from 'axios'

  const {openQRCodePayment} = inject('main');

  const dialogVisible = ref(false)
  const dialogTitle = ref('请选择支付方式')

  let mProductType = null;
  let mProductId = null;
  
  const paymentMethods = ref([
    {
      name: '微信支付',
      description: '使用微信扫码支付',
      icon: new URL("~/assets/wechat_pay_bar.png", import.meta.url).href,
    },
    {
      name: '支付宝支付',
      description: '使用支付宝扫码支付',
      icon: new URL("~/assets/alipay_bar.png", import.meta.url).href, // 更正支付宝图标路径
    },
  ])
  
  const selectedMethod = ref(null)
  
  function selectMethod(method) {
    selectedMethod.value = method === selectedMethod.value ? null : method
  }
  
  async function confirmPayment() {

    if(selectedMethod.value == null){
      ElMessage.error("请选择支付方式");
      return;
    }
    //pay/getPayOrder?pay_type=wechat&product_type=1&product_id=1
    let url = window.Constants.uploadUrl + "/pay/getPayOrder";
    try {
      const response = await axios.get(url, {
        params: { pay_type:"wechat", product_type:mProductType,product_id:mProductId},
        headers:{
          "access-token":localStorage.getItem('token')
        }
      });
      // console.log(response.data)
      openQRCodePayment(response.data);
      dialogVisible.value = false
    } catch (error) {
      console.error('获取更多数据失败:', error);
      ElMessage.error("创建订单失败");
    }
  }
  
  defineExpose({
    openPaymentSelection(productType, productId) {
      dialogVisible.value = true;
      selectedMethod.value = null;
      mProductType = productType;
      mProductId = productId;
    }
  })
  
  console.log("PaymentSelection");
  </script>
  
  <style scoped>
  .payment-option {
    position: relative;
    overflow: visible; /* 确保发光效果不会被裁剪 */
    padding: 0px;
    margin: 20px;
  }
  
  .payment-option.selected {
    box-shadow: 0 0 10px 2px rgba(64, 158, 255, 0.7); /* 发光效果 */
  }
  
  .payment-option .icon {
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .payment-option .icon:hover {
    transform: scale(1.05);
  }
  </style>