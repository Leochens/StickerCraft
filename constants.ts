import { AspectRatio, ImageResolution, StickerStyle, ModelType } from './types';
import { Palette, Zap, Star, Monitor, Ghost, PenTool } from 'lucide-react';

export const STICKER_STYLES: StickerStyle[] = [
  {
    id: 'classic-cartoon',
    name: 'Classic Cartoon',
    label_zh: '经典卡通',
    promptModifier: 'vibrant flat cartoon sticker, thick bold black outlines, simple shading, vector art style, cute and expressive',
    previewColor: 'bg-yellow-400',
  },
  {
    id: 'kawaii-chibi',
    name: 'Kawaii Chibi',
    label_zh: '可爱Q版',
    promptModifier: 'adorable kawaii chibi sticker, pastel colors, giant sparkling eyes, soft rounded shapes, bubbly aesthetic, white outline',
    previewColor: 'bg-pink-400',
  },
  {
    id: '3d-glossy',
    name: '3D Glossy',
    label_zh: '3D光泽',
    promptModifier: '3D rendered toy sticker, plastic glossy texture, claymation style, soft studio lighting, cute character design, volumetric',
    previewColor: 'bg-blue-400',
  },
  {
    id: 'vintage-badge',
    name: 'Vintage Badge',
    label_zh: '复古徽章',
    promptModifier: 'retro vintage sticker, muted color palette, textured paper feel, 70s badge style, distressed look, typography elements',
    previewColor: 'bg-orange-400',
  },
  {
    id: 'pixel-art',
    name: 'Pixel Art',
    label_zh: '像素艺术',
    promptModifier: 'pixel art sticker, 8-bit retro game style, blocky details, limited color palette, clean edges, white outline',
    previewColor: 'bg-purple-400',
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    label_zh: '水彩画',
    promptModifier: 'watercolor painted sticker, artistic brush strokes, soft gradients, paper texture, dreamy and whimsical, hand-painted look',
    previewColor: 'bg-teal-400',
  },
  {
    id: 'neon-cyberpunk',
    name: 'Neon Cyberpunk',
    label_zh: '霓虹赛博',
    promptModifier: 'neon cyberpunk sticker, glowing lights, futuristic, dark background, synthwave colors, high contrast',
    previewColor: 'bg-fuchsia-600',
  },
  {
    id: 'paper-cutout',
    name: 'Paper Cutout',
    label_zh: '剪纸艺术',
    promptModifier: 'layered paper cutout style sticker, craft art, textured paper, depth shadows, handmade feel',
    previewColor: 'bg-orange-300',
  },
  {
    id: 'graffiti',
    name: 'Graffiti',
    label_zh: '街头涂鸦',
    promptModifier: 'urban graffiti sticker, spray paint texture, street art, drips, bold wildstyle, vibrant',
    previewColor: 'bg-lime-500',
  },
  {
    id: 'holographic',
    name: 'Holographic',
    label_zh: '全息镭射',
    promptModifier: 'holographic sticker, iridescent foil texture, metallic rainbow reflections, shiny, chromatic aberration',
    previewColor: 'bg-cyan-300',
  },
  {
    id: 'sketch',
    name: 'Pencil Sketch',
    label_zh: '铅笔素描',
    promptModifier: 'pencil sketch sticker, hand-drawn graphite, rough lines, artistic, monochrome or muted colors',
    previewColor: 'bg-stone-400',
  },
  {
    id: 'anime',
    name: 'Anime',
    label_zh: '日系动漫',
    promptModifier: 'anime manga sticker, cel shaded, vibrant, japanese animation style, expressive, clean lines',
    previewColor: 'bg-rose-400',
  },
  {
    id: 'flat-emoji',
    name: 'Flat Emoji',
    label_zh: '扁平表情',
    promptModifier: 'flat design emoji style, minimal vector, solid colors, UI icon aesthetic, simple shapes',
    previewColor: 'bg-yellow-300',
  },
  {
    id: 'impressionist',
    name: 'Impressionist',
    label_zh: '印象油画',
    promptModifier: 'oil painting sticker, thick brush strokes, impressionist style, textured canvas, artistic',
    previewColor: 'bg-amber-600',
  },
  {
    id: 'stained-glass',
    name: 'Stained Glass',
    label_zh: '彩色玻璃',
    promptModifier: 'stained glass sticker, mosaic pattern, vibrant translucent colors, black lead lines, geometric',
    previewColor: 'bg-emerald-600',
  },
  {
    id: 'psychedelic',
    name: 'Psychedelic',
    label_zh: '迷幻波普',
    promptModifier: 'psychedelic pop art sticker, swirling colors, trippy patterns, surreal, groovy, 60s style',
    previewColor: 'bg-violet-500',
  },
];

