<template>
    <el-scrollbar class="h-58vh">
        <!-- 流程步骤 -->
        <el-steps :active="active" finish-status="success" align-center>
            <el-step :title="$t(item)" v-for="(item, index) in appStepbar" :key="index" />
        </el-steps>
        <!-- 应用编辑信息 -->
        <div class="relative h-full w-full" v-if="active == 0">
            <el-row :gutter="20" class="w-full overflow-x-hidden">
                <el-col :span="12">
                    <el-form :model="appRuleForm" label-width="auto" :rules="appRuleFormRules">
                        <el-form-item :label="$t('addproject.project_folder')" prop="projectName">
                            <el-tooltip :content="$t('addproject.project_folder_tip')" placement="top">
                                <el-input v-model="appRuleForm.projectName"
                                    :placeholder="$t('addproject.project_folder_pholder')" />
                            </el-tooltip>
                        </el-form-item>
                        <el-form-item :label="$t('addproject.project_version')" prop="projectVersion">
                            <el-input v-model="appRuleForm.projectVersion"
                                :placeholder="$t('addproject.project_version_pholder')" show-word-limit type="text" />
                        </el-form-item>
                        <el-form-item :label="$t('addproject.project_icon')">
                            <el-tooltip
                                effect="dark"
                                :content="$t('addproject.project_appicon_text')"
                                placement="top"
                            >
                                <el-upload class="share-project-upload" :auto-upload="false" :show-file-list="false"
                                    :on-change="handleAvatarChangeico">
                                    <div class="flex justify-center align-center w-64px h-64px">
                                        <img v-if="appRuleForm.projectAppIcon" :src="appRuleForm.projectAppIcon"
                                            class="share-project-pic" />
                                        <el-icon :size="42" v-else class="share-project-uploader-icon">
                                            <Plus />
                                        </el-icon>
                                    </div>
                                </el-upload>
                            </el-tooltip>
                        </el-form-item>
                        <el-form-item :label="$t('addproject.project_type')" :rules="{ required: true }">
                            <FilterButton :itemsAppoin="filterbtn" @clickItem="clickItem" @clickClear="clickClear"
                                @CloseTab="CloseTab" />
                        </el-form-item>
                    </el-form>
                </el-col>
                <el-col :span="12">
                    <!-- 下半部分 -->
                    <el-row :gutter="20" justify="center" class="w-full overflow-x-hidden">
                        <el-col :span="24">
                            <el-form :model="appRuleForm" :rules="appRuleFormRules">
                                <el-form-item :label="$t('addproject.project_title')" prop="projectTitle">
                                    <el-input v-model="appRuleForm.projectTitle" maxlength="60"
                                        :placeholder="$t('addproject.project_title_pholder')" show-word-limit type="text" />
                                </el-form-item>
                            </el-form>
                        </el-col>
                        <el-col :span="24">
                            <el-form :model="appRuleForm" :rules="appRuleFormRules">
                                <el-form-item :label="$t('addproject.project_desc')" prop="projectDesc">
                                    <el-input v-model="appRuleForm.projectDesc" maxlength="200"
                                        :placeholder="$t('addproject.project_desc_pholder')" :autosize="{ minRows: 7, maxRows: 7 }" show-word-limit autosize
                                        type="textarea" />
                                </el-form-item>
                            </el-form>
                        </el-col>
                    </el-row>
                </el-col>
            </el-row>
        </div>
        <!-- 应用编辑脚本 -->
        <div class="relative h-full w-full" v-if="active == 1">
            <!-- 脚本模式 -->
            <el-divider content-position="left">{{ $t('addproject.project_script_mode') }}</el-divider>
            <el-radio-group v-model="scriptMode" size="large" @change="handleScriptModeChange">
                <el-radio-button :label="$t('addproject.project_script_mode_ez')" value="0" />
                <el-radio-button :label="$t('addproject.project_script_mode_pro')" value="1" />
            </el-radio-group>
            <!-- 简单模式 -->
            <div v-if="scriptMode == 0">
                <!-- 执行目录以及执行命令行 -->
                <el-divider content-position="left">{{ $t('addproject.project_command_line') }}</el-divider>
                <el-row :gutter="20" style="margin-top: 10px;" justify="center" class="w-full overflow-x-hidden">
                    <el-col :span="24">
                        <el-form :inline="true" :model="appRuleForm" :rules="appRuleFormRules">
                            <el-form-item :label="$t('addproject.project_intg_pkg')" prop="importproject">
                                <div @click="handleClick">
                                    <el-input
                                        v-model="appRuleForm.importproject"
                                        :placeholder="$t('addproject.project_intg_pkg_pholder')"
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
                            <el-form-item :label="$t('addproject.project_command_line_title')" prop="cmdExecuteDirectory">
                                <el-select v-model="appRuleForm.cmdExecuteDirectory" clearable :empty-values="[null, undefined]" :value-on-clear="null"
                                    :placeholder="$t('addproject.project_command_line_title_pholder')" style="width: 240px">
                                    <el-option v-for="(item, index) in appRuleForm.dynamic" :key="index" :label="item.label"
                                        :value="item.value" />
                                </el-select>
                            </el-form-item>
                        </el-form>
                    </el-col>
                    <el-col :span="24">
                        <el-form :model="appRuleForm" label-width="auto" :rules="appRuleFormRules">
                            <el-form-item :label="$t('addproject.project_run_command_line')" prop="executeCmdFunction">
                                <el-input v-model="appRuleForm.executeCmdFunction"
                                    :placeholder="$t('addproject.project_run_command_line_pholder')" :rows="2"
                                    show-word-limit autosize type="textarea" />
                            </el-form-item>
                        </el-form>
                    </el-col>
                </el-row>
                <el-divider content-position="left">{{ $t('addproject.project_callback_output') }}</el-divider>
                <el-row :gutter="20" style="margin-top: 10px;" justify="center" class="w-full overflow-x-hidden">
                    <el-col :span="24">
                        <el-form :inline="true" class="w-full flex">
                            <el-form-item :label="$t('addproject.project_run_time')" style="margin-right: 0;">
                                <el-select
                                    v-model="appRuleForm.timeEndJudge"
                                    :placeholder="$t('addproject.project_time_and_judge')"
                                    style="width: 240px"
                                >
                                    <el-option
                                        :label="$t('addproject.project_time_and_judge_value1')"
                                        value="0"
                                    />
                                    <el-option
                                        :label="$t('addproject.project_time_and_judge_value2')"
                                        value="1"
                                    />
                                </el-select>
                            </el-form-item>
                            <el-form-item class="flex-1" style="margin-right: 0;">
                                <el-input v-model="appRuleForm.startTime" v-if="appRuleForm.timeEndJudge == 1"
                                    :placeholder="$t('addproject.project_run_time_pholder')" parser="Number" />
                                <el-input v-model="appRuleForm.endJudgment" v-if="appRuleForm.timeEndJudge == 0"
                                    :placeholder="$t('addproject.project_end_judge_pholder')" />
                            </el-form-item>
                        </el-form>
                    </el-col>
                </el-row>
                <!-- 添加目录 -->
                <el-divider content-position="left">{{ $t('addproject.project_add_folder') }}</el-divider>
                <el-form ref="formRef" :model="dynamicValidateForm" label-width="auto" class="demo-dynamic">
                    <div v-for="(domain, index) in dynamicValidateForm.domains" :key="domain.key">
                        <el-form-item :label="$t('addproject.project_folder_name')" :prop="'domains.' + index + '.name'"
                            :rules="{
                                required: true,
                                message: $t('addproject.project_folder_name_message'),
                                trigger: 'blur',
                            }">
                            <el-input v-model="domain.name" :placeholder="$t('addproject.project_folder_name_pholder')" />
                        </el-form-item>
                        <el-form-item :label="$t('addproject.project_folder_path')" :prop="'domains.' + index + '.path'"
                            :rules="{
                                required: true,
                                message: $t('addproject.project_folder_path_message'),
                                trigger: 'blur',
                            }">
                            <el-input v-model="domain.path" :placeholder="$t('addproject.project_folder_path_pholder')" />
                        </el-form-item>
                        <el-button class="mb-2" @click.prevent="removeDomain(domain)">
                            {{ $t('addproject.project_add_folder_button') }}
                        </el-button>
                    </div>
                    <el-form-item>
                        <el-button @click="addDomain">+</el-button>
                    </el-form-item>
                </el-form>
                <el-divider content-position="left" v-if="!globalHide">{{ $t('addproject.project_advanced_options') }}</el-divider>
                <el-row :gutter="20" style="margin-top: 10px;" justify="center" class="w-full overflow-x-hidden" v-if="!globalHide">
                    <el-col :span="12">
                        <el-form-item :label="$t('addproject.project_onjumpurl')">
                            <el-input :placeholder="$t('addproject.project_onjumpurl_pholder')"
                                v-model="appRuleForm.nonAutoJump" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item :label="$t('addproject.project_load_prompt')">
                            <el-input :placeholder="$t('addproject.project_load_prompt_pholder')"
                                v-model="appRuleForm.loadingTips" />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-divider content-position="left" v-if="!globalHide">{{ $t('addproject.project_related_settings') }}</el-divider>
                <el-form ref="formRef" :model="relatedSettings" label-width="auto" class="demo-dynamic" v-if="!globalHide">
                    <div v-for="(domain, index) in relatedSettings.domains" :key="domain.key">
                        <el-form-item :label="$t('addproject.project_settings_name')" :prop="'domains.' + index + '.label'"
                            :rules="{
                                required: true,
                                message: $t('addproject.project_settings_name_message'),
                                trigger: 'blur',
                            }">
                            <el-input v-model="domain.label"
                                :placeholder="$t('addproject.project_settings_name_pholder')" />
                        </el-form-item>
                        <el-form-item :label="$t('addproject.project_settings_type')" :prop="'domains.' + index + '.type'"
                            :rules="{
                                required: true,
                                message: $t('addproject.project_settings_type_message'),
                                trigger: 'blur',
                            }">
                            <el-select v-model="domain.type" :placeholder="$t('addproject.project_settings_type_pholder')">
                                <el-option :label="$t('addproject.project_settings_type_label1')" value="btn" />
                                <el-option :label="$t('addproject.project_settings_type_label2')" value="select" />
                            </el-select>
                        </el-form-item>
                        <el-form-item v-if="domain.type == 'select'" :label="$t('addproject.project_settings_type_options')"
                            :prop="'domains.' + index + '.select'" :rules="{
                                required: true,
                                message: $t('addproject.project_settings_type_options_message'),
                                trigger: 'blur',
                            }">
                            <el-form ref="formRef" :model="relatedSettings.domains[index]" label-width="auto"
                                class="demo-dynamic">
                                <div v-for="(domain, index2) in relatedSettings.domains[index].options" :key="domain.key">
                                    <el-form-item :label="$t('addproject.project_settings_visible_content')"
                                        :prop="'options.' + index2 + '.label'" :rules="{
                                            required: true,
                                            message: $t('addproject.project_settings_visible_content_message'),
                                            trigger: 'blur',
                                        }">
                                        <el-input v-model="domain.label"
                                            :placeholder="$t('addproject.project_settings_visible_content_pholder')" />
                                    </el-form-item>
                                    <el-form-item :label="$t('addproject.project_settings_parameter_values')"
                                        :prop="'options.' + index2 + '.value'" :rules="{
                                            required: true,
                                            message: $t('addproject.project_settings_parameter_values_message'),
                                            trigger: 'blur',
                                        }">
                                        <el-input v-model="domain.value"
                                            :placeholder="$t('addproject.project_settings_parameter_values_pholder')" />
                                    </el-form-item>
                                    <el-button class="mb-2" @click.prevent="removeSelect(index, domain)">
                                        {{ $t('addproject.project_add_folder_button') }}
                                    </el-button>
                                </div>
                                <el-form-item>
                                    <el-button @click="addSelect(index)">+</el-button>
                                </el-form-item>
                            </el-form>
                        </el-form-item>
                        <el-form-item v-if="domain.type == 'btn'" :label="$t('addproject.project_settings_button_options')"
                            :prop="'domains.' + index + '.btn'" :rules="{
                                required: true,
                                message: $t('addproject.project_settings_button_options_message'),
                                trigger: 'blur',
                            }">
                            <el-form class="w-full">
                                <el-form-item :label="$t('addproject.project_settings_button_options_label1')">
                                    <el-input v-model="domain.btntxt"
                                        :placeholder="$t('addproject.project_settings_button_options_label1_pholder')" />
                                </el-form-item>
                                <el-form-item :label="$t('addproject.project_settings_button_options_label2')"
                                    :prop="'domains.' + index + '.btnStatus'" :rules="{
                                        required: true,
                                        message: $t('addproject.project_settings_button_options_label2_message'),
                                        trigger: 'blur',
                                    }">
                                    <el-select v-model="domain.btnStatus"
                                        :placeholder="$t('addproject.project_settings_button_options_label2_pholder')">
                                        <el-option :label="$t('addproject.project_settings_button_options_label2_1')"
                                            value="primary" />
                                        <el-option :label="$t('addproject.project_settings_button_options_label2_2')"
                                            value="success" />
                                        <el-option :label="$t('addproject.project_settings_button_options_label2_3')"
                                            value="info" />
                                        <el-option :label="$t('addproject.project_settings_button_options_label2_4')"
                                            value="warning" />
                                        <el-option :label="$t('addproject.project_settings_button_options_label2_5')"
                                            value="danger" />
                                    </el-select>
                                </el-form-item>
                                <el-form-item :label="$t('addproject.project_run_command_line')">
                                    <el-input v-model="domain.btncmd"
                                        :placeholder="$t('addproject.project_run_command_line_pholder2')" />
                                </el-form-item>
                            </el-form>
                        </el-form-item>
                        <el-form-item :label="$t('addproject.project_settings_preview')">
                            <!-- <el-button :type="domain.btnStatus" :disabled="true">{{ domain.btntxt }}</el-button> -->
                            <div class="setting_list_item">
                                <el-icon :size="32">
                                    <Setting />
                                </el-icon>
                                <div class="setting_desc">
                                    <h4 v-if="domain.label_lankey">{{ $t(domain.label_lankey) }}</h4>
                                    <h4 v-else>{{ domain.label }}</h4>
                                </div>
                                <div class="setting_value">
                                    <el-button :type="domain.btnStatus" style="width: 120px;" v-if="domain.type == 'btn'">{{
                                        domain.btntxt
                                        }}</el-button>
                                    <el-select style="width: 240px;" v-model="domain.value" v-if="domain.type == 'select'">
                                        <el-option v-for="item in domain.options" :key="item.value" :label="item.label"
                                            :value="item.value">
                                        </el-option>
                                    </el-select>
                                </div>
                            </div>
                        </el-form-item>
                        <el-form-item v-if="domain.type == 'select'">
                            {{ $t('addproject.project_settings_preview_tip') }}
                        </el-form-item>
                        <el-button class="mb-2" @click.prevent="removeSettings(domain)">
                            {{ $t('addproject.project_add_folder_button') }}
                        </el-button>
                    </div>
                    <el-form-item>
                        <el-button @click="addSettings">+</el-button>
                    </el-form-item>
                </el-form>
            </div>
            <!-- 专业模式 -->
            <div v-if="scriptMode == 1" class="flex justify-center mt-4 mb-4">
                <el-transfer
                    v-model="proModeValue"
                    :titles="[t('addproject.project_needed_script'), t('addproject.project_active_script')]"
                    :data="proModeData"
                    :format="proModeFormat"
                    class="transfer-box ml-2"
                >
                    <template #default="{ option }">
                        <el-tooltip
                            effect="dark"
                            :content="$t(option.lanKey)?$t(option.lanKey):option.tis"
                            placement="right"
                        >
                            {{ option.label }}
                        </el-tooltip>
                    </template>
                </el-transfer>
            </div>
        </div>
        <!-- 上下流程 -->
        <div class="flex justify-center">
            <el-button @click="active--" class="w-100px" v-if="active != 0">{{ $t('addproject.project_back')
                }}</el-button>
            <el-button @click="addProjectStep" class="w-100px"
                v-if="active != (appStepbar.length - 1)">{{ $t('addproject.project_next') }}</el-button>
            <el-button @click="submits" class="w-100px" v-if="active == (appStepbar.length - 1)">{{
                $t('addproject.project_save') }}</el-button>
        </div>
    </el-scrollbar>
