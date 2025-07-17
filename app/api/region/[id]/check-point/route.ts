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
  // Calcular distância usando fórmula de Haversine (aproximada)
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
    const { latitude, longitude } = body

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json({ error: "Latitude e longitude devem ser números" }, { status: 400 })
    }

    // Buscar região no localStorage (em produção, usar banco de dados)
    // Como não temos acesso ao localStorage no servidor, vamos simular com uma busca
    // Na prática, você salvaria as regiões em um banco de dados

    // Por enquanto, vamos retornar um erro informativo
    return NextResponse.json(
      {
        error: "Para usar este endpoint, você precisa implementar um banco de dados para armazenar as regiões",
        suggestion: "Use o endpoint /api/check-point passando as regiões no body da requisição",
      },
      { status: 501 },
    )

    // Código que seria usado com banco de dados:
    /*
    const region = await getRegionById(id) // Função para buscar região no BD
    
    if (!region) {
      return NextResponse.json({ error: "Região não encontrada" }, { status: 404 })
    }

    const point = { lat: latitude, lng: longitude }
    let isInside = false

    if (region.type === "polygon") {
      isInside = pointInPolygon(point, region.coordinates)
    } else if (region.type === "rectangle") {
      isInside = pointInRectangle(point, region.coordinates)
    } else if (region.type === "circle") {
      isInside = pointInCircle(point, region.coordinates[0], region.coordinates[1])
    }

    return NextResponse.json({
      regionId: region.id,
      regionName: region.name,
      latitude,
      longitude,
      isInside,
      regionType: region.type,
      timestamp: new Date().toISOString()
    })
    */
  } catch (error) {
    console.error("Erro ao verificar ponto:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
