// 调用后厨云函数
async function callKitchen(action, data = {}) {
  const res = await wx.cloud.callFunction({ name: 'kitchen', data: { action, ...data } })
  return res.result
}

module.exports = { callKitchen }
