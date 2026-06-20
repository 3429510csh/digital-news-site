/**
 * db.js — 数据库初始化模块
 * 使用 better-sqlite3 创建 SQLite 文件型数据库
 * 自动建表 + 写入演示数据
 */

const Database = require('better-sqlite3');
const path = require('path');

// 数据库文件路径（Railway 部署时使用持久化卷路径，本地默认项目根目录）
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.db');

// 创建 / 打开数据库
const db = new Database(DB_PATH);

// 开启 WAL 模式，提升并发读性能
db.pragma('journal_mode = WAL');

// -------------------------------------------------------
// 建表：articles（资讯文章表）
// -------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS articles (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    summary     TEXT    NOT NULL,
    content     TEXT    NOT NULL,
    category    TEXT    NOT NULL DEFAULT '资讯',
    cover_image TEXT    NOT NULL DEFAULT '',
    author      TEXT    NOT NULL DEFAULT '编辑部',
    views       INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
  );
`);

// -------------------------------------------------------
// 建表：feedback（用户留言表）
// -------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS feedback (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    email      TEXT    NOT NULL DEFAULT '',
    message    TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
  );
`);

// -------------------------------------------------------
// 建表：admins（管理员账号表）
// -------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE,
    password      TEXT    NOT NULL,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at    TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
  );
`);

// -------------------------------------------------------
// 建表：users（前台注册用户表）
// -------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT    NOT NULL UNIQUE,
    email      TEXT    NOT NULL DEFAULT '',
    password   TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
  );
`);

// 写入默认管理员账号（仅在表为空时）
const adminCount = db.prepare('SELECT COUNT(*) AS count FROM admins').get();
if (adminCount.count === 0) {
  db.prepare('INSERT INTO admins (username, password) VALUES (?, ?)').run('admin', '123456');
  console.log('[db.js] 已创建默认管理员账号: admin / 123456');
}

