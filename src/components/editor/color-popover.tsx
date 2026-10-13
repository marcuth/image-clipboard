import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { LuCheck, LuPipette } from "react-icons/lu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

const PRESET_COLORS = [
    "#000000",
    "#ffffff",
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#10b981",
    "#06b6d4",
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#d946ef",
    "#ec4899",
    "#64748b",
    "#334155",
]

interface ColorPopoverProps {
    label: string
    color: string
    onChange: (color: string) => void
    allowTransparent?: boolean
    onPickFromScreen?: () => void
}

export function ColorPopover({
    label,
    color,
    onChange,
    allowTransparent = false,
    onPickFromScreen,
}: ColorPopoverProps) {
    const [hexInput, setHexInput] = useState(color)

    const isTransparent = color === "transparent"

    function handleHexChange(value: string) {
        setHexInput(value)
        if (/^#([0-9A-F]{3}){1,2}$/i.test(value)) {
            onChange(value)
        }
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="flex items-center gap-2 rounded-md border border-border bg-card/60 px-2 py-1 text-xs hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                    title={label}
                >
                    <span
                        className="h-4 w-4 rounded border border-border shadow-inner"
                        style={{
                            background: isTransparent
                                ? "repeating-conic-gradient(#808080 0% 25%, #ffffff 0% 50%) 50% / 8px 8px"
                                : color,
                        }}
                    />
                    <span className="font-mono text-[11px] uppercase">
                        {isTransparent ? "None" : color}
                    </span>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3 space-y-3" align="start">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span>{label}</span>
                    {onPickFromScreen && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-xs gap-1"
                            onClick={onPickFromScreen}
                            title="Eyedropper"
                        >
                            <LuPipette className="h-3.5 w-3.5" />
                            <span>Pick</span>
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                    {allowTransparent && (
                        <button
                            type="button"
                            onClick={() => {
                                onChange("transparent")
                                setHexInput("transparent")
                            }}
                            className={`h-6 w-6 rounded border border-border relative flex items-center justify-center cursor-pointer transition-transform hover:scale-110 ${
                                isTransparent ? "ring-2 ring-primary" : ""
                            }`}
                            style={{
                                background:
                                    "repeating-conic-gradient(#999 0% 25%, #fff 0% 50%) 50% / 6px 6px",
                            }}
                            title="Transparent"
                        >
                            <span className="text-[10px] font-bold text-destructive">
                                ✕
                            </span>
                        </button>
                    )}

                    {PRESET_COLORS.map((preset) => {
                        const isSelected =
                            color.toLowerCase() === preset.toLowerCase()
                        return (
                            <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                    onChange(preset)
                                    setHexInput(preset)
                                }}
                                className={`h-6 w-6 rounded border border-border flex items-center justify-center cursor-pointer transition-transform hover:scale-110 ${
                                    isSelected ? "ring-2 ring-primary" : ""
                                }`}
                                style={{ backgroundColor: preset }}
                                title={preset}
                            >
                                {isSelected && (
                                    <LuCheck
                                        className={`h-3 w-3 ${
                                            preset === "#ffffff"
                                                ? "text-black"
                                                : "text-white"
                                        }`}
                                    />
                                )}
                            </button>
                        )
                    })}
                </div>

                <div className="flex items-center gap-2">
                    <Input
                        value={hexInput}
                        onChange={(e) => handleHexChange(e.target.value)}
                        placeholder="#000000"
                        className="h-7 text-xs font-mono uppercase"
                    />
                    <input
                        type="color"
                        value={isTransparent ? "#000000" : color}
                        onChange={(e) => {
                            onChange(e.target.value)
                            setHexInput(e.target.value)
                        }}
                        className="h-7 w-8 rounded border border-border p-0.5 cursor-pointer bg-transparent"
                    />
                </div>
            </PopoverContent>
        </Popover>
    )
}
