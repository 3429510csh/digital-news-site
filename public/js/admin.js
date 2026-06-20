/**
 * admin.js — 管理后台逻辑（完整版）
 * 功能：登录认证 + 仪表盘 + 文章管理(增删改查) + 留言管理 + 账号设置
 */

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    showDashboard();
  } else {
    showLogin();
  }

  bindLoginEvents();
  bindDashboardEvents();
  bindTabEvents();
  bindArticleEvents();
  bindSettingsEvents();
  bindUserManagementEvents();
  bindAdminManagementEvents();
});

// ============================================
// 显示登录界面
// ============================================
function showLogin() {
  document.getElementById('login-section').classList.remove('hidden');
  document.getElementById('dashboard-section').classList.add('hidden');
}

// ============================================
// 显示管理面板
// ============================================
function showDashboard() {
  document.getElementById('login-section').classList.add('hidden');
  document.getElementById('dashboard-section').classList.remove('hidden');
  document.getElementById('admin-name').textContent = localStorage.getItem('admin_username') || 'admin';
  switchTab('dashboard');
}

// ============================================
// 绑定登录事件
// ============================================
function bindLoginEvents() {
  const loginForm = document.getElementById('login-form');
  const loginBtn = document.getElementById('login-btn');
  const loginError = document.getElementById('login-error');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!username || !password) {
      showLoginError('请输入账号和密码');
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = '登录中...';
    loginError.classList.add('hidden');

    try {
      const res = await apiFetch('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      localStorage.setItem('admin_token', res.data.token);
      localStorage.setItem('admin_username', res.data.username);
      showDashboard();

    } catch (err) {
      showLoginError(err.message || '登录失败');
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = '登录';
    }
  });

  function showLoginError(msg) {
    loginError.textContent = msg;
    loginError.classList.remove('hidden');
  }
}

// ============================================
// 绑定管理面板事件
// ============================================
function bindDashboardEvents() {
  document.getElementById('logout-btn').addEventListener('click', async () => {
    try { await apiFetch('/api/admin/logout', { method: 'POST' }); } catch (e) {}
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    showLogin();
  });

  document.getElementById('refresh-feedback-btn').addEventListener('click', () => {
    loadFeedbackList();
  });

  // 快捷按钮
  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'goto-articles') switchTab('articles');
      else if (action === 'goto-feedback') switchTab('feedback');
      else if (action === 'goto-settings') switchTab('settings');
    });
  });
}

// ============================================
// 标签页切换
// ============================================
function bindTabEvents() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });
}

function switchTab(tabName) {
  // 更新按钮状态
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // 切换内容
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.add('hidden');
  });
  document.getElementById(`tab-${tabName}`).classList.remove('hidden');

  // 加载对应数据
  if (tabName === 'dashboard') {
    loadStats();
  } else if (tabName === 'articles') {
    loadArticleList();
    showArticleListView();
  } else if (tabName === 'feedback') {
    loadFeedbackList();
  } else if (tabName === 'users') {
    loadUserList();
  } else if (tabName === 'admins') {
    loadAdminList();
  } else if (tabName === 'settings') {
    loadProfile();
  }
}

// ============================================
// 加载统计数据
// ============================================
async function loadStats() {
  try {
    const res = await apiFetch('/api/admin/stats');
    const stats = res.data;
    document.getElementById('dash-articles').textContent = stats.articles;
    document.getElementById('dash-feedbacks').textContent = stats.feedbacks;
    document.getElementById('dash-views').textContent = formatNumber(stats.totalViews);
    document.getElementById('dash-recent').textContent = stats.recentFeedbacks;
    document.getElementById('dash-users').textContent = stats.users;
    document.getElementById('dash-admins').textContent = stats.admins;
  } catch (err) {
    if (isTokenError(err)) handleTokenExpired();
  }
}

// ============================================
// ============ 文章管理 ============
// ============================================

function bindArticleEvents() {
  // 发布新文章按钮
  document.getElementById('new-article-btn').addEventListener('click', () => {
    showArticleEditor(false);
  });

  // 返回列表
  document.getElementById('back-to-list-btn').addEventListener('click', () => {
    showArticleListView();
  });

  // 取消按钮
  document.getElementById('article-cancel-btn').addEventListener('click', () => {
    showArticleListView();
  });

  // 提交表单
  document.getElementById('article-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitArticle();
  });
}

