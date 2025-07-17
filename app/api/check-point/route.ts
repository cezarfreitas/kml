import { type NextRequest, NextResponse } from "next/server"

interface Region {
  id: string
  name: string
  coordinates: { lat: number; lng: number }[]
  createdAt: string
}

interface TestResult {
  latitude: number
  longitude: number
  isInside: boolean
  regionName: string
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { latitude, longitude, regions } = body

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json({ error: "Latitude e longitude devem ser números" }, { status: 400 })
    }

    if (!Array.isArray(regions)) {
      return NextResponse.json({ error: "Regiões devem ser um array" }, { status: 400 })
    }

    const point = { lat: latitude, lng: longitude }
    const results: TestResult[] = []

    // Verificar cada região
    for (const region of regions as Region[]) {
      const isInside = pointInPolygon(point, region.coordinates)

      results.push({
        latitude,
        longitude,
        isInside,
        regionName: region.name,
      })
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Erro ao verificar ponto:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
