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

module.exports = {
  validateEmail,
  validatePassword,
  validateName,
  validateUrl,
  validateGraduationYear
};
