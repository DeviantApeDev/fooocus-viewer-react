export function goSearch(allImages, searchText, selectedModels, selectedStyles, wordMatch = false) {
  const searchResults = []
  const txt = searchText.trim()
  const models = selectedModels
  const styles = selectedStyles

  if (txt === "" && models.length === 0 && styles.length === 0) {
    return { results: [], empty: true }
  }

  const reg = new RegExp("[ ,;]+", "g")
  const tokens = txt !== "" ? txt.split(reg).map(m => m.toLowerCase().trim()).filter(Boolean) : []
  const wordRegexes = wordMatch ? tokens.map(t => new RegExp(`\\b${t}\\b`)) : []

  for (let i = 0; i < allImages.length; i++) {
    let found = false
    const img = allImages[i]

    if (tokens.length > 0) {
      const promptLower = img.Prompt.toLowerCase()
      found = true
      for (let j = 0; j < tokens.length; j++) {
        const match = wordMatch
          ? wordRegexes[j].test(promptLower)
          : promptLower.indexOf(tokens[j]) >= 0
        if (!match) {
          found = false
          break
        }
      }
    } else {
      found = true
    }

    if (models.length > 0 && found) {
      found = models.includes(img["Base Model"].replace(".safetensors", ""))
    }

    if (styles.length > 0 && found) {
      found = false
      for (let j = 0; j < styles.length; j++) {
        if (img.Styles.includes(styles[j])) {
          found = true
          break
        }
      }
    }

    if (found) {
      searchResults.push(img)
    }
  }

  return { results: searchResults, empty: false }
}
