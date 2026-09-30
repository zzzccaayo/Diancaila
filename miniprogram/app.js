// 云开发环境 ID：云开发控制台 → 设置 → 环境 ID（形如 cloud1-xxxxxx）
// 留空则使用默认环境
const ENV_ID = 'cloud1-d3gxe2es886da7ef7'

App({
  globalData: {
    cloudReady: false,
    isMaster: false,
    hasMaster: true,
    // 菜单（由 utils/menu.js 填充）
    dishes: [],
    categories: [],
    dishMap: {},
    // 购物车：{ [菜品 _id]: 数量 }
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
