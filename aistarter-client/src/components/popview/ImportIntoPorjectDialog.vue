<template>
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" height="400px" center :show-close="true"
        :close-on-click-modal="false" @close="closeDialog">
        <div class="w-full">
            <el-card class="w-full h-full">
                <template #header>
                    <div class="flex gap-1">
                        <el-autocomplete
                            v-model="search"
                            :fetch-suggestions="querySearch"
                            clearable
                            :placeholder="$t('resconfig.resconfig_title_vali')"
                            @select="handleSelect"
                        />
                    </div>
                </template>
                <el-table :data="tableData" height="250" style="width: 100%">
                    <el-table-column :label="$t('resconfig.resconfig_table_name')" width="470">
                        <template #default="scope">
                            <div :id="scope.row.name">
                                <div class="ellipsis">{{ scope.row.name }}</div>
                                <div class="ellipsis font-size-12px">{{ scope.row.plugindir }}</div>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column min-width="50">
                        <template #header>
                            <div class="flex justify-center items-center">
                                <el-checkbox v-model="allchecked" size="large" @change="handleCheckAll"/>
                            </div>
                        </template>
                        <template #default="scope">
                            <div class="flex justify-center items-center">
                                <el-checkbox v-model="scope.row.isSelected" size="large" :disabled="checked?scope.row.isModel:!scope.row.isModel" @change="handleCheck(scope.row)"/>
                            </div>
                        </template>
                    </el-table-column>
                </el-table>
                <template #footer>
                    <!-- <el-checkbox v-model="checked" label="选择其他没有模型目录的项目" size="large" /> -->
                    <el-row :gutter="20">
                        <el-col :span="8" :offset="8">
                            <div class="flex justify-center items-center h-full">
                                <el-button type="success" @click="confirm">{{ $t('resconfig.resconfig_ok') }}</el-button>
                            </div>
                        </el-col>
                        <el-col :span="8">
                            <div class="flex justify-end items-center h-full">
                                <el-button type="primary" link @click="customImport">{{ $t('resconfig.resconfig_custom_linking')}}</el-button>
                            </div>
                        </el-col>
                    </el-row>
                </template>
            </el-card>
        </div>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, inject,computed } from 'vue'
const { ipcRenderer } = require('electron');
import { ElMessage, ElMessageBox } from "element-plus";
import axios from 'axios'
const path = require('path');
import { useI18n } from "vue-i18n";
const { t } = useI18n()

interface PluginItem {
    name: string;
    dir: String;
}

const dialogVisible = ref(false)
const dialogTitle = ref('模型导入')
//搜索
const search = ref('')
const querySearch = (queryString: string, cb: any) => {
  const results = queryString
    ? tableData.value.filter(createFilter(queryString))
    : tableData.value
  // call callback function to return suggestions
  cb(results)
}
const createFilter = (queryString: string) => {
  return (restaurant: any) => {
    return (
      restaurant.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0
    )
  }
}

const checked = ref(false)

const allchecked = ref(false)
const handleCheckAll = (val: any) => {
    tableData.value.forEach((item: any) => {
        item.isSelected = val
    })
    if(val){
        symlink = tableData.value.map((item: any) => {
            if(item.isSelected){
                return {
                    name:item.name,
                    dir:item.plugindir
                }
            }else{
                return
            }
        })
    }else{
        symlink = []
    }
}

const tableData = ref()
const handleSelect = (item: any) => {
  console.log(item)
  const section = document.getElementById(item.name);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
  }
}

//自定义导入
const customImport = async () => {
    const result = await ipcRenderer.invoke('open-directory-dialog')
    if(result.length > 0){
        // const disk = await ipcRenderer.invoke('resources-get-disk',result[0])
        // if(disk){
        //     ElMessage.warning(t('resconfig.resconfig_nodisk'))
        //     return;
        // }
        tableData.value.push({
            name: result[0],
            plugindir: result[0],
            value: result[0],
            isSelected: true,
            isModel: true,
            isSearch: false,
        })
        symlink.push({
            name:result[0],
            dir:result[0]
        })
    }
}
let symlink: PluginItem[] = []
// 导入插件 判断isSelected是否为true 未true 则导入插件，并将对应项目写入到插件 symlink中
const handleCheck = async (item: any) => {
    allchecked.value = tableData.value.every((item: any) => item.isSelected)
    console.log(item);
    //勾选为true才执行操作
    if(item.isSelected){
        //将勾选的项目写入到插件 symlink
        symlink.push({
            name:item.name,
            dir:item.plugindir
        })
    }else{
        symlink = symlink.filter((symlinkItem:any) => symlinkItem.name !== item.name)
    }
    
}

