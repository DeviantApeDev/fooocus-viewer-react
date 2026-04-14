import React, { useState } from 'react'
import ImageCard from './ImageCard'

export default function BatchGallery({ batch, showDiff, showDetail, numColumns, setZoomImage, sortedData, addToast }) {
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
          <span>{batch.timeStr}</span>
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
            />
          ))}
        </div>
      </div>
    </div>
  )
}
