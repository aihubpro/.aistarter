<template>
  <BasicModal v-bind="$attrs" @register="register" title="共创者详细信息" @cancel="handleCancel" width="800px" :showOkBtn="false" cancelText="关闭">
    <a-descriptions :column="2" bordered>
      <a-descriptions-item label="ID">{{ collabInfo.id }}</a-descriptions-item>
      <a-descriptions-item label="公司名称">{{ collabInfo.company_name }}</a-descriptions-item>
      <a-descriptions-item label="软件名称">{{ collabInfo.software_name }}</a-descriptions-item>
      <a-descriptions-item label="公司域名">{{ collabInfo.domain_name }}</a-descriptions-item>
      <a-descriptions-item label="联系人">{{ collabInfo.name }}</a-descriptions-item>
      <a-descriptions-item label="邮箱">{{ collabInfo.email }}</a-descriptions-item>
      <a-descriptions-item label="手机号">{{ collabInfo.phone }}</a-descriptions-item>
      <a-descriptions-item label="机器码">{{ collabInfo.machine_id }}</a-descriptions-item>
      <a-descriptions-item label="协议">{{ collabInfo.protocol }}</a-descriptions-item>
      <a-descriptions-item label="项目类型">
        <a-tag color="green">{{ getCollabType(collabInfo.coll_type) }}</a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="创建时间">{{ formatDateTime(collabInfo.create_time) }}</a-descriptions-item>
      <a-descriptions-item label="到期时间">{{ formatDateTime(collabInfo.expiry_time) }}</a-descriptions-item>
      <a-descriptions-item label="服务器状态">
        <a-tag :color="getStateColor(collabInfo.state)">{{ getStateText(collabInfo.state) }}</a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="共创者状态">
        <a-tag :color="getServerStatusColor(collabInfo.server_status)">{{ getServerStatusText(collabInfo.server_status) }}</a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="封禁原因" :span="2">{{ collabInfo.ban_reason || '无' }}</a-descriptions-item>
      <a-descriptions-item label="封禁时间" :span="2">{{ formatDateTime(collabInfo.ban_end_time) || '无' }}</a-descriptions-item>
      <a-descriptions-item label="公钥" :span="2">
        <a-textarea 
          :value="collabInfo.public_key" 
          :rows="6" 
          readonly 
          placeholder="暂无公钥信息"
          @dblclick="handleCopyPublicKey"
          style="cursor: pointer;"
        />
        <div style="margin-top: 8px; color: #666; font-size: 12px;">双击可复制公钥</div>
      </a-descriptions-item>
    </a-descriptions>
  </BasicModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { BasicModal, useModalInner } from '/@/components/Modal';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';

const collabInfo = ref<any>({});

// 项目类型映射
const getCollabType = (type: number) => {
  const typeMap = { 1: '年度', 2: '永久' };
  return typeMap[type] || '未知';
};

// 服务器状态映射
const getStateText = (state: number) => {
  const stateMap = { 0: '正常', 1: '永久封禁', 2: '待更新' };
  return stateMap[state] || '未知';
};

const getStateColor = (state: number) => {
  const colorMap = { 0: 'green', 1: 'red', 2: 'blue' };
  return colorMap[state] || 'default';
};

// 共创者状态映射
const getServerStatusText = (status: number) => {
  const statusMap = { 0: '正常', 1: '过期', 2: '异常', 3: '封禁', 4: '替换' };
  return statusMap[status] || '未知';
};

const getServerStatusColor = (status: number) => {
  const colorMap = { 0: 'green', 1: 'red', 2: 'red', 3: 'red', 4: 'red' };
  return colorMap[status] || 'default';
};

// 格式化时间
const formatDateTime = (dateTime: string) => {
  if (!dateTime) return '';
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm:ss');
};

// 复制公钥
const handleCopyPublicKey = () => {
  if (collabInfo.value.public_key) {
    navigator.clipboard.writeText(collabInfo.value.public_key)
      .then(() => message.success('公钥已复制到剪贴板'))
      .catch(() => message.error('复制失败'));
  } else {
    message.warning('暂无公钥信息');
  }
};

const [register, { closeModal }] = useModalInner((data) => {
  collabInfo.value = data;
});

function handleCancel() {
  closeModal();
}
</script>

<style scoped>
.ant-descriptions-item-content .ant-tag {
  margin: 0;
}

.ant-textarea {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}
</style>