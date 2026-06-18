<template>
    <el-dialog v-model="dialogVisible" :title="datas.plugin_name" width="800px" align-center center
        @closed="onDialogClose" @open="onDialogOpen" :fullscreen="fullscreens" :show-close="false">
        <template #header>
            <div class="flex">
                <div class="flex-1 flex items-center justify-center" style="padding-left: calc(var(--ep-dialog-padding-primary) + var(--ep-message-close-size, 16px));">
                    <div>{{ datas.plugin_name }}</div>
                </div>
                <div>
                    <el-button type="text" @click="fullscreens = !fullscreens" :icon="FullScreen" class="mr-2"></el-button>
                    <el-button type="text" @click="dialogVisible = false" :icon="Close"></el-button>
                </div>
            </div>
        </template>
        <el-scrollbar id="myproject">
            <h3 class="text-center mt-0 mb-0" v-if="sharehidden" style="background-color: var(--ep-bg-color);">
                {{ datas.plugin_name }}
            </h3>
            <div :class="fullscreens? 'main h-85vh':'main h-500px'" style="background-color: var(--ep-bg-color);">
                <!-- 顶部核心 -->
                <div class="top">
                    <!-- 左侧视频 -->
                    <div class="top-left-video">
                        <el-image class="w-[100%] h-[100%]" :src="datas.image_path" :zoom-rate="1.2" :max-scale="7"
                            :min-scale="0.2" :initial-index="4" fit="fill">
                            <template #error>
                                <img :src="imgurl" class="w-full h-full" alt="">
                            </template>  
                        </el-image>
                    </div>
                    <!-- 右侧文本 -->
                    <div class="top-right-text">
                        <el-descriptions direction="horizontal" :column="1" size="12px" border class="p-4 pt-0">
                            <el-descriptions-item :label="$t('app.product_details_author')">
                                <!--<el-link @click="goGuestPage(datas.user_id)" :underline="false" class="custom-link">
                                    {{ datas.user_name }}
                                </el-link>-->
                                <el-button class="text-left mr-2" size="small" @click="goGuestPage(datas.user_id)">
                                {{ datas.user_name }}
                                </el-button>
                                <!--<el-divider direction="vertical" />-->
                                <el-button class="text-left" size="small" @click="sendMessage(datas.user_id)">{{ t('productdetailsdialog.send_message') }}</el-button>
                            </el-descriptions-item>
                            <el-descriptions-item :label="$t('app.product_details_platform')">
                                <el-tag size="small">{{ datas.platforms }}</el-tag>
                            </el-descriptions-item>
                            <!-- ai项目部分 -->
                            <el-descriptions-item :label="$t('app.product_details_device_support')" v-if="!datas.res_type">
                                <div class="grid gap-2 grid-flow-col">
                                    <el-tag size="small" type="success" v-for="item in datas.need_device">{{
                                        item == "1"
                                            ?
                                            isMac()?'x86':'CPU' : item == "2" ? isMac()?'arm':'NVIDIA' : item == "3" ? 'AMD' : '' }}</el-tag>

                                    <!-- <el-tag size="small" type="success">AMD</el-tag> -->
                                    <!-- <el-tag size="small" type="danger">
                                        <del>
                                            NVIDIA
                                        </del>
                                    </el-tag> -->
                                </div>
                            </el-descriptions-item>
                            <el-descriptions-item :label="$t('app.product_details_system_requirements')" v-if="!datas.res_type&&!isMac()">
                                <div>
                                    <!-- <el-tag size="small" type="success">CPU: 8核</el-tag>
                                    <el-tag size="small" type="success">内存: 32GB</el-tag> -->
                                    <el-tag size="small" type="success"
                                        v-if='getdatas.public_option != null && getdatas.public_option.needGupRaw != ""'>{{
                                            $t('app.product_details_vram') }}:
                                        {{ getdatas.public_option.needGupRaw }}</el-tag>
                                    <div v-else>
                                        {{ $t('app.product_details_author_nonesystem') }}
                                    </div>
                                </div>
                            </el-descriptions-item>
                            <!-- 模型、插件、工作流部分 -->
                            <el-descriptions-item :label="$t('app.product_details_type'+datas.res_type)" v-if="datas.res_type">
                                <div>
                                    {{ datas.public_option.filterData.tag[0] }}
                                </div>
                            </el-descriptions-item>
                            <el-descriptions-item :label="$t('app.product_details_linking')" v-if="datas.res_type&&datas.public_option.filterData[datas.public_option.filterData.tag]">
                                <div>
                                    <el-tag size="small" type="success">{{ datas.public_option.filterData[datas.public_option.filterData.tag][0] }}</el-tag>
                                </div>
                            </el-descriptions-item>
                            <!--
                            <el-descriptions-item label="安装目录" v-if="datas.res_type">
                                <div>
                                    {{ datas.res_install }}
                                </div>
                            </el-descriptions-item>
                            -->
                            <el-descriptions-item :label="$t('app.product_details_file_size')">
                                {{ zipsize() }}
                            </el-descriptions-item>
                            <el-descriptions-item :label="$t('app.product_details_version')">
                                {{ datas.version }}
                            </el-descriptions-item>
                            <el-descriptions-item :label="$t('app.product_details_amount')"
                                v-if="datas.price_type == 2 || datas.price_value > 0">
                                <div class="color-yellow">
                                    ￥{{ datas.price_value }}
                                </div>
                            </el-descriptions-item>
                            <el-descriptions-item :label="$t('app.product_details_run_operation')" v-if="islocal && !datas.project_type">
                                <div v-if="localDatas.ProgressInfo" class="download_progress">
                                    <div v-if="localDatas.ProgressInfo.progressType == 1" class="progress_btn">
                                        <el-icon @click="setTorrentState(localDatas.install_dir, true)"
                                            class="progress_btn_item"
                                            v-if="!localDatas.ProgressInfo.downloadStop && !localDatas.ProgressInfo.isHighSpeed"
                                            :size="32">
                                            <VideoPause />
                                        </el-icon>
                                        <el-icon @click="setTorrentState(localDatas.install_dir, false)"
                                            class="progress_btn_item" v-if="localDatas.ProgressInfo.downloadStop"
                                            :size="32">
                                            <VideoPlay />
                                        </el-icon>
                                    </div>
                                    <el-progress type="dashboard" :percentage="localDatas.ProgressInfo.progress"
                                        :width="80">
                                        <template #default="{ percentage }">
                                            <span class="percentage-value">{{ percentage }}%</span>
                                            <span v-if="localDatas.ProgressInfo.progressType == 1"
                                                class="percentage-label">{{
                                                    prettyBytes(localDatas.ProgressInfo.downloadSpeed) }}/s</span>
                                            <span
                                                v-if="localDatas.ProgressInfo.progressType == 2 || localDatas.ProgressInfo.progressType == 5"
                                                class="percentage-label">unzip</span>
                                            <span v-if="localDatas.ProgressInfo.progressType == 4"
                                                class="percentage-label">prepare</span>
                                        </template>
                                    </el-progress>
                                </div>
                                <div v-if="!localDatas.ProgressInfo">
                                    <div v-if="localDatas.InstallState == 3">
                                        <el-button type="success" size="small"
                                            @click="runPlugin(localDatas.install_dir)">{{ $t('app.home_run')
                                            }}</el-button>
                                        <!-- <el-button type="warning" size="small"
                                            v-if="localDatas.version != datas.version">更新</el-button> -->
                                        <!-- <el-button type="danger" size="small">卸载</el-button> -->
                                    </div>
                                    <div v-if="localDatas.InstallState == 4">
                                        <el-button type="danger" size="small"
                                            @click="exitPlugin(localDatas.install_dir)">{{ $t('app.home_exit')
                                            }}</el-button>
                                    </div>
                                    <div class="flex" style="flex-direction: column;"
                                        v-if="localDatas.InstallState == 0">
                                        <div class="w-full">
                                            <el-button v-if="localDatas.InstallState == 0" size="small"
                                                @click="downloadPlugin(localDatas.install_dir)" type="primary"
                                                class="pr-35px pl-35px">{{
                                                    $t('app.home_download') }}</el-button>
                                        </div>
                                        <div class="w-full mt-2">
                                            <!-- 123网盘高速下载优先 -->
                                            <el-button
                                                v-if="localDatas.InstallState == 0 && localDatas.pan_high_speed && localDatas.file_id"
                                                size="small"
                                                @click="downloadPluginPan(localDatas.file_id, localDatas.install_dir)"
                                                type="warning" class="pr-35px pl-35px">{{
                                                    $t('app.home_high_speed_download') }}</el-button>
                                            <!-- 如果没有123网盘高速下载，则显示阿里云oss高速下载 -->
                                            <el-button
                                                v-if="localDatas.InstallState == 0 && !localDatas.pan_high_speed && localDatas.high_speed && localDatas.file_id"
                                                size="small"
                                                @click="downloadPluginOss(localDatas.file_id, localDatas.install_dir)"
                                                type="warning" class="pr-35px pl-35px">{{
                                                    $t('app.home_high_speed_download') }}</el-button>
                                        </div>
                                    </div>
                                    <div v-if="localDatas.InstallState == 1 || localDatas.InstallState == 2">
                                        <el-button type="primary" size="small"
                                            @click="installPlugin(localDatas.install_dir)">{{ $t('app.home_install')
                                            }}</el-button>
                                    </div>
                                </div>
                            </el-descriptions-item>
                        </el-descriptions>

                    </div>
                </div>
                <!-- 项目数据 -->
                <div class="middle mt-5">
                    <div class="flex gap-2">
                        <div>
                            <el-icon @click="handleLike">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" v-if="getdatas.is_like">
                                    <path fill="currentColor" d="M512 128a64 64 0 0 0-64 64v516.48l-173.12-137.6a94.27 94.27 0 0 0-112.9-3.46 44.42 44.42 0 0 0-8.96 62.21l180.61 241.77A64 64 0 0 0 384 896h512V575.23a64 64 0 0 0-45.63-61.31l-205.95-61.76A96 96 0 0 1 576 360.19V192a64 64 0 0 0-64-64z"/>
                                </svg>
                                <Pointer v-else/>
                            </el-icon>
                            {{ Formatter(datas.like_count) }}
                        </div>
                        <div>
                            <el-icon @click="handleFavorites">
                                <StarFilled v-if="getdatas.is_favorite"/>
                                <Star v-else/>
                            </el-icon>
                            {{ Formatter(getdatas.favorite_count) }}
                        </div>
                        <div>
                            <el-icon>
                                <Download />
                            </el-icon>
                            {{ Formatter(datas.download) }}
                        </div>
                    </div>
                </div>
                <!-- 发布日期or更新日期 -->
                <div class="middle mt-2">
                    <el-tag type="info" class="mr-2">{{ $t('app.product_details_release_date') }}:{{ new
                        Date(datas.create_time).toLocaleDateString().replaceAll("/", "-") }}</el-tag>
                    <el-tag type="primary" class="mr-2">{{ $t('app.product_details_update_date') }}:{{ new
                        Date(datas.update_time).toLocaleDateString().replaceAll("/", "-") }}</el-tag>
                    <el-tag type="info" v-if="hiddenNew">{{ $t('app.product_details_update_date') }}:{{ datas.version
                        }}</el-tag>
                </div>
                <!-- 内容 -->

                <div class="content">
                    <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleClick">
                        <el-tab-pane :label="$t('app.product_details_project_description')" name="first">
                            <div style="user-select: text;background-color: var(--ep-bg-color);height: auto;">
                                <div v-html="datas.description" style="white-space:pre-wrap;" @contextmenu="handleContextMenu" @click="handleClick"></div>
                                <!-- 项目介绍 -->
                            </div>
                        </el-tab-pane>
                        <el-tab-pane :label="$t('app.product_details_project_overview')" name="second">
                            <div class="grid grid-cols-1 gap-4">
                                <div style="user-select: text;background-color: var(--ep-bg-color);height: auto;">
                                    <el-form v-if="datas.plugn_desc||getdatas.public_option.projectUrl" @click="handleClick">
                                        <div v-html="getdatas.public_option.projectUrl" v-if="(getdatas.public_option != null && getdatas.public_option.projectUrl != '')"
                                            style="white-space:pre-wrap;" class="mb-5" @contextmenu="handleContextMenu"></div>
                                        <div v-html="datas.plugn_desc" style="white-space:pre-wrap;" @contextmenu="handleContextMenu"></div>
                                    </el-form>
                                    <!-- 项目简介 -->
                                    <el-result class="result-center" icon="warning"
                                    :title="$t('app.product_details_related_links_4')"
                                    v-else></el-result>
                                </div>
                            </div>
                        </el-tab-pane>
                        <el-tab-pane :label="$t('app.product_details_related_links')" name="third">
                            <div class="grid grid-cols-1 gap-4 w-full flex justify-center" v-if="!isLogin">
                                <el-result class="result-center" icon="warning"
                                    :title="$t('app.product_details_related_links_1')"></el-result>
                            </div>
                            <div class="grid grid-cols-1 gap-4 w-full flex justify-center"
                                v-else-if="datas.price_type == 3 && userStoreIns.userInfo.vip_type == 0 && userStoreIns.userInfo.id_role == 2 && !isBuy">
                                <el-result class="result-center" icon="warning"
                                    :title="$t('app.product_details_related_links_2')"
                                    v-if="datas.price_value == 0"></el-result>
                                <el-result class="result-center" icon="warning"
                                    :title="$t('app.product_details_related_links_3')" v-else></el-result>
                            </div>
                            <div class="grid grid-cols-1 gap-4 w-full flex justify-center"
                                v-else-if="datas.price_type == 2 && !isBuy && userStoreIns.userInfo.id_role == 2">
                                <el-result class="result-center" icon="warning"
                                    :title="$t('app.product_details_related_links_3')"></el-result>
                            </div>
                            <div class="grid grid-cols-1 gap-4" v-else>
                                <div style="user-select: text;"
                                    v-if="(getdatas.cloud_storage_link != null && getdatas.cloud_storage_link != '')">
                                    <div v-html="getdatas.cloud_storage_link" style="white-space:pre-wrap;" @contextmenu="handleContextMenu" @click="handleClick"></div>
                                    <!-- <el-tag size="small" type="success">Github</el-tag> -->
                                    <!-- {{ getdatas.public_option.projectUrl }} -->
                                </div>
                                <el-result class="result-center" icon="warning"
                                    :title="$t('app.product_details_related_links_4')"
                                    v-else></el-result>
                                <!-- <div>
                                    <el-tag size="small" type="success">Gitee</el-tag>
                                    <a target="_blank" href="https://gitee.com/">https://gitee.com/</a>
                                </div> -->
                            </div>
                        </el-tab-pane>
                        <el-tab-pane :label="$t('app.product_details_comments')+'('+datas.comment_count+')'" name="four">

                            <div class="grid grid-cols-1 gap-4 w-full flex justify-center" v-if="!isLogin&&datas.price_type!=1">
                                <el-result class="result-center" icon="warning" :title="t('productdetailsdialog.login_required_comments')"></el-result>
                            </div>
                            <div class="grid grid-cols-1 gap-4 w-full flex justify-center"
                                v-else-if="datas.price_type == 3 && userStoreIns.userInfo.vip_type == 0 && userStoreIns.userInfo.id_role == 2 && !isBuy">
                                <el-result class="result-center" icon="warning" :title="t('productdetailsdialog.subscribe_required_comments')"
                                    v-if="datas.price_value == 0"></el-result>
                                <el-result class="result-center" icon="warning" :title="t('productdetailsdialog.purchase_required_comments')" v-else></el-result>
                            </div>
                            <div class="grid grid-cols-1 gap-4 w-full flex justify-center"
                                v-else-if="datas.price_type == 2 && !isBuy && userStoreIns.userInfo.id_role == 2">
                                <el-result class="result-center" icon="warning" :title="t('productdetailsdialog.purchase_required_comments')"></el-result>
                            </div>
                            <div class="grid grid-cols-1 gap-4" v-else>
                                <div style="user-select: text;">
                                    <!-- <el-result class="result-center" icon="warning" title="暂时没有评论"></el-result> -->
                                    <CommentComp 
                                        :project_id="datas.id" 
                                        :project_type="datas.res_type?datas.res_type:0"
                                        :project_user_id="datas.user_id"
                                        :likedates="datas.commentlikedates"
                                        @closeDialog="closeDialog"
                                    />
                                </div>
                            </div>
                        </el-tab-pane>
                        <el-tab-pane :label="$t('app.service_description')" name="end">
                            <div class="services">
                                <div class="services-main">
                                    <div class="services-mainTop">{{ $t('app.service_description_1') }}</div>
                                    <div class="services-mainItem">{{ $t('app.service_description_2') }}</div>
                                    <div class="services-mainItem">{{ $t('app.service_description_3') }}</div>
                                    <div class="services-mainItem">{{ $t('app.service_description_4') }}</div>
                                    <div class="services-mainBottom">{{ $t('app.service_description_5') }}</div>
                                </div>
                            </div>
                        </el-tab-pane>
                    </el-tabs>
                    <el-menu
                    :popup="true"
                    v-show="menuVisible"
                    :style="{ top: menuTop + 'px', left: menuLeft + 'px' ,width: '200px' }"
                    >
                        <el-card>
                            <el-button
                                v-for="(item,index) in itemMenu"
                                type="plain"
                                text
                                @click="handleMenuClick(index)"
                                class="w-full"
                            >
                                <div class="flex justify-between w-160px ml-3">
                                    <div>{{ $t(item.lanKey)?$t(item.lanKey) : item.label }}</div>
                                    <div>{{ item.align }}</div>
                                </div>
                            </el-button>
                        </el-card>
                    </el-menu>
                </div>
                <!-- 底部操作 -->
                <div class="bottom" v-if="!sharehidden">
                    <el-button v-if="isBuy" @click="downloadScript(datas)">
                        <el-icon class="mr-2">
                            <Download />
                        </el-icon>
                        {{ $t('app.product_details_add') }}
                    </el-button>

                    <el-button type="danger" v-if="!isBuy" @click="buyProduct(datas)">
                        {{ $t('app.product_details_buy') }}
                    </el-button>
                    <el-button @click="onShareScreen">
                        <el-icon class="mr-2">
                            <Share />
                        </el-icon>
                        {{ $t('app.product_details_share') }}
                    </el-button>
                    <el-button @click="closeDialog"><el-icon class="mr-2">
                            <CloseBold />
                        </el-icon>{{ $t('app.product_details_close') }}</el-button>
                </div>
                <div class="bottom pr-5" style="transform: translate(-10px,25%)" v-if="sharehidden">
                    <div>{{ $t('app.product_details_poster_title')+shareUrl }}</div>
                </div>
            </div>
        </el-scrollbar>
    </el-dialog>
    <LoginLayout ref="loginDialg" />
