<template>
    <BasicModal v-bind="$attrs" @register="register" width="800px" @ok="handleOk" @cancel="handleCancel" okText="确认" cancelText="取消">
        <a-row>
            <a-col :span="12">
                <div class="flex justify-center align-center">
                    <a-upload name="avatar" ref="fileimage" list-type="picture-card" class="avatar-uploader h-250px"
                        :show-upload-list="false" :before-upload="beforeUpload" @change="handleChange">
                        <img v-if="imageUrl" :src="imageUrl" alt="avatar" style="width: 100%; height: 100%;" />
                        <div v-else>
                            <a-icon :type="loading ? 'loading' : 'plus'" />
                            <div class="ant-upload-text">上传图片</div>
                        </div>
                    </a-upload>
                </div>
                <div class="mt-6"></div>
                <a-form :model="formGetB" ref="formRef" v-for="(item, index) in formGetB" :key="index">
                    <a-form-item :label="item.label">
                        <!-- 审核状态 -->
                        <a-tag :color="item.color" v-if="item.component === 'Tag'">{{ item.value }}</a-tag>
                        <!-- 筛选分类 -->
                        <!-- 待完成 -->
                        <FilterButton v-if="item.component === 'Dropdown'" :itemsAppoin="filterbtn"
                            :importData="importData" @clickItem="clickItem" @clickClear="clickClear"
                            @CloseTab="CloseTab" ></FilterButton>
                    </a-form-item>
                </a-form>
            </a-col>
            <a-col :span="12">
                <a-form :model="formGet" ref="formRef" v-for="(item, index) in formGet" :key="index">
                    <a-form-item :label="item.label" v-if="!item.hidden">
                        <a-input v-model:value="item.value" type="text" :disabled="item.disabled"
                            v-if="item.component === 'Input'" />
                        <a-input-number v-model:value="item.value" type="text" :disabled="item.disabled"
                            v-if="item.component === 'Number'" :min="item.min" :precision="2" />
                        <a-radio-group v-model:value="item.value" @change="handleVipChange(item.value)"
                            v-show="item.component === 'Radio'" v-for="(radio, index) in item.componentProps.options">
                            <a-radio-button :value="radio.value">{{ radio.label }}</a-radio-button>
                        </a-radio-group>
                    </a-form-item>
                </a-form>
            </a-col>
        </a-row>
        <a-form :model="form" :rules="rules" ref="formRef">
            <a-form-item label="项目描述" prop="projectDesc">
                <a-textarea v-model:value="form.projectDesc" type="text" placeholder="请输入项目描述" showCount maxlength="200" :disabled="true" />
            </a-form-item>
            <!--<a-form-item label="推荐安装" prop="resinstall">
                <a-input v-model:value="form.resInstall" type="text" placeholder="请输入推荐安装地址" showCount maxlength="200"/>
            </a-form-item>-->
            <a-form-item label="项目介绍" prop="ProjectOverview">
                <a-textarea v-model:value="form.ProjectOverview" type="text" placeholder="请输入项目介绍" showCount maxlength="5000" />
            </a-form-item>
            <a-form-item label="相关链接" prop="projectUrl">
                <a-textarea v-model:value="form.projectUrl" type="text" placeholder="请输入相关链接" showCount maxlength="3000" />
            </a-form-item>
            <a-form-item label="网盘链接" prop="projectCloneLink">
                <a-textarea v-model:value="form.projectCloneLink" type="" placeholder="请输入网盘链接" showCount maxlength="3000" />
            </a-form-item>
            <a-form-item label="123 网盘 " prop="project123CloneLink">
                <a-input v-model:value="form.project123CloneLink" type="" placeholder="请输入123网盘链接" showCount maxlength="3000" />
            </a-form-item>
        </a-form>
    </BasicModal>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { BasicModal, useModalInner } from '/@/components/Modal';
