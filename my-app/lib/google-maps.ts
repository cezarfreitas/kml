// Utilitário para gerenciar carregamento único do Google Maps
declare global {
  interface Window {
    google: any
    googleMapsLoading?: boolean
    googleMapsLoaded?: boolean
  }
}

export const loadGoogleMaps = (apiKey: string, libraries: string[] = []): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Se já está carregado
    if (window.googleMapsLoaded && window.google?.maps) {
      resolve()
      return
    }

    // Se já está carregando
    if (window.googleMapsLoading) {
      const checkLoaded = () => {
        if (window.googleMapsLoaded && window.google?.maps) {
          resolve()
        } else {
          setTimeout(checkLoaded, 100)
        }
      }
      checkLoaded()
      return
    }

    // Verificar se script já existe
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      const checkLoaded = () => {
        if (window.google?.maps) {
          window.googleMapsLoaded = true
          resolve()
        } else {
          setTimeout(checkLoaded, 100)
        }
      }
      checkLoaded()
      return
    }

    // Marcar como carregando
    window.googleMapsLoading = true

    // Criar e carregar script
    const script = document.createElement("script")
    const librariesParam = libraries.length > 0 ? `&libraries=${libraries.join(",")}` : ""
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}${librariesParam}`
    script.async = true
    script.defer = true

    script.onload = () => {
      window.googleMapsLoading = false
      window.googleMapsLoaded = true
      resolve()
    }

    script.onerror = () => {
      window.googleMapsLoading = false
      reject(new Error("Falha ao carregar Google Maps API"))
    }

    document.head.appendChild(script)
  })
}
