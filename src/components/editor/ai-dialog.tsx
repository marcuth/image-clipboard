import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    BigjpgOptions,
    enlargeWithBigjpg,
    removeCanvasBackground,
} from "@/services/ai-service"
import { LuEraser, LuLoader, LuMaximize, LuSparkles } from "react-icons/lu"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { toast } from "sonner"

interface AiDialogProps {
    canvasRef: React.RefObject<HTMLCanvasElement | null>
    onReplaceImage: (img: HTMLImageElement) => void
}

type Busy = "background" | "enlarge" | null

const NOISES: { value: BigjpgOptions["noise"]; label: string }[] = [
    { value: -1, label: "None" },
    { value: 0, label: "Low" },
    { value: 1, label: "Medium" },
    { value: 2, label: "High" },
    { value: 3, label: "Highest" },
]

interface ChoiceProps<T extends string | number> {
    value: T
    current: T
    onSelect: (value: T) => void
    children: React.ReactNode
}

function Choice<T extends string | number>({
    value,
    current,
    onSelect,
    children,
}: ChoiceProps<T>) {
    return (
        <Button
            type="button"
            size="sm"
            variant={current === value ? "default" : "outline"}
            onClick={() => onSelect(value)}
            className="h-8 text-xs flex-1"
        >
            {children}
        </Button>
    )
}

function errorMessage(error: unknown): string {
    if (typeof error === "string") return error
    if (error instanceof Error) return error.message
    return "Unknown error"
}

export function AiDialog({ canvasRef, onReplaceImage }: AiDialogProps) {
    const [open, setOpen] = useState(false)
    const [busy, setBusy] = useState<Busy>(null)
    const [options, setOptions] = useState<BigjpgOptions>({
        scale: 2,
        style: "art",
        noise: 0,
    })

    async function run(kind: Exclude<Busy, null>): Promise<void> {
        const canvas = canvasRef.current
        if (!canvas) return
        setBusy(kind)
        try {
            const img =
                kind === "background"
                    ? await removeCanvasBackground(canvas)
                    : await enlargeWithBigjpg(canvas, options)
            onReplaceImage(img)
            toast.success(
                kind === "background"
                    ? "Background removed!"
                    : `Image enlarged to ${img.naturalWidth} × ${img.naturalHeight} px`,
            )
            setOpen(false)
        } catch (error) {
            const label =
                kind === "background" ? "Background removal" : "Bigjpg"
            toast.error(`${label} error: ${errorMessage(error)}`)
        } finally {
            setBusy(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 gap-1.5 text-xs font-semibold"
                >
                    <LuSparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="hidden lg:inline">AI</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[460px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <LuSparkles className="h-5 w-5 text-primary" />
                        AI Tools
                    </DialogTitle>
                    <DialogDescription>
                        Results replace the current canvas and can be undone.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="rounded-lg border border-border p-3 space-y-2">
                        <div className="text-xs font-semibold">
                            Remove background
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            Runs locally on your device. The model is downloaded
                            once on first use.
                        </p>
                        <Button
                            type="button"
                            size="sm"
                            disabled={busy !== null}
                            onClick={() => run("background")}
                            className="w-full gap-1.5 h-9"
                        >
                            {busy === "background" ? (
                                <LuLoader className="h-4 w-4 animate-spin" />
                            ) : (
                                <LuEraser className="h-4 w-4" />
                            )}
                            <span>
                                {busy === "background"
                                    ? "Processing..."
                                    : "Remove background"}
                            </span>
                        </Button>
                    </div>

                    <div className="rounded-lg border border-border p-3 space-y-3">
                        <div className="text-xs font-semibold">
                            Enlarge with Bigjpg
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            Doubles the image size (2x, the only scale available
                            without a Bigjpg account). Uploads to bigjpg.com and
                            may take a few minutes.
                        </p>

                        <div className="space-y-1.5">
                            <Label className="text-[11px]">Style</Label>
                            <div className="flex gap-1.5">
                                <Choice
                                    value="art"
                                    current={options.style}
                                    onSelect={(style) =>
                                        setOptions((o) => ({ ...o, style }))
                                    }
                                >
                                    Art / Illustration
                                </Choice>
                                <Choice
                                    value="photo"
                                    current={options.style}
                                    onSelect={(style) =>
                                        setOptions((o) => ({ ...o, style }))
                                    }
                                >
                                    Photo
                                </Choice>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px]">
                                Noise reduction
                            </Label>
                            <div className="flex gap-1.5">
                                {NOISES.map((n) => (
                                    <Choice
                                        key={n.value}
                                        value={n.value}
                                        current={options.noise}
                                        onSelect={(noise) =>
                                            setOptions((o) => ({ ...o, noise }))
                                        }
                                    >
                                        {n.label}
                                    </Choice>
                                ))}
                            </div>
                        </div>

                        <Button
                            type="button"
                            size="sm"
                            disabled={busy !== null}
                            onClick={() => run("enlarge")}
                            className="w-full gap-1.5 h-9"
                        >
                            {busy === "enlarge" ? (
                                <LuLoader className="h-4 w-4 animate-spin" />
                            ) : (
                                <LuMaximize className="h-4 w-4" />
                            )}
                            <span>
                                {busy === "enlarge"
                                    ? "Enlarging..."
                                    : "Enlarge image"}
                            </span>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
