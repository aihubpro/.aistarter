<template>
    <el-card class="box-card">
        <template #header>
            <div class="flex justify-between items-center">
                <span>{{ $t('personalcenter.complete_personal_info') }}</span>
                <!-- 敏感信息显示控制总开关 -->
                <div class="flex justify-center items-center">
                    <el-button 
                        @click="toggleSensitiveInfo"
                        size="small"
                        type="info"
                        plain
                    >
                        <el-icon><component :is="showSensitiveInfo ? 'Hide' : 'View'" /></el-icon>
                        {{ showSensitiveInfo ? $t('personalcenter.hide_sensitive_info') : $t('personalcenter.show_sensitive_info') }}
                    </el-button>
                </div>
            </div>
        </template>
        <el-form :model="form" label-width="auto" :rules="rules" ref="formRef">
            <el-form-item :label="$t('personalcenter.name')" prop="name">
                <el-input 
                    v-if="showSensitiveInfo"
                    v-model="form.name" 
                    minlength="2" 
                    maxlength="20" 
                    show-word-limit 
                    :disabled="form.disabled" 
                    class="w-full"
                />
                <el-input 
                    v-else
                    :value="'*'.repeat(100)"
                    readonly
                    :disabled="form.disabled" 
                    class="w-full"
                />
            </el-form-item>
            <el-form-item :label="$t('personalcenter.idcard')" prop="idcard">
                <el-input 
                    v-if="showSensitiveInfo"
                    v-model="form.idcard" 
                    minlength="6" 
                    maxlength="30" 
                    show-word-limit 
                    :disabled="form.disabled"
                    class="w-full"
                />
                <el-input 
                    v-else
                    :value="'*'.repeat(100)"
                    readonly
                    :disabled="form.disabled" 
                    class="w-full"
                />
            </el-form-item>
            <el-form-item :label="$t('personalcenter.idcardexpire')" prop="idcardexpire">
                <el-date-picker 
                    v-if="showSensitiveInfo"
                    v-model="form.idcardexpire" 
                    type="date" 
                    :placeholder="$t('personalcenter.data')" 
                    :disabled="form.disabled"
                    class="w-full"
                />
                <el-input 
                    v-else
                    :value="'*'.repeat(30)"
                    readonly
                    :disabled="form.disabled" 
                    class="w-[220px]"
                />
            </el-form-item>
            <el-form-item :label="$t('personalcenter.positiveidcardimgupload')">
                <el-row :gutter="24">
                    <el-col :span="12">
                        <div class="flex items-center justify-center align-center relative">
                            <el-upload class="share-project-upload flex align-center" :auto-upload="false"
                                :show-file-list="false" :on-change="handleAvatarChange" :disabled="form.disabled">
                                <!-- <img v-if="imageUrl" :src="imageUrl" class="share-project-pic" /> -->
                                <el-image v-if="imageUrl" :src="showSensitiveInfo?imageUrl:hideImg" fit="fill" :preview-src-list="form.state === 3 ? [imageUrl] : []" :preview-teleported="true" />
                                <el-icon :size="24" v-else class="share-project-uploader-icon">
                                    <Plus />
                                </el-icon>
                                <div class="absolute bottom-5" v-if="!imageUrl">{{$t('personalcenter.positiveidcard')}}</div>
                            </el-upload>
                            <div v-if="!showSensitiveInfo && imageUrl" class="absolute inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center text-white rounded">
                                <span>{{ $t('personalcenter.image_hidden') }}</span>
                            </div>
                        </div>
                    </el-col>
                    <el-col :span="12">
                        <div class="flex items-center justify-center align-center relative">
                            <el-upload class="share-project-upload flex align-center" :auto-upload="false"
                                :show-file-list="false" :on-change="handleAvatarChange2" :disabled="form.disabled">
                                <!-- <img v-if="imageUrl" :src="imageUrl" class="share-project-pic" /> -->
                                <el-image v-if="imageUrl2" :src="showSensitiveInfo?imageUrl2:hideImg" fit="fill" :preview-src-list="form.state === 3 ? [imageUrl2] : []" :preview-teleported="true" />
                                <el-icon :size="24" v-else class="share-project-uploader-icon">
                                    <Plus />
                                </el-icon>
                                <div class="absolute bottom-5" v-if="!imageUrl2">{{$t('personalcenter.negativeidcard')}}</div>
                            </el-upload>
                            <div v-if="!showSensitiveInfo && imageUrl2" class="absolute inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center text-white rounded">
                        <span>{{ $t('personalcenter.image_hidden') }}</span>
                    </div>
                        </div>
                    </el-col>
                </el-row>
            </el-form-item>
            <el-form-item :label="$t('personalcenter.wechat')" prop="wechat">
                <div class="flex items-center justify-center align-center relative">
                    <el-upload class="share-project-upload flex align-center" :auto-upload="false"
                        :show-file-list="false" :on-change="handleAvatarChange3" :disabled="form.disabled">
                        <!-- <img v-if="imageUrl" :src="imageUrl" class="share-project-pic" /> -->
                        <el-image v-if="imageUrl3" :src="showSensitiveInfo?imageUrl3:hideImg" fit="fill" :preview-src-list="form.state === 3 ? [imageUrl3] : []" :preview-teleported="true" />
                        <el-icon :size="24" v-else class="share-project-uploader-icon">
                            <Plus />
                        </el-icon>
                        <div class="absolute bottom-5" v-if="!imageUrl3">{{$t('personalcenter.wechatimage')}}</div>
                    </el-upload>
                    <div v-if="!showSensitiveInfo && imageUrl3" class="absolute inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center text-white rounded">
                        <span>{{ $t('personalcenter.image_hidden') }}</span>
                    </div>
                </div>
            </el-form-item>
            <el-form-item :label="$t('personalcenter.alipay')" prop="alipay">
                <div class="flex items-center justify-center align-center relative">
                    <el-upload class="share-project-upload flex align-center" :auto-upload="false"
                        :show-file-list="false" :on-change="handleAvatarChange4" :disabled="form.disabled">
                        <!-- <img v-if="imageUrl" :src="imageUrl" class="share-project-pic" /> -->
                        <el-image v-if="imageUrl4" :src="showSensitiveInfo?imageUrl4:hideImg" fit="fill" :preview-src-list="form.state === 3 ? [imageUrl4] : []" :preview-teleported="true" />
                        <el-icon :size="24" v-else class="share-project-uploader-icon">
                            <Plus />
                        </el-icon>
                        <div class="absolute bottom-5" v-if="!imageUrl4">{{$t('personalcenter.alipayimage')}}</div>
                    </el-upload>
                    <div v-if="!showSensitiveInfo && imageUrl4" class="absolute inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center text-white rounded">
                        <span>{{ $t('personalcenter.image_hidden') }}</span>
                    </div>
                </div>
            </el-form-item>
            <!--
            <el-form-item label="Paypal:" prop="paypal">
                <el-input v-model="form.paypal" minlength="5" maxlength="30" show-word-limit :disabled="form.disabled"/>
            </el-form-item>
            -->
            <el-form-item :label="$t('personalcenter.bankcard')" prop="bankcard">
                <el-input 
                    v-if="showSensitiveInfo"
                    v-model="form.bankcard" 
                    minlength="8" 
                    maxlength="34" 
                    show-word-limit 
                    :disabled="form.disabled"
                    class="w-full"
                />
                <el-input 
                    v-else
                    :value="'*'.repeat(100)"
                    readonly
                    :disabled="form.disabled" 
                    class="w-full"
                />
            </el-form-item>
            <el-form-item :label="$t('personalcenter.bankname')" prop="bankname">
                <el-input 
                    v-if="showSensitiveInfo"
                    v-model="form.bankname" 
                    minlength="2" 
                    maxlength="50" 
                    show-word-limit 
                    :disabled="form.disabled"
                    class="w-full"
                />
                <el-input 
                    v-else
                    :value="'*'.repeat(100)"
                    readonly
                    :disabled="form.disabled" 
                    class="w-full"
                />
            </el-form-item>
            <el-form-item :label="$t('personalcenter.residence')" prop="address">
                <el-input v-model="form.address" type="textarea" :placeholder="$t('personalcenter.placeholderresidence')" minlength="5" maxlength="100" show-word-limit :disabled="form.disabled" class="w-full"/>
            </el-form-item>
        </el-form>
        <template #footer>
            <div class="flex justify-center w-full">
                <el-tag :type="stateData[form.state].color" class="mr-3" size="large">{{ stateData[form.state].label }}</el-tag>
                <el-button type="primary" @click="onSubmit" :disabled="form.disabled">{{$t('personalcenter.save')}}</el-button>
            </div>
        </template>
    </el-card>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus';
