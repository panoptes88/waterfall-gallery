/**
 * 瀑布流照片墙前端逻辑 - 稳定版
 */

console.log('Stable script loaded');

// 全局变量
let currentPage = 1;
let isLoading = false;
let hasMoreData = true;
let currentSearch = '';
let currentCategoryId = null;

// 将所有函数显式添加到window对象确保全局可访问
window.loadImages = async function() {
    console.log('loadImages function executing');
    
    if (isLoading) {
        console.log('Already loading, skipping');
        return;
    }
    
    isLoading = true;
    console.log('Starting image load');
    
    try {
        // 构建查询参数
        const params = new URLSearchParams({
            page: currentPage,
            limit: 6
        });
        
        // 添加搜索参数
        if (currentSearch) {
            params.append('search', currentSearch);
        }
        
        // 添加分类参数
        if (currentCategoryId) {
            params.append('categoryId', currentCategoryId);
        }
        
        console.log('Fetching from:', `/api/images?${params}`);
        const response = await fetch(`/api/images?${params}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const images = await response.json();
        console.log('Received images:', images.length);
        
        if (images.length > 0) {
            renderImages(images);
            currentPage++;
        } else {
            hasMoreData = false;
            console.log('No more images to load');
        }
    } catch (error) {
        console.error('Error loading images:', error);
    } finally {
        isLoading = false;
        console.log('Load complete');
    }
};

window.loadInitialImages = async function() {
    console.log('loadInitialImages executing');
    await loadImages();
};

window.loadCategories = async function() {
    console.log('loadCategories executing');
    try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const categories = await response.json();
        console.log('Loaded categories:', categories.length);
        
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">全部分类</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = `${category.name} (${category.image_count})`;
                categoryFilter.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
};

window.bindSearchEvents = function() {
    console.log('bindSearchEvents executing');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            console.log('Search button clicked');
            const keyword = searchInput ? searchInput.value.trim() : '';
            if (keyword) {
                currentSearch = keyword;
                currentCategoryId = null;
                resetAndLoadImages();
            }
        });
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            console.log('Category changed');
            const categoryId = this.value;
            currentCategoryId = categoryId ? parseInt(categoryId) : null;
            currentSearch = '';
            resetAndLoadImages();
        });
    }
};

window.resetAndLoadImages = function() {
    console.log('resetAndLoadImages executing');
    currentPage = 1;
    hasMoreData = true;
    const grid = document.getElementById('waterfallGrid');
    if (grid) {
        grid.innerHTML = '';
    }
    loadImages();
};

window.renderImages = function(images) {
    console.log('renderImages executing with', images.length, 'images');
    const grid = document.getElementById('waterfallGrid');
    if (!grid) {
        console.error('waterfallGrid not found');
        return;
    }

    images.forEach(image => {
        const card = createImageCard(image);
        grid.appendChild(card);
    });
};

window.createImageCard = function(image) {
    console.log('Creating card for:', image.title);
    const card = document.createElement('div');
    card.className = 'image-card';
    
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';
    
    const img = document.createElement('img');
    img.className = 'card-image';
    img.src = image.image_url;
    img.alt = image.title || '图片';
    img.loading = 'lazy';
    
    const content = document.createElement('div');
    content.className = 'card-content';
    
    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = image.title || '无标题';
    
    content.appendChild(title);
    imageContainer.appendChild(img);
    card.appendChild(imageContainer);
    card.appendChild(content);
    
    return card;
};

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOMContentLoaded START ===');
    
    try {
        console.log('Calling loadCategories');
        loadCategories();
        
        console.log('Calling loadInitialImages');
        loadInitialImages();
        
        console.log('Calling bindSearchEvents');
        bindSearchEvents();
        
        console.log('=== All functions executed successfully ===');
    } catch (error) {
        console.error('Error in DOMContentLoaded:', error);
        console.error('Error stack:', error.stack);
    }
});

console.log('Script initialization complete');