import { diffWords, diffArrays } from 'diff'

const isSameBatch = (a, b) => {
  const compareKeys = [
    "Prompt", "Negative Prompt", "Base Model",
    "Refiner Model", "Styles", "Performance"
  ]
  if (compareKeys.some((key) => a[key] !== b[key])) return false
  if (!!a["Fooocus V2 (Prompt Expansion)"] !== !!b["Fooocus V2 (Prompt Expansion)"]) return false

  const [aLoRAKeys, bLoRAKeys] = [a, b].map((item) =>
    Object.keys(item).filter((key) => key.startsWith("LoRA ["))
  )
  const [aLoRAs, bLoRAs] = [aLoRAKeys, bLoRAKeys].map((keys) =>
    keys.map((key) => ({
      LoRAName: key.split("]")[0].replace("[", ""),
      LoRAWeight: a[key],
    }))
  )
  if (aLoRAs.length !== bLoRAs.length) return false
  if (aLoRAs.some((aLoRA, idx) =>
    aLoRA.LoRAName !== bLoRAs[idx].LoRAName ||
    aLoRA.LoRAWeight !== bLoRAs[idx].LoRAWeight
  )) return false
  return true
}

const getLoRAsDiff = (prevLoRAs, currLoRAs) => {
  const newLoRAs = currLoRAs.filter(
    (curr) => !prevLoRAs.some((prev) => prev.name === curr.name)
  )
  const removedLoRAs = prevLoRAs.filter(
    (prev) => !currLoRAs.some((curr) => curr.name === prev.name)
  )
  const changedLoRAs = currLoRAs.filter((curr) => {
    const prev = prevLoRAs.find((p) => p.name === curr.name)
    return prev && prev.weight !== curr.weight
  })

  const result = []
  newLoRAs.forEach((lora) => {
    result.push({ type: 'added', text: `${lora.name}: ${lora.weight}` })
  })
  changedLoRAs.forEach((lora) => {
    result.push({ type: 'changed', name: lora.name, weight: lora.weight })
  })
  removedLoRAs.forEach((lora) => {
    result.push({ type: 'removed', text: `${lora.name}: ${lora.weight}` })
  })
  return result
}

export const getBatchData = (data) => {
  const batchData = []
  const isAsc = data.length < 2 || data[0].src < data[1].src

  for (let i = 0; i < data.length; i++) {
    if (i === 0 || !isSameBatch(data[i], data[i - 1])) {
      batchData.push({
        batchSettings: {
          "Base Model": data[i]["Base Model"],
          "Refiner Model": data[i]["Refiner Model"],
          "Refiner Switch": data[i]["Refiner Switch"] ?? "",
          Prompt: data[i]["Prompt"],
          "Negative Prompt": data[i]["Negative Prompt"],
          Styles: data[i]["Styles"],
          "Performance": data[i]["Performance"],
          "Use Fooocus V2 (Prompt Expansion)": data[i]["Fooocus V2 Expansion"] ? "true" : "false",
          LoRAs: [],
        },
        batchSettingDiffs: {
          "Base Model": [], "Refiner Model": [], "Refiner Switch": [],
          "Use Fooocus V2 (Prompt Expansion)": [], Prompt: "",
          "Performance": [], "Negative Prompt": [], LoRAs: [], Styles: []
        },
        timeStr: data[i].src.split("_")[1].replaceAll("-", ":"),
        currentPageData: [],
        startIndex: i,
        endIndex: i,
      })
      Object.keys(data[i]).forEach((key) => {
        if (key.startsWith("crudLoras")) {
          try {
            for (let j = 0; j < data[i][key].length; j++) {
              const lora = data[i][key][j].split(":")
              batchData[batchData.length - 1].batchSettings.LoRAs.push({
                name: lora[0].trim(),
                weight: lora[1].trim()
              })
            }
          } catch (e) {
            console.log("error get lora " + e)
          }
        }
      })
    } else {
      if (batchData.length > 0) {
        batchData[batchData.length - 1].endIndex = i
      }
    }
  }

  for (let i = 0; i < batchData.length; i++) {
    batchData[i].batchNumber = isAsc ? i + 1 : batchData.length - i
  }

  for (let i = 0; i < batchData.length; i++) {
    if ((isAsc && i === 0) || (!isAsc && i === batchData.length - 1)) continue
    if (!batchData[i].batchSettings["Base Model"]) continue

    const oldBatches = isAsc ? batchData.slice(0, i).reverse() : batchData.slice(i + 1)
    const prevBatchIndex = oldBatches.findIndex((batch) => batch.batchSettings["Base Model"])
    if (prevBatchIndex < 0) continue

    const prevBatch = oldBatches[prevBatchIndex]
    const currBatch = batchData[i]

    const diffKeys = ["Base Model", "Refiner Model", "Refiner Switch",
      "Use Fooocus V2 (Prompt Expansion)", "Prompt", "Negative Prompt"]

    diffKeys.forEach((prompt) => {
      const prev = String(prevBatch.batchSettings[prompt] || "")
      const curr = String(currBatch.batchSettings[prompt] || "")

      if (prompt === 'Prompt' || prompt === 'Negative Prompt') {
        const prevPhrases = prev.split(', ')
        const currPhrases = curr.split(', ')
        const diff = diffArrays(prevPhrases, currPhrases)
        let key = 0
        const parts = diff.flatMap((part) =>
          part.value.map((phrase) => ({
            key: key++,
            added: part.added || false,
            removed: part.removed || false,
            value: phrase + ', '
          }))
        )
        if (parts.length > 0) {
          parts[parts.length - 1].value = parts[parts.length - 1].value.slice(0, -2)
        }
        currBatch.batchSettingDiffs[prompt] = parts
      } else {
        const diff = diffWords(prev, curr)
        currBatch.batchSettingDiffs[prompt] = diff.map((part, idx) => ({
          key: idx,
          added: part.added || false,
          removed: part.removed || false,
          value: part.value
        }))
      }
    })

    currBatch.batchSettingDiffs.LoRAs = getLoRAsDiff(
      prevBatch.batchSettings.LoRAs,
      currBatch.batchSettings.LoRAs
    )
  }

  return batchData
}

export const getCurrentBatchData = (data, batchData, startIndex, endIndex) => {
  for (let i = 0; i < batchData.length; i++) {
    batchData[i].currentPageData = []
  }
  for (let i = startIndex; i < endIndex; i++) {
    const batchIndex = batchData.findIndex(
      (batch) => i >= batch.startIndex && i <= batch.endIndex
    )
    if (batchIndex >= 0) {
      batchData[batchIndex].currentPageData.push(data[i])
    }
  }
  return batchData.filter((batch) => batch.currentPageData.length > 0)
}