import { View, Hide } from '@element-plus/icons-vue';
import { useI18n } from "vue-i18n";
import axios from 'axios'
const { ipcRenderer } = require('electron');
const fs = require('fs');
const { t } = useI18n();

const hideImg = ref(new URL("~/assets/ai_noimg.png", import.meta.url).href);

// 控制敏感信息显示状态
const showSensitiveInfo = ref(false);
// 密码验证时间戳
const lastPasswordVerifyTime = ref(0);
// 30分钟的毫秒数
const PASSWORD_VALID_DURATION = 30 * 60 * 1000;
let idcardfrontimage = '' //身份证正面图片路径
let idcardbackimage = '' //身份证反面图片路径
const formRef = ref()
interface statedate {
    label: string,
    color: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}
const stateData = ref<Array<statedate>>([
    {label:t('myupdateinfo.not_submitted'),color:'danger'},
    {label:t('myupdateinfo.under_review'),color:'warning'},
    {label:t('myupdateinfo.not_approved'),color:'danger'},
    {label:t('myupdateinfo.approved'),color:'success'},
])
//身份证正面上传
const imageUrl = ref('')
const handleAvatarChange = async (uploadFile: any) => {
    let rawFile = uploadFile.raw;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff'];
    if (!allowedTypes.includes(rawFile.type)) {
        ElMessage.error(t('imagetxt.img_class_error'))
        return false
    } else if (rawFile.size / 1024 > 1000) {
        ElMessage.error(t('imagetxt.img_size_error3'))
        return false
    }
    let temfile = await ipcRenderer.invoke('blob-to-temp-file', rawFile.path,0,0);
    idcardfrontimage = temfile || rawFile.path;

    imageUrl.value = URL.createObjectURL(rawFile)
}

