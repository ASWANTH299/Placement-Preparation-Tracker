import { useState } from 'react'

export default function useForm(initialValues = {}) {
  const [values, setValues] = useState(initialValues)

  const onChange = (event) => {
    const { name, value, type, checked } = event.target
    setValues((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const reset = () => setValues(initialValues)

  return { values, setValues, onChange, reset }
}
