/**
 * feedback.js — 留言反馈页逻辑
 * 字数统计 + 表单提交
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('feedback-form');
  const messageInput = document.getElementById('message');
  const charCount = document.getElementById('char-count');
  const submitBtn = document.getElementById('submit-btn');
  const successMessage = document.getElementById('success-message');
  const errorMessage = document.getElementById('error-message');
  const resetBtn = document.getElementById('reset-btn');

  // ============================================
  // 字数实时统计
  // ============================================
  messageInput.addEventListener('input', () => {
    charCount.textContent = messageInput.value.length;
  });

  // ============================================
  // 表单提交
  // ============================================
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 隐藏之前的错误
    errorMessage.classList.add('hidden');

    // 获取表单数据
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = messageInput.value.trim();

    // 前端校验
    if (!name) {
      showError('请填写姓名');
      return;
    }
    if (!message) {
      showError('请填写留言内容');
      return;
    }

    // 禁用按钮
    submitBtn.disabled = true;
    submitBtn.textContent = '提交中...';

    try {
      const res = await apiFetch('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({ name, email, message }),
      });

      // 显示成功
      form.classList.add('hidden');
      successMessage.classList.remove('hidden');

    } catch (err) {
      showError(err.message || '提交失败，请稍后重试');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '提交留言';
    }
  });

  // ============================================
  // 重置表单（再写一条）
  // ============================================
  resetBtn.addEventListener('click', () => {
    form.reset();
    charCount.textContent = '0';
    form.classList.remove('hidden');
    successMessage.classList.add('hidden');
  });

  // ============================================
  // 显示错误提示
  // ============================================
  function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.classList.remove('hidden');
    // 3 秒后自动隐藏
    setTimeout(() => {
      errorMessage.classList.add('hidden');
    }, 3000);
  }
});
