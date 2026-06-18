<template>
    <BasicModal v-bind="$attrs" @register="register" width="800px" @ok="handleOk" @cancel="handleCancel" okText="确认" cancelText="取消">
        <a-form :model="form" :rules="rules" ref="formRef" :label-col="{ span: 5 }" :wrapper-col="{ span: 20 }">
            <a-row>
                <a-col :span="12">
                    <a-form-item label="公司名称" name="company_name">
                        <a-input v-model:value="form.company_name" type="" :disabled='!isadd' placeholder="共创者公司名称" showCount maxlength="300" />
                    </a-form-item>
                    <a-form-item label="机器码" name="machine_id">
                        <a-input-search v-model:value="form.machine_id" placeholder="共创者服务器机器码" showCount maxlength="300" @search="getMacID" enter-button="获取"/>
                    </a-form-item>
                    <a-form-item label="公司域名" name="domain_name">
                        <a-input v-model:value="form.domain_name" type="" :disabled='!isadd' placeholder="共创者公司域名" showCount maxlength="300" />
                    </a-form-item>
                    <a-form-item label="联系人" name="name">
                        <a-input v-model:value="form.name" type="" :disabled='!isadd' placeholder="联系人姓名" showCount maxlength="300" />
                    </a-form-item>
                    <a-form-item label="软件名称" name="software_name">
                        <a-input v-model:value="form.software_name" type="" :disabled='!isadd'  placeholder="共创者软件名称" showCount maxlength="300" />
                    </a-form-item>
                    <a-form-item label="邮箱" name="email">
                        <a-input v-model:value="form.email" type="" :disabled='!isadd'  placeholder="联系人邮箱" showCount maxlength="300" />
                    </a-form-item>
                    <a-form-item label="手机号" name="phone">
                        <a-input v-model:value="form.phone" type="" placeholder="联系人手机号" showCount maxlength="11" />
                    </a-form-item>
                    <a-form-item label="协议" name="protocol">
                        <a-select v-model:value="form.protocol">
                            <a-select-option :value="item.value" v-for="(item, index) in collabprotocol" :key="index">{{ item.label }}</a-select-option>
                        </a-select>
                    </a-form-item>
                    <a-form-item label="项目类型" name="coll_type">
                        <a-select v-model:value="form.coll_type">
                            <a-select-option :value="item.value" v-for="(item, index) in collabtype" :key="index">{{ item.label }}</a-select-option>
                        </a-select>
                    </a-form-item>
                    <a-form-item label="配置信息">
                        <a-button @click="getConfig">获取配置</a-button>
                        <a-textarea v-model:value="configdata" placeholder="配置信息" readonly :rows="6"/>
                    </a-form-item>
                </a-col>
                <a-col :span="12">
                    <a-form-item label="创建时间">
                        <a-date-picker 
                            v-model:value="form.create_time" 
                            :show-time="{ format: 'HH:mm:ss' }"
                            format="YYYY-MM-DD HH:mm:ss"
                            placeholder="选择日期和时间" 
                            style="width: 100%"
                            disabled
                        />
                    </a-form-item>
                    <a-form-item label="结束时间" name="expiry_time">
                        <a-date-picker 
                            v-model:value="form.expiry_time" 
                            :show-time="{ format: 'HH:mm:ss' }"
                            format="YYYY-MM-DD HH:mm:ss"
                            placeholder="选择日期和时间" 
                            style="width: 100%"
                        />
                    </a-form-item>
                    <a-form-item label="公钥">
                        <a-textarea v-model:value="form.public_key" type="" placeholder="公钥" readonly :rows="6 " @dblclick="handleDblClickPublicKey"/>
                    </a-form-item>
                    <a-form-item label="封禁原因">
                        <a-textarea v-model:value="form.ban_reason" type="" placeholder="封禁原因" showCount maxlength="300" :rows="6"/>
                    </a-form-item>
                    <a-form-item label="封禁时间">
                        <a-date-picker 
                            v-model:value="form.ban_end_time" 
                            :show-time="{ format: 'HH:mm:ss' }"
                            format="YYYY-MM-DD HH:mm:ss"
                            placeholder="选择日期和时间" 
                            style="width: 100%"
                        />
                    </a-form-item>
                    <a-form-item label="服务器状态" name="state">
                        <a-select v-model:value="form.state" @change="handleStatusChange">
                            <a-select-option :value="item.value" v-for="(item, index) in statetype" :key="index">{{ item.label }}</a-select-option>
                        </a-select>
                    </a-form-item>
                    <a-form-item label="共创者状态" name="server_status">
                        <a-select v-model:value="form.server_status" @change="handleServerStatusChange">
                            <a-select-option :value="item.value" v-for="(item, index) in serverstatetype" :key="index">{{ item.label }}</a-select-option>
                        </a-select>
                    </a-form-item>
                </a-col>
            </a-row>
        </a-form>
    </BasicModal>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { BasicModal, useModalInner } from '/@/components/Modal';
import dayjs from 'dayjs';
import { message } from 'ant-design-vue';
import { addCollab, editCollab,updateCollabSeverState,getCollabMachineCode,getEncryptData } from './Collab.api'
import axios from 'axios';
const configdata = ref('')
async function getConfig() {
    const coconfig = {
        "server_status":form.server_status, 
        "ban_end_time":form.ban_end_time,
        "ban_reason":form.ban_reason,
    }
    const res = await getEncryptData(coconfig, form.id);
    if(res.code == 0){
        configdata.value = JSON.stringify(res.data,null,2);
        message.success('获取成功');
        return;
    }
}

