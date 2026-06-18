<template>
  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px" @open="updatePriceInfo()" @closed="handleDialogClose" center>
    <el-carousel indicator-position="outside" :autoplay="false" height="400px" :initial-index="carouselIndex" ref="carousel">
      <el-carousel-item v-for="(group, groupIndex) in groupedPlans" :key="groupIndex">
        <div class="membership-purchase">
          <el-card v-for="(plan, index) in group" :key="index" :body-style="{ padding: '20px' }"
            class="purchase-plan relative">
            <!-- 优惠价标签 -->
            <div class="absolute top-15px left-110px rotate-40deg flex w-200px discount-logo"
              style="flex-direction: column;align-items: center;">
              <div class="w-full" style="background-color: var(--ep-color-warning);color: white;" v-if="plan.discount != 0">
                {{ $t('subcenter.time_limited_discount') }}
              </div>
              <!-- <el-tag type="warning" size="small" v-if="plan.discount != 0">限时优惠</el-tag> -->
              <!-- <el-tag type="primary" size="small" v-if="plan.discount == 0">原价</el-tag> -->
            </div>
            <h2>{{ plan.title }}</h2>
            <div class="price flex justify-center relative" v-if="plan.discount != 0">
              <el-tag type="success" class="font-bold absolute left-0" effect="plain">{{ $t('subcenter.time_limited') }}</el-tag>
              <div v-if="plan.discount>0">￥{{ plan.discount }}{{$t('subcenter.yuan')}}</div>
            </div>
            <div class="price" v-if="plan.discount == 0">{{ typeof plan.price == 'string'?plan.price:'￥'+ plan.price +$t('subcenter.yuan')}}</div>
            <div class="flex justify-center relative">
              <el-tag type="info" class="font-bold absolute left-0" v-if="plan.discount != 0" effect="plain">{{ $t('subcenter.list_price') }}</el-tag>
              <del :class="plan.discount != 0 ? 'discount' : 'discount-hide'">{{ typeof plan.price == 'string'?plan.price:'￥'+ plan.price +$t('subcenter.yuan')}}</del>
            </div>
            <div class="benefits">
              <el-scrollbar height="200px">
                <p v-for="benefit in plan.benefits" :key="benefit">
                  {{ benefit }}
                </p>
              </el-scrollbar>
            </div>
            <div class="button-container">
              <el-button :type="plan.btnType" round @click="purchase(plan)">{{ plan.btnText }}</el-button>
            </div>
          </el-card>
        </div>
      </el-carousel-item>
    </el-carousel>
    <template #footer>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, inject, onMounted,computed } from 'vue'
import axios from 'axios'
import { ElMessage, ElLoading, ElMessageBox } from "element-plus";
import { useI18n } from "vue-i18n";
const { t } = useI18n()
const dialogVisible = ref(false)
const dialogTitle = ref(t('subcenter.loyalty_program'))
const carouselIndex = ref(0)
const carousel = ref(null)
const handleDialogClose = () => {
  setTimeout(() => {
    carouselIndex.value = 0
    if (carousel.value) {
      carousel.value.setActiveItem(0)
    }
  }, 300)
}
const { openPaymentSelection, openQRCodePayment } = inject('main');

let cachePlansData = null;

// 添加计算属性，将plans分组
const groupedPlans = computed(() => {
  const result = []
  const itemsPerGroup = 3
  
  for (let i = 0; i < plans.value.length; i += itemsPerGroup) {
    result.push(plans.value.slice(i, i + itemsPerGroup))
  }
  
  return result
})

//折扣取整
const discount = (price, discount) => {
  return Math.floor(price*(1-(discount/100))).toFixed(2);
}

const plans = ref([
  {
    productType: 1,
    productId: 1,
    title: '年度订阅',
    price: '-',
    discount: "0",
    btnText: '购买会员',
    btnType: 'warning',
    benefits: [
      '一年内所有更新',
      '标准技术支持',
      '会员专属下载',
      '创作者项目优惠(20-30%)',
      '优先体验新功能',
      '社群特权'
    ],
  },
  {
    productType: 1,
    productId: 2,
    title: '永久订阅',
    price: '-',
    discount: "0",
    btnText: '购买会员',
    btnType: 'warning',
    benefits: [
      '永久更新',
      '标准技术支持',
      '会员专属下载',
      '创作者项目优惠(20-30%)',
      '优先体验新功能',
      '社群特权'
    ],
  },
  {
    productType: 1,
    productId: 3,
    title: '共创模式',
    price: '定制化价格',
    discount: "0",
    btnText: '联系我们',
    btnType: 'danger',
    benefits: [
      '专属技术支持',
      ' 1对1技术支持',
      '软件定制',
      '自主管理后台',
      '收入归共创者',
      '　'
    ],
  },
])

