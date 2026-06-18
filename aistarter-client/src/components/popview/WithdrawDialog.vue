
<template>
    <el-dialog v-model="dialogVisible" :title="t('withdrawdialog.dialog_title')" width="400px" center :show-close="false"
        :close-on-click-modal="false">
        <el-form :model="form" :rules="rules" ref="formRef">
            <el-form-item :label="t('withdrawdialog.amount_label')" prop="amount">
                <el-input v-model="form.amount" :placeholder="t('withdrawdialog.amount_placeholder')" type="text" @blur="onAmountBlur">

                </el-input>
            </el-form-item>
            <el-form-item :label="t('withdrawdialog.method_label')" prop="type">
                <el-select v-model="form.type" :placeholder="t('withdrawdialog.method_placeholder')">
                <el-option v-for="item in withdrawTypes" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="handleClose">{{ t('withdrawdialog.cancel_button') }}</el-button>
            <el-button type="primary" @click="handleWithdraw">{{ t('withdrawdialog.confirm_button') }}</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, inject,reactive } from 'vue'
import { ElMessage } from "element-plus";
import axios from 'axios'
import { useRouter } from "vue-router";
import { useI18n } from 'vue-i18n'

const router = useRouter();
const { t } = useI18n()

const formRef = ref()
const rules = {
  amount: [
    { required: true, message: t('withdrawdialog.validation.amount_required'), trigger: 'blur' },
    { validator: (rule, value, callback) => {
        const num = Number(value)
        if (isNaN(num)) return callback(new Error(t('withdrawdialog.validation.amount_must_be_number')))
        if (num < amountmin.value || num > amountmax.value) return callback(new Error(t('withdrawdialog.validation.amount_range', { min: amountmin.value, max: amountmax.value })))
        if (!/^\d+(\.\d{1,2})?$/.test(value)) return callback(new Error(t('withdrawdialog.validation.amount_decimal')))
        callback()
      }, trigger: 'blur' }
  ],
  type: [
    { required: true, message: t('withdrawdialog.validation.method_required'), trigger: 'change' } 
  ]
}
function onAmountBlur() {
    const amount = Number(form.amount)
    if (amount < amountmin.value) {
        ElMessage.error(t('withdrawdialog.messages.min_amount_error', { min: amountmin.value }))
    } else if (amount > amountmax.value) {
        ElMessage.error(t('withdrawdialog.messages.max_amount_error', { max: amountmax.value }))
        form.amount = amountmax.value
    }
    if (form.amount) {
      form.amount = Number(form.amount).toFixed(2)
    }
}
const form = reactive({
    type: 'wechat',
    amount: ''
})
const withdrawTypes = ref([])
// [
//   { label: t('withdrawdialog.withdraw_types.wechat'), value: 'wechat' },
//   { label: t('withdrawdialog.withdraw_types.alipay'), value: 'alipay' },
//   { label: t('withdrawdialog.withdraw_types.bank'), value: 'bank' },
//   { label: t('withdrawdialog.withdraw_types.paypal'), value: 'paypal' },
//   { label: t('withdrawdialog.withdraw_types.enterprise'), value: 'enterprise' },
// ]

const dialogVisible = ref(false)

const handleClose = () => {
    dialogVisible.value = false
}

let callback = null
const handleWithdraw = async () => {
    if (Number(form.amount) < Number(amountmin.value)) {
        ElMessage.error(t('withdrawdialog.messages.min_amount_error', { min: amountmin.value }));
        return;
    }
    if (Number(form.amount) > Number(amountmax.value)) {
        ElMessage.error(t('withdrawdialog.messages.max_amount_error', { max: amountmax.value }));
        return;
    }
    let url = window.Constants.uploadUrl + '/users/withdraw'
    let result = await axios.post(url,{
        withdrawBalance: form.amount,
        method: form.type
    },{
        headers: {
            "access-token": localStorage.getItem('token')
        }
    })
    if(result.data.code == 200){
        ElMessage({
            type:'success',
            message: t('withdrawdialog.messages.success_message', { amount: form.amount }),
        })
        handleClose()
        if (typeof callback === 'function') {
            callback()
        }
    }else{
        ElMessage.error(result.data.msg)
    }
}

const amountmin = ref(100)
const amountmax = ref(9999)
async function openWithdrawDialog(min,max,cb) {
    let req = await axios.post(window.Constants.uploadUrl + '/users/withdraw-type-info',{},{
        headers: {
            "access-token": localStorage.getItem('token')
        }
    })
    if(req.data.code == 200){
        withdrawTypes.value = req.data.data
        form.type = withdrawTypes.value[0].value
        amountmin.value = min
        amountmax.value = max
        dialogVisible.value = true
        callback = cb
    }else{
        dialogVisible.value = false
        ElMessage.error(req.data.msg)
        router.push({
            query: {
                ...router.currentRoute.value.query,
                id: '1-5-2', // 对应个人信息编辑的菜单项
                val: 'updateInfo'
            }
        })
    }
    
}

defineExpose({
    openWithdrawDialog
})
</script>

<style scoped>
</style>
