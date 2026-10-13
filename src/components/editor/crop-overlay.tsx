import { Button } from "@/components/ui/button"
import { LuCheck, LuX } from "react-icons/lu"
import { Rect } from "@/types/canvas"

interface CropOverlayProps {
    cropRect: Rect | null
    canvasWidth: number
    canvasHeight: number
    scale: number
    onApply: () => void
    onCancel: () => void
}

export function CropOverlay({
    cropRect,
    canvasWidth,
    canvasHeight,
    scale,
    onApply,
    onCancel,
}: CropOverlayProps) {
    if (!cropRect || cropRect.width === 0 || cropRect.height === 0) {
        return null
    }

    const rx = cropRect.width < 0 ? cropRect.x + cropRect.width : cropRect.x
    const ry = cropRect.height < 0 ? cropRect.y + cropRect.height : cropRect.y
    const rw = Math.abs(cropRect.width)
    const rh = Math.abs(cropRect.height)

    const screenX = rx * scale
    const screenY = ry * scale
    const screenW = rw * scale
    const screenH = rh * scale

    return (
        <div
            className="absolute inset-0 pointer-events-none"
            style={{
                width: `${canvasWidth * scale}px`,
                height: `${canvasHeight * scale}px`,
            }}
        >
            {/* Dark mask outside crop box */}
            <svg
                className="absolute inset-0 w-full h-full"
                style={{ width: "100%", height: "100%" }}
            >
                <defs>
                    <mask id="crop-mask">
                        <rect width="100%" height="100%" fill="white" />
                        <rect
                            x={screenX}
                            y={screenY}
                            width={screenW}
                            height={screenH}
                            fill="black"
                        />
                    </mask>
                </defs>
                <rect
                    width="100%"
                    height="100%"
                    fill="rgba(0, 0, 0, 0.65)"
                    mask="url(#crop-mask)"
                />
            </svg>

            {/* Crop Boundary */}
            <div
                className="absolute border-2 border-primary border-dashed pointer-events-none shadow-sm"
                style={{
                    left: `${screenX}px`,
                    top: `${screenY}px`,
                    width: `${screenW}px`,
                    height: `${screenH}px`,
                }}
            >
                {/* Crop Handles at corners */}
                <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-primary rounded-sm" />
                <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-primary rounded-sm" />
                <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-primary rounded-sm" />
                <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-primary rounded-sm" />

                {/* Dimensions readout */}
                <div className="absolute -top-7 left-0 bg-primary text-primary-foreground text-[11px] font-mono font-semibold px-2 py-0.5 rounded shadow">
                    {Math.round(rw)} × {Math.round(rh)} px
                </div>

                {/* Action buttons */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-background/95 backdrop-blur-md border border-border p-1 rounded-md shadow-lg pointer-events-auto">
                    <Button
                        size="sm"
                        variant="default"
                        className="h-7 px-2.5 text-xs gap-1"
                        onClick={onApply}
                    >
                        <LuCheck className="h-3.5 w-3.5" />
                        <span>Apply</span>
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={onCancel}
                    >
                        <LuX className="h-3.5 w-3.5" />
                        <span>Cancel</span>
                    </Button>
                </div>
            </div>
        </div>
    )
}
