export const isValidEmail = (email = '') => /.+@.+\..+/.test(email)
export const isStrongPassword = (password = '') =>
  /^(?=.*[A-Z])(?=.*[^A-Za-z\d]).+$/.test(password)

export const normalizePhoneNumber = (phoneNumber = '') => {
  const digits = String(phoneNumber).replace(/\D/g, '')

  if (digits.length === 10) return `+91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`

  return ''
}

export const isValidPhoneNumber = (phoneNumber = '') => Boolean(normalizePhoneNumber(phoneNumber))