//身份证反面上传
const imageUrl2 = ref('')
const handleAvatarChange2 = async (uploadFile: any) => {
    let rawFile = uploadFile.raw;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff'];
    if (!allowedTypes.includes(rawFile.type)) {
        ElMessage.error(t('imagetxt.img_class_error'))
        return false
    } else if (rawFile.size / 1024 > 1000) {
        ElMessage.error(t('imagetxt.img_size_error3'))
        return false
    }
    let temfile = await ipcRenderer.invoke('blob-to-temp-file', rawFile.path,0,0);
    idcardbackimage = temfile || rawFile.path;

    imageUrl2.value = URL.createObjectURL(rawFile)
}

//微信收款码上传
const imageUrl3 = ref('')
//微信收款码
let wechatimage = ''
const handleAvatarChange3 = async (uploadFile: any) => {
    let rawFile = uploadFile.raw;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff'];
    if (!allowedTypes.includes(rawFile.type)) {
        ElMessage.error(t('imagetxt.img_class_error'))
        return false
    } else if (rawFile.size / 1024 > 1000) {
        ElMessage.error(t('imagetxt.img_size_error3'))
        return false
    }
    let temfile = await ipcRenderer.invoke('blob-to-temp-file', rawFile.path,0,0);
    wechatimage = temfile || rawFile.path;

    imageUrl3.value = URL.createObjectURL(rawFile)
}

//支付宝收款码上传
const imageUrl4 = ref('')
//支付宝收款码
let alipayimage = ''
const handleAvatarChange4 = async (uploadFile: any) => {
    let rawFile = uploadFile.raw;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff'];
    if (!allowedTypes.includes(rawFile.type)) {
        ElMessage.error(t('imagetxt.img_class_error'))
        return false
    } else if (rawFile.size / 1024 > 1000) {
        ElMessage.error(t('imagetxt.img_size_error3'))
        return false
    }
    let temfile = await ipcRenderer.invoke('blob-to-temp-file', rawFile.path,0,0);
    alipayimage = temfile || rawFile.path;

    imageUrl4.value = URL.createObjectURL(rawFile)
}

// do not use same name with ref
const form = reactive({
    name: '',
    idcard: '',
    idcardexpire: '',
    address: '',
    paypal: '',
    bankcard: '',
    bankname: '',
    disabled:true,
    state:0
})

