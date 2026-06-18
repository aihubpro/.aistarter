<template>
  <el-dialog v-model="isDialogVisible" append-to-body align-center custom-class="login_from" width="360px"
    style="padding: 20px; border-radius: 10px;" @open="openlogin" @close="closelogin">
    <div class="login_layout">
      <el-tabs v-model="tabIndex" type="card">
        <el-tab-pane :label="$t('login.login_login')" name="login">
          <el-form label-position="right" label-width="60px" style="width: auto;" class="login_form">
            <el-form-item :label="$t('login.login_email')">
              <el-input v-model="form.Email" />
            </el-form-item>
            <el-form-item :label="$t('login.login_password')">
              <el-input type="password" v-model="form.Password" />
            </el-form-item>
            <!-- 找回密码 -->
            <el-button type="text" class="absolute right-0" @click="forgetPassword">{{ $t('login.login_forget_password') }}</el-button>
            <el-button type="primary" class="login_btn" @click="login" @keyup.enter="login">
              {{ $t('login.login_login') }}
            </el-button>
          </el-form>
        </el-tab-pane>

        <el-tab-pane :label="$t('login.login_register')" name="register">
          <el-form label-position="right" label-width="100px" style="max-width: 460px" class="login_form">
            <el-form-item :label="$t('login.login_username')">
              <el-input v-model="registerForm.rUserName" />
            </el-form-item>
            <el-form-item :label="$t('login.login_email')">
              <el-input v-model="registerForm.rEmail" />
            </el-form-item>
            <el-form-item :label="$t('login.login_password')">
              <el-input type="password" v-model="registerForm.rPassword" />
            </el-form-item>
            <el-form-item :label="$t('login.login_confirm_password')">
              <el-input type="password" v-model="registerForm.confirmPassword" @blur="confirmFunc" />
            </el-form-item>
            <el-form-item :label="$t('login.login_code')">
              <el-row>
                <el-input type="text" v-model="registerForm.identifyCode" style="width: 110px;" />
                <el-button style="width: 100px;margin-left: 6px;" type="primary" @click="getIdentifyCode" plain :disabled="codeDisabled">
                  {{ registerForm.identifyCodetext }}
                </el-button>
              </el-row>
            </el-form-item>
            <el-form-item :label="$t('login.login_invite_code')">
              <el-input v-model="registerForm.inviteCode" :placeholder="$t('login.login_invite_code_placeholder')" maxlength="20" show-word-limit clearable />
            </el-form-item>
            <!-- 勾选框（用户说明） -->
            <div class="flex items-center">
              <el-checkbox v-model="subScriptionInformation" label="" size="large" />
              <div class="text-#999 font-size-14px">
                {{$t('login.login_privacy_policy_text')}}《<a style="cursor: pointer;" @click="openPaymentExplain(paymentExplainUrl)">{{ $t('login.login_user_agreement') }}</a>》。
              </div>
            </div>
            <el-button type="primary" class="login_btn" @click="register">
              {{ $t('login.login_register') }}
            </el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { reactive, ref, inject } from "vue";
import { ElMessage } from "element-plus";
import validate from "../../validate";
import axios from 'axios'
import { useI18n } from "vue-i18n";
const { ipcRenderer } = require('electron');

const { getUserInfo, openPaymentExplain,openLoginForgotPasswordDialog,globalHide } = inject('main') as any;

const {t} = useI18n()

//忘记密码
const forgetPassword = () => {
  // ElMessage.info('请联系管理员')
  openLoginForgotPasswordDialog()
}
//协议链接
const paymentExplainUrl = ref((window as any).Constants.uploadUrl + '/user_agreement.html')
//用户协议
const subScriptionInformation = ref(true)

const openlogin = () => {
  window.addEventListener("keyup", keyboardEvent)
}
const closelogin = () => {
  clearInterval(timer)
  countdown = 60
  timer = null
  codeDisabled.value = false
  registerForm.identifyCodetext = t('login.login_code_text');
  window.removeEventListener("keyup", keyboardEvent)
}
const keyboardEvent = (event: any) => {
  if (event.key === 'Enter') {
    login();
  }
}


// const { dialogVisible } = defineProps(['dialogVisible']);

const isDialogVisible = ref(false);
const tabIndex = ref("login");

const form = reactive({
  Email: "",
  Password: "",
  // isAgree: 0,
});

const registerForm = reactive({
  rUserName: "",
  rEmail: "",
  rPassword: "",
  confirmPassword: "",
  identifyCode: "",
  inviteCode: "",
  identifyCodetext:t('login.login_code_text')
  // rAgree: 0,
});

// 登录
const login = () => {
  console.log(form);

  if (!validate.validateEmail(form.Email)) {
    ElMessage.error(t('login.login_email_tis'));
    return;
  }

  let url = (window as any).Constants.uploadUrl + "/auth/sign-in";
  //注意数据是保存到json对象的params属性
  axios.post(url, {
    email: form.Email,
    password: form.Password,
  }).then(function (response: any) {

    isDialogVisible.value = false;
    form.Email = "";
    form.Password = "";

    ElMessage.success(t('login.login_login_success'));
    console.log(response.data);

    localStorage.setItem('token', response.data.token)

    ipcRenderer.send('set-config-token', response.data.token);

    getUserInfo()

  }).catch(function (error) {

    localStorage.removeItem('token');

    ipcRenderer.send('set-config-token', "");

    console.error(t('login.login_login_error'), error);

    let errorReq = error.request
    // 处理注册失败的情况，例如显示错误信息
    if (errorReq.status == 400) {
      ElMessage.error(t('login.login_and_userpassworderror'));
    } else {
      //错误未必就这两种的，其他错误统一报服务器错误
      ElMessage.error(t('login.login_servererror'));
    }

  })

};

