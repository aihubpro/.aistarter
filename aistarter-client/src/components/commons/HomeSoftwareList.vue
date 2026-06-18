<!-- HomeSoftwareList.vue 主界面软件列表 -->
<template>
    <div class="home_software_scrollbar" :id="updatetime">
        <el-result v-if="showNoneTip && !hiddenNew" class="result-center" icon="warning" :title="$t('app.not_find_project')"></el-result>
        <el-scrollbar style="position: relative; height: 100%;width: 100%;" v-if="!hiddenNew">
            <!-- 正常 -->
            <p v-for="(item, index) in softwareLists" :key="index" class="home_software_list_item"
                :id="item.install_dir">
                <img :src="item.icon_path" style="width: 64px;height: 64px;" v-if="item.iconPath"/>
                <!-- <div class="list_icon"><b>{{ getItemIcon(item.name) }}</b></div> -->
                <!-- 更新提示 -->
                <!-- <div class="update absolute top--1 w-54px h-25px rotate-320deg left--4 text-center font-size-14px line-height-34px"
                    style="background-color: var(--ep-color-success);">
                    <span class="color-white">new</span>
                </div> -->
                <!-- 图片 -->
                <CommonIcon :pluginName="item.name" v-else/>
                <!-- 图片 -->
                <!-- <div class="w-64px h-64px ml-4 flex justify-center items-center">
                    <el-image :src="imgurl" fit="fill" />
                </div> -->
                <div v-if="isPinned(item)" class="update absolute top--1 w-54px h-25px rotate-320deg left--4 text-center font-size-14px line-height-34px"
                style="background-color: var(--ep-color-danger);">
                    <span class="color-white">{{ $t('homeproject.project_top') }}</span>
                </div>
            <div class="list_item_desc">
                <div class="item_desc_head">
                    <h4 class="line-limit-length line-height-25px" style="line-clamp: 1;">{{ item.name
                        }}
                    </h4><el-tag>{{
                        $t('app.home_tag_pc') }}</el-tag>
                </div>
                <span class="item_desc_sub line-limit-length" style="line-clamp: 2;">{{ item.description }}</span>
            </div>

            <div v-if="item.ProgressInfo" class="download_progress">
                <div v-if="item.ProgressInfo.progressType == 1" class="progress_btn">
                    <el-icon @click="setTorrentState(item.install_dir,item.install_type, true)" class="progress_btn_item"
                        v-if="!item.ProgressInfo.downloadStop && !item.ProgressInfo.isHighSpeed" :size="32">
                        <VideoPause />
                    </el-icon>
                    <el-icon @click="setTorrentState(item.install_dir,item.install_type, false)" class="progress_btn_item"
                        v-if="item.ProgressInfo.downloadStop" :size="32">
                        <VideoPlay />
                    </el-icon>
                </div>
                <el-progress type="dashboard" :percentage="item.ProgressInfo.progress" :width="80">
                    <template #default="{ percentage }">
                        <span class="percentage-value">{{ percentage }}%</span>
                        <span v-if="item.ProgressInfo.progressType == 1" class="percentage-label">{{
                            prettyBytes(item.ProgressInfo.downloadSpeed) }}/s</span>
                        <span v-if="item.ProgressInfo.progressType == 2 || item.ProgressInfo.progressType == 5"
                            class="percentage-label">unzip</span>
                        <span v-if="item.ProgressInfo.progressType == 4" class="percentage-label">prepare</span>
                    </template>
                </el-progress>

            </div>
            <div v-if="!item.ProgressInfo" class="list_item_btns">

                <div class="dev_btn more" v-if="item.openDev && upTab != 'class'" @click="sharePlugin(item.install_dir, item)">
                    <el-button>
                        <el-icon>
                            <Share />
                        </el-icon>
                    </el-button>
                </div>
                <!-- 分享调试 -->
                <el-dropdown class="dev_btn" trigger="click"
                    v-if="item.openDev && upTab == 'class'">
                    <div class="more">
                        <el-button>
                            <el-icon>
                                <Share />
                            </el-icon>
                        </el-button>
                    </div>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item @click="editPlugin(item.install_dir)">{{$t('homeproject.project_share_editcode')}}</el-dropdown-item>
                            <el-dropdown-item @click="runPluginWindow(item.install_dir)">{{$t('homeproject.project_share_run')}}</el-dropdown-item>
                            <el-dropdown-item @click="sharePlugin(item.install_dir, item)">{{$t('homeproject.project_share_share')}}</el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>

                <!-- 更多 -->
                <el-dropdown class="dev_btn" trigger="click"
                    v-if="item.InstallState == 3 || item.InstallState == 0 || item.InstallState == 1 || item.InstallState == 2">
                    <div class="more">
                        <el-button>
                            <el-icon>
                                <MoreFilled />
                            </el-icon>
                        </el-button>
                    </div>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item @click="onFolderClicked(item.install_dir)">{{
                                $t('homeproject.project_move_folder'+upTab) }}</el-dropdown-item>
                            <el-dropdown-item @click="setPluginUninstall(item)">{{ $t('homeproject.project_move_delect'+upTab)
                                }}</el-dropdown-item>
                            <el-dropdown-item @click="setPluginTop(item)">{{
                                $t('homeproject.project_move_top'+upTab) }}</el-dropdown-item>
                            <el-dropdown-item @click="cancelPluginTop(item)" v-if="isPinned(item)">{{$t('homeproject.project_close_top')}}</el-dropdown-item>
                            <el-dropdown-item>
                                <el-upload :auto-upload="false" :show-file-list="false"
                                    :on-change="(file:any) => importPlugin(file, item.install_dir)">
                                    {{ $t('homeproject.project_move_Import') }}
                                </el-upload>
                            </el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>

                <el-button v-if="item.InstallState == 3 && upTab == 'class'" @click="runPlugin(item.install_dir)" type="success">{{
                    $t('app.home_run')
                }}</el-button>
                <el-button v-if="item.InstallState == 3 && upTab != 'class'" @click="importProject(item)" type="success">{{ $t('resconfig.home_resconfig_button') }}</el-button>
                <el-button v-if="item.InstallState == 1 || item.InstallState == 2"
                    @click="installPlugin(item.install_dir)" type="primary">{{ $t('app.home_install')
                    }}</el-button>


                <div class="flex" style="flex-direction: column;" v-if="item.InstallState == 0">
                    <div class="w-full">
                        <el-button v-if="item.InstallState == 0" @click="downloadPlugin(item.install_dir,item.install_type)"
                            type="primary" class="pr-35px pl-35px">{{
                                $t('app.home_download') }}</el-button>
                    </div>
                    <div class="w-full mt-2">
                        <el-button v-if="item.InstallState == 0 && !item.high_speed && !item.pan_high_speed" @click="offlineImport(item)"
                            type="info" class="pr-35px pl-35px">{{
                                $t('app.home_offline_import') }}</el-button>
                    </div>
                    <div class="w-full mt-2">
                    <!-- 123网盘高速下载优先 -->
                    <el-button v-if="item.InstallState == 0 && item.pan_high_speed && item.file_id"
                        @click="downloadPluginPan(item.file_id, item.install_dir)" type="warning"
                        class="pr-35px pl-35px">{{ $t('app.home_high_speed_download') }}</el-button>

                    <!-- 如果没有123网盘高速下载，则显示阿里云oss高速下载 -->
                    <el-button v-if="item.InstallState == 0 && !item.pan_high_speed && item.high_speed && item.file_id"
                        @click="downloadPluginOss(item.file_id, item.install_dir)" type="warning"
                        class="pr-35px pl-35px">{{ $t('app.home_high_speed_download') }}</el-button>
                    </div>
                </div>

                <el-button v-if="item.InstallState == 4" @click="exitPlugin(item.install_dir)" type="danger">{{
                    $t('app.home_exit')
                }}</el-button>



            </div>
            </p>
        </el-scrollbar>
        <el-result v-if="hiddenNew" class="result-center" icon="warning" :title="$t('app.under_development')"></el-result>
    </div>
