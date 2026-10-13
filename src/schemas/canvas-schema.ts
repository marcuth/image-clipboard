import { z } from "zod"

export const canvasSizeSchema = z.object({
    width: z
        .number({ error: "Width must be a number" })
        .int("Width must be an integer")
        .min(10, "Width must be at least 10px")
        .max(10000, "Width must not exceed 10000px"),
    height: z
        .number({ error: "Height must be a number" })
        .int("Height must be an integer")
        .min(10, "Height must be at least 10px")
        .max(10000, "Height must not exceed 10000px"),
    backgroundColor: z.string().default("#ffffff"),
})

export type CanvasSizeFormValues = z.infer<typeof canvasSizeSchema>

export const exportSettingsSchema = z.object({
    format: z.enum(["png", "jpeg", "webp"]),
    quality: z.number().min(10).max(100),
    filename: z.string().min(1, "Filename cannot be empty"),
})

export type ExportSettingsFormValues = z.infer<typeof exportSettingsSchema>
