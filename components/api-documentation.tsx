"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Code, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Region {
  id: string
  name: string
  coordinates: { lat: number; lng: number }[]
  type: "polygon" | "rectangle" | "circle"
}

interface ApiDocumentationProps {
  regions: Region[]
}

export function ApiDocumentation({ regions }: ApiDocumentationProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const { toast } = useToast()

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: "Código copiado para a área de transferência.",
    })
  }

  const generateCurlExample = (regionId: string, type: "point" | "address") => {
    const baseUrl = window.location.origin

    if (type === "point") {
      return `curl -X POST ${baseUrl}/api/region/${regionId}/check-point \\
  -H "Content-Type: application/json" \\
  -d '{
    "latitude": -23.5505,
    "longitude": -46.6333
  }'`
    } else {
      return `curl -X POST ${baseUrl}/api/region/${regionId}/check-address \\
  -H "Content-Type: application/json" \\
  -d '{
    "address": "Av. Paulista, 1000 - São Paulo, SP"
  }'`
    }
  }

  const generateJavaScriptExample = (regionId: string, type: "point" | "address") => {
    const baseUrl = window.location.origin

    if (type === "point") {
      return `const response = await fetch('${baseUrl}/api/region/${regionId}/check-point', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    latitude: -23.5505,
    longitude: -46.6333
  })
});

const result = await response.json();
console.log(result);`
    } else {
      return `const response = await fetch('${baseUrl}/api/region/${regionId}/check-address', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    address: 'Av. Paulista, 1000 - São Paulo, SP'
  })
});

const result = await response.json();
console.log(result);`
    }
  }

  const exportApiDocs = async () => {
    try {
      const response = await fetch("/api/regions/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ regions }),
      })

      const docs = await response.json()
      const blob = new Blob([JSON.stringify(docs, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "api-documentation.json"
      a.click()
      URL.revokeObjectURL(url)

      toast({
        title: "Sucesso",
        description: "Documentação da API exportada!",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao exportar documentação.",
        variant: "destructive",
      })
    }
  }

  if (regions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documentação da API</CardTitle>
          <CardDescription>Nenhuma região disponível para gerar endpoints</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Documentação da API</CardTitle>
              <CardDescription>Endpoints individuais para {regions.length} região(ões)</CardDescription>
            </div>
            <Button onClick={exportApiDocs} variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Exportar Docs
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {regions.map((region) => (
              <div key={region.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{region.name}</h3>
                    <Badge variant="outline">{region.type}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRegion(selectedRegion === region.id ? null : region.id)}
                  >
                    <Code className="w-4 h-4 mr-2" />
                    {selectedRegion === region.id ? "Ocultar" : "Ver Exemplos"}
                  </Button>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500">POST</Badge>
                    <code className="bg-muted px-2 py-1 rounded text-xs">/api/region/{region.id}/check-point</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(`/api/region/${region.id}/check-point`)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500">POST</Badge>
                    <code className="bg-muted px-2 py-1 rounded text-xs">/api/region/{region.id}/check-address</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(`/api/region/${region.id}/check-address`)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {selectedRegion === region.id && (
                  <div className="mt-4">
                    <Tabs defaultValue="curl" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="curl">cURL</TabsTrigger>
                        <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                      </TabsList>

                      <TabsContent value="curl" className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Verificar por Coordenadas</h4>
                          <div className="relative">
                            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                              <code>{generateCurlExample(region.id, "point")}</code>
                            </pre>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6"
                              onClick={() => copyToClipboard(generateCurlExample(region.id, "point"))}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Verificar por Endereço</h4>
                          <div className="relative">
                            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                              <code>{generateCurlExample(region.id, "address")}</code>
                            </pre>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6"
                              onClick={() => copyToClipboard(generateCurlExample(region.id, "address"))}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="javascript" className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Verificar por Coordenadas</h4>
                          <div className="relative">
                            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                              <code>{generateJavaScriptExample(region.id, "point")}</code>
                            </pre>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6"
                              onClick={() => copyToClipboard(generateJavaScriptExample(region.id, "point"))}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Verificar por Endereço</h4>
                          <div className="relative">
                            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                              <code>{generateJavaScriptExample(region.id, "address")}</code>
                            </pre>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6"
                              onClick={() => copyToClipboard(generateJavaScriptExample(region.id, "address"))}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
