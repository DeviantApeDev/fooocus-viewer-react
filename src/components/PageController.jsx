import React from 'react'

export default function PageController({
  mode, currentPage, setCurrentPage, numPages,
  numImages, firstImageInPage, lastImageInPage, scrollToTop
}) {
  return (
    <div className="flex justify-center">
      <button
        className="bg-transparent hover:bg-blue-500 text-white font-semibold hover:text-white py-2 px-4 border border-white hover:border-transparent rounded disabled:bg-gray-500 disabled:border-gray-800 disabled:text-white"
        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
      >
        &#x25C0;&#xFE0F;
      </button>
      <span className="p-2">
        {mode === "batches" ? "Batch" : "P."} {currentPage} / {numPages} ({firstImageInPage} - {lastImageInPage} / {numImages} Images)
      </span>
      <button
        className="bg-transparent hover:bg-blue-500 text-white font-semibold hover:text-white py-2 px-4 border border-white hover:border-transparent rounded disabled:bg-gray-500 disabled:border-gray-800 disabled:text-white"
        onClick={() => {
          setCurrentPage(prev => Math.min(prev + 1, numPages))
          if (scrollToTop) {
            window.scroll({ top: 0, left: 0, behavior: "smooth" })
          }
        }}
        disabled={currentPage === numPages}
      >
        &#x25B6;&#xFE0F;
      </button>
    </div>
  )
}
