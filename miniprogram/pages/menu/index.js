const cart = require('../../utils/cart.js')

Page({
  data: {
    menu: cart.menu,
    activeCat: cart.menu[0].id,
    scrollTo: '',
    counts: {},
    totalCount: 0,
    totalPrice: '0.00'
  },

  onShow() {
    // 从结算页返回时刷新数量
    this.refresh()
  },

  refresh() {
    const s = cart.summary()
    this.setData({
      counts: { ...cart.getCart() },
      totalCount: s.totalCount,
      totalPrice: s.totalPrice
    })
  },

  onTapCat(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ activeCat: id, scrollTo: 'cat-' + id })
  },

  onAdd(e) {
    cart.change(e.currentTarget.dataset.id, 1)
    this.refresh()
  },

  onMinus(e) {
    cart.change(e.currentTarget.dataset.id, -1)
    this.refresh()
  },

  goCheckout() {
    if (this.data.totalCount === 0) {
      wx.showToast({ title: '请先选择菜品', icon: 'none' })
      return
    }
    wx.navigateTo({ url: '/pages/checkout/index' })
  }
})
