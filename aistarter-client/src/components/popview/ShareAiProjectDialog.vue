<template>
  <el-dialog v-model="dialogVisible" :title="$t('shareproject.title'+types)" width="900px" align-center
    :close-on-press-escape="false" :modal="false">
    <el-steps :active="packingSteps" align-center>
      <el-step :title="$t('shareproject.project_packag'+types)" :description="$t('shareproject.project_packag_text'+types)" />
      <el-step :title="$t('shareproject.project_product_launch'+types)" :description="$t('shareproject.project_product_launch_text')" />
    </el-steps>
    <div class="w-full h-500px">
      <el-scrollbar class="w-868px">
        <el-row :gutter="20" class="w-868px overflow-x-hidden">
          <el-col :span="12">
            <el-upload class="share-project-upload" :auto-upload="false" :show-file-list="false"
              :on-change="handleAvatarChange" :disabled="packingSteps==1">
              <img v-if="imageUrl" :src="imageUrl" class="share-project-pic" />
              <el-icon :size="42" v-else class="share-project-uploader-icon">
                <Plus />
              </el-icon>
              <h3 v-if="!imageUrl" style="position: absolute; top: 80%;">{{ $t('shareproject.project_icon_text') }}</h3>
            </el-upload>
          </el-col>
          <el-col :span="12">
            <el-form ref="ruleFormRef" style="max-width: 600px" :model="ruleForm" :rules="rules" label-width="auto"
              class="demo-ruleForm" status-icon>
              <el-form-item :label="$t('shareproject.project_name'+types)"  :label-width="100">
                <el-tooltip :content="$t('shareproject.project_name_text')" placement="top">
                  <el-input disabled v-model="ruleForm.projectName" :placeholder="$t('shareproject.project_name_text')" />
                </el-tooltip>
              </el-form-item>
              <el-form-item :label="$t('shareproject.project_version'+types)" prop="projectVersion"  :label-width="100">
                <el-input v-model="ruleForm.projectVersion" :placeholder="$t('shareproject.project_version_text')" :disabled="packingSteps==1"/>
              </el-form-item>
              <el-form-item :label="$t('shareproject.project_hw')" :rules="{ required: true }"  :label-width="100" v-if="packingSteps==1 && upTabs == 'class'">
                <el-checkbox-group v-model="gupRadio">
                  <el-checkbox value="1" border>{{ isMac()?'x86':$t('shareproject.project_hw1') }}</el-checkbox>
                  <el-checkbox value="2" border>{{ isMac()?'arm':$t('shareproject.project_hw2') }}</el-checkbox>
                  <el-checkbox value="3" border v-if="!isMac()">{{ $t('shareproject.project_hw3') }}</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              <!--
              <el-form-item label="安装目录" prop="installPath" :label-width="100" v-if="packingSteps==1&& upTabs != 'class'">
                <el-input v-model="ruleForm.installPath" placeholder="大致安装地址例如:/models/xxx"/>
              </el-form-item>
              -->
              <el-form-item v-if="hasGupOption() && packingSteps==1" :label="$t('shareproject.project_vram')" :label-width="100">
                <el-select v-model="needGupRaw" :placeholder="$t('shareproject.project_vram_text')" style="width: 240px;">
                  <el-option v-for="item in gpuOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item :label="$t('shareproject.project_price')"  :label-width="100" v-if="packingSteps==1">
                <el-radio-group v-model="vipRadio" size="large" @change="handleVipChange">
                  <el-radio-button value="1">{{ $t('shareproject.project_price1') }}</el-radio-button>
                  <el-radio-button value="2">{{ $t('shareproject.project_price2') }}</el-radio-button>
                  <el-radio-button value="3">{{ $t('shareproject.project_price3') }}</el-radio-button>
                </el-radio-group>
              </el-form-item>
              <el-form-item v-if="vipRadio.indexOf('2') != -1 && packingSteps==1" :label="$t('shareproject.project_prices')" :label-width="100">
                <el-input-number v-model="priceNum" controls-position="right" :min="1" :precision="2" />
              </el-form-item>
              <el-form-item v-if="vipRadio.indexOf('3') != -1 && packingSteps==1" :label="$t('shareproject.project_prices_novip')" :label-width="100">
                <el-tooltip :content="$t('shareproject.project_prices_novip_text')" placement="top">
                  <el-input-number v-model="priceNum" controls-position="right" :min="0" :precision="2"/>
                </el-tooltip>
              </el-form-item>
              <el-form-item :label="$t('shareproject.project_appicon'+types)"  :label-width="100">
                <el-tooltip
                    effect="dark"
                    :content="$t('shareproject.project_appicon_text'+types)"
                    placement="top"
                >
                  <el-upload class="icon-project-upload" :auto-upload="false" :show-file-list="false"
                    :on-change="handleAvatarChangeico" :disabled="packingSteps==1">
                    <img v-if="appIcon" :src="appIcon" class="icon-project-pic" />
                    <el-icon :size="42" v-else class="icon-project-uploader-icon">
                      <Plus />
                    </el-icon>
                  </el-upload>
                </el-tooltip>
              </el-form-item>
              <el-form-item :label="$t('shareproject.project_class'+types)" :rules="{ required: true }"  :label-width="100" v-if="packingSteps==1">
                <!-- <el-select v-model="ruleForm.screenData" placeholder="类型" style="width: 240px" size="large" clearable
                  multiple>
                  <template #label="{ label, value }">
                    <span>{{ label }}</span>
                  </template>
                  <el-option v-for="item in marketFilterData.app[1].options" :key="item.value" :label="item.label"
                    :value="item.value" />
                </el-select> -->
                <FilterButton :itemsAppoin="filterbtn" @clickItem="clickItem" @clickClear="clickClear" @CloseTab="CloseTab"/>
              </el-form-item>
            </el-form>
          </el-col>
        </el-row>

        <el-row :gutter="20" style="margin-top: 10px;" justify="center" class="w-868px overflow-x-hidden">
          <el-col :span="24">
            <el-form-item :label-width="92">
              <template #label>
                <div class="w-100% h-32px bottomtitle"><div class="line-height-1em">{{ $t('shareproject.project_title'+types) }}</div></div>
              </template>
              <el-input v-model="projectTitle" maxlength="60" placeholder="" show-word-limit type="text" :disabled="packingSteps==1"/>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label-width="92">
              <template #label>
                <div class="w-100% h-32px bottomtitle"><div class="line-height-1em">{{ $t('shareproject.project_desc'+types) }}</div></div>
              </template>
              <el-input v-model="projectDesc" maxlength="200" placeholder="" :rows="2" show-word-limit autosize
                type="textarea" :disabled="packingSteps==1"/>
            </el-form-item>
          </el-col>
          <el-col :span="24"  v-if="packingSteps==1">
            <el-form-item :label-width="92">
              <template #label>
                <div class="w-100% h-32px bottomtitle"><div class="line-height-1em">{{ $t('shareproject.project_overview'+types) }}</div></div>
              </template>
              <el-input v-model="projectDescribe" maxlength="5000" :rows="2" show-word-limit autosize type="textarea"/>
            </el-form-item>
          </el-col>
          <el-col :span="24" v-if="packingSteps==1">
            <el-form-item :label-width="92">
              <template #label>
                <div class="w-100% h-32px bottomtitle"><div class="line-height-1em">{{ $t('shareproject.project_url') }}</div></div>
              </template>
              <el-input v-model="projectUrl" maxlength="3000" placeholder="" :rows="2" show-word-limit autosize
                type="textarea"/>
            </el-form-item>
          </el-col>
          <el-col :span="24" v-if="packingSteps==1">
            <el-form-item :label-width="92" :rules="{ required: true }">
              <template #label>
                <div class="w-100% h-32px bottomtitle" style="justify-content: start;"><div class="line-height-1em">{{ $t('shareproject.project_clonelink') }}</div></div>
              </template>
              <el-input v-model="cloudLink" maxlength="3000" placeholder="" :rows="2" show-word-limit autosize
                type="textarea"/>
            </el-form-item>
          </el-col>
          <el-col :span="6" :offset="packingSteps==1?8:2">
            <el-button type="primary" size="large" style="width: 100%;" @click="publicProject(ruleFormRef)" v-if="packingSteps==1">
              {{ $t('shareproject.project_button_smbit') }}
            </el-button>
            <el-button type="primary" size="large" style="width: 100%;" @click="packageProject" v-if="packingSteps===0">
              {{ $t('shareproject.project_packag_button') }}
            </el-button>
          </el-col>
          <el-col :span="2" v-if="packingSteps==0">
            <el-tooltip :content="$t('shareproject.project_radio_content_text'+types)" placement="top">
              <el-checkbox v-model="shareRepackCheckBox" :label="$t('shareproject.project_radio_content'+types)" size="large" />
            </el-tooltip>
          </el-col>
          <el-col :span="4" :offset="4" v-if="packingSteps===1">
            <el-button size="large" style="width: 100%;" @click="repackageProject">
              {{ $t('shareproject.project_repackag_button') }}
            </el-button>
          </el-col>
        </el-row>
      </el-scrollbar>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, inject, onMounted, reactive } from 'vue'
