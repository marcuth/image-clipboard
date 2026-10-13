export type ToolType =
    | "select"
    | "crop"
    | "line"
    | "brush"
    | "rectangle"
    | "ellipse"
    | "focus"
    | "blur"
    | "arrow"
    | "text"
    | "eyedropper"

export interface Point {
    x: number
    y: number
}

export interface Rect {
    x: number
    y: number
    width: number
    height: number
}

export interface ToolSettings {
    strokeColor: string
    fillColor: string
    strokeWidth: number
    rectRounded: boolean
    brushSmoothing: boolean
    focusBlurUnfocused: boolean
    focusRounded: boolean
    blurRounded: boolean
    blurIntensity: number
    fontSize: number
}

export interface CanvasDimensions {
    width: number
    height: number
}

export type ExportFormat = "png" | "jpeg" | "webp"

export interface ExportSettings {
    format: ExportFormat
    quality: number
    filename: string
}

export interface CatboxUploadResult {
    url: string
}
