# 瀑布流照片墙应用

一个类似 Pinterest 的瀑布流照片墙 Web 应用，支持响应式布局、图片上传、管理后台等功能。

## 目录

- [项目介绍](#项目介绍)
- [功能特点](#功能特点)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [部署方式](#部署方式)
- [API 接口文档](#api-接口文档)
- [管理后台](#管理后台)
- [配置说明](#配置说明)
- [已知问题](#已知问题)
- [开发指南](#开发指南)
- [常见问题](#常见问题)
- [许可证](#许可证)

## 项目介绍

瀑布流照片墙是一个灵感发现平台，用户可以浏览、搜索、上传和管理图片。项目采用前后端分离架构，支持 Docker 容器化部署，适合个人或小团队使用。

### 适用场景

- 个人图片收藏与管理
- 产品展示画廊
- 设计灵感收集
- 摄影作品展示

## 功能特点

### 前端功能

- **瀑布流布局**：响应式设计，自动适应不同屏幕尺寸
- **无限滚动**：滚动到底部自动加载更多图片
- **主题切换**：支持明暗主题切换
- **分类浏览**：按分类筛选图片
- **图片搜索**：关键词搜索图片
- **移动端适配**：在手机和平板上完美显示

### 后端功能

- **RESTful API**：提供完整的图片管理接口
- **用户认证**：简单的 Token 身份验证
- **图片上传**：支持本地图片上传，自动转换为 WebP 格式
- **数据持久化**：SQLite 数据库存储

### 管理后台

- 图片添加、编辑、删除
- 分类管理
- 上传图片管理

## 技术栈

### 前端技术

| 技术 | 用途 |
|------|------|
| React 18 | UI 框架 |
| Ant Design 5 | UI 组件库 |
| React Router DOM | 路由管理 |
| Axios | HTTP 客户端 |
| Webpack | 构建工具 |
| TypeScript | 类型支持 |

### 后端技术

| 技术 | 用途 |
|------|------|
| Go + Gin | 主后端框架（推荐） |
| Node.js + Express | 备选后端框架 |
| GORM | Go ORM |
| SQLite | 数据库 |
| Multer | 文件上传处理 |
| Sharp | 图片处理（WebP 转换） |

### 部署技术

| 技术 | 用途 |
|------|------|
| Docker | 容器化 |
| Docker Compose | 容器编排 |
| Nginx | 反向代理（生产环境） |

## 项目结构

```
waterfall-gallery/
├── frontend/                   # 前端应用（React）
│   ├── src/
│   │   ├── index.js           # 应用入口
│   │   ├── index.css          # 全局样式
│   │   ├── App.js             # 主组件（含路由配置）
│   │   ├── api/
│   │   │   └── api.js         # Axios API 客户端
│   │   ├── pages/
│   │   │   ├── GalleryPage.js # 瀑布流相册页面
│   │   │   └── LoginPage.js   # 登录页面
│   │   └── components/        # React 组件
│   ├── public/
│   │   └── index.html         # HTML 模板
│   ├── package.json           # 前端依赖配置
│   └── webpack.config.js      # Webpack 构建配置
│
├── backend/                    # 后端服务
│   ├── main.go               # Go 主入口（Gin 框架）
│   ├── server.js             # Node.js 备选服务器
│   ├── database.js           # Node.js 数据库操作
│   ├── handlers/
│   │   └── photo_handlers.go # 照片处理 handlers
│   ├── utils/
│   │   └── image_utils.go    # 图片处理工具
│   ├── package.json          # 后端依赖配置
│   └── go.mod                # Go 模块配置
│
├── Dockerfile                 # Docker 镜像构建文件
├── docker-compose.yml        # Docker Compose 配置（基础部署）
├── docker-compose-full.yml   # Docker Compose 配置（完整部署）
├── nginx.conf                # Nginx 配置文件
└── README.md                 # 项目说明文档
```

## 快速开始

### 前置要求

- Docker 和 Docker Compose（推荐）
- 或 Node.js 18+
- 或 Go 1.20+

### 使用 Docker Compose（推荐）

```bash
# 1. 进入项目目录
cd waterfall-gallery

# 2. 构建并启动服务
docker compose up -d

# 3. 访问应用
# 主页面：http://localhost:4000
# 管理后台：http://localhost:4000/admin
```

### 手动启动（Node.js）

```bash
# 1. 进入后端目录
cd backend

# 2. 安装依赖
npm install

# 3. 启动服务器
npm start

# 4. 访问 http://localhost:3000
```

### 手动启动（Go）

```bash
# 1. 进入后端目录
cd backend

# 2. 安装依赖
go mod download

# 3. 启动服务器
go run main.go

# 4. 访问 http://localhost:8080
```

## 部署方式

### 方式一：基础部署（开发/测试）

使用单个容器，前后端打包在一起。

```bash
docker compose up -d
```

- **端口**：4000:3000
- **特点**：简单快速，适合开发环境

### 方式二：完整部署（生产）

使用 Nginx 反向代理，前后端分离。

```bash
docker compose -f docker-compose-full.yml up -d
```

- **端口**：80:443
- **特点**：支持 HTTPS、性能更好
- **服务**：
  - Nginx（端口 80/443）
  - Backend（端口 8080）

### 方式三：手动部署

1. 安装 Node.js 18+ 或 Go 1.20+
2. 启动后端服务
3. 构建前端：`cd frontend && npm run build`
4. 配置 Nginx 或使用静态文件服务

## API 接口文档

### 基础信息

- **Base URL**：http://localhost:4000/api
- **认证方式**：Header Authorization（值：`admin-token`）

### 接口列表

#### 健康检查

```http
GET /health
```

**响应**：
```json
{
  "status": "ok",
  "message": "服务运行正常"
}
```

#### 获取图片列表

```http
GET /images?page=1&limit=20&categoryId=1&search=关键词
```

**参数**：
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | integer | 否 | 1 | 页码 |
| limit | integer | 否 | 20 | 每页数量（最大100） |
| categoryId | integer | 否 | - | 分类ID |
| search | string | 否 | - | 搜索关键词 |

**响应**：
```json
[
  {
    "id": 1,
    "image_url": "/uploads/xxx.webp",
    "title": "图片标题",
    "description": "图片描述",
    "button_text": "做同款",
    "created_at": "2026-01-20 07:22:55"
  }
]
```

#### 获取分类列表

```http
GET /categories
```

**响应**：
```json
[
  {
    "id": 1,
    "name": "分类名称",
    "created_at": "2026-01-20 07:22:55"
  }
]
```

#### 用户登录

```http
POST /login
Content-Type: application/json

{
  "username": "admin",
  "password": "your_password"
}
```

**响应**：
```json
{
  "success": true,
  "token": "admin-token",
  "username": "admin"
}
```

#### 上传图片

```http
POST /upload
Content-Type: multipart/form-data

- image: 图片文件
- title: 标题（可选）
- description: 描述（可选）
- button_text: 按钮文字（可选）
```

**响应**：
```json
{
  "id": 34,
  "image_url": "/uploads/xxx.webp",
  "title": "",
  "description": "",
  "button_text": "做同款",
  "created_at": "2026-01-20 07:22:55"
}
```

#### 添加图片（URL方式）

```http
POST /images
Content-Type: application/json
Authorization: admin-token

{
  "image_url": "https://example.com/image.jpg",
  " "title": "标题",
  "description": "描述",
  "button_text": "按钮文字"
}
```

#### 更新图片

```http
PUT /images/:id
Content-Type: application/json
Authorization: admin-token

{
  "title": "新标题",
  "description": "新描述",
  "image_url": "https://example.com/new.jpg"
}
```

#### 删除图片

```http
DELETE /images/:id
Authorization: admin-token
```

**响应**：
```json
{
  "success": true,
  "message": "图片删除成功"
}
```

## 管理后台

### 访问地址

http://localhost:4000/admin

### 默认账号

| 字段 | 值 |
|------|-----|
| 用户名 | admin |
| 密码 | admin123 |

### 功能说明

1. **图片管理**：添加、编辑、删除图片
2. **图片上传**：支持本地上传，自动转换为 WebP 格式
3. **分类浏览**：查看所有图片

## 配置说明

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| PORT | 服务端口 | 3000 |

### 修改端口

编辑 `docker-compose.yml`：

```yaml
services:
  waterfall-gallery:
    ports:
      - "8080:3000"  # 改为 8080:3000
```

### 数据持久化

Docker 部署时数据存储在 volumes 中：

```yaml
volumes:
  - uploads:/app/uploads      # 上传的图片
  - database:/app/backend     # SQLite 数据库
```

### 上传限制

- 文件大小限制：10MB
- 支持格式：image/*
- 自动转换：WebP 格式（质量 80%）

## 已知问题

### 待优化项

1. **用户系统**
   - 当前仅支持单用户
   - 建议添加多用户支持和权限管理

2. **安全性**
   - Token 认证方式简单，生产环境建议使用 JWT
   - 缺少 CSRF 保护
   - 上传文件类型验证可加强

3. **性能**
   - 大量图片时建议添加图片懒加载
   - 数据库查询可添加索引优化
   - 建议添加图片 CDN 加速

4. **功能缺失**
   - 缺少图片收藏/点赞功能
   - 缺少评论系统
   - 缺少用户个人主页

5. **图片处理**
   - WebP 转换质量固定为 80%
   - 建议添加图片压缩选项
   - 建议支持更多图片格式

### 已知 Bug

- 暂无已知的严重 Bug

## 开发指南

### 本地开发

#### 前端开发

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

#### 后端开发（Node.js）

```bash
cd backend

# 安装依赖
npm install

# 启动开发服务器（热重载）
npm run dev
```

#### 后端开发（Go）

```bash
cd backend

# 安装依赖
go mod download

# 启动开发服务器
go run main.go
```

### 数据库结构

#### images 表

```sql
CREATE TABLE images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    button_text TEXT DEFAULT '做同款',
    category_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

#### categories 表

```sql
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### users 表

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 代码规范

- 前端：遵循 React 最佳实践
- 后端：遵循 RESTful API 规范
- 提交信息：使用中文描述

## 常见问题

### Q: 图片无法上传？

A: 请检查：
1. 文件大小是否超过 10MB
2. 文件格式是否为图片
3. Docker 容器是否有写入权限
4. uploads 目录是否正确挂载

### Q: 数据库连接失败？

A: 请检查：
1. 数据库文件是否存在
2. 文件权限是否正确
3. Docker volumes 是否正确挂载

### Q: 如何备份数据？

A: Docker 部署时执行：

```bash
# 备份数据库
docker cp waterfall-gallery-waterfall-gallery-1:/app/backend/images.db ./backup/

# 备份上传的图片
docker cp waterfall-gallery-waterfall-gallery-1:/app/uploads ./backup/
```

### Q: 如何升级版本？

A:
1. 备份数据
2. 停止容器：`docker compose down`
3. 更新代码
4. 重新构建：`docker compose build`
5. 启动服务：`docker compose up -d`

### Q: 如何查看日志？

A:
```bash
# 实时日志
docker logs -f waterfall-gallery-waterfall-gallery-1

# 最近 100 行
docker logs --tail 100 waterfall-gallery-waterfall-gallery-1
```

### Q: CORS 跨域问题？

A: 后端已配置 CORS 中间件，允许所有来源。如需限制，修改 `backend/server.js`：

```javascript
app.use(cors({
  origin: 'https://your-domain.com'
}));
```

## 浏览器支持

| 浏览器 | 最低版本 |
|--------|----------|
| Chrome | 60+ |
| Firefox | 55+ |
| Safari | 12+ |
| Edge | 79+ |

## 许可证

MIT License

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 更新日志

### v1.0.0 (2026-01-20)

- 初始版本发布
- 基础功能：瀑布流展示、图片上传、管理后台
- Docker 容器化支持
- 前后端分离架构
