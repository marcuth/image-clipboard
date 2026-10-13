import {
    LuArrowUpRight,
    LuCircle,
    LuCopy,
    LuCrop,
    LuFocus,
    LuHouse,
    LuMoon,
    LuMousePointer,
    LuPaintbrush,
    LuPipette,
    LuShieldAlert,
    LuSlash,
    LuSquare,
    LuSun,
    LuType,
} from "react-icons/lu"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { ToolType, ToolSettings } from "@/types/canvas"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

import { WeightPopover } from "./weight-popover"
import { ColorPopover } from "./color-popover"
import { SaveDialog } from "./save-dialog"

interface EditorHeaderProps {
    activeTool: ToolType
    onSelectTool: (tool: ToolType) => void
    settings: ToolSettings
    onUpdateSettings: (newSettings: Partial<ToolSettings>) => void
    onHome: () => void
    onCopyToClipboard: () => void
    canvasRef: React.RefObject<HTMLCanvasElement | null>
    saveDialogOpen: boolean
    setSaveDialogOpen: (open: boolean) => void
    isDark: boolean
    onToggleDark: () => void
}

interface ToolDefinition {
    id: ToolType
    label: string
    shortcut: string
    icon: React.ComponentType<{ className?: string }>
}

const TOOLS: ToolDefinition[] = [
    {
        id: "select",
        label: "Select & Pan",
        shortcut: "V",
        icon: LuMousePointer,
    },
    { id: "crop", label: "Crop Area", shortcut: "C", icon: LuCrop },
    { id: "line", label: "Line", shortcut: "L", icon: LuSlash },
    { id: "brush", label: "Smooth Brush", shortcut: "B", icon: LuPaintbrush },
    { id: "rectangle", label: "Rectangle", shortcut: "R", icon: LuSquare },
    { id: "ellipse", label: "Ellipse", shortcut: "E", icon: LuCircle },
    { id: "focus", label: "Focus Spotlight", shortcut: "F", icon: LuFocus },
    { id: "blur", label: "Blur & Censor", shortcut: "X", icon: LuShieldAlert },
    { id: "arrow", label: "Arrow", shortcut: "A", icon: LuArrowUpRight },
    { id: "text", label: "Text", shortcut: "T", icon: LuType },
    { id: "eyedropper", label: "Eyedropper", shortcut: "I", icon: LuPipette },
]

