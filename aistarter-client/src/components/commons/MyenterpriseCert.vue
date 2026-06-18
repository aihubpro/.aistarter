<template>
    <el-card class="w-full">
        <template #header>
            <div class="flex justify-start">
                <span class="flex align-center font-size-24px">
                    <el-icon>
                        <OfficeBuilding />
                    </el-icon>
                </span>
                <div class="flex justify-center ml-2" style="align-items: end;">
                    <span>{{ $t('personalcenter.enterprise_certification') }}</span>
                </div>
            </div>
        </template>

        <div class="w-full" v-if="!hasEnterprise">
            <!-- 未认证时显示的选项 -->
            <div class="flex justify-center gap-4 mb-6">
                <el-card class="w-80 cursor-pointer hover:shadow-lg transition-shadow" @click="openCreateDialog()">
                    <div class="text-center">
                        <el-icon size="48" class="text-blue-500 mb-4">
                            <OfficeBuilding />
                        </el-icon>
                        <h3 class="text-lg font-semibold mb-2">{{ t('enterprise.create_enterprise') }}</h3>
                        <p class="text-gray-600">{{ t('enterprise.create_enterprise_desc') }}</p>
                    </div>
                </el-card>
                
                <el-card class="w-80 cursor-pointer hover:shadow-lg transition-shadow" @click="showJoinDialog = true">
                    <div class="text-center">
                        <el-icon size="48" class="text-green-500 mb-4">
                            <Plus />
                        </el-icon>
                        <h3 class="text-lg font-semibold mb-2">{{ t('enterprise.join_enterprise') }}</h3>
                        <p class="text-gray-600">{{ t('enterprise.join_enterprise_desc') }}</p>
                    </div>
                </el-card>
            </div>
        </div>

        <div class="w-full" v-else>
            <!-- 加入企业待审核状态时显示等待审核界面 -->
            <el-card class="mb-4" v-if="userRole.joinStatus === 0">
                <template #header>
                    <div style="display: flex; justify-content: center; align-items: center;">
                        <span style="font-size: 18px; font-weight: 600; color: var(--el-color-info);">{{ t('enterprise.join_under_review') }}</span>
                    </div>
                </template>
                <div style="text-align: center; padding: 32px 0;">
                    <el-icon size="64" style="color: var(--el-color-info); margin-bottom: 16px;">
                        <OfficeBuilding />
                    </el-icon>
                    <h3 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">{{ t('enterprise.join_application_reviewing') }}</h3>
                    <p style="color: var(--el-text-color-regular); margin-bottom: 16px;">{{ t('enterprise.join_review_message') }}</p>
                    <div style="background-color: var(--el-color-info-light-9); border: 1px solid var(--el-color-info-light-7); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 8px; color: var(--el-color-info-dark-2);">
                            <el-icon><UserFilled /></el-icon>
                            <span style="font-weight: 500;">{{ t('enterprise.enterprise_info') }}</span>
                        </div>
                        <div style="margin-top: 8px; font-size: 14px; color: var(--el-text-color-regular);">
                            <p><strong>{{ t('enterprise.enterprise_name') }}：</strong>{{ enterpriseInfo.name }}</p>
                            <p><strong>{{ t('enterprise.enterprise_code') }}：</strong>{{ enterpriseInfo.code }}</p>
                        </div>
                    </div>
                    <p style="font-size: 14px; color: var(--el-text-color-placeholder);">{{ t('enterprise.contact_admin_or_support') }}</p>
                </div>
            </el-card>
            
            <!-- 申请退出状态时显示等待审核界面 -->
            <el-card class="mb-4" v-else-if="userRole.joinStatus === 2">
                <template #header>
                    <div style="display: flex; justify-content: center; align-items: center;">
                        <span style="font-size: 18px; font-weight: 600; color: var(--el-color-warning);">{{ t('enterprise.exit_under_review') }}</span>
                    </div>
                </template>
                <div style="text-align: center; padding: 32px 0;">
                    <el-icon size="64" style="color: var(--el-color-warning); margin-bottom: 16px;">
                        <OfficeBuilding />
                    </el-icon>
                    <h3 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">{{ t('enterprise.exit_application_reviewing') }}</h3>
                    <p style="color: var(--el-text-color-regular); margin-bottom: 16px;">{{ t('enterprise.exit_review_message') }}</p>
                    <div style="background-color: var(--el-color-warning-light-9); border: 1px solid var(--el-color-warning-light-7); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 8px; color: var(--el-color-warning-dark-2);">
                            <el-icon><UserFilled /></el-icon>
                            <span style="font-weight: 500;">{{ t('enterprise.enterprise_info') }}</span>
                        </div>
                        <div style="margin-top: 8px; font-size: 14px; color: var(--el-text-color-regular);">
                            <p><strong>{{ t('enterprise.enterprise_name') }}：</strong>{{ enterpriseInfo.name }}</p>
                            <p><strong>{{ t('enterprise.enterprise_code') }}：</strong>{{ enterpriseInfo.code }}</p>
                        </div>
                    </div>
                    <p style="font-size: 14px; color: var(--el-text-color-placeholder);">{{ t('enterprise.contact_admin_or_support') }}</p>
                </div>
            </el-card>
            
            <!-- 已加入企业时显示企业信息 -->
            <el-card class="mb-4" v-else>
                <template #header>
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-3">
                            <span class="text-lg font-semibold">{{ $t('enterprise.enterprise_info') }}</span>
                            <el-tag v-if="enterpriseInfo.status === 0" type="warning">{{ $t('enterprise.status_pending') }}</el-tag>
                            <el-tag v-else-if="enterpriseInfo.status === 1" type="success">{{ $t('enterprise.status_approved') }}</el-tag>
                            <el-tag v-else-if="enterpriseInfo.status === 2" type="danger">{{ $t('enterprise.status_rejected') }}</el-tag>
                        </div>
                        <div class="flex gap-2">
                            <!-- 只有创建者且企业状态为待审核或未通过时才能编辑 -->
                            <el-button v-if="enterpriseInfo.isCreator && (enterpriseInfo.status === 0 || enterpriseInfo.status === 2)" 
                                type="primary" size="small" @click="openEditDialog">{{ $t('enterprise.edit_info') }}</el-button>
                            <el-button type="danger" size="small" @click="leaveEnterprise">{{ t('enterprise.cancel_association') }}</el-button>
                        </div>
                    </div>
                </template>
                
                <el-form label-width="140px" label-position="left" class="enterprise-info-form">
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item :label="t('enterprise.enterprise_name')">
                                <el-input v-model="enterpriseInfo.name" readonly />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item :label="t('enterprise.enterprise_code')">
                                <div class="flex items-center gap-2">
                                    <el-input v-model="enterpriseInfo.code" readonly class="flex-1" />
                                    <el-button type="primary" size="small" @click="copyEnterpriseCode">
                                        <el-icon><DocumentCopy /></el-icon>
                                    </el-button>
                                </div>
                            </el-form-item>
                        </el-col>
                    </el-row>
                    
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item :label="t('enterprise.credit_code')">
                                <el-input v-model="enterpriseInfo.creditCode" readonly />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item :label="t('enterprise.legal_person_name')">
                                <el-input v-model="enterpriseInfo.legalPersonName" readonly />
                            </el-form-item>
                        </el-col>
                    </el-row>
                    
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item :label="$t('enterprise.submit_date')">
                                <el-input v-model="enterpriseInfo.submitDate" readonly />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12" v-if="enterpriseInfo.status === 1">
                            <el-form-item :label="$t('enterprise.audit_date')">
                                <el-input v-model="enterpriseInfo.auditDate" readonly />
                            </el-form-item>
                        </el-col>
                    </el-row>
                    
                    <el-row :gutter="20" v-if="enterpriseInfo.status === 1">
                        <el-col :span="12">
                            <el-form-item :label="$t('enterprise.member_count')">
                                <el-input v-model="enterpriseInfo.memberCount" readonly />
                            </el-form-item>
                        </el-col>
                    </el-row>
                    
                    <el-row :gutter="20" v-if="enterpriseInfo.bankcard || enterpriseInfo.bankname">
                        <el-col :span="12" v-if="enterpriseInfo.bankcard">
                            <el-form-item :label="$t('personalcenter.bankcard')">
                                <el-input :value="maskBankCard(enterpriseInfo.bankcard)" readonly />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12" v-if="enterpriseInfo.bankname">
                            <el-form-item :label="$t('personalcenter.bankname')">
                                <el-input v-model="enterpriseInfo.bankname" readonly />
                            </el-form-item>
                        </el-col>
                    </el-row>
                    
                    <el-row v-if="enterpriseInfo.status === 2 && enterpriseInfo.rejectReason">
                        <el-col :span="24">
                            <el-form-item :label="$t('enterprise.reject_reason')">
                                <el-input v-model="enterpriseInfo.rejectReason" type="textarea" :rows="2" readonly class="reject-reason" />
                            </el-form-item>
                        </el-col>
                    </el-row>
                    
                    <el-row v-if="enterpriseInfo.description">
                        <el-col :span="24">
                            <el-form-item :label="$t('enterprise.enterprise_desc')">
                                <el-input v-model="enterpriseInfo.description" type="textarea" :rows="3" readonly />
                            </el-form-item>
                        </el-col>
                    </el-row>
                </el-form>
            </el-card>
        </div>
    </el-card>

    <!-- 创建企业对话框 -->
    <el-dialog v-model="showCreateDialog" :title="t('enterprise.create_enterprise_cert')" width="600px">
        <el-scrollbar height="400px">
            <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="140px">
                <el-form-item :label="t('enterprise.enterprise_name')" prop="name">
                    <el-input v-model="createForm.name" :placeholder="t('enterprise.enter_enterprise_name')" />
                </el-form-item>
                
                <el-form-item :label="t('enterprise.credit_code')" prop="creditCode">
                    <el-input v-model="createForm.creditCode" :placeholder="t('enterprise.enter_credit_code')" maxlength="18" />
                </el-form-item>
                <el-form-item :label="t('enterprise.legal_person_name')" prop="legalPersonName">
                    <el-input v-model="createForm.legalPersonName" :placeholder="t('enterprise.enter_legal_person_name')" />
                </el-form-item>
                <el-form-item :label="t('enterprise.business_license')" prop="businessLicense">
                    <div class="flex items-center justify-center align-center">
                        <el-upload class="share-project-upload flex align-center" :auto-upload="false"
                            :show-file-list="false" :on-change="handleBusinessLicenseChange">
                            <el-image v-if="businessLicenseUrl" :src="businessLicenseUrl" fit="fill" :preview-src-list="[businessLicenseUrl]" :preview-teleported="true" />
                            <el-icon :size="24" v-else class="share-project-uploader-icon">
                                <Plus />
                            </el-icon>
                            <div class="absolute bottom-5" v-if="!businessLicenseUrl">{{ t('enterprise.business_license') }}</div>
                        </el-upload>
                    </div>
                </el-form-item>
                <el-form-item :label="t('enterprise.id_card_front')" prop="idCardFront">
                    <div class="flex items-center justify-center align-center">
                        <el-upload class="share-project-upload flex align-center" :auto-upload="false"
                            :show-file-list="false" :on-change="handleIdCardFrontChange">
                            <el-image v-if="idCardFrontUrl" :src="idCardFrontUrl" fit="fill" :preview-src-list="[idCardFrontUrl]" :preview-teleported="true" />
                            <el-icon :size="24" v-else class="share-project-uploader-icon">
                                <Plus />
                            </el-icon>
                            <div class="absolute bottom-5" v-if="!idCardFrontUrl">{{ t('enterprise.id_card_front') }}</div>
                        </el-upload>
                    </div>
                </el-form-item>
                <el-form-item :label="t('enterprise.id_card_back')" prop="idCardBack">
                    <div class="flex items-center justify-center align-center">
                        <el-upload class="share-project-upload flex align-center" :auto-upload="false"
                            :show-file-list="false" :on-change="handleIdCardBackChange">
                            <el-image v-if="idCardBackUrl" :src="idCardBackUrl" fit="fill" :preview-src-list="[idCardBackUrl]" :preview-teleported="true" />
                            <el-icon :size="24" v-else class="share-project-uploader-icon">
                                <Plus />
                            </el-icon>
                            <div class="absolute bottom-5" v-if="!idCardBackUrl">{{ t('enterprise.id_card_back') }}</div>
                        </el-upload>
                    </div>
                </el-form-item>
                <el-form-item :label="t('personalcenter.bankcard')" prop="bankcard">
                    <el-input v-model="createForm.bankcard" :placeholder="t('enterprise.enter_bank_card')" minlength="8" maxlength="34" show-word-limit />
                </el-form-item>
                <el-form-item :label="t('personalcenter.bankname')" prop="bankname">
                    <el-input v-model="createForm.bankname" :placeholder="t('enterprise.enter_bank_name')" minlength="2" maxlength="50" show-word-limit />
                </el-form-item>
                <el-form-item :label="t('enterprise.enterprise_desc')" prop="description">
                    <el-input v-model="createForm.description" type="textarea" :rows="2" :placeholder="t('enterprise.enter_description')" />
                </el-form-item>
            </el-form>
        </el-scrollbar>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="showCreateDialog = false">{{ $t('common.cancel') }}</el-button>
                <el-button type="primary" @click="createEntity" :loading="creating">{{ t('enterprise.create_enterprise') }}</el-button>
            </span>
        </template>
    </el-dialog>

    <!-- 关联认证对话框 -->
    <el-dialog v-model="showJoinDialog" :title="t('enterprise.associate_cert')" width="400px">
        <el-form :model="joinForm" :rules="joinRules" ref="joinFormRef" label-width="120px">
            <el-form-item :label="$t('enterprise.enterprise_code')" prop="code">
                <el-input v-model="joinForm.code" :placeholder="$t('enterprise.enter_enterprise_code')" />
            </el-form-item>
        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="showJoinDialog = false">{{ $t('common.cancel') }}</el-button>
                <el-button type="primary" @click="joinEnterprise" :loading="joining">{{ t('enterprise.associate') }}</el-button>
            </span>
        </template>
    </el-dialog>

    <!-- 编辑企业信息对话框 -->
    <el-dialog v-model="showEditDialog" :title="$t('enterprise.edit_enterprise_info')" width="600px">
        <el-scrollbar height="400px">
            <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="140px">
                <el-form-item :label="t('enterprise.enterprise_name')" prop="name">
                    <el-input v-model="editForm.name" :placeholder="t('enterprise.enter_enterprise_name')" />
                </el-form-item>
                
                <el-form-item :label="t('enterprise.credit_code')" prop="creditCode">
                    <el-input v-model="editForm.creditCode" :placeholder="t('enterprise.enter_credit_code')" maxlength="18" />
                </el-form-item>
                <el-form-item :label="t('enterprise.legal_person_name')" prop="legalPersonName">
                    <el-input v-model="editForm.legalPersonName" :placeholder="t('enterprise.enter_legal_person_name')" />
                </el-form-item>
                <el-form-item :label="t('enterprise.business_license')" prop="businessLicense">
                    <div class="flex items-center justify-center align-center">
                        <div class="relative">
                            <el-upload class="share-project-upload flex align-center" :auto-upload="false"
                                :show-file-list="false" :on-change="handleEditBusinessLicenseChange">
                                <el-image v-if="editBusinessLicenseUrl" :src="editBusinessLicenseUrl" fit="fill" :preview-src-list="[editBusinessLicenseUrl]" :preview-teleported="true" @click.stop />
                                <el-icon :size="24" v-else class="share-project-uploader-icon">
                                    <Plus />
                                </el-icon>
                                <div class="absolute bottom-5" v-if="!editBusinessLicenseUrl">{{ t('enterprise.business_license') }}</div>
                            </el-upload>
                            <el-button v-if="editBusinessLicenseUrl" class="image-close-btn" size="small" circle text @click.stop="clearEditBusinessLicense">
                                <el-icon><Close /></el-icon>
                            </el-button>
                        </div>
                    </div>
                </el-form-item>
                <el-form-item :label="t('enterprise.id_card_front')" prop="idCardFront">
                    <div class="flex items-center justify-center align-center">
                        <div class="relative">
                            <el-upload class="share-project-upload flex align-center" :auto-upload="false"
                                :show-file-list="false" :on-change="handleEditIdCardFrontChange">
                                <el-image v-if="editIdCardFrontUrl" :src="editIdCardFrontUrl" fit="fill" :preview-src-list="[editIdCardFrontUrl]" :preview-teleported="true" @click.stop />
                                <el-icon :size="24" v-else class="share-project-uploader-icon">
                                    <Plus />
                                </el-icon>
                                <div class="absolute bottom-5" v-if="!editIdCardFrontUrl">{{ t('enterprise.id_card_front') }}</div>
                            </el-upload>
                            <el-button v-if="editIdCardFrontUrl" class="image-close-btn" size="small" circle text @click.stop="clearEditIdCardFront">
                                <el-icon><Close /></el-icon>
                            </el-button>
                        </div>
                    </div>
                </el-form-item>
                <el-form-item :label="t('enterprise.id_card_back')" prop="idCardBack">
                    <div class="flex items-center justify-center align-center">
                        <div class="relative">
                            <el-upload class="share-project-upload flex align-center" :auto-upload="false"
                                :show-file-list="false" :on-change="handleEditIdCardBackChange">
                                <el-image v-if="editIdCardBackUrl" :src="editIdCardBackUrl" fit="fill" :preview-src-list="[editIdCardBackUrl]" :preview-teleported="true" @click.stop />
                                <el-icon :size="24" v-else class="share-project-uploader-icon">
                                    <Plus />
                                </el-icon>
                                <div class="absolute bottom-5" v-if="!editIdCardBackUrl">{{ t('enterprise.id_card_back') }}</div>
                            </el-upload>
                            <el-button v-if="editIdCardBackUrl" class="image-close-btn" size="small" circle text @click.stop="clearEditIdCardBack">
                                <el-icon><Close /></el-icon>
                            </el-button>
                        </div>
                    </div>
                </el-form-item>
                <el-form-item :label="t('personalcenter.bankcard')" prop="bankcard">
                    <el-input v-model="editForm.bankcard" :placeholder="t('enterprise.enter_bank_card')" minlength="8" maxlength="34" show-word-limit />
                </el-form-item>
                <el-form-item :label="t('personalcenter.bankname')" prop="bankname">
                    <el-input v-model="editForm.bankname" :placeholder="t('enterprise.enter_bank_name')" minlength="2" maxlength="50" show-word-limit />
                </el-form-item>
                <el-form-item :label="t('enterprise.enterprise_desc')" prop="description">
                    <el-input v-model="editForm.description" type="textarea" :rows="2" :placeholder="t('enterprise.enter_description')" />
                </el-form-item>
            </el-form>
        </el-scrollbar>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="showEditDialog = false">{{ t('common.cancel') }}</el-button>
                <el-button type="primary" @click="updateEnterprise" :loading="editing">{{ t('enterprise.update_enterprise_info') }}</el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
