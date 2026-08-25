export function ambilPetaTerakhir(key, defaultCenter, defaultZoom) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return { center: defaultCenter, zoom: defaultZoom }
    const data = JSON.parse(raw)
    if (typeof data.lat !== 'number' || typeof data.lng !== 'number' || typeof data.zoom !== 'number') {
      return { center: defaultCenter, zoom: defaultZoom }
    }
    return { center: [data.lat, data.lng], zoom: data.zoom }
  } catch {
    return { center: defaultCenter, zoom: defaultZoom }
  }
}

export function simpanPetaTerakhir(key, center, zoom) {
  try {
    localStorage.setItem(key, JSON.stringify({ lat: center.lat, lng: center.lng, zoom }))
  } catch {}
}