async function getMacID() {
    const res = await getCollabMachineCode(form);
    if(res.code == 0){
        form.machine_id = res.data.machine_code;
        message.success('获取成功');
        return;
    }
    message.error('获取失败');
}
//复制公钥
function handleDblClickPublicKey(e) {
    // 全选内容
    e.target.select && e.target.select();
    // 复制到剪贴板
    navigator.clipboard.writeText(form.public_key)
      .then(() => message.success('已复制'))
      .catch(() => message.error('复制失败'));
  }
//协议 状态
const collabprotocol = ref([
    { value: 'http://', label: 'http' },
    { value: 'https://', label: 'https' },
])
// 项目类型 状态
const collabtype = ref([
    { value: '1', label: '年度' },
    { value: '2', label: '永久' },
]);
const statetype = ref([
    { value: '0', label: '正常' },
    { value: '1', label: '永久封禁' },
    { value: '2', label: '待更新' },
]);
const serverstatetype = ref([
    { value: '0', label: '正常' },
    { value: '1', label: '过期' },
    { value: '2', label: '异常' },
    { value: '3', label: '封禁' },
    { value: '4', label: '替换为我们的软件' },
]);

const handleStatusChange = (value:any) => {
    if(value == 1){
        form.server_status = '3';
    }
}
const handleServerStatusChange = (value:any) => {
    if(value == 3){
        form.state = '1';
    }
}

// 表单数据
const formRef = ref();
const form = reactive({
    id:0,
    company_name: '',
    machine_id:'',
    domain_name:'',
    name:'',
    software_name:'',
    email:'',
    phone:'',
    protocol:'',
    coll_type:'1',
    create_time:null,
    expiry_time:null,
    ban_reason:'',
    ban_end_time:null,
    state:'0',
    public_key:'',
    server_status:'0',
});

const rules = {
    company_name: [{ required: true, message: '请输入公司名称', trigger: 'blur' }],
    domain_name: [{ required: true, message: '请输入公司域名', trigger: 'blur' }],
    name: [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }],
    software_name: [{ required: true, message: '请输入软件名称', trigger: 'blur' }],
    email: [
        { required: true, message: '请输入邮箱地址', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
    ],
    phone: [
        { required: true, message: '请输入手机号', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
    ],
    coll_type: [{ required: true, message: '请选择项目类型', trigger: 'change' }],
    expiry_time: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
    state: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

// 判断是否是新增
const isadd = ref(false);

const emit = defineEmits(["closeWindow"]);

const [register, { closeModal, setModalProps }] = useModalInner((data) => {
    if(data.isadd?true:false){
        isadd.value = true;
        setModalProps({ title: `添加新的共创者信息` });
    }else{
        isadd.value = false;
        // 你可以在这里处理传递的userId
        console.log('接收到的用户ID:', data);
        setModalProps({ title: `编辑共创者 ${data.company_name} 的相关信息` });
        // 写入数据到表单
        form.id = data.id;
        form.company_name = data.company_name;
        form.machine_id = data.machine_id;
        form.domain_name = data.domain_name;
        form.name = data.name;
        form.software_name = data.software_name;
        form.email = data.email;
        form.phone = data.phone;
        form.protocol = data.protocol;
        form.coll_type = String(data.coll_type);
        form.create_time = data.create_time ? dayjs(data.create_time) as any : null;
        form.expiry_time = data.expiry_time ? dayjs(data.expiry_time) as any : null;
        form.ban_reason = data.ban_reason;
        form.ban_end_time = data.ban_end_time ? dayjs(data.expiry_time) as any : null;
        form.state = String(data.state);
        form.public_key = data.public_key;
        form.server_status = String(data.server_status);
    }
});
async function handleOk() {
    try {
        // 表单校验
        await formRef.value.validate();
        const submitForm = { ...form };
        // 处理时间格式
        if (isadd.value) {
            submitForm.create_time = dayjs().format('YYYY-MM-DD HH:mm:ss') as any;
        }
        submitForm.expiry_time = submitForm.expiry_time ? dayjs(submitForm.expiry_time).format('YYYY-MM-DD HH:mm:ss') as any : null;
        submitForm.ban_end_time = submitForm.ban_end_time ? dayjs(submitForm.ban_end_time).format('YYYY-MM-DD HH:mm:ss') as any : null;
        submitForm.state = Number(submitForm.state) as any;
        submitForm.coll_type = Number(submitForm.coll_type) as any;
        submitForm.server_status = Number(submitForm.server_status) as any;
        console.log(submitForm);
        if(isadd.value){
            await addCollab(submitForm);
            message.success("项目添加成功");
        }else{
            await editCollab(submitForm);
            const coconfig = {
                "server_status":submitForm.server_status, 
                "ban_end_time":submitForm.ban_end_time,
                "ban_reason":submitForm.ban_reason,
            }
            //远程更新共创者的服务器状态信息
            const req = await updateCollabSeverState(submitForm,coconfig)
            if(req.code == 0){
                message.success("远程修改成功");
            }else{
                message.error(req.msg);
            }
            message.success("项目修改成功");
        }
        emit("closeWindow")
        resetDate();
        closeModal();
    } catch (error: any) {
        message.error('项目修改失败:'+error.errorFields[0].errors[0]);
    }
}
//重置数据
const resetDate = () => {
    form.company_name='';
    form.machine_id='';
    form.domain_name='';
    form.name='';
    form.software_name='';
    form.email='';
    form.phone='';
    form.coll_type='1';
    form.create_time=null;
    form.expiry_time=null;
    form.ban_reason='';
    form.ban_end_time=null;
    form.state='0';
    form.server_status='0';
}

function handleCancel() {
    resetDate();
    closeModal();
}
</script>
<style scoped>
.avatar-uploader>>>.ant-upload.ant-upload-select-picture-card {
    width: 100%;
    height: 100%;
}
</style>