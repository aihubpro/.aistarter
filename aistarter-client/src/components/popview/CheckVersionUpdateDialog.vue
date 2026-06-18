<template>
    <el-dialog 
        v-model="dialogVisible" 
        :title="titleVisible" 
        width="650px" 
        center 
        :align-center="true"
        :show-close="closeable" 
        :close-on-click-modal="false"
        class="version-update-dialog"
    >
        <div class="update-dialog-content">
            <!-- 更新图标和标题 -->
            <!--
            <el-card class="update-header" shadow="hover">
                <div class="update-icon">
                    <el-icon size="48" color="var(--el-color-primary)">
                        <Download />
                    </el-icon>
                </div>
                <h3 class="update-title">发现新版本</h3>
                <div class="version-info">
                     <span class="current-version">当前版本: {{ currentVersion }}</span>
                     <el-icon class="arrow-icon"><Right /></el-icon>
                     <span class="new-version">最新版本: {{ newVersion }}</span>
                 </div>
            </el-card>
            -->

            <!-- 重要提示 -->
            <el-alert
                :title="$t('versionupd.version_upd_tis')"
                type="warning"
                :closable="false"
                show-icon
                class="update-warning"
            />

            <!-- 更新内容 - 只在检查更新后显示 -->
            <el-card v-if="buttonState !== 'check'" class="update-content-section" shadow="hover">
                <template #header>
                    <div class="content-title">
                        <el-icon><Document /></el-icon>
                        <span>{{ $t('versionupd.update_content') }}</span>
                    </div>
                </template>
                <el-scrollbar height="200px" class="content-scrollbar">
                    <div class="update-notes">
                        <pre class="update-content">{{ dialogContent }}</pre>
                    </div>
                </el-scrollbar>
            </el-card>
        </div>

        <template #footer>
            <div class="update-footer">
                <el-button 
                    @click="handleButtonClick" 
                    class="update-btn w-full" 
                    :class="{ 'downloading-progress': buttonState === 'downloading' }"
                    :type="buttonType"
                    :loading="buttonLoading"
                    :disabled="buttonDisabled"
                    :style="buttonState === 'downloading' ? {
                        background: `linear-gradient(to right, 
                            #67c23a 0%, 
                            #67c23a ${downloadProgress}%, 
                            #f0a020 ${downloadProgress}%, 
                            #f0a020 100%)`,
                        border: '2px solid #d48806',
                        color: '#ffffff',
                        fontWeight: 'bold'
                    } : {}"
                >
                    <template v-if="!buttonLoading">
                        <el-icon class="mr-1">
                            <Search v-if="buttonState === 'check'" />
                            <Download v-else-if="buttonState === 'update'" />
                            <Loading v-else-if="buttonState === 'downloading'" />
                            <Check v-else-if="buttonState === 'completed'" />
                        </el-icon>
                    </template>
                    <span v-if="buttonState === 'check'">{{$t('versionupd.check_update')}}</span>
                    <span v-else-if="buttonState === 'update'">{{$t('versionupd.version_upd_button')}}</span>
                    <span v-else-if="buttonState === 'downloading'">
                        {{$t('versionupd.downloading')}} {{ (downloadProgress || 0).toFixed(2) }}% ({{ formattedSpeed }})
                    </span>
                    <span v-else-if="buttonState === 'completed'">
                        {{$t('versionupd.download_completed')}}
                    </span>
                </el-button>
                
                <!-- 下载进度条 -->
                <el-progress 
                    v-if="buttonState === 'downloading'" 
                    :percentage="downloadProgress" 
                    :show-text="false"
                    class="mt-2"
                />
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, inject, computed, onUnmounted } from 'vue'
import { ElMessage,ElMessageBox } from "element-plus";
import { Download, Right, Document, Search, Loading, Check } from '@element-plus/icons-vue'
import axios from 'axios'
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import {appInfoStore} from '../../stores/AppInfoStore'
const appInfoStoreIns = appInfoStore()

