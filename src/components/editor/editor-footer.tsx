import {
    LuMaximize2,
    LuRedo2,
    LuScan,
    LuUndo2,
    LuZoomIn,
    LuZoomOut,
} from "react-icons/lu"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { Point, ToolType } from "@/types/canvas"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface EditorFooterProps {
    canUndo: boolean
    canRedo: boolean
    onUndo: () => void
    onRedo: () => void
    width: number
    height: number
    zoom: number
    onZoomChange: (zoom: number) => void
    onZoomFit: () => void
    onZoom100: () => void
    cursorPos: Point | null
    activeTool: ToolType
}

export function EditorFooter({
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    width,
    height,
    zoom,
    onZoomChange,
    onZoomFit,
    onZoom100,
    cursorPos,
    activeTool,
}: EditorFooterProps) {
    function getToolHint(): string {
        switch (activeTool) {
            case "crop":
                return "Click & drag to select crop area. Enter to apply, Esc to cancel."
            case "line":
                return "Click & drag. Hold Shift to snap angle to 45° increments."
            case "brush":
                return "Click & drag to draw freehand strokes."
            case "rectangle":
                return "Click & drag. Hold Shift for 1:1 square."
            case "ellipse":
                return "Click & drag. Hold Shift for 1:1 circle. Hold Ctrl from center."
            case "focus":
                return "Click & drag to highlight area and blur/dim background."
            case "blur":
                return "Click & drag over sensitive text or details to censor."
            case "arrow":
                return "Click & drag to point arrow towards target."
            case "text":
                return "Click anywhere to type text annotation."
            case "eyedropper":
                return "Click anywhere on canvas to sample color."
            case "select":
                return "Drag with left mouse to pan, or use mouse wheel to scroll."
            default:
                return ""
        }
    }

    return (
        <TooltipProvider delayDuration={200}>
            <footer className="h-10 border-t border-border bg-card/80 backdrop-blur-md px-3 flex items-center justify-between text-xs shrink-0 select-none z-20">
                {/* Left: Undo, Redo, Hint */}
                <div className="flex items-center gap-1.5">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={onUndo}
                                disabled={!canUndo}
                            >
                                <LuUndo2 className="h-3.5 w-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={onRedo}
                                disabled={!canRedo}
                            >
                                <LuRedo2 className="h-3.5 w-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            Redo (Ctrl+Y / Ctrl+Shift+Z)
                        </TooltipContent>
                    </Tooltip>

                    <Separator orientation="vertical" className="h-4 mx-1" />

                    <span className="text-[11px] text-muted-foreground truncate max-w-[280px] sm:max-w-md hidden md:inline">
                        {getToolHint()}
                    </span>
                </div>

                {/* Right: Coordinates, Canvas Size, Zoom Controls */}
                <div className="flex items-center gap-3">
                    {/* Cursor coordinates */}
                    {cursorPos && (
                        <div className="font-mono text-[11px] text-muted-foreground hidden lg:flex items-center gap-2">
                            <span>
                                X: {Math.round(cursorPos.x)} Y:{" "}
                                {Math.round(cursorPos.y)}
                            </span>
                        </div>
                    )}

                    {/* Canvas Size Badge */}
                    <div className="font-mono text-[11px] font-medium bg-muted/60 px-2 py-0.5 rounded border border-border/50 text-foreground flex items-center gap-1">
                        <LuScan className="h-3 w-3 text-muted-foreground" />
                        <span>
                            {width} × {height} px
                        </span>
                    </div>

                    <Separator orientation="vertical" className="h-4" />

                    {/* Zoom Buttons & Slider */}
                    <div className="flex items-center gap-1.5">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-1.5 text-[11px] font-mono"
                                    onClick={onZoomFit}
                                >
                                    <LuMaximize2 className="h-3 w-3 mr-1" />
                                    <span>Fit</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Fit to Window</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-1.5 text-[11px] font-mono"
                                    onClick={onZoom100}
                                >
                                    <span>100%</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Actual Size (100%)</TooltipContent>
                        </Tooltip>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                                onZoomChange(Math.max(0.1, zoom - 0.1))
                            }
                            disabled={zoom <= 0.1}
                        >
                            <LuZoomOut className="h-3 w-3" />
                        </Button>

                        <div className="w-20 hidden sm:block">
                            <Slider
                                value={[zoom * 100]}
                                min={10}
                                max={400}
                                step={5}
                                onValueChange={(val) =>
                                    onZoomChange(val[0] / 100)
                                }
                            />
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                                onZoomChange(Math.min(5, zoom + 0.1))
                            }
                            disabled={zoom >= 5}
                        >
                            <LuZoomIn className="h-3 w-3" />
                        </Button>

                        <span className="font-mono text-[11px] font-bold w-11 text-right text-muted-foreground">
                            {Math.round(zoom * 100)}%
                        </span>
                    </div>
                </div>
            </footer>
        </TooltipProvider>
    )
}
