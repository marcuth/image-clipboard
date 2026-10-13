import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"

interface WeightPopoverProps {
    weight: number
    color: string
    onChange: (weight: number) => void
}

export function WeightPopover({ weight, color, onChange }: WeightPopoverProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="flex items-center gap-2 rounded-md border border-border bg-card/60 px-2.5 py-1 text-xs hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                    title="Stroke Weight"
                >
                    <span className="text-muted-foreground font-medium">
                        Size:
                    </span>
                    <span className="font-mono font-semibold">{weight}px</span>
                    <div className="w-8 flex items-center justify-center">
                        <div
                            className="w-full rounded-full bg-foreground transition-all"
                            style={{
                                height: `${Math.min(10, Math.max(1, weight / 2))}px`,
                                backgroundColor:
                                    color === "transparent" ? "#fff" : color,
                            }}
                        />
                    </div>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 space-y-3" align="start">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span>Stroke Width</span>
                    <span className="font-mono font-bold text-foreground">
                        {weight}px
                    </span>
                </div>

                <Slider
                    value={[weight]}
                    min={1}
                    max={48}
                    step={1}
                    onValueChange={(val) => onChange(val[0])}
                    className="cursor-pointer"
                />

                <div className="h-12 w-full rounded border border-border/50 bg-muted/40 flex items-center justify-center px-4">
                    <div
                        className="w-full rounded-full"
                        style={{
                            height: `${weight}px`,
                            backgroundColor:
                                color === "transparent" ? "#64748b" : color,
                        }}
                    />
                </div>
            </PopoverContent>
        </Popover>
    )
}
