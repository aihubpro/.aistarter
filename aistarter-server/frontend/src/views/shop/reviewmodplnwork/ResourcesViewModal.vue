<template>
  <BasicModal v-bind="$attrs" @register="register" title="资源详细信息" @cancel="handleCancel" width="800px" :showOkBtn="false" cancelText="关闭">
    <a-descriptions :column="2" bordered>
      <a-descriptions-item label="资源ID">{{ resourceInfo.id }}</a-descriptions-item>
      <a-descriptions-item label="用户ID">{{ resourceInfo.user_id }}</a-descriptions-item>
      <a-descriptions-item label="用户名">{{ resourceInfo.user_name }}</a-descriptions-item>
      <a-descriptions-item label="项目名称">{{ resourceInfo.res_name }}</a-descriptions-item>
      <a-descriptions-item label="版本">{{ resourceInfo.version }}</a-descriptions-item>
      <a-descriptions-item label="平台">{{ resourceInfo.platforms }}</a-descriptions-item>
      <a-descriptions-item label="资源类型">
        <a-tag :color="getTypeColor(resourceInfo.res_type)">{{ getTypeText(resourceInfo.res_type) }}</a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="审核状态">
        <a-tag :color="getStateColor(resourceInfo.state)">{{ getStateText(resourceInfo.state) }}</a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="安装目录" :span="2">{{ resourceInfo.install_dir || '未指定' }}</a-descriptions-item>
      <a-descriptions-item label="定价模式">
        <a-tag :color="getPriceTypeColor(resourceInfo.price_type)">{{ getPriceTypeText(resourceInfo.price_type) }}</a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="价格">{{ formatPrice(resourceInfo.price_value, resourceInfo.price_type) }}</a-descriptions-item>
      <a-descriptions-item label="点赞数">{{ resourceInfo.like_count || 0 }}</a-descriptions-item>
      <a-descriptions-item label="下载次数">{{ resourceInfo.download || 0 }}</a-descriptions-item>
      <a-descriptions-item label="文件大小">{{ formatFileSize(resourceInfo.res_zip_size) }}</a-descriptions-item>
      <a-descriptions-item label="创建时间">{{ formatDateTime(resourceInfo.create_time) }}</a-descriptions-item>
      <a-descriptions-item label="更新时间">{{ formatDateTime(resourceInfo.update_time) }}</a-descriptions-item>
      <a-descriptions-item label="网盘链接" :span="2">
        <a-textarea 
          :value="resourceInfo.cloud_storage_link"
          :rows="4"  
          readonly 
          placeholder="暂无网盘链接"
          style="cursor: pointer;"
          @click="handleCopyCloudUrl"
        />
        <div style="margin-top: 8px; color: #666; font-size: 12px;">点击可复制网盘链接</div>
      </a-descriptions-item>
      <a-descriptions-item label="项目描述" :span="2">
        <a-textarea 
          :value="resourceInfo.short_desc" 
          :rows="4" 
          readonly 
          placeholder="暂无描述信息"
        />
      </a-descriptions-item>
      <a-descriptions-item label="项目介绍" :span="2">
        <a-textarea 
          :value="resourceInfo.res_desc" 
          :rows="6" 
          readonly 
          placeholder="暂无项目介绍"
        />
      </a-descriptions-item>
      <a-descriptions-item label="相关链接" :span="2">
        <a-textarea 
          :value="getProjectUrl(resourceInfo.ext_option)" 
          :rows="3" 
          readonly 
          placeholder="暂无相关链接"
        />
      </a-descriptions-item>
      <a-descriptions-item label="项目图片" :span="2">
        <div v-if="resourceInfo.image_path" style="max-width: 200px; max-height: 150px; overflow: hidden;">
          <a-image
            :src="getImageUrl(resourceInfo.image_path)"
            :width="200"
            :height="150"
            style="border-radius: 4px; border: 1px solid #d9d9d9; object-fit: cover; max-width: 100%; max-height: 100%;"
          />
        </div>
        <span v-else style="color: #999;">暂无项目图片</span>
      </a-descriptions-item>
    </a-descriptions>
  </BasicModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { BasicModal, useModalInner } from '/@/components/Modal';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import { useGlobSetting } from '/@/hooks/setting';

