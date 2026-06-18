<template>
  <u-comment-scroll :disable="disable" @more="more">
    <u-comment :config="config" @submit="submit" @like="like" @reply-page="replyPage" @show-info="showInfo">
      <!-- <u-comment-nav v-model="latest" @sorted="sorted"></u-comment-nav> -->
      <!-- <template>导航栏卡槽</template> -->
      <!-- <template #header>头部卡槽</template> -->
      <!-- <template #action="{ user }">动作卡槽{{ user.username }}</template> -->
      <template #avatar="{uid,user}">
        <el-avatar style="margin-top: 5px" :size="40" fit="fill" :src="user.avatar" @click="goGuestPage(uid)">
          <span>{{ user.username }}</span>
        </el-avatar>
      </template>
      <template #info="scope">
        <div class="flex items-center gap-2">
          <el-tag type="primary">{{ scope.user_role }}</el-tag>
          <div class="address">{{ scope.address }}</div>
        </div>
      </template>
      <template #card="scope">
        <el-skeleton :loading="userinfoloading" :throttle="200" animated>
          <template #template>
            <el-skeleton-item variant="image" style="width: 50px; height: 50px; margin-bottom: 10px" />
            <div>
              <el-skeleton-item variant="h3" style="width: 100px" />
              <el-skeleton-item variant="text" style="margin-right: 16px;" />
              <el-skeleton-item variant="text" style="width: 100px" />
            </div>
          </template>
          <template #default>
            <div class="user-card">
              <div class="user-avatar">
                <el-avatar style="margin-top: 5px" :size="40" fit="fill" :src="scope.avatar" @click="goGuestPage(scope.uid)">
                  <span>{{ scope.username }}</span>
                </el-avatar>
              </div>
              <div class="user-content">
                <div class="user-info">
                  <div @click="goGuestPage(scope.uid)" class="username" target="_blank">
                    <el-tooltip placement="top">
                      <template #content> {{ scope.username }} </template>
                      <span class="name">{{ scope.username }}</span>
                    </el-tooltip>
                    <span blank="true" class="rank">
                      <el-tag type="primary">{{ scope.user_role }}</el-tag>
                    </span>
                  </div>
                </div>
                <div class="social-info">
                  <b class="like">
                    <span>{{ toolutils.Formatter(scope.like) }}</span>
                    <span>{{ t('commentcomp.like') }}</span>
                  </b>
                  <b class="favorite">
                    <span>{{ toolutils.Formatter(scope.favorite) }}</span>
                    <span>{{ t('commentcomp.favorite') }}</span>
                  </b>
                  <b class="download">
                    <span>{{ toolutils.Formatter(scope.download) }}</span>
                    <span>{{ t('commentcomp.download') }}</span>
                  </b>
                </div>
                <div class="card-btn flex items-center justify-start">
                  <!-- <el-button type="primary" size="small">关注</el-button> -->
                  <el-button @click="sendMessage(scope.uid)">{{ t('commentcomp.send_message') }}</el-button>
                </div>
              </div>
            </div>
          </template>
        </el-skeleton>
      </template>
      <!-- <template #func>功能区域卡槽</template> -->
      <template #operate="scope">
        <Operate :comment="scope" :project_id="props.project_id" :project_type="props.project_type" :project_user_id="props.project_user_id" @remove="remove" />

      </template>
    </u-comment>
  </u-comment-scroll>
</template>

