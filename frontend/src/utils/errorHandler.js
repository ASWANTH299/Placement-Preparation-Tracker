export const getErrorMessage = (error) => {
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Something went wrong'
}
