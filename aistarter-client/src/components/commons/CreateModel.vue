<template>
    <el-scrollbar class="h-58vh">
        <!-- 编辑信息 -->
        <div class="relative h-full w-full">
            <el-row :gutter="20" class="w-full overflow-x-hidden">
                <el-col :span="12">
                    <el-form :model="form" label-width="auto" :rules="appRuleFormRules">
                        <el-form-item :label="$t('modelproject.project_intg_pkg')" prop="importproject">
                            <div @click="handleClick" class="w-full">
                                <el-input
                                    v-model="form.importproject"
                                    :placeholder="$t('modelproject.project_intg_pkg_pholder')"
                                    :readonly="true"
                                >
                                    <template #append>
                                        <el-icon>
                                            <Folder/>
                                        </el-icon>
                                    </template>
                                </el-input>
                            </div>
                        </el-form-item>
                        <el-form-item :label="$t('modelproject.project_folder')" prop="projectName">
                            <el-tooltip :content="$t('modelproject.project_folder_tip')" placement="top">
                                <el-input v-model="form.projectName"
                                    :placeholder="$t('modelproject.project_folder_pholder')" />
                            </el-tooltip>
                        </el-form-item>
                        <el-form-item :label="$t('modelproject.project_version')" prop="projectVersion">
                            <el-input v-model="form.projectVersion"
                                :placeholder="$t('modelproject.project_version_pholder')" show-word-limit type="text" />
                        </el-form-item>
                        <el-form-item :label="$t('modelproject.project_icon')">
                            <el-tooltip
                                effect="dark"
                                :content="$t('modelproject.project_appicon_text')"
                                placement="top"
                            >
                                <el-upload class="share-project-upload" :auto-upload="false" :show-file-list="false"
                                    :on-change="handleAvatarChangeico">
                                    <div class="flex justify-center align-center w-64px h-64px">
                                        <img v-if="appIcon" :src="appIcon"
                                            class="share-project-pic" />
                                        <el-icon :size="42" v-else class="share-project-uploader-icon">
                                            <Plus />
                                        </el-icon>
                                    </div>
                                </el-upload>
                            </el-tooltip>
                        </el-form-item>
                        <el-form-item :label="$t('modelproject.project_type')" :rules="{ required: true }">
                            <FilterButton :itemsAppoin="filterbtn" @clickItem="clickItem" @clickClear="clickClear"
                                @CloseTab="CloseTab" :ifCreate="true"/>
                        </el-form-item>
                    </el-form>
                </el-col>
                <el-col :span="12">
                    <!-- 下半部分 -->
                    <el-row :gutter="20" justify="center" class="w-full overflow-x-hidden">
                        <el-col :span="24">
                            <el-form :model="form" :rules="appRuleFormRules">
                                <el-form-item :label="$t('modelproject.project_title')" prop="projectTitle">
                                    <el-input v-model="form.projectTitle" maxlength="60"
                                        :placeholder="$t('modelproject.project_title_pholder')" show-word-limit type="text" />
                                </el-form-item>
                            </el-form>
                        </el-col>
                        <el-col :span="24">
                            <el-form :model="form" :rules="appRuleFormRules">
                                <el-form-item :label="$t('modelproject.project_desc')" prop="projectDesc">
                                    <el-input v-model="form.projectDesc" maxlength="200"
                                        :placeholder="$t('modelproject.project_desc_pholder')" :autosize="{ minRows: 7, maxRows: 7 }" show-word-limit autosize
                                        type="textarea" />
                                </el-form-item>
                            </el-form>
                        </el-col>
                    </el-row>
                </el-col>
            </el-row>
        </div>
        <!-- 上下流程 -->
        <div class="flex justify-center">
            <el-button @click="submits" class="w-100px">{{$t('addproject.project_save') }}</el-button>
        </div>
    </el-scrollbar>
</template>

