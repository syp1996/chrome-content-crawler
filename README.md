# Vue Sidepanel - Chrome扩展

一个功能强大的Chrome扩展，用于网页内容抓取、文本识别和知识管理。

## 功能特性

### 🎯 核心功能
- **智能内容选取** - 支持元素选择和区域选择
- **OCR文字识别** - 使用Tesseract.js进行图片文字识别
- **全文提取** - 基于Readability.js的内容提取
- **Markdown导出** - 支持本地保存为Markdown格式
- **后台同步** - 一键发送到后端数据库

### 🔧 技术特点
- 基于Vue.js的现代化界面
- 响应式设计，支持各种屏幕尺寸
- 实时内容预览和编辑
- 智能内容摘要生成
- 完善的错误处理和用户反馈

## 安装说明

### 开发环境安装
1. 克隆仓库
```bash
git clone https://github.com/syp1996/chrome-content-crawler.git
cd vue-sidepanel
```

2. 安装依赖
```bash
cd vue-sidepanel
npm install
```

3. 开发模式
```bash
npm run dev
```

### Chrome扩展安装
1. 打开Chrome扩展管理页面 (`chrome://extensions/`)
2. 开启"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择项目根目录

## 使用方法

### 基本操作
1. **选取内容** - 点击"选取"按钮，选择网页中的特定元素
2. **区域识别** - 点击"识别"按钮，框选区域进行OCR识别
3. **全文提取** - 点击"全文"按钮，提取整个页面的主要内容
4. **保存内容** - 点击"保存到本地"按钮，下载Markdown文件
5. **发送后台** - 点击"发送到后台"按钮，同步到数据库

### 高级功能
- 支持内容编辑和预览
- 自动生成内容摘要
- 智能标题和slug生成
- 多种内容格式支持

## 项目结构

```
vue-sidepanel/
├── assets/              # 静态资源
├── css/                 # 样式文件
├── js/                  # JavaScript文件
│   └── sidepanel-global.js  # 主要逻辑
├── images/              # 图片资源
├── libs/                # 第三方库
├── content.js           # 内容脚本
├── manifest.json        # 扩展清单
├── sidepanel-global.html # 侧边栏页面
├── service-worker.js    # 服务工作者
└── README.md           # 项目说明
```

## 技术栈

- **前端框架**: Vue.js 3
- **构建工具**: Vite
- **样式**: CSS3 + 响应式设计
- **OCR引擎**: Tesseract.js
- **内容提取**: Readability.js
- **截图工具**: html2canvas
- **后端API**: FastAPI (Python)

## 配置说明

### 后端API配置
默认后端地址：`http://localhost:8000/api/documents/plugin`

如需修改，请编辑 `vue-sidepanel/src/js/sidepanel-global.js` 文件中的API地址。

### CORS配置
确保后端支持以下来源的跨域请求：
- `chrome-extension://*`
- `http://localhost:8080`
- `http://localhost:3000`

## 开发指南

### 添加新功能
1. 在 `vue-sidepanel/src/js/` 目录下创建新的功能模块
2. 在 `sidepanel-global.html` 中添加对应的UI元素
3. 在 `manifest.json` 中声明必要的权限

### 调试技巧
- 使用Chrome DevTools进行调试
- 查看Console日志了解运行状态
- 使用Network面板监控API请求

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

- 项目维护者: syp1996
- 邮箱: 304899670@qq.com
- 项目链接: [https://github.com/syp1996/chrome-content-crawler](https://github.com/syp1996/chrome-content-crawler)

## 更新日志

### v1.0.0 (2024-01-01)
- ✨ 初始版本发布
- 🎯 实现核心功能：内容选取、OCR识别、全文提取
- 💾 支持本地保存和后台同步
- 🎨 现代化UI设计和响应式布局

---

⭐ 如果这个项目对你有帮助，请给它一个星标！