"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Eye } from "lucide-react"

// Types for coordinates
interface Point {
  x: number
  y: number
}

interface GridPosition {
  mainGrid: Point
  detailGrid: Point
}

// Constants
const MAIN_GRID_SIZE = 4
const DETAIL_GRID_SIZE = 4
const TOTAL_GRID_SIZE = MAIN_GRID_SIZE * DETAIL_GRID_SIZE // 16 x 16 = 256 possible points
const TOTAL_POINTS = 50

// Mapping functions
function absoluteToGrid(point: Point): GridPosition {
  return {
    mainGrid: {
      x: Math.floor(point.x / DETAIL_GRID_SIZE),
      y: Math.floor(point.y / DETAIL_GRID_SIZE)
    },
    detailGrid: {
      x: point.x % DETAIL_GRID_SIZE,
      y: point.y % DETAIL_GRID_SIZE
    }
  }
}

function gridToAbsolute(gridPos: GridPosition): Point {
  return {
    x: gridPos.mainGrid.x * DETAIL_GRID_SIZE + gridPos.detailGrid.x,
    y: gridPos.mainGrid.y * DETAIL_GRID_SIZE + gridPos.detailGrid.y
  }
}

function isValidPoint(point: Point): boolean {
  return (
    point.x >= 0 &&
    point.x < TOTAL_GRID_SIZE &&
    point.y >= 0 &&
    point.y < TOTAL_GRID_SIZE
  )
}

function isSamePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y
}

function getPointsInMainSquare(points: Point[], mainSquare: Point): Point[] {
  const startX = mainSquare.x * DETAIL_GRID_SIZE
  const startY = mainSquare.y * DETAIL_GRID_SIZE
  const endX = startX + DETAIL_GRID_SIZE
  const endY = startY + DETAIL_GRID_SIZE

  return points.filter(point =>
    point.x >= startX && point.x < endX &&
    point.y >= startY && point.y < endY
  )
}

function countPointsInMainSquare(points: Point[], mainSquare: Point): number {
  return getPointsInMainSquare(points, mainSquare).length
}

interface TreasureMapProps {
  playerTurns: number
  onTurnUsed: () => void
  onTurnsChanged: (turns: number) => void
  selectedMainSquare: Point | null
  setSelectedMainSquare: (square: Point | null) => void
  userCurrentSelection: Point[]
  setUserCurrentSelection: (points: Point[]) => void
  usersSubmitted: Point[]
  setUsersSubmitted: (points: Point[]) => void
}

