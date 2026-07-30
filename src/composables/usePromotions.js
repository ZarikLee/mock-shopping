import promotions from '../data/promotions.json'

export const usePromotions = () => {
  const discountTiers = promotions
    .filter(p => p.threshold)
    .sort((a, b) => a.threshold - b.threshold)

  const getCurrentTier = (total) => {
    if (!total || total <= 0) return null
    let current = null
    for (const tier of discountTiers) {
      if (total >= tier.threshold) {
        current = tier
      } else {
        break
      }
    }
    return current
  }

  const getNextTier = (total) => {
    if (!total || total <= 0) return discountTiers[0] || null
    for (const tier of discountTiers) {
      if (total < tier.threshold) {
        return tier
      }
    }
    return null
  }

  const getProgress = (total) => {
    if (!total || total <= 0) return { percent: 0, current: null, next: discountTiers[0] || null }
    if (total >= discountTiers[discountTiers.length - 1]?.threshold) {
      return { percent: 100, current: discountTiers[discountTiers.length - 1], next: null }
    }
    const current = getCurrentTier(total)
    const next = getNextTier(total)
    const prevThreshold = current ? current.threshold : 0
    const percent = ((total - prevThreshold) / (next.threshold - prevThreshold)) * 100
    return { percent: Math.min(percent, 100), current, next }
  }

  const getMaxDiscount = (total) => {
    const tier = getCurrentTier(total)
    return tier ? tier.discount : 0
  }

  const getFlashPromotions = () => {
    return promotions.filter(p => p.type === 'flash')
  }

  const getNewUserPromotions = () => {
    return promotions.filter(p => p.type === 'new_user')
  }

  return {
    discountTiers,
    getCurrentTier,
    getNextTier,
    getProgress,
    getMaxDiscount,
    getFlashPromotions,
    getNewUserPromotions
  }
}
