<p align="center">
  <img src="./public/logo.svg" width="96" height="96" alt="StickerCraft logo" />
</p>

<h1 align="center">StickerCraft AI</h1>

<p align="center">
  一个自带 API Key 的多语言贴纸素材工作流，用来把提示词变成可用的 PNG 贴纸概念图。
</p>

<p align="center">
  <a href="./README.md">English</a>
  ·
  <a href="#快速开始">快速开始</a>
  ·
  <a href="#api-配置">API 配置</a>
  ·
  <a href="#贴纸素材工作流">贴纸素材工作流</a>
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" />
  <img alt="Gemini" src="https://img.shields.io/badge/Gemini-Nano%20Banana-FF6B00" />
  <img alt="OpenAI" src="https://img.shields.io/badge/OpenAI-GPT%20Image-111827" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
</p>

<p align="center">
  <a href="https://world.guantou.site/">
    <img src="https://world.guantou.site/badge.svg?theme=dark&accent=red&lang=zh&size=sm" alt="GuanTou Lab" />
  </a>
</p>

<p align="center">
  <img src="./docs/images/showcase.png" alt="StickerCraft AI 界面截图" />
</p>

## 项目介绍

StickerCraft AI 是一个基于 React + Vite 的贴纸生成工具，最初由 Google AI Studio 原型开发而来。它可以把自然语言提示词转换成多种风格的贴纸素材，并支持参考图、批量提示词、贴纸白边、透明背景处理、文字贴纸、三视图设定图、自定义风格、图库管理和 ZIP 下载。

项目完全在浏览器中运行，支持在页面内配置 API provider、API key、endpoint、图片模型和文本模型。它可以使用 Gemini/Nano Banana 模型、GPT 图片模型，也可以接入符合对应 API 格式的中转站。

## 功能特性

- 文本生成贴纸：一行一个提示词，可批量生成。
- 多风格预设：经典卡通、Q 版、3D、像素、水彩、动漫、涂鸦等。
- 自定义风格：可手写风格描述，也可上传参考图让模型分析视觉风格。
- 参考图生成：上传图片作为生成参考。
- 贴纸控制：比例、数量、白边、面部表情、三视图、文字与背景色。
- 透明 PNG 工作流：关闭背景时，先生成受控纯色背景，再从画布边缘移除连通背景。
- 图库素材状态标签：显示透明 PNG、保留背景、白边、文字、参考图、上传素材等状态。
- 运行时 API 配置：支持 Gemini 或 GPT/OpenAI-compatible 图片与文本模型。
- 模型名称可自定义，适合中转站模型名不同的场景。
- 浏览器存储：API 配置保存在 localStorage；生成图库素材保存在浏览器本地存储中。
- 多语言界面：English、中文、Español、Français、Deutsch、日本語、한국어、Português。

## 贴纸素材工作流

StickerCraft 针对图片生成之后的真实使用步骤设计：

1. 每行输入一个提示词，批量生成。
2. 选择风格预设，或用文字/参考图创建自定义风格。
3. 选择输出透明贴纸素材，或保留可见背景。
4. 生成居中的贴纸风格 PNG。
5. 在图库里检查素材状态。
6. 下载单张 PNG，或选择多张后打包 ZIP 下载。

### 真透明 PNG vs 假棋盘格

很多图片模型会画出看起来像透明背景的棋盘格，但那只是像素图案，不是真正的 alpha 通道。StickerCraft 不会宣称模型本身永远能返回完美透明背景。默认透明工作流会要求模型生成在纯色背景上，然后移除从画布边缘连通进去的背景。

这个方法适合轮廓清晰的贴纸/图标素材。复杂发光、头发、烟雾、玻璃、半透明阴影或很小的内部孔洞，仍然建议在打印或商用前人工检查，必要时再用专业 alpha matting 工具修边。

### 打印和切割说明

StickerCraft 生成的是 PNG 贴纸素材。它不是打印履约服务、矢量切线编辑器，也不会做版权/IP 审核。

如果要放进 Cricut、Procreate、Canva、Redbubble、Printful 或其他下游工具，可以把 StickerCraft 当成“概念图 + PNG 素材”这一步。后续仍可能需要 flatten 图层、添加 offset、检查切割边界、转成矢量路径，或按厂商要求准备 DPI/CMYK 文件。

## API 配置

打开应用后，点击右上角的 `API 配置` 入口，选择并配置当前 provider。

| 配置项 | 说明 | Gemini 默认值 | GPT 默认值 |
| --- | --- | --- | --- |
| API provider | 当前使用的图片/文本服务 | Gemini | GPT / OpenAI |
| API Key | Provider API Key 或中转站提供的 Key | 从 Google AI Studio 获取 | 从 OpenAI 或兼容服务获取 |
| Endpoint | API 基础端点 | `https://generativelanguage.googleapis.com/` | `https://api.openai.com/v1/` |
| 图片生成模型 | 用于生成贴纸图片 | `gemini-3.1-flash-image-preview` | `gpt-image-2` |
| 文本模型 | 用于风格分析和提示词生成 | `gemini-3-pro-preview` | `gpt-5.4-mini` |

推荐图片模型：

- Nano Banana 2：`gemini-3.1-flash-image-preview`
- Nano Banana Pro：`gemini-3-pro-image-preview`
- Nano Banana：`gemini-2.5-flash-image`
- GPT Image 2：`gpt-image-2`
- 自定义模型名称：适合模型名被中转站改写的情况

