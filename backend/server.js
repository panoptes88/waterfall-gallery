/**
 * 瀑布流照片墙后端服务器
 * 使用Express框架提供API服务
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const { initializeDatabase, getImages, addImage, deleteImage, updateImage, findUserByUsername, getCategories, searchImages, getImagesByCategory } = require('./database');

// 配置multer用于处理文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 创建uploads目录（如果不存在）
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制10MB
  },
  fileFilter: (req, file, cb) => {
    // 只允许图片文件
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend'), {
  maxAge: '1d' // 静态文件缓存1天
}));

// 身份验证中间件
function authenticate(req, res, next) {
  // 检查session或token（这里使用简单的查询参数验证）
  const token = req.headers.authorization || req.query.token;

  // 简单的token验证（生产环境应使用JWT等更安全的方式）
  if (token && token === 'admin-token') {
    next();
  } else {
    res.status(401).json({ error: '未授权，请先登录' });
  }
}

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '服务运行正常' });
});

// 用户登录接口
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码都是必填字段' });
    }

    // 查找用户
    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 验证密码（简单的base64解码验证）
    const decodedPassword = Buffer.from(user.password, 'base64').toString();
    if (password !== decodedPassword) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 登录成功，返回token
    res.json({
      success: true,
      token: 'admin-token',
      username: user.username
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取图片列表接口
app.get('/api/images', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId) : null;
    const search = req.query.search || '';

    // 参数验证
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({ error: '无效的参数' });
    }

    let images;
    if (search) {
      // 搜索图片
      images = await searchImages(search, page, limit);
    } else if (categoryId) {
      // 按分类获取图片
      images = await getImagesByCategory(categoryId, page, limit);
    } else {
      // 获取所有图片
      images = await getImages(page, limit);
    }

    res.json(images);
  } catch (error) {
    console.error('获取图片列表失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取分类列表接口
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await getCategories();
    res.json(categories);
  } catch (error) {
    console.error('获取分类列表失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 搜索图片接口
app.get('/api/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: '搜索关键词不能为空' });
    }

    const images = await searchImages(q, parseInt(page), parseInt(limit));
    res.json(images);
  } catch (error) {
    console.error('搜索图片失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 添加图片接口（需要身份验证）
app.post('/api/images', authenticate, async (req, res) => {
  try {
    const { image_url, title, description, button_text } = req.body;

    // 验证必填字段
    if (!image_url) {
      return res.status(400).json({ error: '图片URL是必填字段' });
    }

    const newImage = await addImage({
      image_url,
      title: title || '',
      description: description || '',
      button_text: button_text || '做同款'
    });

    res.status(201).json(newImage);
  } catch (error) {
    console.error('添加图片失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 删除图片接口（需要身份验证）
app.delete('/api/images/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // 验证ID
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: '无效的图片ID' });
    }

    const result = await deleteImage(id);
    
    if (result.deleted === 0) {
      return res.status(404).json({ error: '图片不存在' });
    }

    res.json({ success: true, message: '图片删除成功' });
  } catch (error) {
    console.error('删除图片失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 更新图片接口（需要身份验证）
app.put('/api/images/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { image_url, title, description, button_text } = req.body;

    // 验证ID
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: '无效的图片ID' });
    }

    const result = await updateImage(id, {
      image_url,
      title,
      description,
      button_text
    });
    
    if (result.updated === 0) {
      return res.status(404).json({ error: '图片不存在' });
    }

    // 直接返回更新后的图片数据
    res.json(result.data);
  } catch (error) {
    console.error('更新图片失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 管理后台页面（不需要身份验证，但API需要）
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

// 图片上传接口（需要身份验证）
app.post('/api/upload', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的图片' });
    }

    // 将上传的图片转换为WebP格式
    const inputPath = req.file.path;
    const outputPath = inputPath.replace(path.extname(inputPath), '.webp');
    
    // 使用Sharp转换图片为WebP格式
    await sharp(inputPath)
      .webp({ quality: 80 }) // 设置WebP质量为80%
      .toFile(outputPath);
    
    // 删除原始上传文件
    fs.unlinkSync(inputPath);

    // 构建WebP图片的URL路径
    const imageUrl = `/uploads/${path.basename(outputPath)}`;
    
    // 将图片信息添加到数据库
    const newImage = await addImage({
      image_url: imageUrl,
      title: req.body.title || '',
      description: req.body.description || '',
      button_text: req.body.button_text || '做同款'
    });

    res.status(201).json(newImage);
  } catch (error) {
    console.error('上传图片失败:', error);
    res.status(500).json({ error: '上传图片失败' });
  }
});

// 为上传的图片提供静态服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '7d' // 上传的图片缓存7天
}));

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 初始化数据库并启动服务器
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`服务器已启动，访问地址: http://localhost:${PORT}`);
      console.log(`管理后台地址: http://localhost:${PORT}/admin`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();
