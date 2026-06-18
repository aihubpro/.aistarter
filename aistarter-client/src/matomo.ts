   /** 页面地址信息上报 */
   const setCustomUrl = (url: string) => {
    ;(window as any)._paq.push(['setCustomUrl', `${url}`])
  }

  /** 页面标题信息上报 */
  const trackPageView = (title: string | any) => {
    ;(window as any)._paq.push(['trackPageView', `${title}`])
  }

  /** 用户信息userId上报 */
  const setUserId = (userId: string | number | boolean) => {
    ;(window as any)._paq.push(['setUserId', `${userId}`])
    ;(window as any)._paq.push(['trackPageView'])
  }

  /** 重置userId，这里多次调用trackAllContentImpressions是为了在退出登录的时候重置调userId，并在下一次登录时重新生成一条最新的记录 */
  const resetUserId = () => {
    // UserID passed to Matomo (see https://developer.matomo.org/guides/tracking-javascript-guide#user-id)
    ;(window as any)._paq.push(['resetUserId'])
    ;(window as any)._paq.push(['trackAllContentImpressions', 'new_visit=1'])
    ;(window as any)._paq.push(['trackPageView'])
    ;(window as any)._paq.push(['trackAllContentImpressions'])
  }

  /**
   * 行为埋点
   * $matomo.trackEvent('行为类别', '事件', 'name', 'value')
   * behaviorCategory  行为类别
   * event 事件
   * name 事件名称
   * value 事件值
   */
  const trackEvent = (behaviorCategory: string, event: string, name: string, value?: string | number) => {
    ;(window as any)._paq.push(['trackEvent', `${behaviorCategory}`, `${event}`, `${name}`])
  }

  export default { setCustomUrl, trackPageView, setUserId, resetUserId, trackEvent};