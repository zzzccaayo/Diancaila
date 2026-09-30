const order = require('../../utils/order.js')

// 厨师模式下自动刷新间隔
const REFRESH_MS = 15000

Page({
  data: {
    orders: [],
    loading: true,
    isChef: false,
    canClaim: false,
    pendingCount: 0
  },

  onShow() {
    this.load()
  },

  onHide() {
    this.stopTimer()
  },

  onUnload() {
    this.stopTimer()
  },

  async onPullDownRefresh() {
    await this.load()
    wx.stopPullDownRefresh()
  },

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  },

  async whoami() {
    if (!getApp().globalData.cloudReady) return { isChef: false, hasChef: true }
    try {
      return await order.callKitchen('whoami')
    } catch (e) {
      // 云函数还没部署时，按普通顾客处理
      console.warn('kitchen 云函数调用失败（是否已上传部署？）', e)
      return { isChef: false, hasChef: true }
    }
  },

  async load() {
    this.setData({ loading: true })
    const me = await this.whoami()
    let orders = []
    if (me.isChef) {
      const res = await order.callKitchen('list').catch(() => ({ ok: false }))
      orders = res.ok ? res.orders : []
      if (!this.timer) this.timer = setInterval(() => this.refreshChef(), REFRESH_MS)
    } else {
      this.stopTimer()
      orders = await order.listOrders()
    }
    this.setData({
      orders,
      loading: false,
      isChef: me.isChef,
      canClaim: !me.hasChef,
      pendingCount: orders.filter(o => o.status === '待制作').length
    })
  },

  // 厨师模式静默刷新，有新订单时震动提醒
  async refreshChef() {
    const res = await order.callKitchen('list').catch(() => ({ ok: false }))
    if (!res.ok) return
    const pendingCount = res.orders.filter(o => o.status === '待制作').length
    if (pendingCount > this.data.pendingCount) {
      wx.vibrateLong()
      wx.showToast({ title: '有新订单啦', icon: 'none' })
    }
    this.setData({ orders: res.orders, pendingCount })
  },

  async setStatus(e) {
    const { id, status } = e.currentTarget.dataset
    wx.showLoading({ title: '更新中' })
    try {
      const res = await order.callKitchen('setStatus', { id, status })
      wx.hideLoading()
      if (!res.ok) {
        wx.showToast({ title: res.msg || '更新失败', icon: 'none' })
        return
      }
      if (status === '已完成') wx.showToast({ title: '辛苦啦 ❤️', icon: 'none' })
      this.load()
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '更新失败，请重试', icon: 'none' })
    }
  },

  claimChef() {
    wx.showModal({
      title: '绑定为做菜的人',
      content: '绑定后，这个微信能看到所有人下的订单，并可以标记完成。只能绑定一次，确定吗？',
      success: async ({ confirm }) => {
        if (!confirm) return
        const res = await order.callKitchen('claimChef').catch(() => ({ ok: false, msg: '绑定失败' }))
        wx.showToast({ title: res.ok ? '绑定成功' : res.msg, icon: res.ok ? 'success' : 'none' })
        this.load()
      }
    })
  },

  goMenu() {
    wx.switchTab({ url: '/pages/menu/index' })
  }
})
