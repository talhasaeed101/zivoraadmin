import imageCompression from 'browser-image-compression';

export const optimizeImage = async (file, options = {}) => {
  const {
    maxWidthOrHeight = 2400,
    maxSizeMB = 4,
    initialQuality = 0.85,
    useWebp = true,
  } = options;

  const originalDetails = {
    name: file.name,
    size: file.size,
    type: file.type,
  };

  // Get original dimensions
  let originalWidth, originalHeight;
  try {
    const img = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
    originalWidth = img.width;
    originalHeight = img.height;
  } catch (e) {
    originalWidth = null;
    originalHeight = null;
  }

  // Compress image
  const compressionOptions = {
    maxSizeMB,
    maxWidthOrHeight,
    useWebp,
    webpQuality: initialQuality * 100,
    fileType: useWebp ? 'image/webp' : file.type,
    onProgress: (progress) => {
      console.log(`Image compression progress: ${Math.round(progress * 100)}%`);
    },
  };

  console.log('[Image Optimization] Original image:', {
    ...originalDetails,
    width: originalWidth,
    height: originalHeight,
  });

  const compressedFile = await imageCompression(file, compressionOptions);

  // Get optimized dimensions
  let optimizedWidth, optimizedHeight;
  try {
    const img = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(compressedFile);
    });
    optimizedWidth = img.width;
    optimizedHeight = img.height;
  } catch (e) {
    optimizedWidth = null;
    optimizedHeight = null;
  }

  console.log('[Image Optimization] Optimized image:', {
    name: compressedFile.name,
    size: compressedFile.size,
    type: compressedFile.type,
    width: optimizedWidth,
    height: optimizedHeight,
    compressionRatio: ((1 - compressedFile.size / file.size) * 100).toFixed(1) + '%',
  });

  return {
    file: compressedFile,
    originalWidth,
    originalHeight,
    optimizedWidth,
    optimizedHeight,
    originalSize: file.size,
    optimizedSize: compressedFile.size,
  };
};
