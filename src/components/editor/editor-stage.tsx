import { Point, Rect, ToolSettings, ToolType } from "@/types/canvas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LuCheck, LuX } from "react-icons/lu"

import { CropOverlay } from "./crop-overlay"

interface EditorStageProps {
    containerRef: React.RefObject<HTMLDivElement | null>
    canvasRef: React.RefObject<HTMLCanvasElement | null>
    previewCanvasRef: React.RefObject<HTMLCanvasElement | null>
    width: number
    height: number
    zoom: number
    panOffset: Point
    activeTool: ToolType
    cropRect: Rect | null
    onApplyCrop: () => void
    onCancelCrop: () => void
    textInput: {
        x: number
        y: number
        value: string
        visible: boolean
    }
    onTextInputChange: (val: string) => void
    onCommitText: () => void
    onCancelText: () => void
    settings: ToolSettings
    onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void
    onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void
    onMouseUp: (e: React.MouseEvent<HTMLCanvasElement>) => void
    onWheel: (e: React.WheelEvent<HTMLDivElement>) => void
}

export function EditorStage({
    containerRef,
    canvasRef,
    previewCanvasRef,
    width,
    height,
    zoom,
    panOffset,
    activeTool,
    cropRect,
    onApplyCrop,
    onCancelCrop,
    textInput,
    onTextInputChange,
    onCommitText,
    onCancelText,
    settings,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onWheel,
}: EditorStageProps) {
    function getCursorClass(): string {
        switch (activeTool) {
            case "select":
                return "cursor-grab active:cursor-grabbing"
            case "text":
                return "cursor-text"
            case "eyedropper":
                return "cursor-crosshair"
            case "crop":
            case "line":
            case "brush":
            case "rectangle":
            case "ellipse":
            case "focus":
            case "blur":
            case "arrow":
                return "cursor-crosshair"
            default:
                return "cursor-default"
        }
    }

    return (
        <div
            ref={containerRef}
            onWheel={onWheel}
            className="relative flex-1 w-full h-full overflow-hidden bg-neutral-900/95 flex items-center justify-center select-none"
            style={{
                backgroundImage:
                    "radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 0)",
                backgroundSize: "24px 24px",
            }}
        >
            {/* Centered Canvas Container with Zoom & Pan */}
            <div
                className="relative transition-transform duration-75 origin-center shadow-2xl rounded-sm"
                style={{
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                    width: `${width}px`,
                    height: `${height}px`,
                }}
            >
                {/* Checkerboard backdrop for transparent canvas */}
                <div
                    className="absolute inset-0 pointer-events-none rounded-sm shadow-xl"
                    style={{
                        backgroundImage:
                            "repeating-conic-gradient(#1f2937 0% 25%, #111827 0% 50%) 50% / 16px 16px",
                    }}
                />

                {/* Persistent Canvas */}
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    className="absolute inset-0 block rounded-sm pointer-events-none"
                />

                {/* Interactive Drawing & Preview Canvas */}
                <canvas
                    ref={previewCanvasRef}
                    width={width}
                    height={height}
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}
                    onContextMenu={(e) => e.preventDefault()}
                    className={`absolute inset-0 block rounded-sm ${getCursorClass()}`}
                />

                {/* Crop Overlay */}
                {activeTool === "crop" && (
                    <CropOverlay
                        cropRect={cropRect}
                        canvasWidth={width}
                        canvasHeight={height}
                        scale={1}
                        onApply={onApplyCrop}
                        onCancel={onCancelCrop}
                    />
                )}

                {/* Inline Text Tool Input */}
                {textInput.visible && (
                    <div
                        className="absolute z-30 flex items-center gap-1 bg-background/95 border border-border p-1 rounded-md shadow-2xl backdrop-blur-md"
                        style={{
                            left: `${textInput.x}px`,
                            top: `${textInput.y}px`,
                            transform: "translate(-8px, -100%)",
                        }}
                    >
                        <Input
                            autoFocus
                            value={textInput.value}
                            onChange={(e) => onTextInputChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault()
                                    onCommitText()
                                } else if (e.key === "Escape") {
                                    e.preventDefault()
                                    onCancelText()
                                }
                            }}
                            placeholder="Type text..."
                            className="h-7 text-xs w-48 font-medium"
                            style={{ color: settings.strokeColor }}
                        />
                        <Button
                            size="icon"
                            variant="default"
                            className="h-7 w-7"
                            onClick={onCommitText}
                        >
                            <LuCheck className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground"
                            onClick={onCancelText}
                        >
                            <LuX className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
