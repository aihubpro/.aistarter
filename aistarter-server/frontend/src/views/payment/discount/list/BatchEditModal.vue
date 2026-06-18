<template>
  <BasicModal 
    v-bind="$attrs" 
    @register="register" 
    title="批量修改优惠券" 
    @cancel="handleCancel" 
    @ok="handleOk"
    width="1000px" 
    okText="批量修改" 
    cancelText="取消"
    :okButtonProps="{ type: 'primary', disabled: selectedGroups.length === 0 }"
  >
    <div class="mb-4">
      <a-row :gutter="16">
        <a-col :span="8">
          <a-form-item label="申请者ID">
            <a-input-number v-model:value="filterForm.applicant_id" placeholder="请输入申请者ID" style="width: 100%" />
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item label="日期">
            <a-date-picker v-model:value="filterForm.date" placeholder="选择日期" style="width: 100%" />
          </a-form-item>
        </a-col>
        <a-col :span="8">
          <a-form-item>
            <a-button type="primary" @click="loadGroupedData" :loading="loading">查询分组</a-button>
          </a-form-item>
        </a-col>
      </a-row>
    </div>
    
    <div class="mb-4" v-if="groupedData.length > 0">
      <a-alert 
        :message="`共找到 ${groupedData.length} 个分组，已选择 ${selectedGroups.length} 个分组`" 
        type="info" 
        show-icon 
      />
    </div>
    
    <vxe-table
      ref="xTable"
      :data="groupedData"
      :loading="loading"
      :checkbox-config="{ checkField: 'checked', trigger: 'row' }"
      @checkbox-change="handleCheckboxChange"
      @checkbox-all="handleCheckboxAll"
      max-height="400"
      v-if="groupedData.length > 0"
    >
      <vxe-column type="checkbox" width="60" />
      <vxe-column field="applicant_id" title="申请者ID" width="100" />
      <vxe-column field="date" title="日期" width="120" />
      <vxe-column field="count" title="订单数量" width="100" />
      <vxe-column field="codes" title="优惠码" min-width="200">
        <template #default="{ row }">
          <a-tag v-for="code in row.codes.slice(0, 3)" :key="code" class="mr-1">{{ code }}</a-tag>
          <span v-if="row.codes.length > 3">等{{ row.codes.length }}个</span>
        </template>
      </vxe-column>
      <vxe-column field="current_min_amount" title="当前最低金额" width="120">
        <template #default="{ row }">
          {{ (row.current_min_amount / 100).toFixed(2) }}元
        </template>
      </vxe-column>
      <vxe-column field="current_cashback_amount" title="当前推广奖励" width="120">
        <template #default="{ row }">
          {{ (row.current_cashback_amount / 100).toFixed(2) }}元
        </template>
      </vxe-column>
    </vxe-table>
    
    <div class="mt-4" v-if="selectedGroups.length > 0">
      <a-card title="批量修改设置" size="small">
        <!-- 显示当前选中分组的相同值 -->
        <div class="mb-4" v-if="commonValues">
          <a-alert 
            message="当前选中分组的相同字段值" 
            type="info" 
            show-icon 
          />
          <a-descriptions :column="2" size="small" class="mt-2">
            <a-descriptions-item label="优惠类型" v-if="commonValues.discount_type !== null">
              <a-tag color="green">{{ commonValues.discount_type === 0 ? '金额' : '折扣' }}</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="优惠数值" v-if="commonValues.discount_value !== null">
              {{ commonValues.discount_value }}
            </a-descriptions-item>
            <a-descriptions-item label="最低金额" v-if="commonValues.min_amount !== null">
              {{ (commonValues.min_amount / 100).toFixed(2) }}元
            </a-descriptions-item>
            <a-descriptions-item label="推广奖励" v-if="commonValues.cashback_amount !== null">
              {{ (commonValues.cashback_amount / 100).toFixed(2) }}元
            </a-descriptions-item>
            <a-descriptions-item label="生效时间" v-if="commonValues.valid_from !== null">
              {{ commonValues.valid_from }}
            </a-descriptions-item>
            <a-descriptions-item label="失效时间" v-if="commonValues.valid_to !== null">
              {{ commonValues.valid_to }}
            </a-descriptions-item>
            <a-descriptions-item label="备注" v-if="commonValues.remark !== null" :span="2">
              {{ commonValues.remark || '无' }}
            </a-descriptions-item>
          </a-descriptions>
        </div>
        
        <!-- 修改表单 -->
        <a-divider>修改为新值</a-divider>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="优惠类型">
              <a-select 
                v-model:value="batchEditForm.discount_type" 
                placeholder="保持不变" 
                style="width: 100%" 
                allowClear
              >
                <a-select-option :value="0">金额</a-select-option>
                <a-select-option :value="1">折扣</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="优惠数值">
              <a-input-number 
                v-model:value="batchEditForm.discount_value" 
                :precision="2" 
                :min="0" 
                placeholder="保持不变" 
                style="width: 100%" 
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="最低金额(元)">
              <a-input-number 
                v-model:value="batchEditForm.min_amount" 
                :precision="2" 
                :min="0" 
                placeholder="保持不变" 
                style="width: 100%" 
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="推广奖励(元)">
              <a-input-number 
                v-model:value="batchEditForm.cashback_amount" 
                :precision="2" 
                :min="0" 
                placeholder="保持不变" 
                style="width: 100%" 
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="生效时间">
              <a-date-picker 
                v-model:value="batchEditForm.valid_from" 
                show-time 
                placeholder="保持不变" 
                style="width: 100%" 
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="失效时间">
              <a-date-picker 
                v-model:value="batchEditForm.valid_to" 
                show-time 
                placeholder="保持不变" 
                style="width: 100%" 
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="24">
            <a-form-item label="备注">
              <a-textarea 
                v-model:value="batchEditForm.remark" 
                placeholder="保持不变" 
                :rows="2"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-alert 
          :message="`将修改 ${selectedGroups.length} 个分组，共 ${getTotalCount()} 条优惠券记录`" 
          type="warning" 
          show-icon 
        />
      </a-card>
    </div>
  </BasicModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { BasicModal, useModalInner } from '/@/components/Modal';