//确定按钮
const confirm = async () => {
    console.log('确定按钮');
    console.log(JSON.stringify(symlink));
    console.log(localDate)
    // console.log({'symlink':symlink,'localDate':localDate});
    let resOption: any = {}
    resOption['symlink'] = JSON.stringify(symlink)
    resOption['resName'] = localDate.install_dir
    resOption['resType'] = localDate.pluginPath
    resOption['compress_list'] = JSON.stringify(localDate.compress_list)
    //链接项目
    let linkResult = await ipcRenderer.invoke('resources-link-project',resOption.resName,resOption.resType,resOption.compress_list,resOption.symlink)
    if(linkResult.code == 1||linkResult.code == 3){
        console.log('链接成功');
        //写入install.lock
        let result = await ipcRenderer.invoke('resources-write-install-lock-file',localDate.install_dir,localDate.pluginPath,symlink)
        if(result){
            // console.log('写入成功');
            if(linkResult.code == 1){
                ElMessage.success(t('resconfig.resconfig_'+localDate.types)+`[${localDate.name}]`+t('resconfig.resconfig_configno'))
            }else if(linkResult.code == 3){
                symlink.forEach(async (item: any) => {
                    ElMessage.success(t('resconfig.resconfig_'+localDate.types)+`[${localDate.name}]`+t('resconfig.resconfig_configok')+`[${item.name}]`)
                })
            }
            dialogVisible.value = false;
        }else{
            ElMessage.success('导入失败')
        }
    }else if(linkResult.code == 4){
        ElMessageBox.confirm(
            t('app.tis_place_admin'),
            t('homeproject.project_move_del_txt_3'),
            {
              confirmButtonText: t('homeproject.project_move_del_txt_4'),
              cancelButtonText: t('homeproject.project_move_del_txt_5'),
              type: 'warning',
            }
          )
        .then(() => {
            ipcRenderer.send('restart-app-admin');
        })
    }else{
        ElMessage.success(linkResult.msg)
    }
    // let result = await ipcRenderer.invoke('resources-write-install-lock-file',localDate.install_dir,localDate.pluginPath,symlink)
    // if(result){
    //     console.log('写入成功');
    // }
    
}

let localDate:any = [];
async function openImportIntoPorject(plugin: any,paths:string) {
    localDate = plugin
    localDate.pluginPath=paths
    dialogVisible.value = true;
    dialogTitle.value = `【${plugin.name}】`
    //读取install.lock文件
    let installLock = await ipcRenderer.invoke('resources-read-install-lock-file',plugin.install_dir,paths)
    if(!installLock){
        console.log('install.lock文件不存在');
        return
    }
    let pluginInfoList = await ipcRenderer.invoke('plugin-list-info')
    tableData.value = await Promise.all(pluginInfoList.map(async (item:any) => {
        let plugindir = await ipcRenderer.invoke('get-project-files',item.install_dir,2,plugin.types)
        return {
            name: item.name,
            install_dir: item.install_dir,
            value: item.name,
            isModel: plugindir[0]?true:false,
            plugindir:plugindir[0],
            opendir: path.join('Products',item.install_dir),
            isSelected: false,
            isSearch: false,
        }
    }))
    //筛选isModel为true的
    tableData.value = tableData.value.filter((item:any) => item.isModel)
    //排序将isModel为true的放在前面
    // tableData.value.sort((a:any,b:any) => {
    //     if(a.isModel && !b.isModel){
    //         return -1
    //     }
    //     if(!a.isModel && b.isModel){
    //         return 1
    //     }
    //     return 0
    // })
    //获取模型目录下记录的信息。将自定义导入内容添加到tableData.value中
    let locals = installLock.map((item:any) => {
        return {
            name:item.name,
            plugindir:item.dir,
            value: item.name,
            isSelected: false,
            isModel: true,
            isSearch: false,
        }
    })
    locals = locals.filter((item:any) => {
        return !tableData.value.some((tableItem:any) => tableItem.name === item.name)
    })
    tableData.value = [...tableData.value,...locals]
    //根据读取的install.lock文件，将tableData.value中的isSelected设置为true
    tableData.value = tableData.value.map((item:any) => {
        let isSelected = installLock.some((lock:any) => lock.name === item.name)
        return {
            ...item,
            isSelected
        }
    })
    allchecked.value = tableData.value.every((item: any) => item.isSelected)
    symlink = installLock
    console.log(tableData.value)
    console.log(installLock);
}


//关闭窗口后调用
const closeDialog = () => {
    
}

defineExpose({
    openImportIntoPorject
})
</script>

<style scoped>

</style>