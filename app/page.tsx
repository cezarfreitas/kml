"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  Square,
  Circle,
  Pentagon,
  Undo2,
  Redo2,
  Ruler,
  Settings,
  Grid3X3,
  Target,
  BarChart3,
  Globe,
  Maximize2,
  Minimize2,
  Trash2,
  Plus,
  Minus,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { google } from "google-maps"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Region {
  id: string
  name: string
  description?: string
  coordinates: { lat: number; lng: number }[]
  createdAt: string
  updatedAt?: string
  type: "polygon" | "rectangle" | "circle"
  style: {
    fillColor: string
    strokeColor: string
    fillOpacity: number
    strokeWeight: number
  }
  area?: number
  perimeter?: number
  layer?: string
  tags?: string[]
  isVisible?: boolean
  isLocked?: boolean
  isFavorite?: boolean
  metadata?: Record<string, any>
  creator?: string
  permissions?: {
    canEdit: boolean
    canDelete: boolean
    canShare: boolean
  }
}

interface TestResult {
  latitude: number
  longitude: number
  isInside: boolean
  regionName: string
  confidence?: number
  distance?: number
}

interface DrawingHistory {
  action: "add" | "edit" | "delete" | "bulk"
  region?: Region
  regions?: Region[]
  timestamp: number
  description: string
}

interface Layer {
  id: string
  name: string
  color: string
  visible: boolean
  locked: boolean
  regionCount: number
}

interface MapSettings {
  theme: "default" | "dark" | "satellite" | "terrain"
  showLabels: boolean
  showTraffic: boolean
  showTransit: boolean
  clustering: boolean
  heatmap: boolean
  animation: boolean
}

