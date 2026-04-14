import React from 'react'
import { configs } from '../data/configs'

export default function ConfigPanel({ onClose }) {
  const handleDeleteConfig = () => {
    localStorage.clear()
    window.location.reload()
  }

  return (
    <div
      className="absolute z-50 p-3 rounded-lg"
      style={{
        top: '50px', left: '20px', color: '#fff',
        backgroundColor: '#000', border: '3px solid #999',
        boxShadow: '5px 5px 5px #333', fontSize: '12px',
        width: '320px', borderRadius: '10px',
      }}
    >
      <div className="text-lg text-center">Fooocus Log Viewer Configuration</div>

      {configs.map(config => (
        <div key={config.item} className="flex flex-row justify-between text-base my-1">
          <label className="text-sm">{config.label}</label>
          {config.type === "checkbox" && (
            <input
              type="checkbox"
              className="configItem"
              defaultChecked={localStorage.getItem(config.item) === "true"}
              onChange={(e) => localStorage.setItem(config.item, e.target.checked)}
            />
          )}
          {config.type === "integer" && (
            <input
              type="number"
              className="text-black text-xs px-1 w-32"
              defaultValue={localStorage.getItem(config.item) || config.value}
              onBlur={(e) => localStorage.setItem(config.item, e.target.value)}
            />
          )}
          {config.type === "text" && (
            <input
              type="text"
              className="text-black text-xs px-1 w-32"
              defaultValue={localStorage.getItem(config.item) || config.value}
              onBlur={(e) => localStorage.setItem(config.item, e.target.value)}
            />
          )}
        </div>
      ))}

      <div className="flex flex-row justify-between mt-2">
        <button
          className="text-sm bg-red-500 hover:bg-red-700 px-2 py-1 rounded-md font-semibold text-white"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="text-sm bg-sky-500 hover:bg-sky-700 px-2 py-1 rounded-md font-semibold text-white"
          onClick={() => { onClose(); window.location.reload() }}
        >
          Save & Reload
        </button>
      </div>
      <button
        className="text-sm bg-red-500 hover:bg-red-700 px-2 py-1 rounded-md font-semibold text-white mt-1 w-full"
        onClick={handleDeleteConfig}
      >
        Delete All Config
      </button>
    </div>
  )
}
