import { generateImagePollinations, searchImagesUnsplash } from './providers/pollinations';
import { generateImage } from './providers/openai';
import { getCachedContent, setCachedContent, generateInputHash } from './cache';

export async function generateImageForWord(
  word: string,
  language: string,
  options: {
    style?: 'illustration' | 'photo' | 'minimal';
    width?: number;
    height?: number;
  } = {}
): Promise<string> {
  const style = options.style || 'illustration';
  const width = options.width || 512;
  const height = options.height || 512;

  const cacheKey = generateInputHash({ word, language, style, width, height, type: 'word_image' });
  const cached = await getCachedContent('image', cacheKey);
  
  if (cached) return cached as string;

  let imageUrl: string;

  const prompts: Record<string, string> = {
    illustration: `Clean educational illustration of "${word}" for ${language} language learning. Simple, colorful, clear visual representation. White background.`,
    photo: `Professional photo of "${word}" for ${language} language learning. High quality, well-lit, clear subject.`,
    minimal: `Minimalist flat design icon of "${word}" for ${language} learning. Simple shapes, 2-3 colors, clean lines.`,
  };

  try {
    imageUrl = await generateImageWithFallback(prompts[style], width, height);
  } catch (error) {
    console.error('Image generation failed:', error);
    imageUrl = getPlaceholderImage(word);
  }

  await setCachedContent('image', cacheKey, imageUrl, language, word);
  return imageUrl;
}

async function generateImageWithFallback(prompt: string, width: number, height: number): Promise<string> {
  try {
    const urls = await generateImagePollinations(prompt, { width, height, model: 'flux' });
    if (urls[0]) return urls[0];
  } catch {
    console.log('Pollinations failed, trying DALL-E');
  }

  try {
    const urls = await generateImage(prompt, { size: `${width}x${height}` as '1024x1024' | '1792x1024' | '1024x1792' });
    if (urls[0]) return urls[0];
  } catch {
    console.log('DALL-E failed, trying Unsplash');
  }

  try {
    const urls = await searchImagesUnsplash(prompt, { perPage: 1 });
    if (urls[0]) return urls[0];
  } catch {
    console.log('Unsplash failed');
  }

  throw new Error('All image providers failed');
}

function getPlaceholderImage(word: string): string {
  const encoded = encodeURIComponent(word);
  return `https://via.placeholder.com/512x512/4F46E5/FFFFFF?text=${encoded}`;
}

export async function generateImagesForChallenge(
  options: Array<{ text: string; imagePrompt?: string | null }>,
  language: string
): Promise<string[]> {
  const imagePromises = options.map(async (opt) => {
    if (!opt.imagePrompt) return '';
    return generateImageForWord(opt.imagePrompt, language, { style: 'illustration' });
  });

  return Promise.all(imagePromises);
}