const resourceInfo = ref<any>({});
const globSetting = useGlobSetting();

// 资源类型映射
const getTypeText = (type: number) => {
  const typeMap = { 1: '模型', 2: '插件', 3: '工作流' };
  return typeMap[type] || '未知';
};

const getTypeColor = (type: number) => {
  return 'blue';
};

// 审核状态映射
const getStateText = (state: number) => {
  const stateMap = { 0: '未审核', 1: '审核通过' };
  return stateMap[state] || '未知';
};

const getStateColor = (state: number) => {
  const colorMap = { 0: 'red', 1: 'green' };
  return colorMap[state] || 'default';
};

// 格式化文件大小
const formatFileSize = (sizeInKB: number) => {
  if (!sizeInKB) return '0KB';
  
  if (sizeInKB >= 1024 * 1024) {
    const sizeInGB = (sizeInKB / (1024 * 1024)).toFixed(2);
    if (Number.isInteger(parseFloat(sizeInGB))) {
      return `${parseInt(sizeInGB)}G`;
    } else {
      return `${sizeInGB}G`;
    }
  } else if (sizeInKB >= 1024) {
    const sizeInMB = (sizeInKB / 1024).toFixed(2);
    if (Number.isInteger(parseFloat(sizeInMB))) {
      return `${parseInt(sizeInMB)}M`;
    } else {
      return `${sizeInMB}M`;
    }
  } else {
    return `${sizeInKB}KB`;
  }
};

// 格式化时间
const formatDateTime = (dateTime: string) => {
  if (!dateTime) return '';
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm:ss');
};

// 定价模式映射
const getPriceTypeText = (type: number) => {
  const typeMap = { 1: '免费', 2: '自定义价格', 3: '会员专享' };
  return typeMap[type] || '未知';
};

const getPriceTypeColor = (type: number) => {
  const colorMap = { 1: 'green', 2: 'blue', 3: 'purple' };
  return colorMap[type] || 'default';
};

// 格式化价格
const formatPrice = (price: number, priceType: number) => {
  if (priceType === 1) return '免费';
  if (priceType === 3) return 'VIP专享';
  return price ? `¥${price}` : '¥0';
};

// 获取图片URL
const getImageUrl = (imagePath: string) => {
  if (!imagePath) return '';
  return `${globSetting.apiUrl}/assets/market-images/${imagePath}?tmpDir=1&timestamp=${Date.now()}`;
};

// 解析相关链接
const getProjectUrl = (extOption: string) => {
  if (!extOption) return '';
  try {
    const parsed = JSON.parse(extOption);
    return parsed.projectUrl || '';
  } catch {
    return '';
  }
};

// 复制下载链接
const handleCopyUrl = () => {
  if (resourceInfo.value.res_zip_url) {
    navigator.clipboard.writeText(resourceInfo.value.res_zip_url)
      .then(() => message.success('下载链接已复制到剪贴板'))
      .catch(() => message.error('复制失败'));
  } else {
    message.warning('暂无下载链接');
  }
};

// 复制网盘链接
const handleCopyCloudUrl = () => {
  if (resourceInfo.value.cloud_storage_link) {
    navigator.clipboard.writeText(resourceInfo.value.cloud_storage_link)
      .then(() => message.success('网盘链接已复制到剪贴板'))
      .catch(() => message.error('复制失败'));
  } else {
    message.warning('暂无网盘链接');
  }
};

// 复制123网盘链接
const handleCopy123Url = () => {
  if (resourceInfo.value.pan_123_path) {
    navigator.clipboard.writeText(resourceInfo.value.pan_123_path)
      .then(() => message.success('123网盘链接已复制到剪贴板'))
      .catch(() => message.error('复制失败'));
  } else {
    message.warning('暂无123网盘链接');
  }
};

const [register, { closeModal }] = useModalInner((data) => {
  resourceInfo.value = data;
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

.ant-input {
  cursor: pointer !important;
}

.ant-image {
  border-radius: 4px;
  border: 1px solid #d9d9d9;
}
</style>