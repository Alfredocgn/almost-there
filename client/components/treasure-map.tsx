"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Eye } from "lucide-react"

interface TreasureMapProps {
  playerTurns: number
  onTurnUsed: () => void
  onTurnsChanged: (turns: number) => void
  selectedMainSquare: { x: number; y: number } | null
  setSelectedMainSquare: (square: { x: number; y: number } | null) => void
  cartFlags: Set<string>
  setCartFlags: (flags: Set<string>) => void
  placedFlags: Set<string>
  setPlacedFlags: (flags: Set<string>) => void
  submittedPointsCount: number
  setSubmittedPointsCount: (count: number | ((prev: number) => number)) => void
}

export function TreasureMap({
  playerTurns,
  onTurnUsed,
  onTurnsChanged,
  selectedMainSquare,
  setSelectedMainSquare,
  cartFlags,
  setCartFlags,
  placedFlags,
  setPlacedFlags,
  submittedPointsCount,
  setSubmittedPointsCount,
}: TreasureMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const detailedMapRef = useRef<HTMLImageElement | null>(null)
  const simplifiedMapRef = useRef<HTMLImageElement | null>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
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

  const generateMockPlayerPositions = (viewType: "main" | "detailed", detailedSquare?: { x: number; y: number }) => {
    const positions = new Set<string>()

    if (viewType === "main") {
      // For main view, only show which main squares have players (not exact positions)
      const occupiedSquares = Math.floor(Math.random() * 8) + 3 // 3-10 occupied squares
      for (let i = 0; i < occupiedSquares; i++) {
        const mainX = Math.floor(Math.random() * mainMapSize)
        const mainY = Math.floor(Math.random() * mainMapSize)
        // Use a special format for main square occupancy
        positions.add(`main-${mainX}-${mainY}`)
      }
    } else if (viewType === "detailed" && detailedSquare) {
      // For detailed view, show exact positions within the selected square
      const playersInSquare = Math.floor(Math.random() * 6) + 1 // 1-6 players in this square
      for (let i = 0; i < playersInSquare; i++) {
        const detailX = Math.floor(Math.random() * detailMapSize)
        const detailY = Math.floor(Math.random() * detailMapSize)
        positions.add(`flag-${detailedSquare.x}-${detailedSquare.y}-${detailX}-${detailY}`)
      }
    }

    return positions
  }

  const purchaseSnapshot = () => {
    if (playerTurns < 1) return // Need at least 1 turn to purchase

    const viewType = selectedMainSquare ? "detailed" : "main"
    const snapshot = {
      id: `snapshot-${Date.now()}`,
      timestamp: Date.now(),
      playerPositions: generateMockPlayerPositions(viewType as "main" | "detailed", selectedMainSquare || undefined),
      cost: snapshotCost,
      viewType: viewType as "main" | "detailed",
      detailedSquare: selectedMainSquare || undefined,
    }

    setPlayerSnapshots((prev) => [...prev, snapshot])
    setActiveSnapshot(snapshot.id)
    onTurnUsed() // Use one turn for the snapshot

    // Auto-hide snapshot after 30 seconds
    setTimeout(() => {
      setActiveSnapshot(null)
    }, 30000)
  }

  const getMainSquareKey = (gridX: number, gridY: number) => `main-${gridX}-${gridY}`
  const getFlagKey = (mainX: number, mainY: number, detailX: number, detailY: number) =>
    `flag-${mainX}-${mainY}-${detailX}-${detailY}`

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

      placedFlags.forEach((flagKey) => {
        const parts = flagKey.split("-")
        if (parts.length === 5 && parts[0] === "flag") {
          const [, mainX, mainY, detailX, detailY] = parts.map(Number) as [string, number, number, number, number]

          if (mainX === selectedMainSquare.x && mainY === selectedMainSquare.y) {
            const flagX = (detailX / detailMapSize) * canvasWidth + canvasWidth / detailMapSize / 2
            const flagY = (detailY / detailMapSize) * canvasHeight + canvasHeight / detailMapSize / 2

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
          }
        }
      })

      cartFlags.forEach((flagKey) => {
        const parts = flagKey.split("-")
        if (parts.length === 5 && parts[0] === "flag") {
          const [, mainX, mainY, detailX, detailY] = parts.map(Number) as [string, number, number, number, number]

          if (mainX === selectedMainSquare.x && mainY === selectedMainSquare.y) {
            const flagX = (detailX / detailMapSize) * canvasWidth + canvasWidth / detailMapSize / 2
            const flagY = (detailY / detailMapSize) * canvasHeight + canvasHeight / detailMapSize / 2

            const waveOffset = Math.sin(animationTime * 0.003 + flagX * 0.01) * 3
            const currentFlagY = flagY + waveOffset

            ctx.fillStyle = "#f59e0b" // amber-500 for cart flags
            ctx.beginPath()
            ctx.arc(flagX, currentFlagY, 8, 0, 2 * Math.PI)
            ctx.fill()

            ctx.fillStyle = "#ffffff"
            ctx.font = "16px monospace"
            ctx.textAlign = "center"
            ctx.fillText("🛒", flagX, currentFlagY + 5)
          }
        }
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
      const squaresWithSubmittedFlags = new Map<string, number>()
      const squaresWithCartFlags = new Map<string, number>()

      placedFlags.forEach((flagKey) => {
        const parts = flagKey.split("-")
        if (parts.length === 5 && parts[0] === "flag") {
          const [, mainX, mainY] = parts.map(Number) as [string, number, number, number, number]
          const squareKey = `${mainX}-${mainY}`
          squaresWithSubmittedFlags.set(squareKey, (squaresWithSubmittedFlags.get(squareKey) || 0) + 1)
        }
      })

      cartFlags.forEach((flagKey) => {
        const parts = flagKey.split("-")
        if (parts.length === 5 && parts[0] === "flag") {
          const [, mainX, mainY] = parts.map(Number) as [string, number, number, number, number]
          const squareKey = `${mainX}-${mainY}`
          squaresWithCartFlags.set(squareKey, (squaresWithCartFlags.get(squareKey) || 0) + 1)
        }
      })

      if (detailedMapRef.current && imagesLoaded.detailed) {
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(detailedMapRef.current, 0, 0, canvasWidth, canvasHeight)
      }

      if (simplifiedMapRef.current && imagesLoaded.simplified) {
        ctx.imageSmoothingEnabled = false

        for (let x = 0; x < mainMapSize; x++) {
          for (let y = 0; y < mainMapSize; y++) {
            const squareKey = `${x}-${y}`

            if (!squaresWithSubmittedFlags.has(squareKey) && !squaresWithCartFlags.has(squareKey)) {
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

      squaresWithSubmittedFlags.forEach((flagCount, squareKey) => {
        const [x, y] = squareKey.split("-").map(Number)
        const squareX = (x / mainMapSize) * canvasWidth
        const squareY = (y / mainMapSize) * canvasHeight
        const squareWidth = canvasWidth / mainMapSize
        const squareHeight = canvasHeight / mainMapSize

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
        ctx.fillText(flagCount.toString(), centerX, centerY)
      })

      squaresWithCartFlags.forEach((flagCount, squareKey) => {
        const [x, y] = squareKey.split("-").map(Number)
        const squareX = (x / mainMapSize) * canvasWidth
        const squareY = (y / mainMapSize) * canvasHeight
        const squareWidth = canvasWidth / mainMapSize
        const squareHeight = canvasHeight / mainMapSize

        const pulseIntensity = 0.5 + 0.5 * Math.sin(animationTime * 0.005)
        ctx.strokeStyle = `rgba(245, 158, 11, ${pulseIntensity})` // amber with pulse
        ctx.lineWidth = 4
        ctx.strokeRect(squareX + 2, squareY + 2, squareWidth - 4, squareHeight - 4)

        const centerX = squareX + squareWidth / 2
        const centerY = squareY + squareHeight / 2 - 15 // Offset for cart flags

        const breathe = 15 + Math.sin(animationTime * 0.004) * 2
        ctx.fillStyle = "#f59e0b" // amber-500
        ctx.beginPath()
        ctx.arc(centerX, centerY, breathe, 0, 2 * Math.PI)
        ctx.fill()

        ctx.fillStyle = "#ffffff"
        ctx.font = "bold 18px monospace"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(flagCount.toString(), centerX, centerY)

        ctx.fillStyle = "#ffffff"
        ctx.font = "12px monospace"
        ctx.fillText("🛒", centerX, centerY + 25)
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
    placedFlags,
    cartFlags,
    imagesLoaded,
    mainMapSize,
    detailMapSize,
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
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      const transformedX = mouseX
      const transformedY = mouseY

      if (selectedMainSquare) {
        if (submittedPointsCount + cartFlags.size >= 50) {
          alert("No available points left!")
          return
        }

        const detailX = Math.floor((transformedX / (canvasWidth / detailMapSize)))
        const detailY = Math.floor((transformedY / (canvasHeight / detailMapSize)))

        if (detailX >= 0 && detailX < detailMapSize && detailY >= 0 && detailY < detailMapSize) {
          const flagKey = getFlagKey(Number(selectedMainSquare.x), Number(selectedMainSquare.y), Number(detailX), Number(detailY))

          if (cartFlags.has(flagKey)) {
            removeFromCart(flagKey)
            return
          }

          if (placedFlags.has(flagKey)) {
            return
          }

          if (submittedPointsCount + cartFlags.size >= 50) {
            alert("Maximum 50 points per game reached!")
            return
          }

          const newCartFlags = new Set(cartFlags)
          newCartFlags.add(flagKey)
          setCartFlags(newCartFlags)
        }
      } else {
        const mainX = Math.floor((transformedX / (canvasWidth / mainMapSize)))
        const mainY = Math.floor((transformedY / (canvasHeight / mainMapSize)))

        if (mainX >= 0 && mainX < mainMapSize && mainY >= 0 && mainY < mainMapSize) {
          setSelectedMainSquare({ x: mainX, y: mainY })
        }
      }
    },
    [
      playerTurns,
      isDragging,
      mapPosition,
      selectedMainSquare,
      placedFlags,
      cartFlags,
      mainMapSize,
      detailMapSize,
      onTurnUsed,
      submittedPointsCount,
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

  const removeFromCart = (flagKey: string) => {
    const newCartFlags = new Set(cartFlags)
    newCartFlags.delete(flagKey)
    setCartFlags(newCartFlags)
  }

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
             selectedMainSquare ? (submittedPointsCount + cartFlags.size < 50 ? "cursor-crosshair" : "cursor-not-allowed") : "cursor-pointer"
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
