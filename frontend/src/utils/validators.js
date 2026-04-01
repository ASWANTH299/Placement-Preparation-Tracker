export const isValidEmail = (email = '') => /.+@.+\..+/.test(email)
export const isStrongPassword = (password = '') =>
  /^(?=.*[A-Z])(?=.*[^A-Za-z\d]).+$/.test(password)