</template>

<style scoped>
/* 超出省略号 */
.line-limit-length {
    display: -webkit-box;
    /* 设置为WebKit内核的弹性盒子模型 */
    -webkit-box-orient: vertical;
    /* 垂直排列 */
    line-clamp: 2;
    /* 限制显示两行 */
    overflow: hidden;
    /* 隐藏超出范围的内容 */
    text-overflow: ellipsis;
    /* 使用省略号 */
}

.home_software_list_item {
    position: relative;
    width: 100%;
    height: 90px;
    border-radius: 10px;
    background-color: var(--ep-color-primary-light-9);
    margin: 6px 0px;
    display: flex;
    flex-flow: row;
    align-items: center;
    overflow: hidden;
    /* 垂直居中 */
}

.home_software_list_item img {
    margin-left: 20px;
}

.item_desc_head {
    display: flex;
    flex-flow: row;
    align-items: center;
    /* 垂直居中 */
}

.item_desc_head h4 {
    margin: 0px;
    padding: 0px 5px 5px 0px;
}

.home_software_list_item .item_desc_sub {
    color: var(--ep-text-color-secondar);
    font-size: 15px;
}

.home_software_list_item .list_item_desc {
    text-align: left;
    flex: 1;
    margin: 0px 30px 0px 10px;
    max-height: 80px;
    overflow: hidden;
}

