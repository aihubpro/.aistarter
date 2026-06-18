<template>
  <ConfigProvider :locale="getAntdLocale">
    <AppProvider>
      <RouterView />
      <PayModal ref="payModalRef" />
    </AppProvider>
  </ConfigProvider>
</template>

<script lang="ts" setup>
  import { ConfigProvider } from 'ant-design-vue'
  import { AppProvider } from '/@/components/Application'
  import PayModal from '/@/components/PayModal.vue'
  import { useTitle } from '/@/hooks/web/useTitle'
  import { useLocale } from '/@/locales/useLocale'
  import { checkDomainAuthorization } from '/@/settings/domainConfig'
  import { onMounted,onUnmounted,ref } from 'vue'
  import { useUserStore } from '/@/store/modules/user'
  const userStore = useUserStore()

  import 'dayjs/locale/zh-cn'
  // support Multi-language
  const { getAntdLocale } = useLocale()
  const payModalRef = ref(null)

  onMounted(async () => {
    const isAuthorized = await checkDomainAuthorization()
    if (!isAuthorized) {
      // 退出登录
      userStore.logout(true)
      return
    }
    if (userStore.getToken && isAuthorized.pay  == true) {
      (payModalRef.value as any)?.openPayModal2()
    }
  })

  // Listening to page changes and dynamically changing site titles
  useTitle()
</script>
