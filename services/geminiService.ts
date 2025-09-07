import { GoogleGenAI, Modality, Part } from "@google/genai";
import { AppMode, CreateFunction, EditFunction, ImageFile, AspectRatio, RenderInputType } from '../types';

const API_KEY_STORAGE_KEY = 'google-ai-studio-api-key';

export const getApiKey = (): string | null => {
    try {
        return localStorage.getItem(API_KEY_STORAGE_KEY);
    } catch (e) {
        console.error("Could not access localStorage:", e);
        return null;
    }
};
export const setApiKey = (key: string): void => {
    try {
        localStorage.setItem(API_KEY_STORAGE_KEY, key);
    } catch (e) {
        console.error("Could not access localStorage:", e);
    }
};
export const clearApiKey = (): void => {
    try {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
    } catch (e) {
        console.error("Could not access localStorage:", e);
    }
};

const getGenAIClient = (): GoogleGenAI => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API key not found. Please set it in the application.');
  }
  return new GoogleGenAI({ apiKey });
};


interface GenerateImageOptions {
  prompt: string;
  negativePrompt?: string;
  mode: AppMode;
  createFn?: CreateFunction;
  editFn?: EditFunction;
  renderInputType?: RenderInputType;
  renderFidelity?: number;
  image1?: ImageFile | null;
  image2?: ImageFile | null;
  maskImage?: string | null; // base64 mask image
  batchSize?: number;
  aspectRatio?: AspectRatio;
  onProgress?: (current: number, total: number) => void;
}

