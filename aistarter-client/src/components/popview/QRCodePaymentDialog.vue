<template>
  <el-dialog v-model="dialogVisible" width="400px" align-center center @close="onDialogClose" :show-close="false"
    :close-on-click-modal="false" class="p-0 overflow-hidden"
    :class="payclasstext.color" style="border-radius: 10px;">
    <template #title>
      <div class="font-size-6 text-#fff pt-4 font-bold w-[90%] m-auto line-limit-length">{{ productName }}</div>
    </template>
    <!-- 支付信息选择 -->
    <!-- <div class="mb-2"> bg-#1677ff bg-#04BE02
      <el-radio-group v-model="PaymentInformationSelection" size="large">
        <el-radio-button :label="item.title" :value="item.productId" v-for="(item, index) in plans" :key="index" />
      </el-radio-group>
    </div> -->
    <div class="payment-confirmation">
      <div class="product-info">
        <div class="text-#fff font-size-4 font-bold pt-0 pb-4">{{$t('qrcodepaymentdialog.price')}}{{ price }}</div>
      </div>
      <div class="qrcode" v-loading="loading">
        <div class="qrcode-cover" v-if="qrcodeCover && paymentOptions != 'paypal'">
          <div class="qrcode-cover-text">
            {{$t('qrcodepaymentdialog.qrcodeexpire')}}<a href="#" @click="qrcodeCoverRefresh">{{$t('qrcodepaymentdialog.refresh')}}</a>
          </div>
        </div>
        <div class="qrcode-cover" style='border-radius:50%;' v-if="qrcodeCover && paymentOptions === 'paypal'">
          <div class="qrcode-cover-text">
            {{$t('qrcodepaymentdialog.paypalexpire')}}<a href="#" @click="qrcodeCoverRefresh">{{$t('qrcodepaymentdialog.refresh')}}</a>
          </div>
        </div>
        <div class="qrcode-cover" v-if="qrcodeCover && paymentOptions === 'balance'">
          <div class="qrcode-cover-text">
            {{$t('qrcodepaymentdialog.balance_expire')}}<a href="#" @click="qrcodeCoverRefresh">{{$t('qrcodepaymentdialog.refresh')}}</a>
          </div>
        </div>
        <div class="qrcode-cover" :style='{"border-radius":paymentOptions=="paypal"?"50%":"0"}' v-if="!subScriptionInformation">
          <div class="qrcode-cover-text">
            {{$t('qrcodepaymentdialog.protocol')}}
          </div>
        </div>
        <!-- PayPal支付界面 -->
        <div v-if="paymentOptions === 'paypal'" class="p-5">
          <div class="w-[200px] h-[200px] flex justify-center items-center flex-col">
            <el-button type="success" size="large" class="w-[200px] h-[200px] text-#fff font-bold text-[24px]" style="border-radius: 50%;" @click="handlePaypalPayment" :loading="paypalLoading" :disabled="paypalLoading">
              <!--<svg focusable="false" class="mr-2" data-icon="pay-circle" width="1em" height="1em" fill="currentColor" aria-hidden="true" viewBox="64 64 896 896"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372zm159.6-585h-59.5c-3 0-5.8 1.7-7.1 4.4l-90.6 180H511l-90.6-180a8 8 0 00-7.1-4.4h-60.7c-1.3 0-2.6.3-3.8 1-3.9 2.1-5.3 7-3.2 10.9L457 515.7h-61.4c-4.4 0-8 3.6-8 8v29.9c0 4.4 3.6 8 8 8h81.7V603h-81.7c-4.4 0-8 3.6-8 8v29.9c0 4.4 3.6 8 8 8h81.7V717c0 4.4 3.6 8 8 8h54.3c4.4 0 8-3.6 8-8v-68.1h82c4.4 0 8-3.6 8-8V611c0-4.4-3.6-8-8-8h-82v-41.5h82c4.4 0 8-3.6 8-8v-29.9c0-4.4-3.6-8-8-8h-62l111.1-204.8c.6-1.2 1-2.5 1-3.8-.1-4.4-3.7-8-8.1-8z"></path></svg>-->
              {{$t('qrcodepaymentdialog.paypalpayment')}}
            </el-button>
          </div>
        </div>
        <!-- 余额支付 -->
        <!-- 账号余额支付界面 -->
        <div v-else-if="paymentOptions === 'balance'" class="p-5 bg-#fff">
          <div class="w-[200px] h-[200px] flex justify-center items-center flex-col">
            <!-- 余额显示 -->
            <div class="balance-display mb-4">
              <div class="text-#666 text-14px mb-2">{{$t('qrcodepaymentdialog.account_balance')}}</div>
              <div class="text-#f56c6c text-24px font-bold">¥{{userBalanceData}}</div>
            </div>

            <!-- 支付按钮 -->
            <el-button type="danger" size="large" class="balance-pay-btn" @click="handleBalancePayment" :loading="balanceLoading" :disabled="balanceLoading">
              <span class="text-16px font-bold">{{$t('qrcodepaymentdialog.pay_now')}}</span>
            </el-button>
          </div>
        </div>
        <!-- Stripe支付界面 -->
        <div v-else-if="paymentOptions === 'stripe'" class="p-5">
          <div class="w-[200px] h-[200px] flex justify-center items-center flex-col">
            <el-button type="primary" size="large" class="w-[200px] h-[200px] text-#fff font-bold text-[24px]" style="border-radius: 50%;" @click="handleStripePayment" :loading="stripeLoading" :disabled="stripeLoading">
              {{$t('qrcodepaymentdialog.stripepayments')}}
            </el-button>
          </div>
        </div>

        <!-- 微信/支付宝二维码界面 -->
        <div v-else class="p-5 bg-#fff">
          <div class="w-[200px] h-[200px] flex justify-center items-center">
            <p class="text-#000" v-if="!qrCodeGenerated">{{$t('qrcodepaymentdialog.qrcodegenerate')}}</p>
            <vue-qrcode v-if="qrCodeGenerated" :value="qrCodeImage" :width="200" :margin="0"></vue-qrcode>
          </div>
        </div>
        <p class="font-size-16px text-#fff">{{ payclasstext.text }}</p>
      </div>
    </div>

    <template #footer>
      <div class="pt-0 pb-3 pl-5 pr-5" style="background-color: var(--ep-bg-color);">
        <!-- 勾选框（支付说明） -->
        <div class="flex items-center" v-if="projectJudg">
          <el-checkbox v-model="subScriptionInformation" label="" size="large" />
          <div class="text-#999 font-size-14px">
            {{$t('qrcodepaymentdialog.subscription_protocol')}}《<a @click="openPaymentExplain(paymentExplainUrl)"
              :class="payclasstext.textColor">{{$t('qrcodepaymentdialog.subscription_protocol_link')}}</a>》。
          </div>
        </div>
        <!-- 优惠码输入 -->
         <div class="flex items-center" v-if="projectJudg">
          <el-input v-model="couponCode" :placeholder="$t('qrcodepaymentdialog.discount_placeholder')" class="w-[200px]" />
          <el-button type="primary" plain @click="applyCouponCode">{{$t('qrcodepaymentdialog.discount')}}</el-button>
        </div>
        <!-- 支付方式 -->
        <div class="paymode mb-2 pt-2 flex justify-start">
          <el-radio-group v-model="paymentOptions" size="large" @change="onPaymentOptionChange">
            <el-radio-button :value=item.payname v-for="(item, index) in paymentMethods" v-show="item.enable" :key="index">
              <div class="flex justify-center items-center">
              <el-image class="w-16px h-16px" :src="item.icon" fit="fill" :alt="item.description">
                <template #error>
                  <component :is="item.icon" class="w-16px h-16px"></component>
                </template>
              </el-image>
                <div class="ml-2">
                  {{ item.name }}
                </div>
              </div>
            </el-radio-button>
          </el-radio-group>
        </div>
        <!-- 取消按钮 -->
        <span class="dialog-footer">
          <el-button :type="payclasstext.status" plain @click="onCancel"
            class="w-full pt-5 pb-5">{{$t('qrcodepaymentdialog.backtoseller')}}</el-button>
        </span>
      </div>
    </template>
  </el-dialog>

  <!-- 密码确认对话框 -->
   <el-dialog 
     v-model="passwordDialogVisible" 
     :title="$t('qrcodepaymentdialog.password_confirmation_title')" 
     width="400px" 
     align-center 
     center
     :close-on-click-modal="false"
     @close="onPasswordDialogClose"
   >
    <div class="password-dialog-content">
      <div class="mb-4 text-center">
        <div class="text-#666 text-14px mb-2">{{$t('qrcodepaymentdialog.payment_amount')}}</div>
        <div class="text-#f56c6c text-20px font-bold">{{ price }}</div>
      </div>
      <div class="mb-4">
        <el-input 
          v-model="paymentPassword" 
          type="password" 
          :placeholder="$t('qrcodepaymentdialog.payment_password_placeholder')" 
          show-password
          size="large"
          @keyup.enter="confirmPasswordPayment"
          ref="passwordInput"
        />
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="passwordDialogVisible = false">{{$t('qrcodepaymentdialog.cancel')}}</el-button>
        <el-button type="primary" @click="confirmPasswordPayment" :loading="balanceLoading">{{$t('qrcodepaymentdialog.confirm_payment')}}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, inject, watch,computed } from 'vue'