function showArticleListView() {
  document.getElementById('article-list-view').classList.remove('hidden');
  document.getElementById('article-editor-view').classList.add('hidden');
}

function showArticleEditor(isEdit) {
  document.getElementById('article-list-view').classList.add('hidden');
  document.getElementById('article-editor-view').classList.remove('hidden');
  document.getElementById('editor-title').textContent = isEdit ? '编辑文章' : '发布新文章';
  document.getElementById('article-submit-btn').textContent = isEdit ? '保存修改' : '发布文章';

  // 隐藏提示
  document.getElementById('article-form-error').classList.add('hidden');
  document.getElementById('article-form-success').classList.add('hidden');
}

// 加载文章列表
async function loadArticleList() {
  const list = document.getElementById('article-list');

  list.innerHTML = `
    <div class="text-center py-12 text-gray-500">
      <div class="inline-block w-8 h-8 border-4 border-gray-700 border-t-cyan-400 rounded-full animate-spin"></div>
      <p class="mt-3 text-sm">加载中...</p>
    </div>
  `;

  try {
    const res = await apiFetch('/api/admin/articles');
    const articles = res.data || [];

    if (articles.length === 0) {
      list.innerHTML = `
        <div class="bg-[#141b2d] rounded-xl border border-white/5 px-6 py-16 text-center text-gray-500">
          <div class="text-5xl mb-3">📝</div>
          <p>暂无文章，点击右上角发布第一篇吧</p>
        </div>
      `;
      return;
    }

    list.innerHTML = articles.map(a => `
      <div class="bg-[#141b2d] rounded-xl border border-white/5 p-4 hover:border-white/10 transition-all">
        <div class="flex items-start gap-4">
          <!-- 封面图 -->
          <div class="flex-shrink-0 w-20 h-20 md:w-28 md:h-28 rounded-lg overflow-hidden bg-[#0a0e1a] border border-white/5">
            ${a.cover_image
              ? `<img src="${escapeHtml(a.cover_image)}" class="w-full h-full object-cover" alt="">`
              : `<div class="w-full h-full flex items-center justify-center text-gray-600 text-xs">无图</div>`
            }
          </div>
          <!-- 文章信息 -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2 py-0.5 rounded text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">${escapeHtml(a.category)}</span>
              <span class="text-gray-500 text-xs">👁 ${formatNumber(a.views)} 阅读</span>
              <span class="text-gray-500 text-xs hidden sm:inline">${formatDate(a.created_at)}</span>
            </div>
            <h3 class="text-white font-medium text-sm md:text-base mb-1 line-clamp-1">${escapeHtml(a.title)}</h3>
            <p class="text-gray-400 text-xs line-clamp-2">${escapeHtml(a.summary)}</p>
            <div class="text-gray-500 text-xs mt-1">作者: ${escapeHtml(a.author)}</div>
          </div>
          <!-- 操作按钮 -->
          <div class="flex flex-col gap-2 flex-shrink-0">
            <button class="edit-article-btn px-3 py-1.5 rounded-lg border border-gray-600 hover:border-cyan-400 text-gray-400 hover:text-cyan-400 text-xs transition-all" data-id="${a.id}">
              编辑
            </button>
            <button class="delete-article-btn px-3 py-1.5 rounded-lg border border-gray-600 hover:border-red-400 text-gray-400 hover:text-red-400 text-xs transition-all" data-id="${a.id}">
              删除
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // 绑定编辑和删除事件
    list.querySelectorAll('.edit-article-btn').forEach(btn => {
      btn.addEventListener('click', () => editArticle(btn.dataset.id));
    });
    list.querySelectorAll('.delete-article-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteArticle(btn.dataset.id));
    });

  } catch (err) {
    if (isTokenError(err)) {
      handleTokenExpired();
    } else {
      list.innerHTML = `<div class="text-center py-12 text-red-400 text-sm">加载失败: ${escapeHtml(err.message)}</div>`;
    }
  }
}

// 编辑文章：加载文章数据到表单
async function editArticle(id) {
  try {
    const res = await apiFetch(`/api/articles/${id}`);
    const a = res.data;

    showArticleEditor(true);
    document.getElementById('article-id').value = a.id;
    document.getElementById('article-title').value = a.title;
    document.getElementById('article-category').value = a.category;
    document.getElementById('article-author').value = a.author;
    document.getElementById('article-cover').value = a.cover_image;
    document.getElementById('article-summary').value = a.summary;
    document.getElementById('article-content').value = a.content;

    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (err) {
    alert('加载文章失败: ' + err.message);
  }
}

// 提交文章（发布或更新）
async function submitArticle() {
  const id = document.getElementById('article-id').value;
  const data = {
    title: document.getElementById('article-title').value.trim(),
    summary: document.getElementById('article-summary').value.trim(),
    content: document.getElementById('article-content').value,
    category: document.getElementById('article-category').value.trim() || '资讯',
    cover_image: document.getElementById('article-cover').value.trim(),
    author: document.getElementById('article-author').value.trim() || '编辑部',
  };

  const errorEl = document.getElementById('article-form-error');
  const successEl = document.getElementById('article-form-success');
  const submitBtn = document.getElementById('article-submit-btn');

  errorEl.classList.add('hidden');
  successEl.classList.add('hidden');
  submitBtn.disabled = true;
  submitBtn.textContent = '提交中...';

  try {
    if (id) {
      // 编辑
      await apiFetch(`/api/admin/articles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      successEl.textContent = '文章修改成功！';
    } else {
      // 新建
      const res = await apiFetch('/api/admin/articles', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      successEl.textContent = '文章发布成功！';
    }
    successEl.classList.remove('hidden');

    // 2秒后返回列表
    setTimeout(() => {
      showArticleListView();
      loadArticleList();
      // 清空表单
      document.getElementById('article-form').reset();
      document.getElementById('article-id').value = '';
    }, 1500);

  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = id ? '保存修改' : '发布文章';
  }
}

// 删除文章
async function deleteArticle(id) {
  if (!confirm('确定要删除这篇文章吗？此操作不可撤销。')) return;

  try {
    await apiFetch(`/api/admin/articles/${id}`, { method: 'DELETE' });
    loadArticleList();
    loadStats();
  } catch (err) {
    alert('删除失败: ' + err.message);
  }
}

// ============================================
// ============ 留言管理 ============
// ============================================

async function loadFeedbackList() {
  const list = document.getElementById('feedback-list');
  const emptyState = document.getElementById('empty-feedback');

  list.innerHTML = `
    <div class="px-6 py-20 text-center text-gray-500">
      <div class="inline-block w-8 h-8 border-4 border-gray-700 border-t-cyan-400 rounded-full animate-spin"></div>
      <p class="mt-3 text-sm">加载中...</p>
    </div>
  `;
  emptyState.classList.add('hidden');

  try {
    const res = await apiFetch('/api/admin/feedback');
    const feedbacks = res.data || [];

    if (feedbacks.length === 0) {
      list.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    list.innerHTML = feedbacks.map(f => `
      <div class="px-6 py-5">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-cyan-400 font-bold text-sm flex-shrink-0">
                ${escapeHtml(f.name.charAt(0).toUpperCase())}
              </div>
              <div class="min-w-0">
                <div class="text-white font-medium text-sm truncate">${escapeHtml(f.name)}</div>
                <div class="text-gray-500 text-xs">
                  ${f.email ? escapeHtml(f.email) + ' · ' : ''}${formatDate(f.created_at)}
                </div>
              </div>
            </div>
            <div class="text-gray-300 text-sm bg-[#0a0e1a] rounded-lg px-4 py-3 mt-2 whitespace-pre-wrap break-words">
              ${escapeHtml(f.message)}
            </div>
          </div>
          <button class="delete-btn flex-shrink-0 px-3 py-1.5 rounded-lg border border-gray-600 hover:border-red-400 text-gray-400 hover:text-red-400 text-xs transition-all" data-id="${f.id}">
            删除
          </button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteFeedback(btn.dataset.id));
    });

  } catch (err) {
    if (isTokenError(err)) {
      handleTokenExpired();
    } else {
      list.innerHTML = `<div class="px-6 py-12 text-center text-red-400 text-sm">加载失败: ${escapeHtml(err.message)}</div>`;
    }
  }
}

async function deleteFeedback(id) {
  if (!confirm('确定要删除这条留言吗？')) return;
  try {
    await apiFetch(`/api/admin/feedback/${id}`, { method: 'DELETE' });
    loadFeedbackList();
    loadStats();
  } catch (err) {
    alert('删除失败: ' + err.message);
  }
}

// ============================================
// ============ 账号设置 ============
// ============================================

function bindSettingsEvents() {
  const form = document.getElementById('settings-form');
  const submitBtn = document.getElementById('settings-submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById('settings-current-password').value;
    const newUsername = document.getElementById('settings-new-username').value.trim();
    const newPassword = document.getElementById('settings-new-password').value;

    const errorEl = document.getElementById('settings-error');
    const successEl = document.getElementById('settings-success');
    errorEl.classList.add('hidden');
    successEl.classList.add('hidden');

    if (!currentPassword) {
      errorEl.textContent = '请输入当前密码';
      errorEl.classList.remove('hidden');
      return;
    }

    if (!newUsername && !newPassword) {
      errorEl.textContent = '请填写新账号名或新密码';
      errorEl.classList.remove('hidden');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '提交中...';

    try {
      const res = await apiFetch('/api/admin/change-credentials', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newUsername, newPassword }),
      });

      successEl.textContent = '修改成功！即将退出登录，请用新账号重新登录...';
      successEl.classList.remove('hidden');

      // 清空 localStorage，2秒后跳转登录
      setTimeout(() => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_username');
        location.reload();
      }, 2000);

    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '确认修改';
    }
  });
}

// 加载当前管理员信息
async function loadProfile() {
  try {
    const res = await apiFetch('/api/admin/profile');
    const profile = res.data;
    document.getElementById('current-username').textContent = profile.username;
    document.getElementById('current-updated').textContent = formatDate(profile.updated_at);
  } catch (err) {
    if (isTokenError(err)) handleTokenExpired();
  }
}

// ============================================
// ============ 用户管理 ============
// ============================================

function bindUserManagementEvents() {
  document.getElementById('refresh-users-btn').addEventListener('click', () => {
    loadUserList();
  });
}

async function loadUserList() {
  const list = document.getElementById('user-list');
  const emptyState = document.getElementById('empty-users');

  list.innerHTML = `
    <div class="px-6 py-20 text-center text-gray-500">
      <div class="inline-block w-8 h-8 border-4 border-gray-700 border-t-cyan-400 rounded-full animate-spin"></div>
      <p class="mt-3 text-sm">加载中...</p>
    </div>
  `;
  emptyState.classList.add('hidden');

  try {
    const res = await apiFetch('/api/admin/users');
    const users = res.data || [];

    if (users.length === 0) {
      list.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    list.innerHTML = users.map(u => `
      <div class="px-6 py-4">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center text-blue-400 font-bold text-sm flex-shrink-0">
              ${escapeHtml(u.username.charAt(0).toUpperCase())}
            </div>
            <div class="min-w-0">
              <div class="text-white font-medium text-sm">${escapeHtml(u.username)}</div>
              <div class="text-gray-500 text-xs">
                ${u.email ? escapeHtml(u.email) + ' · ' : ''}${formatDate(u.created_at)}
              </div>
            </div>
          </div>
          <button class="delete-user-btn flex-shrink-0 px-3 py-1.5 rounded-lg border border-gray-600 hover:border-red-400 text-gray-400 hover:text-red-400 text-xs transition-all" data-id="${u.id}" data-name="${escapeHtml(u.username)}">
            删除
          </button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.delete-user-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteUser(btn.dataset.id, btn.dataset.name));
    });

  } catch (err) {
    if (isTokenError(err)) {
      handleTokenExpired();
    } else {
      list.innerHTML = `<div class="px-6 py-12 text-center text-red-400 text-sm">加载失败: ${escapeHtml(err.message)}</div>`;
    }
  }
}

