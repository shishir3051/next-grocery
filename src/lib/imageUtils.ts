/**
 * Utility to fetch an image from a URL and convert it to a Base64 string.
 * This is used to store 'real' images in the MongoDB database as requested.
 */
export async function getBase64FromUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error(`Error converting image to base64 (${url}):`, error);
    return null;
  }
}

// Alias for flexibility/consistency in previous imports
export const downloadImageAsBase64 = getBase64FromUrl;
