<template>
  <div class="page_bady">
    <el-scrollbar>
      <div class="setting_block">
        <!-- 遍历配置分类 -->
        <template v-for="itmeClass in settingCfg">
          <h4 v-if="itmeClass.title_lankey">{{ $t(itmeClass.title_lankey) }}</h4>
          <h4 v-else>{{ itmeClass.title }}</h4>
          <!-- 遍历配置信息信息 -->
          <template v-for="(setting, index) in itmeClass.configList">
            <!-- 开关选项 -->
            <template v-if="setting.type === 'switch'">
              <div class="setting_list_item">
                <el-icon :size="32">
                  <component :is="setting.icon || 'Setting'" />
                </el-icon>
                <div class="setting_desc">
                  <h4 v-if="setting.label_lankey">{{ $t(setting.label_lankey) }}</h4>
                  <h4 v-else>{{ setting.label }}</h4>
                  <div class="setting_desc_sub" v-if="setting.desc_lankey">{{ $t(setting.desc_lankey) }}</div>
                  <div class="setting_desc_sub" v-else-if="setting.desc">{{ setting.desc }}</div>
                </div>
                <div class="setting_value">
                  <el-switch v-model="setting.value"></el-switch>
                </div>
              </div>
            </template>
            <!-- 下拉选择选项 -->
            <template v-if="setting.type === 'select'">
              <div class="setting_list_item">
                <el-icon :size="32">
                  <component :is="setting.icon || 'Setting'" />
                </el-icon>
                <div class="setting_desc">
                  <h4 v-if="setting.label_lankey">{{ $t(setting.label_lankey) }}</h4>
                  <h4 v-else>{{ setting.label }}</h4>
                  <div class="setting_desc_sub" v-if="setting.desc_lankey">{{ $t(setting.desc_lankey) }}</div>
                  <div class="setting_desc_sub" v-else-if="setting.desc">{{ setting.desc }}</div>
                </div>
                <div class="setting_value">
                  <el-select style="width: 240px;" v-model="setting.value">
                    <el-option v-for="item in setting.options" :key="item.value" :label="item.label"
                      :value="item.value">
                    </el-option>
                  </el-select>
                </div>
              </div>
            </template>
            <!-- 目录设置 -->
            <template v-if="setting.type === 'dir'">
              <div class="setting_list_item">
                <el-icon :size="32">
                  <component :is="setting.icon || 'Folder'" />
                </el-icon>
                <div class="setting_desc">
                  <h4 v-if="setting.label_lankey">{{ $t(setting.label_lankey) }}</h4>
                  <h4 v-else>{{ setting.label }}</h4>
                  <div class="setting_desc_sub" v-if="setting.desc_lankey">{{ $t(setting.desc_lankey) }}</div>
                  <div class="setting_desc_sub" v-else-if="setting.desc">{{ setting.desc }}</div>
                </div>
                <div class="setting_value">
                  <el-input style="width: 360px;" v-model="setting.value" :placeholder="setting.value"
                    :readonly="true"></el-input>
                  <el-button type="primary" style="width: 120px;"
                    @click="openDirectoryDialog(setting, itmeClass.className)">{{ $t('app.setting_select_dir')
                    }}</el-button>
                </div>
              </div>
            </template>
            <!-- 按钮设置 -->
            <template v-if="setting.type === 'btn'">
              <div class="setting_list_item">
                <el-icon :size="32">
                  <component :is="setting.icon || 'Setting'" />
                </el-icon>
                <div class="setting_desc">
                  <h4 v-if="setting.label_lankey">{{ $t(setting.label_lankey) }}</h4>
                  <h4 v-else>{{ setting.label }}</h4>
                  <div class="setting_desc_sub" v-if="setting.desc_lankey">{{ $t(setting.desc_lankey) }}</div>
                  <div class="setting_desc_sub" v-else-if="setting.desc">{{ setting.desc }}</div>
                </div>
                <div class="setting_value">
                  <el-button :type="setting.btnStatus" style="width: 120px;"
                    @click="btnSet(setting.btncmd, setting.label, setting.btntxt,itmeClass.className)">{{
                      setting.btntxt }}</el-button>
                </div>
              </div>
            </template>
            <!-- 按钮设置2(新配置) -->
            <template v-if="setting.type === 'button'">
              <div class="setting_list_item">
                <el-icon :size="32">
                  <component :is="setting.btn_icon || 'Setting'" />
                </el-icon>
                <div class="setting_desc">
                  <h4 v-if="setting.label_lankey">{{ $t(setting.label_lankey) }}</h4>
                  <h4 v-else>{{ setting.label }}</h4>
                  <div class="setting_desc_sub" v-if="setting.desc_lankey">{{ $t(setting.desc_lankey) }}</div>
                  <div class="setting_desc_sub" v-else-if="setting.desc">{{ setting.desc }}</div>
                </div>
                <div class="setting_value">
                  <el-button :type="setting.btn_style" style="width: 120px;" :disabled="setting.btn_disabled"
                    @click="bind(itmeClass.className,setting.bind)">{{
                      setting.btn_text }}</el-button>
                </div>
              </div>
            </template>
          </template>
        </template>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, toRaw, onBeforeUnmount } from "vue";
