const fs = require('fs');
const products = require('./src/data/products.json');

const IDS = {
  // Verified working Unsplash photo IDs
  phone1: '1511707171634-5f897ff02aa9',
  phone2: '1565849904461-04a58ad377e0',
  phone3: '1610945415295-d9bbf067e59c',
  laptop1: '1496181133206-80ce9b88a853',
  laptop2: '1517694712202-14dd9538aa97',
  laptop3: '1460925895917-afdab827c52f',
  headphone1: '1505740420928-5e560c06d30e',
  headphone2: '1546435770-a3e426bf472b',
  home1: '1555041469-a586c61ea9bc',
  home2: '1553062407-98eeb64c6a62',
  shoe1: '1542291026-7eec264c27ff',
  shoe2: '1551028719-00167b16eac5',
  shoe3: '1560343090-f0409e92791a',
  shoe4: '1491553895911-0055eca6402d',
  beauty1: '1522335789203-aabd1fc54bc9',
  beauty2: '1598532163257-ae3c6b2524b6',
  food1: '1504674900247-0877df9cc836',
  food2: '1565299624946-b28f40a0ae38',
  food3: '1540189549336-e6e99c3679fe',
  watch: '1523275335684-37898b6baf30',
  sunglasses: '1572635196237-14b3f281503f',
  bag: '1553062407-98eeb64c6a62',
  drink: '1495474472287-4d71bcdd2085',
};

function match(product) {
  const n = (product.name + ' ' + (product.brand || '')).toLowerCase();
  const cat = product.category;

  // Phones
  if (cat === '手机') {
    if (n.includes('iphone') || n.includes('apple')) return IDS.phone1;
    if (n.includes('华为')) return IDS.phone2;
    return IDS.phone3;
  }

  // Computers
  if (cat === '电脑') {
    if (n.includes('macbook') || n.includes('apple')) return IDS.laptop1;
    if (n.includes('thinkpad') || n.includes('联想')) return IDS.laptop2;
    return IDS.laptop3;
  }

  // Audio
  if (cat === '数码') {
    if (n.includes('sony') || n.includes('耳机')) return IDS.headphone1;
    return IDS.headphone2;
  }

  // Appliances
  if (cat === '家电') {
    if (n.includes('戴森')) return IDS.home1;
    return IDS.home2;
  }

  // Clothing
  if (cat === '服饰') {
    if (n.includes('nike') || n.includes('鞋') || n.includes('跑')) return IDS.shoe1;
    if (n.includes('优衣库') || n.includes('t恤')) return IDS.shoe2;
    if (n.includes('李宁') || n.includes('安踏')) return IDS.shoe3;
    return IDS.shoe4;
  }

  // Beauty
  if (cat === '美妆') {
    if (n.includes('sk-ii') || n.includes('神仙水')) return IDS.beauty1;
    return IDS.beauty2;
  }

  // Food
  if (cat === '食品') {
    if (n.includes('坚果') || n.includes('良品铺子')) return IDS.food1;
    if (n.includes('三只松鼠')) return IDS.food2;
    return IDS.food3;
  }

  // Home
  if (cat === '家居') return IDS.home2;

  return IDS.watch;
}

const BASE = 'https://images.unsplash.com/photo-';

products.forEach((p) => {
  const id = match(p);
  p.image = `${BASE}${id}?w=400&h=400&fit=crop`;
  p.images = [];
  for (let j = 0; j < 4; j++) {
    const altId = j === 0 ? id : (Object.values(IDS)[j % Object.values(IDS).length]);
    p.images.push(`${BASE}${altId}?w=800&h=800&fit=crop`);
  }
});

fs.writeFileSync('./src/data/products.json', JSON.stringify(products, null, 2));
console.log(`Updated ${products.length} products`);
