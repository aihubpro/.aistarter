<template>
  <BasicModal v-bind="$attrs" @register="register" :title="modalTitle" @cancel="handleCancel" @ok="handleOk" :okText="okText" cancelText="取消" :showOkBtn="!isReadonly">
    <a-descriptions :column="1" bordered>
      <a-descriptions-item label="企业ID">{{ enterprise.id }}</a-descriptions-item>
      <a-descriptions-item label="企业名称">{{ enterprise.name }}</a-descriptions-item>
      <a-descriptions-item label="企业代码">{{ enterprise.code }}</a-descriptions-item>
      <a-descriptions-item label="企业描述">{{ enterprise.description }}</a-descriptions-item>
      <a-descriptions-item label="统一社会信用代码">{{ enterprise.credit_code }}</a-descriptions-item>
      <a-descriptions-item label="法人代表">{{ enterprise.legal_person_name }}</a-descriptions-item>
      <a-descriptions-item label="创建者">{{ enterprise.creator_name }}</a-descriptions-item>
      <a-descriptions-item label="创建者邮箱">{{ enterprise.creator_email }}</a-descriptions-item>
      <a-descriptions-item label="银行卡号">{{ enterprise.bank_card }}</a-descriptions-item>
      <a-descriptions-item label="开户银行">{{ enterprise.bank_name }}</a-descriptions-item>
      <a-descriptions-item label="成员数量">{{ enterprise.member_count }}</a-descriptions-item>
      <a-descriptions-item label="营业执照">
        <a-image :src="imageUrl(enterprise.business_license_url+'?time='+new Date(enterprise.updated_at).getTime())" alt="营业执照" width="200px" height="120px" v-if="enterprise.business_license_url"/>
        <span v-else>未上传</span>
      </a-descriptions-item>
      <a-descriptions-item label="法人身份证正面">
        <a-image :src="imageUrl(enterprise.id_card_front_url+'?time='+new Date(enterprise.updated_at).getTime())" alt="法人身份证正面" width="200px" height="120px" v-if="enterprise.id_card_front_url"/>
        <span v-else>未上传</span>
      </a-descriptions-item>
      <a-descriptions-item label="法人身份证反面">
        <a-image :src="imageUrl(enterprise.id_card_back_url+'?time='+new Date(enterprise.updated_at).getTime())" alt="法人身份证反面" width="200px" height="120px" v-if="enterprise.id_card_back_url"/>
        <span v-else>未上传</span>
      </a-descriptions-item>
      <a-descriptions-item label="企业状态" v-if="!isReadonly">
        <a-select v-model:value="enterprise.status" style="width: 120px" @change="handleStatusChange" :disabled="isReadonly">
          <a-select-option :value="0">正常</a-select-option>
          <a-select-option :value="1">禁用</a-select-option>
        </a-select>
      </a-descriptions-item>
      <a-descriptions-item label="企业状态" v-else>
        <Tag v-if="enterprise.status == 0" color="orange">待审核</Tag>
        <Tag v-else-if="enterprise.status == 1" color="green">已审核</Tag>
        <Tag v-else-if="enterprise.status == 2" color="red">未通过</Tag>
        <Tag v-else color="default">未知</Tag>
      </a-descriptions-item>
      <a-descriptions-item label="提交时间">{{ enterprise.submit_date }}</a-descriptions-item>
      <a-descriptions-item label="审核时间" v-if="enterprise.audit_date">{{ enterprise.audit_date }}</a-descriptions-item>
      <a-descriptions-item label="创建时间">{{ enterprise.created_at }}</a-descriptions-item>
      <a-descriptions-item label="更新时间">{{ enterprise.updated_at }}</a-descriptions-item>
      <a-descriptions-item label="拒绝原因" v-if="enterprise.reject_reason">
        <a-textarea 
          v-model:value="enterprise.reject_reason" 
          :rows="3"
          :disabled="true"
        />
      </a-descriptions-item>
    </a-descriptions>
  </BasicModal>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { BasicModal, useModalInner } from '/@/components/Modal'
import { message, Tag } from 'ant-design-vue'
import { updateEnterpriseStatus } from './RegEnterpriseList.api'
import type { EnterpriseInfo } from './RegEnterpriseList.api'
import { useGlobSetting } from '/@/hooks/setting'

const globSetting = useGlobSetting()
const enterprise = reactive<EnterpriseInfo>({})
const isReadonly = ref(true)
const hasChanges = ref(false)

//图片地址
const imageUrl = (param) => { 
  return globSetting.apiUrl+'/assets/user-images/'+param
}

const modalTitle = computed(() => {
  return isReadonly.value ? '查看企业详情' : '编辑企业信息'
})

const okText = computed(() => {
  return isReadonly.value ? '关闭' : '保存'
})

const [register, { closeModal, setModalProps }] = useModalInner(async (data) => {
  console.log('接收到的企业数据:', data)
  
  // 重置状态
  hasChanges.value = false
  isReadonly.value = data.readonly || false
  
  // 设置模态框标题
  setModalProps({ 
    title: isReadonly.value ? `查看企业详情 - ${data.name}` : `编辑企业信息 - ${data.name}` 
  })
  
  // 直接使用传入的数据
  Object.assign(enterprise, data)
})

// 处理状态变更
function handleStatusChange() {
  hasChanges.value = true
}

// 处理确认按钮
async function handleOk() {
  if (isReadonly.value) {
    closeModal()
    return
  }
  
  if (!hasChanges.value) {
    closeModal()
    return
  }
  
  try {
    await updateEnterpriseStatus({
      id: enterprise.id,
      status: enterprise.status
    })
    message.success('企业信息更新成功')
    closeModal()
  } catch (error) {
    message.error('企业信息更新失败')
  }
}

// 处理取消按钮
function handleCancel() {
  closeModal()
}
</script>

<style lang="less" scoped>
.flex {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>