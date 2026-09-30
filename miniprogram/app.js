App({
  globalData: {
    cloudReady: false,
    // 购物车：{ [dishId]: 数量 }
    cart: {}
  },

  onLaunch() {
    if (wx.cloud) {
      try {
        // 使用开发者工具中当前选择的云环境
        wx.cloud.init({ env: wx.cloud.DYNAMIC_CURRENT_ENV, traceUser: true })
        this.globalData.cloudReady = true
      } catch (e) {
        console.warn('云开发初始化失败，订单将只保存在本机', e)
      }
    }
  }
})