import axios from 'axios'
import { ElMessage, ElLoading } from "element-plus";
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const { getUserInfo, openPaymentExplain } = inject('main');

import { paymentStore } from '../../stores/PaymentStore'

import { EventBusDefines } from '../../events'
import { eventBusStore } from '../../stores/EventBusStore'

const paystore = paymentStore() // 引入store实例 支付数据
const eventBusStoreIns = eventBusStore() //全局事件

const onCancel = () => {
  dialogVisible.value = false
  paystore.couponCode = ''
}

//协议链接
const paymentExplainUrl = ref(window.Constants.uploadUrl + '/user_subscribe.html')
const hidden = ref(true)

const dialogVisible = ref(false)
const qrCodeGenerated = ref(false)
const qrCodeImage = ref('')

const paymentMethods = ref([
  {
    name: '微信支付',
    description: '使用微信扫码支付',
    icon: new URL("~/assets/wechat_pay_icon.png", import.meta.url).href,
    payname: 'wechat',
    enable: true,
  },
  {
    name: '支付宝支付',
    description: '使用支付宝扫码支付',
    icon: new URL("~/assets/alipay_pay_icon.png", import.meta.url).href, // 更正支付宝图标路径
    payname: 'alipay',
    enable: true,
  },
  {
    name: 'PayPal',
    description: '使用PayPal支付',
    icon: new URL("~/assets/paypal_pay_icon.png", import.meta.url).href,
    payname: 'paypal',
    enable: true,
  },
  {
    name:'余额',
    description: '使用余额支付',
    icon: 'Money',
    payname: 'balance',
    enable: true,
  },
  {
    name: 'Stripe',
    description: '使用Stripe支付',
    icon: 'CreditCard',
    payname: 'stripe',
    enable: true,
  },
])
const payclasstext = computed(() => {
  switch (paymentOptions.value) {
    case 'wechat':
      return {
        text: t('qrcodepaymentdialog.wechatpayment'),
        color: 'bg-#04BE02',
        textColor: 'text-#04BE02',
        status: 'success'
      }
    case 'alipay':
      return {
        text: t('qrcodepaymentdialog.alipaypayment'),
        color: 'bg-#1677ff',
        textColor: 'text-#1677ff',
        status: 'info'
      }
    case 'paypal':
      return {
        text: t('qrcodepaymentdialog.paypalpayments'),
        color: 'bg-#2660dd',
        textColor: 'text-#0070ba',
        status: 'info'
      }
    case 'balance':
      return {
        text: t('qrcodepaymentdialog.balancepayment'),
        color: 'bg-#67c23a',
        textColor: 'text-#67c23a',
        status: 'success'
      }
    case 'stripe':
      return {
        text: t('qrcodepaymentdialog.stripepayment'),
        color: 'bg-#635bff',
        textColor: 'text-#635bff',
        status: 'primary'
      }
    default:
      return ''
  }
})