function getSystemPrompt(mode: AppMode, createFn?: CreateFunction, editFn?: EditFunction, renderInputType?: RenderInputType, renderFidelity: number = 75, hasMask: boolean = false): string {
  let basePrompt: string;
  switch (mode) {
    case AppMode.CREATE:
        switch (createFn) {
          case CreateFunction.STICKER:
            basePrompt = 'You are an expert sticker designer. Create a vibrant, high-quality sticker based on the user prompt. The sticker should have a distinct, clean outline (often white or black) to make it stand out, and it should look good on any background. The main subject should be clear and appealing.';
            break;
          case CreateFunction.LOGO:
            basePrompt = 'You are a professional logo designer. Create a clean, modern, and memorable logo based on the user prompt. The design must be simple enough to be scalable and recognizable. Generate the logo on a plain, solid white background unless specified otherwise by the user.';
            break;
          case CreateFunction.COMIC:
            basePrompt = 'You are a comic book artist. Illustrate a single, dynamic comic book panel based on the user prompt. Use bold outlines, dramatic shading (cross-hatching, screentones), and a vibrant color palette typical of American comics.';
            break;
          case CreateFunction.SKETCH:
            basePrompt = 'You are a talented sketch artist. Create a detailed and realistic pencil sketch based on the user description. The style should feature clear lines, shading (hatching, gradients), and texture, as if drawn on paper. The final image must be in black and white or grayscale tones.';
            break;
          case CreateFunction.PATTERN:
            basePrompt = 'You are an expert pattern designer. Create a beautiful, high-resolution, seamlessly tileable pattern based on the user\'s request. The final image must be perfectly repeatable, meaning the right edge connects flawlessly with the left edge, and the top edge connects flawlessly with the bottom edge.';
            break;
          case CreateFunction.FREE:
          default:
            basePrompt = 'You are a helpful and creative AI image generation assistant.';
            break;
        }
        break;

    case AppMode.EDIT:
        switch (editFn) {
          case EditFunction.ADD_REMOVE:
            if (hasMask) {
              basePrompt = 'You are an expert digital artist performing a high-precision inpainting task. The user has provided an image and a corresponding mask. Your ONLY job is to modify the image based on the user\'s text prompt. CRITICAL DIRECTIVE: All modifications MUST be strictly confined to the white areas of the mask. The black areas of the mask are protected and MUST NOT be altered in any way. Ensure the final result is seamless, realistic, and perfectly blended with the original image content at the mask boundaries.';
            } else {
              basePrompt = 'You are an expert photo editor. Modify the user-provided image according to the text prompt. The prompt will specify what to add or remove. The AI should intelligently determine the best location for the change if not specified. Make the edit seamless and realistic.';
            }
            break;
          case EditFunction.RETOUCH:
            basePrompt = 'You are a professional photo retoucher. Subtly enhance or correct the user-provided image based on their instructions. Focus on improving quality, adjusting colors, or fixing minor imperfections.';
            break;
          case EditFunction.STYLE:
            basePrompt = 'You are a master of artistic styles. Re-imagine the user-provided image in the new artistic style described in the prompt. The composition should remain the same, but the visual style should be completely transformed.';
            break;
          case EditFunction.COMPOSE:
            basePrompt = 'You are a skilled digital compositor. Combine, blend, or merge the two user-provided images as described in the prompt. The goal is to create a single, cohesive new image from the elements of the two originals.';
            break;
          default:
            basePrompt = 'You are a helpful and creative AI image editing assistant.';
            break;
        }
        // Add a strict directive to prevent conversational text responses.
        return `${basePrompt} Your output must be only the image. Do not include any text, chat, or explanations in your response.`;

    case AppMode.RENDER:
        basePrompt = `You are a world-class architectural and interior design rendering engine. Your task is to transform a basic input image into a photorealistic, high-fidelity render.`;

        let fidelityInstruction: string;
        if (renderFidelity >= 80) {
            fidelityInstruction = "You must strictly adhere to the geometry, layout, and perspective of the user-provided image. Do not change the composition.";
        } else if (renderFidelity < 40) {
            fidelityInstruction = "Use the user-provided image as a primary inspiration. You have significant creative freedom to reinterpret the scene, suggesting alternative materials, lighting, or even minor compositional changes while maintaining the core concept.";
        } else {
            fidelityInstruction = "Use the provided image as a strong structural and compositional base. You have some freedom to refine details, textures, and lighting to enhance realism, but the main structure should be preserved.";
        }

        basePrompt += ` ${fidelityInstruction}`;

        switch(renderInputType) {
            case RenderInputType.SKETCH:
                basePrompt += ` The user has provided a line-art sketch. Your job is to add realistic materials, textures, lighting, and shadows based on the user's text prompt to bring the scene to life.`;
                break;
            case RenderInputType.BASIC_MODEL:
                basePrompt += ` The user has provided a basic 3D model with simple colors and shading. Your job is to replace the basic materials with the high-quality, realistic textures described in the user's prompt. Implement advanced, physically-based lighting, including soft shadows, reflections, and ambient occlusion to create a photorealistic final image.`;
                break;
            case RenderInputType.FLOOR_PLAN:
                basePrompt += ` The user has provided a 2D floor plan. Your job is to extrude this plan into a 3D photorealistic interior render. Interpret the room layouts, furniture placements, and symbols (like doors and windows) from the plan. Then, apply realistic materials, textures, lighting, and shadows based on the user's text prompt to create a high-quality, eye-level perspective view of the space.`;
                break;
        }
        return `${basePrompt} Your output must be only the image. Do not include any text, chat, or explanations in your response.`;
    case AppMode.VIDEO:
        basePrompt = `You are an expert video animator. Based on the user's starting image and text prompt, create a short, high-quality, seamless video animation. The animation should be smooth and visually appealing.`;
        return basePrompt;
  }
  return basePrompt;
}

