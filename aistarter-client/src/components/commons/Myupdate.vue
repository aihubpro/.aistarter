<template>
    <el-form :model="form" :rules="rules" ref="formRef">
        <el-descriptions :title="$t('myupdate.modify_personal_info')" border>
            <el-descriptions-item :label="$t('myupdate.avatar')" :span="3">
                <div class="flex items-center justify-center align-center">
                    <el-upload class="share-project-upload" :auto-upload="false" :show-file-list="false"
                        :on-change="handleAvatarChange">
                        <img v-if="form.avatar_url" :src="form.avatar_url" class="share-project-pic" />
                        <el-icon :size="24" v-else class="share-project-uploader-icon">
                            <Plus />
                        </el-icon>
                    </el-upload>
                </div>
            </el-descriptions-item>
            <el-descriptions-item :label="$t('myupdate.alias_chinese_name')" :span="3">
                <el-form-item prop="alias" class="mb-0">
                    <el-input v-model="form.alias" :placeholder="$t('myupdate.your_chinese_name')" maxlength="20" minlength="2" show-word-limit></el-input>
                </el-form-item>
            </el-descriptions-item>
            <el-descriptions-item :label="$t('myupdate.email')" :span="3">
                <el-input v-model="form.email" :placeholder="$t('myupdate.your_email')" :disabled="true"></el-input>
            </el-descriptions-item>
            <el-descriptions-item :label="$t('myupdate.phone_number')" :span="3">
                <el-form-item prop="phone" class="mb-0">
                    <el-input v-model="form.phone" :placeholder="$t('myupdate.your_phone_number')" maxlength="20" minlength="6" show-word-limit></el-input>
                </el-form-item>
            </el-descriptions-item>
            <el-descriptions-item :label="$t('myupdate.gender')" :span="3">
                <el-radio-group v-model="form.sex">
                    <el-radio value="1">{{ $t('myupdate.male') }}</el-radio>
                    <el-radio value="2">{{ $t('myupdate.female') }}</el-radio>
                    <el-radio value="3">{{ $t('myupdate.secret') }}</el-radio>
                </el-radio-group>
            </el-descriptions-item>
            <el-descriptions-item :label="$t('myupdate.bio')" :span="3">
                <el-form-item prop="bio" class="mb-0">
                    <el-input v-model="form.bio" :rows="3" type="textarea"
                    :placeholder="$t('myupdate.set_your_signature')" maxlength="100" show-word-limit></el-input>
                </el-form-item>
            </el-descriptions-item>
        </el-descriptions>
        <el-button type="primary" @click="onSubmit">{{ $t('myupdate.modify') }}</el-button>
        <el-button @click="onCancel">{{ $t('myupdate.cancel') }}</el-button>
    </el-form>
</template>

<script setup lang="ts">
import { reactive, PropType, ref,onMounted } from 'vue';
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
const { ipcRenderer } = require('electron');
const fs = require('fs');

const { t } = useI18n();

const userInfo = ref(new URL("~/assets/ai_noimg.png", import.meta.url).href);
const handleAvatarChange = async (uploadFile: any) => {
    let rawFile = uploadFile.raw;
    if (rawFile.type !== 'image/png') {
         ElMessage.error(t('myupdate.upload_png_format'))
         return false
     } else if (rawFile.size / 1024 > 200) {
         ElMessage.error(t('myupdate.image_size_limit'))
         return false
     }
    let temfile = await ipcRenderer.invoke('blob-to-temp-file', rawFile.path,64,64);
    form.image = temfile ||  rawFile.path;

    form.avatar_url = URL.createObjectURL(rawFile)
}


const form = reactive({
    alias: '',
    avatar_url: '',
    image: '',
    email: '',
    phone: '',
    sex:'3',
    bio: ''
});

const rules = reactive({
    phone: [
        { required: true, message: t('myupdate.phone_required'), trigger: 'blur' },
        { pattern: /^\+?\d{6,20}$/, message: t('myupdate.phone_format'), trigger: 'blur' }
    ],
    alias: [
        { required: true, message: t('myupdate.alias_required'), trigger: 'blur' },
        { min: 2, max: 20, message: t('myupdate.alias_length'), trigger: 'blur' }
    ],
    bio: [
        { max: 100, message: t('myupdate.bio_length'), trigger: 'blur' }
    ]
})
const getInfo = async () => { 
    let url = (window as any).Constants.uploadUrl + '/users/get-personal-info'
    let result = await axios.get(url,{
        headers: {
            "access-token": localStorage.getItem('token')
        }
    })
    if(result.data.code == 200){
        Object.assign(form, result.data.data)
        form.sex = result.data.data.sex.toString()
        form.avatar_url = result.data.data.avatar_url?(window as any).Constants.uploadUrl+'/assets/user-images/'+result.data.data.avatar_url+'?t='+new Date().getTime():userInfo.value
    }else{
        ElMessage.error(result.data.msg)
    }
}

const formRef = ref();
//修改个人信息
const updateInfo = async () => {
    const valid = await formRef.value.validate().catch(() => false);
    if (!valid) return;
    const formData = new FormData();
    if(form.image){
        const imageStream = await fs.promises.readFile(form.image);
        formData.append('image', new Blob([imageStream], { type: 'image/png' }), 'avater.png');
    }
    formData.append('alias', form.alias);
    formData.append('phone', form.phone);
    formData.append('gender', form.sex);
    formData.append('bio', form.bio);
    let url = (window as any).Constants.uploadUrl + '/users/update-personal-info'
    let result = await axios.post(url, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'access-token': localStorage.getItem('token')
        }
    });
    if(result.data.code == 200){
        ElMessage.success(t('myupdate.modify_success'))
        getInfo()
    }else{
        ElMessage.error(result.data.msg)
    }
}

onMounted(()=>{
    getInfo()
})

const onSubmit = () => {
    updateInfo()
};
const onCancel = () => {
    getInfo()
};
</script>

<style scoped>
.share-project-pic {
    width: 80px;
    height: 80px;
    display: block;
    border-radius: 50%;
}

.share-project-upload {
    width: 80px;
    height: 80px;

    border: 2px dashed var(--ep-border-color);
    border-radius: 50%;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--ep-transition-duration-fast);
}

.share-project-upload:hover {
    border-color: var(--ep-color-primary);
}

.share-project-uploader-icon {
    font-size: 12px;
    color: #8c939d;
    width: 80px;
    height: 80px;
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