let productName = ref("")
let price = ref("")
let paymentOptions = ref("wechat")
let subScriptionInformation = ref(true)
let userBalanceData = ref('0.00')

let ProductType = ref("")
let ProductId = ref("")

let qrcodeCover = ref(false)
// 添加 余额支付相关变量
const balanceLoading = ref(false)
const paymentPassword = ref('')
const passwordDialogVisible = ref(false)
const passwordInput = ref(null)

// 处理 余额支付 - 显示密码对话框
const handleBalancePayment = async () => { 
  if (!subScriptionInformation.value) {
    ElMessage.error(t('qrcodepaymentdialog.protocol'));
    return;
  }
  
  // 检查余额是否足够
  const currentBalance = parseFloat(userBalanceData.value)
  const paymentAmount = parseFloat(price.value.replace('¥', '').replace('$', ''))
  
  if (currentBalance < paymentAmount) {
    ElMessage.error(t('qrcodepaymentdialog.insufficient_balance'));
    return;
  }
  
  // 显示密码确认对话框
  paymentPassword.value = ''
  passwordDialogVisible.value = true
  
  // 等待DOM更新后聚焦到密码输入框
  setTimeout(() => {
    if (passwordInput.value) {
      passwordInput.value.focus()
    }
  }, 100)
}

