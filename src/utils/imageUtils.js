export const getDateStr = (date) => {
  return date
    .toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replaceAll("/", "-")
}

export function reduce(numerator, denominator) {
  const gcd = function gcd(a, b) {
    return b ? gcd(b, a % b) : a
  }
  const g = gcd(numerator, denominator)
  return [numerator / g, denominator / g]
}

export function formatFilesize(s) {
  if (s < 1024) return s + " Bytes"
  if (s < 1024 * 1024) return (s / 1024).toFixed(2) + " KBytes"
  if (s < 1024 * 1024 * 1024) return (s / 1024 / 1024).toFixed(2) + " MBytes"
  return (s / 1024 / 1024 / 1024).toFixed(2) + " GBytes"
}

export function getFilesize(url) {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.open("HEAD", url, true)
    xhr.onreadystatechange = function () {
      if (this.readyState === XMLHttpRequest.DONE) {
        resolve(parseInt(xhr.getResponseHeader("Content-Length")) || 0)
      }
    }
    xhr.onerror = () => resolve(0)
    xhr.send()
  })
}

export async function downloadImage(imageSrc, nameOfDownload = 'image.png') {
  const response = await fetch(imageSrc)
  const blobImage = await response.blob()
  const href = URL.createObjectURL(blobImage)
  const anchorElement = document.createElement('a')
  anchorElement.href = href
  anchorElement.download = nameOfDownload
  document.body.appendChild(anchorElement)
  anchorElement.click()
  document.body.removeChild(anchorElement)
  window.URL.revokeObjectURL(href)
}

export function getNotFoundImg(batchNumber) {
  const svgElement = document.createElementNS("http://www.w3.org/2000/svg", 'svg')
  svgElement.setAttribute('width', '500')
  svgElement.setAttribute('height', '500')
  const rect = document.createElementNS("http://www.w3.org/2000/svg", 'rect')
  rect.setAttribute('x', '2')
  rect.setAttribute('y', '2')
  rect.setAttribute('width', '492')
  rect.setAttribute('height', '492')
  rect.style.fill = 'none'
  rect.style.stroke = '#aaa'
  rect.style.strokeWidth = '4'
  svgElement.appendChild(rect)
  const text = document.createElementNS("http://www.w3.org/2000/svg", 'text')
  text.setAttribute('x', '60')
  text.setAttribute('y', '250')
  text.style.fontSize = '48'
  text.style.fill = '#aaa'
  text.innerHTML = "Image Not Found"
  svgElement.appendChild(text)
  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(svgElement)
  return 'data:image/svg+xml,' + encodeURIComponent(svgString)
}
