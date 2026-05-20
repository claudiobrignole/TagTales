/**
 * Utility to compress images client-side before uploading.
 * Resizes to standard max boundaries, converts to WebP format, and optimizes quality to ~80%.
 */
export async function compressImage(
  file: File,
  maxDimension: number = 1920,
  quality: number = 0.8
): Promise<File> {
  // If not an image, return as-is
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // Skip SVG animations and vectors
  if (file.type === 'image/svg+xml') {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Apply max dimension constraints
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // fallback to original
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file); // fallback to original
              return;
            }
            
            // Create a new file with the compressed WebP blob
            const lastDotIndex = file.name.lastIndexOf('.');
            const originalNameWithoutExt = lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name;
            const compressedFile = new File([blob], `${originalNameWithoutExt}.webp`, {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            
            console.log(
              `[ImageCompressor] Compressed ${file.name} (${(file.size / 1024).toFixed(1)} KB) -> ${compressedFile.name} (${(compressedFile.size / 1024).toFixed(1)} KB) | Saved: ${(((file.size - compressedFile.size) / file.size) * 100).toFixed(0)}%`
            );
            resolve(compressedFile);
          },
          'image/webp',
          quality
        );
      };
      
      img.onerror = () => {
        resolve(file); // fallback
      };
    };
    
    reader.onerror = () => {
      resolve(file); // fallback
    };
  });
}
