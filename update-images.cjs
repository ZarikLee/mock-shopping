const fs = require('fs');
const path = require('path');

const productsPath = path.join(__dirname, 'src/data/products.json');

const categories = {
  phone: {
    ids: [
      'photo-1511707171634-5f897ff02aa9',
      'photo-1598327105666-5b893f3e0c0a',
      'photo-1610945415295-d9bbf067e59c',
      'photo-1565849904461-04a58ad377e0',
    ],
    keywords: ['iPhone', '手机', 'Phone', '华为.*Mate', '小米.*[0-9]', 'OPPO', 'vivo'],
  },
  computer: {
    ids: [
      'photo-1496181133206-80ce9b88a853',
      'photo-1517694712202-14dd9538aa97',
      'photo-1526374965328-7f61d4dc18c5',
      'photo-1460925895917-afdab827c52f',
    ],
    keywords: ['MacBook', '电脑', '计算机', 'ThinkPad', 'MateBook', 'RedmiBook', '拯救者'],
  },
  audio: {
    ids: [
      'photo-1505740420928-5e560c06d30e',
      'photo-1546435770-a3e426bf472b',
      'photo-1487215078519-5ac1f6bde578',
    ],
    keywords: ['耳机', 'AirPods', 'FreeBuds', 'WH-1000XM', '降噪', 'Audio', '音频'],
  },
  appliance: {
    ids: [
      'photo-1558618666-fcd25c85f82e',
      'photo-1545175709-9c5bbf6a4e4b',
    ],
    keywords: ['吸尘器', '空调', '冰箱', '洗碗机', '电饭煲', '家电', '美的.*KF', '格力', '海尔.*BCD', '戴森.*V', '戴森.*Airwrap', '苏泊尔.*SF'],
  },
  clothing: {
    ids: [
      'photo-1542291026-7eec264c27ff',
      'photo-1460353581641-37baddab0fa2',
      'photo-1551028719-00167b16eac5',
      'photo-1560343090-f0409e92791a',
      'photo-1491553895911-0055eca6402d',
    ],
    keywords: ['鞋', 'Nike', 'Adidas', '跑鞋', '运动鞋', 'Ultraboost', 'Air Force', '卫衣', 'T恤', '运动裤', '羊毛衫', '羽绒服', '服饰'],
  },
  beauty: {
    ids: [
      'photo-1596462502278-6bf8a284497b',
      'photo-1522335789203-aabd1fc54bc9',
      'photo-1570172619644-dfd03ed5d881',
      'photo-1599736793945-d1a2c89133d2',
    ],
    keywords: ['SK-II', '神仙水', '小灯泡', '雅诗兰黛', '小棕瓶', 'DW持妆', '粉底液', '欧莱雅', '美妆', '面膜', '精华', '保湿'],
  },
  food: {
    ids: [
      'photo-1504674900247-0877df9cc836',
      'photo-1565299624946-b28f40a0ae38',
      'photo-1540189549336-e6e99c3679fe',
      'photo-1565958015063-5b4b1eaf4c6d',
    ],
    keywords: ['零食', '食品', '坚果', '三只松鼠', '良品铺子', '肉脯', '黑芝麻', '大礼包', '每日坚果'],
  },
  home: {
    ids: [
      'photo-1555041469-a586c61ea9bc',
      'photo-1586023492125-2b9c5f2ef6a5',
      'photo-1507003211169-0a1dd7228f2d',
    ],
    keywords: ['家居', '沙发', '门锁', '智能门锁', '马桶盖', '炒锅', '扫地机器人', '除湿机', '家居'],
  },
  watch: {
    ids: [
      'photo-1523275335684-37898b6baf30',
      'photo-1524592094714-0f0654e20314',
    ],
    keywords: ['手表', 'Watch', 'watch'],
  },
  sunglasses: {
    ids: [
      'photo-1572635196237-14b3f281503f',
    ],
    keywords: ['sunglass', 'Sunglass', '墨镜', '太阳镜'],
  },
  bag: {
    ids: [
      'photo-1553062407-98eeb64c6a62',
    ],
    keywords: ['包', 'Bag', 'bag', '背包', '手提包'],
  },
};

function findCategory(product) {
  const name = product.name;
  const categoryName = product.category;

  for (const [catKey, cat] of Object.entries(categories)) {
    for (const kw of cat.keywords) {
      const regex = new RegExp(kw);
      if (regex.test(name)) {
        return catKey;
      }
    }
  }

  const categoryMap = {
    '手机': 'phone',
    '电脑': 'computer',
    '数码': 'audio',
    '家电': 'appliance',
    '服饰': 'clothing',
    '美妆': 'beauty',
    '食品': 'food',
    '家居': 'home',
  };

  return categoryMap[categoryName] || 'phone';
}

function pickIds(catKey, count) {
  const cat = categories[catKey];
  if (!cat) return [];
  const ids = cat.ids;
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(ids[i % ids.length]);
  }
  return result;
}

const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

products.forEach((product) => {
  const catKey = findCategory(product);
  const ids = categories[catKey].ids;

  const mainId = ids[product.id % ids.length];
  product.image = `https://images.unsplash.com/${mainId}?w=400&h=400&fit=crop`;

  const detailCount = product.images ? product.images.length : 3;
  const detailIds = [];
  for (let i = 0; i < detailCount; i++) {
    detailIds.push(ids[(product.id + i) % ids.length]);
  }
  product.images = detailIds.map((id) => `https://images.unsplash.com/${id}?w=800&h=800&fit=crop`);
});

fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), 'utf-8');
console.log(`Updated ${products.length} products with Unsplash image URLs`);
