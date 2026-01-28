/**
 * SQLite数据库操作模块
 * 负责初始化数据库、创建表和提供数据操作接口
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const DB_PATH = path.join(__dirname, 'images.db');

// 初始化数据库
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    // 创建数据库连接
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('数据库连接失败:', err);
        reject(err);
      } else {
        console.log('数据库连接成功');
        createCategoriesTable(db)
          .then(() => createTagsTable(db))
          .then(() => createImageTagsTable(db))
          .then(() => createImagesTable(db))
          .then(() => addCategoryColumnToImagesTable(db))
          .then(() => createUsersTable(db))
          .then(() => insertDefaultCategories(db))
          .then(() => insertSampleData(db))
          .then(() => createDefaultUser(db))
          .then(() => {
            resolve(db);
          })
          .catch(reject);
      }
    });
  });
}

// 为已存在的 images 表添加 category_id 列（兼容旧版本数据库）
function addCategoryColumnToImagesTable(db) {
  return new Promise((resolve, reject) => {
    // 检查列是否已存在
    db.all("PRAGMA table_info(images)", (err, rows) => {
      if (err) {
        console.error('检查 images 表结构失败:', err);
        reject(err);
        return;
      }

      // 检查是否已包含 category_id 列
      const hasCategoryColumn = rows.some(row => row.name === 'category_id');

      if (hasCategoryColumn) {
        console.log('images 表已包含 category_id 列');
        resolve();
      } else {
        console.log('为 images 表添加 category_id 列');
        const alterSql = `ALTER TABLE images ADD COLUMN category_id INTEGER REFERENCES categories(id)`;
        db.run(alterSql, (err) => {
          if (err) {
            console.error('添加 category_id 列失败:', err);
            reject(err);
          } else {
            console.log('category_id 列添加成功');
            resolve();
          }
        });
      }
    });
  });
}

// 创建用户表
function createUsersTable(db) {
  return new Promise((resolve, reject) => {
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    db.run(createTableSql, (err) => {
      if (err) {
        console.error('创建用户表失败:', err);
        reject(err);
      } else {
        console.log('用户表创建成功');
        resolve();
      }
    });
  });
}

// 创建默认用户（用户名：admin，密码：admin123）
function createDefaultUser(db) {
  return new Promise((resolve, reject) => {
    // 检查是否已有用户
    db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      if (row.count > 0) {
        console.log(`数据库中已有 ${row.count} 个用户，跳过创建默认用户`);
        resolve();
        return;
      }

      // 密码使用简单的base64编码（生产环境应使用bcrypt等加密算法）
      const defaultPassword = Buffer.from('admin123').toString('base64');
      const insertSql = `
        INSERT INTO users (username, password)
        VALUES (?, ?)
      `;

      db.run(insertSql, ['admin', defaultPassword], function(err) {
        if (err) {
          console.error('创建默认用户失败:', err);
          reject(err);
        } else {
          console.log('默认用户创建成功');
          resolve();
        }
      });
    });
  });
}

// 根据用户名查找用户
function findUserByUsername(username) {
  return new Promise((resolve, reject) => {
    const querySql = `
      SELECT id, username, password, created_at
      FROM users
      WHERE username = ?
    `;

    const db = new sqlite3.Database(DB_PATH);
    db.get(querySql, [username], (err, row) => {
      db.close();

      if (err) {
        console.error('查询用户失败:', err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// 创建分类表
function createCategoriesTable(db) {
  return new Promise((resolve, reject) => {
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    db.run(createTableSql, (err) => {
      if (err) {
        console.error('创建分类表失败:', err);
        reject(err);
      } else {
        console.log('分类表创建成功');
        resolve();
      }
    });
  });
}

// 创建标签表
function createTagsTable(db) {
  return new Promise((resolve, reject) => {
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    db.run(createTableSql, (err) => {
      if (err) {
        console.error('创建标签表失败:', err);
        reject(err);
      } else {
        console.log('标签表创建成功');
        resolve();
      }
    });
  });
}

// 创建图片标签关联表
function createImageTagsTable(db) {
  return new Promise((resolve, reject) => {
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS image_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (image_id) REFERENCES images (id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE,
        UNIQUE(image_id, tag_id)
      )
    `;

    db.run(createTableSql, (err) => {
      if (err) {
        console.error('创建图片标签关联表失败:', err);
        reject(err);
      } else {
        console.log('图片标签关联表创建成功');
        resolve();
      }
    });
  });
}

// 创建图片表（添加分类外键）
function createImagesTable(db) {
  return new Promise((resolve, reject) => {
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_url TEXT NOT NULL,
        title TEXT,
        description TEXT,
        button_text TEXT DEFAULT '做同款',
        category_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id)
      )
    `;

    db.run(createTableSql, (err) => {
      if (err) {
        console.error('创建表失败:', err);
        reject(err);
      } else {
        console.log('图片表创建成功');
        resolve();
      }
    });
  });
}

// 插入默认分类
function insertDefaultCategories(db) {
  return new Promise((resolve, reject) => {
    // 检查是否已有分类数据
    db.get('SELECT COUNT(*) as count FROM categories', [], (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      // 如果已有数据，直接返回
      if (row.count > 0) {
        console.log(`数据库中已有 ${row.count} 个分类，跳过插入默认分类`);
        resolve();
        return;
      }

      // 默认分类数据
      const defaultCategories = [
        { name: '风景', description: '自然风光摄影作品' },
        { name: '人物', description: '人像摄影作品' },
        { name: '建筑', description: '建筑摄影作品' },
        { name: '动物', description: '动物摄影作品' },
        { name: '美食', description: '美食摄影作品' },
        { name: '旅行', description: '旅行摄影作品' },
        { name: '艺术', description: '艺术创作作品' },
        { name: '科技', description: '科技产品图片' },
        { name: '生活', description: '日常生活照片' },
        { name: '商业', description: '商业宣传图片' }
      ];

      // 批量插入分类
      const stmt = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
      
      let insertedCount = 0;
      defaultCategories.forEach(category => {
        stmt.run([category.name, category.description], function(err) {
          if (err) {
            console.error('插入分类失败:', err);
          } else {
            insertedCount++;
          }
          
          // 检查是否所有分类都已插入
          if (insertedCount === defaultCategories.length) {
            console.log(`成功插入 ${insertedCount} 个默认分类`);
            stmt.finalize();
            resolve();
          }
        });
      });
    });
  });
}

// 插入示例数据
function insertSampleData(db) {
  return new Promise((resolve, reject) => {
    // 检查是否已有数据
    db.get('SELECT COUNT(*) as count FROM images', [], (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      // 如果已有数据，直接返回
      if (row.count > 0) {
        console.log(`数据库中已有 ${row.count} 条数据，跳过插入示例数据`);
        resolve();
        return;
      }

      // 示例图片数据
      const sampleImages = [
        {
          image_url: 'https://picsum.photos/300/400?random=1',
          title: '自然风 智享受',
          description: '静音舒适，智能互联',
          button_text: '做同款'
        },
        {
          image_url: 'https://picsum.photos/300/500?random=2',
          title: '11月1日-11月11日 狗粮专场',
          description: '全场5折起，满300减100',
          button_text: '立即抢购'
        },
        {
          image_url: 'https://picsum.photos/300/350?random=3',
          title: '招聘岗位 运营助理5k-8k',
          description: '负责内容运营，有经验者优先',
          button_text: '查看详情'
        },
        {
          image_url: 'https://picsum.photos/300/450?random=4',
          title: '强力电钻 高效钻孔',
          description: '工业级品质，持久耐用',
          button_text: '购买同款'
        },
        {
          image_url: 'https://picsum.photos/300/380?random=5',
          title: '春季新品 时尚连衣裙',
          description: '优雅气质，舒适面料',
          button_text: '立即购买'
        },
        {
          image_url: 'https://picsum.photos/300/420?random=6',
          title: '健康生活 有机食品',
          description: '天然无添加，健康每一天',
          button_text: '了解更多'
        },
        {
          image_url: 'https://picsum.photos/300/480?random=7',
          title: '运动健身 专业器材',
          description: '在家也能健身，塑造完美身材',
          button_text: '立即抢购'
        },
        {
          image_url: 'https://picsum.photos/300/360?random=8',
          title: '学习编程 从入门到精通',
          description: '系统学习，快速上手',
          button_text: '开始学习'
        },
        {
          image_url: 'https://picsum.photos/300/430?random=9',
          title: '美妆护肤 焕发光彩',
          description: '天然成分，温和护肤',
          button_text: '查看详情'
        },
        {
          image_url: 'https://picsum.photos/300/470?random=10',
          title: '汽车保养 专业服务',
          description: '呵护您的爱车，让驾驶更安全',
          button_text: '立即预约'
        },
        {
          image_url: 'https://picsum.photos/300/390?random=11',
          title: '家居装饰 温馨生活',
          description: '简约风格，品质之选',
          button_text: '购买同款'
        },
        {
          image_url: 'https://picsum.photos/300/440?random=12',
          title: '数码配件 精选好物',
          description: '品质保障，价格实惠',
          button_text: '立即购买'
        },
        {
          image_url: 'https://picsum.photos/300/410?random=13',
          title: '旅行必备 轻便行李箱',
          description: '大容量，耐用性强',
          button_text: '查看详情'
        },
        {
          image_url: 'https://picsum.photos/300/370?random=14',
          title: '宠物用品 关爱宠物',
          description: '为您的宠物提供最好的呵护',
          button_text: '立即抢购'
        },
        {
          image_url: 'https://picsum.photos/300/460?random=15',
          title: '办公设备 高效工作',
          description: '提升办公效率，享受工作乐趣',
          button_text: '购买同款'
        },
        {
          image_url: 'https://picsum.photos/300/490?random=16',
          title: '音乐盛宴 现场演出',
          description: '激情四射，震撼人心',
          button_text: '立即购票'
        },
        {
          image_url: 'https://picsum.photos/300/340?random=17',
          title: '美食探店 品味人生',
          description: '探寻美味，享受生活',
          button_text: '查看详情'
        },
        {
          image_url: 'https://picsum.photos/300/420?random=18',
          title: '摄影技巧 捕捉美好',
          description: '专业指导，拍出精彩照片',
          button_text: '学习技巧'
        },
        {
          image_url: 'https://picsum.photos/300/380?random=19',
          title: '瑜伽健身 身心平衡',
          description: '放松身心，提升气质',
          button_text: '开始练习'
        },
        {
          image_url: 'https://picsum.photos/300/450?random=20',
          title: '英语口语 流利表达',
          description: '专业外教，一对一教学',
          button_text: '立即报名'
        },
        {
          image_url: 'https://picsum.photos/300/390?random=21',
          title: '投资理财 财富增长',
          description: '专业指导，稳健收益',
          button_text: '了解更多'
        },
        {
          image_url: 'https://picsum.photos/300/430?random=22',
          title: '健康体检 关爱自己',
          description: '定期体检，预防疾病',
          button_text: '立即预约'
        },
        {
          image_url: 'https://picsum.photos/300/470?random=23',
          title: '法律咨询 专业服务',
          description: '解决法律问题，维护合法权益',
          button_text: '免费咨询'
        },
        {
          image_url: 'https://picsum.photos/300/440?random=24',
          title: '装修设计 理想家园',
          description: '专业设计，打造温馨家园',
          button_text: '立即咨询'
        },
        {
          image_url: 'https://picsum.photos/300/410?random=25',
          title: '婚礼策划 浪漫时刻',
          description: '完美策划，留下美好回忆',
          button_text: '查看详情'
        },
        {
          image_url: 'https://picsum.photos/300/360?random=26',
          title: '教育培训 因材施教',
          description: '个性化教学，提升学习效果',
          button_text: '立即报名'
        },
        {
          image_url: 'https://picsum.photos/300/480?random=27',
          title: '旅游攻略 自由行',
          description: '精选路线，轻松旅行',
          button_text: '查看攻略'
        },
        {
          image_url: 'https://picsum.photos/300/350?random=28',
          title: '宠物训练 听话乖巧',
          description: '专业训练，让宠物更听话',
          button_text: '立即训练'
        },
        {
          image_url: 'https://picsum.photos/300/460?random=29',
          title: '汽车美容 焕然一新',
          description: '专业美容，让爱车更亮丽',
          button_text: '立即预约'
        },
        {
          image_url: 'https://picsum.photos/300/400?random=30',
          title: '舞蹈培训 舞动青春',
          description: '专业培训，提升舞蹈技巧',
          button_text: '开始学习'
        }
      ];

      // 插入示例数据
      const insertSql = `
        INSERT INTO images (image_url, title, description, button_text)
        VALUES (?, ?, ?, ?)
      `;

      let insertedCount = 0;

      sampleImages.forEach(image => {
        db.run(insertSql, [
          image.image_url,
          image.title,
          image.description,
          image.button_text
        ], function(err) {
          if (err) {
            console.error('插入数据失败:', err);
          } else {
            insertedCount++;
            if (insertedCount === sampleImages.length) {
              console.log(`成功插入 ${insertedCount} 条示例数据`);
              resolve();
            }
          }
        });
      });
    });
  });
}

// 获取图片列表（支持分页）
function getImages(page = 1, limit = 20) {
  return new Promise((resolve, reject) => {
    const offset = (page - 1) * limit;
    const querySql = `
      SELECT id, image_url, title, description, button_text, created_at
      FROM images
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const db = new sqlite3.Database(DB_PATH);
    db.all(querySql, [limit, offset], (err, rows) => {
      db.close();

      if (err) {
        console.error('查询图片列表失败:', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// 添加图片
function addImage(imageData) {
  return new Promise((resolve, reject) => {
    const insertSql = `
      INSERT INTO images (image_url, title, description, button_text)
      VALUES (?, ?, ?, ?)
    `;

    const db = new sqlite3.Database(DB_PATH);
    db.run(insertSql, [
      imageData.image_url,
      imageData.title,
      imageData.description,
      imageData.button_text || '做同款'
    ], function(err) {
      db.close();

      if (err) {
        console.error('添加图片失败:', err);
        reject(err);
      } else {
        resolve({ id: this.lastID, ...imageData });
      }
    });
  });
}

// 删除图片
function deleteImage(id) {
  return new Promise((resolve, reject) => {
    const deleteSql = `
      DELETE FROM images
      WHERE id = ?
    `;

    const db = new sqlite3.Database(DB_PATH);
    db.run(deleteSql, [id], function(err) {
      db.close();

      if (err) {
        console.error('删除图片失败:', err);
        reject(err);
      } else {
        resolve({ deleted: this.changes });
      }
    });
  });
}

// 更新图片
function updateImage(id, imageData) {
  return new Promise((resolve, reject) => {
    const updateSql = `
      UPDATE images
      SET image_url = COALESCE(?, image_url),
          title = COALESCE(?, title),
          description = COALESCE(?, description),
          button_text = COALESCE(?, button_text)
      WHERE id = ?
    `;

    const db = new sqlite3.Database(DB_PATH);
    db.serialize(() => {
      // 先更新图片
      db.run(updateSql, [
        imageData.image_url,
        imageData.title,
        imageData.description,
        imageData.button_text,
        id
      ], function(err) {
        if (err) {
          db.close();
          console.error('更新图片失败:', err);
          reject(err);
          return;
        }

        // 如果更新成功，查询更新后的图片数据
        if (this.changes > 0) {
          const selectSql = `
            SELECT id, image_url, title, description, button_text, created_at
            FROM images
            WHERE id = ?
          `;
          
          db.get(selectSql, [id], (err, row) => {
            db.close();
            
            if (err) {
              console.error('查询更新后的图片失败:', err);
              reject(err);
            } else {
              resolve({ updated: this.changes, data: row });
            }
          });
        } else {
          // 如果没有更新任何记录
          db.close();
          resolve({ updated: 0 });
        }
      });
    });
  });
}

// 获取分类列表
function getCategories() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    const sql = `
      SELECT c.*, COUNT(i.id) as image_count
      FROM categories c
      LEFT JOIN images i ON c.id = i.category_id
      GROUP BY c.id
      ORDER BY c.name
    `;

    db.all(sql, [], (err, rows) => {
      db.close();
      
      if (err) {
        console.error('获取分类列表失败:', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// 搜索图片
function searchImages(keyword, page = 1, limit = 20) {
  return new Promise((resolve, reject) => {
    const offset = (page - 1) * limit;
    const db = new sqlite3.Database(DB_PATH);
    
    const sql = `
      SELECT i.*, c.name as category_name
      FROM images i
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE i.title LIKE ? OR i.description LIKE ?
      ORDER BY i.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const searchTerm = `%${keyword}%`;
    
    db.all(sql, [searchTerm, searchTerm, limit, offset], (err, rows) => {
      db.close();
      
      if (err) {
        console.error('搜索图片失败:', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// 按分类获取图片
function getImagesByCategory(categoryId, page = 1, limit = 20) {
  return new Promise((resolve, reject) => {
    const offset = (page - 1) * limit;
    const db = new sqlite3.Database(DB_PATH);
    
    const sql = `
      SELECT i.*, c.name as category_name
      FROM images i
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE i.category_id = ?
      ORDER BY i.created_at DESC
      LIMIT ? OFFSET ?
    `;

    db.all(sql, [categoryId, limit, offset], (err, rows) => {
      db.close();
      
      if (err) {
        console.error('获取分类图片失败:', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// 导出模块
module.exports = {
  initializeDatabase,
  getImages,
  addImage,
  deleteImage,
  updateImage,
  findUserByUsername,
  getCategories,
  searchImages,
  getImagesByCategory
};
