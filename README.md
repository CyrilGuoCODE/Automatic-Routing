# Automatic-Routing

## 项目简介

Automatic-Routing是一个智能域名路由系统，可以根据用户的网络延迟自动将访问者重定向到最佳的域名。当您的服务部署在多个域名时，这个系统能够帮助用户始终访问延迟最低的域名，从而提升用户体验。

## 核心功能

- **自动测量延迟**：对配置的多个域名自动进行延迟测试
- **智能选择**：根据实际网络状况选择最佳访问路径
- **无缝重定向**：自动将用户重定向到性能最佳的域名
- **Cookie记忆**：通过Cookie记录最佳域名，减少重复测量
- **纯前端实现**：无需后端服务器支持，部署简单

## 工作原理

1. **初始化**：页面加载时，系统自动从meta标签读取可选域名列表
2. **性能测试**：通过XHR请求或图片加载测量各域名的访问延迟
3. **选择最佳域名**：根据测量结果选择延迟最低的域名
4. **自动重定向**：如果当前域名不是最佳选择，则自动重定向用户
5. **保存结果**：将最佳域名保存在Cookie中，避免重复测量

## 安装指南

### 一键部署

1. 下载项目文件
```bash
git clone https://github.com/yourusername/automatic-routing.git
cd automatic-routing
```

2. 复制public目录下的文件到您的网站根目录
```bash
cp public/* /path/to/your/website/
```

### 配置域名

在您网站的HTML `<head>` 部分添加配置：

```html
<!-- 配置备用域名列表 -->
<meta name="automatic-routing-domains" content="domain1.com,domain2.com,domain3.com">
```

## 使用方法

### 基本使用

只需将 `redirect.js` 脚本添加到您网站的每个页面中：

```html
<script src="/redirect.js"></script>
```

系统会自动从meta标签读取域名列表，测量延迟并重定向。

### 手动初始化（可选）

如果您需要更精细的控制，可以手动初始化：

```html
<script>
  // 禁用自动运行
  var AutomaticRoutingConfig = {
    autoRun: false
  };
</script>
<script src="/redirect.js"></script>
<script>
  // 手动初始化，提供更多选项
  AutomaticRouting.init({
    domains: ['domain1.com', 'domain2.com', 'domain3.com'],
    priorityFactor: 'latency',
    forceRedirect: true,
    cookieExpiration: 30,
    testMethod: 'xhr'  // 或 'image'
  });
</script>
```

## 配置选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `domains` | 域名列表 | 从meta标签获取 |
| `priorityFactor` | 选择因素（latency, dns, combined） | combined |
| `considerGeoLocation` | 是否考虑地理位置 | true |
| `cookieExpiration` | Cookie有效期（天） | 7 |
| `forceRedirect` | 强制重定向 | false |
| `autoRun` | 自动运行 | true |
| `testMethod` | 测试方法（xhr, image） | xhr |

## 本地测试

由于浏览器的安全限制，直接通过`file://`协议打开HTML文件时，脚本可能无法正常工作。请使用本地Web服务器进行测试：

### 使用Python启动简易HTTP服务器

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

然后通过浏览器访问 http://localhost:8000

### 使用Node.js启动HTTP服务器

```bash
# 安装http-server
npm install -g http-server

# 启动服务器
http-server -p 8000
```

## 示例页面

项目包含一个简单的示例页面 `index.html`，您可以将其部署到您的服务器上进行测试。页面加载时会显示一个加载动画，并在找到最佳域名后自动重定向。

当通过`file://`协议访问时，页面会显示警告信息和解决方法。

## 常见问题

### 跨域请求被阻止

如果您看到类似以下错误：

```
引用站点策略: strict-origin-when-cross-origin 失败
```

这是由于浏览器的安全策略导致的。解决方法：

1. 确保通过HTTP/HTTPS协议访问页面，而不是file://
2. 确保所有测试的域名都配置了正确的CORS (Cross-Origin Resource Sharing) 头
3. 对于测试环境，可以使用浏览器插件临时禁用CORS限制

### 域名测试失败

如果所有域名测试都失败，请检查：

1. 域名是否正确配置且可访问
2. 是否存在网络连接问题
3. 域名服务器是否响应HEAD请求或提供favicon.ico文件

## 兼容性

该脚本兼容所有现代浏览器，包括：
- Chrome, Firefox, Edge, Safari
- 移动端浏览器
- IE11及以上版本（需要Promise polyfill）

## 贡献指南

欢迎对Automatic-Routing做出贡献！请参考[贡献指南](CONTRIBUTING.md)了解如何参与项目开发。

## 许可证

该项目采用GNUV3许可证 - 详见[LICENSE](LICENSE)文件

## 联系方式

如有问题或建议，请通过以下方式联系我们：
- 提交GitHub Issue
- 发送邮件至 connect@gwly.dpdns.org