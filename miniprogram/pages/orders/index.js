const order = require('../../utils/order.js')

Page({
  data: {
    orders: [],
    loading: true
  },

  onShow() {
    this.load()
  },

  async onPullDownRefresh() {
    await this.load()
    wx.stopPullDownRefresh()
  },

  async load() {
    this.setData({ loading: true })
    const orders = await order.listOrders()
    this.setData({ orders, loading: false })
  },

  goMenu() {
    wx.switchTab({ url: '/pages/menu/index' })
  }
})
