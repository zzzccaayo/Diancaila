const menu = require('../data/menu.js')

// 菜品 id -> 菜品
const dishMap = {}
menu.forEach(cat => cat.dishes.forEach(d => { dishMap[d.id] = d }))

function getCart() {
  return getApp().globalData.cart
}

function change(dishId, delta) {
  const cart = getCart()
  const n = (cart[dishId] || 0) + delta
  if (n <= 0) delete cart[dishId]
  else cart[dishId] = n
}

function clear() {
  getApp().globalData.cart = {}
}

// 汇总：已选菜品列表、总数量、总价
function summary() {
  const cart = getCart()
  const items = Object.keys(cart).map(id => ({ ...dishMap[id], count: cart[id] }))
  const totalCount = items.reduce((s, i) => s + i.count, 0)
  // 用“分”计算避免小数误差
  const totalCents = items.reduce((s, i) => s + Math.round(i.price * 100) * i.count, 0)
  return { items, totalCount, totalPrice: (totalCents / 100).toFixed(2) }
}

module.exports = { menu, change, clear, summary, getCart }