// -------------------------------------------------------
// 写入演示数据（仅在表为空时插入）
// -------------------------------------------------------
const articleCount = db.prepare('SELECT COUNT(*) AS count FROM articles').get();
if (articleCount.count === 0) {
  const insert = db.prepare(`
    INSERT INTO articles (title, summary, content, category, cover_image, author, views, created_at)
    VALUES (@title, @summary, @content, @category, @cover_image, @author, @views, @created_at)
  `);

  const articles = [
    {
      title: 'iPhone 16 Pro Max 深度评测：钛金属机身与 A18 Pro 的全面进化',
      summary: '苹果新一代旗舰究竟带来了哪些实质提升？从相机系统到芯片性能，我们用两周时间给出了答案。',
      content: `## 外观设计

iPhone 16 Pro Max 延续了钛金属边框设计，但在这基础上做了多处细节优化。机身重量为 227g，比上一代轻了 2g，握持手感有明显改善。

**主要变化：**
- 屏幕增大至 6.9 英寸，边框进一步缩窄
- 新增「相机控制」按键，支持轻按、重按、滑动三种操作
- 钛金属配色新增「沙漠色」

## 影像系统

这代最大的升级在于影像。4800 万像素主摄搭配第二代传感器位移防抖，弱光场景表现大幅提升。

> 超广角镜头也升级到 4800 万像素，支持微距摄影，细节保留令人惊艳。

## A18 Pro 芯片

A18 Pro 采用第二代 3nm 工艺，CPU 性能提升 15%，GPU 性能提升 20%。实际游戏测试中，《原神》须弥城跑图可稳定 59.8 帧。

## 续航表现

4685mAh 电池配合 A18 Pro 的能效优化，日常使用可坚持 14 小时左右，相比上代提升约 1.5 小时。

## 总结

iPhone 16 Pro Max 是一次扎实迭代。如果你追求极致影像和续航体验，它不会让你失望。`,
      category: '手机评测',
      cover_image: 'https://picsum.photos/seed/iphone16/800/450',
      author: '数码达人',
      views: 1280,
      created_at: '2025-06-15 09:30:00'
    },
    {
      title: 'RTX 5090 显卡性能前瞻：Blackwell 架构带来质的飞跃',
      summary: 'NVIDIA 下一代旗舰显卡首批跑分泄露，光追性能翻倍，AI 算力达 105 TOPS。',
      content: `## Blackwell 架构解析

RTX 5090 搭载 GB202 核心，CUDA 核心数达到 21760 个，比 RTX 4090 多出 33%。采用 GDDR7 显存，带宽高达 1.8 TB/s。

## 性能跑分

根据泄露的 3DMark 数据：

| 项目 | RTX 4090 | RTX 5090 | 提升 |
|------|----------|----------|------|
| Port Royal | 26000 | 42000 | +61% |
| Speed Way | 14000 | 24000 | +71% |
| Fire Strike Ultra | 38000 | 55000 | +45% |

## 光线追踪

新一代光追核心使光线追踪性能翻倍，在《赛博朋克 2077》路径追踪模式下，4K 分辨率可达 80 FPS。

## 功耗与散热

TGP 设定为 575W，比上代高出 75W。公版采用均热板 + 双风扇设计，满载温度控制在 72°C 以内。

## 购买建议

预计首发售价 12999 元起。如果你是 4K 游戏玩家或 AI 研究者，这款显卡值得等待。`,
      category: '硬件资讯',
      cover_image: 'https://picsum.photos/seed/rtx5090/800/450',
      author: '硬件极客',
      views: 2560,
      created_at: '2025-06-14 14:20:00'
    },
    {
      title: 'M4 MacBook Pro 体验：AI 时代的全能工作站',
      summary: 'M4 Max 芯片加持，统一内存最高 128GB，这款 MacBook Pro 能否替代桌面工作站？',
      content: `## 设计变化

新款 MacBook Pro 依然保持铝金属一体机身，但有几个重要更新：
- 屏幕亮度提升至 1000 尼特持续亮度（户外可用）
- 新增纳米纹理玻璃选项，有效减少眩光
- 接口增加至 3 个 Thunderbolt 5 端口

## M4 Max 芯片

M4 Max 采用 16 核 CPU + 40 核 GPU 设计，支持最高 128GB 统一内存。

**跑分对比：**
- Cinebench R23 多核：28500 分（M3 Max 为 21000 分）
- Geekbench 6 GPU：65000 分
- 本地运行 Llama 3 70B 模型，推理速度 35 tokens/s

## 续航测试

100% 亮度下连续播放 4K 视频可达 18 小时，日常办公混合使用可达 22 小时。

## 散热表现

 redesigned 散热系统使满载噪音降低 3dB，长时间渲染视频时机身表面温度不超过 42°C。

## 总结

M4 MacBook Pro 是目前最强大的便携式 Mac，特别适合视频创作者和 AI 开发者。128GB 统一内存让它能胜任大型模型推理任务。`,
      category: '电脑评测',
      cover_image: 'https://picsum.photos/seed/macbookm4/800/450',
      author: '苹果观察',
      views: 1890,
      created_at: '2025-06-13 10:15:00'
    },
    {
      title: 'Android 15 新特性详解：隐私、AI 与桌面模式的全面升级',
      summary: 'Google 最新移动操作系统带来桌面窗口模式、AI 写作助手和更精细的隐私控制。',
      content: `## 桌面窗口模式

Android 15 正式引入桌面窗口模式，支持自由调整窗口大小、拖拽排列，配合外接显示器可实现类桌面体验。

## AI 功能

系统级 AI 写作助手可在任意文本输入框中使用：
- 智能改写语气
- 自动生成摘要
- 实时翻译（离线可用）

## 隐私空间

新增「隐私空间」功能，可将敏感应用隔离到独立加密区域，需要额外生物认证才能访问。

## 其他改进
- 通知冷却功能，避免频繁打扰
- 卫星短信支持扩展到更多运营商
- 电池健康度显示
- 低光相机模式大幅提升夜景效果

## 兼容设备

首批支持 Pixel 6 及以上机型，三星、小米等品牌预计在 Q3 推送更新。`,
      category: '软件资讯',
      cover_image: 'https://picsum.photos/seed/android15/800/450',
      author: '移动前沿',
      views: 980,
      created_at: '2025-06-12 16:45:00'
    },
    {
      title: '如何搭建个人 NAS 家庭影院：从硬件选购到软件配置全攻略',
      summary: '用一台 NAS 打造私人影音库，支持 4K 转码、自动刮削、远程访问，保姆级教程。',
      content: `## 第一步：硬件选购

推荐配置：
- **NAS 主机**：群晖 DS224+ 或威联通 TS-464C
- **硬盘**：西部数据红盘 Plus 4TB x 2（组 RAID 1）
- **网络**：千兆交换机 + Wi-Fi 6 路由器

预算约 5000-7000 元。

## 第二步：系统初始化

1. 安装硬盘，开机
2. 访问 find.synology.com 完成初始化
3. 创建存储池（选择 SHR 或 RAID 1）
4. 创建共享文件夹：Movies、TVShows、Music

## 第三步：安装影视套件

### Video Station
群晖自带影音管理工具，支持：
- 自动刮削影片信息（封面、简介、演员表）
- 在线播放与转码
- 字幕自动下载

### Jellyfin（推荐替代方案）
开源免费的媒体服务器：
\`\`\`bash
# Docker 方式部署
docker run -d --name jellyfin \
  -v /volume1/docker/jellyfin/config:/config \
  -v /volume1/Movies:/media \
  -p 8096:8096 \
  jellyfin/jellyfin:latest
\`\`\`

## 第四步：远程访问

使用群晖自带 DDNS 或 Cloudflare Tunnel 实现外网访问，无需公网 IP。

## 第五步：手机端

安装 Infuse（iOS）或 MX Player（Android），连接 NAS 即可在手机上观看 4K 影片。

## 总结

搭建 NAS 家庭影院并不复杂，核心是选对硬件和软件。Jellyfin + NAS 的组合是性价比最高的方案。`,
      category: '工具教程',
      cover_image: 'https://picsum.photos/seed/nas/800/450',
      author: '教程君',
      views: 3200,
      created_at: '2025-06-11 08:00:00'
    },
    {
      title: 'Windows 11 优化全攻略：让老电脑也能丝滑运行',
      summary: '10 个实用技巧，从关闭冗余服务到精简系统，大幅提升 Windows 11 运行速度。',
      content: `## 1. 关闭不必要的启动项

按 Ctrl+Shift+Esc 打开任务管理器 → 启动应用 → 禁用不需要的程序。

## 2. 卸载预装冗余软件

使用 O&O AppBuster 一键卸载 Windows 11 预装的 UWP 应用。

## 3. 关闭视觉特效

设置 → 系统 → 关于 → 高级系统设置 → 性能设置 → 选择「调整为最佳性能」。

## 4. 禁用 SysMain（原 Superfetch）

对于 SSD 用户，SysMain 反而可能导致卡顿：
\`\`\`cmd
sc stop "SysMain"
sc config "SysMain" start= disabled
\`\`\`

## 5. 清理系统垃圾

使用 Windows 自带的磁盘清理工具，或使用开源工具 BleachBit。

## 6. 优化电源计划

\`\`\`cmd
powercfg -duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61
\`\`\`
启用「卓越性能」模式。

## 7. 关闭后台应用

设置 → 应用 → 已安装的应用 → 找到应用 → 高级选项 → 关闭后台应用。

## 8. 禁用 Windows 搜索索引

对于 SSD 用户，搜索索引意义不大且占用资源：
\`\`\`cmd
sc stop "WSearch"
sc config "WSearch" start= disabled
\`\`\`

## 9. 使用轻量级浏览器

推荐 Edge 或 Firefox，相比 Chrome 内存占用更少。

## 10. 定期重启

每周至少重启一次，释放系统资源。`,
      category: '工具教程',
      cover_image: 'https://picsum.photos/seed/win11/800/450',
      author: '教程君',
      views: 4100,
      created_at: '2025-06-10 11:30:00'
    },
    {
      title: 'Python 自动化办公入门：用代码替代重复劳动',
      summary: '从 Excel 处理到 PDF 转换，6 个实战案例带你入门 Python 自动化。',
      content: `## 环境准备

安装 Python 3.12+，然后安装必要的库：
\`\`\`bash
pip install openpyxl python-docx PyPDF2 pillow
\`\`\`

## 案例 1：批量处理 Excel

\`\`\`python
import openpyxl

# 读取 Excel 并计算总和
wb = openpyxl.load_workbook('data.xlsx')
ws = wb.active
for row in ws.iter_rows(min_row=2):
    total = sum(cell.value for cell in row[1:4] if cell.value)
    row[4].value = total
wb.save('result.xlsx')
\`\`\`

## 案例 2：批量生成 Word 文档

\`\`\`python
from docx import Document

doc = Document()
for i in range(1, 11):
    doc.add_heading(f'第 {i} 章', level=1)
    doc.add_paragraph('这是自动生成的内容。')
doc.save('report.docx')
\`\`\`

## 案例 3：合并 PDF 文件

\`\`\`python
from PyPDF2 import PdfMerger

merger = PdfMerger()
for pdf in ['a.pdf', 'b.pdf', 'c.pdf']:
    merger.append(pdf)
merger.write('merged.pdf')
merger.close()
\`\`\`

## 案例 4：批量重命名文件

\`\`\`python
import os
for i, f in enumerate(os.listdir('.')):
    if f.endswith('.jpg'):
        os.rename(f, f'photo_{i:03d}.jpg')
\`\`\`

## 案例 5：自动发送邮件

\`\`\`python
import smtplib
from email.mime.text import MIMEText

msg = MIMEText('自动发送的邮件内容')
msg['Subject'] = '自动化通知'
msg['From'] = 'you@example.com'
msg['To'] = 'target@example.com'
smtp = smtplib.SMTP_SSL('smtp.example.com', 465)
smtp.login('you@example.com', 'password')
smtp.send_message(msg)
\`\`\`

## 案例 6：截图与图片处理

\`\`\`python
from PIL import Image
img = Image.open('photo.jpg')
img.thumbnail((800, 800))  # 等比缩放
img.save('thumb.jpg', quality=85)
\`\`\`

## 总结

Python 自动化的核心思路是：找到重复操作 → 编写脚本 → 定时运行。从简单任务开始，逐步构建自己的自动化工具库。`,
      category: '工具教程',
      cover_image: 'https://picsum.photos/seed/python/800/450',
      author: '编程手记',
      views: 5200,
      created_at: '2025-06-09 13:00:00'
    },
    {
      title: '2025 智能手表横评：Apple Watch Ultra 2 vs Galaxy Watch Ultra',
      summary: '两款旗舰智能手表正面交锋，从运动追踪到续航能力全方位对比。',
      content: `## 外观对比

**Apple Watch Ultra 2**
- 钛金属表壳，49mm 表盘
- 蓝宝石玻璃，100m 防水
- 重量 61.4g

**Galaxy Watch Ultra**
- 钛金属表壳，47mm 表盘
- 蓝宝石玻璃，10m 防水 + IP68
- 重量 60.5g

## 运动追踪

两款手表都支持 100+ 运动模式。Apple Watch 在 GPS 精度上略胜一筹，Galaxy Watch 的体成分分析功能更丰富。

## 续航

- Apple Watch Ultra 2：正常使用 36 小时，低功耗模式 72 小时
- Galaxy Watch Ultra：正常使用 48 小时，省电模式 100 小时

## 生态

- Apple Watch 仅兼容 iPhone
- Galaxy Watch 兼容 Android 手机（部分功能限三星）

## 价格

- Apple Watch Ultra 2：6299 元起
- Galaxy Watch Ultra：4799 元起

## 结论

如果你是 iPhone 用户且追求运动追踪精度，选 Apple Watch。如果你用 Android 且看重续航，Galaxy Watch 是更好选择。`,
      category: '穿戴设备',
      cover_image: 'https://picsum.photos/seed/watch/800/450',
      author: '穿戴评测',
      views: 750,
      created_at: '2025-06-08 15:30:00'
    }
  ];

  const tx = db.transaction(() => {
    for (const a of articles) {
      insert.run(a);
    }
  });
  tx();
  console.log(`[db.js] 已插入 ${articles.length} 篇演示文章`);
}

// 导出数据库实例
module.exports = db;