</template>

<script setup>
import { ref, inject, watch } from 'vue'
import axios from 'axios'
import { ElMessage, ElLoading } from "element-plus";
const { ipcRenderer } = require('electron');
const { openQRCodePayment, openShareDialog,globalHide,openPurchaseMembership } = inject('main');
const prettyBytes = require('prettier-bytes');
import matomo from "../../matomo"
import { useRouter } from 'vue-router';
import { userStore } from '../../stores/UserStore'
import CommentComp from '/src/components/commons/CommentComp.vue'
// import { paymentStore } from '../../stores/PaymentStore'
import { eventBusStore } from '../../stores/EventBusStore'
import { EventBusDefines } from '../../events'
import { useI18n } from "vue-i18n";
const { t } = useI18n()
import {
    Promotion,
    User,
    Close,
    FullScreen,
} from '@element-plus/icons-vue'

import domtoimage from 'dom-to-image';
//开关全屏
const fullscreens = ref(false)
const shareUrl = ref('')
//右键菜单
const thisEvent = ref(null)
const menuLeft = ref(0)
const menuTop = ref(0)
const menuVisible = ref(false)

//判断系统
const isMac = () => {
  return process.platform == 'darwin';
};
const itemMenu = [
    { label: t('productdetailsdialog.copy_text'), lanKey: 'contextmenu.copy',align:isMac()?'Command+C':'Ctrl+C' },
]
//跳转到访客界面
const goGuestPage = (uid) => {
    //判断是否登录
    if (!userStoreIns.isLogin()) {
        ElMessage.error(t('addproject.project_onlogin_goguest'));
        return;
    }
    closeDialog()
    userStoreIns.homeActiveTab = ""
    // 跳转到个人中心消息页面
    router.push({ path: "/guest", query: { id:uid } })
}
function handleClick(event) {
    //点击后恢复正常
    menuVisible.value = false;
    thisEvent.value = null;
}
function handleContextMenu(event) {
    // event.preventDefault(); // 阻止默认的右键菜单
    console.log(event.target.scrollHeight)
    thisEvent.value = event;
    menuVisible.value = true;
    // const rect = event.target.getBoundingClientRect();
    requestAnimationFrame(() => {
        menuTop.value = event.offsetY - (event.target.scrollHeight);
        menuLeft.value = event.offsetX;
        // menuTop.value = event.clientY - rect.top - (event.target.scrollHeight);
        // menuLeft.value = event.clientX - rect.left;
    });
}
//收藏
// 防抖状态
const favoritesLoading = ref(false)
async function handleFavorites(){
    // 防抖：如果正在请求中，直接返回
    if (favoritesLoading.value) {
        return
    }
    
    //判断登录
    if(!userStoreIns.isLogin()){
        ElMessage.error(t('productdetailsdialog.login_required_first'));
        return;
    }
    
    // 设置加载状态
    favoritesLoading.value = true
    
    //判断是否收藏
    console.log(getdatas.value)
    let url = window.Constants.uploadUrl + "/users/collect-project";
    try{
        const response = await axios.post(url, {
            project_id: datas.value.id,
            project_name: datas.value.plugin_name,
            type: datas.value.res_type?datas.value.res_type:0
        },{
            headers: {
                "access-token": localStorage.getItem('token')
            }
        });
        if(response.data.code == 200){
            ElMessage.success(response.data.msg);
            datas.value.favorite_count = datas.value.favorite_count + 1;
            getdatas.value.is_favorite = true;
        }else if(response.data.code == 100){
            ElMessage.error(response.data.msg);
            datas.value.favorite_count = datas.value.favorite_count - 1;
            getdatas.value.is_favorite = false;
        }else if(response.data.code == -1){
            ElMessage.error(response.data.msg);
        }
    }catch(error){
        console.error('收藏失败:', error);
        ElMessage.error(t('productdetailsdialog.favorite_failed'));
    } finally {
        // 请求完成后重置加载状态
        favoritesLoading.value = false
    }
}
//点赞
// 防抖状态
const likeLoading = ref(false)
async function handleLike(){
    // 防抖：如果正在请求中，直接返回
    if (likeLoading.value) {
        return
    }
    
    //判断登录
    if(!userStoreIns.isLogin()){
        ElMessage.error(t('productdetailsdialog.login_required_first'));
        return;
    }
    
    // 设置加载状态
    likeLoading.value = true
    
    //是否点赞
    console.log(getdatas.value)
    let url = window.Constants.uploadUrl + "/users/like-project";
    try{
        const response = await axios.post(url, {
            project_id: datas.value.id,
            type: datas.value.res_type?datas.value.res_type:0
        },{
            headers: {
                "access-token": localStorage.getItem('token')
            }
        });
        if(response.data.code == 200){
            ElMessage.success(response.data.msg);
            getdatas.value.like_count = getdatas.value.like_count + 1;
            getdatas.value.is_like = true;
        }else if(response.data.code == 100){
            ElMessage.error(response.data.msg);
            getdatas.value.like_count = getdatas.value.like_count - 1;
            getdatas.value.is_like = false;
        }else if(response.data.code == -1){
            ElMessage.error(response.data.msg);
        }
    }catch(error){
        console.error('点赞失败:', error);
        ElMessage.error(t('productdetailsdialog.like_failed'));
    } finally {
        // 请求完成后重置加载状态
        likeLoading.value = false
    }
}
function handleMenuClick(index) {
    console.log(index)
    switch (index) {
        case 0:
            console.log(t('productdetailsdialog.copy_text'));
    //复制选中的文本
            // navigator.clipboard.writeText(thisEvent.value.target.innerText);
            document.execCommand('copy');
            ElMessage.success(t('contextmenu.copy_success'))
            break;
        default:
            break;
    }
    menuVisible.value = false;
}
const userStoreIns = userStore() // 引入store实例 用户数据
// const payStoreIns = paymentStore() // 引入store实例 支付数据
const eventBusStoreIns = eventBusStore() //全局事件监听

