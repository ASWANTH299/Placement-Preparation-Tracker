import PageShell from '../Common/PageShell'

export default function ResumePreview() {
  return (
    <PageShell title="Resume Preview" subtitle="Preview uploaded resume content.">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <p className="text-sm font-semibold text-slate-800">resume_v3.pdf</p>
          <button className="text-sm font-medium text-blue-600 hover:underline">Download</button>
        </div>
        <div className="mt-3 space-y-2 text-sm text-slate-700">
          <p><span className="font-medium text-slate-800">ATS Score:</span> 82/100</p>
          <p><span className="font-medium text-slate-800">Detected Sections:</span> Summary, Experience, Projects, Skills</p>
          <p><span className="font-medium text-slate-800">Suggestions:</span> Add quantified impact in project bullets and include role-specific keywords.</p>
        </div>
      </div>
    </PageShell>
  )
}