// 确认密码支付
const confirmPasswordPayment = async () => {
  // 检查密码是否输入
  if (!paymentPassword.value.trim()) {
    ElMessage.error(t('qrcodepaymentdialog.password_required'));
    return;
  }
  
  balanceLoading.value = true
  const loading = ElLoading.service({
    lock: true,
    text: t('qrcodepaymentdialog.createorder'),
    background: 'rgba(0, 0, 0, 0.7)',
  })
  let url = window.Constants.uploadUrl + "/pay/balancePay";
  try{
    const response = await axios.post(url, {
      orderNo: orderNo,
      password: paymentPassword.value
    }, {
      headers: {
        "access-token": localStorage.getItem("token"),
      },
    });
    if(response.data.code != 200){
      loading.close()
      ElMessage.error(response.data.msg)
      balanceLoading.value = false
    } else {
      loading.close()
      balanceLoading.value = false
      // 关闭密码对话框
      passwordDialogVisible.value = false
      // 清空密码
      paymentPassword.value = ''
    }
  }catch(err){
    console.error('余额支付失败:', err);
    ElMessage.error(t('qrcodepaymentdialog.createordererror'));
    balanceLoading.value = false
  }
}

// 密码对话框关闭事件
const onPasswordDialogClose = () => {
  paymentPassword.value = ''
  balanceLoading.value = false
}
// 添加 PayPal 相关变量
const paypalLoading = ref(false)
// 处理 PayPal 支付
const handlePaypalPayment = async () => {
  if (!subScriptionInformation.value) {
    ElMessage.error(t('qrcodepaymentdialog.protocol'));
    return;
  }
  try {
    window.open(qrCodeImage.value, '_blank');
  } catch (error) {
    console.error('PayPal payment error:', error);
    ElMessage.error(t('qrcodepaymentdialog.createordererror'));
  } finally {
    paypalLoading.value = false;
  }
}

// 添加 Stripe 相关变量
const stripeLoading = ref(false)
// 处理 Stripe 支付
const handleStripePayment = async () => {
  if (!subScriptionInformation.value) {
    ElMessage.error(t('qrcodepaymentdialog.protocol'));
    return;
  }
  stripeLoading.value = true;
  try {
    window.open(qrCodeImage.value, '_blank');
  } catch (error) {
    console.error('Stripe payment error:', error);
    ElMessage.error(t('qrcodepaymentdialog.createordererror'));
  } finally {
    stripeLoading.value = false;
  }
}



