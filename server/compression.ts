import sharp from 'sharp';

// Compress image to target size (~1MB for photos)
export async function compressImage(base64Data: string, targetMB = 1): Promise<string> {
  let quality = 80;
  let base64Only = base64Data;
  
  if (base64Data.includes(',')) {
    base64Only = base64Data.split(',')[1];
  }
  
  const buffer = Buffer.from(base64Only, 'base64');
  
  // Try compression with decreasing quality until target size
  while (quality >= 20) {
    const compressed = await sharp(buffer)
      .resize(1280, 1280, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality, progressive: true })
      .toBuffer();
    
    const compressedDataUrl = `data:image/jpeg;base64,${compressed.toString('base64')}`;
    const sizeMB = Buffer.byteLength(compressedDataUrl) / 1024 / 1024;
    
    if (sizeMB <= targetMB) {
      return compressedDataUrl;
    }
    
    quality -= 5;
  }
  
  // Return best attempt if can't reach target
  const final = await sharp(buffer)
    .resize(1280, 1280, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({ quality: 20, progressive: true })
    .toBuffer();
  
  return `data:image/jpeg;base64,${final.toString('base64')}`;
}

// Compress video - target ~15MB per video to fit in 512MB storage
// For now, we'll just accept it as-is since video compression requires FFmpeg
// which is more complex. Users should upload smaller videos or we can add this later.
export async function getVideoSize(base64Data: string): Promise<number> {
  if (base64Data.includes(',')) {
    return Buffer.byteLength(base64Data.split(',')[1], 'base64');
  }
  return Buffer.byteLength(base64Data, 'base64');
}
