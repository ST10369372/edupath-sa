import { createWorker } from 'tesseract.js'
import * as pdfjs from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { parseReportCardText } from './reportCardParser'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

function pdfTextLines(items) {
  const rows = []
  for (const item of items) {
    if (!item.str?.trim()) continue
    const y = Math.round(item.transform[5])
    let row = rows.find(candidate => Math.abs(candidate.y - y) <= 2)
    if (!row) {
      row = { y, items: [] }
      rows.push(row)
    }
    row.items.push({ x: item.transform[4], text: item.str })
  }
  return rows
    .sort((left, right) => right.y - left.y)
    .map(row => row.items.sort((left, right) => left.x - right.x).map(item => item.text).join(' '))
    .join('\n')
}

async function extractPdfText(file) {
  const document = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  const lines = []
  for (let pageNumber = 1; pageNumber <= Math.min(document.numPages, 10); pageNumber++) {
    const page = await document.getPage(pageNumber)
    const content = await page.getTextContent()
    lines.push(pdfTextLines(content.items))
  }
  return { document, text: lines.join('\n') }
}

async function recognizeImage(worker, image) {
  const { data } = await worker.recognize(image)
  return data.text
}

async function recognizePdf(worker, document, onProgress) {
  const pageTexts = []
  const pageCount = Math.min(document.numPages, 5)
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
    onProgress(`Reading scanned PDF page ${pageNumber} of ${pageCount}…`)
    const page = await document.getPage(pageNumber)
    const viewport = page.getViewport({ scale: 2 })
    const canvas = globalThis.document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not prepare a PDF page for local recognition.')
    await page.render({ canvasContext: context, viewport }).promise
    pageTexts.push(await recognizeImage(worker, canvas))
    canvas.width = 0
    canvas.height = 0
  }
  return pageTexts.join('\n')
}

function localAsset(path) {
  return new URL(`${import.meta.env.BASE_URL}ocr/${path}`, window.location.href).href
}

export async function extractReportSubjectsLocally(file, onProgress = () => {}) {
  let pdfDocument = null
  let initialText = ''

  if (file.type === 'application/pdf') {
    onProgress('Checking for selectable text in the PDF…')
    const extracted = await extractPdfText(file)
    pdfDocument = extracted.document
    initialText = extracted.text
    const pdfSubjects = parseReportCardText(initialText)
    if (pdfSubjects.length >= 2) return pdfSubjects
  }

  onProgress('Loading offline English recognition data…')
  const worker = await createWorker('eng', undefined, {
    workerPath: localAsset('worker.min.js'),
    corePath: localAsset('tesseract-core-lstm.wasm.js'),
    langPath: localAsset(''),
    gzip: true,
    workerBlobURL: false,
    logger: message => {
      if (message.status === 'recognizing text') {
        onProgress(`Recognising text: ${Math.round((message.progress || 0) * 100)}%`)
      }
    },
  })

  try {
    const scannedText = file.type === 'application/pdf'
      ? await recognizePdf(worker, pdfDocument, onProgress)
      : await recognizeImage(worker, file)
    return parseReportCardText([initialText, scannedText].filter(Boolean).join('\n'))
  } finally {
    await worker.terminate()
  }
}
