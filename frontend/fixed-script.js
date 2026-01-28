/**
 * 瀑布流照片墙前端逻辑 - 简化版
 */

// 全局变量
let currentPage = 1;
let isLoading = false;
let hasMoreData = true;
let currentSearch = '';
let currentCategoryId = null;

/**
 * 初始化应用
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded触发');
    
    // 初始化加载
    loadCategories();
    loadInitialImages();
    
    // 绑定搜索事件
    bindSearchEvents();
});

/**
 * 绑定搜索事件
 */
function bindSearchEvents() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            const categoryId = this.value;
            currentCategoryId = categoryId ? parseInt(categoryId) : null;
            currentSearch = '';
            resetAndLoadImages();
        });
    }
}

/**
 * 执行搜索
 */
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        const keyword = searchInput.value.trim();
        if (keyword) {
            currentSearch = keyword;
            currentCategoryId = null;
            resetAndLoadImages();
        } else {
            currentSearch = '';
            currentCategoryId = null;
            resetAndLoadImages();
        }
    }
}

/**
 * 重置并重新加载图片
 */
function resetAndLoadImages() {
    currentPage = 1;
    hasMoreData = true;
    const grid = document.getElementById('waterfallGrid');
    if (grid) {
        // 只清空动态加载的内容，保留预加载的卡片
        const preloadedCards = grid.querySelectorAll('.preloaded-card');
        grid.innerHTML = '';
        preloadedCards.forEach(card => grid.appendChild(card));
    }
    loadImages();
}

/**
 * 加载初始图片（除了预加载的）
 */
async function loadInitialImages() {
    console.log('开始加载初始图片');
    await loadImages();
}

/**
 * 加载图片数据
 */
async function loadImages() {
    if (isLoading) return;
    
    isLoading = true;
    showLoading();
    hideError();
    
    try {
        // 构建查询参数
        const params = new URLSearchParams({
            page: currentPage,
            limit: 10
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
        
        if (categoryFilter) {
            // 清空现有选项（保留"全部分类"）
            categoryFilter.innerHTML = '<option value="">全部分类</option>';
            
            // 添加分类选项
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = `${category.name} (${category.image_count})`;
                categoryFilter.appendChild(option);
            });
        }
    } catch (error) {
        console.error('加载分类失败:', error);
    }
}

/**
 * 渲染图片卡片
 */
function renderImages(images) {
    const grid = document.getElementById('waterfallGrid');
    if (!grid) return;

    images.forEach(image => {
        const card = createImageCard(image);
        grid.appendChild(card);
    });
}

/**
 * 创建图片卡片
 */
function createImageCard(image) {
    const card = document.createElement('div');
    card.className = 'image-card';
    
    // 创建图片容器
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';
    
    // 图片
    const img = document.createElement('img');
    img.className = 'card-image';
    img.src = image.image_url;
    img.alt = image.title || '图片';
    img.loading = 'lazy';
    
    // 内容
    const content = document.createElement('div');
    content.className = 'card-content';
    
    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = image.title || '无标题';
    
    // 组装
    content.appendChild(title);
    imageContainer.appendChild(img);
    card.appendChild(imageContainer);
    card.appendChild(content);
    
    return card;
}

/**
 * 显示/隐藏UI元素
 */
function showLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) loadingElement.style.display = 'block';
}

function hideLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) loadingElement.style.display = 'none';
}

function showNoMore() {
    const noMoreElement = document.getElementById('noMore');
    if (noMoreElement) noMoreElement.style.display = 'block';
}

function showError() {
    const errorElement = document.getElementById('error');
    if (errorElement) errorElement.style.display = 'block';
}

function hideError() {
    const errorElement = document.getElementById('error');
    if (errorElement) errorElement.style.display = 'none';
}

// 确保函数在全局作用域中可用
window.loadImages = loadImages;
window.loadCategories = loadCategories;
window.loadInitialImages = loadInitialImages;