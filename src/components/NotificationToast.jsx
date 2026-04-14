import React from 'react'

export default function NotificationToast({ toasts, removeToast }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2" style={{ zIndex: 20000 }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="p-2 rounded shadow-lg cursor-pointer max-w-sm"
          style={{
            background: toast.theme === 'newimage' ? '#000' : '#ba00bd',
            border: '1px solid #ba00bd',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '14px',
            boxShadow: '5px 5px 5px #000',
          }}
          onClick={() => removeToast(toast.id)}
          dangerouslySetInnerHTML={{ __html: toast.content }}
        />
      ))}
    </div>
  )
}
