/**
 * 瀑布流照片墙前端逻辑
 */

// 全局变量
let currentPage = 1;
let isLoading = false;
let hasMoreData = true;
let currentSearch = '';
let currentCategoryId = null;

/**
 * 主题切换功能
 */
function initTheme() {
    // 从本地存储获取主题偏好
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // 更新主题图标
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // 更新主题图标
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }
}

/**
 * 初始化应用
 */
document.addEventListener('DOMContentLoaded', () => {
    // 初始化主题
    initTheme();

    // 绑定主题切换事件
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // 初始化加载
    loadCategories();
    loadImages();

    // 绑定搜索事件
    bindSearchEvents();

    // 监听滚动事件（使用Intersection Observer API实现无限滚动）
    const loadingElement = document.getElementById('loading');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && hasMoreData && !isLoading) {
                loadImages();
            }
        });
    }, {
        rootMargin: '200px' // 距离底部200px时触发加载
    });

    observer.observe(loadingElement);
});

/**
 * 绑定搜索事件
 */
function bindSearchEvents() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const categoryFilter = document.getElementById('categoryFilter');
    
    // 搜索按钮点击事件
    searchButton.addEventListener('click', () => {
        performSearch();
    });
    
    // 回车键搜索
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // 分类筛选事件
    categoryFilter.addEventListener('change', () => {
        const categoryId = categoryFilter.value;
        currentCategoryId = categoryId ? parseInt(categoryId) : null;
        currentSearch = '';
        resetAndLoadImages();
    });
}

/**
 * 执行搜索
 */
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const keyword = searchInput.value.trim();
    
    if (keyword) {
        currentSearch = keyword;
        currentCategoryId = null;
        resetAndLoadImages();
    } else {
        // 如果搜索框为空，重置为显示所有图片
        currentSearch = '';
        currentCategoryId = null;
        resetAndLoadImages();
    }
}

/**
 * 重置并重新加载图片
 */
function resetAndLoadImages() {
    currentPage = 1;
    hasMoreData = true;
    const grid = document.getElementById('waterfallGrid');
    grid.innerHTML = ''; // 清空现有内容
    loadImages();
}

/**
 * 加载图片数据
 */