const router = useRouter()

//隐藏未完成状态
const hiddenNew = ref(false)

const sharehidden = ref(false)

//分享截屏
const onShareScreen = () => {
    let node = document.getElementById('myproject');
    // options 可不传
    let options = { bgcolor: '#ffffff' }
    let getDL = localStorage.getItem('vueuse-color-scheme')
    if (getDL == 'dark') {
        options = { bgcolor: '#141414' }
    } else if (getDL == 'light') {
        options = { bgcolor: '#ffffff' }
    }
    sharehidden.value = true
    domtoimage.toJpeg(node, options)
        .then(function (dataUrl) {
            // var img = new Image();
            // img.src = dataUrl;
            // document.body.appendChild(img);
            openShareDialog(dataUrl, datas.value.plugin_name,datas.value.id,resType.value)
            sharehidden.value = false
        })
        .catch(function (error) {
            console.error('oops, something went wrong!', error);
            sharehidden.value = false
        });
}


//下载数量超过1000，就显示k,超过一万，就显示w，超过一亿，就显示m
const Formatter = (num) => {
    if (Math.abs(num) > 99999999) {
        return Math.sign(num) * parseFloat((Math.abs(num) / 100000000).toFixed(1)) + 'm'
    } else if (Math.abs(num) > 9999) {
        return Math.sign(num) * parseFloat((Math.abs(num) / 10000).toFixed(1)) + 'w'
    } else if (Math.abs(num) > 999) {
        return Math.sign(num) * parseFloat((Math.abs(num) / 1000).toFixed(1)) + 'k'
    } else {
        return num
    }
}