const rules = {
    idcard: [
        { required: true, message: t('myupdateinfo.id_card_required'), trigger: 'blur' },
        { min: 6, max: 30, message: t('myupdateinfo.id_card_length'), trigger: 'blur' },
        { pattern: /^[A-Za-z0-9\-]+$/, message: t('myupdateinfo.id_card_format'), trigger: 'blur' }
    ],
    name: [
        { required: true, message: t('myupdateinfo.name_required'), trigger: 'blur' },
        { min: 2, max: 20, message: t('myupdateinfo.name_length'), trigger: 'blur' }
    ],
    idcardexpire:[
        { required: true, message: t('myupdateinfo.id_card_expire_required'), trigger: 'blur' },
    ],
    paypal: [
        { type: 'email', message: t('myupdateinfo.paypal_format'), trigger: 'blur' },
        { min: 5, max: 50, message: t('myupdateinfo.paypal_length'), trigger: 'blur' }
    ],
    bankcard: [
        { pattern: /^[A-Za-z0-9 ]{8,34}$/, message: t('myupdateinfo.bank_card_format'), trigger: 'blur' }
    ],
    bankname: [
        { min: 2, max: 50, message: t('myupdateinfo.bank_name_length'), trigger: 'blur' },
        { pattern: /^[\u4e00-\u9fa5a-zA-Z0-9\s]+$/, message: t('myupdateinfo.bank_name_format'), trigger: 'blur' }
    ],
    address: [
        { min: 5, max: 100, message: t('myupdateinfo.address_length'), trigger: 'blur' }
    ],
}

//获取用户信息
const getData = async () => {
    let url = (window as any).Constants.uploadUrl + '/users/get-personal-info-detail'
    let result = await axios.get(url,{
        headers: {
            "access-token": localStorage.getItem('token')
        }
    })
    if(result.data.code == 200){
        form.name = result.data.data.name
        form.idcard = result.data.data.id_card_number
        form.idcardexpire = result.data.data.id_card_expiry_date
        form.address = result.data.data.address?result.data.data.address:''
        form.paypal = result.data.data.paypal_id?result.data.data.paypal_id:''
        form.bankcard = result.data.data.bank_account_number?result.data.data.bank_account_number:''
        form.bankname = result.data.data.bank_name?result.data.data.bank_name:''
        form.disabled = result.data.data.state == 3 ? true : false //0:未上传1:未审核（可以修改）2:未通过（已驳回） 3：已审核（不可修改）
        form.state = result.data.data.state
        //图片信息
        imageUrl.value = result.data.data.id_card_front_image_url?(window as any).Constants.uploadUrl+'/assets/user-images/'+result.data.data.id_card_front_image_url+'?t='+new Date().getTime():''
        imageUrl2.value = result.data.data.id_card_back_image_url?(window as any).Constants.uploadUrl+'/assets/user-images/'+result.data.data.id_card_back_image_url+'?t='+new Date().getTime():''
        imageUrl3.value = result.data.data.wechat_image_url?(window as any).Constants.uploadUrl+'/assets/user-images/'+result.data.data.wechat_image_url+'?t='+new Date().getTime():''
        imageUrl4.value = result.data.data.alipay_image_url?(window as any).Constants.uploadUrl+'/assets/user-images/'+result.data.data.alipay_image_url+'?t='+new Date().getTime():''
    }
}
//修改用户信息
const submitForm = async () => {
    const formData = new FormData();
    // 处理身份证正面图片
    if(idcardfrontimage){
        const frontImageStream = await fs.promises.readFile(idcardfrontimage);
        formData.append('idcard_front_image', new Blob([frontImageStream], { type: 'image/png' }), 'IdcardFrontImage.png');
    }
    
    // 处理身份证背面图片
    if(idcardbackimage){
        const backImageStream = await fs.promises.readFile(idcardbackimage);
        formData.append('idcard_back_image', new Blob([backImageStream], { type: 'image/png' }), 'IdcardBackImage.png');
    }
    if(wechatimage){
        const imageStream = await fs.promises.readFile(wechatimage);
        formData.append('wechat_image_url', new Blob([imageStream], { type: 'image/png' }), 'WechatImage.png');
    }
    if(alipayimage){
        const imageStream = await fs.promises.readFile(alipayimage);
        formData.append('alipay_image_url', new Blob([imageStream], { type: 'image/png' }), 'AlipayImage.png');
    }
    formData.append('name', form.name);
    formData.append('id_card_number', form.idcard);
    formData.append('id_card_expiry_date', new Date(form.idcardexpire).toISOString().slice(0, 19).replace('T', ' '));
    formData.append('address', form.address);
    formData.append('paypal_id', form.paypal);
    formData.append('bank_account_number', form.bankcard);
    formData.append('bank_name', form.bankname);
    let url = (window as any).Constants.uploadUrl + '/users/update-personal-info-detail'
    let result = await axios.post(url,formData,{
        headers: {
            'Content-Type': 'multipart/form-data',
            "access-token": localStorage.getItem('token')
        }
    })
    if(result.data.code == 200){
        ElMessage.success(t('myupdateinfo.modify_success'))
        getData()
    }
}