import axios from 'axios'
import { ElMessage, ElLoading, ElMessageBox } from "element-plus";
import { Plus } from '@element-plus/icons-vue'
const { ipcRenderer } = require('electron');
const {globalHide} = inject('main');
import matomo from "../../matomo"
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import validate from "../../validate";

import _ from 'lodash'
//导入筛选
import marketFilterData from "../../configs/market_filter_data.json"

const packingSteps = ref(0)

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
const filterbtn = ref(deepClone(marketFilterData.app).filter((item) => {return !item.hidden}))
//筛选关闭tab
const CloseTab = (val) => {
  ruleForm.value.screenData = val
}
//清除全部
const clickClear = () => {
  console.log("清除全部")
  ruleForm.value.screenData = {}
}

//筛选点击
const clickItem = (val) => {
  ruleForm.value.screenData = val
}


const dialogVisible = ref(false)

//区分模型，插件，工作流
const upTabs =ref('class')

const ruleFormRef = ref()

const rules = reactive({
  projectVersion: [
    { validator: validate.shareValidateVersion, trigger: 'blur' },
  ],
  installPath:[
    { message: '请输入安装路径',required: true, trigger: 'blur' },
  ]
})

//市场图标
const imageUrl = ref('')

//应用图标
const appIcon = ref('')