.home_software_list_item .list_item_btns {
    margin-right: 20px;
    display: flex;
    align-items: center;
}

.home_software_scrollbar {
    /* height: 60vh; */
    display: flex;
    flex-grow: 1;
    overflow: hidden;
}

.list_icon {
    width: 64px;
    height: 64px;
    background-color: rgb(254, 197, 46);
    border-radius: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 46px;
    color: white;
    user-select: none;
    margin-left: 20px;
}

.result-center {
    position: relative;
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.dev_btn {
    margin-right: 20px;
}

.dev_btn .ep-button {
    padding-left: 10px;
    padding-right: 10px;
}

.download_progress {
    user-select: none;
    margin-right: 20px;
    padding-left: 120px;

    display: flex;
    justify-content: center;
    align-items: center;
}

.download_progress .percentage-value {
    display: block;
    margin-top: 5px;
    font-size: 15px;
}

.download_progress .percentage-label {
    display: block;
    margin-top: 5px;
    font-size: 8px;
}

.download_progress .progress_btn {
    /* display: none; */
    margin-right: 10px;
}

/* .home_software_list_item:hover .progress_btn {
    display: block;
} */

.progress_btn .progress_btn_item:hover {
    cursor: pointer;
}
</style>

<script lang="ts" setup>
import { ref, h, nextTick, onBeforeUnmount, onMounted, inject, defineProps, watch,computed } from "vue";
import { ElMessage, ElLoading, ElMessageBox, ElSwitch } from 'element-plus'
import { useI18n } from "vue-i18n";
const { ipcRenderer } = require('electron');
const path = require('path');
const prettyBytes = require('prettier-bytes')
const fs = require('fs')
const { t } = useI18n()
import { userStore } from '../../stores/UserStore'
const userStoreIns = userStore() // 引入store实例 用户数据
import axios from 'axios'
import matomo from "../../matomo"

import {
    Edit,
    Share,
    Delete,
    VideoPause,
    VideoPlay
} from "@element-plus/icons-vue";
//引用lodash列表
import _ from 'lodash'


const props = defineProps({
    //子组件接收父组件传递过来的值
    search: {
        type: String,
        default: "",
    },
    sort: {
        type: String,
        default: "1"
    },
    filter: {
        type: String,
        default: ""
    },
    upTab: {
        type: String,
        default: ""
    },
    update:{
        type:String,
        default: ""
    }
})

const updatetime = computed(() => {
    console.log("更新")
    getSoftwareList(props.upTab)
    // return props.update
    return userStoreIns.addProjectUpdate
})

//编辑代码
const editPlugin = (pluginName:string) => {
    openEditCode(pluginName)
}
//调试运行
const runPluginWindow = (pluginName:string) => {
    openDebugRun(pluginName)
}

//离线导入跳转
const offlineImport = (item: any) => {
    console.log(item)
    // 解构并重命名
    const { file_id: id, ...rest } = item;
    let res_type = 0
    switch (item.types) {
        case 'model':
            res_type = 1
            break
        case 'plugin':
            res_type = 2
            break
        case 'workflow':
            res_type = 3
            break
        default:
            res_type = 0
            break
    }
    // 创建新对象
    const data = {
        id,
        ...rest,
        res_type:res_type
    };
    openProductDetails(data,item,"third")
}

//项目导入
const importPlugin = async (uploadFile: any, dir: any) => {
    let rawFile = uploadFile.raw;
    // if (rawFile.type !== 'image/png') {
    //     ElMessage.error('请上传Png格式的图片！')
    //     return false
    // } else if (rawFile.size / 1024 > 200) {
    //     ElMessage.error('图片大小不能大于200KB!')
    //     return false
    // }

    try {
        // 调用主进程的方法，并等待返回结果
        let isImport;
        switch (props.upTab) {
            case 'class':
                isImport = await ipcRenderer.invoke("project-import-package", dir, rawFile.path);
            break;
            default:
                isImport = await ipcRenderer.invoke(`resources-import-package-${props.upTab}`, dir, rawFile.path);
            break;
        }
        console.log(isImport);
    } catch (error) {
        // 异常错误
        console.error(error);
    }

    console.log("项目地址:", rawFile.path)
    console.log("安装目录:", dir)
}

//卸载
const setPluginUninstall = (dir: any) => {
    ElMessageBox.confirm(t('homeproject.project_move_del_txt') + dir.name + t('homeproject.project_move_del_txt_2'), t('homeproject.project_move_del_txt_3'), {
        confirmButtonText: t('homeproject.project_move_del_txt_4'),
        cancelButtonText: t('homeproject.project_move_del_txt_5'),
        type: 'warning',
    }).then(async () => {
        try {
            // 调用主进程的方法，并等待返回结果
            let isImport;
            switch (props.upTab) {
                case 'class':
                    isImport = await ipcRenderer.invoke("project-delete-plugin", dir.install_dir);
                break;
                default:
                    isImport = await ipcRenderer.invoke(`resources-delete-plugin-${props.upTab}`, dir.install_dir);
                break;
            }
            if (isImport) {
                // 发送获取插件信息的请求，并处理回复
                getSoftwareList(props.upTab)
            }

            // console.log(isImport);

        } catch (error) {
            // 异常错误
            console.error(error);
        }
        // console.log(dir)
        console.log(props.upTab , dir.install_dir)

    })
}
//打开文件目录
const onFolderClicked = (dirPath: string) => {
    // 鼠标移出时的处理逻辑，可以还原样式或执行其他操作
    console.log('onFolderClicked');
    console.log(dirPath);
    let pluginPath = '';
    switch (props.upTab) {
        case 'class':
        pluginPath = 'Products';
        break;
        case 'model':
        pluginPath = 'Models';
        break;
        case 'plugin':
        pluginPath = 'Plugins';
        break;
        case 'workflow':
        pluginPath = 'Workflows';
        break;
    }
    ipcRenderer.send('open-to-dir', path.join(pluginPath,dirPath));
};

function isPinned(dir:any) {
    const topList = JSON.parse(localStorage.getItem('pluginTopDirs') || '[]');
    return topList.some((item:any) => item.install_dir === dir.install_dir && item.types === dir.types);
}
//软件列表置顶
const setPluginTop = (dir: any) => {
    console.log(dir)
    let topList = JSON.parse(localStorage.getItem('pluginTopDirs') || '[]');
    // 如果已经在置顶列表中，先移除再添加到开头
    topList = topList.filter((item: any) => !(item.install_dir === dir.install_dir && item.types === dir.types));
    topList.unshift({ install_dir: dir.install_dir, types:dir.types });
    localStorage.setItem('pluginTopDirs', JSON.stringify(topList));
    getSoftwareList(props.upTab); // 刷新软件列表
}
//软件取消置顶
function cancelPluginTop(dir:any) {
    let pinnedItems = JSON.parse(localStorage.getItem('pluginTopDirs') || '[]');
    pinnedItems = pinnedItems.filter((item: any) => !(item.install_dir === dir.install_dir && item.types === dir.types));
    localStorage.setItem('pluginTopDirs', JSON.stringify(pinnedItems));
    getSoftwareList(props.upTab); // 刷新列表
}
const getArrayByName = (list: Array<any>, keyWord: string) => { //本地模糊搜索
    /**
     * 使用test方法实现模糊查询
     * @param  {Array}  list     进行查询的数组
     * @param  {String} keyWord  查询的关键词
     * @return {Array}           查询的结果
     */
    var reg = new RegExp(keyWord);
    var result = [];
    for (var key in list) {
        if (reg.test(list[key].name)) {
            result.push(list[key])
        }
    }
    if (keyWord == '') {
        return false
    }
    return result
}

const filterCheck = (data: any) => {
    if (_.isEmpty(data)) {
        return softwareList.value;
    }
    console.log(softwareList.value);
    let datas = softwareList.value.filter((item: any) => {
        for (let key in item.filter) {
            const filterValue = item.filter[key];
            const dataValue = data[`${key}`] || [];

            if (Array.isArray(filterValue)) {
                // 如果 filterValue 是数组，检查 dataValue 是否包含所有 filterValue 的元素
                if (!filterValue.every(val => dataValue.includes(val))) {
                    return false;
                }
            } else {
                // 如果 filterValue 不是数组，直接比较
                if (dataValue !== filterValue) {
                    return false;
                }
            }
        }
        return true;
    });

    return datas;
}
//未更新内容隐藏
const hiddenNew = computed(() => {
    switch (props.upTab) {
        case "other":
            return true;
        default:
            return false;
    }
});


//默认图片
const imgurl = new URL("~/assets/ai_noimg.png", import.meta.url).href;

const softwareList = ref([]) as any
const softwareLists = computed(() => {
    // let search = getArrayByName(filterCheck(props.filter), props.search) || filterCheck(props.filter)
    // switch(props.sort){
    //     case "1":
    //         return asceSort(search)
    //         break
    //     case "2":
    //         return descSort(search)
    //         break
    //     default:
    //         return search
    //         break
    // }
    let search = getArrayByName(filterCheck(props.filter), props.search) || filterCheck(props.filter)
    switch(props.sort){
        case "1":
            search = asceSort(search)
            break
        case "2":
            search = descSort(search)
            break
        default:
            break
    }
    // 批量置顶逻辑
    const topList = JSON.parse(localStorage.getItem('pluginTopDirs') || '[]');
    const topItems = [];
    const searchCopy = search.slice(); // 复制数组
    for (const dir of topList) {
        const idx = searchCopy.findIndex((item:any) => item.install_dir === dir.install_dir && item.types === dir.types);
        if (idx > -1) {
            topItems.push(searchCopy.splice(idx, 1)[0]);
        }
    }
    return [...topItems, ...searchCopy];
})


const showNoneTip = ref(false) //是否显示没有数据

const { openShareAiProject, globalHide, openProductDetails,openEditCode,openDebugRun,openImportIntoPorject } = inject('main') as any;

//升序
const asceSort = (data: any) => {
    return data.sort((b: any, a: any) => {
        const nameA = a.name.toUpperCase(); // 忽略大小写
        const nameB = b.name.toUpperCase(); // 忽略大小写
        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }

        // name 必须相等
        return 0;
    })
}
//降序
const descSort = (data: any) => {
    return data.sort((a: any, b: any) => {
        const nameA = a.name.toUpperCase(); // 忽略大小写
        const nameB = b.name.toUpperCase(); // 忽略大小写
        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }

        // name 必须相等
        return 0;
    })
}
//软件列表
// let projectPath = ''
// 发送获取插件信息的请求，并处理回复
const getSoftwareList = async (pluginName?: string) => {
    softwareList.value = []
    let pluginInfoList
    switch (pluginName) {
        case 'class':
            pluginInfoList = await ipcRenderer.invoke('plugin-list-info')
        break;
        default:
            pluginInfoList = await ipcRenderer.invoke(`resources-list-info-${pluginName}`)
        break;
    }
    if (pluginInfoList) {
        pluginInfoList.forEach((pluginCfg: any) => {
            console.log(pluginCfg["iconPath"]);
            pluginCfg.icon_path = new URL(pluginCfg["iconPath"], import.meta.url).href;
        });
        // 处理插件信息，例如更新界面
        console.log('Received plugin information:', pluginInfoList);

        // projectPath = pluginInfoList[0].configList[1].value

        softwareList.value = pluginInfoList.map((pluginCfg: any) => {
            return {
                ...pluginCfg,
                types:props.upTab
            }
        })

        // softwareLists.value = asceSort(pluginInfoList)

        if (pluginInfoList.length <= 0) {
            showNoneTip.value = true;
        } else {
            showNoneTip.value = false;
        }
    }
}
// getSoftwareList()
// ipcRenderer.invoke('dir-list-info').then((dirList) => {
//     projectPath += dirList[0].dirList[2].dirPath
// }).catch((error) => {
//     console.error('Error fetching dir information:', error);
// });

