// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password strength validation
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Username validation
export const isValidUsername = (username: string): boolean => {
  // Must be 3-20 characters, alphanumeric and underscores only
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// Display name validation
export const isValidDisplayName = (displayName: string): boolean => {
  // Must be 1-50 characters, no special characters except spaces, hyphens, apostrophes
  const displayNameRegex = /^[a-zA-Z0-9\s\-']{1,50}$/;
  return displayNameRegex.test(displayName.trim());
};

// URL validation
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Phone number validation (international format)
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Age validation (18+ required for FANZ platforms)
export const isValidAge = (birthDate: string | Date): boolean => {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1 >= 18;
  }
  
  return age >= 18;
};

// File validation
export const validateFile = (file: File, options: {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  maxWidth?: number;
  maxHeight?: number;
}): Promise<{ isValid: boolean; errors: string[] }> => {
  return new Promise((resolve) => {
    const errors: string[] = [];
    const { maxSize = 50 * 1024 * 1024, allowedTypes, maxWidth, maxHeight } = options;
    
    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size must be less than ${maxSize / 1024 / 1024}MB`);
    }
    
    // Check file type
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }
    
    // If it's an image, check dimensions
    if (file.type.startsWith('image/') && (maxWidth || maxHeight)) {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        if (maxWidth && img.width > maxWidth) {
          errors.push(`Image width must be less than ${maxWidth}px`);
        }
        if (maxHeight && img.height > maxHeight) {
          errors.push(`Image height must be less than ${maxHeight}px`);
        }
        
        URL.revokeObjectURL(url);
        resolve({ isValid: errors.length === 0, errors });
      };
      
      img.onerror = () => {
        errors.push('Invalid image file');
        URL.revokeObjectURL(url);
        resolve({ isValid: false, errors });
      };
      
      img.src = url;
    } else {
      resolve({ isValid: errors.length === 0, errors });
    }
  });
};

// Form validation helper
export const createValidator = <T extends Record<string, any>>(
  rules: Record<keyof T, (value: any) => string | null>
) => {
  return (data: T): { isValid: boolean; errors: Partial<Record<keyof T, string>> } => {
    const errors: Partial<Record<keyof T, string>> = {};
    
    for (const [field, rule] of Object.entries(rules)) {
      const error = rule(data[field as keyof T]);
      if (error) {
        errors[field as keyof T] = error;
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
};

// Content validation for adult platform
export const validateContent = (content: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check for prohibited content (basic checks)
  const prohibitedKeywords = [
    'underage', 'minor', 'child', 'kid',
    'school', 'student', 'teen', 'young'
  ];
  
  const lowerContent = content.toLowerCase();
  for (const keyword of prohibitedKeywords) {
    if (lowerContent.includes(keyword)) {
      errors.push('Content contains prohibited terms');
      break;
    }
  }
  
  // Check content length
  if (content.trim().length === 0) {
    errors.push('Content cannot be empty');
  }
  
  if (content.length > 2000) {
    errors.push('Content must be less than 2000 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Simplified exports for RegisterModal compatibility
export { isValidEmail as validateEmail };
export { isValidUsername as validateUsername };

// Simple boolean validator for password (compatibility)
export function validatePasswordSimple(password: string): boolean {
  return validatePassword(password).isValid;
}