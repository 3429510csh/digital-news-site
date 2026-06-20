/**
 * main.js — 全局共享脚本
 * 提供导航栏组件、API 请求封装、通用工具函数、用户认证弹窗
 */

// ============================================
// API 请求基础地址
// ============================================
const API_BASE = '';

// ============================================
// 封装 fetch 请求
// ============================================
async function apiFetch(url, options = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const mergedOptions = { ...defaultOptions, ...options };

  // 如果有 admin token，自动添加到请求头
  const adminToken = localStorage.getItem('admin_token');
  if (adminToken) {
    mergedOptions.headers['Authorization'] = `Bearer ${adminToken}`;
  } else {
    // 否则尝试 user token
    const userToken = localStorage.getItem('user_token');
    if (userToken) {
      mergedOptions.headers['Authorization'] = `Bearer ${userToken}`;
    }
  }

  const response = await fetch(API_BASE + url, mergedOptions);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || `请求失败 (${response.status})`);
  }

  return data;
}

// ============================================
// 格式化日期
// ============================================
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr.replace(' ', 'T'));
  const now = new Date();
  const diff = (now - d) / 1000;

  if (diff < 60) return '刚刚';
  if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前';
  if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前';
  if (diff < 604800) return Math.floor(diff / 86400) + ' 天前';

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ============================================
// 格式化数字（万）
// ============================================
function formatNumber(num) {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  }
  return num.toString();
}

// ============================================
// HTML 转义（防 XSS）
// ============================================
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================================
// 渲染共享导航栏（含用户登录状态）
// ============================================
function renderNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;

  const currentPath = window.location.pathname;
  const isActive = (path) => {
    if (path === '/' && (currentPath === '/' || currentPath.endsWith('/index.html'))) return true;
    if (path !== '/' && currentPath.includes(path)) return true;
    return false;
  };

  const linkClass = (path) => `
    px-3 py-2 rounded-lg text-sm font-medium transition-colors
    ${isActive(path) ? 'text-cyan-400 bg-cyan-500/10' : 'text-gray-300 hover:text-white hover:bg-white/5'}
  `;

  // 用户登录状态
  const userToken = localStorage.getItem('user_token');
  const userName = localStorage.getItem('user_name');

  // 用户区域 HTML
  let userArea;
  if (userToken && userName) {
    userArea = `
      <div class="relative">
        <button id="user-menu-btn" class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
          <div class="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
            ${escapeHtml(userName.charAt(0).toUpperCase())}
          </div>
          <span class="hidden sm:inline">${escapeHtml(userName)}</span>
          <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div id="user-dropdown" class="hidden absolute right-0 top-full mt-2 w-44 bg-[#141b2d] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
          <div class="px-4 py-3 border-b border-white/5">
            <div class="text-gray-500 text-xs">已登录</div>
            <div class="text-white font-medium text-sm truncate">${escapeHtml(userName)}</div>
          </div>
          <button id="user-logout-btn" class="w-full text-left px-4 py-2.5 text-red-400 hover:bg-red-500/10 text-sm transition-colors">
            退出登录
          </button>
        </div>
      </div>
    `;
  } else {
    userArea = `
      <button id="auth-modal-btn" class="px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 text-sm font-medium transition-all">
        登录 / 注册
      </button>
    `;
  }

  nav.className = 'sticky top-0 z-40 border-b border-white/5 bg-[#0a0e1a]/80 backdrop-blur-md transition-all';
  nav.innerHTML = `
    <div class="max-w-6xl mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <a href="/" class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
            <span class="text-white font-bold text-lg">D</span>
          </div>
          <span class="text-white font-bold text-lg hidden sm:inline">数码前线</span>
        </a>

        <!-- 桌面端导航 -->
        <div class="hidden md:flex items-center gap-1">
          <a href="/" class="${linkClass('/')}">首页</a>
          <a href="/tutorials.html" class="${linkClass('tutorials')}">工具教程</a>
          <a href="/feedback.html" class="${linkClass('feedback')}">留言反馈</a>
          <div class="w-px h-6 bg-white/10 mx-2"></div>
          ${userArea}
          <a href="/admin.html" class="ml-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 text-sm font-medium transition-all">
            管理后台
          </a>
        </div>

        <!-- 移动端菜单按钮 -->
        <button id="mobile-menu-btn" class="md:hidden text-gray-300 hover:text-white p-2">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>

      <!-- 移动端菜单 -->
      <div id="mobile-menu" class="hidden md:hidden pb-4 space-y-1">
        <a href="/" class="block px-4 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 text-sm">首页</a>
        <a href="/tutorials.html" class="block px-4 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 text-sm">工具教程</a>
        <a href="/feedback.html" class="block px-4 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 text-sm">留言反馈</a>
        <a href="/admin.html" class="block px-4 py-2.5 rounded-lg text-cyan-400 bg-cyan-500/10 text-sm">管理后台</a>
        <div class="pt-2 border-t border-white/5 mt-2">
          ${userToken && userName
            ? `<button id="mobile-logout-btn" class="w-full text-left px-4 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 text-sm">退出登录 (${escapeHtml(userName)})</button>`
            : `<button id="mobile-auth-btn" class="w-full text-left px-4 py-2.5 rounded-lg text-green-400 hover:bg-green-500/10 text-sm">登录 / 注册</button>`
          }
        </div>
      </div>
    </div>
  `;

  // 移动端菜单切换
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // 用户下拉菜单
  const userMenuBtn = document.getElementById('user-menu-btn');
  const userDropdown = document.getElementById('user-dropdown');
  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
      if (!userDropdown.contains(e.target) && e.target !== userMenuBtn) {
        userDropdown.classList.add('hidden');
      }
    });

    document.getElementById('user-logout-btn').addEventListener('click', userLogout);
  }

  // 打开认证弹窗
  const authBtn = document.getElementById('auth-modal-btn');
  if (authBtn) authBtn.addEventListener('click', openAuthModal);
  const mobileAuthBtn = document.getElementById('mobile-auth-btn');
  if (mobileAuthBtn) {
    mobileAuthBtn.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
      openAuthModal();
    });
  }
  const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener('click', userLogout);
  }

  // 滚动时添加毛玻璃效果
  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
      nav.classList.add('navbar-scrolled');
    } else {
      nav.classList.remove('navbar-scrolled');
    }
  });
}