import { message } from 'ant-design-vue';
import FilterButton from './FilterButton.vue'
import marketFilterData from '/@/utils/market_filter_data.json';
import { deepClone } from '/@/utils/deepClone'
import { getResFilter, updateRes, updateResFilter, deleteResFilter, uploadImageRes } from './Resources.api'
import { uniqBy, merge } from 'lodash-es';
import { useGlobSetting } from '/@/hooks/setting'

const globSetting = useGlobSetting()
const emit = defineEmits(["closeWindow"]);
//   import { changePasswordById } from '/@/api/user'; // 假设这是你的API接口
interface FilterItem {
    filter_key: string;
    filter_value: string;
}
//导入的数据
const importData = ref()

//筛选数据
const filterForm = ref({})
//筛选关闭tab
const CloseTab = (val) => {
    let obj = val
    const keys = Object.keys(val)
    for (let i = 0; i < keys.length; i++) {
        for (let j = keys.length; j > 0; j--) {
            if(val[keys[i]]==keys[j]){
                obj[val[keys[i]]] = [val[keys[j]]]
            }
        }
    }
    filterForm.value = obj
}
//清除全部
const clickClear = () => {
    console.log("清除全部")
    filterForm.value = {}
}

//筛选点击
const clickItem = (val) => {
    let obj = val
    const keys = Object.keys(val)
    for (let i = 0; i < keys.length; i++) {
        for (let j = keys.length; j > 0; j--) {
            if(val[keys[i]]==keys[j]){
                obj[val[keys[i]]] = [val[keys[j]]]
            }
        }
    }
    filterForm.value = obj
}

const formGetB = reactive({
    projectReview: {
        name: 'projectReview',
        label: '审核状态',
        value: '',
        disabled: true,
        component: 'Tag',
        color: "red"
    },
    projectFilter: {
        name: 'projectFilter',
        label: '项目筛选',
        value: '',
        disabled: true,
        component: 'Dropdown',
        color: ""
    }
})

//定价模式判断
const handleVipChange = (val) => {
    // console.log(val)
    if (val == 1) { //免费
        formGet.projectPrice.hidden = true
        formGet.projectPrice.disabled = true
    }
    if (val == 2) { //自定义
        formGet.projectPrice.hidden = false
        formGet.projectPrice.disabled = false
        formGet.projectPrice.min = 1
    }
    if (val == 3) { //VIP
        formGet.projectPrice.hidden = false
        formGet.projectPrice.disabled = false
        formGet.projectPrice.min = 0
    }
}

let projectImagePath = ''
const imageUrl = ref('/src/assets/images/ai_noimg.png');
const oldimageUrl = ref('');
//市场图片
const fileList = ref();
const loading = ref<boolean>(false);
function handleChange(info) {
    console.log(info)
    if (info.file.status === 'uploading') {
        loading.value = true;
        return;
    }
    if (info.file.status === 'done') {
        // Get this url from response in real world.
        getBase64(info.file.originFileObj, (url) => {
            imageUrl.value = url;
            loading.value = false;
        });
    }
}
function beforeUpload(file) {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
        message.error('只能上传 JPG 或 PNG 格式的图片!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
        message.error('图片大小不能超过 2MB!');
    }
    console.log(isJpgOrPng && isLt2M)
    if (isJpgOrPng && isLt2M) {
        console.log(file.path)
        imageUrl.value = URL.createObjectURL(file);
        fileList.value = file;
        console.log(fileList.value)
        return false; // 阻止自动上传
    }
    return false
}
function getBase64(img, callback) {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result));
    reader.readAsDataURL(img);
}

