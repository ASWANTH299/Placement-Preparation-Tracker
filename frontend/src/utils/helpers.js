export const truncate = (value = '', max = 100) =>
  value.length > max ? `${value.slice(0, max)}...` : value
