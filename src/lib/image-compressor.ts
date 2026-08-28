/**
 * Utility for client-side image compression using HTML5 Canvas API.
 * Resizes and crops images to a square aspect ratio and compresses to WebP/JPEG Data URL.
 * Output file size is extremely lightweight (~5 KB - 15 KB).
 */

export async function compressImage(
  file: File,
  targetWidth = 250,
  targetHeight = 250,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Không thể đọc tệp hình ảnh."));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Hình ảnh không hợp lệ hoặc bị hỏng."));
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            return reject(new Error("Trình duyệt không hỗ trợ Canvas API."));
          }

          // Enable smooth image scaling
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          // Calculate center crop (object-fit: cover logic)
          const srcWidth = img.naturalWidth || img.width;
          const srcHeight = img.naturalHeight || img.height;
          let drawWidth = srcWidth;
          let drawHeight = srcHeight;
          let offsetX = 0;
          let offsetY = 0;

          if (srcWidth > srcHeight) {
            drawWidth = srcHeight;
            offsetX = (srcWidth - srcHeight) / 2;
          } else {
            drawHeight = srcWidth;
            offsetY = (srcHeight - srcWidth) / 2;
          }

          // Draw cropped & scaled image onto canvas
          ctx.drawImage(
            img,
            offsetX,
            offsetY,
            drawWidth,
            drawHeight,
            0,
            0,
            targetWidth,
            targetHeight
          );

          // Try WebP first for maximum compression efficiency
          let dataUrl = canvas.toDataURL("image/webp", quality);
          if (!dataUrl.startsWith("data:image/webp")) {
            // Fallback to JPEG if WebP is unsupported by browser
            dataUrl = canvas.toDataURL("image/jpeg", quality);
          }

          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };

      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };

    reader.readAsDataURL(file);
  });
}
