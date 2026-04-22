import React from 'react'

export default function DeleteConfirmModal({ selectedImages, onConfirm, onCancel }) {
  const items = Array.from(selectedImages)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={onCancel}
    >
      <div
        className="p-6 rounded-lg max-w-lg w-full mx-4"
        style={{ background: '#1f2937', border: '2px solid #ef4444' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-red-400 mb-4">Confirm Deletion</h2>
        <p className="mb-4 text-gray-300">
          You are about to permanently delete <strong>{items.length}</strong> image{items.length > 1 ? 's' : ''} from disk.
          This action cannot be undone.
        </p>
        <div
          className="max-h-48 overflow-y-auto mb-4 p-2 rounded text-sm"
          style={{ background: '#111827' }}
        >
          {items.map((src) => (
            <div key={src} className="py-1 text-gray-400 font-mono">{src}</div>
          ))}
        </div>
        <div className="flex gap-3 justify-end">
          <button
            className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white font-semibold"
            onClick={onConfirm}
          >
            Delete {items.length} image{items.length > 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
