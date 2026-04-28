export function goSearch(allImages, searchText, selectedModels, selectedStyles) {
  const searchResults = []
  const txt = searchText.trim()
  const models = selectedModels
  const styles = selectedStyles

  if (txt === "" && models.length === 0 && styles.length === 0) {
    return { results: [], empty: true }
  }

  const reg = new RegExp("[ ,;]+", "g")

  for (let i = 0; i < allImages.length; i++) {
    let found = false
    const img = allImages[i]

    if (txt !== "") {
      const mots = txt.split(reg)
      found = true
      for (let j = 0; j < mots.length; j++) {
        if (img.Prompt.toLowerCase().indexOf(mots[j].toLowerCase().trim()) >= 0) {
          found = true
        } else {
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
