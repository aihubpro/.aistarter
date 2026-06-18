<template>
  <BasicModal v-bind="$attrs" @register="register" :title="modalTitle" @cancel="handleCancel" @ok="handleOk" :okText="okText" cancelText="取消" :showOkBtn="!isReadonly">
    <a-descriptions :column="1" bordered>
      <a-descriptions-item label="成员ID">{{ member.id }}</a-descriptions-item>
      <a-descriptions-item label="用户名">{{ member.user_name }}</a-descriptions-item>
      <a-descriptions-item label="邮箱">{{ member.user_email }}</a-descriptions-item>
      <a-descriptions-item label="所属企业">{{ member.entity_name }}</a-descriptions-item>
      <a-descriptions-item label="成员角色">
        <Tag v-if="member.role == 0" color="red">创建者</Tag>
        <Tag v-else-if="member.role == 1" color="green">普通成员</Tag>
        <Tag v-else color="default">未知</Tag>
      </a-descriptions-item>
      <a-descriptions-item label="成员状态" v-if="!isReadonly">
        <a-select v-model:value="member.join_status" style="width: 120px" @change="handleStatusChange" :disabled="isReadonly">
          <a-select-option :value="1">正常</a-select-option>
          <a-select-option :value="0">禁用</a-select-option>
        </a-select>
      </a-descriptions-item>
      <a-descriptions-item label="成员状态" v-else>
        <Tag v-if="member.join_status == 1" color="green">正常</Tag>
        <Tag v-else-if="member.join_status == 2" color="red">申请退出</Tag>
        <Tag v-else color="default">未知</Tag>
      </a-descriptions-item>
      <a-descriptions-item label="退出原因" v-if="member.join_status == 2 && member.quit_reason">
        {{ member.quit_reason }}
      </a-descriptions-item>
      <a-descriptions-item label="加入时间">{{ member.join_date }}</a-descriptions-item>
      <a-descriptions-item label="创建时间">{{ member.created_at }}</a-descriptions-item>
    </a-descriptions>
  </BasicModal>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { BasicModal, useModalInner } from '/@/components/Modal'
import { message, Tag } from 'ant-design-vue'
import { getQuitReason } from './EnterpriseMembersList.api'
import type { EnterpriseMemberInfo } from './EnterpriseMembersList.api'

const member = reactive<EnterpriseMemberInfo>({})
const isReadonly = ref(true)
const hasChanges = ref(false)

const modalTitle = computed(() => {
  return isReadonly.value ? '查看成员详情' : '编辑成员信息'
})

const okText = computed(() => {
  return isReadonly.value ? '关闭' : '保存'
})

const [register, { closeModal, setModalProps }] = useModalInner(async (data) => {
  console.log('接收到的成员数据:', data)
  
  // 重置状态
  hasChanges.value = false
  isReadonly.value = data.readonly || false
  
  // 设置模态框标题
  setModalProps({ 
    title: isReadonly.value ? `查看成员详情 - ${data.user_name}` : `编辑成员信息 - ${data.user_name}` 
  })
  
  // 直接使用传入的数据
  Object.assign(member, data)
  
  // 如果成员状态是申请退出，获取退出原因
  if (data.join_status === 2 && data.id) {
    try {
      const result = await getQuitReason({ entity_id: data.entity_id, auditor_id: data.user_id })
      if (result && result.data) {
        member.quit_reason = result.data
      }
    } catch (error) {
      console.error('获取退出原因失败:', error)
    }
  }
})

// 处理状态变更
function handleStatusChange() {
  hasChanges.value = true
}

// 处理确认按钮
// async function handleOk() {
//   if (isReadonly.value) {
//     closeModal()
//     return
//   }
  
//   if (!hasChanges.value) {
//     closeModal()
//     return
//   }
  
//   try {
//     await updateMemberStatus({
//       id: member.id,
//       join_status: member.join_status
//     })
//     message.success('成员信息更新成功')
//     closeModal()
//   } catch (error) {
//     message.error('成员信息更新失败')
//   }
// }

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