//本地数据
const localDatas = ref([])

//判断本地数据
const islocal = ref(false)

// 组件开关
const dialogVisible = ref(false)

//是否登录
const isLogin = ref(false)

//是否购买
const isBuy = ref(false)

// 数据
const datas = ref([])

// 评论数据
const commentText = ref("")

//请求数据
const getdatas = ref({
    "id": 0,
    "plugin_name": "",
    "user_name": "",
    "install_dir": "",
    "platforms": "",
    "description": "",
    "version": "",
    "author": "",
    "like_count": 0,
    "download": 0,
    "project_zip_size": 0,
    "price_type": -1,
    "price_value": -1,
    "need_device": "",
    "image_path": "",
    "public_option": {
        "gupRadio": [],
        "projectUrl": "",
        "needGupRaw": ""
    },
    "create_time": ""
})

//筛选默认
const activeName = ref('first')


// 默认图片
// const imgurl = new URL("~/assets/ai_noimg.png", import.meta.url).href;

// 压缩包大小计算
const zipsize = () => {
    try {
        return (datas.value.project_zip_size / 1024 / 1024).toFixed(2) + "GB"
    } catch (e) {
        return t('app.archive_size_calculation_unknown_size')
    }

}

//下载
const downloadScript = async (item) => {
    console.log(item)
    let fileId = item.id;
    let intallDir = item.install_dir;
    //判断是否登录
    if (!userStoreIns.isLogin()) {
        //免费的可以不登录下载
        if (item.price_type != 1) {
            ElMessage.error(t('app.product_details_no_login_no_add'));
            return;
        }
    }

    matomo.trackEvent("添加脚本", "添加开始", fileId + "|" + intallDir);
    // 发送获取插件信息的请求，并处理回复
    try{
        let filePath;
        let homefiltab = 'class';
        if(resType.value!=0){
            let resTypeName = '';
            switch (resType.value) {
                case 1:
                    resTypeName = 'Models';
                    homefiltab = 'model';
                    break;
                case 2:
                    resTypeName = 'Plugins';
                    homefiltab = 'plugin';
                    break;
                case 3:
                    resTypeName = 'Workflows';
                    homefiltab = 'workflow';
                    break;
            }
            filePath = await ipcRenderer.invoke('download-script-res', fileId, { fileName: intallDir ,resType:resTypeName });
        }else{
            filePath = await ipcRenderer.invoke('download-script', fileId, { fileName: intallDir });
        }
        if (filePath) {
            matomo.trackEvent("添加脚本", "添加成功", fileId + "|" + intallDir);
        }
        closeDialog()
        userStoreIns.homeActiveTab = "home"
        userStoreIns.homeFilterTab = homefiltab
        router.push({ path: '/', query: { type: 'shopback' } })
    }catch(error){
        console.error('Error fetching plugin information:', error);
        return;
    }
}

