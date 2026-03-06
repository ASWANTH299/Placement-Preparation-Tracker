import { useState } from 'react'
import RecordInterviewModal from '../components/MockInterviews/RecordInterviewModal'

export default function RecordInterviewPage() {
  const [open, setOpen] = useState(true)

  return <RecordInterviewModal isOpen={open} onClose={() => setOpen(false)} />
}