</template>

<script setup>
import { ref, inject, reactive, watch, onMounted,watchEffect,nextTick,computed,onBeforeUnmount  } from 'vue'
import { ElMessage,ElLoading,ElMessageBox } from "element-plus";
const { ipcRenderer } = require('electron');
import { UploadFilled,RefreshRight,Folder } from '@element-plus/icons-vue'
import axios from 'axios'
import matomo from "../../matomo"
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const path = require('path')

const { globalHide } = inject('main')

//导入筛选
import marketFilterData from "../../configs/market_filter_data.json"

//导入项目脚本
// import projectScrData from "../../configs/project_script_data.js"
// const projectScrData = require("../../configs/project_script_data.js")

import validate from "../../validate";

//专业模式选择接口
// console.log(projectScrData.listData.filter(item=>item.disabled))
const proModeData = ref()
//设置默认值从projectScrData里取
const proModeValue = ref()
const proModeFormat = ref({
    noDataText:'No data',
    hasChecked:''
})
/**
 * 深度克隆一个对象或数组
 * 
 * 该函数通过递归的方式创建一个新对象或数组，其内部元素与源对象或数组内部元素在值上完全相同，
 * 但彼此之间在内存中是独立的，即修改克隆后的对象或数组不会影响到原始对象或数组
 * 
 * @param source 要克隆的源对象或数组它可以是任何类型的值，但函数主要处理对象和数组类型
 * @returns 返回克隆后的对象或数组如果源不是对象或为null，则直接返回源值
 */