const onPluginInstall = function (event: any, pluginName: string) {
    softwareList.value.forEach((value: any) => {
        if (value.install_dir == pluginName) {
            value.InstallState = 3;
        }
    })
    console.log('on-plugin-install:', pluginName);

    const loading = ElLoading.service({
        lock: true,
        text: '安装成功',
        background: 'rgba(0, 0, 0, 0.7)',
    })

    nextTick(() => {
        // Loading should be closed asynchronously
        loading.close()
    })

    matomo.trackEvent("AI项目", "安装成功", pluginName);
}

const onProjectDownload = function (event: any, pluginName: string) {
    softwareList.value.forEach((value: any) => {
        if (value.install_dir == pluginName) {
            value.InstallState = 2;
        }
    })

    console.log('on-plugin-install:', pluginName);

    const loading = ElLoading.service({
        lock: true,
        text: '项目下载完成',
        background: 'rgba(0, 0, 0, 0.7)',
    })

    nextTick(() => {
        // Loading should be closed asynchronously
        loading.close()
    })

    matomo.trackEvent("AI项目", "下载解压成功", pluginName);
}

// 下载模型，插件，工作流单独处理
const onResDownload = function (event: any, pluginName: string) {
    softwareList.value.forEach((value: any) => {
        if (value.install_dir == pluginName) {
            value.InstallState = 3;
        }
    })

    console.log('on-resources-download:', pluginName);

    const loading = ElLoading.service({
        lock: true,
        text: '插件下载完成',
        background: 'rgba(0, 0, 0, 0.7)',
    })

    nextTick(() => {
        // Loading should be closed asynchronously
        loading.close()
    })
}

