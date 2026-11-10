import { ExportSettings } from "@/types/canvas"
import { invoke } from "@tauri-apps/api/core"

export async function readImageFromClipboard(): Promise<HTMLImageElement | null> {
    try {
        if (!navigator.clipboard?.read) {
            return null
        }
        const items = await navigator.clipboard.read()
        for (const item of items) {
            const imageType = item.types.find((t) => t.startsWith("image/"))
            if (imageType) {
                const blob = await item.getType(imageType)
                return await loadImageFromBlob(blob)
            }
        }
    } catch {
        // Fallback or permission denied
    }
    return null
}

export function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob)
        const img = new Image()
        img.onload = () => {
            URL.revokeObjectURL(url)
            resolve(img)
        }
        img.onerror = (err) => {
            URL.revokeObjectURL(url)
            reject(err)
        }
        img.src = url
    })
}

export function loadImageFromDataUrl(
    dataUrl: string,
): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = (err) => reject(err)
        img.src = dataUrl
    })
}

export async function copyCanvasToClipboard(
    canvas: HTMLCanvasElement,
): Promise<boolean> {
    try {
        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((b) => resolve(b), "image/png")
        })

        if (!blob) return false

        const clipboardItem = new ClipboardItem({ "image/png": blob })
        await navigator.clipboard.write([clipboardItem])
        return true
    } catch {
        return false
    }
}

export function downloadCanvas(
    canvas: HTMLCanvasElement,
    settings: ExportSettings,
): void {
    const mimeType =
        settings.format === "jpeg"
            ? "image/jpeg"
            : settings.format === "webp"
              ? "image/webp"
              : "image/png"

    const quality = settings.quality / 100
    const dataUrl = canvas.toDataURL(mimeType, quality)

    const extension = settings.format === "jpeg" ? "jpg" : settings.format

    let filename = settings.filename.trim()
    if (!filename.toLowerCase().endsWith(`.${extension}`)) {
        filename = `${filename}.${extension}`
    }

    const a = document.createElement("a")
    a.href = dataUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
}

function ensurePngName(filename: string): string {
    const name = filename.trim() || "screenshot"
    return name.toLowerCase().endsWith(".png") ? name : `${name}.png`
}

export async function uploadToCatbox(
    canvas: HTMLCanvasElement,
    filename: string = "screenshot.png",
): Promise<string> {
    return invoke<string>("upload_to_catbox", {
        base64Data: canvas.toDataURL("image/png"),
        filename: ensurePngName(filename),
    })
}

export async function uploadToImgbb(
    canvas: HTMLCanvasElement,
    apiKey: string,
    filename: string = "screenshot.png",
): Promise<string> {
    return invoke<string>("upload_to_imgbb", {
        base64Data: canvas.toDataURL("image/png"),
        filename: ensurePngName(filename),
        apiKey,
    })
}
