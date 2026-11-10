import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    LuCheck,
    LuCopy,
    LuDownload,
    LuExternalLink,
    LuLoader,
    LuShare2,
    LuUpload,
} from "react-icons/lu"
import {
    downloadCanvas,
    uploadToCatbox,
    uploadToImgbb,
} from "@/services/image-service"
import { ExportFormat, ExportSettings } from "@/types/canvas"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { toast } from "sonner"

type Host = "catbox" | "imgbb"

const HOST_LABELS: Record<Host, string> = {
    catbox: "Catbox",
    imgbb: "ImgBB",
}

interface SaveDialogProps {
    canvasRef: React.RefObject<HTMLCanvasElement | null>
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function SaveDialog({ canvasRef, open, onOpenChange }: SaveDialogProps) {
    const [settings, setSettings] = useState<ExportSettings>({
        format: "png",
        quality: 90,
        filename: "screenshot",
    })
    const [isUploading, setIsUploading] = useState<Host | null>(null)
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
    const [uploadedHost, setUploadedHost] = useState<Host>("catbox")
    const [imgbbKey, setImgbbKey] = useState(
        () => localStorage.getItem("imgbb-api-key") ?? "",
    )
    const [copied, setCopied] = useState(false)

    function handleDownload() {
        if (!canvasRef.current) return
        try {
            downloadCanvas(canvasRef.current, settings)
            toast.success("Image downloaded successfully!")
            onOpenChange(false)
        } catch {
            toast.error("Failed to download image.")
        }
    }

    async function handleUpload(host: Host) {
        if (!canvasRef.current) return
        if (host === "imgbb" && !imgbbKey.trim()) {
            toast.error("Enter your ImgBB API key first.")
            return
        }
        setIsUploading(host)
        try {
            const url =
                host === "catbox"
                    ? await uploadToCatbox(canvasRef.current, settings.filename)
                    : await uploadToImgbb(
                          canvasRef.current,
                          imgbbKey.trim(),
                          settings.filename,
                      )
            if (host === "imgbb") {
                localStorage.setItem("imgbb-api-key", imgbbKey.trim())
            }
            setUploadedUrl(url)
            setUploadedHost(host)
            toast.success(`Uploaded to ${HOST_LABELS[host]} successfully!`)
        } catch (error) {
            const message =
                typeof error === "string"
                    ? error
                    : error instanceof Error
                      ? error.message
                      : "Failed to upload"
            toast.error(`${HOST_LABELS[host]} error: ${message}`)
        } finally {
            setIsUploading(null)
        }
    }

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text)
        setCopied(true)
        toast.success("Link copied to clipboard!")
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button variant="default" size="sm" className="gap-1.5 h-8">
                    <LuDownload className="h-4 w-4" />
                    <span>Save & Share</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[460px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <LuShare2 className="h-5 w-5 text-primary" />
                        Export & Share Image
                    </DialogTitle>
                    <DialogDescription>
                        Save the image to your computer or upload it to Catbox
                        or ImgBB.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="filename"
                            className="text-xs font-semibold"
                        >
                            Filename
                        </Label>
                        <Input
                            id="filename"
                            value={settings.filename}
                            onChange={(e) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    filename: e.target.value,
                                }))
                            }
                            placeholder="screenshot"
                            className="h-8 text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold">
                            Image Format
                        </Label>
                        <div className="grid grid-cols-3 gap-2">
                            {(["png", "jpeg", "webp"] as ExportFormat[]).map(
                                (fmt) => (
                                    <Button
                                        key={fmt}
                                        type="button"
                                        variant={
                                            settings.format === fmt
                                                ? "default"
                                                : "outline"
                                        }
                                        size="sm"
                                        onClick={() =>
                                            setSettings((prev) => ({
                                                ...prev,
                                                format: fmt,
                                            }))
                                        }
                                        className="uppercase font-mono text-xs h-8"
                                    >
                                        {fmt === "jpeg" ? "JPG" : fmt}
                                    </Button>
                                ),
                            )}
                        </div>
                    </div>

                    {settings.format !== "png" && (
                        <div className="space-y-2 rounded-lg border border-border p-3 bg-muted/20">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-muted-foreground">
                                    Quality
                                </span>
                                <span className="font-mono font-bold">
                                    {settings.quality}%
                                </span>
                            </div>
                            <Slider
                                value={[settings.quality]}
                                min={10}
                                max={100}
                                step={5}
                                onValueChange={(val) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        quality: val[0],
                                    }))
                                }
                            />
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label
                            htmlFor="imgbb-key"
                            className="text-xs font-semibold"
                        >
                            ImgBB API Key
                        </Label>
                        <Input
                            id="imgbb-key"
                            type="password"
                            value={imgbbKey}
                            onChange={(e) => setImgbbKey(e.target.value)}
                            placeholder="Only needed for ImgBB (api.imgbb.com)"
                            className="h-8 text-sm"
                        />
                    </div>

                    {uploadedUrl && (
                        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2.5">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                                <LuCheck className="h-4 w-4" />
                                <span>
                                    Uploaded to {HOST_LABELS[uploadedHost]}!
                                </span>
                            </div>

                            <div className="space-y-2">
                                <div className="space-y-1">
                                    <span className="text-[11px] font-medium text-muted-foreground">
                                        Direct Link
                                    </span>
                                    <div className="flex gap-1.5">
                                        <Input
                                            readOnly
                                            value={uploadedUrl}
                                            className="h-7 text-xs font-mono select-all"
                                        />
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 px-2"
                                            onClick={() =>
                                                copyToClipboard(uploadedUrl)
                                            }
                                        >
                                            {copied ? (
                                                <LuCheck className="h-3.5 w-3.5 text-green-500" />
                                            ) : (
                                                <LuCopy className="h-3.5 w-3.5" />
                                            )}
                                        </Button>
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 px-2"
                                        >
                                            <a
                                                href={uploadedUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <LuExternalLink className="h-3.5 w-3.5" />
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                    {(["catbox", "imgbb"] as Host[]).map((host) => (
                        <Button
                            key={host}
                            type="button"
                            variant="secondary"
                            onClick={() => handleUpload(host)}
                            disabled={isUploading !== null}
                            className="w-full sm:w-auto gap-1.5 h-9"
                        >
                            {isUploading === host ? (
                                <LuLoader className="h-4 w-4 animate-spin" />
                            ) : (
                                <LuUpload className="h-4 w-4" />
                            )}
                            <span>{HOST_LABELS[host]}</span>
                        </Button>
                    ))}

                    <Button
                        type="button"
                        onClick={handleDownload}
                        className="w-full sm:w-auto gap-1.5 h-9"
                    >
                        <LuDownload className="h-4 w-4" />
                        <span>Download Image</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
