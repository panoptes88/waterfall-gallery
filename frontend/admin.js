/**
 * 管理后台前端逻辑
 */

// 全局变量
let token = null;
let username = null;

/**
 * 初始化管理后台
 */
document.addEventListener('DOMContentLoaded', () => {
    // 检查是否已登录
    checkLoginStatus();

    // 绑定登录表单提交事件
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', handleLoginSubmit);

    // 绑定登出按钮点击事件
    const logoutButton = document.getElementById('logoutButton');
    logoutButton.addEventListener('click', handleLogout);

    // 绑定图片表单提交事件
    const imageForm = document.getElementById('imageForm');
    imageForm.addEventListener('submit', handleFormSubmit);
});

/**
 * 检查登录状态
 */
function checkLoginStatus() {
    // 从localStorage获取token和username
    token = localStorage.getItem('admin_token');
    username = localStorage.getItem('admin_username');

    if (token && username) {
        // 已登录，显示管理界面
        showAdminMain();
        // 加载图片列表
        loadImagesList();
    } else {
        // 未登录，显示登录界面
        showLoginForm();
    }
}

/**
 * 处理登录表单提交
 * @param {Event} event - 表单提交事件
 */
async function handleLoginSubmit(event) {
    event.preventDefault();

    // 获取表单数据
    const formData = new FormData(event.target);
    const loginData = {
        username: formData.get('username'),
        password: formData.get('password')
    };

    try {
        // 发送登录请求
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            // 登录成功，保存token和username到localStorage
            token = result.token;
            username = result.username;
            localStorage.setItem('admin_token', token);
            localStorage.setItem('admin_username', username);

            // 显示管理界面
            showAdminMain();
            // 加载图片列表
            loadImagesList();
        } else {
            // 登录失败
            showLoginError();
        }
    } catch (error) {
        console.error('登录失败:', error);
        showLoginError();
    }
}

/**
 * 处理登出
 */
function handleLogout() {
    // 清除localStorage中的数据
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    token = null;
    username = null;

    // 显示登录界面
    showLoginForm();
}

/**
 * 切换上传方法（URL或文件上传）
 */
function toggleUploadMethod() {
    const uploadType = document.getElementById('uploadType').value;
    const urlSection = document.getElementById('urlUploadSection');
    const fileSection = document.getElementById('fileUploadSection');

    if (uploadType === 'url') {
        urlSection.style.display = 'block';
        fileSection.style.display = 'none';
    } else {
        urlSection.style.display = 'none';
        fileSection.style.display = 'block';
    }
}

/**
 * 预览选中的图片
 * @param {HTMLInputElement} input - 文件输入元素
 */
function previewImage(input) {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';

    if (input.files && input.files[0]) {
        const reader = new FileReader();

        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.maxWidth = '200px';
            img.style.maxHeight = '200px';
            img.style.borderRadius = '6px';
            img.style.marginTop = '10px';
            preview.appendChild(img);
        };

        reader.readAsDataURL(input.files[0]);
    }
}

/**
 * 处理图片表单提交
 * @param {Event} event - 表单提交事件
 */
async function handleFormSubmit(event) {
    event.preventDefault();

    // 检查是否已登录
    if (!token) {
        alert('请先登录');
        showLoginForm();
        return;
    }

    const uploadType = document.getElementById('uploadType').value;

    if (uploadType === 'url') {
        // 使用URL上传方式
        const formData = new FormData(event.target);
        const imageData = {
            image_url: formData.get('image_url'),
            title: formData.get('title'),
            description: formData.get('description'),
            button_text: formData.get('button_text') || '做同款'
        };

        try {
            // 发送请求（添加身份验证token）
            const response = await fetch('/api/images', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify(imageData)
            });

            if (response.status === 401) {
                // 未授权，需要重新登录
                alert('登录已过期，请重新登录');
                handleLogout();
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const newImage = await response.json();

            // 显示成功消息
            alert('图片添加成功');

            // 重置表单
            event.target.reset();

            // 切换回URL输入方式
            document.getElementById('uploadType').value = 'url';
            toggleUploadMethod();

            // 刷新图片列表
            loadImagesList();
        } catch (error) {
            console.error('添加图片失败:', error);
            alert('添加图片失败，请稍后重试');
        }
    } else {
        // 使用文件上传方式
        const formData = new FormData();
        
        // 添加文件
        const fileInput = document.getElementById('imageFile');
        if (fileInput.files.length === 0) {
            alert('请选择要上传的图片文件');
            return;
        }
        
        const file = fileInput.files[0];
        if (!file.type.startsWith('image/')) {
            alert('请选择有效的图片文件');
            return;
        }
        
        formData.append('image', file);
        formData.append('title', document.getElementById('title').value);
        formData.append('description', document.getElementById('description').value);
        formData.append('button_text', document.getElementById('buttonText').value || '做同款');

        try {
            // 发送文件上传请求
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': token
                },
                body: formData
            });

            if (response.status === 401) {
                // 未授权，需要重新登录
                alert('登录已过期，请重新登录');
                handleLogout();
                return;
            }

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.error || 'HTTP error!');
            }

            const newImage = await response.json();

            // 显示成功消息
            alert('图片上传并添加成功');

            // 重置表单
            event.target.reset();

            // 切换回URL输入方式
            document.getElementById('uploadType').value = 'url';
            toggleUploadMethod();

            // 清除预览
            document.getElementById('imagePreview').innerHTML = '';

            // 刷新图片列表
            loadImagesList();
        } catch (error) {
            console.error('上传图片失败:', error);
            alert('上传图片失败，请稍后重试');
        }
    }
}

