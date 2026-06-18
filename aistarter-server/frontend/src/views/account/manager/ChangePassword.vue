<template>
    <BasicModal v-bind="$attrs" @register="register" title="重置密码" @ok="handleOk" @cancel="handleCancel" okText="确认" cancelText="取消">
        <a-form ref="formRef">
            <a-form-item label="输入新密码">
                <a-input v-model:value="confirmPassword" type="text" placeholder="输入新密码" />
            </a-form-item>
        </a-form>
    </BasicModal>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { BasicModal, useModalInner } from '/@/components/Modal';
import { message } from 'ant-design-vue';
import { resetPassword } from './RegUser.api'
import { Pass } from 'codemirror';
//   import { changePasswordById } from '/@/api/user'; // 假设这是你的API接口

const confirmPassword = ref("")
const userid = ref("");

const [register, { closeModal, setModalProps }] = useModalInner((data) => {
    // 你可以在这里处理传递的userId
    console.log('接收到的用户ID:', data);
    userid.value = data.id
    setModalProps({ title: `重置用户 ${data.username} 的密码` });
});
// 校验密码
function validatePassword(value: string): boolean {
    const regPassword: RegExp = /^(?!\D+$)(?![^a-zA-Z]+$)\S{6,20}$/;
    return regPassword.test(value);
}

async function handleOk() {
    // try {
        // console.log(confirmPassword.value)
        // console.log(userid.value)
        // console.log(validatePassword(confirmPassword.value))
        
        if (validatePassword(confirmPassword.value)) {
            
            await resetPassword({
                userid:userid.value,
                password: confirmPassword.value,
            }).then(({data})=>{
                message.success('密码修改成功');
                closeModal();
            }).catch(error => {
                message.error('密码修改失败')
            })
        } else {
            message.error('密码格式错误')
        }
    // } catch (error) {
    //     message.error('密码修改失败');
    // }
}

function handleCancel() {
    closeModal();
}
</script>