# Automatic-Routing 智能域名路由系统

根据网络状况自动将用户重定向到性能最佳的域名，提升访问体验。

## 项目说明

Automatic-Routing 是一个轻量级的前端智能路由解决方案，能够自动测试多个域名的网络性能，并将用户重定向到响应最快的域名。

**主要特点:**
- 纯JavaScript实现，无需服务器支持
- 测量网络延迟和首字节时间(TTFB)
- 支持多种测试方法，适应不同浏览环境
- 通过Cookie记忆最佳域名，减少重复测试
- 轻量级设计，对网站性能影响极小

**适用场景:**
- 个人网站、博客
- 小型到中型企业网站
- 静态网站托管
- 拥有多个CDN或服务器节点的网站

## 快速开始

1. 复制 `public` 目录下的文件到您的网站：
   - `redirect.js` - 核心路由脚本

2. 在HTML头部添加域名配置:
```html
<meta name="automatic-routing-domains" content="domain1.com,domain2.com,domain3.com">
<script src="/redirect.js"></script>
```

就这么简单！脚本会自动测试各个域名的性能，并将用户重定向到最佳域名。

## 配置选项

您可以通过JavaScript全局变量调整配置，例如：

```javascript
// 手动配置
AutomaticRouting.init({
  domains: ['example.com', 'cdn.example.com'], 
  priorityFactor: 'latency',       // 'latency', 'ttfb', 或 'combined'
  testMethod: 'xhr',               // 'xhr', 'image' 
  cookieExpiration: 7,             // Cookie有效期(天)
  timeout: 5000,                   // 测试超时时间(毫秒)
  forceRedirect: false             // 是否强制重定向
});
```

### 配置选项说明

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `domains` | 测试域名列表 | 从meta标签读取 |
| `priorityFactor` | 优先考虑的性能指标 | combined |
| `testMethod` | 测试方法 | xhr |
| `cookieExpiration` | Cookie保存天数 | 7 |
| `timeout` | 请求超时时间(毫秒) | 5000 |
| `forceRedirect` | 是否强制重定向 | false |
| `cookieName` | Cookie名称 | ar_best_domain |

## 自定义使用

除了自动重定向外，您还可以使用API手动测试域名性能：

```javascript
// 测试单个域名性能
AutomaticRouting.testDomain('example.com').then(result => {
  console.log('测试结果:', result);
  // 返回: {domain: 'example.com', latency: 124, ttfb: 89, success: true}
});

// 查找最佳域名但不重定向
AutomaticRouting.findBestDomain().then(bestDomain => {
  console.log('最佳域名:', bestDomain);
});
```

## 本地测试方法

由于浏览器安全限制，通过`file://`协议直接打开HTML文件时不能正常工作。请使用以下方法启动简易HTTP服务器:

```bash
# Python方式
python -m http.server 8000

# 或 Python3方式
python3 -m http.server 8000

# Node.js方式
npx http-server -p 8000
```

然后访问: http://localhost:8000

## 示例页面

项目包含一个完整的示例页面 `public/index.html`，展示了如何实现和使用自动路由功能。该示例页面包括：

- 自动路由实现示范
- 手动测试功能
- 配置代码示例
- 本地测试指南

## 浏览器兼容性

- Chrome, Firefox, Safari, Edge 等现代浏览器
- 兼容IE11(基本功能)

## 许可证

GNUV3

## 支持与联系

- GitHub Issues
- Email: connect@gwly.dpdns.org