// 获取IPC渲染器
const getIpcRenderer = () => {
  return (window as any).require?.('electron')?.ipcRenderer || (window as any).electronAPI
}
const dialogVisible = ref(false)
const dialogContent = ref('')
const currentVersion = ref('v1.0.0')
const newVersion = ref('v1.1.0')
const titleVisible = ref('')

// 按钮状态管理
const buttonState = ref('check') // 'check' | 'update' | 'downloading' | 'completed'
const buttonLoading = ref(false)
const buttonDisabled = ref(false)
const downloadProgress = ref(0)
const downloadSpeed = ref(0) // 下载速度 (bytes/s)
const isCompleted = ref(false) // 下载完成状态
const isPostDownloadCalled = ref(false) // 防止重复调用handlePostDownload

// 按钮类型和样式
const buttonType = computed(() => {
  switch (buttonState.value) {
    case 'check':
      return 'info'
    case 'update':
      return 'primary'
    case 'downloading':
      return 'warning'
    case 'completed':
      return 'success'
    default:
      return 'primary'
  }
})

// 格式化下载速度
const formattedSpeed = computed(() => {
  const speed = downloadSpeed.value || 0
  if (speed === 0) return '0 B/s'
  
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s']
  let size = speed
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`
})

// 按钮点击处理
const handleButtonClick = () => {
  switch (buttonState.value) {
    case 'check':
      checkForUpdates()
      break
    case 'update':
      startDownload()
      break
    case 'downloading':
      // 下载中不允许点击
      break
    case 'completed':
      dialogVisible.value = false
      break
  }
}

// 检查更新
const checkForUpdates = async () => {
  buttonLoading.value = true
  try {
    const params = {
      version: appInfoStoreIns.appVersion
    }
    let url = (window as any).Constants.uploadUrl + '/users/get-update-info'
    let req = await axios.get(url,{params})
    let data = req.data
    console.log(data)
    if (data.code == 200) {
      buttonLoading.value = false
      titleVisible.value = t('versionupd.version_number') + ' ' + data.data.version
      // 设置更新内容
      dialogContent.value = data.data.content
      // 假设检查到新版本
      buttonState.value = 'update'
      ElMessage.success(t('versionupd.found_new_version'))
    }else{
      buttonLoading.value = false
      ElMessage.success(t('versionupd.already_latest_version'))
    }
  } catch (error) {
    buttonLoading.value = false
    ElMessage.error(t('versionupd.check_update_failed'))
  }
}

// 开始下载
const startDownload = async () => {
  try {
    buttonState.value = 'downloading'
    downloadProgress.value = 0
    downloadSpeed.value = 0 // 重置下载速度
    buttonDisabled.value = true
    isCompleted.value = false // 重置完成状态
    isPostDownloadCalled.value = false // 重置后处理调用标志
    
    const ipcRenderer = getIpcRenderer()
    if (!ipcRenderer) {
      throw new Error('IPC Renderer not available')
    }
    
    console.log('开始订阅进度更新...')
    
    // 订阅实时进度更新
    await ipcRenderer.invoke('subscribe-update-progress')
    
    // 监听实时进度变化
    const handleProgressChange = (event: any, data: any) => {
      console.log('收到进度更新:', data)
      downloadProgress.value = data.percent
      downloadSpeed.value = data.downloadSpeed || 0
      
      // 检查是否完成
      if (!data.isDownloading && data.percent === 100 && !isCompleted.value) {
        isCompleted.value = true
        buttonState.value = 'completed'
        buttonDisabled.value = false
        ElMessage.success(t('versionupd.download_completed'))
        
        // 取消订阅
        ipcRenderer.invoke('unsubscribe-update-progress')
        ipcRenderer.removeAllListeners('update-progress-changed')
      }
    }
    
    // 同时监听两个可能的事件名称
    ipcRenderer.on('update-progress-changed', handleProgressChange)
    ipcRenderer.on('update-download-progress', (event: any, data: any) => {
      console.log('收到下载进度更新:', data)
      downloadProgress.value = data.percent
      downloadSpeed.value = data.downloadSpeed || 0
      
      if (!data.isDownloading && data.percent === 100 && !isCompleted.value) {
        isCompleted.value = true
        buttonState.value = 'completed'
        buttonDisabled.value = false
        ElMessage.success(t('versionupd.download_completed'))
      }
    })
    
    console.log('已设置事件监听器')
    
    console.log('开始真实下载...')
    
    // 开始真实下载
    const result = await ipcRenderer.invoke('update-project-pan')
    
    console.log('下载结果:', result, 'isCompleted:', isCompleted.value)
    
    if (result.completed) {
      // 确保状态正确设置
      if (!isCompleted.value) {
        isCompleted.value = true
        buttonState.value = 'completed'
        buttonDisabled.value = false
        downloadProgress.value = 100
        ElMessage.success(t('versionupd.download_completed'))
      }
      
      console.log('下载结果:', result)
      
      // 下载完成后处理安装程序启动和应用退出（防止重复调用）
      if (!isPostDownloadCalled.value && result.downloadPath) {
        isPostDownloadCalled.value = true
        console.log('准备调用 handlePostDownload，downloadPath:', result.downloadPath)
        try {
          await handlePostDownload(result.downloadPath)
          console.log('handlePostDownload 调用完成')
        } catch (postDownloadError) {
          console.error('调用 handlePostDownload 时发生错误:', postDownloadError)
          ElMessage.error(t('versionupd.post_download_error'))
          isPostDownloadCalled.value = false // 发生错误时重置，允许重试
        }
      } else {
        console.log('handlePostDownload 已调用或downloadPath为空，跳过')
      }
    } else if (!result.completed) {
      buttonState.value = 'update'
      buttonDisabled.value = false
      ElMessage.error(t('versionupd.download_failed_retry'))
    }
    
    // 清理监听
    await ipcRenderer.invoke('unsubscribe-update-progress')
    ipcRenderer.removeAllListeners('update-progress-changed')
    ipcRenderer.removeAllListeners('update-download-progress')
    
  } catch (error) {
    console.error('下载过程中发生错误:', error)
    buttonState.value = 'update'
    buttonDisabled.value = false
    ElMessage.error(t('versionupd.download_error_retry'))
    
    // 清理监听
    const ipcRenderer = getIpcRenderer()
    if (ipcRenderer) {
      await ipcRenderer.invoke('unsubscribe-update-progress')
      ipcRenderer.removeAllListeners('update-progress-changed')
      ipcRenderer.removeAllListeners('update-download-progress')
    }
  }
}

// 处理下载完成后的操作
const handlePostDownload = async (downloadPath) => {
  console.log('=== handlePostDownload 函数被调用 ===')
  console.log('downloadPath:', downloadPath)
  
  if (!downloadPath) {
    console.error('下载路径为空，无法启动安装程序')
    ElMessage.warning(t('versionupd.download_complete_no_path'))
    return
  }
  
  try {
    console.log('准备显示安装确认对话框...')
    
    // 先测试简单弹窗是否能正常显示
    let confirmInstall = null
    
    try {
      console.log('测试ElMessageBox是否可用...')
      // 使用更简单的配置测试
      const testResult = await ElMessageBox({
        title: t('versionupd.install_confirm_title'),
        message: t('versionupd.install_confirm_message'),
        showCancelButton: true,
        confirmButtonText: t('versionupd.install_now'),
        cancelButtonText: t('versionupd.install_later'),
        type: 'success',
        center: true,
        closeOnClickModal: false,
        closeOnPressEscape: false
      })
      console.log('ElMessageBox测试成功，结果:', testResult)
      confirmInstall = testResult
    } catch (messageBoxError) {
      console.error('ElMessageBox失败，尝试备选方案:', messageBoxError)
      
      // 备选方案：使用原生confirm
      const nativeConfirm = confirm(t('versionupd.native_confirm_message'))
      confirmInstall = nativeConfirm ? 'confirm' : 'cancel'
      console.log('使用原生confirm，结果:', confirmInstall)
    }
    
    console.log('用户选择结果:', confirmInstall)
    
    if (confirmInstall === 'confirm') {
      console.log('用户确认安装，启动安装程序:', downloadPath)
      
      // 显示安装提示
      ElMessage({
        message: t('versionupd.starting_installer'),
        type: 'info',
        duration: 3000
      })
      
      // 延迟启动安装程序，确保消息显示
      setTimeout(async () => {
        try {
          // 启动安装程序
          const ipcRenderer = getIpcRenderer()
          if (ipcRenderer) {
            await ipcRenderer.invoke('launch-installer', downloadPath)
            
            // 延迟退出应用，确保安装程序启动成功
            setTimeout(() => {
              console.log('安装程序已启动，退出应用')
              ipcRenderer.send('window-quit')
            }, 1000)
          }
          
        } catch (error) {
          console.error('启动安装程序失败:', error)
          ElMessage.error(t('versionupd.installer_failed'))
          
          // 提供手动打开文件夹的选项
          const openFolder = await ElMessageBox.confirm(
            t('versionupd.auto_install_failed_message'),
            t('versionupd.install_failed_title'),
            {
              confirmButtonText: t('versionupd.open_directory'),
              cancelButtonText: t('common.cancel'),
              type: 'warning'
            }
          )
          
          if (openFolder === 'confirm') {
            const ipcRenderer = getIpcRenderer()
            if (ipcRenderer) {
              await ipcRenderer.invoke('show-item-in-folder', downloadPath)
            }
          }
        }
      }, 1500)
      
    } else {
      // 用户选择稍后安装
      console.log('用户选择稍后安装')
      
      // 提供打开文件夹的选项
      const openFolder = await ElMessageBox.confirm(
        t('versionupd.install_file_downloaded_message'),
        t('versionupd.download_completed'),
        {
          confirmButtonText: t('versionupd.open_directory'),
          cancelButtonText: t('common.close'),
          type: 'info'
        }
      )
      
      if (openFolder === 'confirm') {
        const ipcRenderer = getIpcRenderer()
        if (ipcRenderer) {
          await ipcRenderer.invoke('show-item-in-folder', downloadPath)
        }
      }
    }
    
  } catch (error) {
    console.log('=== handlePostDownload 异常处理 ===')
    console.log('错误类型:', typeof error)
    console.log('错误内容:', error)
    
    if (error === 'cancel') {
      // 用户取消操作
      console.log('用户取消安装确认')
    } else {
      console.error('处理下载完成操作时发生错误:', error)
      ElMessage.error(t('versionupd.install_operation_error'))
    }
  }
}

const handleCancel = () => {
  dialogVisible.value = false
}

//跳转立即更新
const confirmUpdate = () => {
    ElMessage.warning(t('versionupd.download_link_unavailable'))
}

//判断是否显示关闭按钮
const closeable = ref(false)

//关闭对话框
const onClose = () => {
    dialogVisible.value = false
}

// 组件卸载时清理进度监听
onUnmounted(async () => {
  try {
    const ipcRenderer = getIpcRenderer()
    if (ipcRenderer) {
      await ipcRenderer.invoke('unsubscribe-update-progress')
      ipcRenderer.removeAllListeners('update-progress-changed')
      ipcRenderer.removeAllListeners('update-download-progress')
    }
  } catch (error) {
    console.error('组件卸载时清理监听失败:', error)
  }
})


defineExpose({
    openCheckVersionUpdateDialog(options = {}) {
        dialogVisible.value = true
        closeable.value = options.closeable !== false
        
        // 设置版本信息
        currentVersion.value = options.currentVersion || 'v1.0.0'
        newVersion.value = options.newVersion || 'v1.1.0'
        
        // 重置按钮状态
        buttonLoading.value = false
        buttonDisabled.value = false
        downloadProgress.value = 0
        downloadSpeed.value = 0 // 重置下载速度
        isCompleted.value = false // 重置完成状态
        
        // 检查是否已有更新信息，跳过检查更新阶段
        if(appInfoStoreIns.newupdateInfo.version){
            // 直接进入更新阶段
            titleVisible.value = t('versionupd.version_number') + ' ' + appInfoStoreIns.newupdateInfo.version
            dialogContent.value = appInfoStoreIns.newupdateInfo.content
            buttonState.value = 'update'
        } else {
            // 需要检查更新
            titleVisible.value = t('versionupd.check_update')
            buttonState.value = options.initialState || 'check'
        }
        
        // 确保completed状态也能正确重置
        if (buttonState.value === 'completed') {
            buttonState.value = 'check'
        }
    }
})
</script>

<style scoped>
/* 对话框整体样式 */
.version-update-dialog {
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
}

.version-update-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-dark-2) 100%);
  color: var(--el-color-white);
  padding: 20px 24px;
  margin: 0;
}

.version-update-dialog :deep(.el-dialog__title) {
  color: var(--el-color-white);
  font-weight: 600;
  font-size: 18px;
}

.version-update-dialog :deep(.el-dialog__body) {
  padding: 0;
}

/* 对话框内容区域 */
.update-dialog-content {
  padding: 24px;
}

/* 更新头部 */
.update-header {
  text-align: center;
  margin-bottom: 24px;
}

.update-icon {
  margin-bottom: 16px;
}

.update-title {
  margin: 0 0 16px 0;
  color: var(--el-text-color-primary);
  font-size: 20px;
  font-weight: 600;
}

.version-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.current-version {
  color: var(--el-text-color-placeholder);
}

.new-version {
  color: var(--el-color-primary);
  font-weight: 600;
}

.arrow-icon {
  color: var(--el-color-primary);
}

/* 警告提示 */
.update-warning {
  margin-bottom: 24px;
  border-radius: var(--el-border-radius-base);
}

.update-warning :deep(.el-alert__content) {
  line-height: 1.6;
}

/* 更新内容区域 */
.update-content-section {
  margin-bottom: 0;
}

.content-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 600;
}

.content-scrollbar {
  border-radius: var(--el-border-radius-base);
}

.update-notes {
  padding: 0;
}

.update-content {
  margin: 0;
  padding: 16px;
  background-color: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  color: var(--el-text-color-regular);
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
  cursor: text;
}

.update-content::selection {
  background-color: var(--el-color-primary-light-8);
  color: var(--el-color-primary-dark-2);
}

/* 底部按钮区域 */
.update-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 0 24px;
}

.cancel-btn {
  /* 使用系统默认样式 */
}

.cancel-btn:hover {
  /* 使用系统默认悬停样式 */
}

.update-btn {
  /* 使用系统默认样式 */
}

.update-btn:hover {
  /* 使用系统默认悬停样式 */
}

.update-btn:active {
  /* 使用系统默认激活样式 */
}

/* 下载进度按钮样式 */
.downloading-progress {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  border: none !important;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1) !important;
}

.downloading-progress:hover {
  transform: none !important;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 2px 8px var(--el-color-success-light-5) !important;
}

.downloading-progress::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, 
    transparent 25%, 
    rgba(255, 255, 255, 0.1) 25%, 
    rgba(255, 255, 255, 0.1) 50%, 
    transparent 50%, 
    transparent 75%, 
    rgba(255, 255, 255, 0.1) 75%);
  background-size: 20px 20px;
  animation: progress-stripes 1s linear infinite;
  pointer-events: none;
}

@keyframes progress-stripes {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 20px 0;
  }
}

.mr-1 {
  margin-right: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .version-update-dialog {
    width: 90vw !important;
  }
  
  .update-dialog-content {
    padding: 16px;
  }
  
  .update-header {
    padding: 16px;
  }
  
  .update-content-section {
    padding: 16px;
  }
  
  .update-footer {
    padding: 16px;
    flex-direction: column;
  }
  
  .update-btn,
  .cancel-btn {
    width: 100%;
  }
}

/* 动画效果 */
.version-update-dialog :deep(.el-dialog) {
  animation: slideInDown 0.3s ease-out;
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translate3d(0, -100%, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}
</style>