import { message } from 'ant-design-vue';
import { VxeTableInstance } from 'vxe-table';
import { page, batchEditByGroup } from './Discount.api';
import dayjs from 'dayjs';

const emit = defineEmits(['success']);

const loading = ref(false);
const groupedData = ref<any[]>([]);
const selectedGroups = ref<string[]>([]);
const xTable = ref<VxeTableInstance>();
const allRecords = ref<any[]>([]); // 存储所有原始记录

const filterForm = reactive({
  applicant_id: undefined,
  date: undefined
});

const batchEditForm = reactive({
  discount_type: undefined,
  discount_value: undefined,
  min_amount: undefined,
  cashback_amount: undefined,
  valid_from: undefined,
  valid_to: undefined,
  remark: ''
});

// 处理单个复选框变化
const handleCheckboxChange = ({ checked, row }) => {
  const groupKey = `${row.applicant_id}_${row.date}`;
  if (checked) {
    if (!selectedGroups.value.includes(groupKey)) {
      selectedGroups.value.push(groupKey);
    }
  } else {
    const index = selectedGroups.value.indexOf(groupKey);
    if (index > -1) {
      selectedGroups.value.splice(index, 1);
    }
  }
};

// 处理全选复选框变化
const handleCheckboxAll = ({ checked }) => {
  if (checked) {
    selectedGroups.value = groupedData.value.map(item => `${item.applicant_id}_${item.date}`);
  } else {
    selectedGroups.value = [];
  }
};

// 加载分组数据
const loadGroupedData = async () => {
  if (!filterForm.applicant_id && !filterForm.date) {
    message.warning('请至少输入申请者ID或选择日期');
    return;
  }

  loading.value = true;
  try {
    const params: any = {
      current: 1,
      size: 1000
    };
    
    if (filterForm.applicant_id) {
      params.applicant_id = filterForm.applicant_id;
    }
    
    if (filterForm.date) {
      const dateStr = dayjs(filterForm.date).format('YYYY-MM-DD');
      params.create_time_start = dateStr + ' 00:00:00';
      params.create_time_end = dateStr + ' 23:59:59';
    }
    
    const { data } = await page(params);
    const records = data.records || [];
    allRecords.value = records; // 保存所有原始记录
    
    // 按申请者ID和日期分组
    const groups = new Map();
    records.forEach(record => {
      const createDate = dayjs(record.create_time).format('YYYY-MM-DD');
      const groupKey = `${record.applicant_id}_${createDate}`;
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          applicant_id: record.applicant_id,
          date: createDate,
          count: 0,
          codes: [],
          ids: [],
          current_min_amount: record.min_amount || 0,
          current_cashback_amount: record.cashback_amount || 0
        });
      }
      
      const group = groups.get(groupKey);
      group.count++;
      group.codes.push(record.code);
      group.ids.push(record.id);
    });
    
    groupedData.value = Array.from(groups.values());
    selectedGroups.value = [];
    
    if (groupedData.value.length === 0) {
      message.info('未找到符合条件的数据');
    }
  } catch (error) {
    message.error('加载数据失败');
    groupedData.value = [];
  } finally {
    loading.value = false;
  }
};

// 获取选中分组的总记录数
const getTotalCount = () => {
  return groupedData.value
    .filter(item => selectedGroups.value.includes(`${item.applicant_id}_${item.date}`))
    .reduce((total, item) => total + item.count, 0);
};

