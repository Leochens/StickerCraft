<p align="center">
  <img src="./public/logo.svg" width="96" height="96" alt="StickerCraft logo" />
</p>

<h1 align="center">StickerCraft AI</h1>

<p align="center">
  A multilingual Gemini-powered sticker generator for creating playful, production-ready sticker assets.
</p>

<p align="center">
  <a href="./README.zh-CN.md">简体中文</a>
  ·
  <a href="#quick-start">Quick Start</a>
  ·
  <a href="#gemini-configuration">Gemini Configuration</a>
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" />
  <img alt="Gemini" src="https://img.shields.io/badge/Gemini-Nano%20Banana-FF6B00" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
</p>

<p align="center">
  <a href="https://world.guantou.site/">
    <img src="https://world.guantou.site/badge.svg?theme=dark&accent=red&lang=en&size=sm" alt="GuanTou Lab" />
  </a>
</p>

<p align="center">
  <img src="./docs/images/showcase.png" alt="StickerCraft AI screenshot" />
</p>

## Overview

StickerCraft AI is a React + Vite sticker generation app originally prototyped in Google AI Studio. It turns text prompts into stylized sticker assets and supports reference images, custom styles, text overlays, transparent-background workflows, gallery management, and ZIP export.

The app runs entirely in the browser and lets users configure their Gemini API Key, Endpoint, image model, and text model at runtime. It works with the official Gemini API and with Gemini-compatible proxy services.

## Features

- Text-to-sticker generation, one prompt per line.
- Built-in style presets including cartoon, kawaii, 3D, pixel art, watercolor, anime, graffiti, and more.
- Custom style creation from a written description or a reference image.
- Reference image support for image-to-image sticker generation.
- Controls for aspect ratio, quantity, white sticker border, facial features, three-view sheets, text, and background color.
- Runtime Gemini settings for API Key, Endpoint, image model, and text model.
- Flexible custom model IDs for Gemini-compatible proxy services.
- Local gallery stored in browser localStorage, with preview, delete, remix, upload, selection, and ZIP export.
- Multilingual UI: English, 中文, Español, Français, Deutsch, 日本語, 한국어, Português.

## Gemini Configuration

Open the `Gemini Settings` button in the top-right corner and configure:

| Setting | Description | Recommended value |
| --- | --- | --- |
| API Key | Gemini API Key, or a key from a compatible proxy | From Google AI Studio |
| Endpoint | Gemini API base endpoint | `https://generativelanguage.googleapis.com/` |
| Image model | Model used for sticker image generation | `gemini-3.1-flash-image-preview` |
| Text model | Model used for style analysis and prompt generation | `gemini-3-pro-preview` |

Recommended image models:

- Nano Banana 2: `gemini-3.1-flash-image-preview`
- Nano Banana Pro: `gemini-3-pro-image-preview`
- Nano Banana: `gemini-2.5-flash-image`
- Custom model name: for proxy services that expose different model IDs

If the Endpoint already includes a version suffix such as `https://example.com/v1beta`, StickerCraft will use that version. Otherwise, it defaults to `v1beta`.

> Security note: this is a browser-only app. API Keys are stored in localStorage and requests are sent directly from the browser. This is fine for personal local use. For public deployments, add a backend proxy, authentication, quota limits, and abuse protection.

## Quick Start

### Requirements

- Node.js 18+
- npm
- Gemini API Key

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

Default local URL:

```text
http://localhost:3000
```

After opening the app, configure your Gemini API Key, Endpoint, image model, and text model from `Gemini Settings`.

### Optional Environment Default

You can create `.env.local` to prefill a local development API key:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

Runtime settings saved in the UI always take priority over `.env.local`.

## Build

```bash
npm run build
```

Build output is written to `dist/`.

Preview the production build locally:

```bash
npm run preview
```

## Project Structure

```text
.
├── App.tsx                         # Main app layout, gallery state, generation flow
├── components/
│   ├── ControlPanel.tsx            # Prompts, styles, model override, generation controls
│   ├── GeneratedGrid.tsx           # Gallery, selection, upload, ZIP download
│   ├── Header.tsx                  # Logo, language menu, Gemini settings modal
│   └── StickerCard.tsx             # Individual sticker card
├── contexts/
│   └── LanguageContext.tsx         # Multilingual UI state
├── docs/
│   └── images/                     # README screenshots
├── public/
│   └── logo.svg                    # App logo and favicon
├── services/
│   ├── geminiConfig.ts             # Gemini settings, endpoint parsing, model suggestions
│   └── geminiService.ts            # Image generation, style analysis, prompt generation
├── constants.ts                    # Presets, translations, ratios, fonts, colors
├── types.ts                        # Shared TypeScript types
├── index.html                      # Vite HTML entry
└── index.tsx                       # React mount entry
```

## Usage Notes

- For general sticker generation, prefer Nano Banana 2: `gemini-3.1-flash-image-preview`.
- For professional assets, complex instructions, text rendering, or 4K output, use Nano Banana Pro: `gemini-3-pro-image-preview`.
- For lower latency, use Nano Banana: `gemini-2.5-flash-image`.
- For prompt generation and style analysis, Gemini 3 Pro is supported: `gemini-3-pro-preview`.
- When using a proxy, make sure the Endpoint is compatible with Gemini API `generateContent`, not OpenAI Chat Completions.
- If generation is disabled, check that the prompt is not empty and that a custom model name has been provided.

## FAQ

### Why does my custom Endpoint fail?

StickerCraft uses the `@google/genai` SDK and calls `models.generateContent`. The Endpoint must be compatible with Gemini API request/response formats.

### Why is 2K/4K disabled for some custom models?

Official Nano Banana 2 and Nano Banana Pro models support higher-resolution image configuration. For custom model names, StickerCraft enables resolution controls for names that look like Pro image models, but actual support depends on the endpoint.

### Where is the API Key stored?

In browser localStorage under `stickerCraft_geminiSettings`. Clear site data or use the settings modal reset action to remove saved configuration.

### Can I deploy it publicly?

Yes, but do not expose a personal API Key in the frontend for public users. Add a backend proxy and usage controls before publishing it as a public service.

## Contributing

Issues and pull requests are welcome. Good first areas include:

- More localized copy and style labels.
- More sticker style presets.
- Backend proxy support for safer public deployments.
- Import/export for generation settings.
