/**
 * Image compression and resizing utility for browser uploads.
 * Prevents localStorage QuotaExceededError and Supabase payload limits
 * by converting high-res files into optimized WebP/JPEG data URLs.
 */

export const compressImage = (
  fileOrDataUrl: File | Blob | string,
  maxWidth: number = 600,
  maxHeight: number = 600,
  quality: number = 0.85
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If it's a standard web URL (http/https), return as is
    if (typeof fileOrDataUrl === 'string' && (fileOrDataUrl.startsWith('http://') || fileOrDataUrl.startsWith('https://'))) {
      return resolve(fileOrDataUrl);
    }

    const processSrc = (src: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserved dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(width, 1);
        canvas.height = Math.max(height, 1);
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return resolve(src);
        }

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        try {
          // Prefer webp with fallback to jpeg
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch {
          resolve(src);
        }
      };

      img.onerror = () => {
        resolve(src);
      };

      img.src = src;
    };

    if (typeof fileOrDataUrl === 'string') {
      processSrc(fileOrDataUrl);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          processSrc(result);
        } else {
          reject(new Error('Failed to read image file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to load image file'));
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
};