const priceNum = ref(0);

//定价模式判断
const handleVipChange = (val) => {
  if (val == 1) { //免费
    priceNum.value = 0
  }
  if (val == 2) { //自定义
    priceNum.value = 1
  }
  if (val == 3) { //VIP
    priceNum.value = 0
  }
}

const ruleForm = ref({
  projectName: '',
  projectVersion: '',
  installPath: '',
  priceType: 0,
  priceValue: 0,
  screenData: {},
})

const gupRadio = ref([]);

const vipRadio = ref("1");

const projectTitle = ref("");
const projectDesc = ref("");
const projectDescribe = ref("");
const projectUrl = ref("");
const cloudLink = ref("");

const needGupRaw = ref("");
//不重新打包
const shareRepackCheckBox = ref(false);

const gpuOptions = [
  {
    value: '3G',
    label: '3G',
  },
  {
    value: '4G',
    label: '4G',
  },
  {
    value: '6G',
    label: '6G',
  },
  {
    value: '8G',
    label: '8G',
  },
  {
    value: '16G',
    label: '16G',
  },
  {
    value: '24G',
    label: '24G',
  },
  {
    value: '24GPlus',
    label: '24G+',
  },
]

let curProjectName = '';
let projectImagePath = '';
let projectIconPath = '';

//记录类型
const types = ref('class')