export const generateImageApi = async (options: GenerateImageOptions): Promise<string[]> => {
  const { prompt, negativePrompt, mode, createFn, editFn, renderInputType, renderFidelity, image1, image2, maskImage, batchSize, aspectRatio, onProgress } = options;
  const fullNegativePrompt = negativePrompt ? ` Negative prompt (what to avoid): "${negativePrompt}"` : '';


  if (mode === AppMode.CREATE) {
    const systemPrompt = getSystemPrompt(mode, createFn, editFn);
    const fullPrompt = `${systemPrompt}. User's request: "${prompt}".${fullNegativePrompt}`;

    const generateRequest = () => getGenAIClient().models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: fullPrompt,
      config: {
        numberOfImages: 1, // The API generates one image per request in this configuration
        outputMimeType: 'image/jpeg',
        aspectRatio: aspectRatio || '1:1',
      },
    });

    const effectiveBatchSize = batchSize || 1;

    try {
      const imageResults: string[] = [];
      for (let i = 0; i < effectiveBatchSize; i++) {
        onProgress?.(i + 1, effectiveBatchSize);
        const response = await generateRequest();
        const imagesFromResponse = response.generatedImages
          ?.map(img => img.image?.imageBytes)
          .filter((data): data is string => !!data) || [];
        imageResults.push(...imagesFromResponse);
      }
      
      if (imageResults.length === 0) {
        throw new Error('The API did not return any images for the creation batch.');
      }
      return imageResults;
    } catch (error: any) {
        const errorString = error.toString();
        if (errorString.includes('API key not valid') || errorString.includes('API_KEY_INVALID')) {
             throw new Error(`Image generation API failed: API key not valid.`);
        }
        if (errorString.includes('SAFETY')) {
             throw new Error(`Your request was blocked for safety reasons. Please adjust your prompt.`);
        }
        if (errorString.includes('RESOURCE_EXHAUSTED') || errorString.includes('quota')) {
            throw new Error('You have exceeded your current API quota. Please check your plan and billing details in Google AI Studio.');
        }
        if (error instanceof Error) {
            throw new Error(`Image generation API failed: ${error.message}`);
        }
        throw new Error('An unknown error occurred during image generation.');
    }
  }

  // --- EDIT & RENDER MODE ---
  const systemInstruction = getSystemPrompt(mode, createFn, editFn, renderInputType, renderFidelity, !!maskImage);
  const userPrompt = `User's request: "${prompt}".${fullNegativePrompt}`;
  const parts: Part[] = [];

  const addImagePart = (image: ImageFile | { base64: string, mimeType: string }) => {
    parts.unshift({
      inlineData: {
        mimeType: 'file' in image ? (image.file?.type || 'image/png') : image.mimeType,
        data: image.base64,
      },
    });
  };
  
  if (maskImage) {
    addImagePart({ base64: maskImage, mimeType: 'image/png' });
  }
  if (mode === AppMode.EDIT && editFn === EditFunction.COMPOSE) {
    if (image2) addImagePart(image2);
    if (image1) addImagePart(image1);
  } else {
    if (image1) addImagePart(image1);
  }
  // Add text part last
  parts.push({ text: userPrompt });

  const canBatch = (mode === AppMode.EDIT && (editFn === EditFunction.ADD_REMOVE || editFn === EditFunction.RETOUCH || editFn === EditFunction.STYLE)) || mode === AppMode.RENDER;
  const effectiveBatchSize = canBatch ? (batchSize || 1) : 1;

  try {
    const makeRequest = async (): Promise<string> => {
        const response = await getGenAIClient().models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts },
            config: {
                systemInstruction: systemInstruction,
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        if (response.promptFeedback?.blockReason) {
            const reason = response.promptFeedback.blockReason.replace(/_/g, ' ').toLowerCase();
            throw new Error(`Your request was blocked due to ${reason}. Please adjust your image or prompt.`);
        }

        const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

        if (imagePart?.inlineData?.data) {
            return imagePart.inlineData.data;
        }

        const textResponse = response.text;
        throw new Error(`The API did not return an image. Text response: ${textResponse || 'No text response.'}`);
    };

    if (effectiveBatchSize > 1) {
        const imageResults: string[] = [];
        for (let i = 0; i < effectiveBatchSize; i++) {
            onProgress?.(i + 1, effectiveBatchSize);
            const imageData = await makeRequest();
            imageResults.push(imageData);
        }
        return imageResults;
    } else {
        onProgress?.(1, 1);
        const imageData = await makeRequest();
        return [imageData];
    }
  } catch (error: any) {
    const errorString = error.toString();
    if (errorString.includes('API key not valid') || errorString.includes('API_KEY_INVALID')) {
         throw new Error(`Image generation API failed: API key not valid.`);
    }
    if (errorString.includes('SAFETY') || errorString.includes('blocked due to')) {
         throw new Error(`Your request was blocked for safety reasons. Please adjust your prompt or image.`);
    }
    if (errorString.includes('RESOURCE_EXHAUSTED') || errorString.includes('quota')) {
        throw new Error('You have exceeded your current API quota. Please check your plan and billing details in Google AI Studio.');
    }
    if (errorString.includes('Invalid argument') || errorString.includes('image decoding failed')) {
        throw new Error('The provided image is invalid or not supported by the API. Try using a standard image format (PNG, JPG) or a different image.');
    }
    if (error instanceof Error) {
        if (error.message.startsWith('The API')) throw error;
        throw new Error(`Image generation API failed: ${error.message}`);
    }
    throw new Error('An unknown error occurred during image generation.');
  }
};

