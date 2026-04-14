import React from 'react'
import { saveParam } from '../hooks/useLocalStorage'

export default function GalleryController({ numColumns, setNumColumns }) {
  return (
    <div className="sticky bottom-0 p-2">
      <button
        className="bg-transparent hover:bg-blue-500 text-white font-semibold hover:text-white py-2 px-4 border border-white hover:border-transparent rounded disabled:bg-gray-500 disabled:border-gray-800 disabled:text-white"
        onClick={() => setNumColumns(Math.max(numColumns - 1, 1))}
        disabled={numColumns === 1}
      >
        &#x53E3;
      </button>
      <button
        className="bg-transparent hover:bg-blue-500 text-white font-semibold hover:text-white py-2 px-4 border border-white hover:border-transparent rounded disabled:bg-gray-500 disabled:border-gray-800 disabled:text-white"
        onClick={() => setNumColumns(numColumns + 1)}
      >
        &#x7530;
      </button>
    </div>
  )
}
