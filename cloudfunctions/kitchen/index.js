// 后厨云函数：主人绑定、菜单读写、查看所有订单、标记完成
// 只有绑定的主人可以修改菜单、查看所有订单和修改订单状态
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const PENDING = '待制作'
const DONE = '已完成'
const CANCELLED = '已撤回'
const CATEGORIES = ['主菜', '配菜', '饮品']

// 第一次读取菜单时写入的默认菜品
const DEFAULT_DISHES = [
  ['主菜', '鲜炖鸡汤', '🍲'],
  ['主菜', '软烂牛肉清汤', '🥣'],
  ['主菜', '椰子鸡火锅', '🥥'],
  ['主菜', '潮汕牛肉火锅', '🫕'],
  ['主菜', '奥尔良鸡排', '🍗'],
  ['主菜', '饺子', '🥟'],
  ['配菜', '金针菇', '🍄'],
  ['配菜', '香菇', '🍄'],
  ['配菜', '虾滑', '🦐'],
  ['配菜', '鱼丸', '🐟'],
  ['配菜', '牛筋丸', '🍢'],
  ['配菜', '螺片', '🐚'],
  ['饮品', '抹茶拿铁', '🍵'],
  ['饮品', '冰美式', '🧊'],
  ['饮品', '拿铁', '☕'],
  ['饮品', '茉莉花茶', '🌼'],
  ['饮品', '茉莉奶茶', '🧋']
]

async function getMasterOpenid() {
  try {
    // 记录 id 沿用旧名 chef，已绑定的主人无需重新绑定
    const res = await db.collection('settings').doc('chef').get()
    return res.data.openid
  } catch (e) {
    // settings 集合或记录还不存在
    return null
  }
}

async function getDishes() {
  try {
    const res = await db.collection('dishes').orderBy('sort', 'asc').limit(100).get()
    return res.data
  } catch (e) {
    return null
  }
}

// dishes 集合不存在时创建并写入默认菜单；谁创建成功谁负责写入，避免重复
async function seedDishes() {
  try {
    await db.createCollection('dishes')
  } catch (e) {
    return
  }
  const now = Date.now()
  await Promise.all(DEFAULT_DISHES.map(([category, name, icon], i) =>
    db.collection('dishes').add({ data: { category, name, icon, desc: '', image: '', sort: now + i } })
  ))
}

async function deleteImage(fileID) {
  if (!fileID) return
  try { await cloud.deleteFile({ fileList: [fileID] }) } catch (e) { /* 忽略 */ }
}

function cleanDish(dish) {
  const name = String(dish.name || '').trim().slice(0, 20)
  const desc = String(dish.desc || '').trim().slice(0, 40)
  const category = CATEGORIES.includes(dish.category) ? dish.category : null
  const image = typeof dish.image === 'string' && dish.image.startsWith('cloud://') ? dish.image : ''
  const icon = String(dish.icon || '').slice(0, 8)
  if (!name) return { error: '请填写菜名' }
  if (!category) return { error: '请选择分类' }
  return { data: { name, desc, category, image, icon } }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const master = await getMasterOpenid()
  const isMaster = !!master && master === OPENID
  const deny = { ok: false, msg: '只有主人可以这样做哦' }

  switch (event.action) {
    case 'whoami':
      return { isMaster, hasMaster: !!master, openid: OPENID }

    case 'claimMaster': {
      if (master) return { ok: false, msg: '已经有主人了' }
      try { await db.createCollection('settings') } catch (e) { /* 已存在 */ }
      await db.collection('settings').doc('chef').set({ data: { openid: OPENID, boundAt: Date.now() } })
      return { ok: true }
    }

    case 'getMenu': {
      let dishes = await getDishes()
      if (dishes === null) {
        await seedDishes()
        dishes = (await getDishes()) || []
      }
      return { ok: true, dishes, categories: CATEGORIES, isMaster, hasMaster: !!master }
    }

    case 'saveDish': {
      if (!isMaster) return deny
      const { data, error } = cleanDish(event.dish || {})
      if (error) return { ok: false, msg: error }
      const id = event.dish.id
      if (id) {
        const old = await db.collection('dishes').doc(id).get().catch(() => null)
        if (!old) return { ok: false, msg: '菜品不存在' }
        await db.collection('dishes').doc(id).update({ data })
        if (old.data.image && old.data.image !== data.image) await deleteImage(old.data.image)
        return { ok: true, id }
      }
      const res = await db.collection('dishes').add({ data: { ...data, sort: Date.now() } })
      return { ok: true, id: res._id }
    }

    case 'deleteDish': {
      if (!isMaster) return deny
      const old = await db.collection('dishes').doc(event.id).get().catch(() => null)
      if (!old) return { ok: true }
      await db.collection('dishes').doc(event.id).remove()
      await deleteImage(old.data.image)
      return { ok: true }
    }

    case 'list': {
      if (!isMaster) return deny
      const res = await db.collection('orders').orderBy('createdAt', 'desc').limit(100).get()
      return { ok: true, orders: res.data }
    }

    case 'setStatus': {
      if (!isMaster) return deny
      // 只允许 待制作 <-> 已完成，已撤回的订单不能再改
      const from = { [DONE]: PENDING, [PENDING]: DONE }[event.status]
      if (!from) return { ok: false, msg: '无效的状态' }
      const res = await db.collection('orders').where({ _id: event.id, status: from }).update({
        data: { status: event.status, doneAt: event.status === DONE ? Date.now() : null }
      })
      if (!res.stats.updated) return { ok: false, msg: '订单状态已变化，请刷新' }
      return { ok: true }
    }

    case 'cancelOrder': {
      // 下单人自己撤回，且只能撤回还没做的订单
      const res = await db.collection('orders').where({ _id: event.id, _openid: OPENID, status: PENDING }).update({
        data: { status: CANCELLED, cancelledAt: Date.now() }
      })
      if (!res.stats.updated) return { ok: false, msg: '订单已经做好或已撤回，不能撤回了' }
      return { ok: true }
    }

    default:
      return { ok: false, msg: '未知操作' }
  }
}
