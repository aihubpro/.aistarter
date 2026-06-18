<template>
  <el-dropdown trigger="click" @command="onCommand">
    <div class="operation-warp">
        <u-icon>
          <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M586.624 234.624a74.624 74.624 0 1 1-149.184 0 74.624 74.624 0 0 1 149.12 0z m0 554.624a74.624 74.624 0 1 1-149.248 0 74.624 74.624 0 0 1 149.248 0zM512 586.624a74.624 74.624 0 1 0 0-149.248 74.624 74.624 0 0 0 0 149.248z"
              fill="currentColor"
            ></path>
          </svg>
        </u-icon>
      </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="report">{{ t('operate.report') }}</el-dropdown-item>
        <el-dropdown-item v-if="canDelete()" command="remove">{{ t('operate.delete') }}</el-dropdown-item>
        <el-dropdown-item divided command="copy">{{ t('operate.copy') }}</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>

  <!-- 举报弹窗 -->
  <el-dialog v-model="reportDialogVisible" :title="t('operate.report_comment')" width="500px">
    <el-form :model="reportForm" label-width="100px">
      <el-form-item :label="t('operate.report_reason')" required>
        <el-select v-model="reportForm.reason" :placeholder="t('operate.select_report_reason')" style="width: 100%">
          <el-option :label="t('operate.spam_ads')" :value="t('operate.spam_ads')" />
          <el-option :label="t('operate.malicious_attack')" :value="t('operate.malicious_attack')" />
          <el-option :label="t('operate.pornographic_content')" :value="t('operate.pornographic_content')" />
          <el-option :label="t('operate.political_sensitive')" :value="t('operate.political_sensitive')" />
          <el-option :label="t('operate.other')" :value="t('operate.other')" />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('operate.detailed_description')" required>
        <el-input
          v-model="reportForm.description"
          type="textarea"
          :rows="4"
          :placeholder="t('operate.describe_report_reason')"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="reportDialogVisible = false">{{ t('operate.cancel') }}</el-button>
        <el-button type="primary" @click="submitReport" :loading="reportLoading">
          {{ t('operate.submit_report') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { CommentApi } from 'undraw-ui'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { userStore } from '../../stores/UserStore'
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  comment: CommentApi
  project_id: string
  project_type: string
  project_user_id:number
}

const props = defineProps<Props>()
const userStoreIns = userStore()

const emit = defineEmits<{
  (e: 'remove', comment: CommentApi): void
}>()

const { copy } = useClipboard()

// 举报相关状态
const reportDialogVisible = ref(false)
const reportLoading = ref(false)
const reportForm = reactive({
  reason: '',
  description: ''
})

// 判断是否有删除权限（评论作者或管理员以及项目作者）
const canDelete = () => {
  const currentUser = userStoreIns.userInfo
  return currentUser.id === props.comment.uid || currentUser.id_role === 1 || currentUser.id === props.project_user_id
}

// 提交举报
const submitReport = async () => {
  if (!reportForm.reason || !reportForm.description) {
    ElMessage.error(t('operate.fill_complete_info'))
    return
  }
  
  reportLoading.value = true
  try {
    const res = await axios.post((window as any).Constants.uploadUrl+'/users/report-market-comment', {
      comment_id: props.comment.id,
      reason: reportForm.reason,
      description: reportForm.description
    }, {
      headers: {
        'access-token': localStorage.getItem('token') || ''
      },
      withCredentials: true
    })
    if (res.data.code === 0) {
      ElMessage({ type: 'success', message: t('operate.report_success') })
      reportDialogVisible.value = false
      // 重置表单
      reportForm.reason = ''
      reportForm.description = ''
    } else {
      ElMessage.error(res.data.msg || t('operate.report_failed'))
    }
  } catch (error) {
    ElMessage.error(t('operate.network_error_report'))
  } finally {
    reportLoading.value = false
  }
}

const onCommand = async (command: any) => {
  switch(command) {
    case 'remove':
      if (!canDelete()) {
        ElMessage.error(t('operate.no_permission_delete'))
        return
      }
      emit('remove', props.comment)
      break
    case 'report':
      reportDialogVisible.value = true
      break
    case 'copy':
      copy(props.comment.content)
      ElMessage({type:'info',message: t('operate.copy_success')})
  }
}

</script>

<style lang="scss" scoped>
.el-dropdown {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: 0;
}
.operation-warp {
  font-size: 16px;
  color: #9499a0;
  cursor: pointer;
  position: relative;
}
.operation-warp:hover {
  color: #00aeec;
}
.dialog-footer {
  text-align: right;
  display: flex;
  justify-content: center;
}
</style>