<script setup lang="ts">
// 下载表情包资源emoji.zip https://gitee.com/undraw/undraw-ui/releases/tag/v0.0.0
// static文件放在public下,引入emoji.ts文件可以移动assets下引入,也可以自定义到指定位置
import emoji from '~/emoji'
import { reactive, ref, watch, defineProps,onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { ConfigApi, CommentApi, CommentSubmitApi, cloneDeep, usePage, CommentReplyPageApi } from 'undraw-ui'
import { userStore } from '../../stores/UserStore'
const { ipcRenderer } = require('electron');
//导入工具
import toolutils from "../../toolutils"
const userStoreIns = userStore()
import { useRouter } from 'vue-router';  // 引入 useRoute
const router = useRouter()
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

// 接收父组件传入的project_id和project_type
const props = defineProps<{ project_id: string; project_type: string,likedates:Array,project_user_id:number }>()

// 定义emit事件
const emit = defineEmits<{
  closeDialog: []
}>()

const userUrl = (window as any).Constants.uploadUrl+'/assets/user-images/'

const config = reactive<ConfigApi>({
  get user() {
    // 只传递后端需要的字段，适配u-comment格式
    const u = userStoreIns.userInfo || {}
    return {
      id: u.id,
      email: u.email,
      vip_type: u.vip_type,
      id_role: u.id_role,
      username: u.username || u.email,
      avatar: u.avatar ? userUrl+u.avatar : '',
      likeIds:props.likedates
    }
  },
  emoji: emoji, // 表情包数据
  comments: [], // 评论数据
  relativeTime: true, // 开启人性化时间
  page: true, // 开启分页
  show: {
    level: false,    // 关闭等级显示
    homeLink: true, // 关闭个人主页链接跳转
    address: false, // 关闭地址信息
    likes: true    // 显示点赞按钮
  },
  // 图片上传配置
  // 限制条件：
  // - 文件大小：最大1MB
  // - 文件类型：仅支持PNG格式
  // - 图片会被自动压缩到300x300像素
  upload: async (files, finish) => {
    //判断是否登录
    if (!userStoreIns.isLogin()) {
        ElMessage.error(t('addproject.project_onlogin_gosendmsg'));
        return;
    }
    // 上传图片到后端
    const uploadPromises = Array.from(files).map(async (file) => {
      try {
        // 文件大小限制：1MB = 1024 * 1024 bytes
        const maxSize = 1024 * 1024; // 1MB
        if (file.size > maxSize) {
          throw new Error(`${t('commentcomp.image_size_limit')}${(file.size / 1024 / 1024).toFixed(2)}MB`);
        }
        
        // 文件类型限制：允许PNG、JPEG、JPG、TIFF格式
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff'];
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`${t('commentcomp.image_format_error')}${file.type}`);
        }
        
        // 通过 ipcRenderer 处理图片压缩和上传
        const result = await ipcRenderer.invoke('upload-comment-image', {
          filePath: file.path,
          width: 300,
          height: 300,
          token: localStorage.getItem('token') || ''
        });
        
        if (result.success) {
          return { data: { code: 0, data: { url: result.url }, msg: 'success' } };
        } else {
          throw new Error(result.error || t('commentcomp.image_process_failed'));
        }
      } catch (error) {
        console.error(t('commentcomp.image_process_failed') + ':', error);
        throw error;
      }
    })

    Promise.all(uploadPromises)
      .then(responses => {
        // 假设后端返回格式为 { code: 0, data: { url: 'image_url' } }
        const imageUrls = responses.map(res => {
          if (res.data.code === 0) {
            return (window as any).Constants.uploadUrl+'/assets/user-comment-images/'+res.data.data.url
          } else {
            throw new Error(res.data.msg || t('commentcomp.upload_failed'))
          }
        })
        finish(imageUrls)
      })
      .catch(error => {
        console.error(t('commentcomp.image_upload_failed') + ':', error)
        ElMessage.error(error.message || t('commentcomp.image_upload_failed'))
        finish([])
      })
  }
})

// 评论分页参数
const pageNum = ref(1)
const pageSize = 10
const total = ref(0)
const loading = ref(false)
const disable = ref(false)

// 点赞防抖状态 - 使用Map跟踪每个评论的点赞状态
const likeLoadingMap = new Map<string, boolean>()

const userinfoloading = ref(false)

