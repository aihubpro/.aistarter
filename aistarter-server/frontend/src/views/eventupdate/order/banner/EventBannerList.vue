<template>
    <div>
        <div class="m-3 p-3 bg-white">
            <div class="clearfix">
                <a-form :model="formState">
                    <a-form-item label="图片上传">
                        <a-upload :action="uploadURL"
                            :before-upload="beforeUpload" @change="handleChange" class="upload-list-inline" :showUploadList="false">
                            <a-button>
                                <upload-outlined></upload-outlined>
                                upload
                            </a-button>
                        </a-upload>
                    </a-form-item>
                    <a-form-item label="图片预览">
                        <vxe-table border :data="formState.bannerInfo" show-overflow :row-config="{height: 150,useKey: true}" ref="xTable">
                            <!-- <vxe-column type="seq" width="70" class="drag"></vxe-column> -->
                            <vxe-column field="hid" title="ID" width="70" class="drag"></vxe-column>
                            <vxe-column field="image" title="图片" width="300px" align="center" class="drag">
                                <template #default="{ row }">
                                    <a-image :src="imageUrls + row.image" alt="上传的图片" width="240px" height="140px" />
                                </template>
                            </vxe-column>
                            <vxe-column field="urlHref" title="跳转链接" :resizable="true" class-name="no-drag">
                                <template #default="{ row }">
                                    <a-form
                                        :model="row"
                                        :rules="rules"
                                    >
                                        <a-form-item ref="url" name="urlHref">
                                            <a-input v-model:value="row.urlHref" placeholder="请输入链接地址" class="mt-2"/>
                                        </a-form-item>
                                    </a-form>
                                </template>
                            </vxe-column>
                            <vxe-column field="right" title="操作" :resizable="true" class-name="no-drag" width="160">
                                <template #default="{ row }">
                                    <a-link @click="deleteBanner(row.id)">删除</a-link>
                                </template>
                            </vxe-column>
                        </vxe-table>
                    </a-form-item>
                    <a-form-item>
                        <a-button type="primary" @click="submitForm">提交</a-button>
                    </a-form-item>
                </a-form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { PlusOutlined, UploadOutlined } from '@ant-design/icons-vue';
import { ref, onMounted, reactive, toRaw,nextTick,onBeforeMount  } from 'vue';
import { useGlobSetting } from '/@/hooks/setting';
import { getBannerList, updateBanner } from './EventBanner.api';
import { message } from 'ant-design-vue';
import Sortable from 'sortablejs'
// import 'vxe-table/lib/style.css'; // 引入样式
const xTable = ref<any>(null);
let sortable:any = null
// 定义 bannerInfo 中每个对象的结构
interface BannerItem {
    name: string;
    urlHref: string;
    image: string;
    id: string; // 用于唯一标识文件
    hid:number; // 用于唯一标识文件
}

const globSetting = useGlobSetting();

const imageUrls = globSetting.apiUrl + '/assets/market-images/';

const uploadURL = globSetting.apiUrl + '/users/bannerUpload';
const inputRef = ref<HTMLInputElement | null>(null);
const formState = reactive({
    bannerInfo: [] as BannerItem[]
});

const rules = {
    urlHref: [
        { required: true, message: '请输入链接地址', trigger: 'blur' },
        { type: 'url', message: '请输入正确的链接地址', trigger: 'blur' },
    ],
};

onMounted(() => {
    rowDrop()
    getBannerList().then(res => {
        console.log(res);
        // 假设 res.data 是从后端获取的 banner 信息数组
        if(res.data.bannerInfo){
            formState.bannerInfo = res.data.bannerInfo
        }
    });
});
onBeforeMount(() => {
    if (sortable) {
        sortable.destroy()
    }
});
function rowDrop() {
  nextTick(() => {
    const el = xTable.value.$el.querySelector('.body--wrapper>.vxe-table--body tbody')
    if (el) {
      sortable = Sortable.create(el, {
        handle: '.vxe-body--row',
        filter: '.no-drag',
        preventOnFilter:false,
        animation: 150,
        onEnd({ newIndex, oldIndex }) {
          const movedItem = formState.bannerInfo.splice(oldIndex, 1)[0]
          formState.bannerInfo.splice(newIndex, 0, movedItem)
          //formState.bannerInfo里面的id也要更新
          formState.bannerInfo.forEach((item, index) => {
            item.hid = index + 1
          })
          // 更新视图
          nextTick(() => {
            // 如果有需要，可以在拖拽后执行额外的操作，比如保存新的顺序
          })
        }
      })
    }
  })
}

const beforeUpload = async (file: File) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
        message.error('只能上传 JPG 或 PNG 格式的图片!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
        message.error('图片大小不能超过 2MB!');
    }
    if (isJpgOrPng && isLt2M) {
        return true;
    }
};

const handleChange = (info: any) => {
    const { status, response } = info.file;
    if (status === 'done') {
        message.success(`${info.file.name} file uploaded successfully.`);
        console.log(response);
        formState.bannerInfo.push({
            hid: formState.bannerInfo.length + 1,
            name: response.data.name,
            id: JSON.stringify(new Date().getTime()),
            image: response.data.imageUrl,
            urlHref: ''
        })
    } else if (status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
    }
};
//删除图片
const deleteBanner = (id: string) => {
    formState.bannerInfo = formState.bannerInfo.filter(item => item.id !== id);
    message.success('删除成功');
    //删除后更新hid
    formState.bannerInfo.forEach((item, index) => {
        item.hid = index + 1
    })
};
//上传图片

const submitForm = () => {
    // console.log(formState)
    updateBanner(formState).then(res => {
        console.log(res);
        message.success('更新成功')
    }).catch(err => {
        console.log(err)
    })
};
</script>

<style scoped>
/* you can make up upload button and sample style by using stylesheets */
.ant-upload-select-picture-card i {
    font-size: 32px;
    color: #999;
}

.ant-upload-select-picture-card .ant-upload-text {
    margin-top: 8px;
    color: #666;
}

.w-24 {
    width: 6rem;
}

.h-24 {
    height: 6rem;
}

.object-cover {
    object-fit: cover;
}

.mb-2 {
    margin-bottom: 0.5rem;
}

.mt-2 {
    margin-top: 0.5rem;
}
</style>