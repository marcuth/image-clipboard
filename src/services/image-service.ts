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

export async function uploadToCatbox(
    canvas: HTMLCanvasElement,
    filename: string = "screenshot.png",
): Promise<string> {
    const dataUrl = canvas.toDataURL("image/png")
    let safeName = filename.trim()
    if (!safeName.toLowerCase().endsWith(".png")) {
        safeName = `${safeName}.png`
    }

    // 1. Try Tauri native backend command (no CORS restrictions)
    try {
        const url = await invoke<string>("upload_to_catbox", {
            base64Data: dataUrl,
            filename: safeName,
        })
        if (url && url.startsWith("http")) {
            return url
        }
    } catch {
        // Fallback to browser fetch if running in pure web mode
    }

    // 2. Browser fallback via standard FormData
    const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/png")
    })

    if (!blob) throw new Error("Failed to export image data")

    const formData = new FormData()
    formData.append("reqtype", "fileupload")
    formData.append("fileToUpload", blob, safeName)

    const response = await fetch("https://catbox.moe/user/api.php", {
        method: "POST",
        body: formData,
    })

    if (!response.ok) {
        throw new Error(`Catbox upload failed with status ${response.status}`)
    }

    const resultUrl = (await response.text()).trim()
    if (!resultUrl.startsWith("http")) {
        throw new Error(resultUrl || "Catbox upload failed")
    }

    return resultUrl
}
