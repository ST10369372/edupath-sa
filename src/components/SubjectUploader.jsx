import { useState, useRef } from 'react'
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, X, ScanText } from 'lucide-react'
import toast from 'react-hot-toast'

const PDF_TYPE = 'application/pdf'
const ACCEPTED_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf',
])
const MAX_MB = 5

/**
 * @param {{ onSubjectsExtracted: (subjects: {subject:string, mark:number}[]) => void }} props
 */
export default function SubjectUploader({ onSubjectsExtracted }) {
  const [status,  setStatus]  = useState('idle')   // idle | loading | done | error
  const [count,   setCount]   = useState(0)
  const [progress, setProgress] = useState('')
  const [fileType, setFileType] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  // ─── File handling ────────────────────────────────────────────────────────

  async function processFile(file) {
    if (!file) return

    if (!ACCEPTED_TYPES.has(file.type)) {
      toast.error('Please upload a PDF, JPG, PNG or WEBP file')
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`File must be smaller than ${MAX_MB} MB`)
      return
    }

    setStatus('loading')
    setFileType(file.type)
    setProgress('Preparing local text recognition…')
    try {
      const { extractReportSubjectsLocally } = await import('../lib/reportCardOcr')
      const subjects = await extractReportSubjectsLocally(file, setProgress)

      if (!subjects.length) {
        setStatus('error')
        toast.error('No subject marks were recognised. Enter marks manually or try a clearer scan.')
        return
      }

      setCount(subjects.length)
      setStatus('done')
      onSubjectsExtracted(subjects)
      toast.success(`${subjects.length} subject${subjects.length !== 1 ? 's' : ''} recognised — please review the marks`)
    } catch (err) {
      setStatus('error')
      toast.error(err.message || 'Could not read this document locally. Please try again or enter marks manually.')
    }
  }

  // ─── Event handlers ───────────────────────────────────────────────────────

  function handleChange(e) {
    processFile(e.target.files?.[0])
    e.target.value = '' // allow re-selecting the same file
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    processFile(e.dataTransfer.files?.[0])
  }

  function handleReset(e) {
    e.stopPropagation()
    setStatus('idle')
    setCount(0)
  }

  const clickable = status !== 'loading'

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      role="button"
      tabIndex={clickable ? 0 : -1}
      aria-label="Upload report card for local subject recognition"
      onClick={() => clickable && inputRef.current?.click()}
      onKeyDown={e => e.key === 'Enter' && clickable && inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); if (clickable) setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={[
        'border-2 border-dashed p-5 flex flex-col items-center gap-2 text-center transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2',
        clickable ? 'cursor-pointer' : 'cursor-wait',
        dragging
          ? 'border-ink bg-stone-200'
          : 'border-stone-300 bg-stone-50 hover:bg-stone-100 hover:border-stone-400',
      ].join(' ')}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="sr-only"
        onChange={handleChange}
      />

      {/* ── Idle ── */}
      {status === 'idle' && (
        <>
          <div className="flex gap-2.5 text-stone-400">
            <FileText size={20} />
            <Upload size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-700">Upload Report Card or Results Slip</p>
            <p className="text-2xs text-stone-400 mt-0.5">PDF, JPG, PNG, WEBP · max {MAX_MB} MB</p>
          </div>
          <p className="text-2xs text-stone-500 flex items-center gap-1.5 mt-0.5">
            <ScanText size={11} className="flex-shrink-0" />
            Read on this device — your report is not uploaded
          </p>
          <p className="text-2xs text-stone-400 italic">
            Drag &amp; drop here, or click to browse
          </p>
        </>
      )}

      {/* ── Loading ── */}
      {status === 'loading' && (
        <>
          <Loader2 size={22} className="animate-spin text-stone-500" />
          <p className="text-xs font-semibold text-stone-700">
            {fileTypeLabel(fileType)} recognition running locally…
          </p>
          <p className="text-2xs text-stone-400">{progress || 'This may take a little while on your device'}</p>
        </>
      )}

      {/* ── Success ── */}
      {status === 'done' && (
        <>
          <CheckCircle size={22} className="text-stone-600" />
          <div>
            <p className="text-xs font-semibold text-stone-700">
              {count} subject{count !== 1 ? 's' : ''} extracted successfully
            </p>
            <p className="text-2xs text-stone-500 mt-0.5">
              Review and correct every mark below before continuing
            </p>
          </div>
          <button
            onClick={handleReset}
            className="text-2xs text-stone-400 hover:text-ink underline underline-offset-2 flex items-center gap-1 mt-1 transition-colors"
          >
            <X size={10} /> Upload a different file
          </button>
        </>
      )}

      {/* ── Error ── */}
      {status === 'error' && (
        <>
          <AlertCircle size={22} className="text-stone-500" />
          <div>
            <p className="text-xs font-semibold text-stone-700">Could not extract subjects</p>
            <p className="text-2xs text-stone-500 mt-0.5">
              Use a sharp, well-lit image with the full subject names and marks visible. We support common SA subject names and English text.
            </p>
          </div>
          <button
            onClick={handleReset}
            className="text-2xs text-stone-400 hover:text-ink underline underline-offset-2 flex items-center gap-1 mt-1 transition-colors"
          >
            Try again
          </button>
        </>
      )}
    </div>
  )
}

function fileTypeLabel(type) {
  return type === PDF_TYPE ? 'PDF' : 'Image'
}