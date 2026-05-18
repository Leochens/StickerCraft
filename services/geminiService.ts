import { StickerRequest, GeneratedImage, StickerStyle } from "../types";
import { STICKER_STYLES } from "../constants";
import { createGeminiClient, loadGeminiSettings, modelSupportsImageSize } from "./geminiConfig";

/**
 * Removes the background from an image using a flood-fill algorithm from the corners.
 * @param dataUrl The original image data URL
 * @param targetColorRGB The background color to remove {r, g, b}
 * @param tolerance Color matching tolerance (0-255)
 */
const removeBackground = async (
  dataUrl: string, 
  targetColorRGB: { r: number, g: number, b: number }, 
  tolerance: number = 20
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;

      // Helper to match color within tolerance
      const matchesTarget = (idx: number) => {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        return (
          Math.abs(r - targetColorRGB.r) <= tolerance &&
          Math.abs(g - targetColorRGB.g) <= tolerance &&
          Math.abs(b - targetColorRGB.b) <= tolerance
        );
      };

      // Flood fill (BFS) from all 4 corners to find background
      // This ensures we only remove background connected to the edges, preserving internal colors
      const queue: [number, number][] = [
        [0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]
      ];
      
      const visited = new Set<string>();
      const getPosKey = (x: number, y: number) => `${x},${y}`;

      // Initialize queue with corners if they match target
      const activeQueue: number[] = []; // store as index to avoid object creation overhead
      
      // Check corners
      queue.forEach(([x, y]) => {
        const idx = (y * width + x) * 4;
        if (matchesTarget(idx)) {
          activeQueue.push(x, y);
          visited.add(getPosKey(x, y));
        }
      });

      let head = 0;
      while (head < activeQueue.length) {
        const x = activeQueue[head++];
        const y = activeQueue[head++];
        
        const idx = (y * width + x) * 4;
        
        // Set alpha to 0 (Transparent)
        data[idx + 3] = 0;

        // Check neighbors
        const neighbors = [
          [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
        ];

        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const key = getPosKey(nx, ny);
            if (!visited.has(key)) {
              const nIdx = (ny * width + nx) * 4;
              if (matchesTarget(nIdx)) {
                visited.add(key);
                activeQueue.push(nx, ny);
              }
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (e) => reject(e);
    img.src = dataUrl;
  });
};

const generateSingleImage = async (
  request: StickerRequest, 
  styleModifier: string
): Promise<string> => {
  const { prompt, model, aspectRatio, resolution, textConfig, useThreeViews, useStickerBorder, useFacialFeatures, referenceImage } = request;

  // Build the text instructions
  let textInstruction = "";
  if (textConfig?.enabled && textConfig.content) {
    const borderText = textConfig.hasBorder ? "with a thick white outline/border" : "without an outline";
    textInstruction = `Important: The image MUST include the text "${textConfig.content}" written prominently in a ${textConfig.font} font style. Text style: ${borderText}.`;
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

  // Determine Background Strategy
  // If user wants default white background, we actually prompt for a contrast color internally
  // to facilitate cleaner background removal, then remove it.
  let promptBgColor = "white";
  let shouldRemoveBg = false;
  let removalTargetColor = { r: 255, g: 255, b: 255 }; // Default remove white

  // Check if user has explicitly selected a color other than white
  const userSelectedColor = textConfig?.backgroundColor;
  const isDefaultBg = !userSelectedColor || userSelectedColor === 'white';

  if (isDefaultBg) {
    shouldRemoveBg = true;
    if (useStickerBorder) {
        // STRATEGY: If generating a white sticker border, use a BLACK background 
        // to maximize contrast for the removal algorithm.
        promptBgColor = "black";
        removalTargetColor = { r: 0, g: 0, b: 0 };
    } else {
        // If no border, white background is standard.
        promptBgColor = "white";
        removalTargetColor = { r: 255, g: 255, b: 255 };
    }
  } else {
    // User picked a specific color (e.g. pastel pink), respect it.
    promptBgColor = userSelectedColor;
  }

  const bgInstruction = `Isolated on a solid ${promptBgColor} background`;

  // Build View/Border Instruction
  let viewInstruction = "sticker design, high quality vector graphics, centered composition";
  
  // Sticker Border Logic
  if (useStickerBorder) {
    viewInstruction += ", die-cut sticker with a thick white border/outline surrounding the subject";
  } else {
    // Strong negative constraint for border
    viewInstruction += ", borderless, strictly NO white outline, NO die-cut border, edge-to-edge design";
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
    const ai = createGeminiClient();
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
                // Use a slightly higher tolerance for Black removal (often has compression artifacts)
                // Use strict tolerance for White
                const tolerance = promptBgColor === 'black' ? 30 : 15;
                return await removeBackground(rawBase64, removalTargetColor, tolerance);
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
      styleName: style.name
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
    // Remove data URI prefix if present for the API call
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    const ai = createGeminiClient();
    const { textModel } = loadGeminiSettings();

    const response = await ai.models.generateContent({
      model: textModel,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png', // Assuming png or jpeg, API is flexible with mime types usually
              data: cleanBase64
            }
          },
          {
            text: "Analyze the artistic style of this image. Provide a concise, comma-separated list of visual style descriptors (e.g., 'watercolor, soft edges, pastel colors, thick outlines') that can be used as a prompt modifier for generating similar sticker art. Do not describe the subject matter, ONLY the visual style, medium, and technique. Keep it under 30 words."
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
    const ai = createGeminiClient();
    const { textModel } = loadGeminiSettings();
    const response = await ai.models.generateContent({
      model: textModel,
      contents: `Generate a list of 8 distinct, creative, and cute sticker subject ideas related to the category: "${category}". 
      Return ONLY the list of subjects, one per line. No numbering, no bullets, no extra text.
      Example for 'Fruit':
      Happy Apple
      Dancing Banana
      Cool Watermelon
      ...`
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