// 注册
const register = () => {

  console.log(registerForm.rEmail);
  if (!validate.validateEmail(registerForm.rEmail)) {
    ElMessage.error(t('login.login_email_tis'));
    return;
  }

  if (!validate.validatePassword(registerForm.rPassword)) {
    ElMessage.error(t('login.login_password_vali'));
    return;
  }

  if (registerForm.confirmPassword !== registerForm.rPassword) {
    ElMessage.error(t('login.login_confirm_password_tis'));
    return;
  }

  if (!validate.validateCode(registerForm.identifyCode)) {
    ElMessage.error(t('login.login_email_error'));
    return;
  }

  if (!validate.validateUsername(registerForm.rUserName)) {
    ElMessage.error(t('login.login_username_vali'));
    return;
  }
  
  //是否同意用户协议
  if(!subScriptionInformation.value){
    ElMessage.error(t('login.login_user_agreement_message'));
    return;
  }


  let url = (window as any).Constants.uploadUrl + "/auth/sign-up";
  //注意数据是保存到json对象的params属性
  axios.post(url, {
    email: registerForm.rEmail,
    password: registerForm.rPassword,
    username: registerForm.rUserName,
    code: registerForm.identifyCode,
    inviteCode: registerForm.inviteCode,
  }).then(function (response) {
    console.log(t('login.login_register_success'), response.data);
    // 处理注册成功的情况，例如显示成功信息或者跳转到其他页面
    ElMessage.success(t('login.login_register_success'));
    registerForm.rEmail = "";
    registerForm.rPassword = "";
    registerForm.rUserName = "";
    registerForm.confirmPassword = "";
    registerForm.identifyCode = "";
    registerForm.inviteCode = "";
    registerForm.identifyCodetext = t('login.login_code_text');
    clearInterval(timer);
    timer = null;
    countdown = 60;
    codeDisabled.value = false;
    tabIndex.value = "login";
  }).catch(function (error) {
    console.error(t('login.login_register_error'), error.request.response);
    // 处理注册失败的情况，例如显示错误信息
    //The email has been used! //邮箱重复
    //The username has been used! //用户名重复
    //Verification code error //验证码错误
    //Invalid invite code //邀请码错误
    if(error.request.response.indexOf("The email has been used!") != -1){
      ElMessage.error(t('login.login_register_error_email'));
    }else if(error.request.response.indexOf("The username has been used!") != -1){
      ElMessage.error(t('login.login_register_error_username'));
    }else if(error.request.response.indexOf("Verification code") != -1){
      ElMessage.error(t('login.login_email_error'));
    }else if(error.request.response.indexOf("Invalid invite code") != -1){
      ElMessage.error(t('login.login_invite_code_error'));
    }
  })

}

let timer:any;
let countdown = 60;
const codeDisabled = ref(false);
// 发送验证码
const getIdentifyCode = () => {

  console.log(registerForm.rEmail);
  if (!validate.validateEmail(registerForm.rEmail)) {
    ElMessage.error(t('login.login_email_tis'));
    return;
  }
  //验证码倒计时
  if(timer){
    return;
  }
  //禁用验证码
  codeDisabled.value = true;
  registerForm.identifyCodetext = countdown +'s '+t('login.login_code_text_wait');
  timer = setInterval(() => {
    countdown--;
    registerForm.identifyCodetext = countdown +'s '+t('login.login_code_text_wait');
    if (countdown == 0) {
      clearInterval(timer);
      registerForm.identifyCodetext = t('login.login_code_text');
      countdown = 60;
      codeDisabled.value = false;
      timer = null;
    }
  }, 1000);

  let url = (window as any).Constants.uploadUrl + "/auth/send-code";
  //注意数据是保存到json对象的params属性
  axios.post(url, {
    email: registerForm.rEmail
  }).then(function (response) {
    console.log(t('login.login_code_success'), response.data);
    ElMessage.success(t('login.login_code_success'));
  }).catch(function (error) {
    console.error(t('login.login_code_error'), error.request.response);
    // 处理注册失败的情况，例如显示错误信息
    //sending too frequently! //发送频繁
    if(error.request.response.indexOf("sending too frequently!") != -1){
      ElMessage.error(t('login.login_code_error_sending_too_frequently'));
    }
    // ElMessage.error(t('login.login_code_error') + error.request.response);
  })

}

// 确认密码
const confirmFunc = () => {
  if (registerForm.confirmPassword !== registerForm.rPassword) {
    ElMessage.error(t('login.login_confirm_password_tis'));
  }
};
function openDialog(isOpen: boolean) {
  isDialogVisible.value = isOpen;
  registerForm.identifyCodetext = t('login.login_code_text');
}

defineExpose({
  openDialog
})

</script>


<style>
.login_layout {
  width: 100%;
}

.login_btn {
  width: 100px;
}

.login_form {
  text-align: center;
}

.login_checkbox {
  margin-left: 7px;
}

.login_input_width {
  width: 165px;
}

.login_from .ep-dialog__body {
  padding: 0px;
}

.login_from .ep-dialog__header {
  display: none;
}

/* .ep-dialog .no-header-dialog .el-dialog__header{
  display: none;
} */
/* 
:deep(.login_from .el-dialog__body){
  padding: 0px;
} */
</style>
