import React, { useState, useEffect, useCallback, useRef } from 'react'
import { getDateStr } from './utils/imageUtils'
import { parseLog } from './utils/parseLog'
import { playNotificationSound } from './utils/soundUtils'
import { saveParam } from './hooks/useLocalStorage'
import Header from './components/Header'
import ImageViewer from './components/ImageViewer'
import SearchPanel from './components/SearchPanel'
import CalendarList from './components/CalendarList'
import ZoomModal from './components/ZoomModal'
import NotificationToast from './components/NotificationToast'
import ConfigPanel from './components/ConfigPanel'

export default function App() {
  const [date, setDate] = useState(() => {
    const saved = localStorage.getItem("viewerDate")
    return saved ? new Date(saved) : new Date()
  })
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCorsError, setIsCorsError] = useState(false)
  const [isNotFoundError, setIsNotFoundError] = useState(false)
  const [autoReload, setAutoReload] = useState(() => {
    return localStorage.getItem("autoReloadToday") === "true"
  })
  const [playSound, setPlaySound] = useState(() => {
    return localStorage.getItem("playSound") !== "false"
  })
  const [showSearch, setShowSearch] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [zoomImage, setZoomImage] = useState(null)
  const [allImages, setAllImages] = useState([])
  const [allModels, setAllModels] = useState([])
  const [allStyles, setAllStyles] = useState([])
  const [workingDates, setWorkingDates] = useState([])
  const [detailDates, setDetailDates] = useState({})
  const [promiseAll, setPromiseAll] = useState(false)
  const [toasts, setToasts] = useState([])
  const [nbTodayImages, setNbTodayImages] = useState(0)
  const lastLogSizeRef = useRef(null)
  const playSoundRef = useRef(true)
  const nbTodayImagesRef = useRef(0)
  const allModelsRef = useRef([])
  const allStylesRef = useRef([])
  const checkNewImageRef = useRef(null)

  useEffect(() => { playSoundRef.current = playSound }, [playSound])
  useEffect(() => { nbTodayImagesRef.current = nbTodayImages }, [nbTodayImages])
  useEffect(() => { allModelsRef.current = allModels }, [allModels])
  useEffect(() => { allStylesRef.current = allStyles }, [allStyles])

  const isToday = date.toDateString() === new Date().toDateString()
  const dateStr = getDateStr(date)

  const addToast = useCallback((content, theme = 'dark') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, content, theme }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const goPlaySound = useCallback(() => {
    if (playSoundRef.current) {
      playNotificationSound()
    }
  }, [])

  const getWorkingDate = useCallback((dt, way) => {
    const dtComp = getDateStr(dt)
    if (workingDates.length > 0) {
      if (way > 0) {
        for (let i = workingDates.length - 1; i >= 0; i--) {
          if (workingDates[i] >= dtComp) return new Date(workingDates[i])
        }
      } else {
        for (let i = 0; i < workingDates.length; i++) {
          if (workingDates[i] <= dtComp) return new Date(workingDates[i])
        }
      }
    }
    return dt
  }, [workingDates])

  const handleUpdateDate = useCallback((dateStr) => {
    const [year, month, day] = dateStr.split("-").map(Number)
    setDate(new Date(year, month - 1, day))
  }, [])

  const goTomorrow = useCallback(() => {
    const tomorrow = new Date(date)
    tomorrow.setDate(tomorrow.getDate() + 1)
    setDate(getWorkingDate(tomorrow, 1))
  }, [date, getWorkingDate])

  const goYesterday = useCallback(() => {
    const yesterday = new Date(date)
    yesterday.setDate(yesterday.getDate() - 1)
    setDate(getWorkingDate(yesterday, -1))
  }, [date, getWorkingDate])

  const goToDate = useCallback((dateStr) => {
    const parts = dateStr.split("-")
    const day = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
    setDate(day)
  }, [])

  const fetchData = useCallback(({ silent } = {}) => {
    if (!isToday) setAutoReload(false)
    localStorage.setItem("viewerDate", date.toDateString())
    if (!silent) setIsLoading(true)
    const fetchOpts = isToday ? { cache: "no-store" } : {}
    fetch(`./${dateStr}/log.html`, fetchOpts)
      .then((response) => {
        if (!response.ok) console.log(`Nothing to load on ${dateStr}`)
        return response.text()
      })
      .then((text) => parseLog(text))
      .then((parsed) => {
        parsed.data.sort((a, b) => b.src.localeCompare(a.src))
        setData(parsed.data)
        setIsNotFoundError(false)
        setIsCorsError(false)
        setIsLoading(false)
      })
      .catch((e) => {
        if (e.name === "TypeError") setIsCorsError(true)
        if (e.name === "SyntaxError") setIsNotFoundError(true)
        setData(null)
        setIsLoading(false)
      })
  }, [dateStr, isToday])

  useEffect(fetchData, [fetchData])

  useEffect(() => {
    if (autoReload) {
      const interval = setInterval(() => fetchData({ silent: true }), 15000)
      return () => clearInterval(interval)
    }
  }, [autoReload, fetchData])

  const checkNewImage = useCallback(() => {
    const today = getDateStr(new Date())
    fetch(`./${today}/log.html`, { method: "HEAD", cache: "no-store" })
      .then(headRes => {
        if (!headRes.ok) throw new Error("not found")
        const size = headRes.headers.get("Content-Length")
        if (size && size === lastLogSizeRef.current) {
          setTimeout(checkNewImageRef.current, 5000)
          return
        }
        lastLogSizeRef.current = size
        return fetch(`./${today}/log.html`, { cache: "no-store" })
          .then(response => response.text())
          .then(text => {
            const matches = text.match(/<div id=\"([a-z0-9_\-])+\"/g)
            const nb = (matches || []).length
            if (nb > nbTodayImagesRef.current && nbTodayImagesRef.current > 0) {
              const n = nb - nbTodayImagesRef.current
              matches.sort()
              const src = matches[matches.length - 1]
                .replace('<div id="', "")
                .replace("_png", ".png").replace("_jpg", ".jpg")
                .replace("_jpeg", ".jpeg").replace("_webp", ".webp")
                .replace('"', "")
              addToast(
                `Yeah! ${n} new Image${n > 1 ? 's' : ''} generated<br><img src='./${today}/${src}' class='imageNotice'>`,
                'newimage'
              )
              goPlaySound()
            }
            setNbTodayImages(nb)

            if (nb > 0) {
              const newData = parseLog(text)
              setWorkingDates(prev => {
                if (prev.includes(today)) return prev
                return [today, ...prev]
              })
              setDetailDates(prev => ({ ...prev, [today]: nb }))

              setAllImages(prevAllImages => {
                const filtered = prevAllImages.filter(img => img.dt !== today)
                const newImages = []
                const modelsSet = new Set(allModelsRef.current)
                const stylesSet = new Set(allStylesRef.current)

                for (let i = newData.data.length - 1; i >= 0; i--) {
                  const img = { ...newData.data[i], dt: today }
                  modelsSet.add(img["Base Model"])
                  img.styles = []
                  if (img.Styles !== "[]") {
                    const reg = new RegExp("(')", "g")
                    img.styles = img.Styles.replace("[", "").replace(reg, "").replace("]", "").split(", ")
                  }
                  img.styles.forEach(s => stylesSet.add(s))
                  newImages.push(img)
                }
                setAllModels([...modelsSet])
                setAllStyles([...stylesSet])
                return [...newImages, ...filtered]
              })
            }
            setTimeout(checkNewImageRef.current, 5000)
          })
      })
      .catch(() => setTimeout(checkNewImageRef.current, 5000))
  }, [addToast, goPlaySound])

  checkNewImageRef.current = checkNewImage

  useEffect(() => {
    const timer = setTimeout(checkNewImageRef.current, 1000)
    return () => clearTimeout(timer)
  }, [])

  const calendarGeneration = useCallback(() => {
    const wd = []
    const dd = {}
    const imgs = []
    const modelsSet = new Set()
    const stylesSet = new Set()

    function addDay(dt, day) {
      const dt2 = new Date(dt)
      dt2.setDate(dt2.getDate() + day)
      return getDateStr(dt2)
    }

    const todayStr = getDateStr(new Date())
    const nbDaysToScan = parseInt(localStorage.getItem("nbDaysToScan")) || 999
    const dates = []
    for (let i = 0; i < nbDaysToScan; i++) {
      dates.push(addDay(todayStr, -1 * i))
    }

    const requests = dates.map(dt =>
      fetch(`./${dt}/log.html`)
        .then(response => {
          if (response.ok) wd.push(dt)
          return response.text()
        })
        .then(text => {
          dd[dt] = (text.match(/<div id=/g) || []).length
          const parsed = parseLog(text)
          for (let i = 0; i < parsed.data.length; i++) {
            const img = { ...parsed.data[i], dt }
            if (img.Prompt) {
              imgs.push(img)
              modelsSet.add(img["Base Model"])
              img.styles = []
              if (img.Styles !== "[]") {
                const reg = new RegExp("(')", "g")
                img.styles = img.Styles.replace("[", "").replace(reg, "").replace("]", "").split(", ")
              }
              img.styles.forEach(s => { if (s) stylesSet.add(s) })
            }
          }
        })
        .catch(() => {})
    )

    Promise.all(requests).then(() => {
      setPromiseAll(true)
      addToast("Calendar and Search mode are now active.")
      wd.sort()
      wd.reverse()
      setWorkingDates(wd)
      setDetailDates(dd)
      imgs.sort((a, b) => b.src.localeCompare(a.src))
      setAllImages(imgs)
      setAllModels([...modelsSet].sort())
      setAllStyles([...stylesSet].sort())
    }).catch(err => console.log(err))
  }, [addToast])

  useEffect(() => {
    const timer = setTimeout(calendarGeneration, 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="pb-2">
      <Header
        dateStr={dateStr}
        goYesterday={goYesterday}
        goTomorrow={goTomorrow}
        handleUpdateDate={handleUpdateDate}
        playSound={playSound}
        setPlaySound={(val) => { setPlaySound(val); saveParam("playSound", val) }}
        autoReload={autoReload}
        setAutoReload={(val) => { setAutoReload(val); saveParam("autoReloadToday", val); if (!autoReload) fetchData() }}
        isToday={isToday}
        isLoading={isLoading}
        showSearch={() => { if (promiseAll) { setShowSearch(prev => !prev); setShowCalendar(false) } else addToast("All logs and images are not processed. Please wait...") }}
        showCalendar={() => { if (promiseAll) { setShowCalendar(prev => !prev); setShowSearch(false) } else addToast("All logs and images are not processed. Please wait...") }}
        showConfigPanel={() => setShowConfig(prev => !prev)}
        promiseAll={promiseAll}
      />

      {showConfig && <ConfigPanel onClose={() => setShowConfig(false)} />}

      {showSearch && (
        <SearchPanel
          allImages={allImages}
          allModels={allModels}
          allStyles={allStyles}
          workingDates={workingDates}
          onClose={() => setShowSearch(false)}
          setZoomImage={setZoomImage}
          addToast={addToast}
        />
      )}

      {showCalendar && (
        <CalendarList
          workingDates={workingDates}
          detailDates={detailDates}
          onSelectDate={goToDate}
          onClose={() => setShowCalendar(false)}
        />
      )}

      {!isLoading && !showSearch && (
        <>
          {isCorsError && (
            <p className="text-center m-16">
              Put this viewer.html file in Fooocus/outputs directory
              <br /><br />
              Please access viewer.html from your Fooocus local server.<br />
              In most cases, the URL is<br />
              <button className="p-2 shadow-sm bg-purple-500 rounded-md">
                <a href="http://localhost:7860/file=outputs/viewer.html">
                  http://localhost:7860/file=outputs/viewer.html
                </a>
              </button>
              <br /><br />or<br /><br />
              <a className="p-2 shadow-sm bg-purple-500 rounded-md" href="http://localhost:7865/file=outputs/viewer.html">
                http://localhost:7865/file=outputs/viewer.html
              </a>
            </p>
          )}
          {isNotFoundError && (
            <p className="text-center m-16">{dateStr}/log.html Not found.</p>
          )}
        </>
      )}

      {!showSearch && (
        data && data.length > 0 ? (
          <ImageViewer
            dateStr={dateStr}
            data={data}
            setZoomImage={setZoomImage}
            addToast={addToast}
          />
        ) : (
          !isLoading && !isCorsError && !isNotFoundError && (
            <div>
              <p className="text-center m-16">No data in this folder</p>
              {promiseAll && workingDates.length > 0 && (
                <p className="text-center m-2">
                  <button
                    className="p-2 shadow-sm bg-purple-500 rounded-md cursor-pointer"
                    onClick={() => goToDate(workingDates[workingDates.length - 1])}
                  >
                    Click to see the earliest generation date
                  </button>
                </p>
              )}
            </div>
          )
        )
      )}

      {zoomImage && (
        <ZoomModal
          image={zoomImage}
          allImages={showSearch ? allImages : data}
          filterImages={zoomImage.filterImages || null}
          onClose={() => setZoomImage(null)}
          addToast={addToast}
        />
      )}

      <NotificationToast toasts={toasts} removeToast={removeToast} />

      <p className="p-5">
        <span className="mx-5">Release 2.0.0</span>
        <a href="https://github.com/DeviantApeDev/fooocus-viewer-react" target="_blank" rel="noopener noreferrer" className="underline text-slate-200 hover:text-slate-50">
          Bug report/ideas/discussions on GitHub
        </a>
      </p>
    </div>
  )
}
