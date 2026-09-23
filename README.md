# ASRFlow Website

ASRFlow 官方介绍站源码。静态单页站点，由 GitHub Pages 从本仓库 `main` 分支根目录发布。

- 产品仓库：<https://github.com/zyf8827/ASRFlow>
- 在线站点：<https://zyf8827.github.io/asrflow-website/>

## 本地预览

无需构建步骤，任意静态服务器即可：

```bash
python3 -m http.server 8080
# 浏览器打开 http://127.0.0.1:8080
```

## 发布方式

GitHub Pages 配置为 `main` / `/`（legacy 静态源）。仓库根目录含 `.nojekyll`，避免 Jekyll 处理静态资源。

## 许可证

Apache-2.0（与 [ASRFlow](https://github.com/zyf8827/ASRFlow) 主仓库一致）。
