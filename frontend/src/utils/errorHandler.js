export const getErrorMessage = (error) => {
  if (error?.message === 'Network Error') {
    return 'Cannot connect to backend API. Start backend server and refresh the page.'
  }

  return error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Something went wrong'
}
