<template>
    <el-scrollbar class="w-full" style="box-sizing: border-box;">
        <div class="main overflow-y-auto overflow-x-hidden">
            <!-- 用户头像等信息 -->
            <el-row :gutter="24">
                <el-col :span="userdata?.InfoState != 3?16:24">
                    <el-card shadow="always">
                        <!-- 头像信息 -->
                        <el-row :gutter="24" justify="space-between" style="align-items: center;">
                            <!-- 头像信息 -->
                            <el-col :span="14">
                                <div class="flex align-center justify-start w-full">
                                    <div class="flex justify-start h-full m-2" style="align-items: center;" @click="toUserPage(store.userInfo.id)">
                                        <div class="w-60px h-60px">
                                            <el-avatar :size="60" :src="userdata?.avatar_url?userdata.avatar_url:userInfo.avatar" fit="fill"></el-avatar>
                                        </div>
                                    </div>
                                    <div class="w-full">
                                        <div
                                            class="ep-bg-purple line-height-36px w-full ellipsis text-left font-size-14px flex align-center">
                                            <div class="ellipsis">
                                                {{ userdata?.alias?userdata?.alias+'#'+userdata?.username:userdata?.username || $t('mypage.not_set') }}
                                            </div>
                                            <div class="ml-2">
                                                <el-tag size="small" type="warning" v-if="store.userInfo.vip_type==1">
                                                    <el-image class="w-14px h-10px" :src="vipIconurl" fit="fill" />
                                                    VIP({{ new Date(store.userInfo.vip_expire_time).toLocaleDateString().replaceAll("/","-") }}{{$t('personalcenter.expire')}})
                                                </el-tag>
                                                <a @click="openPurchaseMembership()" class="cursor-pointer" v-if="store.userInfo.vip_type==1">{{ $t('header.renew') }}</a>
                                                <el-tag size="small" type="warning" v-if="store.userInfo.vip_type==2">
                                                    <el-image class="w-14px h-10px" :src="vipIconurl" fit="fill" />
                                                    {{ $t('header.vip_lifetime_member') }}
                                                </el-tag>
                                            </div>
                                        </div>
                                        <div
                                            class="ep-bg-purple ellipsis text-left font-size-10px text-gray">
                                            {{ userdata?.email || $t('mypage.none') }}
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
                            <el-col :span="userdata?.InfoState != 3?10:8">
                                <div class="flex justify-end gap-1">

                                    <div @click="openMenuInfo('project','2-1')">
                                        <div>{{ toolutils.Formatter(Number(userdata?.favorites) || 0) }}</div>
                                        <div>{{ $t('personalcenter.collection') }}</div>
                                    </div>
                                    <el-divider direction="vertical" style="margin: auto 8px;" />
                                    <div @click="openMenuInfo('project','2-1')">
                                        <div>{{ toolutils.Formatter(Number(userdata?.downloads) || 0) }}</div>
                                        <div>{{ $t('personalcenter.download') }}</div>
                                    </div>
                                    <el-divider direction="vertical" style="margin: auto 8px;" />
                                    <div @click="openMenuInfo('income','8-2')">
                                        <div class="text-yellow">{{ toolutils.Formatter(Number(userdata?.income) || 0.00) }}</div>
                                        <div>{{ $t('personalcenter.income') }}</div>
                                    </div>
                                    <el-divider direction="vertical" style="margin: auto 8px;" />
                                    <div @click="openMenuInfo('wallet','8-1')">
                                        <div class="text-yellow">{{ toolutils.Formatter(Number(userdata?.balance) || 0.00) }}</div>
                                        <div>{{ $t('personalcenter.balance') }}</div>
                                    </div>
                                </div>
                            </el-col>
                        </el-row>
                    </el-card>
                </el-col>
                <el-col :span="8" style="padding-left: 0px;" v-if="userdata?.InfoState != 3">
                    <el-card class="w-full h-full" shadow="always" @click="openEditUserInfo()">
                        <div class="text-size-50px font-bold line-height-72px"><span>{{ $t('mypage.creator') }}</span></div>
                    </el-card>
                </el-col>
            </el-row>
            <!-- 完善个人信息 -->
            <!-- <el-row :gutter="20" class="mt-3">
                <el-col :span="24">
                    <el-card class="w-full h-full" style="cursor: pointer;" shadow="always">
                        <div class="line-height-40px font-size-40px mt-5 mb-5 font-bold"
                            style="letter-spacing: 40px;text-indent: 40px;">加入我们成为创作者</div>
                    </el-card>
                </el-col>
            </el-row> -->
            <!-- 核心内容 -->
            <el-row :gutter="20" class="mt-3">
                <el-col :span="24">
                    <el-card shadow="always" class="w-full">
                        <el-row :gutter="24">
                            <el-col :span="4">
                                <MenuTree :menu="infoList" :defaultActive="defaultActive" @clickItem="handleMenuClick"
                                    :update-click="handleMenuClick" />
                            </el-col>
                            <el-col :span="20">
                                <div>
                                    <Myaccount :name="rightContent" />
                                </div>
                            </el-col>
                        </el-row>
                    </el-card>
                </el-col>
            </el-row>
        </div>
    </el-scrollbar>
