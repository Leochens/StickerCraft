<p align="center">
  <img src="./public/logo.svg" width="96" height="96" alt="StickerCraft logo" />
</p>

<h1 align="center">StickerCraft AI</h1>

<p align="center">
  A multilingual, bring-your-own-key sticker asset workflow for turning prompts into usable PNG sticker concepts.
</p>

<p align="center">
  <a href="./README.zh-CN.md">简体中文</a>
  ·
  <a href="#quick-start">Quick Start</a>
  ·
  <a href="#api-configuration">API Configuration</a>
  ·
  <a href="#sticker-asset-workflow">Sticker Asset Workflow</a>
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
    <img src="https://world.guantou.site/badge.svg?theme=dark&accent=red&lang=en&size=sm" alt="GuanTou Lab" />
  </a>
</p>

<p align="center">
  <img src="./docs/images/showcase.png" alt="StickerCraft AI screenshot" />
</p>

## Overview

StickerCraft AI is a React + Vite sticker generation app originally prototyped in Google AI Studio. It turns text prompts into stylized sticker assets and supports reference images, custom styles, text overlays, controlled-background generation, transparent PNG cleanup, gallery management, and ZIP export.

The app runs entirely in the browser and lets users configure their API provider, API key, endpoint, image model, and text model at runtime. It supports Gemini/Nano Banana models, GPT image models, and compatible proxy services that expose the expected API formats.

## Features

- Text-to-sticker generation, one prompt per line.
- Built-in style presets including cartoon, kawaii, 3D, pixel art, watercolor, anime, graffiti, and more.
- Custom style creation from a written description or a reference image.
- Reference image support for image-to-image sticker generation.
- Controls for aspect ratio, quantity, white sticker border, facial features, three-view sheets, text, and background color.
- Transparent PNG workflow: when background is disabled, StickerCraft generates on a controlled solid background and then removes the connected background from the canvas edges.
- Bead pattern sheets: convert generated or uploaded stickers into coded bead grids with approximate brand palettes and material lists.
- Asset readiness labels in the gallery and preview modal, including transparent PNG, background kept, white border, text, reference image, and uploaded asset states.
- Runtime API settings for Gemini or GPT/OpenAI-compatible image and text models.
- Flexible custom model IDs for compatible proxy services.
- Browser storage: API settings stay in localStorage; generated gallery assets are persisted in browser storage.
- Multilingual UI: English, 中文, Español, Français, Deutsch, 日本語, 한국어, Português.

## Sticker Asset Workflow

StickerCraft is designed around the practical steps people usually need after image generation:

1. Write one prompt per line for a batch.
2. Pick a style preset or create a custom style from text/reference imagery.
3. Choose whether the output should be a transparent sticker asset or keep a visible background.
4. Generate centered sticker-style PNGs.
5. Review asset status in the gallery.
6. Convert a sticker into a bead pattern sheet, then export the PNG pattern or CSV material list.
7. Download individual PNGs or selected batches as a ZIP.

### Real Transparent PNG vs Fake Checkerboard

Many image models can draw a checkerboard pattern that looks transparent but is actually baked into the pixels. StickerCraft avoids claiming that the model itself always returns a perfect alpha channel. Instead, the default transparent workflow asks for a solid generation background and then removes the background connected to the canvas edges.

This works best for clean sticker/icon assets. Complex glow, hair, smoke, glass, translucent shadows, or tiny interior holes may still need manual inspection or a dedicated alpha-matting tool before print or commercial use.

### Print and Cutting Notes

StickerCraft creates PNG sticker assets. It is not a print fulfillment service, a vector cut-line editor, or a legal/IP review tool.

For Cricut, Procreate, Canva, Redbubble, Printful, or other downstream tools, treat StickerCraft as the concept and PNG asset step. You may still need to flatten layers, add offsets, verify cut boundaries, convert to vector paths, or prepare print-specific DPI/CMYK files depending on the tool and vendor.

## API Configuration

Open the `API Settings` button in the top-right corner and configure the active provider.

| Setting | Description | Gemini default | GPT default |
| --- | --- | --- | --- |
| API provider | Select the active image/text provider | Gemini | GPT / OpenAI |
| API Key | Provider API key, or a key from a compatible proxy | From Google AI Studio | From OpenAI or compatible provider |
| Endpoint | API base endpoint | `https://generativelanguage.googleapis.com/` | `https://api.openai.com/v1/` |
| Image model | Model used for sticker image generation | `gemini-3.1-flash-image-preview` | `gpt-image-2` |
| Text model | Model used for style analysis and prompt generation | `gemini-3-pro-preview` | `gpt-5.4-mini` |