/**
 * 企业认证组件 - 测试模式
 * 
 * 测试说明：
 * 1. 当前使用本地模拟数据，所有API调用已被注释
 * 2. 要测试已加入企业状态，请修改 getEnterpriseInfo 函数中的 mockData.hasEnterprise 为 true
 * 3. 测试加入企业功能，可使用以下企业代码：TEST001, DEMO123, COMP456
 * 4. 要恢复真实API，请取消注释相关代码并注释掉模拟数据部分
 */
import { ref, onMounted, reactive, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { OfficeBuilding, Plus, UserFilled, Close, DocumentCopy } from '@element-plus/icons-vue';
import axios from 'axios';
import { useI18n } from 'vue-i18n';
const { ipcRenderer } = require('electron');
const fs = require('fs');

const { t } = useI18n();

// 响应式数据
const hasEnterprise = ref(false);
const businessLicenseUrl = ref('');
const idCardFrontUrl = ref('');
const idCardBackUrl = ref('');
const showCreateDialog = ref(false);
const showJoinDialog = ref(false);
const showEditDialog = ref(false);
const creating = ref(false);
const joining = ref(false);
const editing = ref(false);

// 压缩后的图片路径
let businessLicenseImage = ''; // 营业执照图片路径
let idCardFrontImage = ''; // 身份证正面图片路径
let idCardBackImage = ''; // 身份证反面图片路径
let editBusinessLicenseImage = ''; // 编辑时营业执照图片路径
let editIdCardFrontImage = ''; // 编辑时身份证正面图片路径
let editIdCardBackImage = ''; // 编辑时身份证反面图片路径

// 企业信息
const enterpriseInfo = reactive({
    name: '',
    code: '',
    creditCode: '',
    legalPersonName: '',
    memberCount: 0,
    joinDate: '',
    status: 0, // 审核状态：0(待审核), 1(已审核), 2(未通过)
    rejectReason: '', // 拒绝原因
    submitDate: '', // 提交日期
    auditDate: '', // 审核日期
    bankcard: '', // 银行卡号
    bankname: '', // 开户银行
    creatorId: '', // 创建者ID
    isCreator: false, // 是否为创建者
    description: '',
    businessLicenseUrl: '', // 营业执照图片URL
    idCardFrontUrl: '', // 身份证正面图片URL
    idCardBackUrl: '' // 身份证反面图片URL
});

// 用户角色信息
const userRole = reactive({
    role: 0, // 用户角色
    joinDate: '', // 加入日期
    joinStatus: null // 加入状态：0(申请加入), 1(正常), 2(申请退出)
});

// 创建企业表单
const createForm = reactive({
    name: '',
    description: '',
    creditCode: '',
    legalPersonName: '',
    businessLicense: null,
    idCardFront: null,
    idCardBack: null,
    bankcard: '',
    bankname: ''
});

// 加入企业表单
const joinForm = reactive({
    code: ''
});

// 编辑企业表单
const editForm = reactive({
    name: '',
    description: '',
    creditCode: '',
    legalPersonName: '',
    businessLicense: null,
    idCardFront: null,
    idCardBack: null,
    bankcard: '',
    bankname: ''
});

// 编辑表单的图片URL
const editBusinessLicenseUrl = ref('');
const editIdCardFrontUrl = ref('');
const editIdCardBackUrl = ref('');

// 表单引用
const createFormRef = ref();
const joinFormRef = ref();
const editFormRef = ref();

// 表单验证规则
const createRules = {
    name: [
        { required: true, message: t('enterprise.enter_enterprise_name'), trigger: 'blur' },
        { min: 2, max: 50, message: t('enterprise.name_length'), trigger: 'blur' }
    ],
    description: [
        { max: 200, message: t('enterprise.desc_length'), trigger: 'blur' }
    ],
    creditCode: [
        { required: true, message: t('enterprise.credit_code_required'), trigger: 'blur' },
        { pattern: /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/, message: t('enterprise.credit_code_format'), trigger: 'blur' }
    ],
    legalPersonName: [
        { required: true, message: t('enterprise.legal_person_required'), trigger: 'blur' },
        { min: 2, max: 20, message: t('enterprise.legal_person_length'), trigger: 'blur' }
    ],
    businessLicense: [
        { required: true, message: t('enterprise.business_license_required'), trigger: 'change' }
    ],
    idCardFront: [
        { required: true, message: t('enterprise.id_card_front_required'), trigger: 'change' }
    ],
    idCardBack: [
        { required: true, message: t('enterprise.id_card_back_required'), trigger: 'change' }
    ],
    bankcard: [
        { required: true, message: t('myupdateinfo.bank_card_required'), trigger: 'blur' },
        { pattern: /^[A-Za-z0-9 ]{8,34}$/, message: t('myupdateinfo.bank_card_format'), trigger: 'blur' }
    ],
    bankname: [
        { required: true, message: t('myupdateinfo.bank_name_required'), trigger: 'blur' },
        { min: 2, max: 50, message: t('myupdateinfo.bank_name_length'), trigger: 'blur' },
        { pattern: /^[\u4e00-\u9fa5a-zA-Z0-9\s]+$/, message: t('myupdateinfo.bank_name_format'), trigger: 'blur' }
    ]
};

const joinRules = {
    code: [
        { required: true, message: t('enterprise.code_required'), trigger: 'blur' },
        { min: 6, max: 20, message: t('enterprise.code_length'), trigger: 'blur' }
    ]
};

// 自定义验证器：检查图片是否已存在或已上传
const validateBusinessLicense = (rule: any, value: any, callback: any) => {
    if (!value && !editBusinessLicenseUrl.value) {
        callback(new Error(t('enterprise.business_license_required')));
    } else {
        callback();
    }
};

const validateIdCardFront = (rule: any, value: any, callback: any) => {
    if (!value && !editIdCardFrontUrl.value) {
        callback(new Error(t('enterprise.id_card_front_required')));
    } else {
        callback();
    }
};

const validateIdCardBack = (rule: any, value: any, callback: any) => {
    if (!value && !editIdCardBackUrl.value) {
        callback(new Error(t('enterprise.id_card_back_required')));
    } else {
        callback();
    }
};

// 编辑表单验证规则
const editRules = {
    name: [
        { required: true, message: t('enterprise.enter_enterprise_name'), trigger: 'blur' },
        { min: 2, max: 50, message: t('enterprise.name_length'), trigger: 'blur' }
    ],
    description: [
        { max: 200, message: t('enterprise.desc_length'), trigger: 'blur' }
    ],
    creditCode: [
        { required: true, message: t('enterprise.credit_code_required'), trigger: 'blur' },
        { pattern: /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/, message: t('enterprise.credit_code_format'), trigger: 'blur' }
    ],
    legalPersonName: [
        { required: true, message: t('enterprise.legal_person_required'), trigger: 'blur' },
        { min: 2, max: 20, message: t('enterprise.legal_person_length'), trigger: 'blur' }
    ],
    businessLicense: [
        { validator: validateBusinessLicense, trigger: 'change' }
    ],
    idCardFront: [
        { validator: validateIdCardFront, trigger: 'change' }
    ],
    idCardBack: [
        { validator: validateIdCardBack, trigger: 'change' }
    ],
    bankcard: [
        { required: true, message: t('myupdateinfo.bank_card_required'), trigger: 'blur' },
        { pattern: /^[A-Za-z0-9 ]{8,34}$/, message: t('myupdateinfo.bank_card_format'), trigger: 'blur' }
    ],
    bankname: [
        { required: true, message: t('myupdateinfo.bank_name_required'), trigger: 'blur' },
        { min: 2, max: 50, message: t('myupdateinfo.bank_name_length'), trigger: 'blur' },
        { pattern: /^[\u4e00-\u9fa5a-zA-Z0-9\s]+$/, message: t('myupdateinfo.bank_name_format'), trigger: 'blur' }
    ]
};

// 获取认证信息
const getEnterpriseInfo = async () => {
    try {
        const url = (window as any).Constants.uploadUrl + "/users/get-enterprise-info";
        const response = await axios.get(url, {
            headers: {
                "access-token": localStorage.getItem('token')
            }
        });
        
        if (response.data.code === 200) {
            const data = response.data.data;
            if (data.hasEnterprise && data.enterprise) {
                hasEnterprise.value = true;
                // 映射后端返回的数据结构到前端
                Object.assign(enterpriseInfo, {
                    name: data.enterprise.name,
                    code: data.enterprise.code,
                    creditCode: data.enterprise.creditCode,
                    legalPersonName: data.enterprise.legalPersonName,
                    status: data.enterprise.status,
                    memberCount: data.enterprise.memberCount,
                    joinDate: data.userRole?.joinDate || data.enterprise.createdAt,
                    submitDate: data.enterprise.createdAt,
                    auditDate: data.enterprise.auditAt, // 如果后端有审核日期字段，可以添加
                    rejectReason: data.enterprise.rejectReason, // 如果后端有拒绝原因字段，可以添加
                    description: data.enterprise.description,
                    isCreator: data.enterprise.isCreator,
                    creatorId: data.enterprise.creatorId || '',
                    creatorName: data.enterprise.creatorName || '',
                    bankcard: data.enterprise.bankcard, // 如果后端返回银行卡信息，可以添加
                    bankname: data.enterprise.bankname, // 如果后端返回开户银行，可以添加
                    businessLicenseUrl: data.enterprise.businessLicenseUrl, // 营业执照图片URL
                    idCardFrontUrl: data.enterprise.idCardFrontUrl, // 身份证正面图片URL
                    idCardBackUrl: data.enterprise.idCardBackUrl // 身份证反面图片URL
                });
                
                // 映射用户角色信息
                if (data.userRole) {
                    Object.assign(userRole, {
                        role: data.userRole.role,
                        joinDate: data.userRole.joinDate,
                        joinStatus: data.userRole.joinStatus
                    });
                }
            } else {
                hasEnterprise.value = false;
                // 重置用户角色信息
                Object.assign(userRole, {
                    role: 0,
                    joinDate: '',
                    joinStatus: null
                });
            }
        } else {
            hasEnterprise.value = false;
            console.warn('Get enterprise info failed:', response.data.message);
        }
    } catch (error) {
        console.error('Get enterprise info failed:', error);
        hasEnterprise.value = false;
        // 重置用户角色信息
        Object.assign(userRole, {
            role: 0,
            joinDate: '',
            joinStatus: null
        });
        ElMessage.error('获取企业信息失败，请稍后重试');
    }
};

// 打开创建对话框
const openCreateDialog = () => {
    resetCreateForm()
    showCreateDialog.value = true
}

// 获取实体类型标签


// 重置创建表单
const resetCreateForm = () => {
    Object.assign(createForm, {
        name: '',
        creditCode: '',
        legalPersonName: '',
        businessLicense: null,
        idCardFront: null,
        idCardBack: null,
        bankcard: '',
        bankname: '',
        description: ''
    })
    businessLicenseUrl.value = ''
    idCardFrontUrl.value = ''
    idCardBackUrl.value = ''
    businessLicenseImage = ''
    idCardFrontImage = ''
    idCardBackImage = ''
}

// 创建认证
const createEntity = async () => {
    if (!createFormRef.value) return;
    
    await createFormRef.value.validate(async (valid: boolean) => {
        if (!valid) return;
        
        creating.value = true;
        try {
            // 创建FormData对象用于文件上传
            const formData = new FormData();
            formData.append('name', createForm.name);
            formData.append('description', createForm.description);
            formData.append('creditCode', createForm.creditCode);
            formData.append('legalPersonName', createForm.legalPersonName);
            formData.append('bankcard', createForm.bankcard);
            formData.append('bankname', createForm.bankname);
            
            // 使用压缩后的图片文件
            if (businessLicenseImage) {
                const imageStream = await fs.promises.readFile(businessLicenseImage);
                formData.append('businessLicense', new Blob([imageStream], { type: 'image/png' }), 'BusinessLicense.png');
            }
            if (idCardFrontImage) {
                const imageStream = await fs.promises.readFile(idCardFrontImage);
                formData.append('idCardFront', new Blob([imageStream], { type: 'image/png' }), 'IdCardFront.png');
            }
            if (idCardBackImage) {
                const imageStream = await fs.promises.readFile(idCardBackImage);
                formData.append('idCardBack', new Blob([imageStream], { type: 'image/png' }), 'IdCardBack.png');
            }
            
            const url = (window as any).Constants.uploadUrl + "/users/create-enterprise";
            const response = await axios.post(url, formData, {
                headers: {
                    "access-token": localStorage.getItem('token'),
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            if (response.data.code === 200) {
                ElMessage.success(response.data.message || t('enterprise.create_success'));
                showCreateDialog.value = false;
                
                // 刷新企业信息
                await getEnterpriseInfo();
                
                // 清空表单
                resetCreateForm();
            } else {
                ElMessage.error(response.data.message || t('enterprise.create_failed'));
            }
        } catch (error) {
            console.error('Create certification failed:', error);
            ElMessage.error(t('enterprise.create_cert_failed'));
        } finally {
            creating.value = false;
        }
    });
};

// 关联认证
const joinEnterprise = async () => {
    if (!joinFormRef.value) return;
    
    await joinFormRef.value.validate(async (valid: boolean) => {
        if (!valid) return;
        
        joining.value = true;
        try {
            const url = (window as any).Constants.uploadUrl + "/users/join-enterprise";
            const response = await axios.post(url, {
                enterpriseCode: joinForm.code
            }, {
                headers: {
                    "access-token": localStorage.getItem('token')
                }
            });
            
            if (response.data.code === 200) {
                ElMessage.success(t('enterprise.join_success'));
                showJoinDialog.value = false;
                joinForm.code = '';
                await getEnterpriseInfo();
            } else {
                ElMessage.error(response.data.message || t('enterprise.join_failed'));
            }
        } catch (error: any) {
            console.error('Join enterprise failed:', error);
            if (error.response?.data?.message) {
                ElMessage.error(error.response.data.message);
            } else {
                ElMessage.error(t('enterprise.join_failed_retry'));
            }
        } finally {
             joining.value = false;
         }
     });
};

// 取消关联
const leaveEnterprise = async () => {
    try {
        const { value: reason } = await ElMessageBox.prompt(
            t('enterprise.enter_exit_reason'),
            t('enterprise.exit_enterprise'),
            {
                confirmButtonText: t('enterprise.confirm_exit'),
                cancelButtonText: t('common.cancel'),
                inputType: 'textarea',
                inputPlaceholder: t('enterprise.enter_exit_reason_placeholder'),
                type: 'warning',
            }
        );
        
        const url = (window as any).Constants.uploadUrl + "/users/quit-enterprise";
        const response = await axios.post(url, {
            reason: reason || ''
        }, {
            headers: {
                "access-token": localStorage.getItem('token')
            }
        });
        
        if (response.data.code === 200) {
            ElMessage.success(response.data.message || t('enterprise.exit_application_submitted'));
            // 刷新企业信息
            await getEnterpriseInfo();
        } else {
            ElMessage.error(response.data.message || t('enterprise.exit_failed'));
        }
    } catch (error: any) {
        if (error !== 'cancel') {
            console.error('Leave enterprise failed:', error);
            if (error.response?.data?.message) {
                ElMessage.error(error.response.data.message);
            } else {
                ElMessage.error(t('enterprise.exit_failed_retry'));
            }
        }
    }
};

// 文件上传处理函数
const handleBusinessLicenseChange = async (file: any) => {
    let rawFile = file.raw;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff'];
    if (!allowedTypes.includes(rawFile.type)) {
        ElMessage.error(t('imagetxt.img_class_error'));
        return false;
    } else if (rawFile.size / 1024 > 1000) {
        ElMessage.error(t('imagetxt.img_size_error3'));
        return false;
    }
    let temfile = await ipcRenderer.invoke('blob-to-temp-file', rawFile.path, 0, 0);
    businessLicenseImage = temfile || rawFile.path;

    businessLicenseUrl.value = URL.createObjectURL(rawFile);
    createForm.businessLicense = rawFile;
};

const handleIdCardFrontChange = async (file: any) => {
    let rawFile = file.raw;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff'];
    if (!allowedTypes.includes(rawFile.type)) {
        ElMessage.error(t('imagetxt.img_class_error'));
        return false;
    } else if (rawFile.size / 1024 > 1000) {
        ElMessage.error(t('imagetxt.img_size_error3'));
        return false;
    }
    let temfile = await ipcRenderer.invoke('blob-to-temp-file', rawFile.path, 0, 0);
    idCardFrontImage = temfile || rawFile.path;

    idCardFrontUrl.value = URL.createObjectURL(rawFile);
    createForm.idCardFront = rawFile;
};

const handleIdCardBackChange = async (file: any) => {
    let rawFile = file.raw;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff'];
    if (!allowedTypes.includes(rawFile.type)) {
        ElMessage.error(t('imagetxt.img_class_error'));
        return false;
    } else if (rawFile.size / 1024 > 1000) {
        ElMessage.error(t('imagetxt.img_size_error3'));
        return false;
    }
    let temfile = await ipcRenderer.invoke('blob-to-temp-file', rawFile.path, 0, 0);
    idCardBackImage = temfile || rawFile.path;

    idCardBackUrl.value = URL.createObjectURL(rawFile);
    createForm.idCardBack = rawFile;
};

// 清空编辑表单
const clearEditForm = () => {
    editForm.entityType = 1;
    editForm.name = '';
    editForm.description = '';
    editForm.creditCode = '';
    editForm.legalPersonName = '';

    editForm.businessLicense = null;
    editForm.idCardFront = null;
    editForm.idCardBack = null;
    editForm.bankcard = '';
    editForm.bankname = '';
    editBusinessLicenseUrl.value = '';
    editIdCardFrontUrl.value = '';
    editIdCardBackUrl.value = '';
    editBusinessLicenseImage = '';
    editIdCardFrontImage = '';
    editIdCardBackImage = '';
};

// 清空编辑表单中的图片
const clearEditBusinessLicense = () => {
    editBusinessLicenseUrl.value = '';
    editForm.businessLicense = null;
    editBusinessLicenseImage = '';
    // 触发表单验证
    if (editFormRef.value) {
        editFormRef.value.validateField('businessLicense');
    }
};

const clearEditIdCardFront = () => {
    editIdCardFrontUrl.value = '';
    editForm.idCardFront = null;
    editIdCardFrontImage = '';
    // 触发表单验证
    if (editFormRef.value) {
        editFormRef.value.validateField('idCardFront');
    }
};

const clearEditIdCardBack = () => {
    editIdCardBackUrl.value = '';
    editForm.idCardBack = null;
    editIdCardBackImage = '';
    // 触发表单验证
    if (editFormRef.value) {
        editFormRef.value.validateField('idCardBack');
    }
};

// 编辑表单的文件上传处理函数
const handleEditBusinessLicenseChange = async (file: any) => {
    let rawFile = file.raw;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff'];
    if (!allowedTypes.includes(rawFile.type)) {
        ElMessage.error(t('imagetxt.img_class_error'));
        return false;
    } else if (rawFile.size / 1024 > 1000) {
        ElMessage.error(t('imagetxt.img_size_error3'));
        return false;
    }
    let temfile = await ipcRenderer.invoke('blob-to-temp-file', rawFile.path, 0, 0);
    editBusinessLicenseImage = temfile || rawFile.path;

    editBusinessLicenseUrl.value = URL.createObjectURL(rawFile);
    editForm.businessLicense = rawFile;
};

const handleEditIdCardFrontChange = async (file: any) => {
    let rawFile = file.raw;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff'];
    if (!allowedTypes.includes(rawFile.type)) {
        ElMessage.error(t('imagetxt.img_class_error'));
        return false;
    } else if (rawFile.size / 1024 > 1000) {
        ElMessage.error(t('imagetxt.img_size_error3'));
        return false;
    }
    let temfile = await ipcRenderer.invoke('blob-to-temp-file', rawFile.path, 0, 0);
    editIdCardFrontImage = temfile || rawFile.path;

    editIdCardFrontUrl.value = URL.createObjectURL(rawFile);
    editForm.idCardFront = rawFile;
};

const handleEditIdCardBackChange = async (file: any) => {
    let rawFile = file.raw;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff'];
    if (!allowedTypes.includes(rawFile.type)) {
        ElMessage.error(t('imagetxt.img_class_error'));
        return false;
    } else if (rawFile.size / 1024 > 1000) {
        ElMessage.error(t('imagetxt.img_size_error3'));
        return false;
    }
    let temfile = await ipcRenderer.invoke('blob-to-temp-file', rawFile.path, 0, 0);
    editIdCardBackImage = temfile || rawFile.path;

    editIdCardBackUrl.value = URL.createObjectURL(rawFile);
    editForm.idCardBack = rawFile;
};

// 打开编辑对话框
const openEditDialog = () => {
    // 将当前认证信息填充到编辑表单
    editForm.entityType = enterpriseInfo.entityType || 1;
    editForm.name = enterpriseInfo.name;
    editForm.description = enterpriseInfo.description;
    editForm.creditCode = enterpriseInfo.creditCode || '';
    editForm.legalPersonName = enterpriseInfo.legalPersonName || '';

    editForm.businessLicense = null;
    editForm.idCardFront = null;
    editForm.idCardBack = null;
    editForm.bankcard = enterpriseInfo.bankcard;
    editForm.bankname = enterpriseInfo.bankname;
    
    // 设置已上传的图片URL
    editBusinessLicenseUrl.value = enterpriseInfo.businessLicenseUrl ? (window as any).Constants.uploadUrl + '/assets/user-images/' + enterpriseInfo.businessLicenseUrl + '?t=' + new Date().getTime() : '';
    editIdCardFrontUrl.value = enterpriseInfo.idCardFrontUrl ? (window as any).Constants.uploadUrl + '/assets/user-images/' + enterpriseInfo.idCardFrontUrl + '?t=' + new Date().getTime() : '';
    editIdCardBackUrl.value = enterpriseInfo.idCardBackUrl ? (window as any).Constants.uploadUrl + '/assets/user-images/' + enterpriseInfo.idCardBackUrl + '?t=' + new Date().getTime() : '';
    
    showEditDialog.value = true;
};

// 更新企业信息
const updateEnterprise = async () => {
    if (!editFormRef.value) return;
    
    await editFormRef.value.validate(async (valid: boolean) => {
        if (!valid) return;
        
        editing.value = true;
        try {
            // 创建FormData对象用于文件上传
            const formData = new FormData();
            formData.append('name', editForm.name);
            formData.append('description', editForm.description);
            formData.append('creditCode', editForm.creditCode);
            formData.append('legalPersonName', editForm.legalPersonName);
            formData.append('bankcard', editForm.bankcard);
            formData.append('bankname', editForm.bankname);
            
            // 使用压缩后的图片文件
            if (editBusinessLicenseImage) {
                const imageStream = await fs.promises.readFile(editBusinessLicenseImage);
                formData.append('businessLicense', new Blob([imageStream], { type: 'image/png' }), 'BusinessLicense.png');
            }
            if (editIdCardFrontImage) {
                const imageStream = await fs.promises.readFile(editIdCardFrontImage);
                formData.append('idCardFront', new Blob([imageStream], { type: 'image/png' }), 'IdCardFront.png');
            }
            if (editIdCardBackImage) {
                const imageStream = await fs.promises.readFile(editIdCardBackImage);
                formData.append('idCardBack', new Blob([imageStream], { type: 'image/png' }), 'IdCardBack.png');
            }
            
            const url = (window as any).Constants.uploadUrl + "/users/update-enterprise";
            const response = await axios.post(url, formData, {
                headers: {
                    "access-token": localStorage.getItem('token'),
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            if (response.data.code === 200) {
                ElMessage.success(response.data.message || t('enterprise.update_success'));
                showEditDialog.value = false;
                
                // 刷新企业信息
                await getEnterpriseInfo();
                
                // 清空编辑表单
                clearEditForm();
            } else {
                ElMessage.error(response.data.message || t('enterprise.update_failed'));
            }
        } catch (error: any) {
            console.error('Update enterprise failed:', error);
            if (error.response?.data?.message) {
                ElMessage.error(error.response.data.message);
            } else {
                ElMessage.error(t('enterprise.update_failed'));
            }
        } finally {
            editing.value = false;
        }
    });
};

// 复制企业代码
const copyEnterpriseCode = async () => {
    try {
        await navigator.clipboard.writeText(enterpriseInfo.code);
        ElMessage.success(t('enterprise.code_copied'));
    } catch (err) {
        // 如果clipboard API不可用，使用fallback方法
        const textArea = document.createElement('textarea');
        textArea.value = enterpriseInfo.code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        ElMessage.success(t('enterprise.code_copied'));
    }
};

// 银行卡号脱敏处理
const maskBankCard = (cardNumber: string): string => {
    if (!cardNumber || cardNumber.length < 8) {
        return cardNumber;
    }
    // 保留前4位和后4位，中间用*替代
    const start = cardNumber.substring(0, 4);
    const end = cardNumber.substring(cardNumber.length - 4);
    const middle = '*'.repeat(cardNumber.length - 8);
    return start + middle + end;
};

// 组件挂载时获取企业信息
onMounted(() => {
    getEnterpriseInfo();
});
</script>

<style scoped>
.cursor-pointer {
    cursor: pointer;
}

.hover\:shadow-lg:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.transition-shadow {
    transition: box-shadow 0.15s ease-in-out;
}

.share-project-upload {
    color: #8c939d;
    width: 200px;
    height: 150px;
    text-align: center;
    border: 2px dashed var(--ep-border-color);
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--ep-transition-duration-fast);
}

.share-project-upload:hover {
    border-color: var(--ep-color-primary);
}

.share-project-uploader-icon {
    font-size: 14px;
    color: #8c939d;
    width: 200px;
    height: 150px;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
}

.share-project-upload .el-image {
    width: 100%;
    height: 100%;
}

.uploaded-file {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    background-color: #f5f7fa;
}

.uploaded-file span {
    flex: 1;
    font-size: 14px;
    color: #606266;
}

.upload-demo {
    width: 100%;
}

.image-close-btn {
    position: absolute;
    top: 0px;
    right: 0px;
    z-index: 10;
    background: none;
}

/* 企业信息表单样式 */
.enterprise-info-form {
    padding: 16px 0;
}

.enterprise-info-form :deep(.el-input.is-disabled .el-input__inner),
.enterprise-info-form :deep(.el-input__inner[readonly]) {
    background-color: #f5f7fa;
    border-color: #e4e7ed;
    color: #606266;
    cursor: default;
}

.enterprise-info-form :deep(.el-textarea.is-disabled .el-textarea__inner),
.enterprise-info-form :deep(.el-textarea__inner[readonly]) {
    background-color: #f5f7fa;
    border-color: #e4e7ed;
    color: #606266;
    cursor: default;
}

.enterprise-info-form :deep(.reject-reason .el-textarea__inner) {
    color: #f56c6c;
    background-color: #fef0f0;
    border-color: #fbc4c4;
}

.enterprise-info-form :deep(.el-form-item__label) {
    font-weight: 500;
    color: #606266;
}
</style>