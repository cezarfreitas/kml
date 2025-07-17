import { type NextRequest, NextResponse } from "next/server"

interface Region {
  id: string
  name: string
  coordinates: { lat: number; lng: number }[]
  createdAt: string
  type: "polygon" | "rectangle" | "circle"
  style: {
    fillColor: string
    strokeColor: string
    fillOpacity: number
    strokeWeight: number
  }
  area?: number
  perimeter?: number
}

// Função para geocodificar endereço usando Google Maps API
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const apiKey = "AIzaSyAx7pp7zNpmxL05hJi-LCAMAYudm7kuCP4"
    const encodedAddress = encodeURIComponent(address)
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status === "OK" && data.results.length > 0) {
      const location = data.results[0].geometry.location
      return {
        lat: location.lat,
        lng: location.lng,
      }
    }

    return null
  } catch (error) {
    console.error("Erro no geocoding:", error)
    return null
  }
}

// Algoritmo Ray Casting para verificar se um ponto está dentro de um polígono
function pointInPolygon(point: { lat: number; lng: number }, polygon: { lat: number; lng: number }[]): boolean {
  const x = point.lng
  const y = point.lat
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng
    const yi = polygon[i].lat
    const xj = polygon[j].lng
    const yj = polygon[j].lat

    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }

  return inside
}

// Verificar se ponto está dentro de círculo
function pointInCircle(
  point: { lat: number; lng: number },
  center: { lat: number; lng: number },
  radiusCoord: { lat: number; lng: number },
): boolean {
  const R = 6371000 // Raio da Terra em metros
  const dLat = ((radiusCoord.lat - center.lat) * Math.PI) / 180
  const dLng = ((radiusCoord.lng - center.lng) * Math.PI) / 180
  const radius = Math.sqrt(dLat * dLat + dLng * dLng) * R

  const dLatPoint = ((point.lat - center.lat) * Math.PI) / 180
  const dLngPoint = ((point.lng - center.lng) * Math.PI) / 180
  const distance = Math.sqrt(dLatPoint * dLatPoint + dLngPoint * dLngPoint) * R

  return distance <= radius
}

// Verificar se ponto está dentro de retângulo
function pointInRectangle(point: { lat: number; lng: number }, coordinates: { lat: number; lng: number }[]): boolean {
  if (coordinates.length < 4) return false

  const lats = coordinates.map((c) => c.lat)
  const lngs = coordinates.map((c) => c.lng)

  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)

  return point.lat >= minLat && point.lat <= maxLat && point.lng >= minLng && point.lng <= maxLng
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { address } = body

    if (!address || typeof address !== "string") {
      return NextResponse.json({ error: "Endereço é obrigatório" }, { status: 400 })
    }

    // Geocodificar o endereço
    const coordinates = await geocodeAddress(address)

    if (!coordinates) {
      return NextResponse.json(
        {
          error: "Não foi possível encontrar as coordenadas para este endereço",
          address,
        },
        { status: 404 },
      )
    }

    // Por enquanto, retornamos um erro informativo sobre a necessidade de banco de dados
    return NextResponse.json(
      {
        error: "Para usar este endpoint, você precisa implementar um banco de dados para armazenar as regiões",
        suggestion: "Use o endpoint /api/check-point passando as regiões no body da requisição",
        geocoded: {
          address,
          coordinates,
          message: "Endereço foi geocodificado com sucesso",
        },
      },
      { status: 501 },
    )

    // Código que seria usado com banco de dados:
    /*
    const region = await getRegionById(id) // Função para buscar região no BD
    
    if (!region) {
      return NextResponse.json({ error: "Região não encontrada" }, { status: 404 })
    }

    let isInside = false

    if (region.type === "polygon") {
      isInside = pointInPolygon(coordinates, region.coordinates)
    } else if (region.type === "rectangle") {
      isInside = pointInRectangle(coordinates, region.coordinates)
    } else if (region.type === "circle") {
      isInside = pointInCircle(coordinates, region.coordinates[0], region.coordinates[1])
    }

    return NextResponse.json({
      regionId: region.id,
      regionName: region.name,
      address,
      coordinates,
      isInside,
      regionType: region.type,
      timestamp: new Date().toISOString()
    })
    */
  } catch (error) {
    console.error("Erro ao verificar endereço:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
