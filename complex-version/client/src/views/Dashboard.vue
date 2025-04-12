<template>
  <div class="dashboard">
    <div class="container">
      <h1>控制面板</h1>
      
      <div class="dashboard-grid">
        <div class="card domain-manager">
          <h2>域名管理</h2>
          <div class="domain-form">
            <input 
              type="text" 
              v-model="newDomain" 
              placeholder="输入域名，例如: example.com" 
              @keyup.enter="addDomain"
            >
            <button @click="addDomain" class="btn">添加</button>
          </div>
          
          <div class="domain-list">
            <div v-if="domains.length === 0" class="empty-message">
              尚未添加域名，请在上方输入框添加域名
            </div>
            <div v-for="(domain, index) in domains" :key="index" class="domain-item">
              <span>{{ domain }}</span>
              <button @click="removeDomain(index)" class="btn-remove">删除</button>
            </div>
          </div>
        </div>
        
        <div class="card performance-stats">
          <h2>性能统计</h2>
          <div v-if="domains.length === 0" class="empty-message">
            添加域名后将显示性能数据
          </div>
          <div v-else>
            <div class="stats-grid">
              <div v-for="(domain, index) in domains" :key="index" class="stat-item">
                <h3>{{ domain }}</h3>
                <div class="stat-metrics">
                  <div class="metric">
                    <span class="metric-label">延迟:</span>
                    <span class="metric-value">{{ getRandomLatency() }}ms</span>
                  </div>
                  <div class="metric">
                    <span class="metric-label">DNS解析:</span>
                    <span class="metric-value">{{ getRandomDNSTime() }}ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card routing-settings">
          <h2>路由设置</h2>
          <div class="settings-form">
            <div class="form-group">
              <label>
                <input type="checkbox" v-model="autoRedirect">
                启用自动重定向
              </label>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" v-model="considerGeoLocation">
                考虑地理位置因素
              </label>
            </div>
            <div class="form-group">
              <label>优先考虑因素:</label>
              <select v-model="priorityFactor">
                <option value="latency">网络延迟</option>
                <option value="dns">DNS解析时间</option>
                <option value="combined">综合评分</option>
              </select>
            </div>
            <button @click="saveSettings" class="btn">保存设置</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Dashboard',
  data() {
    return {
      domains: [],
      newDomain: '',
      autoRedirect: true,
      considerGeoLocation: true,
      priorityFactor: 'combined'
    };
  },
  methods: {
    addDomain() {
      if (!this.newDomain) return;
      
      // 简单的域名验证
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
      if (!domainRegex.test(this.newDomain)) {
        alert('请输入有效的域名格式');
        return;
      }
      
      if (!this.domains.includes(this.newDomain)) {
        this.domains.push(this.newDomain);
        this.newDomain = '';
        this.saveDomains();
      } else {
        alert('该域名已存在');
      }
    },
    removeDomain(index) {
      this.domains.splice(index, 1);
      this.saveDomains();
    },
    saveSettings() {
      localStorage.setItem('autoRedirect', this.autoRedirect);
      localStorage.setItem('considerGeoLocation', this.considerGeoLocation);
      localStorage.setItem('priorityFactor', this.priorityFactor);
      alert('设置已保存');
    },
    saveDomains() {
      localStorage.setItem('domains', JSON.stringify(this.domains));
    },
    loadSavedData() {
      const savedDomains = localStorage.getItem('domains');
      if (savedDomains) {
        this.domains = JSON.parse(savedDomains);
      }
      
      this.autoRedirect = localStorage.getItem('autoRedirect') !== 'false';
      this.considerGeoLocation = localStorage.getItem('considerGeoLocation') !== 'false';
      this.priorityFactor = localStorage.getItem('priorityFactor') || 'combined';
    },
    // 模拟数据，实际项目中应该从后端API获取
    getRandomLatency() {
      return Math.floor(Math.random() * 150 + 50);
    },
    getRandomDNSTime() {
      return Math.floor(Math.random() * 80 + 20);
    }
  },
  mounted() {
    this.loadSavedData();
  }
}
</script>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 768px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .routing-settings {
    grid-column: span 2;
  }
}

.domain-form {
  display: flex;
  margin-bottom: 1rem;
}

.domain-form input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px 0 0 4px;
  font-size: 1rem;
}

.domain-form button {
  border-radius: 0 4px 4px 0;
}

.domain-list {
  max-height: 300px;
  overflow-y: auto;
}

.domain-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
}

.domain-item:last-child {
  border-bottom: none;
}

.btn-remove {
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.3rem 0.6rem;
  cursor: pointer;
}

.btn-remove:hover {
  background-color: #c0392b;
}

.empty-message {
  text-align: center;
  padding: 2rem;
  color: #777;
  font-style: italic;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-item {
  background-color: #f9f9f9;
  border-radius: 6px;
  padding: 1rem;
}

.stat-item h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1rem;
  color: var(--primary-color);
}

.metric {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.metric-label {
  color: #777;
}

.metric-value {
  font-weight: bold;
}

.settings-form {
  max-width: 500px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 1rem;
}

select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}
</style> 