let loginDialg = ref(null);
// 购买按钮点击
const buyProduct = async (item) => {

    if (!userStoreIns.isLogin()) {
        ElMessage.error(t('app.product_details_not_login_no_buy'));
        (loginDialg.value).openDialog(true)
        dialogVisible.value = false
        return;
    }

    let fileId = item.id;

    if (item.price_type == 3 && item.price_value == 0) {
        //vip专享的提示购买vip
        ElMessage.error(t('app.product_details_vip'));
        openPurchaseMembership()
        return;
    } else {
        let resType = item.res_type?(Number(item.res_type)+2):2;
        //其它弹出支付界面
        openQRCodePayment(resType, fileId);
    }
}

// 判断是否可以下载 productData:后端返回的列表信息
const checkCanDownload = async (productType, productData) => {

    let productId = productData.id;


    //免费的,不用登录要在前面判断
    if (productData.price_type == 1) {
        return true;
    }

    // 未登录显示购买
    if (!userStoreIns.isLogin()) {
        return false;
    }

    //判断是否是自己发布的
    if (productData.user_id == userStoreIns.userInfo.id) {
        return true;
    }

    // 判断用户角色，管理员不用购买
    let userInfo = userStoreIns.userInfo;
    if (userInfo.id_role == 1) {
        return true;
    }

    // 判断是否是vip专享的
    if (productData.price_type == 3 && productData.price_value == 0) {
        //这里这判断永久会员，普通会员会过期在服务端判断
        if (userInfo.vip_type == 2) {
            return true;
        }
    }

    // 其它情况统一走服务端逻辑判断
    let url = window.Constants.uploadUrl + "/order/check-is-buy";
    if(productType>1&&productType!=2){//模型插件工作流。3.模型，4.插件，5.工作流
        url = window.Constants.uploadUrl + "/order/check-res-is-buy";
    }
    try {
        const response = await axios.get(url, {
            params: { type: productType, id: productId, timestamp: Date.now() },
            headers: {
                "access-token": localStorage.getItem('token')
            }
        });
        let resData = response.data;
        if (resData.state == 1) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('查询订单失败:', error);
        // ElMessage.error("查询订单失败");

        return false;
    }
}

