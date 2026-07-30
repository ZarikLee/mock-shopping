<template>
  <footer class="footer">
    <!-- 服务保障 -->
    <div class="footer-services">
      <div class="container">
        <div class="service-item">
          <el-icon :size="24"><CircleCheck /></el-icon>
          <div class="service-info">
            <span class="title">正品保障</span>
            <span class="desc">正品行货，品质保证</span>
          </div>
        </div>
        <div class="service-item">
          <el-icon :size="24"><Van /></el-icon>
          <div class="service-info">
            <span class="title">极速配送</span>
            <span class="desc">闪电发货，快速送达</span>
          </div>
        </div>
        <div class="service-item">
          <el-icon :size="24"><RefreshRight /></el-icon>
          <div class="service-info">
            <span class="title">七天退换</span>
            <span class="desc">无忧退换，售后保障</span>
          </div>
        </div>
        <div class="service-item">
          <el-icon :size="24"><Service /></el-icon>
          <div class="service-info">
            <span class="title">在线客服</span>
            <span class="desc">24小时在线，贴心服务</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 主体内容 -->
    <div class="footer-main">
      <div class="container">
        <div class="footer-links">
          <div class="link-group">
            <h4>购物指南</h4>
            <ul>
              <li><a href="#">购物流程</a></li>
              <li><a href="#">会员介绍</a></li>
              <li><a href="#">生活旅行</a></li>
              <li><a href="#">常见问题</a></li>
            </ul>
          </div>
          <div class="link-group">
            <h4>配送方式</h4>
            <ul>
              <li><a href="#">配送说明</a></li>
              <li><a href="#">配送范围</a></li>
              <li><a href="#">验货签收</a></li>
              <li><a href="#">配送费收取</a></li>
            </ul>
          </div>
          <div class="link-group">
            <h4>支付方式</h4>
            <ul>
              <li><a href="#">货到付款</a></li>
              <li><a href="#">在线支付</a></li>
              <li><a href="#">分期付款</a></li>
              <li><a href="#">公司转账</a></li>
            </ul>
          </div>
          <div class="link-group">
            <h4>售后服务</h4>
            <ul>
              <li><a href="#">退换货政策</a></li>
              <li><a href="#">退换货流程</a></li>
              <li><a href="#">价格保护</a></li>
              <li><a href="#">退款说明</a></li>
            </ul>
          </div>
          <div class="link-group">
            <h4>关于我们</h4>
            <ul>
              <li><a href="#">关于淘大宝</a></li>
              <li><a href="#">联系我们</a></li>
              <li><a href="#">招贤纳士</a></li>
              <li><a href="#">友情链接</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-contact">
          <div class="contact-item">
            <span class="label">客服热线</span>
            <span class="value">400-888-8888</span>
          </div>
          <div class="contact-item">
            <span class="label">工作时间</span>
            <span class="value">周一至周日 9:00-21:00</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部版权 -->
    <div class="footer-bottom">
      <div class="container">
        <p>© 2026 淘大宝 版权所有 | 快乐购物体验</p>
        <p class="tips">淘大宝 - 快乐购物，应有尽有，所有交易均为虚拟</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { CircleCheck, Van, RefreshRight, Service } from '@element-plus/icons-vue'
</script>

<style scoped>
.footer {
  background: #fff;
  margin-top: 40px;
}

.footer-services {
  background: #f8f8f8;
  border-top: 1px solid #e8e8e8;
  border-bottom: 1px solid #e8e8e8;
  padding: 20px 0;
}

.footer-services .container {
  display: flex;
  justify-content: space-around;
}

.service-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.service-info {
  display: flex;
  flex-direction: column;
}

.service-info .title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

.service-info .desc {
  font-size: 12px;
  color: #999;
}

.footer-main {
  padding: 40px 0;
}

.footer-links {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
}

.link-group h4 {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
}

.link-group ul li {
  margin-bottom: 10px;
}

.link-group ul li a {
  font-size: 13px;
  color: #666;
  transition: color 0.3s;
}

.link-group ul li a:hover {
  color: #ff4400;
}

.footer-contact {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding-top: 20px;
  border-top: 1px solid #e8e8e8;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.contact-item .label {
  font-size: 14px;
  color: #999;
}

.contact-item .value {
  font-size: 18px;
  font-weight: bold;
  color: #ff4400;
}

.footer-bottom {
  background: #333;
  padding: 20px 0;
  text-align: center;
}

.footer-bottom p {
  font-size: 13px;
  color: #999;
  margin-bottom: 5px;
}

.footer-bottom .tips {
  font-size: 12px;
  color: #666;
}

@media (max-width: 768px) {
  .footer-services .container {
    flex-wrap: wrap;
    gap: 20px;
  }
  
  .service-item {
    width: calc(50% - 10px);
  }
  
  .footer-links {
    flex-wrap: wrap;
    gap: 20px;
  }
  
  .link-group {
    width: calc(33.33% - 15px);
  }
  
  .footer-contact {
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }
}
</style>