// 批量修改
const handleOk = async () => {
  if (selectedGroups.value.length === 0) {
    message.warning('请选择要修改的分组');
    return;
  }
  
  // 检查是否至少填写了一个修改字段
  const hasChanges = batchEditForm.discount_type !== undefined || 
                    batchEditForm.discount_value !== undefined || 
                    batchEditForm.min_amount !== undefined || 
                    batchEditForm.cashback_amount !== undefined || 
                    batchEditForm.valid_from !== undefined || 
                    batchEditForm.valid_to !== undefined || 
                    batchEditForm.remark.trim() !== '';
  
  if (!hasChanges) {
    message.warning('请至少填写一个要修改的字段');
    return;
  }

  loading.value = true;
  try {
    // 获取选中分组的所有ID
    const selectedGroupsData = groupedData.value.filter(item => 
      selectedGroups.value.includes(`${item.applicant_id}_${item.date}`)
    );
    
    const allIds = selectedGroupsData.flatMap(group => group.ids);
    
    // 构建批量修改数据
    const updateData = {
      ids: allIds,
      updates: {}
    };
    
    if (batchEditForm.discount_type !== undefined) {
      updateData.updates.discount_type = batchEditForm.discount_type;
    }
    if (batchEditForm.discount_value !== undefined) {
      updateData.updates.discount_value = batchEditForm.discount_value;
    }
    if (batchEditForm.min_amount !== undefined) {
      updateData.updates.min_amount = Math.round(batchEditForm.min_amount * 100); // 转换为分
    }
    if (batchEditForm.cashback_amount !== undefined) {
      updateData.updates.cashback_amount = Math.round(batchEditForm.cashback_amount * 100); // 转换为分
    }
    if (batchEditForm.valid_from !== undefined) {
      updateData.updates.valid_from = dayjs(batchEditForm.valid_from).format('YYYY-MM-DD HH:mm:ss');
    }
    if (batchEditForm.valid_to !== undefined) {
      updateData.updates.valid_to = dayjs(batchEditForm.valid_to).format('YYYY-MM-DD HH:mm:ss');
    }
    if (batchEditForm.remark.trim() !== '') {
      updateData.updates.remark = batchEditForm.remark.trim();
    }
    
    await batchEditByGroup(updateData);
    
    message.success(`成功修改 ${allIds.length} 条优惠券记录`);
    emit('success');
    closeModal();
  } catch (error) {
    message.error('批量修改失败');
  } finally {
    loading.value = false;
  }
};

// 计算选中分组的相同字段值
const commonValues = computed(() => {
  if (selectedGroups.value.length === 0 || allRecords.value.length === 0) {
    return null;
  }
  
  // 获取选中分组对应的所有记录
  const selectedGroupsData = groupedData.value.filter(item => 
    selectedGroups.value.includes(`${item.applicant_id}_${item.date}`)
  );
  
  const selectedIds = selectedGroupsData.flatMap(group => group.ids);
  const selectedRecords = allRecords.value.filter(record => selectedIds.includes(record.id));
  
  if (selectedRecords.length === 0) return null;
  
  // 检查每个字段是否在所有选中记录中都相同
  const firstRecord = selectedRecords[0];
  const common = {
    discount_type: null,
    discount_value: null,
    min_amount: null,
    cashback_amount: null,
    valid_from: null,
    valid_to: null,
    remark: null
  };
  
  // 检查优惠类型
  if (selectedRecords.every(r => r.discount_type === firstRecord.discount_type)) {
    common.discount_type = firstRecord.discount_type;
  }
  
  // 检查优惠数值
  if (selectedRecords.every(r => r.discount_value === firstRecord.discount_value)) {
    common.discount_value = firstRecord.discount_value;
  }
  
  // 检查最低金额
  if (selectedRecords.every(r => r.min_amount === firstRecord.min_amount)) {
    common.min_amount = firstRecord.min_amount;
  }
  
  // 检查推广奖励
  if (selectedRecords.every(r => r.cashback_amount === firstRecord.cashback_amount)) {
    common.cashback_amount = firstRecord.cashback_amount;
  }
  
  // 检查生效时间
  if (selectedRecords.every(r => r.valid_from === firstRecord.valid_from)) {
    common.valid_from = firstRecord.valid_from;
  }
  
  // 检查失效时间
  if (selectedRecords.every(r => r.valid_to === firstRecord.valid_to)) {
    common.valid_to = firstRecord.valid_to;
  }
  
  // 检查备注
  if (selectedRecords.every(r => r.remark === firstRecord.remark)) {
    common.remark = firstRecord.remark;
  }
  
  return common;
});

const [register, { closeModal }] = useModalInner(() => {
  // 重置表单
  filterForm.applicant_id = undefined;
  filterForm.date = undefined;
  Object.assign(batchEditForm, {
    discount_type: undefined,
    discount_value: undefined,
    min_amount: undefined,
    cashback_amount: undefined,
    valid_from: undefined,
    valid_to: undefined,
    remark: ''
  });
  groupedData.value = [];
  selectedGroups.value = [];
  allRecords.value = [];
});

function handleCancel() {
  closeModal();
}
</script>

<style scoped>
.ant-alert {
  margin-bottom: 16px;
}

.mr-1 {
  margin-right: 4px;
}
</style>