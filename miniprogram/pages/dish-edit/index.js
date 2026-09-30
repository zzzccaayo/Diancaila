const menu = require('../../utils/menu.js')
const { callKitchen } = require('../../utils/kitchen.js')

Page({
  data: {
    id: '',
    name: '',
    desc: '',
    icon: '',
    image: '',
    categories: [],
    categoryIndex: 0,
    uploading: false,
    saving: false
  },

  onLoad(query) {
    const g = getApp().globalData
    if (!g.isMaster) {
      wx.showToast({ title: '只有主人可以修改菜单', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 800)
      return
    }
    const categories = g.categories.length ? g.categories : menu.DEFAULT_CATEGORIES
    const dish = query.id && g.dishMap[query.id]
    if (dish) {
      this.setData({
        id: dish._id,
        name: dish.name,
        desc: dish.desc || '',
        icon: dish.icon || '',
        image: dish.image || '',
        categories,
        categoryIndex: Math.max(0, categories.indexOf(dish.category))
      })
    } else {
      this.setData({ categories })
      wx.setNavigationBarTitle({ title: '添加新菜' })
    }
  },

  onNameInput(e) { this.setData({ name: e.detail.value }) },
  onDescInput(e) { this.setData({ desc: e.detail.value }) },
  onIconInput(e) { this.setData({ icon: e.detail.value }) },
  onCategoryChange(e) { this.setData({ categoryIndex: Number(e.detail.value) }) },

  async chooseImage() {
    if (this.data.uploading) return
    let filePath
    try {
      const res = await wx.chooseMedia({ count: 1, mediaType: ['image'], sizeType: ['compressed'] })
      filePath = res.tempFiles[0].tempFilePath
    } catch (e) {
      return // 取消选择
    }
    this.setData({ uploading: true })
    wx.showLoading({ title: '上传中' })
    try {
      const ext = (filePath.match(/\.(\w+)$/) || [, 'jpg'])[1]
      const cloudPath = `dishes/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const up = await wx.cloud.uploadFile({ cloudPath, filePath })
      this.setData({ image: up.fileID })
      wx.hideLoading()
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: '图片上传失败', icon: 'none' })
    }
    this.setData({ uploading: false })
  },

  removeImage() {
    this.setData({ image: '' })
  },

  async save() {
    const { id, name, desc, icon, image, categories, categoryIndex, saving, uploading } = this.data
    if (saving || uploading) return
    if (!name.trim()) {
      wx.showToast({ title: '请填写菜名', icon: 'none' })
      return
    }
    this.setData({ saving: true })
    wx.showLoading({ title: '保存中' })
    try {
      const res = await callKitchen('saveDish', {
        dish: { id, name, desc, icon, image, category: categories[categoryIndex] }
      })
      if (!res.ok) throw new Error(res.msg)
      await menu.load()
      wx.hideLoading()
      wx.showToast({ title: '已保存', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 600)
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: e.message || '保存失败', icon: 'none' })
      this.setData({ saving: false })
    }
  },

  remove() {
    wx.showModal({
      title: '删除菜品',
      content: `确定删除「${this.data.name}」吗？`,
      confirmColor: '#ff4d4f',
      success: async ({ confirm }) => {
        if (!confirm) return
        wx.showLoading({ title: '删除中' })
        try {
          const res = await callKitchen('deleteDish', { id: this.data.id })
          if (!res.ok) throw new Error(res.msg)
          await menu.load()
          wx.hideLoading()
          wx.navigateBack()
        } catch (e) {
          wx.hideLoading()
          wx.showToast({ title: e.message || '删除失败', icon: 'none' })
        }
      }
    })
  }
})
