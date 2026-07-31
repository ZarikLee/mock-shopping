export const ACHIEVEMENTS = [
  { id: 'first_purchase', name: '第一单', desc: '完成第一笔购买', icon: 'ShoppingCart' },
  { id: 'buy_10', name: '购物达人', desc: '累计购买10件商品', icon: 'Box' },
  { id: 'buy_100', name: '购物狂人', desc: '累计购买100件商品', icon: 'Trophy' },
  { id: 'buy_500', name: '剁手党', desc: '累计购买500件商品', icon: 'Star' },
  { id: 'buy_1000', name: '购物之神', desc: '累计购买1000件商品', icon: 'GoldMedal' },
  { id: 'first_house', name: '有房一族', desc: '购置第一套房产', icon: 'House' },
  { id: 'first_car', name: '有车一族', desc: '购置第一辆汽车', icon: 'Van' },
  { id: 'first_stock', name: '投资新手', desc: '第一次买入股票', icon: 'TrendCharts' },
  { id: 'level_5', name: '小有名气', desc: '达到5级', icon: 'StarFilled' },
  { id: 'level_10', name: '大名鼎鼎', desc: '达到10级', icon: 'Medal' },
  { id: 'level_20', name: '传奇人物', desc: '达到20级', icon: 'Collection' },
  { id: 'game_10', name: '游戏达人', desc: '玩10次游戏', icon: 'Coin' },
  { id: 'game_50', name: '游戏高手', desc: '玩50次游戏', icon: 'Aim' },
  { id: 'checkin_7', name: '勤劳小蜜蜂', desc: '连续签到7天', icon: 'AlarmClock' },
  { id: 'rich_100w', name: '百万富翁', desc: '账户余额达到100万', icon: 'Wallet' },
  { id: 'rich_1000w', name: '千万富翁', desc: '账户余额达到1000万', icon: 'Money' }
]

export function getLevel(experience) {
  let level = 1
  while (experience >= 100 * (level * (level + 1) / 2)) level++
  return level
}

export function getLevelProgress(experience) {
  const level = getLevel(experience)
  const currentThreshold = 100 * ((level - 1) * level / 2)
  const nextThreshold = 100 * (level * (level + 1) / 2)
  const progress = Math.min(100, Math.floor((experience - currentThreshold) / (nextThreshold - currentThreshold) * 100))
  return { level, currentXP: experience, currentThreshold, nextThreshold, progress }
}