interface GenerateVideoOptions {
    prompt: string;
    negativePrompt?: string;
    image?: ImageFile | null;
}

export const generateVideoApi = async (options: GenerateVideoOptions): Promise<string> => {
    const { prompt, negativePrompt, image } = options;
    
    const fullPrompt = `${getSystemPrompt(AppMode.VIDEO)}. User's request: "${prompt}".${negativePrompt ? ` Negative prompt (what to avoid): "${negativePrompt}"` : ''}`;

    try {
        const ai = getGenAIClient();
        let operation = await ai.models.generateVideos({
            model: 'veo-2.0-generate-001',
            prompt: fullPrompt,
            ...(image && {
              image: {
                imageBytes: image.base64,
                mimeType: image.file.type || 'image/png',
              }
            }),
            config: {
                numberOfVideos: 1,
            },
        });

        // Poll for the result
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for 10 seconds
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error('The API did not return a download link for the video.');
        }

        const apiKey = getApiKey();
        if (!apiKey) throw new Error("API key not found for downloading video.");

        const response = await fetch(`${downloadLink}&key=${apiKey}`);
        if (!response.ok) {
            throw new Error(`Failed to download the video. Status: ${response.statusText}`);
        }

        const videoBlob = await response.blob();
        return URL.createObjectURL(videoBlob);
    } catch (error: any) {
        const errorString = error.toString();
        if (errorString.includes('API key not valid')) {
            throw new Error(`Video generation API failed: API key not valid.`);
        }
        if (errorString.includes('SAFETY')) {
            throw new Error(`Your video request was blocked for safety reasons. Please adjust the prompt.`);
        }
        if (errorString.includes('RESOURCE_EXHAUSTED') || errorString.includes('quota')) {
            throw new Error('You have exceeded your current API quota. Please check your plan and billing details in Google AI Studio.');
        }
        if (error instanceof Error) {
            throw new Error(`Video generation API failed: ${error.message}`);
        }
        throw new Error('An unknown error occurred during video generation.');
    }
};


export const enhancePromptApi = async (prompt: string): Promise<string> => {
    if (!prompt.trim()) {
        return prompt;
    }

    const systemInstruction = `Enhance the user's prompt for an AI image generator, adding vivid details about art style, lighting, composition, and emotion. CRITICAL: Detect the original prompt language (Portuguese or English) and keep the enhanced prompt IN THE SAME LANGUAGE. Your response MUST contain ONLY the enhanced prompt, with no other words, explanations, or formatting.`;

    try {
        const response = await getGenAIClient().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Original prompt: "${prompt}"`,
            config: {
              systemInstruction: systemInstruction,
            }
        });
        const enhancedPrompt = response.text?.trim();
        if (enhancedPrompt) {
            return enhancedPrompt;
        }
        throw new Error('The API did not return an enhanced prompt.');
    } catch (error: any) {
        console.error("Failed to enhance prompt:", error);
        const errorString = error.toString();
        if (errorString.includes('RESOURCE_EXHAUSTED') || errorString.includes('quota')) {
            throw new Error('You have exceeded your current API quota. Please check your plan and billing details in Google AI Studio.');
        }
        throw new Error(`Failed to enhance prompt: ${error.message || 'Unknown error'}`);
    }
};

export const translatePromptApi = async (prompt: string): Promise<string> => {
    if (!prompt.trim()) {
        return prompt;
    }

    const systemInstruction = `You are a bilingual translator for AI image generator prompts. If the prompt is in Portuguese, translate it to English. If it's in English, translate it to Portuguese. CRITICAL: Your response MUST contain ONLY the translated prompt, with no other words, explanations, or quotes.`;

    try {
        const response = await getGenAIClient().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
              systemInstruction: systemInstruction,
            }
        });
        const translatedPrompt = response.text?.trim();
        if (translatedPrompt) {
            return translatedPrompt;
        }
        throw new Error('The API did not return a translated prompt.');
    } catch (error: any) {
        console.error("Failed to translate prompt:", error);
        const errorString = error.toString();
        if (errorString.includes('RESOURCE_EXHAUSTED') || errorString.includes('quota')) {
            throw new Error('You have exceeded your current API quota. Please check your plan and billing details in Google AI Studio.');
        }
        throw new Error(`Failed to translate prompt: ${error.message || 'Unknown error'}`);
    }
};