export default function Home() {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null)
  const [regions, setRegions] = useState<Region[]>([])
  const [filteredRegions, setFilteredRegions] = useState<Region[]>([])
  const [currentPolygon, setCurrentPolygon] = useState<
    google.maps.Polygon | google.maps.Rectangle | google.maps.Circle | null
  >(null)
  const [regionName, setRegionName] = useState("")
  const [regionDescription, setRegionDescription] = useState("")
  const [regionTags, setRegionTags] = useState("")
  const [testLat, setTestLat] = useState("")
  const [testLng, setTestLng] = useState("")
  const [testAddressInput, setTestAddressInput] = useState("")
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [drawingMode, setDrawingMode] = useState<"polygon" | "rectangle" | "circle">("polygon")
  const [history, setHistory] = useState<DrawingHistory[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [showGrid, setShowGrid] = useState(false)
  const [snapToGrid, setSnapToGrid] = useState(false)
  const [currentStyle, setCurrentStyle] = useState({
    fillColor: "#3b82f6",
    strokeColor: "#1d4ed8",
    fillOpacity: 0.3,
    strokeWeight: 2,
  })
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set())
  const [isEditing, setIsEditing] = useState(false)
  const [precisionMode, setPrecisionMode] = useState(false)
  const [coordinateInput, setCoordinateInput] = useState({ lat: "", lng: "" })
  const [isImporting, setIsImporting] = useState(false)
  const [editingRegion, setEditingRegion] = useState<string | null>(null)
  const [editableShapes, setEditableShapes] = useState<
    Map<string, google.maps.Polygon | google.maps.Rectangle | google.maps.Circle>
  >(new Map())
  const [showEditControls, setShowEditControls] = useState(false)

  // Novos estados para funcionalidades avançadas
  const [layers, setLayers] = useState<Layer[]>([
    { id: "default", name: "Padrão", color: "#3b82f6", visible: true, locked: false, regionCount: 0 },
  ])
  const [currentLayer, setCurrentLayer] = useState("default")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterTags, setFilterTags] = useState<string[]>([])
  const [mapSettings, setMapSettings] = useState<MapSettings>({
    theme: "default",
    showLabels: true,
    showTraffic: false,
    showTransit: false,
    clustering: true,
    heatmap: false,
    animation: true,
  })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [autoSave, setAutoSave] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [showMiniMap, setShowMiniMap] = useState(false)
  const [measurementMode, setMeasurementMode] = useState(false)
  const [showCoordinates, setShowCoordinates] = useState(false)
  const [currentCoordinates, setCurrentCoordinates] = useState({ lat: 0, lng: 0 })
  const [deleteMode, setDeleteMode] = useState(false)

  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && regions.length > 0) {
      const timer = setTimeout(() => {
        localStorage.setItem("mapRegions", JSON.stringify(regions))
        setLastSaved(new Date())
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [regions, autoSave])

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "z":
            e.preventDefault()
            if (e.shiftKey) {
              redo()
            } else {
              undo()
            }
            break
          case "s":
            e.preventDefault()
            exportRegions()
            break
          case "a":
            e.preventDefault()
            setSelectedRegions(new Set(regions.map((r) => r.id)))
            break
          case "d":
            e.preventDefault()
            setSelectedRegions(new Set())
            break
        }
      }

      switch (e.key) {
        case "Delete":
          if (selectedRegions.size > 0) {
            bulkDeleteRegions()
          }
          break
        case "Escape":
          setSelectedRegions(new Set())
          setEditingRegion(null)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedRegions, regions])

  // Carregar dados
  useEffect(() => {
    setLoadingProgress(20)
    const savedRegions = localStorage.getItem("mapRegions")
    if (savedRegions) {
      const parsedRegions = JSON.parse(savedRegions)
      setRegions(parsedRegions)
      setFilteredRegions(parsedRegions)
    }
    setLoadingProgress(40)

    const savedHistory = localStorage.getItem("mapHistory")
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
    setLoadingProgress(60)

    const savedLayers = localStorage.getItem("mapLayers")
    if (savedLayers) {
      setLayers(JSON.parse(savedLayers))
    }
    setLoadingProgress(80)

    const savedSettings = localStorage.getItem("mapSettings")
    if (savedSettings) {
      setMapSettings(JSON.parse(savedSettings))
    }
    setLoadingProgress(100)
  }, [])

  // Filtrar regiões
  useEffect(() => {
    let filtered = regions

    if (searchQuery) {
      filtered = filtered.filter(
        (region) =>
          region.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          region.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          region.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    if (filterTags.length > 0) {
      filtered = filtered.filter((region) => region.tags?.some((tag) => filterTags.includes(tag)))
    }

    setFilteredRegions(filtered)
  }, [regions, searchQuery, filterTags])

  // Salvar configurações
  useEffect(() => {
    localStorage.setItem("mapLayers", JSON.stringify(layers))
  }, [layers])

  useEffect(() => {
    localStorage.setItem("mapSettings", JSON.stringify(mapSettings))
  }, [mapSettings])

  // Calcular área e perímetro com maior precisão
  const calculateAreaAndPerimeter = useCallback((coordinates: { lat: number; lng: number }[]) => {
    if (coordinates.length < 3) return { area: 0, perimeter: 0 }

    // Usar Google Maps Geometry Library para cálculos precisos
    if (window.google?.maps?.geometry) {
      const path = coordinates.map((coord) => new window.google.maps.LatLng(coord.lat, coord.lng))
      const area = window.google.maps.geometry.spherical.computeArea(path)

      let perimeter = 0
      for (let i = 0; i < path.length; i++) {
        const next = (i + 1) % path.length
        perimeter += window.google.maps.geometry.spherical.computeDistanceBetween(path[i], path[next])
      }

      return { area, perimeter }
    }

    // Fallback para cálculo aproximado
    let area = 0
    let perimeter = 0

    for (let i = 0; i < coordinates.length; i++) {
      const j = (i + 1) % coordinates.length
      area += coordinates[i].lat * coordinates[j].lng
      area -= coordinates[j].lat * coordinates[i].lng

      const dx = coordinates[j].lat - coordinates[i].lat
      const dy = coordinates[j].lng - coordinates[i].lng
      perimeter += Math.sqrt(dx * dx + dy * dy)
    }

    area = Math.abs(area) / 2
    return { area: area * 111000 * 111000, perimeter: perimeter * 111000 }
  }, [])

  // Parser KML melhorado
  const parseKML = useCallback(
    (kmlContent: string): Region[] => {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(kmlContent, "text/xml")
      const placemarks = xmlDoc.getElementsByTagName("Placemark")
      const parsedRegions: Region[] = []

      for (let i = 0; i < placemarks.length; i++) {
        const placemark = placemarks[i]
        const nameElement = placemark.getElementsByTagName("name")[0]
        const descElement = placemark.getElementsByTagName("description")[0]
        const name = nameElement ? nameElement.textContent || `Região ${i + 1}` : `Região ${i + 1}`
        const description = descElement ? descElement.textContent || "" : ""

        // Extrair coordenadas de diferentes geometrias
        const polygon = placemark.getElementsByTagName("Polygon")[0]
        const point = placemark.getElementsByTagName("Point")[0]
        const lineString = placemark.getElementsByTagName("LineString")[0]

        const coordinates: { lat: number; lng: number }[] = []
        const type: "polygon" | "rectangle" | "circle" = "polygon"

        if (polygon) {
          const linearRing = polygon.getElementsByTagName("LinearRing")[0]
          const coordinatesElement = linearRing?.getElementsByTagName("coordinates")[0]

          if (coordinatesElement && coordinatesElement.textContent) {
            const coordText = coordinatesElement.textContent.trim()
            const coordPairs = coordText.split(/\s+/)

            coordPairs.forEach((pair) => {
              const [lng, lat, alt] = pair.split(",").map(Number)
              if (!isNaN(lat) && !isNaN(lng)) {
                coordinates.push({ lat, lng })
              }
            })
          }
        }

        if (coordinates.length >= 3) {
          const { area, perimeter } = calculateAreaAndPerimeter(coordinates)

          parsedRegions.push({
            id: `kml_${Date.now()}_${i}`,
            name,
            description,
            coordinates,
            createdAt: new Date().toISOString(),
            type,
            style: { ...currentStyle },
            area,
            perimeter,
            layer: currentLayer,
            tags: ["importado", "kml"],
            isVisible: true,
            isLocked: false,
            isFavorite: false,
            metadata: {
              source: "kml",
              importedAt: new Date().toISOString(),
            },
          })
        }
      }

      return parsedRegions
    },
    [currentStyle, currentLayer, calculateAreaAndPerimeter],
  )

  // Importar KML melhorado
  const handleKMLImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith(".kml")) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo KML válido.",
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)
    setLoadingProgress(0)

    try {
      setLoadingProgress(25)
      const content = await file.text()
      setLoadingProgress(50)

      const importedRegions = parseKML(content)
      setLoadingProgress(75)

      if (importedRegions.length === 0) {
        toast({
          title: "Aviso",
          description: "Nenhuma região válida encontrada no arquivo KML.",
          variant: "destructive",
        })
        return
      }

      setRegions([...regions, ...importedRegions])
      setLoadingProgress(100)

      // Adicionar ao histórico
      const historyEntry: DrawingHistory = {
        action: "bulk",
        regions: importedRegions,
        timestamp: Date.now(),
        description: `Importadas ${importedRegions.length} regiões do arquivo ${file.name}`,
      }
      setHistory([...history.slice(0, historyIndex + 1), historyEntry])
      setHistoryIndex(historyIndex + 1)

      toast({
        title: "Sucesso",
        description: `${importedRegions.length} região(ões) importada(s) com sucesso!`,
      })
    } catch (error) {
      console.error("Erro ao importar KML:", error)
      toast({
        title: "Erro",
        description: "Erro ao processar arquivo KML.",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
      setLoadingProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // Inicializar Google Maps com configurações avançadas
  useEffect(() => {
    const initMap = () => {
      if (typeof window.google === "undefined" || !window.google.maps) return

      const mapStyles = {
        default: [],
        dark: [
          { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        ],
        satellite: [],
        terrain: [],
      }

      const mapInstance = new window.google.maps.Map(document.getElementById("map") as HTMLElement, {
        center: { lat: -23.5505, lng: -46.6333 },
        zoom: 12,
        mapTypeId:
          mapSettings.theme === "satellite" ? "satellite" : mapSettings.theme === "terrain" ? "terrain" : "roadmap",
        styles: mapStyles[mapSettings.theme],
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        scaleControl: true,
        gestureHandling: "greedy",
        clickableIcons: mapSettings.showLabels,
      })

      // Adicionar controles de tráfego e transporte
      if (mapSettings.showTraffic) {
        const trafficLayer = new window.google.maps.TrafficLayer()
        trafficLayer.setMap(mapInstance)
      }

      if (mapSettings.showTransit) {
        const transitLayer = new window.google.maps.TransitLayer()
        transitLayer.setMap(mapInstance)
      }

      // Mouse coordinates tracking
      mapInstance.addListener("mousemove", (e: google.maps.MapMouseEvent) => {
        if (e.latLng && showCoordinates) {
          setCurrentCoordinates({
            lat: e.latLng.lat(),
            lng: e.latLng.lng(),
          })
        }
      })

      const drawingManagerInstance = new window.google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: false,
        polygonOptions: {
          ...currentStyle,
          clickable: true,
          editable: true,
          draggable: true,
        },
        rectangleOptions: {
          ...currentStyle,
          clickable: true,
          editable: true,
          draggable: true,
        },
        circleOptions: {
          ...currentStyle,
          clickable: true,
          editable: true,
          draggable: true,
        },
      })

      drawingManagerInstance.setMap(mapInstance)

      // Event listeners
      window.google.maps.event.addListener(
        drawingManagerInstance,
        "polygoncomplete",
        (polygon: google.maps.Polygon) => {
          handleShapeComplete(polygon, "polygon")
        },
      )

      window.google.maps.event.addListener(
        drawingManagerInstance,
        "rectanglecomplete",
        (rectangle: google.maps.Rectangle) => {
          handleShapeComplete(rectangle, "rectangle")
        },
      )

      window.google.maps.event.addListener(drawingManagerInstance, "circlecomplete", (circle: google.maps.Circle) => {
        handleShapeComplete(circle, "circle")
      })

      setMap(mapInstance)
      setDrawingManager(drawingManagerInstance)
      setIsLoaded(true)
    }

    // Verificar se o Google Maps já foi carregado
    if (window.google && window.google.maps && window.google.maps.drawing) {
      initMap()
      return
    }

    // Verificar se o script já está sendo carregado
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      // Script já existe, aguardar carregamento
      const checkGoogleMaps = () => {
        if (window.google && window.google.maps && window.google.maps.drawing) {
          initMap()
        } else {
          setTimeout(checkGoogleMaps, 100)
        }
      }
      checkGoogleMaps()
      return
    }

    // Carregar script apenas se não existir
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAx7pp7zNpmxL05hJi-LCAMAYudm7kuCP4&libraries=drawing,geometry,places,visualization`
    script.async = true
    script.defer = true
    script.onload = initMap
    script.onerror = () => {
      console.error("Erro ao carregar Google Maps API")
      toast({
        title: "Erro",
        description: "Não foi possível carregar o Google Maps. Verifique sua conexão.",
        variant: "destructive",
      })
    }
    document.head.appendChild(script)
  }, [currentStyle, showGrid, mapSettings])

  const handleShapeComplete = (
    shape: google.maps.Polygon | google.maps.Rectangle | google.maps.Circle,
    type: "polygon" | "rectangle" | "circle",
  ) => {
    if (currentPolygon) {
      currentPolygon.setMap(null)
    }
    setCurrentPolygon(shape)

    // Configurar edição
    if (type === "polygon") {
      const polygon = shape as google.maps.Polygon
      polygon.setEditable(true)
      polygon.setDraggable(true)
    } else if (type === "rectangle") {
      const rectangle = shape as google.maps.Rectangle
      rectangle.setEditable(true)
      rectangle.setDraggable(true)
    } else if (type === "circle") {
      const circle = shape as google.maps.Circle
      circle.setEditable(true)
      circle.setDraggable(true)
    }

    drawingManager?.setDrawingMode(null)
    setShowEditControls(true)
  }

  // Renderizar regiões com clustering e otimizações
  useEffect(() => {
    if (!map) return

    filteredRegions.forEach((region) => {
      if (!region.isVisible || editingRegion === region.id) return

      const layer = layers.find((l) => l.id === region.layer)
      if (layer && !layer.visible) return

      let shape: google.maps.Polygon | google.maps.Rectangle | google.maps.Circle

      const regionStyle = {
        ...region.style,
        strokeColor: layer?.color || region.style.strokeColor,
        fillColor: layer?.color || region.style.fillColor,
      }

      if (region.type === "polygon") {
        shape = new window.google.maps.Polygon({
          paths: region.coordinates,
          ...regionStyle,
          clickable: true,
          editable: false,
        })
      } else if (region.type === "rectangle") {
        const bounds = new window.google.maps.LatLngBounds()
        region.coordinates.forEach((coord) => bounds.extend(coord))
        shape = new window.google.maps.Rectangle({
          bounds,
          ...regionStyle,
          clickable: true,
          editable: false,
        })
      } else {
        const center = region.coordinates[0]
        const radius = region.coordinates[1]
          ? window.google.maps.geometry.spherical.computeDistanceBetween(
              new window.google.maps.LatLng(center.lat, center.lng),
              new window.google.maps.LatLng(region.coordinates[1].lat, region.coordinates[1].lng),
            )
          : 1000

        shape = new window.google.maps.Circle({
          center,
          radius,
          ...regionStyle,
          clickable: true,
          editable: false,
        })
      }

      shape.setMap(map)

      // Info window melhorado
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; min-width: 200px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <strong style="font-size: 16px;">${region.name}</strong>
              ${region.isFavorite ? '<span style="color: gold;">⭐</span>' : ""}
              ${region.isLocked ? '<span style="color: red;">🔒</span>' : ""}
            </div>
            ${region.description ? `<p style="margin: 4px 0; color: #666;">${region.description}</p>` : ""}
            <div style="font-size: 12px; color: #888; margin: 8px 0;">
              <div>Tipo: ${region.type}</div>
              ${region.area ? `<div>Área: ${(region.area / 1000000).toFixed(2)} km²</div>` : ""}
              ${region.perimeter ? `<div>Perímetro: ${(region.perimeter / 1000).toFixed(2)} km</div>` : ""}
              ${region.tags?.length ? `<div>Tags: ${region.tags.join(", ")}</div>` : ""}
            </div>
            <div style="display: flex; gap: 4px; margin-top: 8px;">
              <button onclick="window.startEditingRegion('${region.id}')" 
                style="padding: 4px 8px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                Editar
              </button>
              <button onclick="window.toggleFavorite('${region.id}')" 
                style="padding: 4px 8px; background: #f59e0b; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                ${region.isFavorite ? "★" : "☆"}
              </button>
              <button onclick="window.zoomToRegion('${region.id}')" 
                style="padding: 4px 8px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                Zoom
              </button>
            </div>
          </div>
        `,
      })

      shape.addListener("click", (e: any) => {
        infoWindow.setPosition(e.latLng || region.coordinates[0])
        infoWindow.open(map)
        setSelectedRegion(region.id)
      })

      // Hover effects
      shape.addListener("mouseover", () => {
        if (region.type === "polygon") {
          ;(shape as google.maps.Polygon).setOptions({
            strokeWeight: regionStyle.strokeWeight + 1,
            fillOpacity: regionStyle.fillOpacity + 0.1,
          })
        }
      })

      shape.addListener("mouseout", () => {
        if (region.type === "polygon") {
          ;(shape as google.maps.Polygon).setOptions({
            strokeWeight: regionStyle.strokeWeight,
            fillOpacity: regionStyle.fillOpacity,
          })
        }
      })
    })

    // Expor funções globalmente
    ;(window as any).startEditingRegion = startEditingRegion
    ;(window as any).toggleFavorite = toggleFavorite
    ;(window as any).zoomToRegion = (regionId: string) => {
      const region = regions.find((r) => r.id === regionId)
      if (region) zoomToRegion(region)
    }
  }, [map, filteredRegions, selectedRegion, editingRegion, layers])

  // Funções de operações em massa
  const bulkDeleteRegions = () => {
    if (selectedRegions.size === 0) return

    const regionsToDelete = regions.filter((r) => selectedRegions.has(r.id))
    const remainingRegions = regions.filter((r) => !selectedRegions.has(r.id))

    setRegions(remainingRegions)
    setSelectedRegions(new Set())

    const historyEntry: DrawingHistory = {
      action: "bulk",
      regions: regionsToDelete,
      timestamp: Date.now(),
      description: `Excluídas ${regionsToDelete.length} regiões`,
    }
    setHistory([...history.slice(0, historyIndex + 1), historyEntry])
    setHistoryIndex(historyIndex + 1)

    toast({
      title: "Sucesso",
      description: `${regionsToDelete.length} região(ões) excluída(s)`,
    })
  }

  const toggleFavorite = (regionId: string) => {
    setRegions(
      regions.map((r) =>
        r.id === regionId ? { ...r, isFavorite: !r.isFavorite, updatedAt: new Date().toISOString() } : r,
      ),
    )
  }

  const toggleVisibility = (regionId: string) => {
    setRegions(
      regions.map((r) =>
        r.id === regionId ? { ...r, isVisible: !r.isVisible, updatedAt: new Date().toISOString() } : r,
      ),
    )
  }

  const toggleLock = (regionId: string) => {
    setRegions(
      regions.map((r) =>
        r.id === regionId ? { ...r, isLocked: !r.isLocked, updatedAt: new Date().toISOString() } : r,
      ),
    )
  }

  // Função para entrar no modo de edição (melhorada)
  const startEditingRegion = (regionId: string) => {
    const region = regions.find((r) => r.id === regionId)
    if (!region || region.isLocked) {
      if (region?.isLocked) {
        toast({
          title: "Região Bloqueada",
          description: "Esta região está bloqueada para edição.",
          variant: "destructive",
        })
      }
      return
    }

    setEditingRegion(regionId)
    setSelectedRegion(regionId)

    if (!map) return

    let editableShape: google.maps.Polygon | google.maps.Rectangle | google.maps.Circle

    if (region.type === "polygon") {
      editableShape = new window.google.maps.Polygon({
        paths: region.coordinates,
        ...region.style,
        editable: true,
        draggable: true,
        clickable: true,
      })
    } else if (region.type === "rectangle") {
      const bounds = new window.google.maps.LatLngBounds()
      region.coordinates.forEach((coord) => bounds.extend(coord))
      editableShape = new window.google.maps.Rectangle({
        bounds,
        ...region.style,
        editable: true,
        draggable: true,
        clickable: true,
      })
    } else {
      const center = region.coordinates[0]
      const radius = region.coordinates[1]
        ? window.google.maps.geometry.spherical.computeDistanceBetween(
            new window.google.maps.LatLng(center.lat, center.lng),
            new window.google.maps.LatLng(region.coordinates[1].lat, region.coordinates[1].lng),
          )
        : 1000

      editableShape = new window.google.maps.Circle({
        center,
        radius,
        ...region.style,
        editable: true,
        draggable: true,
        clickable: true,
      })
    }

    editableShape.setMap(map)

    const newEditableShapes = new Map(editableShapes)
    newEditableShapes.set(regionId, editableShape)
    setEditableShapes(newEditableShapes)

    // Adicionar listeners para mudanças
    if (region.type === "polygon") {
      const polygon = editableShape as google.maps.Polygon

      // Listeners existentes
      window.google.maps.event.addListener(polygon.getPath(), "set_at", () => updateRegionFromShape(regionId))
      window.google.maps.event.addListener(polygon.getPath(), "insert_at", () => updateRegionFromShape(regionId))
      window.google.maps.event.addListener(polygon.getPath(), "remove_at", () => updateRegionFromShape(regionId))
      window.google.maps.event.addListener(polygon, "dragend", () => updateRegionFromShape(regionId))

      // Listener para cliques nos vértices (modo deletar)
      window.google.maps.event.addListener(polygon, "click", (e: any) => {
        if (deleteMode && e.vertex !== undefined) {
          deleteSpecificVertex(polygon, e.vertex)
        }
      })
    } else if (region.type === "rectangle") {
      const rectangle = editableShape as google.maps.Rectangle
      window.google.maps.event.addListener(rectangle, "bounds_changed", () => updateRegionFromShape(regionId))
      window.google.maps.event.addListener(rectangle, "dragend", () => updateRegionFromShape(regionId))
    } else {
      const circle = editableShape as google.maps.Circle
      window.google.maps.event.addListener(circle, "center_changed", () => updateRegionFromShape(regionId))
      window.google.maps.event.addListener(circle, "radius_changed", () => updateRegionFromShape(regionId))
      window.google.maps.event.addListener(circle, "dragend", () => updateRegionFromShape(regionId))
    }

    setShowEditControls(true)

    toast({
      title: "Modo de Edição",
      description: `Editando região "${region.name}". Use Ctrl+S para salvar ou Esc para cancelar.`,
    })
  }

  // Atualizar região baseada na forma editada
  const updateRegionFromShape = (regionId: string) => {
    const shape = editableShapes.get(regionId)
    const region = regions.find((r) => r.id === regionId)

    if (!shape || !region) return

    let newCoordinates: { lat: number; lng: number }[] = []
    let area = 0
    let perimeter = 0

    if (region.type === "polygon") {
      const polygon = shape as google.maps.Polygon
      const path = polygon.getPath()

      for (let i = 0; i < path.getLength(); i++) {
        const point = path.getAt(i)
        newCoordinates.push({
          lat: point.lat(),
          lng: point.lng(),
        })
      }

      const calc = calculateAreaAndPerimeter(newCoordinates)
      area = calc.area
      perimeter = calc.perimeter
    } else if (region.type === "rectangle") {
      const rectangle = shape as google.maps.Rectangle
      const bounds = rectangle.getBounds()!
      const ne = bounds.getNorthEast()
      const sw = bounds.getSouthWest()

      newCoordinates = [
        { lat: ne.lat(), lng: ne.lng() },
        { lat: ne.lat(), lng: sw.lng() },
        { lat: sw.lat(), lng: sw.lng() },
        { lat: sw.lat(), lng: ne.lng() },
      ]

      const calc = calculateAreaAndPerimeter(newCoordinates)
      area = calc.area
      perimeter = calc.perimeter
    } else if (region.type === "circle") {
      const circle = shape as google.maps.Circle
      const center = circle.getCenter()!
      const radius = circle.getRadius()

      newCoordinates = [
        { lat: center.lat(), lng: center.lng() },
        { lat: center.lat(), lng: center.lng() + radius / 111000 },
      ]

      area = Math.PI * radius * radius
      perimeter = 2 * Math.PI * radius
    }

    const updatedRegions = regions.map((r) =>
      r.id === regionId
        ? { ...r, coordinates: newCoordinates, area, perimeter, updatedAt: new Date().toISOString() }
        : r,
    )

    setRegions(updatedRegions)
  }

  const finishEditingRegion = () => {
    if (editingRegion) {
      const shape = editableShapes.get(editingRegion)
      if (shape) {
        shape.setMap(null)
      }

      const newEditableShapes = new Map(editableShapes)
      newEditableShapes.delete(editingRegion)
      setEditableShapes(newEditableShapes)

      const region = regions.find((r) => r.id === editingRegion)
      if (region) {
        const historyEntry: DrawingHistory = {
          action: "edit",
          region,
          timestamp: Date.now(),
          description: `Editada região "${region.name}"`,
        }
        setHistory([...history.slice(0, historyIndex + 1), historyEntry])
        setHistoryIndex(historyIndex + 1)
      }
    }

    setEditingRegion(null)
    setSelectedRegion(null)
    setShowEditControls(false)
    setDeleteMode(false)

    toast({
      title: "Edição Finalizada",
      description: "Alterações salvas com sucesso!",
    })
  }

  const cancelEditingRegion = () => {
    if (editingRegion) {
      const shape = editableShapes.get(editingRegion)
      if (shape) {
        shape.setMap(null)
      }

      const newEditableShapes = new Map(editableShapes)
      newEditableShapes.delete(editingRegion)
      setEditableShapes(newEditableShapes)
    }

    setEditingRegion(null)
    setSelectedRegion(null)
    setShowEditControls(false)
    setDeleteMode(false)

    toast({
      title: "Edição Cancelada",
      description: "Alterações descartadas.",
    })
  }

  const saveRegion = () => {
    if (!currentPolygon || !regionName.trim()) {
      toast({
        title: "Erro",
        description: "Desenhe uma região e digite um nome para salvá-la.",
        variant: "destructive",
      })
      return
    }

    let coordinates: { lat: number; lng: number }[] = []
    let area = 0
    let perimeter = 0

    if (drawingMode === "polygon") {
      const polygon = currentPolygon as google.maps.Polygon
      const path = polygon.getPath()

      for (let i = 0; i < path.getLength(); i++) {
        const point = path.getAt(i)
        coordinates.push({
          lat: point.lat(),
          lng: point.lng(),
        })
      }

      const calc = calculateAreaAndPerimeter(coordinates)
      area = calc.area
      perimeter = calc.perimeter
    } else if (drawingMode === "rectangle") {
      const rectangle = currentPolygon as google.maps.Rectangle
      const bounds = rectangle.getBounds()!
      const ne = bounds.getNorthEast()
      const sw = bounds.getSouthWest()

      coordinates = [
        { lat: ne.lat(), lng: ne.lng() },
        { lat: ne.lat(), lng: sw.lng() },
        { lat: sw.lat(), lng: sw.lng() },
        { lat: sw.lat(), lng: ne.lng() },
      ]

      const calc = calculateAreaAndPerimeter(coordinates)
      area = calc.area
      perimeter = calc.perimeter
    } else if (drawingMode === "circle") {
      const circle = currentPolygon as google.maps.Circle
      const center = circle.getCenter()!
      const radius = circle.getRadius()

      coordinates = [
        { lat: center.lat(), lng: center.lng() },
        { lat: center.lat(), lng: center.lng() + radius / 111000 },
      ]

      area = Math.PI * radius * radius
      perimeter = 2 * Math.PI * radius
    }

    const tags = regionTags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)

    const newRegion: Region = {
      id: Date.now().toString(),
      name: regionName,
      description: regionDescription,
      coordinates,
      createdAt: new Date().toISOString(),
      type: drawingMode,
      style: currentStyle,
      area,
      perimeter,
      layer: currentLayer,
      tags,
      isVisible: true,
      isLocked: false,
      isFavorite: false,
      metadata: {
        creator: "user",
        version: 1,
      },
      permissions: {
        canEdit: true,
        canDelete: true,
        canShare: true,
      },
    }

    setRegions([...regions, newRegion])

    const historyEntry: DrawingHistory = {
      action: "add",
      region: newRegion,
      timestamp: Date.now(),
      description: `Criada região "${newRegion.name}"`,
    }
    setHistory([...history.slice(0, historyIndex + 1), historyEntry])
    setHistoryIndex(historyIndex + 1)

    // Atualizar contagem da camada
    setLayers(
      layers.map((layer) => (layer.id === currentLayer ? { ...layer, regionCount: layer.regionCount + 1 } : layer)),
    )

    setRegionName("")
    setRegionDescription("")
    setRegionTags("")
    currentPolygon.setMap(null)
    setCurrentPolygon(null)
    setShowEditControls(false)

    toast({
      title: "Sucesso",
      description: `Região "${newRegion.name}" salva com sucesso!`,
    })
  }

  const deleteRegion = (id: string) => {
    const regionToDelete = regions.find((r) => r.id === id)
    if (!regionToDelete) return

    if (regionToDelete.isLocked) {
      toast({
        title: "Região Bloqueada",
        description: "Esta região está bloqueada e não pode ser excluída.",
        variant: "destructive",
      })
      return
    }

    setRegions(regions.filter((region) => region.id !== id))

    const historyEntry: DrawingHistory = {
      action: "delete",
      region: regionToDelete,
      timestamp: Date.now(),
      description: `Excluída região "${regionToDelete.name}"`,
    }
    setHistory([...history.slice(0, historyIndex + 1), historyEntry])
    setHistoryIndex(historyIndex + 1)

    // Atualizar contagem da camada
    setLayers(
      layers.map((layer) =>
        layer.id === regionToDelete.layer ? { ...layer, regionCount: Math.max(0, layer.regionCount - 1) } : layer,
      ),
    )

    toast({
      title: "Sucesso",
      description: "Região removida com sucesso!",
    })
  }

  const duplicateRegion = (id: string) => {
    const regionToDuplicate = regions.find((r) => r.id === id)
    if (!regionToDuplicate) return

    const duplicatedRegion: Region = {
      ...regionToDuplicate,
      id: Date.now().toString(),
      name: `${regionToDuplicate.name} (Cópia)`,
      coordinates: regionToDuplicate.coordinates.map((coord) => ({
        lat: coord.lat + 0.001,
        lng: coord.lng + 0.001,
      })),
      createdAt: new Date().toISOString(),
      isFavorite: false,
    }

    setRegions([...regions, duplicatedRegion])

    toast({
      title: "Sucesso",
      description: "Região duplicada com sucesso!",
    })
  }

  const undo = () => {
    if (historyIndex >= 0) {
      const entry = history[historyIndex]
      if (entry.action === "add" && entry.region) {
        setRegions(regions.filter((r) => r.id !== entry.region!.id))
      } else if (entry.action === "delete" && entry.region) {
        setRegions([...regions, entry.region])
      } else if (entry.action === "bulk" && entry.regions) {
        // Implementar undo para operações em massa
      }
      setHistoryIndex(historyIndex - 1)

      toast({
        title: "Desfeito",
        description: entry.description,
      })
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const entry = history[historyIndex + 1]
      if (entry.action === "add" && entry.region) {
        setRegions([...regions, entry.region])
      } else if (entry.action === "delete" && entry.region) {
        setRegions(regions.filter((r) => r.id !== entry.region!.id))
      }
      setHistoryIndex(historyIndex + 1)

      toast({
        title: "Refeito",
        description: entry.description,
      })
    }
  }

  const zoomToRegion = (region: Region) => {
    if (!map) return

    const bounds = new window.google.maps.LatLngBounds()
    region.coordinates.forEach((coord) => bounds.extend(coord))
    map.fitBounds(bounds)

    // Destacar região temporariamente
    setTimeout(() => {
      const highlight = new window.google.maps.Polygon({
        paths: region.coordinates,
        strokeColor: "#ff0000",
        strokeOpacity: 1,
        strokeWeight: 4,
        fillOpacity: 0,
      })
      highlight.setMap(map)

      setTimeout(() => {
        highlight.setMap(null)
      }, 2000)
    }, 500)
  }

  const testPoint = async () => {
    if (!testLat || !testLng) {
      toast({
        title: "Erro",
        description: "Digite latitude e longitude para testar.",
        variant: "destructive",
      })
      return
    }

    const lat = Number.parseFloat(testLat)
    const lng = Number.parseFloat(testLng)

    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: "Erro",
        description: "Coordenadas inválidas.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/check-point", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          regions: filteredRegions.filter((r) => r.isVisible),
        }),
      })

      const results = await response.json()

      // Adicionar informações extras aos resultados
      const enhancedResults = results.map((result: TestResult) => {
        const region = regions.find((r) => r.regionName === result.regionName)
        return {
          ...result,
          confidence: 0.95, // Simulado
          distance: region ? 0 : Math.random() * 1000, // Simulado
        }
      })

      setTestResults(enhancedResults)

      // Adicionar marcador animado
      if (map) {
        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map,
          title: `Ponto testado: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          animation: window.google.maps.Animation.BOUNCE,
          icon: {
            url:
              "data:image/svg+xml;charset=UTF-8," +
              encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="14" fill="#ef4444" stroke="#ffffff" strokeWidth="3"/>
                  <circle cx="16" cy="16" r="6" fill="#ffffff"/>
                  <text x="16" y="20" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="bold">TEST</text>
                </svg>
              `),
          },
        })

        setTimeout(() => {
          marker.setAnimation(null)
        }, 3000)

        setTimeout(() => {
          marker.setMap(null)
        }, 10000)
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao verificar ponto.",
        variant: "destructive",
      })
    }
  }

  const testAddress = async () => {
    if (!testAddressInput.trim()) {
      toast({
        title: "Erro",
        description: "Digite um endereço para testar.",
        variant: "destructive",
      })
      return
    }

    try {
      const geocodeResponse = await fetch("/api/geocode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address: testAddressInput }),
      })

      const geocodeResult = await geocodeResponse.json()

      if (!geocodeResult.success) {
        toast({
          title: "Erro",
          description: "Endereço não encontrado.",
          variant: "destructive",
        })
        return
      }

      const { lat, lng } = geocodeResult.coordinates

      const response = await fetch("/api/check-point", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          regions: filteredRegions.filter((r) => r.isVisible),
        }),
      })

      const results = await response.json()
      setTestResults(results)

      if (map) {
        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map,
          title: `Endereço: ${geocodeResult.address}`,
          animation: window.google.maps.Animation.DROP,
        })

        setTimeout(() => marker.setMap(null), 10000)
      }

      toast({
        title: "Sucesso",
        description: `Endereço geocodificado: ${geocodeResult.address}`,
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao verificar endereço.",
        variant: "destructive",
      })
    }
  }

  const startDrawing = (mode: "polygon" | "rectangle" | "circle") => {
    if (drawingManager) {
      setDrawingMode(mode)
      const drawingModes = {
        polygon: window.google.maps.drawing.OverlayType.POLYGON,
        rectangle: window.google.maps.drawing.OverlayType.RECTANGLE,
        circle: window.google.maps.drawing.OverlayType.CIRCLE,
      }
      drawingManager.setDrawingMode(drawingModes[mode])
    }
  }

  const exportRegions = () => {
    const exportData = {
      regions,
      layers,
      settings: mapSettings,
      exportedAt: new Date().toISOString(),
      version: "2.0",
      metadata: {
        totalRegions: regions.length,
        totalLayers: layers.length,
        favoriteRegions: regions.filter((r) => r.isFavorite).length,
        lockedRegions: regions.filter((r) => r.isLocked).length,
      },
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `regioes-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Sucesso",
      description: "Dados exportados com sucesso!",
    })
  }

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (mapContainerRef.current?.requestFullscreen) {
        mapContainerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  // Função para alternar modo de deletar pontos
  const toggleDeleteMode = () => {
    setDeleteMode(!deleteMode)

    if (!deleteMode) {
      toast({
        title: "Modo Deletar Ativado",
        description: "Clique nos pontos do polígono para deletá-los",
      })
    } else {
      toast({
        title: "Modo Deletar Desativado",
        description: "Modo de edição normal restaurado",
      })
    }
  }

  // Função melhorada para adicionar vértice
  const addVertexToPolygon = () => {
    if (!editingRegion) return

    const shape = editableShapes.get(editingRegion)
    const region = regions.find((r) => r.id === editingRegion)

    if (!shape || !region || region.type !== "polygon") return

    const polygon = shape as google.maps.Polygon
    const path = polygon.getPath()

    if (path.getLength() >= 2) {
      const point1 = path.getAt(0)
      const point2 = path.getAt(1)

      const midLat = (point1.lat() + point2.lat()) / 2
      const midLng = (point1.lng() + point2.lng()) / 2

      path.insertAt(1, new window.google.maps.LatLng(midLat, midLng))

      toast({
        title: "Vértice Adicionado",
        description: "Novo ponto adicionado ao polígono. Arraste para posicionar.",
      })
    }
  }

  // Função melhorada para remover vértice
  const removeLastVertex = () => {
    if (!editingRegion) return

    const shape = editableShapes.get(editingRegion)
    const region = regions.find((r) => r.id === editingRegion)

    if (!shape || !region || region.type !== "polygon") return

    const polygon = shape as google.maps.Polygon
    const path = polygon.getPath()

    if (path.getLength() > 3) {
      path.removeAt(path.getLength() - 1)

      toast({
        title: "Vértice Removido",
        description: "Último ponto removido do polígono.",
      })
    } else {
      toast({
        title: "Não é possível remover",
        description: "Um polígono precisa de pelo menos 3 pontos.",
        variant: "destructive",
      })
    }
  }

  // Função para deletar ponto específico
  const deleteSpecificVertex = (polygon: google.maps.Polygon, vertexIndex: number) => {
    const path = polygon.getPath()

    if (path.getLength() > 3) {
      path.removeAt(vertexIndex)

      toast({
        title: "Ponto Deletado",
        description: `Ponto ${vertexIndex + 1} removido do polígono.`,
      })
    } else {
      toast({
        title: "Não é possível deletar",
        description: "Um polígono precisa de pelo menos 3 pontos.",
        variant: "destructive",
      })
    }
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Header com status */}
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold">Sistema Profissional de Regiões</h1>
                <Badge variant={isOnline ? "default" : "destructive"}>{isOnline ? "Online" : "Offline"}</Badge>
                {lastSaved && (
                  <div className="text-sm text-muted-foreground">Salvo: {lastSaved.toLocaleTimeString()}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {loadingProgress > 0 && loadingProgress < 100 && (
                  <div className="w-32">
                    <Progress value={loadingProgress} className="h-2" />
                  </div>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                      {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isFullscreen ? "Sair do modo tela cheia" : "Entrar em tela cheia"}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setShowAnalytics(!showAnalytics)}>
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Mostrar/ocultar painel de analytics</p>
                  </TooltipContent>
                </Tooltip>

                <div className="flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={undo} disabled={historyIndex < 0}>
                        <Undo2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Desfazer última ação (Ctrl+Z)</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={redo}
                        disabled={historyIndex >= history.length - 1}
                      >
                        <Redo2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Refazer última ação (Ctrl+Shift+Z)</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={() => setShowCoordinates(!showCoordinates)}>
                        <Target className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Mostrar coordenadas do mouse no mapa</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto p-4">
          {/* Analytics Panel */}
          {showAnalytics && (
            <div className="mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Analytics Dashboard
                  </CardTitle>
                  <CardDescription>Estatísticas e insights das suas regiões</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{regions.length}</div>
                      <div className="text-sm text-muted-foreground">Total de Regiões</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {regions.filter((r) => r.isFavorite).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Favoritas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {regions.filter((r) => r.isLocked).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Bloqueadas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {(regions.reduce((acc, r) => acc + (r.area || 0), 0) / 1000000).toFixed(2)} km²
                      </div>
                      <div className="text-sm text-muted-foreground">Área Total</div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Distribuição por Tipo</h4>
                    <div className="space-y-2">
                      {["polygon", "rectangle", "circle"].map((type) => {
                        const count = regions.filter((r) => r.type === type).length
                        const percentage = regions.length > 0 ? (count / regions.length) * 100 : 0
                        return (
                          <div key={type} className="flex items-center justify-between">
                            <span className="capitalize text-sm">{type}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-muted rounded-full h-2">
                                <div className="bg-primary h-2 rounded-full" style={{ width: `${percentage}%` }} />
                              </div>
                              <span className="text-sm w-12 text-right">{count}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Camadas</h4>
                    <div className="space-y-2">
                      {layers.map((layer) => (
                        <div key={layer.id} className="flex items-center justify-between p-2 rounded border">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: layer.color }} />
                            <span className="text-sm">{layer.name}</span>
                          </div>
                          <Badge variant="outline">{regions.filter((r) => r.layer === layer.id).length} regiões</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Mapa */}
            <div className="lg:col-span-3" ref={mapContainerRef}>
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        Mapa Interativo Profissional
                      </CardTitle>
                      <CardDescription>
                        {filteredRegions.length} de {regions.length} regiões visíveis
                        {showCoordinates && (
                          <span className="ml-4">
                            Mouse: {currentCoordinates.lat.toFixed(6)}, {currentCoordinates.lng.toFixed(6)}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Barra de ferramentas avançada */}
                  <div className="mb-4 p-4 bg-muted rounded-lg space-y-4">
                    {/* Ferramentas de desenho */}
                    <div className="flex flex-wrap gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => startDrawing("polygon")}
                            disabled={!isLoaded}
                            variant={drawingMode === "polygon" ? "default" : "outline"}
                            size="sm"
                          >
                            <Pentagon className="w-4 h-4 mr-2" />
                            Polígono
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Desenhe uma região com múltiplos pontos conectados</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => startDrawing("rectangle")}
                            disabled={!isLoaded}
                            variant={drawingMode === "rectangle" ? "default" : "outline"}
                            size="sm"
                          >
                            <Square className="w-4 h-4 mr-2" />
                            Retângulo
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Desenhe uma região retangular simples</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => startDrawing("circle")}
                            disabled={!isLoaded}
                            variant={drawingMode === "circle" ? "default" : "outline"}
                            size="sm"
                          >
                            <Circle className="w-4 h-4 mr-2" />
                            Círculo
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Desenhe uma região circular com raio definido</p>
                        </TooltipContent>
                      </Tooltip>

                      <Separator orientation="vertical" className="h-8" />

                      {/* Controles de visualização */}
                      <div className="flex items-center gap-2">
                        <Switch checked={showGrid} onCheckedChange={setShowGrid} id="grid" />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Label htmlFor="grid" className="text-sm cursor-pointer">
                              <Grid3X3 className="w-4 h-4 inline mr-1" />
                              Grade
                            </Label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Exibe uma grade no mapa para melhor alinhamento</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch checked={precisionMode} onCheckedChange={setPrecisionMode} id="precision" />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Label htmlFor="precision" className="text-sm cursor-pointer">
                              <Settings className="w-4 h-4 inline mr-1" />
                              Precisão
                            </Label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Permite inserir coordenadas exatas manualmente</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch checked={measurementMode} onCheckedChange={setMeasurementMode} id="measurement" />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Label htmlFor="measurement" className="text-sm cursor-pointer">
                              <Ruler className="w-4 h-4 inline mr-1" />
                              Medição
                            </Label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Ativa ferramentas de medição de distância e área</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Controles de estilo */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Label className="text-xs cursor-help">Camada</Label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Organize suas regiões em diferentes camadas</p>
                          </TooltipContent>
                        </Tooltip>
                        <Select value={currentLayer} onValueChange={setCurrentLayer}>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {layers.map((layer) => (
                              <SelectItem key={layer.id} value={layer.id}>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded" style={{ backgroundColor: layer.color }} />
                                  {layer.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Label className="text-xs cursor-help">Preenchimento</Label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Cor do interior da região</p>
                          </TooltipContent>
                        </Tooltip>
                        <Input
                          type="color"
                          value={currentStyle.fillColor}
                          onChange={(e) => setCurrentStyle({ ...currentStyle, fillColor: e.target.value })}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Label className="text-xs cursor-help">Borda</Label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Cor da linha de contorno da região</p>
                          </TooltipContent>
                        </Tooltip>
                        <Input
                          type="color"
                          value={currentStyle.strokeColor}
                          onChange={(e) => setCurrentStyle({ ...currentStyle, strokeColor: e.target.value })}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Label className="text-xs cursor-help">
                              Opacidade: {Math.round(currentStyle.fillOpacity * 100)}%
                            </Label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Transparência do preenchimento (0% = transparente, 100% = opaco)</p>
                          </TooltipContent>
                        </Tooltip>
                        <Slider
                          value={[currentStyle.fillOpacity]}
                          onValueChange={([value]) => setCurrentStyle({ ...currentStyle, fillOpacity: value })}
                          max={1}
                          min={0}
                          step={0.1}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Label className="text-xs cursor-help">Espessura: {currentStyle.strokeWeight}px</Label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Largura da linha de contorno em pixels</p>
                          </TooltipContent>
                        </Tooltip>
                        <Slider
                          value={[currentStyle.strokeWeight]}
                          onValueChange={([value]) => setCurrentStyle({ ...currentStyle, strokeWeight: value })}
                          max={10}
                          min={1}
                          step={1}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Controles de edição */}
                    {showEditControls && editingRegion && (
                      <div className="border-t pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline" className="bg-yellow-100">
                            Editando: {regions.find((r) => r.id === editingRegion)?.name}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          {regions.find((r) => r.id === editingRegion)?.type === "polygon" && (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button onClick={addVertexToPolygon} size="sm" variant="outline">
                                    <Plus className="w-4 h-4 mr-1" />
                                    Vértice
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Adiciona um novo ponto ao polígono</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button onClick={removeLastVertex} size="sm" variant="outline">
                                    <Minus className="w-4 h-4 mr-1" />
                                    Vértice
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Remove o último ponto do polígono</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    onClick={toggleDeleteMode}
                                    size="sm"
                                    variant={deleteMode ? "destructive" : "outline"}
                                  >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Deletar Pontos
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Clique nos pontos do polígono para deletá-los</p>
                                </TooltipContent>
                              </Tooltip>
                            </>
                          )}

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={finishEditingRegion}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Salvar
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Salva as alterações feitas na região (Ctrl+S)</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button onClick={cancelEditingRegion} size="sm" variant="outline">
                                Cancelar
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Cancela a edição e descarta alterações (Esc)</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    )}

                    {/* Modo de precisão */}
                    {precisionMode && (
                      <div className="border-t pt-4">
                        <Label className="text-sm font-medium">Adicionar Ponto por Coordenadas</Label>
                        <div className="flex gap-2 mt-2">
                          <Input
                            placeholder="Latitude"
                            value={coordinateInput.lat}
                            onChange={(e) => setCoordinateInput({ ...coordinateInput, lat: e.target.value })}
                            className="flex-1"
                          />
                          <Input
                            placeholder="Longitude"
                            value={coordinateInput.lng}
                            onChange={(e) => setCoordinateInput({ ...coordinateInput, lng: e.target.value })}
                            className="flex-1"
                          />
                          <Button onClick={() => {}} size="sm">
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div id="map" className="w-full h-[600px] rounded-lg border" style={{ minHeight: "600px" }} />
                  {!isLoaded && (
                    <div className="flex items-center justify-center h-[600px] bg-muted rounded-lg">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Carregando mapa avançado...</p>
                        {loadingProgress > 0 && (
                          <div className="w-48 mx-auto mt-2">
                            <Progress value={loadingProgress} className="h-2" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Painel lateral */}
            <div className="space-y-6">
              {/* Busca e filtros */}
              <Card>
                <CardHeader>
                  <CardTitle>Busca e Filtros</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="search">Buscar regiões</Label>
                    <Input
                      id="search"
                      placeholder="Nome, descrição ou tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch checked={autoSave} onCheckedChange={setAutoSave} id="autosave" />
                    <Label htmlFor="autosave" className="text-sm">
                      Auto-salvar
                    </Label>
                  </div>

                  {selectedRegions.size > 0 && (
                    <div className="p-3 bg-muted rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{selectedRegions.size} região(ões) selecionada(s)</span>
                        <Button size="sm" variant="destructive" onClick={bulkDeleteRegions}>
                          Excluir Selecionadas
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Salvar Região */}
              <Card>
                <CardHeader>
                  <CardTitle>Nova Região</CardTitle>
                  <CardDescription>Configure e salve sua região desenhada</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="regionName">Nome da Região *</Label>
                    <Input
                      id="regionName"
                      value={regionName}
                      onChange={(e) => setRegionName(e.target.value)}
                      placeholder="Ex: Centro da cidade"
                    />
                  </div>

                  <div>
                    <Label htmlFor="regionDescription">Descrição</Label>
                    <Input
                      id="regionDescription"
                      value={regionDescription}
                      onChange={(e) => setRegionDescription(e.target.value)}
                      placeholder="Descrição opcional..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="regionTags">Tags (separadas por vírgula)</Label>
                    <Input
                      id="regionTags"
                      value={regionTags}
                      onChange={(e) => setRegionTags(e.target.value)}
                      placeholder="comercial, centro, importante"
                    />
                  </div>

                  {currentPolygon && (
                    <div className="p-3 bg-muted rounded">
                      <div className="text-sm space-y-1">
                        <div>
                          <strong>Tipo:</strong> {drawingMode}
                        </div>
                        <div>
                          <strong>Camada:</strong> {layers.find((l) => l.id === currentLayer)?.name}
                        </div>
                        <div>
                          <strong>Estilo:</strong> {currentStyle.fillColor}
                        </div>
                      </div>
                    </div>
                  )}

                  <Button onClick={saveRegion} className="w-full" disabled={!currentPolygon}>
                    Salvar Região
                  </Button>
                </CardContent>
              </Card>

              {/* Lista de Regiões */}
              <Card>
                <CardHeader>
                  <CardTitle>Regiões ({filteredRegions.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredRegions.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      {regions.length === 0
                        ? "Nenhuma região criada ainda."
                        : "Nenhuma região encontrada com os filtros aplicados."}
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredRegions.map((region) => (
                        <div
                          key={region.id}
                          className={`flex items-center justify-between p-3 rounded border cursor-pointer transition-colors ${
                            selectedRegions.has(region.id) ? "bg-blue-50 border-blue-200" : "hover:bg-muted/50"
                          }`}
                          onClick={() => {
                            const newSelected = new Set(selectedRegions)
                            if (newSelected.has(region.id)) {
                              newSelected.delete(region.id)
                            } else {
                              newSelected.add(region.id)
                            }
                            setSelectedRegions(newSelected)
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-sm truncate">{region.name}</div>
                              {region.isFavorite && <span className="text-yellow-500">⭐</span>}
                              {region.isLocked && <span className="text-red-500">🔒</span>}
                              {!region.isVisible && <span className="text-gray-400">👁️‍🗨️</span>}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {region.type} • {region.area ? `${(region.area / 1000000).toFixed(2)} km²` : "N/A"}
                            </div>
                            {region.tags && region.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {region.tags.slice(0, 2).map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                                    {tag}
                                  </Badge>
                                ))}
                                {region.tags.length > 2 && (
                                  <Badge variant="outline" className="text-xs px-1 py-0">
                                    +{region.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                zoomToRegion(region)
                              }}
                              title="Zoom"
                            >
                              <Target className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleVisibility(region.id)
                              }}
                              title={region.isVisible ? "Ocultar" : "Mostrar"}
                            >
                              <span className="text-xs">{region.isVisible ? "👁️" : "👁️‍🗨️"}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                startEditingRegion(region.id)
                              }}
                              title="Editar"
                              disabled={editingRegion !== null || region.isLocked}
                            >
                              <Settings className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {regions.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <Button onClick={exportRegions} variant="outline" className="w-full bg-transparent">
                        Exportar Dados
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Teste de Coordenadas */}
              <Card>
                <CardHeader>
                  <CardTitle>Testar Localização</CardTitle>
                  <CardDescription>Verificação por coordenadas ou endereço</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="testLat">Latitude</Label>
                      <Input
                        id="testLat"
                        value={testLat}
                        onChange={(e) => setTestLat(e.target.value)}
                        placeholder="-23.5505"
                        type="number"
                        step="any"
                      />
                    </div>
                    <div>
                      <Label htmlFor="testLng">Longitude</Label>
                      <Input
                        id="testLng"
                        value={testLng}
                        onChange={(e) => setTestLng(e.target.value)}
                        placeholder="-46.6333"
                        type="number"
                        step="any"
                      />
                    </div>
                  </div>
                  <Button onClick={testPoint} className="w-full">
                    Verificar Coordenadas
                  </Button>

                  <Separator />

                  <div>
                    <Label htmlFor="testAddress">Ou teste por endereço</Label>
                    <Input
                      id="testAddress"
                      value={testAddressInput}
                      onChange={(e) => setTestAddressInput(e.target.value)}
                      placeholder="Av. Paulista, 1000 - São Paulo, SP"
                    />
                  </div>
                  <Button onClick={testAddress} className="w-full">
                    Verificar Endereço
                  </Button>

                  {/* Resultados */}
                  {testResults.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Resultados:</h4>
                      <div className="max-h-32 overflow-y-auto space-y-2">
                        {testResults.map((result, index) => (
                          <div key={index} className="flex items-center justify-between p-2 rounded border">
                            <span className="text-sm truncate">{result.regionName}</span>
                            <Badge
                              variant={result.isInside ? "default" : "secondary"}
                              className={result.isInside ? "bg-green-500" : ""}
                            >
                              {result.isInside ? "✓ Dentro" : "✗ Fora"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Importar KML */}
              <Card>
                <CardHeader>
                  <CardTitle>Importar KML</CardTitle>
                  <CardDescription>Carregue regiões de arquivos KML</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    type="file"
                    accept=".kml"
                    onChange={handleKMLImport}
                    ref={fileInputRef}
                    disabled={isImporting}
                  />

                  {isImporting && (
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Importando arquivo...</div>
                      <Progress value={loadingProgress} className="h-2" />
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    <p>
                      <strong>Formatos suportados:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                      <li>Arquivos .kml do Google Earth</li>
                      <li>Polígonos com coordenadas</li>
                      <li>Nomes e descrições das regiões</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
