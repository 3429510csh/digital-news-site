# Dockerfile for Railway deployment
# 支持 Express + better-sqlite3 (原生模块编译)

FROM node:20-slim

# 安装 better-sqlite3 编译所需工具
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 先复制依赖文件，利用 Docker 缓存层
COPY package.json package-lock.json* ./

# 安装依赖
RUN npm ci || npm install

# 复制项目源码
COPY . .

# 创建数据持久化目录
RUN mkdir -p /app/data

# 暴露端口 (Railway 会通过 PORT 环境变量指定)
EXPOSE 3000

# 启动服务器
CMD ["node", "server.js"]
