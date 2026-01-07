/**
 * Password strength object with visual properties
 */
export interface PasswordStrength {
  score: number;
  label: 'weak' | 'fair' | 'good' | 'strong';
  color: string;
}

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate name (min 2 characters)
 */
export const validateName = (name: string): boolean => {
  return name.trim().length >= 2;
};

/**
 * Validate password and return strength
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
  strength: PasswordStrength;
} => {
  const errors: string[] = [];
  let score = 0;

  // Check minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  } else {
    score += 1;
  }

  // Check for uppercase
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  // Check for lowercase
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 0.5;
  }

  // Check for numbers
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  // Check for special characters
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else {
    score += 1;
  }

  // Bonus for length
  if (password.length >= 12) {
    score += 0.5;
  }

  // Determine strength
  let strength: PasswordStrength;
  if (score < 2) {
    strength = { score: 0, label: 'weak', color: '#FF4444' };
  } else if (score < 3) {
    strength = { score: 1, label: 'fair', color: '#FF9800' };
  } else if (score < 4) {
    strength = { score: 2, label: 'good', color: '#8BC34A' };
  } else {
    strength = { score: 3, label: 'strong', color: '#02AA20' };
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
};

/**
 * Check if passwords match
 */
export const passwordsMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
};

/**
 * Get validation error message for a field
 */
export const getFieldError = (
  value: string,
  field: 'email' | 'name' | 'password' | 'confirmPassword',
  password?: string
): string | null => {
  switch (field) {
    case 'email':
      if (!value.trim()) return null; // Don't show error for empty field
      return validateEmail(value) ? null : 'Please enter a valid email address';
    
    case 'name':
      if (!value.trim()) return null;
      return validateName(value) ? null : 'Name must be at least 2 characters';
    
    case 'password':
      if (!value) return null;
      const { isValid, errors } = validatePassword(value);
      return isValid ? null : errors[0];
    
    case 'confirmPassword':
      if (!value || !password) return null;
      return passwordsMatch(password, value) ? null : 'Passwords do not match';
    
    default:
      return null;
  }
};
