import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address } = body

    if (!address || typeof address !== "string") {
      return NextResponse.json({ error: "Endereço é obrigatório" }, { status: 400 })
    }

    const apiKey = "AIzaSyAx7pp7zNpmxL05hJi-LCAMAYudm7kuCP4"
    const encodedAddress = encodeURIComponent(address)
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status === "OK" && data.results.length > 0) {
      const result = data.results[0]
      return NextResponse.json({
        success: true,
        address: result.formatted_address,
        coordinates: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        },
        components: result.address_components,
        placeId: result.place_id,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Endereço não encontrado",
          status: data.status,
        },
        { status: 404 },
      )
    }
  } catch (error) {
    console.error("Erro no geocoding:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
