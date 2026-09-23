# ASRFlow Website

ASRFlow 官方介绍站源码仓。纯静态单页营销站点，无需任何前端构建工具，通过 GitHub Pages 自动部署。

- **在线官网**：<https://zyf8827.github.io/asrflow-website/>
- **ASRFlow 产品主仓**：<https://github.com/zyf8827/ASRFlow>
- **本站源码仓**：<https://github.com/zyf8827/asrflow-website>

---

## 本地预览

无需安装 Node.js 或构建工具，直接使用 Python 内置 HTTP 服务器或任意静态文件服务即可本地预览：

```bash
# 进入仓库目录
cd asrflow-website

# 启动静态 Web 服务（默认监听 8080 端口）
python3 -m http.server 8080
```

在浏览器中打开：<http://127.0.0.1:8080>

---

## GitHub Pages 发布说明

本站采用 GitHub Pages 原生静态分支托管：
1. **Source**：Deploy from a branch
2. **Branch**：`main`
3. **Folder**：`/ (root)`
4. 仓库根目录包含 `.nojekyll` 文件，用于阻止 GitHub Pages 运行 Jekyll 转换流程，确保 CSS、SVG、图片等静态资源原样发布。

---

## 文件结构

```text
asrflow-website/
├── index.html                  # 单页营销官网主文件（自包含语义结构与交互）
├── styles.css                  # 深色现代主题样式（响应式、渐变光效、微交互）
├── assets/                     # 官方素材与动效脚本
│   ├── logo.png                # ASRFlow Logo（透明底 RGBA PNG）
│   ├── architecture-flow.svg   # 2-Pass 数据流向动态矢量图
│   └── site.js                 # 交互控制器（流式演示、拓扑动效、滚动显隐）
├── .nojekyll                   # GitHub Pages Jekyll 忽略标识（空文件）
├── LICENSE                     # Apache-2.0 开源许可证
└── README.md                   # 站点说明文档
```

---

## 许可证

本项目基于 [Apache License 2.0](LICENSE) 许可证开源，与 [ASRFlow](https://github.com/zyf8827/ASRFlow) 主仓库保持一致。