// ============================================
// 用户退出登录
// ============================================
async function userLogout() {
  try {
    const token = localStorage.getItem('user_token');
    if (token) {
      await fetch(API_BASE + '/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
  } catch (e) {}
  localStorage.removeItem('user_token');
  localStorage.removeItem('user_name');
  renderNavbar();
}

// ============================================
// 认证弹窗（登录 / 注册）
// ============================================
function openAuthModal() {
  // 如果弹窗已存在则移除
  const existing = document.getElementById('auth-modal-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'auth-modal-overlay';
  overlay.className = 'fixed inset-0 z-[100] flex items-center justify-center px-4';
  overlay.style.background = 'rgba(0,0,0,0.6)';
  overlay.style.backdropFilter = 'blur(4px)';

  overlay.innerHTML = `
    <div class="relative w-full max-w-md bg-[#141b2d] rounded-2xl border border-white/10 shadow-2xl overflow-hidden" id="auth-modal-box">
      <!-- 关闭按钮 -->
      <button id="auth-close-btn" class="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>

      <!-- 标签切换 -->
      <div class="flex border-b border-white/5">
        <button id="tab-login" class="flex-1 py-4 text-sm font-medium text-cyan-400 border-b-2 border-cyan-400 transition-all">登录</button>
        <button id="tab-register" class="flex-1 py-4 text-sm font-medium text-gray-400 border-b-2 border-transparent hover:text-white transition-all">注册</button>
      </div>

      <!-- 登录表单 -->
      <form id="login-form-modal" class="p-8 space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">用户名</label>
          <input type="text" id="login-username-input" required placeholder="请输入用户名"
            class="w-full px-4 py-3 rounded-lg bg-[#0a0e1a] border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">密码</label>
          <input type="password" id="login-password-input" required placeholder="请输入密码"
            class="w-full px-4 py-3 rounded-lg bg-[#0a0e1a] border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors">
        </div>
        <div id="login-error-msg" class="hidden px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"></div>
        <button type="submit" id="login-submit-btn" class="w-full py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white font-medium transition-all hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50">
          登录
        </button>
      </form>

      <!-- 注册表单 -->
      <form id="register-form-modal" class="p-8 space-y-5 hidden">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">用户名</label>
          <input type="text" id="register-username-input" required placeholder="2-20 个字符"
            class="w-full px-4 py-3 rounded-lg bg-[#0a0e1a] border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-colors">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">邮箱 <span class="text-gray-500 text-xs">(选填)</span></label>
          <input type="email" id="register-email-input" placeholder="your@email.com"
            class="w-full px-4 py-3 rounded-lg bg-[#0a0e1a] border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-colors">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">密码</label>
          <input type="password" id="register-password-input" required placeholder="至少 6 个字符"
            class="w-full px-4 py-3 rounded-lg bg-[#0a0e1a] border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-colors">
        </div>
        <div id="register-error-msg" class="hidden px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"></div>
        <div id="register-success-msg" class="hidden px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm"></div>
        <button type="submit" id="register-submit-btn" class="w-full py-3 rounded-lg bg-green-500 hover:bg-green-400 text-white font-medium transition-all hover:shadow-lg hover:shadow-green-500/30 disabled:opacity-50">
          注册
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  // 关闭弹窗
  function closeAuthModal() {
    overlay.remove();
    document.body.style.overflow = '';
  }

  document.getElementById('auth-close-btn').addEventListener('click', closeAuthModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeAuthModal();
  });

  // 标签切换
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const loginForm = document.getElementById('login-form-modal');
  const registerForm = document.getElementById('register-form-modal');

  function switchToLogin() {
    tabLogin.classList.add('text-cyan-400', 'border-cyan-400');
    tabLogin.classList.remove('text-gray-400', 'border-transparent');
    tabRegister.classList.add('text-gray-400', 'border-transparent');
    tabRegister.classList.remove('text-cyan-400', 'border-cyan-400');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  }

  function switchToRegister() {
    tabRegister.classList.add('text-cyan-400', 'border-cyan-400');
    tabRegister.classList.remove('text-gray-400', 'border-transparent');
    tabLogin.classList.add('text-gray-400', 'border-transparent');
    tabLogin.classList.remove('text-cyan-400', 'border-cyan-400');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  }

  tabLogin.addEventListener('click', switchToLogin);
  tabRegister.addEventListener('click', switchToRegister);

  // 登录提交
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username-input').value.trim();
    const password = document.getElementById('login-password-input').value;
    const errorEl = document.getElementById('login-error-msg');
    const btn = document.getElementById('login-submit-btn');

    errorEl.classList.add('hidden');
    btn.disabled = true;
    btn.textContent = '登录中...';

    try {
      const res = await fetch(API_BASE + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || '登录失败');

      localStorage.setItem('user_token', data.data.token);
      localStorage.setItem('user_name', data.data.username);

      closeAuthModal();
      renderNavbar();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.textContent = '登录';
    }
  });

  // 注册提交
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username-input').value.trim();
    const email = document.getElementById('register-email-input').value.trim();
    const password = document.getElementById('register-password-input').value;
    const errorEl = document.getElementById('register-error-msg');
    const successEl = document.getElementById('register-success-msg');
    const btn = document.getElementById('register-submit-btn');

    errorEl.classList.add('hidden');
    successEl.classList.add('hidden');
    btn.disabled = true;
    btn.textContent = '注册中...';

    try {
      const res = await fetch(API_BASE + '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || '注册失败');

      successEl.textContent = '注册成功！正在自动登录...';
      successEl.classList.remove('hidden');

      // 自动登录
      setTimeout(async () => {
        try {
          const loginRes = await fetch(API_BASE + '/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          });
          const loginData = await loginRes.json();
          if (loginRes.ok) {
            localStorage.setItem('user_token', loginData.data.token);
            localStorage.setItem('user_name', loginData.data.username);
            closeAuthModal();
            renderNavbar();
          } else {
            switchToLogin();
            document.getElementById('login-username-input').value = username;
          }
        } catch (e) {
          switchToLogin();
          document.getElementById('login-username-input').value = username;
        }
      }, 1200);

    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.textContent = '注册';
    }
  });
}

// ============================================
// 页面加载完成后渲染导航栏
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
});
