import {
    drawArrow,
    drawBlurRegion,
    drawBrush,
    drawEllipse,
    drawFocusSpotlight,
    drawLine,
    drawRectangle,
} from "@/services/canvas-draw"
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react"
import { Point, Rect, ToolSettings, ToolType } from "@/types/canvas"
import { copyCanvasToClipboard } from "@/services/image-service"
import { toast } from "sonner"

const DEFAULT_SETTINGS: ToolSettings = {
    strokeColor: "#ef4444",
    fillColor: "transparent",
    strokeWidth: 4,
    rectRounded: true,
    brushSmoothing: true,
    focusBlurUnfocused: true,
    focusRounded: true,
    blurRounded: true,
    blurIntensity: 14,
    fontSize: 20,
}

interface HistoryItem {
    imageData: ImageData
    width: number
    height: number
}

export function useCanvasEditor(isEditorOpen = true) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const previewCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)

    const pendingInitRef = useRef<{
        img?: HTMLImageElement | null
        dims?: { width: number; height: number; backgroundColor?: string }
    } | null>(null)
    const pendingCropDataRef = useRef<ImageData | null>(null)
    const pendingRestoreRef = useRef<ImageData | null>(null)

    const [width, setWidth] = useState<number>(1280)
    const [height, setHeight] = useState<number>(720)
    const [zoom, setZoom] = useState<number>(1)
    const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 })

    const [activeTool, setActiveTool] = useState<ToolType>("crop")
    const [settings, setSettings] = useState<ToolSettings>(DEFAULT_SETTINGS)

    // History stack
    const historyRef = useRef<HistoryItem[]>([])
    const historyIndexRef = useRef<number>(-1)
    const [canUndo, setCanUndo] = useState(false)
    const [canRedo, setCanRedo] = useState(false)

    // Interactive states
    const [isDrawing, setIsDrawing] = useState(false)
    const [isPanning, setIsPanning] = useState(false)
    const startPointRef = useRef<Point | null>(null)
    const lastPanPointRef = useRef<Point | null>(null)
    const brushPointsRef = useRef<Point[]>([])
    const [cursorPos, setCursorPos] = useState<Point | null>(null)

    // Shift / Ctrl modifiers
    const isShiftDownRef = useRef(false)
    const isCtrlDownRef = useRef(false)

    // Crop state
    const [cropRect, setCropRect] = useState<Rect | null>(null)

    // Save dialog state
    const [saveDialogOpen, setSaveDialogOpen] = useState(false)

    // Text tool input state
    const [textInput, setTextInput] = useState<{
        x: number
        y: number
        value: string
        visible: boolean
    }>({
        x: 0,
        y: 0,
        value: "",
        visible: false,
    })

    // Update history flags
    const updateHistoryFlags = useCallback(() => {
        setCanUndo(historyIndexRef.current > 0)
        setCanRedo(historyIndexRef.current < historyRef.current.length - 1)
    }, [])

    // Push canvas state to history
    const pushHistory = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const nextIndex = historyIndexRef.current + 1

        historyRef.current = historyRef.current.slice(0, nextIndex)
        historyRef.current.push({
            imageData,
            width: canvas.width,
            height: canvas.height,
        })
        historyIndexRef.current = nextIndex

        updateHistoryFlags()
    }, [updateHistoryFlags])

    // Zoom Fit
    const zoomFit = useCallback(() => {
        const container = containerRef.current
        if (!container) return
        const padding = 48
        const availableWidth = container.clientWidth - padding
        const availableHeight = container.clientHeight - padding

        const scaleX = availableWidth / width
        const scaleY = availableHeight / height
        const fitScale = Math.min(scaleX, scaleY, 1)

        setZoom(Math.max(0.1, Number(fitScale.toFixed(2))))
        setPanOffset({ x: 0, y: 0 })
    }, [width, height])

    // Zoom 100%
    const zoom100 = useCallback(() => {
        setZoom(1)
        setPanOffset({ x: 0, y: 0 })
    }, [])

    // Apply pending canvas initialization
    const applyInitNow = useCallback(() => {
        const initData = pendingInitRef.current
        if (!initData) return

        const canvas = canvasRef.current
        const preview = previewCanvasRef.current
        if (!canvas || !preview) return

        const { img, dims } = initData
        const w = img ? img.naturalWidth : dims?.width || width
        const h = img ? img.naturalHeight : dims?.height || height

        canvas.width = w
        canvas.height = h
        preview.width = w
        preview.height = h

        const ctx = canvas.getContext("2d")
        if (ctx) {
            if (img) {
                ctx.drawImage(img, 0, 0)
            } else {
                const bg = dims?.backgroundColor || "#ffffff"
                if (bg !== "transparent") {
                    ctx.fillStyle = bg
                    ctx.fillRect(0, 0, w, h)
                } else {
                    ctx.clearRect(0, 0, w, h)
                }
            }
        }

        const previewCtx = preview.getContext("2d")
        previewCtx?.clearRect(0, 0, w, h)

        // Clear and set first history item
        historyRef.current = []
        historyIndexRef.current = -1
        pushHistory()

        pendingInitRef.current = null
        setTimeout(() => {
            zoomFit()
        }, 50)
    }, [width, height, pushHistory, zoomFit])

    // Synchronize canvas buffer with React DOM updates and prevent clearing on resize
    useLayoutEffect(() => {
        if (!isEditorOpen || !canvasRef.current || !previewCanvasRef.current) {
            return
        }

        const canvas = canvasRef.current
        const preview = previewCanvasRef.current
        canvas.width = width
        canvas.height = height
        preview.width = width
        preview.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        if (pendingInitRef.current) {
            applyInitNow()
            return
        }

        if (pendingCropDataRef.current) {
            ctx.putImageData(pendingCropDataRef.current, 0, 0)
            const nextIndex = historyIndexRef.current + 1
            historyRef.current = historyRef.current.slice(0, nextIndex)
            historyRef.current.push({
                imageData: pendingCropDataRef.current,
                width,
                height,
            })
            historyIndexRef.current = nextIndex
            updateHistoryFlags()
            pendingCropDataRef.current = null
            setTimeout(() => {
                zoomFit()
            }, 50)
            return
        }

        if (pendingRestoreRef.current) {
            ctx.putImageData(pendingRestoreRef.current, 0, 0)
            pendingRestoreRef.current = null
            setTimeout(() => {
                zoomFit()
            }, 50)
            return
        }

        // Restore active history state if canvas was cleared by dimension update
        const current = historyRef.current[historyIndexRef.current]
        if (current && current.width === width && current.height === height) {
            ctx.putImageData(current.imageData, 0, 0)
        }
    }, [isEditorOpen, width, height, applyInitNow, updateHistoryFlags, zoomFit])

    // Initialize Canvas
    const initCanvas = useCallback(
        (
            img?: HTMLImageElement | null,
            dims?: { width: number; height: number; backgroundColor?: string },
        ) => {
            const targetW = img ? img.naturalWidth : dims?.width || 1280
            const targetH = img ? img.naturalHeight : dims?.height || 720

            pendingInitRef.current = { img, dims }

            // If editor is already open and dimensions match, execute directly
            setActiveTool("crop")
            if (
                isEditorOpen &&
                canvasRef.current &&
                width === targetW &&
                height === targetH
            ) {
                applyInitNow()
            } else {
                setWidth(targetW)
                setHeight(targetH)
            }
        },
        [isEditorOpen, width, height, applyInitNow],
    )

    // Undo action
    const undo = useCallback(() => {
        if (historyIndexRef.current <= 0) return
        historyIndexRef.current -= 1
        const item = historyRef.current[historyIndexRef.current]
        const canvas = canvasRef.current
        if (!canvas || !item) return

        if (item.width !== width || item.height !== height) {
            pendingRestoreRef.current = item.imageData
            setWidth(item.width)
            setHeight(item.height)
        } else {
            const ctx = canvas.getContext("2d")
            ctx?.putImageData(item.imageData, 0, 0)
        }
        updateHistoryFlags()
    }, [width, height, updateHistoryFlags])

    // Redo action
    const redo = useCallback(() => {
        if (historyIndexRef.current >= historyRef.current.length - 1) return
        historyIndexRef.current += 1
        const item = historyRef.current[historyIndexRef.current]
        const canvas = canvasRef.current
        if (!canvas || !item) return

        if (item.width !== width || item.height !== height) {
            pendingRestoreRef.current = item.imageData
            setWidth(item.width)
            setHeight(item.height)
        } else {
            const ctx = canvas.getContext("2d")
            ctx?.putImageData(item.imageData, 0, 0)
        }
        updateHistoryFlags()
    }, [width, height, updateHistoryFlags])

    // Fit canvas on initial load
    useEffect(() => {
        const timer = setTimeout(() => {
            zoomFit()
        }, 80)
        return () => clearTimeout(timer)
    }, [width, height, zoomFit])

    // Copy to clipboard
    const handleCopyToClipboard = useCallback(async () => {
        if (!canvasRef.current) return
        const success = await copyCanvasToClipboard(canvasRef.current)
        if (success) {
            toast.success("Image copied to clipboard!")
        } else {
            toast.error("Failed to copy image to clipboard.")
        }
    }, [])

    // Apply Crop
    const applyCrop = useCallback(() => {
        if (!cropRect || !canvasRef.current || !previewCanvasRef.current) return

        const rx = cropRect.width < 0 ? cropRect.x + cropRect.width : cropRect.x
        const ry =
            cropRect.height < 0 ? cropRect.y + cropRect.height : cropRect.y
        const rw = Math.max(1, Math.round(Math.abs(cropRect.width)))
        const rh = Math.max(1, Math.round(Math.abs(cropRect.height)))

        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const croppedData = ctx.getImageData(rx, ry, rw, rh)

        setCropRect(null)
        setActiveTool("crop")

        const preview = previewCanvasRef.current
        if (preview) {
            const pctx = preview.getContext("2d")
            pctx?.clearRect(0, 0, preview.width, preview.height)
        }

        if (rw === width && rh === height) {
            ctx.putImageData(croppedData, 0, 0)
            const nextIndex = historyIndexRef.current + 1
            historyRef.current = historyRef.current.slice(0, nextIndex)
            historyRef.current.push({
                imageData: croppedData,
                width: rw,
                height: rh,
            })
            historyIndexRef.current = nextIndex
            updateHistoryFlags()
            toast.success(`Cropped to ${rw} × ${rh} px`)
        } else {
            pendingCropDataRef.current = croppedData
            setWidth(rw)
            setHeight(rh)
            toast.success(`Cropped to ${rw} × ${rh} px`)
        }
    }, [cropRect, width, height, updateHistoryFlags])

    // Cancel Crop
    const cancelCrop = useCallback(() => {
        setCropRect(null)
        const preview = previewCanvasRef.current
        if (preview) {
            const pctx = preview.getContext("2d")
            pctx?.clearRect(0, 0, preview.width, preview.height)
        }
    }, [])

    // Commit Text Annotation
    const commitText = useCallback(() => {
        if (
            !textInput.visible ||
            !textInput.value.trim() ||
            !canvasRef.current
        ) {
            setTextInput({ x: 0, y: 0, value: "", visible: false })
            return
        }

        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        ctx.save()
        ctx.font = `bold ${settings.fontSize}px Inter, sans-serif`
        const metrics = ctx.measureText(textInput.value)
        const textW = metrics.width
        const textH = settings.fontSize

        // Background pill
        ctx.fillStyle = "rgba(0, 0, 0, 0.75)"
        const padX = 8
        const padY = 5
        if (typeof ctx.roundRect === "function") {
            ctx.beginPath()
            ctx.roundRect(
                textInput.x - padX,
                textInput.y - textH - padY / 2,
                textW + padX * 2,
                textH + padY * 2,
                6,
            )
            ctx.fill()
        }

        ctx.fillStyle = settings.strokeColor
        ctx.fillText(textInput.value, textInput.x, textInput.y)
        ctx.restore()

        setTextInput({ x: 0, y: 0, value: "", visible: false })
        pushHistory()
    }, [textInput, settings, pushHistory])

    // Sample color with eyedropper
    const sampleColorAtPoint = useCallback((x: number, y: number) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data
        const hex = `#${(
            (1 << 24) +
            (pixel[0] << 16) +
            (pixel[1] << 8) +
            pixel[2]
        )
            .toString(16)
            .slice(1)}`

        setSettings((prev) => ({ ...prev, strokeColor: hex }))
        setActiveTool("brush")
        toast.success(`Color sampled: ${hex.toUpperCase()}`)
    }, [])

    // Convert mouse event coordinates to canvas space
    const getCanvasCoordinates = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement>): Point => {
            const canvas = canvasRef.current
            if (!canvas) return { x: 0, y: 0 }
            const rect = canvas.getBoundingClientRect()
            const x = (e.clientX - rect.left) / zoom
            const y = (e.clientY - rect.top) / zoom
            return {
                x: Math.max(0, Math.min(width, x)),
                y: Math.max(0, Math.min(height, y)),
            }
        },
        [zoom, width, height],
    )

    // Clear preview canvas
    const clearPreview = useCallback(() => {
        const preview = previewCanvasRef.current
        if (!preview) return
        const pctx = preview.getContext("2d")
        pctx?.clearRect(0, 0, preview.width, preview.height)
    }, [])

    // Render preview drawing while mouse is down
    const renderPreview = useCallback(
        (start: Point, current: Point) => {
            const preview = previewCanvasRef.current
            const canvas = canvasRef.current
            if (!preview || !canvas) return
            const pctx = preview.getContext("2d")
            if (!pctx) return

            pctx.clearRect(0, 0, preview.width, preview.height)

            switch (activeTool) {
                case "line":
                    drawLine(
                        pctx,
                        start,
                        current,
                        settings,
                        isShiftDownRef.current,
                    )
                    break
                case "brush":
                    drawBrush(pctx, brushPointsRef.current, settings)
                    break
                case "rectangle":
                    drawRectangle(
                        pctx,
                        {
                            x: start.x,
                            y: start.y,
                            width: current.x - start.x,
                            height: current.y - start.y,
                        },
                        settings,
                        isShiftDownRef.current,
                    )
                    break
                case "ellipse":
                    drawEllipse(
                        pctx,
                        start,
                        current,
                        settings,
                        isShiftDownRef.current,
                        isCtrlDownRef.current,
                    )
                    break
                case "arrow":
                    drawArrow(pctx, start, current, settings)
                    break
                case "crop":
                    setCropRect({
                        x: start.x,
                        y: start.y,
                        width: current.x - start.x,
                        height: current.y - start.y,
                    })
                    break
                case "focus":
                    drawFocusSpotlight(
                        pctx,
                        canvas,
                        {
                            x: start.x,
                            y: start.y,
                            width: current.x - start.x,
                            height: current.y - start.y,
                        },
                        settings,
                    )
                    break
                case "blur":
                    drawBlurRegion(
                        pctx,
                        canvas,
                        {
                            x: start.x,
                            y: start.y,
                            width: current.x - start.x,
                            height: current.y - start.y,
                        },
                        settings,
                    )
                    break
            }
        },
        [activeTool, settings],
    )

    // Commit drawing to main canvas
    const commitDrawing = useCallback(
        (start: Point, end: Point) => {
            const canvas = canvasRef.current
            if (!canvas) return
            const ctx = canvas.getContext("2d")
            if (!ctx) return

            switch (activeTool) {
                case "line":
                    drawLine(ctx, start, end, settings, isShiftDownRef.current)
                    pushHistory()
                    break
                case "brush":
                    drawBrush(ctx, brushPointsRef.current, settings)
                    pushHistory()
                    break
                case "rectangle":
                    drawRectangle(
                        ctx,
                        {
                            x: start.x,
                            y: start.y,
                            width: end.x - start.x,
                            height: end.y - start.y,
                        },
                        settings,
                        isShiftDownRef.current,
                    )
                    pushHistory()
                    break
                case "ellipse":
                    drawEllipse(
                        ctx,
                        start,
                        end,
                        settings,
                        isShiftDownRef.current,
                        isCtrlDownRef.current,
                    )
                    pushHistory()
                    break
                case "arrow":
                    drawArrow(ctx, start, end, settings)
                    pushHistory()
                    break
                case "focus":
                    drawFocusSpotlight(
                        ctx,
                        canvas,
                        {
                            x: start.x,
                            y: start.y,
                            width: end.x - start.x,
                            height: end.y - start.y,
                        },
                        settings,
                    )
                    pushHistory()
                    break
                case "blur":
                    drawBlurRegion(
                        ctx,
                        canvas,
                        {
                            x: start.x,
                            y: start.y,
                            width: end.x - start.x,
                            height: end.y - start.y,
                        },
                        settings,
                    )
                    pushHistory()
                    break
            }
            clearPreview()
        },
        [activeTool, settings, pushHistory, clearPreview],
    )

    // Mouse handlers on canvas
    const handleMouseDown = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement>) => {
            if (e.button === 1 || activeTool === "select") {
                // Middle click or select tool starts panning
                setIsPanning(true)
                lastPanPointRef.current = { x: e.clientX, y: e.clientY }
                return
            }

            if (e.button !== 0) return

            const pt = getCanvasCoordinates(e)

            if (activeTool === "eyedropper") {
                sampleColorAtPoint(pt.x, pt.y)
                return
            }

            if (activeTool === "text") {
                commitText()
                setTextInput({
                    x: pt.x,
                    y: pt.y,
                    value: "",
                    visible: true,
                })
                return
            }

            setIsDrawing(true)
            startPointRef.current = pt
            brushPointsRef.current = [pt]

            if (activeTool === "brush") {
                const preview = previewCanvasRef.current
                if (preview) {
                    const pctx = preview.getContext("2d")
                    if (pctx) {
                        drawBrush(pctx, [pt], settings)
                    }
                }
            }
        },
        [
            activeTool,
            getCanvasCoordinates,
            sampleColorAtPoint,
            commitText,
            settings,
        ],
    )

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement>) => {
            const pt = getCanvasCoordinates(e)
            setCursorPos(pt)

            if (isPanning && lastPanPointRef.current) {
                const dx = e.clientX - lastPanPointRef.current.x
                const dy = e.clientY - lastPanPointRef.current.y
                setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }))
                lastPanPointRef.current = { x: e.clientX, y: e.clientY }
                return
            }

            if (!isDrawing || !startPointRef.current) return

            if (activeTool === "brush") {
                brushPointsRef.current.push(pt)
            }

            renderPreview(startPointRef.current, pt)
        },
        [getCanvasCoordinates, isPanning, isDrawing, activeTool, renderPreview],
    )

    const handleMouseUp = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement>) => {
            if (isPanning) {
                setIsPanning(false)
                lastPanPointRef.current = null
                return
            }

            if (!isDrawing || !startPointRef.current) return

            const endPt = getCanvasCoordinates(e)
            setIsDrawing(false)

            if (activeTool !== "crop") {
                commitDrawing(startPointRef.current, endPt)
            }
            startPointRef.current = null
            brushPointsRef.current = []
        },
        [isPanning, isDrawing, getCanvasCoordinates, activeTool, commitDrawing],
    )

    // Keyboard Shortcuts
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            // Ignore when typing inside input or textarea
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            ) {
                if (e.key === "Enter" && textInput.visible) {
                    e.preventDefault()
                    commitText()
                } else if (e.key === "Escape" && textInput.visible) {
                    setTextInput({ x: 0, y: 0, value: "", visible: false })
                }
                return
            }

            if (e.key === "Shift") isShiftDownRef.current = true
            if (e.key === "Control" || e.key === "Meta")
                isCtrlDownRef.current = true

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
                e.preventDefault()
                if (e.shiftKey) {
                    redo()
                } else {
                    undo()
                }
            } else if (
                (e.ctrlKey || e.metaKey) &&
                e.key.toLowerCase() === "y"
            ) {
                e.preventDefault()
                redo()
            } else if (
                (e.ctrlKey || e.metaKey) &&
                e.key.toLowerCase() === "c"
            ) {
                e.preventDefault()
                handleCopyToClipboard()
            } else if (
                (e.ctrlKey || e.metaKey) &&
                e.key.toLowerCase() === "s"
            ) {
                e.preventDefault()
                setSaveDialogOpen(true)
            } else if (e.key === "Escape") {
                if (cropRect) cancelCrop()
                if (textInput.visible)
                    setTextInput({ x: 0, y: 0, value: "", visible: false })
                clearPreview()
                setIsDrawing(false)
            } else if (e.key === "Enter" && cropRect) {
                e.preventDefault()
                applyCrop()
            } else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                switch (e.key.toLowerCase()) {
                    case "v":
                        setActiveTool("select")
                        break
                    case "c":
                        setActiveTool("crop")
                        break
                    case "l":
                        setActiveTool("line")
                        break
                    case "b":
                        setActiveTool("brush")
                        break
                    case "r":
                        setActiveTool("rectangle")
                        break
                    case "e":
                        setActiveTool("ellipse")
                        break
                    case "f":
                        setActiveTool("focus")
                        break
                    case "x":
                        setActiveTool("blur")
                        break
                    case "a":
                        setActiveTool("arrow")
                        break
                    case "t":
                        setActiveTool("text")
                        break
                    case "i":
                        setActiveTool("eyedropper")
                        break
                }
            }
        }

        function handleKeyUp(e: KeyboardEvent) {
            if (e.key === "Shift") isShiftDownRef.current = false
            if (e.key === "Control" || e.key === "Meta")
                isCtrlDownRef.current = false
        }

        window.addEventListener("keydown", handleKeyDown)
        window.addEventListener("keyup", handleKeyUp)
        return () => {
            window.removeEventListener("keydown", handleKeyDown)
            window.removeEventListener("keyup", handleKeyUp)
        }
    }, [
        undo,
        redo,
        handleCopyToClipboard,
        cropRect,
        cancelCrop,
        applyCrop,
        textInput,
        commitText,
        clearPreview,
    ])

    return {
        canvasRef,
        previewCanvasRef,
        containerRef,
        width,
        height,
        zoom,
        setZoom,
        panOffset,
        setPanOffset,
        activeTool,
        setActiveTool,
        settings,
        setSettings: (newSettings: Partial<ToolSettings>) =>
            setSettings((prev) => ({ ...prev, ...newSettings })),
        canUndo,
        canRedo,
        undo,
        redo,
        zoomFit,
        zoom100,
        handleCopyToClipboard,
        cursorPos,
        cropRect,
        applyCrop,
        cancelCrop,
        saveDialogOpen,
        setSaveDialogOpen,
        textInput,
        setTextInput,
        commitText,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        initCanvas,
    }
}
