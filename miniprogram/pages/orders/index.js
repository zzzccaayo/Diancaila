const order = require('../../utils/order.js')
const { callKitchen } = require('../../utils/kitchen.js')

// 主人模式下自动刷新间隔
const REFRESH_MS = 15000

Page({
  data: {
    orders: [],
    loading: true,
    isMaster: false,
    canClaim: false,
    openid: '',
    notifyTemplateId: '',
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
    if (!getApp().globalData.cloudReady) return { isMaster: false, hasMaster: true }
    try {
      return await callKitchen('whoami')
    } catch (e) {
      // 云函数还没部署时，按普通顾客处理
      console.warn('kitchen 云函数调用失败（是否已上传部署？）', e)
      return { isMaster: false, hasMaster: true }
    }
  },

  async load() {
    this.setData({ loading: true })
    const me = await this.whoami()
    let orders = []
    if (me.isMaster) {
      const res = await callKitchen('list').catch(() => ({ ok: false }))
      orders = res.ok ? res.orders : []
      if (!this.timer) this.timer = setInterval(() => this.refreshMaster(), REFRESH_MS)
    } else {
      this.stopTimer()
      orders = await order.listOrders()
    }
    getApp().globalData.isMaster = me.isMaster
    this.setData({
      orders,
      loading: false,
      isMaster: me.isMaster,
      canClaim: !me.hasMaster,
      openid: me.openid || '',
      notifyTemplateId: me.notifyTemplateId || '',
      pendingCount: orders.filter(o => o.status === '待制作').length
    })
  },

  // 主人模式静默刷新，有新订单时震动提醒
  async refreshMaster() {
    const res = await callKitchen('list').catch(() => ({ ok: false }))
    if (!res.ok) return
    const pendingCount = res.orders.filter(o => o.status === '待制作').length
    if (pendingCount > this.data.pendingCount) {
      wx.vibrateLong()
      wx.showToast({ title: '有新订单啦', icon: 'none' })
    }
    this.setData({ orders: res.orders, pendingCount })
  },

  // 主人订阅新订单提醒：每次授权可收到一条通知
  subscribe(silent) {
    const tmplId = this.data.notifyTemplateId
    if (!tmplId) return
    wx.requestSubscribeMessage({
      tmplIds: [tmplId],
      success: res => {
        if (silent) return
        if (res[tmplId] === 'accept') {
          wx.showToast({ title: '已开启，下一单会通知你', icon: 'none' })
        } else {
          wx.showToast({ title: '没有开启提醒', icon: 'none' })
        }
      },
      fail: err => console.warn('订阅提醒失败', err)
    })
  },

  onSubscribe() {
    this.subscribe(false)
  },

  async setStatus(e) {
    const { id, status } = e.currentTarget.dataset
    // 顺便续一次新订单提醒（勾选过“总是保持”后不会弹窗）
    this.subscribe(true)
    wx.showLoading({ title: '更新中' })
    try {
      const res = await callKitchen('setStatus', { id, status })
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

  cancelOrder(e) {
    const { id } = e.currentTarget.dataset
    wx.showModal({
      title: '撤回订单',
      content: '确定要撤回这个订单吗？',
      confirmText: '撤回',
      confirmColor: '#ff4d4f',
      success: async ({ confirm }) => {
        if (!confirm) return
        wx.showLoading({ title: '撤回中' })
        const res = await callKitchen('cancelOrder', { id }).catch(() => ({ ok: false, msg: '撤回失败，请重试' }))
        wx.hideLoading()
        wx.showToast({ title: res.ok ? '已撤回' : res.msg, icon: res.ok ? 'success' : 'none' })
        this.load()
      }
    })
  },

  claimMaster() {
    wx.showModal({
      title: '绑定为主人',
      content: '绑定后，这个微信能看到所有订单、标记完成，还能修改菜单。只能绑定一次，确定吗？',
      success: async ({ confirm }) => {
        if (!confirm) return
        const res = await callKitchen('claimMaster').catch(() => ({ ok: false, msg: '绑定失败' }))
        wx.showToast({ title: res.ok ? '绑定成功' : res.msg, icon: res.ok ? 'success' : 'none' })
        if (res.ok) getApp().globalData.isMaster = true
        this.load()
      }
    })
  },

  goMenu() {
    wx.switchTab({ url: '/pages/menu/index' })
  }
})
