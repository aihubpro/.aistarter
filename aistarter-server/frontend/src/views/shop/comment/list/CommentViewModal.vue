<template>
  <BasicModal v-bind="$attrs" @register="register" title="评论详细信息" @cancel="handleCancel" width="800px" :showOkBtn="false" cancelText="关闭">
    <a-descriptions :column="2" bordered>
      <a-descriptions-item label="评论ID">{{ commentInfo.id }}</a-descriptions-item>
      <a-descriptions-item label="项目ID">{{ commentInfo.project_id }}</a-descriptions-item>
      <a-descriptions-item label="项目名称">{{ commentInfo.project_name }}</a-descriptions-item>
      <a-descriptions-item label="项目类型">
        <a-tag :color="getProjectTypeColor(commentInfo.project_type)">{{ getProjectTypeText(commentInfo.project_type) }}</a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="发布人ID">{{ commentInfo.user_id }}</a-descriptions-item>
      <a-descriptions-item label="发布人">{{ commentInfo.publisher_name }}</a-descriptions-item>
      <a-descriptions-item label="点赞数">{{ commentInfo.likes || 0 }}</a-descriptions-item>
      <a-descriptions-item label="举报数">{{ commentInfo.report_count || 0 }}</a-descriptions-item>
      <a-descriptions-item label="创建时间">{{ formatDateTime(commentInfo.create_time) }}</a-descriptions-item>
      <a-descriptions-item label="更新时间">{{ formatDateTime(commentInfo.update_time) }}</a-descriptions-item>
      <a-descriptions-item label="评论内容" :span="2">
        <a-textarea 
          :value="commentInfo.content" 
          :rows="6" 
          readonly 
          placeholder="暂无评论内容"
        />
      </a-descriptions-item>
      <a-descriptions-item label="父评论ID" :span="2">{{ commentInfo.parent_id || '无（顶级评论）' }}</a-descriptions-item>
      <a-descriptions-item label="审核信息" :span="2" v-if="commentInfo.audit_reason">
        <a-textarea 
          :value="commentInfo.audit_reason" 
          :rows="3" 
          readonly 
          placeholder="暂无审核信息"
        />
      </a-descriptions-item>
    </a-descriptions>
  </BasicModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { BasicModal, useModalInner } from '/@/components/Modal';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';

const commentInfo = ref<any>({});

// 项目类型映射
const getProjectTypeText = (type: string) => {
  const typeMap = { 
    '0': 'AI应用', 
    '1': '模型', 
    '2': '插件', 
    '3': '工作流' 
  };
  return typeMap[type] || '未知';
};

const getProjectTypeColor = (type: string) => {
  const colorMap = { 
    '0': 'blue', 
    '1': 'green', 
    '2': 'purple', 
    '3': 'red' 
  };
  return colorMap[type] || 'default';
};

// 评论状态映射
const getStatusText = (status: number) => {
  const statusMap = { 
    0: '正常', 
    1: '已删除', 
    2: '已隐藏', 
    3: '审核中' 
  };
  return statusMap[status] || '未知';
};

const getStatusColor = (status: number) => {
  const colorMap = { 
    0: 'green', 
    1: 'red', 
    2: 'orange', 
    3: 'blue' 
  };
  return colorMap[status] || 'default';
};

// 格式化时间
const formatDateTime = (dateTime: string) => {
  if (!dateTime) return '';
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm:ss');
};

const [register, { closeModal }] = useModalInner((data) => {
  commentInfo.value = data;
});

function handleCancel() {
  closeModal();
}
</script>

<style scoped>
.ant-descriptions-item-content .ant-tag {
  margin: 2px;
}

.ant-textarea {
  font-family: inherit;
}
</style>