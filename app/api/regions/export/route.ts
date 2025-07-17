import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { regions } = body

    if (!Array.isArray(regions)) {
      return NextResponse.json({ error: "Regiões devem ser um array" }, { status: 400 })
    }

    // Gerar documentação da API para cada região
    const apiDocs = regions.map((region: any) => ({
      regionId: region.id,
      regionName: region.name,
      regionType: region.type,
      endpoints: {
        checkPoint: {
          url: `/api/region/${region.id}/check-point`,
          method: "POST",
          description: "Verifica se coordenadas estão dentro da região",
          body: {
            latitude: "number",
            longitude: "number",
          },
          example: {
            latitude: -23.5505,
            longitude: -46.6333,
          },
        },
        checkAddress: {
          url: `/api/region/${region.id}/check-address`,
          method: "POST",
          description: "Verifica se um endereço está dentro da região",
          body: {
            address: "string",
          },
          example: {
            address: "Av. Paulista, 1000 - São Paulo, SP",
          },
        },
      },
      coordinates: region.coordinates,
      area: region.area,
      perimeter: region.perimeter,
    }))

    return NextResponse.json({
      totalRegions: regions.length,
      generatedAt: new Date().toISOString(),
      regions: apiDocs,
    })
  } catch (error) {
    console.error("Erro ao exportar regiões:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