Recommended image models:

- Nano Banana 2: `gemini-3.1-flash-image-preview`
- Nano Banana Pro: `gemini-3-pro-image-preview`
- Nano Banana: `gemini-2.5-flash-image`
- GPT Image 2: `gpt-image-2`
- Custom model name: for proxy services that expose different model IDs

For Gemini endpoints, if the endpoint already includes a version suffix such as `https://example.com/v1beta`, StickerCraft will use that version. Otherwise, it defaults to `v1beta`.

> Security note: this is a browser-only app. API keys are stored in localStorage and requests are sent directly from the browser. This is fine for personal local use. For public deployments, add a backend proxy, authentication, quota limits, and abuse protection.

## Quick Start

### Requirements

- Node.js 18+
- npm
- Gemini API key, OpenAI API key, or a compatible proxy key

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

After opening the app, configure your provider, API key, endpoint, image model, and text model from `API Settings`.

### Optional Environment Defaults

You can create `.env.local` to prefill local development keys:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
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
│   ├── GeneratedGrid.tsx           # Gallery, asset readiness, selection, upload, ZIP download
│   ├── Header.tsx                  # Logo, language menu, API settings modal
│   └── StickerCard.tsx             # Individual sticker card and asset labels
├── contexts/
│   └── LanguageContext.tsx         # Multilingual UI state
├── docs/
│   └── images/                     # README screenshots
├── public/
│   └── logo.svg                    # App logo and favicon
├── services/
│   ├── apiConfig.ts                # API provider settings, endpoint parsing, model suggestions
│   ├── geminiService.ts            # Image generation, style analysis, prompt generation
│   └── storageService.ts           # Browser storage for gallery and custom styles
├── constants.ts                    # Presets, translations, ratios, fonts, colors
├── types.ts                        # Shared TypeScript types
├── index.html                      # Vite HTML entry
└── index.tsx                       # React mount entry
```

## Usage Notes

- For general sticker generation with Gemini, prefer Nano Banana 2: `gemini-3.1-flash-image-preview`.
- For professional assets, complex instructions, text rendering, or 4K output, use Nano Banana Pro or GPT Image models that support the size you need.
- For lower latency with Gemini, use Nano Banana: `gemini-2.5-flash-image`.
- For prompt generation and style analysis, configure a text model for the active provider.
- When using a proxy, make sure the endpoint is compatible with the selected provider's expected request/response format.
- If generation is disabled, check that the prompt is not empty and that a model name has been provided.

## FAQ

### Can StickerCraft create real transparent PNGs?

StickerCraft exports PNG files and, by default, runs a transparent-background workflow when the background toggle is off. It generates the sticker on a controlled solid background and removes the connected background from the edges.

This is more reliable than asking a model to draw "transparent background", but it is still not a guarantee of perfect alpha matting for every image. Inspect complex edges before print use.

### Why do AI tools sometimes show a fake checkerboard?

The checkerboard may be part of the image pixels, not transparency. If the model draws the checkerboard, the file does not have a real alpha channel in that area. StickerCraft's default workflow avoids relying on fake checkerboard prompts.

### Can I use the PNGs for Cricut or print-on-demand?

Yes, as source PNG assets, but you still need to check the downstream tool's requirements. Cricut may need a flattened print-then-cut image and a clean outer offset. Print vendors may require specific DPI, bleed, cut lines, or color settings.

### Why does my custom endpoint fail?

The endpoint must match the active provider. Gemini generation uses Gemini-compatible `generateContent` requests. GPT generation uses OpenAI-compatible image endpoints. A proxy that only supports OpenAI Chat Completions will not work for Gemini image generation.

### Why is 2K/4K disabled for some custom models?

StickerCraft enables resolution controls for official or model names that look like image models with size support. Actual support depends on the provider and endpoint.

### Where is the API key stored?

In browser localStorage under `stickerCraft_apiSettings`. Older Gemini-only settings under `stickerCraft_geminiSettings` are migrated automatically. Clear site data or use the settings modal reset action to remove saved configuration.

### Can I deploy it publicly?

Yes, but do not expose a personal API key in the frontend for public users. Add a backend proxy, authentication, quota limits, abuse protection, and logging before publishing it as a public shared service.

### What does StickerCraft not do?

StickerCraft does not provide print fulfillment, commercial rights review, trademark checks, guaranteed vector cut paths, CMYK conversion, or perfect alpha matting for every edge case.

## Contributing

Issues and pull requests are welcome. Good first areas include:

- More localized copy and style labels.
- More sticker style presets.
- Backend proxy support for safer public deployments.
- Import/export for generation settings.
- Better edge cleanup controls for transparent PNG output.
