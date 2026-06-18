<template>
  <BasicModal v-bind="$attrs" @register="register" title="AI项目详细信息" @cancel="handleCancel" width="800px" :showOkBtn="false" cancelText="关闭">
    <a-descriptions :column="2" bordered>
      <a-descriptions-item label="项目ID">{{ projectInfo.id }}</a-descriptions-item>
      <a-descriptions-item label="用户ID">{{ projectInfo.user_id }}</a-descriptions-item>
      <a-descriptions-item label="用户名">{{ projectInfo.user_name }}</a-descriptions-item>
      <a-descriptions-item label="项目名称">{{ projectInfo.plugin_name }}</a-descriptions-item>
      <a-descriptions-item label="版本">{{ projectInfo.version }}</a-descriptions-item>
      <a-descriptions-item label="平台">{{ projectInfo.platforms }}</a-descriptions-item>
      <a-descriptions-item label="审核状态">
        <a-tag :color="getStateColor(projectInfo.state)">{{ getStateText(projectInfo.state) }}</a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="安装目录" :span="2">{{ projectInfo.install_dir || '未指定' }}</a-descriptions-item>
      <a-descriptions-item label="定价模式">
        <a-tag :color="getPriceTypeColor(projectInfo.price_type)">{{ getPriceTypeText(projectInfo.price_type) }}</a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="价格">{{ formatPrice(projectInfo.price_value, projectInfo.price_type) }}</a-descriptions-item>
      <a-descriptions-item label="硬件配置" :span="2">
        <div v-if="getGupConfig(projectInfo.public_option).length > 0">
          <a-tag v-for="config in getGupConfig(projectInfo.public_option)" :key="config" color="blue">{{ getGupConfigText(config) }}</a-tag>
        </div>
        <span v-else style="color: #999;">无特殊要求</span>
      </a-descriptions-item>
      <a-descriptions-item label="显卡配置" :span="2">{{ getGupRaw(projectInfo.public_option) || '无特殊要求' }}</a-descriptions-item>
      <a-descriptions-item label="点赞数">{{ projectInfo.like_count || 0 }}</a-descriptions-item>
      <a-descriptions-item label="下载次数">{{ projectInfo.download || 0 }}</a-descriptions-item>
      <a-descriptions-item label="文件大小">{{ formatFileSize(projectInfo.project_zip_size) }}</a-descriptions-item>
      <a-descriptions-item label="创建时间">{{ formatDateTime(projectInfo.create_time) }}</a-descriptions-item>
      <a-descriptions-item label="更新时间">{{ formatDateTime(projectInfo.update_time) }}</a-descriptions-item>
      <a-descriptions-item label="123网盘链接" :span="2">
        <a-input 
          :value="projectInfo.pan_123_path" 
          readonly 
          placeholder="暂无123网盘链接"
          style="cursor: pointer;"
          @click="handleCopy123Url"
        />
        <div style="margin-top: 8px; color: #666; font-size: 12px;">点击可复制123网盘链接</div>
      </a-descriptions-item>
      <a-descriptions-item label="网盘链接" :span="2">
        <a-textarea 
          :value="projectInfo.cloud_storage_link"
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
          :value="projectInfo.description" 
          :rows="4" 
          readonly 
          placeholder="暂无描述信息"
        />
      </a-descriptions-item>
      <a-descriptions-item label="项目介绍" :span="2">
        <a-textarea 
          :value="projectInfo.plugn_desc" 
          :rows="6" 
          readonly 
          placeholder="暂无项目介绍"
        />
      </a-descriptions-item>
      <a-descriptions-item label="相关链接" :span="2">
        <a-textarea 
          :value="getProjectUrl(projectInfo.public_option)" 
          :rows="3" 
          readonly 
          placeholder="暂无相关链接"
        />
      </a-descriptions-item>
      <a-descriptions-item label="项目图片" :span="2">
        <div v-if="projectInfo.image_path" style="max-width: 200px; max-height: 150px; overflow: hidden;">
          <a-image
            :src="getImageUrl(projectInfo.image_path)"
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

const projectInfo = ref<any>({});
const globSetting = useGlobSetting();

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
  return `${globSetting.apiUrl}/assets/market-images/${imagePath}?timestamp=${Date.now()}`;
};

// 解析相关链接
const getProjectUrl = (publicOption: string) => {
  if (!publicOption) return '';
  try {
    const parsed = JSON.parse(publicOption);
    return parsed.projectUrl || '';
  } catch {
    return '';
  }
};

// 获取硬件配置
const getGupConfig = (publicOption: string) => {
  if (!publicOption) return [];
  try {
    const parsed = JSON.parse(publicOption);
    return parsed.gupRadio || [];
  } catch {
    return [];
  }
};

// 硬件配置文本映射
const getGupConfigText = (config: string) => {
  const configMap = {
    '1': 'CPU',
    '2': 'NVIDIA GPU',
    '3': 'AMD GPU'
  };
  return configMap[config] || config;
};

// 获取显卡配置
const getGupRaw = (publicOption: string) => {
  if (!publicOption) return '';
  try {
    const parsed = JSON.parse(publicOption);
    return parsed.needGupRaw || '';
  } catch {
    return '';
  }
};

// 获取筛选标签（从API获取的筛选数据）
const getFilterTags = (publicOption: string) => {
  // AIProject的筛选标签是通过API单独获取的，这里暂时返回空数组
  // 实际应该调用getAIProjectFilter API来获取筛选数据
  return [];
};

// 复制下载链接
const handleCopyUrl = () => {
  if (projectInfo.value.project_zip_url) {
    navigator.clipboard.writeText(projectInfo.value.project_zip_url)
      .then(() => message.success('下载链接已复制到剪贴板'))
      .catch(() => message.error('复制失败'));
  } else {
    message.warning('暂无下载链接');
  }
};

// 复制网盘链接
const handleCopyCloudUrl = () => {
  if (projectInfo.value.cloud_storage_link) {
    navigator.clipboard.writeText(projectInfo.value.cloud_storage_link)
      .then(() => message.success('网盘链接已复制到剪贴板'))
      .catch(() => message.error('复制失败'));
  } else {
    message.warning('暂无网盘链接');
  }
};

// 复制123网盘链接
const handleCopy123Url = () => {
  if (projectInfo.value.pan_123_path) {
    navigator.clipboard.writeText(projectInfo.value.pan_123_path)
      .then(() => message.success('123网盘链接已复制到剪贴板'))
      .catch(() => message.error('复制失败'));
  } else {
    message.warning('暂无123网盘链接');
  }
};

const [register, { closeModal }] = useModalInner((data) => {
  projectInfo.value = data;
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