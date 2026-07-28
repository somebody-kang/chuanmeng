# 红动漫社萌战

四川大学二次元萌战投票站点（B 站活动页风格）。  
技术栈：Next.js 16 · TypeScript · Tailwind 4 · Prisma · SQLite · SWR。

> **请在本目录（`demo/`）运行。** 不要使用仓库内 `萌战/` 旧目录。

---

## 文档

| 文档 | 说明 |
|------|------|
| [用户手册](./docs/用户手册.md) | 安装启动、网站功能、管理后台操作 |
| [设计说明书](./docs/设计说明书.md) | 架构、数据模型、复杂逻辑、API、待办与代码对照 |

---

## 快速开始

```bash
cp .env.example .env   # Windows: copy .env.example .env
npm install
npm run setup
npm run dev
```

浏览器打开 http://localhost:3000  

Windows 也可双击 `start.bat`。

本地默认 `ALLOW_DEV_LOGIN=true`：访问 `/login` 用昵称即可模拟登录。  
管理后台：访问 `/admin`，账号配置见 `.env.example` 中的 `ADMIN_*`。

---

## 功能摘要

- **决斗赛** 1v1 VS 票比 · **小组赛** n 选 m 网格投票
- 对阵 **进行中 / 未开始 / 已结束** 分栏 + 投票时段门禁
- **战报** `/report`：得票与胜者
- 角色详情：简介 / 图集 / 评论（敏感词）/ 得票
- 管理：对阵组、角色立绘图集、评论审核
- 微信 OAuth 代码已预留（需公网 HTTPS；本地用开发登录）

种子数据含 A–D 决斗组与 **G 组 8 选 3 小组赛**，详见用户手册。

---

## 页面

| 路径 | 说明 |
|------|------|
| `/` | 对阵投票 |
| `/report` | 战报 |
| `/characters` | 角色 |
| `/me` | 我的 |
| `/login` | 登录 |
| `/admin` | 管理（仅 admin） |
| `/about` | 赛制 |

---

## 微信正式登录（上线）

代码已支持：`/api/auth/wechat` → callback → Session。  
限制：**授权域名不能是 localhost**，需认证服务号或接口测试号 + 公网 HTTPS。

```env
WECHAT_APP_ID=...
WECHAT_APP_SECRET=...
WECHAT_REDIRECT_URI=https://你的域名/api/auth/wechat/callback
AUTH_SECRET=随机长字符串
REQUIRE_WECHAT_LOGIN=true
ALLOW_DEV_LOGIN=false
```

配置细节与排错见 [用户手册 §7](./docs/用户手册.md) 与 [设计说明书 §4.5 / §8](./docs/设计说明书.md)。

---

## 旧版归档

- `../萌战/_python_legacy/` — Python FastAPI
- `../萌战/_legacy/` — 静态 HTML