const formRef = ref();
const formGet = reactive({
    // ...其他字段 不可修改的
    projectName: {
        name: 'projectName',
        label: '项目名称',
        value: '',
        min: 0,
        rules: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
        disabled: true,
        hidden: false,
        component: 'Input',
        colProps: { span: 24 },
        componentProps: {
            placeholder: '请输入项目名称',
            options: []
        },
    }, // 项目名称
    projectType: {
        name: 'projectType',
        label: '项目平台',
        value: '',
        min: 0,
        rules: [{ required: true, message: '请选择项目类型', trigger: 'blur' }],
        disabled: true,
        hidden: false,
        component: 'Input',
        colProps: { span: 24 },
        componentProps: {
            placeholder: '请输入项目类型',
            options: []
        },
    }, // 项目类型
    projectVersion: {
        name: 'projectVersion',
        label: '项目版本',
        value: '',
        min: 0,
        rules: [{ required: true, message: '请输入项目版本', trigger: 'blur' }],
        disabled: true,
        hidden: false,
        component: 'Input',
        colProps: { span: 24 },
        componentProps: {
            placeholder: '请输入项目版本',
            options: []
        },
    }, // 项目版本
    projectCreateTime: {
        name: 'projectCreateTime',
        label: '创建时间',
        value: '',
        min: 0,
        rules: [{ required: true, message: '请选择创建时间', trigger: 'blur' }],
        disabled: true,
        hidden: false,
        component: 'Input',
        colProps: { span: 24 },
        componentProps: {
            placeholder: '请输入创建时间',
            options: []
        },
    }, // 创建时间
    projectUpdateTime: {
        name: 'projectUpdateTime',
        label: '更新时间',
        value: '',
        min: 0,
        rules: [{ required: true, message: '请选择更新时间', trigger: 'blur' }],
        disabled: true,
        hidden: false,
        component: 'Input',
        colProps: { span: 24 },
        componentProps: {
            placeholder: '请输入更新时间',
            options: []
        },
    }, // 创建时间
    projectClass: {
        name: 'projectClass',
        label: '项目类型',
        value: 1,
        min: 0,
        rules: [{ required: true, message: '请输入项目类型', trigger: 'blur' }],
        disabled: false,
        hidden: false,
        component: 'Radio',
        colProps: { span: 24 },
        componentProps: {
            placeholder: '请输入项目类型',
            options: [
                { label: '免费', value: 1 },
                { label: '自定义价格', value: 2 },
                { label: '会员专享', value: 3 },
            ],
        },
    }, // 项目类型
    projectPrice: {
        name: 'projectPrice',
        label: '项目价格',
        value: 0,
        min: 0,
        rules: [{ required: true, message: '请输入项目价格', trigger: 'blur' }],
        disabled: true,
        hidden: true,
        component: 'Number',
        colProps: { span: 24 },
        componentProps: {
            placeholder: '请输入项目价格',
            options: []
        },
    }, // 项目价格
})
const form = reactive({
    projectDesc: '', // 项目描述
    ProjectOverview: '', // 项目介绍
    projectUrl: '', //相关链接
    projectCloneLink: '', // 项目网盘链接
    project123CloneLink: '', //项目123网盘链接
    resInstall: '', // 项目推荐安装地址
});

//项目名
const projectName = ref('');
const rules = {
    // projectDesc: [{ required: true, message: '请输入项目描述', trigger: 'blur' }],
    // ProjectOverview: [{ required: true, message: '请输入项目介绍', trigger: 'blur' }],
    // projectUrl: [{ required: true, message: '请输入相关链接', trigger: 'blur' }],
    // projectCloneLink: [{ required: true, message: '请输入网盘链接', trigger: 'blur' }],
    project123CloneLink: [
        // { required: true, message: '请输入123网盘链接', trigger: 'blur' },
        { type: 'url', message: '请输入有效的网址', trigger: 'blur' }
    ],
};

//发布时记录的信息 提交时使用 将相关链接修改
const ext_option = ref("")
//保留项目id
const projectid = ref("")
//保留用户id
const projectUserId = ref("")
//保留项目类型 判断是否是模型，插件，工作流
const resType = ref("model")
//保留安装目录
const projectInstallDir = ref("")
//筛选传入类型
// const filterbtn = ref(deepClone(marketFilterData.app).filter((item) => {return !item.hidden}))
const filterbtn = ref(deepClone(marketFilterData[resType.value]).filter((item) => { return !item.hidden }))

