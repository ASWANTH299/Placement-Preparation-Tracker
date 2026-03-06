export const isValidEmail = (email = '') => /.+@.+\..+/.test(email)
export const isStrongPassword = (password = '') =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password)
