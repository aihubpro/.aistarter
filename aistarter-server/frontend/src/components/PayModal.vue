<template>
    <BasicModal title="续费服务" @register="register" width="800px" @ok="handleCancel" @cancel="handleCancel" okText="确认" cancelText="取消">
      <div class="grid grid-cols-2 gap-4">
        <div 
          v-for="(item, index) in renewalOptions" 
          :key="index"
          class="border rounded-md p-4 cursor-pointer hover:border-primary transition-all duration-300"
          @click="handleSelect(item)"
        >
          <div class="text-lg font-bold mb-2">{{ item.label }}</div>
          <div class="text-2xl text-primary mb-2">¥{{ item.price }}</div>
          <div class="text-gray-500 text-sm">{{ item.description }}</div>
        </div>
      </div>
    </BasicModal>
    <!-- 支付弹窗 -->
    <BasicModal
      @register="registerPayModal"
      :title="modalTitle"
      width="400px"
      :showOkBtn="false"
      :showCancelBtn="false"
      @visible-change="handleVisibleChange"
      @cancel="handlePayModalCancel"
    >
      <div class="text-center">
        <div class="mb-4 text-lg">请扫码支付：¥{{ currentPrice }}</div>
        <div class="mb-4">
          <a-radio-group v-model:value="payType" button-style="solid" @change="handlePayTypeChange">
            <a-radio-button v-for="item in payTypeOptions" :key="item.value" :value="item.value">
              <Icon :icon="item.icon" class="mr-1" />
              {{ item.label }}
            </a-radio-button>
          </a-radio-group>
        </div>
        <div class="flex justify-center">
          <template v-if="payType === 'paypal'">
            <div class="w-[200px] flex flex-col items-center justify-center">
              <a-button type="primary" size="large" class="mb-4" @click="handlePaypalPay" :disabled="!qrCodeUrl" v-if="!qrCodeExpired">
                <Icon icon="ant-design:pay-circle-outlined" class="mr-1" />
                {{ qrCodeUrl ? '立即支付' : '正在创建订单...' }}
              </a-button>
              <a-button v-else type="primary" size="large" class="mb-4" @click="refreshQrCode">
                点击刷新
              </a-button>
              <div class="text-sm text-gray-500">点击按钮跳转至 PayPal 支付</div>
            </div>
          </template>
          <template v-else>
            <template v-if="!qrCodeExpired">
              <QrCode :value="qrCodeUrl" class="w-[200px] h-[200px]"/>
            </template>
            <template v-else>
              <div class="w-[200px] h-[200px] flex flex-col items-center justify-center bg-gray-100">
                <div class="text-gray-500 mb-4">二维码已过期</div>
                <a-button type="primary" @click="refreshQrCode">点击刷新</a-button>
              </div>
            </template>
          </template>
        </div>
        <div class="mt-4 text-gray-500">
          <template v-if="!qrCodeExpired">
            <div>{{ paymentStatus }}</div>
            <div class="text-sm">有效期：{{ Math.floor(countDown / 60) }}分{{ countDown % 60 }}秒</div>
          </template>
          <template v-else>
            <div>{{ paymentStatus }}</div>
          </template>
        </div>
      </div>
    </BasicModal>
  </template>
  
  <script lang="ts" setup>
    import { ref } from 'vue'
    import { BasicModal,useModal } from '/@/components/Modal'
    import { useMessage } from '/@/hooks/web/useMessage'
    import { QrCode } from '/@/components/Qrcode/index';
    import { getCoRenewList,createCoOrder,checkCoPayOrder } from './CobPay.api'
  
    const { createMessage } = useMessage()
    const [register, { openModal }] = useModal()
    const [registerPayModal, { openModal: openPayModal }] = useModal()

    const payType = ref('wechat')
    const modalTitle = ref('订单支付')
    const payTypeOptions = [
      {
        value: 'wechat',
        label: '微信支付',
        icon: 'ant-design:wechat-outlined'
      },
      {
        value: 'alipay',
        label: '支付宝',
        icon: 'ant-design:alipay-outlined'
      },
      {
        value:'paypal',
        label: 'PayPal',
        icon: 'ant-design:pay-circle-outlined'
      }
    ]

    // 添加倒计时相关的响应式变量
    const qrCodeExpired = ref(false)
    const countDown = ref(0)
    let countDownTimer: NodeJS.Timer | null = null

    // PayPal 支付处理
    const handlePaypalPay = () => {
        if (qrCodeUrl.value) {
            const width = 800
            const height = 600
            const left = (window.screen.width - width) / 2
            const top = (window.screen.height - height) / 2
            window.open(
                qrCodeUrl.value,
                'PayPal支付',
                `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,status=no,scrollbars=yes`
            )
        }
    }

    // 处理二维码过期
    const handleQrCodeExpired = () => {
        qrCodeExpired.value = true
        stopPolling()
        paymentStatus.value = '二维码已过期，请点击刷新'
    }

    // 开始倒计时
    const startCountDown = () => {
        countDown.value = 300 // 5分钟倒计时
        qrCodeExpired.value = false
        if (countDownTimer) clearInterval(countDownTimer)
        
        countDownTimer = setInterval(() => {
        if (countDown.value > 0) {
            countDown.value--
        } else {
            handleQrCodeExpired()
            clearInterval(countDownTimer!)
        }
        }, 1000)
    }

    // 刷新二维码
    const refreshQrCode = async () => {
        if (currentOrderInfo.value) {
        await handlePayTypeChange()
        startCountDown()
        }
    }

    const orderId = ref('')
    const currentOrderInfo = ref(null)

    // 处理支付方式变化
    const handlePayTypeChange = async () => {
        if (!currentOrderInfo.value) return
        qrCodeUrl.value = ''
        try {
        const res = await createCoOrder({
            pay_type: payType.value,
            product_type: currentOrderInfo.value.productType,
            product_id: currentOrderInfo.value.productId,
        })
        
        if (res.code === 0) {
            currentPrice.value = res.amount / 100
            qrCodeUrl.value = res.code_url
            orderId.value = res.order_no
            paymentStatus.value = '等待支付...'
            startCountDown()
        } else {
            createMessage.error('获取支付二维码失败')
        }
        } catch (error) {
        console.error('获取支付二维码失败:', error)
        createMessage.error('获取支付二维码失败')
        }
    }
    
    const paymentStatus = ref('等待支付...')
    let pollingTimer: NodeJS.Timer | null = null

    // 处理弹窗显示状态变化
    const handleVisibleChange = (visible: boolean) => {
        if (visible) {
        startPolling()
        startCountDown()
        } else {
        stopPolling()
        if (countDownTimer) {
            clearInterval(countDownTimer)
            countDownTimer = null
        }
        }
    }

    // 开始轮询
    const startPolling = () => {
        pollingTimer = setInterval(async () => {
        try {
            // console.log('检查支付状态...')
            // TODO: 替换为实际的支付状态检查 API
            const response = await checkCoPayOrder({order_no:orderId.value})
            // 根据不同支付状态处理
            if (response.state === 0) {
            paymentStatus.value = '等待支付...'
            } else if (response.state === 1) {
            paymentStatus.value = '支付成功'
            stopPolling()
            setTimeout(() => {
                openPayModal(false)
                createMessage.success('支付成功')
                createMessage.info({
                content: '您的订单已支付成功，系统将在管理员审核后自动续费，请耐心等待',
                duration: 20
                })
            }, 1000)
            } else if (response.state === 2) {
            paymentStatus.value = '支付失败'
            stopPolling()
            createMessage.error('支付失败，请重新尝试')
            setTimeout(() => {
                openPayModal(false)
            }, 1500)
            } else if (response.state === 3) {
            paymentStatus.value = '订单已取消'
            stopPolling()
            createMessage.warning('订单已取消')
            setTimeout(() => {
                openPayModal(false)
            }, 1500)
            }
        } catch (error) {
            console.error('检查支付状态失败:', error)
        }
        }, 3000) // 每3秒检查一次
    }
    

    // 停止轮询
    const stopPolling = () => {
        if (pollingTimer) {
        clearInterval(pollingTimer)
        pollingTimer = null
        }
    }

    const handlePayModalCancel = () => {
        stopPolling()
        paymentStatus.value = '等待支付...'
    }

    const currentPrice = ref(0)
    const qrCodeUrl = ref('')

    const handleClick = (item = false) => {
        if (item) {
        openModal(true)
        }
    }

    const handleSelect = async (item) => {
        try {
        currentOrderInfo.value = item // 保存当前订单信息
        modalTitle.value = `${item.label}` 
        qrCodeUrl.value = ''
        // 先保存价格和商品信息
        const res = await createCoOrder({
            pay_type: payType.value,
            product_type: item.productType,
            product_id: item.productId,
        })
        
        if (res.code === 0) {
            currentPrice.value = res.amount / 100
            // 确保状态更新后再打开弹窗
            qrCodeUrl.value = res.code_url
            orderId.value = res.order_no
            // 重置支付状态
            paymentStatus.value = '等待支付...'
            startCountDown()
            // 最后打开弹窗
            openPayModal(true)
        } else {
            createMessage.error('创建订单失败')
        }
        } catch (error) {
        console.error('创建订单失败:', error)
        createMessage.error('创建订单失败')
        }
    }
  
    interface RenewalOption {
      productType: number
      productId: number
      label: string
      price: number
      description: string
    }
  
    const renewalOptions = ref([] as RenewalOption[])
    const loading = ref(false)
  
    async function getAuthList() {
      try {
        loading.value = true
        // TODO: 替换为实际的 API 地址
        const res = await getCoRenewList()
        console.log('res', res)
        if(res.code !== 0) {
          createMessage.error(res.msg)
          return
        }
        renewalOptions.value = res.plans.map(item => ({
          productType: item.productType,
          productId: item.productId,
          label: `${item.title}`,
          price: item.price,
          description: item.desc
        }))
      } catch (error) {
        createMessage.error('获取授权列表失败')
        console.error('获取授权列表失败:', error)
      } finally {
        loading.value = false
      }
    }
  
    function handleCancel() {
      openModal(false)
    }
    const openPayModal2 = async () => {
        await getAuthList(); // 先获取数据
        openModal(true)
    };
    defineExpose({
        openPayModal2
    })
  </script>
  
  <style scoped>
  .border-primary {
    border-color: var(--ant-primary-color);
  }
  .text-primary {
    color: var(--ant-primary-color);
  }
  </style>