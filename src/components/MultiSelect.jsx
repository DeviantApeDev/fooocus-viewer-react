import React, { useState, useRef, useEffect } from 'react'

export default function MultiSelect({ options, selected, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleOption = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option))
    } else {
      onChange([...selected, option])
    }
  }

  const selectAll = () => {
    const filtered = options.filter(o =>
      o.toLowerCase().includes(search.toLowerCase())
    )
    const newSelected = [...new Set([...selected, ...filtered])]
    onChange(newSelected)
  }

  const clearAll = () => {
    const filtered = options.filter(o =>
      o.toLowerCase().includes(search.toLowerCase())
    )
    onChange(selected.filter(s => !filtered.includes(s)))
  }

  const filteredOptions = options.filter(o =>
    o.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div ref={ref} className="relative" style={{ background: '#fff' }}>
      <div
        className="flex flex-wrap gap-1 p-1 min-h-8 cursor-pointer border rounded"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected.length === 0 && (
          <span className="text-gray-400 text-sm px-1">Select...</span>
        )}
        {selected.map(s => (
          <span
            key={s}
            className="badge cursor-pointer text-white text-sm px-1 py-0.5 rounded"
            style={{ background: '#ba00bd' }}
            onClick={(e) => { e.stopPropagation(); toggleOption(s) }}
          >
            {s} &times;
          </span>
        ))}
      </div>

      {isOpen && (
        <div
          className="absolute z-50 w-full border rounded mt-1 max-h-60 overflow-y-auto"
          style={{ background: '#fff', color: '#000' }}
        >
          <div className="sticky top-0 bg-white border-b p-1 flex gap-1">
            <input
              type="text"
              className="flex-1 text-sm p-1 border rounded text-black"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="text-xs px-1 py-0.5 bg-green-100 hover:bg-green-200 rounded"
              onClick={(e) => { e.stopPropagation(); selectAll() }}
              title="Select all"
            >
              All
            </button>
            <button
              className="text-xs px-1 py-0.5 bg-red-100 hover:bg-red-200 rounded"
              onClick={(e) => { e.stopPropagation(); clearAll() }}
              title="Clear all"
            >
              Clear
            </button>
          </div>
          {filteredOptions.map(option => (
            <div
              key={option}
              className="p-1 cursor-pointer hover:text-white"
              style={{ ':hover': { background: '#ba00bd' } }}
              onMouseEnter={(e) => { e.target.style.background = '#ba00bd'; e.target.style.color = '#fff' }}
              onMouseLeave={(e) => { e.target.style.background = ''; e.target.style.color = '' }}
              onClick={(e) => { e.stopPropagation(); toggleOption(option) }}
            >
              <input
                type="checkbox"
                checked={selected.includes(option)}
                readOnly
                className="mr-1"
              />
              {option}
            </div>
          ))}
          {filteredOptions.length === 0 && (
            <div className="p-2 text-gray-400 text-sm text-center">No options</div>
          )}
        </div>
      )}
    </div>
  )
}
