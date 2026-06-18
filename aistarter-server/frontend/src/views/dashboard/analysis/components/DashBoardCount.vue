<template>
  <div class="md:flex">
    <template v-for="(item, index) in data" :key="item.title">
      <Card
        size="small"
        :loading="loading"
        :title="item.title"
        class="md:w-1/4 w-full !md:mt-0"
        :class="{ '!md:mr-4': index + 1 < 4, '!mt-4': index > 0 }"
        v-on:click="handleClick(item.renewal)"
      >
        <template v-if="item.action" #extra>
          <Tag>{{ item.action }}</Tag>
        </template>
        <div class="py-4 px-4 flex justify-between items-center">
          <CountTo :startVal="0" :decimals="item.decimals" :endVal="item.value" class="text-2xl" v-if="typeof item.value === 'number'" />
          <span v-else class="text-2xl">{{ item.value }}</span>
          <div class="flex items-center" v-if="item.value2">
            <span class="mr-1" style="line-height: 2em;">已过期：</span>
            <CountTo :startVal="0" :decimals="item.decimals" :endVal="item.value2" class="text-2xl text-red-500" />
          </div>
          <Icon :icon="item.icon" :size="40" />
        </div>
      </Card>
    </template>
    <PayModal ref="payModalRef" />
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'
  import { CountTo } from '/@/components/CountTo'
  import { Tag, Card } from 'ant-design-vue'
  import Icon from '/@/components/Icon/src/Icon.vue'
  import { DashBoardCountData } from '/@/views/dashboard/analysis/data'
    import PayModal from '/@/components/PayModal.vue'
  const payModalRef = ref(null)
  const handleClick = (item = false) => {
    if (item) {
      (payModalRef.value as any)?.openPayModal2()
    }
  }
  defineProps({
    loading: {
      type: Boolean,
    },
    data: {
      type: Array<DashBoardCountData>,
    },
  })
</script>
