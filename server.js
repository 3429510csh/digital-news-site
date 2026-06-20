/**
 * server.js — 后端主程序
 * Express 服务器，提供 RESTful API 和静态文件服务
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// -------------------------------------------------------
// 中间件
// -------------------------------------------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（public 目录映射到根路径）
app.use(express.static(path.join(__dirname, 'public')));

// -------------------------------------------------------
// 认证相关
// -------------------------------------------------------

// token -> { type: 'admin'|'user', id, username }
const validTokens = new Map();

// 生成随机令牌
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// 认证中间件（管理员）：检查请求头中的 Authorization
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;
  const tokenInfo = validTokens.get(token);
  if (!tokenInfo || tokenInfo.type !== 'admin') {
    return res.status(401).json({ error: '令牌无效或已过期，请重新登录' });
  }
  req.admin = tokenInfo;     // 挂载当前管理员信息
  req.token = token;          // 挂载当前 token
  next();
}

// -------------------------------------------------------
// API 路由
// -------------------------------------------------------

// === 1. 获取文章列表（支持按分类筛选） ===
app.get('/api/articles', (req, res) => {
  const { category, limit } = req.query;
  let query = 'SELECT id, title, summary, category, cover_image, author, views, created_at FROM articles';
  const params = [];

  if (category && category !== '全部') {
    query += ' WHERE category = ?';
    params.push(category);
  }

  query += ' ORDER BY created_at DESC';

  if (limit) {
    query += ' LIMIT ?';
    params.push(parseInt(limit));
  }

  const articles = db.prepare(query).all(...params);
  res.json({ success: true, data: articles, total: articles.length });
});

// === 2. 获取单篇文章详情 ===
app.get('/api/articles/:id', (req, res) => {
  const { id } = req.params;
  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);

  if (!article) {
    return res.status(404).json({ success: false, error: '文章不存在' });
  }

  // 阅读量 +1
  db.prepare('UPDATE articles SET views = views + 1 WHERE id = ?').run(id);

  res.json({ success: true, data: article });
});

// === 3. 获取所有分类 ===
app.get('/api/categories', (req, res) => {
  const categories = db.prepare(
    'SELECT DISTINCT category FROM articles ORDER BY category'
  ).all();
  res.json({
    success: true,
    data: categories.map(c => c.category)
  });
});

// === 4. 访客提交留言 ===
app.post('/api/feedback', (req, res) => {
  const { name, email, message } = req.body;

  // 参数校验
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: '请填写姓名' });
  }
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, error: '请填写留言内容' });
  }
  if (name.length > 50) {
    return res.status(400).json({ success: false, error: '姓名不能超过 50 个字符' });
  }
  if (message.length > 1000) {
    return res.status(400).json({ success: false, error: '留言内容不能超过 1000 个字符' });
  }

  const result = db.prepare(
    'INSERT INTO feedback (name, email, message) VALUES (?, ?, ?)'
  ).run(name.trim(), (email || '').trim(), message.trim());

  res.json({
    success: true,
    message: '留言提交成功，感谢您的反馈！',
    data: { id: result.lastInsertRowid }
  });
});

// === 5. 管理员登录 ===
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: '请输入账号和密码' });
  }

  const admin = db.prepare('SELECT * FROM admins WHERE username = ? AND password = ?').get(username, password);

  if (admin) {
    const token = generateToken();
    validTokens.set(token, { type: 'admin', id: admin.id, username: admin.username });
    res.json({
      success: true,
      message: '登录成功',
      data: { token, username: admin.username }
    });
  } else {
    res.status(401).json({ success: false, error: '账号或密码错误' });
  }
});

// === 6. 管理员退出登录 ===
app.post('/api/admin/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;
    validTokens.delete(token);
  }
  res.json({ success: true, message: '已退出登录' });
});

// === 7. 管理员获取全部留言 ===
app.get('/api/admin/feedback', authMiddleware, (req, res) => {
  const feedbacks = db.prepare(
    'SELECT * FROM feedback ORDER BY created_at DESC'
  ).all();
  res.json({ success: true, data: feedbacks, total: feedbacks.length });
});

// === 8. 管理员删除留言 ===
app.delete('/api/admin/feedback/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const result = db.prepare('DELETE FROM feedback WHERE id = ?').run(id);

  if (result.changes === 0) {
    return res.status(404).json({ success: false, error: '留言不存在' });
  }

  res.json({ success: true, message: '留言已删除' });
});

// === 9. 管理员批量删除留言 ===
app.delete('/api/admin/feedback', authMiddleware, (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, error: '请指定要删除的留言 ID' });
  }

  const placeholders = ids.map(() => '?').join(',');
  const result = db.prepare(
    `DELETE FROM feedback WHERE id IN (${placeholders})`
  ).run(...ids);

  res.json({
    success: true,
    message: `已删除 ${result.changes} 条留言`,
    data: { deleted: result.changes }
  });
});

// === 10. 获取统计数据（管理员仪表盘） ===
app.get('/api/admin/stats', authMiddleware, (req, res) => {
  const articleCount = db.prepare('SELECT COUNT(*) AS count FROM articles').get();
  const feedbackCount = db.prepare('SELECT COUNT(*) AS count FROM feedback').get();
  const totalViews = db.prepare('SELECT SUM(views) AS total FROM articles').get();
  const recentFeedback = db.prepare(
    "SELECT COUNT(*) AS count FROM feedback WHERE created_at >= datetime('now','localtime','-7 days')"
  ).get();
  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get();
  const adminCount = db.prepare('SELECT COUNT(*) AS count FROM admins').get();

  res.json({
    success: true,
    data: {
      articles: articleCount.count,
      feedbacks: feedbackCount.count,
      totalViews: totalViews.total || 0,
      recentFeedbacks: recentFeedback.count,
      users: userCount.count,
      admins: adminCount.count
    }
  });
});

// === 11. 管理员获取文章列表（含正文，供后台管理） ===
app.get('/api/admin/articles', authMiddleware, (req, res) => {
  const articles = db.prepare(
    'SELECT id, title, summary, category, cover_image, author, views, created_at FROM articles ORDER BY created_at DESC'
  ).all();
  res.json({ success: true, data: articles, total: articles.length });
});

// === 12. 管理员发布新文章 ===
app.post('/api/admin/articles', authMiddleware, (req, res) => {
  const { title, summary, content, category, cover_image, author } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, error: '请填写文章标题' });
  }
  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, error: '请填写文章正文' });
  }
  if (!summary || !summary.trim()) {
    return res.status(400).json({ success: false, error: '请填写文章摘要' });
  }

  const result = db.prepare(`
    INSERT INTO articles (title, summary, content, category, cover_image, author)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    title.trim(),
    summary.trim(),
    content.trim(),
    (category || '资讯').trim(),
    (cover_image || '').trim(),
    (author || '编辑部').trim()
  );

  res.json({
    success: true,
    message: '文章发布成功',
    data: { id: result.lastInsertRowid }
  });
});

// === 13. 管理员编辑文章 ===
app.put('/api/admin/articles/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { title, summary, content, category, cover_image, author } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, error: '请填写文章标题' });
  }
  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, error: '请填写文章正文' });
  }
  if (!summary || !summary.trim()) {
    return res.status(400).json({ success: false, error: '请填写文章摘要' });
  }

  const result = db.prepare(`
    UPDATE articles
    SET title = ?, summary = ?, content = ?, category = ?, cover_image = ?, author = ?,
        created_at = datetime('now','localtime')
    WHERE id = ?
  `).run(
    title.trim(),
    summary.trim(),
    content.trim(),
    (category || '资讯').trim(),
    (cover_image || '').trim(),
    (author || '编辑部').trim(),
    id
  );

  if (result.changes === 0) {
    return res.status(404).json({ success: false, error: '文章不存在' });
  }

  res.json({ success: true, message: '文章已更新' });
});

// === 14. 管理员删除文章 ===
app.delete('/api/admin/articles/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const result = db.prepare('DELETE FROM articles WHERE id = ?').run(id);

  if (result.changes === 0) {
    return res.status(404).json({ success: false, error: '文章不存在' });
  }

  res.json({ success: true, message: '文章已删除' });
});

// === 15. 管理员修改账号密码 ===
app.post('/api/admin/change-credentials', authMiddleware, (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body;

  if (!currentPassword) {
    return res.status(400).json({ success: false, error: '请输入当前密码' });
  }

  // 用当前登录管理员的 ID 查库验证密码
  const admin = db.prepare('SELECT * FROM admins WHERE id = ? AND password = ?').get(req.admin.id, currentPassword);
  if (!admin) {
    return res.status(401).json({ success: false, error: '当前密码不正确' });
  }

  // 准备更新字段
  const updates = [];
  const params = [];

  if (newUsername && newUsername.trim()) {
    if (newUsername.trim().length < 3) {
      return res.status(400).json({ success: false, error: '用户名至少 3 个字符' });
    }
    const existing = db.prepare('SELECT id FROM admins WHERE username = ? AND id != ?').get(newUsername.trim(), admin.id);
    if (existing) {
      return res.status(400).json({ success: false, error: '该用户名已被使用' });
    }
    updates.push('username = ?');
    params.push(newUsername.trim());
  }

  if (newPassword && newPassword.trim()) {
    if (newPassword.trim().length < 6) {
      return res.status(400).json({ success: false, error: '新密码至少 6 个字符' });
    }
    updates.push('password = ?');
    params.push(newPassword.trim());
  }

  if (updates.length === 0) {
    return res.status(400).json({ success: false, error: '没有需要修改的内容' });
  }

  updates.push("updated_at = datetime('now','localtime')");
  params.push(admin.id);

  db.prepare(`UPDATE admins SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  // 更新 token 中的用户名
  const tokenInfo = validTokens.get(req.token);
  if (tokenInfo && newUsername) {
    tokenInfo.username = newUsername.trim();
    validTokens.set(req.token, tokenInfo);
  }

  res.json({
    success: true,
    message: '账号信息修改成功，请重新登录',
    data: {
      username: newUsername ? newUsername.trim() : admin.username
    }
  });
});

// === 16. 获取当前管理员信息 ===
app.get('/api/admin/profile', authMiddleware, (req, res) => {
  const admin = db.prepare('SELECT id, username, created_at, updated_at FROM admins WHERE id = ?').get(req.admin.id);
  if (!admin) {
    return res.status(404).json({ success: false, error: '管理员账号不存在' });
  }

  res.json({ success: true, data: admin });
});

// -------------------------------------------------------
// 前台用户认证 API
// -------------------------------------------------------

// === 17. 用户注册 ===
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !username.trim()) {
    return res.status(400).json({ success: false, error: '请输入用户名' });
  }
  if (username.trim().length < 2) {
    return res.status(400).json({ success: false, error: '用户名至少 2 个字符' });
  }
  if (username.trim().length > 20) {
    return res.status(400).json({ success: false, error: '用户名不能超过 20 个字符' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, error: '密码至少 6 个字符' });
  }

  // 检查用户名是否已存在（同时检查 users 和 admins 表）
  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim());
  if (existingUser) {
    return res.status(400).json({ success: false, error: '该用户名已被注册' });
  }
  const existingAdmin = db.prepare('SELECT id FROM admins WHERE username = ?').get(username.trim());
  if (existingAdmin) {
    return res.status(400).json({ success: false, error: '该用户名已被使用' });
  }

  const result = db.prepare(
    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)'
  ).run(username.trim(), (email || '').trim(), password);

  res.json({
    success: true,
    message: '注册成功，请登录',
    data: { id: result.lastInsertRowid }
  });
});

// === 18. 用户登录 ===
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: '请输入用户名和密码' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username.trim(), password);

  if (user) {
    const token = generateToken();
    validTokens.set(token, { type: 'user', id: user.id, username: user.username });
    res.json({
      success: true,
      message: '登录成功',
      data: { token, username: user.username, id: user.id }
    });
  } else {
    res.status(401).json({ success: false, error: '用户名或密码错误' });
  }
});

// === 19. 用户退出登录 ===
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;
    validTokens.delete(token);
  }
  res.json({ success: true, message: '已退出登录' });
});

// === 20. 检查用户登录状态 ===
app.get('/api/auth/check', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.json({ success: true, data: { loggedIn: false } });
  }
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;
  const tokenInfo = validTokens.get(token);
  if (!tokenInfo || tokenInfo.type !== 'user') {
    return res.json({ success: true, data: { loggedIn: false } });
  }
  res.json({
    success: true,
    data: { loggedIn: true, username: tokenInfo.username, id: tokenInfo.id }
  });
});

// -------------------------------------------------------
// 管理员管理用户 API
// -------------------------------------------------------

// === 21. 获取全部注册用户 ===
app.get('/api/admin/users', authMiddleware, (req, res) => {
  const users = db.prepare(
    'SELECT id, username, email, created_at FROM users ORDER BY created_at DESC'
  ).all();
  res.json({ success: true, data: users, total: users.length });
});

// === 22. 删除注册用户 ===
app.delete('/api/admin/users/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);

  if (result.changes === 0) {
    return res.status(404).json({ success: false, error: '用户不存在' });
  }

  res.json({ success: true, message: '用户已删除' });
});

// -------------------------------------------------------
// 管理员管理管理员 API
// -------------------------------------------------------

// === 23. 获取全部管理员 ===
app.get('/api/admin/admins', authMiddleware, (req, res) => {
  const admins = db.prepare(
    'SELECT id, username, created_at, updated_at FROM admins ORDER BY created_at ASC'
  ).all();
  res.json({ success: true, data: admins, total: admins.length });
});

// === 24. 添加新管理员 ===
app.post('/api/admin/admins', authMiddleware, (req, res) => {
  const { username, password } = req.body;

  if (!username || !username.trim()) {
    return res.status(400).json({ success: false, error: '请输入管理员用户名' });
  }
  if (username.trim().length < 3) {
    return res.status(400).json({ success: false, error: '用户名至少 3 个字符' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, error: '密码至少 6 个字符' });
  }

  // 检查用户名是否已存在
  const existingAdmin = db.prepare('SELECT id FROM admins WHERE username = ?').get(username.trim());
  if (existingAdmin) {
    return res.status(400).json({ success: false, error: '该管理员用户名已存在' });
  }
  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim());
  if (existingUser) {
    return res.status(400).json({ success: false, error: '该用户名已被注册用户使用' });
  }

  const result = db.prepare(
    'INSERT INTO admins (username, password) VALUES (?, ?)'
  ).run(username.trim(), password);

  res.json({
    success: true,
    message: '管理员添加成功',
    data: { id: result.lastInsertRowid, username: username.trim() }
  });
});

// === 25. 删除管理员 ===
app.delete('/api/admin/admins/:id', authMiddleware, (req, res) => {
  const { id } = req.params;

  // 不能删除自己
  if (parseInt(id) === req.admin.id) {
    return res.status(400).json({ success: false, error: '不能删除当前登录的管理员账号' });
  }

  // 至少保留一个管理员
  const adminCount = db.prepare('SELECT COUNT(*) AS count FROM admins').get();
  if (adminCount.count <= 1) {
    return res.status(400).json({ success: false, error: '至少需要保留一个管理员账号' });
  }

  const result = db.prepare('DELETE FROM admins WHERE id = ?').run(id);

  if (result.changes === 0) {
    return res.status(404).json({ success: false, error: '管理员不存在' });
  }

  res.json({ success: true, message: '管理员已删除' });
});

// -------------------------------------------------------
// 前端路由兜底：所有非 API 请求返回首页
// -------------------------------------------------------
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// -------------------------------------------------------
// 启动服务器
// -------------------------------------------------------
app.listen(PORT, () => {
  console.log('========================================');
  console.log('  数码资讯测试网站已启动');
  console.log('========================================');
  console.log(`  前台地址:  http://localhost:${PORT}`);
  console.log(`  后台地址:  http://localhost:${PORT}/admin.html`);
  console.log(`  管理账号:  admin`);
  console.log(`  管理密码:  123456`);
  console.log('========================================');
  console.log('  按 Ctrl+C 停止服务器');
  console.log('========================================');
});
