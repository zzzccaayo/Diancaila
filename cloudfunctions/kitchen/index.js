// 后厨云函数：绑定厨师、查看所有订单、标记完成
// 只有绑定的厨师可以查看所有订单和修改状态
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const STATUSES = ['待制作', '已完成']

async function getChefOpenid() {
  try {
    const res = await db.collection('settings').doc('chef').get()
    return res.data.openid
  } catch (e) {
    // settings 集合或 chef 记录还不存在
    return null
  }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const chef = await getChefOpenid()
  const isChef = !!chef && chef === OPENID

  switch (event.action) {
    case 'whoami':
      return { isChef, hasChef: !!chef }

    case 'claimChef': {
      if (chef) return { ok: false, msg: '已经绑定过厨师了' }
      try { await db.createCollection('settings') } catch (e) { /* 已存在 */ }
      await db.collection('settings').doc('chef').set({ data: { openid: OPENID, boundAt: Date.now() } })
      return { ok: true }
    }

    case 'list': {
      if (!isChef) return { ok: false, msg: '只有厨师可以查看所有订单' }
      const res = await db.collection('orders').orderBy('createdAt', 'desc').limit(100).get()
      return { ok: true, orders: res.data }
    }

    case 'setStatus': {
      if (!isChef) return { ok: false, msg: '只有厨师可以修改订单' }
      if (!STATUSES.includes(event.status)) return { ok: false, msg: '无效的状态' }
      await db.collection('orders').doc(event.id).update({
        data: { status: event.status, doneAt: event.status === '已完成' ? Date.now() : null }
      })
      return { ok: true }
    }

    default:
      return { ok: false, msg: '未知操作' }
  }
}
