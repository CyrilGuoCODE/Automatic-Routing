# 贡献指南

感谢您对 Automatic-Routing 项目的关注！我们欢迎各种形式的贡献，包括但不限于：功能建议、bug 报告、代码贡献、文档改进等。

## 开发环境设置

1. Fork 这个仓库
2. 克隆您的 Fork 到本地
   ```bash
   git clone https://github.com/您的用户名/automatic-routing.git
   cd automatic-routing
   ```
3. 安装依赖
   ```bash
   npm run install-all
   ```
4. 创建一个新分支
   ```bash
   git checkout -b feature/your-feature-name
   ```
5. 进行修改并提交
   ```bash
   git add .
   git commit -m "描述您的修改"
   ```
6. 推送到您的 Fork
   ```bash
   git push origin feature/your-feature-name
   ```
7. 创建 Pull Request

## 项目结构

```
automatic-routing/
  ├── client/                # 前端 Vue.js 应用
  │    ├── public/           # 静态资源
  │    ├── src/              # 源代码
  │    │    ├── assets/      # 样式和图片资源
  │    │    ├── components/  # 公共组件
  │    │    ├── services/    # API 服务
  │    │    ├── views/       # 页面组件
  │    │    ├── App.vue      # 主应用组件
  │    │    ├── main.js      # 入口文件
  │    │    └── router/      # 路由配置
  │    ├── package.json      # 依赖配置
  │    └── vite.config.js    # Vite 配置
  │
  ├── server/                # 后端 Node.js 应用
  │    ├── index.js          # 主入口文件
  │    ├── package.json      # 依赖配置
  │    └── .env              # 环境变量
  │
  ├── public/                # 公共资源
  │    ├── redirect.js       # 重定向脚本
  │    └── redirect.html     # 重定向示例
  │
  ├── package.json           # 根目录依赖配置
  ├── README.md              # 项目说明
  └── CONTRIBUTING.md        # 贡献指南
```

## 开发指南

### 运行开发环境

```bash
# 同时运行前端和后端
npm run dev

# 仅运行前端
npm run client

# 仅运行后端
npm run server
```

### 代码风格

- 遵循 ES6+ 语法标准
- 使用 2 个空格缩进
- 使用单引号
- 每行代码不超过 100 个字符
- 每个文件以一个空行结尾

### 提交信息规范

提交信息应该简洁明了，并采用以下格式：

```
类型: 简短描述

详细描述（如需要）
```

类型可以是：
- feat: 新功能
- fix: Bug 修复
- docs: 文档修改
- style: 代码风格修改（不影响代码功能）
- refactor: 代码重构
- perf: 性能优化
- test: 测试相关
- chore: 构建过程或辅助工具的变动

## 测试

请确保您的代码通过测试，并且添加适当的测试用例。

```bash
npm test
```

## 文档

如果您的修改影响到公共 API 或用户体验，请同时更新对应的文档。

## 问题和讨论

如果您有任何问题或想法，欢迎通过 Issues 进行讨论。

感谢您的贡献！ 