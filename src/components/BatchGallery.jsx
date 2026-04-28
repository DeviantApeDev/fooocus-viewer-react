import React, { useState } from 'react'
import ImageCard from './ImageCard'

export default function BatchGallery({ batch, showDiff, showDetail, numColumns, setZoomImage, sortedData, addToast, selectedImages, toggleSelection, onDeleteBatch }) {
  const numBatchImages = batch.endIndex - batch.startIndex + 1
  const [notFoundCount, setNotFoundCount] = useState(0)

  return (
    <div className="py-2">
      <div className="border m-2 p-2">
        <p className="flex justify-between">
          <span className="text-base mb-0">
            <strong>Batch {batch.batchNumber}</strong> ({numBatchImages} Images
            {notFoundCount > 0 && (
              <span className="batchError"> / {notFoundCount} not found</span>
            )})
          </span>
          <span className="flex items-center gap-2">
            {batch.timeStr}
            <button
              title="Delete entire batch"
              className="text-red-500 hover:text-red-400 hover:bg-red-900/30 rounded p-1"
              onClick={() => onDeleteBatch(batch.currentPageData.map(img => img.src))}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
              </svg>
            </button>
          </span>
        </p>

        {!showDetail && (
          <div>
            <strong>{(batch.batchSettings["Base Model"] || "").replace(".safetensors", "")}</strong>
            {batch.batchSettings["Refiner Model"] !== "None" && (
              <>
                &nbsp;/&nbsp;<strong>{(batch.batchSettings["Refiner Model"] || "").replace(".safetensors", "")}</strong>
                &nbsp;x {batch.batchSettings["Refiner Switch"]}
              </>
            )}
            &nbsp;/&nbsp;<strong>{batch.batchSettings["Performance"]}</strong>
          </div>
        )}

        {showDetail && (
          <div>
            {Object.entries(batch.batchSettings).map(([key, value], idx) => (
              <div key={idx} className="text-sm">
                <strong>{key}:</strong>{" "}
                {batch.batchSettingDiffs[key] &&
                  batch.batchSettingDiffs[key].length > 0 &&
                  showDiff ? (
                  <span>
                    {batch.batchSettingDiffs[key].map((v) => (
                      <span key={v.key}>
                        {v.added && <span className="text-green-500">{v.value}</span>}
                        {v.removed && <s className="text-red-500">{v.value}</s>}
                        {!v.added && !v.removed && <span>{v.value}</span>}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span>
                    {key === "LoRAs" ? (
                      <>
                        <br />
                        <span>
                          {value.map((LoRA, i) => (
                            <span key={i}>
                              {LoRA.name}: {LoRA.weight}
                              {i < value.length - 1 ? <br /> : ""}
                            </span>
                          ))}
                        </span>
                      </>
                    ) : Array.isArray(value) ? (
                      <></>
                    ) : key === "Styles" ? (
                      <div className="flex">
                        {(value || "").replace(/'/g, "").replace("[", "").replace("]", "").split(", ").map((style, i) => (
                          style.trim() !== "" && (
                            <div key={i} className="flex-initial text-center mx-1 styleContainer">
                              <img
                                src={`/file=sdxl_styles/samples/${style.toLowerCase().replace(/ /g, "_")}.jpg`}
                                className="styleImage"
                                alt={style}
                                onError={(e) => { e.target.style.display = 'none' }}
                              />
                              <span className="styleTitle">{style}</span>
                            </div>
                          )
                        ))}
                      </div>
                    ) : (
                      value
                    )}
                  </span>
                )}
              </div>
            ))}

            {batch.batchSettingDiffs.LoRAs && batch.batchSettingDiffs.LoRAs.length > 0 && showDiff && (
              <div className="text-sm">
                <strong>LoRA Changes:</strong>
                {batch.batchSettingDiffs.LoRAs.map((diff, i) => (
                  <div key={i}>
                    {diff.type === 'added' && <span className="text-green-500">{diff.text}</span>}
                    {diff.type === 'removed' && <s className="text-red-500">{diff.text}</s>}
                    {diff.type === 'changed' && (
                      <span>{diff.name}: <span className="text-green-500">{diff.weight}</span></span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <div className={`grid gap-1 p-1`} style={{ gridTemplateColumns: `repeat(${numColumns}, minmax(0, 1fr))` }}>
          {batch.currentPageData.map((imgData, idx) => (
            <ImageCard
              key={imgData.src + idx}
              data={imgData}
              index={batch.startIndex + idx}
              maxIndex={sortedData ? sortedData.length - 1 : 0}
              setZoomImage={setZoomImage}
              addToast={addToast}
              onError={() => setNotFoundCount(prev => prev + 1)}
              selectedImages={selectedImages}
              toggleSelection={toggleSelection}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
