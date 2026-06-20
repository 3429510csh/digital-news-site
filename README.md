# 数码资讯测试网站 — 本地启动教程

## 项目简介

一套带完整后端的数码资讯测试网站，包含前端页面 + Node.js 后端 + SQLite 数据库，本地一键运行。

---

## 项目目录结构

```
digital-news-site/
├── package.json          # 后端依赖配置
├── server.js             # 后端主程序（Express 服务器）
├── db.js                 # 数据库初始化（建表 + 种子数据）
├── README.md             # 本文件
├── data.db               # SQLite 数据库文件（运行后自动生成）
└── public/               # 前端静态资源目录
    ├── index.html        # 首页
    ├── tutorials.html    # 工具教程列表页
    ├── article.html      # 文章详情页
    ├── feedback.html     # 留言反馈页
    ├── admin.html        # 管理员登录 + 后台管理页
    ├── css/
    │   └── style.css     # 自定义样式
    └── js/
        ├── main.js       # 全局共享脚本（导航栏、API 封装）
        ├── home.js       # 首页逻辑
        ├── tutorials.js  # 教程列表逻辑
        ├── article-detail.js  # 文章详情逻辑
        ├── feedback.js   # 留言反馈逻辑
        └── admin.js      # 管理后台逻辑
```

---

## 环境准备

### 第一步：安装 Node.js

1. 前往 Node.js 官网下载 LTS 版本：https://nodejs.org/
2. 推荐下载 **22.x LTS** 版本（Windows 选择 `.msi` 安装包）
3. 双击安装，一路「下一步」即可（安装时会自动配置环境变量）
4. 安装完成后，打开**命令提示符**（按 `Win+R`，输入 `cmd`，回车），输入：

```bash
node -v
```

如果显示类似 `v22.x.x`，说明安装成功。

再验证 npm：

```bash
npm -v
```

显示版本号即可（如 `10.x.x`）。

---

## 启动步骤

### 第二步：进入项目目录

打开命令提示符（或 PowerShell），进入项目文件夹：

```bash
cd 项目所在路径\digital-news-site
```

> 例如：`cd C:\Users\Administrator\Desktop\digital-news-site`

### 第三步：安装依赖

在项目目录下执行：

```bash
npm install
```

等待安装完成，会生成 `node_modules` 文件夹。如果安装较慢，可以使用国内镜像：

```bash
npm install --registry=https://registry.npmmirror.com
```

### 第四步：启动服务器

```bash
npm start
```

或者直接运行：

```bash
node server.js
```

启动成功后会看到：

```
========================================
  数码资讯测试网站已启动
========================================
  前台地址:  http://localhost:3000
  后台地址:  http://localhost:3000/admin.html
  管理账号:  admin
  管理密码:  123456
========================================
  按 Ctrl+C 停止服务器
========================================
```

### 第五步：访问网站

打开浏览器，访问以下地址：

| 页面     | 地址                          |
| -------- | ----------------------------- |
| 首页     | http://localhost:3000          |
| 工具教程 | http://localhost:3000/tutorials.html |
| 留言反馈 | http://localhost:3000/feedback.html   |
| 管理后台 | http://localhost:3000/admin.html      |

---

## 后台登录操作步骤

1. 在浏览器中打开 http://localhost:3000/admin.html
2. 输入管理员账号：**admin**
3. 输入密码：**123456**
4. 点击「登录」按钮
5. 登录成功后进入管理面板，包含四个标签页：
   - **仪表盘**：查看统计数据 + 快捷操作入口
   - **文章管理**：发布新文章、编辑、删除文章
   - **留言管理**：查看全部用户留言、删除留言
   - **账号设置**：修改管理员用户名和密码

---

## 功能说明

### 前台功能

- **首页**：展示最新资讯文章卡片、数据统计
- **工具教程**：按分类筛选文章列表，支持「全部 / 手机评测 / 硬件资讯 / 电脑评测 / 软件资讯 / 工具教程 / 穿戴设备」筛选
- **文章详情**：Markdown 渲染正文、封面图、阅读量统计、作者信息
- **留言反馈**：访客填写姓名/邮箱/留言，提交后存入数据库

### 后台功能

- **管理员登录**：默认账号 admin，密码 123456，基于 Token 认证（密码存入数据库，可修改）
- **仪表盘**：文章总数、留言总数、总阅读量、近7天留言数 + 快捷操作入口
- **文章管理**：发布新文章、编辑已有文章、删除文章（支持 Markdown 语法）
- **留言管理**：查看全部留言、删除单条留言
- **账号设置**：修改管理员用户名和密码（需验证当前密码）

### API 接口列表

| 方法   | 路径                              | 功能                   |
| ------ | --------------------------------- | ---------------------- |
| GET    | /api/articles                     | 获取文章列表           |
| GET    | /api/articles/:id                 | 获取文章详情           |
| GET    | /api/categories                   | 获取所有分类           |
| POST   | /api/feedback                     | 提交留言               |
| POST   | /api/admin/login                  | 管理员登录             |
| POST   | /api/admin/logout                 | 管理员退出             |
| GET    | /api/admin/stats                  | 获取统计数据（需认证） |
| GET    | /api/admin/articles               | 获取文章列表（需认证） |
| POST   | /api/admin/articles               | 发布新文章（需认证）   |
| PUT    | /api/admin/articles/:id           | 编辑文章（需认证）     |
| DELETE | /api/admin/articles/:id           | 删除文章（需认证）     |
| GET    | /api/admin/feedback               | 获取全部留言（需认证） |
| DELETE | /api/admin/feedback/:id           | 删除留言（需认证）     |
| GET    | /api/admin/profile                | 获取管理员信息（需认证）|
| POST   | /api/admin/change-credentials     | 修改账号密码（需认证） |

---

## 常见问题

### Q: `npm install` 报错？

切换国内镜像源：
```bash
npm config set registry https://registry.npmmirror.com
npm install
```

### Q: 端口 3000 被占用？

修改 `server.js` 最后一行的 `const PORT = 3000;` 改为其他端口（如 8080），然后重新启动。

### Q: better-sqlite3 安装失败？

这是原生模块，需要编译环境。Windows 用户确保已安装：
- Python 3.x
- Visual Studio Build Tools（C++ 桌面开发）

或者使用预编译版本：
```bash
npm install better-sqlite3 --build-from-source=false
```

### Q: 如何重置数据库？

删除项目根目录下的 `data.db` 文件，重新启动服务器即可自动重建。

---

## 技术栈

- **前端**：HTML5 + Tailwind CSS (CDN) + 原生 JavaScript
- **后端**：Node.js + Express
- **数据库**：SQLite (better-sqlite3)
- **Markdown**：marked.js (CDN)
- **图片**：picsum.photos 在线占位图

---

> 本项目仅供本地测试使用，不涉及域名和服务器部署配置。
