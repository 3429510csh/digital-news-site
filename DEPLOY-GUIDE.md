# 🚀 永久部署指南（Railway）

## 为什么需要 GitHub？

Railway 是一个支持完整 Node.js 后端 + 数据库的云平台，部署方式是从 GitHub 仓库拉取代码自动构建。所以需要：

1. ✅ GitHub 账号（存代码）
2. ✅ Railway 账号（部署运行）

**两个都是免费的！** 下面是完整步骤。

---

## 第一步：注册 GitHub 账号（2分钟）

1. 打开 https://github.com/signup
2. 填写邮箱、设置密码、用户名
3. 验证邮箱（去邮箱点确认链接）
4. 完成！

---

## 第二步：创建 GitHub 仓库

1. 登录 GitHub 后，点右上角 **+** 号 → **New repository**
2. 填写：
   - Repository name: `digital-news-site`
   - 选择 **Private**（私有，别人看不到）
   - ✅ 勾选 **Add a README file**
3. 点 **Create repository**

---

## 第三步：创建 Personal Access Token

> 这个 Token 相当于密码，让我能在你的电脑上把代码推到 GitHub。

1. 点右上角头像 → **Settings**
2. 左侧菜单最下面 → **Developer settings**
3. 点 **Personal access tokens** → **Tokens (classic)**
4. 点 **Generate new token** → **Generate new token (classic)**
5. 填写：
   - Note: `deploy`（随便写个名字）
   - Expiration: 选 `90 days`
   - ✅ 勾选 `repo`（全部勾上）
6. 点页面最下面 **Generate token**
7. **复制那串 token**（只显示一次！复制好）

---

## 第四步：告诉我你的信息

把以下信息告诉我：

```
GitHub 用户名：你的用户名
GitHub Token：刚才复制的那串
```

我会自动帮你把代码推到 GitHub 仓库。

---

## 第五步：注册 Railway 并部署

1. 打开 https://railway.app
2. 点 **Login** → 选 **Login with GitHub**（用 GitHub 账号直接登录）
3. 授权 Railway 访问你的 GitHub
4. 点 **New Project** → **Deploy from GitHub repo**
5. 选择 `digital-news-site` 仓库
6. Railway 会自动开始构建（等 2-3 分钟）
7. 部署完成后，点 **Settings** → **Networking** → **Generate Domain**
8. 得到永久网址：`https://digital-news-site-production.up.railway.app`

---

## 第六步：配置持久化数据库（重要！）

> SQLite 数据库文件需要持久存储，否则服务器重启数据会丢失。

1. 在 Railway 项目页面，点你的服务名
2. 点 **Settings** 标签
3. 找到 **Volumes** → 点 **Add Volume**
4. 填写：
   - Mount path: `/data`
5. 点 **Add Volume**
6. 找到 **Variables** → 点 **New Variable**
7. 填写：
   - Name: `DB_PATH`
   - Value: `/data/data.db`
8. 点 **Add**
9. Railway 会自动重新部署

---

## 第七步：完成！

现在你的网站已经永久上线了：

| 地址 | 页面 |
|------|------|
| `https://你的域名.up.railway.app/` | 前台首页 |
| `https://你的域名.up.railway.app/admin.html` | 管理后台（admin / 123456） |
| `https://你的域名.up.railway.app/tutorials.html` | 工具教程 |
| `https://你的域名.up.railway.app/feedback.html` | 留言反馈 |

### 数据持久化说明
- 所有文章、留言、用户、管理员数据都存在 Railway 的持久卷中
- 服务器重启不会丢失数据
- 支持多用户同时访问，数据云端共享

### 免费额度说明
- Railway 每月赠送 $5 免费额度
- 这个小项目日常运行大约消耗 $1-2/月
- 如果超出免费额度，Railway 会发邮件提醒，不会直接关停
