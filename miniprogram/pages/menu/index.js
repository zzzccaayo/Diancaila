const menu = require('../../utils/menu.js')
const cart = require('../../utils/cart.js')

Page({
  data: {
    categories: [],
    activeCat: '',
    scrollTo: '',
    counts: {},
    totalCount: 0,
    isMaster: false,
    loading: true,
    error: ''
  },

  onLoad() {
    // 先用本机缓存秒开，再从云端刷新
    if (menu.loadCache()) this.applyMenu()
  },

  async onShow() {
    this.refreshCart()
    const res = await menu.load()
    if (res.ok) this.applyMenu()
    this.setData({ loading: false, error: res.ok ? '' : res.msg })
  },

  async onPullDownRefresh() {
    await this.onShow()
    wx.stopPullDownRefresh()
  },

  applyMenu() {
    const categories = menu.group()
    const ids = categories.map(c => c.id)
    this.setData({
      categories,
      isMaster: getApp().globalData.isMaster,
      activeCat: ids.includes(this.data.activeCat) ? this.data.activeCat : (ids[0] || '')
    })
    this.refreshCart()
  },

  refreshCart() {
    const s = cart.summary()
    this.setData({ counts: { ...cart.getCart() }, totalCount: s.totalCount })
  },

  onTapCat(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ activeCat: id, scrollTo: 'cat-' + id })
  },

  onAdd(e) {
    cart.change(e.currentTarget.dataset.id, 1)
    this.refreshCart()
  },

  onMinus(e) {
    cart.change(e.currentTarget.dataset.id, -1)
    this.refreshCart()
  },

  onEditDish(e) {
    wx.navigateTo({ url: '/pages/dish-edit/index?id=' + e.currentTarget.dataset.id })
  },

  onAddDish() {
    wx.navigateTo({ url: '/pages/dish-edit/index' })
  },

  goCheckout() {
    if (this.data.totalCount === 0) {
      wx.showToast({ title: '请先选择菜品', icon: 'none' })
      return
    }
    wx.navigateTo({ url: '/pages/checkout/index' })
  }
})