async function deleteUser(id, name) {
  if (!confirm(`确定要删除用户「${name}」吗？此操作不可撤销。`)) return;
  try {
    await apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    loadUserList();
    loadStats();
  } catch (err) {
    alert('删除失败: ' + err.message);
  }
}

// ============================================
// ============ 管理员管理 ============
// ============================================

function bindAdminManagementEvents() {
  const addBtn = document.getElementById('add-admin-btn');
  const formWrap = document.getElementById('add-admin-form-wrap');
  const cancelBtn = document.getElementById('add-admin-cancel-btn');

  addBtn.addEventListener('click', () => {
    formWrap.classList.toggle('hidden');
    if (!formWrap.classList.contains('hidden')) {
      document.getElementById('new-admin-username').focus();
    }
  });

  cancelBtn.addEventListener('click', () => {
    formWrap.classList.add('hidden');
    document.getElementById('add-admin-form').reset();
    document.getElementById('add-admin-error').classList.add('hidden');
    document.getElementById('add-admin-success').classList.add('hidden');
  });

  document.getElementById('add-admin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await addAdmin();
  });
}

async function loadAdminList() {
  const list = document.getElementById('admin-list');
  const emptyState = document.getElementById('empty-admins');

  list.innerHTML = `
    <div class="px-6 py-20 text-center text-gray-500">
      <div class="inline-block w-8 h-8 border-4 border-gray-700 border-t-cyan-400 rounded-full animate-spin"></div>
      <p class="mt-3 text-sm">加载中...</p>
    </div>
  `;
  emptyState.classList.add('hidden');

  try {
    const res = await apiFetch('/api/admin/admins');
    const admins = res.data || [];
    const currentUsername = localStorage.getItem('admin_username');

    if (admins.length === 0) {
      list.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    list.innerHTML = admins.map(a => `
      <div class="px-6 py-4">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-pink-400 font-bold text-sm flex-shrink-0">
              ${escapeHtml(a.username.charAt(0).toUpperCase())}
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-white font-medium text-sm">${escapeHtml(a.username)}</span>
                ${a.username === currentUsername ? '<span class="px-2 py-0.5 rounded text-xs bg-green-500/10 text-green-400 border border-green-500/20">当前登录</span>' : ''}
                ${a.id === 1 ? '<span class="px-2 py-0.5 rounded text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">超级管理员</span>' : ''}
              </div>
              <div class="text-gray-500 text-xs">
                创建于 ${formatDate(a.created_at)}${a.updated_at !== a.created_at ? ' · 更新于 ' + formatDate(a.updated_at) : ''}
              </div>
            </div>
          </div>
          ${a.username === currentUsername
            ? '<span class="text-gray-600 text-xs px-3 py-1.5">不可删除自己</span>'
            : `<button class="delete-admin-btn flex-shrink-0 px-3 py-1.5 rounded-lg border border-gray-600 hover:border-red-400 text-gray-400 hover:text-red-400 text-xs transition-all" data-id="${a.id}" data-name="${escapeHtml(a.username)}">删除</button>`
          }
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.delete-admin-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteAdmin(btn.dataset.id, btn.dataset.name));
    });

  } catch (err) {
    if (isTokenError(err)) {
      handleTokenExpired();
    } else {
      list.innerHTML = `<div class="px-6 py-12 text-center text-red-400 text-sm">加载失败: ${escapeHtml(err.message)}</div>`;
    }
  }
}

async function addAdmin() {
  const username = document.getElementById('new-admin-username').value.trim();
  const password = document.getElementById('new-admin-password').value;
  const errorEl = document.getElementById('add-admin-error');
  const successEl = document.getElementById('add-admin-success');
  const submitBtn = document.getElementById('add-admin-submit-btn');

  errorEl.classList.add('hidden');
  successEl.classList.add('hidden');
  submitBtn.disabled = true;
  submitBtn.textContent = '添加中...';

  try {
    await apiFetch('/api/admin/admins', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    successEl.textContent = `管理员「${username}」添加成功！`;
    successEl.classList.remove('hidden');

    // 清空表单
    document.getElementById('add-admin-form').reset();

    // 刷新列表和统计
    loadAdminList();
    loadStats();

    // 2秒后隐藏成功提示和表单
    setTimeout(() => {
      successEl.classList.add('hidden');
      document.getElementById('add-admin-form-wrap').classList.add('hidden');
    }, 2000);

  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '添加';
  }
}

async function deleteAdmin(id, name) {
  if (!confirm(`确定要删除管理员「${name}」吗？该账号将无法登录后台。`)) return;
  try {
    await apiFetch(`/api/admin/admins/${id}`, { method: 'DELETE' });
    loadAdminList();
    loadStats();
  } catch (err) {
    alert('删除失败: ' + err.message);
  }
}

// ============================================
// 工具函数
// ============================================

function isTokenError(err) {
  return err.message.includes('令牌') || err.message.includes('401') || err.message.includes('过期');
}

function handleTokenExpired() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_username');
  showLogin();
  const loginError = document.getElementById('login-error');
  loginError.textContent = '登录已过期，请重新登录';
  loginError.classList.remove('hidden');
}