const resetData = (data,onlineData) => {
  types.value = data.types;
  ruleForm.value.installPath = '';
  projectImagePath = data.imageUrl;
  projectIconPath = data.appIcon;
  imageUrl.value = data.imageUrl;
  ruleForm.value.projectName = curProjectName;
  ruleForm.value.projectVersion = data.version ? data.version : "";
  ruleForm.value.screenData = data.filter? data.filter : {};
  let filterDatas;
  switch (data.types) {
    case 'class':
      filterDatas = 'app';
      break;
    default:
      filterDatas = data.types;
      break;
  }
  filterbtn.value = deepClone(marketFilterData[filterDatas]).filter((item) => {return !item.hidden})
  //filterbtn里的数据判断，如果id等于data.filter里的键值，则将键值对应的值赋给filterbtn里的对应id下的projectModel值
  filterbtn.value.forEach((item) => {
    // if (data.filter && data.filter[item.id]) {
    //   item.projectModel = data.filter[item.id];
    // }
    if (data.filter && data.filter[item.id]) {
      item.projectModel = data.filter[item.id]
    }
    if (item.submenu && item.options.length > 0) {
        item.options.forEach((subItem) => {
          console.log(subItem.value,data.filter[subItem.value]);
            if (data.filter[subItem.value]) {
              console.log(subItem.value);
              subItem.projectModel = data.filter[subItem.value][0];
            }
        });
    }
  });
  gupRadio.value = [];
  
  projectTitle.value = data.name;
  projectDesc.value = data.description;
  
  needGupRaw.value = "";
  shareRepackCheckBox.value = false;
  appIcon.value = data.appIcon;
  packingSteps.value = data.staps;
  if(onlineData){
    shareRepackCheckBox.value = true
    gupRadio.value = onlineData.public_option.gupRadio?onlineData.public_option.gupRadio:[];
    needGupRaw.value = onlineData.public_option.needGupRaw?onlineData.public_option.needGupRaw:'' 
    projectUrl.value = onlineData.public_option.projectUrl?onlineData.public_option.projectUrl:'';
    projectDescribe.value = onlineData.plugn_desc?onlineData.plugn_desc:onlineData.res_desc?onlineData.res_desc:'';
    cloudLink.value = onlineData.cloud_storage_link?onlineData.cloud_storage_link:'';
    ruleForm.value.priceType = onlineData.public_option.priceType?onlineData.public_option.priceType:0;
    vipRadio.value = onlineData.public_option.priceType?String(onlineData.public_option.priceType):"1";
    ruleForm.value.priceValue = onlineData.public_option.priceValue?onlineData.public_option.priceValue:0;
    priceNum.value = onlineData.public_option.priceValue?onlineData.public_option.priceValue:0;
  }else{
    projectUrl.value = ""
    projectDescribe.value = ""
    cloudLink.value = ""
    vipRadio.value = "1"
    ruleForm.value.priceType = 0;
    ruleForm.value.priceValue = 0;
    priceNum.value = 0;
  }
}

