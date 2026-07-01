import { useState, useEffect, useCallback } from 'react'

export default function useFavorites() {
  const [favoriteImages, setFavoriteImages] = useState(new Set())
  const [showFavorites, setShowFavorites] = useState(() => {
    return localStorage.getItem('showFavorites') === 'true'
  })

  useEffect(() => {
    fetch('/api/favorites')
      .then(res => res.json())
      .then(({ favorites }) => {
        setFavoriteImages(new Set(favorites))
      })
      .catch(() => {})
  }, [])

  const toggleFavorite = useCallback((src) => {
    setFavoriteImages(prev => {
      const next = new Set(prev)
      if (next.has(src)) next.delete(src)
      else next.add(src)
      return next
    })

    fetch('/api/favorites/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ src }),
    })
      .then(res => res.json())
      .then(({ favorites }) => {
        setFavoriteImages(new Set(favorites))
      })
      .catch(() => {
        setFavoriteImages(prev => {
          const next = new Set(prev)
          if (next.has(src)) next.delete(src)
          else next.add(src)
          return next
        })
      })
  }, [])

  const isFavorite = useCallback((src) => {
    return favoriteImages.has(src)
  }, [favoriteImages])

  const handleSetShowFavorites = useCallback((val) => {
    setShowFavorites(val)
    localStorage.setItem('showFavorites', val)
  }, [])

  return {
    favoriteImages,
    toggleFavorite,
    isFavorite,
    showFavorites,
    setShowFavorites: handleSetShowFavorites,
  }
}