async function loadImages() {
    console.log('loadImages function called'); // 调试信息
    if (isLoading) return;
    
    isLoading = true;
    showLoading();
    hideError();
    
    try {
        // 构建查询参数
        const params = new URLSearchParams({
            page: currentPage,
            limit: 20
        });
        
        // 添加搜索参数
        if (currentSearch) {
            params.append('search', currentSearch);
        }
        
        // 添加分类参数
        if (currentCategoryId) {
            params.append('categoryId', currentCategoryId);
        }
        
        const response = await fetch(`/api/images?${params}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const images = await response.json();
        
        if (images.length > 0) {
            renderImages(images);
            currentPage++;
        } else {
            hasMoreData = false;
            showNoMore();
        }
    } catch (error) {
        console.error('加载图片失败:', error);
        showError();
    } finally {
        isLoading = false;
        hideLoading();
    }
}

/**
 * 加载分类列表
 */
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const categories = await response.json();
        const categoryFilter = document.getElementById('categoryFilter');
        
        // 清空现有选项（保留"全部分类"）
        categoryFilter.innerHTML = '<option value="">全部分类</option>';
        
        // 添加分类选项
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = `${category.name} (${category.image_count})`;
            categoryFilter.appendChild(option);
        });
    } catch (error) {
        console.error('加载分类失败:', error);
    }
}

/**
 * 渲染图片卡片
 * @param {Array} images - 图片数据数组
 */
function renderImages(images) {
    console.log('renderImages called with', images.length, 'images'); // 调试信息
    const grid = document.getElementById('waterfallGrid');
    console.log('Grid element:', grid); // 调试信息

    images.forEach(image => {
        const card = createImageCard(image);
        grid.appendChild(card);
    });
    
    // 图片加载后重新计算布局
    setTimeout(() => {
        // 等待图片加载完成
        const images = grid.querySelectorAll('.card-image');
        let loadedCount = 0;
        const totalCount = images.length;
        
        if (totalCount === 0) return;
        
        images.forEach(img => {
            if (img.complete) {
                loadedCount++;
            } else {
                img.addEventListener('load', () => {
                    loadedCount++;
                    if (loadedCount === totalCount) {
                        // 所有图片加载完成后，CSS多列布局会自动调整
                    }
                });
                
                img.addEventListener('error', () => {
                    loadedCount++;
                    if (loadedCount === totalCount) {
                        // 图片加载失败也计数
                    }
                });
            }
        });
    }, 100);
}

/**
 * 窗口大小改变时重新计算布局
 */
window.addEventListener('resize', () => {
    // 使用节流函数避免频繁触发
    clearTimeout(window.resizeTimeout);
    window.resizeTimeout = setTimeout(() => {
        // CSS多列布局会自动处理大小变化
    }, 300);
});

/**
 * 创建图片卡片
 * @param {Object} image - 图片数据
 * @returns {HTMLElement} 图片卡片元素
 */
function createImageCard(image) {
    const card = document.createElement('div');
    card.className = 'image-card';

    // 创建图片容器
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';

    // 创建骨架屏占位符
    const skeleton = document.createElement('div');
    skeleton.className = 'image-skeleton';
    
    // 图片
    const img = document.createElement('img');
    img.className = 'card-image';
    img.src = image.image_url;
    img.alt = image.title || '图片';
    img.loading = 'lazy'; // 懒加载
    
    // 添加点击事件来显示大图模态框
    img.addEventListener('click', () => {
        showImageModal(image);
    });

    // 图片加载完成事件
    img.addEventListener('load', function() {
        // 移除骨架屏
        if (skeleton.parentNode) {
            skeleton.parentNode.removeChild(skeleton);
        }
        // 显示真实图片
        img.style.opacity = '1';
    });

    // 图片加载失败事件
    img.addEventListener('error', function() {
        // 移除骨架屏
        if (skeleton.parentNode) {
            skeleton.parentNode.removeChild(skeleton);
        }
        // 显示错误状态或默认图片
        img.style.opacity = '0.5';
    });

    // 将骨架屏和图片添加到容器
    imageContainer.appendChild(skeleton);
    imageContainer.appendChild(img);

    // 简化的卡片内容 - 只有标题
    const content = document.createElement('div');
    content.className = 'card-content';

    // 标题
    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = image.title || '无标题';

    // 组装卡片内容
    content.appendChild(title);

    card.appendChild(imageContainer);
    card.appendChild(content);

    return card;
}

/**
 * 处理卡片按钮点击事件
 * @param {Object} image - 图片数据
 */
function handleCardButtonClick(image) {
    // 这里可以添加按钮点击后的逻辑，例如跳转到详情页
    console.log('按钮点击:', image);

    // 示例：显示图片信息
    alert(`图片标题: ${image.title}\n描述: ${image.description}`);
}

/**
 * 显示加载状态
 */
function showLoading() {
    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = 'block';
}

/**
 * 隐藏加载状态
 */
function hideLoading() {
    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = 'none';
}

/**
 * 显示无更多内容提示
 */
function showNoMore() {
    const noMoreElement = document.getElementById('noMore');
    noMoreElement.style.display = 'block';
}

/**
 * 显示错误提示
 */
function showError() {
    const errorElement = document.getElementById('error');
    errorElement.style.display = 'block';
}

/**
 * 隐藏错误提示
 */
function hideError() {
    const errorElement = document.getElementById('error');
    errorElement.style.display = 'none';
}

/**
 * 刷新页面
 */
function refreshPage() {
    window.location.reload();
}

// 图片模态框功能
function showImageModal(image) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const detailPanel = document.getElementById('imageDetailsPanel');
    const detailTitle = document.getElementById('detailTitle');
    const detailDescription = document.getElementById('detailDescription');
    const detailButtonText = document.getElementById('detailButtonText');
    const detailDate = document.getElementById('detailDate');
    
    // 设置模态框图片
    modalImg.src = image.image_url;
    modalImg.alt = image.title || '图片';
    
    // 设置图片详情
    detailTitle.textContent = image.title || '无标题';
    detailDescription.textContent = image.description || '无描述';
    detailButtonText.textContent = '按钮文字: ' + (image.button_text || '做同款');
    detailDate.textContent = '上传日期: ' + (image.created_at || '未知');
    
    // 显示模态框和详情面板
    modal.style.display = 'block';
    detailPanel.style.display = 'block';
    
    // 添加键盘ESC关闭功能
    document.addEventListener('keydown', closeModalHandler);
}

// 关闭模态框的事件处理器
function closeModalHandler(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
}

// 关闭模态框
function closeModal() {
    const modal = document.getElementById('imageModal');
    const detailPanel = document.getElementById('imageDetailsPanel');
    
    if (modal) {
        modal.style.display = 'none';
    }
    if (detailPanel) {
        detailPanel.style.display = 'none';
    }
    
    // 移除键盘事件监听器
    document.removeEventListener('keydown', closeModalHandler);
}

// 为模态框添加关闭功能
document.addEventListener('DOMContentLoaded', () => {
    // 为关闭按钮添加点击事件
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    // 为模态框背景添加点击关闭功能
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeModal();
            }
        });
    }
});

// 关闭模态框
function closeModal() {
    const modal = document.getElementById('imageModal');
    const detailPanel = document.getElementById('imageDetailsPanel');
    
    if (modal) {
        modal.style.display = 'none';
    }
    if (detailPanel) {
        detailPanel.style.display = 'none';
    }
    
    // 移除键盘事件监听器
    document.removeEventListener('keydown', closeModalHandler);
}

// 导出函数（用于调试）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadImages,
        renderImages,
        createImageCard,
        handleCardButtonClick
    };
}