const [register, { closeModal, setModalProps }] = useModalInner((data) => {
    //设置默认筛选数据
    switch (data.res_type) {
        case 1:
            resType.value = 'model';
            break;
        case 2:
            resType.value = 'plugin';
            break;
        case 3:
            resType.value = 'workflow';
            break;
    }
    // 你可以在这里处理传递的userId
    console.log('接收到的用户ID:', data);
    projectid.value = data.id
    projectInstallDir.value = data.install_dir;
    projectName.value = data.res_name;
    projectUserId.value = data.user_id;
    //获取不可修改的信息
    formGet.projectName.value = data.res_name; //项目名
    formGet.projectType.value = data.platforms; //平台
    formGet.projectVersion.value = data.version; //版本
    formGet.projectCreateTime.value = data.create_time; //创建时间
    formGet.projectUpdateTime.value = data.update_time;
    switch (data.state) {
        case 0:
            formGetB.projectReview.value = "未审核";
            formGetB.projectReview.color = "red";
            break;
        case 1:
            formGetB.projectReview.value = "审核通过";
            formGetB.projectReview.color = "green";
            break;
    }
    //可修改信息
    //支付设置
    formGet.projectClass.value = data.price_type;
    handleVipChange(data.price_type)
    formGet.projectPrice.value = data.price_value;
    let dataimg
    console.log(data.image_path)
    if (data.image_path) {
        dataimg = globSetting.apiUrl+'/assets/market-images/' + data.image_path + '?timetamp='+Date.now();
    }
    imageUrl.value = dataimg ? dataimg : '/src/assets/images/ai_noimg.png'; //获取新图片
    oldimageUrl.value = data.image_path; //保留旧图片
    ext_option.value = data.ext_option; //相关链接
    form.projectUrl = data.ext_option ? JSON.parse(data.ext_option).projectUrl?JSON.parse(data.ext_option).projectUrl: '' : ''; //相关链接
    form.projectDesc = data.short_desc; // 项目描述
    form.ProjectOverview = data.res_desc; // 项目介绍
    form.projectCloneLink = data.cloud_storage_link; //网盘链接
    form.project123CloneLink = data.pan_123_path; //项目123网盘链接
    form.resInstall = data.res_install; //安装教程
    setModalProps({ title: `编辑用户 ${data.user_name} 的项目信息` });
    getResFilter({ id: data.id }).then(async ({ data }) => {
        let datas = uniqBy(data, item => item)
        console.log('datas', datas)
        let arrdata: any = await datas.reduce((acc: { [key: string]: Set<string> }, item: FilterItem) => {
            console.log(item)
            if (!acc[item.filter_key]) {
                acc[item.filter_key] = new Set();
            }
            item.filter_value.split(",").forEach(value => acc[item.filter_key].add(value));
            // acc[item.filter_key].add(item.filter_value);
            return acc;
        }, {} as { [key: string]: Set<string> });
        delete arrdata.device
        // // 将 Set 转换回obj
        let newarr: { [key: string]: string[] } = Object.fromEntries(
            Object.entries(arrdata).map(([key, value]) => [key, Array.from(value as Set<string>)])
        );
        console.log(arrdata)
        console.log(newarr)
        importData.value = newarr as any
        filterForm.value = newarr
        filterbtn.value = deepClone(marketFilterData[resType.value]).filter((item) => { return !item.hidden });
        filterbtn.value.forEach((item) => {
            item.timetimer = Date.now()
            if (importData.value && importData.value[item.id]) {
                item.projectModel = importData.value[item.id][0]
            }
            if (item.submenu && item.options.length > 0) {
                item.options.forEach((subItem) => {
                console.log(subItem.value,importData.value[subItem.value]);
                    if (importData.value[subItem.value]) {
                    console.log(subItem.value);
                    subItem.projectModel = Array.isArray(importData.value[subItem.value])?importData.value[subItem.value][0] : importData.value[subItem.value];
                    }
                });
            }
        });
    })
});

