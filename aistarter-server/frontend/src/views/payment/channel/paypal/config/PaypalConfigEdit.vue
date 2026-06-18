<template>
    <basic-drawer showFooter v-bind="$attrs" width="60%" title="PayPal支付配置" :visible="visible" :maskClosable="false" @close="handleCancel">
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
            <a-input v-model:value="form.id" :disabled="showable" />
          </a-form-item>
          <a-form-item label="客户端ID" name="clientID">
            <a-input v-model:value="form.clientID" :disabled="showable" placeholder="请输入客户端ID" />
          </a-form-item>
          <a-form-item label="密钥" name="secret">
            <a-textarea :rows="3" :disabled="showable" v-model:value="form.secret" placeholder="请输入密钥" />
          </a-form-item>
          <a-form-item label="汇率" name="rate">
            <a-input v-model:value="form.rate" :disabled="showable" placeholder="汇率" />
          </a-form-item>
          <a-form-item label="是否启用" name="enable">
            <a-switch checked-children="启用" un-checked-children="停用" v-model:checked="form.enable" />
          </a-form-item>
          <a-form-item name="notifyUrl">
            <template #label>
              <basic-title helpMessage="接收PayPal支付相关的回调数据的地址"> 异步通知地址 </basic-title>
            </template>
            <a-input v-model:value="form.notifyUrl" placeholder="请输入异步通知地址" style="width: calc(100% - 80px)" />
            <a-button class="w-80px" type="primary" @click="genNotifyUrl">自动生成</a-button>
          </a-form-item>
          <a-form-item label="沙箱环境" name="sandbox">
            <a-switch checked-children="是" un-checked-children="否" v-model:checked="form.sandbox" />
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
    import { getConfig, update, generateNotifyUrl, PaypalConfig } from './PaypalConfig.api'
    import { FormInstance, Rule } from 'ant-design-vue/lib/form'
    import { BasicDrawer } from '/@/components/Drawer'
    import Icon from '/@/components/Icon/src/Icon.vue'
    import { useUpload } from '/@/hooks/bootx/useUpload'
    import { useMessage } from '/@/hooks/web/useMessage'
    import { LabeledValue } from 'ant-design-vue/lib/select'
    import BasicTitle from '/@/components/Basic/src/BasicTitle.vue'
  
    const { handleCancel, diffForm, labelCol, wrapperCol, confirmLoading, visible, showable } = useFormEdit()
    // 文件上传
    const { tokenHeader, uploadAction } = useUpload('/wechat/pay/config/toBase64')
    const { createMessage } = useMessage()
  
    // 表单
    const formRef = $ref<FormInstance>()
    let rawForm: any
    let form = $ref<PaypalConfig>({
      id: null,
      enable: false,
      limitAmount: 20000,
      clientID:'',
      secret: '',
      rate:0,
      notifyUrl: '',
      sandbox: false,
      remark: '',
    })
    // 校验
    const rules = computed(() => {
      return {
        limitAmount: [{ required: true, message: '请输入单次支付限额' }],
        enable: [{ required: true, message: '请选择是否启用' }],
        notifyUrl: [{ required: true, message: '请输入异步通知页面地址' }],
        sandbox: [{ required: true, message: '请选择是否为沙箱环境' }],
      } as Record<string, Rule[]>
    })
  
    let payWayList = $ref<LabeledValue[]>([])
  
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
    // 获取信息
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
    // 保存
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
        handleCancel()
        createMessage.success('保存成功')
        emits('ok')
      })
    }
  
    // 重置表单
    function resetForm() {
      nextTick(() => {
        formRef?.resetFields()
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
  
    defineExpose({
      init,
    })
  </script>
  
  <style lang="less" scoped></style>
  