// 安装插件方法
const installPlugin = (pluginName: string) => {
    // 发送事件给主进程
    ipcRenderer.send('plugin-install', pluginName);

    const loading = ElLoading.service({
        lock: true,
        text: '正在安装...',
        background: 'rgba(0, 0, 0, 0.7)',
    })
};

// 下载插件
const downloadPlugin = (pluginName: string,pluginType: string) => {
    // ElMessage('下载未实现！')
    // window.open(downloadLink, '_blank');

    console.log(pluginName);
    if(pluginType != 'Products'){
        // 发送事件给主进程
        ipcRenderer.send('resources-project-download', pluginName,pluginType);
    }else{
        // 发送事件给主进程
        ipcRenderer.send('plugin-project-download', pluginName);
    }

    matomo.trackEvent("AI项目", "下载项目开始", pluginName);
}

// 下载插件Oss
const downloadPluginOss = async (fileId: string, pluginName: string) => {

    //判断是否登录
    if (!userStoreIns.isLogin()) {
        ElMessage.error("请先登录后再下载！");
        return;
    }

    try {
        // 调用主进程的方法，并等待返回结果
        const authInfo = await ipcRenderer.invoke("download-project-oss", fileId, pluginName);
        console.log(authInfo);
        return authInfo; // 返回结果
    } catch (error) {
        // 处理可能出现的错误
        console.error('Failed to get auth info:', error);
        throw error; // 或者返回一个错误信息
    }
}

