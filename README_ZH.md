# Fire Wave Agent

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Waterkyuu/agent-dashboard&env=ZHIPU_API_KEY,E2B_API_KEY,PUBLIC_NEON_AUTH_URL,NEON_DATA_PUBLIC_API_URL,CLOUDFLARE_ACCOUNT_ID,R2_ACCESS_KEY_ID,R2_SECRET_ACCESS_KEY&envDescription=Fire%20Wave%20Agent%20所需的%20API%20密钥和服务凭证&project-name=fire-wave-agent&repository-name=agent-dashboard)

一个自主控制电脑的 AI Agent Web 应用 — 类似于 OpenAI Operator。基于智谱 AI 模型和 E2B 沙盒，提供实时 Ubuntu 桌面环境，支持浏览器自动化、网页搜索、Shell 命令执行和 Python 代码解释。

![Fire Wave Agent](screenshots/image.png)

## 功能特性

- **桌面沙盒** — 创建运行 Ubuntu 的 E2B 桌面沙盒，带浏览器，通过 VNC 实时推流
- **浏览器自动化** — Agent 可自主导航网页、通过 Google 搜索、与网页交互
- **代码解释器** — 在隔离的 Jupyter Notebook 沙盒中执行 Python 代码，变量持久化
- **实时 VNC 查看器** — 在可调整大小的面板中实时观看 Agent 操作浏览器/桌面
- **对话界面** — 完整的对话功能，包含推理过程展示、工具调用状态指示和多步 Agent 执行
- **文件上传** — 支持分块上传 PDF、DOCX、MD、TXT 等文件，带进度追踪
- **用户认证** — 支持邮箱 OTP 验证码登录，以及 Google、GitHub、Vercel OAuth 登录
- **会话管理** — 侧边栏按日期分组聊天记录，支持搜索（Ctrl+K）、重命名和删除
- **响应式设计** — 桌面端分栏布局，移动端底部弹出面板

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router, Turbopack) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS v4, Shadcn UI |
| 状态管理 | Jotai, TanStack React Query |
| AI | Vercel AI SDK, 智谱 AI (GLM-4-flash) |
| 沙盒 | E2B Desktop, E2B Code Interpreter |
| 认证 | Neon Auth (OTP + OAuth) |
| 存储 | Cloudflare R2 |
| 测试 | Jest, Playwright |
| 代码检查 | Biome |

## 快速开始

### 环境要求

- Node.js 20+
- pnpm 9+

### 安装

```bash
git clone https://github.com/Waterkyuu/agent-dashboard.git
cd agent-dashboard
pnpm install
```

### 环境变量

在根目录创建 `.env.local` 文件：

```env
# 智谱 AI（必填）
ZHIPU_API_KEY=your_zhipu_api_key

# E2B 沙盒（必填）
E2B_API_KEY=your_e2b_api_key

# 模型（可选，默认 glm-4-flash）
GLM_MODLE=glm-4-flash

# Neon Auth（认证功能必填）
NEON_AUTH_BASE_URL=your_neon_auth_url
NEON_AUTH_COOKIE_SECRET=your_cookie_secret

# Cloudflare R2（文件上传功能必填）
CLOUDFLARE_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
```

### 开发

```bash
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建

```bash
pnpm build
pnpm start
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器（Turbopack） |
| `pnpm build` | 生产环境构建 |
| `pnpm start` | 启动生产服务器 |
| `pnpm check:write` | 代码检查与格式化 |
| `pnpm test` | 运行单元测试 |
| `pnpm test:e2e` | 运行端到端测试 |

## 架构

```
用户输入 --> 首页 (/) --> /chat/[id]
                            |
             +--------------+---------------+
             |                              |
        对话面板 (30%)                 VNC 面板 (70%)
        - 消息区域                      - E2B VNC 实时流
        - 输入框                        - 实时状态标识
        - 调试面板
             |
        POST /api/chat
        - 智谱 AI (GLM-4-flash)
        - 5 个工具:
          * createSandbox（创建沙盒）
          * codeInterpreter（代码解释器）
          * executeShell（执行命令）
          * navigateBrowser（浏览器导航）
          * searchWeb（网页搜索）
```

## 许可证

Private