对于 Gemini Endpoint，如果已经带有版本号，例如 `https://example.com/v1beta`，项目会自动识别版本；如果只填写基础域名，则默认使用 `v1beta`。

> 安全提示：这个项目是纯前端应用，API Key 会保存在浏览器 localStorage，并由浏览器直接请求对应 API。适合个人本地使用。若要公开部署，建议增加后端代理、鉴权、额度控制和防滥用策略。

## 快速开始

### 环境要求

- Node.js 18+
- npm
- Gemini API Key、OpenAI API Key，或兼容中转站 Key

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

默认开发地址：

```text
http://localhost:3000
```

首次打开页面后，进入右上角 `API 配置` 弹窗填写 provider、API Key、Endpoint、图片模型和文本模型。保存后即可生成贴纸。

### 可选：使用环境变量作为默认 Key

你可以创建 `.env.local`，让本地开发时自动填入默认 API Key：

```bash
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

页面配置优先使用 localStorage。即使设置了 `.env.local`，用户仍然可以在页面弹窗里覆盖 provider、API Key、Endpoint、图片模型和文本模型。

## 构建

```bash
npm run build
```

构建产物输出到 `dist/`。

本地预览构建结果：

```bash
npm run preview
```

## 项目结构

```text
.
├── App.tsx                         # 应用主布局、图库状态、生成流程
├── components/
│   ├── ControlPanel.tsx            # 提示词、风格、模型和生成配置
│   ├── GeneratedGrid.tsx           # 图库、素材状态、选择、上传、ZIP 下载
│   ├── Header.tsx                  # Logo、语言菜单、API 配置弹窗
│   └── StickerCard.tsx             # 单张贴纸卡片和素材标签
├── contexts/
│   └── LanguageContext.tsx         # 多语言状态
├── docs/
│   └── images/                     # README 展示图
├── public/
│   └── logo.svg                    # 应用 Logo 和 favicon
├── services/
│   ├── apiConfig.ts                # API provider 配置、Endpoint 解析、模型建议
│   ├── geminiService.ts            # 图片生成、风格分析、提示词生成
│   └── storageService.ts           # 图库和自定义风格的浏览器存储
├── constants.ts                    # 预设、翻译、比例、字体、颜色
├── types.ts                        # 共享类型
├── index.html                      # Vite HTML 入口
└── index.tsx                       # React 挂载入口
```

## 使用建议

- 使用 Gemini 生成普通贴纸时，优先使用 Nano Banana 2：`gemini-3.1-flash-image-preview`。
- 需要专业资产、复杂指令、文字渲染或 4K 尺寸时，可以使用 Nano Banana Pro，或支持所需尺寸的 GPT Image 模型。
- 需要更低延迟的 Gemini 生成时，可以使用 Nano Banana：`gemini-2.5-flash-image`。
- 风格分析和提示词生成需要为当前 provider 配置文本模型。
- 使用中转站时，确保 Endpoint 兼容当前 provider 预期的请求/响应格式。
- 如果生成按钮不可用，检查提示词是否为空，以及模型名称是否已填写。

## 常见问题

### StickerCraft 可以生成真正透明的 PNG 吗？

StickerCraft 会导出 PNG 文件。默认情况下，关闭背景开关时会走透明背景工作流：先生成在受控纯色背景上，再从边缘移除连通背景。

这比单纯要求模型“透明背景”更可靠，但不保证每一张图都能得到完美 alpha。打印使用前仍建议检查复杂边缘。

### 为什么 AI 工具有时会出现假的棋盘格？

棋盘格可能只是图片像素的一部分，而不是真透明。如果模型把棋盘格画进图片里，这一块就没有真正的 alpha 通道。StickerCraft 默认流程会尽量避免依赖“让模型画透明背景”的提示词。

### 可以用于 Cricut 或 POD 打印吗？

可以作为源 PNG 素材使用，但仍需要检查下游工具要求。Cricut 可能需要 flatten 后的 print-then-cut 图片和干净的外轮廓 offset；打印厂商可能要求特定 DPI、出血、切线或颜色设置。

### 为什么配置了自定义 Endpoint 还是请求失败？

Endpoint 必须匹配当前 provider。Gemini 生成使用 Gemini-compatible `generateContent` 请求；GPT 生成使用 OpenAI-compatible image endpoints。只支持 OpenAI Chat Completions 的中转站不能直接用于 Gemini 图片生成。

### 自定义模型为什么没有 2K/4K 分辨率选项？

StickerCraft 会对官方模型或看起来支持图片尺寸的模型名开放分辨率控制。最终是否支持取决于实际 provider 和 endpoint。

### API Key 存在哪里？

保存在浏览器 localStorage 的 `stickerCraft_apiSettings` 中。旧版 Gemini-only 的 `stickerCraft_geminiSettings` 会自动迁移。清空浏览器站点数据或点击配置弹窗里的 reset 可清除已保存配置。

### 可以直接部署到公网吗？

可以，但不建议把个人 API Key 放在前端给公网用户使用。公开共享前建议增加后端代理、鉴权、额度控制、防滥用和日志记录。

### StickerCraft 不负责什么？

StickerCraft 不提供打印履约、商用版权审核、商标检查、保证可用的矢量切线、CMYK 转换，也不保证每一种复杂边缘都能完美抠图。

## 贡献

欢迎提交 issue 和 pull request。适合优先完善的方向包括：

- 更完整的多语言翻译和风格名本地化。
- 更多贴纸风格预设。
- 适合公开部署的后端代理。
- 生成配置的导入和导出。
- 更细的透明 PNG 边缘清理控制。