// 下载插件123pan
const downloadPluginPan = async (fileId: string, pluginName: string) => {
    //判断是否登录
    if (!userStoreIns.isLogin()) {
        ElMessage.error("请先登录后再下载！");
        return;
    }

    try {
        // 调用主进程的方法，并等待返回结果
        const authInfo = await ipcRenderer.invoke("download-project-pan", fileId, pluginName);
        console.log(authInfo);
        return authInfo; // 返回结果
    } catch (error) {
        // 处理可能出现的错误
        console.error('Failed to get auth info:', error);
        throw error; // 或者返回一个错误信息
    }
}

// 启动程序
const runPlugin = (pluginName: string) => {
    console.log(pluginName)
    softwareList.value.forEach((value: any) => {
        if (value.install_dir == pluginName) {
            //标记启动
            value.InstallState = 4;
        }
    })

    ipcRenderer.send('plugin-run', pluginName);

    matomo.trackEvent("AI项目", "启动项目", pluginName);
}
//导入项目
const importProject = async (plugin: any) => {
    let pluginPath = 'Products';
    switch (props.upTab) {
        case 'class':
        pluginPath = 'Products';
        break;
        case 'model':
        pluginPath = 'Models';
        break;
        case 'plugin':
        pluginPath = 'Plugins';
        break;
        case 'workflow':
        pluginPath = 'Workflows';
        break;
    }
    openImportIntoPorject(plugin,pluginPath);
    console.log(plugin)
}

