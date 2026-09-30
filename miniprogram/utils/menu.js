// 菜单：从云端读取（kitchen 云函数），本机缓存一份用于秒开
const { callKitchen } = require('./kitchen.js')

const CACHE_KEY = 'menu_cache'
const DEFAULT_CATEGORIES = ['主菜', '配菜', '饮品']

function app() {
  return getApp().globalData
}

function setDishes(dishes, categories) {
  const g = app()
  g.dishes = dishes
  g.categories = categories || DEFAULT_CATEGORIES
  g.dishMap = {}
  dishes.forEach(d => { g.dishMap[d._id] = d })
}

// 按分类分组，空分类不显示
function group() {
  const g = app()
  return g.categories
    .map((name, i) => ({ id: 'c' + i, name, dishes: g.dishes.filter(d => d.category === name) }))
    .filter(c => c.dishes.length)
}

function loadCache() {
  try {
    const c = wx.getStorageSync(CACHE_KEY)
    if (c && c.dishes) {
      setDishes(c.dishes, c.categories)
      return true
    }
  } catch (e) { /* 忽略 */ }
  return false
}

async function load() {
  if (!app().cloudReady) return { ok: false, msg: '云开发未初始化' }
  try {
    const res = await callKitchen('getMenu')
    if (!res || !res.ok) return { ok: false, msg: (res && res.msg) || '菜单加载失败' }
    setDishes(res.dishes, res.categories)
    app().isMaster = res.isMaster
    app().hasMaster = res.hasMaster
    wx.setStorageSync(CACHE_KEY, { dishes: res.dishes, categories: res.categories })
    return { ok: true }
  } catch (e) {
    console.warn('菜单加载失败（kitchen 云函数是否已上传部署？）', e)
    return { ok: false, msg: '菜单加载失败，请检查网络' }
  }
}

module.exports = { load, loadCache, group, DEFAULT_CATEGORIES }
