<template>
    <el-scrollbar class="h-58vh">
        <el-radio-group v-model="radio" class="mt-2 mb-2">
            <el-radio value="1" size="large" border>发布视频</el-radio>
            <el-radio value="2" size="large" border>发布文章</el-radio>
        </el-radio-group>
        <!-- 发布的内容 -->
        <div class="relative h-full w-full">
            <el-row :gutter="20" class="w-full overflow-x-hidden">
                <el-col :span="12" class="mb-1" v-if="radio == 1">
                    <el-upload class="share-project-upload" :auto-upload="false" :show-file-list="false"
                        :on-change="handleAvatarChange">
                        <div class="flex justify-center align-center w-250px h-200px">
                            <img v-if="imageUrl" :src="imageUrl" class="share-project-pic" />
                            <el-icon :size="42" v-else class="share-project-uploader-icon">
                                <Plus />
                            </el-icon>
                        </div>
                        <div v-if="!imageUrl" style="position: absolute; top: 80%;">上传视频 格式:mp4</div>
                    </el-upload>
                </el-col>
                <el-col :span="radio == 1 ? 12 : 24" class="mb-1">
                    <el-upload class="share-project-upload" :auto-upload="false" :show-file-list="false"
                        :on-change="handleAvatarChange">
                        <div class="flex justify-center align-center w-250px h-200px">
                            <img v-if="imageUrl" :src="imageUrl" class="share-project-pic" />
                            <el-icon :size="42" v-else class="share-project-uploader-icon">
                                <Plus />
                            </el-icon>
                        </div>
                        <div v-if="!imageUrl" style="position: absolute; top: 80%;">封面图片 尺寸:400x300
                            格式:png</div>
                    </el-upload>
                </el-col>
                <el-col :span="24">
                    <el-form-item label="项目标题：">
                        <el-input v-model="form.projectTitle" maxlength="60" placeholder="" show-word-limit type="text" />
                    </el-form-item>
                </el-col>
                <el-col :span="24">
                    <el-form-item label="项目描述：">
                        <el-input v-model="form.projectDescribe" maxlength="200" placeholder="" :rows="2" show-word-limit
                            autosize type="textarea" />
                    </el-form-item>
                </el-col>
                <el-col :span="24">
                    <el-form-item label="项目简介：">
                        <el-input v-model="form.projectDesc" maxlength="10000" :rows="2" show-word-limit autosize
                            type="textarea" />
                    </el-form-item>
                </el-col>
                <el-col :span="24">
                    <el-form-item label="相关链接：">
                        <el-input v-model="form.projectUrl" maxlength="500" placeholder="" :rows="2" show-word-limit autosize
                            type="textarea" />
                    </el-form-item>
                </el-col>
            </el-row>
        </div>
        <!-- 发布 -->
        <div class="flex justify-center">
            <el-button class="w-100px" @click="submits">发布</el-button>
        </div>
    </el-scrollbar>
</template>

<script setup>
import { ref,reactive,watch } from 'vue';
import { ElMessage } from 'element-plus'

const emit = defineEmits(['close'])
const props = defineProps({
    projectPath: {
        type: String,
        required: true,
        default: "",
    },
})

watch(() => props.projectPath, (newValue, oldValue) => {
    if(newValue=="other"&&newValue!=oldValue){
        resetData()
    }
})

const resetData = () => {
    form.projectTitle = ''
    form.projectDescribe = ''
    form.projectDesc = ''
    form.projectUrl = ''
    
    ImageUrlPath.value = ''
    imageUrl.value = ''
    
    radio.value = "1"
}


const form = reactive({
    projectTitle:'',
    projectDescribe:'',
    projectDesc:'',
    projectUrl:'',
})

//图片地址
const ImageUrlPath = ref('')
//图片展示地址
const imageUrl = ref('')
const handleAvatarChange = (uploadFile) => {
    let rawFile = uploadFile.raw;
    if (rawFile.type !== 'image/png') {
        ElMessage.error('请上传Png格式的图片！')
        return false
    } else if (rawFile.size / 1024 > 200) {
        ElMessage.error('图片大小不能大于200KB!')
        return false
    }
    ImageUrlPath.value = rawFile.path
    imageUrl.value = URL.createObjectURL(rawFile)
}

const radio = ref("1")
const submits = () => {
    if(radio.value == 1){
        ElMessage({
            message: '项目创建成功',
            type: 'success',
        })
        emit('close')
    }else{
        emit('close')
    }
}
</script>

<style scoped>
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
    width: 250px;
    height: 200px;
    margin: 0 auto;
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
    width: 250px;
    height: 200px;
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