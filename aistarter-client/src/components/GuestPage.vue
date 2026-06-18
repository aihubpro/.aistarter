<template>
    <el-scrollbar class="w-full" style="box-sizing: border-box;">
        <div class="main overflow-y-auto overflow-x-hidden">
            <!-- 用户头像等信息 -->
            <el-row :gutter="24">
                <el-col :span="24">
                    <el-card shadow="always">
                        <!-- 头像信息 -->
                        <el-row :gutter="24" justify="space-between" style="align-items: center;">
                            <!-- 头像信息 -->
                            <el-col :span="14">
                                <div class="flex align-center justify-start w-full">
                                    <div class="flex justify-start h-full m-2" style="align-items: center;">
                                        <div class="w-60px h-60px">
                                            <el-avatar :size="60" :src="userdata?.avatar_url?userdata.avatar_url:userInfo.avatar" fit="fill"></el-avatar>
                                        </div>
                                    </div>
                                    <div class="w-full">
                                        <div
                                            class="ep-bg-purple line-height-36px w-full ellipsis text-left font-size-14px flex align-center">
                                            <div class="ellipsis">
                                                {{ userdata?.alias?userdata?.alias+'#'+userdata?.username:userdata?.username || $t('guestpage.not_set') }}
                                            </div>
                                            <div class="ml-2">
                                                <el-tag size="small" type="warning" v-if="userdata?.vip_type==1&&userdata?.is_vip">
                                                    <el-image class="w-14px h-10px" :src="vipIconurl" fit="fill" />
                                                    {{ $t('guestpage.annual_member') }}
                                                </el-tag>
                                                <el-tag size="small" type="warning" v-else-if="userdata?.vip_type==2">
                                                    <el-image class="w-14px h-10px" :src="vipIconurl" fit="fill" />
                                                    {{ $t('guestpage.permanent_member') }}
                                                </el-tag>
                                                <el-tag size="small" type="warning" v-else>
                                                    {{ $t('guestpage.regular_member') }}
                                                </el-tag>
                                            </div>
                                            <div class="ml-2">
                                                <el-button class="text-left" size="small" @click="sendMessage">{{ $t('guestpage.send_message') }}</el-button>
                                            </div>
                                        </div>
                                        <div
                                            class="ep-bg-purple ellipsis line-height-10px text-left font-size-10px text-gray">
                                            {{ userdata?.email || $t('guestpage.none') }}
                                        </div>
                                        <div
                                            class="ep-bg-purple line-limit-length max-h-50px line-height-18px text-left font-size-10px text-gray"
                                            style="white-space: pre-wrap; word-wrap: break-word; overflow-wrap: break-word;">
                                            {{ (userdata?.bio || $t('guestpage.none')).replace(/\\r\\n|\\n|\\r/g, '\n') }}
                                        </div>
                                    </div>
                                </div>
                            </el-col>
                            <!-- 会员信息 -->
                            <el-col :span="6">
                                <div class="flex justify-end gap-1">
                                    <div>
                                        <!--
                                        <div class="text-yellow">{{ toolutils.Formatter(Number(userdata?.likes) || 0) }}</div>
                                        -->
                                        <div>{{ toolutils.Formatter(Number(userdata?.likes) || 0) }}</div>
                                        <div>{{ $t('personalcenter.likes') }}</div>
                                    </div>
                                    <el-divider direction="vertical" style="margin: auto 8px;" />
                                    <div>
                                        <div>{{ toolutils.Formatter(Number(userdata?.favorites) || 0) }}</div>
                                        <div>{{ $t('personalcenter.collection') }}</div>
                                    </div>
                                    <el-divider direction="vertical" style="margin: auto 8px;" />
                                    <div>
                                        <div>{{ toolutils.Formatter(Number(userdata?.downloads) || 0) }}</div>
                                        <div>{{ $t('personalcenter.download') }}</div>
                                    </div>
                                </div>
                            </el-col>
                            <el-col :span="4" @click="gotoMyPage">
                                <div class="flex justify-center items-center">
                                    <div class="text-gray text-12px">{{ $t('guestpage.back_to_personal_center') }}</div>
                                    <el-icon size="12px"><d-arrow-right /></el-icon>
                                </div>
                            </el-col>
                        </el-row>
                    </el-card>
                </el-col>
            </el-row>
            <el-card class="mt-3" shadow="always">
                <template #header>
                    <div class="flex justify-start">
                        <span class="flex align-center font-size-24px">
                            <el-icon><histogram /></el-icon>
                        </span>
                        <div class="flex justify-center ml-2" style="align-items: end;">
                            <span>{{ $t('guestpage.representative_works') }}</span>
                        </div>
                    </div>
                </template>
                <div class="grid grid-cols-3 gap-2">
                    <el-card class="h-full"  v-for="(item, index) in userGuestDate" :key="index" shadow="hover" @click="openProductDetails(item)">
                        <div class="relative w-full h-full">
                            <el-image class="w-full h-full" :src="item.image_path" :zoom-rate="1.2" :max-scale="7"
                            :min-scale="0.2" :initial-index="4" fit="contain">
                                <template #error>
                                    <img :src="imgurl" class="w-full h-full" alt="">
                                </template>
                            </el-image>
                            <div class="flex flex-col justify-between">
                                <div class="text-left ellipsis ml-2 mr-2 mt-1">{{ item.name }}</div>
                                <div class="flex justify-between items-center ml-2 mr-2 mb-1 mt-1">
                                    <div class="text-left line-limit-length flex items-center" style="line-clamp:1;">
                                        <el-icon class="w-4 h-4">
                                            <User />
                                        </el-icon>
                                        {{ item.user_name }}
                                    </div>
                                    <div class="flex flex-2 justify-end items-center">
                                        <div class="like_count mr-1">
                                            <el-icon>
                                                <Pointer />
                                            </el-icon>
                                            {{ toolutils.Formatter(item.like_count||0) }}
                                        </div>
                                        <div class="Collection mr-1">
                                            <el-icon>
                                                <Star />
                                            </el-icon>
                                            {{ toolutils.Formatter(item.favorite_count||0) }}
                                        </div>
                                        <div class="download">
                                            <Download style="width: 1em; height: 1em; margin-right: 1px" />
                                            {{ toolutils.Formatter(item.download||0) }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </el-card>
                </div>
            </el-card>
            <!-- 核心内容 -->
            <el-card class="mt-3" shadow="always">
                <template #header>
                    <div class="flex justify-start">
                        <span class="flex align-center font-size-24px">
                            <el-icon><grid /></el-icon>
                        </span>
                        <div class="flex justify-center ml-2" style="align-items: end;">
                            <span>{{ $t('guestpage.category_resources') }}</span>
                        </div>
                    </div>
                </template>
                <el-tabs
                    v-model="activeName"
                    @tab-click="handleClick"
                    :tab-position="'left'"
                    >
                    <el-tab-pane name="first">
                        <template #label>
                            <span class="flex items-center gap-3">
                                <el-icon><house /></el-icon>
                                <span>{{ $t('guestpage.homepage') }}</span>
                            </span>
                        </template>
                        <GuestProjectPage :items="uid"/>
                    </el-tab-pane>
                    <el-tab-pane name="second">
                        <template #label>
                            <span class="flex items-center gap-3">
                                <el-icon><pointer /></el-icon>
                                <span>{{ $t('guestpage.likes') }}</span>
                            </span>
                        </template>
                        <GuestLikesPage :items="uid" />
                    </el-tab-pane>
                    <el-tab-pane name="third">
                        <template #label>
                            <span class="flex items-center gap-3">
                                <el-icon><star /></el-icon>
                                <span>{{ $t('guestpage.favorites') }}</span>
                            </span>
                        </template>
                        <GuestFavoritePage :items="uid" />
                    </el-tab-pane>
                </el-tabs>
                
            </el-card>
        </div>
    </el-scrollbar>
</template>
<script lang="ts" setup>
import { ref, onMounted,onBeforeUnmount, inject, computed,nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import { userStore } from '../stores/UserStore'
const { vipIconurl,openProductDetails } = inject("main") as any;
import { useI18n } from "vue-i18n";
const { t } = useI18n();
import axios from 'axios'
import {
  Search
} from "@element-plus/icons-vue";
import { ElMessage } from 'element-plus'
const userStoreIns = userStore()
//导入工具
import toolutils from "../toolutils"


//回到个人中心
const gotoMyPage = () => {
    router.push({ path: "/my", query: { val: 'update', id: '1-5-1' } })
}

const activeName = ref('first')

const handleClick = (tab: TabsPaneContext, event: Event) => {
  console.log(tab, event)
}

interface userInfo {
    username: string,
    email: string,
    avatar_url: string,
    likes: number,
    downloads: string,
    favorites: number,
    vip_type: number,
    is_vip: boolean,
}

const userInfo = ref({
    avatar: new URL("~/assets/ai_noimg.png", import.meta.url).href,
});

//默认图片
const imgurl = new URL("~/assets/ai_noimg.png", import.meta.url).href;

const router = useRouter();
const route = useRoute();

const userdata =ref<userInfo>();

const getGuestUserInfo = () => {
    let url = (window as any).Constants.uploadUrl + '/users/get-guest-user-info'
    axios.post(url,{
        id: route.query.id
    },{
        headers: {
            "access-token": localStorage.getItem('token')
        }
    }).then(res => {
        try{
            if(res.data.code==200){
                userdata.value = res.data.data //用户信息
                userdata.value.avatar_url =res.data.data.avatar_url?(window as any).Constants.uploadUrl+'/assets/user-images/'+res.data.data.avatar_url+'?t='+new Date().getTime():userInfo.value.avatar
            }
        }catch(error){
            console.log(error)
        }
    })
}

const userGuestDate = ref()
//获取访客代表作
const getGuestProject = () => {
    let url = (window as any).Constants.uploadUrl + '/users/get-guest-market-representative'
    axios.get(url,{
        params: {
            id: route.query.id  
        },
        headers: {
            "access-token": localStorage.getItem('token')
        }
    }).then(res => {
        try{
            if(res.status==200){
                userGuestDate.value = res.data.representativeWorks //用户信息
                userGuestDate.value.forEach((item:any) => { 
                    item.image_path = item.image_path?(window as any).Constants.uploadUrl+'/assets/market-images/'+item.image_path+'?t='+new Date().getTime():imgurl
                });
            }
        }catch(error){
            console.log(error)
        }
    })
}


const uid = route.query.id;

const sendMessage = async () => {
    try{
        let res = await axios.post((window as any).Constants.uploadUrl+'/chat/create-chat', {
            targetUserId:route.query.id
            }, {
            headers: {
                'access-token': localStorage.getItem('token') || ''
            }
        })
        if(res.data.code === 0){
            ElMessage({ message: res.data.msg, type: 'info' })
            userStoreIns.homeActiveTab = ""
            userStoreIns.initiateChatUser = route.query.id
            // 跳转到个人中心消息页面
            router.push({ path: "/my", query: { val: 'message', id: '7-1' } })
        }else{
            ElMessage.error(res.data.msg)
        }
    }catch(e){
        ElMessage.error('网络错误，私信失败')
    }
}

onMounted(()=>{
    getGuestUserInfo()
    getGuestProject()
})





</script>
<style scoped>
:deep(.ep-card__body){
    padding: 5px 10px;
}
.main {
    width: calc(100% - 20px);
    margin: 10px auto;
    box-sizing: border-box;
}

.el-row {
    margin-bottom: 20px;
}

.el-row:last-child {
    margin-bottom: 0;
}

.el-col {
    border-radius: 4px;
}

.grid-content {
    border-radius: 4px;
    min-height: 36px;
}

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
</style>