// 订单存储：优先存到云数据库 orders 集合；云开发不可用时存到本机缓存
const LOCAL_KEY = 'local_orders'

function formatTime(date) {
  const p = n => (n < 10 ? '0' + n : '' + n)
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}`
}

function useCloud() {
  return getApp().globalData.cloudReady
}

function saveLocal(order) {
  const list = wx.getStorageSync(LOCAL_KEY) || []
  list.unshift({ ...order, _id: 'local_' + Date.now() })
  wx.setStorageSync(LOCAL_KEY, list)
}

async function createOrder(order) {
  const now = new Date()
  const data = { ...order, status: '待制作', createdAt: now.getTime(), timeText: formatTime(now) }
  let error = '云开发未初始化'
  if (useCloud()) {
    try {
      const res = await wx.cloud.database().collection('orders').add({ data })
      // 通知主人有新订单（失败不影响下单）
      wx.cloud.callFunction({ name: 'kitchen', data: { action: 'notifyNewOrder', id: res._id } })
        .then(r => { if (!r.result.ok) console.warn('新订单提醒未发送', r.result) })
        .catch(e => console.warn('新订单提醒未发送', e))
      return { savedTo: 'cloud' }
    } catch (e) {
      console.warn('写入云数据库失败，改存本机（是否已创建 orders 集合？）', e)
      error = e.errMsg || e.message || String(e)
    }
  }
  saveLocal(data)
  return { savedTo: 'local', error }
}

async function listOrders() {
  if (useCloud()) {
    try {
      // 默认权限下只能读到自己创建的订单
      const res = await wx.cloud.database().collection('orders')
        .orderBy('createdAt', 'desc').limit(20).get()
      return res.data.concat(wx.getStorageSync(LOCAL_KEY) || [])
    } catch (e) {
      console.warn('读取云数据库失败，只显示本机订单', e)
    }
  }
  return wx.getStorageSync(LOCAL_KEY) || []
}

module.exports = { createOrder, listOrders }