//打包
const packageProject = async () => {
  //市场图片信息
  if (imageUrl.value == '') {
    ElMessage.error(t('addproject.project_upload_img_error'))
    return;
  }
  if (projectTitle.value == '') {
    ElMessage.error(t('addproject.project_title_message'))
    return;
  }

  if (projectDesc.value == '') {
    ElMessage.error(t('addproject.project_desc_message'))
    return;
  }
  if(ruleForm.value.projectVersion == ''){
    ElMessage.error(t('addproject.project_version_message'))
    return;
  }
  //新图片打包前，覆盖老图片
  if(getPluInfo.cover != projectImagePath){
    switch (upTabs.value) {
      case 'class':
        await ipcRenderer.invoke('project-copy-image-to-plugin', curProjectName, projectImagePath,'cover.png');
        break;
      default:
        await ipcRenderer.invoke(`resources-copy-image-to-plugin-${upTabs.value}`, curProjectName, projectImagePath,'cover.png');
        break;
    }
  }
  if(getPluInfo.icon != projectIconPath){
    switch (upTabs.value) {
      case 'class':
        await ipcRenderer.invoke('project-copy-image-to-plugin', curProjectName, projectIconPath,'icon.png');
        break;
      default:
        await ipcRenderer.invoke(`resources-copy-image-to-plugin-${upTabs.value}`, curProjectName, projectIconPath,'icon.png');
        break;
    }
  }
  let publicOption = {}
  publicOption["noRepack"] = shareRepackCheckBox.value;
  publicOption['projectVersion'] = ruleForm.value.projectVersion;
  publicOption['projectTitle'] = projectTitle.value;
  publicOption['projectDesc'] = projectDesc.value;
  //读取main.json
  let mainJson;
  switch (upTabs.value) {
    case 'class':
      mainJson = await ipcRenderer.invoke('project-get-plugin-info', curProjectName)
      break;
    default:
      mainJson = await ipcRenderer.invoke(`resources-get-plugin-info-${upTabs.value}`, curProjectName)
      break;
  }
  //获取项目所有文件
  let getfiles;
  switch (upTabs.value) {
      case 'class':
        getfiles = await ipcRenderer.invoke('project-get-pluginall-dirs-and-files', curProjectName,false)
        break;
      default:
        getfiles = await ipcRenderer.invoke(`resources-get-pluginall-dirs-and-files-${upTabs.value}`, curProjectName,false)
        break;
    }
  let options = JSON.parse(mainJson.mainJson)
  if(Array.isArray(options.compress_list) && options.compress_list.length === 0){ //判断为空则添加所有文件
    options.compress_list = getfiles.filter(item => {
      return item != '.aistarter' && item != '.DS_Store' //排除.aistarter和.DS_Store
    })
  }
  //保存main.json
  let reponse;
  switch (upTabs.value) {
    case 'class':
      reponse = await ipcRenderer.invoke('project-save-script', curProjectName, JSON.stringify(options,null,2),'main.json')
      break;
    default:
      reponse = await ipcRenderer.invoke(`resources-save-script-${upTabs.value}`, curProjectName, JSON.stringify(options,null,2),'main.json')
      break;
  }
  if(reponse){
    await ipcRenderer.invoke('project-close-loading')
    let iszip;
    switch (upTabs.value) {
      case 'class':
        iszip = await ipcRenderer.invoke('zip-plugin-code', curProjectName, publicOption)
        break;
      default:
        iszip = await ipcRenderer.invoke(`resources-zip-plugin-code-${upTabs.value}`, curProjectName, publicOption)
        break;
    }
    if(iszip){
      if(shareRepackCheckBox.value){ //判断有没有勾选重新打包 有勾选则不执行下面的操作
        packingSteps.value = 1;
        //勾选了不重新打包 应该不重新弹share目录
        // ElMessageBox.confirm(
        //   t('homeproject.project_package_success'),
        //   t('homeproject.project_move_del_txt_3'),
        //   {
        //     confirmButtonText: t('homeproject.project_move_del_txt_4'),
        //     cancelButtonText: t('homeproject.project_move_del_txt_5'),
        //     showCancelButton: false,
        //     type: 'info',
        //   }
        // )
        // ipcRenderer.send('open-to-dir', '\\Share');
      }else{
        //没有勾选则执行下面的操作
        //生成package.lock 判断文件是否修改
        let packagelock;
        switch (upTabs.value) {
          case 'class':
            packagelock = await ipcRenderer.invoke('create-plugin-package-lock', curProjectName)
            break;
          default:
            packagelock = await ipcRenderer.invoke(`resources-create-plugin-package-lock-${upTabs.value}`, curProjectName)
            break;
        }
        ipcRenderer.invoke('project-close-loading')
        if(packagelock){
          packingSteps.value = 1;
          ElMessageBox.confirm(
            t('homeproject.project_package_success'),
            t('homeproject.project_move_del_txt_3'),
            {
              confirmButtonText: t('homeproject.project_move_del_txt_4'),
              cancelButtonText: t('homeproject.project_move_del_txt_5'),
              showCancelButton: false,
              type: 'info',
            }
          )
        }else{
          ElMessageBox.confirm(
            t('homeproject.project_package_error'),
            t('homeproject.project_move_del_txt_3'),
            {
              confirmButtonText: t('homeproject.project_move_del_txt_4'),
              cancelButtonText: t('homeproject.project_move_del_txt_5'),
              showCancelButton: false,
              type: 'danger',
            }
          )
        }
      }
    }
    console.log('iszip',iszip)
  }
}

//重新打包 是要删除项目
const repackageProject = async () => {
  ElMessageBox.confirm(
    t('shareproject.project_repackag_title'),
    t('shareproject.project_repackag_tit'),
    {
      confirmButtonText: t('homeproject.project_move_del_txt_4'),
      cancelButtonText: t('homeproject.project_move_del_txt_5'),
      type: 'warning',
    }
  ).then(async () => {
    // 确认
    packingSteps.value = 0;
    let req;
    switch (upTabs.value) {
      case 'class':
        req = await ipcRenderer.invoke('project-delete-plugin-package', curProjectName)
        break;
      default:
        req = await ipcRenderer.invoke(`resources-delete-plugin-package-${upTabs.value}`, curProjectName)
        break;
    }
    if(req){
      ElMessage.success(t('shareproject.project_del_success'));
    }
  })
}

//判断系统
const isMac = () => {
  return process.platform == 'darwin';
};
const hasGupOption = () => {
  if(isMac()){ //如果是mac，则不展示配置相关
    return false
  }

  // 使用 some 方法来检查是否有符合条件的元素
  return gupRadio.value.some(el => {
    return el === "2" || el === "3";
  });
};

