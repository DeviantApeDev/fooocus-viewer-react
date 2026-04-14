import React from 'react'

export default function CalendarList({ workingDates, detailDates, onSelectDate, onClose }) {
  if (workingDates.length === 0) {
    return (
      <div className="px-2 pt-2 pb-1">
        <div className="text-center p-4">No working dates found yet...</div>
        <button
          className="text-sm bg-slate-500 hover:bg-slate-700 px-2 py-1 rounded-md text-white"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    )
  }

  return (
    <div className="px-2 pt-2 pb-1">
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
        {workingDates.map((wd, i) => {
          const parts = wd.split("-")
          const dt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
          return (
            <div
              key={wd}
              className="flex justify-between items-center text-sm font-bold px-2 py-1 cursor-pointer rounded"
              style={{
                color: '#fff',
                border: '1px solid #ba00bd',
                borderRadius: '5px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#ba00bd' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '' }}
              onClick={() => { onSelectDate(wd); onClose() }}
              title={wd}
            >
              <span>{dt.toLocaleDateString()}</span>
              <span
                className="rounded px-1 text-right"
                style={{ background: '#ba00bd', fontWeight: 'bold', color: '#fff' }}
              >
                {detailDates[wd] || 0} <span>&#x1F4F7;</span>
              </span>
            </div>
          )
        })}
      </div>
      <button
        className="mt-2 text-sm bg-slate-500 hover:bg-slate-700 px-2 py-1 rounded-md text-white"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  )
}
