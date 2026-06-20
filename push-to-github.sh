#!/bin/bash
# ============================================
# 一键推送代码到 GitHub
# 使用方法：
#   bash push-to-github.sh 你的GitHub用户名 你的Token
# ============================================

USERNAME=$1
TOKEN=$2

if [ -z "$USERNAME" ] || [ -z "$TOKEN" ]; then
  echo "❌ 用法: bash push-to-github.sh <GitHub用户名> <Token>"
  echo "示例: bash push-to-github.sh myname ghp_xxxxxxxxxxxx"
  exit 1
fi

REPO_URL="https://${USERNAME}:${TOKEN}@github.com/${USERNAME}/digital-news-site.git"

echo "========================================="
echo "  开始推送代码到 GitHub"
echo "========================================="
echo "  用户名: $USERNAME"
echo "  仓库:   digital-news-site"
echo "========================================="
echo ""

# 初始化 git
cd "$(dirname "$0")"

git init 2>/dev/null
git config user.name "$USERNAME"
git config user.email "$USERNAME@users.noreply.github.com"

# 添加远程仓库
git remote remove origin 2>/dev/null
git remote add origin "$REPO_URL"

# 添加文件并提交
git add -A
git commit -m "Initial commit: digital news site with full backend"

# 推送
echo ""
echo "正在推送代码..."
if git push -u origin main 2>/dev/null || git push -u origin master; then
  echo ""
  echo "✅ 代码推送成功！"
  echo ""
  echo "仓库地址: https://github.com/$USERNAME/digital-news-site"
  echo ""
  echo "下一步：打开 https://railway.app 部署"
else
  echo ""
  echo "❌ 推送失败，可能原因："
  echo "  1. 仓库还没创建（先去 GitHub 创建 digital-news-site 仓库）"
  echo "  2. Token 过期或权限不足（确保勾选了 repo 权限）"
  echo "  3. 用户名或 Token 输错"
fi
