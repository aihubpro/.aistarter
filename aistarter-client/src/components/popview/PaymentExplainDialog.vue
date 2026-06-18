<template>
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="80%" center :show-close="false"
        :close-on-click-modal="false">
        <div >
            <iframe class="w-full h-[60vh]" scrolling='auto' width="100%" :src="agreementurl"></iframe>
        </div>
        <template #footer>
            <el-button type="primary" @click="dialogVisible = false" :disabled="disabled">{{ time }}同意</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, inject } from 'vue'
import { ElMessage } from "element-plus";
import axios from 'axios'

const dialogVisible = ref(false)
const dialogTitle = ref('')

const agreementurl = ref('')

let disabled = ref(true)

let time = ref("")

defineExpose({
    openPaymentExplain(url) {
        dialogVisible.value = true;
        agreementurl.value = url
        disabled.value = true
        time.value = "(3) "
        let countdown = 2;
        const interval = setInterval(() => {
            time.value = "(" + countdown + ") "
            countdown--;
            if (countdown < 0) {
                clearInterval(interval);
                time.value = ""
                disabled.value = false
            }
        }, 1000);
    }
})
</script>

<style scoped>
body {
    overflow-x:auto;
    overflow-y:hidden;
}

.payment-option {
    position: relative;
    overflow: visible;
    /* 确保发光效果不会被裁剪 */
    padding: 0px;
    margin: 20px;
}

.payment-option.selected {
    box-shadow: 0 0 10px 2px rgba(64, 158, 255, 0.7);
    /* 发光效果 */
}

.payment-option .icon {
    cursor: pointer;
    transition: all 0.3s ease;
}

.payment-option .icon:hover {
    transform: scale(1.05);
}
</style>