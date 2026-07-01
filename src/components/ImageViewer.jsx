import React, { useState, useEffect, useMemo } from 'react'
import { getParam, saveParam } from '../hooks/useLocalStorage'
import { getBatchData, getCurrentBatchData } from '../utils/batchUtils'
import BatchGallery from './BatchGallery'
import PageController from './PageController'
import GalleryController from './GalleryController'

export default function ImageViewer({ dateStr, data, setZoomImage, addToast, selectedImages, toggleSelection, onDeleteBatch, isFavorite, toggleFavorite }) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPageSelects = [8, 16, 32, 64, 128]

  const perPage = parseInt(getParam("nbImagePerPage")) || 32
  const [itemsPerPage, setItemsPerPage] = useState(perPage)
  const [asc, setAsc] = useState(false)
  const [showDiff, setShowDiff] = useState(getParam("displayDiff") === "true")
  const [showDetail, setShowDetail] = useState(getParam("displayDetails") !== "false")

  let initCols = 2
  if (typeof window !== 'undefined') {
    if (window.innerWidth > 800) initCols = 3
    if (window.innerWidth > 1200) initCols = 5
  }
  const savedCols = parseInt(getParam("nbColumns"))
  const [numColumns, setNumColumns] = useState(savedCols || initCols)

  const sortedData = useMemo(() => {
    if (!asc) return data
    return [...data].reverse()
  }, [data, asc])
  const batchData = useMemo(() => getBatchData(sortedData), [sortedData])

  useEffect(() => {
    setShowDetail(getParam("displayDetails") !== "false")
    setShowDiff(getParam("displayDiff") === "true")
    if (currentPage > Math.ceil(data.length / itemsPerPage)) {
      setCurrentPage(Math.max(1, Math.ceil(data.length / itemsPerPage)))
    }
  }, [itemsPerPage, dateStr, data.length])

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const numPages = Math.max(1, Math.ceil(data.length / itemsPerPage))
  const firstImageInPage = (currentPage - 1) * itemsPerPage + 1
  const lastImageInPage = Math.min(currentPage * itemsPerPage, data.length)

  const currentBatches = useMemo(
    () => getCurrentBatchData(sortedData, batchData, startIndex, endIndex),
    [sortedData, batchData, startIndex, endIndex]
  )

  const pageInfo = {
    currentPage, setCurrentPage, numPages,
    numImages: data.length, firstImageInPage, lastImageInPage
  }

  return (
    <div id="reactBox">
      <div className="px-4 py-1 flex flex-row flex-wrap justify-between">
        <div className="sm:basis-1/2 basis-full">
          <div>
            # of imgs/page:{" "}
            {itemsPerPageSelects.map((value) => (
              <label key={value} className="labelImgPerPage">
                <input
                  type="radio"
                  value={value}
                  checked={itemsPerPage === value}
                  onChange={() => { setItemsPerPage(value); saveParam("nbImagePerPage", value); setCurrentPage(1) }}
                />{" "}
                {value}
              </label>
            ))}
            <br />
          </div>
          <div>
            <label>
              Order:{" "}
              <button onClick={() => setAsc(!asc)}>
                {asc ? "\u2B06\uFE0F" : "\u2B07\uFE0F"}
              </button>
            </label>
            <label>
              &nbsp;&nbsp;Diff:{" "}
              <input
                type="checkbox"
                checked={showDiff}
                onChange={() => { saveParam("displayDiff", !showDiff); setShowDiff(!showDiff) }}
              />
            </label>
            <label>
              &nbsp;&nbsp;Batch Details:{" "}
              <input
                type="checkbox"
                checked={showDetail}
                onChange={() => { saveParam("displayDetails", !showDetail); setShowDetail(!showDetail) }}
              />
            </label>
          </div>
        </div>
        <div className="sm:basis-1/2 basis-full pt-2">
          <PageController {...pageInfo} />
        </div>
      </div>

      <div>
        {currentBatches.map((item) => (
          <BatchGallery
            key={item.timeStr + '-' + item.batchNumber}
            batch={item}
            showDiff={showDiff}
            showDetail={showDetail}
            numColumns={numColumns}
            setZoomImage={setZoomImage}
            sortedData={sortedData}
            addToast={addToast}
            selectedImages={selectedImages}
            toggleSelection={toggleSelection}
            onDeleteBatch={onDeleteBatch}
            isFavorite={isFavorite}
            toggleFavorite={toggleFavorite}
          />
        ))}
        <GalleryController
          numColumns={numColumns}
          setNumColumns={(val) => { setNumColumns(val); saveParam("nbColumns", val) }}
        />
      </div>

      <PageController {...pageInfo} scrollToTop />
    </div>
  )
}
