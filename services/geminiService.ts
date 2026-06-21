import { APIProvider, AspectRatio, GeneratedImage, ImageResolution, ProviderAPISettings, StickerRequest, StickerStyle } from "../types";
import { STICKER_STYLES } from "../constants";
import {
  createGeminiClient,
  getActiveProviderSettings,
  getOpenAIEndpointUrl,
  loadAPISettings,
  modelSupportsImageSize,
  resolveAgnesAssetUrl,
  usesChatCompletionsAPI,
  usesOpenAIImageAPI,
} from "./apiConfig";
import { repairStickerTransparency } from "./imageProcessing";

const getDataUrlMimeType = (dataUrl: string) => (
  dataUrl.match(/^data:([^;]+);base64,/)?.[1] || "image/png"
);

const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const response = await fetch(dataUrl);
  return response.blob();
};

const requestOpenAI = async (
  providerSettings: ProviderAPISettings,
  path: string,
  init: RequestInit,
  providerLabel = "OpenAI",
) => {
  if (!providerSettings.apiKey.trim()) {
    throw new Error(`Please configure a ${providerLabel} API Key before generating stickers.`);
  }

  const response = await fetch(getOpenAIEndpointUrl(providerSettings, path), {
    ...init,
    headers: {
      Authorization: `Bearer ${providerSettings.apiKey.trim()}`,
      ...(init.headers || {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.error?.message || payload?.message || `${providerLabel} API request failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
};

const extractOpenAIText = (payload: any): string => {
  if (typeof payload?.output_text === "string") {
    return payload.output_text.trim();
  }

  const textParts: string[] = [];
  const outputs = Array.isArray(payload?.output) ? payload.output : [];

  outputs.forEach((output: any) => {
    const content = Array.isArray(output?.content) ? output.content : [];
    content.forEach((part: any) => {
      if (typeof part?.text === "string") {
        textParts.push(part.text);
      }
    });
  });

  return textParts.join("\n").trim();
};

const generateOpenAIText = async (
  prompt: string,
  providerSettings: ProviderAPISettings,
  imageDataUrl?: string,
): Promise<string> => {
  if (!providerSettings.textModel.trim()) {
    throw new Error("Please configure an OpenAI text model before using helper features.");
  }

  const input = imageDataUrl
    ? [{
        role: "user",
        content: [
          { type: "input_text", text: prompt },
          { type: "input_image", image_url: imageDataUrl },
        ],
      }]
    : prompt;

  const payload = await requestOpenAI(providerSettings, "responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: providerSettings.textModel,
      input,
    }),
  });

  const text = extractOpenAIText(payload);
  if (!text) {
    throw new Error("No text data found in OpenAI response.");
  }

  return text;
};

const getOpenAIImageSize = (aspectRatio: AspectRatio, resolution?: ImageResolution) => {
  const is2K = resolution === ImageResolution.RES_2K;
  const is4K = resolution === ImageResolution.RES_4K;

  if (aspectRatio === AspectRatio.PORTRAIT) {
    if (is4K) return "2160x3840";
    if (is2K) return "1152x2048";
    return "1024x1536";
  }

  if (aspectRatio === AspectRatio.LANDSCAPE) {
    if (is4K) return "2048x1536";
    if (is2K) return "2048x1536";
    return "1536x1024";
  }

  if (aspectRatio === AspectRatio.WIDE) {
    if (is4K) return "3840x2160";
    if (is2K) return "2048x1152";
    return "1536x864";
  }

  if (is4K || is2K) return "2048x2048";
  return "1024x1024";
};

const extractOpenAIImageDataUrl = async (payload: any): Promise<string> => {
  const imageData = payload?.data?.[0];
  if (!imageData) {
    throw new Error("No image data found in OpenAI response.");
  }

  if (imageData.b64_json) {
    const outputFormat = payload?.output_format || "png";
    return `data:image/${outputFormat};base64,${imageData.b64_json}`;
  }

  if (typeof imageData.url === "string") {
    const imageResponse = await fetch(resolveAgnesAssetUrl(imageData.url));
    if (!imageResponse.ok) {
      throw new Error("Failed to download image from provider URL.");
    }
    const imageBlob = await imageResponse.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to convert downloaded image."));
      reader.readAsDataURL(imageBlob);
    });
  }

  throw new Error("No image data found in OpenAI response.");
};

const generateAgnesText = async (
  prompt: string,
  providerSettings: ProviderAPISettings,
  imageDataUrl?: string,
): Promise<string> => {
  if (!providerSettings.textModel.trim()) {
    throw new Error("Please configure an Agnes text model before using helper features.");
  }

  const messages = imageDataUrl
    ? [{
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      }]
    : [{ role: "user", content: prompt }];

  const payload = await requestOpenAI(providerSettings, "chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: providerSettings.textModel,
      messages,
    }),
  }, "Agnes");

  const content = payload?.choices?.[0]?.message?.content;
  const text = typeof content === "string"
    ? content.trim()
    : Array.isArray(content)
      ? content
        .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
        .join("\n")
        .trim()
      : "";

  if (!text) {
    throw new Error("No text data found in Agnes response.");
  }

  return text;
};

const generateProviderText = async (
  provider: APIProvider,
  prompt: string,
  providerSettings: ProviderAPISettings,
  imageDataUrl?: string,
): Promise<string> => {
  if (usesChatCompletionsAPI(provider)) {
    return generateAgnesText(prompt, providerSettings, imageDataUrl);
  }

  return generateOpenAIText(prompt, providerSettings, imageDataUrl);
};

const generateOpenAIImage = async (
  providerSettings: ProviderAPISettings,
  model: string,
  fullPrompt: string,
  request: StickerRequest,
): Promise<string> => {
  if (!providerSettings.imageModel.trim() && !model.trim()) {
    throw new Error("Please configure an OpenAI image model before generating stickers.");
  }

  const imageModel = model.trim() || providerSettings.imageModel.trim();
  const size = getOpenAIImageSize(request.aspectRatio, request.resolution);

  if (request.referenceImage) {
    const formData = new FormData();
    const imageBlob = await dataUrlToBlob(request.referenceImage);
    const extension = getDataUrlMimeType(request.referenceImage).split("/")[1] || "png";
    formData.append("model", imageModel);
    formData.append("prompt", fullPrompt);
    formData.append("size", size);
    formData.append("output_format", "png");
    formData.append("image[]", imageBlob, `reference.${extension}`);

    return extractOpenAIImageDataUrl(await requestOpenAI(providerSettings, "images/edits", {
      method: "POST",
      body: formData,
    }));
  }

  return extractOpenAIImageDataUrl(await requestOpenAI(providerSettings, "images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: imageModel,
      prompt: fullPrompt,
      size,
      output_format: "png",
      background: "opaque",
    }),
  }));
};

const generateAgnesImage = async (
  providerSettings: ProviderAPISettings,
  model: string,
  fullPrompt: string,
  request: StickerRequest,
): Promise<string> => {
  if (!providerSettings.imageModel.trim() && !model.trim()) {
    throw new Error("Please configure an Agnes image model before generating stickers.");
  }

  const imageModel = model.trim() || providerSettings.imageModel.trim();
  const size = getOpenAIImageSize(request.aspectRatio, request.resolution);

  if (request.referenceImage) {
    const formData = new FormData();
    const imageBlob = await dataUrlToBlob(request.referenceImage);
    const extension = getDataUrlMimeType(request.referenceImage).split("/")[1] || "png";
    formData.append("model", imageModel);
    formData.append("prompt", fullPrompt);
    formData.append("size", size);
    formData.append("image[]", imageBlob, `reference.${extension}`);

    return extractOpenAIImageDataUrl(await requestOpenAI(providerSettings, "images/edits", {
      method: "POST",
      body: formData,
    }, "Agnes"));
  }

  return extractOpenAIImageDataUrl(await requestOpenAI(providerSettings, "images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: imageModel,
      prompt: fullPrompt,
      size,
    }),
  }, "Agnes"));
};

const generateProviderImage = async (
  provider: APIProvider,
  providerSettings: ProviderAPISettings,
  model: string,
  fullPrompt: string,
  request: StickerRequest,
): Promise<string> => {
  if (provider === APIProvider.AGNES) {
    return generateAgnesImage(providerSettings, model, fullPrompt, request);
  }

  return generateOpenAIImage(providerSettings, model, fullPrompt, request);
};

const generateSingleImage = async (
  request: StickerRequest, 
  styleModifier: string
): Promise<string> => {
  const { prompt, model, aspectRatio, resolution, textConfig, backgroundConfig, useThreeViews, useStickerCollection, stickerCollectionCount, collectionItemPrompts, useStickerBorder, useFacialFeatures, referenceImage } = request;
  const requestedCollectionItems = (collectionItemPrompts || [])
    .map(item => item.trim())
    .filter(Boolean);
  const stickerCollectionItemCount = Math.max(2, Math.min(12, stickerCollectionCount || requestedCollectionItems.length || 6));

  // Build the text instructions
  let textInstruction = "";
  if (textConfig?.enabled && textConfig.content.trim()) {
    const borderText = textConfig.hasBorder ? "with a thick white outline/border" : "without an outline";
    textInstruction = `Important: The image MUST include the text "${textConfig.content.trim()}" written prominently in a ${textConfig.font} font style. Text style: ${borderText}.`;
  } else if (textConfig?.enabled) {
    const borderText = textConfig.hasBorder ? "with a thick white outline/border" : "without an outline";
    textInstruction = `Important: Include short, relevant sticker text chosen by you. The text should fit the subject and be written prominently in a ${textConfig.font} font style. Text style: ${borderText}.`;
  } else {
    // Strict no-text requirement when disabled
    textInstruction = "Strictly NO text, NO letters, NO numbers, and NO typography in the image. The image must be purely visual.";
  }

  // Build Facial Feature Instruction
  let faceInstruction = "";
  if (useFacialFeatures) {
      faceInstruction = "Facial features (eyes, mouth, expressions) are permitted and encouraged to convey character/emotion.";
  } else {
      faceInstruction = "STRICTLY NO FACES. Do NOT generate any facial features (eyes, nose, mouth). The subject must be faceless, shown from behind, or obscured. If the subject is an object, do not anthropomorphize it with a face.";
  }

  // Determine Background Strategy. When background is enabled, preserve it and
  // skip transparency post-processing entirely.
  let promptBgColor = "white";
  let shouldRemoveBg = false;

  if (backgroundConfig?.enabled) {
    promptBgColor = backgroundConfig.color || "white";
  } else {
    shouldRemoveBg = true;
    if (useStickerBorder) {
        // STRATEGY: If generating a white sticker border, use a BLACK background 
        // to maximize contrast for the removal algorithm.
        promptBgColor = "black";
    } else {
        // If no border, white background is standard.
        promptBgColor = "white";
    }
  }

  const bgInstruction = `Isolated on a solid ${promptBgColor} background`;

  // Build View/Border Instruction
  let viewInstruction = "sticker design, high quality vector graphics, centered composition";

  if (useStickerCollection) {
    viewInstruction = `Sticker Collection Sheet: Generate exactly ${stickerCollectionItemCount} distinct small stickers on one single canvas. They must feel like one coherent series with a unified character language, consistent color palette, matching line weight, and related poses/expressions/objects. Arrange the stickers in a clean grid or loose sticker-sheet layout with generous spacing between each mini sticker, no overlap, and no cropped edges. Each mini sticker should be complete and individually usable.`;

    if (requestedCollectionItems.length > 0) {
      viewInstruction += ` The mini stickers must follow this exact subject list, one mini sticker per item, in reading order: ${requestedCollectionItems.map((item, index) => `${index + 1}. ${item}`).join("; ")}. Do not omit listed items.`;
      if (requestedCollectionItems.length < stickerCollectionItemCount) {
        viewInstruction += ` Add ${stickerCollectionItemCount - requestedCollectionItems.length} additional related mini stickers to reach the requested count.`;
      }
    }

    if (useStickerBorder) {
      viewInstruction += " Give every mini sticker its own die-cut white border/outline.";
    } else {
      viewInstruction += " Keep every mini sticker borderless with no white outline.";
    }
  } else {
    // Sticker Border Logic
    if (useStickerBorder) {
      viewInstruction += ", die-cut sticker with a thick white border/outline surrounding the subject";
    } else {
      // Strong negative constraint for border
      viewInstruction += ", borderless, strictly NO white outline, NO die-cut border, edge-to-edge design";
    }
  }

  // Three Views Logic (Character Sheet)
  if (useThreeViews) {
    viewInstruction = "Character Reference Sheet: Generate a formal three-view orthographic drawing (Three Divisions/Three Views). The image must display the SUBJECT from three distinct angles: Front View, Side View, and Back View. Arrange them horizontally in a clean, professional layout. Maintain consistent character details, proportions, and style across all views.";
    
    // Re-apply border constraint for the reference sheet
    if (!useStickerBorder) {
        viewInstruction += " Do not add white sticker outlines around the characters.";
    }
  }

  // Construct a robust prompt for sticker generation
  let fullPrompt = `
    Style: ${styleModifier}. 
    Subject: ${prompt}.
    ${faceInstruction}
    ${textInstruction}
    Visuals: ${bgInstruction}, ${viewInstruction}
  `.trim();

  // If we have a reference image, clarify that it should be used for composition/structure
  if (referenceImage) {
    fullPrompt += " Use the provided image as the primary visual reference for the subject, pose, and composition. Re-create it strictly following the requested Style and Subject.";
  }

  try {
    const apiSettings = loadAPISettings();
    const activeProviderSettings = getActiveProviderSettings(apiSettings);

    if (usesOpenAIImageAPI(apiSettings.activeProvider)) {
      const rawBase64 = await generateProviderImage(
        apiSettings.activeProvider,
        activeProviderSettings,
        model,
        fullPrompt,
        request,
      );

      if (shouldRemoveBg) {
        try {
            return await repairStickerTransparency(rawBase64, {
              backgroundColor: promptBgColor,
              hasStickerBorder: useStickerBorder,
              tolerance: promptBgColor === 'black' ? 50 : 44,
            });
        } catch (bgError) {
            console.warn("Background removal failed, returning original.", bgError);
            return rawBase64;
        }
      }

      return rawBase64;
    }

    const config: any = {
      imageConfig: {
        aspectRatio: aspectRatio,
      },
    };

    // Add resolution config only for official/custom Pro image models.
    if (modelSupportsImageSize(model) && resolution) {
      config.imageConfig.imageSize = resolution;
    }

    const parts: any[] = [{ text: fullPrompt }];

    // If reference image exists, add it to parts
    if (referenceImage) {
        // Strip data prefix if present to get clean base64
        const cleanBase64 = referenceImage.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
        parts.push({
            inlineData: {
                mimeType: 'image/png', // API usually infers or accepts png/jpeg
                data: cleanBase64
            }
        });
    }

    // Call the API
    const ai = createGeminiClient(activeProviderSettings);
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: parts
      },
      config: config
    });

    // Parse response
    if (response.candidates && response.candidates.length > 0) {
      const parts = response.candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          const rawBase64 = `data:${mimeType};base64,${part.inlineData.data}`;
          
          // Post-Processing: Remove background if needed
          if (shouldRemoveBg) {
            try {
                return await repairStickerTransparency(rawBase64, {
                  backgroundColor: promptBgColor,
                  hasStickerBorder: useStickerBorder,
                  tolerance: promptBgColor === 'black' ? 50 : 44,
                });
            } catch (bgError) {
                console.warn("Background removal failed, returning original.", bgError);
                return rawBase64;
            }
          }
          
          return rawBase64;
        }
      }
    }
    
    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateStickers = async (
  request: StickerRequest,
  allStyles: StickerStyle[] = STICKER_STYLES // Pass all styles including custom ones
): Promise<GeneratedImage[]> => {
  const { quantity, styleId, prompt } = request;
  const style = allStyles.find(s => s.id === styleId) || allStyles[0];
  
  // Create an array of promises based on the quantity requested
  // Since generateContent typically returns one generation per call, we make parallel calls for multiple items.
  const promises = Array.from({ length: quantity }).map(() => 
    generateSingleImage(request, style.promptModifier)
  );

  try {
    const results = await Promise.all(promises);

    return results.map(dataUrl => ({
      id: crypto.randomUUID(),
      dataUrl,
      prompt,
      createdAt: Date.now(),
      styleName: style.name,
      backgroundRemoved: !request.backgroundConfig.enabled,
      backgroundColor: request.backgroundConfig.enabled ? request.backgroundConfig.color : undefined,
      hasStickerBorder: request.useStickerBorder,
      hasText: request.textConfig.enabled,
      hasReferenceImage: Boolean(request.referenceImage),
      isThreeViews: request.useThreeViews,
      isStickerCollection: request.useStickerCollection,
      stickerCollectionCount: request.useStickerCollection ? request.stickerCollectionCount : undefined,
      sourceType: 'generated'
    }));
  } catch (error) {
    console.error("Batch generation failed:", error);
    throw error;
  }
};

/**
 * Analyzes an uploaded image to extract style descriptors using Gemini Vision.
 */
export const analyzeStyleFromImage = async (base64Image: string): Promise<string> => {
  try {
    const apiSettings = loadAPISettings();
    const activeProviderSettings = getActiveProviderSettings(apiSettings);
    const analysisPrompt = "Analyze the artistic style of this image. Provide a concise, comma-separated list of visual style descriptors (e.g., 'watercolor, soft edges, pastel colors, thick outlines') that can be used as a prompt modifier for generating similar sticker art. Do not describe the subject matter, ONLY the visual style, medium, and technique. Keep it under 30 words.";

    if (usesChatCompletionsAPI(apiSettings.activeProvider) || apiSettings.activeProvider === APIProvider.GPT) {
      return (await generateProviderText(
        apiSettings.activeProvider,
        analysisPrompt,
        activeProviderSettings,
        base64Image,
      )).trim();
    }

    // Remove data URI prefix if present for the API call
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    const ai = createGeminiClient(activeProviderSettings);

    const response = await ai.models.generateContent({
      model: activeProviderSettings.textModel,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png', // Assuming png or jpeg, API is flexible with mime types usually
              data: cleanBase64
            }
          },
          {
            text: analysisPrompt
          }
        ]
      }
    });

    if (response.text) {
      return response.text.trim();
    }
    throw new Error("Could not analyze image style.");
  } catch (error) {
    console.error("Style analysis failed:", error);
    throw error;
  }
};

/**
 * Generates a list of related sticker prompts based on a category.
 */
export const generateRelatedPrompts = async (category: string): Promise<string[]> => {
  try {
    const apiSettings = loadAPISettings();
    const activeProviderSettings = getActiveProviderSettings(apiSettings);
    const prompt = `Generate a list of 8 distinct, creative, and cute sticker subject ideas related to the category: "${category}".
      Return ONLY the list of subjects, one per line. No numbering, no bullets, no extra text.
      Example for 'Fruit':
      Happy Apple
      Dancing Banana
      Cool Watermelon
      ...`;

    if (usesChatCompletionsAPI(apiSettings.activeProvider) || apiSettings.activeProvider === APIProvider.GPT) {
      return (await generateProviderText(apiSettings.activeProvider, prompt, activeProviderSettings))
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    }

    const ai = createGeminiClient(activeProviderSettings);
    const response = await ai.models.generateContent({
      model: activeProviderSettings.textModel,
      contents: prompt
    });

    if (response.text) {
      return response.text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    }
    return [];
  } catch (error) {
    console.error("Prompt generation failed:", error);
    return [];
  }
};

export const generateCollectionItemPrompts = async (
  theme: string,
  count: number,
): Promise<string[]> => {
  try {
    const apiSettings = loadAPISettings();
    const activeProviderSettings = getActiveProviderSettings(apiSettings);
    const itemCount = Math.max(2, Math.min(12, Math.round(count || 6)));
    const prompt = `Generate exactly ${itemCount} concise mini sticker subject ideas for one coherent sticker collection.
Theme: "${theme}".
Each line should describe one distinct mini sticker in 3-8 words.
Keep them visually related, concrete, and easy to draw.
Return ONLY the list, one item per line. No numbering, no bullets, no extra text.`;

    const text = usesChatCompletionsAPI(apiSettings.activeProvider) || apiSettings.activeProvider === APIProvider.GPT
      ? await generateProviderText(apiSettings.activeProvider, prompt, activeProviderSettings)
      : (await createGeminiClient(activeProviderSettings).models.generateContent({
          model: activeProviderSettings.textModel,
          contents: prompt,
        })).text || "";

    return text
      .split('\n')
      .map(line => line.replace(/^[-*\d.\s]+/, '').trim())
      .filter(Boolean)
      .slice(0, itemCount);
  } catch (error) {
    console.error("Collection item prompt generation failed:", error);
    return [];
  }
};
