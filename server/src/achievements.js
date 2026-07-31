export const ACHIEVEMENTS = [
  { id: 'first_purchase', name: '第一单', desc: '完成第一笔购买', icon: '🛒', condition: 'purchase>=1' },
  { id: 'buy_10', name: '购物达人', desc: '累计购买10件商品', icon: '📦', condition: 'purchase>=10' },
  { id: 'buy_100', name: '购物狂人', desc: '累计购买100件商品', icon: '💎', condition: 'purchase>=100' },
  { id: 'buy_500', name: '剁手党', desc: '累计购买500件商品', icon: '🔥', condition: 'purchase>=500' },
  { id: 'buy_1000', name: '购物之神', desc: '累计购买1000件商品', icon: '👑', condition: 'purchase>=1000' },
  { id: 'first_house', name: '有房一族', desc: '购置第一套房产', icon: '🏠', condition: 'house>=1' },
  { id: 'first_car', name: '有车一族', desc: '购置第一辆汽车', icon: '🚗', condition: 'car>=1' },
  { id: 'first_stock', name: '投资新手', desc: '第一次买入股票', icon: '📈', condition: 'stock>=1' },
  { id: 'level_5', name: '小有名气', desc: '达到5级', icon: '⭐', condition: 'level>=5' },
  { id: 'level_10', name: '大名鼎鼎', desc: '达到10级', icon: '🌟', condition: 'level>=10' },
  { id: 'level_20', name: '传奇人物', desc: '达到20级', icon: '💫', condition: 'level>=20' },
  { id: 'game_10', name: '游戏达人', desc: '玩10次游戏', icon: '🎮', condition: 'game>=10' },
  { id: 'game_50', name: '游戏高手', desc: '玩50次游戏', icon: '🎯', condition: 'game>=50' },
  { id: 'checkin_7', name: '勤劳小蜜蜂', desc: '连续签到7天', icon: '🐝', condition: 'checkin>=7' },
  { id: 'rich_100w', name: '百万富翁', desc: '账户余额达到100万', icon: '💰', condition: 'balance>=1000000' },
  { id: 'rich_1000w', name: '千万富翁', desc: '账户余额达到1000万', icon: '🏦', condition: 'balance>=10000000' }
]

export function getLevel(experience) {
  // Level thresholds: level n requires cumulative XP
  // level 2: 100, level 3: 300, level 4: 600, level 5: 1000...
  // Using triangular numbers: level n requires 100 * (n*(n-1)/2)
  let level = 1
  while (experience >= 100 * (level * (level + 1) / 2)) {
    level++
  }
  return level
}

export function getLevelProgress(experience) {
  const level = getLevel(experience)
  const currentThreshold = 100 * ((level - 1) * level / 2)
  const nextThreshold = 100 * (level * (level + 1) / 2)
  const progress = Math.min(100, Math.floor((experience - currentThreshold) / (nextThreshold - currentThreshold) * 100))
  return { level, currentXP: experience, currentThreshold, nextThreshold, progress }
}

export function checkAchievements(user, stats) {
  const unlocked = user.achievements || []
  const newUnlocks = []
  ACHIEVEMENTS.forEach(a => {
    if (unlocked.includes(a.id)) return
    const [key, val] = a.condition.split('>=')
    const actual = key === 'level' ? getLevel(user.experience || 0) : (stats[key] || 0)
    if (actual >= parseInt(val)) {
      unlocked.push(a.id)
      newUnlocks.push(a)
    }
  })
  if (newUnlocks.length > 0) {
    user.achievements = unlocked
  }
  return newUnlocks
}