// 关闭
const onDialogClose = () => {
    sharehidden.value = false
    activeName.value = 'first'
    localDatas.value = []
    datas.value = []
    getdatas.value = {
        "id": 0,
        "plugin_name": "",
        "user_name": "",
        "install_dir": "",
        "platforms": "",
        "description": "",
        "version": "",
        "author": "",
        "like_count": 0,
        "download": 0,
        "project_zip_size": 0,
        "price_type": -1,
        "price_value": -1,
        "need_device": "",
        "image_path": "",
        "public_option": {
            "gupRadio": [],
            "projectUrl": "",
            "needGupRaw": ""
        },
        "create_time": ""
    }
    islocal.value = false
    isBuy.value = false
    menuLeft.value = 0
    menuTop.value = 0
    menuVisible.value = false
    thisEvent.value = null
    //移除界面所有监听
    eventBusStoreIns.$clearBySource(this);
}

//当界面打开事件
const onDialogOpen = () => {
    //监听事件支付成功事件
    eventBusStoreIns.$on(EventBusDefines.OnPaySuccess, (eventData) => {
        console.log("OnPaySuccess", eventData);
        if (eventData.product_type == 2 || eventData.product_type == 3 || eventData.product_type == 4 || eventData.product_type == 5) { //2:AI项目 3:AI模型 4:AI插件 5:AI工作流
            //是购买对应项目
            if (eventData.product_id == datas.value.id) {
                //支付成功显示处理
                isBuy.value = true;
            }
        }

    }, this);
}

