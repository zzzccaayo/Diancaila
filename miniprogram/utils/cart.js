// 购物车：{ [菜品 _id]: 数量 }，保存在 globalData.cart

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

// 汇总：已选菜品列表、总份数（每份一个亲亲）
function summary() {
  const cart = getCart()
  const dishMap = getApp().globalData.dishMap
  // 已被主人删除的菜品从购物车移除
  Object.keys(cart).forEach(id => { if (!dishMap[id]) delete cart[id] })
  const items = Object.keys(cart).map(id => ({ ...dishMap[id], count: cart[id] }))
  const totalCount = items.reduce((s, i) => s + i.count, 0)
  return { items, totalCount }
}

module.exports = { change, clear, summary, getCart }
