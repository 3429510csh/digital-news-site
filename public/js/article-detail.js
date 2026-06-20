/**
 * article-detail.js — 文章详情页逻辑
 * 从 URL 参数获取文章 ID，加载详情并渲染 Markdown
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 从 URL 获取文章 ID
  const params = new URLSearchParams(window.location.search);
  const articleId = params.get('id');

  if (!articleId) {
    showNotFound();
    return;
  }

  await loadArticle(articleId);
});

// ============================================
// 加载文章详情
// ============================================
async function loadArticle(id) {
  const loading = document.getElementById('loading');
  const content = document.getElementById('article-content');
  const notFound = document.getElementById('not-found');

  try {
    const res = await apiFetch(`/api/articles/${id}`);
    const article = res.data;

    // 隐藏加载中
    loading.classList.add('hidden');
    content.classList.remove('hidden');

    // 填充内容
    document.getElementById('article-category').textContent = article.category;
    document.getElementById('article-title').textContent = article.title;
    document.getElementById('article-author').textContent = article.author;
    document.getElementById('article-date').textContent = formatDate(article.created_at);
    document.getElementById('article-views').textContent = formatNumber(article.views);
    document.getElementById('article-cover').src = article.cover_image;
    document.getElementById('article-cover').alt = article.title;

    // 渲染 Markdown 正文
    const bodyEl = document.getElementById('article-body');
    if (typeof marked !== 'undefined') {
      bodyEl.innerHTML = marked.parse(article.content);
    } else {
      // marked 未加载时的降级处理
      bodyEl.innerHTML = `<div style="white-space: pre-wrap;">${escapeHtml(article.content)}</div>`;
    }

    // 更新页面标题
    document.title = `${article.title} — 数码前线`;

  } catch (err) {
    loading.classList.add('hidden');
    notFound.classList.remove('hidden');
    console.error('加载文章失败:', err);
  }
}

// ============================================
// 显示「文章不存在」
// ============================================
function showNotFound() {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('not-found').classList.remove('hidden');
}
