import React, { useState, useEffect, useCallback } from 'react'
import { formatFilesize, downloadImage } from '../utils/imageUtils'
import { decodeFooocusJSON } from '../utils/parseLog'
import { getParam, saveParam } from '../hooks/useLocalStorage'

export default function ZoomModal({ image, allImages, filterImages, onClose, addToast, selectedImages, toggleSelection }) {
  const imageList = filterImages || allImages
  const [currentIndex, setCurrentIndex] = useState(image.index || 0)
  const [showMeta, setShowMeta] = useState(getParam("displayMetaBlock") !== "false")
  const [imgDimensions, setImgDimensions] = useState(null)
  const [imgFileSize, setImgFileSize] = useState(0)

  const currentImage = imageList[currentIndex] || image
  const isSelected = selectedImages.has(currentImage.src)
  const imgDateStr = currentImage.src.split("_")[0]
  const src = `./${imgDateStr}/${currentImage.src}`
  const json = JSON.stringify(currentImage)
  const decoded = decodeFooocusJSON(json)

  useEffect(() => {
    const img = new Image()
    img.src = src
    img.addEventListener("load", () => {
      setImgDimensions({ width: img.width, height: img.height })
    })

    const xhr = new XMLHttpRequest()
    xhr.open("HEAD", src, true)
    xhr.onreadystatechange = function () {
      if (this.readyState === XMLHttpRequest.DONE) {
        setImgFileSize(parseInt(xhr.getResponseHeader("Content-Length")) || 0)
      }
    }
    xhr.send()
  }, [src])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowLeft') setCurrentIndex(prev => Math.max(0, prev - 1))
    if (e.key === 'ArrowRight') setCurrentIndex(prev => Math.min(imageList.length - 1, prev + 1))
  }, [onClose, imageList.length])

  useEffect(() => {
    document.addEventListener('keyup', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keyup', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  const handleCopyMetadata = () => {
    const text = JSON.stringify(decoded.copy)
    try {
      navigator.clipboard.writeText(text)
        .then(() => addToast('Metadata copied to clipboard'))
        .catch(() => {
          const ta = document.createElement('textarea')
          ta.value = text
          document.body.appendChild(ta)
          ta.select()
          document.execCommand('copy')
          document.body.removeChild(ta)
          addToast('Metadata copied to clipboard')
        })
    } catch (e) {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      addToast('Metadata copied to clipboard')
    }
  }

  const handleCopyField = (text, label) => {
    try {
      navigator.clipboard.writeText(String(text))
        .then(() => addToast(`Copied: ${label}`))
        .catch(() => {
          const ta = document.createElement('textarea')
          ta.value = String(text)
          document.body.appendChild(ta)
          ta.select()
          document.execCommand('copy')
          document.body.removeChild(ta)
          addToast(`Copied: ${label}`)
        })
    } catch (e) {
      const ta = document.createElement('textarea')
      ta.value = String(text)
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      addToast(`Copied: ${label}`)
    }
  }

  const handleDownload = () => {
    downloadImage(src, currentImage.src).catch(console.error)
  }

  const toggleMeta = () => {
    const newVal = !showMeta
    setShowMeta(newVal)
    saveParam("displayMetaBlock", newVal)
  }

  const gcd = (a, b) => b ? gcd(b, a % b) : a
  const getAspect = (w, h) => {
    if (!w || !h) return ""
    const g = gcd(w, h)
    return `${w / g}/${h / g}`
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'RGBA(0,0,0,.95)', zIndex: 10000 }}
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-4 py-2" style={{ background: 'RGBA(0,0,0,.8)' }}>
        <div className="flex items-center gap-2">
          <button
            className="text-3xl hover:opacity-70"
            onClick={(e) => { e.stopPropagation(); handleDownload() }}
            title="Download"
          >
            &#x2B07;
          </button>
          <button
            className="text-2xl hover:opacity-70"
            style={{ color: isSelected ? '#dc2626' : '#fff' }}
            onClick={(e) => { e.stopPropagation(); toggleSelection(currentImage.src) }}
            title={isSelected ? 'Unmark for deletion' : 'Mark for deletion'}
          >
            &#x1F5D1;
          </button>
          <span className="text-white text-lg font-bold" style={{ textShadow: '2px 2px 2px #000' }}>
            {currentImage.src}
          </span>
          {imgDimensions && (
            <span className="text-white text-sm" style={{ textShadow: '2px 2px 2px #000' }}>
              {imgDimensions.width}&times;{imgDimensions.height}
              ({getAspect(imgDimensions.width, imgDimensions.height)})
              {imgFileSize > 0 ? ` - ${formatFilesize(imgFileSize)}` : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className="cursor-pointer text-white px-2 py-1 rounded"
            style={{ background: '#660068bd', fontSize: '15px', fontStyle: 'italic', border: '2px solid #ba00bd' }}
            onClick={(e) => { e.stopPropagation(); handleCopyMetadata() }}
          >
            Metadata: Click to copy all to Clipboard
          </span>
          <button
            className="text-white text-2xl cursor-pointer"
            onClick={onClose}
            style={{ textShadow: '2px 2px 2px #000' }}
          >
            [Esc] &#x2715;
          </button>
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {currentIndex > 0 && (
          <button
            className="absolute left-2 top-1/2 -translate-y-1/2 text-3xl text-white hover:opacity-70 z-10"
            onClick={() => setCurrentIndex(prev => prev - 1)}
          >
            &#x25C0;
          </button>
        )}

        <img
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-contain"
          style={{ border: isSelected ? '4px solid #dc2626' : '4px solid transparent' }}
        />

        {currentIndex < imageList.length - 1 && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 text-3xl text-white hover:opacity-70 z-10"
            onClick={() => setCurrentIndex(prev => prev + 1)}
          >
            &#x25B6;
          </button>
        )}
      </div>

      <div
        className="w-full"
        style={{ background: '#000', borderTop: '1px solid #ba00bd', fontSize: '12px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className="inline-block cursor-pointer px-3 py-1 font-bold text-base underline"
          style={{ background: '#660068bd' }}
          onClick={toggleMeta}
        >
          Show/Hide Metadatas &#x1F440;
        </span>

        {showMeta && (
          <div className="flex flex-wrap p-2">
            <div className="sm:basis-2/5 basis-full p-1">
              <div className="font-bold text-center text-sm mb-1" style={{ borderBottom: '1px dotted #1F2A37' }}>Settings</div>
              <div className="p-1">
                <span className="font-bold">Prompt</span>
                <span
                  className="block p-1 rounded mt-1 cursor-pointer hover:opacity-80"
                  style={{ background: '#1F2A37', maxHeight: '100px', overflowY: 'auto' }}
                  title="Click to copy"
                  onClick={() => handleCopyField(decoded.copy["Prompt"], "Prompt")}
                >
                  {decoded.copy["Prompt"]}
                </span>
              </div>
              <div className="p-1">
                <span className="font-bold">Negative Prompt</span>
                {decoded.copy["Negative Prompt"] ? (
                  <span
                    className="block p-1 rounded mt-1 cursor-pointer hover:opacity-80"
                    style={{ background: '#1F2A37', maxHeight: '100px', overflowY: 'auto' }}
                    title="Click to copy"
                    onClick={() => handleCopyField(decoded.copy["Negative Prompt"], "Negative Prompt")}
                  >
                    {decoded.copy["Negative Prompt"]}
                  </span>
                ) : (
                  <span className="text-white"> none</span>
                )}
              </div>
              <div className="p-1">
                <span className="font-bold">Seed</span>
                <span
                  className="inline-block px-2 py-1 rounded mx-1 cursor-pointer hover:opacity-80"
                  style={{ background: '#1F2A37' }}
                  title="Click to copy"
                  onClick={() => handleCopyField(decoded.copy["Seed"], "Seed")}
                >
                  {decoded.copy["Seed"]}
                </span>
              </div>
              <div className="p-1">
                <span className="font-bold">Perf.</span>
                <span className="inline-block px-2 py-1 rounded mx-1" style={{ background: '#1F2A37' }}>
                  {decoded.copy["Performance"]}
                </span>
                <span className="font-bold">Resolution</span>
                <span className="inline-block px-2 py-1 rounded mx-1" style={{ background: '#1F2A37' }}>
                  {decoded.copy["Resolution"]}
                </span>
              </div>
            </div>

            <div className="sm:basis-2/5 basis-full p-1">
              <div className="font-bold text-center text-sm mb-1" style={{ borderBottom: '1px dotted #1F2A37' }}>Model & Style</div>
              <div className="p-1">
                <span className="font-bold">Base Model</span>
                <span className="inline-block px-2 py-1 rounded mx-1" style={{ background: '#1F2A37' }}>
                  {decoded.copy["Base Model"]}
                </span>
              </div>
              <div className="p-1">
                <span className="font-bold">Refiner Model</span>
                <span className="inline-block px-2 py-1 rounded mx-1" style={{ background: '#1F2A37' }}>
                  {decoded.copy["Refiner Model"]}
                </span>
                <span className="font-bold">Refiner Switch</span>
                <span className="inline-block px-2 py-1 rounded mx-1" style={{ background: '#1F2A37' }}>
                  {decoded.copy["Refiner Switch"]}
                </span>
              </div>
              <div className="p-1">
                <span className="font-bold">Styles</span>
                {decoded.styles && decoded.styles.length > 0 ? (
                  decoded.styles.map((s, i) => (
                    <span key={i} className="inline-block px-2 py-1 rounded mx-1" style={{ background: '#1F2A37' }}>
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-white"> none</span>
                )}
              </div>
              {decoded.styles && decoded.styles.length > 0 && decoded["Fooocus V2 Expansion"] && (
                <div className="p-1">
                  <span className="font-bold" title="Prompt auto completed by Fooocus V2 Style choices">Fooocus V2 Expansion Prompt &#9432;</span>
                  <span className="block p-1 rounded mt-1" style={{ background: '#1F2A37', maxHeight: '40px', overflowY: 'auto' }}>
                    {decoded["Fooocus V2 Expansion"]}
                  </span>
                </div>
              )}
              <div className="p-1">
                <span className="font-bold">LoRAs</span>
                {decoded.loras && decoded.loras.map((lora, i) => (
                  <div key={i}>
                    <span className="inline-block px-2 py-1 rounded" style={{ background: '#1F2A37' }}>
                      {lora.name.replace(".safetensors", "")}
                    </span> Weight: <b>{lora.weight}</b>
                  </div>
                ))}
              </div>
            </div>

            <div className="sm:basis-1/5 basis-full p-1">
              <div className="font-bold text-center text-sm mb-1" style={{ borderBottom: '1px dotted #1F2A37' }}>Advance</div>
              <div className="p-1">
                <span className="font-bold">Guid.</span>
                <span className="inline-block px-2 py-1 rounded mx-1" style={{ background: '#1F2A37' }}>
                  {decoded.copy["Guidance Scale"]}
                </span>
                <span className="font-bold">Sharp.</span>
                <span className="inline-block px-2 py-1 rounded mx-1" style={{ background: '#1F2A37' }}>
                  {decoded.copy["Sharpness"]}
                </span>
              </div>
              <div className="font-bold text-center text-sm mb-1 mt-2" style={{ borderBottom: '1px dotted #1F2A37' }}>Dev. Debug Mode</div>
              <div className="p-1">
                <span className="font-bold">ADM</span>
                <span className="inline-block px-2 py-1 rounded mx-1" style={{ background: '#1F2A37' }}>
                  {decoded.copy["ADM Guidance"]}
                </span>
              </div>
              <div className="p-1">
                <span className="font-bold">Sampler</span>
                <span className="inline-block px-2 py-1 rounded mx-1" style={{ background: '#1F2A37' }}>
                  {decoded.copy["Sampler"]}
                </span>
              </div>
              <div className="p-1">
                <span className="font-bold">Scheduler</span>
                <span className="inline-block px-2 py-1 rounded mx-1" style={{ background: '#1F2A37' }}>
                  {decoded.copy["Scheduler"]}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
