// 云开发环境 ID：云开发控制台 → 设置 → 环境 ID（形如 cloud1-xxxxxx）
// 留空则使用默认环境
const ENV_ID = ''

App({
  globalData: {
    cloudReady: false,
    // 购物车：{ [dishId]: 数量 }
    cart: {}
  },

  onLaunch() {
    if (wx.cloud) {
      try {
        const options = { traceUser: true }
        if (ENV_ID) options.env = ENV_ID
        wx.cloud.init(options)
        this.globalData.cloudReady = true
      } catch (e) {
        console.warn('云开发初始化失败，订单将只保存在本机', e)
      }
    }
  }
})