// 切换敏感信息显示状态
const toggleSensitiveInfo = async () => {
    if (showSensitiveInfo.value) {
        // 如果当前是显示状态，直接隐藏
        showSensitiveInfo.value = false;
    } else {
        // 如果当前是隐藏状态，需要验证密码
        const now = Date.now();
        const timeSinceLastVerify = now - lastPasswordVerifyTime.value;
        
        if (timeSinceLastVerify < PASSWORD_VALID_DURATION) {
            // 30分钟内，直接显示
            showSensitiveInfo.value = true;
        } else {
            // 超过30分钟，需要重新验证密码
            await verifyPassword();
        }
    }
};

// 验证密码
const verifyPassword = async () => {
    try {
        const { value: password } = await ElMessageBox.prompt(
            t('personalcenter.enter_password_prompt'),
            t('personalcenter.password_verification'),
            {
                confirmButtonText: t('common.confirm'),
                cancelButtonText: t('common.cancel'),
                inputType: 'password',
                inputPlaceholder: t('personalcenter.password_placeholder'),
                inputValidator: (value) => {
                    if (!value) {
                        return t('personalcenter.password_required');
                    }
                    return true;
                },
            }
        );
        
        // 调用接口验证密码
        const isValid = await validatePasswordWithAPI(password);
        if (isValid) {
            showSensitiveInfo.value = true;
            lastPasswordVerifyTime.value = Date.now();
            ElMessage.success(t('personalcenter.password_verify_success'));
        } else {
            ElMessage.error(t('personalcenter.password_error'));
        }
    } catch (error) {
        // 用户取消输入
        console.log(t('personalcenter.password_input_cancelled'));
    }
};

// 调用API验证密码
const validatePasswordWithAPI = async (password: string): Promise<boolean> => {
    try {
        const url = (window as any).Constants.uploadUrl + '/users/check-personal-info-password';
        const result = await axios.post(url, {
            password: password
        }, {
            headers: {
                "access-token": localStorage.getItem('token')
            }
        });
        
        return result.data.code === 200;
    } catch (error) {
        console.error('密码验证接口调用失败:', error);
        ElMessage.error(t('personalcenter.password_verify_failed'));
        return false;
    }
};

// 页面离开时隐藏敏感信息
const handleBeforeUnload = () => {
    showSensitiveInfo.value = false;
};

// 页面可见性变化时的处理
const handleVisibilityChange = () => {
    if (document.hidden) {
        showSensitiveInfo.value = false;
    }
};

onMounted(() => {
    getData();
    // 监听页面离开事件
    window.addEventListener('beforeunload', handleBeforeUnload);
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
    // 清理事件监听器
    window.removeEventListener('beforeunload', handleBeforeUnload);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
});
//验证支付信息是否填写
function validatePaymentInfo() {
    //检测 微信 支付宝 银行卡and开户行 Paypal 是否填写 （最少填写一个）
    if (!imageUrl3.value && !imageUrl4.value && !form.bankcard && !form.paypal) {
        ElMessage.warning(t('myupdateinfo.payment_method_required'))
        return false
    }
    //填写了银行卡，则检测银行卡号和开户行是否填写
    if (form.bankcard && !form.bankname) {
        ElMessage.warning(t('myupdateinfo.bank_info_required'))
        return false
    }
    return true;
}
//验证身份证照片信息
function validateIdCardImages() {
    if (!imageUrl.value && !imageUrl2.value) {
        ElMessage.error(t('myupdateinfo.id_card_photos_required'));
        return false;
    }
    if (imageUrl.value && !imageUrl2.value) {
        ElMessage.error(t('myupdateinfo.id_card_back_required'));
        return false;
    }
    if (!imageUrl.value && imageUrl2.value) {
        ElMessage.error(t('myupdateinfo.id_card_front_required'));
        return false;
    }
    return true;
  }
const onSubmit = () => {
    formRef.value.validate((valid:any,fields:any) => {
        if (!valid) {
            // 获取第一个验证失败的字段的错误信息
            const firstError = fields[Object.keys(fields)[0]][0].message;
            ElMessage.error(`${t('myupdateinfo.form_validation_failed')}: ${firstError}`);
            return;
        }
        if (!validateIdCardImages()) return; // 验证身份证正反面图片是否同时上传
        if (!validatePaymentInfo()) return; // 验证支付信息是否填写
        submitForm()
    });
}
</script>
<style scoped>
.share-project-pic {
    width: 200px;
    height: 150px;
    display: block;
}

.share-project-upload {
    width: 200px;
    height: 150px;
    border: 2px dashed var(--ep-border-color);
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
    width: 200px;
    height: 150px;
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