// Media processing utilities for FANZ platforms

// File type checking
export const isImage = (file: File): boolean => {
  return file.type.startsWith('image/');
};

export const isVideo = (file: File): boolean => {
  return file.type.startsWith('video/');
};

export const isAudio = (file: File): boolean => {
  return file.type.startsWith('audio/');
};

// Supported file types for FANZ platforms
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif'
];

export const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo' // .avi
];

export const SUPPORTED_AUDIO_TYPES = [
  'audio/mp3',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/aac'
];

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  image: 50 * 1024 * 1024, // 50MB
  video: 500 * 1024 * 1024, // 500MB  
  audio: 100 * 1024 * 1024, // 100MB
  document: 25 * 1024 * 1024 // 25MB
};

// Image processing utilities
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    if (!isImage(file)) {
      reject(new Error('File is not an image'));
      return;
    }
    
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};

export const resizeImage = (
  file: File, 
  maxWidth: number, 
  maxHeight: number, 
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (!isImage(file)) {
      reject(new Error('File is not an image'));
      return;
    }
    
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(resizedFile);
          } else {
            reject(new Error('Failed to resize image'));
          }
        },
        file.type,
        quality
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Generate thumbnail from image
export const generateImageThumbnail = (
  file: File, 
  size: number = 300
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!isImage(file)) {
      reject(new Error('File is not an image'));
      return;
    }
    
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    img.onload = () => {
      // Make square thumbnail
      canvas.width = size;
      canvas.height = size;
      
      // Calculate crop area (center crop)
      const { width, height } = img;
      const minDimension = Math.min(width, height);
      const x = (width - minDimension) / 2;
      const y = (height - minDimension) / 2;
      
      ctx.drawImage(img, x, y, minDimension, minDimension, 0, 0, size, size);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Generate thumbnail from video
export const generateVideoThumbnail = (
  file: File, 
  time: number = 1, // seconds
  size: number = 300
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!isVideo(file)) {
      reject(new Error('File is not a video'));
      return;
    }
    
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    video.addEventListener('loadedmetadata', () => {
      canvas.width = size;
      canvas.height = (size * video.videoHeight) / video.videoWidth;
      
      video.currentTime = Math.min(time, video.duration);
    });
    
    video.addEventListener('seeked', () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(video.src);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    });
    
    video.addEventListener('error', () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video'));
    });
    
    video.src = URL.createObjectURL(file);
  });
};

// Get video metadata
export const getVideoMetadata = (file: File): Promise<{
  duration: number;
  width: number;
  height: number;
  hasAudio: boolean;
}> => {
  return new Promise((resolve, reject) => {
    if (!isVideo(file)) {
      reject(new Error('File is not a video'));
      return;
    }
    
    const video = document.createElement('video');
    
    video.addEventListener('loadedmetadata', () => {
      const metadata = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        hasAudio: video.mozHasAudio || 
                  Boolean(video.webkitAudioDecodedByteCount) || 
                  Boolean(video.audioTracks?.length)
      };
      
      URL.revokeObjectURL(video.src);
      resolve(metadata);
    });
    
    video.addEventListener('error', () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    });
    
    video.src = URL.createObjectURL(file);
  });
};

// Get audio metadata  
export const getAudioMetadata = (file: File): Promise<{
  duration: number;
  hasMetadata: boolean;
}> => {
  return new Promise((resolve, reject) => {
    if (!isAudio(file)) {
      reject(new Error('File is not audio'));
      return;
    }
    
    const audio = document.createElement('audio');
    
    audio.addEventListener('loadedmetadata', () => {
      const metadata = {
        duration: audio.duration,
        hasMetadata: true
      };
      
      URL.revokeObjectURL(audio.src);
      resolve(metadata);
    });
    
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(audio.src);
      reject(new Error('Failed to load audio metadata'));
    });
    
    audio.src = URL.createObjectURL(file);
  });
};

// File validation for FANZ platforms
export const validateMediaFile = (file: File): {
  isValid: boolean;
  errors: string[];
  type: 'image' | 'video' | 'audio' | 'unknown';
} => {
  const errors: string[] = [];
  let type: 'image' | 'video' | 'audio' | 'unknown' = 'unknown';
  
  // Determine file type
  if (isImage(file)) {
    type = 'image';
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      errors.push('Image format not supported');
    }
    if (file.size > FILE_SIZE_LIMITS.image) {
      errors.push(`Image too large (max ${FILE_SIZE_LIMITS.image / 1024 / 1024}MB)`);
    }
  } else if (isVideo(file)) {
    type = 'video';
    if (!SUPPORTED_VIDEO_TYPES.includes(file.type)) {
      errors.push('Video format not supported');
    }
    if (file.size > FILE_SIZE_LIMITS.video) {
      errors.push(`Video too large (max ${FILE_SIZE_LIMITS.video / 1024 / 1024}MB)`);
    }
  } else if (isAudio(file)) {
    type = 'audio';
    if (!SUPPORTED_AUDIO_TYPES.includes(file.type)) {
      errors.push('Audio format not supported');
    }
    if (file.size > FILE_SIZE_LIMITS.audio) {
      errors.push(`Audio too large (max ${FILE_SIZE_LIMITS.audio / 1024 / 1024}MB)`);
    }
  } else {
    errors.push('File type not supported');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    type
  };
};

// URL utilities
export const createObjectURL = (file: File): string => {
  return URL.createObjectURL(file);
};

export const revokeObjectURL = (url: string): void => {
  URL.revokeObjectURL(url);
};

// Download file from URL
export const downloadFile = (url: string, filename: string): void => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Convert data URL to File
export const dataURLToFile = (dataURL: string, filename: string): File => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Generate unique filename to prevent collisions
export const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  
  return `${nameWithoutExt}-${timestamp}-${randomString}.${extension}`;
};