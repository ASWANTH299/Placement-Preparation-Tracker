const validateEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // At least 1 uppercase and 1 special character; remaining characters are unrestricted
  const passwordRegex = /^(?=.*[A-Z])(?=.*[^A-Za-z\d]).+$/;
  return passwordRegex.test(password);
};

const validateName = (name) => {
  return name && name.trim().length >= 2 && name.trim().length <= 100;
};

const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

const validateGraduationYear = (year) => {
  if (!year) return true;
  const currentYear = new Date().getFullYear();
  return year >= currentYear && year <= currentYear + 10;
};

const normalizePhoneNumber = (phoneNumber = '') => {
  const digits = String(phoneNumber).replace(/\D/g, '');

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }

  if (digits.length >= 11 && digits.length <= 15) {
    return `+${digits}`;
  }

  return '';
};

const validatePhoneNumber = (phoneNumber = '') => {
  return Boolean(normalizePhoneNumber(phoneNumber));
};

module.exports = {
  validateEmail,
  validatePassword,
  validateName,
  validateUrl,
  validateGraduationYear,
  validatePhoneNumber,
  normalizePhoneNumber
};
