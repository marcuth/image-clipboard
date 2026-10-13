import { Point, Rect, ToolSettings } from "@/types/canvas"

export function drawLine(
    ctx: CanvasRenderingContext2D,
    start: Point,
    end: Point,
    settings: ToolSettings,
    snapAngle: boolean = false,
): void {
    ctx.save()
    ctx.strokeStyle = settings.strokeColor
    ctx.lineWidth = settings.strokeWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    let targetX = end.x
    let targetY = end.y

    if (snapAngle) {
        const dx = end.x - start.x
        const dy = end.y - start.y
        const angle = Math.atan2(dy, dx)
        const snap = Math.PI / 4 // 45 deg
        const snappedAngle = Math.round(angle / snap) * snap
        const distance = Math.hypot(dx, dy)
        targetX = start.x + Math.cos(snappedAngle) * distance
        targetY = start.y + Math.sin(snappedAngle) * distance
    }

    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(targetX, targetY)
    ctx.stroke()
    ctx.restore()
}

export function drawBrush(
    ctx: CanvasRenderingContext2D,
    points: Point[],
    settings: ToolSettings,
): void {
    if (points.length === 0) return

    ctx.save()
    ctx.strokeStyle = settings.strokeColor
    ctx.lineWidth = settings.strokeWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    if (points.length === 1) {
        ctx.fillStyle = settings.strokeColor
        ctx.beginPath()
        ctx.arc(
            points[0].x,
            points[0].y,
            settings.strokeWidth / 2,
            0,
            Math.PI * 2,
        )
        ctx.fill()
        ctx.restore()
        return
    }

    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)

    if (settings.brushSmoothing && points.length > 2) {
        for (let i = 1; i < points.length - 1; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2
            const yc = (points[i].y + points[i + 1].y) / 2
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc)
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y)
    } else {
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y)
        }
    }

    ctx.stroke()
    ctx.restore()
}

export function drawRectangle(
    ctx: CanvasRenderingContext2D,
    rect: Rect,
    settings: ToolSettings,
    makeSquare: boolean = false,
): void {
    ctx.save()

    const { x, y } = rect
    let { width, height } = rect

    if (makeSquare) {
        const side = Math.max(Math.abs(width), Math.abs(height))
        width = width >= 0 ? side : -side
        height = height >= 0 ? side : -side
    }

    const rx = width < 0 ? x + width : x
    const ry = height < 0 ? y + height : y
    const rw = Math.abs(width)
    const rh = Math.abs(height)

    const radius = settings.rectRounded ? Math.min(16, rw / 4, rh / 4) : 0

    ctx.beginPath()
    if (radius > 0 && typeof ctx.roundRect === "function") {
        ctx.roundRect(rx, ry, rw, rh, radius)
    } else {
        ctx.rect(rx, ry, rw, rh)
    }

    if (settings.fillColor && settings.fillColor !== "transparent") {
        ctx.fillStyle = settings.fillColor
        ctx.fill()
    }

    if (settings.strokeWidth > 0 && settings.strokeColor) {
        ctx.strokeStyle = settings.strokeColor
        ctx.lineWidth = settings.strokeWidth
        ctx.lineJoin = "round"
        ctx.stroke()
    }

    ctx.restore()
}

export function drawEllipse(
    ctx: CanvasRenderingContext2D,
    start: Point,
    end: Point,
    settings: ToolSettings,
    makeCircle: boolean = false,
    fromCenter: boolean = false,
): void {
    ctx.save()

    let cx: number
    let cy: number
    let rx: number
    let ry: number

    if (fromCenter) {
        cx = start.x
        cy = start.y
        rx = Math.abs(end.x - start.x)
        ry = Math.abs(end.y - start.y)
    } else {
        cx = (start.x + end.x) / 2
        cy = (start.y + end.y) / 2
        rx = Math.abs(end.x - start.x) / 2
        ry = Math.abs(end.y - start.y) / 2
    }

    if (makeCircle) {
        const radius = Math.max(rx, ry)
        rx = radius
        ry = radius
    }

    if (rx > 0 && ry > 0) {
        ctx.beginPath()
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)

        if (settings.fillColor && settings.fillColor !== "transparent") {
            ctx.fillStyle = settings.fillColor
            ctx.fill()
        }

        if (settings.strokeWidth > 0 && settings.strokeColor) {
            ctx.strokeStyle = settings.strokeColor
            ctx.lineWidth = settings.strokeWidth
            ctx.stroke()
        }
    }

    ctx.restore()
}

export function drawArrow(
    ctx: CanvasRenderingContext2D,
    start: Point,
    end: Point,
    settings: ToolSettings,
): void {
    const headLength = Math.max(14, settings.strokeWidth * 3)
    const angle = Math.atan2(end.y - start.y, end.x - start.x)

    ctx.save()
    ctx.strokeStyle = settings.strokeColor
    ctx.fillStyle = settings.strokeColor
    ctx.lineWidth = settings.strokeWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    // Line shaft
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    ctx.stroke()

    // Arrowhead
    ctx.beginPath()
    ctx.moveTo(end.x, end.y)
    ctx.lineTo(
        end.x - headLength * Math.cos(angle - Math.PI / 6),
        end.y - headLength * Math.sin(angle - Math.PI / 6),
    )
    ctx.lineTo(
        end.x - headLength * Math.cos(angle + Math.PI / 6),
        end.y - headLength * Math.sin(angle + Math.PI / 6),
    )
    ctx.closePath()
    ctx.fill()
    ctx.restore()
}

