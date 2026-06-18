<template>
    <div>
      <div class="m-3 p-3 bg-white">
        <a-spin :spinning="loading">
          <a-form ref="formRef" :validate-trigger="['blur', 'change']" :label-col="{ span: 12 }" :model="form" :rules="rules">
            <a-row>
              <a-col :span="20">
                <a-form-item class="w-800px" name="密钥">
                  <template #label>
                    <basic-title helpMessage="123云盘中设置密钼为"> 密钥 </basic-title>
                  </template>
                  <a-input placeholder="请输入Key ID" v-model:value="form.KeyId" :disabled="!edit" />
                </a-form-item>
              </a-col>
              <a-col :span="20">
                <a-form-item class="w-800px" name="链接有效期（秒）">
                  <template #label>
                    <basic-title helpMessage="链接过期时间"> 链接有效期（秒） </basic-title>
                  </template>
                  <a-input placeholder="请输入LinkExp" v-model:value="form.LinkExp" :disabled="!edit" />
                </a-form-item>
              </a-col>
              <a-col :span="20">
                <a-form-item class="w-800px" name="云盘UID">
                  <template #label>
                    <basic-title helpMessage="云盘UID">
                      云盘UID
                    </basic-title>
                  </template>
                  <a-input placeholder="请输云盘UID" v-model:value="form.CloneUid" :disabled="!edit" />
                </a-form-item>
              </a-col>
              <a-col :span="20">
                <a-form-item class="w-800px" name="dailyLimintDownload">
                  <template #label>
                    <basic-title helpMessage="每日最多下载次数限制"> 下载限制 </basic-title>
                  </template>
                  <a-input placeholder="请输每日下载的次数" v-model:value="form.dailyLimintDownload" :disabled="!edit" />
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
    import { getConfig, update, Oss123PlatformConfig } from './OssPlatformConfig.api'
    import { $ref } from 'vue/macros'
    import { FormInstance, Rule } from 'ant-design-vue/lib/form'
    import { useMessage } from '/@/hooks/web/useMessage'
    import BasicTitle from '/@/components/Basic/src/BasicTitle.vue'
  
    const { createConfirm, createMessage } = useMessage()
  
    let form = $ref<Oss123PlatformConfig>({})
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
        content: '是否配置OSS相关信息',
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
  