import imageCompression from 'browser-image-compression';

const MAX_SOURCE_IMAGE_SIZE_MB = 15;
const MAX_OPTIMIZED_IMAGE_SIZE_MB = 4;
const MAX_OPTIMIZED_IMAGE_SIZE_BYTES = MAX_OPTIMIZED_IMAGE_SIZE_MB * 1024 * 1024;
const MAX_DIMENSION = 2400;

export const optimizeImage = async (file, options = {}) => {
  // 1. Check source file size first
  if (file.size > MAX_SOURCE_IMAGE_SIZE_MB * 1024 * 1024) {
    throw new Error(`Source image must be less than ${MAX_SOURCE_IMAGE_SIZE_MB} MB`);
  }

  const originalDetails = {
    name: file.name,
    size: file.size,
    type: file.type,
  };

  // 2. Get original dimensions
  let originalWidth, originalHeight;
  try {
    const img = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        originalWidth = img.width;
        originalHeight = img.height;
        resolve(img);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  } catch (e) {
    originalWidth = null;
    originalHeight = null;
  }

  // 3. Define compression attempt with bounded retries
  const qualitySteps = [0.85, 0.75, 0.65, 0.55];
  let compressedFile = null;
  let finalWidth = MAX_DIMENSION;
  let finalHeight = MAX_DIMENSION;

  for (let i = 0; i < qualitySteps.length; i++) {
    const quality = qualitySteps[i];
    const compressionOptions = {
      maxSizeMB: MAX_OPTIMIZED_IMAGE_SIZE_MB,
      maxWidthOrHeight: i === qualitySteps.length - 1 ? Math.floor(MAX_DIMENSION * 0.75) : MAX_DIMENSION,
      useWebWorker: true,
      fileType: 'image/webp',
      initialQuality: quality,
      onProgress: (progress) => {
        if (import.meta.env.DEV) {
          console.log(`[Image Optimization] Progress: ${Math.round(progress * 100)}%`);
        }
      },
    };

    try {
      compressedFile = await imageCompression(file, compressionOptions);
      
      if (compressedFile.size <= MAX_OPTIMIZED_IMAGE_SIZE_BYTES) {
        break;
      }
    } catch (e) {
      if (i === qualitySteps.length - 1) {
        throw new Error('Failed to optimize image to required size');
      }
    }
  }

  // 4. If even after all quality steps still too big, reduce dimensions further
  if (compressedFile && compressedFile.size > MAX_OPTIMIZED_IMAGE_SIZE_BYTES) {
    const fallbackOptions = {
      maxSizeMB: MAX_OPTIMIZED_IMAGE_SIZE_MB,
      maxWidthOrHeight: Math.floor(MAX_DIMENSION * 0.6),
      useWebWorker: true,
      fileType: 'image/webp',
      initialQuality: 0.5,
    };
    compressedFile = await imageCompression(file, fallbackOptions);
  }

  // 5. Verify final size
  if (!compressedFile || compressedFile.size > MAX_OPTIMIZED_IMAGE_SIZE_BYTES) {
    throw new Error(`Failed to optimize image below ${MAX_OPTIMIZED_IMAGE_SIZE_MB} MB`);
  }

  // 6. Get optimized dimensions
  let optimizedWidth, optimizedHeight;
  try {
    const img = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
      optimizedWidth = img.width;
      optimizedHeight = img.height;
        resolve(img);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(compressedFile);
    });
  } catch (e) {
    optimizedWidth = null;
    optimizedHeight = null;
  }

  // 7. Ensure file has .webp extension
  const originalName = file.name.replace(/\.[^/.]+$/, '');
  const webpFileName = `${originalName}.webp`;
  const webpFile = new File([compressedFile], webpFileName, { type: 'image/webp' });

  // 8. Verify MIME type is webp
  if (import.meta.env.DEV) {
    console.log('[Image Optimization] Original image:', {
      ...originalDetails,
      width: originalWidth,
      height: originalHeight,
    });
    console.log('[Image Optimization] Optimized image:', {
      name: webpFile.name,
      size: webpFile.size,
      type: webpFile.type,
      width: optimizedWidth,
      height: optimizedHeight,
      compressionRatio: ((1 - webpFile.size / file.size) * 100).toFixed(1) + '%',
    });
  }

  return {
    file: webpFile,
    originalWidth,
    originalHeight,
    optimizedWidth,
    optimizedHeight,
    originalSize: file.size,
    optimizedSize: webpFile.size,
  };
};

export const constants = {
  MAX_SOURCE_IMAGE_SIZE_MB,
  MAX_OPTIMIZED_IMAGE_SIZE_MB,
};
