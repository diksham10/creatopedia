'use client'

import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Setup worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface Props {
  url: string
}

export default function PdfViewer({ url }: Props) {
  const [numPages, setNumPages] = useState<number>()
  const [pageNumber, setPageNumber] = useState<number>(1)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
  }

  return (
    <div className="flex flex-col w-full h-[600px]">
      <div className="flex-1 overflow-auto bg-zinc-950 flex justify-center p-4">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="flex items-center justify-center h-full text-zinc-500 font-medium">Loading PDF...</div>}
          error={<div className="flex items-center justify-center h-full text-red-400 font-medium">Failed to load PDF.</div>}
        >
          <Page 
            pageNumber={pageNumber} 
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="shadow-2xl"
            width={Math.min(window.innerWidth - 64, 800)} // Responsive max-width
          />
        </Document>
      </div>

      {numPages && (
        <div className="h-14 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between px-6 shrink-0">
          <button
            onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
            disabled={pageNumber <= 1}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 disabled:opacity-50 transition-colors"
          >
            ← Prev
          </button>
          
          <p className="text-sm font-semibold text-zinc-300">
            Page {pageNumber} <span className="text-zinc-600 font-normal">of {numPages}</span>
          </p>

          <button
            onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
            disabled={pageNumber >= numPages}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 disabled:opacity-50 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