<script setup>
import { ref,reactive,watch,onBeforeUnmount } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus'
import validate from "../../validate";
const { ipcRenderer } = require('electron');
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import axios from "axios"
//导入工具
import toolutils from "../../toolutils"
//导入筛选
import marketFilterData from "../../configs/market_filter_data.json"
//筛选传入类型
const filterbtn = ref(toolutils.deepClone(marketFilterData.model).filter((item) => { return !item.hidden }))

//筛选点击
const clickItem = (val) => {
    console.log(val) //{tag: 'ComfyUI', ComfyUI: 'Textual Inversion'} 
    let obj = val
    const keys = Object.keys(val)
    for (let i = 0; i < keys.length; i++) {
        for (let j = keys.length; j > 0; j--) {
            if(val[keys[i]]==keys[j]){
                obj[val[keys[i]]] = [val[keys[j]]]
            }
        }
    }
    console.log(obj)
    form.screenData = obj
}
//清除全部
const clickClear = () => {
    console.log("清除全部")
    form.screenData = {}
}
//筛选关闭tab
const CloseTab = (val) => {
    console.log(val)
    let obj = val
    const keys = Object.keys(val)
    for (let i = 0; i < keys.length; i++) {
        for (let j = keys.length; j > 0; j--) {
            if(val[keys[i]]==keys[j]){
                obj[val[keys[i]]] = [val[keys[j]]]
            }
        }
    }
    console.log(obj)
    form.screenData = obj
}


const props = defineProps({
    projectPath: {
        type: String,
        required: true,
        default: "",
    },
})

// watch(() => props.projectPath, (newValue, oldValue) => {
//     if(newValue=="model"&&newValue!=oldValue){
//         resetData()
//     }
// })

const emit = defineEmits(["close"]);

//模型上传
const handleClick = async () => {
    const result = await ipcRenderer.invoke('open-directory-dialog');
    form.importproject = result[0];
    let files = await ipcRenderer.invoke('project-get-all-dirs-and-files', form.importproject,false)
    if(files.length>0){
        console.log(files)
        form.dynamicTags = files
    }
    await jsonSave(true)
    console.log(form.importproject);
}
//校验目录
async function shareValidateDirlocal(rule, value, callback) {
    const isDirExits = await ipcRenderer.invoke('resources-check-plugin-dir-exits-model', form.projectName)
    if(isDirExits){
        let emconfirm = await ElMessageBox.confirm(
            t('modelproject.project_existence_title'),
            t('homeproject.project_move_del_txt_3'),
            {
            confirmButtonText: t('homeproject.project_move_del_txt_4'),
            cancelButtonText: t('homeproject.project_move_del_txt_5'),
            type: 'warning',
            }
        )
        callback(new Error(t('modelproject.project_existence_title')));
    }else{
        callback();
    }
}

// 提取共用的验证规则
const commonRules = {
    required: true,
    trigger: 'blur',
};
// 定义每个字段的验证规则
const rules = {
    projectName: [
        { ...commonRules, validator: validate.shareValidateDir },
        { ...commonRules, validator: shareValidateDirlocal},
    ],
    projectVersion: [
        { ...commonRules, validator: validate.shareValidateVersion },
    ],
    projectTitle: [
        { ...commonRules, message: t('modelproject.project_title_message') },
    ],
    projectDesc: [
        { ...commonRules, message: t('modelproject.project_desc_message') },
    ],
};

// 创建响应式对象
const appRuleFormRules = reactive(rules);

const resetData = async () => {
    form.projectName = ''
    form.projectVersion = ''
    form.projectTitle = ''
    form.projectDesc = ''
    form.dynamicTags = [] //相关文件
    form.screenData = {} //筛选类型
    form.importproject = '' //整合包导入

    appIconPath.value = ''
    appIcon.value = ''
    filterbtn.value = await toolutils.deepClone(marketFilterData.model).filter((item) => { return !item.hidden })
}

const form = reactive({
    projectName: '',
    projectVersion: '',
    projectTitle: '',
    projectDesc: '',
    dynamicTags: [], //相关文件
    screenData: {}, //筛选类型
    importproject: '', //整合包导入
})


