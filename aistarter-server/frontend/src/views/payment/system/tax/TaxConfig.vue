<template>
  <div>
    <div class="m-3 p-3 bg-white">
      <a-spin :spinning="loading">
        <div class="flex justify-center items-center">
          <a-form ref="formRef" :validate-trigger="['blur', 'change']" :model="form" :rules="rules" class="w-800px">
            <a-card title="税收配置">
              <template #extra>
                <a-button @click="edit = !edit">{{ edit?'取消编辑':'编辑' }}</a-button>
                <a-button type="primary" @click="updateConfig" :disabled="!edit">保存</a-button>
              </template>
              
              <a-form-item name="taxThreshold">
                <template #label>
                  <basic-title helpMessage="个人所得税起征金额，低于此金额不征税（仅适用于国内税收）"> 起征金额 </basic-title>
                </template>
                <a-input-number
                  v-model:value="form.taxThreshold"
                  :disabled="!edit"
                  :min="0"
                  placeholder="请输入起征金额（仅国内适用）"
                  style="width: 100%"
                  :formatter="value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                  :parser="value => value.replace(/\$\s?|(,*)/g, '')"
                />
              </a-form-item>
              
              <!-- 国内个人所得税税率表 -->
              <a-form-item
                v-for="(taxItem, index2) in form.domesticTaxTable"
                :key="index2"
              >
                <template #label>
                  <basic-title helpMessage="国内个人所得税税率表（居民个人劳务报酬所得预扣预缴适用）"> 国内税率表{{index2+1}} </basic-title>
                </template>
                <div class="flex flex-col gap-2">
                  <div class="flex items-center gap-2">
                    <a-tooltip title="居民个人工资、薪金所得预扣税率，范围0-100%">
                      <a-input-number
                        v-model:value="form.domesticTaxTable[index2].rate"
                        placeholder="预扣率"
                        :min="0"
                        :max="100"
                        addon-after="%"
                        :disabled="!edit"
                      />
                    </a-tooltip>
                    <a-tooltip title="对应税率档次的速算扣除数，用于简化税额计算">
                      <a-input-number
                        v-model:value="form.domesticTaxTable[index2].quickDeduction"
                        placeholder="速算扣除数"
                        :min="0"
                        :disabled="!edit"
                      />
                    </a-tooltip>
                  </div>
                  <div class="flex items-center gap-2">
                    <a-tooltip title="该税率档次适用的最小应纳税所得额">
                      <a-input-number
                        v-model:value="form.domesticTaxTable[index2].minAmount"
                        placeholder="最小金额"
                        :min="0"
                        :disabled="!edit"
                      />
                    </a-tooltip>
                    <a-tooltip title="该税率档次适用的最大应纳税所得额，可为空表示无上限">
                      <a-input-number
                        v-model:value="form.domesticTaxTable[index2].maxAmount"
                        placeholder="最大金额"
                        :min="0"
                        :disabled="!edit"
                      />
                    </a-tooltip>
                  </div>
                  <div class="flex items-center gap-2">
                    <a-tooltip title="该税率档次的应纳税所得额范围描述，如：不超过3000元">
                      <a-input
                        v-model:value="form.domesticTaxTable[index2].description"
                        placeholder="应纳税所得额描述"
                        :disabled="!edit"
                      />
                    </a-tooltip>
                    <MinusCircleOutlined
                      v-if="edit && form.domesticTaxTable.length > 1"
                      class="dynamic-delete-button"
                      @click="removeDomesticTaxItem(index2)"
                    />
                  </div>
                </div>
              </a-form-item>
              <a-form-item>
                <template #label>
                  <basic-title helpMessage="添加国内税率档次"> 添加国内税率档次 </basic-title>
                </template>
                <a-button type="dashed" @click="addDomesticTaxItem" :disabled="!edit">
                  <PlusOutlined />
                  添加国内税率档次
                </a-button>
              </a-form-item>
              
              <!-- 国外个人所得税税率表 -->
              <a-form-item
                v-for="(taxItem, index2) in form.foreignTaxTable"
                :key="index2"
              >
                <template #label>
                  <basic-title helpMessage="国外个人所得税税率表（非居民个人工资、薪金所得，劳务报酬所得，稿酬所得，特许权使用费所得适用）"> 国外税率表{{index2+1}} </basic-title>
                </template>
                <div class="flex flex-col gap-2">
                  <div class="flex items-center gap-2">
                    <a-tooltip title="非居民个人工资、薪金所得税率，范围0-100%">
                      <a-input-number
                        v-model:value="form.foreignTaxTable[index2].rate"
                        placeholder="税率"
                        :min="0"
                        :max="100"
                        addon-after="%"
                        :disabled="!edit"
                      />
                    </a-tooltip>
                    <a-tooltip title="对应税率档次的速算扣除数，用于简化税额计算">
                      <a-input-number
                        v-model:value="form.foreignTaxTable[index2].quickDeduction"
                        placeholder="速算扣除数"
                        :min="0"
                        :disabled="!edit"
                      />
                    </a-tooltip>
                  </div>
                  <div class="flex items-center gap-2">
                    <a-tooltip title="该税率档次适用的最小应纳税所得额">
                      <a-input-number
                        v-model:value="form.foreignTaxTable[index2].minAmount"
                        placeholder="最小金额"
                        :min="0"
                        :disabled="!edit"
                      />
                    </a-tooltip>
                    <a-tooltip title="该税率档次适用的最大应纳税所得额，可为空表示无上限">
                      <a-input-number
                        v-model:value="form.foreignTaxTable[index2].maxAmount"
                        placeholder="最大金额"
                        :min="0"
                        :disabled="!edit"
                      />
                    </a-tooltip>
                  </div>
                  <div class="flex items-center gap-2">
                    <a-tooltip title="该税率档次的全月应纳税所得额范围描述，如：不超过3000元">
                      <a-input
                        v-model:value="form.foreignTaxTable[index2].description"
                        placeholder="全月应纳税所得额描述"
                        :disabled="!edit"
                      />
                    </a-tooltip>
                    <MinusCircleOutlined
                      v-if="edit && form.foreignTaxTable.length > 1"
                      class="dynamic-delete-button"
                      @click="removeForeignTaxItem(index2)"
                    />
                  </div>
                </div>
              </a-form-item>
              <a-form-item>
                <template #label>
                  <basic-title helpMessage="添加国外税率档次"> 添加国外税率档次 </basic-title>
                </template>
                <a-button type="dashed" @click="addForeignTaxItem" :disabled="!edit">
                  <PlusOutlined />
                  添加国外税率档次
                </a-button>
              </a-form-item>
            </a-card>
          </a-form>
        </div>
      </a-spin>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, computed } from 'vue'
  import { getTaxConfig, updateTaxConfig, TaxConfig, TaxTableItem } from './TaxConfig.api'
  import { $ref } from 'vue/macros'
  import { FormInstance, Rule } from 'ant-design-vue/lib/form'
  import { useMessage } from '/@/hooks/web/useMessage'
  import BasicTitle from '/@/components/Basic/src/BasicTitle.vue'
  import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons-vue'

  const { createConfirm, createMessage } = useMessage()

  let form = $ref<TaxConfig>({})
  let loading = $ref(false)
  const formRef = $ref<FormInstance>()
  let edit = $ref(false)

  const rules = computed(() => {
    return {
      taxThreshold: [{ required: true, message: '请输入起征金额' }],
    } as Record<string, Rule[]>
  })

  onMounted(() => initData())

  /**
   * 初始化数据
   */
  async function initData() {
    edit = false
    loading = true
    try {
      const { data } = await getTaxConfig()
      form = data
      // 设置默认值（仅在数据为空时）
      if (!form.taxThreshold) {
        form.taxThreshold = 800
      }
      // 确保税率表数组存在
      if (!form.domesticTaxTable) {
        form.domesticTaxTable = []
      }
      if (!form.foreignTaxTable) {
        form.foreignTaxTable = []
      }
    } catch (error) {
      console.log('获取税收配置失败:', error)
      createMessage.error('获取税收配置失败')
    } finally {
      loading = false
    }
  }

  /**
   * 保存或更新配置
   */
  async function updateConfig() {
    await formRef?.validate()
    createConfirm({
      iconType: 'warning',
      title: '警告',
      content: '是否保存税收配置',
      onOk: async () => {
        loading = true
        try {
          const updateFrom = { ...form }
          const result = await updateTaxConfig(updateFrom)
          if (result.code === 0) {
            edit = false
            createMessage.success('保存成功')
            await initData()
          } else {
            createMessage.error(result.msg)
          }
        } catch (error) {
          createMessage.error('保存失败')
        } finally {
          loading = false
        }
      },
    })
  }

  /**
   * 添加国内税率项
   */
  function addDomesticTaxItem() {
    const newLevel = form.domesticTaxTable ? form.domesticTaxTable.length + 1 : 1
    const newItem: TaxTableItem = {
      level: newLevel,
      description: '',
      rate: 0,
      quickDeduction: 0,
      minAmount: 0,
      maxAmount: null,
    }
    if (!form.domesticTaxTable) {
      form.domesticTaxTable = []
    }
    form.domesticTaxTable.push(newItem)
  }

  /**
   * 删除国内税率项
   */
  function removeDomesticTaxItem(index: number) {
    if (form.domesticTaxTable && form.domesticTaxTable.length > 1) {
      form.domesticTaxTable.splice(index, 1)
      // 重新排序level
      form.domesticTaxTable.forEach((item, idx) => {
        item.level = idx + 1
      })
    }
  }

  /**
   * 添加国外税率项
   */
  function addForeignTaxItem() {
    const newLevel = form.foreignTaxTable ? form.foreignTaxTable.length + 1 : 1
    const newItem: TaxTableItem = {
      level: newLevel,
      description: '',
      rate: 0,
      quickDeduction: 0,
      minAmount: 0,
      maxAmount: null,
    }
    if (!form.foreignTaxTable) {
      form.foreignTaxTable = []
    }
    form.foreignTaxTable.push(newItem)
  }

  /**
   * 删除国外税率项
   */
  function removeForeignTaxItem(index: number) {
    if (form.foreignTaxTable && form.foreignTaxTable.length > 1) {
      form.foreignTaxTable.splice(index, 1)
      // 重新排序level
      form.foreignTaxTable.forEach((item, idx) => {
        item.level = idx + 1
      })
    }
  }
</script>

<style scoped>
.dynamic-delete-button {
  cursor: pointer;
  position: relative;
  top: 4px;
  font-size: 24px;
  color: #999;
  transition: all 0.3s;
}
.dynamic-delete-button:hover {
  color: #777;
}
.dynamic-delete-button[disabled] {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>