# Automatic-Routing 智能域名路由系统

根据网络状况自动将用户重定向到性能最佳的域名，提升访问体验。

## 项目说明

本项目提供两个版本:

### 简单版 (simple-version)

纯前端实现，无需后端支持，适合快速部署和小型网站。

**主要特点:**
- 纯JavaScript实现，无需服务器支持
- 测量网络延迟、首字节时间和响应时间
- 支持多种测试方法，适应不同环境
- 通过Cookie记忆最佳域名，减少测试次数

**适用场景:**
- 个人网站、博客
- 小型企业网站
- 静态网站托管

### 复杂版 (complex-version)

包含前端和后端组件，提供高级功能，适合大型网站和应用。

**增强功能:**
- 地理位置智能匹配
- 历史性能数据分析
- 集中化配置管理
- 用户行为统计分析
- 高级故障转移机制

**适用场景:**
- 企业级应用
- 全球化服务部署
- 需要精细分析和控制的场景

## 快速开始

### 简单版

1. 复制 `simple-version/public` 目录下的文件到您的网站

2. 在HTML头部添加域名配置:
```html
<meta name="automatic-routing-domains" content="domain1.com,domain2.com,domain3.com">
```

3. 引入脚本:
```html
<script src="/redirect.js"></script>
```

### 复杂版

1. 配置并启动后端服务:
```bash
cd complex-version/server
npm install
npm start
```

2. 在前端页面集成客户端脚本:
```html
<meta name="automatic-routing-domains" content="domain1.com,domain2.com,domain3.com">
<script src="/redirect-pro.js"></script>
```

## 详细文档

### 简单版配置选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `testMethod` | 测试方法 (xhr/fetch/image/page) | xhr |
| `sampleSize` | 测试样本数量 | 1 |
| `metrics` | 指标权重配置 | latency:0.4, ttfb:0.3... |

### 复杂版特有功能

- 地理位置识别与匹配
- 服务器端性能监控
- 高级故障转移策略
- 数据统计与分析面板

## 本地测试方法

启动简易HTTP服务器:
```bash
# Python方式
python -m http.server 8000

# Node.js方式
npx http-server -p 8000
```

## 许可证


## 联系方式

- GitHub Issues
- Email: connect@gwly.dpdns.org