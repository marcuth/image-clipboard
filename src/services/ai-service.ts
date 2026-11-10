import {
    loadImageFromBlob,
    loadImageFromDataUrl,
} from "@/services/image-service"
import { removeBackground } from "@imgly/background-removal"
import { invoke } from "@tauri-apps/api/core"

export type BigjpgStyle = "art" | "photo"

export interface BigjpgOptions {
    scale: 2
    style: BigjpgStyle
    noise: -1 | 0 | 1 | 2 | 3
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) =>
                blob
                    ? resolve(blob)
                    : reject(new Error("Failed to read canvas")),
            "image/png",
        )
    })
}

export async function removeCanvasBackground(
    canvas: HTMLCanvasElement,
): Promise<HTMLImageElement> {
    const result = await removeBackground(await canvasToBlob(canvas), {
        output: { format: "image/png" },
    })
    return loadImageFromBlob(result)
}

export async function enlargeWithBigjpg(
    canvas: HTMLCanvasElement,
    options: BigjpgOptions,
): Promise<HTMLImageElement> {
    const dataUrl = await invoke<string>("bigjpg_enlarge", {
        base64Data: canvas.toDataURL("image/png"),
        filename: "image.png",
        scale: options.scale,
        style: options.style,
        noise: options.noise,
    })
    return loadImageFromDataUrl(dataUrl)
}