/**
 * 加载图片列表
 */
async function loadImagesList() {
    if (!token) {
        return;
    }

    try {
        // 发送请求（添加身份验证token）
        const response = await fetch('/api/images?page=1&limit=100', {
            headers: {
                'Authorization': token
            }
        });

        if (response.status === 401) {
            // 未授权，需要重新登录
            alert('登录已过期，请重新登录');
            handleLogout();
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const images = await response.json();

        // 渲染图片列表
        renderImagesList(images);
    } catch (error) {
        console.error('加载图片列表失败:', error);
        alert('加载图片列表失败，请稍后重试');
    }
}

/**
 * 渲染图片列表
 * @param {Array} images - 图片数据数组
 */
function renderImagesList(images) {
    const listContainer = document.getElementById('imagesList');

    // 清空列表
    listContainer.innerHTML = '';

    if (images.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.textContent = '暂无图片';
        emptyMessage.style.color = '#666';
        listContainer.appendChild(emptyMessage);
        return;
    }

    // 渲染每个图片项
    images.forEach(image => {
        const listItem = createImageListItem(image);
        listContainer.appendChild(listItem);
    });
}

/**
 * 创建图片列表项
 * @param {Object} image - 图片数据
 * @returns {HTMLElement} 图片列表项元素
 */
function createImageListItem(image) {
    const listItem = document.createElement('div');
    listItem.className = 'image-item';

    // 图片预览
    const img = document.createElement('img');
    img.src = image.image_url;
    img.alt = image.title || '图片';

    // 图片信息
    const info = document.createElement('div');
    info.className = 'image-info';

    const title = document.createElement('h3');
    title.textContent = image.title || '无标题';

    const description = document.createElement('p');
    description.textContent = image.description || '无描述';

    const buttonText = document.createElement('p');
    buttonText.textContent = `按钮文字: ${image.button_text}`;

    // 操作按钮容器
    const actionButtons = document.createElement('div');
    actionButtons.className = 'action-buttons';
    actionButtons.style.marginTop = '10px';
    actionButtons.style.display = 'flex';
    actionButtons.style.gap = '10px';

    // 编辑按钮
    const editButton = document.createElement('button');
    editButton.textContent = '编辑';
    editButton.className = 'edit-button';
    editButton.style.backgroundColor = '#0066ff';
    editButton.style.color = 'white';
    editButton.style.border = 'none';
    editButton.style.padding = '5px 10px';
    editButton.style.borderRadius = '4px';
    editButton.style.cursor = 'pointer';
    editButton.onclick = () => openEditModal(image);

    // 删除按钮
    const deleteButton = document.createElement('button');
    deleteButton.textContent = '删除';
    deleteButton.className = 'delete-button';
    deleteButton.style.backgroundColor = '#ff4444';
    deleteButton.style.color = 'white';
    deleteButton.style.border = 'none';
    deleteButton.style.padding = '5px 10px';
    deleteButton.style.borderRadius = '4px';
    deleteButton.style.cursor = 'pointer';
    deleteButton.onclick = () => deleteImage(image.id);

    // 组装操作按钮
    actionButtons.appendChild(editButton);
    actionButtons.appendChild(deleteButton);

    // 组装信息
    info.appendChild(title);
    info.appendChild(description);
    info.appendChild(buttonText);
    info.appendChild(actionButtons);

    // 组装列表项
    listItem.appendChild(img);
    listItem.appendChild(info);

    return listItem;
}

/**
 * 显示登录界面
 */
function showLoginForm() {
    const loginContainer = document.getElementById('loginContainer');
    const adminMain = document.getElementById('adminMain');

    loginContainer.classList.remove('hidden');
    adminMain.classList.add('hidden');

    // 重置登录表单
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').style.display = 'none';
}

/**
 * 显示管理界面
 */
function showAdminMain() {
    const loginContainer = document.getElementById('loginContainer');
    const adminMain = document.getElementById('adminMain');

    loginContainer.classList.add('hidden');
    adminMain.classList.remove('hidden');

    // 显示用户名
    document.getElementById('usernameDisplay').textContent = username;
}

/**
 * 显示登录错误信息
 */
function showLoginError() {
    const loginError = document.getElementById('loginError');
    loginError.style.display = 'block';

    // 3秒后隐藏错误信息
    setTimeout(() => {
        loginError.style.display = 'none';
    }, 3000);
}

/**
 * 删除图片
 * @param {number} id - 图片ID
 */
async function deleteImage(id) {
    if (!confirm('确定要删除这张图片吗？此操作不可撤销。')) {
        return;
    }

    if (!token) {
        alert('请先登录');
        showLoginForm();
        return;
    }

    try {
        const response = await fetch(`/api/images/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': token
            }
        });

        if (response.status === 401) {
            // 未授权，需要重新登录
            alert('登录已过期，请重新登录');
            handleLogout();
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            alert('图片删除成功');
            // 刷新图片列表
            loadImagesList();
        } else {
            alert('删除图片失败');
        }
    } catch (error) {
        console.error('删除图片失败:', error);
        alert('删除图片失败，请稍后重试');
    }
}

/**
 * 打开编辑模态框
 * @param {Object} image - 图片数据
 */
function openEditModal(image) {
    // 创建模态框覆盖层
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'editModalOverlay';
    modalOverlay.style.position = 'fixed';
    modalOverlay.style.top = '0';
    modalOverlay.style.left = '0';
    modalOverlay.style.width = '100%';
    modalOverlay.style.height = '100%';
    modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modalOverlay.style.zIndex = '1000';
    modalOverlay.style.display = 'flex';
    modalOverlay.style.justifyContent = 'center';
    modalOverlay.style.alignItems = 'center';

    // 创建模态框内容
    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#1e1e1e';
    modalContent.style.padding = '2rem';
    modalContent.style.borderRadius = '12px';
    modalContent.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    modalContent.style.maxWidth = '500px';
    modalContent.style.width = '90%';
    modalContent.style.color = '#ffffff';

    // 模态框标题
    const modalTitle = document.createElement('h2');
    modalTitle.textContent = '编辑图片';
    modalTitle.style.marginBottom = '1.5rem';
    modalContent.appendChild(modalTitle);

    // 编辑表单
    const editForm = document.createElement('form');
    editForm.id = 'editImageForm';

    // 图片URL
    const imageUrlDiv = document.createElement('div');
    imageUrlDiv.className = 'form-group';
    imageUrlDiv.style.marginBottom = '1rem';
    imageUrlDiv.innerHTML = `
        <label for="editImageUrl" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">图片URL</label>
        <input type="url" id="editImageUrl" name="image_url" required placeholder="请输入图片URL" style="
            width: 100%;
            padding: 0.75rem;
            background-color: #2a2a2a;
            border: 1px solid #3a3a3a;
            border-radius: 6px;
            color: #ffffff;
            font-size: 1rem;
            transition: border-color 0.3s ease;
        " value="${image.image_url}">
    `;
    editForm.appendChild(imageUrlDiv);

    // 标题
    const titleDiv = document.createElement('div');
    titleDiv.className = 'form-group';
    titleDiv.style.marginBottom = '1rem';
    titleDiv.innerHTML = `
        <label for="editTitle" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">标题</label>
        <input type="text" id="editTitle" name="title" placeholder="请输入标题" style="
            width: 100%;
            padding: 0.75rem;
            background-color: #2a2a2a;
            border: 1px solid #3a3a3a;
            border-radius: 6px;
            color: #ffffff;
            font-size: 1rem;
            transition: border-color 0.3s ease;
        " value="${image.title || ''}">
    `;
    editForm.appendChild(titleDiv);

    // 描述
    const descDiv = document.createElement('div');
    descDiv.className = 'form-group';
    descDiv.style.marginBottom = '1rem';
    descDiv.innerHTML = `
        <label for="editDescription" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">描述</label>
        <textarea id="editDescription" name="description" placeholder="请输入描述" style="
            width: 100%;
            padding: 0.75rem;
            background-color: #2a2a2a;
            border: 1px solid #3a3a3a;
            border-radius: 6px;
            color: #ffffff;
            font-size: 1rem;
            transition: border-color 0.3s ease;
            min-height: 100px;
        ">${image.description || ''}</textarea>
    `;
    editForm.appendChild(descDiv);

    // 按钮文字
    const buttonDiv = document.createElement('div');
    buttonDiv.className = 'form-group';
    buttonDiv.style.marginBottom = '1.5rem';
    buttonDiv.innerHTML = `
        <label for="editButtonText" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">按钮文字</label>
        <input type="text" id="editButtonText" name="button_text" placeholder="请输入按钮文字（默认：做同款）" style="
            width: 100%;
            padding: 0.75rem;
            background-color: #2a2a2a;
            border: 1px solid #3a3a3a;
            border-radius: 6px;
            color: #ffffff;
            font-size: 1rem;
            transition: border-color 0.3s ease;
        " value="${image.button_text || '做同款'}">
    `;
    editForm.appendChild(buttonDiv);

    // 按钮行
    const buttonRow = document.createElement('div');
    buttonRow.style.display = 'flex';
    buttonRow.style.gap = '1rem';
    buttonRow.style.justifyContent = 'flex-end';

    // 保存按钮
    const saveButton = document.createElement('button');
    saveButton.type = 'submit';
    saveButton.textContent = '保存';
    saveButton.style.backgroundColor = '#0066ff';
    saveButton.style.color = 'white';
    saveButton.style.border = 'none';
    saveButton.style.padding = '0.75rem 1.5rem';
    saveButton.style.borderRadius = '6px';
    saveButton.style.cursor = 'pointer';
    saveButton.style.fontWeight = '600';

    // 取消按钮
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.textContent = '取消';
    cancelButton.style.backgroundColor = '#666';
    cancelButton.style.color = 'white';
    cancelButton.style.border = 'none';
    cancelButton.style.padding = '0.75rem 1.5rem';
    cancelButton.style.borderRadius = '6px';
    cancelButton.style.cursor = 'pointer';
    cancelButton.style.fontWeight = '600';
    cancelButton.onclick = () => closeModal(modalOverlay);

    buttonRow.appendChild(cancelButton);
    buttonRow.appendChild(saveButton);

    editForm.appendChild(buttonRow);
    modalContent.appendChild(editForm);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // 表单提交事件
    editForm.onsubmit = (event) => handleEditSubmit(event, image.id, modalOverlay);
}

/**
 * 处理编辑表单提交
 * @param {Event} event - 表单提交事件
 * @param {number} id - 图片ID
 * @param {HTMLElement} modalOverlay - 模态框覆盖层
 */
async function handleEditSubmit(event, id, modalOverlay) {
    event.preventDefault();

    if (!token) {
        alert('请先登录');
        showLoginForm();
        closeModal(modalOverlay);
        return;
    }

    // 获取表单数据
    const formData = new FormData(event.target);
    const imageData = {
        image_url: formData.get('image_url'),
        title: formData.get('title'),
        description: formData.get('description'),
        button_text: formData.get('button_text')
    };

    try {
        const response = await fetch(`/api/images/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify(imageData)
        });

        if (response.status === 401) {
            // 未授权，需要重新登录
            alert('登录已过期，请重新登录');
            handleLogout();
            closeModal(modalOverlay);
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result) {
            alert('图片更新成功');
            closeModal(modalOverlay);
            // 刷新图片列表
            loadImagesList();
        } else {
            alert('更新图片失败');
        }
    } catch (error) {
        console.error('更新图片失败:', error);
        alert('更新图片失败，请稍后重试');
    }
}

/**
 * 关闭模态框
 * @param {HTMLElement} modalOverlay - 模态框覆盖层
 */
function closeModal(modalOverlay) {
    if (modalOverlay && modalOverlay.parentNode) {
        modalOverlay.parentNode.removeChild(modalOverlay);
    }
}
