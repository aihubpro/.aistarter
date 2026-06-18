<template>
  <basic-drawer
    showFooter
    v-bind="$attrs"
    width="60%"
    title="支付宝支付配置"
    :visible="visible"
    :maskClosable="false"
    @close="handleCancel"
  >
    <a-spin :spinning="confirmLoading">
      <a-form
        class="small-from-item"
        ref="formRef"
        :model="form"
        :rules="rules"
        :validate-trigger="['blur', 'change']"
        :label-col="labelCol"
        :wrapper-col="wrapperCol"
      >
        <a-form-item label="主键" name="id" :hidden="true">
          <a-input v-model:value="form.id" />
        </a-form-item>
        <a-form-item label="AppId" name="appId">
          <a-input v-model:value="form.appId" placeholder="请输入支付宝商户AppId" />
        </a-form-item>
        <a-form-item label="是否启用" name="enable">
          <a-switch checked-children="启用" un-checked-children="停用" v-model:checked="form.enable" />
        </a-form-item>
        <a-form-item name="notifyUrl">
          <template #label>
            <basic-title helpMessage="为本网关接收支付宝相关的异步回调数据的地址, 而不是业务系统所需的地址"> 异步通知地址 </basic-title>
          </template>
          <a-input v-model:value="form.notifyUrl" placeholder="请输入异步通知地址" style="width: calc(100% - 80px)" />
          <a-button class="w-80px" type="primary" @click="genNotifyUrl">自动生成</a-button>
        </a-form-item>
        <a-form-item label="沙箱环境" name="sandbox">
          <a-switch checked-children="是" un-checked-children="否" v-model:checked="form.sandbox" />
        </a-form-item>
        <a-form-item label="签名类型" name="signType">
          <a-select allowClear v-model:value="form.signType" style="width: 100%" placeholder="选择签名类型">
            <a-select-option key="RSA2">RSA2秘钥</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="支付宝公钥" name="alipayPublicKey">
          <a-textarea :rows="5" v-model:value="form.alipayPublicKey" placeholder="请输入支付宝公钥" />
        </a-form-item>
        <a-form-item label="应用私钥" name="privateKey">
          <a-textarea :rows="5" v-model:value="form.privateKey" placeholder="请输入应用私钥" />
        </a-form-item>
      </a-form>
    </a-spin>
    <template #footer>
      <a-space>
        <a-button key="cancel" @click="handleCancel">取消</a-button>
        <a-button v-if="!showable" key="forward" :loading="confirmLoading" type="primary" @click="handleOk">保存</a-button>
      </a-space>
    </template>
  </basic-drawer>
</template>

<script lang="ts" setup>
  import { computed, nextTick } from 'vue'
  import { $ref } from 'vue/macros'
  import useFormEdit from '/@/hooks/bootx/useFormEdit'
  import { update, AlipayConfig, getConfig, generateNotifyUrl } from './AlipayConfig.api'
  import { FormInstance, Rule } from 'ant-design-vue/lib/form'
  import { BasicDrawer } from '/@/components/Drawer'
  import { LabeledValue } from 'ant-design-vue/lib/select'
  // import { useUpload } from '/@/hooks/bootx/useUpload'
  import { useMessage } from '/@/hooks/web/useMessage'
  import Icon from '/@/components/Icon/src/Icon.vue'
  import BasicTitle from '/@/components/Basic/src/BasicTitle.vue'
  const { handleCancel, diffForm, labelCol, wrapperCol, confirmLoading, visible, showable } = useFormEdit()
  // 读取证书内容
  // const { tokenHeader, uploadAction } = useUpload('/alipay/config/readPem')
  const { createMessage } = useMessage()

  const formRef = $ref<FormInstance>()

  let form = $ref({
    appId: '',
    enable: false,
    limitAmount: 0,
    notifyUrl: '',
    returnUrl: '',
    serverUrl: '',
    authType: 'key',
    signType: 'RSA2',
    alipayPublicKey: '',
    privateKey: '',
    sandbox: false,
    remark: '',
  } as AlipayConfig)
  let rawForm: any
  // 校验
  const rules = computed(() => {
    return {
      appId: [{ required: true, message: '请输入AppId' }],
      enable: [{ required: true, message: '请选择是否启用' }],
      limitAmount: [{ required: true, message: '请输入单次支付限额' }],
      notifyUrl: [{ required: true, message: '请输入异步通知页面地址' }],
      signType: [{ required: true, message: '请选择加密类型' }],
      alipayPublicKey: [{ required: true, message: '请输入支付宝公钥' }],
      privateKey: [{ required: true, message: '请输入支付私钥' }],
      sandbox: [{ required: true, message: '请选择是否为沙箱环境' }],
      expireTime: [{ required: true, message: '请输入默认超时配置' }],
    } as Record<string, Rule[]>
  })
  // 事件
  const emits = defineEmits(['ok'])
  /**
   * 入口
   */
  function init() {
    visible.value = true
    resetForm()
    getInfo()
  }
  /**
   * 获取信息
   */
  function getInfo() {
    confirmLoading.value = true

    getConfig().then(({ data }) => {
      rawForm = { ...data }
      // 分转元
      if (data.limitAmount) {
        data.limitAmount = data.limitAmount / 100
      }
      form = data
      confirmLoading.value = false
    })
  }
  /**
   * 更新
   */
  function handleOk() {
    formRef?.validate().then(async () => {
      confirmLoading.value = true
      const updateFrom = { ...form }
      // 元转分
      if (updateFrom.limitAmount) {
        updateFrom.limitAmount = updateFrom.limitAmount * 100
      }
      await update({
        ...updateFrom
      })
      confirmLoading.value = false
      createMessage.success('保存成功')
      handleCancel()
      emits('ok')
    })
  }

  /**
   * 生成异步通知地址
   */
  function genNotifyUrl() {
    generateNotifyUrl().then(({ data }) => {
      form.notifyUrl = data
      formRef?.validateFields(['notifyUrl'])
    })
  }

  /**
   * 重置表单
   */
  function resetForm() {
    nextTick(() => {
      formRef?.resetFields()
    })
  }
  defineExpose({
    init,
  })
</script>

<style lang="less" scoped></style>
