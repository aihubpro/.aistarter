<template>
  <div>
    <div class="m-3 p-3 bg-white">
      <a-spin :spinning="loading">
        <a-form ref="formRef" :validate-trigger="['blur', 'change']" :label-col="{ span: 12 }" :model="form" :rules="rules">
          <a-row>
            <a-col :span="20">
              <a-form-item class="w-800px" name="hostUrl">
                <template #label>
                  <basic-title helpMessage="本系统的后台API的访问地址"> 系统地址 </basic-title>
                </template>
                <a-input placeholder="请输入网站地址" v-model:value="form.hostUrl" :disabled="!edit" />
              </a-form-item>
            </a-col>
            <a-col :span="20">
              <a-form-item class="w-800px" name="yearVipPrice">
                <template #label>
                  <basic-title helpMessage="年会员价格（元）"> 年会员价格 </basic-title>
                </template>
                <a-input placeholder="请输入价格" v-model:value="form.yearVipPrice" :disabled="!edit" />
              </a-form-item>
            </a-col>
            <a-col :span="20">
              <a-form-item class="w-800px" name="permanentVipPrice">
                <template #label>
                  <basic-title helpMessage="永久会员价格（元）">
                    永久会员价格
                  </basic-title>
                </template>
                <a-input placeholder="请输入价格" v-model:value="form.permanentVipPrice" :disabled="!edit" />
              </a-form-item>
            </a-col>
            <a-col :span="20">
              <a-form-item class="w-800px" name="vipDiscount">
                <template #label>
                  <basic-title helpMessage="请输入会员折扣百分比"> 会员折扣 </basic-title>
                </template>
                <a-input placeholder="请输入折扣百分比" v-model:value="form.vipDiscount" :disabled="!edit" />
              </a-form-item>
            </a-col>
            <a-col :span="20">
              <a-form-item class="w-800px" name="yearVipDiscount">
                <template #label>
                  <basic-title helpMessage="请输入购买年度订阅折扣百分比，0表示没有折扣"> 年度订阅折扣 </basic-title>
                </template>
                <a-input placeholder="请输入折扣百分比" v-model:value="form.yearVipDiscount" :disabled="!edit" />
              </a-form-item>
            </a-col>
            <a-col :span="20">
              <a-form-item class="w-800px" name="permanentVipDiscount">
                <template #label>
                  <basic-title helpMessage="请输入购买永久订阅折扣百分比，0表示没有折扣"> 永久订阅折扣 </basic-title>
                </template>
                <a-input placeholder="请输入折扣百分比" v-model:value="form.permanentVipDiscount" :disabled="!edit" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row>
            <a-col :push="8">
              <a-button v-if="edit" @click="initData">取消</a-button>
              <a-button v-if="edit" style="margin-left: 50px" type="primary" @click="updateConfig">更新</a-button>
              <a-button v-if="!edit" @click="edit = true">编辑信息</a-button>
            </a-col>
          </a-row>
        </a-form>
      </a-spin>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, computed } from 'vue'
  import { getConfig, update, PayPlatformConfig } from './PayPlatformConfig.api'
  import { $ref } from 'vue/macros'
  import { FormInstance, Rule } from 'ant-design-vue/lib/form'
  import { useMessage } from '/@/hooks/web/useMessage'
  import BasicTitle from '/@/components/Basic/src/BasicTitle.vue'

  const { createConfirm, createMessage } = useMessage()

  let form = $ref<PayPlatformConfig>({})
  let loading = $ref(false)
  const formRef = $ref<FormInstance>()
  let edit = $ref(false)

  const rules = computed(() => {
    return {
      // limitAmount: [{ required: true, message: '请输入订单支付限额' }],
      // reqSign: [{ required: true, message: '请选择签名类型' }],
      // signType: [{ required: form.reqSign, message: '请选择签名类型' }],
      // signSecret: [{ required: form.reqSign, message: '请输入签名密钥' }],
      // orderTimeout: [{ required: true, message: '请输入订单默认超时时间(分钟)' }],
      // reqTimeout: [{ required: true, message: '请输入请求有效时长(秒)' }],
    } as Record<string, Rule[]>
  })

  onMounted(() => initData())

  /**
   * 初始化数据
   */
  function initData() {
    edit = false
    loading = true
    getConfig().then(({ data }) => {
      form = data
      loading = false
    })
  }

  /**
   * 保存或更新配置
   */
  async function updateConfig() {
    await formRef?.validate()
    createConfirm({
      iconType: 'warning',
      title: '警告',
      content: '是否支付配置相关信息',
      onOk: async () => {
        loading = true
        const updateFrom = { ...form }
        await update(updateFrom)
        edit = false
        createMessage.success('更新成功')
        initData()
      },
    })
  }
</script>

<style lang="less" scoped></style>