//优惠码输入
const couponCode = ref("")
const applyCouponCode = () =>{
  // console.log("优惠码")
  if(couponCode.value.length==0){
    ElMessage.error(t('qrcodepaymentdialog.couponcodeempty'))
    return
  }else{
    ConfirmPayment(paymentOptions.value)
  }
}

// const plans = ref([
//   {
//     productType: 1,
//     productId: 1,
//     title: '年度订阅',
//     price: '-',
//     btnText: '购买会员',
//     btnType: 'warning',
//     benefits: [
//       '一年内所有更新',
//       '标准技术支持',
//       '会员专属下载',
//       '创作者项目优惠(20-30%)',
//       '优先体验新功能',
//       '社群特权'
//     ],
//   },
//   {
//     productType: 1,
//     productId: 2,
//     title: '永久订阅',
//     price: '-',
//     btnText: '购买会员',
//     btnType: 'warning',
//     benefits: [
//       '永久更新',
//       '标准技术支持',
//       '会员专属下载',
//       '创作者项目优惠(20-30%)',
//       '优先体验新功能',
//       '社群特权'
//     ],
//   },
//   {
//     productType: 1,
//     productId: 3,
//     title: '共创模式',
//     price: '定制化价格',
//     btnText: '联系我们',
//     btnType: 'danger',
//     benefits: [
//       '专属技术支持',
//       ' 1对1技术支持',
//       '软件定制',
//       '自主管理后台',
//       '收入归共创者',
//       '　'
//     ],
//   },
// ])

let pollInterval = null; // 用于存储轮询的定时器ID
let orderNo = null;

// let cachePlansData = null;

//项目判断是否是个人的
let projectJudg = ref(false)

//二维码过期时间
let qrcodeCoverTimes = ref(600000) // 10分钟 600000
let timer = null
//二维码过期蒙版
let qrcodeCoverTime = () => {
  clearqrcodeCoverTime();
  qrcodeCover.value = false;
  timer = setTimeout(() => {
    qrcodeCover.value = true;
  }, qrcodeCoverTimes.value);
}

//清除定时器
let clearqrcodeCoverTime = () => {
  if (timer) {
    clearTimeout(timer);
    timer = null
  }
}

//二维码过期刷新
const qrcodeCoverRefresh = () => {
  ConfirmPayment(paymentOptions.value)
}
// //监听支付变化，组件有对应的事件，不要用这种监听
// watch(paymentOptions, (newValue) => {
//   // console.log(`paymentOptions is ${newValue}`)
//   ConfirmPayment(newValue)
// })

//支付选择切换,
const onPaymentOptionChange = function () {
  ConfirmPayment(paymentOptions.value)
}

//获取用户余额
const getUserBalance = async function () { 
    try{
    let url = window.Constants.uploadUrl + "/users/get-user-info";
    axios.get(url,{
        headers: {
            "access-token": localStorage.getItem('token')
        }
    }).then(function (res) { 
      if(res.data.code==200){
          userBalanceData.value = res.data.data.balance
      }
    })
  }catch(error){
    console.log(error)
  }
}