export function drawBlurRegion(
    ctx: CanvasRenderingContext2D,
    sourceCanvas: HTMLCanvasElement,
    rect: Rect,
    settings: ToolSettings,
): void {
    const rx = rect.width < 0 ? rect.x + rect.width : rect.x
    const ry = rect.height < 0 ? rect.y + rect.height : rect.y
    const rw = Math.abs(rect.width)
    const rh = Math.abs(rect.height)

    if (rw <= 2 || rh <= 2) return

    ctx.save()

    // Clip to rounded rect if configured
    const radius = settings.blurRounded ? Math.min(12, rw / 4, rh / 4) : 0
    ctx.beginPath()
    if (radius > 0 && typeof ctx.roundRect === "function") {
        ctx.roundRect(rx, ry, rw, rh, radius)
    } else {
        ctx.rect(rx, ry, rw, rh)
    }
    ctx.clip()

    // Downscale and upscale for crisp pixelation/censor effect, or apply blur
    const offscreen = document.createElement("canvas")
    const offCtx = offscreen.getContext("2d")
    if (offCtx) {
        const factor = Math.max(0.04, 1 / (settings.blurIntensity || 16))
        const dw = Math.max(1, Math.floor(rw * factor))
        const dh = Math.max(1, Math.floor(rh * factor))

        offscreen.width = dw
        offscreen.height = dh

        offCtx.imageSmoothingEnabled = true
        offCtx.drawImage(sourceCanvas, rx, ry, rw, rh, 0, 0, dw, dh)

        ctx.imageSmoothingEnabled = false
        ctx.drawImage(offscreen, 0, 0, dw, dh, rx, ry, rw, rh)
    }

    ctx.restore()
}

export function drawFocusSpotlight(
    ctx: CanvasRenderingContext2D,
    sourceCanvas: HTMLCanvasElement,
    rect: Rect,
    settings: ToolSettings,
): void {
    const rx = rect.width < 0 ? rect.x + rect.width : rect.x
    const ry = rect.height < 0 ? rect.y + rect.height : rect.y
    const rw = Math.abs(rect.width)
    const rh = Math.abs(rect.height)

    if (rw <= 2 || rh <= 2) return

    const cw = ctx.canvas.width
    const ch = ctx.canvas.height
    const radius = settings.focusRounded ? Math.min(16, rw / 4, rh / 4) : 0

    // 1. Snapshot the unmodified original image first
    const originalSnapshot = document.createElement("canvas")
    originalSnapshot.width = cw
    originalSnapshot.height = ch
    const origCtx = originalSnapshot.getContext("2d")
    if (!origCtx) return
    origCtx.drawImage(sourceCanvas, 0, 0)

    // 2. Render the blurred and dimmed overlay on an offscreen canvas
    const overlayCanvas = document.createElement("canvas")
    overlayCanvas.width = cw
    overlayCanvas.height = ch
    const overlayCtx = overlayCanvas.getContext("2d")
    if (!overlayCtx) return

    if (settings.focusBlurUnfocused) {
        overlayCtx.save()
        overlayCtx.filter = "blur(10px)"
        overlayCtx.drawImage(originalSnapshot, 0, 0)
        overlayCtx.restore()
    } else {
        overlayCtx.drawImage(originalSnapshot, 0, 0)
    }

    // Apply dark dimming over the entire overlay canvas
    overlayCtx.fillStyle = "rgba(0, 0, 0, 0.55)"
    overlayCtx.fillRect(0, 0, cw, ch)

    // Cut out the spotlight aperture so it is completely transparent
    overlayCtx.save()
    overlayCtx.globalCompositeOperation = "destination-out"
    overlayCtx.beginPath()
    if (radius > 0 && typeof overlayCtx.roundRect === "function") {
        overlayCtx.roundRect(rx, ry, rw, rh, radius)
    } else {
        overlayCtx.rect(rx, ry, rw, rh)
    }
    overlayCtx.fill()
    overlayCtx.restore()

    // 3. Composite onto target context (ctx)
    ctx.save()

    // Base: original 100% sharp image
    ctx.drawImage(originalSnapshot, 0, 0)

    // Top: overlay with transparent aperture over the focused rectangle
    ctx.drawImage(overlayCanvas, 0, 0)

    // Draw clean border around the spotlight
    ctx.beginPath()
    if (radius > 0 && typeof ctx.roundRect === "function") {
        ctx.roundRect(rx, ry, rw, rh, radius)
    } else {
        ctx.rect(rx, ry, rw, rh)
    }
    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)"
    ctx.lineWidth = 2
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)"
    ctx.shadowBlur = 6
    ctx.stroke()

    ctx.restore()
}
