import React from 'react'

export default function DeleteBar({ count, onClick }) {
  if (count === 0) return null

  return (
    <button
      className="fixed z-50 px-5 py-3 rounded-full font-bold text-white shadow-lg hover:opacity-90 transition-opacity"
      style={{
        bottom: '24px',
        right: '24px',
        background: '#dc2626',
        fontSize: '16px',
        boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
      }}
      onClick={onClick}
    >
      Delete {count} image{count > 1 ? 's' : ''}
    </button>
  )
}
