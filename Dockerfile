# 使用 Node.js 官方镜像作为基础镜像
FROM node:24-alpine

# 设置工作目录
WORKDIR /app

# 创建项目目录结构
RUN mkdir -p /app/backend /app/frontend

# 复制后端依赖文件
COPY backend/package*.json /app/backend/

# 安装后端依赖
WORKDIR /app/backend
RUN npm install --production

# 复制后端代码
COPY backend/ /app/backend/

# 复制前端代码
COPY frontend/ /app/frontend/

# 创建数据库目录并设置权限
RUN mkdir -p /app/backend && chmod -R 755 /app/backend

# 暴露端口
EXPOSE 3000

# 启动命令（从backend目录启动）
WORKDIR /app/backend
CMD ["sh", "-c", "chmod -R 777 . && npm start"]
