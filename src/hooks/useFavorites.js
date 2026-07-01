import { useState, useEffect, useCallback } from 'react'

export default function useFavorites(addToast) {
  const [favoriteImages, setFavoriteImages] = useState(new Set())
  const [showFavorites, setShowFavorites] = useState(false)

  useEffect(() => {
    fetch('/api/favorites')
      .then(res => {
        if (!res.ok) throw new Error(res.status)
        return res.json()
      })
      .then(({ favorites }) => {
        setFavoriteImages(new Set(favorites))
      })
      .catch(() => {
        fetch('/file=outputs/favorites.json')
          .then(res => {
            if (!res.ok) throw new Error(res.status)
            return res.json()
          })
          .then(favorites => {
            setFavoriteImages(new Set(favorites))
          })
          .catch((err) => {
            console.error('Failed to load favorites:', err)
          })
      })
  }, [])

  const toggleFavorite = useCallback((src, dt) => {
    fetch('/api/favorites/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ src, dt }),
    })
      .then(res => {
        if (!res.ok) throw new Error(res.status)
        return res.json()
      })
      .then(({ favorites }) => {
        setFavoriteImages(new Set(favorites))
      })
      .catch(() => {
        addToast('Favorites require the server to be running', 'dark')
      })
  }, [addToast])

  const isFavorite = useCallback((src) => {
    return favoriteImages.has(src)
  }, [favoriteImages])

  return {
    favoriteImages,
    setFavoriteImages,
    toggleFavorite,
    isFavorite,
    showFavorites,
    setShowFavorites,
  }
}
