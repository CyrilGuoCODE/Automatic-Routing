<template>
  <div class="home">
    <div class="container">
      <h1>Automatic-Routing 智能域名路由系统</h1>
      <div class="hero-section">
        <div class="hero-content">
          <h2>优化您的网站访问体验</h2>
          <p>自动选择最佳域名路径，减少加载时间，提升用户体验。</p>
          <router-link to="/dashboard" class="btn">开始使用</router-link>
        </div>
        <div class="hero-image">
          <img src="../assets/network.svg" alt="网络连接示意图" />
        </div>
      </div>

      <div class="features">
        <div class="feature-card">
          <h3>多域名管理</h3>
          <p>轻松添加和管理多个指向同一服务的域名。</p>
        </div>
        <div class="feature-card">
          <h3>实时性能监测</h3>
          <p>监测各域名的访问延迟和DNS解析时间。</p>
        </div>
        <div class="feature-card">
          <h3>地理位置感知</h3>
          <p>根据用户地理位置智能选择最佳服务器。</p>
        </div>
        <div class="feature-card">
          <h3>自动重定向</h3>
          <p>无缝将用户重定向到性能最佳的域名。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home'
}
</script>

<style scoped>
.home {
  text-align: center;
}

h1 {
  margin-bottom: 2rem;
  color: var(--primary-color);
}

.hero-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 3rem 0;
  flex-wrap: wrap;
}

.hero-content {
  flex: 1;
  min-width: 300px;
  text-align: left;
}

.hero-image {
  flex: 1;
  min-width: 300px;
  max-width: 500px;
  margin: 0 auto;
}

.hero-image img {
  width: 100%;
  height: auto;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
  margin: 4rem 0;
}

.feature-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  transition: transform 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-card h3 {
  color: var(--primary-color);
  margin-top: 0;
}

@media (max-width: 768px) {
  .hero-section {
    flex-direction: column;
  }
  
  .hero-content {
    text-align: center;
    margin-bottom: 2rem;
  }
}
</style> 