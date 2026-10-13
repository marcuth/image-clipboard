import {
    LuClipboard,
    LuFileImage,
    LuFileUp,
    LuGithub,
    LuMoon,
    LuPlus,
    LuSun,
} from "react-icons/lu"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    loadImageFromBlob,
    readImageFromClipboard,
} from "@/services/image-service"
import { Typography } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRef, useState } from "react"
import { toast } from "sonner"

interface WelcomeScreenProps {
    onCreateCanvas: (
        width: number,
        height: number,
        backgroundColor: string,
    ) => void
    onLoadImage: (image: HTMLImageElement) => void
    isDark: boolean
    onToggleDark: () => void
}

const PRESET_SIZES = [
    { label: "1920 × 1080 (FHD)", width: 1920, height: 1080 },
    { label: "1280 × 720 (HD)", width: 1280, height: 720 },
    { label: "1024 × 768 (XGA)", width: 1024, height: 768 },
    { label: "1024 × 1024 (1:1)", width: 1024, height: 1024 },
    { label: "2048 × 2048 (2K)", width: 2048, height: 2048 },
]

const BG_COLOR_PRESETS = [
    { label: "White", value: "#ffffff" },
    { label: "Black", value: "#000000" },
    { label: "Slate", value: "#1e293b" },
    { label: "Zinc", value: "#18181b" },
    { label: "Transparent", value: "transparent" },
]