function deepClone(source) {
    // 检查源是否不是对象或为null，如果是，则直接返回源值
    if (typeof source !== 'object' || source == null) {
        return source;
    }

    // 初始化目标对象或数组，根据源是数组还是对象来决定目标的类型
    const target = Array.isArray(source) ? [] : {};

    // 遍历源对象或数组的所有属性
    for (const key in source) {
        // 确保属性是源对象的直接属性，而不是原型链上的属性
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            // 如果属性值是对象且不为null，则递归调用deepClone进行深度克隆
            if (typeof source[key] === 'object' && source[key] !== null) {
                target[key] = deepClone(source[key]);
            } else {
                // 如果属性值不是对象或为null，则直接复制属性值
                target[key] = source[key];
            }
        }
    }

    // 返回克隆后的对象或数组
    return target;
}
//筛选传入类型
const filterbtn = ref(deepClone(marketFilterData.app).filter((item) => { return !item.hidden }))
//筛选关闭tab
const CloseTab = (val) => {
    appRuleForm.value.screenData = val
}
//清除全部
const clickClear = () => {
    console.log("清除全部")
    appRuleForm.value.screenData = {}
}

//筛选点击
const clickItem = (val) => {
    appRuleForm.value.screenData = val
}

//main.js信息
const mainJstxt = {
    automation:true,
    startTime: 0,
    cmdExecuteDirectory: "",
    executeCmdFunction: "",
    endJudgment: "",
    catalogMenu: [],
    loadingTips: "",
    nonAutoJump: "",
    settingsMenu: [],
}

