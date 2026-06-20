/**
 * home.js — 首页逻辑
 * 加载最新文章 + 统计数据
 */

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    loadLatestArticles(),
    loadStats()
  ]);
});

// ============================================
// 加载最新文章（取前 6 篇）
// ============================================
async function loadLatestArticles() {
  const grid = document.getElementById('article-grid');
  try {
    const res = await apiFetch('/api/articles?limit=6');
    const articles = res.data || [];

    if (articles.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-20 text-gray-500">
          <div class="text-5xl mb-3">📭</div>
          <p>暂无文章</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = articles.map((a, i) => `
      <a href="/article.html?id=${a.id}" class="article-card fade-in-up block bg-[#141b2d] rounded-xl overflow-hidden border border-white/5" style="animation-delay: ${i * 0.08}s">
        <div class="overflow-hidden h-48">
          <img src="${escapeHtml(a.cover_image)}" alt="${escapeHtml(a.title)}" class="article-card-cover w-full h-full object-cover" loading="lazy">
        </div>
        <div class="p-5">
          <div class="inline-block px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs mb-3">
            ${escapeHtml(a.category)}
          </div>
          <h3 class="text-white font-semibold text-base leading-snug mb-2 line-clamp-2" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
            ${escapeHtml(a.title)}
          </h3>
          <p class="text-gray-400 text-sm line-clamp-2 mb-4" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
            ${escapeHtml(a.summary)}
          </p>
          <div class="flex items-center justify-between text-xs text-gray-500">
            <span>${escapeHtml(a.author)}</span>
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
              </svg>
              ${formatNumber(a.views)}
            </span>
          </div>
        </div>
      </a>
    `).join('');
  } catch (err) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-20 text-red-400">
        <p>加载文章失败: ${escapeHtml(err.message)}</p>
      </div>
    `;
  }
}

// ============================================
// 加载统计数据
// ============================================
async function loadStats() {
  try {
    // 获取文章统计
    const articlesRes = await apiFetch('/api/articles');
    const articles = articlesRes.data || [];

    // 计算分类数
    const categories = new Set(articles.map(a => a.category));

    // 计算总阅读量
    const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);

    // 尝试获取留言统计（需要管理员权限，失败则显示 0）
    let feedbackCount = 0;
    try {
      const token = localStorage.getItem('admin_token');
      if (token) {
        const feedbackRes = await apiFetch('/api/admin/feedback');
        feedbackCount = feedbackRes.total || 0;
      }
    } catch (e) {
      // 未登录后台，留言数不显示
    }

    // 动画显示数字
    animateNumber('stat-articles', articles.length);
    animateNumber('stat-categories', categories.size);
    animateNumber('stat-views', totalViews, true);
    animateNumber('stat-feedbacks', feedbackCount);
  } catch (err) {
    console.error('加载统计失败:', err);
  }
}

// ============================================
// 数字滚动动画
// ============================================
function animateNumber(elementId, target, useFormat = false) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const duration = 1000;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    const current = Math.floor(target * eased);

    el.textContent = useFormat ? formatNumber(current) : current.toString();

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = useFormat ? formatNumber(target) : target.toString();
    }
  }

  requestAnimationFrame(update);
}
