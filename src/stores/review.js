import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'productReviews'

const defaultReviews = [
  { id: 1, productId: 1, userId: 101, username: '用户***8', avatar: 'https://picsum.photos/seed/user1/100/100', rating: 5, content: '非常满意！质量很好，物流也很快，包装很仔细。客服态度也很好，有问题及时解答。下次还会回购！', images: ['https://picsum.photos/seed/review1a/400/400', 'https://picsum.photos/seed/review1b/400/400'], specs: '256GB 深空黑', time: '2026-07-20 14:30:00', type: 'good' },
  { id: 2, productId: 1, userId: 102, username: '用户***2', avatar: 'https://picsum.photos/seed/user2/100/100', rating: 4, content: '整体还不错，做工精细，颜色跟图片一致。就是发货稍微慢了点，总体满意。', images: [], specs: '256GB 银色', time: '2026-07-18 09:15:00', type: 'good' },
  { id: 3, productId: 1, userId: 103, username: '用户***5', avatar: 'https://picsum.photos/seed/user3/100/100', rating: 3, content: '一般般吧，没有想象中那么好。功能倒是齐全，但手感不如上一代。凑合着用吧。', images: ['https://picsum.photos/seed/review3a/400/400'], specs: '256GB 深蓝色', time: '2026-07-15 16:45:00', type: 'neutral' },
  { id: 4, productId: 2, userId: 104, username: '用户***1', avatar: 'https://picsum.photos/seed/user4/100/100', rating: 5, content: '华为真的太强了！卫星通话功能太实用了，信号特别好。拍照效果也非常惊艳，值得推荐！', images: ['https://picsum.photos/seed/review4a/400/400', 'https://picsum.photos/seed/review4b/400/400'], specs: '512GB 雅丹黑', time: '2026-07-19 11:20:00', type: 'good' },
  { id: 5, productId: 2, userId: 105, username: '用户***9', avatar: 'https://picsum.photos/seed/user5/100/100', rating: 2, content: '不太满意，电池续航没有宣传的那么好。一天一充勉强够用，但重度使用撑不到一天。系统也有些小bug。', images: [], specs: '512GB 白沙银', time: '2026-07-14 20:00:00', type: 'bad' },
  { id: 6, productId: 3, userId: 106, username: '用户***3', avatar: 'https://picsum.photos/seed/user6/100/100', rating: 5, content: '徕卡拍照名不虚传！人像模式非常棒，系统流畅度也很好。性价比很高的小米旗舰！', images: ['https://picsum.photos/seed/review6a/400/400'], specs: '512GB 黑色', time: '2026-07-17 08:30:00', type: 'good' },
  { id: 7, productId: 3, userId: 107, username: '用户***6', avatar: 'https://picsum.photos/seed/user7/100/100', rating: 4, content: '手机很好，就是发热有点厉害，玩游戏的时候温度较高。其他方面都很满意。', images: [], specs: '512GB 白色', time: '2026-07-13 13:10:00', type: 'good' },
  { id: 8, productId: 4, userId: 108, username: '用户***4', avatar: 'https://picsum.photos/seed/user8/100/100', rating: 5, content: '哈苏影像太强了！人像拍照效果是目前用过最好的手机。系统也很流畅，充电速度很快。', images: ['https://picsum.photos/seed/review8a/400/400', 'https://picsum.photos/seed/review8b/400/400'], specs: '512GB 海阔天空', time: '2026-07-16 10:00:00', type: 'good' },
  { id: 9, productId: 5, userId: 109, username: '用户***7', avatar: 'https://picsum.photos/seed/user9/100/100', rating: 3, content: '一般水平，没有特别突出的亮点。蔡司镜头拍照还行，但系统体验一般，偶尔卡顿。', images: [], specs: '512GB 星际蓝', time: '2026-07-12 15:30:00', type: 'neutral' },
  { id: 10, productId: 6, userId: 110, username: '用户***0', avatar: 'https://picsum.photos/seed/user10/100/100', rating: 5, content: 'MacBook Pro太强了！M3 Pro芯片性能炸裂，剪辑视频丝滑流畅。屏幕显示效果顶级，值得入手！', images: ['https://picsum.photos/seed/review10a/400/400'], specs: '18GB+512GB 银色', time: '2026-07-11 17:00:00', type: 'good' },
]

export const useReviewStore = defineStore('review', () => {
  const reviews = ref(loadReviews())

  function loadReviews() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultReviews))
    return [...defaultReviews]
  }

  function saveReviews() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews.value))
  }

  function getReviews(productId) {
    return reviews.value.filter(r => r.productId === productId)
  }

  function addReview(review) {
    const newReview = {
      ...review,
      id: Date.now(),
      time: new Date().toLocaleString('zh-CN', { hour12: false }),
      type: review.rating >= 4 ? 'good' : review.rating >= 3 ? 'neutral' : 'bad'
    }
    reviews.value.unshift(newReview)
    saveReviews()
    return newReview
  }

  function getStats(productId) {
    const productReviews = getReviews(productId)
    const total = productReviews.length
    if (total === 0) {
      return { average: 0, total: 0, positive: 0, neutral: 0, negative: 0, positiveRate: '0%' }
    }
    const sum = productReviews.reduce((acc, r) => acc + r.rating, 0)
    const average = Math.round((sum / total) * 10) / 10
    const positive = productReviews.filter(r => r.type === 'good').length
    const neutral = productReviews.filter(r => r.type === 'neutral').length
    const negative = productReviews.filter(r => r.type === 'bad').length
    const positiveRate = Math.round((positive / total) * 100) + '%'
    return { average, total, positive, neutral, negative, positiveRate }
  }

  return {
    reviews,
    getReviews,
    addReview,
    getStats
  }
})