//确定支付的方式
const ConfirmPayment = async function (Poption) {
  if (!subScriptionInformation.value) {
    ElMessage.error(t('qrcodepaymentdialog.protocol'));
    return;
  }
  if(Poption == 'balance'){ //余额支付 获取用户余额
    getUserBalance()
  }
  if(Poption == 'stripe'){ //Stripe支付
    stripeLoading.value = true;
  }

  // console.log(" 支付方式:" + paymentOptions.value)
  // console.log("支付类型：" + ProductType.value)
  // console.log("支付ID：" + productId.value)

  stopPoolForScan();
  qrCodeGenerated.value = false;
  balanceLoading.value = true;
  paypalLoading.value = true;

  const loading = ElLoading.service({
    lock: true,
    text: t('qrcodepaymentdialog.createorder'),
    background: 'rgba(0, 0, 0, 0.7)',
  })
  let url = window.Constants.uploadUrl + "/pay/getPayOrder";
  try {
    const response = await axios.get(url, {
      params: { pay_type: Poption, product_type: ProductType.value, product_id: ProductId.value,couponCode:couponCode.value, timestamp: Date.now() },
      headers: {
        "access-token": localStorage.getItem('token')
      }
    });
    if (response.data.code == -1) {
      loading.close();
      ElMessage.error(response.data.msg);
      return;
    }
    loading.close();
    orderNo = response.data.order_no;

    productName.value = response.data.title;
    price.value = "¥" + (response.data.amount / 100).toFixed(2);

    qrCodeImage.value = response.data.code_url;

    qrCodeGenerated.value = true;
    paypalLoading.value = false;
    balanceLoading.value = false;
    stripeLoading.value = false;

    qrcodeCoverTime();
    startPoolForScan();

  } catch (error) {
    loading.close();
    console.error('获取更多数据失败:', error);
    ElMessage.error(t('qrcodepaymentdialog.createordererror'));
  }
}

// //获取价格表
// const updatePriceInfo = async () => {
//   let url = window.Constants.uploadUrl + "/pay/vip-price";
//   try {
//     const response = await axios.get(url, {
//       params: {},
//       headers: {
//         "access-token": localStorage.getItem('token')
//       }
//     });

//     let plansData = response.data.plans;

//     plans.value[0].price = '￥' + plansData[0].price + '/年';
//     plans.value[1].price = '￥' + plansData[1].price;

//     cachePlansData = plansData;
//   } catch (error) {
//     console.error('获取数据失败:', error);
//     ElMessage.error("获取数据失败!");
//   }
// }
// 定义轮询函数
async function pollForScan() {
  try {
    let url = window.Constants.uploadUrl + "/pay/checkPayOrder";
    const uniqueParam = Date.now();
    const response = await axios.get(url, {
      params: {
        order_no: orderNo,
        // 添加一个唯一的参数来避免缓存问题
        timestamp: uniqueParam
      },
      headers: {
        "access-token": localStorage.getItem('token')
      }
    });

    if (response.data.state === 1) {
      // TODO 二维码被扫描并且支付已完成，停止轮询
      stopPoolForScan();
      closeDialog();

      //重新获取玩家信息
      getUserInfo();

      ElMessage.success(t('qrcodepaymentdialog.payment_success'));
      
      // if(!projectJudg.value){
      //   paystore.isBuys = true;
      // }
      //派发支付成功事件
      let eventData = {product_type:ProductType.value, product_id: ProductId.value};
      eventBusStoreIns.$emit(EventBusDefines.OnPaySuccess, eventData)

      console.log('Payment completed!');
    } else {
      // TODO 继续查询
      // console.log('Payment not yet completed, continue polling...');
    }
  } catch (error) {
    console.error('Error checking pay order:', error)
    // 错误停止查询
    stopPoolForScan();
  }
}

const startPoolForScan = () => {
  // 开始轮询
  pollInterval = setInterval(pollForScan, 3000); // 每n秒轮询一次
};

const stopPoolForScan = () => {
  if (pollInterval == null) {
    return;
  }
  clearInterval(pollInterval);
  pollInterval = null;
}

const onDialogClose = function () {
  console.log("onDialogClose");
  // TODO 停止查询
  stopPoolForScan();
  // 关闭界面停止定时器
  clearqrcodeCoverTime();
}

const closeDialog = function () {
  dialogVisible.value = false;
}