// 改变按钮状态
const onChangePluginBtnState = (event: any, pluginName: string, state: string) => {
    softwareList.value.forEach((value: any) => {
        if (value.install_dir == pluginName) {
            //标记启动
            if (state == "exit") {
                value.InstallState = 4;
            } else if (state == "run") {
                value.InstallState = 3;
            }
        }
    })
}

// 关闭程序
const exitPlugin = (pluginName: string) => {
    ipcRenderer.send('plugin-exit', pluginName)

    softwareList.value.forEach((value: any) => {
        if (value.install_dir == pluginName) {
            //标记启动
            value.InstallState = 3;
        }
    })
}

//暂停|开始下载
const setTorrentState = (pluginName: string,pluginType: string, isStop: boolean) => {
    console.log("setTorrentState");
    if(pluginType != 'Products'){
        // 发送事件给主进程
        ipcRenderer.send('resources-torrent-change-state', pluginName,pluginType,isStop);
    }else{
        ipcRenderer.send('plugin-torrent-change-state', pluginName,pluginType, isStop)
    }
}

// 分享插件
const sharePlugin = async (pluginName: string, data: any) => {
    let token = localStorage.getItem('token');

    //需要先登录
    if (!token || token == "") {
        ElMessage("请先登录！")
        return;
    }
    //检测用户是否完善个人信息
    let req = await axios.get((window as any).Constants.uploadUrl+'/users/get-user-audit-status',{
        headers: {
            "access-token": localStorage.getItem('token')
        }
    });
    if(req.data.code != 200){
        ElMessage(req.data.msg)
        return;
    }else{
        if(req.data.data != 3){
            ElMessage.error("请先完善个人信息！")
            return;
        }
    }

    openShareAiProject(pluginName, data);

    return;

    // shareRepackCheckBox.value = false; //是否重新打包zip

    let shareRepackCheckBox = ref<boolean | string | number>(false)

    ElMessageBox({
        title: '提示',
        message: () => h('p', null, [
            h('span', null, '分享项目需要开启IPV6，分享后保持软件在运行中！'),
            h('br'),
            h('span', null, '不重新打包项目：'),
            h(ElSwitch, {
                modelValue: shareRepackCheckBox.value,
                'onUpdate:modelValue': (val: boolean | string | number) => {
                    shareRepackCheckBox.value = val
                    // console.log(val);
                },
            }),
        ]),
        showCancelButton: true,
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        center: true,
    }).then((action) => {
        if (action === 'confirm') {
            ipcRenderer.send('zip-plugin-code', pluginName, { noRepack: shareRepackCheckBox.value })

            matomo.trackEvent("AI项目", "开始分享", pluginName);
        }
    }).catch(() => { });


}

