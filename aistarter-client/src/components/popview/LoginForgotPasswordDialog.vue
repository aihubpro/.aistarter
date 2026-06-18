<template>
    <el-dialog v-model="dialogVisible" width="360px" center align-center :show-close="true" :close-on-click-modal="false"
 @open="openforgot" @close="closeforgot" class="relative">
        <template #title>
            <div class="h-20px">
                <div class="absolute w-328px">{{ dialogTitle }}</div>   
            </div>
        </template>
        <el-form ref="ruleFormRef" style="max-width: 600px" :model="ruleForm" status-icon :rules="rules"
            label-width="auto" class="demo-ruleForm">
            <el-form-item :label="$t('login.login_email')" prop="email">
                <el-input v-model="ruleForm.email" />
            </el-form-item>
            <el-form-item :label="$t('login.login_code')" prop="code">
                <el-row>
                    <el-input v-model="ruleForm.code" style="width: 140px;" />
                    <el-button type="primary" @click="sendCode" style="width: 100px;"
                        :disabled="codeDisabled">{{ identifyCodetext }}</el-button>
                </el-row>
            </el-form-item>
            <el-form-item :label="$t('login.login_new_password')" prop="password">
                <el-input v-model="ruleForm.password" type="password" />
            </el-form-item>
            <el-form-item :label="$t('login.login_confirm_password')" prop="confirmPassword">
                <el-input v-model="ruleForm.confirmPassword" type="password" />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button type="info" @click="submitForm(ruleFormRef)" class="w-100px">{{$t('login.login_submit')}}</el-button>
            <el-button type="info" @click="resetForm(ruleFormRef)" class="w-100px">{{$t('login.login_reset')}}</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, inject, reactive } from 'vue'
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from 'element-plus'
import axios from 'axios'
import validate from "../../validate";
import { useI18n } from 'vue-i18n';
const { ipcRenderer } = require('electron');

const {t} = useI18n()

const dialogVisible = ref(false)
const ruleFormRef = ref<FormInstance>()

let dialogTitle = ref(t('login.login_forget_password'))
let timer: any;
let countdown = 60;
const codeDisabled = ref(false);
const identifyCodetext = ref(t('login.login_code_text'));

const ruleForm = ref({
    email: '',
    code: '',
    password: '',
    confirmPassword: ''
})

//验证
const rules: FormRules = {
    email: [
        { required: true, message: t('login.login_email_null'), trigger: 'blur' },
        { type: 'email', message: t('login.login_email_url'), trigger: ['blur', 'change'] }
    ],
    code: [
        { required: true, message: t('login.login_code_null'), trigger: 'blur' }
    ],
    password: [
        { required: true, message: t('login.login_password_null'), trigger: 'blur' },
        { min: 6, message: t('login.login_password_min'), trigger: 'blur' },
        { max: 20, message: t('login.login_password_max'), trigger: 'blur' }
    ],
    confirmPassword: [
        { required: true, message: t('login.login_confirm_password_null'), trigger: 'blur' },
        { min: 6, message: t('login.login_password_min'), trigger: 'blur' },
        { max: 20, message: t('login.login_password_max'), trigger: 'blur' }
    ]
}

//提交表单
const submitForm = (formEl: FormInstance | undefined) => {
    if (!validate.validateEmail(ruleForm.value.email)) {
        ElMessage.error(t('login.login_email_tis'));
        return;
    }

    if (!validate.validatePassword(ruleForm.value.password)) {
        ElMessage.error(t('login.login_password_vali'));
        return;
    }

    if (ruleForm.value.confirmPassword !== ruleForm.value.password) {
        ElMessage.error(t('login.login_confirm_password_tis'));
        return;
    }

    if (!validate.validateCode(ruleForm.value.code)) {
        ElMessage.error(t('login.login_email_error'));
        return;
    }
    if (!formEl) return
    formEl.validate((valid) => {
        if (valid) {
            console.log('submit!')
            //判断验证码有效性
            let url = (window as any).Constants.uploadUrl + "/users/forgot-password-by-email";
            axios.post(url,{
                email: ruleForm.value.email,
                code: ruleForm.value.code,
                password: ruleForm.value.password,
            }).then(function (response) {
                //验证码正确
                if (response.data.code == 0) {
                    ElMessage.success(t('login.login_success'))
                    dialogVisible.value = false
                }else if(response.data.code == -1){
                    ElMessage.error(t('login.login_email_error'));
                }else if(response.data.code == -2){
                    ElMessage.error(t('login.login_email_not_exist'));
                    return;
                }else{
                    ElMessage.error(t('login.login_database_error'));
                    return;
                }
            })
            
        } else {
            ElMessage.error(t('login.login_format_error'))
        }
    })
}

//重置输入框
const resetForm = (formEl: FormInstance | undefined) => {
    if (!formEl) return
    formEl.resetFields()
}

//发送验证码
const sendCode = () => {
    //判断邮箱是否正确
    if (!validate.validateEmail(ruleForm.value.email)) {
        ElMessage.error(t('login.login_email_tis'));
        return;
    }
    //验证码倒计时
    if (timer) {
        return;
    }
    //禁用验证码
    codeDisabled.value = true;
    identifyCodetext.value = countdown + 's '+t('login.login_code_text_wait');
    timer = setInterval(() => {
        countdown--;
        identifyCodetext.value = countdown + 's '+t('login.login_code_text_wait');
        if (countdown == 0) {
            clearInterval(timer);
            identifyCodetext.value = t('login.login_code_text');
            countdown = 60;
            codeDisabled.value = false;
            timer = null;
        }
    }, 1000);

    // 发送验证码
    let url = (window as any).Constants.uploadUrl + "/auth/send-code";
    // 核心内容
    axios.post(url, {
        email: ruleForm.value.email
    }).then(function (response) {
    console.log(t('login.login_code_success'), response.data);
    ElMessage.success(t('login.login_code_success'));
  }).catch(function (error) {
    console.error(t('login.login_code_error'), error);
    // 处理注册失败的情况，例如显示错误信息
    ElMessage.error(t('login.login_code_error') + error.request.response);
  })

}

const resetData = () => {
    ruleForm.value = {
        email: '',
        code: '',
        password: '',
        confirmPassword: '',
    }
    timer = null
    countdown = 60
    identifyCodetext.value = t('login.login_code_text')
    codeDisabled.value = false
}
const closetimer = () => {
    clearInterval(timer)
    timer = null
}

//打开界面
const openforgot = () => {
    closetimer()
    resetData()
}
//关闭界面
const closeforgot = () => {
    closetimer()
    resetData()
}

defineExpose({
    openLoginForgotPasswordDialog() {
        dialogVisible.value = true
    }
})
</script>

<style scoped>
.update-btn {
    position: absolute;
    right: 10px;
    bottom: 20px;
    float: right;
    opacity: 0.3;
}
</style>