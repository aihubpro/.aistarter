<template>
  <BasicModal v-bind="$attrs" @register="register" title="创作者信息详情" @cancel="handleCancel" width="800px" :showOkBtn="false" cancelText="关闭">
    <a-descriptions :column="2" bordered>
      <a-descriptions-item label="用户ID">{{ userInfo.id }}</a-descriptions-item>
      <a-descriptions-item label="用户名">{{ userInfo.username }}</a-descriptions-item>
      <a-descriptions-item label="邮箱">{{ userInfo.email }}</a-descriptions-item>
      <a-descriptions-item label="手机号">{{ userInfo.phone }}</a-descriptions-item>
      <a-descriptions-item label="角色">{{ roleNameCfg[userInfo.id_role] }}</a-descriptions-item>
      <a-descriptions-item label="状态">
        <a-tag :color="statusList[userInfo.state]?.color">{{ statusList[userInfo.state]?.label }}</a-tag>
      </a-descriptions-item>
      <a-descriptions-item label="身份证姓名">{{ userInfo.name }}</a-descriptions-item>
      <a-descriptions-item label="身份证号码">{{ userInfo.id_card_number }}</a-descriptions-item>
      <a-descriptions-item label="身份证有效期" :span="2">{{ userInfo.id_card_expiry_date }}</a-descriptions-item>
      <a-descriptions-item label="身份证正面" :span="2">
        <a-image 
          v-if="userInfo.id_card_front_image_url" 
          :src="imageUrl(userInfo.id_card_front_image_url+'?time='+new Date(userInfo.update_time).getTime())" 
          alt="身份证正面" 
          width="300px" 
          height="200px"
        />
        <a-empty v-else description="未上传身份证正面" />
      </a-descriptions-item>
      <a-descriptions-item label="身份证反面" :span="2">
        <a-image 
          v-if="userInfo.id_card_back_image_url" 
          :src="imageUrl(userInfo.id_card_back_image_url+'?time='+new Date(userInfo.update_time).getTime())" 
          alt="身份证反面" 
          width="300px" 
          height="200px"
        />
        <a-empty v-else description="未上传身份证反面" />
      </a-descriptions-item>
      <a-descriptions-item label="微信收款码">
        <a-image 
          v-if="userInfo.wechat_image_url" 
          :src="imageUrl(userInfo.wechat_image_url+'?time='+new Date(userInfo.update_time).getTime())" 
          alt="微信收款码" 
          width="200px" 
          height="200px"
        />
        <a-empty v-else description="未上传微信收款码" />
      </a-descriptions-item>
      <a-descriptions-item label="支付宝收款码">
        <a-image 
          v-if="userInfo.alipay_image_url" 
          :src="imageUrl(userInfo.alipay_image_url+'?time='+new Date(userInfo.update_time).getTime())" 
          alt="支付宝收款码" 
          width="200px" 
          height="200px"
        />
        <a-empty v-else description="未上传支付宝收款码" />
      </a-descriptions-item>
      <a-descriptions-item label="银行卡号">{{ userInfo.bank_account_number || '未填写' }}</a-descriptions-item>
      <a-descriptions-item label="开户行">{{ userInfo.bank_name || '未填写' }}</a-descriptions-item>
      <a-descriptions-item label="PayPal账号" :span="2">{{ userInfo.paypal_id || '未填写' }}</a-descriptions-item>
      <a-descriptions-item label="审核时间">{{ userInfo.review_time }}</a-descriptions-item>
      <a-descriptions-item label="更新时间">{{ userInfo.update_time }}</a-descriptions-item>
    </a-descriptions>
  </BasicModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { BasicModal, useModalInner } from '/@/components/Modal';
import { useGlobSetting } from '/@/hooks/setting';

const globSetting = useGlobSetting();

const userInfo = ref<any>({});

const roleNameCfg = { 1: "管理员", 2: "用户" };

const statusList = [
  { label: '未上传', color: 'red' },
  { label: '待审核', color: 'red' },
  { label: '未通过', color: 'red' },
  { label: '已审核', color: 'green' },
];

// 图片地址
const imageUrl = (param: string) => {
  return globSetting.apiUrl + '/assets/user-images/' + param;
};

const [register, { closeModal }] = useModalInner((data) => {
  userInfo.value = data;
});

function handleCancel() {
  closeModal();
}
</script>

<style scoped>
.ant-descriptions-item-content img {
  border-radius: 8px;
  border: 1px solid #d9d9d9;
}
</style>