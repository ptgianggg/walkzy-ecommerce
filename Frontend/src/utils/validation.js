// Validation helper functions

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  if (!email) {
    return 'Email không được để trống';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Email không hợp lệ';
  }
  return null;
};

/**
 * Validate password
 */
export const validatePassword = (password) => {
  if (!password) {
    return 'Mật khẩu là bắt buộc';
  }
  if (password.length < 6) {
    return 'Mật khẩu phải có ít nhất 6 ký tự';
  }
  return null;
};

/**
 * Validate confirm password
 */
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) {
    return 'Vui lòng xác nhận mật khẩu';
  }
  if (password !== confirmPassword) {
    return 'Mật khẩu không trùng khớp';
  }
  return null;
};

/**
 * Real-time email validation
 */
export const validateEmailRealTime = (email, touched) => {
  if (!touched && !email) {
    return null; // Don't show error until user interacts
  }
  return validateEmail(email);
};

/**
 * Real-time password validation
 */
export const validatePasswordRealTime = (password, touched) => {
  if (!touched && !password) {
    return null;
  }
  return validatePassword(password);
};

/**
 * Check password strength
 */
export const getPasswordStrength = (password) => {
  if (!password) return { level: 0, text: '' };
  
  let strength = 0;
  if (password.length >= 6) strength++;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  if (strength <= 2) return { level: 1, text: 'Yếu' };
  if (strength <= 4) return { level: 2, text: 'Trung bình' };
  return { level: 3, text: 'Mạnh' };
};

