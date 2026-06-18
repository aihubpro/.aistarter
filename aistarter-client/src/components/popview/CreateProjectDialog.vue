<template>
    <el-dialog v-model="dialogVisible" width="900px" center :modal="false"
        align-center :close-on-press-escape="false" @close="handleCloseTab(true)">
        <template #header>
            <div style="padding-left: calc(var(--ep-dialog-padding-primary) + var(--ep-message-close-size, 16px));">
                {{ $t('addproject.title') }}
            </div>
        </template>
        <div class="h-66vh">
            <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleClick">
                <el-tab-pane :label="$t('addproject.project_name1')" name="project">
                    <CreateProject :projectPath="activeName" @close="handleCloseTab" />
                </el-tab-pane>
                <el-tab-pane :label="$t('addproject.project_name2')" name="model">
                    <CreateModel :projectPath="activeName" @close="handleCloseTab" />
                </el-tab-pane>
                <el-tab-pane :label="$t('addproject.project_name3')" name="plugin">
                    <CreatePlugin :projectPath="activeName" @close="handleCloseTab" />
                </el-tab-pane>
                <el-tab-pane :label="$t('addproject.project_name4')" name="workflow">
                    <CreateWorkflow :projectPath="activeName" @close="handleCloseTab" />
                </el-tab-pane>
                <el-tab-pane :label="$t('addproject.project_name5')" name="other">
                    <CreateOther :projectPath="activeName" @close="handleCloseTab" v-if="!globalHide" />
                    <el-result v-if="globalHide" class="result-center" icon="warning" title="暂时未开放，请稍后探索。"></el-result>
                </el-tab-pane>
            </el-tabs>
        </div>
    </el-dialog>
</template>

<script setup>
import { ref,inject,defineEmits } from 'vue'
const { ipcRenderer } = require('electron');
const {globalHide} = inject('main')
import { ElMessage } from 'element-plus'
import { userStore } from '../../stores/UserStore'
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const userStoreIns = userStore() // 引入store实例 用户数据
const emit = defineEmits(['close-dialog']);
//关闭页面
const handleCloseTab = async (val = false) => {
    if (val) {
        activeName.value = ""
        dialogVisible.value = false
        emit('close-dialog');
        return;
    }
    activeName.value = ""
    dialogVisible.value = false
    userStoreIns.addProjectUpdate = new Date().toISOString();
    emit('close-dialog');
}

const dialogVisible = ref(false)


//选择项目模板
const activeName = ref("")

//退出时初始化
const resetData = () => {
    activeName.value = 'project'
    projectPath = ''
}

//路径
let projectPath = ""

function openCreateProject() {
    //判断是否登录
    if (!userStoreIns.isLogin()) {
        ElMessage.error(t('addproject.project_onlogin_onadd'));
        return;
    }
    dialogVisible.value = true;
    resetData()
}

defineExpose({
    openCreateProject
})
</script>

<style scoped>
>>> .ep-tabs__content{
    width: auto !important;
}
.result-center {
    position: relative;
    top: 40%;
    left: 50%;
    transform: translate(-50%, 0);
}
.share-project-pic {
    width: 64px;
    height: 64px;
    display: block;
    margin: auto 0;
}

.icon-project-pic {
    width: 64px;
    height: 64px;
    display: block;
}

.share-project-upload {
    width: 250px;
    height: 200px;
    margin: 0 auto;
    border: 2px dashed var(--ep-border-color);
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--ep-transition-duration-fast);
}

.share-project-upload:hover {
    border-color: var(--ep-color-primary);
}

.share-project-uploader-icon {
    font-size: 16px;
    color: #8c939d;
    width: 250px;
    height: 200px;
    text-align: center;
}

.icon-project-upload {
    width: 64px;
    height: 64px;

    border: 2px dashed var(--ep-border-color);
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--ep-transition-duration-fast);
}

.icon-project-upload:hover {
    border-color: var(--ep-color-primary);
}

.icon-project-uploader-icon {
    font-size: 14px;
    color: #8c939d;
    width: 64px;
    height: 64px;
    text-align: center;
}
</style>