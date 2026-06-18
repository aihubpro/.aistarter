<template>
  <div class="p-4">
    <!--  订单数  -->
    <DashBoardCount :loading="loading" :data="orderListData" class="enter-y" />
  </div>
</template>
<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue'
  import DashBoardCount from './components/DashBoardCount.vue'
  import { checkDomainAuthorizationInHome } from '/@/settings/domainConfig'

  import {
    DashBoardInfo,
    getDashBoardInfo,
  } from '/@/views/dashboard/analysis/components/CockpitReport.api'
  import { $ref } from 'vue/macros'

  const loading = ref(false)
  const expirerenew = ref(false)

  /**
   * 初始化
   */
  onMounted(() => {
    initDashBoardInfo()
  })

  let payAmount = $ref<number>(0)
  let orderCount = $ref<number>(0)
  let menberCount = $ref<number>(0)
  let collabexpire = $ref<string|number>('2025-1-1') //共创者过期时间 || 共创者会员数量
  let collabtitle = $ref<string>('过期时间') //共创者”过期时间“标题 || 共创会员 标题
  let collabactive = $ref<string>('立即续费') //共创者’时间单位‘ || 共创会员 单位人数标识
  let collabexpirenum = $ref<number>(0) //共创者 过期人数


  // 订单数量信息
  const orderListData = computed(() => [
    {
      title: '支付金额',
      value: payAmount,
      icon: 'total-sales|svg',
      action: '单位(元)',
      decimals: 2,
    },
    {
      title: '支付订单数',
      value: orderCount,
      icon: 'transaction|svg',
      action: '',
      decimals: 0,
    },
    {
      title: '注册会员',
      value: menberCount,
      icon: 'visit-count|svg',
      action: '单位(人)',
      decimals: 0,
    },
    {
      title: collabtitle,
      value: collabexpire,
      value2: collabexpirenum,
      icon: 'visit-count|svg',
      action: collabactive,
      decimals: 0,
      renewal: expirerenew.value,
    },
  ])

  /**
   * 初始化订单信息
   */
  async function initDashBoardInfo() {
    let result = await checkDomainAuthorizationInHome()
    console.log(result)
    if(result.coll_type == 1){ // 年卡
      collabexpire = result.expiry_time 
      //判断是否过期
      if(result.isexpiry){
        collabexpire = '已过期'
      }
      expirerenew.value = true
    }else if(result.coll_type == 2){ // 永久
      collabexpire = '永久使用'
      collabactive = ''
      expirerenew.value = false
    }
    getDashBoardInfo().then(({ data }) => {
      payAmount = data.payAmount;
      orderCount = data.orderCount;
      menberCount = data.menberCount;
      if(result.isServer){
        collabtitle = '共创者'
        collabexpire = data.coMenberCount
        collabexpirenum = data.coMenberExpireCount
        collabactive = '单位(人)'
        expirerenew.value = false
      }
    })
  }

</script>
