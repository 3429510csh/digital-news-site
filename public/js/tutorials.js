/**
 * tutorials.js — 工具教程列表页逻辑
 * 加载分类筛选 + 文章列表
 */

let currentCategory = '全部';

document.addEventListener('DOMContentLoaded', async () => {
  await loadCategories();
  await loadArticles();
});

// ============================================
// 加载分类筛选按钮
// ============================================
async function loadCategories() {
  const filterContainer = document.getElementById('category-filter');
  try {
    const res = await apiFetch('/api/categories');
    const categories = res.data || [];

    // 构建按钮（包含「全部」）
    let buttons = `
      <button class="filter-btn ${currentCategory === '全部' ? 'active' : ''} px-5 py-2 rounded-full text-sm font-medium transition-all" data-category="全部">
        全部
      </button>
    `;

    categories.forEach(cat => {
      buttons += `
        <button class="filter-btn ${currentCategory === cat ? 'active' : ''} px-5 py-2 rounded-full text-sm font-medium transition-all" data-category="${escapeHtml(cat)}">
          ${escapeHtml(cat)}
        </button>
      `;
    });

    filterContainer.innerHTML = buttons;

    // 绑定点击事件
    filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentCategory = btn.dataset.category;
        // 更新按钮状态
        filterContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // 重新加载文章
        loadArticles();
      });
    });
  } catch (err) {
    console.error('加载分类失败:', err);
  }
}

// ============================================
// 加载文章列表
// ============================================
async function loadArticles() {
  const list = document.getElementById('tutorial-list');
  const emptyState = document.getElementById('empty-state');

  // 显示加载中
  list.innerHTML = `
    <div class="animate-pulse bg-[#141b2d] rounded-xl h-32 border border-white/5"></div>
    <div class="animate-pulse bg-[#141b2d] rounded-xl h-32 border border-white/5"></div>
  `;
  emptyState.classList.add('hidden');

  try {
    let url = '/api/articles';
    if (currentCategory !== '全部') {
      url += `?category=${encodeURIComponent(currentCategory)}`;
    }

    const res = await apiFetch(url);
    const articles = res.data || [];

    if (articles.length === 0) {
      list.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    list.innerHTML = articles.map((a, i) => `
      <a href="/article.html?id=${a.id}" class="article-card fade-in-up block bg-[#141b2d] rounded-xl overflow-hidden border border-white/5" style="animation-delay: ${i * 0.06}s">
        <div class="flex flex-col sm:flex-row">
          <!-- 封面图 -->
          <div class="sm:w-56 h-40 sm:h-auto flex-shrink-0 overflow-hidden">
            <img src="${escapeHtml(a.cover_image)}" alt="${escapeHtml(a.title)}" class="article-card-cover w-full h-full object-cover" loading="lazy">
          </div>
          <!-- 内容 -->
          <div class="p-5 flex-1 flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span class="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs">
                  ${escapeHtml(a.category)}
                </span>
                <span class="text-gray-500 text-xs">${formatDate(a.created_at)}</span>
              </div>
              <h3 class="text-white font-semibold text-base md:text-lg leading-snug mb-2" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                ${escapeHtml(a.title)}
              </h3>
              <p class="text-gray-400 text-sm line-clamp-2" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                ${escapeHtml(a.summary)}
              </p>
            </div>
            <div class="flex items-center gap-4 text-xs text-gray-500 mt-3">
              <span class="flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/></svg>
                ${escapeHtml(a.author)}
              </span>
              <span class="flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>
                ${formatNumber(a.views)} 阅读
              </span>
            </div>
          </div>
        </div>
      </a>
    `).join('');
  } catch (err) {
    list.innerHTML = `
      <div class="text-center py-12 text-red-400">
        <p>加载失败: ${escapeHtml(err.message)}</p>
      </div>
    `;
  }
}
