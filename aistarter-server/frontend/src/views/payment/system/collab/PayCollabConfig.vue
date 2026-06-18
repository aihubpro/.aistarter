<template>
  <div>
    <div class="m-3 p-3 bg-white">
      <a-spin :spinning="loading">
          <a-row :span="24">
            <a-col :span="24">
              <a-card  title="共创配置" :active-tab-key="key" :tab-list="tabListTitle" @tabChange="key => onTabChange(key)">
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
                        <basic-title helpMessage="订阅价格（元）"> 订阅价格 </basic-title>
                      </template>
                      <a-input placeholder="请输入价格" v-model:value="item.price" :disabled="!edit" />
                    </a-form-item>
                    <a-form-item>
                      <template #label>
                        <basic-title helpMessage="请输入共创者到期时间“0“表示永久。10表示10天"> 到期时间 </basic-title>
                      </template>
                      <a-input placeholder="请输入会员到期时间" v-model:value="item.expire" :disabled="!edit" />
                    </a-form-item>
                    <a-form-item>
                      <template #label>
                        <basic-title helpMessage="共创者续费时对于该价位的描述"> 相关描述 </basic-title>
                      </template>
                      <a-input placeholder="请输入相关描述" v-model:value="item.desc" :disabled="!edit" />
                    </a-form-item>
                    <div class="flex justify-center">
                      <a-button type="danger" @click="remove(index)">删除</a-button>
                    </div>
                  </a-form>
                </div>
              </a-card>
            </a-col>
          </a-row>
      </a-spin>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, computed } from 'vue'
  import { getConfig, update, PayPlatformConfig } from './PayCollabConfig.api'
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
      content: '是否保存共创配置',
      onOk: async () => {
        loading = true
        const updateFrom = { ...form }
        const result = await update(updateFrom)
        if(result.code === 0) {
          edit = false
          createMessage.success('保存成功')
          await initData()
        } else {
          createMessage.error('保存失败')
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
