import React from 'react'

export default function DeleteBar({ count, onClick, onClearSelection }) {
  if (count === 0) return null

  return (
    <div className="fixed z-50 flex gap-3" style={{ bottom: '24px', right: '24px' }}>
      <button
        className="px-5 py-3 rounded-full font-bold text-white shadow-lg hover:opacity-90 transition-opacity"
        style={{
          background: '#6b7280',
          fontSize: '16px',
          boxShadow: '0 4px 14px rgba(107, 114, 128, 0.4)',
        }}
        onClick={onClearSelection}
      >
        Deselect All
      </button>
      <button
        className="px-5 py-3 rounded-full font-bold text-white shadow-lg hover:opacity-90 transition-opacity"
        style={{
          background: '#dc2626',
          fontSize: '16px',
          boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
        }}
        onClick={onClick}
      >
        Delete {count} image{count > 1 ? 's' : ''}
      </button>
    </div>
  )
}