const props = defineProps({
    projectPath: {
        type: String,
        required: true,
        default: "",
    },
})

//路径
let projectPath = ""
//刷新数据
const newRefresh = () => {
    // ipcRenderer.invoke('plugin-setting-list').then((pluginInfoList) => {
    //     console.log(pluginInfoList)
    //     projectPath = pluginInfoList[0].configList[1].value
    // }).catch((error) => {
    //     console.error('Error fetching plugin information:', error);
    // });
    // ipcRenderer.invoke('dir-list-info').then((dirList) => {
    //     // console.log(dirList[0].dirList[2].dirPath)
    //     // console.log(dirList)
    //     projectPath += dirList[0].dirList[2].dirPath
    //     // ipcRenderer.send('open-to-dir', dirList[0].dirList[2].dirPath);
    // }).catch((error) => {
    //     console.error('Error fetching dir information:', error);
    // });
}

// watch(() => props.projectPath, (newValue, oldValue) => {
//     if (newValue == "project" && newValue != oldValue) {
//         newRefresh()
//         resetData()
//     }
// })

const emit = defineEmits(["close"]);

onMounted(async () => {
    newRefresh()
    let JsData = await ipcRenderer.invoke('project-get-pro-list')
    proModeData.value = JsData
    proModeValue.value = JsData.filter(item=>item.disabled).map(item=>item.key)
})