async function purchase(plan) {
  function isString(value) {
    return Object.prototype.toString.call(value) === '[object String]';
  }
  if (plan &&isString(plan.price)) {

    ElMessageBox.alert(`<p>QQ：594691248　　${t('subcenter.cell_me_phone')}：13798993960 <br>${t('subcenter.cell_me_email')}：a@chenzhixiong.cn</p>`, t('subcenter.cell_me'), {
      dangerouslyUseHTMLString: true,
      confirmButtonText: t('subcenter.cell_me_confirm'),
    })
    return;
  }

  let token = localStorage.getItem('token');

  if (!token || token == "") {
    ElMessage.error(t('subcenter.please_login'));
    return;
  }

  if (!cachePlansData) {
    ElMessage.warning(t('subcenter.please_wait'));
    return;
  }

  // alert(`您选择了购买 ${plan.title}，价格为 ${plan.price}`)
  // openPaymentSelection(plan.productType, plan.productId);

  openQRCodePayment(plan.productType, plan.productId);
}

const updatePriceInfo = async () => {
  let url = window.Constants.uploadUrl + "/pay/vip-price-V2";
  try {
    const response = await axios.get(url, {
      params: {},
      headers: {
        "access-token": localStorage.getItem('token')
      }
    });

    console.log(response.data)
    let plansData = response.data.plans;
    plans.value = plansData;
    // plans.value[0].price = plansData[0].price;
    // plans.value[1].price = plansData[1].price;
    
    // plans.value[0].discount = plansData[0].discountPrice||0;
    // plans.value[1].discount = plansData[1].discountPrice||0;

    cachePlansData = plansData;
  } catch (error) {
    console.error('获取数据失败:', error);
    ElMessage.error(t('subcenter.please_wait_no'));
  }
}

//当组件挂载
// onMounted(async () => {
//   updatePriceInfo();
// })

defineExpose({
  openPurchaseMembership() {
    dialogVisible.value = true
    carouselIndex.value = 0
    setTimeout(() => {
      if (carousel.value) {
        carousel.value.setActiveItem(0)
      }
    }, 0)
  }
})

</script>

<style scoped>
.membership-purchase {
  display: flex;
  justify-content: flex-start;
}

.purchase-plan {
  flex: 0 0 auto;
  min-width: 240px;
  /* margin-bottom: 20px; */
  text-align: center;
}

.purchase-plan+.purchase-plan {
  margin-left: 20px;
}

.price {
  font-size: 1.5em;
  color: #ff6600;
  font-weight: 600;
  /* margin: 10px 0; */
  margin-bottom: 10px;
}

.discount {
  font-size: 1.2em;
  color: #b36632;
}

.discount-hide {
  font-size: 1.2em;
  color: rgba(0, 0, 0, 0);
  background-color: rgba(0, 0, 0, 0);
}

@keyframes searchLights {
  0% {
    left: -200px;
    top: -300px;
  }

  100% {
    left: -160px;
    top: 800px;
  }
}

.discount-logo {
  overflow: hidden;
  transition-duration: 5s;
}

.discount-logo::before {
  content: "";
  position: absolute;
  width: 1000px;
  height: 40px;
  background-image: linear-gradient(to bottom, transparent, rgba(255, 255, 255, .5), transparent);
  -webkit-transform: rotate(-45deg);
  -moz-transform: rotate(-45deg);
  -ms-transform: rotate(-45deg);
  -o-transform: rotate(-45deg);
  transform: rotate(-45deg);
  -webkit-animation: searchLights 1s ease-in 1s infinite;
  -o-animation: searchLights 1s ease-in 1s infinite;
  animation: searchLights 2.5s ease-in 3s infinite;
}

.benefits {
  min-height: 200px;
}
.benefits li {
  list-style: none;
  margin-bottom: 5px;
}

.button-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 5px;
}
</style>