export function EditorHeader({
    activeTool,
    onSelectTool,
    settings,
    onUpdateSettings,
    onHome,
    onCopyToClipboard,
    canvasRef,
    saveDialogOpen,
    setSaveDialogOpen,
    isDark,
    onToggleDark,
}: EditorHeaderProps) {
    const showStroke = [
        "line",
        "brush",
        "rectangle",
        "ellipse",
        "arrow",
        "text",
    ].includes(activeTool)
    const showFill = ["rectangle", "ellipse"].includes(activeTool)
    const showWeight = [
        "line",
        "brush",
        "rectangle",
        "ellipse",
        "arrow",
    ].includes(activeTool)

    return (
        <TooltipProvider delayDuration={200}>
            <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md px-3 flex items-center justify-between gap-3 shrink-0 select-none z-30">
                {/* Brand & Home */}
                <div className="flex items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onHome}
                                className="h-8 px-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                            >
                                <LuHouse className="h-4 w-4" />
                                <span className="font-semibold hidden sm:inline">
                                    New Canvas
                                </span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            Return to Welcome Screen
                        </TooltipContent>
                    </Tooltip>

                    <div className="flex items-center gap-2 pl-1 border-l border-border/60">
                        <img
                            src="/logo.svg"
                            alt="ImageClipboard"
                            className="h-5 w-5 object-contain"
                        />
                        <span className="font-heading font-extrabold text-sm tracking-tight bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                            ImageClipboard
                        </span>
                        <span className="text-[10px] font-mono font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/40 hidden md:inline">
                            by Marcuth
                        </span>
                    </div>
                </div>

                {/* Central Tools Ribbon */}
                <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/50">
                    {TOOLS.map((t) => {
                        const Icon = t.icon
                        const isSelected = activeTool === t.id
                        return (
                            <Tooltip key={t.id}>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={() => onSelectTool(t.id)}
                                        className={`h-8 w-8 rounded flex items-center justify-center transition-all cursor-pointer relative ${
                                            isSelected
                                                ? "bg-primary text-primary-foreground shadow-sm font-semibold scale-105"
                                                : "text-muted-foreground hover:text-foreground hover:bg-accent/80"
                                        }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="bottom"
                                    className="text-xs font-medium"
                                >
                                    <span>{t.label}</span>
                                    <span className="ml-1.5 font-mono text-[10px] opacity-75 bg-muted/50 px-1 py-0.2 rounded border border-border/40">
                                        {t.shortcut}
                                    </span>
                                </TooltipContent>
                            </Tooltip>
                        )
                    })}
                </div>

                {/* Contextual Tool Properties & Actions */}
                <div className="flex items-center gap-2">
                    {/* Tool specific options */}
                    {showStroke && (
                        <ColorPopover
                            label="Stroke Color"
                            color={settings.strokeColor}
                            onChange={(strokeColor) =>
                                onUpdateSettings({ strokeColor })
                            }
                            onPickFromScreen={() => onSelectTool("eyedropper")}
                        />
                    )}

                    {showFill && (
                        <ColorPopover
                            label="Fill Color"
                            color={settings.fillColor}
                            onChange={(fillColor) =>
                                onUpdateSettings({ fillColor })
                            }
                            allowTransparent
                        />
                    )}

                    {showWeight && (
                        <WeightPopover
                            weight={settings.strokeWidth}
                            color={settings.strokeColor}
                            onChange={(strokeWidth) =>
                                onUpdateSettings({ strokeWidth })
                            }
                        />
                    )}

                    {/* Rect rounded toggle */}
                    {activeTool === "rectangle" && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-border bg-card/60 text-xs">
                            <span className="text-[11px] text-muted-foreground font-medium">
                                Rounded
                            </span>
                            <Switch
                                checked={settings.rectRounded}
                                onCheckedChange={(rectRounded) =>
                                    onUpdateSettings({ rectRounded })
                                }
                                className="scale-75"
                            />
                        </div>
                    )}

                    {/* Brush smoothing toggle */}
                    {activeTool === "brush" && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-border bg-card/60 text-xs">
                            <span className="text-[11px] text-muted-foreground font-medium">
                                Smooth
                            </span>
                            <Switch
                                checked={settings.brushSmoothing}
                                onCheckedChange={(brushSmoothing) =>
                                    onUpdateSettings({ brushSmoothing })
                                }
                                className="scale-75"
                            />
                        </div>
                    )}

                    {/* Focus options */}
                    {activeTool === "focus" && (
                        <div className="flex items-center gap-2 px-2 py-1 rounded border border-border bg-card/60 text-xs">
                            <label className="flex items-center gap-1 text-[11px] text-muted-foreground cursor-pointer">
                                <span>Blur BG</span>
                                <Switch
                                    checked={settings.focusBlurUnfocused}
                                    onCheckedChange={(focusBlurUnfocused) =>
                                        onUpdateSettings({ focusBlurUnfocused })
                                    }
                                    className="scale-75"
                                />
                            </label>
                            <label className="flex items-center gap-1 text-[11px] text-muted-foreground cursor-pointer border-l border-border pl-2">
                                <span>Round</span>
                                <Switch
                                    checked={settings.focusRounded}
                                    onCheckedChange={(focusRounded) =>
                                        onUpdateSettings({ focusRounded })
                                    }
                                    className="scale-75"
                                />
                            </label>
                        </div>
                    )}

                    {/* Blur options */}
                    {activeTool === "blur" && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-border bg-card/60 text-xs">
                            <span className="text-[11px] text-muted-foreground font-medium">
                                Round
                            </span>
                            <Switch
                                checked={settings.blurRounded}
                                onCheckedChange={(blurRounded) =>
                                    onUpdateSettings({ blurRounded })
                                }
                                className="scale-75"
                            />
                        </div>
                    )}

                    <Separator orientation="vertical" className="h-6 mx-1" />

                    {/* Copy to Clipboard */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onCopyToClipboard}
                                className="h-8 px-2.5 gap-1.5 text-xs font-semibold"
                            >
                                <LuCopy className="h-3.5 w-3.5 text-primary" />
                                <span className="hidden lg:inline">Copy</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            Copy Image to Clipboard (Ctrl+C)
                        </TooltipContent>
                    </Tooltip>

                    {/* Save Dialog */}
                    <SaveDialog
                        canvasRef={canvasRef}
                        open={saveDialogOpen}
                        onOpenChange={setSaveDialogOpen}
                    />

                    {/* Theme Toggle */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onToggleDark}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                                {isDark ? (
                                    <LuSun className="h-4 w-4" />
                                ) : (
                                    <LuMoon className="h-4 w-4" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Toggle Theme</TooltipContent>
                    </Tooltip>
                </div>
            </header>
        </TooltipProvider>
    )
}
