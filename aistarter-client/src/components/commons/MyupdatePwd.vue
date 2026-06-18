<template>
    <el-form :model="form">
        <el-descriptions :title="$t('personalcenter.updatapwd')" border>
            <el-descriptions-item :label="$t('personalcenter.oldpwd')" :span="3">
                <el-input v-model="form.oldpassword" type="password"></el-input>
            </el-descriptions-item>
            <el-descriptions-item :label="$t('personalcenter.newpwd')" :span="3">
                <el-input v-model="form.newpassword" type="password"></el-input>
            </el-descriptions-item>
            <el-descriptions-item :label="$t('personalcenter.confirmpwd')" :span="3">
                <el-input v-model="form.confirmPassword" type="password"></el-input>
            </el-descriptions-item>
        </el-descriptions>
        <el-button type="primary" @click="onSubmit">{{ $t('personalcenter.submit') }}</el-button>
    </el-form>
</template>

<script setup lang="ts">
import { reactive, PropType, ref, Ref } from 'vue';
import { ElMessage } from 'element-plus';
import validate from "../../validate";
import axios from 'axios'
import { useI18n } from "vue-i18n";
const { t } = useI18n();

const form = reactive({
    oldpassword: '',
    newpassword: '',
    confirmPassword: '',
});

const onSubmit = async () => {
    if (!validate.validatePassword(form.newpassword)) {
        ElMessage.error(t('personalcenter.login_password_vali'));
        return;
    }
    if (form.confirmPassword !== form.newpassword) {
        ElMessage.error(t('personalcenter.confirm_password_vali'));
        return;
    }
    let url = (window as any).Constants.uploadUrl + "/users/update-password";
    try{
        const response = await axios.post(url, 
        { oldpassword:form.oldpassword, password:form.newpassword},
        { 
            headers: { 
                "access-token": localStorage.getItem('token')
            } 
        });
        console.log(response.data.code)
        if(response.data.code==0){
            ElMessage.success(t('personalcenter.update_success'))
            form.oldpassword = ''
            form.newpassword = ''
            form.confirmPassword = ''
        }else if(response.data.code==-2){
            ElMessage.error(t('personalcenter.oldpwd_error'))
        }else{
            ElMessage.error(t('personalcenter.update_error'))
        }
    }catch(e){
        console.log(e)
    }
    console.log("onSubmit")
};
</script>

<style scoped></style>