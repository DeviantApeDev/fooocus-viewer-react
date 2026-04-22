import React, { useState } from 'react'
import { downloadImage } from '../utils/imageUtils'
import { decodeFooocusJSON } from '../utils/parseLog'

export default function ImageCard({ data, index, maxIndex, setZoomImage, onError, addToast, selectedImages, toggleSelection }) {
  const [isHovered, setIsHovered] = useState(false)
  const [dimensions, setDimensions] = useState(null)
  const [hasError, setHasError] = useState(false)
  const isSelected = selectedImages.has(data.src)

  const dateStr = data.src.split("_")[0]
  const src = `./${dateStr}/${data.src}`
  const decoded = decodeFooocusJSON(JSON.stringify(data))
  const json = JSON.stringify(decoded.copy)

  const handleError = () => {
    setHasError(true)
    if (onError) onError()
  }

  const gcd = (a, b) => b ? gcd(b, a % b) : a
  const getAspect = (w, h) => {
    if (!w || !h) return ""
    const g = gcd(w, h)
    return `${w / g}/${h / g}`
  }

  const handleCopyMetadata = (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(json)
      .then(() => addToast('Metadata copied to clipboard'))
      .catch(() => addToast('Metadata copied to clipboard'))
  }

  const handleDownload = (e) => {
    e.stopPropagation()
    downloadImage(src, data.src).catch(console.error)
  }

  if (hasError) return null

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ border: isSelected ? '2px solid #dc2626' : '2px solid transparent', borderRadius: '4px' }}
    >
      <img
        src={src}
        alt={data.src}
        loading="lazy"
        className="img-load-detection max-w-screen max-h-screen object-contain cursor-zoom-in"
        style={{ width: '100%' }}
        onLoad={(e) => setDimensions({ width: e.target.naturalWidth, height: e.target.naturalHeight })}
        onError={handleError}
        onClick={() => setZoomImage({ ...data, index, max: maxIndex, src, json, dimensions })}
      />
      <p className="text-gray-500 text-sm hideOverflowSrc">{data.src}</p>

      {isHovered && (
        <>
          <div
            className="absolute top-0 left-0 bg-black text-white px-1 text-xs rounded cursor-pointer"
            style={{ fontSize: '13px', fontStyle: 'italic' }}
            onClick={handleCopyMetadata}
            title="Click to copy metadata to clipboard"
          >
            Metadatas: click to copy all
          </div>

          <label
            className="absolute top-0 right-0 flex items-center justify-center cursor-pointer"
            style={{ width: '28px', height: '28px', background: 'rgba(0,0,0,0.7)', borderRadius: '0 0 0 4px' }}
            title="Select for deletion"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelection(data.src)}
              className="w-4 h-4 cursor-pointer"
            />
          </label>

          {dimensions && (
            <div
              className="absolute text-xs px-1 rounded"
              style={{
                bottom: '24px', left: '0', backgroundColor: '#ccc',
                color: '#000', opacity: 0.8, fontSize: '11px', borderRadius: '3px'
              }}
            >
              {dimensions.width}&times;{dimensions.height} ({getAspect(dimensions.width, dimensions.height)})
            </div>
          )}

          <button
            className="absolute text-2xl"
            style={{ bottom: '24px', right: '0', textShadow: '2px 2px 2px rgba(0,0,0,0.25)' }}
            onClick={handleDownload}
            title="Click to download"
          >
            &#x2B07;
          </button>
        </>
      )}
    </div>
  )
}