//关闭对话框
const closeDialog = () => {
    dialogVisible.value = false
}

//暂停|开始下载
const setTorrentState = (pluginName, isStop) => {
    console.log("setTorrentState");
    ipcRenderer.send('plugin-torrent-change-state', pluginName, isStop)
}

// 启动程序
const runPlugin = (pluginName) => {
    console.log(pluginName)
    localDatas.value.InstallState = 4

    ipcRenderer.send('plugin-run', pluginName);

    matomo.trackEvent("AI项目", "启动项目", pluginName);
}

// 关闭程序
const exitPlugin = (pluginName) => {
    ipcRenderer.send('plugin-exit', pluginName)
    localDatas.value.InstallState = 3
}

// 下载插件
const downloadPlugin = (pluginName) => {
    // ElMessage('下载未实现！')
    // window.open(downloadLink, '_blank');

    // console.log(pluginName);

    // 发送事件给主进程
    ipcRenderer.send('plugin-project-download', pluginName);

    matomo.trackEvent("AI项目", "下载项目开始", pluginName);
}
// 下载插件Oss
const downloadPluginOss = async (fileId, pluginName) => {

    //判断是否登录
    if (!userStoreIns.isLogin()) {
        ElMessage.error(t('app.product_details_no_login_no_download'));
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
const downloadPluginPan = async (fileId, pluginName) => {
    //判断是否登录
    if (!userStoreIns.isLogin()) {
        ElMessage.error(t('app.product_details_no_login_no_download'));
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

// 安装插件方法
const installPlugin = (pluginName) => {
    // 发送事件给主进程
    ipcRenderer.send('plugin-install', pluginName);

    const loading = ElLoading.service({
        lock: true,
        text: t('app.product_details_in_download')+'...',
        background: 'rgba(0, 0, 0, 0.7)',
    })
};

//默认图片
const imgurl = new URL("~/assets/ai_noimg.png", import.meta.url).href;
//请求详情
const getProductDetails = async (id,typeid) => {
    let url = window.Constants.uploadUrl + "/users/market-app-info";
    if(typeid!=0){
        url = window.Constants.uploadUrl + "/users/market-res-info";
    }
    try {
        const response = await axios.get(url, {
            params: { fId: id },
            headers: {
                "access-token": localStorage.getItem('token')
            }
        });
        console.log("response", response.data)
        let resData = response.data;
        //改名
        resData.plugin_name = resData.res_name?resData.res_name:resData.plugin_name;
        resData.description = resData.short_desc?resData.short_desc:resData.description;
        resData.public_option = resData.ext_option?resData.ext_option:resData.public_option;
        resData.plugn_desc = resData.res_desc?resData.res_desc:resData.plugn_desc;
        resData.project_zip_size = resData.res_zip_size?resData.res_zip_size:resData.project_zip_size;
        const urlRegex = /https?:\/\/[^\s/$.?#].[^\s"')>]*[^\s"')>,.]/g;
        //检测url网址加a标签
        try {
            if (resData && resData.description) {
                resData.description = resData.description.replace(urlRegex, function (url) {
                    return '<a href="' + url + '" target="_blank">' + url + '</a>';
                });
            }

            if (resData && resData.public_option && resData.public_option.projectUrl) {
                resData.public_option.projectUrl = resData.public_option.projectUrl.replace(urlRegex, function (url) {
                    return '<a href="' + url + '" target="_blank">' + url + '</a>';
                });
            }

            if (resData && resData.plugn_desc) {
                resData.plugn_desc = resData.plugn_desc.replace(urlRegex, function (url) {
                    return '<a href="' + url + '" target="_blank">' + url + '</a>';
                });
            }

            if (resData && resData.cloud_storage_link) {
                resData.cloud_storage_link = resData.cloud_storage_link.replace(urlRegex, function (url) {
                    return '<a href="' + url + '" target="_blank">' + url + '</a>';
                });
            }
        } catch (error) {
            console.error('Error processing URLs:', error);
        }
        //本地处理
        //图片处理
        resData.image_path = resData.image_path ? (window).Constants.uploadUrl + "/assets/market-images/" + resData.image_path : imgurl;
        //配置处理
        resData.need_device = resData.need_device ? resData.need_device.split(",") : [];
        datas.value = resData
        getdatas.value = response.data
        return resData;
    } catch (error) {
        console.error('获取更多数据失败:', error);
        return []; // 出错时返回空数组
    }
}

function showLoading() {
    return ElLoading.service({
        lock: true,
        text: t('app.product_details_in_loading')+'ing...',
        background: 'rgba(0, 0, 0, 0.7)',
    });
}

//发送消息
const sendMessage = async (id) => {
    //判断是否登录
    if (!userStoreIns.isLogin()) {
        ElMessage.error(t('addproject.project_onlogin_gosendmsg'));
        return;
    }
    try{
        let res = await axios.post(window.Constants.uploadUrl+'/chat/create-chat', {
            targetUserId:id
            }, {
            headers: {
                'access-token': localStorage.getItem('token') || ''
            }
        })
        if(res.data.code === 0){
            ElMessage({ message: res.data.msg, type: 'info' })
            userStoreIns.homeActiveTab = ""
            userStoreIns.initiateChatUser = id
            // 跳转到个人中心消息页面
            router.push({ path: "/my", query: { val: 'message', id: '7-1' } })
            dialogVisible.value = false
        }else{
            ElMessage.error(res.data.msg)
        }
    }catch(e){
        ElMessage.error(t('productdetailsdialog.network_error_message'))
    }
}

//项目类型
const resType = ref(0)
async function openProductDetails(data, localData, filterdefault,userid) {
        dialogVisible.value = false
        const loading = showLoading()
        // datas.value = data
        resType.value = data.res_type?data.res_type:0
        let resData = await getProductDetails(data.id,resType.value)
        if(resData.length == 0){
            loading.close()
            ElMessage.error(t("app.failed_to_get_details"));
            return
        }
        shareUrl.value = ( window.Constants.shareUrl ? window.Constants.shareUrl : window.Constants.uploadUrl + '/users/share' ) + '?fid='+data.id+'&type='+resType.value
        resData.userid = userid
        //登录判断
        isLogin.value = userStoreIns.isLogin();

        if (localData) {
            islocal.value = true
            localDatas.value = localData
        }

        if (filterdefault) {
            activeName.value = filterdefault
        }

        isBuy.value = await checkCanDownload((resType.value+2), resData)
        loading.close()
        dialogVisible.value = true
        console.log(isBuy.value);

        console.log("用户信息", userStoreIns.userInfo)
        console.log("市场详情", data, localData)

    }
defineExpose({
    openProductDetails
})
</script>

<style scoped>
.ep-menu{
    border-right: none;
    z-index: 0;
}
::v-deep(.ep-card__body){
    padding: 5px;
}
.ep-button + .ep-button{
    margin-left: 0;
}
/* 服务说明 */
.services {
    user-select: text;
    background-color: var(--ep-bg-color);
    height: auto;
}

.services-main {
    white-space: pre-wrap;
    text-indent: 2em;
}

.services-mainTop {
    margin-top: 2;
    margin-bottom: 2;
    /* color: gray; */
    text-indent: 0;
}

.services-mainItem {
    /* color: gray; */
    line-height: 2em;
}

.services-mainBottom {
    line-height: 2em;
    margin-top: 4px;
    margin-bottom: 2;
    text-indent: 2em;
    /* color: gray; */
    text-align: left;
}

.download_progress {
    user-select: none;

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

.main {
    position: relative;
    padding: 10px;
    /* overflow-y: auto; */
}

.top {
    height: 300px;
    width: 100%;
    display: flex;
}

.top-left-video {
    width: 50%;
    max-width:400px;
    display: flex;
    justify-content: center;
    /* align-items: center; */
}

.top-right-text {
    width: 50%;
    flex:1;
}

.content {
    /* height: auto; */
    /* margin-bottom: 40px; */
    background-color: var(--ep-bg-color);
}

.bottom {
    position: sticky;
    bottom: 10px;
    left: 0;
    transform: translate(0, 25%);
    height: 40px;
    width: 100%;
    padding-bottom: 5px;
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    background-color: var(--ep-bg-color);
}

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

.custom-link {
  color: var(--el-text-color-regular);
  transition: color 0.3s;
}

.custom-link:hover {
  color: var(--u-color-primary);
}
</style>