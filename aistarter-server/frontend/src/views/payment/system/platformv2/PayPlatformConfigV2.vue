<template>
  <div>
    <div class="m-3 p-3 bg-white">
      <a-spin :spinning="loading">
          <a-row :span="24">
            <a-col :span="24">
              <a-card  title="订阅配置" :active-tab-key="key" :tab-list="tabListTitle" @tabChange="key => onTabChange(key)">
                <template #extra>
                  <a-button @click="addConfig">添加</a-button>
                  <a-button @click="edit = !edit">{{ edit?'取消编辑':'编辑' }}</a-button>
                  <a-button type="primary" @click="updateConfig" :disabled="!edit">保存</a-button>
                </template>
                <div v-for="(item, index) in form.child" :key="index" v-show="key == index" class="flex justify-center">
                  <a-form class="w-800px">
                    <a-form-item>
                      <template #label>
                        <basic-title helpMessage="订阅标题"> 订阅标题 </basic-title>
                      </template>
                      <a-input placeholder="请输入标题" v-model:value="item.title" :disabled="!edit" />
                    </a-form-item>
                    <a-form-item>
                      <template #label>
                        <basic-title helpMessage="会员价格（元）"> 会员价格 </basic-title>
                      </template>
                      <a-input placeholder="请输入价格" v-model:value="item.price" :disabled="!edit" />
                    </a-form-item>
                    <a-form-item>
                      <template #label>
                        <basic-title helpMessage="请输入限时优惠价格，0表示没有折扣"> 限时优惠 </basic-title>
                      </template>
                      <a-input placeholder="请输入折扣百分比" v-model:value="item.discount" :disabled="!edit" />
                    </a-form-item>
                    <a-form-item>
                      <template #label>
                        <basic-title helpMessage="请输入会员到期时间“0“表示永久。10表示10天"> 到期时间 </basic-title>
                      </template>
                      <a-input placeholder="请输入会员到期时间" v-model:value="item.expire" :disabled="!edit" />
                    </a-form-item>
                    <a-form-item>
                      <template #label>
                        <basic-title helpMessage="请输入在客户端订阅中购买按钮的文字"> 按钮文字 </basic-title>
                      </template>
                      <a-input placeholder="请输入内容" v-model:value="item.btnText" :disabled="!edit" />
                    </a-form-item>
                    <a-form-item>
                      <template #label>
                        <basic-title helpMessage="请输入在客户端订阅中购买按钮的类型"> 按钮类型 </basic-title>
                      </template>
                      <a-select
                        v-model:value="item.btnType"
                        style="width: 120px"
                        :disabled="!edit"
                      >
                        <a-select-option value="primary">Primary</a-select-option>
                        <a-select-option value="success">Success</a-select-option>
                        <a-select-option value="info">Info</a-select-option>
                        <a-select-option value="warning">Warning</a-select-option>
                        <a-select-option value="danger">Danger</a-select-option>
                      </a-select>
                    </a-form-item>
                    <a-form-item
                      v-for="(domain, index2) in item.benefits"
                      :key="index"
                    >
                      <template #label>
                        <basic-title helpMessage="请输入在客户端订阅界面中显示的订阅描述"> 订阅描述{{index2+1}} </basic-title>
                      </template>
                      <a-input
                        v-model:value="item.benefits[index2]"
                        placeholder="输入内容"
                        style="width: 80%; margin-right: 8px"
                        :disabled="!edit"
                      />
                      <MinusCircleOutlined
                        v-if="edit&&item.benefits.length > 1"
                        class="dynamic-delete-button"
                        :disabled="item.benefits.length === 1"
                        @click="removeDomain(domain,index)"
                      />
                    </a-form-item>
                    <a-form-item>
                      <template #label>
                        <basic-title helpMessage="添加描述"> 添加描述 </basic-title>
                      </template>
                      <a-button type="dashed" @click="addDomain(index)" :disabled="!edit">
                        <PlusOutlined />
                        添加描述
                      </a-button>
                    </a-form-item>
                    <div class="flex justify-center">
                      <a-button type="danger" @click="remove(index)">删除</a-button>
                    </div>
                  </a-form>
                </div>
              </a-card>
            </a-col>
            <a-col :span="24">
              <div class="flex justify-center items-center">
                <a-form ref="formRef" :validate-trigger="['blur', 'change']" :model="form" :rules="rules" class="w-800px">
                  <a-form-item name="hostUrl">
                    <template #label>
                      <basic-title helpMessage="本系统的后台API的访问地址"> 系统地址 </basic-title>
                    </template>
                    <a-input placeholder="请输入网站地址" v-model:value="form.hostUrl" :disabled="!edit" />
                  </a-form-item>
                  <a-form-item name="vipDiscount">
                    <template #label>
                      <basic-title helpMessage="请输入会员折扣百分比"> 会员折扣 </basic-title>
                    </template>
                    <a-input placeholder="请输入折扣百分比" v-model:value="form.vipDiscount" :disabled="!edit" />
                  </a-form-item>
                  <a-form-item name="platformFee">
                    <template #label>
                      <basic-title helpMessage="请输入平台费百分比"> 平台费 </basic-title>
                    </template>
                    <a-input placeholder="请输入平台费百分比" v-model:value="form.platformFee" :disabled="!edit" />
                  </a-form-item>
                  <a-form-item name="machine_code_count">
                    <template #label>
                      <basic-title helpMessage="输入用户机器码数量"> 机器码数量 </basic-title>
                    </template>
                    <a-input placeholder="输入用户机器码数量" v-model:value="form.machine_code_count" :disabled="!edit" />
                  </a-form-item>
                  <a-form-item name="machine_code_modify_count">
                    <template #label>
                      <basic-title helpMessage="输入用户机械码修改次数"> 机械码修改次数 </basic-title>
                    </template>
                    <a-input placeholder="输入用户机械码修改次数" v-model:value="form.machine_code_modify_count" :disabled="!edit" />
                  </a-form-item>
                  <a-form-item name="rcs">
                    <template #label>
                      <basic-title helpMessage="是否开启邀请分成"> 是否开启邀请分成 </basic-title>
                    </template>
                    <a-switch 
                      v-model:checked="form.rcs" 
                      :disabled="!edit"
                      checked-children="开启"
                      un-checked-children="关闭"
                    />
                  </a-form-item>
                </a-form>
              </div>
            </a-col>
            <a-col :span="8" :offset="8">
              <div class="flex justify-evenly">
                <!-- <a-button v-if="edit" @click="initData">取消</a-button> -->
                <!-- <a-button type="primary" @click="updateConfig">更新</a-button> -->
                <!-- <a-button v-if="!edit" @click="edit = true">编辑信息</a-button> -->
              </div>
            </a-col>
          </a-row>
      </a-spin>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, computed } from 'vue'
  import { getConfig, update, PayPlatformConfig } from './PayPlatformConfigV2.api'
  import { $ref } from 'vue/macros'
  import { FormInstance, Rule } from 'ant-design-vue/lib/form'
  import { useMessage } from '/@/hooks/web/useMessage'
  import BasicTitle from '/@/components/Basic/src/BasicTitle.vue'
  import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons-vue';

  const { createConfirm, createMessage } = useMessage()

  let form = $ref<PayPlatformConfig>({})
  let loading = $ref(false)
  const formRef = $ref<FormInstance>()
  let edit = $ref(false)

  let key = $ref(0)

  let tabListTitle = [];

  const onTabChange = (value: string) => {
      console.log(value);
      key = value;
    };
  const removeDomain = (item,key) => {
    console.log(item,key);
    console.log(form)
    let index = form.child[key].benefits.indexOf(item);
    if (index !== -1) {
      form.child[key].benefits.splice(index, 1);
    }
  };

  const addDomain = (key) => {
    form.child[key].benefits.push('');
  };

  const rules = computed(() => {
    return {
      // limitAmount: [{ required: true, message: '请输入订单支付限额' }],
      // reqSign: [{ required: true, message: '请选择签名类型' }],
      // signType: [{ required: form.reqSign, message: '请选择签名类型' }],
      // signSecret: [{ required: form.reqSign, message: '请输入签名密钥' }],
      // orderTimeout: [{ required: true, message: '请输入订单默认超时时间(分钟)' }],
      // reqTimeout: [{ required: true, message: '请输入请求有效时长(秒)' }],
    } as Record<string, Rule[]>
  })

  onMounted(() => initData())

  /**
   * 初始化数据
   */
  async function initData() {
    edit = false
    loading = true
    getConfig().then(({ data }) => {
      console.log(data)
      form = data
      tabListTitle = form.child.map((item,index) => {
        return {
          key: index,
          tab: item.title,
        }
      })
      loading = false
    })
    .catch((error) => {
      console.log('获取配置失败:',error)
      loading = false
    })
    .finally(() => {
      console.log('finally')
      loading = false
    })
  }

  /**
   * 保存或更新配置
   */
  async function updateConfig() {
    await formRef?.validate()
    createConfirm({
      iconType: 'warning',
      title: '警告',
      content: '是否保存订阅配置',
      onOk: async () => {
        loading = true
        const updateFrom = { ...form }
        const result = await update(updateFrom)
        if(result.code === 0) {
          edit = false
          createMessage.success('保存成功')
          await initData()
        } else {
          edit = false
          await initData()
          createMessage.error(result.msg)
        }
        loading = false
      },
    })
  }
  //增加配置
  async function addConfig() {
    console.log(form)
    edit = true
    form.child.push({
      title: '新增配置'+(tabListTitle.length+1),
      price: '',
      discount:'0',
      btnType:'warning',
      btnText:'',
      benefits: ['']
    })
    tabListTitle = form.child.map((item,index) => {
      return {
        key: index,
        tab: item.title,
      }
    })
    key = tabListTitle.length - 1
  }
  // 删除配置
  async function remove(index) {
    createConfirm({
      iconType: 'warning',
      title: '警告',
      content: `是否删除[${form.child[index].title}]`,
      onOk: async () => {
        console.log(index)
        edit = true
        form.child.splice(index, 1)
        tabListTitle = form.child.map((item,index) => {
          return {
            key: index,
            tab: item.title,
          }
        })
        key = key - 1
      },
    })
  }
</script>

<style lang="less" scoped></style>
