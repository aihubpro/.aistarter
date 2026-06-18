<template>
    <BasicModal v-bind="$attrs" @register="register" :title="modalTitle" @cancel="handleCancel" @ok="handleOk" :okText="okText" cancelText="取消" :showOkBtn="!isReadonly">
      <a-descriptions :column="1" bordered>
        <a-descriptions-item label="用户ID">{{ user.id }}</a-descriptions-item>
        <a-descriptions-item label="用户名">{{ user.username }}</a-descriptions-item>
        <a-descriptions-item label="邮箱">{{ user.email }}</a-descriptions-item>
        <a-descriptions-item label="角色">{{ roleNameCfg[user.id_role] }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ user.created_at }}</a-descriptions-item>
        <a-descriptions-item label="最后登录时间">{{ user.updated_at }}</a-descriptions-item>
        <a-descriptions-item label="余额">{{ (user.balance / 100).toFixed(2) }} 元</a-descriptions-item>
        <a-descriptions-item label="增加金额" v-if="!isReadonly">
          <div class="flex">
            <a-input-number v-model:value="addBalance" :min="0" :max="1000000" :step="0.01" />
            <a-button type="primary" @click="addBalanceClick">增加</a-button>
          </div>
        </a-descriptions-item>
        <a-descriptions-item label="减少金额" v-if="!isReadonly">
          <div class="flex">
            <a-input-number v-model:value="deductBalance" :min="0" :max="(user.balance / 100)" :step="0.01"/>
            <a-button type="danger" @click="deductBalanceClick">扣减</a-button>
          </div>
          <a-checkbox v-model:checked="showOrders" @change="handleShowOrdersChange">
              显示用户订单信息
          </a-checkbox>
        </a-descriptions-item>
        <a-descriptions-item label="邀请码">
          <div class="flex items-center space-x-2">
            <span v-if="user.parent_invite_code" style="color: #1890ff;">{{ user.parent_invite_code }}</span>
            <span v-else style="color: #999;">暂无邀请码</span>
          </div>
        </a-descriptions-item>
        <a-descriptions-item label="邀请码操作" v-if="!isReadonly">
          <div class="flex items-center space-x-2" v-if="user.parent_invite_code">
            <a-button type="danger" @click="unbindInviteCode">解绑邀请码</a-button>
            <span style="color: #666; font-size: 12px;">解绑后将清空与邀请人的关系</span>
          </div>
          <div class="flex items-center space-x-2" v-else>
            <a-input 
              v-model:value="newParentInviteCode" 
              placeholder="请输入邀请码"
              style="width: 200px;"
            />
            <a-button type="primary" @click="bindInviteCode">绑定邀请码</a-button>
          </div>
        </a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-select v-model:value="user.status" style="width: 120px" @change="handleStatusChange" :disabled="isReadonly">
            <a-select-option :value="0">正常</a-select-option>
            <a-select-option :value="1">禁言</a-select-option>
            <a-select-option :value="2">封禁</a-select-option>
            <a-select-option :value="3">永久封禁</a-select-option>
          </a-select>
        </a-descriptions-item>
        <a-descriptions-item label="封禁时间">
          <a-date-picker 
            v-model:value="banExpireTime" 
            show-time 
            format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择封禁到期时间"
            style="width: 200px;"
            @change="updateBanTime"
            :disabled="isReadonly"
          />
        </a-descriptions-item>
         <a-descriptions-item label="封禁原因">
          <a-textarea 
            v-model:value="user.reason" 
            placeholder="请输入封禁原因"
            :rows="2"
            :max-length="200"
            show-count
            @change="handleBanReasonChange"
            :disabled="isReadonly"
          />
        </a-descriptions-item>
        <a-descriptions-item label="会员类型">
          <a-select v-model:value="user.vip_type" style="width: 120px" @change="handleStatusChange" :disabled="isReadonly">
            <a-select-option :value="0">普通用户</a-select-option>
            <a-select-option :value="1">年度会员</a-select-option>
            <a-select-option :value="2">永久会员</a-select-option>
          </a-select>
        </a-descriptions-item>
        <a-descriptions-item label="会员到期时间">
          <a-date-picker 
            v-model:value="vipExpireTime" 
            show-time 
            format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择会员到期时间"
            style="width: 200px;"
            @change="updateVipTime"
            :disabled="user.vip_type === 2 || isReadonly"
          />
          <div v-if="user.vip_type === 2" style="margin-top: 4px; color: #52c41a; font-size: 12px;">
            永久会员无需设置到期时间
          </div>
        </a-descriptions-item>
        <a-descriptions-item label="平台费比例">
          <div class="flex items-center space-x-2">
            <a-input-number 
              v-model:value="user.platform_fee" 
              :min="0" 
              :max="100" 
              :step="1"
              placeholder="请输入平台费比例"
              style="width: 150px;"
              @change="handlePlatformFeeChange"
              :disabled="isReadonly"
            />
            <span>%</span>
            <span style="color: #666; font-size: 12px;">（例如：10表示收取10%的平台费）</span>
          </div>
        </a-descriptions-item>
        <a-descriptions-item label="邀请用户分成比例">
          <div class="flex items-center space-x-2">
            <a-input-number 
              v-model:value="user.invite_commission_rate" 
              :min="0" 
              :max="100" 
              :step="1"
              placeholder="请输入邀请用户分成比例"
              style="width: 150px;"
              @change="handleInviteCommissionRateChange"
              :disabled="isReadonly"
            />
            <span>%</span>
            <span style="color: #666; font-size: 12px;">（例如：5表示邀请用户分成5%）</span>
          </div>
        </a-descriptions-item>
        <a-descriptions-item label="机器码修改次数">
          <div class="flex items-center space-x-2">
            <a-input-number 
              v-model:value="user.machine_code_change_count" 
              :min="0" 
              :max="100" 
              :step="1"
              placeholder="请输入机器码修改次数"
              style="width: 150px;"
              @change="handleMachineCodeChangeCountChange"
              :disabled="isReadonly"
            />
            <span style="color: #666; font-size: 12px;">（用户已修改机器码的次数）</span>
          </div>
        </a-descriptions-item>

      </a-descriptions>
    </BasicModal>
  </template>
  
  <script setup lang="ts">
  import { ref, computed } from 'vue';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { getUserAllInfo,addMoney,updateStatus,unbindParentInviteCode,bindParentInviteCode } from './RegUser.api'
  import { useMessage } from '/@/hooks/web/useMessage'
  import dayjs from 'dayjs';
  const { createMessage, createConfirm } = useMessage()
  const user = ref<any>({});
  const roleNameCfg = { 1: "管理员", 2: "用户" };
  const addBalance = ref(0);
  const deductBalance = ref(0);
  const showOrders = ref(false);
  const banExpireTime = ref();
  const vipExpireTime = ref();
  const isReadonly = ref(false);
  const newParentInviteCode = ref('');
  
  // 计算属性
  const modalTitle = computed(() => {
    return isReadonly.value ? `查看用户 ${user.value.username || ''} 的详情` : `编辑用户 ${user.value.username || ''} 的详情`;
  });
  
  const okText = computed(() => {
    return isReadonly.value ? '关闭' : '确认';
  });
  //增加用户余额
  function addBalanceClick() {
    if(addBalance.value <= 0){
      createMessage.warning('增加金额必须大于0');
      return;
    }
    addMoney(user.value, addBalance.value).then(res => {
      if (res.code == 0) {
        createMessage.success('增加成功')
        // 刷新用户信息
        getUserAllInfo(user.value.id).then(res => {
          user.value.balance = res.data.balance;
        })
      }
    })
  }
  
  //扣减用户余额
  function deductBalanceClick() {
    if (deductBalance.value <= 0) {
      createMessage.warning('扣减金额必须大于0');
      return;
    }
    if(deductBalance.value > user.value.balance){
      createMessage.warning('扣减金额不能大于余额');
      return;
    }

    
    createConfirm({
      iconType: 'warning',
      title: '确认减少金额',
      content: `确定要减少用户 ${user.value.username} 的余额 ${deductBalance.value.toFixed(2)} 元吗？`,
      onOk: () => {
        user.value.showOrders = showOrders.value
        // 这里调用扣减余额的API，传入负数表示扣减
        addMoney(user.value, -deductBalance.value).then(res => {
          if (res.code == 0) {
            createMessage.success('减少余额成功')
            // 刷新用户信息
            getUserAllInfo(user.value.id).then(res => {
              user.value.balance = res.data.balance;
            })
            deductBalance.value = 0;
          }
        })
      }
    })
  }
  
  //处理订单展示变化
   function handleShowOrdersChange() {
     console.log('订单展示状态:', showOrders.value);
     // 这里可以添加显示/隐藏订单的逻辑
     if (showOrders.value) {
       createMessage.info('已开启订单展示');
     } else {
       createMessage.info('已关闭订单展示');
     }
   }
   
   //处理封禁原因变化
   function handleBanReasonChange() {
     console.log('封禁原因已更新:', user.value.ban_reason);
     // 这里可以添加实时保存封禁原因的逻辑
   }
   
   //处理平台费比例变化
   function handlePlatformFeeChange() {
     if (user.value.platform_fee < 0) {
       user.value.platform_fee = 0;
       createMessage.warning('平台费比例不能小于0%');
       return;
     }
     if (user.value.platform_fee > 100) {
       user.value.platform_fee = 100;
       createMessage.warning('平台费比例不能大于100%');
       return;
     }
     //非整数 替换为整数
     user.value.platform_fee = Math.round(user.value.platform_fee);
     console.log('平台费比例已更新:', user.value.platform_fee);
     createMessage.success(`平台费比例已设置为: ${user.value.platform_fee}%`);
   }
   
   //处理推广返现比例变化
   function handleInviteCommissionRateChange() {
     if (user.value.invite_commission_rate < 0) {
       user.value.invite_commission_rate = 0;
       createMessage.warning('推广返现比例不能小于0%');
       return;
     }
     if (user.value.invite_commission_rate > 100) {
       user.value.invite_commission_rate = 100;
       createMessage.warning('推广返现比例不能大于100%');
       return;
     }
     //非整数 替换为整数
     user.value.invite_commission_rate = Math.round(user.value.invite_commission_rate);
     console.log('推广返现比例已更新:', user.value.invite_commission_rate);
     createMessage.success(`推广返现比例已设置为: ${user.value.invite_commission_rate}%`);
   }
   
   //处理机器码修改次数变化
   function handleMachineCodeChangeCountChange() {
     if (user.value.machine_code_change_count < 0) {
       user.value.machine_code_change_count = 0;
       createMessage.warning('机器码修改次数不能小于0');
       return;
     }
     if (user.value.machine_code_change_count > 100) {
       user.value.machine_code_change_count = 100;
       createMessage.warning('机器码修改次数不能大于100');
       return;
     }
     //非整数 替换为整数
     user.value.machine_code_change_count = Math.round(user.value.machine_code_change_count);
     
     createMessage.success(`机器码修改次数已设置为: ${user.value.machine_code_change_count}`);
   }
   
   //解绑上级邀请码
   function unbindInviteCode() {
     createConfirm({
       iconType: 'warning',
       title: '确认解绑',
       content: `确定要解绑用户 ${user.value.username} 的邀请码 ${user.value.parent_invite_code} 吗？`,
       onOk: () => {
         // 这里调用解绑API
         unbindParentInviteCode({id:user.value.id}).then(res => {
          
           if (res.code == 0) {
             user.value.parent_invite_code = null;
             createMessage.success('解绑成功');
           }
         })
        //  user.value.parent_invite_code = null;
        //  createMessage.success('上级邀请码解绑成功');
       }
     })
   }
   
   //绑定上级邀请码
   function bindInviteCode() {
     if (!newParentInviteCode.value) {
       createMessage.warning('请输入上级邀请码');
       return;
     }
     
     createConfirm({
       iconType: 'info',
       title: '确认绑定',
       content: `确定要为用户 ${user.value.username} 绑定上级邀请码 ${newParentInviteCode.value} 吗？`,
       onOk: () => {
         // 这里调用绑定API
         bindParentInviteCode({id:user.value.id, parent_invite_code:newParentInviteCode.value}).then(res => {
           if (res.code == 0) {
             user.value.parent_invite_code = newParentInviteCode.value;
             newParentInviteCode.value = '';
             createMessage.success('绑定成功');
           }else{
             createMessage.error(res.error);
           }
         })
        //  user.value.parent_invite_code = newParentInviteCode.value;
        //  newParentInviteCode.value = '';
        //  createMessage.success('上级邀请码绑定成功');
       }
     })
   }
   

  
  //更新封禁时间
  function updateBanTime() {
    if (!banExpireTime.value) {
      return;
    }
    const formattedTime = dayjs(banExpireTime.value).format('YYYY-MM-DD HH:mm:ss');
    // 这里可以调用API更新封禁时间
    // updateUserBanTime(user.value.id, formattedTime).then(res => {
    //   if (res.code == 0) {
    //     user.value.ban_expire_time = formattedTime;
    //     createMessage.success('封禁时间更新成功');
    //   }
    // })
    user.value.ban_expire_time = formattedTime;
    createMessage.success(`封禁时间已更新为: ${formattedTime}`);
  }
  
  //更新会员到期时间
  function updateVipTime() {
    // 如果是永久会员，不允许设置到期时间
    if (user.value.vip_type === 2) {
      vipExpireTime.value = null;
      user.value.vip_expire_time = null;
      createMessage.info('永久会员无需设置到期时间');
      return;
    }
    
    if (!vipExpireTime.value) {
      user.value.vip_expire_time = null;
      createMessage.success('会员到期时间已清空');
      return;
    }
    
    const formattedTime = dayjs(vipExpireTime.value).format('YYYY-MM-DD HH:mm:ss');
    const now = dayjs();
    
    // 验证时间不能早于当前时间
    if (dayjs(vipExpireTime.value).isBefore(now)) {
      createMessage.warning('会员到期时间不能早于当前时间');
      return;
    }
    
    // 这里可以调用API更新会员到期时间
    // updateUserVipTime(user.value.id, formattedTime).then(res => {
    //   if (res.code == 0) {
    //     user.value.vip_expire_time = formattedTime;
    //     createMessage.success('会员到期时间更新成功');
    //   }
    // })
    user.value.vip_expire_time = formattedTime;
    createMessage.success(`会员到期时间已更新为: ${formattedTime}`);
  }
  const [register, { closeModal, setModalProps }] = useModalInner((data) => {
    user.value = data;
    isReadonly.value = data.readonly || false;
    addBalance.value = 0;
    deductBalance.value = 0;
    showOrders.value = false;
    newParentInviteCode.value = '';
    getUserAllInfo(data.id).then(res => {
       user.value.status = res.data.status;
       user.value.ban_expire_time = res.data.ban_expire_time;
       user.value.reason = res.data.reason || '';
       user.value.vip_expire_time = res.data.vip_expire_time;
       user.value.vip_type = res.data.vip_type || 0;
       user.value.platform_fee = res.data.platform_fee || 0;
       user.value.invite_commission_rate = res.data.invite_commission_rate || 0;
       user.value.parent_invite_code = res.data.parent_invite_code || null;
       user.value.machine_code_change_count = res.data.machine_code_change_count || 0;

      
      // 设置封禁日期选择器的值
      if (res.data.ban_expire_time) {
        banExpireTime.value = dayjs(res.data.ban_expire_time);
      } else {
        banExpireTime.value = null;
      }
      
      // 设置会员到期日期选择器的值
      if (res.data.vip_expire_time) {
        vipExpireTime.value = dayjs(res.data.vip_expire_time);
      } else {
        vipExpireTime.value = null;
      }
    })
  });
  function handleCancel() {
    closeModal();
  }
  function handleOk(){
    console.log(user.value)
    let data = {
       id: user.value.id,
       status: user.value.status,
       ban_expire_time: user.value.ban_expire_time,
       reason: user.value.reason,
       vip_type: user.value.vip_type,
       vip_expire_time: user.value.vip_expire_time,
       platform_fee: user.value.platform_fee,
       invite_commission_rate: user.value.invite_commission_rate,
       machine_code_change_count: user.value.machine_code_change_count,
     }
    updateStatus(data).then(res => {
      createMessage.success('用户状态更新成功');
      closeModal();
    })
  }
  
  // 处理状态变化
  function handleStatusChange() {
    // 当会员类型改为永久会员时，清空到期时间
    if (user.value.vip_type === 2) {
      vipExpireTime.value = null;
      user.value.vip_expire_time = null;
      createMessage.info('已设置为永久会员，到期时间已清空');
    }
    console.log('用户状态或会员类型已改变:', user.value.status, user.value.vip_type);
  }
  </script>