const pathNew = require("path");
const fs = require("fs");

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

async function scriptSave() {
        // if (appRuleForm.value.cmdExecuteDirectory == "") {
        //     ElMessage.error(t('addproject.project_command_line_title_pholder'))
        //     return false
        // }
        if (appRuleForm.value.executeCmdFunction == "") {
            ElMessage.error(t('addproject.project_executecmdfunction_message'))
            return false
        }
        if (appRuleForm.value.endJudgment == "" && appRuleForm.value.startTime == null) {
            appRuleForm.value.startTime = 3000
        }
        if (appRuleForm.value.endJudgment != "") {
            appRuleForm.value.startTime = 0
        }

        mainJstxt.startTime = appRuleForm.value.startTime
        mainJstxt.cmdExecuteDirectory = appRuleForm.value.cmdExecuteDirectory
        mainJstxt.executeCmdFunction = appRuleForm.value.executeCmdFunction
        mainJstxt.catalogMenu = dynamicValidateForm.domains
        
        mainJstxt.endJudgment = appRuleForm.value.endJudgment
        mainJstxt.loadingTips = appRuleForm.value.loadingTips
        mainJstxt.nonAutoJump = appRuleForm.value.nonAutoJump
        mainJstxt.settingsMenu = relatedSettings.domains

        const reponse = await ipcRenderer.invoke('project-create-new-plugin', appRuleForm.value.projectName,JSON.stringify(mainJson, null, 2),JSON.stringify(mainJstxt))
        if(reponse){
            ElMessage.success(t('addproject.project_add_project_success'))
        }else{
            ElMessage.error(t('addproject.project_add_project_error'))
            return false
        }
        await ipcRenderer.invoke('project-delete-plugin-instance',appRuleForm.value.projectName)
        await ipcRenderer.invoke('plugin-list-info')
        return true
}
async function jsonSave(stepspack=false) {
    const isDirExits = await ipcRenderer.invoke('project-check-plugin-dir-exits', appRuleForm.value.projectName)
    mainJson.name = appRuleForm.value.projectTitle
    mainJson.description = appRuleForm.value.projectDesc
    mainJson.version = appRuleForm.value.projectVersion
    mainJson.install_dir = appRuleForm.value.projectName
    mainJson.compress_list = appRuleForm.value.dynamicTags
    mainJson.filter = appRuleForm.value.screenData
    if(appRuleForm.value.projectAppIconPath){
        mainJson.icon = appRuleForm.value.projectAppIconPath
    }
    async function createprojects() {
        try{
            let url = window.Constants.uploadUrl + "/users/check-project-dir";
            const req = await axios.get(url, {
                params: {
                    dirName: appRuleForm.value.projectName
                },
                headers: {
                    "access-token": localStorage.getItem('token')
                }
            });
            if (req?.data.msg == 'success') {
                return true
                // const reponse = await ipcRenderer.invoke('project-create-new-plugin', appRuleForm.value.projectName,JSON.stringify(mainJson, null, 2),null)
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
        // if(emconfirm){
        //     return await createprojects()
        // }
    }else{
        return await createprojects()
    }
}
//添加应用步骤
const addProjectStep = async () => {
    if (active.value == 0) {
        // if (appRuleForm.value.projectAppIcon == "") {
        //     ElMessage.error(t('addproject.project_appicon_message'))
        //     return
        // }
        if (appRuleForm.value.projectName == "") {
            ElMessage.error(t('addproject.project_projectname_message'))
            return
        }
        if (!validate.validateDir(appRuleForm.value.projectName)) {
            ElMessage.error(t('addproject.project_name_message_error'))
            return
        }
        if (appRuleForm.value.projectVersion == "") {
            ElMessage.error(t('addproject.project_version_message'))
            return
        }
        if (appRuleForm.value.screenData.length == 0) {
            ElMessage.error(t('addproject.project_filterclass_message'))
            return;
        }
        if (appRuleForm.value.projectTitle == "") {
            ElMessage.error(t('addproject.project_title_message'))
            return
        }
        if (appRuleForm.value.projectDesc == "") {
            ElMessage.error(t('addproject.project_desc_message'))
            return
        }
        const getfiles = await ipcRenderer.invoke('project-get-pluginall-dirs-and-files', appRuleForm.value.projectName,false)
        const getdir = await ipcRenderer.invoke('project-get-pluginall-dirs-and-files', appRuleForm.value.projectName,true)
        console.log(getfiles)
        if (getfiles.length > 0) {
            getfiles.forEach((item) => {
                if(item != '.aistarter'){
                    appRuleForm.value.dynamicTags.push(item)
                }
            })
            getdir.forEach((item) => {
                if(item != '.aistarter'){
                    appRuleForm.value.dynamic.push({value:item,label:item})
                }
            })
        }
        let json = await jsonSave()
        if (json) {
            active.value++
        }
    }
}

//整合包上传
const handleClick = () => {
    // folderInput.value.click()
    ipcRenderer.send('open-dialog');
}
const handleOpenDialog = async function (event, result) {
  if (result.canceled == false && result.filePaths[0]) {
    //用户选择了目录
    appRuleForm.value.importproject = result.filePaths[0];
    let files = await ipcRenderer.invoke('project-get-all-dirs-and-files', appRuleForm.value.importproject,false)
    let dirs = await ipcRenderer.invoke('project-get-all-dirs-and-files', appRuleForm.value.importproject,true)
    if(files.length>0){
        console.log(files)
        appRuleForm.value.dynamicTags = files
        appRuleForm.value.dynamic = []
        appRuleForm.value.dynamic.push({value:'',label:'根目录'})
        dirs.forEach((item) => {
            appRuleForm.value.dynamic.push({value:item,label:item})
        })
    }
    await jsonSave(true)
  }
  console.log(appRuleForm.value.importproject);
}
ipcRenderer.on('on-open-dialog', handleOpenDialog);
onBeforeUnmount(() => {
    ipcRenderer.removeListener('on-open-dialog', handleOpenDialog);
})

//应用图标
const handleAvatarChangeico = async (uploadFile) => {
    let rawFile = uploadFile.raw;
    const allowTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff'];
    if (!allowTypes.includes(rawFile.type)) {
      ElMessage.error(t('imagetxt.img_class_error'))
      return false
    } else if (rawFile.size / 1024 > 200) {
        ElMessage.error(t('imagetxt.img_size_error'))
        return false
    }
    let temfile = await ipcRenderer.invoke('blob-to-temp-file', rawFile.path,64,64);
    appRuleForm.value.projectAppIconPath = temfile || rawFile.path;
    appRuleForm.value.projectAppIcon = URL.createObjectURL(rawFile)
}

//应用步骤条
const appStepbar = ref([
    'addproject.project_edit',
    'addproject.project_edit_script',
])


//编辑信息
//脚本模式
const scriptMode = ref("0")
const handleScriptModeChange = (value) => {
    console.log(value)
}

//AI应用
const appRuleForm = ref({
    projectAppIcon: '', //项目图标
    projectAppIconPath: '', //项目图标路径
    projectName: '', //项目名称
    projectVersion: '', //版本号
    dynamicTags: [], //相关文件
    dynamic: [{value:'',label:'根目录'}], //相关文件 只展示目录
    projectTitle: '', //项目标题
    projectDesc: '', //项目描述

    timeEndJudge: '0', //时间判断与结束判断
    importproject: '', //整合包导入
    cmdExecuteDirectory: '', //cmd执行目录
    executeCmdFunction: '', //执行命令
    startTime: null, //脚本运行时间
    endJudgment: '', //脚本结束判断
    nonAutoJump: '', //是否自动跳过
    loadingTips: '正在启动，请耐心等候！', //加载提示

    projectImageUrl: '', //项目图片(市场用)
    projectImageUrlPath: '', //项目图片(市场用)路径
    projectDescribe: '', //项目简介
    projectUrl: '', //项目相关链接
    cloudLink: '', //网盘链接
    gupRadio: [], //硬件要求
    needGupRaw: '', //显卡要求
    vipRadio: "1", //发布是，免费，付费，vip
    priceNum: 0, //价格
    screenData: {}, //应用筛选类型

})
//AI应用校验
// 提取共用的验证规则
const commonRules = {
    required: true,
    trigger: 'blur',
};
//校验目录
async function shareValidateDirlocal(rule, value, callback) {
    const isDirExits = await ipcRenderer.invoke('project-check-plugin-dir-exits', appRuleForm.value.projectName)
    if(isDirExits){
        let emconfirm = await ElMessageBox.confirm(
            t('addproject.project_existence_title'),
            t('homeproject.project_move_del_txt_3'),
            {
            confirmButtonText: t('homeproject.project_move_del_txt_4'),
            cancelButtonText: t('homeproject.project_move_del_txt_5'),
            type: 'warning',
            }
        )
        callback(new Error(t('addproject.project_existence_title')));
    }else{
        callback();
    }
}
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
        { ...commonRules, message: t('addproject.project_title_message') },
    ],
    projectDesc: [
        { ...commonRules, message: t('addproject.project_desc_message') },
    ],
    // projectDescribe: [
    //     { ...commonRules, message: t('addproject.project_describe_message') },
    // ],
    // projectUrl: [
    //     { ...commonRules, message: t('addproject.project_url_message') },
    // ],
    // cmdExecuteDirectory:[
    //     { required: true },
    // ],
    // importproject: [
    //     { required: true },
    // ],
    cloudLink: [
        { ...commonRules, message: t('addproject.project_cloudlink_message') },
    ],
    executeCmdFunction: [
        { ...commonRules, message: t('addproject.project_executecmdfunction_message') },
    ],
    gupRadio: [
        {
            type: 'array',
            required: true,
            message: t('addproject.project_gupradio_message'),
            trigger: 'change',
        }
    ],
    needGupRaw: [
        { required: true, message: t('addproject.project_needgupraw_message'), trigger: 'change' },
    ],
};
// 创建响应式对象
const appRuleFormRules = reactive(rules);


