import React, { useState, useEffect, useRef, useCallback } from 'react'
import MultiSelect from './MultiSelect'
import { goSearch } from '../utils/searchUtils'
import { decodeFooocusJSON } from '../utils/parseLog'

export default function SearchPanel({ allImages, allModels, allStyles, workingDates, onClose, setZoomImage, addToast, selectedImages, toggleSelection, setSelection, isFavorite, toggleFavorite }) {
  const [searchText, setSearchText] = useState('')
  const [selectedModels, setSelectedModels] = useState([])
  const [selectedStyles, setSelectedStyles] = useState([])
  const [results, setResults] = useState([])
  const [hasSearched, setHasSearched] = useState(false)
  const [page, setPage] = useState(0)
  const [notFoundCount, setNotFoundCount] = useState(0)
  const [wordMatch, setWordMatch] = useState(false)
  const perPage = 60

  const gridRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragRect, setDragRect] = useState(null)
  const dragModeRef = useRef(true)
  const dragStartRef = useRef(null)

  useEffect(() => {
    setResults(prev => prev.filter(r => allImages.some(img => img.src === r.src)))
  }, [allImages])

  const getIntersectedSrcs = useCallback((rect) => {
    if (!gridRef.current) return []
    const gridBounds = gridRef.current.getBoundingClientRect()
    const imgs = gridRef.current.querySelectorAll('img')
    const matched = []
    imgs.forEach(img => {
      const card = img.closest('.col')
      if (!card) return
      const b = card.getBoundingClientRect()
      const overlaps = rect.x1 < b.right && rect.x2 > b.left && rect.y1 < b.bottom && rect.y2 > b.top
      if (overlaps) matched.push(img.alt)
    })
    return matched
  }, [])

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    const tag = e.target.tagName
    if (tag === 'INPUT' || tag === 'BUTTON' || tag === 'LABEL' || tag === 'SELECT') return
    if (!gridRef.current || !gridRef.current.contains(e.target)) return
    e.preventDefault()
    const bounds = gridRef.current.getBoundingClientRect()
    const x = e.clientX - bounds.left
    const y = e.clientY - bounds.top
    dragStartRef.current = { x, y }
    dragModeRef.current = e.ctrlKey || e.metaKey ? !selectedImages.has(e.target.alt || '') : true
    setIsDragging(true)
    setDragRect({ x1: x, y1: y, x2: x, y2: y })
  }, [selectedImages])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !dragStartRef.current || !gridRef.current) return
    const bounds = gridRef.current.getBoundingClientRect()
    const x = e.clientX - bounds.left
    const y = e.clientY - bounds.top
    const start = dragStartRef.current
    const rect = { x1: Math.min(start.x, x), y1: Math.min(start.y, y), x2: Math.max(start.x, x), y2: Math.max(start.y, y) }
    setDragRect(rect)
    const matched = getIntersectedSrcs(rect)
    setSelection(matched, dragModeRef.current)
  }, [isDragging, getIntersectedSrcs, setSelection])

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)
    setDragRect(null)
    dragStartRef.current = null
  }, [isDragging])

  useEffect(() => {
    if (!isDragging) return
    const onMove = (e) => handleMouseMove(e)
    const onUp = () => handleMouseUp()
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const modelOptions = allModels.map(m => m.replace(".safetensors", ""))
  const styleOptions = allStyles

  const handleSearch = () => {
    const { results: res } = goSearch(allImages, searchText, selectedModels, selectedStyles, wordMatch)
    setResults(res)
    setHasSearched(true)
    setPage(0)
    setNotFoundCount(0)
  }

  const totalPages = Math.max(1, Math.ceil(results.length / perPage))
  const pageResults = results.slice(page * perPage, (page + 1) * perPage)

  return (
    <div className="px-2 pt-2 pb-1">
      <form
        className="p-2 rounded"
        style={{ border: '#fde4fd 1px solid', background: '#ba00bd', borderRadius: '5px' }}
        onSubmit={(e) => { e.preventDefault(); handleSearch() }}
      >
        <div className="text-center">
          <strong>SearchBox Active: {allImages.length} images in {workingDates.length} outputs folders</strong>
        </div>

        <label className="block mt-1">
          Text in prompts (AND):
          <input
            type="text"
            className="p-2 text-black w-full"
            placeholder="Type text to search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </label>

        <label className="flex items-center gap-2 mt-1 cursor-pointer">
          <input
            type="checkbox"
            checked={wordMatch}
            onChange={(e) => setWordMatch(e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
          Whole word matching
        </label>

        <label className="block mt-1">
          Models (AND):
          <MultiSelect
            options={modelOptions}
            selected={selectedModels}
            onChange={setSelectedModels}
          />
        </label>

        <label className="block mt-1">
          Styles (OR):
          <MultiSelect
            options={styleOptions}
            selected={selectedStyles}
            onChange={setSelectedStyles}
          />
        </label>

        <div className="mt-2 flex gap-2">
          <button
            type="submit"
            className="text-lg bg-lime-500 hover:bg-lime-700 px-2 py-1.5 leading-5 rounded-md font-semibold text-white"
          >
            Search
          </button>
          <button
            type="button"
            className="text-lg bg-slate-500 hover:bg-slate-700 px-2 py-1.5 leading-5 rounded-md font-semibold text-white"
            onClick={onClose}
          >
            Quit Search Mode
          </button>
        </div>
      </form>

      <div className="px-0 mt-1" style={{ background: '#000', borderRadius: '5px', border: '1px solid #f79cf8' }}>
        {!hasSearched ? (
          <div className="text-lg text-center m-5 p-5">Enter search criteria above</div>
        ) : results.length === 0 ? (
          <div className="text-lg text-center m-5 p-5">&#x2205; No images found with this search options</div>
        ) : (
          <>
            <div className="text-lg text-center p-2">
              Search results: {results.length} images found
              {notFoundCount > 0 && (
                <span className="batchError ml-2">(but {notFoundCount} images deleted by user)</span>
              )}
            </div>

            {results.length > perPage && (
              <div className="flex flex-row justify-center text-base gap-2 p-2">
                <button
                  className="text-lg px-2 py-1.5 leading-5 rounded-md font-semibold text-white"
                  style={{ background: page === 0 ? '#64748b' : '#0ea5e9', minWidth: '70px' }}
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </button>
                <span className="pagination flex items-center gap-1">
                  Page
                  <select
                    className="px-2 text-black"
                    value={page}
                    onChange={(e) => setPage(parseInt(e.target.value))}
                  >
                    {Array.from({ length: totalPages }, (_, i) => (
                      <option key={i} value={i}>{i + 1}</option>
                    ))}
                  </select>
                  of {totalPages}
                </span>
                <button
                  className="text-lg px-2 py-1.5 leading-5 rounded-md font-semibold text-white"
                  style={{ background: page >= totalPages - 1 ? '#64748b' : '#0ea5e9', minWidth: '70px' }}
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </button>
              </div>
            )}

            <div
              ref={gridRef}
              className="grid gap-1 p-1"
              style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', position: 'relative', userSelect: isDragging ? 'none' : undefined, cursor: isDragging ? 'crosshair' : undefined }}
              onMouseDown={handleMouseDown}
            >
              {pageResults.map((data, i) => {
                return (
                  <SearchResultCard
                    key={data.src + i}
                    data={data}
                    index={page * perPage + i}
                    maxIndex={results.length - 1}
                    setZoomImage={setZoomImage}
                    filterImages={results}
                    onError={() => setNotFoundCount(prev => prev + 1)}
                    addToast={addToast}
                    selectedImages={selectedImages}
                    toggleSelection={toggleSelection}
                    isFavorite={isFavorite}
                    toggleFavorite={toggleFavorite}
                  />
                )
              })}
              {isDragging && dragRect && (
                <div
                  style={{
                    position: 'absolute',
                    left: dragRect.x1,
                    top: dragRect.y1,
                    width: dragRect.x2 - dragRect.x1,
                    height: dragRect.y2 - dragRect.y1,
                    background: 'rgba(59,130,246,0.3)',
                    border: '1px solid rgba(59,130,246,0.8)',
                    pointerEvents: 'none',
                    zIndex: 10,
                  }}
                />
              )}
            </div>

            {results.length > perPage && (
              <div className="flex flex-row justify-center text-base gap-2 p-2">
                <button
                  className="text-lg px-2 py-1.5 leading-5 rounded-md font-semibold text-white"
                  style={{ background: page === 0 ? '#64748b' : '#0ea5e9', minWidth: '70px' }}
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </button>
                <span className="pagination flex items-center gap-1">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  className="text-lg px-2 py-1.5 leading-5 rounded-md font-semibold text-white"
                  style={{ background: page >= totalPages - 1 ? '#64748b' : '#0ea5e9', minWidth: '70px' }}
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function SearchResultCard({ data, index, maxIndex, setZoomImage, filterImages, onError, addToast, selectedImages, toggleSelection, isFavorite, toggleFavorite }) {
  const [isHovered, setIsHovered] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [dimensions, setDimensions] = useState(null)
  const isSelected = selectedImages.has(data.src)
  const favorited = isFavorite ? isFavorite(data.src) : false

  const gcd = (a, b) => b ? gcd(b, a % b) : a
  const getAspect = (w, h) => {
    if (!w || !h) return ''
    const g = gcd(w, h)
    return `${w / g}/${h / g}`
  }

  const src = isFavorite && isFavorite(data.src)
    ? `./favorites/${data.src}`
    : `./${data.dt}/${data.src}`
  const decoded = decodeFooocusJSON(JSON.stringify(data))
  const json = JSON.stringify(decoded.copy)

  if (hasError) return null

  const handleCopyMetadata = (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(json)
      .then(() => addToast('Metadata copied to clipboard'))
      .catch(() => addToast('Metadata copied to clipboard'))
  }

  return (
    <div
      className="col p-1 relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ border: isSelected ? '2px solid #dc2626' : '2px solid transparent', borderRadius: '4px' }}
    >
      <img
        src={src}
        alt={data.src}
        className="responsive thumbnail cursor-zoom-in"
        style={{ width: '100%', height: 'auto' }}
        onLoad={(e) => setDimensions({ width: e.target.naturalWidth, height: e.target.naturalHeight })}
        onError={() => { setHasError(true); onError() }}
        onClick={() => setZoomImage({ ...data, index, max: maxIndex, src, json, filterImages })}
      />
      <button
        className="absolute flex items-center justify-center cursor-pointer"
        style={{
          bottom: '24px', right: '0',
          width: '28px', height: '28px',
          background: favorited ? 'rgba(245,158,11,0.85)' : 'rgba(0,0,0,0.5)',
          borderRadius: '4px',
          fontSize: '16px', color: favorited ? '#000' : '#fff',
          textShadow: '2px 2px 2px rgba(0,0,0,0.25)',
        }}
        title={favorited ? 'Remove from favorites' : 'Add to favorites'}
        onClick={(e) => { e.stopPropagation(); if (toggleFavorite) toggleFavorite(data.src, data.dt) }}
      >
        {favorited ? '\u2605' : '\u2606'}
      </button>
      <div className="text-xs overflow-hidden whitespace-nowrap text-ellipsis">{data.src}</div>

      {isHovered && !hasError && (
        <>
          <div
            className="absolute bg-black text-white px-1 cursor-pointer"
            style={{ top: '4px', left: '4px', fontSize: '13px', fontStyle: 'italic', borderRadius: '3px' }}
            onClick={handleCopyMetadata}
            title="Click to copy metadata to clipboard"
          >
            Metadatas: click to copy all
          </div>

          <label
            className="absolute flex items-center justify-center cursor-pointer"
            style={{ top: '4px', right: '4px', width: '28px', height: '28px', background: 'rgba(0,0,0,0.7)', borderRadius: '3px' }}
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
        </>
      )}
    </div>
  )
}
