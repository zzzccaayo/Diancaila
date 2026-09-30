const cart = require('../../utils/cart.js')
const order = require('../../utils/order.js')

Page({
  data: {
    items: [],
    totalCount: 0,
    totalPrice: '0.00',
    tableNo: '',
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

  onTableInput(e) {
    this.setData({ tableNo: e.detail.value })
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  async submit() {
    const { items, totalCount, totalPrice, tableNo, remark, submitting } = this.data
    if (submitting) return
    if (!tableNo.trim()) {
      wx.showToast({ title: '请填写桌号', icon: 'none' })
      return
    }
    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中' })
    try {
      await order.createOrder({
        tableNo: tableNo.trim(),
        remark: remark.trim(),
        items: items.map(i => ({ id: i.id, name: i.name, price: i.price, count: i.count })),
        totalCount,
        totalPrice
      })
      cart.clear()
      wx.hideLoading()
      wx.showToast({ title: '下单成功', icon: 'success' })
      setTimeout(() => wx.switchTab({ url: '/pages/orders/index' }), 800)
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '下单失败，请重试', icon: 'none' })
      this.setData({ submitting: false })
    }
  }
})