//相关文件
// const dynamicTags = ref([])
const InputRef = ref()

//添加目录
const formRef = ref()
const dynamicValidateForm = reactive({
    domains: []
})
const removeDomain = (item) => {
    const index = dynamicValidateForm.domains.indexOf(item)
    if (index !== -1) {
        dynamicValidateForm.domains.splice(index, 1)
    }
}
const addDomain = () => {
    dynamicValidateForm.domains.push({
        key: Date.now(),
        name: '',
        path: path.seq === '\\' ?path.join('\\',appRuleForm.value.cmdExecuteDirectory) : path.join('/',appRuleForm.value.cmdExecuteDirectory),
    })
}

// 相关设置
const relatedSettings = reactive({
    domains: []
})
const removeSettings = (item) => {
    const index = relatedSettings.domains.indexOf(item)
    if (index !== -1) {
        relatedSettings.domains.splice(index, 1)
    }
}
const addSettings = () => {
    console.log(relatedSettings.domains)
    relatedSettings.domains.push({
        key: Date.now(),
        label: '',
        type: 'btn',
        value: true,
        options: [],
        btncmd: '',
        default: ''
    })
}
const removeSelect = (i, item) => {
    const index = relatedSettings.domains[i].options.indexOf(item)
    if (index !== -1) {
        relatedSettings.domains[i].options.splice(index, 1)
    }
}
const addSelect = (item) => {
    relatedSettings.domains[item].options.push({ key: Date.now(), label: '', value: '' })
}



