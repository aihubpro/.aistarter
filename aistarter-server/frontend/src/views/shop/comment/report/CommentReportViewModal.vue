<template>
  <BasicModal v-bind="$attrs" @register="register" title="举报详细信息" @cancel="handleCancel" width="800px" :showOkBtn="false" cancelText="关闭">
    <a-descriptions :column="2" bordered>
      <a-descriptions-item label="举报ID">{{ reportInfo.id }}</a-descriptions-item>
      <a-descriptions-item label="评论ID">{{ reportInfo.comment_id }}</a-descriptions-item>
      <a-descriptions-item label="举报人ID">{{ reportInfo.user_id }}</a-descriptions-item>
      <a-descriptions-item label="举报人">{{ reportInfo.reporter_name }}</a-descriptions-item>
      <a-descriptions-item label="举报原因">{{ reportInfo.reason }}</a-descriptions-item>
      <a-descriptions-item label="举报状态">
        <a-tag :color="getStatusColor(reportInfo.status)">{{ getStatusText(reportInfo.status) }}</a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="举报时间">{{ formatDateTime(reportInfo.create_time) }}</a-descriptions-item>
      <a-descriptions-item label="处理时间">{{ formatDateTime(reportInfo.handle_time) || '未处理' }}</a-descriptions-item>
      <a-descriptions-item label="处理人">{{ reportInfo.admin_name || '未处理' }}</a-descriptions-item>
      <a-descriptions-item label="处理结果" v-if="reportInfo.handle_result">
        <a-tag :color="getHandleResultColor(reportInfo.handle_result)">{{ getHandleResultText(reportInfo.handle_result) }}</a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="详细描述" :span="2">
        <a-textarea 
          :value="reportInfo.description" 
          :rows="4" 
          readonly 
          placeholder="暂无详细描述"
        />
      </a-descriptions-item>
      <a-descriptions-item label="评论内容" :span="2">
        <a-textarea 
          :value="reportInfo.comment_content || '[评论已删除]'" 
          :rows="6" 
          readonly 
          placeholder="暂无评论内容"
          :style="{ color: reportInfo.comment_content ? 'inherit' : '#999' }"
        />
      </a-descriptions-item>
      <a-descriptions-item label="处理备注" :span="2" v-if="reportInfo.admin_remark">
        <a-textarea 
          :value="reportInfo.admin_remark" 
          :rows="3" 
          readonly 
          placeholder="暂无处理备注"
        />
      </a-descriptions-item>
      <a-descriptions-item label="相关信息" :span="2">
        <div class="space-y-2">
          <div v-if="reportInfo.comment_author_id">
            <span class="font-medium">评论作者ID：</span>
            <span>{{ reportInfo.comment_author_id }}</span>
          </div>
          <div v-if="reportInfo.comment_author_name">
            <span class="font-medium">评论作者：</span>
            <span>{{ reportInfo.comment_author_name }}</span>
          </div>
          <div v-if="reportInfo.project_id">
            <span class="font-medium">项目ID：</span>
            <span>{{ reportInfo.project_id }}</span>
          </div>
          <div v-if="reportInfo.project_name">
            <span class="font-medium">项目名称：</span>
            <span>{{ reportInfo.project_name }}</span>
          </div>
        </div>
      </a-descriptions-item>
    </a-descriptions>
  </BasicModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { BasicModal, useModalInner } from '/@/components/Modal';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';

const reportInfo = ref<any>({});

// 举报状态映射
const getStatusText = (status: number) => {
  const statusMap = { 
    0: '待处理', 
    1: '已处理', 
    2: '已驳回' 
  };
  return statusMap[status] || '未知';
};

const getStatusColor = (status: number) => {
  const colorMap = { 
    0: 'orange', 
    1: 'green', 
    2: 'red' 
  };
  return colorMap[status] || 'default';
};

// 处理结果映射
const getHandleResultText = (result: number) => {
  const resultMap = { 
    1: '删除评论', 
    2: '驳回举报' 
  };
  return resultMap[result] || '未知';
};

const getHandleResultColor = (result: number) => {
  const colorMap = { 
    1: 'red', 
    2: 'blue' 
  };
  return colorMap[result] || 'default';
};

// 格式化时间
const formatDateTime = (dateTime: string) => {
  if (!dateTime) return '';
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm:ss');
};

const [register, { closeModal }] = useModalInner((data) => {
  reportInfo.value = data;
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

.space-y-2 > div:not(:first-child) {
  margin-top: 8px;
}

.font-medium {
  font-weight: 500;
}
</style>