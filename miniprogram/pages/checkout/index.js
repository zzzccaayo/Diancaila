const cart = require('../../utils/cart.js')
const order = require('../../utils/order.js')

Page({
  data: {
    items: [],
    totalCount: 0,
    remark: '',
    submitting: false
  },

  onShow() {
    this.refresh()
  },

  refresh() {
    this.setData(cart.summary())
  },

  onAdd(e) {
    cart.change(e.currentTarget.dataset.id, 1)
    this.refresh()
  },

  onMinus(e) {
    cart.change(e.currentTarget.dataset.id, -1)
    this.refresh()
    if (this.data.totalCount === 0) wx.navigateBack()
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  async submit() {
    const { items, totalCount, remark, submitting } = this.data
    if (submitting) return
    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中' })
    try {
      const { savedTo, error } = await order.createOrder({
        remark: remark.trim(),
        items: items.map(i => ({ id: i._id, name: i.name, count: i.count })),
        totalCount
      })
      cart.clear()
      wx.hideLoading()
      if (savedTo === 'cloud') {
        wx.showToast({ title: '下单成功', icon: 'success' })
        setTimeout(() => wx.switchTab({ url: '/pages/orders/index' }), 800)
      } else {
        wx.showModal({
          title: '下单成功',
          content: '订单已保存在本机，未能写入云数据库。原因：' + error,
          showCancel: false,
          success: () => wx.switchTab({ url: '/pages/orders/index' })
        })
      }
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '下单失败，请重试', icon: 'none' })
      this.setData({ submitting: false })
    }
  }
})
