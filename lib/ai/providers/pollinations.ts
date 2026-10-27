export async function generateImagePollinations(
  prompt: string,
  options: {
    width?: number;
    height?: number;
    model?: 'flux' | 'gptimage' | 'turbo';
    seed?: number;
    nologo?: boolean;
    private?: boolean;
    enhance?: boolean;
  } = {}
): Promise<string[]> {
  const width = options.width || 1024;
  const height = options.height || 1024;
  const model = options.model || 'flux';
  const seed = options.seed || Math.floor(Math.random() * 1000000);
  const nologo = options.nologo !== false;
  const private_ = options.private !== false;
  const enhance = options.enhance !== false;

  const params = new URLSearchParams({
    prompt,
    width: width.toString(),
    height: height.toString(),
    model,
    seed: seed.toString(),
    nologo: nologo.toString(),
    private: private_.toString(),
    enhance: enhance.toString(),
  });

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params.toString()}`;
  
  return [url];
}

export async function searchImagesUnsplash(
  query: string,
  options: {
    perPage?: number;
    orientation?: 'landscape' | 'portrait' | 'squarish';
  } = {}
): Promise<string[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    console.warn('UNSPLASH_ACCESS_KEY not set, skipping Unsplash search');
    return [];
  }

  const perPage = options.perPage || 5;
  const orientation = options.orientation || 'squarish';

  interface UnsplashPhoto {
    urls: {
      regular: string;
    };
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=${orientation}`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();
    return data.results.map((photo: UnsplashPhoto) => photo.urls.regular);
  } catch {
    console.error('Unsplash search failed');
    return [];
  }
}