const onPluginInstallLog = function (event: any, logStr: string) {
    // console.log(logStr);
    const loading = ElLoading.service({})
    loading.setText(logStr);
}

const getItemIcon = function (pluginName: string) {
    // 获取插件名的英文首字母并转换为大写
    const iconText = pluginName.charAt(0).toUpperCase();
    return iconText;
}

//精度条更新
const onPluginTorrentProgress = function (event: any, progressInfoList: any) {
    if (softwareList.value.length <= 0) {
        return;
    }

    softwareList.value.forEach((value: any) => {
        let progressInfo = progressInfoList[value.install_dir];
        if (progressInfo) {
            if (progressInfo.progressType == 3) {
                value.ProgressInfo = null;
            } else {
                value.ProgressInfo = { ...progressInfo }
            }
        }

        //    console.log(progressInfo);
    })
}

onMounted(() => {
    // 监听插件安装成功
    ipcRenderer.on('on-plugin-install-log', onPluginInstallLog);

    // 监听按钮改变
    ipcRenderer.on('on-plugin-change-btn-state', onChangePluginBtnState);

    // 监听下载进度消息
    ipcRenderer.on('on-plugin-torrent-progress-message', onPluginTorrentProgress);

    // 监听ai项目下载完成
    ipcRenderer.on('on-plugin-download', onProjectDownload);

    // 监听模型，插件，工作流等……下载完成
    ipcRenderer.on('on-resources-download', onResDownload);

    // 监听插件安装成功
    ipcRenderer.on('on-plugin-install', onPluginInstall);

});

// 在组件销毁前移除事件监听器
onBeforeUnmount(() => {
    ipcRenderer.removeListener('on-plugin-install-log', onPluginInstallLog);
    ipcRenderer.removeListener('on-plugin-install', onPluginInstall);
    ipcRenderer.removeListener('on-plugin-change-btn-state', onChangePluginBtnState);
    ipcRenderer.removeListener('on-plugin-torrent-progress-message', onPluginTorrentProgress);
    ipcRenderer.removeListener('on-plugin-download', onProjectDownload);
    ipcRenderer.removeListener('on-resource-download', onResDownload);
});

</script>