onMounted(() => {
    // console.log('Modal mounted, received data:', register.data);
});

const fileimage = ref(null);
async function handleOk() {
    console.log(form)
    try {
        // 表单校验 项目描述 项目介绍 相关链接 网盘链接
        await formRef.value.validate();
        //相关链接 的数据 返回原数据
        let prourl = JSON.parse(ext_option.value) || {}
        prourl.filterData = JSON.stringify(filterForm.value)
        prourl.projectUrl = form.projectUrl
        console.log(JSON.stringify(prourl))
        //支付相关设置
        if (formGet.projectClass.value == 1) {
            //商品类型为免费时需将价格设置为0
            formGet.projectPrice.value = 0
        }
        //两边数组合并 有则覆盖原来，没则标记del
        let newobj = merge({}, importData.value, filterForm.value)
        Object.keys(newobj).forEach(item => {
            if (filterForm.value[item]) {

            } else {
                newobj[item] = ["del"]
            }
        })
        console.log(newobj)
        const formData = new FormData();
        formData.append('image', fileList.value);
        formData.append('resType',resType.value);
        formData.append('userid', projectUserId.value);
        formData.append('installDir', projectInstallDir.value);
        console.log("imageupload", formData)
        // for (let pair of formData.entries()) {
        //     console.log(pair[0] + ': ' + pair[1]);
        // }
        let serverImageUrl
        if (fileList.value) {
            await uploadImageRes(formData).then(async ({ data }) => {
                serverImageUrl = data
            })
        }

        for (const item of Object.keys(newobj)) {
            if (newobj[item][0] == "del") {
                let resultdel = await deleteResFilter({
                    id: projectid.value,
                    filter_key: item,
                })
                console.log(resultdel)
            } else {
                try {
                    if(!Array.isArray(newobj[item])){
                        newobj[item] = [newobj[item]]
                    }
                    await updateResFilter({
                        id: projectid.value,
                        filter_data: newobj[item].join(), //新的筛选相关
                        filter_key: item, //筛选类型
                    })
                } catch (error) {
                    console.log("筛选修改失败", error)
                }
            }
        }

        await updateRes({
            id: projectid.value, //项目id
            short_desc: form.projectDesc, //项目描述
            res_desc: form.ProjectOverview, //项目介绍
            cloud_storage_link: form.projectCloneLink, //项目网盘链接
            ext_option: JSON.stringify(prourl), //相关链接
            price_type: formGet.projectClass.value, //项目支付类型
            price_value: formGet.projectPrice.value, //项目价格
            image_path: serverImageUrl, //图片链接
            pan_123_path: form.project123CloneLink, //项目123网盘链接
            resInstall: form.resInstall, //项目推荐安装路径
        })

        //   await changePasswordById(form.oldPassword, form.newPassword, register.data.userId);
        message.success("项目" + projectName.value + "修改成功");
        emit("closeWindow")
        closeModal();
    } catch (error: any) {
        message.error('项目修改失败:'+error.errorFields[0].errors[0]);
    }
}
//重置数据
const resetDate = () => {
    // 重置表单
    formRef.value.resetFields();
    // 重置图片
    imageUrl.value = '/src/assets/images/ai_noimg.png';
    oldimageUrl.value = '';
    // 重置文件
    projectImagePath = '';
    //重置上传图片数据
    fileList.value = null;
    //重置id
    projectid.value = "";
    projectUserId.value = "";
    // 重置筛选按钮相关数据
    filterbtn.value = [];
    importData.value = null;
    filterForm.value = {};
    // 重置筛选状态
    formGetB.projectFilter.value = '';

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