//应用图标地址
const appIconPath = ref('')
//应用图标展示地址
const appIcon = ref('')
const handleAvatarChangeico = (uploadFile) => {
    let rawFile = uploadFile.raw;
    if (rawFile.type !== 'image/png') {
        ElMessage.error(t('imagetxt.img_class_error'))
        return false
    } else if (rawFile.size / 1024 > 200) {
        ElMessage.error(t('imagetxt.img_size_error'))
        return false
    }
    appIconPath.value = rawFile.path
    appIcon.value = URL.createObjectURL(rawFile)
}

let currentPlatform = process.platform === 'win32' ? "win" : (process.platform === 'darwin' ? "macos" : "linux");
//main.json信息
let mainJson = {
    "name": "",
    "description": "",
    "version": "",
    "install_dir": "",
    "filter": {},
    "platforms": [
        currentPlatform
    ],
    "library": [],
    "compress_list": []
}
async function jsonSave(stepspack=false) {
    const isDirExits = await ipcRenderer.invoke('resources-check-plugin-dir-exits-model', form.projectName)
    mainJson.name = form.projectTitle
    mainJson.description = form.projectDesc
    mainJson.version = form.projectVersion
    mainJson.install_dir = form.projectName
    mainJson.compress_list = form.dynamicTags
    mainJson.filter = form.screenData
    if(appIconPath.value){
        mainJson.icon = appIconPath.value
    }
    async function createprojects() {
        try{
            let url = window.Constants.uploadUrl + "/users/check-res-dir";
            const req = await axios.get(url, {
                params: {
                    dirName: form.projectName
                },
                headers: {
                    "access-token": localStorage.getItem('token')
                }
            });
            if (req?.data.msg == 'success') {
                return true
                // const reponse = await ipcRenderer.invoke('project-create-new-plugin', form.projectName,JSON.stringify(mainJson, null, 2),null)
                // if(reponse){
                //     ElMessage.success(t('addproject.project_add_project_success'))
                //     return true
                // }else{
                //     ElMessage.error(t('addproject.project_add_project_error'))
                //     return false
                // }
            }else{
                ElMessage.error(t('addproject.project_add_project_exist_web'))
                return false
            }
        }catch(err){
            console.log(err)
            ElMessage.error(t('addproject.project_add_project_exist_server'))
            return false
        }
    }
    if(isDirExits){
        if(stepspack){
            return await createprojects()
        }
        let emconfirm = await ElMessageBox.confirm(
            t('addproject.project_existence_title'),
            t('homeproject.project_move_del_txt_3'),
            {
            confirmButtonText: t('homeproject.project_move_del_txt_4'),
            cancelButtonText: t('homeproject.project_move_del_txt_5'),
            type: 'warning',
            }
        )
        return false
        // if(emconfirm){
        //     return await createprojects()
        // }
    }else{
        return await createprojects()
    }
}
const submits = async () => {
    let jsonpd = await jsonSave();
    if(!jsonpd){
        return false
    }
    //导入项目
    if(form.importproject){
        let projectipo = await ipcRenderer.invoke('resources-import-integration-model', form.projectName,form.importproject)
        if (projectipo) {
            ElMessage.success(t('addproject.project_import_integration_package_success'))
        }else{
            ElMessage.error(t('addproject.project_import_integration_package_error'))
        }
    }
    const reponse = await ipcRenderer.invoke('resources-create-new-plugin-model', form.projectName,JSON.stringify(mainJson, null, 2))
    if(reponse){
        console.log(reponse)
        ElMessage({
            message: t('addproject.project_add_project_success'),
            type: 'success',
        }) 
    }else{
        ElMessage({
            message: t('addproject.project_add_project_error'),
            type: 'error',
        })
    }
    resetData()
    emit('close')
}

</script>

<style scoped>
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
    width: 64px;
    height: 64px;
    /* margin: 0 auto; */
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
    width: 64px;
    height: 64px;
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