//测试应用

//流程对应的进度
const active = ref(0)

//退出时初始化
const resetData = async () => {
    appRuleForm.value = {
        projectAppIcon: '', //项目图标
        projectAppIconPath: '', //项目图标路径
        projectName: '', //项目名称
        projectVersion: '', //版本号
        dynamicTags: [], //相关文件
        dynamic: [{value:'',label:'根目录'}], //相关文件 只展示目录
        projectTitle: '', //项目标题
        projectDesc: '', //项目描述

        timeEndJudge:'0', //时间判断与结束判断
        importproject: '', //整合包导入
        cmdExecuteDirectory: '', //cmd执行目录
        executeCmdFunction: '', //执行命令
        startTime: null, //脚本运行时间
        endJudgment: '', //脚本结束判断
        nonAutoJump: '', //是否自动跳过
        loadingTips: '正在启动，请耐心等候！', //加载提示

        projectImageUrl: '', //项目图片(市场用)
        projectImageUrlPath: '', //项目图片(市场用)路径
        projectDescribe: '', //项目简介
        projectUrl: '', //项目相关链接
        cloudLink: '', //网盘链接
        gupRadio: [], //硬件要求
        needGupRaw: '', //显卡要求
        vipRadio: "1", //发布是，免费，付费，vip
        priceNum: 0, //价格
        screenData: {}, //应用筛选类型
    }
    active.value = 0
    formRef.value = ""
    InputRef.value = ""
    dynamicValidateForm.domains = []
    relatedSettings.domains = []
    projectPath = ''
    filterbtn.value = await deepClone(marketFilterData.app).filter((item) => { return !item.hidden })
}