const showInfo = async (uid: string, finish: Function) => {
  console.log(userinfoloading.value)
  if (userinfoloading.value) {
    return
  }
  userinfoloading.value = true
  console.log('获取用户信息: ' + uid)
  
  try {
    // 模拟获取后端根据uid查询用户信息
    let req = await axios.post((window as any).Constants.uploadUrl+'/users/get-market-comment-user-data', {
      project_id: props.project_id,
      project_type: props.project_type,
      uid
    },{
      headers: {
        'access-token': localStorage.getItem('token') || ''
      }
    })
    
    if (req.data.code === 0) {
      const userInfo = {
        uid: req.data.data.uid,
        username: req.data.data.alias?req.data.data.alias+'#'+req.data.data.username:req.data.data.alias || req.data.data.username,
        user_role: req.data.data.user_role,
        avatar: req.data.data.avatar ? userUrl+req.data.data.avatar : '',
        like: req.data.data.like,
        favorite: req.data.data.favorite,
        download: req.data.data.download
      }
      finish(userInfo)
    } else {
      ElMessage.error(req.data.msg || t('commentcomp.get_user_info_failed'))
      finish()
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    ElMessage.error(t('commentcomp.network_error'))
    finish()
  } finally {
    userinfoloading.value = false
  }
}


// 获取主评论列表
const fetchComments = async (reset = false) => {
  if (reset) {
    pageNum.value = 1
    config.comments = []
    disable.value = false
  }
  loading.value = true
  try {
    const res = await axios.get((window as any).Constants.uploadUrl+'/users/get-market-comment', {
      params: {
        project_id: props.project_id,
        project_type: props.project_type,
        parent_id: null,
        page: pageNum.value,
        size: pageSize
      },
      headers: {
        'access-token': localStorage.getItem('token') || ''
      }, 
      withCredentials: true
    })
    if (res.data.code === 0) {
      const { total: t, records } = res.data.data
      // 适配后端评论数据为u-comment格式
      const adapt = (arr: any[]) => arr.map(item => ({
        ...item,
        uid: item.user_id,
        address: item.address || '',
        parentId: item.parent_id,
        createTime: item.create_time,
        likes: item.likes,
        user: {
          username: item.alias || item.username || item.email || '',
          avatar: item.avatar ? userUrl+item.avatar : '',
        },
        reply: { 
          total: Number(item.reply_total) || 0, 
          list: (item.reply || []).map((items:any)=>({
            ...items,
            uid: items.user_id,
            address: items.address || '',
            parentId: items.parent_id,
            createTime: items.create_time,
            likes: items.likes,
            user: {
              username: items.alias || items.username || items.email || '',
              avatar: items.avatar ? userUrl+items.avatar : '',
            }
          })) 
        }
      }))
      const adaptedRecords = adapt(records)
      if (pageNum.value === 1) {
        config.comments = adaptedRecords
      } else {
        config.comments.push(...adaptedRecords)
      }
      total.value = t
      if (config.comments.length >= total.value) {
        disable.value = true
      }
    } else {
      ElMessage.error(res.data.msg || t('commentcomp.get_comments_failed'))
    }
  } catch (e) {
    // ElMessage.error(t('commentcomp.network_error_get_comments'))
    console.log(e)
  }
  loading.value = false
}

//跳转到访客界面
const goGuestPage = (uid:number) => {
  //判断是否登录
  if (!userStoreIns.isLogin()) {
      ElMessage.error(t('addproject.project_onlogin_goguest'));
      return;
  }
  // 发送消息通知父组件关闭窗口
  emit('closeDialog')
  userStoreIns.homeActiveTab = ""
  // 跳转到个人中心消息页面
  router.push({ path: "/guest", query: { id:uid } })
}
// 发消息
const sendMessage = async (uid: number) => {
  //判断是否登录
  if (!userStoreIns.isLogin()) {
      ElMessage.error(t('addproject.project_onlogin_gosendmsg'));
      return;
  }
  console.log(uid)
  try{
    let res = await axios.post((window as any).Constants.uploadUrl+'/chat/create-chat', {
      targetUserId:uid
    }, {
      headers: {
        'access-token': localStorage.getItem('token') || ''
      }
    })
    if(res.data.code === 0){
      ElMessage({ message: res.data.msg, type: 'info' })
      // 发送消息通知父组件关闭窗口
      emit('closeDialog')
      userStoreIns.homeActiveTab = ""
      userStoreIns.initiateChatUser = uid
      // 跳转到个人中心消息页面
      router.push({ path: "/my", query: { val: 'message', id: '7-1' } })
    }else{
      ElMessage.error(res.data.msg)
    }
  }catch(e){
    ElMessage.error(t('commentcomp.network_error_send_message'))
  }
}

// 监听project_id/project_type变化自动刷新
watch(() => [props.project_id, props.project_type], () => {
  fetchComments(true)
}, { immediate: true })

// 发布评论
const submit = async ({ content, parentId, finish }: CommentSubmitApi) => {
  //判断是否登录
  if (!userStoreIns.isLogin()) {
      ElMessage.error(t('addproject.project_onlogin_gosendmsg'));
      return;
  }
  try {
    const res = await axios.post((window as any).Constants.uploadUrl+'/users/publish-market-comment', {
      content,
      parent_id: parentId,
      project_id: props.project_id,
      project_type: props.project_type
    }, {
      headers: {
        'access-token': localStorage.getItem('token') || ''
      },
      withCredentials: true
    })
    if (res.data.code === 0) {
      if(res.data.err){
        ElMessage.error(res.data.msg)
      }else{
        ElMessage({ message: t('commentcomp.comment_success'), type: 'info' })
      }
      fetchComments(true)
      finish()
    } else {
      ElMessage.error(res.data.msg || t('commentcomp.comment_failed'))
    }
  } catch (e) {
    ElMessage.error(t('commentcomp.network_error_comment'))
  }
}

// 点赞/取消点赞
const like = async (id: string, finish: () => void) => {
  //判断是否登录
  if (!userStoreIns.isLogin()) {
      ElMessage.error(t('addproject.project_onlogin_gosendmsg'));
      return;
  }
  // 防抖：如果该评论正在点赞中，直接返回
  if (likeLoadingMap.get(id)) {
    return
  }
  
  // 设置该评论的点赞状态
  likeLoadingMap.set(id, true)

  //检测是否存在当前id
  if(config.user.likeIds.indexOf(id) == -1){
    //设置配置文件中的点赞状态
    config.user.likeIds.push(id)
  }else{
    //清除点赞状态
    const index = config.user.likeIds.indexOf(id)
    if(index > -1) {
      config.user.likeIds.splice(index, 1)
    }
  }
  
  try {
    const res = await axios.post((window as any).Constants.uploadUrl+'/users/like-market-comment', {
      comment_id: id
    }, {
      headers: {
        'access-token': localStorage.getItem('token') || ''
      },
      withCredentials: true
    })
    if (res.data.code === 0) {
      ElMessage({ message: res.data.msg, type: 'info' })
      fetchComments(true)
      finish()
    } else {
      ElMessage.error(res.data.msg || t('commentcomp.operation_failed'))
    }
  } catch (e) {
    ElMessage.error(t('commentcomp.network_error_operation'))
  } finally {
    // 无论成功还是失败，都要调用finish()结束loading状态
    finish && finish()
    // 重置该评论的点赞状态
    likeLoadingMap.set(id, false)
  }
}

// 加载更多评论
const more = () => {
  if (disable.value) return
  pageNum.value++
  fetchComments()
}

// 回复分页
const replyPage = async ({ parentId, current, size, finish }: CommentReplyPageApi) => {
  try {
    const res = await axios.get((window as any).Constants.uploadUrl+'/users/get-market-comment', {
      params: {
        project_id: props.project_id,
        project_type: props.project_type,
        parent_id: parentId,
        page: current,
        size
      },
      headers: {
        'access-token': localStorage.getItem('token') || ''
      },
      withCredentials: true
    })
    if (res.data.code === 0) {
      // 适配回复数据
      const adapt = (arr: any[]) => arr.map(item => ({
        ...item,
        uid: item.user_id,
        address: item.address || '',
        parentId: item.parent_id,
        createTime: item.create_time,
        likes: item.likes,
        user: {
          username: item.alias || item.username || item.email || '',
          avatar: item.avatar ? userUrl+item.avatar : '',
        },
        reply: { 
          total: Number(item.reply_total) || 0, 
          list: (item.reply || []).map((items:any)=>({
            ...items,
            uid: items.user_id,
            address: items.address || '',
            parentId: items.parent_id,
            createTime: items.create_time,
            likes: items.likes,
            user: {
              username: items.alias || items.username || items.email || '',
              avatar: items.avatar ? userUrl+items.avatar : '',
            }
          })) 
        }
      }))
      finish({ total: res.data.data.total, list: adapt(res.data.data.records) })
    } else {
      ElMessage.error(res.data.msg || t('commentcomp.get_reply_failed'))
    }
  } catch (e) {
    ElMessage.error(t('commentcomp.network_error_get_reply'))
  }
}

// 删除评论
const remove = async (comment: CommentApi) => {
  try {
    const res = await axios.post((window as any).Constants.uploadUrl+'/users/delete-market-comment', {
      comment_id: comment.id
    }, {
      headers: {
        'access-token': localStorage.getItem('token') || ''
      }
    })
    if (res.data.code === 0) {
      ElMessage({ type: 'success', message: t('commentcomp.delete_success') })
      fetchComments(true) // 刷新评论列表
    } else {
      ElMessage.error(res.data.msg || t('commentcomp.delete_failed'))
    }
  } catch (error) {
    ElMessage.error(t('commentcomp.network_error_delete'))
  }
}
const latest = ref(true)
const sorted = (latest: boolean) => {
  console.log(latest)
}
</script>

<style lang="scss" scoped>
:deep(.scroll-btn){
  font-size:14px;
  p{
    margin: 0;
    padding: 0;
  }
}
:deep(.avatar-box) {
  margin-right: 16px;
}
:deep(.ep-pagination){
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  .ep-pager{
    list-style: none;
    display: flex;
    padding-left: 0;
    gap: 0 10px;
    cursor: pointer;
    .is-active{
      background-color: #409EFF;
      color: #fff;
      border-radius: 4px;
      padding: 0 8px;
      cursor: pointer;
    }
  }
}
:deep(.comment-primary .comment-main .user-info .name){
  font-weight: 500;
  font-size: 15px;
  color: var(--u-text-color);
  line-height: 32px;
  margin-right: 4px;
  white-space: nowrap;
  /*设置不换行*/
  overflow: hidden;
  /*设置隐藏*/
  text-overflow: ellipsis;
  /*设置隐藏部分为省略号*/
}
.address{
  font-size: 12px;
  color: #999;
}

.user-card {
  display: flex;
  .user-content {
    flex: 1;
    margin-left: 16px;
    .user-info {
      .username {
        display: flex;
        align-items: center;
        text-decoration: none;
        .name {
          max-width: 100px;
          font-weight: 500;
          font-size: 15px;
          color: var(--u-text-color);
          line-height: 32px;
          margin-right: 4px;
          white-space: nowrap;
          /*设置不换行*/
          overflow: hidden;
          /*设置隐藏*/
          text-overflow: ellipsis;
          /*设置隐藏部分为省略号*/
        }
      }
    }
    .social-info {
      font-size: 12px;
      margin-bottom: 10px;
      b {
        text-decoration: none;
      }
      b:not(:first-child) {
        margin-left: 18px;
      }
      b span:last-child {
        margin-left: 3px;
        color: #9499a0;
      }
    }
  }
}
</style>