</template>
<script lang="ts" setup>
import { ref, onMounted, inject, markRaw, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
const { vipIconurl,openPurchaseMembership,hasMessage,  checkHasMessage,checkHasCommentMessage,checkHasLikeMessage } = inject("main") as any;
import { useI18n } from "vue-i18n";
const { t } = useI18n();
import axios from 'axios'
import { userStore } from '../stores/UserStore'
//导入工具
import toolutils from "../toolutils"

interface userInfo {
    username: string,
    email: string,
    avatar_url: string,
    likes: number,
    downloads: string,
    income: string,
    balance: string,
    favorites: number,
}

const store = userStore();

const userInfo = ref({
    avatar: new URL("~/assets/ai_noimg.png", import.meta.url).href,
});

const router = useRouter();
const route = useRoute();

//前往访客界面
const toUserPage = (id:number) => {
    router.push({ name: 'guest', query: { id:id } });
}

//信息列表
const infoList = ref([
    {
        id: '1',
        name: t('personalcenter.myaccount'),
        level: '1',
        child: [
            {
                id: '151',
                name: t('personalcenter.userinfo_update'),
                level: '1-5-1',
                action: 'update',
                child: []
            },
            {
                id: '152',
                name: t('personalcenter.userinfo_updateinfo'),
                level: '1-5-2',
                action: 'updateInfo',
                child: []
            },
            {
                id: '153',
                name: t('personalcenter.userinfo_updatepwd'),
                level: '1-5-3',
                action: 'updatePwd',
                child: []
            },
            {
                id: '154',
                name: t('personalcenter.enterprise_certification'),
                level: '1-5-4',
                action: 'enterpriseCert',
                child: []
            }
        ]
    },
    {
        id: '2',
        name: t('personalcenter.myproject'),
        level: '2',
        child: [
            {
                id: '21',
                name: t('personalcenter.myproject_my'),
                level: '2-1',
                action: 'project',
                child: []
            },
            {
                id: '22',
                name: t('personalcenter.myresources_my'),
                level: '2-2',
                action: 'resources',
                child: []
            }
        ]
    },
    {
        id: '3',
        name: t('personalcenter.myfavorites'),
        level: '3',
        action: 'favorites',
        meta: {
            disabled: false
        },
        child: []
    },
    {
        id: '4',
        name: t('mypage.my_devices'),
        level: '4',
        action: 'device',
        meta: {
            disabled: false
        },
        child: []
    },
    {
        id: '5',
        name: t('personalcenter.mydownload'),
        level: '5',
        action: 'download',
        child: []
    },
    {
        id: '6',
        name: t('personalcenter.myorderhistory'),
        level: '6',
        action: 'buy',
        child: []
    },
    {
        id: '7',
        name: t('personalcenter.mymessage'),
        level: '7',
        action: 'message',
        badge:hasMessage,
        child: [
            {
                id: '71',
                name: t('personalcenter.mymessage'),
                level: '7-1',
                action: 'message',
                badge:checkHasMessage,
                child: []
            },
            {
                id: '72',
                name: t('personalcenter.comment_message'),
                level: '7-2',
                action: 'commentmessage',
                badge:checkHasCommentMessage,
                child: []
            },
            {
                id: '73',
                name: t('personalcenter.like_message'),
                level: '7-3',
                action: 'likemessage',
                badge:checkHasLikeMessage,
                child: []
            }
        ]
    },
    {
        id: '8',
        name: t('personalcenter.myorder'),
        level: '8',
        child: [
            {
                id: '81',
                name: t('personalcenter.mywallet'),
                level: '8-1',
                action: 'wallet',
                child: []
            },
            {
                id: '82',
                name: t('personalcenter.myincome'),
                level: '8-2',
                action: 'income',
                child: []
            },
            {
                id: '83',
                name: t('personalcenter.mydiscounts'),
                level: '8-3',
                action: 'discounts',
                child: []
            },
            {
                id: '84',
                name: t('myinvitemenu.my_invite'),
                level: '8-4',
                action: 'invite',
                child: []
            }
        ]
    },
])

//右侧内容
const rightContent = computed(() => (route.query.val ?? 'update').toString());

//默认
const defaultActive = computed(() => (route.query.id ?? '1-4-1').toString());

//点击菜单
const handleMenuClick = (item: any) => {
    console.log('父组件', item)
    router.push({
        query: {
            ...router.currentRoute.value.query,
            id: item.level,
            val: item.action
        }
    })
}

const openMenuInfo = (val:any,id:any) => {
    router.push({
        query: {
            ...router.currentRoute.value.query,
            id: id, // 对应个人信息编辑的菜单项
            val: val
        }
    })
}

const openEditUserInfo = () => {
    // 跳转到编辑页面或打开编辑弹窗
    router.push({
        query: {
            ...router.currentRoute.value.query,
            id: '1-5-2', // 对应个人信息编辑的菜单项
            val: 'updateInfo'
        }
    })
}

const userdata =ref<userInfo>();

onMounted(() => {
    console.log('路由', route.query.val)
    let url = (window as any).Constants.uploadUrl + '/users/get-user-info'
    axios.get(url,{
        params: {
            
        },
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
})


</script>
<style scoped>
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
</style>