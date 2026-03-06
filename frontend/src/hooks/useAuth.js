import { useDispatch, useSelector } from 'react-redux'
import { clearCredentials, setCredentials } from '../store/authSlice'

export default function useAuth() {
  const dispatch = useDispatch()
  const auth = useSelector((state) => state.auth)

  return {
    ...auth,
    login: (payload) => dispatch(setCredentials(payload)),
    logout: () => dispatch(clearCredentials()),
  }
}