export const ASPECT_RATIOS = [
  { value: AspectRatio.SQUARE, label: 'Square (1:1)' },
  { value: AspectRatio.PORTRAIT, label: 'Portrait (3:4)' },
  { value: AspectRatio.LANDSCAPE, label: 'Landscape (4:3)' },
  { value: AspectRatio.WIDE, label: 'Wide (16:9)' },
];

export const RESOLUTIONS = [
  { value: ImageResolution.RES_1K, label: 'Standard (1K)' },
  { value: ImageResolution.RES_2K, label: 'High (2K) - Pro Only' },
  { value: ImageResolution.RES_4K, label: 'Ultra (4K) - Pro Only' },
];

export const AVAILABLE_FONTS = [
  { name: 'Standard', family: 'Fredoka, sans-serif' },
  { name: 'Comic', family: 'Bangers, cursive' },
  { name: 'Script', family: 'Pacifico, cursive' },
  { name: 'Sci-Fi', family: 'Orbitron, sans-serif' },
  { name: 'Horror', family: 'Creepster, cursive' },
  { name: 'Elegant', family: 'Abril Fatface, cursive' },
];

export const BACKGROUND_COLORS = [
  { name: 'White', value: 'white', class: 'bg-white border-slate-200' },
  { name: 'Black', value: 'black', class: 'bg-slate-900 border-slate-700' },
  { name: 'Red', value: 'pastel red', class: 'bg-red-500 border-red-600' },
  { name: 'Blue', value: 'pastel blue', class: 'bg-blue-500 border-blue-600' },
  { name: 'Green', value: 'pastel green', class: 'bg-green-500 border-green-600' },
  { name: 'Yellow', value: 'pastel yellow', class: 'bg-yellow-400 border-yellow-500' },
  { name: 'Pink', value: 'pastel pink', class: 'bg-pink-400 border-pink-500' },
  { name: 'Purple', value: 'pastel purple', class: 'bg-purple-500 border-purple-600' },
];

export const DEFAULT_REQUEST_CONFIG = {
  quantity: 1,
  model: ModelType.STANDARD,
  aspectRatio: AspectRatio.SQUARE,
  resolution: ImageResolution.RES_1K,
  useFacialFeatures: true,
};

export const PRESET_PROMPTS = {
  en: [
    "A cute baby fox",
    "A fleet of yellow submarines",
    "A robot eating pizza",
    "A magical tree house",
    "A cat wearing sunglasses"
  ],
  zh: [
    "一只可爱的小狐狸",
    "黄色潜艇舰队",
    "吃披萨的机器人",
    "神奇的树屋",
    "戴墨镜的猫"
  ]
};

