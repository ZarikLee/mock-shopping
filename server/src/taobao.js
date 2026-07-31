import crypto from 'crypto';
import axios from 'axios';

const APP_KEY = '35376474';
const APP_SECRET = '243f370b607d1e4e4466beb21965ce91';
const API_URL = 'https://eco.taobao.com/router/rest';

function sign(params, secret) {
  const sorted = Object.keys(params).sort();
  const str = sorted.map(k => `${k}${params[k]}`).join('');
  return crypto.createHmac('md5', secret).update(str).digest('hex').toUpperCase();
}

export async function searchTaoBao(keyword, page = 1) {
  const params = {
    method: 'taobao.tbk.item.get',
    app_key: APP_KEY,
    timestamp: new Date().toISOString().replace(/\.\d{3}/, '').replace('Z', '+08:00'),
    format: 'json',
    v: '2.0',
    sign_method: 'hmac',
    q: keyword,
    page_no: page,
    page_size: 20
  };
  params.sign = sign(params, APP_SECRET);

  try {
    const res = await axios.get(API_URL, { params });
    const data = res.data;
    if (data.tbk_item_get_response?.results?.tbk_item) {
      return data.tbk_item_get_response.results.tbk_item.map(item => ({
        id: item.num_iid,
        name: item.title,
        price: parseFloat(item.zk_final_price),
        originalPrice: parseFloat(item.reserve_price) || parseFloat(item.zk_final_price),
        image: item.pict_url,
        images: [item.pict_url, item.small_images?.string || item.pict_url].flat(),
        sales: item.volume || 0,
        shop: item.nick || '淘宝店铺',
        brand: item.provcity || '',
        description: item.item_desc || '',
        category: item.cat_name || ''
      }));
    }
    if (data.error_response) {
      console.error('Taobao API error:', data.error_response);
      return [];
    }
    return [];
  } catch (err) {
    console.error('Taobao request failed:', err.message);
    return [];
  }
}