export function TreasureMap({
  playerTurns,
  onTurnUsed,
  onTurnsChanged,
  selectedMainSquare,
  setSelectedMainSquare,
  userCurrentSelection,
  setUserCurrentSelection,
  usersSubmitted,
  setUsersSubmitted,
}: TreasureMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const detailedMapRef = useRef<HTMLImageElement | null>(null)
  const simplifiedMapRef = useRef<HTMLImageElement | null>(null)

  const [mapPosition, setMapPosition] = useState({ x: 0, y: 0 })
  const [playerSnapshots, setPlayerSnapshots] = useState<
    Array<{
      id: string
      timestamp: number
      playerPositions: Set<string>
      cost: number
      viewType: "main" | "detailed"
      detailedSquare?: { x: number; y: number }
    }>
  >([])
  const [activeSnapshot, setActiveSnapshot] = useState<string | null>(null)
  const snapshotCost = 0.005 // ETH per snapshot
  const pointCost = 0.001 // ETH per point
  const [imagesLoaded, setImagesLoaded] = useState({ detailed: false, simplified: false })
  const [animationTime, setAnimationTime] = useState(0)
  const mainMapSize = 4 // Main map is always 4x4
  const detailMapSize = 4 // Detail view is also 4x4
  const canvasWidth = 600
  const canvasHeight = 600
  const [isDragging, setIsDragging] = useState(false)
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })





  // These functions are now defined at the top level

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "#1e293b" // slate-800
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    ctx.save()
    ctx.translate(mapPosition.x, mapPosition.y)

    if (selectedMainSquare) {
      if (detailedMapRef.current && imagesLoaded.detailed) {
        ctx.imageSmoothingEnabled = false
        const cropX = (selectedMainSquare.x / mainMapSize) * detailedMapRef.current.width
        const cropY = (selectedMainSquare.y / mainMapSize) * detailedMapRef.current.height
        const cropWidth = detailedMapRef.current.width / mainMapSize
        const cropHeight = detailedMapRef.current.height / mainMapSize

        ctx.drawImage(detailedMapRef.current, cropX, cropY, cropWidth, cropHeight, 0, 0, canvasWidth, canvasHeight)
      }

      ctx.strokeStyle = "#64748b" // slate-500
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.7

      for (let i = 0; i <= detailMapSize; i++) {
        const x = (i / detailMapSize) * canvasWidth
        const y = (i / detailMapSize) * canvasHeight

        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvasHeight)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvasWidth, y)
        ctx.stroke()
      }

      ctx.globalAlpha = 1

      // Render submitted points
      const submittedPoints = getPointsInMainSquare(usersSubmitted, selectedMainSquare)

      submittedPoints.forEach(point => {
        // Convert absolute coordinates to relative coordinates within the detail view
        const relativeX = point.x % DETAIL_GRID_SIZE
        const relativeY = point.y % DETAIL_GRID_SIZE


        // Calculate center of the cell
        const cellWidth = canvasWidth / DETAIL_GRID_SIZE
        const cellHeight = canvasHeight / DETAIL_GRID_SIZE
        const flagX = relativeX * cellWidth + cellWidth / 2
        const flagY = relativeY * cellHeight + cellHeight / 2

        const waveOffset = Math.sin(animationTime * 0.003 + flagX * 0.01) * 3
        const currentFlagY = flagY + waveOffset

        ctx.fillStyle = "#22c55e" // green-500 for submitted flags
        ctx.beginPath()
        ctx.arc(flagX, currentFlagY, 8, 0, 2 * Math.PI)
        ctx.fill()

        ctx.fillStyle = "#ffffff"
        ctx.font = "16px monospace"
        ctx.textAlign = "center"
        ctx.fillText("✓", flagX, currentFlagY + 5)
      })

      // Render current selection points
      const currentPoints = getPointsInMainSquare(userCurrentSelection, selectedMainSquare)

      currentPoints.forEach(point => {
        // Convert absolute coordinates to relative coordinates within the detail view
        const relativeX = point.x % DETAIL_GRID_SIZE
        const relativeY = point.y % DETAIL_GRID_SIZE


        // Calculate center of the cell
        const cellWidth = canvasWidth / DETAIL_GRID_SIZE
        const cellHeight = canvasHeight / DETAIL_GRID_SIZE
        const flagX = relativeX * cellWidth + cellWidth / 2
        const flagY = relativeY * cellHeight + cellHeight / 2

        const waveOffset = Math.sin(animationTime * 0.003 + flagX * 0.01) * 3
        const currentFlagY = flagY + waveOffset

        ctx.fillStyle = "#f59e0b" // amber-500 for current selection
        ctx.beginPath()
        ctx.arc(flagX, currentFlagY, 8, 0, 2 * Math.PI)
        ctx.fill()

        ctx.fillStyle = "#ffffff"
        ctx.font = "16px monospace"
        ctx.textAlign = "center"
        ctx.fillText("🛒", flagX, currentFlagY + 5)
      })

      if (activeSnapshot) {
        const snapshot = playerSnapshots.find((s) => s.id === activeSnapshot)
        if (snapshot) {
          if (snapshot.viewType === "main" && !selectedMainSquare) {
            // Render main square occupancy indicators
            snapshot.playerPositions.forEach((flagKey) => {
              if (flagKey.startsWith("main-")) {
                const [, mainX, mainY] = flagKey.split("-").map(Number)
                const flagX = (mainX / mainMapSize) * canvasWidth
                const flagY = (mainY / mainMapSize) * canvasHeight

                // Draw pulsing indicator for occupied squares
                const pulseIntensity = 0.5 + 0.3 * Math.sin(animationTime * 0.003)
                ctx.fillStyle = `rgba(6, 182, 212, ${pulseIntensity})` // cyan with pulsing alpha
                ctx.strokeStyle = "#0891b2" // cyan-600
                ctx.lineWidth = 3

                ctx.beginPath()
                ctx.arc(
                  flagX + canvasWidth / mainMapSize / 2,
                  flagY + canvasHeight / mainMapSize / 2,
                  15,
                  0,
                  2 * Math.PI,
                )
                ctx.fill()
                ctx.stroke()

                ctx.fillStyle = "white"
                ctx.font = "bold 14px monospace"
                ctx.textAlign = "center"
                ctx.textBaseline = "middle"
                ctx.fillText("👥", flagX + canvasWidth / mainMapSize / 2, flagY + canvasHeight / mainMapSize / 2)
              }
            })
          } else if (
            snapshot.viewType === "detailed" &&
            selectedMainSquare &&
            snapshot.detailedSquare?.x === selectedMainSquare.x &&
            snapshot.detailedSquare?.y === selectedMainSquare.y
          ) {
            // Render detailed positions within the current square
            snapshot.playerPositions.forEach((flagKey) => {
              if (flagKey.startsWith("flag-")) {
                const parts = flagKey.split("-")
                const [, mainX, mainY, detailX, detailY] = parts.map(Number) as [string, number, number, number, number]

                const flagX = (detailX / detailMapSize) * canvasWidth
                const flagY = (detailY / detailMapSize) * canvasHeight

                ctx.fillStyle = "#06b6d4" // cyan-500
                ctx.strokeStyle = "#0891b2" // cyan-600
                ctx.lineWidth = 2
                ctx.font = "bold 20px monospace"
                ctx.textAlign = "center"
                ctx.textBaseline = "middle"

                ctx.beginPath()
                ctx.arc(
                  flagX + canvasWidth / detailMapSize / 2,
                  flagY + canvasHeight / detailMapSize / 2,
                  12,
                  0,
                  2 * Math.PI,
                )
                ctx.fill()
                ctx.stroke()

                ctx.fillStyle = "white"
                ctx.fillText("P", flagX + canvasWidth / detailMapSize / 2, flagY + canvasHeight / detailMapSize / 2)
              }
            })
          }
        }
      }
    } else {
      // Create a map of point counts per main square
      const mainSquareCounts = new Map<string, { submitted: number; current: number }>()

      // Initialize counts for all squares
      for (let x = 0; x < MAIN_GRID_SIZE; x++) {
        for (let y = 0; y < MAIN_GRID_SIZE; y++) {
          const mainSquare: Point = { x, y }
          mainSquareCounts.set(`${x}-${y}`, {
            submitted: countPointsInMainSquare(usersSubmitted, mainSquare),
            current: countPointsInMainSquare(userCurrentSelection, mainSquare)
          })
        }
      }

      if (detailedMapRef.current && imagesLoaded.detailed) {
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(detailedMapRef.current, 0, 0, canvasWidth, canvasHeight)
      }

      if (simplifiedMapRef.current && imagesLoaded.simplified) {
        ctx.imageSmoothingEnabled = false

        for (let x = 0; x < mainMapSize; x++) {
          for (let y = 0; y < mainMapSize; y++) {
            const squareKey = `${x}-${y}`

            const counts = mainSquareCounts.get(squareKey) || { submitted: 0, current: 0 }
            if (counts.submitted === 0 && counts.current === 0) {
              const squareX = (x / mainMapSize) * canvasWidth
              const squareY = (y / mainMapSize) * canvasHeight
              const squareWidth = canvasWidth / mainMapSize
              const squareHeight = canvasHeight / mainMapSize

              const cropX = (x / mainMapSize) * simplifiedMapRef.current.width
              const cropY = (y / mainMapSize) * simplifiedMapRef.current.height
              const cropWidth = simplifiedMapRef.current.width / mainMapSize
              const cropHeight = simplifiedMapRef.current.height / mainMapSize

              ctx.globalAlpha = 0.8
              ctx.drawImage(
                simplifiedMapRef.current,
                cropX,
                cropY,
                cropWidth,
                cropHeight,
                squareX,
                squareY,
                squareWidth,
                squareHeight,
              )
            }
          }
        }
        ctx.globalAlpha = 1
      }

      ctx.strokeStyle = "#64748b" // slate-500
      ctx.lineWidth = 3
      ctx.globalAlpha = 0.8

      for (let i = 0; i <= mainMapSize; i++) {
        const x = (i / mainMapSize) * canvasWidth
        const y = (i / mainMapSize) * canvasHeight

        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvasHeight)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvasWidth, y)
        ctx.stroke()
      }

      ctx.globalAlpha = 1

      mainSquareCounts.forEach(({ submitted, current }, squareKey) => {
        const [x, y] = squareKey.split("-").map(Number)
        const squareX = (x / MAIN_GRID_SIZE) * canvasWidth
        const squareY = (y / MAIN_GRID_SIZE) * canvasHeight
        const squareWidth = canvasWidth / MAIN_GRID_SIZE
        const squareHeight = canvasHeight / MAIN_GRID_SIZE

        // Render submitted points
        if (submitted > 0) {
          const pulseIntensity = 0.5 + 0.5 * Math.sin(animationTime * 0.005)
          ctx.strokeStyle = `rgba(34, 197, 94, ${pulseIntensity})` // green with pulse
          ctx.lineWidth = 4
          ctx.strokeRect(squareX + 2, squareY + 2, squareWidth - 4, squareHeight - 4)

          const centerX = squareX + squareWidth / 2
          const centerY = squareY + squareHeight / 2

          const breathe = 20 + Math.sin(animationTime * 0.004) * 3
          ctx.fillStyle = "#22c55e" // green-500
          ctx.beginPath()
          ctx.arc(centerX, centerY, breathe, 0, 2 * Math.PI)
          ctx.fill()

          ctx.fillStyle = "#ffffff"
          ctx.font = "bold 24px monospace"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(submitted.toString(), centerX, centerY)
        }

        // Render current selection points
        if (current > 0) {
          const pulseIntensity = 0.5 + 0.5 * Math.sin(animationTime * 0.005)
          ctx.strokeStyle = `rgba(245, 158, 11, ${pulseIntensity})` // amber with pulse
          ctx.lineWidth = 4
          ctx.strokeRect(squareX + 2, squareY + 2, squareWidth - 4, squareHeight - 4)

          const centerX = squareX + squareWidth / 2
          const centerY = squareY + squareHeight / 2 - 15 // Offset for current selection

          const breathe = 15 + Math.sin(animationTime * 0.004) * 2
          ctx.fillStyle = "#f59e0b" // amber-500
          ctx.beginPath()
          ctx.arc(centerX, centerY, breathe, 0, 2 * Math.PI)
          ctx.fill()

          ctx.fillStyle = "#ffffff"
          ctx.font = "bold 18px monospace"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(current.toString(), centerX, centerY)

          ctx.fillStyle = "#ffffff"
          ctx.font = "12px monospace"
          ctx.fillText("🛒", centerX, centerY + 25)
        }
      })

      if (activeSnapshot) {
        const snapshot = playerSnapshots.find((s) => s.id === activeSnapshot)
        if (snapshot) {
          snapshot.playerPositions.forEach((flagKey) => {
            const parts = flagKey.split("-")
            const [, mainX, mainY, detailX, detailY] = parts.map(Number) as [string, number, number, number, number]

            if (selectedMainSquare) {
              const currentSquare = selectedMainSquare as { x: number; y: number } | null
              if (currentSquare && mainX === currentSquare.x && mainY === currentSquare.y) {
                const flagX = (detailX / detailMapSize) * canvasWidth
                const flagY = (detailY / detailMapSize) * canvasHeight

                ctx.fillStyle = "#06b6d4" // cyan-500
                ctx.strokeStyle = "#0891b2" // cyan-600
                ctx.lineWidth = 2
                ctx.font = "bold 20px monospace"
                ctx.textAlign = "center"
                ctx.textBaseline = "middle"

                ctx.beginPath()
                ctx.arc(
                  flagX + canvasWidth / detailMapSize / 2,
                  flagY + canvasHeight / detailMapSize / 2,
                  12,
                  0,
                  2 * Math.PI,
                )
                ctx.fill()
                ctx.stroke()

                ctx.fillStyle = "white"
                ctx.fillText("P", flagX + canvasWidth / detailMapSize / 2, flagY + canvasHeight / detailMapSize / 2)
              }
            } else {
              const flagX = (mainX / mainMapSize) * canvasWidth
              const flagY = (mainY / mainMapSize) * canvasHeight

              ctx.fillStyle = "#06b6d4" // cyan-500
              ctx.beginPath()
              ctx.arc(flagX + canvasWidth / mainMapSize / 2, flagY + canvasHeight / mainMapSize / 2, 8, 0, 2 * Math.PI)
              ctx.fill()

              ctx.fillStyle = "white"
              ctx.font = "bold 12px monospace"
              ctx.textAlign = "center"
              ctx.textBaseline = "middle"
              ctx.fillText("P", flagX + canvasWidth / mainMapSize / 2, flagY + canvasHeight / mainMapSize / 2)
            }
          })
        }
      }
    }

    ctx.restore()
  }, [
    mapPosition,
    selectedMainSquare,
    userCurrentSelection,
    usersSubmitted,
    imagesLoaded,
    animationTime,
    activeSnapshot,
    playerSnapshots,
  ])

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (isDragging) return

      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      // Account for CSS scaling vs canvas intrinsic size
      const scaleX = canvasWidth / rect.width
      const scaleY = canvasHeight / rect.height
      let mouseX = (event.clientX - rect.left) * scaleX
      let mouseY = (event.clientY - rect.top) * scaleY

      // Calculate center points
      const centerX = canvasWidth / 2
      const centerY = canvasHeight / 2



      // Transform coordinates relative to center, adjust for pan
      let transformedX = (mouseX - centerX - mapPosition.x) + centerX
      let transformedY = (mouseY - centerY - mapPosition.y) + centerY

      // Clamp to canvas bounds
      transformedX = Math.max(0, Math.min(canvasWidth - 1, transformedX))
      transformedY = Math.max(0, Math.min(canvasHeight - 1, transformedY))



      if (selectedMainSquare) {
        // We're in detail view
        if (userCurrentSelection.length + usersSubmitted.length >= TOTAL_POINTS) {
          alert("No available points left!")
          return
        }

        // Calculate detail grid coordinates using the same method as before
        const cellW = canvasWidth / DETAIL_GRID_SIZE
        const cellH = canvasHeight / DETAIL_GRID_SIZE
        const detailX = Math.floor(transformedX / cellW)
        const detailY = Math.floor(transformedY / cellH)

        // Calculate base coordinates for this main square
        const baseX = selectedMainSquare.x * DETAIL_GRID_SIZE
        const baseY = selectedMainSquare.y * DETAIL_GRID_SIZE



        // Ensure coordinates are within bounds
        if (detailX >= 0 && detailX < DETAIL_GRID_SIZE && detailY >= 0 && detailY < DETAIL_GRID_SIZE) {
          // Calculate base coordinates (top-left of the selected main square in absolute coordinates)
          const baseX = selectedMainSquare.x * DETAIL_GRID_SIZE
          const baseY = selectedMainSquare.y * DETAIL_GRID_SIZE

          const absolutePoint: Point = {
            x: baseX + detailX,
            y: baseY + detailY
          }



          if (!isValidPoint(absolutePoint)) return

          // Check if point is already selected
          const isAlreadySelected = userCurrentSelection.some(point => isSamePoint(point, absolutePoint))

          if (isAlreadySelected) {
            // Remove point if already selected
            setUserCurrentSelection(userCurrentSelection.filter(point => !isSamePoint(point, absolutePoint)))
            return
          }

          // Check if point is already submitted
          const isAlreadySubmitted = usersSubmitted.some(point => isSamePoint(point, absolutePoint))

          if (isAlreadySubmitted) {
            return
          }

          // Add new point to selection
          setUserCurrentSelection([...userCurrentSelection, absolutePoint])
        }
      } else {
        // We're in main view
        const mainCellW = canvasWidth / MAIN_GRID_SIZE
        const mainCellH = canvasHeight / MAIN_GRID_SIZE
        const mainX = Math.floor(transformedX / mainCellW)
        const mainY = Math.floor(transformedY / mainCellH)



        if (mainX >= 0 && mainX < MAIN_GRID_SIZE && mainY >= 0 && mainY < MAIN_GRID_SIZE) {

          setSelectedMainSquare({ x: mainX, y: mainY })
        }
      }
    },
    [
      isDragging,
      selectedMainSquare,
      userCurrentSelection,
      usersSubmitted,
      setUserCurrentSelection,
      setSelectedMainSquare,
      mapPosition,
    ],
  )

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true)
    setLastMousePos({ x: event.clientX, y: event.clientY })
  }, [])

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging) return



      const deltaX = event.clientX - lastMousePos.x
      const deltaY = event.clientY - lastMousePos.y

      setMapPosition((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }))

      setLastMousePos({ x: event.clientX, y: event.clientY })
    },
    [isDragging, lastMousePos],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    const loadImages = () => {
      const detailedImg = new Image()
      detailedImg.onload = () => {
        detailedMapRef.current = detailedImg
        setImagesLoaded((prev) => ({ ...prev, detailed: true }))
      }
      detailedImg.src = "/detailed-buenos-aires-city-map-with-all-streets-av.png"

      const simplifiedImg = new Image()
      simplifiedImg.onload = () => {
        simplifiedMapRef.current = simplifiedImg
        setImagesLoaded((prev) => ({ ...prev, simplified: true }))
      }
      simplifiedImg.src = "/simplified-buenos-aires-map-with-key-landmarks-on.png"
    }

    loadImages()
  }, [])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])



  return (
    <div className="h-full flex flex-col">
      {/* Map Canvas - Full Height */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={(e) => {
            const touch = e.touches[0]
            if (touch) {
              handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY } as React.MouseEvent<HTMLCanvasElement>)
            }
          }}
          onTouchMove={(e) => {
            const touch = e.touches[0]
            if (touch) {
              handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY } as React.MouseEvent<HTMLCanvasElement>)
            }
          }}
          onTouchEnd={() => handleMouseUp()}
                      className={`w-full h-full ${
             selectedMainSquare ? (userCurrentSelection.length + usersSubmitted.length < TOTAL_POINTS ? "cursor-crosshair" : "cursor-not-allowed") : "cursor-pointer"
            } ${isDragging ? "cursor-grabbing" : ""}`}
          style={{
            objectFit: "contain",
          }}
        />

        {/* Intel Status - Floating */}
        {activeSnapshot && (
          <div className="absolute top-3 right-3">
            <Badge variant="default" className="bg-cyan-500 text-xs">
              <Eye className="w-3 h-3 mr-1" />
              Intel (
              {Math.ceil(
                (30000 - (Date.now() - playerSnapshots.find((s) => s.id === activeSnapshot)!.timestamp)) / 1000,
              )}
              s)
            </Badge>
          </div>
        )}
      </div>
    </div>
  )
}
