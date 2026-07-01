import React from 'react'

export default function Header({
  dateStr, goYesterday, goTomorrow, handleUpdateDate,
  playSound, setPlaySound, autoReload, setAutoReload,
  isToday, isLoading, showSearch, showCalendar, showConfigPanel, promiseAll, onDeleteDay
}) {
  return (
    <div className="px-1 py-0 flex flex-wrap items-center justify-between">
      <div>
        <button
          onClick={showConfigPanel}
          className="px-2 mx-2 text-xl"
          title="Configuration"
        >
          &#x2699;
        </button>

        <span className="hidden sm:inline">Fooocus Log Viewer</span>

        <button className="px-2 mx-2 text-xl" onClick={goYesterday} title="Previous day">
          &#x25C0;&#xFE0F;
        </button>

        <input
          id="inputDay"
          className="text-gray-900"
          type="date"
          value={dateStr}
          onChange={(e) => handleUpdateDate(e.target.value)}
        />

        <button className="px-2 mx-2 text-xl" onClick={goTomorrow} title="Next day">
          &#x25B6;&#xFE0F;
        </button>

        <button
          onClick={showSearch}
          className="px-2 mx-2 text-xl"
          title="Search"
          style={{ opacity: promiseAll ? 1 : 0.5 }}
        >
          &#x1F50D;
        </button>

        <div
          className="inline-block px-2 text-2xl cursor-pointer"
          title="Show list of all working days"
          onClick={showCalendar}
        >
          &#128197;
        </div>

        <label>
          Sound on new Image:
          <input
            className="ml-1 mr-3"
            type="checkbox"
            checked={playSound}
            onChange={() => setPlaySound(!playSound)}
          />
        </label>

        {isToday ? (
          <label>
            {isLoading ? (
              <span className="text-gray-500">Loading...</span>
            ) : (
              "AutoReload:"
            )}
            <input
              className="ml-1 mr-3"
              type="checkbox"
              checked={autoReload}
              onChange={() => setAutoReload(!autoReload)}
            />
          </label>
        ) : (
          isLoading && <span className="text-gray-500">Loading...</span>
        )}
      </div>

      {onDeleteDay && (
        <button
          className="px-3 py-1 rounded text-sm font-semibold text-white mr-2"
          style={{ background: '#dc2626' }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
          onClick={onDeleteDay}
        >
          &#x1F5D1; Delete Day
        </button>
      )}
    </div>
  )
}