let oldProjectPath = '';
watchEffect(() => {
  if (props.projectPath === 'project' && props.projectPath !== oldProjectPath) {
    newRefresh();
    // resetData();
  }
  oldProjectPath = props.projectPath;
});
//应用步骤结束完成
const submits = async () => {
    if(scriptMode.value == "1"){
        const reponse = await ipcRenderer.invoke('project-create-new-plugin', appRuleForm.value.projectName,JSON.stringify(mainJson, null, 2),JSON.stringify(proModeValue.value))
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
        // await ipcRenderer.invoke('project-delete-plugin-instance',appRuleForm.value.projectName)
        emit('close')
    }else if(scriptMode.value == "0"){
        let scr = await scriptSave()
        if(!scr){
            return
        }
        if(appRuleForm.value.importproject){
            let projectipo = await ipcRenderer.invoke('project-import-integration', appRuleForm.value.projectName,appRuleForm.value.importproject)
            if (projectipo) {
                ElMessage.success(t('addproject.project_import_integration_package_success'))
            }else{
                ElMessage.error(t('addproject.project_import_integration_package_error'))
            }
        }
        ElMessageBox.confirm(
            t('addproject.project_yes'),
            t('homeproject.project_move_del_txt_3'),
            {
            confirmButtonText: t('homeproject.project_move_del_txt_4'),
            cancelButtonText: t('homeproject.project_move_del_txt_5'),
            showCancelButton: false,
            type: 'success',
            }
        )
        .then(async () => {
            // await ipcRenderer.invoke('project-delete-plugin-instance',appRuleForm.value.projectName)
            emit('close')
        })
        .catch(async () => {
            // await ipcRenderer.invoke('project-delete-plugin-instance',appRuleForm.value.projectName)
            emit('close')
        })
        
    }
    resetData()
}

// const agreementurl = ref('https://www.aistarter.cc/UserSubscribe.html')

// let disabled = ref(true)

// let time = ref("")



</script>

<style scoped>
.transfer-box >>> .ep-transfer-panel__body{
    /* height: 300px; */
}
.transfer-box >>> .ep-button{
    padding: 0 5px;
}
.transfer-box >>> .ep-transfer-panel{
    width: 350px;
}
.bottomtitle{
  display: flex;
  justify-content: center;
  align-items: center;
}
.setting_list_item {
    width: 100%;
    height: 64px;
    border-radius: 10px;
    background-color: var(--ep-color-primary-light-9);
    margin: 6px 0px;
    padding-left: 20px;
    display: flex;
    flex-flow: row;
    align-items: center;
    /* 垂直居中 */
}

.setting_desc {
    text-align: left;
    flex: 1;
    margin: 0px 30px 0px 15px;
    max-height: 80px;
    overflow: hidden;
}

.setting_value {
    margin-right: 30px;
    display: flex;
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