const { ipcRenderer } = require('electron');
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import { useI18n } from "vue-i18n";
const { t } = useI18n()
const path = require('path')
const exec = require('child_process').exec
//  import {
//     House,
//     Files,
//     Setting,
//     Link,
//   } from "@element-plus/icons-vue";

//  let isHovered = ref(false)
// 执行cmd命令的目录，如果使用cd xx && 上面的命令，这种将会无法正常退出子进程
let cmdPath = ''
// 子进程名称
let workerProcess
function runExec(cmdStr: string, title: string, endStr: string) {
  const loading = ElLoading.service({
    lock: true,
    text: '正在' + title,
    background: 'rgba(0, 0, 0, 0.7)',
  })
  ElMessageBox.confirm(t('app.run_button_cmd_content_1'), t('app.ipv6_dialog_title'), {
    confirmButtonText: t('app.button_ok'),
    type: 'warning',
    showCancelButton: false, // 不显示取消按钮
  })
  // 执行命令行，如果命令不需要路径，或就是项目根目录，则不需要cwd参数：
  workerProcess = exec("start .\\"+cmdStr, { cwd: cmdPath })
  // 不受child_process默认的缓冲区大小的使用方法，没参数也要写上{}：workerProcess = exec(cmdStr, {})

  // 打印正常的后台可执行程序输出
  workerProcess.stdout.on('data', function (data: any) {
    console.log('stdout: ' + data);
    loading.close()
  });

  // 打印错误的后台可执行程序输出
  workerProcess.stderr.on('data', function (data: any) {
    console.log('stderr: ' + data);
    loading.close()
  });

  // 退出之后的输出
  workerProcess.on('close', function (code: any) {
    ElMessage({
      message: '执行' + endStr + '完成',
      type: 'success',
    })
    loading.close()
    console.log('out code：' + code);
  })
}

//按钮配置
async function bind(pluginName: string,bind: string) {
  let result = await ipcRenderer.invoke('project-set-extra-setting2',pluginName,bind)
  if(result){ //脚本运行则不用后续执行命令
    return;
  } 
}
//旧版本按钮设置
async function btnSet(cmd: string, lab: string, btntxt: string, pluginName: string) {
  let result = await ipcRenderer.invoke('project-set-extra-setting',pluginName,cmd)
  if(result){ //脚本运行则不用后续执行命令
    return;
  }
  // runExec(cmd,lab,btntxt)
  // console.log(cmd.split('\\')[cmd.split('\\').length - 1])
  // let index = cmd.lastIndexOf("\\");
  // cmd = cmd.substring(index + 1);

  // 使用split方法分割字符串，这里我们将返回一个数组，包含分割后的所有部分
  var parts = cmd.split('\\');

  // 最后一个元素将是最后一个反斜杠之后的部分
  var lastPart = parts.pop(); // "模型下载-国内源.exe"
  
  if(lastPart === undefined){
    lastPart = ''
  }

  // 去掉最后一个元素后，数组的最后一项将是最后一个反斜杠之前的部分
  var beforeLastPart = parts; // "hallo"

  // 输出结果
  // console.log(cmdPath+beforeLastPart.toString().replaceAll(",","\\"));
  cmdPath = cmdPath + beforeLastPart.toString().replaceAll(",", "\\")
  console.log(cmdPath);
  runExec(lastPart.toString(),lab,btntxt)

}

