export const parseLog = (html) => {
  const data = []
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, "text/html")
  const images = doc.querySelectorAll("div[id$='_png'],div[id$='_jpg'],div[id$='_jpeg'],div[id$='_webp']")

  for (let i = 0; i < images.length; i++) {
    const paragraphs = images[i].querySelectorAll("p")
    const divs = images[i].querySelectorAll("div")
    const trs = images[i].querySelectorAll("tr")
    const settings = {}
    let src

    if (paragraphs.length === 0) {
      src = divs[0].innerText
      settings.crudLoras = []
      for (let j = 1; j < trs.length; j++) {
        const row = trs[j]
        const labelTd = row.querySelector("td.label")
        const key = labelTd ? labelTd.textContent : row.querySelector("td.key").textContent
        const value = row.querySelector("td.value").textContent
        if (key.substr(0, 4) === "LoRA") {
          settings["crudLoras"].push(value)
        } else {
          settings[key] = value
        }
      }
    } else {
      src = paragraphs[0].textContent
      if (src === "") { src = paragraphs[1].textContent }
      for (let j = 1; j < paragraphs.length; j++) {
        const nodes = paragraphs[j].childNodes
        for (let n = 0; n < nodes.length; n++) {
          const node = nodes[n]
          if (node.nodeName === "B") {
            const key = node.previousSibling.textContent
              .replace(": ", "")
              .replace(", ", "")
            const value = node.textContent
            settings[key] = value
          }
        }
      }
    }
    if (settings["Prompt"]) {
      data.push({ src, ...settings })
    }
  }

  return { data }
}

export function decodeFooocusJSON(jsonSource) {
  var json
  try {
    json = JSON.parse(jsonSource)
  } catch (err) {
    return { html: "ERROR PARSE JSON", copy: {} }
  }

  let version = "?"
  if (typeof json.Version !== "undefined") version = json.Version

  json.copy = {}
  json.copy["Prompt"] = json["Prompt"]
  json.copy["Negative Prompt"] = json["Negative Prompt"]
  json.copy["Fooocus V2 Expansion"] = json["Fooocus V2 Expansion"]
  json.copy["Styles"] = json["Styles"]
  json.copy["Performance"] = json["Performance"]
  json.copy["Resolution"] = json["Resolution"]
  json.copy["Sharpness"] = json["Sharpness"]
  json.copy["Guidance Scale"] = json["Guidance Scale"]
  json.copy["ADM Guidance"] = json["ADM Guidance"]
  json.copy["Base Model"] = json["Base Model"]
  json.copy["Refiner Model"] = json["Refiner Model"]
  json.copy["Refiner Switch"] = json["Refiner Switch"]
  json.copy["Sampler"] = json["Sampler"]
  json.copy["Scheduler"] = json["Scheduler"]
  json.copy["Seed"] = json["Seed"]
  json.copy["Version"] = version

  json.styles = []
  if (json.Styles !== "[]") {
    const reg = new RegExp("(')", "g")
    json.styles = json.Styles.replace("[", "").replace(reg, "").replace("]","").split(", ")
  }

  if (typeof json.crudLoras !== "undefined") {
    json.loras = []
    for (let k in json.crudLoras) {
      const explode = json.crudLoras[k].replace(" : ", ":").split(":")
      json.loras.push({ name: explode[0], weight: explode[1] })
    }
  } else {
    json.loras = []
    for (let k in json) {
      if (k.substr(0, 6) === "LoRA [") {
        json.loras.push({
          name: k.replace("LoRA [", "").replace("] weight", ""),
          weight: json[k]
        })
      }
    }
  }

  for (let i = 0; i < json.loras.length; i++) {
    json.copy["LoRA " + (i + 1)] = json.loras[i].name + " : " + json.loras[i].weight
  }

  return json
}