export function WelcomeScreen({
    onCreateCanvas,
    onLoadImage,
    isDark,
    onToggleDark,
}: WelcomeScreenProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const [canvasWidth, setCanvasWidth] = useState<number>(1920)
    const [canvasHeight, setCanvasHeight] = useState<number>(1080)
    const [bgColor, setBgColor] = useState<string>("#ffffff")
    const [isDragging, setIsDragging] = useState(false)

    async function handlePasteFromClipboard() {
        try {
            const img = await readImageFromClipboard()
            if (img) {
                onLoadImage(img)
                toast.success("Image loaded from clipboard!")
            } else {
                toast.error(
                    "No image found in clipboard. Use Ctrl+V or copy an image first.",
                )
            }
        } catch {
            toast.error("Could not access clipboard.")
        }
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            toast.error("Please select a valid image file (PNG, JPG, WEBP).")
            return
        }

        loadImageFromBlob(file)
            .then((img) => {
                onLoadImage(img)
                toast.success(`Loaded "${file.name}"`)
            })
            .catch(() => {
                toast.error("Failed to load selected image.")
            })
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault()
        setIsDragging(false)

        const file = e.dataTransfer.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            toast.error("Please drop an image file (PNG, JPG, WEBP).")
            return
        }

        loadImageFromBlob(file)
            .then((img) => {
                onLoadImage(img)
                toast.success(`Loaded "${file.name}"`)
            })
            .catch(() => {
                toast.error("Failed to load dropped image.")
            })
    }

    function handleCreateBlankCanvas() {
        const w = Math.max(10, Math.min(10000, canvasWidth || 1920))
        const h = Math.max(10, Math.min(10000, canvasHeight || 1080))
        onCreateCanvas(w, h, bgColor)
    }

    return (
        <div
            onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className="min-h-screen w-full flex flex-col justify-between bg-background text-foreground transition-colors"
        >
            {/* Top Bar */}
            <header className="px-6 py-4 flex items-center justify-between border-b border-border/40 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <img
                        src="/logo.svg"
                        alt="ImageClipboard Logo"
                        className="h-9 w-9 object-contain"
                    />
                    <div>
                        <div className="flex items-center gap-2">
                            <Typography.Large className="text-base tracking-tight font-heading font-extrabold">
                                ImageClipboard
                            </Typography.Large>
                            <Badge
                                variant="secondary"
                                className="text-[10px] py-0 px-1.5 font-mono"
                            >
                                v0.1.0 • MIT{" "}
                            </Badge>
                        </div>
                        <Typography.Muted className="text-xs">
                            Fast & simple tool for screenshots and drawing
                        </Typography.Muted>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={onToggleDark}
                        title="Toggle theme"
                    >
                        {isDark ? (
                            <LuSun className="h-4 w-4" />
                        ) : (
                            <LuMoon className="h-4 w-4" />
                        )}
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="h-8 text-xs gap-1.5 hidden sm:inline-flex"
                    >
                        <a
                            href="https://github.com/marcuth/image-clipboard"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <LuGithub className="h-3.5 w-3.5" />
                            <span>GitHub</span>
                        </a>
                    </Button>
                </div>
            </header>

            {/* Main Content: 3 Column Start Options */}
            <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-10 max-w-6xl mx-auto w-full">
                <div className="text-center mb-8 max-w-xl space-y-2">
                    <Typography.H1 className="text-3xl md:text-4xl font-extrabold tracking-tight font-heading bg-gradient-to-br from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
                        Capture, Annotate, Share.
                    </Typography.H1>
                    <Typography.Lead className="text-sm md:text-base text-muted-foreground">
                        Powerful desktop screenshot annotation and drawing suite
                        with desktop speed and shadcn/ui elegance.
                    </Typography.Lead>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                    {/* Column 1: Start From Scratch */}
                    <Card className="flex flex-col border-border/80 bg-card/60 backdrop-blur-sm hover:border-primary/50 transition-all shadow-sm">
                        <CardHeader>
                            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-1">
                                <LuPlus className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg font-heading">
                                Start From Scratch
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Create a blank canvas to draw and design
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-muted-foreground">
                                        Canvas Dimensions
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            value={canvasWidth}
                                            onChange={(e) =>
                                                setCanvasWidth(
                                                    parseInt(e.target.value) ||
                                                        10,
                                                )
                                            }
                                            className="h-8 text-xs font-mono"
                                            placeholder="Width"
                                        />
                                        <span className="text-xs text-muted-foreground font-mono">
                                            ×
                                        </span>
                                        <Input
                                            type="number"
                                            value={canvasHeight}
                                            onChange={(e) =>
                                                setCanvasHeight(
                                                    parseInt(e.target.value) ||
                                                        10,
                                                )
                                            }
                                            className="h-8 text-xs font-mono"
                                            placeholder="Height"
                                        />
                                    </div>
                                </div>

                                {/* Preset Sizes */}
                                <div className="space-y-1">
                                    <Label className="text-[11px] text-muted-foreground">
                                        Popular Presets
                                    </Label>
                                    <div className="flex flex-wrap gap-1">
                                        {PRESET_SIZES.map((preset) => (
                                            <button
                                                key={preset.label}
                                                type="button"
                                                onClick={() => {
                                                    setCanvasWidth(preset.width)
                                                    setCanvasHeight(
                                                        preset.height,
                                                    )
                                                }}
                                                className={`text-[11px] px-2 py-0.5 rounded border border-border/60 font-mono transition-colors cursor-pointer ${
                                                    canvasWidth ===
                                                        preset.width &&
                                                    canvasHeight ===
                                                        preset.height
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "bg-muted/40 hover:bg-muted text-muted-foreground"
                                                }`}
                                            >
                                                {preset.width}x{preset.height}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Background Color */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-muted-foreground">
                                        Background Color
                                    </Label>
                                    <div className="flex items-center gap-1.5">
                                        {BG_COLOR_PRESETS.map((p) => {
                                            const isSelected =
                                                bgColor === p.value
                                            return (
                                                <button
                                                    key={p.label}
                                                    type="button"
                                                    onClick={() =>
                                                        setBgColor(p.value)
                                                    }
                                                    className={`h-6 w-6 rounded border border-border transition-all cursor-pointer ${
                                                        isSelected
                                                            ? "ring-2 ring-primary scale-110"
                                                            : "hover:scale-105"
                                                    }`}
                                                    style={{
                                                        background:
                                                            p.value ===
                                                            "transparent"
                                                                ? "repeating-conic-gradient(#808080 0% 25%, #ffffff 0% 50%) 50% / 6px 6px"
                                                                : p.value,
                                                    }}
                                                    title={p.label}
                                                />
                                            )
                                        })}
                                        <input
                                            type="color"
                                            value={
                                                bgColor === "transparent"
                                                    ? "#ffffff"
                                                    : bgColor
                                            }
                                            onChange={(e) =>
                                                setBgColor(e.target.value)
                                            }
                                            className="h-6 w-7 rounded border border-border p-0.5 cursor-pointer bg-transparent"
                                            title="Custom color"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleCreateBlankCanvas}
                                className="w-full gap-2 mt-2 h-9 text-xs font-semibold"
                            >
                                <LuPlus className="h-4 w-4" />
                                <span>Create Canvas</span>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Column 2: Paste An Image */}
                    <Card className="flex flex-col border-border/80 bg-card/60 backdrop-blur-sm hover:border-primary/50 transition-all shadow-sm">
                        <CardHeader>
                            <div className="h-10 w-10 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center mb-1">
                                <LuClipboard className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg font-heading">
                                Paste An Image
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Paste screenshot or image data to start
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                            <div className="space-y-2.5">
                                <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
                                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                        Keyboard Shortcuts
                                    </span>

                                    <div className="flex items-center justify-between text-xs py-1 border-b border-border/40">
                                        <span className="text-muted-foreground">
                                            Full Screen
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className="font-mono text-[10px]"
                                        >
                                            PrtScn
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between text-xs py-1 border-b border-border/40">
                                        <span className="text-muted-foreground">
                                            Active Window
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className="font-mono text-[10px]"
                                        >
                                            Alt + PrtScn
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between text-xs py-1">
                                        <span className="text-muted-foreground font-medium text-foreground">
                                            Paste Anywhere
                                        </span>
                                        <Badge
                                            variant="secondary"
                                            className="font-mono text-[10px] font-bold bg-primary/10 text-primary border-primary/20"
                                        >
                                            Ctrl + V
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant="secondary"
                                onClick={handlePasteFromClipboard}
                                className="w-full gap-2 mt-2 h-9 text-xs font-semibold"
                            >
                                <LuClipboard className="h-4 w-4" />
                                <span>Paste from Clipboard</span>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Column 3: Drop An Image */}
                    <Card
                        className={`flex flex-col border-border/80 bg-card/60 backdrop-blur-sm hover:border-primary/50 transition-all shadow-sm ${
                            isDragging
                                ? "ring-2 ring-primary border-primary bg-primary/5"
                                : ""
                        }`}
                    >
                        <CardHeader>
                            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-1">
                                <LuFileImage className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg font-heading">
                                Drop An Image
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Drop image file from your computer
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="rounded-lg border-2 border-dashed border-border/80 p-5 flex flex-col items-center justify-center text-center gap-2 hover:border-primary hover:bg-muted/30 transition-all cursor-pointer flex-1"
                            >
                                <LuFileUp className="h-8 w-8 text-muted-foreground/80 animate-pulse" />
                                <div>
                                    <span className="text-xs font-semibold block">
                                        Click to browse or drop file
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">
                                        Supports PNG, JPG, WEBP, GIF, BMP
                                    </span>
                                </div>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full gap-2 mt-2 h-9 text-xs font-semibold"
                            >
                                <LuFileImage className="h-4 w-4" />
                                <span>Browse Image File</span>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </main>

            {/* Footer */}
            <footer className="px-6 py-3 border-t border-border/40 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <span>Designed & Developed by</span>
                    <a
                        href="https://marcuth.dev"
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-foreground hover:text-primary transition-colors underline underline-offset-2"
                    >
                        Marcuth
                    </a>
                    <span>• Open Source MIT</span>
                </div>

                <div className="flex items-center gap-4 text-[11px]">
                    <span>Tauri v2 Desktop</span>
                    <span>React 19</span>
                    <span>Tailwind CSS 4</span>
                </div>
            </footer>
        </div>
    )
}
