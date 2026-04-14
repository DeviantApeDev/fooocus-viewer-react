import { useState, useCallback } from 'react'

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item !== null ? item : initialValue
    } catch (error) {
      return initialValue
    }
  })

  const setValue = useCallback((value) => {
    try {
      setStoredValue(value)
      localStorage.setItem(key, value)
    } catch (error) {
      console.error(error)
    }
  }, [key])

  return [storedValue, setValue]
}

export function getParam(item) {
  return localStorage.getItem(item)
}

export function saveParam(item, value) {
  localStorage.setItem(item, value)
}