//市场图片
const handleAvatarChange = async (uploadFile) => {
  let rawFile = uploadFile.raw;
  const allowTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff'];
  if (!allowTypes.includes(rawFile.type)) {
    ElMessage.error(t('imagetxt.img_class_error'))
    return false
  } else if (rawFile.size / 1024 > 500) {
    ElMessage.error(t('imagetxt.img_size_error2'))
    return false
  }
  let temfile = await ipcRenderer.invoke('blob-to-temp-file', rawFile.path,300,400);
  projectImagePath = temfile || rawFile.path;
  imageUrl.value = URL.createObjectURL(rawFile)
}
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
  projectIconPath = temfile || rawFile.path;
  appIcon.value = URL.createObjectURL(rawFile)
}


//发布项目
const publicProject = (formEl) => {
  if (!formEl) {
    return
  }
  formEl.validate(async (valid) => {
    if (valid) {
      //检测服务器有没有同名项目
      try{
        let url = window.Constants.uploadUrl + "/users/check-project-dir";
        if(upTabs.value != 'class'){
          url = window.Constants.uploadUrl + "/users/check-res-dir";
        }
        const req = await axios.get(url, {
            params: {
                dirName: curProjectName
            },
            headers: {
                "access-token": localStorage.getItem('token')
            }
        });
        if (req?.data.code == 1) {
          ElMessage.error(t('addproject.project_add_project_exist_web'))
          return;
        }
      }catch(err){
        ElMessage.error(t('addproject.project_add_project_exist_server'))
        return;
      }
      //市场图片信息
      if (imageUrl.value == '') {
        ElMessage.error(t('addproject.project_upload_img_error'))
        return;
      }
      if (ruleForm.value.projectName == '') {
        ElMessage.error(t('addproject.project_name_empty'))
        return;
      }
      if(upTabs.value == 'class'){
        if(!isMac()){
          if (gupRadio.value.length == 0) {
            ElMessage.error(t('addproject.project_needgupraw_message'))
            return;
          }
        }
      }
      // if(projectDescribe.value == ''){
      //   ElMessage.error(t('addproject.project_describe_message'))
      //   return;
      // }
      //项目分类
      if (_.isEmpty(ruleForm.value.screenData)) {
        ElMessage.error(t('addproject.project_filterclass_message'))
        return;
      }
      //网盘链接
      if (cloudLink.value == '') {
        ElMessage.error(t('addproject.project_cloudlink_message'))
        return;
      }


      let publicOption = {}
      publicOption["noRepack"] = shareRepackCheckBox.value;
      // publicOption["noRepack"] = false;
      publicOption["imagePath"] = getPluInfo.cover != projectImagePath ? projectImagePath : '';
      publicOption["priceNum"] = priceNum.value;
      publicOption["projectName"] = ruleForm.value.projectName;
      publicOption["projectVersion"] = ruleForm.value.projectVersion;
      publicOption["filterData"] = JSON.stringify(ruleForm.value.screenData);
      publicOption["resinstall"] = ruleForm.value.installPath;
      publicOption["priceType"] = vipRadio.value;
      publicOption["priceValue"] = priceNum.value;
      publicOption["gupRadio"] = [...gupRadio.value];
      publicOption["vipRadio"] = vipRadio.value;
      publicOption["projectTitle"] = projectTitle.value;
      publicOption["projectDesc"] = projectDesc.value;
      publicOption["projectOverview"] = projectDescribe.value;
      publicOption["projectUrl"] = projectUrl.value;
      publicOption["cloudLink"] = cloudLink.value;
      publicOption["needGupRaw"] = needGupRaw.value;
      publicOption["type"] = upTabs.value;
      await jsonSavefilter(ruleForm.value.screenData) //保存筛选条件
      if(shareRepackCheckBox.value){
        // 发布
        let upload;
        switch (upTabs.value) {
          case 'class':
            upload = await ipcRenderer.invoke('zip-plugin-code-upload', curProjectName, publicOption)
            if(upload){
              await ipcRenderer.invoke('delete-plugin-package-lock',curProjectName)
            }
            break;
          default:
            upload = await ipcRenderer.invoke('resources-zip-plugin-code-upload', curProjectName,upTabs.value, publicOption)
            if(upload){
              await ipcRenderer.invoke(`resources-delete-plugin-package-lock-${upTabs.value}`,curProjectName)
            }
            break;
        }
        dialogVisible.value = false;
      }else{
         //发布前检测文件是否有修改
        let pdupload;
        switch (upTabs.value) {
          case 'class':
            pdupload = await ipcRenderer.invoke('check-plugin-package-modify', curProjectName)
            break;
          default:
            pdupload = await ipcRenderer.invoke(`resources-check-plugin-package-modify-${upTabs.value}`, curProjectName)
            break;
        }
        if(pdupload){
          // 发布
          let upload;
          switch (upTabs.value) {
            case 'class':
              upload = await ipcRenderer.invoke('zip-plugin-code-upload', curProjectName, publicOption)
              if(upload){
                await ipcRenderer.invoke('delete-plugin-package-lock',curProjectName)
              }
              break;
            default:
              upload = await ipcRenderer.invoke('resources-zip-plugin-code-upload', curProjectName,upTabs.value, publicOption)
              if(upload){
                await ipcRenderer.invoke(`resources-delete-plugin-package-lock-${upTabs.value}`,curProjectName)
              }
              break;
          }
          dialogVisible.value = false;
        }else{
          //检测到有修改，需要重新打包
          ElMessageBox.alert(t('shareproject.project_repackag_check'), t('shareproject.project_repackag_tit'), {
            confirmButtonText: t('homeproject.project_move_del_txt_4'),
            showClose: false,
            callback:async (action) => {
              packingSteps.value = 0;
              // let req = await ipcRenderer.invoke('project-delete-plugin-package', curProjectName)
              // if(req){
              //   ElMessage.success(t('shareproject.project_del_success'));
              // }
            },
          })
        }
      }

      // matomo.trackEvent("AI项目", "开始分享", curProjectName);

      
    } else {
      ElMessage.error(t('addproject.project_please_error'))
      return
    }
  })
}

