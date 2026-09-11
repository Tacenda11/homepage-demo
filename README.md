# 陆鸿儒的个人主页

人工智能与数据分析课程中的个人主页实践。采用原生 HTML、CSS 和 JavaScript，无第三方运行依赖。

页面包括个人介绍、教育经历、项目展示和邮件联系。展示姓名为陆鸿儒，GitHub 链接保留真实账号 `Tacenda11`；联系邮箱为 `26210680098@m.fdu.edu.cn`。

## 本地运行

需要 Node.js 22 或更高版本，无需安装依赖。

```sh
node scripts/serve.mjs
```

打开 http://127.0.0.1:4173。可通过 `PORT` 环境变量更改端口。

```sh
node --test
node scripts/build.mjs
node scripts/serve.mjs --dist
```

构建产物位于 `dist/`，可部署到静态托管服务。资源使用相对路径。

## 文件与实现

- `index.html`：中文语义化页面、教育经历、GitHub 项目卡片与邮件链接；禁用 JavaScript 时正文和导航仍可用。
- `assets/styles.css`：深色配色、响应式布局、键盘焦点样式及减少动态效果适配。
- `assets/app.mjs`：移动导航、可暂停的粒子背景、邮箱复制交互。
- `assets/interactions.mjs`：可独立测试的复制和动画逻辑，剪贴板不可用时显示手动复制提示。
- `assets/avatar.png`、`assets/favicon.svg`：本地头像与 L 字母图标。
- `scripts/`：零依赖构建和仅暴露页面资源的本地预览服务。
- `tests/`：Node 内置测试，覆盖身份信息、链接完整性、邮箱复制成功与失败、动画偏好及构建产物 HTTP 响应。

自动化测试不包含浏览器截图或浏览器端视觉断言。

## 内容来源

- 视觉参考：[quietseek/home](https://github.com/quietseek/home)，页面代码独立实现。
- 头像与公开简介：[Tacenda11](https://github.com/Tacenda11)。姓名、本科学院和联系邮箱采用本人提供的信息。
- 期权项目：[Tacenda11/final](https://github.com/Tacenda11/final)，介绍根据仓库描述和文件结构整理，不包含未经确认的性能指标。