const getPayTypeList = async function () { //获取支付方式列表
  try{
    let url = window.Constants.uploadUrl + "/pay/getPayTypeList";
    const uniqueParam = Date.now();
    const response = await axios.get(url, {
      params: {
        timestamp: uniqueParam
      },
      headers: {
        "access-token": localStorage.getItem('token')
      }
    });
    console.log("getPayTypeList", response.data);
    if (response.data.code == 0) {
      response.data.data.push({
        description:'使用余额支付',
        name:"Balance",
        payname:"balance"
      })
      // 对比 payname，只保留接口返回的支付方式
      const validPaynames = response.data.data.map(item => item.payname);
      paymentMethods.value.forEach(item => {
        item.enable = validPaynames.includes(item.payname);
      });
      // 设置支付选项为第一个可用的 payname
      if (paymentMethods.value.length > 0) {
        paymentOptions.value = paymentMethods.value.find(item => item.enable)?.payname || "";
        ConfirmPayment(paymentOptions.value) //重新获取二维码
      }
    }
  }catch(error){
    console.error('获取数据失败:', error);
    ConfirmPayment(paymentOptions.value) //重新获取二维码
  }
}

defineExpose({
  //productType 产品类型 1:购买vip 2:购买AI项目	
  //productId 产品类型对应的值
  async openQRCodePayment(productType, productId) {
    // console.log("orderInfo", orderInfo)
    // console.log("plans", data)
    if (productType == 1) {
      projectJudg.value = true;
    } else {
      projectJudg.value = false;
    }

    ProductType.value = productType;
    ProductId.value = productId;

    dialogVisible.value = true;
    //协议开局默认开启
    subScriptionInformation.value = true;

    couponCode.value = paystore.couponCode;
    getPayTypeList()

  }
})
</script>

<style scoped>
.line-limit-length {
  display: -webkit-box;
  /* 设置为WebKit内核的弹性盒子模型 */
  -webkit-box-orient: vertical;
  /* 垂直排列 */
  line-clamp: 2;
  /* 限制显示两行 */
  overflow: hidden;
  /* 隐藏超出范围的内容 */
  text-overflow: ellipsis;
  /* 使用省略号 */
}

.paymode .ep-radio-button {
  --ep-radio-button-checked-bg-color: var(--ep-bg-color);
  --ep-radio-button-checked-text-color: var(--ep-menu-text-color);
  --ep-radio-button-checked-border-color: var(--ep-color-info);
  --ep-radio-button-disabled-checked-fill: var(--ep-border-color-extra-light);
}

.paymode /deep/.ep-radio-button__inner:hover {
  color: var(--ep-color-warning);
}

/* 为每三个元素添加左边框 */
.paymode /deep/.ep-radio-button:nth-child(3n) .ep-radio-button__inner {
  border-left: var(--ep-border);
}

/* 为换行后的第一个元素添加左边框 */
.paymode /deep/.ep-radio-button:nth-child(3n+1):not(:first-child) .ep-radio-button__inner {
  border-left: var(--ep-border);
}

/* 点击状态时移除左边框 */
.paymode /deep/.ep-radio-button:nth-child(3n+1):not(:first-child) .ep-radio-button__inner:active {
  border-left: 0;
}

.payment-confirmation {
  display: flex;
  flex-direction: column;
  align-items: center;
  /* gap: 1rem; */
}

.product-info,
.qrcode {
  position: relative;
  text-align: center;
}

.qrcode-cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 244px;
  background-color: rgba(0, 0, 0, 0.90);
  background-size: cover;
}

.qrcode-cover-text {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 余额支付样式 */
.balance-display {
  text-align: center;
  padding: 16px;
  border-radius: 8px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border: 1px solid #e0e6ed;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.balance-pay-btn {
  width: 120px;
  height: 40px;
  border-radius: 20px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.balance-pay-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.3);
}

/* 密码对话框样式 */
.password-dialog-content {
  padding: 20px 0;
}

.password-dialog-content .el-input {
  --el-input-focus-border-color: #f56c6c;
}

.password-dialog-content .el-input__wrapper {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.password-dialog-content .el-input__wrapper:hover {
  box-shadow: 0 2px 12px rgba(245, 108, 108, 0.2);
}
</style>