//更新main.json里的filter
const jsonSavefilter = async (filterData) => {
  //读取main.json
  let mainJson;
  switch (upTabs.value) {
    case 'class':
      mainJson = await ipcRenderer.invoke('project-get-plugin-info', curProjectName)
      break;
    default:
      mainJson = await ipcRenderer.invoke(`resources-get-plugin-info-${upTabs.value}`, curProjectName)
      break;
  }
  let options = JSON.parse(mainJson.mainJson)
  options.filter = filterData
  //保存main.json
  let reponse;
  switch (upTabs.value) {
    case 'class':
      reponse = await ipcRenderer.invoke('project-save-script', curProjectName, JSON.stringify(options,null,2),'main.json')
      break;
    default:
      reponse = await ipcRenderer.invoke(`resources-save-script-${upTabs.value}`, curProjectName, JSON.stringify(options,null,2),'main.json')
      break;
  }
  if(reponse){
    return true
  }
  return false
}

//保存data信息
const getPluInfo = ref({})

async function openShareAiProject(projectName, data) {
  console.log("筛选", marketFilterData.app)

  console.log(projectTitle.value, projectDescribe.value)

  curProjectName = projectName;
  upTabs.value = data.types
  let getplugininfo;
  switch (data.types) {
    case 'class':
      getplugininfo = await ipcRenderer.invoke('project-get-plugin-info', projectName)
      break;
    default:
      getplugininfo = await ipcRenderer.invoke(`resources-get-plugin-info-${data.types}`, projectName)
      break;
  }
  
  getPluInfo.value = getplugininfo
  data.imageUrl = getplugininfo.cover || ''
  data.appIcon = getplugininfo.icon || ''
  data.staps = getplugininfo.isPack
  console.log("aaa", projectName, data)
  let onlineData;
  // 获取项目信息
  let url = window.Constants.uploadUrl + "/users/get-market-detail";
  const req = await axios.get(url, {
      params: {
        install_dir: curProjectName,
        types:data.types
      },
      headers: {
          "access-token": localStorage.getItem('token')
      }
  });
  if (req?.status == 200) {
    onlineData = req.data
    try{
      onlineData.public_option=JSON.parse(onlineData.public_option?onlineData.public_option:onlineData.ext_option?onlineData.ext_option:'{}')
    }catch(e){
      console.log(e)
    }
  }
  resetData(data,onlineData);
  dialogVisible.value = true
}

defineExpose({
  openShareAiProject,
})

</script>

<style scoped>
.bottomtitle{
  display: flex;
  justify-content: center;
  align-items: center;
}
.share-project-pic {
  width: 400px;
  height: 300px;
  display: block;
}

.icon-project-pic {
  width: 64px;
  height: 64px;
  display: block;
}

.share-project-upload {
  width: 400px;
  height: 300px;

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
  font-size: 28px;
  color: #8c939d;
  width: 400px;
  height: 300px;
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