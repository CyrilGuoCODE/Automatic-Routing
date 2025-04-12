const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const geoip = require('geoip-lite');
const axios = require('axios');

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(express.json());

// 路由
// 1. 获取用户地理位置
app.get('/api/location', (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const geo = geoip.lookup(ip);
    
    res.json({
      success: true,
      data: {
        ip,
        location: geo || { country: 'Unknown', region: 'Unknown', city: 'Unknown' }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取地理位置失败',
      error: error.message
    });
  }
});

// 2. 测试域名延迟
app.post('/api/test-latency', async (req, res) => {
  try {
    const { domains } = req.body;
    
    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的域名列表'
      });
    }
    
    const results = await Promise.all(domains.map(async (domain) => {
      try {
        const startTime = Date.now();
        const response = await axios.get(`http://${domain}`, {
          timeout: 5000
        });
        const endTime = Date.now();
        
        return {
          domain,
          latency: endTime - startTime,
          status: response.status,
          success: true
        };
      } catch (error) {
        return {
          domain,
          latency: -1,
          status: error.response?.status || 0,
          success: false,
          error: error.message
        };
      }
    }));
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '测试域名延迟失败',
      error: error.message
    });
  }
});

// 3. 测试DNS解析时间
app.post('/api/test-dns', async (req, res) => {
  try {
    const { domains } = req.body;
    
    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的域名列表'
      });
    }
    
    const results = await Promise.all(domains.map(async (domain) => {
      try {
        const startTime = Date.now();
        // 使用DNS查询
        await new Promise((resolve, reject) => {
          const dns = require('dns');
          dns.lookup(domain, (err, address) => {
            if (err) reject(err);
            else resolve(address);
          });
        });
        const endTime = Date.now();
        
        return {
          domain,
          dnsTime: endTime - startTime,
          success: true
        };
      } catch (error) {
        return {
          domain,
          dnsTime: -1,
          success: false,
          error: error.message
        };
      }
    }));
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '测试DNS解析时间失败',
      error: error.message
    });
  }
});

// 4. 获取最佳域名
app.post('/api/best-domain', async (req, res) => {
  try {
    const { domains, priorityFactor, considerGeoLocation } = req.body;
    
    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的域名列表'
      });
    }
    
    // 获取延迟和DNS数据
    const latencyResults = await Promise.all(domains.map(async (domain) => {
      try {
        const startTime = Date.now();
        await axios.get(`http://${domain}`, { timeout: 5000 });
        const endTime = Date.now();
        
        return {
          domain,
          latency: endTime - startTime,
          success: true
        };
      } catch (error) {
        return {
          domain,
          latency: 9999, // 设置一个极高的延迟
          success: false
        };
      }
    }));
    
    const dnsResults = await Promise.all(domains.map(async (domain) => {
      try {
        const startTime = Date.now();
        await new Promise((resolve, reject) => {
          const dns = require('dns');
          dns.lookup(domain, (err, address) => {
            if (err) reject(err);
            else resolve(address);
          });
        });
        const endTime = Date.now();
        
        return {
          domain,
          dnsTime: endTime - startTime,
          success: true
        };
      } catch (error) {
        return {
          domain,
          dnsTime: 9999, // 设置一个极高的DNS解析时间
          success: false
        };
      }
    }));
    
    // 合并结果
    const combinedResults = domains.map(domain => {
      const latencyResult = latencyResults.find(r => r.domain === domain) || { latency: 9999, success: false };
      const dnsResult = dnsResults.find(r => r.domain === domain) || { dnsTime: 9999, success: false };
      
      return {
        domain,
        latency: latencyResult.latency,
        dnsTime: dnsResult.dnsTime,
        success: latencyResult.success && dnsResult.success,
        // 计算综合得分 (越低越好)
        score: latencyResult.latency + dnsResult.dnsTime
      };
    });
    
    // 根据优先因素排序
    let sortedResults;
    
    switch (priorityFactor) {
      case 'latency':
        sortedResults = combinedResults.sort((a, b) => a.latency - b.latency);
        break;
      case 'dns':
        sortedResults = combinedResults.sort((a, b) => a.dnsTime - b.dnsTime);
        break;
      case 'combined':
      default:
        sortedResults = combinedResults.sort((a, b) => a.score - b.score);
        break;
    }
    
    // 获取最佳域名
    const bestDomain = sortedResults[0]?.domain || domains[0];
    
    res.json({
      success: true,
      data: {
        bestDomain,
        allDomains: sortedResults
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取最佳域名失败',
      error: error.message
    });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
}); 