export const TRANSLATIONS = {
  en: {
    title_suffix: "Craft",
    subtitle: "AI Generator",
    powered_by: "Powered by Gemini 2.5",
    hero_title_1: "Turn ideas into",
    hero_title_2: "Stickers",
    hero_desc: "Create unique, cartoon-style stickers in seconds using advanced AI. Just describe it, style it, and stick it!",
    
    prompt_label: "What do you want to create?",
    prompt_placeholder: "Enter one prompt per line to generate a batch...\nE.g.,\nA happy little fox\nA fleet of submarines",
    prompt_presets: "Try these:",
    
    style_label: "Choose a Style",
    style_custom_count: "Custom",
    style_custom_remove: "Remove style",
    style_import: "Create Custom Style",
    style_modifier: "Style Modifier",
    style_analyzed: "Analyzed Style Description",
    style_my: "MY",
    
    create_style_title: "Create New Style",
    style_desc_placeholder: "Describe the style (e.g. 'Watercolor, soft pastel colors, dreamy vibe')...",
    upload_reference: "Upload Reference Image (Optional)",
    btn_create_style: "Save Style",
    btn_creating_style: "Analyzing & Saving...",
    style_creation_error: "Please provide a description or an image to create a style.",
    style_image_analyzed: "Image analyzed successfully!",

    config_quantity: "Quantity",
    config_ratio: "Ratio",
    config_model: "Model",
    config_resolution: "Resolution",
    config_three_views: "Three Views (Sheet)",
    config_sticker_border: "White Sticker Border",
    config_facial_features: "Generate Faces",
    
    text_section_title: "Text & Background",
    text_enable: "Add Text?",
    text_input_placeholder: "Enter text here (e.g. 'Hello!')",
    font_style: "FONT STYLE",
    text_border: "Add Text Border",
    bg_color: "Background Color",
    
    btn_generate: "Generate Stickers",
    btn_generating: "Crafting your stickers...",
    
    gallery_title: "Your Gallery",
    gallery_category_all: "All Styles",
    select_all: "Select All",
    deselect_all: "Deselect All",
    download_zip: "Download ZIP",
    selected: "Selected",
    zipping: "Zipping...",
    
    empty_gallery_title: "Ready to create?",
    empty_gallery_desc: "Enter a prompt above and choose a style to generate your first batch of custom stickers!",
    
    error_generic: "Something went wrong while generating stickers. Please try again.",
    
    sticker_details: "Sticker Details",
    created: "Created",
    download_png: "Download PNG",
    
    custom_style_name: "My Style",

    action_delete: "Delete",
    action_regenerate: "Regenerate / Remix",
    action_clear_image: "Clear Image",
    
    prompt_generator_title: "Prompt Generator",
    prompt_generator_placeholder: "Enter a category (e.g. 'Plants', 'Fast Food')",
    prompt_generator_btn: "Generate List",
    prompt_generator_use: "Use These",
    
    upload_image_title: "Upload to Gallery",
    upload_image_desc: "Add your own image to the gallery.",
    upload_image_classification: "Classification / Style",
    upload_image_prompt: "Description / Prompt",
    btn_upload: "Upload",
    btn_uploading: "Uploading...",
  },
  zh: {
    title_suffix: "工坊",
    subtitle: "AI 生成器",
    powered_by: "由 Gemini 2.5 驱动",
    hero_title_1: "将创意转化为",
    hero_title_2: "贴纸",
    hero_desc: "利用先进的 AI 技术，瞬间将创意转化为独特的卡通贴纸。只需描述、选择风格，即可生成！",
    
    prompt_label: "你想创作什么？",
    prompt_placeholder: "每行输入一个提示词以进行批量生成...\n例如：\n一只快乐的小狐狸\n一支潜艇舰队",
    prompt_presets: "试试这些：",
    
    style_label: "选择风格",
    style_custom_count: "自定义",
    style_custom_remove: "删除风格",
    style_import: "创建自定义风格",
    style_modifier: "风格描述",
    style_analyzed: "AI分析的风格描述",
    style_my: "我",

    create_style_title: "创建新风格",
    style_desc_placeholder: "描述风格 (例如 '水彩画，柔和的色彩，梦幻氛围')...",
    upload_reference: "上传参考图片 (可选)",
    btn_create_style: "保存风格",
    btn_creating_style: "正在分析并保存...",
    style_creation_error: "请提供风格描述或参考图片。",
    style_image_analyzed: "图片分析成功！",
    
    config_quantity: "数量 (每种)",
    config_ratio: "比例",
    config_model: "模型",
    config_resolution: "分辨率",
    config_three_views: "生成三视图 (设定图)",
    config_sticker_border: "生成贴纸白边 (描边)",
    config_facial_features: "生成面部/表情",
    
    text_section_title: "文字与背景",
    text_enable: "添加文字？",
    text_input_placeholder: "在此输入文字 (例如 'Hello!')",
    font_style: "字体风格",
    text_border: "添加文字描边",
    bg_color: "背景颜色",
    
    btn_generate: "生成贴纸",
    btn_generating: "正在制作贴纸...",
    
    gallery_title: "你的图库",
    gallery_category_all: "全部风格",
    select_all: "全选",
    deselect_all: "取消全选",
    download_zip: "下载 ZIP",
    selected: "已选择",
    zipping: "正在压缩...",
    
    empty_gallery_title: "准备好创作了吗？",
    empty_gallery_desc: "在上方输入提示词并选择一种风格，开始生成你的第一批专属贴纸！",
    
    error_generic: "生成贴纸时出现问题，请重试。",
    
    sticker_details: "贴纸详情",
    created: "创建时间",
    download_png: "下载 PNG",
    
    custom_style_name: "我的风格",

    action_delete: "删除",
    action_regenerate: "重绘 / 变体",
    action_clear_image: "清除图片",
    
    prompt_generator_title: "提示词生成器",
    prompt_generator_placeholder: "输入类别 (例如 '植物', '快餐')",
    prompt_generator_btn: "生成列表",
    prompt_generator_use: "使用这些",
    
    upload_image_title: "上传到图库",
    upload_image_desc: "将你自己的图片添加到图库中。",
    upload_image_classification: "分类 / 风格",
    upload_image_prompt: "描述 / 提示词",
    btn_upload: "上传",
    btn_uploading: "正在上传...",
  }
};