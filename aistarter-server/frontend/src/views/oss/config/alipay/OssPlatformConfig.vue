<template>
    <div>
      <div class="m-3 p-3 bg-white">
        <a-spin :spinning="loading">
          <a-form ref="formRef" :validate-trigger="['blur', 'change']" :label-col="{ span: 12 }" :model="form" :rules="rules">
            <a-row>
              <a-col :span="20">
                <a-form-item class="w-800px" name="accessKeyId">
                  <template #label>
                    <basic-title helpMessage="已创建RAM用户的AccessKey ID"> AccessKey ID </basic-title>
                  </template>
                  <a-input placeholder="请输入AccessKey ID" v-model:value="form.accessKeyId" :disabled="!edit" />
                </a-form-item>
              </a-col>
              <a-col :span="20">
                <a-form-item class="w-800px" name="accessKeySecret">
                  <template #label>
                    <basic-title helpMessage="已创建RAM用户的AccessKey Secret"> AccessKey Secret </basic-title>
                  </template>
                  <a-input placeholder="请输入AccessKey Secret" v-model:value="form.accessKeySecret" :disabled="!edit" />
                </a-form-item>
              </a-col>
              <a-col :span="20">
                <a-form-item class="w-800px" name="region">
                  <template #label>
                    <basic-title helpMessage="示例：'oss-cn-hangzhou'，填写Bucket所在地域。">
                      Bucket区域
                    </basic-title>
                  </template>
                  <a-input placeholder="请输Bucket所在地域" v-model:value="form.region" :disabled="!edit" />
                </a-form-item>
              </a-col>
              <a-col :span="20">
                <a-form-item class="w-800px" name="bucket">
                  <template #label>
                    <basic-title helpMessage="示例：'my-bucket-name'，填写存储空间名称。"> 存储空间名称 </basic-title>
                  </template>
                  <a-input placeholder="请输入存储空间名称" v-model:value="form.bucket" :disabled="!edit" />
                </a-form-item>
              </a-col>
              <a-col :span="20">
                <a-form-item class="w-800px" name="roleArn">
                  <template #label>
                    <basic-title helpMessage="角色ARN，例如acs:ram::175708322470****:role/ramtest"> 角色ARN </basic-title>
                  </template>
                  <a-input placeholder="请输入角色ARN" v-model:value="form.roleArn" :disabled="!edit" />
                </a-form-item>
              </a-col>
              <a-col :span="20">
                <a-form-item class="w-800px" name="customeDomain">
                  <template #label>
                    <basic-title helpMessage="自定义域名，没有则不填"> 自定义域名 </basic-title>
                  </template>
                  <a-input placeholder="请输入自定义域名" v-model:value="form.customeDomain" :disabled="!edit" />
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
    import { getConfig, update, OssAliPlatformConfig } from './OssPlatformConfig.api'
    import { $ref } from 'vue/macros'
    import { FormInstance, Rule } from 'ant-design-vue/lib/form'
    import { useMessage } from '/@/hooks/web/useMessage'
    import BasicTitle from '/@/components/Basic/src/BasicTitle.vue'
  
    const { createConfirm, createMessage } = useMessage()
  
    let form = $ref<OssAliPlatformConfig>({})
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
  