let settingCfg: any = ref([]);
let curDriConfigKey: any = null;

let settingOldValue: any = null;

ipcRenderer.invoke('plugin-setting-list').then((dirList: any) => {
  console.log("dirList", dirList);
  cmdPath = path.join(dirList[0].configList[1].value,'Products')
  settingCfg.value = dirList;
  settingOldValue = JSON.parse(JSON.stringify(dirList));

  // 监听 settingCfg 的变化
  watch(settingCfg, (newValue, oldValue) => {
    console.log(newValue, oldValue);
    let newCfg = toRaw(newValue)
    let oldCfg = settingOldValue

    settingOldValue = JSON.parse(JSON.stringify(newCfg));

    console.log(newCfg);
    console.log(oldCfg);
    // 当配置发生变化时，发送消息给主进程保存配置
    ipcRenderer.invoke('plugin-change-settings', newCfg, oldCfg)
      .catch((error: Error) => {
        console.error('Error saving settings:', error);
      });
  }, { deep: true }); // 使用 deep: true 来深度监听对象内部的变化

}).catch((error: Error) => {
  console.error('Error fetching setting information:', error);
});

function openDirectoryDialog(dirConfig: any, className: string) {
  curDriConfigKey = dirConfig;
  if (className == "Preferences" && dirConfig.key == "RootDirPath") {
    //传true生成默认目录结构
    ipcRenderer.send('open-dialog', true);
  } else {
    ipcRenderer.send('open-dialog');
  }

}

const handleOpenDialog = function (event: any, result: any) {
  if (result.canceled == false && result.filePaths[0]) {
    //用户选择了目录
    curDriConfigKey.value = result.filePaths[0];
  }
  console.log(curDriConfigKey);
  curDriConfigKey = null;
}

// 改变按钮状态
const onChangeSettingBtnState = function (event: any,pluginName: any, key: any,data: any) {
  console.log(settingCfg.value);
  console.log(data.btn_text,pluginName);
  settingCfg.value.forEach((item: any) => {
    if(item.className==pluginName){
      item.configList.forEach((config: any) => {
        if (config.key == key) {
          console.log(config,'config');
          config.btn_text = data.btn_text;
          config.btn_style = data.btn_style
        }
      })
    }
  })
  // settingCfg.value = result;
}

ipcRenderer.on('on-open-dialog', handleOpenDialog);
// 监听按钮改变
ipcRenderer.on('on-setting-change-btn-state', onChangeSettingBtnState);

// 在组件销毁前移除事件监听器
onBeforeUnmount(() => {
  ipcRenderer.removeListener('on-open-dialog', handleOpenDialog);
  ipcRenderer.removeListener('on-setting-change-btn-state', onChangeSettingBtnState);
});
</script>

<style scoped>
.page_bady {
  padding: 0px 10px;
  display: flex;
  flex-flow: column;
  height: 100%;
  overflow: hidden;
}

.setting_block h4 {
  font-size: 18px;
  padding: 0px;
  margin: 10px 0px;
  text-align: left;
}

.setting_list_item {
  width: auto;
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

.setting_desc_sub {
  color: var(--ep-text-color-secondar);
  font-size: 14px;
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

.setting_list_item h4 {
  margin: 0px;
  padding: 0px 5px 5px 0px;
  font-size: 16px;
}
</style>
