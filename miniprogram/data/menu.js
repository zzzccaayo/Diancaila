// 菜单数据：在这里增删改菜品即可
// price 单位：元
module.exports = [
  {
    id: 'hot',
    name: '热销推荐',
    dishes: [
      { id: 'd1', name: '宫保鸡丁', desc: '花生香脆，微辣下饭', price: 28, icon: '🍗' },
      { id: 'd2', name: '鱼香肉丝', desc: '酸甜咸鲜，经典川菜', price: 26, icon: '🥢' }
    ]
  },
  {
    id: 'meat',
    name: '荤菜',
    dishes: [
      { id: 'd3', name: '红烧肉', desc: '肥而不腻，入口即化', price: 38, icon: '🥩' },
      { id: 'd4', name: '糖醋排骨', desc: '外酥里嫩，酸甜可口', price: 42, icon: '🍖' },
      { id: 'd5', name: '水煮鱼', desc: '麻辣鲜香，鱼片滑嫩', price: 48, icon: '🐟' }
    ]
  },
  {
    id: 'veg',
    name: '素菜',
    dishes: [
      { id: 'd6', name: '清炒时蔬', desc: '当季新鲜蔬菜', price: 16, icon: '🥬' },
      { id: 'd7', name: '麻婆豆腐', desc: '麻辣烫嫩', price: 18, icon: '🧈' },
      { id: 'd8', name: '地三鲜', desc: '茄子土豆青椒', price: 20, icon: '🍆' }
    ]
  },
  {
    id: 'staple',
    name: '主食',
    dishes: [
      { id: 'd9', name: '米饭', desc: '东北大米', price: 2, icon: '🍚' },
      { id: 'd10', name: '扬州炒饭', desc: '粒粒分明', price: 18, icon: '🍛' }
    ]
  },
  {
    id: 'drink',
    name: '饮品',
    dishes: [
      { id: 'd11', name: '酸梅汤', desc: '冰镇解腻', price: 8, icon: '🥤' },
      { id: 'd12', name: '柠檬茶', desc: '现泡鲜柠檬', price: 10, icon: '🍋' }
    ]
  }
]
